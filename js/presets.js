// ================================================
// @ai-spec
// @module    presets
// @purpose   プリセットシナリオ10本（API不要で即プレイ可能）
// @ssot      PRESET_SCENARIOS
// @depends   なし
// @exports   PRESET_SCENARIOS
// @consumers app.js, renderer.js
// @constraints
//   - SCENARIO_SCHEMAと完全一致する構造
//   - 各シナリオは論理的に解決可能であること
// @updated   2026-04-15
// ================================================

export const PRESET_SCENARIOS = [

// ============================================================
// #1 クラシック ⭐⭐「最後の晩餐会」
// ============================================================
{
  id: 'preset-01',
  theme: 'classic',
  difficulty: 'normal',
  title: '最後の晩餐会',
  scene_image: 'img/presets/preset-01.png',
  setting: {
    location: '英国風邸宅「ウィンザーハウス」',
    time: '2025年12月24日 午後8時',
    atmosphere: '雪が降り積もるクリスマスイヴの夜、暖炉の炎が揺れる重厚な邸宅'
  },
  introduction: '十二月の冷たい風が窓を叩くクリスマスイヴの夜。資産家・黒沢誠一郎が主催する毎年恒例の晩餐会が、英国風邸宅「ウィンザーハウス」で開かれていた。招待されたのは、黒沢と深い関わりを持つ四人の人物たち。\n\n豪華なシャンデリアの下、ローストビーフとワインが振る舞われ、表面上は和やかな時間が流れていた。しかし、出席者の誰もが知っていた。黒沢が「重大な発表」をすると予告していたことを。それが何を意味するのか、全員がそれぞれの思惑を胸に秘めていた。\n\n午後九時、食後のデザートが運ばれてくる頃、黒沢は突然苦しみだし、テーブルに倒れ伏した。駆けつけた専属医が確認したところ、黒沢の体内から致死量の毒物が検出された。外は猛吹雪で、警察が到着するまでには数時間かかる。\n\nあなたはたまたま居合わせた探偵として、この密室で起きた毒殺事件の真相を解明しなければならない。四人の招待客のうち、誰が黒沢のワイングラスに毒を仕込んだのか。全員にアリバイがあり、全員に動機がある。真実はどこにあるのか。',
  victim: {
    name: '黒沢誠一郎',
    age: 72,
    role: '不動産王・資産家',
    cause_of_death: 'ワインに混入された青酸カリによる毒殺'
  },
  suspects: [
    {
      name: '白石玲奈',
      age: 35,
      role: '黒沢の後妻',
      relationship: '3年前に結婚した後妻',
      personality: '知的で冷静だが、感情を見せない',
      motive: '遺産相続（推定30億円）',
      alibi: '「キッチンでデザートの盛り付けを手伝っていました」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-01-shiraishi.png'
    },
    {
      name: '黒沢大輝',
      age: 42,
      role: '黒沢の長男',
      relationship: '先妻との息子。父と不仲',
      personality: '感情的で衝動的',
      motive: '父の「重大な発表」が遺産の全額寄付だと知り激怒',
      alibi: '「書斎で電話をしていました」',
      is_culprit: true,
      portrait_image: 'img/presets/preset-01-kurosawa.png'
    },
    {
      name: '南條恵美',
      age: 58,
      role: '家政婦長',
      relationship: '30年仕える古参の家政婦',
      personality: '忠実だが秘密を抱えている',
      motive: '解雇の通告を受けていた',
      alibi: '「ワインセラーでワインを選んでいました」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-01-nanjo.png'
    },
    {
      name: '氷室弁護士',
      age: 50,
      role: '顧問弁護士',
      relationship: '20年来の法律顧問',
      personality: '論理的で寡黙',
      motive: '黒沢の不正経理を隠蔽する必要があった',
      alibi: '「応接間で書類を確認していました」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-01-himuro.png'
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 晩餐の残滓',
      phase_narrative: '黒沢が倒れた食堂は騒然としていた。テーブルの上には食べかけの料理とワイングラスが並んでいる。毒はどのようにして被害者のグラスに入れられたのか。まずは現場の物的証拠を調べよう。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p1-c1-1', type: 'evidence', title: 'ワイングラスの分析', action_label: 'グラスを鑑識する', focus_area: 'location_dining', focus_label: '🍷 食堂', content: '被害者のワイングラスから青酸カリが検出された。他の出席者のグラスからは何も検出されていない。グラスの持ち手部分からは複数の指紋が検出されたが、黒沢大輝の指紋が最も鮮明だった。通常、自分のグラス以外に触れることはない。', importance: 'critical' },
        { id: 'p1-c1-2', type: 'testimony', title: '南條家政婦の証言', action_label: '南條に話を聞く', focus_area: 'person_nanjo', focus_label: '👤 南條', content: '「ワインは私がセラーから持ってきて、全員のグラスに注ぎました。でも途中で大輝様がグラスの位置を入れ替えたんです。"父さんにはこの良い席のグラスを"とおっしゃって。その時、一瞬大輝様の手がグラスの上を覆うように動いた気がしましたが…」', importance: 'critical' },
        { id: 'p1-c1-3', type: 'circumstance', title: '席順の配置図', action_label: '座席配置を確認する', focus_area: 'location_dining', focus_label: '🪑 座席', content: '黒沢は上座、その右に大輝、左に白石、対面に氷室弁護士。南條は給仕役で席はない。大輝は父のすぐ隣の席で、グラスに手が届く距離だった。', importance: 'high' },
        { id: 'p1-c1-4', type: 'testimony', title: '氷室弁護士の証言', action_label: '氷室に話を聞く', focus_area: 'person_himuro', focus_label: '👤 氷室', content: '「黒沢さんは今夜、全財産を児童福祉団体に寄付する旨を発表するつもりでした。私がその遺言書を作成しました。大輝さんには事前に伝えていたはずですが…相当お怒りだったようです」', importance: 'high' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — 動機の深層',
      phase_narrative: '捜査が進むにつれ、大輝が犯行の数日前に不審な行動を取っていたことが判明した。さらに、書斎からは興味深い証拠が見つかった。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p1-c2-1', type: 'evidence', title: '大輝のスマホ履歴', action_label: 'スマホの履歴を調べる', focus_area: 'digital', focus_label: '📱 通信記録', content: '大輝のスマートフォンの検索履歴に「青酸カリ 致死量」「毒物 検出されにくい」という検索が3日前に残っていた。さらに、闇サイトへのアクセス履歴が確認された。', importance: 'critical' },
        { id: 'p1-c2-2', type: 'evidence', title: '書斎の小瓶', action_label: '書斎を捜索する', focus_area: 'location_study', focus_label: '📖 書斎', content: '大輝が「電話をしていた」と言う書斎のデスクの引き出しから、微量の白い粉末が付着した小瓶が発見された。分析の結果、青酸カリと一致した。', importance: 'critical' },
        { id: 'p1-c2-3', type: 'testimony', title: '白石の証言', action_label: '白石に話を聞く', focus_area: 'person_shiraishi', focus_label: '👤 白石', content: '「大輝さんは先週、突然訪ねてきて"遺産の件で話がある"と言いました。私が何も知らないと答えると、"あなたも被害者になるかもしれない"と意味深なことを…今思えば、あれは脅しだったのかもしれません」', importance: 'medium' },
        { id: 'p1-c2-4', type: 'circumstance', title: '遺言書の内容', action_label: '遺言書を確認する', focus_area: 'documents', focus_label: '📄 遺言書', content: '新しい遺言書では、全財産の90%が児童福祉団体に、残り10%が南條家政婦に贈与される内容だった。大輝と白石への相続分はゼロ。署名日は事件の一週間前。', importance: 'high' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 崩れる嘘',
      phase_narrative: '大輝のアリバイを詳細に検証すると、致命的な矛盾が浮かび上がった。電話をしていたという書斎で、彼は本当に何をしていたのか。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'p1-c3-1', type: 'evidence', title: '通話記録の矛盾', action_label: '通話記録を照合する', focus_area: 'digital', focus_label: '📱 通信記録', content: '大輝は「書斎で電話をしていた」と証言したが、通信会社の記録では、毒物が投入されたと推定される8時30分前後に通話履歴は一切ない。実際の最後の通話は8時10分に終了している。', importance: 'critical' },
        { id: 'p1-c3-2', type: 'testimony', title: '監視カメラ映像', action_label: '廊下のカメラを確認する', focus_area: 'forensics', focus_label: '📹 映像', content: '廊下の監視カメラに、8時25分に書斎から出て食堂方向に向かう大輝の姿が映っていた。手には小さな何かを握っている。8時32分に書斎に戻る姿も確認された。', importance: 'critical' },
        { id: 'p1-c3-3', type: 'circumstance', title: '大輝の借金', action_label: '大輝の財務状況を調べる', focus_area: 'documents', focus_label: '📄 財務', content: '大輝は事業の失敗で2億円の借金を抱えていた。父の遺産が唯一の返済手段だったが、全額寄付の遺言書により絶望的な状況に追い込まれていた。', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……遺産がゼロだと？　ふざけるな。三十年以上あの男に従ってきたのは何だったんだ。あの弁護士から遺言書の中身を聞いた瞬間、私の中で何かが切れた。もう、こうするしかない。', time_hint: '3日前の夜' },
    { id: 2, monologue: 'グラスの位置を変えるのは自然な振る舞いだった。"良い席のグラスを"と言えば誰も疑わない。手のひらに隠した粉末をグラスに落とす。ほんの一瞬の動作。震える手を、テーブルクロスの下で握りしめた。', time_hint: '8時28分' }
  ],
  solution: {
    culprit: '黒沢大輝',
    motive_detail: '父・黒沢誠一郎が全財産を児童福祉団体に寄付する新遺言書を作成したことを知り、2億円の借金返済の道を断たれた大輝が犯行に及んだ。',
    method_detail: '3日前に闇サイトで青酸カリを入手。晩餐会で「良い席のグラスを」と言って父のグラスの位置を入れ替える振りをしながら、手のひらに隠した毒をグラスに投入した。',
    timeline: '8:10 最後の通話終了 → 8:25 書斎から食堂へ移動 → 8:28 グラス入替の口実で毒を投入 → 8:32 書斎に戻る → 9:00 黒沢が倒れる',
    key_evidence: '①被害者グラスに大輝の指紋 ②南條の「グラス入替」証言 ③スマホの毒物検索履歴 ④書斎の青酸カリ小瓶 ⑤通話記録の空白と監視カメラの移動記録'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '黒沢大輝', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '全財産寄付の遺言書により、借金返済の道が断たれたため', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: 'グラス入替の口実で、手のひらに隠した青酸カリを父のワイングラスに投入', type: 'text', points: 2 }
  ],
  full_story: '黒沢大輝は事業失敗で2億円の借金を抱えていた。父・誠一郎の遺産相続が唯一の返済手段だったが、顧問弁護士から全財産を児童福祉団体に寄付する新遺言書が作成されたことを知る。絶望した大輝は3日前に闇サイトで青酸カリを入手。クリスマスイヴの晩餐会で、「良い席のグラスを父に」という口実でグラスの位置を入れ替え、その隙に手のひらに隠した毒をグラスに投入した。監視カメラには8時25分に書斎から食堂へ向かう大輝の姿が映っており、「書斎で電話をしていた」という証言は嘘だった。通話記録にも該当時間帯に通話はなく、書斎のデスクからは青酸カリの小瓶まで発見された。',
  hints: [
    { level: 1, text: '犯人は被害者のグラスに直接触れる機会があった人物です。座席配置と南條の証言に注目してください。', penalty: 1 },
    { level: 2, text: '「書斎で電話をしていた」という証言を通話記録と照合してみてください。8時25分〜32分の行動に嘘があります。', penalty: 1 },
    { level: 3, text: '犯人は黒沢大輝です。グラスの指紋、毒物検索履歴、書斎の小瓶、通話記録の空白、監視カメラの移動が決定的証拠です。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: 'グラス指紋→南條証言(入替)→スマホ検索履歴→書斎の小瓶→通話記録矛盾→監視カメラ→犯人=大輝', confidence_score: 98, fix_applied: false }
},

// ============================================================
// #2 学園 ⭐「消えた優勝トロフィー」
// ============================================================
{
  id: 'preset-02',
  theme: 'school',
  difficulty: 'easy',
  title: '消えた優勝トロフィー',
  scene_image: 'img/presets/preset-02.png',
  setting: {
    location: '私立星蘭学園',
    time: '2025年10月31日 放課後',
    atmosphere: '文化祭前日の賑やかな校舎に漂う不穏な空気'
  },
  introduction: '文化祭を明日に控えた私立星蘭学園。校舎は装飾や出し物の準備に追われる生徒たちの活気であふれていた。しかし放課後、体育館のトロフィーケースから全国大会優勝トロフィーが消えていることが発覚し、校内は一気に騒然となった。\n\nこのトロフィーは星蘭学園バスケ部が二十年前に獲得した唯一の全国制覇の証であり、学園の象徴でもあった。純金製の台座には時価三百万円以上の価値があると言われ、学園にとっては金銭以上の意味を持つ宝物だった。\n\nトロフィーケースの鍵は壊されておらず、合鍵を持つのは四人だけ。体育教師の大和先生、生徒会長の神崎、バスケ部主将の岩井、そして用務員の松本さん。全員が放課後に校内にいたことが確認されている。\n\n学園祭実行委員を務めるあなたは、明日の文化祭開始までにトロフィーを取り戻さなければならない。犯人は四人の鍵保持者の中にいるはずだ。一体誰が、何のためにトロフィーを持ち出したのか。',
  victim: {
    name: '星蘭学園',
    age: 0,
    role: '学園（被害組織）',
    cause_of_death: '全国大会優勝トロフィーの盗難'
  },
  suspects: [
    {
      name: '大和翔太',
      age: 38,
      role: '体育教師・バスケ部顧問',
      relationship: 'トロフィー管理責任者',
      personality: '熱血で面倒見が良い',
      motive: '部の予算削減に対する抗議のため話題作り',
      alibi: '「グラウンドで文化祭の設営を指導していた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-02-yamato.png'
    },
    {
      name: '神崎美月',
      age: 17,
      role: '生徒会長',
      relationship: '学園行事の統括責任者',
      personality: '完璧主義で責任感が強い',
      motive: '文化祭メインイベントの注目度を上げるため',
      alibi: '「生徒会室で文化祭の最終打ち合わせをしていた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-02-kanzaki.png'
    },
    {
      name: '岩井隼人',
      age: 17,
      role: 'バスケ部主将',
      relationship: 'トロフィーの正当な管理者の一人',
      personality: '責任感は強いがプレッシャーに弱い',
      motive: '借金返済のためトロフィーの純金台座を売却しようとした',
      alibi: '「部室で明日のデモンストレーション練習をしていた」',
      is_culprit: true,
      portrait_image: 'img/presets/preset-02-iwai.png'
    },
    {
      name: '松本義男',
      age: 62,
      role: '用務員',
      relationship: '20年勤務のベテラン用務員',
      personality: '寡黙で几帳面',
      motive: '定年退職前に長年の恨みを晴らす',
      alibi: '「校舎内の清掃と施錠確認をしていた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-02-matsumoto.png'
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 空のケース',
      phase_narrative: '体育館のトロフィーケースは施錠されたまま中身だけが消えていた。鍵穴にピッキングの跡はない。合鍵を使った犯行であることは間違いない。まずは現場の状況を確認しよう。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p2-c1-1', type: 'evidence', title: 'ケースの指紋', action_label: 'ケースを調べる', focus_area: 'location_gym', focus_label: '🏀 体育館', content: 'ケースの内側から岩井隼人の指紋が検出された。岩井は「先週トロフィーを磨いた時に触った」と説明するが、清掃記録によると先週の清掃担当は松本用務員だった。', importance: 'critical' },
        { id: 'p2-c1-2', type: 'testimony', title: '目撃証言', action_label: '近くにいた生徒に聞く', focus_area: 'person_witness', focus_label: '👤 目撃者', content: '文化祭準備をしていた1年生の田村さんが証言。「4時半頃、岩井先輩が大きなスポーツバッグを持って体育館から出てきました。バッグがすごく重そうでした」', importance: 'critical' },
        { id: 'p2-c1-3', type: 'circumstance', title: '防犯カメラ', action_label: '監視映像を確認する', focus_area: 'forensics', focus_label: '📹 映像', content: '体育館入口のカメラは文化祭準備のため3日前から一時的に撤去されていた。しかし裏口のカメラは稼働しており、該当時間帯に出入りした人物はいなかった。犯人は正面入口を使った。', importance: 'medium' },
        { id: 'p2-c1-4', type: 'testimony', title: '大和先生の証言', action_label: '大和先生に話を聞く', focus_area: 'person_yamato', focus_label: '👤 大和先生', content: '「岩井が最近元気がないのは気づいていた。バスケの成績も下がっていて、何か悩みがあるようだった。金銭的な問題だと噂を聞いたことがある」', importance: 'high' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — 隠された事情',
      phase_narrative: '岩井隼人の周辺を調べると、彼が深刻な金銭問題を抱えていることが分かってきた。バスケ部主将としての輝かしい表の顔の裏に、暗い影が潜んでいた。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p2-c2-1', type: 'evidence', title: '岩井のSNS', action_label: 'SNSを調べる', focus_area: 'digital', focus_label: '📱 SNS', content: '岩井の裏アカウントで「金が必要」「誰か助けて」という投稿が複数見つかった。さらに、質屋の場所や金の買取価格を調べたスクリーンショットが保存されていた。', importance: 'critical' },
        { id: 'p2-c2-2', type: 'testimony', title: '神崎の証言', action_label: '神崎に話を聞く', focus_area: 'person_kanzaki', focus_label: '👤 神崎', content: '「岩井くんから先月、"急にお金が必要になった"と相談されたことがあります。理由は教えてくれませんでしたが、かなり追い詰められた様子でした」', importance: 'high' },
        { id: 'p2-c2-3', type: 'circumstance', title: '部室の状況', action_label: '部室を調べる', focus_area: 'location_club', focus_label: '🚪 部室', content: '岩井のロッカーから質屋のパンフレットと計算メモが見つかった。メモには「純金台座 → 推定250万」「借金返済 200万 + 利息」と書かれていた。', importance: 'critical' },
        { id: 'p2-c2-4', type: 'testimony', title: '松本の証言', action_label: '松本さんに話を聞く', focus_area: 'person_matsumoto', focus_label: '👤 松本', content: '「昨日の夕方、岩井くんが一人で体育館にいるのを見かけました。声をかけたら"練習だ"と言っていたけど、バスケの格好はしていなかったね」', importance: 'high' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 決定的証拠',
      phase_narrative: '岩井のアリバイを検証すると、「部室でデモンストレーション練習をしていた」という証言に矛盾が生じた。そして、決定的な物証が見つかる。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'p2-c3-1', type: 'evidence', title: '部室の出入り記録', action_label: 'ICカード記録を調べる', focus_area: 'forensics', focus_label: '🔬 記録', content: '部室棟のICカード記録によると、岩井のカードが部室に入室したのは5時15分。しかしトロフィー消失推定時刻は4時から5時の間。「ずっと部室にいた」という証言は虚偽。', importance: 'critical' },
        { id: 'p2-c3-2', type: 'evidence', title: 'スポーツバッグの中身', action_label: '岩井のバッグを確認する', focus_area: 'location_club', focus_label: '🎒 バッグ', content: '岩井のスポーツバッグの底から、トロフィーの台座に使われていた研磨剤の成分が検出された。バッグ内にはトロフィーを包んだとみられるタオルの繊維も残っていた。', importance: 'critical' },
        { id: 'p2-c3-3', type: 'circumstance', title: '質屋への問い合わせ', action_label: '近隣の質屋を調べる', focus_area: 'external', focus_label: '🏪 質屋', content: '学園近くの質屋に問い合わせたところ、「高校生が純金製品の見積もりを依頼してきた」という証言が得られた。特徴は岩井に一致。見積もり日は2日前。', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: 'あの返済期限が迫ってくる。部活の遠征費を使い込んでしまったのが全ての始まりだった。誰にも言えない。バレたら退学だ。あのトロフィーの台座さえあれば…純金なら250万にはなるはず。', time_hint: '一週間前' },
    { id: 2, monologue: '防犯カメラが撤去されている今がチャンスだった。合鍵でケースを開け、バッグに詰めた。重い。こんなに重いのか。急いで体育館を出たところで、後輩の女子とすれ違った。まずい。見られたか。', time_hint: '4時30分' }
  ],
  solution: {
    culprit: '岩井隼人',
    motive_detail: '部活の遠征費を私的に流用してしまい、200万円以上の借金を抱えていた。返済期限が迫り、トロフィーの純金台座（推定250万円）を売却して穴埋めしようとした。',
    method_detail: '文化祭準備で体育館の防犯カメラが撤去されている隙に、合鍵でトロフィーケースを開けてトロフィーをスポーツバッグに入れて持ち出した。',
    timeline: '4:15 体育館に侵入 → 4:25 合鍵でケースを開けトロフィーを取り出す → 4:30 スポーツバッグに入れて退出（目撃される）→ 5:15 部室に入室（アリバイ工作）',
    key_evidence: '①ケース内側の指紋 ②1年生の目撃証言 ③SNSの裏アカウント ④ロッカーの質屋パンフと計算メモ ⑤ICカード記録の矛盾 ⑥バッグの研磨剤検出'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '岩井隼人', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '遠征費の流用による借金返済のため、純金台座を売却しようとした', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '防犯カメラ撤去中に合鍵でケースを開け、スポーツバッグに入れて持ち出した', type: 'text', points: 2 }
  ],
  full_story: 'バスケ部主将の岩井隼人は、部の遠征費を私的に流用し200万円以上の借金を抱えていた。返済期限が迫る中、全国大会優勝トロフィーの純金台座に目をつけた。文化祭準備で体育館の防犯カメラが一時撤去されていることを好機と捉え、合鍵を使ってトロフィーケースからトロフィーを持ち出した。スポーツバッグに入れて体育館を出たところを後輩に目撃されている。その後、部室に入ってアリバイを作ったが、ICカードの入室記録が犯行推定時刻と矛盾していた。ロッカーからは質屋のパンフレットと売却額の計算メモが発見され、バッグからはトロフィーの研磨剤成分も検出された。',
  hints: [
    { level: 1, text: '犯人は合鍵を持つ四人のうちの一人です。放課後に大きなバッグを持って体育館から出てきた人物がいます。', penalty: 1 },
    { level: 2, text: '犯人のアリバイに時間的な矛盾があります。ICカードの入室記録と証言を照合してみてください。', penalty: 1 },
    { level: 3, text: '犯人は岩井隼人です。遠征費流用の借金→純金台座売却計画→防犯カメラ撤去の好機→バッグで持ち出しが犯行の流れです。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '目撃証言(バッグ)→指紋→SNS+メモ→ICカード矛盾→バッグ研磨剤→犯人=岩井', confidence_score: 97, fix_applied: false }
},

// ============================================================
// #3 SF ⭐⭐⭐「静寂の軌道」
// ============================================================
{
  id: 'preset-03',
  theme: 'sf',
  difficulty: 'hard',
  title: '静寂の軌道',
  scene_image: 'img/presets/preset-03.png',
  setting: {
    location: '国際宇宙ステーション「オリオン」',
    time: '2089年3月15日 船内時間14:00',
    atmosphere: '地球を見下ろす静寂の宇宙空間。閉鎖された金属の箱の中に漂う疑心暗鬼'
  },
  introduction: '地球の軌道上400キロメートル。国際宇宙ステーション「オリオン」は、人類初の量子コンピュータ「GENESIS」の起動実験のために、選りすぐりの科学者四名が搭乗していた。この実験が成功すれば、エネルギー問題は永久に解決される。各国政府と巨大企業が注目するプロジェクトだった。\n\n実験開始の六時間前、GENESISの冷却ユニットが何者かによって破壊された。修復には地球からの部品補給が必要で、実験は無期限延期となる。数百億円規模の投資が無に帰す大事件だ。しかし「オリオン」は完全な閉鎖空間であり、外部からの侵入は物理的に不可能。\n\nステーション内の全区画は気密ロックで区切られ、移動履歴はAIシステム「ADAM」が全て記録している。しかしADAMのログにも異常なアクセスが検出され、記録自体が改ざんされた可能性が浮上した。誰がADAMを欺いたのか。\n\nあなたは地上指令センターから急遽指名された調査官として、限られた通信帯域の中でこのサボタージュ事件の犯人を特定しなければならない。宇宙では、逃げ場はない。',
  victim: {
    name: 'GENESIS（量子コンピュータ）',
    age: 0,
    role: '人類初の軌道上量子コンピュータ',
    cause_of_death: '冷却ユニットの意図的な破壊'
  },
  suspects: [
    {
      name: 'ドクター・鷹野陽子',
      age: 45,
      role: '主任研究員・GENESISプロジェクトリーダー',
      relationship: 'プロジェクト責任者',
      personality: '天才的だが孤高',
      motive: '実験結果を独占するため延期を画策',
      alibi: '「ラボBで最終シミュレーションを実行していた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-03-takano.png'
    },
    {
      name: 'コマンダー・陳偉立',
      age: 52,
      role: 'ステーション船長',
      relationship: '安全管理の最高責任者',
      personality: '規律に厳格',
      motive: '安全基準違反によるミッションの中止を求めていた',
      alibi: '「コントロールルームで地球との定時交信中だった」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-03-chen.png'
    },
    {
      name: 'エンジニア・藤堂拓海',
      age: 33,
      role: 'システムエンジニア・ADAM管理者',
      relationship: 'AIシステム「ADAM」の開発者',
      personality: '内向的だが技術は一流',
      motive: '競合企業からの産業スパイ依頼を受けていた',
      alibi: '「サーバールームでADAMのメンテナンス中だった」',
      is_culprit: true,
      portrait_image: 'img/presets/preset-03-todo.png'
    },
    {
      name: 'ドクター・パク・ジヨン',
      age: 40,
      role: '医療担当官',
      relationship: 'クルーの健康管理担当',
      personality: '温厚だが秘密主義',
      motive: '実験の安全性への懸念',
      alibi: '「医療モジュールで乗員の健康データを分析していた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-03-park.png'
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 破壊された心臓',
      phase_narrative: 'GENESISの冷却ユニットが物理的に破壊されていた。宇宙ステーションという完全閉鎖空間で、誰が、どうやって犯行に及んだのか。AIの移動ログを信じてよいのか。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p3-c1-1', type: 'evidence', title: '冷却ユニットの損傷分析', action_label: '破壊痕を分析する', focus_area: 'forensics_genesis', focus_label: '🔬 GENESIS', content: '冷却ユニットはEVA（船外活動）用の多目的工具で内部から破壊されていた。この工具はエンジニア・藤堂の担当区画にのみ保管されている。藤堂は「メンテナンス用に複数あり、誰でも取れる」と主張。', importance: 'critical' },
        { id: 'p3-c1-2', type: 'evidence', title: 'ADAMの移動ログ', action_label: 'AI記録を解析する', focus_area: 'digital_adam', focus_label: '🤖 ADAM', content: 'ADAMの記録では、犯行推定時刻（11:00-12:00）にGENESIS区画に入室した者はいない。しかし、11:30にADAMのログ管理モジュールにroot権限でのアクセスが記録されている。root権限を持つのは藤堂のみ。', importance: 'critical' },
        { id: 'p3-c1-3', type: 'testimony', title: '鷹野博士の証言', action_label: '鷹野博士に聞く', focus_area: 'person_takano', focus_label: '👤 鷹野', content: '「11時頃、藤堂さんがサーバールームではなくGENESIS区画の方に浮いていくのを見ました。ただ、ゼロ重力では距離感が掴みにくいので、見間違いかもしれません」', importance: 'high' },
        { id: 'p3-c1-4', type: 'circumstance', title: '気圧変動記録', action_label: '環境センサーを確認する', focus_area: 'forensics', focus_label: '🌡️ センサー', content: 'GENESIS区画の気圧センサーが11:20に微小な変動を記録。これは気密ドアの開閉を示す。ADAMのログ上ではこの時間帯にドアの開閉記録はない。ログが改ざんされた可能性を示唆。', importance: 'high' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — デジタルの裏切り',
      phase_narrative: '調査を進めると、藤堂がAIシステム「ADAM」のログを改ざんする能力と動機の両方を持っていることが浮かび上がってきた。彼のプライベートな通信記録に不審な痕跡が見つかる。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p3-c2-1', type: 'evidence', title: '暗号化通信の痕跡', action_label: '通信ログを解析する', focus_area: 'digital', focus_label: '📡 通信', content: '藤堂の個人端末から、地上の暗号化アドレス宛に定期的に短い通信が送られていた。通信内容は解読不能だが、宛先IPは中国のテクノロジー企業「新華テック」のサーバーに帰属することが判明。', importance: 'critical' },
        { id: 'p3-c2-2', type: 'testimony', title: 'パク医師の証言', action_label: 'パク医師に聞く', focus_area: 'person_park', focus_label: '👤 パク', content: '「藤堂さんは最近、睡眠導入剤の処方を頻繁に求めてきました。ストレスかと思いましたが、ある夜、サーバールームで誰かと通信しているのを見かけました。慌てて切っていたのが気になります」', importance: 'high' },
        { id: 'p3-c2-3', type: 'evidence', title: 'ADAMのバックドア', action_label: 'ADAMのソースコードを監査する', focus_area: 'digital_adam', focus_label: '🤖 ADAM', content: 'ADAMのソースコードを精査すると、藤堂が挿入したバックドアが発見された。このコードを使えば、特定の時間帯の移動ログを選択的に削除・改ざんできる。コードのコミット日は打ち上げの2週間前。', importance: 'critical' },
        { id: 'p3-c2-4', type: 'circumstance', title: '藤堂の財務状況', action_label: '地上で財務調査を実施', focus_area: 'documents', focus_label: '📄 財務', content: '藤堂の口座に、半年前から匿名ルートで計5000万円の振込みがあった。振込元の追跡は困難だが、日付は新華テック社との通信日と相関している。', importance: 'high' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 宇宙の証人',
      phase_narrative: '藤堂の犯行を裏付ける最後のピースが見つかろうとしていた。ADAMの改ざんされていないバックアップと、宇宙服の痕跡が決定的な証拠となる。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'p3-c3-1', type: 'evidence', title: 'ADAMのコールドバックアップ', action_label: '非接続バックアップを確認', focus_area: 'digital_adam', focus_label: '🤖 ADAM(BK)', content: '鷹野博士の提案で、ADAMのオフラインバックアップ（藤堂が触れないコールドストレージ）を確認。11:20にGENESIS区画の気密ドアが藤堂のIDで開閉された記録が残っていた。メインログの該当記録は削除されていた。', importance: 'critical' },
        { id: 'p3-c3-2', type: 'evidence', title: '工具の微細痕跡', action_label: '工具のDNA分析を実施', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '冷却ユニット破壊に使われた工具のグリップ部分から、藤堂の皮膚細胞と汗のDNAが検出された。宇宙用手袋で作業すればDNAは残らないが、焦りから素手で触った瞬間があったとみられる。', importance: 'critical' },
        { id: 'p3-c3-3', type: 'testimony', title: '陳船長の証言', action_label: '陳船長に聞く', focus_area: 'person_chen', focus_label: '👤 陳', content: '「地球との定時交信中、ADAMが一瞬応答しなかった。時間は11:30頃。通常ありえない挙動で、システムレベルのアクセスがあった証拠です。その権限を持つのは藤堂だけです」', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……新華テックから最後の指示が来た。"GENESISを止めろ。手段は問わない"。5000万の報酬の半分はもう使ってしまった。もう後には引けない。ADAMのログは私が書いたバックドアで消せる。完璧な計画のはずだった。', time_hint: '前日の深夜' },
    { id: 2, monologue: '11時20分、IDカードでGENESIS区画に入る。バックドアでログを消すのは後からやればいい。工具を冷却ユニットに叩きつけた時、手袋が破れた。まずい。素手で触ってしまった。急いで引き返す。11時30分、ADAMのログを改ざん。これで証拠は消えたはずだ。', time_hint: '11時20分' }
  ],
  solution: {
    culprit: 'エンジニア・藤堂拓海',
    motive_detail: '競合企業「新華テック」から産業スパイとして5000万円の報酬を受け取り、GENESIS実験を妨害する依頼を遂行した。',
    method_detail: 'ADAM管理者権限を悪用してバックドアを設置。犯行時刻のログを改ざんした上で、EVA用工具でGENESISの冷却ユニットを物理的に破壊した。',
    timeline: '11:20 IDカードでGENESIS区画に入室 → 11:25 EVA工具で冷却ユニットを破壊（素手で触れるミス）→ 11:28 区画から退出 → 11:30 ADAMのログを改ざん → 14:00 破壊が発覚',
    key_evidence: '①工具が藤堂の担当区画のもの ②ADAMのroot権限アクセス ③バックドアコード ④暗号化通信→新華テック ⑤コールドバックアップのドア開閉記録 ⑥工具のDNA'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: 'エンジニア・藤堂拓海', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '競合企業・新華テックからの産業スパイ依頼（報酬5000万円）', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: 'ADAMのバックドアでログを改ざんし、EVA工具で冷却ユニットを物理的に破壊', type: 'text', points: 2 }
  ],
  full_story: 'システムエンジニアの藤堂拓海は、半年前に中国のテクノロジー企業「新華テック」から産業スパイの依頼を受けた。報酬は5000万円。打ち上げ2週間前にADAMのソースコードにバックドアを仕込み、犯行時のログを改ざんできるよう準備。実験当日の11時20分、IDカードでGENESIS区画に入り、EVA用多目的工具で冷却ユニットを破壊した。焦りから一瞬素手で工具に触れてしまい、DNA痕跡を残すミスを犯す。11時30分にADAMのメインログから侵入記録を削除したが、鷹野博士の提案で確認された非接続のコールドバックアップには記録が残っていた。暗号化通信の宛先IPが新華テックに帰属すること、5000万円の入金記録と合わせ、産業スパイとしての犯行が立証された。',
  hints: [
    { level: 1, text: '犯人はAIシステム「ADAM」のログを改ざんできる人物です。誰がroot権限を持っているか確認してください。', penalty: 1 },
    { level: 2, text: '気圧センサーとADAMのログに矛盾があります。ログが改ざんされたなら、改ざん主はADAMの管理者です。暗号化通信の宛先にも注目。', penalty: 1 },
    { level: 3, text: '犯人は藤堂拓海です。ADAMのバックドア、新華テックへの暗号化通信、5000万円の入金、工具のDNA、コールドバックアップの入室記録が証拠です。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '工具→藤堂区画→root権限→バックドア→通信→新華テック→コールドBK入室記録→DNA→犯人=藤堂', confidence_score: 96, fix_applied: false }
},

// ============================================================
// #4 和風 ⭐⭐「紅葉の密室」
// ============================================================
{
  id: 'preset-04',
  theme: 'japanese',
  difficulty: 'normal',
  title: '紅葉の密室',
  scene_image: 'img/presets/preset-04.png',
  setting: {
    location: '京都・老舗旅館「紅月庵」',
    time: '2025年11月15日 午前6時',
    atmosphere: '紅葉に彩られた庭園を望む風格ある旅館。朝靄に包まれた静寂'
  },
  introduction: '京都の奥座敷に佇む老舗旅館「紅月庵」。創業百二十年の歴史を持つこの旅館で、毎年恒例の茶道家元・如月流の秋の茶会が催されていた。参加者は如月宗匠を含む五名。離れの茶室で夜通し茶を楽しんだ後、各自が宿泊棟に戻った。\n\n翌朝六時、仲居が如月宗匠の部屋を訪ねたところ、宗匠が布団の上で事切れているのが発見された。部屋は内側から閂がかけられており、窓も格子戸で物理的に出入りできない。完全な密室だった。\n\n検死の結果、宗匠は睡眠薬を大量に混入された抹茶を飲まされたことによる急性薬物中毒で死亡。最後に抹茶を点てたのは昨夜十一時、離れの茶室でのこと。しかし、茶室から各自の部屋に戻った後は誰とも会っていないと全員が証言している。\n\nかつて如月流の門下生だったあなたは、紅葉の庭園を見渡しながら考える。宗匠の最後の一服に毒を仕込んだのは誰か。密室は本当に密室なのか。',
  victim: {
    name: '如月宗一郎',
    age: 78,
    role: '如月流茶道家元',
    cause_of_death: '抹茶に混入された睡眠薬による急性薬物中毒'
  },
  suspects: [
    {
      name: '如月雅',
      age: 45,
      role: '宗匠の長女・次期家元候補',
      relationship: '後継者だが父と確執がある',
      personality: '気位が高く完璧主義',
      motive: '家元の座を巡る父との対立',
      alibi: '「自室で書道の練習をしていた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-04-kisaragi-m.png'
    },
    {
      name: '堀川泰三',
      age: 55,
      role: '高弟（筆頭弟子）',
      relationship: '30年来の弟子。破門を言い渡されていた',
      personality: '穏やかだが芯が強い',
      motive: '破門の撤回。宗匠がいなくなれば新家元に推薦される可能性',
      alibi: '「離れの茶室で道具の後片付けをしていた」',
      is_culprit: true,
      portrait_image: 'img/presets/preset-04-horikawa.png'
    },
    {
      name: '三条楓',
      age: 30,
      role: '旅館の女将',
      relationship: '紅月庵の経営者',
      personality: '柔和だがしたたか',
      motive: '宗匠が旅館への茶会場所変更を示唆していた',
      alibi: '「帳場で翌日の準備をしていた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-04-sanjo.png'
    },
    {
      name: '如月翠',
      age: 25,
      role: '宗匠の孫娘',
      relationship: '祖父に可愛がられている若手茶人',
      personality: '無邪気だが観察力が鋭い',
      motive: '遺産相続の前倒し',
      alibi: '「庭を散歩してから自室に戻った」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-04-kisaragi-s.png'
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 朝靄の発見',
      phase_narrative: '密室の中で発見された宗匠の遺体。内側からかかった閂、格子戸で塞がれた窓。不可能犯罪のように見える。しかし、この部屋には一つだけ見落とされている通路があった。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p4-c1-1', type: 'evidence', title: '抹茶碗の分析', action_label: '茶碗を鑑識する', focus_area: 'forensics', focus_label: '🍵 茶碗', content: '宗匠の部屋にあった抹茶碗から大量の睡眠薬成分が検出された。碗は如月流の特注品で、前夜の茶会で使用されたものと同じ。しかし茶会で使った碗は茶室に全て戻されたはず。なぜ宗匠の部屋にあるのか。碗の底に「堀川」の銘がある。', importance: 'critical' },
        { id: 'p4-c1-2', type: 'circumstance', title: '床の間の仕掛け', action_label: '部屋を精査する', focus_area: 'location_room', focus_label: '🏯 宗匠の部屋', content: '宗匠の部屋の床の間の裏に、古い旅館建築特有の「隠し襖」が発見された。この襖は隣の茶室の控室に通じている。襖の木枠には最近触れた跡（指の油脂）があり、茶道用の抹茶粉が微量付着していた。', importance: 'critical' },
        { id: 'p4-c1-3', type: 'testimony', title: '仲居の証言', action_label: '仲居に話を聞く', focus_area: 'person_nakai', focus_label: '👤 仲居', content: '「夜11時半頃、堀川様が茶室の方で何かされている物音を聞きました。片付けかと思いましたが、もう少し後で控室の方からも音がしたような…」', importance: 'high' },
        { id: 'p4-c1-4', type: 'testimony', title: '翠の証言', action_label: '翠に話を聞く', focus_area: 'person_midori', focus_label: '👤 翠', content: '「庭を散歩していた時、堀川先生が茶室の控室から出てくるのを見ました。時間は11時40分頃だったと思います。何か袋のようなものを持っていました」', importance: 'high' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — 茶人の影',
      phase_narrative: '堀川泰三が破門を言い渡されていたこと、そして彼が旅館の構造に精通していたことが明らかになった。隠し襖の存在を知っている者は限られている。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p4-c2-1', type: 'evidence', title: '堀川の荷物', action_label: '堀川の部屋を調べる', focus_area: 'location_horikawa', focus_label: '🚪 堀川の部屋', content: '堀川の旅行鞄から、市販の睡眠薬の空シートが発見された。処方箋は堀川本人の名前で、1ヶ月前に発行されたもの。しかし残薬数と処方数が大きく合わない。約20錠が未使用のはずだが、残りは2錠のみ。', importance: 'critical' },
        { id: 'p4-c2-2', type: 'testimony', title: '雅の証言', action_label: '雅に話を聞く', focus_area: 'person_miyabi', focus_label: '👤 雅', content: '「堀川さんは先月、父から破門を言い渡されました。30年の師弟関係の終わりです。堀川さんは"30年の恩を仇で返すのか"と激昂していたと聞いています。この茶会が最後の機会だったはず」', importance: 'high' },
        { id: 'p4-c2-3', type: 'circumstance', title: '旅館の古図面', action_label: '旅館の構造を調べる', focus_area: 'documents', focus_label: '📄 図面', content: '三条女将から入手した古い図面によると、隠し襖の存在は旅館の古参スタッフと、長年通い続けた常連しか知らないもの。堀川は20年以上この旅館を利用しており、以前女将から隠し襖の話を聞いていた。', importance: 'critical' },
        { id: 'p4-c2-4', type: 'testimony', title: '三条女将の証言', action_label: '女将に話を聞く', focus_area: 'person_sanjo', focus_label: '👤 三条', content: '「10年ほど前に堀川様に旅館の歴史をお話しした際、隠し襖のことにとても興味を示されていました。"昔の職人の技は素晴らしい"と何度も仰っていました」', importance: 'high' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 最後の一服',
      phase_narrative: '堀川の犯行を裏付ける物的証拠が次々と見つかる。彼は「離れの茶室で後片付けをしていた」と証言したが、実際にはもっと恐ろしいことをしていた。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'p4-c3-1', type: 'evidence', title: '茶碗の指紋', action_label: '茶碗の指紋を照合する', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '宗匠の部屋で発見された抹茶碗（堀川銘）の取り手から、堀川の指紋が検出された。通常、茶会後の碗は洗浄されるはず。堀川がこの碗を茶会後に改めて使って抹茶を点て、宗匠の部屋に持ち込んだと考えられる。', importance: 'critical' },
        { id: 'p4-c3-2', type: 'evidence', title: '隠し襖の痕跡', action_label: '隠し襖を詳細に調べる', focus_area: 'forensics', focus_label: '🔬 痕跡', content: '隠し襖の木枠から堀川の指紋と、彼の着物に使われている特殊な絹糸の繊維が検出された。さらに襖の敷居に畳擦れの跡があり、最近人が通った形跡が確認された。', importance: 'critical' },
        { id: 'p4-c3-3', type: 'testimony', title: '堀川のアリバイ矛盾', action_label: '堀川の証言を検証する', focus_area: 'person_horikawa', focus_label: '👤 堀川', content: '堀川は「茶室で後片付け後、直接自室に戻った」と証言。しかし茶室から堀川の部屋への最短経路に設置されたセンサーライトが、該当時間帯に一度も反応していない。彼は別のルートを通った。', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……三十年。三十年、あの方に尽くしてきた。それを「破門」の一言で終わらせるというのか。ならば、最後の一服を差し上げよう。私が点てた、最高の一杯を。', time_hint: '茶会の夜' },
    { id: 2, monologue: '隠し襖を開ける。あの女将から聞いた通り、音もなく滑る。暗闇の中、抹茶碗を差し出した。「堀川が最後に点てた茶です」と。あの方は何の疑いもなく、それを飲み干した。閂は内側から。完璧な密室のはずだった。', time_hint: '23時45分' }
  ],
  solution: {
    culprit: '堀川泰三',
    motive_detail: '30年間師事した如月宗匠から破門を言い渡され、人生を否定された怒りと絶望から犯行に及んだ。宗匠亡き後は新家元に推薦される可能性もあった。',
    method_detail: '茶会後、茶室で自分の茶碗に睡眠薬を大量に混入した抹茶を点て、隠し襖を通って宗匠の部屋に侵入。「最後の一服」として差し出し、宗匠が飲んだ後、隠し襖から退出。部屋は内側から閂がかかったままの密室となった。',
    timeline: '23:00 茶会終了 → 23:20 茶室で毒入り抹茶を調製 → 23:40 隠し襖から宗匠の部屋に侵入 → 23:45 「最後の一服」を差し出す → 23:50 隠し襖から退出 → 翌6:00 遺体発見',
    key_evidence: '①堀川銘の茶碗に残る睡眠薬と指紋 ②隠し襖の指紋と絹糸繊維 ③睡眠薬の空シート ④翠の目撃証言 ⑤仲居の物音証言 ⑥センサーライト不反応'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '堀川泰三', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '30年の師弟関係を「破門」で断たれた怒りと絶望', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '隠し襖から侵入し、睡眠薬入り抹茶を「最後の一服」として宗匠に飲ませた', type: 'text', points: 2 }
  ],
  full_story: '堀川泰三は如月流に30年間師事した筆頭弟子だったが、先月突然破門を言い渡された。秋の茶会が最後の機会と悟った堀川は、犯行を計画。茶会後に自分の銘入り茶碗で睡眠薬を大量に混入した抹茶を点て、長年の常連として知っていた隠し襖を通って宗匠の部屋に侵入した。「堀川が最後に点てた茶です」と差し出し、宗匠は師弟の情から疑うことなく飲み干した。堀川は隠し襖から退出し、部屋は内側から閂がかかったままの密室となった。茶碗の指紋、隠し襖の繊維痕跡、睡眠薬の空シート、目撃証言が犯行を裏付けた。',
  hints: [
    { level: 1, text: '密室トリックの鍵は、この旅館特有の古い建築構造にあります。部屋の中に隠された通路がないか探してみてください。', penalty: 1 },
    { level: 2, text: '犯人は旅館の隠し襖の存在を知っていた人物です。誰が長年この旅館に通っていたか、また最近「破門」を受けた人物に注目してください。', penalty: 1 },
    { level: 3, text: '犯人は堀川泰三。隠し襖から侵入→睡眠薬入り抹茶を差し出す→退出後に密室成立。証拠は茶碗の指紋、隠し襖の繊維、睡眠薬空シート。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '茶碗(堀川銘+指紋)→隠し襖(指紋+繊維)→睡眠薬空シート→破門動機→目撃証言→犯人=堀川', confidence_score: 97, fix_applied: false }
},

// ============================================================
// #5 ノワール ⭐⭐⭐「港の沈黙」
// ============================================================
{
  id: 'preset-05',
  theme: 'noir',
  difficulty: 'hard',
  title: '港の沈黙',
  scene_image: 'img/presets/preset-05.png',
  setting: {
    location: '横浜・港湾倉庫街',
    time: '2025年8月20日 深夜2時',
    atmosphere: '蒸し暑い夏の夜、倉庫街に漂う潮の匂いと緊張感'
  },
  introduction: '横浜港の外れ、錆びた倉庫が並ぶ一角。夏の深夜、蒸し暑い空気の中に潮の匂いが漂っている。第七倉庫の中で、裏社会の仲介人として知られる「ブローカー」こと藤原誠が、頭部を鈍器で殴打されて死んでいるのが発見された。\n\n藤原は三日前、四者間の「取引」をアレンジしていた。違法カジノの権利を巡る交渉だ。しかし交渉は決裂し、藤原は「全員のスキャンダルを暴露する」と脅していたという。それが彼の命を縮めた。\n\n倉庫の出入口には暗証番号式のロックがかかっており、番号を知るのは四人の取引関係者のみ。監視カメラは一週間前に何者かによって破壊されていた。深夜の倉庫街に人通りはなく、目撃者もいない。\n\n裏社会の事件に通じた私立探偵であるあなたは、警察より先にこの事件の真相にたどり着かなければならない。四人の容疑者は全員が嘘をつく世界の住人だ。証拠だけが真実を語る。',
  victim: {
    name: '藤原誠',
    age: 48,
    role: '裏社会のブローカー（仲介人）',
    cause_of_death: 'バールによる後頭部強打（撲殺）'
  },
  suspects: [
    {
      name: '鬼頭龍司',
      age: 55,
      role: '違法カジノオーナー',
      relationship: 'カジノ権利の売主',
      personality: '威圧的で短気',
      motive: '藤原が仲介手数料を水増しし、差額を着服していたことへの怒り',
      alibi: '「自分のクラブで営業していた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-05-kito.png'
    },
    {
      name: '朱美',
      age: 32,
      role: 'バーのママ・情報屋',
      relationship: '藤原の元愛人で情報提供者',
      personality: '妖艶で計算高い',
      motive: '藤原が自分の過去のスキャンダルを暴露すると脅していた',
      alibi: '「店を閉めた後、自宅で寝ていた」',
      is_culprit: true,
      portrait_image: 'img/presets/preset-05-akemi.png'
    },
    {
      name: '王建明',
      age: 40,
      role: '中華料理店主・マネーロンダリング担当',
      relationship: 'カジノ資金の洗浄役',
      personality: '温和に見えるが冷酷',
      motive: 'マネーロンダリングの証拠を藤原に握られていた',
      alibi: '「店の仕込みをしていた」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-05-wang.png'
    },
    {
      name: '真島健吾',
      age: 38,
      role: '元刑事・現在は探偵',
      relationship: 'カジノ権利の買い手側の代理人',
      personality: '冷静だが正義感の残滓がある',
      motive: '買い手の秘密が藤原の暴露で露呈することへの恐怖',
      alibi: '「車で張り込み調査中だった」',
      is_culprit: false,
      portrait_image: 'img/presets/preset-05-mashima.png'
    }
  ],
  investigation_phases: [
    {
      phase: 1,
      phase_title: '第1幕 — 錆びた倉庫の死体',
      phase_narrative: '第七倉庫の中に横たわる藤原の遺体。バールが凶器だが、倉庫内にそのバールは見当たらない。犯人は凶器を持ち帰ったのか。暗証番号ロックの最終入力記録が手がかりになる。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p5-c1-1', type: 'evidence', title: 'ロックの入力記録', action_label: '暗証番号ロックを調べる', focus_area: 'forensics_lock', focus_label: '🔐 ロック', content: '暗証番号ロックの最終入力は深夜1時42分。入力されたコードは朱美に割り当てられた個人番号だった。朱美は「暗証番号は教えたが自分は行っていない」と主張。しかし番号は個人専用で共有は禁止されていた。', importance: 'critical' },
        { id: 'p5-c1-2', type: 'evidence', title: '遺体周辺の痕跡', action_label: '遺体を検分する', focus_area: 'forensics_body', focus_label: '🔬 遺体', content: '藤原の爪の間から赤い繊維が検出された。高級な絹素材で、女性用ストールの繊維と一致。抵抗の際に犯人の衣服を掴んだとみられる。鬼頭と王、真島はいずれも該当する衣服を所持していない。', importance: 'critical' },
        { id: 'p5-c1-3', type: 'testimony', title: '真島の証言', action_label: '真島に話を聞く', focus_area: 'person_mashima', focus_label: '👤 真島', content: '「俺は港の反対側で車中から張り込みをしていた。1時45分頃、倉庫の方から女が一人で歩いてくるのが見えた。赤いストールを巻いていた。距離があったので顔は見えなかったが、ヒールの音が印象的だった」', importance: 'high' },
        { id: 'p5-c1-4', type: 'circumstance', title: '凶器のバール', action_label: '倉庫周辺を捜索する', focus_area: 'location_dock', focus_label: '🌊 岸壁', content: '倉庫から200メートル離れた岸壁の海中から、血痕の付いたバールが回収された。指紋は拭き取られていたが、グリップ部分から微量の香水成分が検出された。', importance: 'high' }
      ]
    },
    {
      phase: 2,
      phase_title: '第2幕 — 赤い糸',
      phase_narrative: '証拠は一人の女性を指し示し始めている。赤いストール、ヒールの足音、そして暗証番号。しかし朱美は巧みに否認を続ける。決定的な証拠が必要だ。',
      total_cards: 4,
      selectable: 2,
      cards: [
        { id: 'p5-c2-1', type: 'evidence', title: '朱美のストール', action_label: '朱美の自宅を捜索する', focus_area: 'location_akemi', focus_label: '🏠 朱美宅', content: '朱美の自宅のクローゼットに赤い絹のストールがあったが、よく見ると端がほつれて繊維が欠損している。欠損部分の繊維を藤原の爪から検出された繊維と照合すると、完全に一致した。', importance: 'critical' },
        { id: 'p5-c2-2', type: 'evidence', title: '香水の成分一致', action_label: '香水を照合する', focus_area: 'forensics', focus_label: '🔬 鑑識', content: 'バールのグリップから検出された香水成分は、「ミッドナイトローズ」というブランドの限定品。朱美の自宅ドレッサーに同じ香水のボトルがあり、成分が完全に一致。この香水は年間500本しか製造されない。', importance: 'critical' },
        { id: 'p5-c2-3', type: 'testimony', title: '鬼頭の証言', action_label: '鬼頭に話を聞く', focus_area: 'person_kito', focus_label: '👤 鬼頭', content: '「朱美は藤原から"お前の昔の写真をばらまく"と脅されていた。元愛人の弱みを握るなんてのはあの男の常套手段だ。朱美は平気な顔をしていたが、内心は相当追い詰められていたはずだ」', importance: 'high' },
        { id: 'p5-c2-4', type: 'circumstance', title: 'タクシー乗車記録', action_label: 'タクシー会社に照会する', focus_area: 'external', focus_label: '🚕 タクシー', content: '港湾地区のタクシー乗車記録を調査。深夜1時20分に朱美の店近くから港方面に乗車した女性客の記録あり。1時35分に第七倉庫から300メートル地点で下車。運転手は「赤いストールの若い女性」と証言。', importance: 'high' }
      ]
    },
    {
      phase: 3,
      phase_title: '第3幕 — 沈黙の終わり',
      phase_narrative: '朱美の「自宅で寝ていた」というアリバイは完全に崩壊した。最後の証拠が、彼女の完全犯罪の幻想を打ち砕く。',
      total_cards: 3,
      selectable: 2,
      cards: [
        { id: 'p5-c3-1', type: 'evidence', title: '靴底の痕跡', action_label: '朱美の靴を調べる', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '朱美のクローゼットにあったピンヒールの靴底から、第七倉庫の床と一致する特殊な防錆塗料の粉末が検出された。この塗料は昨年倉庫の床に塗られたもので、横浜港の倉庫のみで使用されている。', importance: 'critical' },
        { id: 'p5-c3-2', type: 'evidence', title: '防犯カメラ破壊の証拠', action_label: '監視カメラ破壊を調査', focus_area: 'forensics', focus_label: '📹 カメラ', content: '一週間前に破壊された監視カメラの残骸を分析。レンズ部分に付着していた塗料は、朱美の店で使っているマニキュア除光液と反応が一致。カメラ破壊は犯行の事前準備だった可能性が高い。', importance: 'high' },
        { id: 'p5-c3-3', type: 'testimony', title: '王の証言', action_label: '王に話を聞く', focus_area: 'person_wang', focus_label: '👤 王', content: '「二週間前、朱美が私の店に来て"藤原を始末したい。あの倉庫の暗証番号を教えて"と言っていた。冗談だと思ったが…彼女の目は本気だった。暗証番号は教えていないが、藤原が番号の管理を朱美にも任せていたのは知っている」', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……あの写真をばらまかれたら、私の店も信用も全て終わる。あの男は本気だ。追い詰められたのは私じゃない、追い詰めたのはあの男だ。仕方ない。仕方ないんだ。カメラは先週壊しておいた。', time_hint: '犯行前日の深夜' },
    { id: 2, monologue: 'タクシーを降りて、倉庫に向かう。暗証番号を入力する手が震える。ドアを開けると、暗がりの中であの男が笑っていた。「来たのか」と。背中を向けた瞬間、私はバールを振り下ろした。一度だけ。それで十分だった。', time_hint: '深夜1時42分' }
  ],
  solution: {
    culprit: '朱美',
    motive_detail: '元愛人の藤原に過去のスキャンダル写真で脅されており、暴露されれば店も社会的信用も失う状況に追い込まれていた。',
    method_detail: '一週間前に監視カメラを破壊して下準備。犯行当夜、タクシーで倉庫に向かい、自分の暗証番号でロックを解除して倉庫に侵入。背を向けた藤原をバールで殴打。凶器は岸壁から海に投棄した。',
    timeline: '1:20 タクシーで港へ → 1:35 倉庫近くで下車 → 1:42 暗証番号で倉庫に入る → 1:45 藤原をバールで殴打 → 1:50 バールを海に投棄 → 1:55 徒歩で港を離れる（真島に目撃される）',
    key_evidence: '①ロック入力記録（朱美の番号）②遺体の爪の繊維→ストール一致 ③バールの香水成分一致 ④タクシー記録 ⑤靴底の倉庫塗料 ⑥真島の目撃証言'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '朱美', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '過去のスキャンダル写真で藤原に脅され、暴露を阻止するため', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: 'カメラを事前破壊、タクシーで倉庫へ、暗証番号で侵入、背後からバールで殴打、凶器を海に投棄', type: 'text', points: 2 }
  ],
  full_story: '朱美は元愛人の藤原から過去の写真で脅迫されていた。暴露されれば自分の店も信用も全て失う。追い詰められた朱美は、一週間前に倉庫の監視カメラを破壊して下準備を整えた。犯行当夜、タクシーで港に向かい、自分に割り当てられた暗証番号で倉庫のロックを解除。背を向けた藤原をバールで一撃した。抵抗の際に赤いストールを掴まれ繊維が採取され、バールのグリップには彼女の高級香水の成分が付着した。凶器は岸壁から海に投棄したが回収された。タクシー乗車記録、靴底の倉庫塗料、真島の目撃証言が犯行経路を完全に裏付けた。',
  hints: [
    { level: 1, text: '暗証番号は個人専用です。ロックの最終入力記録を確認してください。また、犯人は凶器に触れた際に「あるもの」を残しています。', penalty: 1 },
    { level: 2, text: '遺体の爪から検出された赤い繊維は重要な手がかりです。該当する衣服を持つ人物は限られます。深夜のタクシー記録も照合してみてください。', penalty: 1 },
    { level: 3, text: '犯人は朱美。暗証番号ロック記録→ストール繊維→香水一致→タクシー記録→靴底塗料→真島の目撃が証拠チェーンです。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: 'ロック記録(朱美番号)→爪の繊維→ストール一致→香水一致→タクシー→靴底塗料→犯人=朱美', confidence_score: 97, fix_applied: false }
},

// ============================================================
// #6 ファンタジー ⭐⭐「竜の涙の行方」
// ============================================================
{
  id: 'preset-06',
  theme: 'fantasy',
  difficulty: 'normal',
  title: '竜の涙の行方',
  scene_image: 'img/presets/preset-06.png',
  setting: { location: '王立魔法学院「アルカナ」', time: '双月暦892年 霜月の満月の夜', atmosphere: '魔法の灯りに照らされた古い学院。月光が窓から差し込む宝物庫' },
  introduction: '王立魔法学院「アルカナ」。大陸最高峰の魔法使いを輩出するこの学院の宝物庫から、創設者が遺した至宝「竜の涙」が盗まれた。竜の涙は並の魔法使いが一生かけても得られないほどの魔力を結晶化した宝珠であり、悪用されれば一つの都市を滅ぼすこともできる。\n\n宝物庫には五重の魔法的封印が施されている。第一から第四の封印は学院の四つの学科長がそれぞれの魔法で解除する方式で、全員が同時に唱えなければ開かない。しかし第五の封印だけは「意志の鍵」と呼ばれ、特定の者の魔力波長にのみ反応する。\n\n事件当夜、四人の学科長は満月の祝祭で宝物庫に集まり、年に一度の儀式を行った。竜の涙のエネルギーを学院の結界に充填するためだ。儀式の後、宝珠を戻して封印したはずだった。翌朝、宝物庫を確認すると竜の涙は消えていた。\n\nあなたは学院の調査官として、四人の学科長の中から犯人を特定しなければならない。誰が五重の封印を破って宝珠を持ち出したのか。',
  victim: { name: '王立魔法学院', age: 0, role: '学院（被害組織）', cause_of_death: '至宝「竜の涙」の盗難' },
  suspects: [
    { name: 'エルダーラ・フィン', age: 120, role: '召喚学科長（エルフ）', relationship: '学院最古参の教授', personality: '穏やかだが時に冷酷', motive: '竜の涙のエネルギーで故郷のエルフの森を再生したい', alibi: '「儀式後、天文台で星の観察をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-06-eldara.png' },
    { name: 'グロム・アイアンフォージ', age: 85, role: '錬金学科長（ドワーフ）', relationship: '宝物庫の物理的な鍵の管理者', personality: '頑固だが正直', motive: '竜の涙を使った究極の錬金実験への執着', alibi: '「地下工房で新しい合金の実験をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-06-grom.png' },
    { name: 'セレナ・ムーンライト', age: 35, role: '幻術学科長（人間）', relationship: '最年少の学科長、野心家', personality: '魅力的だが計算高い', motive: '竜の涙の力で大魔術師の称号を得る', alibi: '「図書館で古文書の研究をしていた」', is_culprit: true, portrait_image: 'img/presets/preset-06-serena.png' },
    { name: 'バルド・サンダーボルト', age: 60, role: '戦闘魔法学科長（人間）', relationship: '学院長候補の実力者', personality: '豪快で正義感が強い', motive: '国境紛争に竜の涙の力を使いたい', alibi: '「訓練場で夜間訓練を指導していた」', is_culprit: false, portrait_image: 'img/presets/preset-06-baldo.png' }
  ],
  investigation_phases: [
    {
      phase: 1, phase_title: '第1幕 — 空の宝物庫', phase_narrative: '五重の封印は見事に解除されていた。しかし四人全員が同時に唱えなければ開かない仕組みだ。犯人は儀式の際に何らかの工作をしたのか、それとも別の方法で封印を破ったのか。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p6-c1-1', type: 'evidence', title: '残留魔力の分析', action_label: '宝物庫の魔力を分析する', focus_area: 'forensics_magic', focus_label: '✨ 魔力痕', content: '宝物庫に残留する魔力波長を分析すると、封印解除が二回行われた痕跡がある。一回目は儀式時（四人の合同解除）、二回目は深夜（単独の魔力波長）。二回目の波長は「幻術」の特性を帯びている。幻術学科長はセレナのみ。', importance: 'critical' },
        { id: 'p6-c1-2', type: 'testimony', title: 'エルダーラの証言', action_label: 'エルダーラに聞く', focus_area: 'person_eldara', focus_label: '🧝 エルダーラ', content: '「儀式の最中、セレナが第五の封印に妙な細工をしていたように見えました。通常、意志の鍵は宝珠の所有者にしか反応しませんが、セレナは幻術で自分の魔力波長を一時的に変えられるはず」', importance: 'critical' },
        { id: 'p6-c1-3', type: 'circumstance', title: '第五の封印の状態', action_label: '封印の仕組みを調べる', focus_area: 'forensics_seal', focus_label: '🔒 封印', content: '第五の封印「意志の鍵」は創設者の魔力波長にのみ反応する。しかし幻術の上級技法「波長模倣」を使えば、短時間だけ他者の波長を模倣できる。この技法の使い手は大陸に三人しかおらず、セレナはその一人。', importance: 'high' },
        { id: 'p6-c1-4', type: 'testimony', title: 'グロムの証言', action_label: 'グロムに聞く', focus_area: 'person_grom', focus_label: '⛏️ グロム', content: '「宝物庫の物理的な鍵は儂が管理しておる。儀式後に施錠し、鍵は首からぶら下げて寝た。翌朝も鍵はあった。しかし…鍵穴に微かな魔力の残滓があった。幻術で鍵を"幻視"して複製した可能性がある」', importance: 'high' }
      ]
    },
    {
      phase: 2, phase_title: '第2幕 — 幻術師の野心', phase_narrative: 'セレナ・ムーンライトの周辺を調べると、彼女が「大魔術師」の称号を得るために必要な魔力が不足していたことが判明した。竜の涙があれば、その不足は一瞬で補える。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p6-c2-1', type: 'evidence', title: 'セレナの研究ノート', action_label: 'セレナの研究室を調べる', focus_area: 'location_serena', focus_label: '📚 研究室', content: 'セレナの研究ノートに「波長模倣の応用 — 創設者レベルの波長を再現する方法」という研究メモが見つかった。3ヶ月間にわたる実験記録があり、最後のページに「成功。15秒間の維持に成功」と書かれている。', importance: 'critical' },
        { id: 'p6-c2-2', type: 'evidence', title: '幻術の痕跡', action_label: '物理鍵の複製痕跡を調べる', focus_area: 'forensics', focus_label: '🔬 鑑識', content: 'グロムの鍵穴に残っていた魔力残滓を精査すると、「幻術的複製」の痕跡と一致。実物の鍵を幻術で"写し取り"、一時的な魔力の鍵を作成した技法。この精度の幻術を使えるのはセレナクラスの術者のみ。', importance: 'critical' },
        { id: 'p6-c2-3', type: 'testimony', title: 'バルドの証言', action_label: 'バルドに聞く', focus_area: 'person_baldo', focus_label: '⚡ バルド', content: '「セレナは先月の学科長会議で"大魔術師の称号試験を受けたい"と言ったが、学院長に"まだ魔力が足りない"と却下された。セレナの顔が一瞬歪んだのを覚えている」', importance: 'high' },
        { id: 'p6-c2-4', type: 'circumstance', title: '大魔術師の称号条件', action_label: '称号取得条件を調べる', focus_area: 'documents', focus_label: '📄 規定', content: '大魔術師の称号試験には、一定以上の魔力量が必要。セレナの現在の魔力では基準値の80%しかない。しかし竜の涙を一時的に保持すれば、その魔力を借りて基準を大幅に超えることが可能。', importance: 'high' }
      ]
    },
    {
      phase: 3, phase_title: '第3幕 — 月光の告白', phase_narrative: '全ての証拠はセレナを指している。彼女が竜の涙を隠した場所を特定し、幻術で作った偽の封印を暴くことが最後の課題だ。',
      total_cards: 3, selectable: 2,
      cards: [
        { id: 'p6-c3-1', type: 'evidence', title: '図書館の魔力反応', action_label: '図書館を魔力探査する', focus_area: 'location_library', focus_label: '📖 図書館', content: '「図書館で研究をしていた」と証言するセレナ。図書館を魔力探査すると、古文書の棚の奥から強大な魔力反応が検出された。幻術で本の中に隠されていた竜の涙が発見された。幻術の魔力波長はセレナのものと完全一致。', importance: 'critical' },
        { id: 'p6-c3-2', type: 'evidence', title: '偽の封印', action_label: '宝物庫の封印を再検証する', focus_area: 'forensics_seal', focus_label: '🔒 封印', content: '宝物庫に戻して「封印した」はずの竜の涙の場所に、精巧な幻術で作られた偽の「竜の涙」が置かれていた。これは視覚と魔力の両方を模倣する高度な幻術で、通常の確認では見破れない。セレナ級の幻術師にしか作れない代物。', importance: 'critical' },
        { id: 'p6-c3-3', type: 'testimony', title: '夜警の妖精の証言', action_label: '学院の妖精に聞く', focus_area: 'person_fairy', focus_label: '🧚 妖精', content: '学院を巡回する夜警の妖精ティンクが証言。「満月の夜、セレナ先生が宝物庫の前を通るのを見ました。時間は丑三つ時。手に淡い光を放つ球体を持っていました。"内緒ね"と言われたので黙っていましたが…」', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……大魔術師になるには魔力が足りない？　私の実力を認めないというのか。ならば、自分で手に入れるまで。あの宝珠さえあれば、私の魔力は基準を遥かに超える。波長模倣の研究は完成した。あとは実行するだけ。', time_hint: '犯行3日前' },
    { id: 2, monologue: '深夜、宝物庫に忍び込む。グロムの鍵は儀式の時に幻術で写し取った。第五の封印は波長模倣で15秒。十分だ。宝珠を手に取り、代わりに幻術の贋作を置く。図書館の古文書の中に隠せば、誰も見つけない。', time_hint: '丑三つ時' }
  ],
  solution: {
    culprit: 'セレナ・ムーンライト',
    motive_detail: '大魔術師の称号試験に必要な魔力が不足しており、竜の涙の力を借りて基準を超えようとした。',
    method_detail: '儀式の際にグロムの鍵を幻術で「写し取り」複製。深夜に波長模倣で第五の封印を解除し、竜の涙を盗み出して幻術の贋作を代わりに設置。本物は図書館の古文書の中に幻術で隠した。',
    timeline: '儀式中: 鍵を幻術で複製 → 深夜: 幻術の鍵で宝物庫に入る → 波長模倣で第五封印解除 → 竜の涙を取り出し贋作を設置 → 図書館に隠す',
    key_evidence: '①残留魔力に幻術の痕跡 ②研究ノートの波長模倣実験 ③鍵穴の幻術痕 ④図書館で竜の涙発見 ⑤贋作の幻術がセレナ波長と一致 ⑥妖精の目撃証言'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: 'セレナ・ムーンライト', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '大魔術師の称号に必要な魔力不足を竜の涙で補おうとした', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '幻術で鍵を複製+波長模倣で封印解除、竜の涙を盗んで幻術の贋作を設置', type: 'text', points: 2 }
  ],
  full_story: 'セレナ・ムーンライトは大魔術師の称号を渇望していたが、魔力が基準の80%しかなく試験を受けられなかった。竜の涙の力を借りれば基準を大幅に超えられることに気づいた彼女は、3ヶ月間「波長模倣」の研究を重ね、創設者の魔力波長を15秒間再現することに成功。儀式の際にグロムの物理鍵を幻術で「写し取り」、深夜に宝物庫に忍び込んだ。幻術の鍵と波長模倣で五重の封印を全て解除し、竜の涙を盗み出して代わりに精巧な幻術の贋作を設置。本物は図書館の古文書の中に幻術で隠した。宝物庫の残留魔力に幻術の痕跡が残っていたこと、研究ノート、妖精の目撃証言が犯行を裏付けた。',
  hints: [
    { level: 1, text: '五重の封印を単独で突破できるのは、特殊な魔法を使える人物です。第五の封印「意志の鍵」を模倣できる術者は誰か考えてみてください。', penalty: 1 },
    { level: 2, text: '宝物庫の残留魔力に「幻術」の痕跡があります。幻術学科長に注目し、研究ノートの内容を確認してください。', penalty: 1 },
    { level: 3, text: '犯人はセレナ。波長模倣で封印解除→幻術で鍵を複製→竜の涙を盗み贋作を設置→図書館に隠蔽。全て幻術で実行した計画犯罪です。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '残留魔力(幻術)→波長模倣→研究ノート→鍵複製痕→図書館発見→贋作→妖精証言→犯人=セレナ', confidence_score: 96, fix_applied: false }
},

// ============================================================
// #7 クラシック ⭐⭐⭐「時計塔の亡霊」
// ============================================================
{
  id: 'preset-07',
  theme: 'classic',
  difficulty: 'hard',
  title: '時計塔の亡霊',
  scene_image: 'img/presets/preset-07.png',
  setting: { location: '山奥の時計塔ホテル「クロノス」', time: '2025年1月3日 午前0時', atmosphere: '吹雪で孤立した時計塔付きのクラシックホテル' },
  introduction: '年末年始の休暇を過ごすため、時計塔ホテル「クロノス」に集まった四人の客と一人の支配人。標高1200メートルの山奥に建つこのホテルは、百年前の時計職人が建てた時計塔を中心に据えた独特の建築物だった。\n\n大晦日の夜、猛吹雪が山を包み、道路は完全に閉ざされた。そして新年を迎えた午前零時、時計塔の鐘が十二回鳴り響いた直後、ホテルの支配人・巌克己がロビーで刺殺体となって発見された。凶器はロビーに飾られていた装飾用のレターオープナーだった。\n\n吹雪で警察は来られない。通信も途絶えている。四人の宿泊客の中に殺人犯がいる。しかし全員が「時計塔の鐘の音を聞いた時は自分の部屋にいた」と主張している。検死によると死亡推定時刻は23時45分から0時の間。わずか15分の出来事だ。\n\nたまたま推理作家であったあなたは、現実の殺人事件に直面する。時計塔の鐘の音がすべてを知っている。',
  victim: { name: '巌克己', age: 60, role: 'ホテル支配人', cause_of_death: 'レターオープナーによる刺殺' },
  suspects: [
    { name: '乾真理子', age: 45, role: '美術商', relationship: '常連客', personality: '洗練されているが傲慢', motive: '支配人に贋作売買の秘密を握られていた', alibi: '「部屋でワインを飲んでいた」', is_culprit: false, portrait_image: 'img/presets/preset-07-inui.png' },
    { name: '津田恭介', age: 50, role: '時計修理師', relationship: '時計塔のメンテナンス担当', personality: '職人気質で寡黙', motive: '支配人がメンテナンス契約を打ち切ろうとしていた', alibi: '「時計塔の修理作業中だった」', is_culprit: true, portrait_image: 'img/presets/preset-07-tsuda.png' },
    { name: '望月彩花', age: 28, role: 'フリーライター', relationship: '初めての宿泊客', personality: '好奇心旺盛で行動的', motive: 'ホテルの不正経理を記事にしようとしていた', alibi: '「部屋で原稿を書いていた」', is_culprit: false, portrait_image: 'img/presets/preset-07-mochizuki.png' },
    { name: '阿久津勇', age: 55, role: '退職した銀行員', relationship: '年に一度の常連客', personality: '穏やかだが神経質', motive: '支配人との古い金銭トラブル', alibi: '「ラウンジで読書をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-07-akutsu.png' }
  ],
  investigation_phases: [
    {
      phase: 1, phase_title: '第1幕 — 真夜中の鐘', phase_narrative: 'ロビーに倒れた支配人。凶器のレターオープナーには拭き取られた跡があるが、わずかな指紋が残っている。時計塔の鐘の音は本当に0時ちょうどに鳴ったのか。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p7-c1-1', type: 'evidence', title: '凶器の指紋', action_label: 'レターオープナーを調べる', focus_area: 'forensics', focus_label: '🔬 凶器', content: 'レターオープナーは入念に拭かれていたが、握り部分のくぼみに部分指紋が残っていた。照合の結果、津田恭介のものと一致。津田は「装飾品を触ったことがある」と弁明。', importance: 'critical' },
        { id: 'p7-c1-2', type: 'circumstance', title: '時計塔の時刻ズレ', action_label: '時計塔を検証する', focus_area: 'location_tower', focus_label: '🕐 時計塔', content: '時計塔の内部機構を確認すると、鐘が鳴る時刻が15分早くセットされていた。つまり「0時に鐘が鳴った」と全員が思った時、実際はまだ23時45分だった。時計を操作できるのは時計修理担当の津田のみ。', importance: 'critical' },
        { id: 'p7-c1-3', type: 'testimony', title: '望月の証言', action_label: '望月に話を聞く', focus_area: 'person_mochizuki', focus_label: '👤 望月', content: '「鐘が鳴る10分ほど前に廊下で足音を聞きました。方向はロビーの方から。走っているような急いだ足音でした。でも部屋のドアは開けませんでした」', importance: 'high' },
        { id: 'p7-c1-4', type: 'testimony', title: '阿久津の証言', action_label: '阿久津に話を聞く', focus_area: 'person_akutsu', focus_label: '👤 阿久津', content: '「私はラウンジにいましたが、23時半頃にロビーを通った時、津田さんが時計塔の方から降りてくるのを見ました。手を洗っていたような記憶があります」', importance: 'high' }
      ]
    },
    {
      phase: 2, phase_title: '第2幕 — 時を操る男', phase_narrative: '津田恭介は時計塔の修理を口実にホテルに滞在していた。しかし実際の修理は既に完了していたはずだ。彼がホテルに残り続けた本当の理由は何か。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p7-c2-1', type: 'evidence', title: '修理完了報告書', action_label: '修理記録を確認する', focus_area: 'documents', focus_label: '📄 記録', content: '時計塔の修理は2日前に完了していた。津田が支配人に提出した報告書にもそう記載されている。にもかかわらず津田は「まだ微調整が必要」と滞在を続けていた。', importance: 'high' },
        { id: 'p7-c2-2', type: 'evidence', title: '津田のポケットの証拠', action_label: '津田の持ち物を調べる', focus_area: 'person_tsuda', focus_label: '👤 津田', content: '津田のコートのポケットから、血痕のついたハンカチが発見された。血液型は支配人のものと一致。津田は「自分が手を切った時のもの」と説明するが、津田の手に切り傷はない。', importance: 'critical' },
        { id: 'p7-c2-3', type: 'testimony', title: '乾の証言', action_label: '乾に話を聞く', focus_area: 'person_inui', focus_label: '👤 乾', content: '「三日前の夕食時、津田さんと支配人が激しく口論しているのを見ました。"三十年の契約を切るのか"と津田さんが声を荒らげていた。支配人は冷たく"時代が変わった"と言い返していました」', importance: 'high' },
        { id: 'p7-c2-4', type: 'circumstance', title: '時計塔の内部構造', action_label: '時計塔の構造を確認する', focus_area: 'location_tower', focus_label: '🕐 内部構造', content: '時計塔には内部の螺旋階段からロビーの裏手に直結する隠し通路がある。この通路は時計の配管用で、津田しかその存在を知らない。ロビーに誰にも見られずに出入りできる。', importance: 'critical' }
      ]
    },
    {
      phase: 3, phase_title: '第3幕 — 15分のトリック', phase_narrative: '津田のトリックの全容が見えてきた。鐘の時刻をずらすことで、全員のアリバイの基準となる「0時」を誤認させたのだ。',
      total_cards: 3, selectable: 2,
      cards: [
        { id: 'p7-c3-1', type: 'evidence', title: 'スマートフォンの時刻', action_label: '各自のスマホ時刻を確認', focus_area: 'digital', focus_label: '📱 時刻', content: '全員のスマートフォンは圏外で自動時刻補正ができない状態。津田以外の三人は全員、時計塔の鐘を基準に時刻を合わせていた。つまり全員の時計が15分早くなっていた。津田のスマホだけが正確な時刻を示している。', importance: 'critical' },
        { id: 'p7-c3-2', type: 'evidence', title: '隠し通路の痕跡', action_label: '隠し通路を調べる', focus_area: 'location_passage', focus_label: '🚪 隠し通路', content: '時計塔からロビー裏に通じる隠し通路の床に、津田の作業靴と一致する泥と油の足跡が残っていた。足跡はロビー方向への往復の痕跡を示している。', importance: 'critical' },
        { id: 'p7-c3-3', type: 'circumstance', title: '支配人の手帳', action_label: '支配人の手帳を確認する', focus_area: 'documents', focus_label: '📄 手帳', content: '支配人の手帳に「1/3 津田に契約終了を正式通知。30年の付き合いだが、自動化システム導入により人的メンテナンスは不要」というメモ。津田にとって生活の糧を奪われる最後通告だった。', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '三十年、あの時計塔を守ってきた。それを機械に置き換えるだと？　私の人生はあの時計と共にあった。あの男が…あの男さえいなければ、時計塔は私のものであり続ける。鐘の時刻を15分早める。それが私のアリバイになる。', time_hint: '23時30分' },
    { id: 2, monologue: '鐘が鳴った。全員が"0時だ"と思っている。実際はまだ23時45分。隠し通路を降り、ロビーに出る。あの男はレターオープナーの前に立っていた。声をかけた瞬間、手が動いた。時計が正しい0時を刻む頃、私は時計塔に戻っていた。', time_hint: '23時45分' }
  ],
  solution: {
    culprit: '津田恭介',
    motive_detail: '30年間守り続けた時計塔のメンテナンス契約を打ち切られ、人生の全てを奪われると感じた津田が犯行に及んだ。',
    method_detail: '時計塔の鐘が鳴る時刻を15分早くセットし、全員に「0時」を誤認させた。「0時（実際は23:45）」に全員が部屋にいる間に、時計塔の隠し通路からロビーに降り、支配人を刺殺。本当の0時までに時計塔に戻った。',
    timeline: '23:30 鐘の時刻を15分早める → 23:45 鐘が鳴る（全員が0時と誤認）→ 23:47 隠し通路でロビーへ → 23:50 支配人を刺殺 → 23:55 隠し通路で時計塔に帰還 → 0:00 実際の正時',
    key_evidence: '①凶器の部分指紋 ②時計の15分ズレ ③血染めのハンカチ ④隠し通路の足跡 ⑤津田のスマホだけ正確な時刻 ⑥修理完了済みなのに滞在の不自然さ'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '津田恭介', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '30年のメンテナンス契約打ち切りに対する怒りと絶望', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '時計塔の鐘を15分早めて時刻を誤認させ、隠し通路から犯行現場に往復した', type: 'text', points: 2 }
  ],
  full_story: '時計修理師の津田恭介は30年間時計塔クロノスのメンテナンスを担ってきたが、支配人から自動化による契約打ち切りを通告された。時計塔こそが自分の人生だと信じる津田は犯行を計画。まず時計塔の鐘が鳴る時刻を15分早くセットし、圏外で時刻補正できない他の宿泊客全員を「0時」と誤認させた。実際はまだ23時45分だったその瞬間、全員が部屋にいると確認した津田は時計塔内の隠し通路からロビーに降り、装飾用レターオープナーで支配人を刺殺。本当の0時までに時計塔に戻りアリバイを成立させた。凶器の指紋、血染めのハンカチ、隠し通路の足跡、そしてスマホの時刻が正確だったのは津田だけという事実が犯行を証明した。',
  hints: [
    { level: 1, text: '全員が「0時に部屋にいた」と言っています。しかし、その「0時」は本当に正確だったでしょうか？時計塔の鐘の正確性を確認してみてください。', penalty: 1 },
    { level: 2, text: '時計塔を操作でき、かつロビーに誰にも見られずに行ける人物は限られます。時計塔の内部構造に注目してください。', penalty: 1 },
    { level: 3, text: '犯人は津田恭介。鐘を15分早める→時刻誤認→隠し通路→犯行→帰還がトリックです。津田のスマホだけが正確な時刻を示しています。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '時計15分ズレ→津田だけ操作可→隠し通路→指紋→ハンカチ→スマホ時刻→犯人=津田', confidence_score: 96, fix_applied: false }
},

// ============================================================
// #8 学園 ⭐⭐「放課後の告発状」
// ============================================================
{
  id: 'preset-08',
  theme: 'school',
  difficulty: 'normal',
  title: '放課後の告発状',
  scene_image: 'img/presets/preset-08.png',
  setting: { location: '県立桜丘高校 演劇部部室', time: '2025年6月18日 放課後', atmosphere: '梅雨の薄暗い放課後、演劇部に漂う緊張感' },
  introduction: '県立桜丘高校の演劇部は、来月の県大会に向けて新作「罪と告白」の稽古に励んでいた。主役の座を巡る競争は激しく、部員たちの間には見えない緊張が走っていた。\n\n放課後の部室に、一通の告発状が貼り出された。「主役の相馬遥は、昨年の大会で審査員の教師に裏口で推薦してもらっていた。その教師こそ顧問の長谷川先生だ」。この告発が事実なら、相馬は主役を降ろされ、長谷川先生は処分を受ける。\n\n相馬遥は涙ながらに全面否定し、長谷川先生も「事実無根だ」と怒りを露わにした。しかし告発状には具体的な日時と場所が記されており、単なるいたずらとは思えない。便箋は部室にある共用のもので、文字はパソコンで印刷されていた。\n\n演劇部の副顧問を務めるあなたは、大会までに真実を明らかにしなければならない。告発状を書いたのは誰か。その目的は何か。嘘の中に隠された真実を見つけ出せ。',
  victim: { name: '相馬遥', age: 17, role: '演劇部主役', cause_of_death: '名誉毀損（虚偽の告発状による被害）' },
  suspects: [
    { name: '柏木蓮', age: 17, role: '演劇部副部長', relationship: '主役の座を狙うライバル', personality: '努力家だが嫉妬深い', motive: '相馬を降板させて自分が主役になりたい', alibi: '「音楽室でセリフの練習をしていた」', is_culprit: true, portrait_image: 'img/presets/preset-08-kashiwagi.png' },
    { name: '小野寺理沙', age: 16, role: '演劇部の新入部員', relationship: '相馬に憧れる後輩', personality: '大人しいが芯が強い', motive: '相馬が自分のアイデアを盗用したことへの不満', alibi: '「図書室で脚本の参考資料を探していた」', is_culprit: false, portrait_image: 'img/presets/preset-08-onodera.png' },
    { name: '藤井翔太', age: 17, role: '演劇部の照明担当', relationship: '相馬の元恋人', personality: '陽気だが未練がある', motive: '相馬に振られた恨み', alibi: '「体育館で照明機材の点検をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-08-fujii.png' },
    { name: '渡辺さくら', age: 17, role: '演劇部の脚本担当', relationship: '柏木の親友', personality: '知的で冷静', motive: '親友の柏木を主役にしたい', alibi: '「部室の隣の教室で脚本を書いていた」', is_culprit: false, portrait_image: 'img/presets/preset-08-watanabe.png' }
  ],
  investigation_phases: [
    {
      phase: 1, phase_title: '第1幕 — 貼り出された嘘', phase_narrative: '告発状は部室の掲示板に画鋲で留められていた。パソコンで印刷された文面、共用の便箋。犯人の特定は容易ではない。しかし、印刷に使われたプリンターの特定から始めよう。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p8-c1-1', type: 'evidence', title: 'プリンターの特定', action_label: 'プリンター履歴を調べる', focus_area: 'digital', focus_label: '🖨️ 印刷', content: '告発状の印刷品質と用紙サイズから、校内のプリンターのうち音楽室に設置されたものと一致。音楽室のプリンター使用履歴に昨日17:10の印刷記録あり。印刷元は個人のUSBメモリ。', importance: 'critical' },
        { id: 'p8-c1-2', type: 'testimony', title: '小野寺の証言', action_label: '小野寺に聞く', focus_area: 'person_onodera', focus_label: '👤 小野寺', content: '「昨日の放課後、音楽室の前を通った時、柏木先輩がプリンターを使っているのが見えました。"楽譜のコピー"と言っていましたが、楽器をしている様子はなかったです」', importance: 'critical' },
        { id: 'p8-c1-3', type: 'circumstance', title: '告発状の内容検証', action_label: '告発の事実関係を調べる', focus_area: 'documents', focus_label: '📄 告発状', content: '告発状に書かれた「昨年の審査員への推薦」を調査。実際には長谷川先生は昨年の大会の審査員ではなく、推薦の事実もない。告発は完全な虚偽。犯人は事実を確認せずに書いた可能性が高い。', importance: 'high' },
        { id: 'p8-c1-4', type: 'testimony', title: '藤井の証言', action_label: '藤井に聞く', focus_area: 'person_fujii', focus_label: '👤 藤井', content: '「柏木は最近、相馬が主役であることをすごく気にしていた。"実力なら自分の方が上"と何度も言っていた。でもオーディションで相馬に負けたのは事実なんだよな」', importance: 'high' }
      ]
    },
    {
      phase: 2, phase_title: '第2幕 — 嫉妬の構図', phase_narrative: '柏木蓮が告発状と関連する疑いが強まった。音楽室でのプリンター使用、相馬への嫉妬。しかし決定的な証拠がまだ足りない。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p8-c2-1', type: 'evidence', title: '柏木のUSBメモリ', action_label: '柏木のUSBを確認する', focus_area: 'digital', focus_label: '💾 USB', content: '柏木のUSBメモリ内に「告発文.docx」というファイルが見つかった。最終更新日時は昨日16:55。ファイルのプロパティの作成者名は「柏木」。柏木は「渡辺に頼まれて印刷しただけ」と弁明。', importance: 'critical' },
        { id: 'p8-c2-2', type: 'testimony', title: '渡辺の証言', action_label: '渡辺に聞く', focus_area: 'person_watanabe', focus_label: '👤 渡辺', content: '「柏木に頼まれたことなんてありません。告発状の件は今日初めて知りました。柏木は親友ですが、こんなことをするなんて…でも確かに最近、相馬さんの主役に不満を言っていました」', importance: 'critical' },
        { id: 'p8-c2-3', type: 'circumstance', title: 'オーディション結果', action_label: 'オーディション記録を確認する', focus_area: 'documents', focus_label: '📄 記録', content: 'オーディション審査記録によると、相馬と柏木の点差はわずか2点差。柏木は自分が落ちた理由を「審査が不公平だった」と感じていた形跡がある（部日誌への書き込み）。', importance: 'high' },
        { id: 'p8-c2-4', type: 'evidence', title: '柏木の検索履歴', action_label: '柏木のスマホ履歴を確認する', focus_area: 'digital', focus_label: '📱 履歴', content: '柏木のスマートフォンの検索履歴に「匿名で告発する方法」「名誉毀損 罪にならない方法」という検索が3日前に残っていた。', importance: 'critical' }
      ]
    },
    {
      phase: 3, phase_title: '第3幕 — 幕が下りる', phase_narrative: '柏木の「渡辺に頼まれた」という弁明は崩れた。全ての証拠が一人の人物を指し示している。',
      total_cards: 3, selectable: 2,
      cards: [
        { id: 'p8-c3-1', type: 'evidence', title: '告発状の画鋲', action_label: '画鋲の指紋を調べる', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '告発状を掲示板に留めた画鋲から、柏木の指紋が検出された。他の指紋は検出されていない。「たまたま触った」では説明できない鮮明さで残っていた。', importance: 'critical' },
        { id: 'p8-c3-2', type: 'testimony', title: '長谷川先生の証言', action_label: '長谷川先生に聞く', focus_area: 'person_hasegawa', focus_label: '👤 長谷川', content: '「柏木は先週、私のところに来て"オーディションをやり直してほしい"と訴えた。断ったところ、"公平じゃない結果は正さなければならない"と言い残して出て行きました」', importance: 'high' },
        { id: 'p8-c3-3', type: 'circumstance', title: '防犯カメラ映像', action_label: '校内カメラを確認する', focus_area: 'forensics', focus_label: '📹 映像', content: '部室棟の防犯カメラに、放課後6時頃に柏木が部室に入り、掲示板に何かを貼り付けている映像が記録されていた。その手には白い紙があるのが確認できる。', importance: 'critical' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……なぜあの子が主役なんだ。私の方が演技力は上のはず。2点差？　あのオーディションは不公平だ。先生にやり直しを頼んでもダメだった。なら、別の方法で主役の座を取り戻すしかない。', time_hint: '一週間前' },
    { id: 2, monologue: 'USBに告発文を保存して音楽室で印刷した。帰り際に小野寺に見られた気がするが、"楽譜のコピー"で誤魔化した。放課後、誰もいない部室に貼り出す。画鋲を押す指が震えた。……これで相馬は降板する。私が主役になる。', time_hint: '昨日17時' }
  ],
  solution: {
    culprit: '柏木蓮',
    motive_detail: 'オーディションで相馬に2点差で敗れたことを不公平と感じ、虚偽の告発で相馬を降板させて自分が主役になろうとした。',
    method_detail: '事実を確認せずに虚偽の告発文をパソコンで作成し、USBメモリに保存。音楽室のプリンターで印刷し、放課後に部室の掲示板に画鋲で貼り出した。',
    timeline: '3日前: 告発方法を検索 → 前日16:55 告発文を作成 → 17:10 音楽室で印刷 → 当日18:00 部室の掲示板に貼り出し',
    key_evidence: '①音楽室プリンター使用記録 ②小野寺の目撃証言 ③USBメモリの「告発文.docx」(作成者=柏木) ④渡辺の否定証言 ⑤スマホ検索履歴 ⑥画鋲の指紋 ⑦防犯カメラ映像'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '柏木蓮', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: 'オーディション敗北への不満。相馬を降板させて主役になりたかった', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '虚偽の告発文をUSBからプリンター印刷し、部室掲示板に貼り出した', type: 'text', points: 2 }
  ],
  full_story: '柏木蓮はオーディションで相馬遥に2点差で敗れ主役を逃した。不公平だと感じた柏木は顧問に再オーディションを求めたが拒否され、虚偽の告発で相馬を降板させる計画を立てた。事実を確認せず「審査員への裏口推薦」という虚偽の内容を告発文に書き、USBに保存。音楽室のプリンターで印刷し、放課後に部室の掲示板に貼り出した。しかし告発内容は事実無根であり、USBメモリにはファイルの作成者として柏木の名前が残り、画鋲からは柏木の指紋が検出された。印刷時に後輩に目撃され、防犯カメラにも掲示の瞬間が記録されていた。',
  hints: [
    { level: 1, text: '告発状はプリンターで印刷されています。校内のどのプリンターが使われたか調べてみてください。', penalty: 1 },
    { level: 2, text: '告発文のデータファイルが誰のUSBに保存されていたか確認してください。また、犯人は「渡辺に頼まれた」と主張しますが、渡辺の証言を照合してみましょう。', penalty: 1 },
    { level: 3, text: '犯人は柏木蓮。USBの「告発文.docx」(作成者名=柏木)、音楽室での印刷目撃、画鋲の指紋、スマホの検索履歴、防犯カメラ映像が証拠です。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: 'プリンター記録→目撃→USB(作成者=柏木)→渡辺否定→検索履歴→指紋→カメラ→犯人=柏木', confidence_score: 98, fix_applied: false }
},

// ============================================================
// #9 和風 ⭐「祭囃子の裏側」
// ============================================================
{
  id: 'preset-09',
  theme: 'japanese',
  difficulty: 'easy',
  title: '祭囃子の裏側',
  scene_image: 'img/presets/preset-09.png',
  setting: { location: '地方の氏神神社「天照宮」', time: '2025年8月15日 お盆の夜', atmosphere: '提灯の灯りに照らされた夏祭りの賑わいと、境内裏の静寂' },
  introduction: '人口三千人の小さな町、美里町。毎年お盆に催される天照宮の夏祭りは、町最大の行事だ。今年の祭りの目玉は、町の名士・吉岡源造が寄贈した純金の御神体「天照の鏡」のお披露目だった。時価二千万円を超えるこの鏡は、祭りの翌日に正式に神社へ奉納される予定だった。\n\n祭りの夜、境内の本殿に安置されていた天照の鏡が消えた。本殿の扉には鍵がかかっており、鍵を持つのは四人。宮司の佐久間、氏子総代の吉岡（寄贈者本人）、巫女頭の千歳、そして祭り実行委員長の村上だ。\n\n祭囃子が鳴り響き、屋台の明かりが境内を照らす中で起きた大胆な犯行。祭りの喧騒に紛れて、誰が鏡を持ち出したのか。あなたは町の駐在さんとして、祭りが終わる前にこの事件を解決しなければならない。\n\n小さな町では秘密は長く隠せない。しかし、祭りの夜だけは誰もが仮面をかぶっている。',
  victim: { name: '天照宮', age: 0, role: '神社（被害組織）', cause_of_death: '純金御神体「天照の鏡」の盗難' },
  suspects: [
    { name: '佐久間正', age: 65, role: '宮司', relationship: '神社の管理者', personality: '温厚で信望が厚い', motive: '本殿の修繕費用が不足しており、鏡を売って充当したかった', alibi: '「祭りの神事を執り行っていた」', is_culprit: false, portrait_image: 'img/presets/preset-09-sakuma.png' },
    { name: '吉岡源造', age: 70, role: '町の名士・寄贈者', relationship: '鏡の元の持ち主', personality: '豪快で見栄っ張り', motive: '実は事業が傾いており、保険金目当ての自作自演', alibi: '「来賓席で接待をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-09-yoshioka.png' },
    { name: '千歳舞', age: 22, role: '巫女頭', relationship: '佐久間宮司の孫娘', personality: '真面目だが内に秘めた不満がある', motive: '祖父への反発と金銭的困窮', alibi: '「神楽の舞を奉納していた」', is_culprit: false, portrait_image: 'img/presets/preset-09-chitose.png' },
    { name: '村上達也', age: 45, role: '祭り実行委員長', relationship: '町役場の職員', personality: '几帳面だが金遣いが荒い', motive: 'ギャンブルの借金返済が急務', alibi: '「祭りの運営で境内を巡回していた」', is_culprit: true, portrait_image: 'img/presets/preset-09-murakami.png' }
  ],
  investigation_phases: [
    {
      phase: 1, phase_title: '第1幕 — 消えた鏡', phase_narrative: '本殿の扉は施錠されたまま、鏡だけが消えている。しかし本殿の裏手に、最近開けられた形跡のある小さな窓があった。窓から侵入するには鍵は不要だが、身体の大きい人間には難しい。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p9-c1-1', type: 'evidence', title: '裏窓の痕跡', action_label: '本殿の裏窓を調べる', focus_area: 'location_temple', focus_label: '⛩️ 本殿', content: '裏窓の枠に衣服の繊維が引っかかっていた。紺色の綿素材で、祭りの法被と同じ素材。法被を着ていたのは村上実行委員長のみ（他の三人は和装か作業着）。窓枠には泥の痕跡もあり、地下足袋の靴底パターンと一致。', importance: 'critical' },
        { id: 'p9-c1-2', type: 'testimony', title: '屋台店主の証言', action_label: '屋台の人に聞く', focus_area: 'person_yatai', focus_label: '👤 屋台', content: '焼きそば屋台の店主が証言。「8時半頃、村上さんが本殿の裏手に回っていくのを見ました。"巡回だ"と言っていたけど、手に大きな風呂敷を持っていたのが気になりました」', importance: 'critical' },
        { id: 'p9-c1-3', type: 'circumstance', title: '鍵の確認', action_label: '鍵の所在を確認する', focus_area: 'forensics', focus_label: '🔑 鍵', content: '四人全員の鍵を確認。全て所持しており、合鍵作成の形跡もない。正面扉からの侵入ではなく、裏窓からの侵入と考えるのが妥当。裏窓には鍵がなく、木製の留め具のみ。', importance: 'high' },
        { id: 'p9-c1-4', type: 'testimony', title: '千歳の証言', action_label: '千歳に聞く', focus_area: 'person_chitose', focus_label: '👤 千歳', content: '「神楽を舞い終えた8時45分頃、村上さんが車のトランクに何かを入れているのを見ました。祭りの備品かと思ったのですが、やけに慎重に扱っていたのが不思議でした」', importance: 'high' }
      ]
    },
    {
      phase: 2, phase_title: '第2幕 — 借金の影', phase_narrative: '村上達也の周辺を調べると、彼が深刻なギャンブル依存と借金を抱えていることが分かってきた。祭り実行委員長という立場が犯行を可能にした。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p9-c2-1', type: 'evidence', title: '村上の車のトランク', action_label: '村上の車を調べる', focus_area: 'location_car', focus_label: '🚗 車', content: 'トランクを確認すると、風呂敷に包まれた天照の鏡が発見された。鏡には村上の指紋が複数付着しており、風呂敷は村上の自宅にあったものと柄が一致。', importance: 'critical' },
        { id: 'p9-c2-2', type: 'evidence', title: '借金の証拠', action_label: '村上の財務状況を調べる', focus_area: 'documents', focus_label: '📄 財務', content: '村上の自宅から、消費者金融3社からの督促状が見つかった。借入総額は800万円。返済期限はお盆明けの翌週。', importance: 'critical' },
        { id: 'p9-c2-3', type: 'testimony', title: '吉岡の証言', action_label: '吉岡に聞く', focus_area: 'person_yoshioka', focus_label: '👤 吉岡', content: '「村上は先月、私のところに来て"個人的にお金を貸してほしい"と頼んできた。事情を聞いたらギャンブルの借金だったので断ったんだ。その時、鏡の値段をやたら気にしていたのを覚えている」', importance: 'high' },
        { id: 'p9-c2-4', type: 'circumstance', title: '法被の繊維照合', action_label: '法被の繊維を照合する', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '裏窓の枠に引っかかっていた繊維を村上の法被と照合すると、完全に一致。さらに法被の右袖に窓枠の木の削りかすが付着していた。', importance: 'critical' }
      ]
    },
    {
      phase: 3, phase_title: '第3幕 — 祭りの終わり', phase_narrative: '証拠は出揃った。村上の犯行は明らかだ。最後に彼のアリバイを完全に崩す証拠を提示する。',
      total_cards: 3, selectable: 2,
      cards: [
        { id: 'p9-c3-1', type: 'evidence', title: '巡回記録の空白', action_label: '巡回記録を検証する', focus_area: 'documents', focus_label: '📋 記録', content: '村上が付けていた巡回チェックリストに、8時20分から8時50分の30分間が空白になっている。他の時間帯は5分刻みで記録があるのに、この時間帯だけ記録がない。犯行に要した時間と一致。', importance: 'critical' },
        { id: 'p9-c3-2', type: 'evidence', title: '質屋への連絡履歴', action_label: '村上のスマホを確認する', focus_area: 'digital', focus_label: '📱 通話', content: '村上のスマートフォンに、隣町の質屋への通話履歴が3回残っていた。最後の通話は今朝。質屋に確認すると「純金製品の買取見積もりを依頼された」とのこと。', importance: 'critical' },
        { id: 'p9-c3-3', type: 'testimony', title: '佐久間宮司の証言', action_label: '佐久間宮司に聞く', focus_area: 'person_sakuma', focus_label: '👤 佐久間', content: '「村上くんは実行委員長として本殿の裏の地理に詳しい。裏窓のことも知っていたはずだ。祭りの巡回を名目に、境内のどこにでも行ける立場だった」', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……督促状がまた届いた。来週までに返さなければ取り立てが来る。吉岡さんにも断られた。あの鏡、二千万の値がつく。祭りの夜なら騒ぎに紛れて…巡回の名目で本殿の裏に回れる。裏窓から入れば鍵は要らない。', time_hint: '祭り前日' },
    { id: 2, monologue: '祭囃子が大きくなった。今だ。法被を着たまま裏窓から滑り込む。袖が引っかかった。鏡を風呂敷に包んで窓から出す。車のトランクに隠す。30分で終わった。誰にも見られていないはず…だった。', time_hint: '8時30分' }
  ],
  solution: {
    culprit: '村上達也',
    motive_detail: 'ギャンブルによる800万円の借金返済が急務で、純金の御神体（時価2000万円以上）を売却して借金を清算しようとした。',
    method_detail: '祭り実行委員長の立場を悪用し、巡回を名目に本殿裏手に回り、鍵のない裏窓から侵入して鏡を持ち出した。風呂敷に包んで車のトランクに隠した。',
    timeline: '8:20 巡回を中断 → 8:25 本殿裏手に回る → 8:30 裏窓から侵入し鏡を風呂敷に包む → 8:35 裏窓から脱出 → 8:40 車のトランクに隠す → 8:50 巡回に復帰',
    key_evidence: '①裏窓の繊維→法被一致 ②屋台店主の目撃 ③千歳の目撃（トランク）④車から鏡発見 ⑤借金の督促状 ⑥巡回記録の空白 ⑦質屋への通話'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '村上達也', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: 'ギャンブルによる800万円の借金返済のため', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: '巡回を名目に本殿裏手に回り、裏窓から侵入して鏡を持ち出し、車のトランクに隠した', type: 'text', points: 2 }
  ],
  full_story: '祭り実行委員長の村上達也はギャンブル依存で800万円の借金を抱えていた。返済期限が迫る中、純金の御神体「天照の鏡」（時価2000万超）に目をつけた。祭りの夜、巡回を名目に本殿裏手に回り、鍵のない裏窓から侵入。法被が窓枠に引っかかり繊維を残すミスを犯しながらも、鏡を風呂敷に包んで持ち出し車のトランクに隠した。屋台店主に風呂敷を持つ姿を、千歳にトランクへの積み込みを目撃されていた。車から鏡が発見され、法被繊維の一致、巡回記録の空白、質屋への通話履歴が犯行を裏付けた。',
  hints: [
    { level: 1, text: '犯人は正面扉ではなく、裏窓から侵入しました。裏窓に残された痕跡と、祭りの夜に法被を着ていた人物に注目してください。', penalty: 1 },
    { level: 2, text: '犯人は祭りの巡回を名目に境内を自由に移動できる立場にいます。巡回記録に不自然な空白がないか確認してください。', penalty: 1 },
    { level: 3, text: '犯人は村上達也。法被繊維→裏窓侵入→風呂敷で鏡を持ち出し→車のトランクに隠蔽。ギャンブル借金800万の返済が動機。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: '裏窓繊維(法被)→目撃(風呂敷)→目撃(トランク)→車から鏡発見→借金→巡回空白→犯人=村上', confidence_score: 98, fix_applied: false }
},

// ============================================================
// #10 ノワール ⭐⭐「ネオンの嘘」
// ============================================================
{
  id: 'preset-10',
  theme: 'noir',
  difficulty: 'normal',
  title: 'ネオンの嘘',
  scene_image: 'img/presets/preset-10.png',
  setting: { location: '歌舞伎町のクラブ「エデン」', time: '2025年9月5日 深夜1時', atmosphere: 'ネオンが瞬く夜の繁華街。クラブの薄暗いVIPルーム' },
  introduction: '歌舞伎町の雑居ビル五階。高級クラブ「エデン」のVIPルームで、IT企業社長の三上雄一が飲み物に混入された薬物により意識不明で発見された。一命は取り留めたものの、三上のスマートフォンとカバンに入っていた新規事業の機密データUSBが盗まれていた。\n\n三上は意識を失う前に、部屋にいた四人の名前を呟いた。ホステスの麗華、マネージャーの北条、取引先の園田、そしてバーテンダーの霧島。全員がVIPルームに出入りしていた人物だ。\n\n防犯カメラの映像には、VIPルーム前の廊下を行き来する四人が映っているが、ルーム内にカメラはない。三上が薬物を盛られた正確な時刻も、USBを盗んだのが誰かも特定できていない。\n\n裏社会に通じた元刑事のあなたは、この夜の繁華街の闇に潜む真実を暴かなければならない。クラブの華やかさの裏に、誰の嘘が隠れているのか。',
  victim: { name: '三上雄一', age: 42, role: 'IT企業「ミカミテック」社長', cause_of_death: '飲み物への薬物混入による昏睡 + 機密USBの窃盗' },
  suspects: [
    { name: '麗華', age: 27, role: 'No.1ホステス', relationship: '三上の指名ホステス', personality: '妖艶で知的', motive: '三上が他のホステスに乗り換えようとしていた', alibi: '「VIPルームで三上さんの接客をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-10-reika.png' },
    { name: '北条修', age: 48, role: 'クラブのマネージャー', relationship: '店の運営管理者', personality: '冷静で抜け目がない', motive: '経営難の店の資金不足を補いたい', alibi: '「ホール全体の管理をしていた」', is_culprit: false, portrait_image: 'img/presets/preset-10-hojo.png' },
    { name: '園田光一', age: 50, role: '取引先の社長', relationship: '三上の競合他社の社長', personality: '穏やかだが野心的', motive: '新規事業の機密データを入手してライバルを出し抜く', alibi: '「VIPルームで三上と商談をしていた」', is_culprit: true, portrait_image: 'img/presets/preset-10-sonoda.png' },
    { name: '霧島涼', age: 30, role: 'バーテンダー', relationship: 'VIP専属のバーテンダー', personality: 'クールで無口', motive: '園田からの報酬で協力した可能性', alibi: '「カウンターでドリンクを作っていた」', is_culprit: false, portrait_image: 'img/presets/preset-10-kirishima.png' }
  ],
  investigation_phases: [
    {
      phase: 1, phase_title: '第1幕 — ネオンの向こう側', phase_narrative: '三上の血液から検出された薬物は市販の睡眠薬を粉末にしたもの。飲み物に混入されたのは確実だが、誰がいつ入れたのか。VIPルームの飲み物の動線を追う。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p10-c1-1', type: 'evidence', title: '三上のグラスの分析', action_label: 'グラスを鑑識する', focus_area: 'forensics', focus_label: '🥃 グラス', content: '三上のウイスキーグラスから睡眠薬成分が検出された。グラスの持ち手側面に、三上本人以外の指紋が一つ。照合の結果、園田光一のもの。園田は「乾杯の時にグラスが当たった」と説明。', importance: 'critical' },
        { id: 'p10-c1-2', type: 'testimony', title: '麗華の証言', action_label: '麗華に聞く', focus_area: 'person_reika', focus_label: '👤 麗華', content: '「0時半頃、園田さんが三上さんのグラスにウイスキーを注ぎ足していました。"もう一杯いきましょう"と。私は少し離れた席にいたので手元は見えませんでしたが、園田さんの手がグラスの上で一瞬止まったような気がします」', importance: 'critical' },
        { id: 'p10-c1-3', type: 'circumstance', title: '防犯カメラ映像', action_label: '廊下のカメラを確認する', focus_area: 'forensics', focus_label: '📹 映像', content: '廊下のカメラ映像を時系列で確認。0時50分、園田がVIPルームから出て、エレベーターに向かう。右手にカバンのような四角い形のものを抱えている。1時に戻る。この10分間に何をしていたか。', importance: 'high' },
        { id: 'p10-c1-4', type: 'testimony', title: '霧島の証言', action_label: '霧島に聞く', focus_area: 'person_kirishima', focus_label: '👤 霧島', content: '「園田さんは0時半に三上さんのウイスキーのお代わりを頼みに来ました。普通はホステスさんが来るんですが、園田さんが直接。瓶を持って自分でVIPルームに戻りました。変だなとは思いました」', importance: 'high' }
      ]
    },
    {
      phase: 2, phase_title: '第2幕 — 競合の影', phase_narrative: '園田光一の周辺を調べると、彼がミカミテックの新規事業に並々ならぬ関心を寄せていたことが判明した。単なる商談相手ではなかったのだ。',
      total_cards: 4, selectable: 2,
      cards: [
        { id: 'p10-c2-1', type: 'evidence', title: '園田の車の捜索', action_label: '園田の車を調べる', focus_area: 'location_car', focus_label: '🚗 車', content: '園田の車のグローブボックスから、三上のものと思われるUSBメモリが発見された。USBにはミカミテックの新規事業企画書、技術仕様書、顧客リストが保存されていた。', importance: 'critical' },
        { id: 'p10-c2-2', type: 'evidence', title: '園田のポケットの薬', action_label: '園田の持ち物を調べる', focus_area: 'person_sonoda', focus_label: '👤 園田', content: '園田のジャケットの内ポケットから、市販の睡眠薬のシートが発見された。2錠分が切り取られて使用済み。三上のグラスから検出された薬物成分と同じ製品。', importance: 'critical' },
        { id: 'p10-c2-3', type: 'testimony', title: '北条の証言', action_label: '北条に聞く', focus_area: 'person_hojo', focus_label: '👤 北条', content: '「園田さんは今夜が初来店です。三上さんの常連情報を事前に問い合わせてきて、"隣の席にセッティングしてほしい"と指定してきました。三上さんに近づくのが最初から目的だったんでしょう」', importance: 'high' },
        { id: 'p10-c2-4', type: 'circumstance', title: 'ビルの防犯カメラ', action_label: 'ビル全体のカメラを確認', focus_area: 'forensics', focus_label: '📹 ビル', content: '0時52分、園田がビル1階のエレベーターから出て駐車場に向かう映像あり。右手にUSBサイズの四角い物体を持っている。0時57分に戻る映像。車にUSBを隠しに行ったタイミングと一致。', importance: 'high' }
      ]
    },
    {
      phase: 3, phase_title: '第3幕 — 嘘の終幕', phase_narrative: '園田の犯行は明らかだ。しかし彼は「商談の資料だ」「薬は自分の不眠症のもの」と弁明を続ける。最後の証拠で決着をつける。',
      total_cards: 3, selectable: 2,
      cards: [
        { id: 'p10-c3-1', type: 'evidence', title: 'USBの指紋', action_label: 'USBの指紋を照合する', focus_area: 'forensics', focus_label: '🔬 鑑識', content: '園田の車から発見されたUSBの表面から、園田の指紋のみが検出された。三上は「USBは常にカバンの中で、他人に触らせたことはない」と証言。園田が三上から直接抜き取ったことを示す。', importance: 'critical' },
        { id: 'p10-c3-2', type: 'evidence', title: '園田の通信記録', action_label: '園田のスマホを調べる', focus_area: 'digital', focus_label: '📱 通信', content: '園田のスマートフォンに、自社の技術部長宛のメッセージが0時55分に送信されていた。内容は「サンプル入手。明朝分析開始で」。犯行直後に成果を報告していた決定的証拠。', importance: 'critical' },
        { id: 'p10-c3-3', type: 'testimony', title: '三上の記憶', action_label: '意識を回復した三上に聞く', focus_area: 'person_mikami', focus_label: '👤 三上', content: '三上が意識を回復し証言。「園田が"もう一杯"と注いでくれた後、急に眠くなった。その直前、園田が私のカバンに手を伸ばしたのが見えた気がする…あれが最後の記憶です」', importance: 'high' }
      ]
    }
  ],
  culprit_flashbacks: [
    { id: 1, monologue: '……ミカミテックの新規事業データさえ手に入れば、我が社が先に市場を取れる。あのクラブに三上が通っていると聞いた。北条に金を渡して隣の席を取った。あとは睡眠薬を仕込んで、眠った隙にUSBを抜くだけだ。', time_hint: '一週間前' },
    { id: 2, monologue: 'ウイスキーを注ぎ足す振りをして、粉末にした薬をグラスに落とす。三上がそれを飲み干すのを見届ける。5分後、目が虚ろになった。今だ。カバンからUSBを抜き取り、トイレに行くふりをして車に隠す。完璧だ。', time_hint: '深夜0時35分' }
  ],
  solution: {
    culprit: '園田光一',
    motive_detail: '競合他社の社長として、三上の新規事業の機密データを盗み、自社が先に市場を占有するための産業スパイ行為。',
    method_detail: '北条に金を渡して三上の隣席を確保。酒を注ぎ足す際にグラスに睡眠薬を混入。三上が意識を失った後、カバンからUSBを抜き取り、トイレを装って車に隠した。',
    timeline: '0:30 ウイスキーを注ぎ足す際に睡眠薬を投入 → 0:35 三上が意識喪失 → 0:40 USBをカバンから抜き取り → 0:50 VIPルームを出て車へ → 0:55 USBを車に隠す+メッセージ送信 → 1:00 ルームに戻る',
    key_evidence: '①グラスに園田の指紋 ②麗華の「グラス上で手が止まった」証言 ③車からUSB発見 ④ジャケットから睡眠薬シート ⑤USB表面に園田の指紋のみ ⑥「サンプル入手」メッセージ'
  },
  questions: [
    { id: 'q1', question: '犯人は誰ですか？', answer: '園田光一', type: 'choice', points: 3 },
    { id: 'q2', question: '犯行の動機は何ですか？', answer: '競合として新規事業の機密データを盗み、自社の優位を確立するため', type: 'text', points: 2 },
    { id: 'q3', question: '犯行の手口は？', answer: 'ウイスキーに睡眠薬を混入→三上が昏睡→カバンからUSBを抜き取り車に隠した', type: 'text', points: 2 }
  ],
  full_story: '園田光一はミカミテックの競合他社社長。三上の新規事業データを入手するため、三上が通うクラブ「エデン」に北条経由で隣席を確保。酒を注ぎ足すふりをして睡眠薬をグラスに投入し、三上が意識を失った後にカバンからUSBを抜き取った。「トイレ」を装ってVIPルームを出て、エレベーターで1階に降り車にUSBを隠し、自社の技術部長に「サンプル入手」とメッセージを送信。グラスの指紋、麗華の証言、車から発見されたUSB、ジャケットの睡眠薬シート、そして犯行直後のメッセージが犯行を証明した。',
  hints: [
    { level: 1, text: '犯人は三上のグラスに直接触れた人物です。グラスの指紋と、誰が酒を注いだかに注目してください。', penalty: 1 },
    { level: 2, text: '三上が意識を失った後、廊下のカメラに映っている不審な動きはありませんか？誰がVIPルームを離れ、どこに行ったか確認してください。', penalty: 1 },
    { level: 3, text: '犯人は園田光一。グラスの指紋→睡眠薬混入→USB窃盗→車に隠蔽→「サンプル入手」メッセージが犯行チェーンです。', penalty: 2 }
  ],
  _self_validation: { is_solvable: true, reasoning_chain: 'グラス指紋→麗華証言→カメラ(外出)→車からUSB→睡眠薬シート→USBに園田指紋のみ→メッセージ→犯人=園田', confidence_score: 98, fix_applied: false }
}

]; // PRESET_SCENARIOS 配列の終わり
