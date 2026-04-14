# AI探偵団 — AI Context

> このファイルはAIエージェントがプロジェクトを理解するための「目次」です。
> コードを変更する前に必ず参照してください。
>
> **更新タイミング**: CWF Phase 0（作業開始前）および Phase 7（作業完了後）

---

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| **目的** | AIが毎回異なるミステリーシナリオを自動生成する推理ゲーム |
| **技術スタック** | Vanilla HTML/CSS/JS (ES Modules) + Claude API + Gemini API + Supabase Realtime |
| **デプロイ先** | Vercel（GitHub連携自動デプロイ）+ Supabase（マルチプレイ） |
| **ローカル起動** | `npx http-server ./ai-detective -p 3456 --cors -c-1` + `node proxy.cjs` |
| **現在のバージョン** | v7.1 |
| **ステータス** | 開発中（デバッグモード追加・画像生成エラー修正済み） |

---

## ファイル構成（重要ファイルのみ）

```
📂 ai-detective/
├── index.html          # メインゲーム画面（複数screen）
├── setup.html          # APIキー取得ガイドページ
├── lp.html             # ランディングページ
├── proxy.cjs           # CORSプロキシ（Anthropic/Gemini API中継）
├── vercel.json         # Vercel設定
├── AI_CONTEXT.md       # このファイル
├── css/
│   └── style.css       # デザインシステム（CSS変数 + 全コンポーネント + デバッグパネル）
└── js/
    ├── constants.js    # SSOT: テーマ/難易度/モデル/プロンプト/バリデーション定数/スキーマ/MOCK_SCENARIO
    ├── store.js        # SSOT: アプリ全状態 + localStorage永続化 + debugModeフラグ
    ├── debug.js        # デバッグモード制御（モック生成・ログ・パネルUI）
    ├── claude.js       # Claude API通信 + 5パス検証パイプライン
    ├── gemini.js       # Gemini API通信 + 画像生成バッチ処理
    ├── app.js          # エントリポイント: イベント配線・画面遷移・ゲームフロー
    ├── renderer.js     # DOM描画: store.state → DOM 単方向フロー
    ├── cards.js        # カードUI: 3Dフリップ・選択制御・アニメーション
    ├── share.js        # シェア: 圧縮(pako) + 暗号化(Web Crypto) + URL生成
    ├── supabase.js     # Supabase接続・認証・ルームCRUD・Realtime
    └── multiplayer.js  # マルチプレイUI制御・ゲームフロー
```

---

## アーキテクチャ

- **状態管理**: Observer Pattern（store.js が単一ステート、subscribe で変更通知）
- **データフロー**: app.js → claude.js/gemini.js → store.update() → renderer.js
- **認証方式**: なし（APIキーはlocalStorage保存、フロント直接通信）/ Supabase Auth（マルチプレイ）
- **モジュール方式**: ES Modules (type="module") ※supabase.js/multiplayer.jsはUMD(CDN)
- **CORSプロキシ**: proxy.cjs (Node.js) → Vercel Serverless Functions (api/*.js)
- **AI戦略**: Advisor Tool (Opus=アドバイザー, Sonnet=実行者) ON/OFF切替
- **デバッグモード**: `?debug=true` / localStorage / コンソールの3方式でON（APIコスト$0）

### デバッグモード
```
ON方法: URL ?debug=true / localStorage ai_detective_debug=true / window.__debugDetective=true
機能:
  - モックシナリオで即座にゲーム開始（API呼び出しゼロ）
  - デバッグパネル（フェーズスキップ・全カード公開・結果画面直行）
  - 構造化ログ（window.__debugLogs でアクセス可能）
OFF方法: URL ?debug=false / store.disableDebug() / localStorage削除
```

### ゲームフロー（v7.1）
```
タイトル → 設定選択 → 生成中(8ステップ) → 導入 → 📜第1幕(展開) → 調査① → 📜第2幕(新事実) → 調査② → 📜第3幕(急展開) → 調査③ → 回答 → 結果
```

---

## 制約事項（厳守）

1. **外部ライブラリ最小化**: pako(圧縮), Supabase SDK のみCDN。React/Vue等は使わない
2. **SSOT原則**: 定数は constants.js、状態は store.js でのみ定義
3. **DOM操作禁止**: app.jsはDOM直接操作しない（renderer.jsに委譲）
4. **APIキー安全性**: APIキーはlocalStorageのみ。外部送信禁止
5. **ネタバレ防止**: エラーメッセージに犯人名・固有名詞を含めない

---

## SSOT マップ（Single Source of Truth）

| データ/定数 | 定義場所 | 備考 |
|------------|---------|------|
| テーマ定義 (THEMES) | `js/constants.js` | 6テーマ |
| 難易度定義 (DIFFICULTIES) | `js/constants.js` | 3難易度 |
| シナリオDNA (SCENARIO_DNA_OPTIONS) | `js/constants.js` | 動機8/トリック8/ツイスト6 |
| モックシナリオ (MOCK_SCENARIO) | `js/constants.js` | デバッグ用テストデータ |
| JSON Schema (SCENARIO_SCHEMA) | `js/constants.js` | Structured Outputs用 |
| プロンプトテンプレート | `js/constants.js` | buildScenarioSystemPrompt等 |
| アプリ全状態 | `js/store.js` | apiKey, scenario, debugMode等 |
| CSS変数 | `css/style.css` | カラー、フォント、間隔 |

---

## 最終更新

| 項目 | 内容 |
|------|------|
| **更新日** | 2026-04-14 |
| **更新者** | AI (Antigravity) |
| **変更内容** | v7.1: デバッグモード追加、Gemini画像生成エラー修正（responseModalities: ['TEXT','IMAGE']） |
