// ================================================
// @ai-spec
// @module    renderer
// @purpose   DOM描画モジュール。store.stateからDOMへの単方向データフロー
// @ssot      なし（store.stateを読んでDOMに反映するだけ）
// @depends   store.js, constants.js (THEMES, DIFFICULTIES, MODELS, ADVISOR_CONFIG, CARD_TYPE_LABELS, getRank), cards.js
// @exports   showScreen, renderTitleStats, initParticles, openModal, updateGenStep, resetGenSteps, renderIntro, renderInvestigation, renderResult, ...
// @consumers app.js
// @constraints
//   - 自前でstateを持たない（store.stateのみ参照）
//   - store.update() は呼ばない（app.jsが担当）
// @dataflow  store.state → renderer.js → DOM更新
// @updated   2026-04-14
// ================================================
// AI探偵団 — DOM描画モジュール（ステートからDOMへの単方向データフロー）
// store.stateを読み、DOMを更新するだけ。自前でstateは持たない。
// ================================================

import store from './store.js';
import { THEMES, DIFFICULTIES, MODELS, ADVISOR_CONFIG, CARD_TYPE_LABELS, getRank } from './constants.js';
import { createCardElement, setCardSelected, createRevealedCardItem, createClueListItem } from './cards.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ================================================
// タイプライター演出
// ================================================

let _typewriterAbort = null; // 現在実行中のタイプライターを中断するためのフラグ

/**
 * タイプライター演出でテキストを表1文字ずつ表示
 * @param {HTMLElement} el - 表示先要素
 * @param {string} text - 表示するテキスト
 * @param {number} speed - 1文字あたりのms (default: 25)
 * @returns {Promise<void>} 完了時にresolve
 */
function typewriterEffect(el, text, speed = 25) {
  // 前のタイプライターが実行中なら中断
  if (_typewriterAbort) _typewriterAbort.abort = true;
  
  const ctrl = { abort: false };
  _typewriterAbort = ctrl;
  
  el.textContent = '';
  el.classList.add('typewriter-active');
  
  return new Promise((resolve) => {
    let i = 0;
    function tick() {
      if (ctrl.abort) {
        // スキップ: 残りを一括表示
        el.textContent = text;
        el.classList.remove('typewriter-active');
        resolve();
        return;
      }
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        // 句読点・改行で一拍置く
        const pause = (text[i - 1] === '。' || text[i - 1] === '\n') ? speed * 8 : speed;
        setTimeout(tick, pause);
      } else {
        el.classList.remove('typewriter-active');
        _typewriterAbort = null;
        resolve();
      }
    }
    tick();
  });
}

/** タイプライターを即座にスキップ（残りテキストを一括表示） */
export function skipTypewriter() {
  if (_typewriterAbort) _typewriterAbort.abort = true;
}

// ================================================
// フェーズ別背景色変化
// ================================================

const PHASE_THEMES = [
  { hue: 220, saturation: 30, label: '導入' },        // ダークブルー（深夜の静寂）
  { hue: 240, saturation: 15, label: '第1調査' },     // ダークグレー（曇天）
  { hue: 350, saturation: 20, label: '第2調査' },     // 暗い赤み（緊張の高まり）
  { hue: 40,  saturation: 25, label: '第3調査' },     // 黄金のハイライト（真実への接近）
  { hue: 30,  saturation: 35, label: '推理提出' },    // 純金（決断の瞬間）
];

/**
 * フェーズに応じた背景色を動的に切り替え
 * @param {number} phaseIndex - 0=導入, 1-3=調査, 4=推理
 */
function setPhaseTheme(phaseIndex) {
  const theme = PHASE_THEMES[Math.min(phaseIndex, PHASE_THEMES.length - 1)];
  const root = document.documentElement;
  root.style.setProperty('--phase-hue', theme.hue);
  root.style.setProperty('--phase-saturation', `${theme.saturation}%`);
}

// ================================================
// 画面遷移
// ================================================

export function showScreen(screenId) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $(`#screen-${screenId}`);
  if (el) el.classList.add('active');
  store.update({ currentScreen: screenId });
}

// ================================================
// タイトル画面
// ================================================

export function renderTitleStats() {
  const { history, caseCounter } = store.state;
  const el = $('#title-stats');
  if (!el) return;
  if (history.length === 0) {
    el.innerHTML = '';
    return;
  }
  const solved = history.filter(h => h.score >= 5).length;
  el.innerHTML = `
    <div class="stat"><span class="stat-value">${history.length}</span>事件挑戦</div>
    <div class="stat"><span class="stat-value">${solved}</span>事件解決</div>
    <div class="stat"><span class="stat-value">${caseCounter}</span>累計ファイル</div>
  `;
}

/**
 * 無料プレイバッジを更新（タイトル画面に表示）
 */
export function renderFreePlayBadge() {
  const el = $('#free-play-badge');
  if (!el) return;

  const { freePlayRemaining, apiKey } = store.state;

  // BYOKモード（自前APIキー設定済み）→ バッジ非表示
  if (apiKey) {
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';
  if (freePlayRemaining > 0) {
    el.innerHTML = `<span class="free-badge free-badge--active">🎁 無料プレイ 残り <strong>${freePlayRemaining}</strong> 回</span>`;
  } else {
    el.innerHTML = `<span class="free-badge free-badge--expired">無料枠を使い切りました — <a href="#" id="link-setup-apikey">APIキーを設定</a></span>`;
    // 設定画面へのリンク
    el.querySelector('#link-setup-apikey')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('settings');
    });
  }
}

/**
 * 無料枠切れアラート表示
 */
export function showFreePlayLimitAlert() {
  const msg = '今月の無料プレイ（月3回）を使い切りました。\n\n' +
    '引き続きプレイするには、設定画面からClaude APIキーを入力してください。\n' +
    '（APIキーの取得方法はセットアップガイドをご覧ください）';
  alert(msg);
}

export function initParticles() {
  const container = $('#particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.animationDuration = `${4 + Math.random() * 4}s`;
    container.appendChild(p);
  }
}

// ================================================
// 生成中画面のタイマー管理
let _genStartTime = null;
let _genElapsedTimer = null;
let _stepStartTimes = {};
let _completedSteps = 0;
const TOTAL_STEPS = 8;

// Step 1が長時間かかる時のサブメッセージ（ローテーション表示）
const GEN_SUB_MESSAGES = [
  'AIが事件の舞台を構想しています...',
  '容疑者のアリバイを組み立てています...',
  'レッドヘリング（偽の手がかり）を仕込んでいます...',
  'フェアプレイ原則に基づく推理を設計中...',
  '犯行の動機とトリックを練り上げています...',
  '手がかりカードの内容を精査しています...',
  '暗転シーン（犯人の独白）を作成中...',
];
let _subMsgIndex = 0;
let _subMsgTimer = null;

export function updateGenStep(step, status, detail) {
  // step=0はリトライ通知（特別処理）
  if (step === 0 && status === 'retry') {
    showGenRetry(detail);
    resetGenSteps();
    return;
  }

  const el = $(`#gen-step-${step}`);
  if (!el) return;
  el.className = `gen-step ${status}`;
  const icon = el.querySelector('.gen-step-icon');
  if (icon) {
    const icons = { done: '✅', active: '🔄', error: '❌', retry: '🔄' };
    icon.textContent = icons[status] || '⏳';
  }

  // ステップ開始時刻を記録
  if (status === 'active') {
    _stepStartTimes[step] = Date.now();
    // Step 1開始時にサブメッセージ表示を開始
    if (step === 1) startSubMessages();
  }

  // ステップ完了時: 所要時間を表示
  if (status === 'done') {
    const timeEl = $(`#gen-time-${step}`);
    if (timeEl && _stepStartTimes[step]) {
      const elapsed = ((Date.now() - _stepStartTimes[step]) / 1000).toFixed(1);
      timeEl.textContent = `(${elapsed}秒)`;
    }
    _completedSteps++;
    updateProgressBar();
    // サブメッセージを停止
    if (step === 1) stopSubMessages();
  }

  // エラー時: サブメッセージを停止
  if (status === 'error') {
    stopSubMessages();
    stopElapsedTimer();
  }
}

function updateProgressBar() {
  const fill = $('#gen-progress-fill');
  const label = $('#gen-progress-label');
  if (fill) {
    const pct = Math.round((_completedSteps / TOTAL_STEPS) * 100);
    fill.style.width = `${pct}%`;
  }
  if (label) {
    label.textContent = `${_completedSteps} / ${TOTAL_STEPS} ステップ`;
  }
}

function startElapsedTimer() {
  _genStartTime = Date.now();
  _genElapsedTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - _genStartTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = String(elapsed % 60).padStart(2, '0');
    const el = $('#gen-elapsed');
    if (el) el.textContent = `⏱️ ${min}:${sec} 経過`;
  }, 1000);
}

function stopElapsedTimer() {
  if (_genElapsedTimer) {
    clearInterval(_genElapsedTimer);
    _genElapsedTimer = null;
  }
}

function startSubMessages() {
  _subMsgIndex = 0;
  const el = $('#gen-submessage');
  const textEl = $('#gen-submessage-text');
  if (el) el.style.display = 'block';
  if (textEl) textEl.textContent = GEN_SUB_MESSAGES[0];

  _subMsgTimer = setInterval(() => {
    _subMsgIndex = (_subMsgIndex + 1) % GEN_SUB_MESSAGES.length;
    if (textEl) textEl.textContent = GEN_SUB_MESSAGES[_subMsgIndex];
  }, 5000);
}

function stopSubMessages() {
  if (_subMsgTimer) {
    clearInterval(_subMsgTimer);
    _subMsgTimer = null;
  }
  const el = $('#gen-submessage');
  if (el) el.style.display = 'none';
}

export function resetGenSteps() {
  for (let i = 1; i <= 8; i++) updateGenStep(i, '');
  $('#gen-error').style.display = 'none';
  _completedSteps = 0;
  _stepStartTimes = {};
  // プログレスバーリセット
  const fill = $('#gen-progress-fill');
  if (fill) fill.style.width = '0%';
  const label = $('#gen-progress-label');
  if (label) label.textContent = '0 / 8 ステップ';
  // タイマー開始
  stopElapsedTimer();
  stopSubMessages();
  startElapsedTimer();
}

export function showGenRetry(message) {
  const el = $('#gen-retry');
  if (!el) return;
  el.style.display = 'flex';
  $('#gen-retry-text').textContent = message || 'リトライ中...';
  // 3秒後にリトライ表示を消す
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

export function showGenError(message, hasPartialScenario = false) {
  $('#gen-error').style.display = 'block';
  $('#gen-error-text').textContent = message;
  // フォールバックボタン: シナリオの有無に応じてテキストを出し分け
  const debugBtnArea = $('#gen-error-debug');
  if (debugBtnArea) {
    const btnLabel = hasPartialScenario
      ? '▶️ 検証をスキップしてプレイ開始（生成済みシナリオを使用）'
      : '🔧 モックデータでお試しプレイ（API不要）';
    debugBtnArea.innerHTML = `
      <button class="btn btn-ghost" id="btn-try-debug" style="margin-top:12px;font-size:0.85rem;opacity:0.8;">
        ${btnLabel}
      </button>
    `;
    debugBtnArea.querySelector('#btn-try-debug')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('debug:fallbackGenerate'));
    });
  }
}

// ================================================
// ゲーム画面 — 導入
// ================================================

export function renderIntro() {
  const s = store.state.scenario;
  if (!s) return;

  $('#case-number').textContent = `#${String(store.state.caseCounter).padStart(3, '0')}`;
  $('#case-title').textContent = s.title || '不明な事件';
  updateProgress(0);
  setPhaseTheme(0); // 導入: ダークブルー

  // 場面設定画像（画像があれば導入テキストの前に挿入）
  // ※連続プレイ時の重複防止: 既存のscene-imageを先に削除
  const oldScene = document.querySelector('.scene-image');
  if (oldScene) oldScene.remove();

  const sceneData = store.state.imageCache?.scene;
  const introEl = $('#intro-text');
  if (sceneData && introEl) {
    // base64文字列かURLパスかを判定
    const imgSrc = sceneData.startsWith('data:') || sceneData.length > 200
      ? `data:image/png;base64,${sceneData}`
      : sceneData;
    introEl.insertAdjacentHTML('beforebegin',
      `<div class="scene-image"><img src="${imgSrc}" alt="事件の舞台" /></div>`);
  }

  // タイプライター演出で導入文を表示
  const introText = s.introduction || '';
  typewriterEffect(introEl, introText, 20);

  if (s.victim) {
    $('#victim-info').innerHTML = `
      <p><strong>${escapeHTML(s.victim.name)}</strong>（${s.victim.age}歳） — ${escapeHTML(s.victim.role)}</p>
      <p>死因: ${escapeHTML(s.victim.cause_of_death)}</p>
    `;
  }

  renderSuspectList();
  renderClueList();
  showGamePanel('intro');
}

// ================================================
// ゲーム画面 — 調査フェイズ
// ================================================

/**
 * 暗転シーン（犯人視点フラッシュバック）を表示
 * @param {number} flashbackIndex - 0始まりのフラッシュバックインデックス
 * @param {Function} onContinue - 「調査を続ける」ボタンのコールバック
 */
export function renderBlackoutScene(flashbackIndex, onContinue) {
  const flashbacks = store.state.scenario.culprit_flashbacks;
  if (!flashbacks || !flashbacks[flashbackIndex]) {
    // フラッシュバックがなければスキップ
    onContinue();
    return;
  }

  const fb = flashbacks[flashbackIndex];

  // ネタバレ防止フィルタ（最終防壁）: 犯人名・容疑者名を伏字化
  let text = fb.monologue;
  const culpritName = store.state.scenario.solution?.culprit
    || store.state.scenario.suspects?.find(s => s.is_culprit)?.name;
  if (culpritName && text.includes(culpritName)) {
    text = text.replaceAll(culpritName, '■■■');
  }
  // 他の容疑者名も独白からは除去（犯人特定の手がかりになるため）
  (store.state.scenario.suspects || []).forEach(s => {
    if (s.name && text.includes(s.name)) {
      text = text.replaceAll(s.name, '■■■');
    }
  });

  // タイプライター演出で犯人の独白を表示
  const monoEl = $('#blackout-monologue');
  typewriterEffect(monoEl, text, 40); // 暗転シーンはゆっくりめ

  // 「調査を続ける」ボタンのイベントリスナー
  const btn = $('#btn-continue-after-blackout');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    skipTypewriter();
    onContinue();
  });

  showGamePanel('blackout');
}

/**
 * 物語展開画面を表示（マーダーミステリー型進行）
 * カード選択の前にストーリーの展開を見せる
 * @param {number} phaseIndex
 * @param {Function} onContinue - 「調査を開始する」ボタンのコールバック
 */
export function renderPhaseNarrative(phaseIndex, onContinue) {
  const phase = store.state.scenario.investigation_phases[phaseIndex];
  if (!phase?.phase_narrative) {
    // phase_narrativeがなければスキップして直接カード画面へ
    onContinue();
    return;
  }

  // フェーズ別背景色変化
  setPhaseTheme(phaseIndex + 1);

  // タイトルとテキストを設定
  $('#narrative-title').textContent = phase.phase_title || `第${phaseIndex + 1}幕`;
  // タイプライター演出で物語展開を表示
  const narEl = $('#narrative-text');
  typewriterEffect(narEl, phase.phase_narrative, 25);

  // 「調査を開始する」ボタンのイベントリスナーを設定
  const btn = $('#btn-continue-investigation');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    skipTypewriter();
    onContinue();
  });

  showGamePanel('narrative');
}

/**
 * @param {number} phaseIndex - 0始まりのフェイズインデックス
 * @param {Function} onCardToggle - カード選択変更時コールバック
 */
export function renderInvestigationPhase(phaseIndex, onCardToggle) {
  const s = store.state.scenario;
  const phase = s.investigation_phases[phaseIndex];
  if (!phase) return;

  store.update({ currentPhase: phaseIndex + 1 });
  updateProgress(phaseIndex + 1);

  $('#phase-title').textContent = `第${phaseIndex + 1}調査`;
  $('#phase-instruction').textContent = `${phase.cards.length}枚の手がかりカードから${phase.selectable}枚を選んでください`;

  // カード生成
  const cardsArea = $('#cards-area');
  cardsArea.innerHTML = '';
  phase.cards.forEach((card, idx) => {
    const el = createCardElement(card, idx, onCardToggle);
    cardsArea.appendChild(el);
  });

  // 選択カウント
  updateSelectionCount(0, phase.selectable);
  $('#btn-confirm-cards').disabled = true;
  $('#btn-confirm-cards').style.display = '';
  $('#btn-next-phase').style.display = 'none';

  renderRevealedCards();
  showGamePanel('investigation');
}

export function updateSelectionCount(current, max) {
  $('#selection-count').textContent = current.toString();
  $('#selection-max').textContent = max.toString();
  $('#btn-confirm-cards').disabled = current !== max;
}

/**
 * カードエリアの各カードの選択状態をstateと同期
 */
export function syncCardSelections() {
  const selectedIds = store.state.selectedCards.map(c => c.id);
  $$('.clue-card').forEach(el => {
    setCardSelected(el, selectedIds.includes(el.dataset.cardId));
  });
}

export function renderRevealedCards() {
  const { revealedCards } = store.state;
  const section = $('#revealed-section');
  const container = $('#revealed-cards');

  if (revealedCards.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  container.innerHTML = '';
  revealedCards.forEach(card => {
    container.appendChild(createRevealedCardItem(card));
  });
}

export function showNextPhaseButton(text, onClick) {
  const btn = $('#btn-next-phase');
  btn.style.display = '';
  btn.textContent = text;
  // 古いリスナーを除去して新規設定
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', onClick);
}

// ================================================
// ゲーム画面 — ヒント
// ================================================

export function renderHintButton(hints, hintsUsed, onClick) {
  let container = $('#hint-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hint-container';
    container.className = 'hint-container';
    // 調査パネルの末尾に追加
    $('#panel-investigation').appendChild(container);
  }

  if (!hints || hintsUsed >= hints.length) {
    container.innerHTML = '<p class="hint-exhausted">💡 すべてのヒントを使い切りました</p>';
    return;
  }

  const nextHint = hints[hintsUsed];
  container.innerHTML = `
    <button class="btn btn-ghost hint-btn" id="btn-use-hint">
      💡 ヒント${hintsUsed + 1}を使う（-${nextHint.penalty}点）
    </button>
    <div class="hint-history" id="hint-history"></div>
  `;

  // 過去のヒント表示
  const historyEl = container.querySelector('#hint-history');
  for (let i = 0; i < hintsUsed; i++) {
    const div = document.createElement('div');
    div.className = 'hint-item';
    div.innerHTML = `<span class="hint-label">ヒント${i + 1}:</span> ${escapeHTML(hints[i].text)}`;
    historyEl.appendChild(div);
  }

  container.querySelector('#btn-use-hint').addEventListener('click', () => onClick(nextHint));
}

export function showHintText(hint, hintsUsed) {
  const historyEl = $('#hint-history');
  if (!historyEl) return;
  const div = document.createElement('div');
  div.className = 'hint-item hint-new';
  div.innerHTML = `<span class="hint-label">ヒント${hintsUsed}:</span> ${escapeHTML(hint.text)}`;
  historyEl.appendChild(div);
}

// ================================================
// ゲーム画面 — 回答
// ================================================

export function renderAnswerPhase() {
  store.update({ currentPhase: 4 });
  updateProgress(4);
  setPhaseTheme(4); // 推理提出: 純金（決断の瞬間）

  const choices = $('#suspect-choices');
  choices.innerHTML = '';
  store.state.scenario.suspects.forEach(sus => {
    const btn = document.createElement('button');
    btn.className = 'suspect-choice';
    btn.textContent = sus.name;
    btn.addEventListener('click', () => {
      $$('.suspect-choice').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      store.update({ playerAnswers: { ...store.state.playerAnswers, culprit: sus.name } });
    });
    choices.appendChild(btn);
  });

  $('#answer-motive').value = '';
  $('#answer-method').value = '';

  // 推理メモを回答画面に表示
  const memoText = store.state.deductionMemo || '';
  const memoRef = $('#deduction-memo-ref');
  const memoRefContent = $('#deduction-memo-ref-content');
  if (memoText.trim()) {
    memoRefContent.textContent = memoText;
    memoRef.style.display = 'block';
  } else {
    memoRef.style.display = 'none';
  }

  showGamePanel('answer');
}

// ================================================
// 結果画面
// ================================================

export function renderResult() {
  const { result, scenario, playerAnswers, hintPenalty } = store.state;
  if (!result) return;

  const adjustedTotal = Math.max(0, result.total - hintPenalty);
  const ratio = adjustedTotal / result.max_total;
  const rank = getRank(ratio);

  $('#result-badge').textContent = rank.badge;
  $('#result-title').textContent = rank.title;
  $('#result-title').style.color = rank.color || '';
  
  // スコアカウントアップ演出
  const scoreEl = $('#result-score');
  let scoreDisplay = `${adjustedTotal} / ${result.max_total} ポイント`;
  if (hintPenalty > 0) {
    scoreDisplay += ` （ヒントペナルティ: -${hintPenalty}）`;
  }
  // 0からカウントアップ
  let currentScore = 0;
  scoreEl.textContent = `0 / ${result.max_total} ポイント`;
  const scoreInterval = setInterval(() => {
    currentScore++;
    if (currentScore >= adjustedTotal) {
      currentScore = adjustedTotal;
      clearInterval(scoreInterval);
      scoreEl.textContent = scoreDisplay;
    } else {
      scoreEl.textContent = `${currentScore} / ${result.max_total} ポイント`;
    }
  }, 120);

  // 答え合わせ
  const answersEl = $('#result-answers');
  answersEl.innerHTML = '';
  result.scores.forEach(sc => {
    const div = document.createElement('div');
    div.className = 'result-answer-item';
    div.innerHTML = `
      <span class="result-check">${sc.correct ? '✅' : '❌'}</span>
      <div class="result-answer-body">
        <div class="result-question">${escapeHTML(sc.question)}</div>
        <div class="result-your-answer">あなたの回答: ${escapeHTML(getPlayerAnswerText(sc.question, playerAnswers))}</div>
        <div class="result-correct-answer">${escapeHTML(sc.comment)}</div>
        <div class="result-points">${sc.points} / ${sc.max} ポイント</div>
      </div>
    `;
    answersEl.appendChild(div);
  });

  // 事件の真相
  const solutionText = scenario.full_story || `
犯人: ${scenario.solution.culprit}
動機: ${scenario.solution.motive_detail}
手口: ${scenario.solution.method_detail}
${scenario.solution.timeline ? `\n時系列: ${scenario.solution.timeline}` : ''}
`.trim();
  $('#result-solution-text').textContent = solutionText;

  // 履歴に保存
  store.addHistory({
    date: new Date().toISOString(),
    title: scenario.title,
    theme: store.state.theme,
    difficulty: store.state.difficulty,
    score: adjustedTotal,
    maxScore: result.max_total,
    badge: rank.badge,
    rank: rank.title
  });

  // Sprint 5: MPモードUI調整
  const isMp = typeof window.Multiplayer !== 'undefined' && window.Multiplayer.isActive();
  const newCaseBtn = $('#btn-new-case');
  const backTitleBtn = $('#btn-back-title');
  const shareSection = document.querySelector('.share-section');
  const submissionBar = $('#mp-submission-bar');
  const rankingContainer = $('#mp-ranking-container');

  if (isMp) {
    // ボタンテキスト変更
    newCaseBtn.innerHTML = '🏠 ロビーに戻る';
    backTitleBtn.innerHTML = '🚪 マルチプレイを終了';
    // シェアセクション非表示
    if (shareSection) shareSection.style.display = 'none';
    // 提出状況バー初期表示
    const totalPlayers = window.Multiplayer.state.players.length;
    const submitted = Object.keys(window.Multiplayer.state.submissions).length;
    if (submissionBar) {
      submissionBar.innerHTML = `
        <div class="submission-progress">
          <span>提出状況: ${submitted} / ${totalPlayers}</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(submitted / totalPlayers) * 100}%"></div>
          </div>
        </div>
      `;
    }
    // ランキングコンテナリセット（全員提出後に注入される）
    if (rankingContainer) rankingContainer.innerHTML = '';
  } else {
    // ソロモード: 通常テキスト
    newCaseBtn.innerHTML = '🔍 新しい事件に挑む';
    backTitleBtn.innerHTML = '🏠 タイトルに戻る';
    if (shareSection) shareSection.style.display = '';
    if (submissionBar) submissionBar.innerHTML = '';
    if (rankingContainer) rankingContainer.innerHTML = '';
  }

  showScreen('result');
}

// ================================================
// サイドバー
// ================================================

export function renderSuspectList() {
  const suspectList = $('#suspect-list');
  if (!suspectList) return;
  suspectList.innerHTML = '';
  const suspects = store.state.scenario?.suspects || [];
  const portraits = store.state.imageCache?.portraits || {};

  suspects.forEach(sus => {
    const div = document.createElement('div');
    div.className = 'suspect-item';

    // ポートレート画像
    const portraitBase64 = portraits[sus.name];
    const portraitHtml = portraitBase64
      ? `<div class="suspect-portrait"><img src="data:image/png;base64,${portraitBase64}" alt="${escapeHTML(sus.name)}" /></div>`
      : `<div class="suspect-portrait-placeholder">👤</div>`;

    div.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        ${portraitHtml}
        <div style="flex:1;min-width:0;">
          <div class="suspect-name">${escapeHTML(sus.name)}（${sus.age}歳）</div>
          <div class="suspect-role">${escapeHTML(sus.role)}</div>
          <div class="suspect-detail">
            <p>関係: ${escapeHTML(sus.relationship)}</p>
            <p>性格: ${escapeHTML(sus.personality)}</p>
            <p>アリバイ: 「${escapeHTML(sus.alibi)}」</p>
          </div>
        </div>
      </div>
    `;
    suspectList.appendChild(div);
  });
}

export function renderClueList() {
  const list = $('#clue-list');
  if (!list) return;
  const { revealedCards } = store.state;
  if (revealedCards.length === 0) {
    list.innerHTML = '<p class="clue-empty">まだ手がかりがありません</p>';
    return;
  }
  list.innerHTML = '';
  revealedCards.forEach(card => list.appendChild(createClueListItem(card)));
}

// ================================================
// モーダル
// ================================================

export function openModal(type) {
  const modal = $(`#modal-${type}`);
  if (modal) modal.classList.add('open');

  if (type === 'settings') {
    // Claude設定
    $('#api-key').value = store.state.apiKey;
    const modelSelect = $('#model-select');
    if (modelSelect) modelSelect.value = store.state.modelId;

    // Gemini設定
    const geminiKeyEl = $('#gemini-api-key');
    if (geminiKeyEl) geminiKeyEl.value = store.state.geminiApiKey;
    const imgModelEl = $('#image-model-select');
    if (imgModelEl) imgModelEl.value = store.state.imageModelId;
    const sw = $('#switch-image-enabled');
    if (sw) {
      sw.classList.toggle('on', store.state.imageEnabled);
      const label = $('#switch-label');
      if (label) label.textContent = store.state.imageEnabled ? '有効' : '無効';
    }

    // AI設定タブをデフォルトで表示
    $$('.settings-tab').forEach(t => t.classList.remove('active'));
    $$('.settings-panel').forEach(p => p.classList.remove('active'));
    const aiTab = document.querySelector('[data-settings-tab="ai"]');
    const aiPanel = $('#settings-panel-ai');
    if (aiTab) aiTab.classList.add('active');
    if (aiPanel) aiPanel.classList.add('active');

    // Advisor設定
    const advSw = $('#switch-advisor-enabled');
    if (advSw) {
      advSw.classList.toggle('on', store.state.advisorEnabled);
      const advLabel = $('#advisor-switch-label');
      if (advLabel) advLabel.textContent = store.state.advisorEnabled ? '有効' : '無効';
    }
  }

  if (type === 'history') renderHistoryList();
}

export function closeModal(type) {
  const modal = $(`#modal-${type}`);
  if (modal) modal.classList.remove('open');
}

export function renderHistoryList() {
  const list = $('#history-list');
  const { history } = store.state;
  if (history.length === 0) {
    list.innerHTML = '<p class="history-empty">まだ事件記録がありません</p>';
    return;
  }
  list.innerHTML = '';
  history.forEach(h => {
    const div = document.createElement('div');
    div.className = 'history-item';
    const dateStr = new Date(h.date).toLocaleDateString('ja-JP');
    div.innerHTML = `
      <span class="history-rank">${h.badge}</span>
      <div class="history-info">
        <div class="history-title">${escapeHTML(h.title)}</div>
        <div class="history-meta">${dateStr} | ${THEMES[h.theme]?.name || h.theme} | ${h.rank} (${h.score}/${h.maxScore})</div>
      </div>
    `;
    list.appendChild(div);
  });
}

// ================================================
// ユーティリティ
// ================================================

function showGamePanel(panel) {
  ['intro', 'blackout', 'narrative', 'investigation', 'answer'].forEach(p => {
    const el = $(`#panel-${p}`);
    if (el) el.style.display = p === panel ? 'block' : 'none';
  });
}

function updateProgress(phase) {
  const labels = ['導入', '第1調査', '第2調査', '第3調査', '回答'];
  const percent = (phase / 4) * 100;
  const fill = $('#progress-fill');
  if (fill) fill.style.width = `${percent}%`;
  const label = $('#progress-label');
  if (label) label.textContent = labels[phase] || '';
}

function getPlayerAnswerText(question, answers) {
  if (question.includes('犯人')) return answers.culprit || '（未回答）';
  if (question.includes('動機')) return answers.motive || '（未回答）';
  if (question.includes('手口')) return answers.method || '（未回答）';
  return '（不明）';
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ================================================
// シェア機能 UI
// ================================================

/**
 * 共有シナリオ受信画面を描画
 */
export function renderSharedScreen(meta) {
  $('#shared-title').textContent = `📁 CASE: ${escapeHTML(meta.title)}`;

  const theme = THEMES[meta.theme];
  const diff = DIFFICULTIES[meta.difficulty];

  $('#shared-meta').innerHTML = `
    <div class="shared-meta-item">${theme?.icon || '🔍'} ${theme?.name || meta.theme}</div>
    <div class="shared-meta-item">${diff?.stars || '⭐'} ${diff?.name || meta.difficulty}</div>
  `;

  const infoItems = [];
  if (meta.qualityScore > 0) {
    infoItems.push(`<div class="shared-info-item">📊 品質スコア: ${meta.qualityScore}/100</div>`);
  }
  infoItems.push(`<div class="shared-info-item">👤 共有者: ${escapeHTML(meta.sharedBy)}</div>`);
  infoItems.push(`<div class="shared-info-item">📅 ${meta.sharedAt}</div>`);
  $('#shared-info').innerHTML = infoItems.join('');
}

/**
 * Toast通知を表示
 */
export function showToast(message, duration = 3000) {
  const toast = $('#toast');
  const text = $('#toast-text');
  if (!toast || !text) return;

  text.textContent = message;
  toast.style.display = 'flex';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, duration);
}

// ================================================
// プリセットシナリオ選択一覧
// ================================================

const THEME_ICONS = { classic: '🏛️', school: '🏫', sf: '🚀', japanese: '⛩️', noir: '🌃', fantasy: '🧙' };
const DIFFICULTY_STARS = { easy: '⭐', normal: '⭐⭐', hard: '⭐⭐⭐' };
const DIFFICULTY_LABELS = { easy: 'ビギナー', normal: 'スタンダード', hard: 'ハード' };

export function renderPresetList(presets, onSelect) {
  const grid = $('#presets-grid');
  grid.innerHTML = '';

  presets.forEach((preset, i) => {
    const card = document.createElement('button');
    card.className = 'preset-card';
    card.style.animationDelay = `${i * 0.06}s`;

    const themeIcon = THEME_ICONS[preset.theme] || '🔍';
    const stars = DIFFICULTY_STARS[preset.difficulty] || '⭐⭐';
    const diffLabel = DIFFICULTY_LABELS[preset.difficulty] || 'スタンダード';
    const introPreview = preset.introduction.substring(0, 80) + '…';

    card.innerHTML = `
      <div class="preset-card-header">
        <span class="preset-theme-icon">${themeIcon}</span>
        <span class="preset-difficulty">${stars} ${diffLabel}</span>
      </div>
      <h3 class="preset-card-title">${escapeHTML(preset.title)}</h3>
      <p class="preset-card-setting">${escapeHTML(preset.setting.location)}</p>
      <p class="preset-card-preview">${escapeHTML(introPreview)}</p>
      <div class="preset-card-footer">
        <span class="preset-suspects">👤 容疑者${preset.suspects.length}人</span>
        <span class="preset-phases">📋 ${preset.investigation_phases.length}幕構成</span>
      </div>
    `;

    card.addEventListener('click', () => onSelect(preset));
    grid.appendChild(card);
  });
}
