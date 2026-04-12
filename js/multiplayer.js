// ================================================
// @ai-spec
// @module    multiplayer
// @purpose   マルチプレイヤーモードのUI制御・ゲームフロー管理
// @depends   supabase.js, store.js, renderer.js
// @exports   Multiplayer (global)
// @consumers app.js (イベントリスナーから呼び出し)
// @updated   2026-04-12 Sprint 2
// ================================================

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
    connected: false,
    mpMode: false,       // マルチプレイモード中か
    theme: 'classic',
    difficulty: 'normal'
  },

  // 外部コールバック（app.jsから注入）
  _callbacks: {
    onGameStart: null,      // ゲーム開始（シナリオ生成トリガー）
    onScenarioReady: null,  // シナリオ受信完了
    onGenProgress: null,    // 生成進捗
    showScreen: null,       // 画面遷移
    showToast: null         // トースト通知
  },

  /** app.jsからコールバックを登録 */
  registerCallbacks(cbs) {
    Object.assign(this._callbacks, cbs);
  },

  // ================================================
  // 認証フロー
  // ================================================

  async login(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('ニックネームを入力してください');
    }
    nickname = nickname.trim().slice(0, 12);

    const { auth } = window.SupabaseClient;
    const user = await auth.signInAnonymously(nickname);
    this.state.user = user;
    this.state.nickname = nickname;
    this.state.mpMode = true;
    return user;
  },

  // ================================================
  // ルーム作成
  // ================================================

  async createRoom(theme, difficulty) {
    const { rooms } = window.SupabaseClient;
    this.state.theme = theme;
    this.state.difficulty = difficulty;

    const room = await rooms.create({
      theme,
      difficulty,
      hostId: this.state.user.id,
      nickname: this.state.nickname
    });

    this.state.roomId = room.id;
    this.state.roomCode = room.room_code;
    this.state.isHost = true;

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
    this.state.theme = room.theme;
    this.state.difficulty = room.difficulty;

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
        this._updatePlayerList(presenceState);
      },

      onPlayerJoin: (key, newPresences) => {
        const name = newPresences[0]?.nickname || '不明';
        console.log(`👤 参加: ${name}`);
        this._showNotification(`${name} が参加しました`);
      },

      onPlayerLeave: (key, leftPresences) => {
        const name = leftPresences[0]?.nickname || '不明';
        console.log(`👤 退出: ${name}`);
        this._showNotification(`${name} が退出しました`);
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
        this._callbacks.onGenProgress?.(data.step, data.status, data.detail);
      },

      onPlayerSubmitted: (data) => {
        this._showNotification(`${data.nickname} が推理を提出しました (${data.submitted}/${data.total})`);
      },

      onResultsReady: (data) => {
        console.log('📊 結果発表:', data);
      },

      onChat: (data) => {
        this._onChat(data);
      }
    });
  },

  // ================================================
  // UI更新
  // ================================================

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

  renderWaitingRoom() {
    const container = document.querySelector('#waiting-players');
    if (!container) return;

    const avatars = AVATAR_OPTIONS;
    container.innerHTML = this.state.players.map((p, i) => `
      <div class="waiting-player ${p.userId === this.state.user?.id ? 'is-me' : ''}">
        <span class="player-avatar">${avatars[i % avatars.length]}</span>
        <span class="player-name">${this._escapeHtml(p.nickname)}</span>
        ${p.userId === this.state.user?.id ? '<span class="player-badge">あなた</span>' : ''}
      </div>
    `).join('');

    const countEl = document.querySelector('#player-count');
    if (countEl) countEl.textContent = `${this.state.players.length} / 4`;

    // ホストのみ開始ボタン表示、1人でもテスト可能（本番は2人以上推奨）
    const startBtn = document.querySelector('#btn-mp-start-game');
    if (startBtn) {
      startBtn.style.display = this.state.isHost ? '' : 'none';
      startBtn.disabled = false; // 1人でもテスト可能
    }
  },

  _showNotification(message) {
    const container = document.querySelector('#waiting-chat');
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

  /** ホストが「事件開始」→ 全員に通知 */
  async startGame() {
    if (!this.state.isHost) return;

    const { realtime, rooms } = window.SupabaseClient;

    // ルーム状態を playing に更新
    await rooms.updateStatus(this.state.roomId, 'playing');

    // 全員に game_start を送信
    realtime.broadcast('game_start', {
      theme: this.state.theme,
      difficulty: this.state.difficulty,
      hostNickname: this.state.nickname
    });

    // ホスト自身もゲーム開始処理を実行
    this._onGameStart({
      theme: this.state.theme,
      difficulty: this.state.difficulty
    });
  },

  _onGameStart(data) {
    // 生成画面に遷移（showScreen統一）
    this._callbacks.showScreen?.('generating');
  },

  _onScenarioReady(data) {
    // シナリオをapp.jsのコールバック経由で処理
    this._callbacks.onScenarioReady?.(data);
  },

  _onChat(data) {
    const container = document.querySelector('#waiting-chat');
    if (!container) return;
    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message';
    msgEl.innerHTML = `<strong>${this._escapeHtml(data.nickname)}</strong>: ${this._escapeHtml(data.message)}`;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
  },

  // ================================================
  // ホスト: シナリオ生成完了後にBroadcast
  // ================================================

  broadcastScenarioReady(scenario) {
    const { realtime, rooms } = window.SupabaseClient;

    // solutionを除外してBroadcast
    const scenarioForBroadcast = { ...scenario };
    delete scenarioForBroadcast.solution;

    realtime.broadcast('scenario_ready', {
      scenario: scenarioForBroadcast,
      theme: this.state.theme,
      difficulty: this.state.difficulty
    });

    // DBにも保存
    rooms.saveScenario(this.state.roomId, scenario).catch(e =>
      console.warn('シナリオDB保存エラー:', e)
    );
  },

  /** 生成進捗をBroadcast */
  broadcastGenProgress(step, status, detail) {
    const { realtime } = window.SupabaseClient;
    realtime.broadcast('gen_progress', { step, status, detail });
  },

  // ================================================
  // アクション
  // ================================================

  sendChat(message) {
    if (!message.trim()) return;
    const { realtime } = window.SupabaseClient;
    realtime.broadcast('chat', {
      nickname: this.state.nickname,
      message: message.trim(),
      timestamp: Date.now()
    });
  },

  async copyRoomCode() {
    try {
      await navigator.clipboard.writeText(this.state.roomCode);
      return true;
    } catch {
      return false;
    }
  },

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
      connected: false,
      mpMode: false
    };
  },

  /** マルチプレイモード中かどうか */
  isActive() {
    return this.state.mpMode && this.state.connected;
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
