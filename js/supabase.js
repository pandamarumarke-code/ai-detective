// ================================================
// @ai-spec
// @module    supabase
// @purpose   Supabase接続・認証・ルーム管理・リアルタイム同期の統合モジュール
// @ssot      SUPABASE_URL, SUPABASE_ANON_KEY, supabaseClient
// @depends   @supabase/supabase-js (CDN)
// @exports   supabase (singleton), auth, rooms, realtime
// @consumers multiplayer.js, app.js
// @constraints
//   - Supabaseクライアントはこのファイル内でのみ初期化
//   - RLSポリシーに依存するため匿名Auth必須
// @dataflow  app.js → supabase.js → Supabase Cloud → Broadcast/Presence → 全クライアント
// @updated   2026-04-12
// ================================================

const SUPABASE_URL = 'https://tfsikcjgowdphyfhzaah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2lrY2pnb3dkcGh5Zmh6YWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY2NjksImV4cCI6MjA5MTU3MjY2OX0.Z5At9w2fZY6ikxX0LI7260qjW_sZLLeo5VoUyqM-zHs';

// Supabase SDKはCDNからグローバルに読み込まれる
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================================
// ルームコード生成（4文字英大文字）
// ================================================
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I,Oを除外（紛らわしいため）
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ================================================
// 認証（匿名ログイン + ニックネーム）
// ================================================
const auth = {
  /** 匿名サインイン */
  async signInAnonymously(nickname) {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: { nickname }
      }
    });
    if (error) throw error;
    return data.user;
  },

  /** 現在のユーザーを取得 */
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /** ニックネーム取得 */
  getNickname(user) {
    return user?.user_metadata?.nickname || '匿名探偵';
  }
};

// ================================================
// ルーム操作（CRUD）
// ================================================
const rooms = {
  /** ルームを作成 */
  async create({ theme, difficulty, hostId, nickname }) {
    // ユニークなルームコードを生成（衝突時はリトライ）
    let roomCode;
    let retries = 5;
    while (retries > 0) {
      roomCode = generateRoomCode();
      const { data: existing } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .eq('status', 'waiting')
        .maybeSingle();
      if (!existing) break;
      retries--;
    }

    // ルーム作成
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        room_code: roomCode,
        host_id: hostId,
        theme,
        difficulty,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) throw error;

    // ホストをプレイヤーとして追加
    await this.addPlayer(room.id, hostId, nickname, true);

    return room;
  },

  /** ルームコードで参加 */
  async join(roomCode, userId, nickname) {
    // ルームを検索
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select('*, players(*)')
      .eq('room_code', roomCode.toUpperCase())
      .eq('status', 'waiting')
      .maybeSingle();

    if (findError) throw findError;
    if (!room) throw new Error('ルームが見つかりません。コードを確認してください。');
    if (room.players && room.players.length >= room.max_players) {
      throw new Error('ルームが満員です（最大4人）');
    }

    // 既に参加済みかチェック
    const alreadyJoined = room.players?.find(p => p.user_id === userId);
    if (alreadyJoined) return room;

    // プレイヤー追加
    await this.addPlayer(room.id, userId, nickname, false);

    return room;
  },

  /** プレイヤーをルームに追加 */
  async addPlayer(roomId, userId, nickname, isHost) {
    const avatars = ['🕵️', '🔍', '🧐', '👀', '🎭', '🦊', '🐻', '🐼'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const { error } = await supabase
      .from('players')
      .insert({
        room_id: roomId,
        user_id: userId,
        nickname,
        avatar_emoji: avatar,
        is_host: isHost
      });

    if (error) throw error;
  },

  /** ルーム情報を取得（プレイヤー含む） */
  async get(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*, players(*)')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  },

  /** ルーム状態を更新 */
  async updateStatus(roomId, status) {
    const { error } = await supabase
      .from('rooms')
      .update({ status })
      .eq('id', roomId);
    if (error) throw error;
  },

  /** シナリオをルームに保存（solutionは除外） */
  async saveScenario(roomId, scenario) {
    // solutionを暗号化/除外して保存
    const scenarioWithoutSolution = { ...scenario };
    const solution = scenario.solution;
    delete scenarioWithoutSolution.solution;

    const { error } = await supabase
      .from('rooms')
      .update({
        scenario: scenarioWithoutSolution,
        solution_encrypted: JSON.stringify(solution)
      })
      .eq('id', roomId);

    if (error) throw error;
  },

  /** プレイヤーの回答を保存 */
  async submitAnswers(playerId, answers) {
    const { error } = await supabase
      .from('players')
      .update({ answers, status: 'submitted' })
      .eq('id', playerId);
    if (error) throw error;
  },

  /** プレイヤーのスコアを保存 */
  async saveScore(playerId, score, rank) {
    const { error } = await supabase
      .from('players')
      .update({ score, rank })
      .eq('id', playerId);
    if (error) throw error;
  },

  /** ルームから退出 */
  async leave(roomId, userId) {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    if (error) throw error;
  }
};

// ================================================
// リアルタイム同期
// ================================================
const realtime = {
  _channel: null,

  /** ルームチャンネルに接続 */
  joinRoom(roomCode, userId, nickname, callbacks = {}) {
    const channelName = `room:${roomCode}`;

    this._channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    });

    // Presence: プレイヤーのオンライン状態
    this._channel.on('presence', { event: 'sync' }, () => {
      const state = this._channel.presenceState();
      callbacks.onPresenceSync?.(state);
    });

    this._channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onPlayerJoin?.(key, newPresences);
    });

    this._channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onPlayerLeave?.(key, leftPresences);
    });

    // Broadcast: ゲームイベント
    this._channel.on('broadcast', { event: 'game_start' }, (payload) => {
      callbacks.onGameStart?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'scenario_ready' }, (payload) => {
      callbacks.onScenarioReady?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'gen_progress' }, (payload) => {
      callbacks.onGenProgress?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'phase_change' }, (payload) => {
      callbacks.onPhaseChange?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'player_submitted' }, (payload) => {
      callbacks.onPlayerSubmitted?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'results_ready' }, (payload) => {
      callbacks.onResultsReady?.(payload.payload);
    });

    this._channel.on('broadcast', { event: 'chat' }, (payload) => {
      callbacks.onChat?.(payload.payload);
    });

    // チャンネルに参加 + Presenceを登録
    this._channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this._channel.track({
          user_id: userId,
          nickname,
          online_at: new Date().toISOString()
        });
        callbacks.onConnected?.();
      }
    });

    return this._channel;
  },

  /** ブロードキャスト送信 */
  broadcast(event, payload) {
    if (!this._channel) return;
    this._channel.send({
      type: 'broadcast',
      event,
      payload
    });
  },

  /** チャンネルから離脱 */
  leaveRoom() {
    if (this._channel) {
      supabase.removeChannel(this._channel);
      this._channel = null;
    }
  }
};

// グローバルエクスポート（ES Modules未使用のため）
window.SupabaseClient = { supabase, auth, rooms, realtime };
