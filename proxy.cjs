// ================================================
// AI探偵団 — CORSプロキシサーバー
// Anthropic APIはブラウザ直接呼び出し不可のため、
// ローカルプロキシ経由でAPIを呼び出す
// ================================================

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PROXY_PORT = 3457;

// 許可するAPI エンドポイント
const ALLOWED_TARGETS = {
  '/proxy/anthropic': 'https://api.anthropic.com/v1/messages',
  '/proxy/gemini': null // Gemini はパスからモデルIDを取得
};

const server = http.createServer((req, res) => {
  // CORS ヘッダー（プリフライト + 本リクエスト）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ヘルスチェック
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', proxy: 'ai-detective' }));
    return;
  }

  // Anthropic プロキシ
  if (req.url === '/proxy/anthropic' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const targetUrl = new URL('https://api.anthropic.com/v1/messages');

      // クライアントからのヘッダーを転送
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      };

      // Anthropic固有ヘッダーを転送
      for (const key of ['x-api-key', 'anthropic-version', 'anthropic-beta']) {
        if (req.headers[key]) headers[key] = req.headers[key];
      }

      const proxyReq = https.request({
        hostname: targetUrl.hostname,
        port: 443,
        path: targetUrl.pathname,
        method: 'POST',
        headers
      }, proxyRes => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });

      proxyReq.on('error', err => {
        console.error('Proxy error (Anthropic):', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: `Proxy error: ${err.message}` } }));
      });

      proxyReq.write(body);
      proxyReq.end();

      console.log(`[PROXY] Anthropic API → ${body.length} bytes`);
    });
    return;
  }

  // Gemini プロキシ
  if (req.url.startsWith('/proxy/gemini/') && req.method === 'POST') {
    // URL形式: /proxy/gemini/{model}?key={apiKey}
    const urlParts = req.url.replace('/proxy/gemini/', '');
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${urlParts}`;

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const targetUrl = new URL(geminiUrl);

      const proxyReq = https.request({
        hostname: targetUrl.hostname,
        port: 443,
        path: targetUrl.pathname + targetUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      }, proxyRes => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        proxyRes.pipe(res);
      });

      proxyReq.on('error', err => {
        console.error('Proxy error (Gemini):', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: `Proxy error: ${err.message}` } }));
      });

      proxyReq.write(body);
      proxyReq.end();

      console.log(`[PROXY] Gemini API → ${body.length} bytes`);
    });
    return;
  }

  // 不明なリクエスト
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PROXY_PORT, () => {
  console.log(`\n🔀 AI探偵団 CORSプロキシ起動`);
  console.log(`   http://127.0.0.1:${PROXY_PORT}/proxy/anthropic`);
  console.log(`   http://127.0.0.1:${PROXY_PORT}/proxy/gemini/{model}\n`);
});
