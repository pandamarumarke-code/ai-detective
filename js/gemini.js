// ================================================
// @ai-spec
// @module    gemini
// @purpose   Gemini API通信 + 画像生成バッチ処理（場面/ポートレート/カード）
// @ssot      なし（ステートレス）
// @depends   constants.js (GEMINI_MODELS, IMAGE_CONFIG, IMAGE_PROMPTS, THEMES)
// @exports   generateSceneImages, generateCardImages
// @consumers app.js
// @constraints
//   - DOM操作禁止（純粋なAPI通信モジュール）
//   - CORSプロキシ(localhost:3457)経由でのみ通信
//   - 同時リクエスト最大2（レート制限対応）
// @dataflow  app.js → callGeminiImage() → CORSプロキシ → Google API → Base64 → app.js
// @updated   2026-04-12
// ================================================
// AI探偵団 — Gemini (NanoBanana) 画像生成モジュール
// カードイラスト・容疑者ポートレート・場面設定画像を生成
// ================================================

import { GEMINI_MODELS, IMAGE_CONFIG, IMAGE_PROMPTS, THEMES } from './constants.js';

// CORSプロキシ: Vercel Serverless Function（本番）/ ローカルプロキシ（開発）
const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
const GEMINI_API_URL = isLocal ? 'http://127.0.0.1:3457/proxy/gemini' : '/api/gemini';

// ================================================
// 低レベルAPI呼び出し
// ================================================

/**
 * Gemini generateContent API（画像生成）
 * @param {string} apiKey - Gemini APIキー
 * @param {string} modelId - 'flash' | 'pro'
 * @param {string} prompt - 画像生成プロンプト
 * @param {string} aspectRatio - '1:1' | '16:9' | '3:4'
 * @returns {Promise<string>} Base64画像データ
 */
async function callGeminiImage(apiKey, modelId, prompt, aspectRatio = '1:1') {
  const model = GEMINI_MODELS[modelId] || GEMINI_MODELS.flash;

  // ローカル: /proxy/gemini/{model}:generateContent?key=xxx
  // Vercel:  /api/gemini?model={model}&key=xxx （サーバー側で:generateContentを付与）
  const fetchUrl = isLocal
    ? `${GEMINI_API_URL}/${model.id}:generateContent?key=${apiKey}`
    : `${GEMINI_API_URL}?model=${model.id}&key=${apiKey}`;

  const response = await fetch(
    fetchUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio }
        }
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();

  // レスポンスから画像Base64を抽出
  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(p => p.inlineData);

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini APIレスポンスに画像が含まれていません');
  }

  return imagePart.inlineData.data;
}

// ================================================
// バッチ処理（レート制限対応）
// ================================================

/**
 * 複数画像リクエストをバッチ実行
 * 同時最大N個 + 失敗時は指数バックオフでリトライ
 * @param {Array<{id, type, prompt, aspect, onReady?}>} requests
 * @param {string} apiKey
 * @param {string} modelId
 * @returns {Promise<Array<{id, type, data, error?}>>}
 */
async function batchGenerate(requests, apiKey, modelId) {
  const { concurrency, retryMax, baseDelay } = IMAGE_CONFIG.batch;
  const results = [];
  const queue = requests.map(r => ({ ...r, retryCount: 0 }));

  // セマフォ方式の並行制御
  async function processOne(req) {
    try {
      const data = await callGeminiImage(apiKey, modelId, req.prompt, req.aspect);
      results.push({ id: req.id, type: req.type, data });
      if (req.onReady) req.onReady(req.type, req.id, data);
      return true;
    } catch (err) {
      if (req.retryCount < retryMax) {
        req.retryCount++;
        const delay = baseDelay * Math.pow(2, req.retryCount);
        console.warn(`Gemini画像リトライ ${req.retryCount}/${retryMax} (${req.id}): ${delay}ms後`);
        await sleep(delay);
        return processOne(req); // 再帰リトライ
      }
      console.error(`Gemini画像生成失敗 (${req.id}):`, err.message);
      results.push({ id: req.id, type: req.type, data: null, error: err.message });
      return false;
    }
  }

  // concurrency個ずつ処理
  for (let i = 0; i < queue.length; i += concurrency) {
    const batch = queue.slice(i, i + concurrency);
    await Promise.all(batch.map(processOne));
  }

  return results;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================
// 高レベルAPI — 場面 + ポートレート生成
// ================================================

/**
 * 導入画像 + 容疑者ポートレートをバッチ生成
 * @param {Object} params
 * @param {string} params.geminiApiKey
 * @param {string} params.imageModelId - 'flash' | 'pro'
 * @param {Object} params.scenario - 生成済みシナリオ
 * @param {string} params.themeId
 * @param {Function} params.onImageReady - (type: 'scene'|'portrait', id: string, base64: string) => void
 * @returns {Promise<{scene: string|null, portraits: Object}>}
 */
export async function generateSceneImages({ geminiApiKey, imageModelId, scenario, themeId, onImageReady }) {
  const theme = THEMES[themeId] || THEMES.classic;
  const requests = [];

  // 場面設定画像
  requests.push({
    id: 'scene',
    type: 'scene',
    prompt: IMAGE_PROMPTS.scene(scenario, theme),
    aspect: IMAGE_CONFIG.aspectRatio.scene,
    onReady: onImageReady
  });

  // 容疑者ポートレート
  const suspects = scenario.suspects || [];
  for (const suspect of suspects) {
    requests.push({
      id: suspect.name,
      type: 'portrait',
      prompt: IMAGE_PROMPTS.portrait(suspect, theme),
      aspect: IMAGE_CONFIG.aspectRatio.portrait,
      onReady: onImageReady
    });
  }

  const results = await batchGenerate(requests, geminiApiKey, imageModelId);

  // 結果を構造化して返す
  const scene = results.find(r => r.type === 'scene')?.data || null;
  const portraits = {};
  results.filter(r => r.type === 'portrait').forEach(r => {
    if (r.data) portraits[r.id] = r.data;
  });

  return { scene, portraits };
}

// ================================================
// 高レベルAPI — カード画像生成
// ================================================

/**
 * 特定フェイズのカード画像をバッチ生成
 * @param {Object} params
 * @param {string} params.geminiApiKey
 * @param {string} params.imageModelId
 * @param {Object} params.scenario
 * @param {number} params.phaseIndex - 0始まり
 * @param {string} params.themeId
 * @param {Function} params.onImageReady - (cardId: string, base64: string) => void
 * @returns {Promise<void>}
 */
export async function generateCardImages({ geminiApiKey, imageModelId, scenario, phaseIndex, themeId, onImageReady }) {
  const theme = THEMES[themeId] || THEMES.classic;
  const phase = scenario.investigation_phases?.[phaseIndex];
  if (!phase) return;

  const cards = phase.cards || [];
  const requests = cards.map(card => ({
    id: card.id,
    type: 'card',
    prompt: IMAGE_PROMPTS.card(card, theme),
    aspect: IMAGE_CONFIG.aspectRatio.card,
    onReady: (_type, id, data) => onImageReady(id, data)
  }));

  await batchGenerate(requests, geminiApiKey, imageModelId);
}
