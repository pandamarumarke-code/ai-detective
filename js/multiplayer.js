// ================================================
// @ai-spec
// @module    multiplayer
// @purpose   マルチプレイヤーモードのUI制御・ゲームフロー管理
// @depends   supabase.js, store.js, renderer.js
// @exports   Multiplayer (global)
// @consumers app.js (イベントリスナーから呼び出し)
// @updated   2026-04-13 Sprint 4
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
    difficulty: 'normal',
    // Sprint 3: 回答・ランキング
    submissions: {},     // { [userId]: { nickname, culprit, submitted: true } }
    rankings: [],        // [{ nickname, score, maxScore, rank, badge }]
    myScore: null        // 自分のスコア { score, maxScore, result }
  },

  // 外部コールバック（app.jsから注入）
  _callbacks: {
    onGameStart: null,      // ゲーム開始（シナリオ生成トリガー）
    onScenarioReady: null,  // シナリオ受信完了
    onGenProgress: null,    // 生成進捗
    onAllSubmitted: null,   // 全員回答完了 → ランキング表示
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
    // 即座にUIを初期表示（Presenceを待たない）
    this._initWaitingRoomUI();
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
    this._initWaitingRoomUI();
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
        // 接続完了時に再レンダリング
        this.renderWaitingRoom();
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

  /** 待機室初期表示（Presenceを待たずに即座に表示） */
  _initWaitingRoomUI() {
    // ルームコード表示
    const codeEl = document.querySelector('#display-room-code');
    if (codeEl) codeEl.textContent = this.state.roomCode || '----';

    // 自分自身をプレイヤーリストに仮追加
    if (this.state.players.length === 0) {
      this.state.players = [{
        userId: this.state.user?.id,
        nickname: this.state.nickname,
        online: true
      }];
    }
    this.renderWaitingRoom();
  },

  renderWaitingRoom() {
    const container = document.querySelector('#waiting-players');
    if (!container) return;

    // ルームコード表示も更新
    const codeEl = document.querySelector('#display-room-code');
    if (codeEl && this.state.roomCode) codeEl.textContent = this.state.roomCode;

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
  // Sprint 3: 回答提出・ランキング
  // ================================================

  /** 自分の回答を全員にBroadcast */
  broadcastSubmission(result) {
    const { realtime } = window.SupabaseClient;
    const totalPlayers = this.state.players.length;

    // 自分の提出を記録
    this.state.submissions[this.state.user.id] = {
      nickname: this.state.nickname,
      culprit: result.playerAnswers?.culprit || '',
      score: result.score,
      maxScore: result.maxScore,
      submitted: true
    };
    this.state.myScore = { score: result.score, maxScore: result.maxScore, result: result.fullResult };

    const submittedCount = Object.keys(this.state.submissions).length;

    // Broadcast
    realtime.broadcast('player_submitted', {
      userId: this.state.user.id,
      nickname: this.state.nickname,
      culprit: result.playerAnswers?.culprit || '',
      score: result.score,
      maxScore: result.maxScore,
      submitted: submittedCount,
      total: totalPlayers
    });

    // 全員提出済みかチェック
    if (submittedCount >= totalPlayers) {
      this._calculateRankings();
    }
  },

  /** 他プレイヤーの提出を受信 */
  _onPlayerSubmitted(data) {
    // 提出記録を更新
    this.state.submissions[data.userId] = {
      nickname: data.nickname,
      culprit: data.culprit,
      score: data.score,
      maxScore: data.maxScore,
      submitted: true
    };

    const submittedCount = Object.keys(this.state.submissions).length;
    const totalPlayers = this.state.players.length;

    this._showNotification(`${data.nickname} が推理を提出しました (${submittedCount}/${totalPlayers})`);

    // 提出状況バーを更新
    this._updateSubmissionBar(submittedCount, totalPlayers);

    // 全員提出済みかチェック
    if (submittedCount >= totalPlayers) {
      this._calculateRankings();
    }
  },

  /** 提出状況バーの更新 */
  _updateSubmissionBar(submitted, total) {
    let bar = document.querySelector('#mp-submission-bar');
    if (!bar) return;
    bar.innerHTML = `
      <div class="submission-progress">
        <span>提出状況: ${submitted} / ${total}</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(submitted / total) * 100}%"></div>
        </div>
      </div>
    `;
  },

  /** ランキング計算・表示 */
  _calculateRankings() {
    const rankings = Object.entries(this.state.submissions)
      .map(([userId, sub]) => ({
        userId,
        nickname: sub.nickname,
        score: sub.score || 0,
        maxScore: sub.maxScore || 100,
        isMe: userId === this.state.user?.id
      }))
      .sort((a, b) => b.score - a.score);

    // 順位付け
    rankings.forEach((r, i) => {
      r.rank = i + 1;
      r.badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️';
    });

    this.state.rankings = rankings;

    // ホストなら結果をBroadcast
    if (this.state.isHost) {
      const { realtime } = window.SupabaseClient;
      realtime.broadcast('results_ready', { rankings });
    }

    // コールバックで結果画面へ
    this._callbacks.onAllSubmitted?.(rankings);
  },

  /** 結果受信ハンドラ（ゲスト側） */
  _onResultsReady(data) {
    if (data.rankings) {
      this.state.rankings = data.rankings.map(r => ({
        ...r,
        isMe: r.userId === this.state.user?.id
      }));
    }
    // 既に自分のスコアが計算済みならランキング表示
    if (this.state.myScore) {
      this._callbacks.onAllSubmitted?.(this.state.rankings);
    }
  },

  /** マルチプレイランキングHTMLを生成 */
  renderRankingHTML() {
    if (!this.state.rankings.length) return '';

    const rows = this.state.rankings.map(r => `
      <tr class="ranking-row ${r.isMe ? 'ranking-me' : ''}">
        <td class="ranking-badge">${r.badge}</td>
        <td class="ranking-name">${this._escapeHtml(r.nickname)} ${r.isMe ? '<span class="player-badge">あなた</span>' : ''}</td>
        <td class="ranking-score">${r.score} / ${r.maxScore}</td>
      </tr>
    `).join('');

    return `
      <div class="mp-ranking-section">
        <h3 class="ranking-title">🏆 マルチプレイ ランキング</h3>
        <table class="ranking-table">
          <thead>
            <tr><th></th><th>探偵名</th><th>スコア</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  // ================================================
  // Sprint 4: 戦績保存・ルーム終了
  // ================================================

  /** ランキング確定後、全プレイヤーのスコアをDB保存 */
  async saveGameResults() {
    if (!this.state.rankings.length) return;

    const { rooms } = window.SupabaseClient;
    try {
      for (const r of this.state.rankings) {
        if (r.userId === this.state.user?.id) {
          // 自分のスコアを保存
          await rooms.saveScore(this.state.playerId, r.score, r.rank);
        }
      }
      console.log('✅ 戦績を保存しました');
    } catch (e) {
      console.warn('戦績保存エラー:', e.message);
    }
  },

  /** ゲーム終了処理（ホストのみ実行） */
  async finishGame() {
    if (!this.state.isHost || !this.state.roomId) return;

    const { rooms } = window.SupabaseClient;
    try {
      await rooms.updateStatus(this.state.roomId, 'finished');
      console.log('✅ ルームを終了しました');
    } catch (e) {
      console.warn('ルーム終了エラー:', e.message);
    }
  },

  /** ロビーに戻る（ルーム退出してロビー画面へ） */
  async returnToLobby() {
    await this.leaveRoom();
    this._callbacks.showScreen?.('lobby');
    this._callbacks.showToast?.('🏠 ロビーに戻りました');
  },

  /** 完全にマルチプレイを終了してタイトル画面へ */
  async returnToTitle() {
    await this.leaveRoom();
    this._callbacks.showScreen?.('title');
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
    try {
      if (this.state.roomId && this.state.user) {
        await rooms.leave(this.state.roomId, this.state.user.id);
      }
      realtime.leaveRoom();
    } catch (e) {
      console.warn('ルーム退出エラー:', e.message);
    }
    this._resetState();
  },

  /** ステートリセット（内部用） */
  _resetState() {
    this.state = {
      ...this.state,
      roomId: null,
      roomCode: null,
      isHost: false,
      playerId: null,
      players: [],
      connected: false,
      mpMode: false,
      submissions: {},
      rankings: [],
      myScore: null
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
