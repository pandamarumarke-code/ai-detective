// ================================================
// @ai-spec
// @module    api/anthropic
// @purpose   Vercel Serverless Function — Anthropic Claude API へのCORSプロキシ
// @depends   なし（Node.js built-in のみ）
// @consumers js/claude.js (ブラウザから /api/anthropic にPOST)
// @constraints
//   - APIキーはリクエストヘッダーから受け取り、そのまま転送するだけ
//   - レスポンスボディはストリーミングせず、全体を受信してから返す
// @dataflow  ブラウザ → /api/anthropic → https://api.anthropic.com/v1/messages → ブラウザ
// @updated   2026-04-12
// ================================================

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version, anthropic-beta');

  // プリフライト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(400).json({ error: 'x-api-key header is required' });
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
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Anthropic proxy error:', error);
    return res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
