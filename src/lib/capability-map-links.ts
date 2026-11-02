import { SOURCES as S } from "./capability-map-sources";
import { t, type CompanyDef, type EdgeDef, type KeyPointDef, type LoopDef } from "./capability-map-types";

const MEASURE = t("測る", "Measure");

export const EDGES: EdgeDef[] = [
  {
    id: "e-hardware",
    from: "resources",
    to: "compute",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    label: t("ハードウェア効率", "Hardware efficiency"),
    detail: {
      summary: t(
        "1 ドル・1 ワットあたりに得られる計算量。チップの世代、低精度化、メモリ、パッケージ、運用の効率で決まる。",
        "Compute per dollar and per watt, set by chip generation, lower precision, memory, packaging and how well the fleet is run.",
      ),
      note: t(
        "長期では指数関数的に改善するが、新しい世代が出るたびに段階的に進む。H100 から Rubin までの 1 チップあたりの性能の伸びの多くは、微細化ではなく、ダイと電力を増やし、精度を下げ、メモリを積むことで得られた。ただし、電力を増やした分は 1 ワットあたりの効率を上げない。",
        "It improves exponentially over the long run, but in steps with each generation. Most of the per-chip performance gain from H100 to Rubin came not from smaller transistors but from more dies and power, lower precision and more memory — and the added power raises performance per chip, not per watt.",
      ),
      refs: ["4.3:gains", "4.7:tokens"],
      links: [S.epochScaling, S.nvidiaRubin],
    },
  },
  {
    id: "e-allocation",
    from: "compute",
    to: "stages",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    label: t("配分の効率", "Allocation efficiency"),
    detail: {
      summary: t(
        "計算量を、事前学習、強化学習、推論、研究のための実験にどう振り分けるか。同じ計算量でも、配分によって得られる能力が変わる。",
        "How compute is split among pretraining, RL, inference and research experiments; the same compute buys different capability depending on the split.",
      ),
      note: t(
        "Toby Ord の分析では、AIME の正答率を 20% から 80% に上げるのに、推論時の計算なら約 100 倍の増加で済むが、強化学習の計算では約 1 万倍が必要になる（推定の幅は大きい）。",
        "Toby Ord estimates that raising AIME accuracy from 20% to 80% takes about 100x more inference compute but about 10,000x more RL compute (with wide uncertainty).",
      ),
      refs: ["5.2:ord", "5.3:allocate"],
      links: [S.tobyOrd, S.testTimeCompute],
    },
  },
  {
    id: "e-parameter",
    from: "size",
    to: "stages",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    label: t("パラメータ効率", "Parameter efficiency"),
    detail: {
      summary: t(
        "モデルの大きさを、どれだけ少ない計算で能力に変えられるか。MoE は総パラメータを増やしながら、1 トークンの計算に使うパラメータ（稼働パラメータ）を絞り、学習と推論の計算を減らす。その代わり、重みを置くメモリと、エキスパート間の通信の負担は増える。",
        "How little compute it takes to turn model size into capability. MoE grows the total parameter count while using only a few parameters (the active ones) per token, cutting training and inference compute at the cost of more memory for the weights and more communication between experts.",
      ),
      note: t(
        "エキスパートを細かくするほど計算量あたりの性能が上がるという Krajewski らのスケーリング則（2024 年）が、MoE の流れを裏づけている。",
        "Krajewski et al.'s scaling law (2024), in which finer-grained experts give more performance per unit of compute, backs the move to MoE.",
      ),
      refs: ["4.6:moe"],
      links: [S.fineGrainedMoe, S.mixtral],
    },
  },
  {
    id: "e-data",
    from: "materials",
    to: "stages",
    fromSide: "top",
    toSide: "bottom",
    kind: "flow",
    label: t("データ効率", "Data efficiency"),
    detail: {
      summary: t(
        "同じデータの量から、どれだけ学べるか。人間が書いた公開テキストが尽きていくほど重要になる。",
        "How much a model learns from a given amount of data — more important as public human-written text runs out.",
      ),
      note: t(
        "データが限られる場合、同じデータを 4 回まで繰り返して学習しても、新しいデータを使うのと損失はほとんど変わらない。ただし、それ以上繰り返すと、計算を足す効果は消えていく（Muennighoff ら、2023 年）。",
        "When data is limited, repeating it for up to 4 epochs gives almost the same loss as fresh data; with more repetition, though, the value of extra compute fades to zero (Muennighoff et al., 2023).",
      ),
      refs: ["5.2:data"],
      links: [S.dataConstrained, S.villalobos],
    },
  },
  {
    id: "e-algorithmic",
    from: "training",
    to: "model",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    label: t("アルゴリズム効率", "Algorithmic efficiency"),
    detail: {
      summary: t(
        "学習の手法の改善で、同じ計算量から得られるモデルの能力を増やす。",
        "Better training methods that get more model capability out of the same compute.",
      ),
      note: t(
        "同じ性能に必要な計算量は、約 8 か月で半分になってきた（Epoch AI。95% 信頼区間は 5〜14 か月）。",
        "The compute needed for a given level of performance has halved about every eight months (Epoch AI; 95% CI 5–14 months).",
      ),
      refs: ["5.3:loop"],
      links: [S.ho],
    },
  },
  { id: "e-model-harness", from: "model", to: "harness", fromSide: "bottom", toSide: "top", kind: "flow" },
  {
    id: "e-harness",
    from: "harness",
    to: "system",
    fromSide: "bottom",
    toSide: "top",
    kind: "flow",
    label: t("ハーネス効率", "Harness efficiency"),
    detail: {
      summary: t(
        "同じモデルに、どれだけ多くの仕事を完了させられるか。道具、文脈の管理、検証の作り方で決まる。",
        "How much work the same model can be made to finish, set by its tools, context management and checks.",
      ),
      note: t(
        "SWE-agent の論文では、同じ GPT-4 Turbo でも、エージェント向けのインターフェースを与えると SWE-bench Lite の解決率が 11% から 18% に上がった。改善は学習し直さなくてもすでにあるモデルに効くが、伸び方を予測する法則はまだない。",
        "In the SWE-agent paper, giving the same GPT-4 Turbo an interface designed for agents raised its SWE-bench Lite score from 11% to 18%. Improvements apply to existing models without retraining, but no law yet predicts how far they go.",
      ),
      refs: ["5.2:harness"],
      links: [S.sweAgent, S.anthropicHarness],
    },
  },
  {
    id: "e-inference",
    from: "inference",
    to: "harness",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    label: t("推論効率", "Inference efficiency"),
    detail: {
      summary: t(
        "1 トークンあたりの推論費（裏返せば、1 ワット・1 ドルあたりに出せるトークン）。KV キャッシュの圧縮、低精度化、MoE で下がる。",
        "Inference cost per token — equivalently, tokens per watt and per dollar — lowered by KV-cache compression, lower precision and MoE.",
      ),
      note: t(
        "長く考えさせ、サブエージェントで分担するほど、1 件あたりのトークンは増える。電力と HBM が上限を決めるなかでは、1 ワットあたりのトークンが、推論時計算を伸ばせる上限を決める。",
        "Longer thinking and more subagents mean more tokens per job. With power and HBM setting the ceiling, tokens per watt decide how far inference compute can grow.",
      ),
      refs: ["4.4:kvCache", "5.3:hbm"],
      links: [S.memoryWall, S.deepseekV2, S.anthropicMultiAgent],
    },
  },
  { id: "e-system-uses", from: "system", to: "uses", fromSide: "right", toSide: "left", kind: "flow" },
  { id: "m-model", from: "model", to: "measure-model", fromSide: "right", toSide: "left", kind: "measure", label: MEASURE },
  { id: "m-system", from: "system", to: "measure-system", fromSide: "right", toSide: "left", kind: "measure", label: MEASURE },
  {
    id: "m-economy",
    from: "uses",
    to: "measure-economy",
    drawTo: "measures",
    fromSide: "top",
    toSide: "bottom",
    kind: "measure",
    label: MEASURE,
  },
];

export const LOOPS: LoopDef[] = [
  {
    id: "loop-revenue",
    label: t("売上と投資", "Revenue and investment"),
    cycle: ["uses", "revenue", "funding"],
    detail: {
      summary: t(
        "使い道から生まれた売上と利益が、次の計算資源を買う資金になる。",
        "Revenue and profit from the uses pay for the next round of compute.",
      ),
      note: t(
        "このループが回ると示せるかどうかが、次の巨額の資本を集める条件になる。",
        "Showing that this loop turns is the condition for raising the next round of capital.",
      ),
      refs: ["6.3:revenuePerCompute", "2.3"],
      links: [S.s1, S.wsj, S.msft10q],
    },
  },
  {
    id: "loop-research",
    label: t("AI 研究の自動化", "Automating AI research"),
    cycle: ["ai-research", "e-algorithmic", "training", "model"],
    detail: {
      summary: t(
        "AI が次の AI の研究開発を手伝い、アルゴリズムの効率の伸びを速める可能性がある。Anthropic の S-1 はこれを「ループを閉じる」と呼ぶ。",
        "AI helps develop the next AI and may speed up algorithmic progress — what Anthropic's S-1 calls “closing the loop”.",
      ),
      note: t("効果は大きくなりうるが、予測できる軸とは言えない。", "The effect could be large, but it is not a predictable axis."),
      refs: ["2.2:loop", "5.3:loop"],
      links: [S.s1, S.aiScientist, S.alphaEvolve],
    },
  },
  {
    id: "loop-deployment",
    label: t("配備からの学習", "Learning from deployment"),
    cycle: ["uses", "deployment-traces", "e-data", "after-deploy"],
    detail: {
      summary: t(
        "配備したモデルやエージェントの利用の記録から、どこで失敗したかを学び、次の学習に生かす。",
        "Usage records from deployed models and agents show where they fail and feed the next round of training.",
      ),
      note: t(
        "Cursor は、新しいモデルを利用者に配り、次の学習のためのデータを集めるまでを 1.5〜2 時間で回している。",
        "Cursor takes 1.5 to 2 hours to roll a new checkpoint out to users and collect the data for the next training step.",
      ),
      links: [S.cursorRl],
    },
  },
  {
    id: "loop-synthetic",
    label: t("AI が自分でつくるデータ", "Data AI makes itself"),
    cycle: ["system", "synthetic", "gradable", "e-data"],
    detail: {
      summary: t(
        "システムが課題を解いた記録や、モデルがつくった問題と答えを、次の学習の材料にする。採点できる課題なら、正しいものだけを選べる。",
        "Records of the system solving tasks, and problems and answers the models write, become material for the next round; for gradable tasks only the correct ones are kept.",
      ),
      note: t(
        "DeepSeek-R1 は、強化学習の途中のモデルに 1 問あたり複数の答えを出させて正しいものだけを残し（約 60 万件）、次の学習に使った。こうして集めた約 80 万件のデータで小さなモデルを学習させるだけでも、その推論の力は大きく上がった。",
        "DeepSeek-R1 sampled several answers per prompt from an RL checkpoint and kept only the correct ones (about 600,000) for the next round of training; fine-tuning smaller models on the resulting 800,000 samples alone substantially improved their reasoning.",
      ),
      links: [S.deepseekR1, S.phi1],
    },
  },
];

export const COMPANIES: CompanyDef[] = [
  {
    id: "co-openai",
    name: t("OpenAI", "OpenAI"),
    focus: ["external-capital", "contracts", "compute", "depth", "width", "adoption"],
    refs: ["2.3:openai", "6.2:market"],
    links: [S.wsj, S.decoderOpenAI, S.cnbcSpend, S.gpt5, S.o1],
    points: [
      t(
        "ChatGPT の週間利用者は 10 億人に達したが（報道）、1 人あたりの収益は小さい。2026 年 2 月に広告を試験導入した。",
        "ChatGPT has reportedly reached a billion weekly users, but revenue per user is small; ads were trialled from February 2026.",
      ),
      t(
        "考える量を製品として売る。GPT-5 は、速いモデルと考えるモデルを振り分けるルーターを備えたシステムとして発表された。",
        "Sells extra thinking as a product; GPT-5 launched as a system with a router between a fast model and a thinking model.",
      ),
      t(
        "2030 年までの計算資源支出は約 6,000 億ドルと投資家に説明した（報道）。10 月の調達は、当初目標の 300 億ドルの半分に届かなかった（報道）。",
        "Told investors it plans about USD 600 billion of compute spending through 2030 (reported); the October round raised less than half of its USD 30 billion target (reported).",
      ),
    ],
  },
  {
    id: "co-anthropic",
    name: t("Anthropic", "Anthropic"),
    focus: ["rlvr", "agentic-rl", "harness", "software", "knowledge-work", "ai-research", "contracts", "external-capital"],
    refs: ["2.2:agents"],
    links: [S.s1, S.decoderAnthropic, S.menlo],
    points: [
      t(
        "Claude Code と Claude Cowork で、企業のエージェント利用に集中した。Claude Enterprise の利用者では、Claude Code を使う上位 5% が、使わない利用者の平均の約 20 倍を支払う（2026 年 7〜9 月期）。",
        "Focused on enterprise agents with Claude Code and Claude Cowork; the top 5% of Claude Enterprise users who use Claude Code pay about 20 times the average of Enterprise users who don't (July–September 2026).",
      ),
      t(
        "企業の LLM API 支出のシェアは 40%、コーディング用途では 54%（Menlo Ventures、2025 年）。",
        "40% of enterprise LLM API spending, and 54% for coding (Menlo Ventures, 2025).",
      ),
      t(
        "2026 年上期に 1,100 億ドル超を調達した。名前の挙がった計算資源の契約だけで、上限値を含めて 6,000 億ドルを超える。",
        "Raised more than USD 110 billion in H1 2026; the compute agreements named in its S-1 alone exceed USD 600 billion, including upper-bound amounts.",
      ),
    ],
  },
  {
    id: "co-google",
    name: t("Google", "Google"),
    focus: ["chips", "interconnect", "depth", "width", "grid", "external-capital"],
    refs: ["3.5"],
    links: [S.goog10q, S.ironwood, S.anthropicTpu, S.cnbcCodeRed],
    points: [
      t(
        "自社の TPU を持ち、v7 では 9,216 チップを 1 つのポッドにまとめる。Anthropic には最大 100 万基の TPU を供給する。",
        "Has its own TPUs — a v7 pod joins 9,216 chips — and supplies up to a million TPUs to Anthropic.",
      ),
      t(
        "2025 年 11 月に Gemini 3 を出すと、OpenAI は 12 月に社内で「コードレッド」を宣言したと報じられた。Deep Think で考える量を売る。",
        "After Gemini 3 (November 2025), OpenAI reportedly declared a “code red” internally in December; Deep Think sells extra thinking.",
      ),
      t(
        "Alphabet は 2026 年 1〜9 月に自社株買いをやめ、6 月に株式で 495 億ドルを調達し、社債などで 852 億ドルを借り入れた。",
        "Alphabet stopped buybacks in January–September 2026, raised USD 49.5 billion in equity in June and borrowed USD 85.2 billion.",
      ),
    ],
  },
  {
    id: "co-microsoft",
    name: t("Microsoft", "Microsoft"),
    focus: ["ocf", "contracts", "grid", "software", "knowledge-work"],
    refs: ["7.1:selfFunded"],
    links: [S.msft10k, S.msft10q, S.openaiMicrosoft],
    points: [
      t(
        "2026 会計年度の営業キャッシュフローは 1,829 億ドル。設備投資 1,159 億ドルを自己資金で賄い、FCF も 670 億ドル残った。",
        "Operating cash flow of USD 182.9 billion in fiscal 2026 covered USD 115.9 billion of capex and still left USD 67 billion of FCF.",
      ),
      t(
        "開始前のリースは 3,646 億ドル。自社で建てるだけでなく、借りて計算資源を確保している。",
        "USD 364.6 billion of leases not yet commenced: it rents compute as well as building it.",
      ),
      t(
        "ウィスコンシン州とアトランタの Fairwater を専用の広域網でつなぎ、1 つの計算機として使い始めた。Microsoft Cloud の粗利率は 3 年で 73% から 66% に下がった（いずれも 7〜9 月期）。",
        "Its Fairwater sites in Wisconsin and Atlanta are linked by a dedicated wide-area network and run as one computer; Microsoft Cloud's gross margin fell from 73% to 66% over three years (July–September 2023 vs 2026).",
      ),
    ],
  },
  {
    id: "co-amazon",
    name: t("Amazon", "Amazon"),
    focus: ["chips", "contracts", "external-capital", "grid"],
    refs: ["3.5"],
    links: [S.amzn10q, S.epochDataCenters],
    points: [
      t(
        "Anthropic 向けに、インディアナ州の Project Rainier で約 50 万基の Trainium2 を稼働させた。",
        "Runs about 500,000 Trainium2 chips for Anthropic at Project Rainier in Indiana.",
      ),
      t(
        "AWS と OpenAI の契約は 1,380 億ドルに拡大した。受注残は約 5,780 億ドルある。",
        "The AWS–OpenAI agreement has grown to USD 138 billion; the backlog is about USD 578 billion.",
      ),
      t(
        "長期借入の額面は、2025 年末の 688 億ドルから 2026 年 9 月末の 1,809 億ドルに増えた。",
        "Long-term debt rose from USD 68.8 billion at the end of 2025 to USD 180.9 billion at the end of September 2026.",
      ),
    ],
  },
  {
    id: "co-meta",
    name: t("Meta", "Meta"),
    focus: ["precision", "mfu", "grid", "external-capital"],
    refs: ["4.2:llama4", "6.2:lenders"],
    links: [S.metaLlama4, S.llama3, S.epochDataCenters],
    points: [
      t(
        "Llama 4 の最大のモデルを FP8 で事前学習し、GPU 1 基あたり 390 TFLOPS を出した。",
        "Pretrained its largest Llama 4 model in FP8 at 390 TFLOPS per GPU.",
      ),
      t(
        "オハイオ州の Prometheus（1 GW 超を計画）の第 1 期を稼働させ、ルイジアナ州の Hyperion では最終的に 5 GW を目指す。",
        "Brought the first phase of Prometheus in Ohio (planned at over 1 GW) online and aims for 5 GW at Hyperion in Louisiana.",
      ),
      t(
        "ルイジアナのデータセンターを、Blue Owl との特別目的会社が負う約 270 億ドルの負債で賄った（報道）。",
        "Financed the Louisiana data centre with about USD 27 billion of debt carried by a special-purpose vehicle with Blue Owl (reported).",
      ),
    ],
  },
  {
    id: "co-xai",
    name: t("xAI（SpaceXAI）", "xAI (SpaceXAI)"),
    focus: ["compute", "grid", "rlvr", "width"],
    refs: ["4.1"],
    links: [S.epochDataCenters, S.grok4, S.s1],
    points: [
      t(
        "メンフィスの Colossus 2 は H100 換算で約 111 万基に相当し、2026 年 11 月時点で最大の計算資源を持つサイトである（Epoch AI）。",
        "Colossus 2 in Memphis, at about 1.11 million H100 equivalents, was the largest compute site as of November 2026 (Epoch AI).",
      ),
      t(
        "Grok 4 で、強化学習を事前学習と同じ規模で行ったと発表した（2025 年 7 月）。",
        "Said it ran RL for Grok 4 at pretraining scale (July 2025).",
      ),
      t(
        "2026 年 2 月に SpaceX に買収され、自社の GPU の計算資源を Anthropic に売る側にも回っている。",
        "Acquired by SpaceX in February 2026, it now also sells GPU compute to Anthropic.",
      ),
    ],
  },
  {
    id: "co-deepseek",
    name: t("DeepSeek", "DeepSeek"),
    focus: ["precision", "active", "context", "rlvr", "e-algorithmic"],
    refs: ["4.6:moe", "4.6:rlvr"],
    links: [S.deepseekV2, S.deepseekV3, S.deepseekR1, S.deepseekV32, S.nistCaisi],
    points: [
      t(
        "DeepSeek-V3（2024 年 12 月）を FP8 で学習し、低精度の学習を広めるきっかけをつくった。",
        "Trained DeepSeek-V3 (December 2024) in FP8, which helped make low-precision training common.",
      ),
      t(
        "MLA で KV キャッシュを圧縮し、DSA で重要な 2,048 トークンだけを選んでアテンションを計算する。",
        "MLA compresses the KV cache, and DSA attends only to the 2,048 most relevant tokens.",
      ),
      t(
        "DeepSeek-R1 で、o1 の成果を RLVR によって安く再現した。NIST の CAISI によれば、DeepSeek V4 Pro の能力は米国のフロンティアから約 8 か月遅れている。",
        "DeepSeek-R1 used RLVR to reproduce o1's results cheaply. According to NIST's CAISI, DeepSeek V4 Pro trails the US frontier by about eight months.",
      ),
    ],
  },
];

export const KEY_POINTS: KeyPointDef[] = [
  {
    id: "kp-two-capabilities",
    title: t("能力には 2 種類ある", "There are two kinds of capability"),
    body: t(
      "モデル単体の能力と、モデルにハーネスと推論計算を組み合わせたシステムが仕事を完了する能力は別のものである。売上につながるのは後者で、METR のタイムホライズンや RLI も後者を測っている。ECI のような総合指数には両方が混ざる。",
      "What the model can do alone differs from what the model, harness and inference compute get done together. Revenue follows the latter, which is what METR's time horizon and RLI measure; composite indices such as ECI mix the two.",
    ),
    ids: ["model", "harness", "system", "e-model-harness", "e-harness", "measure-model", "measure-system", "m-model", "m-system", "eci"],
    refs: ["5.2:twoKinds", "5.3:target"],
  },
  {
    id: "kp-predictable",
    title: t("予測しやすいレバー", "The predictable levers"),
    body: t(
      "課題の範囲を決めれば、強化学習は上限に向かう S 字で、推論時計算は計算量の対数に比例して伸びる。範囲を広げ続けられるかどうかは、採点できる課題と環境の数で決まる。",
      "Within a fixed range of tasks, RL follows an S-curve towards a ceiling and inference compute grows with the logarithm of compute. How far that range can keep widening depends on how many gradable tasks and environments exist.",
    ),
    ids: ["rlvr", "agentic-rl", "inference", "gradable", "e-allocation"],
    refs: ["5.3:answer"],
  },
  {
    id: "kp-pretraining",
    title: t("事前学習は早く回収する必要がある", "Pretraining has to pay back fast"),
    body: t(
      "事前学習の費用は前払いで、モデルが売れる期間のうちに回収するしかない。米国の各社は数か月単位で首位を入れ替え、中国で最も強いオープンウェイトモデルも約 8 か月遅れで追いかけてくる（NIST の評価）なかで、その期間は長くない。",
      "Pretraining is paid for up front and must be recovered while the model sells — not long when US labs trade the lead every few months and even the strongest Chinese open-weight model trails by only about eight months (per NIST).",
    ),
    ids: ["pretraining", "human-data", "compute", "external-capital"],
    refs: ["3.1", "5.3:recover", "6.3:training"],
  },
  {
    id: "kp-ceiling",
    title: t("電力と HBM が上限を決める", "Power and HBM set the ceiling"),
    body: t(
      "計算量の上限は、電力と系統接続、HBM の供給、先端パッケージで決まる。どれも、お金を積んでもすぐには増やせない。",
      "The ceiling on compute is set by power and grid connections, HBM supply and advanced packaging — none of which money can expand quickly.",
    ),
    ids: ["grid", "permits", "hbm", "packaging", "e-hardware"],
    refs: ["4.1", "4.4:soldOut"],
  },
  {
    id: "kp-efficiency",
    title: t("効率が 1 GW あたりの成果を決める", "Efficiencies decide output per gigawatt"),
    body: t(
      "矢印に書いた効率を上げれば、同じ電力でより多くの仕事を完了できる。電力を増やせないときの伸びしろは、ここにある。",
      "Raising the efficiencies on the arrows gets more work done from the same power — the room left to grow when power cannot be added.",
    ),
    ids: ["e-hardware", "e-allocation", "e-parameter", "e-data", "e-algorithmic", "e-inference", "e-harness"],
    refs: ["4.7:tokens"],
  },
  {
    id: "kp-revenue-loop",
    title: t("売上のループが次の資本を決める", "The revenue loop decides the next round"),
    body: t(
      "仕事を完了する能力が売上と粗利に変わり、それが次の計算資源の資金になる。このループが回ると示せるかどうかが、次の巨額の資本を集める条件になる。",
      "Getting work done turns into revenue and margin, which fund the next compute. Showing that this loop turns is the condition for raising the next round.",
    ),
    ids: ["loop-revenue", "system", "uses", "revenue", "funding"],
    refs: ["6.3:revenuePerCompute"],
  },
];
