/**
 * Article sections the map points to, with sentences quoted verbatim from
 * the article (tests check they appear in both language versions). A ref of
 * "4.6" shows the section's first point; "4.6:tts" shows a specific one.
 */
import { t, type Text } from "./capability-map-types";

export type SectionDef = { title: Text; points: Record<string, Text> };

export const SECTIONS: Record<string, SectionDef> = {
  "2.1": {
    title: t("チェーンを 10 の環に分ける", "Ten links in the chain"),
    points: {
      link4: t("モデル能力: 学習で上がる、モデル単体の能力。", "Model capability: the capability the model itself gains from training."),
    },
  },
  "2.2": {
    title: t("各環で何が変わったか —— Anthropic の S-1 を中心に", "What changed at each link — centred on Anthropic's S-1"),
    points: {
      finance: t(
        "チェーンの後半が黒字になった直後に、環 2（計算資源の確保）の資金の出し方が「費用」から「投資と負債」へ変わる。",
        "Just as the back half of the chain turned profitable, the way link 2 (securing compute) is financed is shifting from expense to investment and debt.",
      ),
      contracts: t(
        "施設と中身の契約を切り離して、拘束の強さを調整する工夫である。",
        "Separating the contract for the building from the contract for what goes inside lets it adjust how binding its commitments are.",
      ),
      loop: t(
        "S-1 で目を引くのは、「各世代の Claude が次の世代の開発を助ける」という主張で、Anthropic はこれを「closing the loop（ループを閉じる）」と呼ぶ。",
        "What stands out in the S-1 is the claim that each generation of Claude helps build the next, which Anthropic calls \"closing the loop\".",
      ),
      agents: t(
        "エージェント化は、利用者 1 人あたりの支出と計算資源の需要を大きく押し上げる",
        "Agentic use sharply raises spending and compute demand per user.",
      ),
      margin: t(
        "85% は構造的な水準というより、供給制約と先行契約が生んだ一時的に高い水準と見るべき",
        "The 85% should be read less as a structural level than as a temporarily high level produced by supply constraints and advance contracting.",
      ),
      cowork: t(
        "けん引役はコーディングエージェントの Claude Code と、その仕組みを知識労働に広げた Claude Cowork だ。",
        "The drivers are the coding agent Claude Code and Claude Cowork, which extends the same mechanism to knowledge work.",
      ),
    },
  },
  "2.3": {
    title: t(
      "支払いと売上の時期のずれ —— 支払い義務が売上より何年も先行する",
      "The timing gap between payments and revenue — obligations arrive years before revenue",
    ),
    points: {
      timing: t("支払い義務は 5〜20 年、売上は月単位から数年単位", "payment obligations run 5–20 years, while revenue runs from months to a few years."),
      openai: t(
        "WSJ が報じた OpenAI の調達難は、この連鎖の入口に負担が表れた例と読める。",
        "OpenAI's fundraising difficulty reported by the WSJ can be read as strain showing up at the entrance of the chain.",
      ),
    },
  },
  "3.1": {
    title: t("競争 —— 1 社の独走から、短いリードの奪い合いへ", "Competition — from one runaway leader to fights over short leads"),
    points: {
      window: t(
        "フロンティアにいる期間が短くなるほど、1 つのモデルの学習費を回収できる期間も短くなる。",
        "The shorter the time a model stays at the frontier, the shorter the window for recovering its training cost.",
      ),
      caisi: t(
        "米国立標準技術研究所（NIST）の AI 標準・イノベーションセンター（CAISI）が 2026 年 5 月に公表した評価によれば、中国で最も強いオープンウェイトモデルの DeepSeek V4 Pro でも、米国のフロンティアから約 8 か月遅れている。",
        "Even the strongest Chinese open-weight model, DeepSeek V4 Pro, sits about eight months behind the U.S. frontier, according to an assessment published in May 2026 by NIST's Center for AI Standards and Innovation (CAISI).",
      ),
    },
  },
  "3.2": {
    title: t("価格 —— 同じ能力は安く、最先端は高く", "Prices — the same capability gets cheaper, the frontier gets more expensive"),
    points: {
      volume: t(
        "1 タスクあたりのコストを下げると、任される仕事の量がそれ以上に増えた",
        "lowering the cost per task appears to have increased the volume of delegated work by even more.",
      ),
      distill: t(
        "フロンティアの能力を売ることは、その能力を複製する材料を売ることでもある",
        "Selling frontier capability also means selling the material to replicate it",
      ),
    },
  },
  "3.3": {
    title: t("需要 —— 「利用者数」から「任せる仕事の量」へ", "Demand — from user counts to delegated work"),
    points: {
      unit: t(
        "需要の単位が「利用者数」から「任せる仕事の量」に変わった",
        "The unit of demand has shifted from \"number of users\" to \"amount of work delegated\"",
      ),
    },
  },
  "3.5": {
    title: t("資本市場 —— 自己資金の時代の終わり", "Capital markets — the end of self-funding"),
    points: {
      selfFunding: t(
        "AI の計算資源を供給する側も、自社の営業キャッシュフローだけでは投資を賄いきれなくなりつつある。",
        "Even the suppliers of AI compute are finding it increasingly hard to fund their investment from operating cash flow alone.",
      ),
    },
  },
  "4.1": {
    title: t("電力とデータセンター —— 「数十 MW」から「GW」へ", "Power and data centres — from \"tens of MW\" to \"GW\""),
    points: {
      ceiling: t(
        "2023 年には「チップを作る速さ」が上限だったが、2026 年には「GW 単位の電源を建て、送電網につなぎ、許認可を得る速さ」が上限になった。",
        "In 2023 the ceiling was how fast chips could be made; in 2026 it is how fast gigawatt-scale power plants can be built, connected to the grid and permitted.",
      ),
      cooling: t(
        "この水準では、ラック内の配電を 800 V の直流に切り替え、液冷を標準にするしかない。",
        "At these levels, power distribution in the rack has to move to 800 V DC and liquid cooling has to become standard.",
      ),
    },
  },
  "4.2": {
    title: t("低精度化 —— FP32 から FP4 へ、そして収穫逓減", "Low precision — from FP32 to FP4, and diminishing returns"),
    points: {
      returns: t(
        "低精度化は 2023〜2026 年の性能向上を支えた大きな要因だったが、2030 年に向けて、これだけで稼げる倍率は小さくなる。",
        "Low precision was a major driver of performance gains in 2023–2026, but heading toward 2030, the multiplier it can deliver on its own will shrink.",
      ),
      fp8: t(
        "学習の主力は FP8（と MXFP8）、推論の主力は FP4",
        "FP8 (and MXFP8) as the workhorse for training, FP4 as the workhorse for inference.",
      ),
      llama4: t(
        "Meta も 2025 年 4 月、Llama 4 の最大のモデル（Behemoth）を 3.2 万基の GPU を使って FP8 で事前学習し、GPU 1 基あたり 390 TFLOPS を出したと公表した。",
        "Meta likewise reported in April 2025 that it pretrained its largest Llama 4 model (Behemoth) in FP8 on 32,000 GPUs, achieving 390 TFLOPS per GPU.",
      ),
    },
  },
  "4.3": {
    title: t("半導体プロセス —— 微細化より「シリコンを増やす」", "Process nodes — more silicon rather than smaller transistors"),
    points: {
      gains: t(
        "3 年間の性能向上の多くは、微細化ではなく、ダイを増やし、電力を増やし、精度を下げ、メモリを積むことで得られた。",
        "Much of the past three years' performance gain came not from shrinking transistors but from adding dies, adding power, lowering precision and adding memory.",
      ),
      next: t(
        "プロセスは今後も前進するが、2030 年までの性能向上の主役は、パッケージ（ダイと HBM をいくつ 1 つにまとめられるか）と電力に移る。",
        "Process nodes will keep advancing, but through 2030 the main source of performance gains shifts to packaging — how many dies and HBM stacks can be combined into one — and to power.",
      ),
    },
  },
  "4.4": {
    title: t("メモリ（HBM）—— 「メモリの壁」と争奪戦", "Memory (HBM) — the memory wall and the scramble for supply"),
    points: {
      soldOut: t(
        "HBM は、2023 年には「1 社しかまともに作れない部品」だったが、2026 年には「どのメーカーでも売り切れの部品」になった。",
        "HBM went from \"a part that only one company could make properly\" in 2023 to \"a part sold out at every supplier\" in 2026.",
      ),
      kvCache: t(
        "第 5 章で扱う推論時計算や、エージェントの長い文脈は、KV キャッシュ（過去のトークンの中間状態）を膨らませ、この壁をさらに高くする。",
        "Inference-time compute (discussed in Chapter 5) and long agent contexts swell the KV cache (the intermediate state for past tokens), raising the wall further.",
      ),
    },
  },
  "4.5": {
    title: t("先端パッケージ —— 何枚のダイを 1 つにまとめられるか", "Advanced packaging — how many dies can be combined into one"),
    points: {
      bottleneck: t(
        "確かなのは、ボトルネックが 1 か所にとどまらず、1 つを解消すると次の場所へ移っていくことである。",
        "What is certain is that the bottleneck does not stay in one place: resolve one, and it moves to the next.",
      ),
      interconnect: t("パッケージの外でも、相互接続の単位が大きくなった。", "Beyond the package, the unit of interconnection grew as well."),
    },
  },
  "4.6": {
    title: t(
      "モデルアーキテクチャ —— 密から疎へ、即答から「考える」推論へ",
      "Model architecture — from dense to sparse, from instant answers to \"thinking\" inference",
    ),
    points: {
      moe: t("MoE がオープンウェイトでも標準になり、スパース化が進み続けた。", "MoE became the norm among open-weight models too, and sparsity kept rising."),
      shape: t(
        "モデルの形が計算機の形を決め、計算機の形がモデルの形を決める",
        "The shape of the model determines the shape of the machine, and the shape of the machine determines the shape of the model",
      ),
      tts: t(
        "推論時に計算を使う「テスト時スケーリング」が、事前学習と並ぶ第 2 の軸になった。",
        "\"test-time scaling\" — using compute at inference time — became a second axis alongside pretraining.",
      ),
      monitor: t(
        "効率を上げる設計と、監視しやすさを保つ設計がぶつかる場面が、2030 年に向けて増えていく。",
        "Situations in which designs that raise efficiency collide with designs that keep models monitorable will become more frequent heading toward 2030.",
      ),
      o1: t(
        "数学コンテスト AIME 2024 の正答率は、GPT-4o の 12% から、o1 の 1 回の回答で 74%、64 回の多数決で 83%、1,000 個の候補を学習済みの採点関数で順位づけすると 93% になった。",
        "Accuracy on the AIME 2024 math competition went from GPT-4o's 12% to 74% for a single o1 answer, 83% with majority voting over 64 samples, and 93% when re-ranking 1,000 samples with a learned scoring function.",
      ),
      rlvr: t(
        "2025 年 1 月の DeepSeek-R1 は、数学やプログラミングのように正誤を機械的に判定できる課題の報酬で強化学習を行う RLVR（Reinforcement Learning with Verifiable Rewards）と、価値関数のモデルを使わない GRPO という手法で、同じことを安く再現した。",
        "DeepSeek-R1 in January 2025 reproduced this cheaply with RLVR (reinforcement learning with verifiable rewards) on tasks whose correctness can be checked automatically, such as math and programming, and GRPO, a method that does not use a value model.",
      ),
    },
  },
  "4.7": {
    title: t("制約の重心はどこへ動いたか", "Where has the centre of gravity of the constraints moved?"),
    points: {
      outside: t("制約の重心が「チップの中」から「チップの外」へ移った。", "The centre of gravity of the constraints moved from inside the chip to outside it."),
      tokens: t(
        "物理的な制約が強まるほど、「同じ電力と同じ HBM から、どれだけ多くの売れるトークンを出せるか」が競争の軸になる。",
        "The tighter the physical constraints, the more the unit of competition becomes \"how many sellable tokens can be produced from the same power and the same HBM\".",
      ),
    },
  },
  "5.1": {
    title: t("3 年前の答え", "The answer three years ago"),
    points: {
      powerLaw: t(
        "事前学習の計算量（とパラメータ数とデータ量）を増やせば、損失はべき乗則に従って下がり、能力も上がる。",
        "Increase pretraining compute (along with parameters and data), and loss falls along a power law and capability rises.",
      ),
    },
  },
  "5.2": {
    title: t(
      "いまの候補を「予測しやすさ」と「お金の流れ」で比べる",
      "Comparing today's candidates by predictability and by where the money flows",
    ),
    points: {
      twoKinds: t(
        "モデル単体の能力と、モデルにハーネスと推論計算を組み合わせたシステムが仕事を完了する能力は、分けて考える必要がある。",
        "What a model can do on its own and what a system of model, harness and inference compute gets done need to be considered separately.",
      ),
      axes: t("2026 年には、スケールできる軸が増えた。", "In 2026 there are more axes that can be scaled."),
      slowing: t(
        "推計の幅は大きいが、事前学習の規模拡大が鈍ってきた兆しとも読める。",
        "The estimate is uncertain, but it can be read as a sign that pretraining scale-up is slowing.",
      ),
      loss: t("損失の面では、事前学習は今も最も予測しやすい軸である。", "In terms of loss, pretraining is still the most predictable axis."),
      benchmarks: t(
        "「創発的な能力」の多くは評価指標の不連続さが生んだ見かけだとする研究（Schaeffer ら、2023 年）があり、ベンチマークも次々に飽和しては新しいものに置き換えられている。",
        "There is research (Schaeffer et al., 2023) arguing that many \"emergent abilities\" are artifacts of discontinuous metrics, and benchmarks saturate one after another and keep being replaced by new ones.",
      ),
      data: t(
        "データには限りがあり、モデルの汎化は人間よりはるかに劣る、というのが理由である。",
        "because data is finite and models generalize far worse than people.",
      ),
      rl: t("課題の範囲を決めれば予測できるが、範囲の中では飽和する", "predictable once the task domain is fixed, but saturates within that domain"),
      ord: t(
        "Ord が OpenAI の公表したグラフから読み取ったところでは、AIME の正答率を 20% から 80% に上げるのに、推論時の計算なら約 100 倍の増加で済むが、強化学習の計算では約 1 万倍が必要になる（推定の幅は大きい）。",
        "By Ord's reading of OpenAI's published charts, raising AIME accuracy from 20% to 80% takes about a 100x increase in inference compute, but about 10,000x more RL compute (with wide uncertainty).",
      ),
      price: t(
        "同じ能力は急速に安くなり、最先端の能力はむしろ高くなっている。",
        "The same capability gets cheap fast, while frontier capability actually gets more expensive.",
      ),
      harness: t("同じモデルでも、ハーネスによって成績は大きく変わる。", "With the same model, results vary widely depending on the harness."),
      longRun: t(
        "Anthropic の 2025 年 11 月の報告によれば、Opus 4.5 のようなフロンティアモデルでも、大まかな指示だけで何セッションにもわたって Web アプリを開発させると、本番に使える水準までは仕上げられない。",
        "In November 2025, Anthropic reported that when even a frontier model such as Opus 4.5 is given only a high-level prompt and asked to build a web app over many sessions, it falls short of production quality",
      ),
      tokens: t(
        "ただし、道具を何度も使い、作業を分担するハーネスほど、1 件の仕事で使うトークンは増える。",
        "But the more a harness uses tools and splits work among agents, the more tokens each job uses",
      ),
      outrun: t("能力の伸びが、測る道具の限界を超えてしまった", "Capability growth has, in a sense, outrun the limits of the measuring tool."),
      rli: t(
        "それでも、8 割近くの仕事は発注者が受け入れる水準に届いていない。",
        "Even so, nearly 80% of the projects still fall short of what a client would accept.",
      ),
      upfront: t(
        "1 つはモデルの能力を上げるレバー（事前学習、強化学習、アルゴリズムの効率）で、費用は学習費や研究費として前払いで出る。",
        "One set raises the model's capability (pretraining, reinforcement learning, algorithmic efficiency), and its cost is paid up front, as training and research cost.",
      ),
      perUse: t(
        "もう 1 つはモデルを仕事に使う側のレバー（推論時計算とハーネス）で、費用は主に、使うたびに推論費として出る。",
        "The other set puts the model to work (inference-time compute and the harness), and its cost arrives mainly with each use, as inference cost.",
      ),
      perToken: t(
        "顧客がトークン単位で払う限り、考える量を増やすことは、売上を増やすことでもある。",
        "As long as customers pay per token, more thinking also means more revenue.",
      ),
      handoff: t(
        "Anthropic は、最初のセッションで環境を整えるエージェントと、少しずつ進めて進捗を書き残すエージェントに分けることで、これに対処している。",
        "it addressed this by splitting the work between an agent that sets up the environment in the first session and one that makes incremental progress and records it.",
      ),
      mixed: t(
        "売上に直接つながるのは仕事を完了する側だが、その指標（METR のタイムホライズンや RLI）には、モデルの改善と、ハーネスや推論計算の改善が混ざっている。",
        "Revenue follows the side that gets work done, but its measures (METR's time horizon, RLI) mix improvements in the model with improvements in the harness and inference compute.",
      ),
      metrSystem: t(
        "つまりタイムホライズンは、モデル単体ではなく、仕事を完了するシステムの能力の指標である。",
        "so the time horizon tracks what a system gets done, not what the model can do alone.",
      ),
    },
  },
  "5.3": {
    title: t("本稿の答え", "This article's answer"),
    points: {
      answer: t(
        "次にスケールすべきは、「正誤を判定できる仕事の範囲」と「その仕事 1 件に使える推論計算」であり、それを支える「1 ドル・1 ワットあたりの実効計算量」である。",
        "What should be scaled next is \"the range of work whose correctness can be judged\" and \"the inference compute available per unit of that work\", supported by \"effective compute per dollar and per watt\".",
      ),
      target: t(
        "ここで伸ばしたい能力は、モデル単体の能力ではなく、仕事を完了するシステムの能力である。",
        "The capability to grow here is not the model's capability on its own but a system's ability to get work done.",
      ),
      coding: t(
        "コーディングのように正誤を判定しやすい領域で、最初にエージェントが売上を生んだのは偶然ではない",
        "It is no accident that agents first generated revenue in coding, where correctness is easy to judge",
      ),
      hbm: t(
        "長い思考の連鎖を生成する推論は、HBM の帯域の制約を最も強く受ける使い方でもある（第 4.4 節）。",
        "inference that generates long chains of thought is also the workload most exposed to the HBM bandwidth limit (Section 4.4).",
      ),
      hardToJudge: t(
        "正誤を判定しにくい仕事（長い文書の質、経営判断、研究の方向づけ）には、同じやり方がそのままでは効かない。",
        "the same approach does not work as-is for work whose correctness is hard to judge (the quality of long documents, business judgment, setting research direction).",
      ),
      loop: t(
        "Anthropic の S-1 が「ループを閉じる」と呼ぶ、AI が次の AI の開発を加速する効果は、アルゴリズムの効率の伸び（同じ性能に必要な計算量が約 8 か月で半分）を速める可能性があるが、予測できる軸とは言えない。",
        "the effect Anthropic's S-1 calls \"closing the loop\" — AI accelerating the development of the next AI — may speed up algorithmic efficiency gains (the compute needed for a given performance halving about every 8 months), but it cannot be called a predictable axis.",
      ),
      allocate: t(
        "予測できる部分に資本を集め、予測できない部分は研究として小さく試す",
        "Concentrating capital on the predictable parts and testing the unpredictable parts on a small scale as research",
      ),
      recover: t(
        "事前学習の費用は、モデルが売れる期間をかけて後から回収しなければならない。",
        "the cost of pretraining has to be recovered afterwards, over the period in which the model sells.",
      ),
    },
  },
  "6.2": {
    title: t("何が変わったのか", "What changed"),
    points: {
      lenders: t(
        "大口の出し手は 3 種類に分かれ、それぞれ求める証拠が違う。",
        "Large providers of capital now fall into three groups, each asking for different evidence.",
      ),
      market: t(
        "市場はもはや成長率の高さではなく、成長率の変化とユニットエコノミクスを見ている。",
        "The market is no longer looking at how high the growth rate is, but at how it is changing and at unit economics.",
      ),
    },
  },
  "6.3": {
    title: t("示すべき 5 つのこと", "Five things to show"),
    points: {
      revenuePerCompute: t(
        "(1) 計算資源 1 ドルあたりの売上が 1 を超え、改善し続けていること。",
        "(1) Revenue per dollar of compute exceeds 1 and keeps improving.",
      ),
      margin: t(
        "(2) 推論の粗利が、価格競争とオープンウェイトモデルの追い上げの下でも残ること。",
        "(2) Gross margin on inference survives price competition and the catch-up of open-weight models.",
      ),
      training: t("(5) 学習への投資が回収できていること。", "(5) Investment in training is being recovered."),
    },
  },
  "7.1": {
    title: t("Microsoft のチェーン", "Microsoft's chain"),
    points: {
      selfFunded: t("環 1（資本）を外部に頼っていない。", "it does not rely on outside capital at link 1."),
      leases: t(
        "リースという形で、将来の営業キャッシュフローを当てにして資本を先に使っている",
        "through leases, it is spending capital in advance, counting on future operating cash flow.",
      ),
    },
  },
};
