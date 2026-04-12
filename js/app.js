// ================================================
// @ai-spec
// @module    app
// @purpose   エントリポイント。イベント配線・画面遷移・ゲームフロー制御のオーケストレーター
// @ssot      なし（他モジュールを統合するだけ）
// @depends   store.js, constants.js, claude.js, gemini.js, cards.js, share.js, renderer.js
// @exports   なし（自己起動型エントリポイント）
// @consumers index.html (type="module" で読み込み)
// @constraints
//   - DOM直接操作禁止（renderer.jsに委譲）
//   - 状態変更は store.update() 経由
//   - 自前で状態を持たない
// @dataflow  index.html → app.js → claude/gemini → store → renderer
// @updated   2026-04-12
// ================================================
// AI探偵団 — メインアプリケーション（エントリポイント）
// イベント配線・画面遷移・ゲームフロー制御
// 自身はDOMを直接操作せず、renderer.jsに委譲する
// ================================================

import store from './store.js';
import { DIFFICULTIES } from './constants.js';
import { generateScenario, evaluateAnswer } from './claude.js';
import { generateSceneImages, generateCardImages } from './gemini.js';
import { animateCardReveal } from './cards.js';
import { detectSharedScenario, generateShareURL, shareURL, revealSharedSolution } from './share.js';
import * as R from './renderer.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ================================================
// ゲームフロー制御
// ================================================

/** シナリオ生成を開始 */
async function startGeneration() {
  const { apiKey, modelId, theme, difficulty } = store.state;
  if (!apiKey) {
    R.openModal('settings');
    return;
  }

  R.showScreen('generating');
  R.resetGenSteps();
  store.resetGame();

  try {
    const scenario = await generateScenario({
      apiKey,
      modelId,
      theme,
      difficulty,
      advisorEnabled: store.state.advisorEnabled,
      onProgress: (step, status, detail) => R.updateGenStep(step, status, detail)
    });

    store.update({ scenario });

    // ---- 画像生成フェーズ（条件付き） ----
    const { geminiApiKey, imageEnabled, imageModelId } = store.state;

    if (geminiApiKey && imageEnabled) {
      // Step 6: 場面画像 + 容疑者ポートレート
      R.updateGenStep(6, 'active');
      try {
        await generateSceneImages({
          geminiApiKey,
          imageModelId,
          scenario,
          themeId: theme,
          onImageReady: (type, id, base64) => {
            if (type === 'scene')    store.setSceneImage(base64);
            if (type === 'portrait') store.setPortraitImage(id, base64);
          }
        });
        R.updateGenStep(6, 'done');
      } catch (imgErr) {
        console.warn('画像生成スキップ:', imgErr.message);
        R.updateGenStep(6, 'done'); // エラーでも続行
      }

      // Step 7: 第1フェイズのカード画像
      R.updateGenStep(7, 'active');
      try {
        await generateCardImages({
          geminiApiKey,
          imageModelId,
          scenario,
          phaseIndex: 0,
          themeId: theme,
          onImageReady: (cardId, base64) => store.setCardImage(cardId, base64)
        });
        R.updateGenStep(7, 'done');
      } catch (imgErr) {
        console.warn('カード画像生成スキップ:', imgErr.message);
        R.updateGenStep(7, 'done');
      }
    } else {
      // 画像OFF: Step 6-7をスキップ
      R.updateGenStep(6, 'done');
      R.updateGenStep(7, 'done');
    }

    // Step 8: 完了
    R.updateGenStep(8, 'done');
    store.incrementCase();

    setTimeout(() => {
      R.renderIntro();
      R.showScreen('game');
    }, 500);
  } catch (e) {
    console.error('シナリオ生成エラー:', e);
    R.showGenError(`エラー: ${e.message}`);
  }
}

/** 共有シナリオでゲームを開始（APIキー不要） */
function startSharedGame() {
  const { scenario } = store.state;
  if (!scenario) return;

  store.incrementCase();
  R.renderIntro();
  R.showScreen('game');
}

/** 調査フェイズを開始 */
function startInvestigation(phaseIndex) {
  const s = store.state.scenario;
  if (!s) return;

  if (phaseIndex >= s.investigation_phases.length) {
    R.renderAnswerPhase();
    return;
  }

  const phase = s.investigation_phases[phaseIndex];
  const selectable = phase.selectable || 2;

  store.update({ selectedCards: [], currentPhase: phaseIndex + 1 });

  R.renderInvestigationPhase(phaseIndex, (card, isSelected) => {
    if (isSelected && store.state.selectedCards.length >= selectable) return;
    store.toggleCard(card, isSelected);
    R.syncCardSelections();
    R.updateSelectionCount(store.state.selectedCards.length, selectable);
  });

  const hints = s.hints || [];
  R.renderHintButton(hints, store.state.hintsUsed, (hint) => {
    store.useHint(hint.penalty);
    R.showHintText(hint, store.state.hintsUsed);
    R.renderHintButton(hints, store.state.hintsUsed, () => {});
  });

  // バックグラウンドで次フェイズのカード画像を先行生成
  const { geminiApiKey, imageEnabled, imageModelId, theme } = store.state;
  if (geminiApiKey && imageEnabled) {
    const nextPhase = phaseIndex + 1;
    if (nextPhase < s.investigation_phases.length) {
      generateCardImages({
        geminiApiKey,
        imageModelId,
        scenario: s,
        phaseIndex: nextPhase,
        themeId: theme,
        onImageReady: (cardId, base64) => store.setCardImage(cardId, base64)
      }).catch(e => console.warn('次フェイズ画像先行生成スキップ:', e.message));
    }
  }
}

/** カード選択を確定 */
function confirmCards() {
  const selectedIds = store.state.selectedCards.map(c => c.id);
  const cardsArea = $('#cards-area');

  animateCardReveal(cardsArea, selectedIds).then(() => {
    store.revealSelectedCards();
    R.renderRevealedCards();
    R.renderClueList();

    $('#btn-confirm-cards').style.display = 'none';

    const nextPhaseIndex = store.state.currentPhase;
    const s = store.state.scenario;

    if (nextPhaseIndex < s.investigation_phases.length) {
      R.showNextPhaseButton(`第${nextPhaseIndex + 1}調査へ →`, () => startInvestigation(nextPhaseIndex));
    } else {
      R.showNextPhaseButton('📝 最終推理に進む', () => R.renderAnswerPhase());
    }
  });
}

/** 回答を提出 */
async function submitAnswer() {
  const { apiKey, modelId, scenario, playerAnswers, isSharedScenario, encSolution, encIv } = store.state;

  const motive = $('#answer-motive').value.trim();
  const method = $('#answer-method').value.trim();
  store.update({
    playerAnswers: { ...playerAnswers, motive, method }
  });

  if (!store.state.playerAnswers.culprit) {
    alert('犯人を選択してください');
    return;
  }

  const btn = $('#btn-submit-answer');
  btn.disabled = true;
  btn.textContent = '⏳ 採点中...';

  try {
    let solution;

    // 共有シナリオの場合: solutionを復号
    if (isSharedScenario && encSolution && encIv) {
      solution = await revealSharedSolution(scenario, encSolution, encIv);
      // 復号したsolutionをシナリオに設定（結果表示で使用）
      store.update({ scenario: { ...scenario, solution } });
    } else {
      solution = scenario.solution;
    }

    const result = await evaluateAnswer({
      apiKey: isSharedScenario ? '' : apiKey,
      modelId,
      solution,
      answers: store.state.playerAnswers,
      advisorEnabled: store.state.advisorEnabled
    });
    store.update({ result });
    R.renderResult();
  } catch (e) {
    console.error('採点エラー:', e);
    alert(`採点中にエラーが発生しました: ${e.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '📨 推理を提出する';
  }
}

/** シェアリンクを生成 */
async function handleShare(useNativeShare) {
  const { scenario, theme, difficulty } = store.state;
  if (!scenario) return;

  const btn = useNativeShare ? $('#btn-share-native') : $('#btn-share-copy');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ 生成中...';

  try {
    const url = await generateShareURL(scenario, {
      theme,
      difficulty,
      sharedBy: '匿名探偵',
      qualityScore: scenario._qualityScore || 0
    });

    if (useNativeShare) {
      await shareURL(url, scenario.title);
    } else {
      const result = await shareURL(url, scenario.title);
      if (result === 'copied') {
        R.showToast('📋 シェアリンクをコピーしました！');
      }
    }
  } catch (e) {
    console.error('シェアリンク生成エラー:', e);
    R.showToast('❌ シェアリンクの生成に失敗しました');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ================================================
// URLハッシュからの共有シナリオ検出
// ================================================

function checkForSharedScenario() {
  const shared = detectSharedScenario();
  if (!shared) return false;

  const { scenario, encSolution, encIv, meta } = shared;

  store.resetGame();
  store.update({
    scenario,
    isSharedScenario: true,
    sharedMeta: meta,
    encSolution,
    encIv,
    theme: meta.theme,
    difficulty: meta.difficulty
  });

  R.renderSharedScreen(meta);
  R.showScreen('shared');

  // URLハッシュをクリア（ブラウザ履歴汚染を防止）
  history.replaceState(null, '', window.location.pathname);

  return true;
}

// ================================================
// イベント配線
// ================================================

function setupEventListeners() {
  // ---- タイトル画面 ----
  $('#btn-new-game').addEventListener('click', () => R.showScreen('config'));
  $('#btn-history').addEventListener('click', () => R.openModal('history'));
  $('#btn-settings').addEventListener('click', () => R.openModal('settings'));

  // ---- 設定画面 ----
  $('#btn-config-back').addEventListener('click', () => {
    R.renderTitleStats();
    R.showScreen('title');
  });

  // テーマ選択
  $$('#theme-grid .config-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('#theme-grid .config-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      store.update({ theme: card.dataset.theme });
    });
  });

  // 難易度選択
  $$('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.difficulty-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      store.update({ difficulty: btn.dataset.difficulty });
    });
  });

  // 生成ボタン
  $('#btn-generate').addEventListener('click', startGeneration);

  // ---- 生成中画面 ----
  $('#btn-retry').addEventListener('click', startGeneration);
  $('#btn-gen-back').addEventListener('click', () => R.showScreen('config'));

  // ---- ゲーム画面 ----
  $('#btn-start-investigation').addEventListener('click', () => startInvestigation(0));
  $('#btn-confirm-cards').addEventListener('click', confirmCards);
  $('#btn-submit-answer').addEventListener('click', submitAnswer);

  // サイドバータブ
  $$('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      const target = $(`#tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // ---- 結果画面 ----
  $('#btn-new-case').addEventListener('click', () => R.showScreen('config'));
  $('#btn-back-title').addEventListener('click', () => {
    R.renderTitleStats();
    R.showScreen('title');
  });

  // ---- シェアボタン ----
  $('#btn-share-copy').addEventListener('click', () => handleShare(false));
  const nativeShareBtn = $('#btn-share-native');
  if (navigator.share) {
    nativeShareBtn.style.display = '';
    nativeShareBtn.addEventListener('click', () => handleShare(true));
  }

  // ---- 共有シナリオ受信画面 ----
  $('#btn-play-shared').addEventListener('click', startSharedGame);
  $('#btn-shared-back').addEventListener('click', () => {
    R.renderTitleStats();
    R.showScreen('title');
  });

  // ---- 設定モーダル ----
  $('#btn-modal-close').addEventListener('click', () => R.closeModal('settings'));
  $('#modal-settings .modal-overlay').addEventListener('click', () => R.closeModal('settings'));

  // タブ切替
  $$('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.settings-tab').forEach(t => t.classList.remove('active'));
      $$('.settings-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(`#settings-panel-${tab.dataset.settingsTab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // 画像ON/OFFスイッチ
  $('#switch-image-enabled').addEventListener('click', () => {
    const sw = $('#switch-image-enabled');
    const isOn = sw.classList.toggle('on');
    store.toggleImageEnabled(isOn);
    $('#switch-label').textContent = isOn ? '有効' : '無効';
  });

  // Advisor ON/OFFスイッチ
  const advisorSwEl = $('#switch-advisor-enabled');
  if (advisorSwEl) {
    advisorSwEl.addEventListener('click', () => {
      const isOn = advisorSwEl.classList.toggle('on');
      store.toggleAdvisorEnabled(isOn);
      $('#advisor-switch-label').textContent = isOn ? '有効' : '無効';
    });
  }

  // 保存ボタン（Claude + Gemini）
  $('#btn-save-settings').addEventListener('click', () => {
    // Claude設定
    const claudeKey = $('#api-key').value.trim();
    store.saveApiKey(claudeKey);
    const modelSelect = $('#model-select');
    if (modelSelect) store.saveModel(modelSelect.value);

    // Gemini設定
    const geminiKey = $('#gemini-api-key').value.trim();
    store.saveGeminiApiKey(geminiKey);
    const imageModel = $('#image-model-select');
    if (imageModel) store.saveImageModel(imageModel.value);

    R.closeModal('settings');
  });

  // ---- 事件簿モーダル ----
  $('#btn-history-close').addEventListener('click', () => R.closeModal('history'));
  $('#modal-history .modal-overlay').addEventListener('click', () => R.closeModal('history'));

  // ---- キーボードショートカット ----
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      R.closeModal('settings');
      R.closeModal('history');
    }
  });
}

// ================================================
// アプリ初期化
// ================================================

function init() {
  R.initParticles();
  R.renderTitleStats();
  setupEventListeners();

  // 設定モーダルの初期値を反映
  const { apiKey, modelId, geminiApiKey, imageModelId, imageEnabled, advisorEnabled } = store.state;
  const apiKeyEl = $('#api-key');
  if (apiKeyEl) apiKeyEl.value = apiKey;
  const modelSelectEl = $('#model-select');
  if (modelSelectEl) modelSelectEl.value = modelId;
  const geminiKeyEl = $('#gemini-api-key');
  if (geminiKeyEl) geminiKeyEl.value = geminiApiKey;
  const imgModelEl = $('#image-model-select');
  if (imgModelEl) imgModelEl.value = imageModelId;
  const sw = $('#switch-image-enabled');
  if (sw) {
    sw.classList.toggle('on', imageEnabled);
    const label = $('#switch-label');
    if (label) label.textContent = imageEnabled ? '有効' : '無効';
  }
  // Advisor初期値
  const advSw = $('#switch-advisor-enabled');
  if (advSw) {
    advSw.classList.toggle('on', advisorEnabled);
    const advLabel = $('#advisor-switch-label');
    if (advLabel) advLabel.textContent = advisorEnabled ? '有効' : '無効';
  }

  // URLハッシュから共有シナリオを検出
  const isShared = checkForSharedScenario();
  if (!isShared) {
    console.log('🔍 AI探偵団 — 初期化完了（Claude + NanoBanana + Advisor）');
  } else {
    console.log('🔗 AI探偵団 — 共有シナリオを検出');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
