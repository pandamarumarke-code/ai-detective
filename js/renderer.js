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
// @updated   2026-04-12
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
// 生成中画面
// ================================================

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
}

export function resetGenSteps() {
  for (let i = 1; i <= 8; i++) updateGenStep(i, '');
  $('#gen-error').style.display = 'none';
}

export function showGenRetry(message) {
  const el = $('#gen-retry');
  if (!el) return;
  el.style.display = 'flex';
  $('#gen-retry-text').textContent = message || 'リトライ中...';
  // 3秒後にリトライ表示を消す
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

export function showGenError(message) {
  $('#gen-error').style.display = 'block';
  $('#gen-error-text').textContent = message;
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

  // 場面設定画像（画像があれば導入テキストの前に挿入）
  const sceneBase64 = store.state.imageCache?.scene;
  const introEl = $('#intro-text');
  if (sceneBase64 && introEl) {
    introEl.insertAdjacentHTML('beforebegin',
      `<div class="scene-image"><img src="data:image/png;base64,${sceneBase64}" alt="事件の舞台" /></div>`);
  }

  introEl.textContent = s.introduction || '';
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
  
  let scoreText = `${adjustedTotal} / ${result.max_total} ポイント`;
  if (hintPenalty > 0) {
    scoreText += ` （ヒントペナルティ: -${hintPenalty}）`;
  }
  $('#result-score').textContent = scoreText;

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
  ['intro', 'investigation', 'answer'].forEach(p => {
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
