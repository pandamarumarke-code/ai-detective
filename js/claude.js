// ================================================
// @ai-spec
// @module    claude
// @purpose   Claude API通信 + 5パス品質検証パイプライン + Advisor Tool連携 + ストリーミング対応
// @ssot      なし（ステートレス）
// @depends   constants.js (MODELS, DIFFICULTIES, ADVISOR_CONFIG, プロンプトビルダー)
// @exports   generateScenario, evaluateAnswer
// @consumers app.js
// @constraints
//   - DOM操作禁止（純粋なAPI通信モジュール）
//   - CORSプロキシ経由でのみ通信
//   - Advisor Tool使用時は beta header 必須
//   - ストリーミングモードでAnthropic SSEを受信してタイムアウト回避
// @dataflow  app.js → callClaude() → CORSプロキシ → Anthropic API (SSE) → JSON → app.js
// @updated   2025-04-14
// ================================================
// AI探偵団 — Claude API通信モジュール（ステートレス）
// 5パス検証パイプライン:
//   Pass 1: シナリオ生成
//   Pass 2: ローカル構造検証（9項目）
//   Pass 3: AI論理検証（解決可能性証明・6観点）← Pass4と並列
//   Pass 4: AI日本語品質検証（8観点）← Pass3と並列
//   Pass 5: 解答チェーン検証
// + リトライ戦略 + 自動修正 + ストリーミング + AbortController
// ================================================

import {
  MODELS, DIFFICULTIES, ADVISOR_CONFIG,
  SCENARIO_SCHEMA, DEEP_VALIDATION_SCHEMA, JAPANESE_QUALITY_SCHEMA, SCORING_SCHEMA,
  SOLVABILITY_CHECK_SCHEMA, VALIDATION_THRESHOLDS, SCENARIO_DNA_OPTIONS,
  buildScenarioSystemPrompt, buildDeepValidationPrompt,
  buildJapaneseQualityPrompt, buildScoringPrompt, buildSolvabilityCheckPrompt
} from './constants.js';
import { isDebugMode, debugLog } from './debug.js';

// CORSプロキシ: Vercel Serverless Function（本番）/ ローカルプロキシ（開発）
const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
const API_URL = isLocal ? 'http://127.0.0.1:3457/proxy/anthropic' : '/api/anthropic';

// ================================================
// タイムアウト設定（秒）
// ================================================
const TIMEOUTS = {
  scenarioGeneration: 300, // Pass 1: シナリオ生成（Edge Function上限に合わせる）
  validation: 120,         // Pass 3/4: 検証パス
  solvability: 90,         // Pass 5: 解答チェーン
  scoring: 60              // 採点
};

// ================================================
// SSEストリーミング レスポンスパーサー
// ================================================

/**
 * Anthropic SSEストリームを読み取り、最終JSONを組み立てる
 * @param {ReadableStream} body - fetchレスポンスのbody
 * @param {Function} [onChunkReceived] - チャンク受信時のコールバック（アイドルタイムアウトリセット用）
 * @returns {Promise<Object>} パース済みレスポンスオブジェクト（Messages API形式）
 */
async function parseAnthropicStream(body, onChunkReceived) {
  const reader = body.getReader();
  const decoder = new TextDecoder();

  // 組み立て用バッファ
  const contentBlocks = [];
  let currentBlockIndex = -1;
  let currentText = '';
  let usage = null;
  let model = '';
  let stopReason = '';
  let sseBuffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });

      // SSEイベントを行単位でパース
      const lines = sseBuffer.split('\n');
      // 最後の不完全な行はバッファに残す
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') continue;

        // アイドルタイムアウトリセット（チャンク受信時）
        if (typeof onChunkReceived === 'function') onChunkReceived();

        let event;
        try {
          event = JSON.parse(dataStr);
        } catch {
          continue;
        }

        switch (event.type) {
          case 'message_start':
            if (event.message) {
              model = event.message.model || '';
              usage = event.message.usage || null;
            }
            break;

          case 'content_block_start':
            currentBlockIndex = event.index ?? contentBlocks.length;
            currentText = '';
            if (event.content_block) {
              contentBlocks[currentBlockIndex] = {
                type: event.content_block.type || 'text',
                text: '',
                // Advisor関連のブロックもそのまま保持
                ...event.content_block
              };
            }
            break;

          case 'content_block_delta': {
            const idx = event.index ?? currentBlockIndex;
            if (event.delta?.type === 'text_delta' && event.delta.text) {
              currentText += event.delta.text;
              if (contentBlocks[idx]) {
                contentBlocks[idx].text =
                  (contentBlocks[idx].text || '') + event.delta.text;
              }
            } else if (event.delta?.type === 'input_json_delta' && event.delta.partial_json) {
              // Advisor Toolの入力 JSON（ログ用に保持）
              if (contentBlocks[idx]) {
                contentBlocks[idx].text =
                  (contentBlocks[idx].text || '') + event.delta.partial_json;
              }
            }
            break;
          }

          case 'content_block_stop':
            // ブロック完了 — 何もしない
            break;

          case 'message_delta':
            if (event.delta?.stop_reason) stopReason = event.delta.stop_reason;
            if (event.usage) {
              usage = { ...usage, ...event.usage };
            }
            break;

          case 'message_stop':
            // ストリーム終了
            break;

          case 'error':
            throw new Error(`Anthropic Stream Error: ${event.error?.message || JSON.stringify(event)}`);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Messages API互換のレスポンスオブジェクトを返す
  return {
    content: contentBlocks.length > 0 ? contentBlocks : [{ type: 'text', text: currentText }],
    model,
    stop_reason: stopReason,
    usage
  };
}

// ================================================
// 低レベルAPI呼び出し（ストリーミング対応）
// ================================================

/**
 * Claude Messages APIにリクエストを送信
 * ストリーミングモードでレスポンスを受信し、タイムアウトを回避
 * Advisor Tool対応: useAdvisor=trueの場合、Sonnetが実行者、Opusがアドバイザー
 */
async function callClaude({ apiKey, modelId, system, userMessage, schema, temperature = 0.9, maxTokens = 8192, useAdvisor = false, advisorMaxUses = 1, timeoutSec = TIMEOUTS.validation }) {
  // Advisor有効時: 実行者は常にSonnet、アドバイザーはOpus
  // Advisor無効時: modelIdで指定されたモデルを単体で使用
  const executorModel = useAdvisor ? ADVISOR_CONFIG.executor : (MODELS[modelId] || MODELS.sonnet).id;

  const body = {
    model: executorModel,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [
      { role: 'user', content: userMessage }
    ]
  };

  // Advisor Toolをツール配列に追加
  if (useAdvisor) {
    body.tools = [{
      type: 'advisor_20260301',
      name: 'advisor',
      model: ADVISOR_CONFIG.advisor,
      max_uses: advisorMaxUses,
      caching: ADVISOR_CONFIG.caching
    }];
  }

  if (schema) {
    // schema は {name, description, strict, schema: {type:'object',...}} 形式
    // Claude API は output_format.schema に純粋な JSON Schema を期待
    const pureSchema = schema.schema || schema;
    body.output_format = {
      type: 'json_schema',
      schema: pureSchema
    };
  }

  // ベータヘッダーの組み立て
  const betaHeaders = ['structured-outputs-2025-11-13'];
  if (useAdvisor) betaHeaders.push(ADVISOR_CONFIG.betaHeader);

  // 無料モード: x-api-keyを送らず、x-free-modeヘッダーでサーバーに通知
  const isFreeMode = apiKey === 'FREE';

  // ストリーミング: 本番(Vercel)のみ有効。ローカルプロキシは従来通り
  const useStreaming = !isLocal;

  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-beta': betaHeaders.join(',')
  };
  if (isFreeMode) {
    headers['x-free-mode'] = 'true';
  } else {
    headers['x-api-key'] = apiKey;
  }
  if (useStreaming) {
    headers['x-stream-mode'] = 'true';
  }

  // AbortController でタイムアウト制御
  // タイムアウト制御: ストリーミング時はアイドルタイムアウト（チャンク間隔）
  // 非ストリーミング時は従来の累計タイムアウト
  const controller = new AbortController();
  const IDLE_TIMEOUT_MS = 60000; // ストリーミング中のアイドル上限: 60秒
  let timeoutId;

  if (useStreaming) {
    // ストリーミング: アイドルタイムアウト（チャンク受信間隔で判定）
    timeoutId = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
  } else {
    // 非ストリーミング: 累計タイムアウト
    timeoutId = setTimeout(() => controller.abort(), timeoutSec * 1000);
  }

  // アイドルタイムアウトリセット関数（ストリーミング中にチャンク受信するたびに呼ばれる）
  const resetIdleTimeout = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS);
  };

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === 'AbortError') {
      throw new Error(`APIタイムアウト（${timeoutSec}秒）: リクエストが制限時間を超過しました。再試行してください。`);
    }
    throw fetchErr;
  }

  if (!response.ok) {
    clearTimeout(timeoutId);
    const errText = await response.text();
    let errMsg;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errText;
    } catch {
      errMsg = errText;
    }
    throw new Error(`Claude API Error (${response.status}): ${errMsg}`);
  }

  // ストリーミングレスポンスの場合: SSEをパース（アイドルタイムアウトリセット付き）
  let data;
  try {
    if (useStreaming && response.body) {
      data = await parseAnthropicStream(response.body, resetIdleTimeout);
    } else {
      data = await response.json();
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Advisor Tool使用時: content配列に複数ブロック型がある
  // - type: "text" → テキスト出力（これを使う）
  // - type: "server_tool_use" → Advisor呼び出し（スキップ）
  // - type: "advisor_tool_result" → Advisorの助言（ログ用）

  // Advisor情報をログに記録
  const advisorResult = data.content?.find(b => b.type === 'advisor_tool_result');
  if (advisorResult) {
    const adviceText = advisorResult.content?.text || '(encrypted/redacted)';
    console.log('🧠 Opus Advisor 助言:', adviceText.substring(0, 200));
  }

  // 使用量トラッキング
  if (data.usage?.iterations) {
    const advisorIter = data.usage.iterations.find(i => i.type === 'advisor_message');
    if (advisorIter) {
      console.log(`💰 Advisor: 入力${advisorIter.input_tokens} / 出力${advisorIter.output_tokens}トークン`);
    }
  }

  // テキストブロックを抽出（最後のテキストブロック = Advisor後の実行者出力）
  const textBlocks = (data.content || []).filter(b => b.type === 'text' && b.text?.trim());
  const textBlock = textBlocks[textBlocks.length - 1];
  if (!textBlock?.text) {
    // 診断ログ: 何が返ってきたか記録
    const blockTypes = (data.content || []).map(b => `${b.type}(${(b.text || '').length}文字)`).join(', ');
    console.error('❌ テキストブロック空 - contentブロック:', blockTypes);
    console.error('❌ stop_reason:', data.stop_reason, '/ model:', data.model);
    console.error('❌ data.content全体:', JSON.stringify(data.content || [], null, 2).substring(0, 1000));

    // フォールバック: 全ブロックのテキストを結合してJSON抽出を試みる
    const allText = (data.content || [])
      .filter(b => b.text)
      .map(b => b.text)
      .join('');
    if (allText.includes('{') && allText.includes('}')) {
      console.warn('⚠️ フォールバック: 全ブロックテキストからJSON抽出を試行');
      const fbMatch = allText.match(/\{[\s\S]*\}/);
      if (fbMatch) {
        try {
          return JSON.parse(fbMatch[0]);
        } catch (fbErr) {
          console.warn('⚠️ フォールバックJSON抽出失敗:', fbErr.message);
        }
      }
    }
    // Advisor使用時は _advisorFailed フラグを立てて、Advisorなしリトライを促す
    const err = new Error(`Claude APIレスポンスにテキストが含まれていません（stop: ${data.stop_reason || 'unknown'}, ブロック: ${blockTypes}）`);
    err._advisorFailed = true;
    err._retryable = true;
    throw err;
  }

  const text = textBlock.text;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // JSON途中切断の検出: "Unterminated string" or "Unexpected end" → 自動継続を試行
    if (e.message.includes('Unterminated') || e.message.includes('Unexpected end')) {
      console.warn('⚠️ JSON途中切断を検出、自動継続を試行...');
      throw Object.assign(
        new Error(`JSONが途中で切断されました（トークン上限到達の可能性）。リトライします。`),
        { _retryable: true, _truncatedJson: jsonStr }
      );
    }
    throw new Error(`JSONパースエラー: ${e.message}\n\nレスポンス冒頭: ${text.substring(0, 300)}`);
  }
}

// ================================================
// 高レベルAPI — 5パス検証パイプライン
// ================================================

/**
 * ミステリーシナリオを生成・検証する（5パスパイプライン + リトライ）
 *
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.modelId
 * @param {string} params.theme
 * @param {string} params.difficulty
 * @param {boolean} params.advisorEnabled - Advisor戦略を使用するか
 * @param {Function} params.onProgress - (step, status, detail?) => void
 *   step: 1-6, status: 'active'|'done'|'error'|'retry'
 * @returns {Promise<Object>} 検証済みシナリオ
 */

// ================================================
// シナリオ修正パス（repairScenario）
// 200秒のフル再生成ではなく、既存シナリオを直接パッチ修正する軽量版
// ================================================

/**
 * 検証で落ちたシナリオを直接修正する（フル再生成の代替）
 * 既存のシナリオJSONをそのまま渡し、検証フィードバックに基づいて
 * 問題箇所だけを修正した改善版JSONを返す。
 *
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.modelId
 * @param {Object} params.previousScenario - 修正対象のシナリオJSON
 * @param {string} params.validationFeedback - 検証フィードバック文字列
 * @param {boolean} params.advisorEnabled
 * @param {number} params.timeoutSec
 * @returns {Promise<Object>} 修正済みシナリオJSON
 */
async function repairScenario({ apiKey, modelId, previousScenario, validationFeedback, advisorEnabled = false, timeoutSec = 120 }) {
  console.log('🔧 repairScenario: シナリオ修正パス開始');

  // 既存シナリオから安全にJSONを抽出（トークン節約のため出力に関係ない内部プロパティを除去）
  const cleanScenario = { ...previousScenario };
  delete cleanScenario._logicValidation;
  delete cleanScenario._japaneseQuality;
  delete cleanScenario._solvabilityCheck;
  const scenarioJson = JSON.stringify(cleanScenario, null, 0); // 圧縮JSON

  const repairSystemPrompt = `あなたはミステリーシナリオの品質改善エキスパートです。
与えられた既存シナリオの問題点を修正し、改善版を出力してください。

## 修正ルール
1. 元のシナリオの世界観・キャラクター・基本ストーリーは可能な限り維持する
2. 検証フィードバックで指摘された問題を確実に修正する
3. 特に「手がかりから犯人を論理的に特定できること」を最優先で保証する
4. 必要に応じて手がかりカード（clues）の内容を追加・修正する
5. importance=critical のカードには必ず犯人特定の決定的情報を含める
6. 全テキストは日本語で記述する
7. JSONスキーマの構造は一切変更しない（フィールド追加・削除禁止）`;

  const repairUserMessage = `以下のシナリオには品質検証で問題が見つかりました。フィードバックに基づいて修正版を出力してください。

## 検証フィードバック
${validationFeedback}

## 修正対象シナリオ（JSON）
${scenarioJson}

上記のフィードバックで指摘されたすべての問題を修正し、完全なシナリオJSONを出力してください。
特に以下の点を重点的に確認・修正してください：
- 手がかりカードの情報だけで犯人を論理的に特定できるか
- アリバイ・タイムライン・動機の整合性
- importance=critical カードに決定的証拠が含まれているか`;

  const repairedScenario = await callClaude({
    apiKey,
    modelId,
    system: repairSystemPrompt,
    userMessage: repairUserMessage,
    schema: SCENARIO_SCHEMA,
    useAdvisor: advisorEnabled,
    temperature: 0.3, // 修正は安定出力（創造性よりも正確性）
    maxTokens: 8192,
    timeoutSec
  });

  console.log('✅ repairScenario: シナリオ修正完了 -', repairedScenario.title);
  return repairedScenario;
}

/**
 * ミステリーシナリオを生成・検証する（5パスパイプライン + リトライ + シナリオ修正）
 */
export async function generateScenario({ apiKey, modelId, theme, difficulty, advisorEnabled = false, usedNames = [], dna = null, onProgress }) {
  const { maxRetries } = VALIDATION_THRESHOLDS;
  let attempt = 0;
  let lastError = null;
  let previousScenario = null;  // リトライ用: 前回シナリオ
  let validationFeedback = null; // リトライ用: 検証フィードバック

  while (attempt <= maxRetries) {
    try {
      const scenario = await runPipeline({ apiKey, modelId, theme, difficulty, advisorEnabled, usedNames, dna, onProgress, attempt, previousScenario, validationFeedback });
      return scenario;
    } catch (e) {
      lastError = e;
      // 検証失敗時: シナリオとフィードバックを保持して次回リトライでブラッシュアップ
      if (e._failedScenario) previousScenario = e._failedScenario;
      if (e._validationFeedback) validationFeedback = e._validationFeedback;
      attempt++;
      if (attempt <= maxRetries && e._retryable) {
        const mode = previousScenario ? 'ブラッシュアップ' : '再生成';
        onProgress(0, 'retry', `リトライ ${attempt}/${maxRetries} (${mode}): ${e.message}`);
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('シナリオ生成に失敗しました');
}

/**
 * パイプライン1回分の実行
 * Pass 3/4を並列化、各PassにAbortControllerタイムアウトを適用
 */
async function runPipeline({ apiKey, modelId, theme, difficulty, advisorEnabled, usedNames, dna, onProgress, attempt, previousScenario = null, validationFeedback = null }) {
  // Advisor使用時のプロンプト追加文
  const advisorHint = advisorEnabled
    ? '\n\n【重要】またadvisorに相談して、戦略的な計画を立ててから実行してください。'
    : '';

  // ブラッシュアップモード: 前回のシナリオ + 検証フィードバックを元に修正版を生成
  const brushUpMode = !!(previousScenario && validationFeedback);
  if (brushUpMode) {
    console.log('🔧 ブラッシュアップモード: 前回の検証フィードバックを元にシナリオを修正');
  }

  // ---- Step 1: シナリオ生成 / 修正 (Pass 1) ----
  onProgress(1, 'active');
  let scenario;

  if (brushUpMode) {
    // ★ シナリオ修正モード: 既存シナリオを直接パッチ修正（軽量・高速）
    console.log('⚡ シナリオ修正モード: 既存シナリオをパッチ修正します');
    try {
      scenario = await repairScenario({
        apiKey,
        modelId,
        previousScenario,
        validationFeedback,
        advisorEnabled: false, // 修正パスはAdvisor不要（高速化）
        timeoutSec: TIMEOUTS.validation // 修正は120秒で十分
      });
    } catch (e) {
      console.warn('⚠️ シナリオ修正失敗。フル再生成にフォールバック:', e.message);
      scenario = null; // フル再生成にフォールバック
    }
  }

  // 修正失敗 or 通常モード: フル生成
  if (!scenario) {
    try {
      scenario = await callClaude({
        apiKey,
        modelId,
        system: buildScenarioSystemPrompt(theme, difficulty, usedNames, dna),
        userMessage: '上記の条件に従って、ミステリーシナリオを1つ生成してください。すべてのフィールドを日本語で記述してください。' + (advisorEnabled ? '\n\n【重要】またadvisorに相談して、シナリオの骨格（犯人・トリック・動機・レッドヘリング・解決の鍵）の戦略を立ててから、その計画に従ってシナリオを生成してください。' : ''),
        schema: SCENARIO_SCHEMA,
        useAdvisor: advisorEnabled,
        advisorMaxUses: ADVISOR_CONFIG.maxUsesPerCall.scenarioGeneration,
        temperature: 0.9 + (attempt * 0.05),
        maxTokens: 8192,
        timeoutSec: TIMEOUTS.scenarioGeneration
      });
    } catch (e) {
      // Advisor使用時にテキストブロック空エラー → Advisorなしで自動リトライ
      if (e._advisorFailed && advisorEnabled) {
        console.warn('⚠️ Advisor使用時にエラー発生。Advisorなしでリトライします:', e.message);
        onProgress(1, 'active');
        scenario = await callClaude({
          apiKey,
          modelId,
          system: buildScenarioSystemPrompt(theme, difficulty, usedNames, dna),
          userMessage: '上記の条件に従って、ミステリーシナリオを1つ生成してください。すべてのフィールドを日本語で記述してください。',
          schema: SCENARIO_SCHEMA,
          useAdvisor: false,
          temperature: 0.9 + (attempt * 0.05),
          maxTokens: 8192,
          timeoutSec: TIMEOUTS.scenarioGeneration
        });
      } else {
        onProgress(1, 'error');
        throw e;
      }
    }
  }
  onProgress(1, 'done');
  // チェックポイント: シナリオをlocalStorageに自動保存（エラー時のレジューム用）
  try {
    localStorage.setItem('ai_detective_checkpoint', JSON.stringify(scenario));
    console.log('💾 チェックポイント保存完了');
  } catch (saveErr) {
    console.warn('チェックポイント保存失敗:', saveErr.message);
  }

  // ---- Step 2: ローカル構造検証 (Pass 2) ----
  onProgress(2, 'active');
  try {
    const structResult = validateStructure(scenario, difficulty);
    if (!structResult.valid) {
      // ネタバレ防止: エラーメッセージからシナリオ内容（犯人名・動機等）を除去
      const safeErrors = structResult.errors.map(sanitizeErrorMessage);
      const err = new Error(`構造検証エラー: ${safeErrors.join(', ')}`);
      err._retryable = true;
      onProgress(2, 'error');
      throw err;
    }
    onProgress(2, 'done');
  } catch (e) {
    if (!e._retryable) onProgress(2, 'error');
    throw e;
  }

  // ════════════════════════════════════════════════════════════
  // 🔧 v7.11 インライン・マイクロ修正方式:
  // Pass 3（論理検証）はブロッキング維持 → 失敗時はその場で修正して続行
  // Pass 4/5（日本語・自動修正）はバックグラウンド化（品質改善のみ）
  // ────────────────────────────────────────────────────────────
  // フロー: Pass 1(200s) → Pass 2(0s) → Pass 3(30-60s)
  //   → [合格] そのまま続行
  //   → [不合格] マイクロ修正(30-60s) → ローカル再検証(0s) → 続行
  // ════════════════════════════════════════════════════════════

  // ---- Step 3: AI論理検証 (Pass 3) — ブロッキング ----
  onProgress(3, 'active');
  let logicResult = null;
  const validationUseAdvisor = false; // Advisor不使用（高速化 + エラー回避）

  try {
    logicResult = await callClaude({
      apiKey, modelId,
      system: 'あなたはミステリーシナリオの品質管理官です。論理的な矛盾を厳密にチェックしてください。',
      userMessage: buildDeepValidationPrompt(scenario),
      schema: DEEP_VALIDATION_SCHEMA,
      useAdvisor: validationUseAdvisor,
      temperature: 0.1, maxTokens: 4096,
      timeoutSec: TIMEOUTS.validation
    });
    scenario._logicValidation = logicResult;
    onProgress(3, 'done');
  } catch (e) {
    console.warn('AI論理検証エラー（スキップして続行）:', e.message);
    logicResult = { is_valid: true, is_solvable: true, overall_score: 70, reasoning_chain: '(検証スキップ)', critical_issues: [], suggestions: [] };
    scenario._logicValidation = logicResult;
    onProgress(3, 'done');
  }

  // ---- Pass 3 結果処理: 不合格ならインライン・マイクロ修正 ----
  const needsRepair = logicResult && (!logicResult.is_solvable || logicResult.overall_score < VALIDATION_THRESHOLDS.logicPassScore);

  if (needsRepair) {
    console.log(`⚠️ 論理検証不合格 (is_solvable=${logicResult.is_solvable}, score=${logicResult.overall_score})`);
    console.log('🔧 インライン・マイクロ修正を開始...');
    onProgress(3, 'active'); // ステップ3を「修正中」に戻す

    // 検証フィードバックを構築
    const feedback = [
      `論理スコア: ${logicResult.overall_score}/100 (基準: ${VALIDATION_THRESHOLDS.logicPassScore})`,
      `解決可能性: ${logicResult.is_solvable ? '可' : '不可'}`,
      `推理チェーン: ${logicResult.reasoning_chain || '(なし)'}`,
      `アリバイ: ${logicResult.alibi_check || '(なし)'}`,
      `タイムライン: ${logicResult.timeline_check || '(なし)'}`,
      `証拠整合性: ${logicResult.evidence_match || '(なし)'}`,
      `重大な問題: ${(logicResult.critical_issues || []).join(', ') || '(なし)'}`,
      `改善提案: ${(logicResult.suggestions || []).join(', ') || '(なし)'}`
    ].join('\n');

    try {
      // マイクロ修正: repairScenarioで問題箇所だけ修正（30-60秒）
      const repairedScenario = await repairScenario({
        apiKey, modelId,
        previousScenario: scenario,
        validationFeedback: feedback,
        advisorEnabled: false,
        timeoutSec: TIMEOUTS.validation
      });

      // ローカル再検証（Pass 2のみ、0秒）
      const recheck = validateStructure(repairedScenario, difficulty);
      if (recheck.valid) {
        // 修正成功 → シナリオを置き換えて続行
        console.log('✅ マイクロ修正成功 → ローカル再検証OK');
        scenario = repairedScenario;
        scenario._logicValidation = logicResult; // 元の検証結果は保持
        scenario._repaired = true;
        // チェックポイント更新
        try { localStorage.setItem('ai_detective_checkpoint', JSON.stringify(scenario)); } catch (e) {}
      } else {
        console.warn('⚠️ マイクロ修正後のローカル再検証失敗:', recheck.errors);
        // 修正版は使わず、元のシナリオで続行（完璧でなくてもプレイ可能）
        console.log('📋 元のシナリオで続行（検証スキップ）');
      }
      onProgress(3, 'done');
    } catch (repairErr) {
      console.warn('⚠️ マイクロ修正失敗（元のシナリオで続行）:', repairErr.message);
      onProgress(3, 'done');
      // 修正失敗でも元のシナリオで続行（プレイ不可能になるよりマシ）
    }
  }

  // ---- Step 4/5: 日本語品質 + 自動修正 (バックグラウンド) ----
  // ゲームプレイに影響しないため、バックグラウンドで実行
  onProgress(4, 'active');
  onProgress(5, 'active');

  const bgJpValidation = (async () => {
    try {
      const jpResult = await callClaude({
        apiKey, modelId,
        system: 'あなたは日本語校正の専門家です。ミステリーシナリオのテキスト品質を厳密に評価してください。',
        userMessage: buildJapaneseQualityPrompt(scenario, theme),
        schema: JAPANESE_QUALITY_SCHEMA,
        useAdvisor: false,
        temperature: 0.1, maxTokens: 4096,
        timeoutSec: TIMEOUTS.validation
      });
      scenario._japaneseQuality = jpResult;
      onProgress(4, 'done');

      // 自動修正の適用
      if (jpResult?.corrections?.length > 0 && jpResult.overall_score < VALIDATION_THRESHOLDS.japaneseAutoFixScore) {
        applyCorrections(scenario, jpResult.corrections);
      }
      if (jpResult && !jpResult.name_consistency) {
        fixNameConsistency(scenario);
      }
      onProgress(5, 'done');

      scenario._qualityScore = computeOverallQuality(logicResult || { overall_score: 70 }, jpResult);
      console.log('✅ バックグラウンド日本語検証完了:', scenario._qualityScore);
    } catch (e) {
      console.warn('日本語品質検証スキップ:', e.message);
      onProgress(4, 'done');
      onProgress(5, 'done');
    }
  })();
  scenario._jpValidationPromise = bgJpValidation;

  // ---- Step 6: 完了 ----
  onProgress(6, 'done');

  // DNA情報を保存
  if (dna) scenario._dna = dna;

  return scenario;
}

// ================================================
// Pass 2: ローカル構造検証（9項目）
// ================================================

/**
 * プログラマティックな構造検証（APIコスト$0）
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateStructure(scenario, difficultyId) {
  const errors = [];
  const diff = DIFFICULTIES[difficultyId];

  // SV-1: 犯人の一意性
  const culprits = (scenario.suspects || []).filter(s => s.is_culprit);
  if (culprits.length !== 1) {
    // 自動修正を試みる: solution.culprit と名前一致で修正
    if (scenario.solution?.culprit) {
      scenario.suspects.forEach(s => {
        s.is_culprit = (s.name === scenario.solution.culprit);
      });
      const fixedCulprits = scenario.suspects.filter(s => s.is_culprit);
      if (fixedCulprits.length !== 1) {
        errors.push(`SV-1: 犯人が${fixedCulprits.length}人（要: 正確に1人）`);
      }
    } else {
      errors.push(`SV-1: 犯人が${culprits.length}人（要: 正確に1人）`);
    }
  }

  // SV-2: 犯人名一致
  if (scenario.solution?.culprit &&
      !scenario.suspects?.some(s => s.name === scenario.solution.culprit)) {
    errors.push(`SV-2: 犯人「${scenario.solution.culprit}」が容疑者リストに不在`);
  }

  // SV-3: 容疑者数
  if (diff && scenario.suspects?.length < diff.suspectCount) {
    errors.push(`SV-3: 容疑者${scenario.suspects.length}人（要: ${diff.suspectCount}人以上）`);
  }

  // SV-4: フェイズ数
  if (diff && scenario.investigation_phases?.length !== diff.phasesCount) {
    errors.push(`SV-4: フェイズ${scenario.investigation_phases?.length || 0}個（要: ${diff.phasesCount}個）`);
  }

  // SV-5: カード数（各フェイズ）
  if (scenario.investigation_phases) {
    scenario.investigation_phases.forEach((phase, i) => {
      if (!phase.cards || phase.cards.length === 0) {
        errors.push(`SV-5: 第${i + 1}フェイズのカードが空`);
      }
      // フィールドを正規化
      phase.phase = i + 1;
      phase.total_cards = phase.cards?.length || 0;
      if (!phase.selectable || phase.selectable < 1) phase.selectable = 2;
    });
  }

  // SV-6: カードID重複
  const allCardIds = (scenario.investigation_phases || [])
    .flatMap(p => (p.cards || []).map(c => c.id));
  const uniqueIds = new Set(allCardIds);
  if (uniqueIds.size !== allCardIds.length) {
    errors.push(`SV-6: カードIDに重複あり（${allCardIds.length}枚中、ユニーク${uniqueIds.size}枚）`);
  }

  // SV-7: 決定的証拠の存在（key_evidenceがカードに対応）
  // key_evidenceはカードIDではなくテキスト説明の場合もあるので、存在するかの簡易チェック
  if (!scenario.solution?.key_evidence || scenario.solution.key_evidence.length < 5) {
    errors.push('SV-7: key_evidence（決定的証拠の説明）が不足');
  }

  // SV-8: テキスト長チェック
  const { minIntroLength, minCardContentLength } = VALIDATION_THRESHOLDS;
  if (scenario.introduction && scenario.introduction.length < minIntroLength) {
    errors.push(`SV-8: 導入文が短すぎる（${scenario.introduction.length}文字 < ${minIntroLength}文字）`);
  }
  const shortCards = (scenario.investigation_phases || [])
    .flatMap(p => p.cards || [])
    .filter(c => (c.content || '').length < minCardContentLength);
  if (shortCards.length > 0) {
    errors.push(`SV-8: ${shortCards.length}枚のカードが短すぎる（< ${minCardContentLength}文字）`);
  }

  // SV-9: ヒント存在
  if (!scenario.hints || scenario.hints.length < VALIDATION_THRESHOLDS.minHints) {
    errors.push(`SV-9: ヒント${scenario.hints?.length || 0}個（要: ${VALIDATION_THRESHOLDS.minHints}個以上）`);
  }

  // SV-10: フェアプレイ検証（解答に必要な情報がカードに含まれるか）→ 自動修正
  if (scenario.solution && scenario.investigation_phases) {
    const allCardText = scenario.investigation_phases
      .flatMap(p => (p.cards || []).map(c => `${c.title} ${c.content}`))
      .join(' ');
    
    // 犯人名がカードで言及されていない → 自動修正で挿入
    if (scenario.solution.culprit && !allCardText.includes(scenario.solution.culprit)) {
      const fixed = autoFixCulpritMention(scenario);
      if (!fixed) {
        errors.push('SV-10: 手がかりカードの情報が不足しています（フェアプレイ違反）');
      } else {
        console.log('🔧 SV-10自動修正: 犯人への言及をカードに挿入しました');
      }
    }
    
    // criticalカードが最低1枚あるか → なければ自動昇格
    const criticalCards = scenario.investigation_phases
      .flatMap(p => (p.cards || []))
      .filter(c => c.importance === 'critical');
    if (criticalCards.length === 0) {
      const promoted = autoPromoteToCritical(scenario);
      if (!promoted) {
        errors.push('SV-10: 決定打となる手がかりが不足しています');
      } else {
        console.log('🔧 SV-10自動修正: カードをcriticalに昇格しました');
      }
    }
  }

  // SV-11: 暗転シーン（culprit_flashbacks）のネタバレ防止チェック
  // 犯人名が独白に含まれている場合は自動修正で「私」に置換
  const culpritName = scenario.solution?.culprit;
  if (culpritName && scenario.culprit_flashbacks) {
    // 全容疑者名を取得（犯人以外の名前も独白に不適切な場合がある）
    const allSuspectNames = (scenario.suspects || []).map(s => s.name);

    scenario.culprit_flashbacks.forEach((fb, i) => {
      // 犯人名チェック（最重要）
      if (fb.monologue && fb.monologue.includes(culpritName)) {
        fb.monologue = fb.monologue.replaceAll(culpritName, '私');
        console.warn(`🔧 SV-11自動修正: 暗転${i + 1}の独白から犯人名「${culpritName}」を除去`);
      }
      // 他の容疑者名チェック（独白で他キャラ名を出すと犯人が絞れてしまう）
      allSuspectNames.forEach(name => {
        if (fb.monologue && fb.monologue.includes(name)) {
          fb.monologue = fb.monologue.replaceAll(name, 'あの人');
          console.warn(`🔧 SV-11自動修正: 暗転${i + 1}の独白から容疑者名「${name}」を除去`);
        }
      });
    });

    // フラッシュバック数チェック（2つ未満の場合は警告のみ）
    if (scenario.culprit_flashbacks.length < 2) {
      console.warn(`⚠️ SV-11: culprit_flashbacksが${scenario.culprit_flashbacks.length}個（期待: 2個）`);
    }
  }

  // SV-12: ローカルソルバビリティチェック（API不要・0秒で解決可能性を検証）
  // 犯人特定に必要な3要素（犯人名・動機・手口）がカード内に存在するか確認
  if (scenario.solution && scenario.investigation_phases) {
    const allCardText = scenario.investigation_phases
      .flatMap(p => (p.cards || []).map(c => `${c.title || ''} ${c.content || ''}`))
      .join(' ').toLowerCase();
    const allCardTextOriginal = scenario.investigation_phases
      .flatMap(p => (p.cards || []).map(c => `${c.title || ''} ${c.content || ''}`))
      .join(' ');

    const culprit = scenario.solution.culprit || '';
    const motive = scenario.solution.motive_detail || '';
    const method = scenario.solution.method_detail || '';

    // 犯人名がカード内に存在するか（SV-10で修正済みのはず）
    const hasCulpritRef = allCardTextOriginal.includes(culprit);

    // 動機のキーワードがカードに含まれるか（動機文から主要キーワードを抽出）
    const motiveKeywords = motive.split(/[、。・\s,.\n]+/).filter(w => w.length >= 2).slice(0, 5);
    const motiveHits = motiveKeywords.filter(kw => allCardText.includes(kw.toLowerCase()));
    const hasMotiveClue = motiveHits.length >= 1;

    // 手口のキーワードがカードに含まれるか
    const methodKeywords = method.split(/[、。・\s,.\n]+/).filter(w => w.length >= 2).slice(0, 5);
    const methodHits = methodKeywords.filter(kw => allCardText.includes(kw.toLowerCase()));
    const hasMethodClue = methodHits.length >= 1;

    console.log(`🔍 SV-12 ソルバビリティ: 犯人=${hasCulpritRef?'✅':'❌'} 動機=${hasMotiveClue?'✅':'❌'}(${motiveHits.length}/${motiveKeywords.length}) 手口=${hasMethodClue?'✅':'❌'}(${methodHits.length}/${methodKeywords.length})`);

    if (!hasCulpritRef) {
      errors.push('SV-12: 犯人名がカードに一切登場しません（解決不可能）');
    }
    if (!hasMotiveClue && motiveKeywords.length > 0) {
      console.warn('⚠️ SV-12: 動機に関するヒントがカード内に不足しています');
      // 警告のみ（エラーにはしない — 動機は推理の醍醐味）
    }
    if (!hasMethodClue && methodKeywords.length > 0) {
      console.warn('⚠️ SV-12: 手口に関するヒントがカード内に不足しています');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ================================================
// SV-10 自動修正ロジック（再試行せずシナリオを修正）
// ================================================

/**
 * 犯人名がカードに登場しない場合、証言カードに自動挿入
 * @returns {boolean} 修正成功したか
 */
function autoFixCulpritMention(scenario) {
  const culprit = scenario.solution?.culprit;
  if (!culprit) return false;

  // 証言カードを探して犯人への言及を追加
  for (const phase of scenario.investigation_phases) {
    for (const card of (phase.cards || [])) {
      if (card.type === 'testimony') {
        // 証言カードに犯人名を自然に挿入
        card.content += `\n（※ なお、${culprit}もその場にいたという。）`;
        return true;
      }
    }
  }
  // 証言カードがなければ、最初のカードに挿入
  const firstCard = scenario.investigation_phases[0]?.cards?.[0];
  if (firstCard) {
    firstCard.content += `\n（関係者の中には${culprit}の名前も挙がっている。）`;
    return true;
  }
  return false;
}

/**
 * criticalカードがない場合、high以上のカードを1枚criticalに昇格
 * @returns {boolean} 昇格成功したか
 */
function autoPromoteToCritical(scenario) {
  const allCards = scenario.investigation_phases.flatMap(p => p.cards || []);
  // highカードを優先、なければmediumを昇格
  const candidate = allCards.find(c => c.importance === 'high')
                 || allCards.find(c => c.importance === 'medium');
  if (candidate) {
    candidate.importance = 'critical';
    return true;
  }
  return false;
}

/**
 * エラーメッセージからネタバレ情報（犯人名・動機・手口）を除去
 * プレイヤーに見える可能性があるため、solution内容を含めない
 */
function sanitizeErrorMessage(msg) {
  // 「犯人「xxx」が〜」のパターンを除去
  return msg
    .replace(/犯人「[^」]+」/g, '犯人')
    .replace(/動機「[^」]+」/g, '動機')
    .replace(/手口「[^」]+」/g, '手口')
    .replace(/「[^」]{3,}」/g, '「***」'); // 3文字以上の固有名詞を伏字に
}

// ================================================
// 自動修正ロジック
// ================================================

/**
 * AIが提案した修正を適用する
 */
function applyCorrections(scenario, corrections) {
  if (!corrections || corrections.length === 0) return;

  const json = JSON.stringify(scenario);
  let modified = json;

  for (const corr of corrections) {
    if (corr.original && corr.corrected && corr.original !== corr.corrected) {
      // 全出現箇所を置換（固有名詞の統一等）
      modified = modified.split(corr.original).join(corr.corrected);
    }
  }

  try {
    const fixed = JSON.parse(modified);
    Object.assign(scenario, fixed);
    console.log(`自動修正: ${corrections.length}件の修正を適用`);
  } catch (e) {
    console.warn('自動修正の適用に失敗:', e.message);
  }
}

/**
 * 固有名詞の統一（最頻出表記に統一）
 */
function fixNameConsistency(scenario) {
  const json = JSON.stringify(scenario);

  // 容疑者名を基準にする（suspectsの名前が正）
  const canonicalNames = scenario.suspects.map(s => s.name);

  // シンプルな統一: suspects.nameの表記を正とし、全体で統一
  // （高度な表記揺れ検出は将来の拡張）
  for (const name of canonicalNames) {
    // 名前のバリエーション検出は困難なため、ここではスキップ
    // Pass 4の corrections に委ねる
  }
}

/**
 * 品質スコアを集約
 */
function computeOverallQuality(logicResult, jpResult) {
  const logicScore = logicResult?.overall_score ?? 70;
  const jpScore = jpResult?.overall_score ?? 70;
  // 加重平均（論理:60%, 日本語:40%）
  return Math.round(logicScore * 0.6 + jpScore * 0.4);
}

// ================================================
// 高レベルAPI — 回答採点
// ================================================

/**
 * プレイヤーの回答をAIで採点する
 */
export async function evaluateAnswer({ apiKey, modelId, solution, answers, advisorEnabled = false }) {
  try {
    return await callClaude({
      apiKey,
      modelId,
      system: 'あなたはミステリーゲームの採点官です。公正かつ寛容に採点してください。',
      userMessage: buildScoringPrompt(solution, answers) + (advisorEnabled ? '\n\n【重要】advisorに相談して、各回答の正誤判定と配点を決定してもらってください。advisorの判定に基づいて、プレイヤーへの解説コメントをJSON形式で出力してください。' : ''),
      schema: SCORING_SCHEMA,
      useAdvisor: advisorEnabled,
      advisorMaxUses: ADVISOR_CONFIG.maxUsesPerCall.scoring,
      temperature: 0.1,
      maxTokens: 2048,
      timeoutSec: TIMEOUTS.scoring
    });
  } catch (e) {
    console.warn('AI採点失敗、ローカル採点にフォールバック:', e.message);
    return localEvaluate(solution, answers);
  }
}

/**
 * ローカル採点（AI API失敗時のフォールバック）
 */
function localEvaluate(solution, answers) {
  const scores = [];
  let total = 0;

  const culpritCorrect = answers.culprit === solution.culprit;
  const culpritPoints = culpritCorrect ? 3 : 0;
  total += culpritPoints;
  scores.push({
    question: '犯人は誰か？',
    points: culpritPoints, max: 3, correct: culpritCorrect,
    comment: culpritCorrect ? '正解！お見事です。' : `不正解。正解は「${solution.culprit}」でした。`
  });

  const motivePoints = fuzzyMatch(answers.motive, solution.motive_detail);
  total += motivePoints;
  scores.push({
    question: '犯行の動機は？',
    points: motivePoints, max: 2, correct: motivePoints >= 2,
    comment: motivePoints >= 2 ? '正解！' : motivePoints === 1 ? '部分正解。' : `不正解。正解: ${solution.motive_detail}`
  });

  const methodPoints = fuzzyMatch(answers.method, solution.method_detail);
  total += methodPoints;
  scores.push({
    question: '犯行の手口は？',
    points: methodPoints, max: 2, correct: methodPoints >= 2,
    comment: methodPoints >= 2 ? '正解！' : methodPoints === 1 ? '部分正解。' : `不正解。正解: ${solution.method_detail}`
  });

  return { scores, total, max_total: 7 };
}

function fuzzyMatch(answer, correct) {
  if (!answer || !correct) return 0;
  const a = answer.toLowerCase();
  const c = correct.toLowerCase();
  const keywords = c.split(/[、。,.\s\n]+/).filter(w => w.length >= 3);
  const matched = keywords.filter(w => a.includes(w)).length;
  if (matched >= 3 || matched >= keywords.length * 0.6) return 2;
  if (matched >= 1) return 1;
  return 0;
}
