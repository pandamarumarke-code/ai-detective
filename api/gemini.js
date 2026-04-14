// ================================================
// @ai-spec
// @module    api/gemini
// @purpose   Vercel Edge Function — Google Gemini API へのCORSプロキシ
// @depends   なし（Web標準API のみ）
// @consumers js/gemini.js (ブラウザから /api/gemini にPOST)
// @constraints
//   - Edge Runtime: 初回レスポンス25秒以内、ストリーミング最大300秒
//   - BYOKモード: クエリパラメータ key= でクライアントのキーを受け取る
//   - 無料モード: key=FREE → 環境変数 GEMINI_API_KEY を使用
// @dataflow  ブラウザ → /api/gemini?model=xxx&key=yyy → Google API → ブラウザ
// @updated   2026-04-14
// ================================================

export const config = {
  runtime: 'edge'
};

// CORSヘッダー共通定義
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
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
    const url = new URL(request.url);
    const model = url.searchParams.get('model');
    let apiKey = url.searchParams.get('key');

    // 無料モード: key=FREE → サーバー環境変数を使用
    if (!apiKey || apiKey === 'FREE') {
      apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: '無料プレイ用のGemini APIキーが設定されていません' }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Model name is required (?model=xxx)' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Google Gemini APIにリクエスト転送
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = await request.json();
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Gemini proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
