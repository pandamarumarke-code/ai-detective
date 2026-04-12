# AI探偵団 Changelog

## 2026-04-13 00:32 — Sprint 5: UI仕上げ・E2Eテスト（最終スプリント）
- **ステータス**: ✅ 完了（デプロイ済み・E2Eテスト合格）
- **変更ファイル**:
  - `js/renderer.js` — renderResult MPモード検知→ボタンテキスト動的変更・シェア非表示・提出バー初期化
- **機能**: 結果画面のMP最適化（ロビー復帰ボタン、シェアセクション非表示、ランキング自動注入準備）
- **E2Eテスト**: ルーム作成→待機室表示→全メソッド存在確認 ✅ PASS
## 2026-04-13 00:25 — Sprint 4: 戦績保存・ルーム退出処理
- **ステータス**: ✅ 完了（デプロイ済み）
- **変更ファイル**:
  - `js/multiplayer.js` — saveGameResults, finishGame, returnToLobby, returnToTitle, _resetState追加
  - `js/app.js` — 結果画面ボタンMP分岐、onAllSubmittedで戦績保存、退出確認ダイアログ
- **機能**: 戦績DB保存、ルーム終了処理、退出確認ダイアログ、結果画面→ロビー復帰

## 2026-04-13 00:05 — Sprint 3: マルチプレイ回答同期・ランキング
- **ステータス**: ✅ 完了（デプロイ済み）
- **変更ファイル**:
  - `js/multiplayer.js` — 回答提出Broadcast、ランキング計算、提出状況バー
  - `js/app.js` — submitAnswerにMP分岐追加、onAllSubmittedコールバック
  - `css/style.css` — ランキングテーブル・提出状況バーCSS
  - `index.html` — 結果画面にランキングコンテナ追加
- **機能**: 各プレイヤーの回答をBroadcast、全員提出後にスコアランキング表示

## 2026-04-12 23:28 — Sprint 2: ゲーム開始同期・バグ修正
- **ステータス**: ✅ 完了
- **変更ファイル**:
  - `js/multiplayer.js` — コールバック方式統一、ゲーム開始Broadcast
  - `js/app.js` — R.showScreen統一、シナリオ生成→Broadcast実装
  - `js/supabase.js` — 遅延初期化方式に修正
  - `index.html` — style="display:none"廃止 → activeクラス方式
- **バグ修正**: 画面遷移競合、ルームコード未表示、参加者0/4問題

## 2026-04-12 22:55 — Sprint 1: マルチプレイ基盤
- **ステータス**: ✅ 完了
- **変更ファイル**:
  - `js/supabase.js` (新規) — Supabase SDK初期化・認証・ルームCRUD・Realtime
  - `js/multiplayer.js` (新規) — マルチプレイUI制御・ゲームフロー
  - `js/app.js` — マルチプレイイベントリスナー追加
  - `css/style.css` — ニックネーム・ロビー・待機室・チャットCSS
  - `index.html` — 4画面追加（ニックネーム/ロビー/設定/待機室）
