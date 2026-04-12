# AI探偵団 — AI Context

> このファイルはAIエージェントがプロジェクトを理解するための「目次」です。
> コードを変更する前に必ず参照してください。
>
> **更新タイミング**: CDW Phase 0（作業開始前）および Phase 7（作業完了後）

---

## プロジェクト概要

| 項目 | 内容 |
|------|------|
| **目的** | AIが毎回異なるミステリーシナリオを自動生成する推理ゲーム |
| **技術スタック** | Vanilla HTML/CSS/JS (ES Modules) + Claude API + Gemini API |
| **デプロイ先** | ローカル http-server (port 3456) + CORSプロキシ (port 3457) |
| **ローカル起動** | `npx http-server ./ai-detective -p 3456 --cors -c-1` + `node proxy.cjs` |
| **現在のバージョン** | v3.1 |
| **ステータス** | 開発中（Advisor Tool統合済み、実API検証待ち） |

---

## ファイル構成（重要ファイルのみ）

```
📂 ai-detective/
├── index.html          # メインゲーム画面（7つのscreen）
├── setup.html          # APIキー取得ガイドページ
├── lp.html             # ランディングページ
├── proxy.cjs           # CORSプロキシ（Anthropic/Gemini API中継）
├── AI_CONTEXT.md       # このファイル
├── css/
│   └── style.css       # デザインシステム（CSS変数 + 全コンポーネント）
└── js/
    ├── constants.js    # SSOT: テーマ/難易度/モデル/プロンプト/バリデーション定数
    ├── store.js        # SSOT: アプリ全状態 + localStorage永続化
    ├── claude.js       # Claude API通信 + 4パス検証パイプライン + Advisor Tool
    ├── gemini.js       # Gemini API通信 + 画像生成バッチ処理
    ├── app.js          # エントリポイント: イベント配線・画面遷移・ゲームフロー
    ├── renderer.js     # DOM描画: store.state → DOM 単方向フロー
    ├── cards.js        # カードUI: 3Dフリップ・選択制御・アニメーション
    └── share.js        # シェア: 圧縮(pako) + 暗号化(Web Crypto) + URL生成
```

---

## アーキテクチャ

- **状態管理**: Observer Pattern（store.js が単一ステート、subscribe で変更通知）
- **データフロー**: app.js → claude.js/gemini.js → store.update() → renderer.js
- **認証方式**: なし（APIキーはlocalStorage保存、フロント直接通信）
- **モジュール方式**: ES Modules (type="module")
- **CORSプロキシ**: proxy.cjs (Node.js) — ブラウザ→localhost:3457→Anthropic/Gemini
- **AI戦略**: Advisor Tool (Opus=アドバイザー, Sonnet=実行者) ON/OFF切替

### 生成パイプライン
```
ユーザー操作 → app.js → claude.js                          → gemini.js
                         ├── Pass 1: シナリオ生成           ├── 場面画像生成
                         ├── Pass 2: ローカル構造検証       ├── 容疑者ポートレート
                         ├── Pass 3: AI論理検証             └── カードイラスト
                         ├── Pass 4: AI日本語品質検証
                         └── Pass 5: 最終調整
```

### ゲームフロー
```
タイトル → 設定選択 → 生成中(8ステップ) → 導入 → 調査×3フェイズ → 回答 → 結果
```

---

## 制約事項（厳守）

- [ ] **外部ライブラリ最小化**: pako(圧縮)のみCDN。React/Vue等は使わない
- [ ] **SSOT原則**: 定数は constants.js、状態は store.js でのみ定義
- [ ] **DOM操作禁止**: app.jsはDOM直接操作しない（renderer.jsに委譲）
- [ ] **APIキー安全性**: APIキーはlocalStorageのみ。外部送信禁止
- [ ] **CORSプロキシ必須**: ブラウザから直接Anthropic APIは呼べない
- [ ] **Advisor Tool**: beta header `advisor-tool-2026-03-01` が必要

---

## SSOT マップ（Single Source of Truth）

| データ/定数 | 定義場所 | 備考 |
|------------|---------|------|
| テーマ定義 (THEMES) | `js/constants.js` | id, name, icon, locations, mood, era |
| 難易度定義 (DIFFICULTIES) | `js/constants.js` | suspect数, card数, hint有無 |
| モデル定義 (MODELS) | `js/constants.js` | Claude Opus/Sonnet |
| Advisor設定 (ADVISOR_CONFIG) | `js/constants.js` | executor/advisor/beta/caching |
| Geminiモデル (GEMINI_MODELS) | `js/constants.js` | Flash/Pro |
| プロンプトテンプレート | `js/constants.js` | buildScenarioSystemPrompt等 |
| アプリ全状態 | `js/store.js` | apiKey, scenario, currentPhase等 |
| CSS変数 | `css/style.css` | カラー、フォント、間隔 |
| 画面HTML | `index.html` | 7つのscreen要素 |

---

## 既知の問題・技術的負債

- [ ] CORSプロキシ(proxy.cjs)がローカルでしか動作しない → 本番デプロイ時に要対応
- [ ] constants.js が630行 → パフォーマンススキルで分割検討
- [ ] renderer.js が554行 → 画面ごとのファイル分割検討
- [ ] Advisor Tool の実API検証が未完了
- [ ] 画像生成のエラーハンドリングが弱い（リトライのみ）

---

## 最終更新

| 項目 | 内容 |
|------|------|
| **更新日** | 2026-04-12 |
| **更新者** | AI (Antigravity) |
| **変更内容** | CDW Phase 0: 初期生成。v3.1 時点のプロジェクト構造を文書化 |
