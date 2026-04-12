// ================================================
// @ai-spec
// @module    api/gemini
// @purpose   Vercel Serverless Function — Google Gemini API へのCORSプロキシ
// @depends   なし（Node.js built-in のみ）
// @consumers js/gemini.js (ブラウザから /api/gemini にPOST)
// @constraints
//   - APIキーはクエリパラメータ(?key=xxx)で受け取る
//   - モデル名はクエリパラメータ(?model=xxx)で受け取る
// @dataflow  ブラウザ → /api/gemini?model=xxx&key=yyy → Google API → ブラウザ
// @updated   2026-04-12
// ================================================

export default async function handler(req, res) {
  // CORS ヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, key } = req.query;

    if (!key) {
      return res.status(400).json({ error: 'API key is required (?key=xxx)' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model name is required (?model=xxx)' });
    }

    // Google Gemini APIにリクエスト転送
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(500).json({ error: 'Proxy error', message: error.message });
  }
}
