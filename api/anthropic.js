// ================================================
// @ai-spec
// @module    api/anthropic
// @purpose   Vercel Edge Function — Anthropic Claude API へのストリーミングCORSプロキシ
// @depends   なし（Web標準APIのみ）
// @consumers js/claude.js (ブラウザから /api/anthropic にPOST)
// @constraints
//   - Edge Function: Vercel Hobbyプランでもタイムアウトしない（ストリーミング中は接続維持）
//   - BYOKモード: クライアントのAPIキーをそのまま転送
//   - 無料モード: x-api-keyなし → 環境変数 ANTHROPIC_API_KEY を使用
//   - レスポンスをストリーミング転送（Claude API → ブラウザ）
// @dataflow  ブラウザ → /api/anthropic → https://api.anthropic.com/v1/messages → ブラウザ
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
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta, x-free-mode',
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
    // APIキー決定: クライアント提供 or サーバー環境変数（無料モード）
    let apiKey = req.headers.get('x-api-key');
    const isFreeMode = !apiKey || req.headers.get('x-free-mode') === 'true';

    if (isFreeMode) {
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: '無料プレイ用のAPIキーが設定されていません' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Anthropic APIにリクエスト転送
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': req.headers.get('anthropic-version') || '2023-06-01',
    };

    // Advisor Tool等のbetaヘッダーがあれば転送
    const betaHeader = req.headers.get('anthropic-beta');
    if (betaHeader) {
      headers['anthropic-beta'] = betaHeader;
    }

    const body = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
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
    console.error('Anthropic proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Proxy error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
