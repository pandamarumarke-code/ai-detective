# AI探偵団 Changelog

## 2026-04-14 02:55 — v7.2 タイムアウト根本解決（ラテラルシンキング分析）
- **ステータス**: ✅ 完了（Redeploy済み）
- **根本原因**: Claude structured output（json_schema）のgrammar compilationにより、streaming有効でも最初のSSEイベント送出まで60〜140秒遅延 → Vercel Edge/Serverlessの全プランでタイムアウト
- **解決策**: Vercel `maxDuration:300`（5分）を設定 + ダッシュボードで300秒に変更 + 再デプロイ
- **変更ファイル**:
  - `vercel.json` — `functions.maxDuration=300` 追加
  - `api/anthropic.js` — Edge→通常Serverless Function戻し、stream:true注入削除
  - `api/gemini.js` — Edge→通常Serverless Function戻し
  - `js/claude.js` — SSEパーサー完全削除、response.json()に戻す
- **変更ファイル数**: 4ファイル（245行削除）
- **Git**: `b5f0d5e` main → Vercel再デプロイ（Da3RWkrxP）

## 2026-04-14 02:04 — v7.1 生成画面UX大幅改善
- **ステータス**: ✅ 完了（デプロイ済み）
- **設計方針**: 生成に90〜225秒かかる間、ユーザーにフリーズと区別がつかない問題を解消
- **変更ファイル**:
  - `index.html` — プログレスバー・経過時間・サブメッセージ・各ステップ所要時間HTML追加
  - `js/renderer.js` — タイマー管理・プログレスバー更新・サブメッセージローテーション
  - `css/style.css` — プログレスバー・経過時間・サブメッセージのCSS追加
- **変更ファイル数**: 3ファイル（206行追加）
- **Git**: `ee941bb` main → Vercel自動デプロイ
- **コスト分析**: 1ゲーム ≈ $0.20（Claude $0.18 + Gemini $0.02）

## 2026-04-14 00:20 — v7.0 暗転シーン（犯人視点フラッシュバック）追加（CWFモデル）
- **ステータス**: ✅ 完了（デプロイ済み）
- **設計方針**: 調査フェーズの合間に犯人の断片的独白を表示。倒叙トリック×フーダニットの融合で没入感UP
- **CWFフェーズ**: Phase 0(AI_CONTEXT.md更新) → 1(計画) → 2(V1/V2/V3全PASS) → 4(実装) → 6(デプロイ) → 7(コンテキスト更新)
- **変更ファイル**:
  - `js/constants.js` — `culprit_flashbacks`スキーマ追加 + プロンプトに暗転シーン生成指示追加
  - `js/renderer.js` — `renderBlackoutScene()`新規追加 + `showGamePanel`にblackout登録
  - `js/app.js` — `confirmCards()`内で暗転→物語展開→調査の3段階フロー実装
  - `index.html` — `panel-blackout`（暗転パネル）HTML追加
  - `css/style.css` — 暗転演出CSS（ビネットエフェクト、パルスアニメーション、独白フェードイン）
  - `AI_CONTEXT.md` — v7.0に更新
- **変更ファイル数**: 6ファイル（210行追加、48行削除）
- **Git**: `8b924d3` main → Vercel自動デプロイ

## 2026-04-14 01:05 — v7.0.1 3軸AI検証によるネタバレ防止強化
- **ステータス**: ✅ 完了（デプロイ済み）
- **設計方針**: CWF Phase 2の3軸AI検証（V1構造/V2技術/V3リスク）で9件の指摘を特定。CRITICAL 1件 + HIGH 1件を即対応
- **変更ファイル**:
  - `js/claude.js` — SV-11バリデーション追加（独白から犯人名/容疑者名を自動除去）
  - `js/renderer.js` — ランタイムネタバレフィルタ追加（犯人名→■■■伏字化）
  - `js/constants.js` — culprit_flashbacksスキーマにminItems:2/maxItems:2追加
- **変更ファイル数**: 3ファイル（61行追加）
- **Git**: `56992e3` main → Vercel自動デプロイ
- **検証レポート**: verification_report.md（9件指摘、3件対応済み、6件は仕様判断/将来対応）

## 2026-04-14 01:17 — v7.0.2 3軸AI検証レポート残り4件対応
- **ステータス**: ✅ 完了（デプロイ済み）
- **変更ファイル**:
  - `js/constants.js`, `js/renderer.js`, `js/app.js`, `js/claude.js` — @ai-spec @updated日付を2026-04-14に更新
  - `css/style.css` — ビネットCSS position:fixed→absolute（サイドバー影響防止）+ blackoutBtnRevealアニメーション独立化
  - `js/share.js` — stripSolution()でculprit_flashbacksのtime_hint除去（推理ヒント漏洩防止）
- **変更ファイル数**: 7ファイル（32行追加、6行削除）
- **Git**: `efbbf2b` main → Vercel自動デプロイ
- **検証レポート完了**: 9件中7件対応済み / 2件は仕様として許容（R-2: easyモード暗転1回, S-2: マルチプレイはコードOK）

## 2026-04-13 12:35 — v6.0 マーダーミステリー型時系列進行（CWFモデル）
- **ステータス**: ✅ 完了（デプロイ済み・E2Eテスト合格）
- **設計方針**: マーダーミステリーの3幕構成（導入→調査→新事実→調査→急展開→最終調査→推理）を導入
- **変更ファイル**:
  - `js/constants.js` — スキーマに`phase_title`/`phase_narrative`追加、プロンプトにMM型進行指示追加
  - `js/renderer.js` — `renderPhaseNarrative()`新規追加、`showGamePanel`にnarrative登録
  - `js/app.js` — `startInvestigation`をストーリー展開→カード表示にフロー変更、`showInvestigationCards`分離
  - `index.html` — `panel-narrative`（物語展開パネル）HTML追加
  - `css/style.css` — シネマティック演出CSS（フェードイン+フローティング+ゴールドボーダー）
- **変更ファイル数**: 6ファイル（153行追加、3行削除）

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
