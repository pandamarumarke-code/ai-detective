// ================================================
// @ai-spec
// @module    api/gemini
// @purpose   Vercel Edge Function — Google Gemini API へのストリーミングCORSプロキシ
// @depends   なし（Web標準APIのみ）
// @consumers js/gemini.js (ブラウザから /api/gemini にPOST)
// @constraints
//   - Edge Function: Vercel Hobbyプランでもタイムアウトしない（ストリーミング中は接続維持）
//   - BYOKモード: クエリパラメータ key= でクライアントのキーを受け取る
//   - 無料モード: key=FREE → 環境変数 GEMINI_API_KEY を使用
// @dataflow  ブラウザ → /api/gemini?model=xxx&key=yyy → Google API → ブラウザ
// @updated   2026-04-14
// ================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS ヘッダー
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // プリフライト
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const model = url.searchParams.get('model');
    let apiKey = url.searchParams.get('key');

    // 無料モード: key=FREE → サーバー環境変数を使用
    if (!apiKey || apiKey === 'FREE') {
      apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: '無料プレイ用のGemini APIキーが設定されていません' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Model name is required (?model=xxx)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Google Gemini APIにリクエスト転送
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = await req.json();

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // レスポンスをそのままストリーミング転送
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('Gemini proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
