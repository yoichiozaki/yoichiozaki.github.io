import { CHAIN_EDGES } from "./capability-map-chain";
import { SOURCES as S } from "./capability-map-sources";
import { t, type CompanyDef, type EdgeDef, type KeyPointDef, type LoopDef } from "./capability-map-types";

const MEASURE = t("測る", "Measure");

export const EDGES: EdgeDef[] = [
  ...CHAIN_EDGES,
  {
    id: "e-hardware",
    from: "resources",
    to: "compute",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    chain: true,
    label: t("ハードウェア効率", "Hardware efficiency"),
    detail: {
      summary: t(
        "1 ドル・1 ワットあたりに得られる計算量。チップの世代、低精度化、メモリ、パッケージ、運用の効率で決まる。",
        "Compute per dollar and per watt, set by chip generation, lower precision, memory, packaging and how well the fleet is run.",
      ),
      note: t(
        "長期的には指数関数的に改善するが、新しい世代が出るたびに段階的に進む。H100 から Rubin までの 1 チップあたりの性能の伸びの多くは、微細化ではなく、ダイと電力を増やし、精度を下げ、メモリを積むことで得られた。ただし、電力を増やして得た分は、1 チップあたりの性能を上げても 1 ワットあたりの効率は上げない。世代交代が 1〜2 年で進むと、古いチップは減価償却が終わる前に経済的に古くなる。",
        "It improves exponentially over the long run, but in steps with each generation. Most of the per-chip performance gain from H100 to Rubin came not from smaller transistors but from more dies and power, lower precision and more memory — and the added power raises performance per chip, not per watt. With a new generation every one to two years, older chips become economically obsolete before they are fully depreciated.",
      ),
      refs: ["4.3:gains", "4.7:tokens", "3.5:depreciation"],
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
    chain: true,
    label: t("配分効率", "Allocation efficiency"),
    detail: {
      summary: t(
        "計算量を、事前学習、強化学習、推論、研究のための実験にどう振り分けるか。同じ計算量でも、配分によって得られる能力が変わる。",
        "How compute is split among pretraining, RL, inference and research experiments; the same compute buys different capability depending on the split.",
      ),
      note: t(
        "Toby Ord の分析では、AIME の正答率を 20% から 80% に上げるのに、推論時の計算なら約 100 倍の増加で済むが、強化学習の計算では約 1 万倍が必要になる（推定の幅は大きい）。2026 年上期の Anthropic は、研究開発費（大半はモデル開発、研究、社内利用のための計算資源費）が 97 億ドルで売上の 60%、顧客向けの推論が大半を占める売上原価が 23.8 億ドルで売上の 15% だった。",
        "Toby Ord estimates that raising AIME accuracy from 20% to 80% takes about 100x more inference compute but about 10,000x more RL compute (with wide uncertainty). In Anthropic's H1 2026, R&D — mostly compute for model development, research and internal use — was USD 9.7 billion, or 60% of revenue, while cost of revenue, mostly inference for customers, was USD 2.38 billion, or 15%.",
      ),
      refs: ["5.2:ord", "5.3:allocate", "2.2:rd"],
      links: [S.tobyOrd, S.testTimeCompute, S.s1],
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
    chain: true,
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
  { id: "e-model-harness", from: "model", to: "harness", fromSide: "bottom", toSide: "top", kind: "flow", chain: true },
  {
    id: "e-harness",
    from: "harness",
    to: "system",
    fromSide: "bottom",
    toSide: "top",
    kind: "flow",
    chain: true,
    label: t("ハーネス効率", "Harness efficiency"),
    detail: {
      summary: t(
        "同じモデルに、どれだけ多くの仕事を完了させられるか。道具、文脈の管理、検証の作り方で決まる。",
        "How much work the same model can be made to finish, set by its tools, context management and checks.",
      ),
      note: t(
        "Anthropic の調査用のマルチエージェントシステムでは、Claude Opus 4 が指揮して Claude Sonnet 4 のサブエージェントに分担させる構成が、Opus 4 単体より社内の評価で 90.2% 高い成績を出した。改善は学習し直さなくてもすでにあるモデルに効くが、伸び方を予測する法則はまだない。",
        "In Anthropic's multi-agent research system, a Claude Opus 4 lead agent directing Claude Sonnet 4 subagents outperformed a single Claude Opus 4 agent by 90.2% on its internal research evaluation. Improvements apply to existing models without retraining, but no law yet predicts how far they go.",
      ),
      refs: ["5.2:harness"],
      links: [S.anthropicMultiAgent, S.sweAgent, S.anthropicHarness],
    },
  },
  {
    id: "e-inference",
    from: "inference",
    to: "harness",
    fromSide: "right",
    toSide: "left",
    kind: "flow",
    chain: true,
    label: t("推論効率", "Inference efficiency"),
    detail: {
      summary: t(
        "1 トークンあたりの推論費（裏返せば、1 ワット・1 ドルあたりに出せるトークン）。KV キャッシュの圧縮、低精度化、MoE で下がる。",
        "Inference cost per token — equivalently, tokens per watt and per dollar — lowered by KV-cache compression, lower precision and MoE.",
      ),
      note: t(
        "長く考えさせ、サブエージェントで分担するほど、1 件あたりのトークンは増える。電力と HBM が上限を決めるなかでは、1 ワットあたりのトークンが、推論時計算を伸ばせる上限を決める。業界の対応は、KV キャッシュを小さくするモデル側の工夫（GQA、MLA）、プリフィルとデコードを別の GPU に割り当てる処理の分離（NVIDIA Dynamo）、KV キャッシュを GPU の外の階層に逃がすメモリ階層の拡張、SRAM を大量に積んだ推論専用チップ（Groq、Cerebras）の 4 つに分かれる。",
        "Longer thinking and more subagents mean more tokens per job. With power and HBM setting the ceiling, tokens per watt decide how far inference compute can grow. The industry has responded in four ways: model-side designs that shrink the KV cache (GQA, MLA), splitting prefill and decode onto different GPUs (NVIDIA Dynamo), offloading the KV cache to memory tiers outside the GPU, and inference chips packed with SRAM (Groq, Cerebras).",
      ),
      refs: ["4.4:kvCache", "4.4:responses", "5.3:hbm"],
      links: [S.memoryWall, S.deepseekV2, S.anthropicMultiAgent],
    },
  },
  {
    id: "e-context",
    from: "context-layer",
    to: "system",
    fromSide: "top",
    toSide: "bottom",
    kind: "flow",
    label: t("文脈の精度", "Context precision"),
    kicker: t("精度", "Precision"),
    detail: {
      summary: t(
        "必要な情報を漏らさず、余計な情報を入れずに持ち込めているか。持ち込みすぎると文脈が長くなって、モデルが必要な情報を取り出しにくくなり、推論費も増える。",
        "Whether what is needed is brought in, without gaps and without clutter. Bringing in too much makes the context longer, so the model has a harder time pulling out what it needs, and inference cost rises.",
      ),
      note: t(
        "Anthropic は 2025 年 9 月に、文脈のトークンが増えるほど、そこから情報を正確に取り出す力が落ちる（文脈の劣化）として、望む結果につながる情報の濃いトークンだけに絞り、文脈をできるだけ小さく保つよう勧めた。18 のモデルを調べた Chroma の研究（2025 年 7 月）でも、課題の難しさを変えずに入力だけを長くすると、どのモデルも成績が不安定になり、下がった。",
        "In September 2025, Anthropic noted that as the number of tokens in the context grows, a model's ability to recall information from them accurately declines (context rot), and advised choosing the smallest possible set of high-signal tokens that maximizes the likelihood of the desired outcome. Chroma's study of 18 models (July 2025) likewise found that lengthening only the input, with the task's difficulty held fixed, made every model perform worse and less consistently.",
      ),
      refs: ["5.2:contextRot", "5.2:context"],
      links: [S.contextEngineering, S.contextRot, S.lostInTheMiddle],
    },
  },
  { id: "e-system-uses", from: "system", to: "uses", fromSide: "right", toSide: "left", kind: "flow", chain: true },
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
    id: "loop-research",
    label: t("AI 研究の自動化", "Automating AI research"),
    cycle: ["ai-research", "e-algorithmic", "training", "model"],
    detail: {
      summary: t(
        "AI が次の AI の研究開発を手伝い、アルゴリズムの効率の伸びを速める可能性がある。Anthropic の S-1 はこれを「ループを閉じる」と呼ぶ。",
        "AI helps develop the next AI and may speed up algorithmic progress — what Anthropic's S-1 calls “closing the loop”.",
      ),
      note: t(
        "Anthropic によれば、2026 年 9 月には、エンジニア 1 人が 1 日に書き加えるコードの量が 2024 年平均の 45 倍を超えた。ただ、それが能力の伸びをどれだけ速めるかは測れないので、予測できる軸とは言えない。",
        "Anthropic says that by September 2026 the daily volume of code contributed per engineer was over 45 times the 2024 average. How much that speeds up capability gains cannot be measured, though, so it is not a predictable axis.",
      ),
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
        "Cursor takes 1.5–2 hours to roll a new checkpoint out to users and collect the data for the next training step.",
      ),
      links: [S.cursorRl],
    },
  },
  {
    id: "loop-synthetic",
    label: t("AI が自分でつくるデータ", "Data the AI makes itself"),
    cycle: ["system", "synthetic", "gradable", "e-data"],
    detail: {
      summary: t(
        "システムが課題を解いた記録や、モデルがつくった問題と答えを、次の学習の材料にする。採点できる課題なら、正しいものだけを選べる。",
        "Records of the system solving tasks, and problems and answers the models write, become material for the next round; for gradable tasks only the correct ones are kept.",
      ),
      note: t(
        "DeepSeek-R1 は、強化学習の途中のモデルに 1 問あたり複数の答えを出させて正しいものだけを残し（約 60 万件）、次の学習に使った。これを含む約 80 万件のデータで小さなモデルを学習させるだけでも、その推論の力は大きく上がった。",
        "DeepSeek-R1 sampled several answers per prompt from an RL checkpoint and kept only the correct ones (about 600,000) for the next round of training; simply fine-tuning smaller models on about 800,000 samples that include these substantially improved their reasoning.",
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
    refs: ["2.4", "6.4:openai", "2.3:openai", "6.2:market", "7.3:routing"],
    links: [S.wsj, S.decoderOpenAI, S.cnbcSpend, S.gpt5, S.o1, S.companyKnowledge, S.gpt6AstraWork],
    points: [
      t(
        "ChatGPT の週間利用者は 10 億人に達した（報道）が、1 人あたりの収益は小さい。2026 年 2 月に広告を試験導入した。",
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
      t(
        "社内の情報は、2025 年 10 月に ChatGPT に加えた company knowledge で、Slack、SharePoint、Google ドライブなどから探す。2026 年 9 月の GPT-6 Astra では、データを整えたり連携を作ったりしなくても、人が毎日使うアプリをそのまま操作して仕事を進められることを売りにしている。",
        "Searches company information in Slack, SharePoint, Google Drive and other tools through company knowledge in ChatGPT (October 2025); with GPT-6 Astra (September 2026) it pitches a model that works through the apps people use every day, without first preparing data or building integrations.",
      ),
    ],
  },
  {
    id: "co-anthropic",
    name: t("Anthropic", "Anthropic"),
    focus: ["harness", "software", "knowledge-work", "ai-research", "contracts", "external-capital"],
    refs: ["2.2:agents", "6.4:anthropic", "2.2:loop"],
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
        "2026 年上期に 1,100 億ドル超を調達した。S-1 で名前の挙がった計算資源の契約だけで、上限値を含めて 6,000 億ドルを超える。",
        "Raised more than USD 110 billion in H1 2026; the compute agreements named in its S-1 alone exceed USD 600 billion, including upper-bound amounts.",
      ),
    ],
  },
  {
    id: "co-google",
    name: t("Google", "Google"),
    focus: ["chips", "interconnect", "depth", "width", "grid", "external-capital"],
    refs: ["3.5", "4.1:flex"],
    links: [S.goog10q, S.ironwood, S.anthropicTpu, S.googleFlexible, S.cnbcCodeRed],
    points: [
      t(
        "自社の TPU を持ち、v7 では 9,216 チップを 1 つのポッドにまとめる。Anthropic には最大 100 万基の TPU を供給する。2025 年 8 月には、機械学習の負荷を対象にした需要応答の契約を 2 つの電力会社と結んだ。",
        "Has its own TPUs — a v7 pod joins 9,216 chips — and supplies up to a million TPUs to Anthropic. In August 2025 it signed demand-response agreements covering machine-learning workloads with two utilities.",
      ),
      t(
        "2025 年 11 月に Gemini 3 を出すと、OpenAI は 12 月に社内で「コードレッド」を宣言したと報じられた。Google は Deep Think で考える量を売る。",
        "After Gemini 3 (November 2025), OpenAI reportedly declared a “code red” internally in December. Google sells extra thinking through Deep Think.",
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
    focus: ["ocf", "contracts", "context-layer", "software", "knowledge-work"],
    refs: ["7.1:selfFunded", "7.2:coupled", "7.3", "7.3:iq"],
    links: [S.msft10k, S.msft10q, S.msftEarningsCall, S.openaiMicrosoft],
    points: [
      t(
        "2026 会計年度の営業キャッシュフローは 1,829 億ドルで、設備投資 1,159 億ドルを賄っても FCF が 670 億ドル残った。開始前のリースは 3 年で 826 億ドルから 3,646 億ドルに増え、建てるだけでなく借りても計算資源を確保している。",
        "Operating cash flow of USD 182.9 billion in fiscal 2026 covered USD 115.9 billion of capex and still left USD 67 billion of FCF. Leases not yet commenced grew from USD 82.6 billion to USD 364.6 billion in three years: it rents compute as well as building it.",
      ),
      t(
        "OpenAI から計上した売上は 2026 年 7〜9 月期に 100 億ドル（全社売上の約 11%）で、商用 RPO の少なくとも約 3 分の 1 が OpenAI 関連である（2026 年 6 月末）。Microsoft Cloud の粗利率は 3 年で 73% から 66% に下がった。",
        "OpenAI accounted for USD 10.0 billion of revenue in July–September 2026 (about 11% of the total) and at least about a third of commercial RPO (end of June 2026). Microsoft Cloud's gross margin fell from 73% to 66% over three years.",
      ),
      t(
        "モデルの外側では、Microsoft 365 と Fabric にある企業の文脈に、組織の文書と Web の情報を加えて Microsoft IQ にまとめ、他社のモデルで動くエージェントにも提供する。Microsoft IQ で文脈を利用する顧客は 6 万近くで、前四半期から 25% 増えた（2026 年 10 月の決算説明）。",
        "Beyond the model, it bundles the enterprise context held in Microsoft 365 and Fabric, plus organizational documents and the web, into Microsoft IQ and offers it to agents running on other companies' models too; nearly 60,000 customers access context through Microsoft IQ, up 25% from the previous quarter (October 2026 earnings call).",
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
        "AWS と OpenAI の契約は 1,380 億ドルに拡大した。Amazon の受注残（主に AWS）は約 5,780 億ドルある。",
        "The AWS–OpenAI agreement has grown to USD 138 billion; Amazon's backlog (mainly AWS) is about USD 578 billion.",
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
        "ルイジアナ州のデータセンターを、Blue Owl との特別目的会社が負う約 270 億ドルの負債で賄った（報道）。",
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
        "メンフィスの Colossus 2 は H100 換算で約 111 万基の規模で、2026 年 11 月時点で最大の計算資源を持つサイトである（Epoch AI）。",
        "Colossus 2 in Memphis, at about 1.11 million H100 equivalents, is the largest compute site as of November 2026 (Epoch AI).",
      ),
      t(
        "Grok 4 で、強化学習を事前学習と同じ規模で行ったと発表した（2025 年 7 月）。複数の仮説を並列に検討させる Grok 4 Heavy も売る。",
        "Said it ran RL for Grok 4 at pretraining scale (July 2025); it also sells Grok 4 Heavy, which weighs several hypotheses in parallel.",
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
        "DeepSeek-R1 used RLVR to reproduce o1's results cheaply. According to NIST's CAISI, DeepSeek V4 Pro trails the U.S. frontier by about eight months.",
      ),
    ],
  },
];

export const KEY_POINTS: KeyPointDef[] = [
  {
    id: "kp-chain",
    title: t("FCF が次の調達の条件を決める", "FCF sets the terms of the next raise"),
    body: t(
      "仕事を完了する能力が売上に変わり、そこから推論費、学習・研究費、設備投資などを順に引いた残りが FCF になる。次の巨額の資本を集めるには、このチェーンが回ることを、箱に添えた問いに数字で答えて示す必要がある（第 6.3 節）。Anthropic の計算資源 1 ドルあたりの売上は、2023 年の 0.09 から 2026 年上期の 1.82 に上がった。",
      "Getting work done turns into revenue; subtract inference cost, then training and research, then capex and the rest, and what is left is FCF. To raise the next round, a lab has to answer the questions under the boxes with numbers, showing that this chain turns (Section 6.3). Anthropic's revenue per dollar of compute rose from 0.09 in 2023 to 1.82 in H1 2026.",
    ),
    ids: [
      "capital",
      "revenue",
      "gross-profit",
      "operating-profit",
      "fcf",
      "uses",
      "resources",
      "system",
      "training",
      "inference",
      "chain-capital",
      "chain-revenue",
      "chain-gross",
      "chain-operating",
      "chain-fcf",
      "chain-next",
    ],
    refs: ["6.3:revenuePerCompute", "6.2:market"],
  },
  {
    id: "kp-two-capabilities",
    title: t("能力には 2 種類ある", "There are two kinds of capability"),
    body: t(
      "モデル単体の能力と、モデルにハーネス、推論計算、推論時の文脈を組み合わせたシステムが仕事を完了する能力は別のものである。売上につながるのは後者で、METR のタイムホライズンや RLI も後者を測っている（ただし、必要な情報は課題と一緒に渡される）。ECI のような総合指数には両方が混ざる。",
      "What the model can do alone differs from what the model, harness, inference compute and the context brought in at inference time get done together. Revenue follows the latter, which is what METR's time horizon and RLI measure (though they hand the agent the information it needs along with the task); composite indices such as ECI mix the two.",
    ),
    ids: ["model", "harness", "system", "e-model-harness", "e-harness", "measure-model", "measure-system", "m-model", "m-system", "eci", "uses", "chain-revenue", "revenue"],
    refs: ["5.2:twoKinds", "5.3:target"],
  },
  {
    id: "kp-context",
    title: t("文脈は推論のたびに持ち込む", "Context is brought in at every inference"),
    body: t(
      "社内の文書や昨日の決定は、モデルの重みにはない。推論のたびに、正しい文脈を、権限を守って、必要な分だけ持ち込めるかどうかで、同じモデルとハーネスでも完了できる仕事が変わる。この文脈を探して渡す層を、Microsoft は Microsoft IQ と呼び、他社のモデルで動くエージェントからも使えるようにしている。",
      "Company documents and yesterday's decisions are not in a model's weights. Whether the right context can be brought in at each inference, within the user's permissions and no more than is needed, decides how much work the same model and harness can finish. The layer that finds and hands over this context is what Microsoft calls Microsoft IQ, and agents running on other companies' models can use it too.",
    ),
    ids: ["context-layer", "e-context", "system", "context-mgmt"],
    refs: ["5.2:context", "7.3:iq"],
  },
  {
    id: "kp-predictable",
    title: t("予測しやすいレバー", "The predictable levers"),
    body: t(
      "課題の範囲を決めれば、強化学習による伸びは上限に向かう S 字を描き、推論時計算による伸びは使う計算量の対数に比例する。範囲を広げ続けられるかどうかは、採点できる課題と環境の数で決まる。",
      "Within a fixed range of tasks, gains from RL follow an S-curve towards a ceiling, and gains from inference compute grow with the logarithm of the compute spent. How far that range can keep widening depends on how many gradable tasks and environments exist.",
    ),
    ids: ["rlvr", "agentic-rl", "inference", "gradable", "e-allocation"],
    refs: ["5.3:answer"],
  },
  {
    id: "kp-pretraining",
    title: t("事前学習の費用は早く回収する必要がある", "Pretraining has to pay back fast"),
    body: t(
      "事前学習の費用は前払いで、モデルが売れる期間のうちに回収するしかない。米国の各社が数か月単位で首位を入れ替え、中国で最も強いオープンウェイトモデルも約 8 か月遅れで追いかけてくる（NIST の評価）なかで、その期間は長くない。強化学習の費用も前払いなので、同じ制約を受ける。",
      "Pretraining is paid for up front and must be recovered while the model sells — a short window when U.S. labs trade the lead every few months and even the strongest Chinese open-weight model trails by only about eight months (per NIST). RL is paid for up front too, so it faces the same constraint.",
    ),
    ids: ["pretraining", "human-data", "compute", "external-capital", "chain-operating", "operating-profit"],
    refs: ["3.1", "5.3:recover", "6.3:training", "5.2:upfront"],
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
      "能力の側の矢印に書いた効率と精度を上げれば、同じ電力でより多くの仕事を完了できる。電力を増やせないときの伸びしろは、ここにある。",
      "Raising the efficiencies and the precision on the capability arrows gets more work done from the same power — the room left to grow when power cannot be added.",
    ),
    ids: ["e-hardware", "e-allocation", "e-parameter", "e-data", "e-algorithmic", "e-inference", "e-harness", "e-context"],
    refs: ["4.7:tokens"],
  },
];
