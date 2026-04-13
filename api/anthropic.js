// ================================================
// @ai-spec
// @module    api/anthropic
// @purpose   Vercel Edge Function — Anthropic Claude API へのストリーミングCORSプロキシ
// @depends   なし（Web標準APIのみ）
// @consumers js/claude.js (ブラウザから /api/anthropic にPOST)
// @constraints
//   - Edge Function + ストリーミング: Vercel Hobbyの30秒制限を回避
//   - リクエストに stream:true を強制注入
//   - Claude SSEイベントをそのままクライアントに転送
//   - BYOKモード: クライアントのAPIキーをそのまま転送
//   - 無料モード: x-api-keyなし → 環境変数 ANTHROPIC_API_KEY を使用
// @dataflow  ブラウザ → /api/anthropic → Claude API (SSE) → ブラウザ
// @updated   2026-04-14
// ================================================

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta, x-free-mode',
  };

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

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': req.headers.get('anthropic-version') || '2023-06-01',
    };

    const betaHeader = req.headers.get('anthropic-beta');
    if (betaHeader) {
      headers['anthropic-beta'] = betaHeader;
    }

    const body = await req.json();

    // ストリーミングを強制有効化（Vercelタイムアウト回避）
    body.stream = true;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // エラーレスポンスはそのまま返す
      const errText = await response.text();
      return new Response(errText, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SSEストリームをそのままクライアントに転送
    return new Response(response.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
