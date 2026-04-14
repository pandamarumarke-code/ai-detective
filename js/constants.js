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

  // ============================================================
  // Prompt Caching対応: 静的部分（キャッシュ可能）と動的部分を分離
  // cache_control付きの配列形式でAnthropicに送信
  // 初回: フルプロンプト処理 → 2回目以降: キャッシュヒットで高速化
  // ============================================================

  // 静的部分（テーマ設定・ルール・スキーマガイド）→ キャッシュ対象
  const staticPrompt = `あなたは推理ゲームのシナリオライターです。以下の制約に従い、ミステリーシナリオを1つ作成してください。

## テーマ: ${theme.name}（${theme.description}）
- 舞台候補: ${theme.locations.join('、')}
- 雰囲気: ${theme.mood}
- 時代: ${theme.era}

## ゲーム設定
- 容疑者: ${diff.suspectCount}人（うち1人が真犯人）
- 調査フェイズ: ${diff.phasesCount}回（カード数: [${diff.cardsPerPhase.join(', ')}]、選択: [${diff.selectablePerPhase.join(', ')}]）
- 合計${totalCards}枚（レッドヘリング約${Math.round(diff.redHerringRatio * 100)}%）
- ヒント: ${diff.hintLevel}

## 🚨 フェアプレイ原則（厳守）
1. 犯人特定に必要な情報は必ず手がかりカードに含めること（アリバイ崩壊根拠・動機示唆・手口推測）
2. importance=criticalのカードを最低1枚含めること
3. カードに書かれていない情報が答えに必要になってはいけない

## カード設計
各カードに以下を設定:
- action_label: 調査行動名（例: 「遺体を検分する」「目撃者に話を聞く」）
- focus_area: 英語ID（例: "location_study"）
- focus_label: 日本語+アイコン（例: "📖 書斎", "👤 田中氏"）

## マーダーミステリー型進行
各フェーズにphase_titleとphase_narrative（100〜300文字の物語展開文）を付けること。
- 第1幕: 現場検証、第2幕: 新事実判明、第3幕: 決定的転換点

## 暗転シーン（culprit_flashbacks）
犯人視点の断片的独白を2つ生成。ルール:
- 犯人名は絶対に含めない（一人称「私」のみ）
- 独白1=犯行直前の心理、独白2=犯行中〜直後
- 80〜200文字、time_hintに時刻を含める

## 必須条件
- 導入文: 300〜500文字、カード: 50〜150文字
- 全容疑者にもっともらしい動機、時系列に矛盾なし
- ヒント3段階（方向性→絞り込み→ほぼ正解）
- 回答: 犯人(3点)+動機(2点)+手口(2点)=合計7点

## 🔍 自己検証（生成後に必ず実行）
シナリオ生成後、以下の4項目を_self_validationフィールドに記録してください:
1. **is_solvable**: 手がかりカードの情報だけで犯人を論理的に特定できるか (true/false)
2. **reasoning_chain**: 「証拠A→推論→証拠B→推論→犯人はXである」形式の推論チェーン
3. **confidence_score**: 推理の確信度 (0-100)。80以上なら合格。
4. **fix_applied**: 不足を発見して修正したか (true/false)

solution.culprit/motive_detail/method_detailのキーワードがカードから推論可能か確認し、不足なら追加してから出力。`;

  // 動的部分（毎回変わる）→ キャッシュ対象外
  const dynamicPrompt = `## ランダムシード: ${seed}
完全に新しいオリジナルの物語を作ってください。テンプレート的なストーリーは禁止です。
${banList}${dnaSection}`;

  // Prompt Caching配列形式で返す
  return [
    {
      type: 'text',
      text: staticPrompt,
      cache_control: { type: 'ephemeral' }
    },
    {
      type: 'text',
      text: dynamicPrompt
    }
  ];
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
    required: ['title', 'setting', 'introduction', 'victim', 'suspects', 'investigation_phases', 'culprit_flashbacks', 'solution', 'questions', 'full_story', 'hints', '_self_validation'],
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
      },
      _self_validation: {
        type: 'object',
        description: 'AIによる自己検証結果',
        required: ['is_solvable', 'reasoning_chain', 'confidence_score', 'fix_applied'],
        additionalProperties: false,
        properties: {
          is_solvable: { type: 'boolean', description: '手がかりだけで犯人特定可能か' },
          reasoning_chain: { type: 'string', description: '証拠→推論→結論の推理チェーン' },
          confidence_score: { type: 'integer', description: '推理確信度 0-100' },
          fix_applied: { type: 'boolean', description: '不足を発見して修正したか' }
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

// ================================================
// デバッグ用モックシナリオ（SCENARIO_SCHEMAと完全一致）
// ================================================
export const MOCK_SCENARIO = {
  title: '【デバッグ】消えた宝石の謎',
  setting: {
    location: 'デバッグ用洋館',
    time: '2026年4月14日 午後8時',
    atmosphere: 'テスト用の穏やかな雰囲気'
  },
  introduction: 'デバッグモードのテストシナリオです。高名な宝石コレクター・山田太郎が所有する「月光の涙」と呼ばれるダイヤモンドが、晩餐会の最中に盗まれた。犯行時刻は午後8時から9時の間と推定される。洋館には4人の招待客がおり、全員に動機がある。探偵であるあなたは、手がかりカードを選んで犯人を特定してください。このシナリオはAPIを使用せずにゲームのUIと機能をテストするためのものです。',
  victim: {
    name: '山田太郎',
    age: 65,
    role: '宝石コレクター',
    cause_of_death: '宝石の盗難（殺人ではない）'
  },
  suspects: [
    {
      name: '佐藤花子',
      age: 32,
      role: '山田の秘書',
      relationship: '10年来の秘書',
      personality: '几帳面で冷静',
      motive: '給与未払いへの不満',
      alibi: '「晩餐会の準備をしていました」',
      is_culprit: true
    },
    {
      name: '鈴木一郎',
      age: 45,
      role: '宝石鑑定士',
      relationship: 'ビジネスパートナー',
      personality: '社交的だが計算高い',
      motive: '自分の鑑定が間違いだと暴かれることへの恐怖',
      alibi: '「書斎で本を読んでいました」',
      is_culprit: false
    },
    {
      name: '田中美咲',
      age: 28,
      role: '山田の姪',
      relationship: '遺産相続人',
      personality: '明るいが秘密主義',
      motive: '遺産を早く手に入れたい',
      alibi: '「庭で電話をしていました」',
      is_culprit: false
    },
    {
      name: '高橋健太',
      age: 50,
      role: '警備員',
      relationship: '新任の警備担当',
      personality: '真面目だが不器用',
      motive: '宝石の価値を知り誘惑された',
      alibi: '「巡回していました」',
      is_culprit: false
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 現場検証',
      phase_narrative: '宝石が保管されていた展示ケースのガラスには傷一つなく、鍵も無傷だった。内部犯行の可能性が高い。あなたは現場の手がかりを集めることにした。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'c1-1', type: 'evidence', title: '展示ケースの指紋', action_label: '展示ケースを鑑識する', focus_area: 'location_case', focus_label: '🔍 展示ケース', content: '展示ケースからは複数の指紋が検出された。しかし佐藤花子の指紋だけが、ケースの裏側の隠しロック付近に集中していた。他の招待客の指紋は表面のガラスのみ。', importance: 'critical' },
        { id: 'c1-2', type: 'testimony', title: '高橋の証言', action_label: '警備員に話を聞く', focus_area: 'person_takahashi', focus_label: '👤 高橋', content: '「8時15分頃、佐藤さんが展示室の方へ歩いていくのを見ました。手には何か光るものを持っていたような気がします。ただ、巡回で忙しかったので確認はしていません」', importance: 'high' },
        { id: 'c1-3', type: 'circumstance', title: '監視カメラの映像', action_label: '監視カメラを確認する', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '8時10分から8時30分の間、展示室の監視カメラが突然「メンテナンスモード」に切り替わっていた。管理パネルへのアクセス権があるのは山田本人と佐藤秘書のみ。', importance: 'high' },
        { id: 'c1-4', type: 'testimony', title: '鈴木の証言', action_label: '鈴木に話を聞く', focus_area: 'person_suzuki', focus_label: '👤 鈴木', content: '「あの宝石は最近になって偽物ではないかという噂がありましてね。私の鑑定では本物でしたが、独立鑑定を依頼されていたんです。結果が出る前に盗まれるとは…」', importance: 'red_herring' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — 新事実の発覚',
      phase_narrative: '調査を進めるうちに、佐藤秘書が最近大きな借金を抱えていたことが判明した。さらに、展示室には一般に知られていない隠し通路の存在が明らかになった。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'c2-1', type: 'evidence', title: '佐藤の銀行記録', action_label: '銀行記録を調べる', focus_area: 'documents', focus_label: '📄 書類', content: '佐藤花子の口座には先月、不審な大口の出金がある。さらに闇金業者からの借入が300万円に達していた。返済期限は来週に迫っている。', importance: 'high' },
        { id: 'c2-2', type: 'circumstance', title: '隠し通路', action_label: '隠し通路を調べる', focus_area: 'location_passage', focus_label: '🚪 隠し通路', content: '展示室の壁に隠し通路が見つかった。この通路は佐藤の控室に直結している。通路の床には最近の靴跡があり、女性用ハイヒールの跡に一致する。', importance: 'critical' },
        { id: 'c2-3', type: 'testimony', title: '田中の証言', action_label: '田中に話を聞く', focus_area: 'person_tanaka', focus_label: '👤 田中', content: '「叔父の遺産には興味ありません。私は自分の仕事で十分稼いでいます。それに、あの宝石より叔父の安全が心配です。最近、佐藤さんが叔父に何か隠しているような態度だったので…」', importance: 'medium' },
        { id: 'c2-4', type: 'evidence', title: '合鍵の存在', action_label: '鍵の管理状況を調べる', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '展示ケースのスペアキーが佐藤の机の引き出しから発見された。山田によれば、スペアキーの存在は佐藤にしか伝えていないとのこと。', importance: 'critical' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 崩れるアリバイ',
      phase_narrative: '決定的な証拠が次々と見つかり、事件の全容が明らかになりつつある。犯人のアリバイに致命的な矛盾が発見された。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'c3-1', type: 'testimony', title: 'シェフの新証言', action_label: 'シェフに話を聞く', focus_area: 'person_chef', focus_label: '👨‍🍳 シェフ', content: '「8時の時点で佐藤さんはキッチンにいませんでした。彼女は"準備は済んだ"と言って出て行きました。戻ってきたのは8時40分頃で、少し息が上がっていたのを覚えています」', importance: 'critical' },
        { id: 'c3-2', type: 'evidence', title: '防犯タグの反応', action_label: '防犯システムを調べる', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '宝石に取り付けられていたRFIDタグの最終反応が8時22分に記録されている。その後信号は途絶えている。電波遮断には専門知識が必要だが、佐藤は以前セキュリティ会社に勤めていた経歴がある。', importance: 'high' },
        { id: 'c3-3', type: 'circumstance', title: '不審な配送伝票', action_label: '配送伝票を調べる', focus_area: 'documents', focus_label: '📄 書類', content: '佐藤の車のダッシュボードから、翌日発送予定の国際配送伝票が見つかった。宛先は海外の宝石バイヤーで、品物は"アンティーク置時計"と記載されている。', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    {
      id: 1,
      monologue: '……もう限界だった。あの借金さえなければ、こんなことをする必要はなかった。私はいつも通り準備を済ませ、誰にも気づかれないように控室へ戻った。時計を見ると8時10分。あと20分もあれば十分だ。',
      time_hint: '8時10分'
    },
    {
      id: 2,
      monologue: '鍵は以前から持っていた。カメラも私が管理していた。すべてが計画通り。……震える手でケースを開けた瞬間、あの冷たい輝きが目に飛び込んできた。8時22分。急いでタグを外し、通路を抜けた。',
      time_hint: '8時22分'
    }
  ],
  solution: {
    culprit: '佐藤花子',
    motive_detail: '闇金からの300万円の借金返済のため、雇い主の宝石を盗んだ。返済期限が来週に迫っており、追い詰められていた。',
    method_detail: '秘書としてのアクセス権限を悪用し、監視カメラをメンテナンスモードに切り替えた後、隠し通路を通って展示室に侵入。スペアキーでケースを開け、宝石のRFIDタグを無効化して持ち出した。',
    timeline: '8:10 控室から移動 → 8:10 カメラ無効化 → 8:15 隠し通路経由で展示室へ → 8:22 宝石を取り出しRFIDタグ無効化 → 8:25 隠し通路で控室に帰還 → 8:40 キッチンに戻る',
    key_evidence: '展示ケース裏側の隠しロック付近の指紋集中、隠し通路のハイヒール跡、佐藤の机からスペアキー発見、監視カメラの管理権限が佐藤にしかないこと'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '佐藤花子', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '闇金からの借金返済', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '監視カメラ無効化→隠し通路→スペアキーで宝石窃取', type: 'text', points: 2 }
  ],
  full_story: 'デバッグ用テストシナリオ: 佐藤花子は10年間山田太郎の秘書として信頼を勝ち取っていたが、私生活では闇金からの借金が膨れ上がっていた。返済期限が迫る中、彼女は雇い主の最も価値ある宝石「月光の涙」に目をつけた。秘書として監視カメラの管理権限とスペアキーを持ち、展示室に隠し通路があることも知っていた。晩餐会当日、彼女は料理の準備を早めに終え、8時10分にカメラをメンテナンスモードに切り替え、隠し通路を通って展示室に侵入。8時22分にスペアキーで展示ケースを開き、RFIDタグを無効化して宝石を持ち出した。翌日にはダミーの名目で海外に発送する手はずまで整えていたが、探偵の推理により犯行が暴かれた。',
  hints: [
    { level: 1, text: '犯人は展示室への特別なアクセス手段を持つ人物です。誰が鍵やカメラの管理権限を持っているか考えてみましょう。', penalty: 1 },
    { level: 2, text: '犯人は8時10分から8時40分の間にアリバイの空白があります。この時間帯に何をしていたのでしょうか？指紋の場所にも注目してください。', penalty: 1 },
    { level: 3, text: '佐藤花子です。証拠: ①展示ケース裏の指紋、②隠し通路のハイヒール跡、③スペアキー、④カメラ管理権限、⑤借金と配送伝票。', penalty: 2 }
  ]
};

