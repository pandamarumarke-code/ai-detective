// ================================================
// @ai-spec
// @module    cards
// @purpose   手がかりカードのUIモジュール。3Dフリップ・選択制御・アニメーション
// @ssot      なし
// @depends   constants.js (CARD_TYPE_LABELS), store.js
// @exports   createCardElement, setCardSelected, createRevealedCardItem, createClueListItem, animateCardReveal
// @consumers renderer.js, app.js
// @constraints
//   - カード画像はstore内のimageDataを参照（ローカルURL生成はしない）
// @dataflow  renderer.js → createCardElement() → DOM要素 → ユーザー操作 → app.js
// @updated   2026-04-12
// ================================================
// AI探偵団 — カードUIモジュール
// 3Dフリップ・選択制御・アニメーション
// ================================================

import { CARD_TYPE_LABELS } from './constants.js';
import store from './store.js';

/**
 * 手がかりカードのDOM要素を生成
 * @param {Object} card - ClueCardオブジェクト
 * @param {number} index - カード番号
 * @param {Function} onToggle - (card, isSelected) => void
 * @returns {HTMLElement}
 */
export function createCardElement(card, index, onToggle) {
  const el = document.createElement('div');
  el.className = 'clue-card';
  el.dataset.cardId = card.id;
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `手がかりカード ${index + 1}`);
  el.tabIndex = 0;

  const typeLabel = CARD_TYPE_LABELS[card.type] || '手がかり';

  // 画像表示の条件分岐
  const imageHtml = getCardImageHtml(card.id);

  // 調査アクション名（Sprint A: 能動的な調査体験）
  const actionLabel = card.action_label || card.title;

  el.innerHTML = `
    <div class="clue-card-inner">
      <div class="clue-card-front">
        <span class="card-action-icon">${card.type === 'testimony' ? '💬' : card.type === 'evidence' ? '🔍' : '📋'}</span>
        <span class="card-action-label">${escapeHTML(actionLabel)}</span>
        <span class="card-type-badge ${card.type}">${typeLabel}</span>
      </div>
      <div class="clue-card-back">
        ${imageHtml}
        <span class="card-type-badge ${card.type}">${typeLabel}</span>
        <div class="card-title">${escapeHTML(card.title)}</div>
        <div class="card-content">${escapeHTML(card.content)}</div>
      </div>
    </div>
  `;

  // クリックハンドラ
  const handleClick = () => {
    if (el.classList.contains('flipped') || el.classList.contains('disabled')) return;

    const isSelected = el.classList.contains('selected');
    onToggle(card, !isSelected);
  };

  el.addEventListener('click', handleClick);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  });

  return el;
}

/**
 * カードの選択状態をUIに反映
 * @param {HTMLElement} cardEl
 * @param {boolean} selected
 */
export function setCardSelected(cardEl, selected) {
  cardEl.classList.toggle('selected', selected);
  cardEl.setAttribute('aria-pressed', selected.toString());
}

/**
 * カードをフリップ（裏返し）する
 * @param {HTMLElement} cardEl
 * @returns {Promise<void>} アニメーション完了まで待機
 */
export function flipCard(cardEl) {
  return new Promise(resolve => {
    cardEl.classList.add('flipped');
    cardEl.classList.remove('selected');
    cardEl.style.cursor = 'default';
    cardEl.removeAttribute('tabindex');
    // CSSトランジション完了を待つ
    setTimeout(resolve, 600);
  });
}

/**
 * カードを無効化（暗くする）
 * @param {HTMLElement} cardEl
 */
export function disableCard(cardEl) {
  cardEl.classList.add('disabled');
  cardEl.style.opacity = '0.25';
  cardEl.style.pointerEvents = 'none';
  cardEl.removeAttribute('tabindex');
}

/**
 * 選択確定後のアニメーション処理
 * - 選択されたカードをフリップ
 * - 未選択カードをフェードアウト
 * @param {HTMLElement} cardsArea
 * @param {string[]} selectedIds - 選択されたカードのID配列
 * @returns {Promise<void>}
 */
export async function animateCardReveal(cardsArea, selectedIds) {
  const allCards = cardsArea.querySelectorAll('.clue-card');
  const flipPromises = [];

  allCards.forEach(el => {
    const id = el.dataset.cardId;
    if (selectedIds.includes(id)) {
      flipPromises.push(flipCard(el));
    } else {
      disableCard(el);
    }
  });

  await Promise.all(flipPromises);
}

/**
 * 公開済みカードの小型表示を生成
 * @param {Object} card - ClueCardオブジェクト
 * @returns {HTMLElement}
 */
export function createRevealedCardItem(card) {
  const typeLabel = CARD_TYPE_LABELS[card.type] || '手がかり';
  const div = document.createElement('div');
  div.className = 'revealed-card-item';

  const imageHtml = getCardImageHtml(card.id);

  div.innerHTML = `
    ${imageHtml}
    <span class="card-type-badge ${card.type}">${typeLabel}</span>
    <div class="card-title">${escapeHTML(card.title)}</div>
    <div class="card-content">${escapeHTML(card.content)}</div>
  `;
  return div;
}

/**
 * サイドバー用の手がかりリストアイテムを生成
 * @param {Object} card
 * @returns {HTMLElement}
 */
export function createClueListItem(card) {
  const typeLabel = CARD_TYPE_LABELS[card.type] || '手がかり';
  const div = document.createElement('div');
  div.className = 'clue-list-item';
  div.innerHTML = `
    <span class="card-type-badge ${card.type}">${typeLabel}</span>
    <div class="card-title">${escapeHTML(card.title)}</div>
    <div class="card-content">${escapeHTML(card.content)}</div>
  `;
  return div;
}

/**
 * カード画像HTMLを条件分岐で返す
 * @param {string} cardId
 * @returns {string} HTMLフラグメント
 */
function getCardImageHtml(cardId) {
  const { imageEnabled, imageCache } = store.state;
  const base64 = imageCache?.cards?.[cardId];

  if (base64) {
    // Case 1: 画像生成済み
    return `<div class="card-image"><img src="data:image/png;base64,${base64}" alt="手がかり" /></div>`;
  }
  if (imageEnabled && store.state.geminiApiKey) {
    // Case 2: 画像生成中（スケルトン）
    return `<div class="card-image card-image-loading" data-card-id="${cardId}"><div class="skeleton-pulse"></div></div>`;
  }
  // Case 3: 画像OFF → 何も表示しない
  return '';
}

/**
 * HTMLエスケープ
 */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
