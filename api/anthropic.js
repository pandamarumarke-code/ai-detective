// ================================================
// @ai-spec
// @module    api/anthropic
// @purpose   Vercel Edge Function — Anthropic Claude API へのストリーミングCORSプロキシ
// @depends   なし（Web標準API のみ）
// @consumers js/claude.js (ブラウザから /api/anthropic にPOST)
// @constraints
//   - Edge Runtime: 初回レスポンス25秒以内、ストリーミング最大300秒
//   - ストリーミング: Anthropic SSE → Edge → クライアント へパイプ
//   - BYOKモード: クライアントのAPIキーをそのまま転送
//   - 無料モード: x-api-keyなし → 環境変数 ANTHROPIC_API_KEY を使用
//   - stream: true を強制してアイドルタイムアウトを回避
// @dataflow  ブラウザ → /api/anthropic → https://api.anthropic.com/v1/messages (SSE) → ブラウザ
// @updated   2026-04-14
// ================================================

export const config = {
  runtime: 'edge'
};

// CORSヘッダー共通定義
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta, x-free-mode, x-stream-mode'
};

export default async function handler(request) {
  // プリフライト
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  try {
    // APIキー決定: クライアント提供 or サーバー環境変数（無料モード）
    let apiKey = request.headers.get('x-api-key');
    const isFreeMode = !apiKey || request.headers.get('x-free-mode') === 'true';

    if (isFreeMode) {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: '無料プレイ用のAPIキーが設定されていません' }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ストリーミングモードの判定
    const wantStream = request.headers.get('x-stream-mode') === 'true';
    const requestBody = await request.json();
    if (wantStream) {
      requestBody.stream = true;
    }

    // Anthropic APIにリクエスト転送
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01'
    };

    // Advisor Tool等のbetaヘッダーがあれば転送
    const betaHeader = request.headers.get('anthropic-beta');
    if (betaHeader) {
      headers['anthropic-beta'] = betaHeader;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    // ストリーミングモード: SSEをそのままパイプ（Edge Runtimeのストリーミング = 最大300秒）
    if (wantStream && response.ok && response.body) {
      return new Response(response.body, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // 非ストリーミングモード（フォールバック）: 従来通りJSON転送
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
