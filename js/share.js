// ================================================
// @ai-spec
// @module    share
// @purpose   シナリオシェア機能。圧縮(pako) + 暗号化(Web Crypto) + URLハッシュ生成/復元
// @ssot      なし（ステートレス）
// @depends   pako (CDNグローバル: window.pako)
// @exports   detectSharedScenario, generateShareURL, shareURL, revealSharedSolution
// @consumers app.js
// @constraints
//   - 暗号化キーはURL内に含まれる（サーバーレス設計）
//   - pakoはwindow.pakoでアクセス（ES Module importではない）
// @dataflow  scenario → compress → encrypt → Base64URL → URLハッシュ ↔ 逆順で復元
// @updated   2026-04-12
// ================================================
// AI探偵団 — シナリオシェアモジュール
// 圧縮(pako) + 暗号化(Web Crypto) + URLハッシュ生成
// ================================================

// pakoはCDNからグローバルに読み込み済み（window.pako）

const SHARE_VERSION = 1;
const HASH_PREFIX = '/play/';

// ================================================
// Base64URL エンコード / デコード
// ================================================

function toBase64URL(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64URL(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // パディング復元
  while (base64.length % 4 !== 0) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ================================================
// 圧縮 / 解凍（pako deflate）
// ================================================

function compress(jsonStr) {
  if (typeof pako === 'undefined') {
    throw new Error('pakoライブラリが読み込まれていません');
  }
  return pako.deflate(jsonStr);
}

function decompress(uint8Array) {
  if (typeof pako === 'undefined') {
    throw new Error('pakoライブラリが読み込まれていません');
  }
  return pako.inflate(uint8Array, { to: 'string' });
}

// ================================================
// AES-GCM 暗号化 / 復号（Web Crypto API）
// ================================================

/**
 * シナリオのtitle + victim.nameから暗号鍵を導出
 */
async function deriveKey(scenario) {
  const seed = `${scenario.title}::${scenario.victim?.name || 'unknown'}`;
  const encoded = new TextEncoder().encode(seed);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/**
 * solutionを暗号化
 * @returns {{ ciphertext: string, iv: string }} Base64URLエンコード済み
 */
async function encryptSolution(scenario) {
  const key = await deriveKey(scenario);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(scenario.solution));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  return {
    ciphertext: toBase64URL(new Uint8Array(ciphertextBuffer)),
    iv: toBase64URL(iv)
  };
}

/**
 * solutionを復号
 * @param {Object} scenario - title, victimを含むシナリオ
 * @param {string} encCiphertext - Base64URLエンコードされた暗号文
 * @param {string} encIv - Base64URLエンコードされたIV
 * @returns {Object} 復号されたsolution
 */
async function decryptSolution(scenario, encCiphertext, encIv) {
  const key = await deriveKey(scenario);
  const iv = fromBase64URL(encIv);
  const ciphertext = fromBase64URL(encCiphertext);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const plaintext = new TextDecoder().decode(plaintextBuffer);
  return JSON.parse(plaintext);
}

// ================================================
// シナリオ → URLハッシュ（エンコード）
// ================================================

/**
 * シナリオをシェア用のURLハッシュにエンコード
 * @param {Object} scenario - 完全なシナリオデータ
 * @param {Object} meta - メタ情報（theme, difficulty, sharedBy等）
 * @returns {Promise<string>} URLハッシュ文字列
 */
export async function encodeScenarioToHash(scenario, meta) {
  // 1. solutionを暗号化
  const { ciphertext, iv } = await encryptSolution(scenario);

  // 2. シェアデータ構造を作成（solutionを除外）
  const shareData = {
    v: SHARE_VERSION,
    s: stripSolution(scenario),
    e: ciphertext,
    i: iv,
    m: {
      t: meta.theme,
      d: meta.difficulty,
      b: meta.sharedBy || '匿名探偵',
      a: new Date().toISOString().slice(0, 10),
      q: meta.qualityScore || 0,
      n: scenario.title
    }
  };

  // 3. JSON → 圧縮 → Base64URL
  const jsonStr = JSON.stringify(shareData);
  const compressed = compress(jsonStr);
  const encoded = toBase64URL(compressed);

  return HASH_PREFIX + encoded;
}

/**
 * シナリオからsolutionフィールドを除去したコピーを返す
 */
function stripSolution(scenario) {
  const copy = { ...scenario };
  delete copy.solution;
  delete copy._logicValidation;
  delete copy._japaneseQuality;
  delete copy._qualityScore;
  delete copy._validation;
  // questionsのanswerも隠蔽
  if (copy.questions) {
    copy.questions = copy.questions.map(q => ({
      ...q,
      answer: '(シェアデータのため非表示)'
    }));
  }
  // culprit_flashbacksからtime_hintを除去（推理ヒントの漏洩防止）
  // monologue（独白テキスト）はゲーム体験の一部として保持する
  if (copy.culprit_flashbacks) {
    copy.culprit_flashbacks = copy.culprit_flashbacks.map(fb => ({
      ...fb,
      time_hint: '(非表示)'
    }));
  }
  return copy;
}

// ================================================
// URLハッシュ → シナリオ（デコード）
// ================================================

/**
 * URLハッシュからシナリオをデコード
 * @param {string} hash - URLハッシュ（#以降）
 * @returns {{ scenario: Object, encSolution: string, encIv: string, meta: Object } | null}
 */
export function decodeHashToScenario(hash) {
  try {
    // #/play/ プレフィックスを除去
    let data = hash;
    if (data.startsWith('#')) data = data.slice(1);
    if (data.startsWith(HASH_PREFIX)) data = data.slice(HASH_PREFIX.length);
    if (!data || data.length < 10) return null;

    // Base64URL → 解凍 → JSON
    const compressed = fromBase64URL(data);
    const jsonStr = decompress(compressed);
    const shareData = JSON.parse(jsonStr);

    // バージョンチェック
    if (shareData.v !== SHARE_VERSION) {
      console.warn(`未対応のシェアバージョン: ${shareData.v}`);
      return null;
    }

    return {
      scenario: shareData.s,
      encSolution: shareData.e,
      encIv: shareData.i,
      meta: {
        theme: shareData.m.t,
        difficulty: shareData.m.d,
        sharedBy: shareData.m.b,
        sharedAt: shareData.m.a,
        qualityScore: shareData.m.q,
        title: shareData.m.n
      }
    };
  } catch (e) {
    console.error('シェアリンクのデコードに失敗:', e);
    return null;
  }
}

// ================================================
// 高レベルAPI
// ================================================

/**
 * 完全なシェアURLを生成
 * @param {Object} scenario - 完全なシナリオ
 * @param {Object} meta - { theme, difficulty, sharedBy, qualityScore }
 * @returns {Promise<string>} シェアURL
 */
export async function generateShareURL(scenario, meta) {
  const hash = await encodeScenarioToHash(scenario, meta);
  const url = `${window.location.origin}${window.location.pathname}#${hash}`;
  return url;
}

/**
 * 現在のURLにシェアハッシュがあるか検出
 * @returns {{ scenario, encSolution, encIv, meta } | null}
 */
export function detectSharedScenario() {
  const hash = window.location.hash;
  if (!hash || !hash.includes(HASH_PREFIX)) return null;
  return decodeHashToScenario(hash);
}

/**
 * シェアされたシナリオのsolutionを復号する（回答提出後に呼ぶ）
 * @param {Object} scenario
 * @param {string} encSolution
 * @param {string} encIv
 * @returns {Promise<Object>} solution
 */
export async function revealSharedSolution(scenario, encSolution, encIv) {
  return decryptSolution(scenario, encSolution, encIv);
}

/**
 * クリップボードにコピー + Web Share API
 * @param {string} url
 * @param {string} title
 * @returns {Promise<'copied'|'shared'|'error'>}
 */
export async function shareURL(url, title) {
  // Web Share API対応チェック
  if (navigator.share) {
    try {
      await navigator.share({
        title: `AI探偵団 — ${title}`,
        text: `この事件を解けるか？「${title}」に挑戦してみて！`,
        url
      });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'error'; // ユーザーキャンセル
      // フォールバック: クリップボードコピー
    }
  }

  // クリップボードにコピー
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    // 旧ブラウザフォールバック
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return 'copied';
  }
}
