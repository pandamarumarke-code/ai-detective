# AI探偵団 Changelog

## 2026-04-13 12:12 — SV-10自動修正 + ネタバレ防止（CWF × UIデバッグスキル）
- **ステータス**: ✅ 完了（デプロイ済み・E2Eテスト合格）
- **根本原因分析（RCA）**:
  - Leg 1: SV-10がエラー文字列に犯人名を直接埋め込み → ユーザーに表示されネタバレ
  - Leg 2: エラーメッセージのネタバレフィルタが未実装
  - Leg 3: SV-10が「失敗→再試行」設計で「失敗→自動修正」になっていない
- **変更ファイル**:
  - `js/claude.js` — SV-10を自動修正に変更（犯人名自動挿入/critical昇格）+ sanitizeErrorMessage関数追加
  - `js/app.js` — エラー表示のネタバレ防止（構造検証エラーは汎用メッセージに変換）
- **修正内容**:
  1. `autoFixCulpritMention()`: 犯人名が不足→証言カードに自動挿入（再試行不要）
  2. `autoPromoteToCritical()`: critical不足→highカードを自動昇格
  3. `sanitizeErrorMessage()`: エラーメッセージから犯人名・固有名詞を伏字化
  4. app.js: 構造検証/解答チェーンのエラーは「品質基準を満たせませんでした」に統一

## 2026-04-13 02:56 — v5.0 ゲームデザイン抜本改善（ラテラルシンキング × CWFモデル）
- **ステータス**: ✅ 完了（デプロイ済み・E2Eテスト合格）
- **方針**: ラテラルシンキングで5つのフィードバックの根本原因「受動的な体験」を特定し、CWFモデルに則って設計・実装
- **Sprint 1: シナリオDNA + 解答チェーン検証**
  - `constants.js` — SCENARIO_DNA_OPTIONS(動機8種/トリック8種/ツイスト6種)追加、buildSolvabilityCheckPrompt新規
  - `claude.js` — Pass 5: AIが「探偵」としてカード情報のみで推理する解答チェーン検証追加
  - `app.js` — DNA生成(過去3ゲーム非重複保証) + localStorage管理
- **Sprint 2: フォーカスエリア + 推理メモ**
  - `constants.js` — SCENARIO_SCHEMA に focus_area/focus_label 追加（必須フィールド化）
  - `cards.js` — カード表面にフォーカスエリアラベル表示
  - `index.html` — 推理メモ(折りたたみ式 + 回答画面参照)
  - `renderer.js` — 回答画面で推理メモの参照表示
  - `store.js` — deductionMemo state管理
  - `style.css` — フォーカスラベル + 推理メモCSS
- **変更ファイル数**: 8ファイル（298行追加、27行削除）

## 2026-04-13 02:34 — ゲームデザイン根本改善（フィードバック対応）
- **ステータス**: ✅ 完了（デプロイ済み・E2Eテスト合格）
- **変更ファイル**:
  - `js/constants.js` — プロンプト強化（フェアプレイ厳格化、調査アクション指示、ランダムシード、人名禁止リスト）+ action_labelスキーマ追加
  - `js/claude.js` — SV-10フェアプレイ構造検証追加 + usedNames受け渡し
  - `js/app.js` — ヒントバグ修正（再帰コールバック）+ 過去人名localStorage管理
  - `js/cards.js` — カード表面に調査アクション名・タイプアイコン表示
  - `css/style.css` — 調査アクション表示用CSS
- **改善内容**:
  1. カード→調査アクション化（「遺体を検分する」等の能動的な調査行動名を表示）
  2. フェアプレイ原則の厳格化（答えに必要な情報が必ずカードに含まれるよう構造検証追加）
  3. シナリオ重複防止（ランダムシード + 過去3ゲーム分の人名禁止リスト）
  4. ヒントバグ修正（1→2→3と順番に使えるように）

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
