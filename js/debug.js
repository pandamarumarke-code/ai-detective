// ================================================
// @ai-spec
// @module    debug
// @purpose   デバッグモード制御。APIコスト削減のためモックデータでテストプレイ可能にする
// @ssot      なし（store.jsのdebugModeフラグに依存）
// @depends   store.js, constants.js (MOCK_SCENARIO)
// @exports   isDebugMode, initDebugMode, getMockImage, debugLog, renderDebugPanel
// @consumers app.js, claude.js, gemini.js
// @constraints
//   - デバッグモードOFF時は一切のDOM操作・ログ出力を行わない
//   - モックデータはSCENARIO_SCHEMAと完全一致する構造を保持すること
//   - 本番環境でも?debug=trueで使用可能（開発者向け）
// @dataflow  URL/localStorage → isDebugMode() → app.js分岐 → モックデータ or 通常API
// @updated   2026-04-14
// ================================================
// AI探偵団 — デバッグモード制御モジュール
// APIコスト削減 + 開発効率化のための包括的デバッグツール
// ================================================

import store from './store.js';
import { MOCK_SCENARIO } from './constants.js';

// セッション内フラグ（ページリロードでリセット。localStorage永続化を廃止）
let _sessionDebug = false;

// ================================================
// デバッグモード判定
// ================================================

/**
 * デバッグモードが有効かどうかを判定
 * 優先順位: URL ?debug=true > localStorage > window.__debugDetective
 * @returns {boolean}
 */
export function isDebugMode() {
  // 1. URLパラメータ（唯一の正規起動方法）
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === 'true') return true;
  }
  // 2. セッション内フラグ（initDebugModeで設定。ページリロードでリセット）
  if (_sessionDebug) return true;
  // 3. window global（コンソールから動的ON用）
  if (typeof window !== 'undefined' && window.__debugDetective) return true;
  return false;
}

/**
 * デバッグモードの初期化。URL検出時にstoreも同期する
 */
export function initDebugMode() {
  if (typeof location !== 'undefined') {
    const params = new URLSearchParams(location.search);
    if (params.get('debug') === 'true') {
      _sessionDebug = true;
    }
    // ?debug=false で明示的にOFF（localStorageの残骸もクリア）
    if (params.get('debug') === 'false') {
      _sessionDebug = false;
      store.disableDebug();
    }
  }
  // localStorageの古い値をクリーンアップ（既存ユーザー対策）
  if (localStorage.getItem('ai_detective_debug')) {
    localStorage.removeItem('ai_detective_debug');
  }
  if (isDebugMode()) {
    renderDebugPanel();
    debugLog('system', 'デバッグモード有効化');
    // コンソールからアクセス可能にする
    window.__debugLogs = _logs;
    window.__debugStore = store;
  }
}

// ================================================
// モックデータ
// ================================================

/**
 * モックシナリオを取得（API呼び出し不要）
 * @param {string} themeId
 * @param {string} difficultyId
 * @returns {Object} SCENARIO_SCHEMAと一致する完全なシナリオ
 */
export function getMockScenario(themeId, difficultyId) {
  // MOCK_SCENARIOをベースにテーマ情報だけ差し替え
  const scenario = JSON.parse(JSON.stringify(MOCK_SCENARIO));
  scenario._debugGenerated = true;
  scenario._debugTheme = themeId;
  scenario._debugDifficulty = difficultyId;
  return scenario;
}

/**
 * モック画像を生成（1x1ピクセル透明PNG）
 * @param {string} type - 'scene' | 'portrait' | 'card'
 * @returns {string} Base64画像データ
 */
export function getMockImage(type) {
  // 1x1ピクセルの透明PNG（Base64）
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
}

/**
 * モック採点結果を生成
 * @param {Object} answers - プレイヤーの回答
 * @param {Object} solution - 正解データ
 * @returns {Object} SCORING_SCHEMAと一致する結果
 */
export function getMockScoringResult(answers, solution) {
  const culpritCorrect = answers.culprit === solution.culprit;
  return {
    scores: [
      { question: '犯人', points: culpritCorrect ? 3 : 0, max: 3, correct: culpritCorrect, comment: culpritCorrect ? '正解！' : `正解は${solution.culprit}でした` },
      { question: '動機', points: 1, max: 2, correct: false, comment: 'デバッグモード: 部分正解として採点' },
      { question: '手口', points: 1, max: 2, correct: false, comment: 'デバッグモード: 部分正解として採点' }
    ],
    total: culpritCorrect ? 5 : 2,
    max_total: 7
  };
}

// ================================================
// デバッグログ
// ================================================

const _logs = [];

/**
 * デバッグログを記録
 * @param {string} category - 'claude' | 'gemini' | 'system' | 'ui' | 'store'
 * @param {string} message
 * @param {*} [data]
 */
export function debugLog(category, message, data = null) {
  if (!isDebugMode()) return;
  const entry = {
    time: new Date().toISOString().slice(11, 23),
    category,
    message,
    data
  };
  _logs.push(entry);
  // 最大200件保持
  if (_logs.length > 200) _logs.shift();
  console.log(`🔧 [${entry.time}] [${category}] ${message}`, data || '');
}

/**
 * デバッグログをコンソールテーブルで表示
 */
export function showDebugLogs() {
  console.table(_logs.map(l => ({ time: l.time, cat: l.category, msg: l.message })));
}

// ================================================
// デバッグパネルUI
// ================================================

/**
 * デバッグパネルをDOMに描画
 */
export function renderDebugPanel() {
  if (!isDebugMode()) return;
  // 既存パネルがあれば削除
  const existing = document.getElementById('debug-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.innerHTML = `
    <div class="debug-bar">
      <span class="debug-label">🔧 DEBUG</span>
      <span class="debug-info" id="debug-info">Phase: ${store.state.currentPhase} | Theme: ${store.state.theme}</span>
      <div class="debug-actions">
        <button onclick="window.__debugActions.mockGenerate()" title="モックシナリオで即座にゲーム開始">📦 モック生成</button>
        <button onclick="window.__debugActions.skipToPhase()" title="次の調査フェーズへスキップ">⏭️ Phase→</button>
        <button onclick="window.__debugActions.revealAll()" title="全カードを公開">👀 全公開</button>
        <button onclick="window.__debugActions.skipToResult()" title="結果画面へ直行">🏁 結果</button>
        <button onclick="window.__debugActions.togglePanel()" title="パネルを折りたたむ">▼</button>
      </div>
    </div>
  `;
  document.body.prepend(panel);

  // パネルの折りたたみ状態
  let collapsed = false;

  // グローバルアクション登録
  window.__debugActions = {
    mockGenerate: () => {
      document.dispatchEvent(new CustomEvent('debug:mockGenerate'));
    },
    skipToPhase: () => {
      document.dispatchEvent(new CustomEvent('debug:skipToPhase'));
    },
    revealAll: () => {
      document.dispatchEvent(new CustomEvent('debug:revealAll'));
    },
    skipToResult: () => {
      document.dispatchEvent(new CustomEvent('debug:skipToResult'));
    },
    togglePanel: () => {
      collapsed = !collapsed;
      const actions = panel.querySelector('.debug-actions');
      const info = panel.querySelector('.debug-info');
      if (actions) actions.style.display = collapsed ? 'none' : 'flex';
      if (info) info.style.display = collapsed ? 'none' : 'inline';
      const btn = panel.querySelector('.debug-actions button:last-child');
      // ボタンテキストは折りたたみ時に変更しないが、パネル自体のサイズで判断
    }
  };

  // ステート変更時にデバッグ情報を更新
  store.subscribe((keys) => {
    const info = document.getElementById('debug-info');
    if (info) {
      info.textContent = `Phase: ${store.state.currentPhase} | Theme: ${store.state.theme} | Screen: ${store.state.currentScreen}`;
    }
  });
}

/**
 * デバッグパネルを削除
 */
export function removeDebugPanel() {
  const panel = document.getElementById('debug-panel');
  if (panel) panel.remove();
  delete window.__debugActions;
}
