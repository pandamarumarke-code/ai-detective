// ================================================
// @ai-spec
// @module    constants
// @purpose   不変データの単一定義場所（SSOT）。テーマ/難易度/モデル/プロンプト/バリデーション定数
// @ssot      THEMES, DIFFICULTIES, MODELS, ADVISOR_CONFIG, GEMINI_MODELS, IMAGE_CONFIG, SCENARIO_SCHEMA, SCENARIO_DNA_OPTIONS
// @depends   なし
// @exports   THEMES, DIFFICULTIES, MODELS, ADVISOR_CONFIG, GEMINI_MODELS, IMAGE_CONFIG, IMAGE_PROMPTS, CARD_TYPE_LABELS, SCENARIO_SCHEMA, DEEP_VALIDATION_SCHEMA, JAPANESE_QUALITY_SCHEMA, SCORING_SCHEMA, SOLVABILITY_CHECK_SCHEMA, VALIDATION_THRESHOLDS, SCENARIO_DNA_OPTIONS, buildScenarioSystemPrompt, buildDeepValidationPrompt, buildJapaneseQualityPrompt, buildScoringPrompt, buildSolvabilityCheckPrompt, getRank
// @consumers claude.js, gemini.js, app.js, renderer.js, cards.js
// @constraints
//   - このファイル内の定数を他ファイルで再定義しない（SSOT原則）
//   - プロンプトテンプレートの変更は品質検証パイプラインに影響するため慎重に
// @dataflow  このモジュール → 全モジュールが参照（読み取り専用）
// @updated   2026-04-14
// ================================================
// AI探偵団 — 定数定義モジュール（SSOT: 不変データ）
// テーマ設定・難易度設定・プロンプトテンプレート
// ================================================

// ================================================
// テーマ設定
// ================================================
export const THEMES = {
  classic: {
    id: 'classic',
    name: 'クラシック',
    icon: '🏛️',
    description: '洋館・密室・正統派',
    locations: ['古い洋館', '豪華な別荘', '密室のある屋敷', '英国風の邸宅', '山奥のホテル'],
    mood: 'アガサ・クリスティ風の正統派ミステリー。品格と緊張感のある物語。',
    era: '現代または1950年代'
  },
  school: {
    id: 'school',
    name: '学園',
    icon: '🏫',
    description: '学校・部活・青春',
    locations: ['私立高校', '大学キャンパス', '寄宿舎', '文化祭準備中の学校', '夏合宿の山荘'],
    mood: '学園ミステリー。青春の光と影が交錯する物語。友情と秘密がテーマ。',
    era: '現代'
  },
  sf: {
    id: 'sf',
    name: 'SF',
    icon: '🚀',
    description: '宇宙船・未来・テクノロジー',
    locations: ['宇宙ステーション', '火星コロニー', 'AI研究施設', '深海研究基地', '軌道エレベーター'],
    mood: 'SF的な設定と科学的トリック。テクノロジーが鍵を握る知的な謎。',
    era: '近未来（2080年代）'
  },
  japanese: {
    id: 'japanese',
    name: '和風',
    icon: '⛩️',
    description: '旅館・祭り・伝統',
    locations: ['温泉旅館', '古寺院', '祭りの夜の神社', '京都の老舗料亭', '離島の漁村'],
    mood: '和風の情緒ある雰囲気。人間関係の機微が光る物語。',
    era: '現代または明治〜大正時代'
  },
  noir: {
    id: 'noir',
    name: 'ノワール',
    icon: '🌃',
    description: '都市・裏社会・ハードボイルド',
    locations: ['夜の繁華街', '高層ビルのオフィス', '裏カジノ', '港の倉庫', '雨のダイナー'],
    mood: 'ハードボイルドな都市犯罪ドラマ。裏切りと欲望が渦巻く世界。',
    era: '現代'
  },
  fantasy: {
    id: 'fantasy',
    name: 'ファンタジー',
    icon: '🧙',
    description: '魔法・王国・ドラゴン',
    locations: ['魔法学院', '王城の宴会場', 'ドワーフの鉱山都市', 'エルフの森の集落', '竜の巣窟の酒場'],
    mood: '剣と魔法の世界で起きる不可思議な事件。魔法は制約つきで使用。',
    era: '中世ファンタジー世界'
  }
};

// ================================================
// 難易度設定
// ================================================
export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'ビギナー',
    stars: '⭐',
    description: 'ヒント多め・容疑者3人',
    suspectCount: 3,
    phasesCount: 3,
    cardsPerPhase: [3, 3, 2],
    selectablePerPhase: [2, 2, 2],
    redHerringRatio: 0.1,
    hintLevel: '多め（手がかりが直接的で、犯人を絞り込みやすい）'
  },
  normal: {
    id: 'normal',
    name: 'スタンダード',
    stars: '⭐⭐',
    description: 'バランス型・容疑者4人',
    suspectCount: 4,
    phasesCount: 3,
    cardsPerPhase: [4, 4, 3],
    selectablePerPhase: [2, 2, 2],
    redHerringRatio: 0.25,
    hintLevel: '標準（論理的に考えれば解ける）'
  },
  hard: {
    id: 'hard',
    name: 'ハード',
    stars: '⭐⭐⭐',
    description: 'レッドヘリング多・容疑者5人',
    suspectCount: 5,
    phasesCount: 3,
    cardsPerPhase: [5, 4, 4],
    selectablePerPhase: [2, 2, 2],
    redHerringRatio: 0.4,
    hintLevel: '少なめ（レッドヘリング多数、注意深い推理が必要）'
  }
};

// ================================================
// Claude APIモデル選択
// ================================================
export const MODELS = {
  opus: {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: '最高品質（推奨）',
    inputCost: 5.0,   // $/1M tokens
    outputCost: 25.0   // $/1M tokens
  },
  sonnet: {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    description: 'コスト重視',
    inputCost: 3.0,
    outputCost: 15.0
  }
};

// ================================================
// Advisor Tool設定（Opus=アドバイザー、Sonnet=実行者）
// ================================================
export const ADVISOR_CONFIG = {
  executor: 'claude-sonnet-4-6',
  advisor: 'claude-opus-4-6',
  betaHeader: 'advisor-tool-2026-03-01',
  caching: { type: 'ephemeral', ttl: '5m' },
  maxUsesPerCall: {
    scenarioGeneration: 1,
    logicValidation: 1,
    japaneseQuality: 1,
    scoring: 1
  }
};

// ================================================
// Gemini（NanoBanana）画像生成モデル選択
// ================================================
export const GEMINI_MODELS = {
  flash: {
    id: 'gemini-3.1-flash-image-preview',
    name: 'Flash 3.1 Image',
    description: '高速・推奨',
    costPerImage: 0.002
  },
  pro: {
    id: 'gemini-3-pro-image-preview',
    name: 'Pro 3 Image',
    description: '高品質・低速',
    costPerImage: 0.005
  }
};

// ================================================
// 画像生成設定
// ================================================
export const IMAGE_CONFIG = {
  aspectRatio: {
    portrait: '3:4',
    card: '1:1',
    scene: '16:9'
  },
  batch: {
    concurrency: 3,
    retryMax: 2,
    baseDelay: 1000
  }
};

// ================================================
// 画像生成プロンプトテンプレート
// ================================================
export const IMAGE_PROMPTS = {
  portrait: (suspect, theme) =>
    `Character portrait illustration for a mystery game.
Character: ${suspect.name}, ${suspect.age || '30代'}, ${suspect.role || '関係者'}.
Personality: ${suspect.personality || ''}.
Setting: ${theme.mood}.
Style: Dark mystery illustration, anime-inspired, upper body portrait,
looking at viewer, dramatic lighting. Single character only.
Do NOT include any text or letters in the image.`,

  card: (card, theme) =>
    `Mystery clue card illustration.
Subject: "${card.title}" — ${(card.content || '').substring(0, 80)}.
Card type: ${card.type === 'testimony' ? 'witness testimony' :
              card.type === 'evidence' ? 'physical evidence' : 'circumstantial evidence'}.
Setting: ${theme.mood}.
Style: Dark mystery game card art, symbolic composition, square format.
Do NOT include any text or letters in the image.`,

  scene: (scenario, theme) =>
    `Wide establishing shot for a mystery story.
Location: ${scenario.setting?.location || '不明な場所'}.
Atmosphere: ${theme.mood}. Era: ${theme.era}.
Style: Cinematic, mysterious and foreboding atmosphere,
dramatic lighting, high detail, wide angle.
Do NOT include any text or letters in the image.`
};

// ================================================
// 探偵ランク
// ================================================
export const RANKS = [
  { minRatio: 0.85, badge: '🏆', title: '名探偵', color: '#fcd34d' },
  { minRatio: 0.70, badge: '🥈', title: '探偵',   color: '#94a3b8' },
  { minRatio: 0.45, badge: '🥉', title: '見習い探偵', color: '#d97706' },
  { minRatio: 0.00, badge: '💤', title: '迷探偵', color: '#6b7280' }
];

/**
 * スコア比からランクを取得
 * @param {number} ratio - score / maxScore (0〜1)
 * @returns {{ badge: string, title: string, color: string }}
 */
export function getRank(ratio) {
  return RANKS.find(r => ratio >= r.minRatio) || RANKS[RANKS.length - 1];
}

// ================================================
// カード種類ラベル
// ================================================
export const CARD_TYPE_LABELS = {
  testimony: '証言',
  evidence: '物証',
  circumstance: '状況証拠'
};

// ================================================
// シナリオDNA（構造的バリエーション強制）
// ================================================
export const SCENARIO_DNA_OPTIONS = {
  motive_type: ['怨恨', '金銭トラブル', '隠蔽工作', '嫉妬', '事故偽装', '復讐', '権力闘争', '秘密の保護'],
  trick_type: ['アリバイ工作', '密室トリック', '毒殺', 'すり替え', '時間差トリック', '偽装工作', '共犯者利用', '心理的誘導'],
  twist_type: ['意外な犯人', '動機の逆転', '被害者の秘密', '証言の嘘', '時系列の罠', '見立て殺人'],
};

// ================================================
// 検証パイプライン閾値
// ================================================
export const VALIDATION_THRESHOLDS = {
  maxRetries: 2,              // 最大リトライ回数
  logicPassScore: 70,         // Pass 3 AI論理検証の合格スコア
  japanesePassScore: 60,      // Pass 4 日本語品質の合格スコア
  japaneseAutoFixScore: 80,   // この値以上なら自動修正なしで合格
  minIntroLength: 200,        // 導入文の最小文字数
  minCardContentLength: 30,   // カード内容の最小文字数
  minHints: 3                 // ヒントの最低数
};

// ================================================
// プロンプトテンプレート（SSOT）
// ================================================

/**
 * シナリオ生成用のシステムプロンプトを構築
 * @param {string} themeId
 * @param {string} difficultyId
 * @returns {string}
 */
export function buildScenarioSystemPrompt(themeId, difficultyId, usedNames = [], dna = null) {
  const theme = THEMES[themeId];
  const diff = DIFFICULTIES[difficultyId];
  if (!theme || !diff) throw new Error(`Invalid theme(${themeId}) or difficulty(${difficultyId})`);

  const totalCards = diff.cardsPerPhase.reduce((a, b) => a + b, 0);
  const seed = `SEED-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const banList = usedNames.length > 0
    ? `\n## 使用禁止名\n以下の名前は過去のゲームで使用済みです。絶対に使用しないでください： ${usedNames.join('、')}\n`
    : '';

  // シナリオDNA（構造的バリエーション）
  const dnaSection = dna
    ? `\n## 🧬 シナリオDNA（必ずこの構造に従うこと）\n- 動機タイプ: **${dna.motive_type}**（この種類の動機を中心にシナリオを構築）\n- トリックタイプ: **${dna.trick_type}**（この手法を犯行の核にすること）\n- ツイストタイプ: **${dna.twist_type}**（この展開を物語に組み込むこと）\n`
    : '';

  return `あなたは推理ゲームのシナリオライターです。
以下の制約に従い、ミステリーシナリオを1つ作成してください。

## ランダムシード: ${seed}
このシードに基づいて、完全に新しいオリジナルの物語を作ってください。
過去のシナリオの再利用やテンプレート的なストーリーは禁止です。
${banList}${dnaSection}
## テーマ設定
- ジャンル: ${theme.name}（${theme.description}）
- 舞台候補: ${theme.locations.join('、')}
- 雰囲気: ${theme.mood}
- 時代: ${theme.era}

## ゲーム設定
- 容疑者: ${diff.suspectCount}人（うち1人が真犯人）
- 調査フェイズ: ${diff.phasesCount}回
- 各フェイズのカード数: [${diff.cardsPerPhase.join(', ')}]枚
- 各フェイズの選択可能数: [${diff.selectablePerPhase.join(', ')}]枚
- 手がかりカード合計: ${totalCards}枚
- レッドヘリング（偽の手がかり）: 全体の約${Math.round(diff.redHerringRatio * 100)}%
- ヒントレベル: ${diff.hintLevel}

## 🚨 絶対遵守: フェアプレイ原則（最重要）
この原則に違反したシナリオは不合格です。必ず守ってください。

1. **犯人特定に必要な情報は、必ず手がかりカードのいずれかに含まれること**
   - 犯人のアリバイ崩壊の根拠がカードから推論可能であること
   - 犯人の動機を示唆する情報がカードに含まれること
   - 犯行の手口を推測できる情報がカードに含まれること
2. **「犯人特定の決定打となるカード」を最低1枚、importance=criticalで含める**
3. **critical以外のカードを選んでも、消去法で容疑者を絞れるようにする**
4. **「カードに書かれていない情報」が答えに必要になってはいけない**
5. 動機と手口についても、カード情報から推論可能であること

## 🎮 調査アクション設計（カードの「action_label」と「focus_area」）
**各カードには2つの属性を付けてください：**

### action_label（調査行動名）
探偵が実行する具体的な調査行動名。プレイヤーはこれを見て「何を調べるか」を決めます。
良い例: 「遺体を検分する」「凶器を鑑識に出す」「目撃者に話を聞く」
悪い例: 「手がかりA」「証拠1」

### focus_area / focus_label（調査フォーカスエリア）
カードが属する調査エリア。同じフェイズ内で2〜3種類のエリアに分類してください。
- focus_area: 英語の識別子（例: "location_study", "person_tanaka", "forensics"）
- focus_label: 表示用の日本語ラベル+アイコン（例: "📖 書斎", "👤 田中氏", "🔬 鑑識"）

プレイヤーはフォーカスエリアを見て「書斎を調べるか、田中に聞くか」を選ぶ体験をします。

## 🎭 マーダーミステリー型時系列進行（最重要）
**各調査フェーズには「物語展開文（phase_narrative）」と「フェーズタイトル（phase_title）」を必ず付けてください。**
プレイヤーはカードを選ぶ前にこの展開文を読み、物語の中で「次に何が起きたか」を体験します。

### フェーズ進行の設計原則：
- **第1フェーズ**: 事件直後の現場。導入文の続きとして最初の調査開始。
  - phase_title例: "第1幕 — 現場検証"
  - phase_narrative: 現場の状況や初動捜査の描写（100〜200文字）
- **第2フェーズ**: 調査中に「新事実」が判明。事件が動く瞬間。
  - phase_title例: "第2幕 — 隠し部屋の発見"
  - phase_narrative: 前のフェーズの調査結果を受けて新展開が起きる（150〜300文字）
- **第3フェーズ**: さらなる急展開。真相に近づく緊迫感。
  - phase_title例: "第3幕 — 崩れるアリバイ"
  - phase_narrative: 決定的な転換点となる出来事が起きる（150〜300文字）

### phase_narrativeの書き方ルール：
1. 前のフェーズで調査した結果を受けての展開であること
2. プレイヤーが「次は何を調べよう？」と思える情報を含むこと
3. 臨場感のある描写で、小説の一節のように書くこと
4. 犯人を直接示す情報は含めないこと（フェアプレイ原則）

## 🔴 暗転シーン（犯人のフラッシュバック）
各調査フェーズの合間に、犯人視点の断片的な独白テキスト（culprit_flashbacks）を2つ生成してください。

### ルール（厳守）：
1. **犯人の名前は絶対に含めない**。一人称は「私」のみ使用
2. 独白は犯行の「一部分」だけを断片的に描写する（全容は明かさない）
3. 時間・場所・行動の断片が含まれること（推理の手がかりになる）
4. 独白1は犯行直前の心理、独白2は犯行中〜直後の行動を描写
5. 80〜200文字の臨場感ある日本語で書くこと
6. 読者が「この独白の主は誰か？」と考えさせる情報を含むこと（ただし確定はできない）
7. time_hintには独白中に登場する具体的な時刻を記載すること

## 必須条件
1. 手がかりカードだけで論理的に犯人を特定できること（フェアプレイ原則）
2. 全容疑者にもっともらしい動機があること
3. レッドヘリングは他の容疑者に疑いを向けるもので、決定的証拠と若干矛盾するものが望ましい
4. 時系列に矛盾がないこと
5. 事件概要の導入文は300〜500文字の読みやすい日本語
6. 各手がかりカードは50〜150文字
7. ヒントは3段階（レベル1: 方向性の示唆、レベル2: 具体的な絞り込み、レベル3: ほぼ正解）

## 回答設問（3問・合計7点）
1. 犯人は誰か？（容疑者名から選択）— 3点
2. 犯行の動機は？（記述）— 2点
3. 犯行の手口は？（記述）— 2点

## 重要: 解答可能性の自己検証
シナリオ生成後、以下を自己検証してください：
- solution.culpritの名前が、いずれかのカード内容に登場するか？
- solution.motive_detailのキーワードが、いずれかのカードから推測可能か？
- solution.method_detailのキーワードが、いずれかのカードから推測可能か？
もしいずれかが「NO」なら、該当情報をカードに追加してから出力してください。`;
}

/**
 * Pass 3: AI論理検証用の強化版プロンプト（解決可能性証明を含む6観点）
 * @param {Object} scenario
 * @returns {string}
 */
export function buildDeepValidationPrompt(scenario) {
  return `あなたはミステリーシナリオの品質管理官です。以下の6観点で厳密に検証してください。

## 観点1: 解決可能性（最重要）
手がかりカードの情報**だけ**を使って、以下の推論チェーンを構築してください：
- 証拠A「〇〇」→ 推論「〇〇」→ 容疑者Xの可能性が高まる
- 証拠B「〇〇」→ 推論「〇〇」→ 容疑者Yのアリバイが崩れる
- 結論: 犯人は[名前]と論理的に特定可能 ✅ / 不可能 ❌
もし推論チェーンが構築できない場合は is_solvable: false としてください。

## 観点2: アリバイの整合性
各容疑者のアリバイ主張と手がかりカードの情報を照合し、
犯人のアリバイに穴があること、無実の容疑者のアリバイが成立することを確認。

## 観点3: 時系列の一貫性
事件の時系列を再構成し、矛盾がないか確認。
「X時に犯行→Y時に発見→Z時の証言」のチェーン。

## 観点4: レッドヘリングの適切性
- 弱すぎ: レッドヘリングが明らかに無関係 → 推理の面白みがない
- 強すぎ: レッドヘリングが真犯人と区別不能 → 理不尽なパズル
適切な紛らわしさのバランスを評価してください。

## 観点5: 動機・手口と証拠の対応
solution.motive_detail と solution.method_detail が、
手がかりカードの情報から推論可能か確認してください。

## 観点6: 導入文のフェアネス
導入文が犯人を暗示していないか（ネタバレ防止）。
特定の容疑者に対する偏った描写がないか確認。

## シナリオ
${JSON.stringify(scenario, null, 2)}`;
}

/**
 * Pass 4: 日本語品質検証プロンプト
 * @param {Object} scenario
 * @param {string} themeId
 * @returns {string}
 */
export function buildJapaneseQualityPrompt(scenario, themeId) {
  const theme = THEMES[themeId];
  return `あなたは日本語校正の専門家です。以下のミステリーシナリオの日本語品質を8つの観点で評価してください。

## テーマ情報
- ジャンル: ${theme?.name || '不明'}（${theme?.description || ''}）
- 雰囲気: ${theme?.mood || ''}

## 観点1: 文法の正確性
文法的に不自然・誤りのある箇所を指摘してください。

## 観点2: 固有名詞の統一性
人物名・地名が全文を通して統一されているか確認してください。
（例: 「田中太郎」と「田中太朗」が混在していないか）

## 観点3: キャラクターの口調一貫性
容疑者の証言・アリバイ主張の口調が、personality（性格）設定と矛盾していないか確認。

## 観点4: テーマ適合性
テーマ（${theme?.name || '不明'}）に合った語彙・表現が使われているか確認。
（例: 和風テーマなのにカタカナ語が不自然に多い等）

## 観点5: 文章の明瞭さ
曖昧な表現がなく、手がかりの内容が明確に伝わるか確認。

## 観点6: 文体の統一
地の文（導入・解説）と会話文（証言）が適切に区別されているか確認。

## 観点7: テキスト量の適切さ
導入文（300〜500文字）、カード（50〜150文字）、解説文（400〜800文字）が適切な範囲内か確認。

## 観点8: 漢字・ひらがなバランス
漢字が多すぎて読みにくい、またはひらがなが多すぎて稚拙に見える箇所を指摘。

## シナリオ
${JSON.stringify(scenario, null, 2)}`;
}

/**
 * 回答採点用のプロンプト
 * @param {Object} solution - 正解データ
 * @param {Object} answers - プレイヤーの回答
 * @returns {string}
 */
export function buildScoringPrompt(solution, answers) {
  return `ミステリーゲームのプレイヤー回答を採点してください。

## 正解
- 犯人: ${solution.culprit}
- 動機: ${solution.motive_detail}
- 手口: ${solution.method_detail}

## プレイヤーの回答
- 犯人: ${answers.culprit}
- 動機: ${answers.motive}
- 手口: ${answers.method}

## 採点基準
1. 犯人（3点）: 名前が完全一致で3点、不一致で0点
2. 動機（2点）: 核心を捉えていれば2点、部分的に合っていれば1点、的外れなら0点
3. 手口（2点）: 核心を捉えていれば2点、部分的に合っていれば1点、的外れなら0点

部分正解の判定は寛容に行ってください（意味が近ければ正解寄りに）。`;
}

// ================================================
// JSON Schema定義（Claude Structured Outputs用）
// ================================================

export const SCENARIO_SCHEMA = {
  name: 'mystery_scenario',
  description: 'ミステリーゲームのシナリオ',
  strict: true,
  schema: {
    type: 'object',
    required: ['title', 'setting', 'introduction', 'victim', 'suspects', 'investigation_phases', 'culprit_flashbacks', 'solution', 'questions', 'full_story', 'hints'],
    additionalProperties: false,
    properties: {
      title: { type: 'string', description: '事件名（20文字以内）' },
      setting: {
        type: 'object',
        required: ['location', 'time', 'atmosphere'],
        additionalProperties: false,
        properties: {
          location: { type: 'string' },
          time: { type: 'string' },
          atmosphere: { type: 'string' }
        }
      },
      introduction: { type: 'string', description: '事件の導入テキスト（300〜500文字）' },
      victim: {
        type: 'object',
        required: ['name', 'age', 'role', 'cause_of_death'],
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          role: { type: 'string' },
          cause_of_death: { type: 'string' }
        }
      },
      suspects: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'age', 'role', 'relationship', 'personality', 'motive', 'alibi', 'is_culprit'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            age: { type: 'integer' },
            role: { type: 'string' },
            relationship: { type: 'string' },
            personality: { type: 'string' },
            motive: { type: 'string' },
            alibi: { type: 'string' },
            is_culprit: { type: 'boolean' }
          }
        }
      },
      investigation_phases: {
        type: 'array',
        items: {
          type: 'object',
          required: ['phase', 'phase_title', 'phase_narrative', 'total_cards', 'selectable', 'cards'],
          additionalProperties: false,
          properties: {
            phase: { type: 'integer' },
            phase_title: { type: 'string', description: 'フェーズタイトル（例: 第1幕 — 現場検証）' },
            phase_narrative: { type: 'string', description: 'このフェーズ冒頭の物語展開文（100〜300文字）' },
            total_cards: { type: 'integer' },
            selectable: { type: 'integer' },
            cards: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'type', 'title', 'action_label', 'focus_area', 'focus_label', 'content', 'importance'],
                additionalProperties: false,
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string', enum: ['testimony', 'evidence', 'circumstance'] },
                  title: { type: 'string' },
                  action_label: { type: 'string', description: '調査アクション名（例: 遺体を検分する）' },
                  focus_area: { type: 'string', description: '調査エリアID（例: location_study, person_tanaka）' },
                  focus_label: { type: 'string', description: '調査エリア表示名（例: 📖 書斎, 👤 田中氏）' },
                  content: { type: 'string' },
                  importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'red_herring'] }
                }
              }
            }
          }
        }
      },
      culprit_flashbacks: {
        type: 'array',
        description: '犯人視点の断片的独白（必ず2つ生成すること）。犯人名は絶対に含めない。',
        items: {
          type: 'object',
          required: ['id', 'monologue', 'time_hint'],
          additionalProperties: false,
          properties: {
            id: { type: 'integer', description: '1始まりの連番' },
            monologue: { type: 'string', description: '犯人の一人称独白（80〜200文字）。名前は"私"のみ使用。犯人が誰か特定できない書き方にすること。' },
            time_hint: { type: 'string', description: '独白中の時間的ヒント（例: "23時15分"）' }
          }
        }
      },
      solution: {
        type: 'object',
        required: ['culprit', 'motive_detail', 'method_detail', 'timeline', 'key_evidence'],
        additionalProperties: false,
        properties: {
          culprit: { type: 'string' },
          motive_detail: { type: 'string' },
          method_detail: { type: 'string' },
          timeline: { type: 'string' },
          key_evidence: { type: 'string' }
        }
      },
      questions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'question', 'answer', 'type', 'points'],
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            question: { type: 'string' },
            answer: { type: 'string' },
            type: { type: 'string', enum: ['choice', 'text'] },
            points: { type: 'integer' }
          }
        }
      },
      full_story: { type: 'string', description: '事件の全容解説（400〜800文字）' },
      hints: {
        type: 'array',
        items: {
          type: 'object',
          required: ['level', 'text', 'penalty'],
          additionalProperties: false,
          properties: {
            level: { type: 'integer' },
            text: { type: 'string' },
            penalty: { type: 'integer' }
          }
        }
      }
    }
  }
};

export const DEEP_VALIDATION_SCHEMA = {
  name: 'scenario_deep_validation',
  strict: true,
  schema: {
    type: 'object',
    required: ['is_valid', 'is_solvable', 'reasoning_chain',
               'alibi_check', 'timeline_check', 'red_herring_check',
               'evidence_match', 'fairness_check', 'overall_score',
               'critical_issues', 'suggestions'],
    additionalProperties: false,
    properties: {
      is_valid: { type: 'boolean', description: '全体として合格か' },
      is_solvable: { type: 'boolean', description: '手がかりだけで犯人を特定可能か' },
      reasoning_chain: { type: 'string', description: '証拠→推論→結論のチェーン記述' },
      alibi_check: { type: 'string', description: 'アリバイ整合性の判定結果' },
      timeline_check: { type: 'string', description: '時系列一貫性の判定結果' },
      red_herring_check: { type: 'string', description: 'レッドヘリング適切性の判定' },
      evidence_match: { type: 'string', description: '動機・手口と証拠の対応' },
      fairness_check: { type: 'string', description: '導入文のフェアネス' },
      overall_score: { type: 'integer', description: '0〜100の品質スコア' },
      critical_issues: { type: 'array', items: { type: 'string' } },
      suggestions: { type: 'array', items: { type: 'string' } }
    }
  }
};

export const JAPANESE_QUALITY_SCHEMA = {
  name: 'japanese_quality_check',
  strict: true,
  schema: {
    type: 'object',
    required: ['grammar_score', 'name_consistency', 'tone_consistency',
               'theme_fit', 'clarity', 'style_unity', 'length_check',
               'kanji_balance', 'overall_score', 'issues', 'corrections'],
    additionalProperties: false,
    properties: {
      grammar_score: { type: 'integer', description: '文法 0〜100' },
      name_consistency: { type: 'boolean', description: '固有名詞統一' },
      tone_consistency: { type: 'boolean', description: '口調一貫性' },
      theme_fit: { type: 'integer', description: 'テーマ適合度 0〜100' },
      clarity: { type: 'integer', description: '明瞭さ 0〜100' },
      style_unity: { type: 'boolean', description: '文体統一' },
      length_check: { type: 'boolean', description: 'テキスト量適切' },
      kanji_balance: { type: 'integer', description: '漢字バランス 0〜100' },
      overall_score: { type: 'integer', description: '総合 0〜100' },
      issues: { type: 'array', items: { type: 'string' } },
      corrections: {
        type: 'array',
        items: {
          type: 'object',
          required: ['location', 'original', 'corrected', 'reason'],
          additionalProperties: false,
          properties: {
            location: { type: 'string' },
            original: { type: 'string' },
            corrected: { type: 'string' },
            reason: { type: 'string' }
          }
        }
      }
    }
  }
};

export const SCORING_SCHEMA = {
  name: 'answer_scoring',
  strict: true,
  schema: {
    type: 'object',
    required: ['scores', 'total', 'max_total'],
    additionalProperties: false,
    properties: {
      scores: {
        type: 'array',
        items: {
          type: 'object',
          required: ['question', 'points', 'max', 'correct', 'comment'],
          additionalProperties: false,
          properties: {
            question: { type: 'string' },
            points: { type: 'integer' },
            max: { type: 'integer' },
            correct: { type: 'boolean' },
            comment: { type: 'string' }
          }
        }
      },
      total: { type: 'integer' },
      max_total: { type: 'integer' }
    }
  }
};

// ================================================
// Pass 5: 解答チェーン検証スキーマ
// ================================================
export const SOLVABILITY_CHECK_SCHEMA = {
  name: 'solvability_check',
  strict: true,
  schema: {
    type: 'object',
    required: ['is_solvable', 'culprit_chain', 'motive_chain', 'method_chain', 'confidence', 'missing_info'],
    additionalProperties: false,
    properties: {
      is_solvable: { type: 'boolean', description: 'カード情報だけで解答可能か' },
      culprit_chain: { type: 'string', description: '犯人特定の推論チェーン（カードX→推論→結論）' },
      motive_chain: { type: 'string', description: '動機推測の推論チェーン' },
      method_chain: { type: 'string', description: '手口推測の推論チェーン' },
      confidence: { type: 'integer', description: '解答確信度 0-100' },
      missing_info: { type: 'array', items: { type: 'string' }, description: 'カードに不足している情報' }
    }
  }
};

/**
 * Pass 5: 解答チェーン検証プロンプト
 * AIが「探偵役」としてカード情報のみで推理を試みる
 */
export function buildSolvabilityCheckPrompt(scenario) {
  const cardsOnly = (scenario.investigation_phases || [])
    .flatMap(p => (p.cards || []).map(c => `[カード: ${c.title}] ${c.content}`));
  const suspectNames = (scenario.suspects || []).map(s => s.name).join('、');

  return `あなたは探偵です。以下の手がかりカードの情報だけを使って、事件を推理してください。

## 容疑者
${suspectNames}

## 導入文
${scenario.introduction}

## 手がかりカード（これだけが使える情報）
${cardsOnly.join('\n')}

## 調査指示
上記のカード情報だけを使って、以下の3つを推理してください：
1. 犯人は誰か？（具体的な推論チェーンを示す）
2. 動機は何か？（カードからの推測）
3. 手口は何か？（カードからの推測）

重要: カードに書かれていない情報で推理しないでください。
推理できない場合は is_solvable: false とし、missing_infoに不足情報を記載してください。`;
}
