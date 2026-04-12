// ================================================
// @ai-spec
// @module    supabase
// @purpose   Supabase接続・認証・ルーム管理・リアルタイム同期の統合モジュール
// @ssot      SUPABASE_URL, SUPABASE_ANON_KEY, supabaseClient
// @depends   @supabase/supabase-js (CDN: window.supabase)
// @exports   window.SupabaseClient (auth, rooms, realtime)
// @consumers multiplayer.js, app.js
// @constraints
//   - Supabaseクライアントはこのファイル内でのみ初期化
//   - RLSポリシーに依存するため匿名Auth必須
//   - CDN読み込み完了を待ってから初期化（遅延初期化方式）
// @dataflow  app.js → supabase.js → Supabase Cloud → Broadcast/Presence → 全クライアント
// @updated   2026-04-12 Sprint 2 fix
// ================================================

const SUPABASE_URL = 'https://tfsikcjgowdphyfhzaah.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmc2lrY2pnb3dkcGh5Zmh6YWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTY2NjksImV4cCI6MjA5MTU3MjY2OX0.Z5At9w2fZY6ikxX0LI7260qjW_sZLLeo5VoUyqM-zHs';

// 遅延初期化: CDN読み込み完了を待つ
let _supabaseClient = null;

function getClient() {
  if (!_supabaseClient) {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      throw new Error('Supabase SDK がまだ読み込まれていません。ページを再読み込みしてください。');
    }
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase クライアント初期化完了');
  }
  return _supabaseClient;
}

// ================================================
// ルームコード生成（4文字英大文字）
// ================================================
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // I,Oを除外
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
  async signInAnonymously(nickname) {
    const client = getClient();
    const { data, error } = await client.auth.signInAnonymously({
      options: {
        data: { nickname }
      }
    });
    if (error) throw error;
    return data.user;
  },

  async getUser() {
    const client = getClient();
    const { data: { user } } = await client.auth.getUser();
    return user;
  },

  getNickname(user) {
    return user?.user_metadata?.nickname || '匿名探偵';
  }
};

// ================================================
// ルーム操作（CRUD）
// ================================================
const rooms = {
  async create({ theme, difficulty, hostId, nickname }) {
    const client = getClient();
    let roomCode;
    let retries = 5;
    while (retries > 0) {
      roomCode = generateRoomCode();
      const { data: existing } = await client
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .eq('status', 'waiting')
        .maybeSingle();
      if (!existing) break;
      retries--;
    }

    const { data: room, error } = await client
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
    await this.addPlayer(room.id, hostId, nickname, true);
    return room;
  },

  async join(roomCode, userId, nickname) {
    const client = getClient();
    const { data: room, error: findError } = await client
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

    const alreadyJoined = room.players?.find(p => p.user_id === userId);
    if (alreadyJoined) return room;

    await this.addPlayer(room.id, userId, nickname, false);
    return room;
  },

  async addPlayer(roomId, userId, nickname, isHost) {
    const client = getClient();
    const avatars = ['🕵️', '🔍', '🧐', '👀', '🎭', '🦊', '🐻', '🐼'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    const { error } = await client
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

  async get(roomId) {
    const client = getClient();
    const { data, error } = await client
      .from('rooms')
      .select('*, players(*)')
      .eq('id', roomId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(roomId, status) {
    const client = getClient();
    const { error } = await client
      .from('rooms')
      .update({ status })
      .eq('id', roomId);
    if (error) throw error;
  },

  async saveScenario(roomId, scenario) {
    const client = getClient();
    const scenarioWithoutSolution = { ...scenario };
    const solution = scenario.solution;
    delete scenarioWithoutSolution.solution;

    const { error } = await client
      .from('rooms')
      .update({
        scenario: scenarioWithoutSolution,
        solution_encrypted: JSON.stringify(solution)
      })
      .eq('id', roomId);

    if (error) throw error;
  },

  async submitAnswers(playerId, answers) {
    const client = getClient();
    const { error } = await client
      .from('players')
      .update({ answers, status: 'submitted' })
      .eq('id', playerId);
    if (error) throw error;
  },

  async saveScore(playerId, score, rank) {
    const client = getClient();
    const { error } = await client
      .from('players')
      .update({ score, rank })
      .eq('id', playerId);
    if (error) throw error;
  },

  async leave(roomId, userId) {
    const client = getClient();
    const { error } = await client
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

  joinRoom(roomCode, userId, nickname, callbacks = {}) {
    const client = getClient();
    const channelName = `room:${roomCode}`;

    this._channel = client.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: userId }
      }
    });

    // Presence
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

    // Broadcast events
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

    // Subscribe + Presence track
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

  broadcast(event, payload) {
    if (!this._channel) return;
    this._channel.send({
      type: 'broadcast',
      event,
      payload
    });
  },

  leaveRoom() {
    if (this._channel) {
      const client = getClient();
      client.removeChannel(this._channel);
      this._channel = null;
    }
  }
};

// グローバルエクスポート
window.SupabaseClient = { auth, rooms, realtime, getClient };
console.log('✅ SupabaseClient モジュール登録完了');
