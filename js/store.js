// ================================================
// @ai-spec
// @module    store
// @purpose   アプリ全状態の単一管理（SSOT）。Observer Patternで変更通知。localStorage永続化
// @ssot      apiKey, modelId, geminiApiKey, scenario, currentPhase, history, advisorEnabled
// @depends   なし
// @exports   default (store singleton) — update, subscribe, saveConfig, resetGame, addToHistory, toggleAdvisorEnabled
// @consumers app.js, renderer.js, cards.js
// @constraints
//   - 状態変更は必ず store.update() 経由（直接代入禁止）
//   - localStorage書き込みは saveConfig() のみ
// @dataflow  app.js → store.update() → subscriber通知 → renderer.js
// @updated   2026-04-12
// ================================================
// AI探偵団 — 状態管理モジュール（SSOT: アプリ状態の単一源泉）
// localStorage永続化 + ステート変更通知
// ================================================

const STORAGE_KEYS = {
  API_KEY: 'ai_detective_apikey',
  MODEL: 'ai_detective_model',
  HISTORY: 'ai_detective_history',
  CASES: 'ai_detective_cases',
  GEMINI_API_KEY: 'ai_detective_apikey_gemini',
  GEMINI_MODEL: 'ai_detective_gemini_model',
  IMAGE_ENABLED: 'ai_detective_image_enabled',
  ADVISOR_ENABLED: 'ai_detective_advisor_enabled',
  FREE_PLAY: 'ai_detective_free_play',   // {month: 'YYYY-MM', count: N}
  DEBUG: 'ai_detective_debug'
};

const MAX_HISTORY = 50;
const FREE_PLAY_LIMIT = 3; // 月あたりの無料プレイ上限

// ================================================
// 初期ステート
// ================================================
function createInitialState() {
  return {
    // 設定（永続化対象）
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
    modelId: localStorage.getItem(STORAGE_KEYS.MODEL) || 'opus',

    // Gemini設定（永続化対象）
    geminiApiKey: localStorage.getItem(STORAGE_KEYS.GEMINI_API_KEY) || '',
    imageModelId: localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL) || 'flash',
    imageEnabled: localStorage.getItem(STORAGE_KEYS.IMAGE_ENABLED) !== 'false',

    // Advisor戦略（Opus+Sonnet連携、デフォルトON）
    advisorEnabled: localStorage.getItem(STORAGE_KEYS.ADVISOR_ENABLED) !== 'false',

    // デバッグモード（セッションベース: localStorage永続化廃止。debug.jsの_sessionDebugで管理）
    debugMode: false,

    // 無料プレイ管理
    freePlayRemaining: calcFreePlayRemaining(),

    // ゲーム設定
    theme: 'classic',
    difficulty: 'normal',

    // ゲーム実行状態
    scenario: null,
    currentPhase: 0,        // 0=導入, 1-3=調査フェイズ, 4=回答
    selectedCards: [],       // 現在の調査で選択中のカード
    revealedCards: [],       // 全フェイズで公開済みのカード
    hintsUsed: 0,           // 使用したヒント数
    hintPenalty: 0,          // ヒント使用ペナルティ合計
    playerAnswers: {
      culprit: '',
      motive: '',
      method: ''
    },
    result: null,

    // シェア機能関連
    isSharedScenario: false,  // 共有シナリオでプレイ中か
    sharedMeta: null,         // 共有メタ情報
    encSolution: null,        // 暗号化されたsolution
    encIv: null,              // AES-GCM IV

    // 画像キャッシュ（非永続化、ゲームセッション中のみ）
    imageCache: {
      scene: null,
      portraits: {},
      cards: {}
    },

    // プレイ履歴（永続化対象）
    history: loadHistory(),
    caseCounter: parseInt(localStorage.getItem(STORAGE_KEYS.CASES) || '0'),

    // UI状態
    currentScreen: 'title',
    playerNotes: '',
    deductionMemo: ''  // 推理メモ（プレイヤーの推理過程を記録）
  };
}

/**
 * 無料プレイ残回数を計算
 * localStorageの月別カウンターを参照し、月が変わったら自動リセット
 */
function calcFreePlayRemaining() {
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.FREE_PLAY) || '{}');
    if (data.month === currentMonth) {
      return Math.max(0, FREE_PLAY_LIMIT - (data.count || 0));
    }
  } catch { /* ignore */ }
  return FREE_PLAY_LIMIT; // 新しい月 or データなし → フルリセット
}

/**
 * localStorage から履歴を安全に読み込む
 */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  } catch {
    return [];
  }
}

// ================================================
// Store クラス（Observer パターン）
// ================================================
class Store {
  constructor() {
    this._state = createInitialState();
    this._listeners = new Set();
  }

  /** 現在のステートを取得（読み取り専用参照） */
  get state() {
    return this._state;
  }

  /**
   * ステートを部分更新
   * @param {Partial<typeof this._state>} patch - 更新するフィールド
   */
  update(patch) {
    Object.assign(this._state, patch);
    this._notify(Object.keys(patch));
  }

  /**
   * ゲーム状態をリセット（新しいゲーム開始時）
   */
  resetGame() {
    this.update({
      scenario: null,
      currentPhase: 0,
      selectedCards: [],
      revealedCards: [],
      hintsUsed: 0,
      hintPenalty: 0,
      playerAnswers: { culprit: '', motive: '', method: '' },
      result: null,
      playerNotes: '',
      isSharedScenario: false,
      sharedMeta: null,
      encSolution: null,
      encIv: null,
      imageCache: { scene: null, portraits: {}, cards: {} }
    });
  }

  /**
   * ケース番号をインクリメント
   */
  incrementCase() {
    const next = this._state.caseCounter + 1;
    this.update({ caseCounter: next });
    localStorage.setItem(STORAGE_KEYS.CASES, next.toString());
  }

  // ---- APIキー管理 ----

  saveApiKey(key) {
    this.update({ apiKey: key });
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  }

  // ---- Gemini APIキー管理 ----

  saveGeminiApiKey(key) {
    this.update({ geminiApiKey: key });
    localStorage.setItem(STORAGE_KEYS.GEMINI_API_KEY, key);
  }

  saveImageModel(modelId) {
    this.update({ imageModelId: modelId });
    localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, modelId);
  }

  toggleImageEnabled(enabled) {
    this.update({ imageEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.IMAGE_ENABLED, enabled.toString());
  }

  // ---- Advisor戦略管理 ----

  toggleAdvisorEnabled(enabled) {
    this.update({ advisorEnabled: enabled });
    localStorage.setItem(STORAGE_KEYS.ADVISOR_ENABLED, enabled.toString());
  }

  // ---- デバッグモード管理 ----

  enableDebug() {
    this.update({ debugMode: true });
    localStorage.setItem(STORAGE_KEYS.DEBUG, 'true');
  }

  disableDebug() {
    this.update({ debugMode: false });
    localStorage.removeItem(STORAGE_KEYS.DEBUG);
  }

  // ---- 画像キャッシュ管理 ----

  setSceneImage(base64) {
    const cache = { ...this._state.imageCache, scene: base64 };
    this.update({ imageCache: cache });
  }

  setPortraitImage(suspectName, base64) {
    const portraits = { ...this._state.imageCache.portraits, [suspectName]: base64 };
    const cache = { ...this._state.imageCache, portraits };
    this.update({ imageCache: cache });
  }

  setCardImage(cardId, base64) {
    const cards = { ...this._state.imageCache.cards, [cardId]: base64 };
    const cache = { ...this._state.imageCache, cards };
    this.update({ imageCache: cache });
  }

  // ---- モデル管理 ----

  saveModel(modelId) {
    this.update({ modelId });
    localStorage.setItem(STORAGE_KEYS.MODEL, modelId);
  }

  // ---- 履歴管理 ----

  /**
   * プレイ結果を履歴に追加
   * @param {Object} record
   */
  addHistory(record) {
    const history = [record, ...this._state.history];
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    this.update({ history });
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }

  // ---- カード選択管理 ----

  /**
   * カードを選択/解除してselectedCardsを更新
   * @param {Object} card
   * @param {boolean} selected
   */
  toggleCard(card, selected) {
    let cards;
    if (selected) {
      cards = [...this._state.selectedCards, card];
    } else {
      cards = this._state.selectedCards.filter(c => c.id !== card.id);
    }
    this.update({ selectedCards: cards });
  }

  /**
   * 選択されたカードを公開済みに移動
   */
  revealSelectedCards() {
    const newRevealed = [...this._state.revealedCards, ...this._state.selectedCards];
    this.update({
      revealedCards: newRevealed,
      selectedCards: []
    });
  }

  // ---- ヒント管理 ----

  /**
   * ヒントを使用
   * @param {number} penalty - ヒントのペナルティ点数
   */
  useHint(penalty) {
    this.update({
      hintsUsed: this._state.hintsUsed + 1,
      hintPenalty: this._state.hintPenalty + penalty
    });
  }

  /**
   * 無料プレイを1回消費
   * @returns {boolean} 消費成功したかtrue
   */
  consumeFreePlay() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEYS.FREE_PLAY) || '{}');
    } catch { data = {}; }

    // 月が変わったらリセット
    if (data.month !== currentMonth) {
      data = { month: currentMonth, count: 0 };
    }

    if (data.count >= FREE_PLAY_LIMIT) {
      return false; // 上限到達
    }

    data.count++;
    localStorage.setItem(STORAGE_KEYS.FREE_PLAY, JSON.stringify(data));
    this.update({ freePlayRemaining: FREE_PLAY_LIMIT - data.count });
    return true;
  }

  /**
   * 無料プレイが可能か判定
   */
  canFreePlay() {
    return this._state.freePlayRemaining > 0;
  }

  /**
   * BYOモードか判定（ユーザーが自分のAPIキーを設定済み）
   */
  hasByokApiKey() {
    return !!this._state.apiKey;
  }

  // ---- Observer パターン ----

  /**
   * ステート変更リスナーを登録
   * @param {Function} fn - (changedKeys: string[]) => void
   * @returns {Function} unsubscribe関数
   */
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _notify(changedKeys) {
    for (const fn of this._listeners) {
      try { fn(changedKeys); } catch (e) { console.error('Store listener error:', e); }
    }
  }
}

// シングルトンインスタンス
const store = new Store();
export default store;
