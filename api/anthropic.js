// ================================================
// @ai-spec
// @module    api/anthropic
// @purpose   Vercel Serverless Function — Anthropic Claude API へのストリーミングCORSプロキシ
// @depends   なし（Node.js built-in のみ）
// @consumers js/claude.js (ブラウザから /api/anthropic にPOST)
// @constraints
//   - maxDuration: 300s（Fluid Compute有効）
//   - ストリーミング: Anthropic SSE → Vercelプロキシ → クライアント へパイプ
//   - BYOKモード: クライアントのAPIキーをそのまま転送
//   - 無料モード: x-api-keyなし → 環境変数 ANTHROPIC_API_KEY を使用
//   - stream: true を強制してアイドルタイムアウトを回避
// @dataflow  ブラウザ → /api/anthropic → https://api.anthropic.com/v1/messages (SSE) → ブラウザ
// @updated   2026-04-14
// ================================================

export const config = {
  supportsResponseStreaming: true,
  maxDuration: 300
};

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-beta, x-free-mode, x-stream-mode');

  // プリフライト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // APIキー決定: クライアント提供 or サーバー環境変数（無料モード）
    let apiKey = req.headers['x-api-key'];
    const isFreeMode = !apiKey || req.headers['x-free-mode'] === 'true';

    if (isFreeMode) {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: '無料プレイ用のAPIキーが設定されていません' });
      }
    }

    // ストリーミングモードの判定
    const wantStream = req.headers['x-stream-mode'] === 'true';

    const requestBody = { ...req.body };
    if (wantStream) {
      requestBody.stream = true;
    }

    // Anthropic APIにリクエスト転送
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': req.headers['anthropic-version'] || '2023-06-01'
    };

    // Advisor Tool等のbetaヘッダーがあれば転送
    if (req.headers['anthropic-beta']) {
      headers['anthropic-beta'] = req.headers['anthropic-beta'];
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    // ストリーミングモード: SSEをそのままパイプ
    if (wantStream && response.ok && response.body) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
      } catch (streamErr) {
        console.error('Stream pipe error:', streamErr);
        // ストリーム中にエラーが起きた場合、エラーイベントを送信
        res.write(`event: error\ndata: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      }
      res.end();
      return;
    }

    // 非ストリーミングモード（フォールバック）: 従来通りJSON転送
    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
