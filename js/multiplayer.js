// ================================================
// @ai-spec
// @module    multiplayer
// @purpose   マルチプレイヤーモードのUI制御・ゲームフロー管理
// @depends   supabase.js, store.js, renderer.js
// @exports   Multiplayer (global)
// @consumers app.js (イベントリスナーから呼び出し)
// @updated   2026-04-12
// ================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const AVATAR_OPTIONS = ['🕵️', '🔍', '🧐', '👀', '🎭', '🦊', '🐻', '🐼', '🦉', '🐱', '🐶', '🐰'];

const Multiplayer = {
  // 状態
  state: {
    user: null,
    nickname: '',
    roomId: null,
    roomCode: null,
    isHost: false,
    playerId: null,
    players: [],
    connected: false
  },

  // ================================================
  // 認証フロー
  // ================================================

  /** ニックネーム入力 → 匿名ログイン */
  async login(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('ニックネームを入力してください');
    }
    nickname = nickname.trim().slice(0, 12); // 最大12文字

    const { auth } = window.SupabaseClient;
    const user = await auth.signInAnonymously(nickname);
    this.state.user = user;
    this.state.nickname = nickname;
    return user;
  },

  // ================================================
  // ルーム作成
  // ================================================

  async createRoom(theme, difficulty) {
    const { rooms } = window.SupabaseClient;
    const room = await rooms.create({
      theme,
      difficulty,
      hostId: this.state.user.id,
      nickname: this.state.nickname
    });

    this.state.roomId = room.id;
    this.state.roomCode = room.room_code;
    this.state.isHost = true;

    // Realtimeチャンネルに接続
    this._connectRealtime();

    return room;
  },

  // ================================================
  // ルーム参加
  // ================================================

  async joinRoom(roomCode) {
    const { rooms } = window.SupabaseClient;
    const room = await rooms.join(roomCode, this.state.user.id, this.state.nickname);

    this.state.roomId = room.id;
    this.state.roomCode = room.room_code;
    this.state.isHost = false;

    // Realtimeチャンネルに接続
    this._connectRealtime();

    return room;
  },

  // ================================================
  // Realtime接続
  // ================================================

  _connectRealtime() {
    const { realtime } = window.SupabaseClient;

    realtime.joinRoom(this.state.roomCode, this.state.user.id, this.state.nickname, {
      onConnected: () => {
        this.state.connected = true;
        console.log('🔗 ルームに接続しました');
      },

      onPresenceSync: (presenceState) => {
        // プレゼンス同期 → プレイヤーリスト更新
        this._updatePlayerList(presenceState);
      },

      onPlayerJoin: (key, newPresences) => {
        console.log(`👤 プレイヤー参加: ${newPresences[0]?.nickname}`);
        this._showNotification(`${newPresences[0]?.nickname} が参加しました`);
      },

      onPlayerLeave: (key, leftPresences) => {
        console.log(`👤 プレイヤー退出: ${leftPresences[0]?.nickname}`);
        this._showNotification(`${leftPresences[0]?.nickname} が退出しました`);
      },

      onGameStart: (data) => {
        console.log('🎮 ゲーム開始!');
        this._onGameStart(data);
      },

      onScenarioReady: (data) => {
        console.log('📖 シナリオ準備完了');
        this._onScenarioReady(data);
      },

      onGenProgress: (data) => {
        this._onGenProgress(data);
      },

      onPlayerSubmitted: (data) => {
        this._onPlayerSubmitted(data);
      },

      onResultsReady: (data) => {
        this._onResultsReady(data);
      },

      onChat: (data) => {
        this._onChat(data);
      }
    });
  },

  // ================================================
  // UI更新
  // ================================================

  /** プレイヤーリストの更新 */
  _updatePlayerList(presenceState) {
    const players = [];
    for (const [userId, presences] of Object.entries(presenceState)) {
      if (presences.length > 0) {
        players.push({
          userId,
          nickname: presences[0].nickname,
          online: true
        });
      }
    }
    this.state.players = players;
    this.renderWaitingRoom();
  },

  /** 待機室のレンダリング */
  renderWaitingRoom() {
    const container = $('#waiting-players');
    if (!container) return;

    const avatars = AVATAR_OPTIONS;
    container.innerHTML = this.state.players.map((p, i) => `
      <div class="waiting-player ${p.userId === this.state.user?.id ? 'is-me' : ''}">
        <span class="player-avatar">${avatars[i % avatars.length]}</span>
        <span class="player-name">${this._escapeHtml(p.nickname)}</span>
        ${p.userId === this.state.user?.id ? '<span class="player-badge">あなた</span>' : ''}
      </div>
    `).join('');

    // プレイヤー数表示
    const countEl = $('#player-count');
    if (countEl) {
      countEl.textContent = `${this.state.players.length} / 4`;
    }

    // ホストのみ開始ボタン表示
    const startBtn = $('#btn-mp-start-game');
    if (startBtn) {
      startBtn.style.display = this.state.isHost ? '' : 'none';
      startBtn.disabled = this.state.players.length < 2;
    }
  },

  /** 通知表示 */
  _showNotification(message) {
    const container = $('#waiting-chat');
    if (!container) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-system';
    msgEl.textContent = `ℹ️ ${message}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  // ================================================
  // ゲームイベントハンドラ
  // ================================================

  _onGameStart(data) {
    // 生成画面に遷移
    $('#screen-waiting').style.display = 'none';
    $('#screen-generating').style.display = '';
  },

  _onGenProgress(data) {
    // 生成進捗の更新（ゲスト側）
    if (typeof R !== 'undefined' && R.updateGenStep) {
      R.updateGenStep(data.step, data.status, data.detail);
    }
  },

  _onScenarioReady(data) {
    // シナリオをストアに設定して導入画面へ
    if (typeof store !== 'undefined') {
      store.update({ scenario: data.scenario });
      store.incrementCase();
      if (typeof R !== 'undefined') {
        R.renderIntro();
        R.showScreen('game');
      }
    }
  },

  _onPlayerSubmitted(data) {
    this._showNotification(`${data.nickname} が推理を提出しました`);
  },

  _onResultsReady(data) {
    // 全員の結果を表示
    console.log('📊 結果発表:', data);
  },

  _onChat(data) {
    const container = $('#waiting-chat');
    if (!container) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.innerHTML = `<strong>${this._escapeHtml(data.nickname)}</strong>: ${this._escapeHtml(data.message)}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  // ================================================
  // アクション
  // ================================================

  /** チャットメッセージ送信 */
  sendChat(message) {
    if (!message.trim()) return;
    const { realtime } = window.SupabaseClient;
    realtime.broadcast('chat', {
      nickname: this.state.nickname,
      message: message.trim(),
      timestamp: Date.now()
    });
  },

  /** ルームコードをクリップボードにコピー */
  async copyRoomCode() {
    try {
      await navigator.clipboard.writeText(this.state.roomCode);
      return true;
    } catch {
      return false;
    }
  },

  /** ルームから退出 */
  async leaveRoom() {
    const { rooms, realtime } = window.SupabaseClient;
    if (this.state.roomId && this.state.user) {
      await rooms.leave(this.state.roomId, this.state.user.id);
    }
    realtime.leaveRoom();
    this.state = {
      ...this.state,
      roomId: null,
      roomCode: null,
      isHost: false,
      playerId: null,
      players: [],
      connected: false
    };
  },

  // ================================================
  // ユーティリティ
  // ================================================

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.Multiplayer = Multiplayer;
