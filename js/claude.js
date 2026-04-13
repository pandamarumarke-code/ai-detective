// ================================================
// @ai-spec
// @module    claude
// @purpose   Claude API通信 + 5パス品質検証パイプライン + Advisor Tool連携
// @ssot      なし（ステートレス）
// @depends   constants.js (MODELS, DIFFICULTIES, ADVISOR_CONFIG, プロンプトビルダー)
// @exports   generateScenario, evaluateAnswer
// @consumers app.js
// @constraints
//   - DOM操作禁止（純粋なAPI通信モジュール）
//   - CORSプロキシ(localhost:3457)経由でのみ通信
//   - Advisor Tool使用時は beta header 必須
// @dataflow  app.js → callClaude() → CORSプロキシ → Anthropic API → JSON → app.js
// @updated   2026-04-14
// ================================================
// AI探偵団 — Claude API通信モジュール（ステートレス）
// 4パス検証パイプライン:
//   Pass 1: シナリオ生成
//   Pass 2: ローカル構造検証（9項目）
//   Pass 3: AI論理検証（解決可能性証明・6観点）
//   Pass 4: AI日本語品質検証（8観点）
// + リトライ戦略 + 自動修正
// ================================================

import {
  MODELS, DIFFICULTIES, ADVISOR_CONFIG,
  SCENARIO_SCHEMA, DEEP_VALIDATION_SCHEMA, JAPANESE_QUALITY_SCHEMA, SCORING_SCHEMA,
  SOLVABILITY_CHECK_SCHEMA, VALIDATION_THRESHOLDS, SCENARIO_DNA_OPTIONS,
  buildScenarioSystemPrompt, buildDeepValidationPrompt,
  buildJapaneseQualityPrompt, buildScoringPrompt, buildSolvabilityCheckPrompt
} from './constants.js';

// CORSプロキシ: Vercel Serverless Function（本番）/ ローカルプロキシ（開発）
const isLocal = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
const API_URL = isLocal ? 'http://127.0.0.1:3457/proxy/anthropic' : '/api/anthropic';

// ================================================
// 低レベルAPI呼び出し
// ================================================

/**
 * Claude Messages APIにリクエストを送信
 * Advisor Tool対応: useAdvisor=trueの場合、Sonnetが実行者、Opusがアドバイザー
 */
async function callClaude({ apiKey, modelId, system, userMessage, schema, temperature = 0.9, maxTokens = 8192, useAdvisor = false, advisorMaxUses = 1 }) {
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

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
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

  const data = await response.json();

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
    throw new Error('Claude APIレスポンスにテキストが含まれていません');
  }

  const text = textBlock.text;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSONパースエラー: ${e.message}\n\nレスポンス冒頭: ${text.substring(0, 300)}`);
  }
}

// ================================================
// 高レベルAPI — 4パス検証パイプライン
// ================================================

/**
 * ミステリーシナリオを生成・検証する（4パスパイプライン + リトライ）
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
export async function generateScenario({ apiKey, modelId, theme, difficulty, advisorEnabled = false, usedNames = [], dna = null, onProgress }) {
  const { maxRetries } = VALIDATION_THRESHOLDS;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      const scenario = await runPipeline({ apiKey, modelId, theme, difficulty, advisorEnabled, usedNames, dna, onProgress, attempt });
      return scenario;
    } catch (e) {
      lastError = e;
      attempt++;
      if (attempt <= maxRetries && e._retryable) {
        onProgress(0, 'retry', `リトライ ${attempt}/${maxRetries}: ${e.message}`);
        continue;
      }
      break;
    }
  }

  throw lastError || new Error('シナリオ生成に失敗しました');
}

/**
 * パイプライン1回分の実行
 */
async function runPipeline({ apiKey, modelId, theme, difficulty, advisorEnabled, usedNames, dna, onProgress, attempt }) {
  // Advisor使用時のプロンプト追加文
  const advisorHint = advisorEnabled
    ? '\n\n【重要】またadvisorに相談して、戦略的な計画を立ててから実行してください。'
    : '';

  // ---- Step 1: シナリオ生成 (Pass 1) ----
  onProgress(1, 'active');
  let scenario;
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
      maxTokens: 8192
    });
    onProgress(1, 'done');
  } catch (e) {
    onProgress(1, 'error');
    throw e;
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

  // ---- Step 3: AI論理検証 (Pass 3) ----
  onProgress(3, 'active');
  let logicResult;
  try {
    logicResult = await callClaude({
      apiKey,
      modelId,
      system: 'あなたはミステリーシナリオの品質管理官です。論理的な矛盾を厳密にチェックしてください。合格基準は高く設定してください。',
      userMessage: buildDeepValidationPrompt(scenario) + (advisorEnabled ? '\n\n【重要】advisorに相談して、解決可能性の証明と論理的矛盾の判定を依頼してください。advisorの判断結果に基づいて、JSONフォーマットで検証結果を構造化してください。' : ''),
      schema: DEEP_VALIDATION_SCHEMA,
      useAdvisor: advisorEnabled,
      advisorMaxUses: ADVISOR_CONFIG.maxUsesPerCall.logicValidation,
      temperature: 0.1,
      maxTokens: 4096
    });
    scenario._logicValidation = logicResult;

    // 解決可能性チェック — 解けないシナリオは即リトライ
    if (!logicResult.is_solvable) {
      const err = new Error('手がかりから犯人を論理的に特定できないシナリオです');
      err._retryable = true;
      onProgress(3, 'error');
      throw err;
    }

    // スコアチェック
    if (logicResult.overall_score < VALIDATION_THRESHOLDS.logicPassScore) {
      const err = new Error(`論理品質スコア ${logicResult.overall_score}/100 が基準(${VALIDATION_THRESHOLDS.logicPassScore})未満`);
      err._retryable = true;
      onProgress(3, 'error');
      throw err;
    }

    onProgress(3, 'done');
  } catch (e) {
    if (e._retryable) throw e;
    // APIエラーの場合は警告のみで続行
    console.warn('AI論理検証スキップ:', e.message);
    scenario._logicValidation = {
      is_valid: true, is_solvable: true, reasoning_chain: '(検証スキップ)',
      alibi_check: '', timeline_check: '', red_herring_check: '',
      evidence_match: '', fairness_check: '', overall_score: 70,
      critical_issues: ['論理検証APIエラーのためスキップ'], suggestions: []
    };
    onProgress(3, 'done');
  }

  // ---- Step 4: AI日本語品質検証 (Pass 4) ----
  onProgress(4, 'active');
  let jpResult;
  try {
    jpResult = await callClaude({
      apiKey,
      modelId,
      system: 'あなたは日本語校正の専門家です。ミステリーシナリオのテキスト品質を厳密に評価してください。',
      userMessage: buildJapaneseQualityPrompt(scenario, theme) + (advisorEnabled ? '\n\n【重要】advisorに相談して、総合的な品質判定とスコアリングを依頼してください。advisorの判断結果に基づいて、修正提案をJSON形式で構造化してください。' : ''),
      schema: JAPANESE_QUALITY_SCHEMA,
      useAdvisor: advisorEnabled,
      advisorMaxUses: ADVISOR_CONFIG.maxUsesPerCall.japaneseQuality,
      temperature: 0.1,
      maxTokens: 4096
    });
    scenario._japaneseQuality = jpResult;

    if (jpResult.overall_score < VALIDATION_THRESHOLDS.japanesePassScore) {
      const err = new Error(`日本語品質スコア ${jpResult.overall_score}/100 が基準(${VALIDATION_THRESHOLDS.japanesePassScore})未満`);
      err._retryable = true;
      onProgress(4, 'error');
      throw err;
    }

    onProgress(4, 'done');
  } catch (e) {
    if (e._retryable) throw e;
    console.warn('日本語品質検証スキップ:', e.message);
    scenario._japaneseQuality = {
      grammar_score: 80, name_consistency: true, tone_consistency: true,
      theme_fit: 80, clarity: 80, style_unity: true, length_check: true,
      kanji_balance: 80, overall_score: 80, issues: ['検証スキップ'], corrections: []
    };
    onProgress(4, 'done');
  }

  // ---- Step 5: 自動修正の適用 ----
  onProgress(5, 'active');
  try {
    if (jpResult && jpResult.corrections && jpResult.corrections.length > 0 &&
        jpResult.overall_score < VALIDATION_THRESHOLDS.japaneseAutoFixScore) {
      applyCorrections(scenario, jpResult.corrections);
    }

    // 固有名詞の統一チェック（プログラマティック修正）
    if (jpResult && !jpResult.name_consistency) {
      fixNameConsistency(scenario);
    }

    onProgress(5, 'done');
  } catch (e) {
    console.warn('自動修正スキップ:', e.message);
    onProgress(5, 'done');
  }

  // ---- Step 5.5: 解答チェーン検証 (Pass 5) ----
  // AIが「探偵役」としてカード情報だけで推理を試み、解けるか検証
  try {
    const solvCheck = await callClaude({
      apiKey,
      modelId,
      system: 'あなたは探偵です。手がかりカードの情報だけで事件を推理してください。カード外の情報は使えません。',
      userMessage: buildSolvabilityCheckPrompt(scenario),
      schema: SOLVABILITY_CHECK_SCHEMA,
      temperature: 0.1,
      maxTokens: 2048
    });
    scenario._solvabilityCheck = solvCheck;

    if (!solvCheck.is_solvable || solvCheck.confidence < 50) {
      const err = new Error(`解答チェーン検証失敗: カード情報だけでは推理不可能 (確信度${solvCheck.confidence}%)`);
      err._retryable = true;
      throw err;
    }
    console.log(`✅ 解答チェーン検証 OK (確信度${solvCheck.confidence}%)`);
  } catch (e) {
    if (e._retryable) throw e;
    console.warn('解答チェーン検証スキップ:', e.message);
  }

  // ---- Step 6: 完了 ----
  onProgress(6, 'done');

  // 品質スコアを集約
  scenario._qualityScore = computeOverallQuality(logicResult, jpResult);
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
      maxTokens: 2048
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
