import { item, sub, t, type GroupDef } from "./capability-map-types";

export const MEASURES: GroupDef = {
  kind: "group",
  id: "measures",
  category: "measure",
  layout: "column",
  label: t("成果の測り方", "Measuring results"),
  detail: {
    summary: t(
      "能力を何で測るか。モデル単体を測る指標と、仕事の完了を測る指標は分けて読む必要があり、総合指数には両方が混ざる。",
      "How capability is measured. Metrics for the model alone and metrics for getting work done need to be read separately, and composite indices mix the two.",
    ),
    refs: ["5.2"],
  },
  children: [
    sub(
      "measure-model",
      t("モデル単体", "The model alone"),
      {
        summary: t(
          "道具やハーネスを使わずに、モデルそのものの力を測る。",
          "Measures of the model itself, taken without tools or a harness.",
        ),
      },
      [
        item("loss", t("事前学習の損失", "Pretraining loss"), {
          summary: t(
            "学習に使っていない文章で、次の単語をどれだけ当てられるか。事前学習の進み具合を最も直接に表す。",
            "How well the model predicts the next token on text it was not trained on — the most direct gauge of pretraining progress.",
          ),
          note: t(
            "損失の下がり方はべき乗則で予測しやすいが、それがどの能力として現れるかは読みにくい。",
            "How loss falls is predictable from power laws, but which capabilities a lower loss turns into is hard to read.",
          ),
          refs: ["5.1", "5.2"],
        }),
        item("benchmarks", t("ベンチマーク", "Benchmarks"), {
          summary: t(
            "道具を使わずに、決まった問題を解かせて採点する（GPQA Diamond や AIME など）。",
            "Scoring the model on fixed problems without tools (GPQA Diamond, AIME and the like).",
          ),
          note: t(
            "点数は考える量の設定でも変わるので、モデルどうしを比べるときは設定をそろえる必要がある。しかも次々に飽和しては、新しいものに置き換えられている。",
            "Scores also move with the thinking-effort setting, so comparisons need matched settings; and benchmarks keep saturating and being replaced.",
          ),
          refs: ["5.2"],
        }),
      ],
    ),
    sub(
      "measure-system",
      t("仕事の完了", "Getting work done"),
      {
        summary: t(
          "モデルとハーネスを組み合わせたシステムが、任された仕事を完了できるか。",
          "Whether a model and its harness, working together, can complete the job they are given.",
        ),
        refs: ["5.2"],
      },
      [
        item("metr", t("METR のタイムホライズン", "METR time horizon"), {
          summary: t(
            "AI が 50% の確率で完了できる作業の長さを、熟練した人間の所要時間で測る。2023 年以降は約 4 か月ごとに 2 倍になってきた。",
            "The length of tasks, in skilled-human time, that AI completes with 50% probability; since 2023 it has doubled about every four months.",
          ),
          note: t(
            "道具を与えて作業のループを回す仕組み（スキャフォールド）にモデルを組み込んで測り、仕組みはモデルごとに選ぶ。16 時間を超える値は今の課題セットでは信頼できない。METR が測定値を追加したのは 2026 年 5 月が最後で、9 月には公開ページをもう更新しないと明記した。",
            "Measured with the model inside a scaffold that provides tools and runs the loop, chosen for each model. Values above 16 hours are unreliable on the current task set; METR's last new measurement was in May 2026, and in September it stated that its time-horizons page is no longer actively updated.",
          ),
          refs: ["5.2"],
          links: [{ ja: "METR: Time Horizons", en: "METR: Time Horizons", href: "https://metr.org/time-horizons/" }],
        }),
        item("gdpval", t("実務の評価（GDPval）", "Real work (GDPval)"), {
          summary: t(
            "OpenAI の評価。米国の GDP への寄与が大きい 9 業種の 44 職種について、実際の仕事の成果物をもとにした課題で、専門家の成果物と比べる。",
            "OpenAI's evaluation: tasks built from real work products in 44 occupations across the nine industries that contribute most to US GDP, compared with experts' work.",
          ),
          note: t(
            "初版は 1 回の指示で成果物を出させる評価で、やり取りを重ねて文脈を集めたり、何度も手直ししたりして仕上げる仕事は含まない。",
            "The first version is one-shot: it does not cover work that requires building up context or improving through several drafts.",
          ),
          links: [{ ja: "OpenAI: GDPval", en: "OpenAI: GDPval", href: "https://openai.com/index/gdpval/" }],
        }),
        item("rli", t("自動化率（RLI）", "Automation rate (RLI)"), {
          summary: t(
            "Scale AI と CAIS の Remote Labor Index。実際に外注された 240 件の仕事（23 分野）のうち、発注者が受け入れる水準を満たして完了できた割合を測る。",
            "Scale AI and CAIS's Remote Labor Index: the share of 240 real freelance projects (23 domains) completed to a standard the client would accept.",
          ),
          note: t(
            "公開時（2025 年 10 月）の最高は Manus の 2.5% だった。2026 年 11 月時点の公式のリーダーボードでは、Claude Opus 5.5 を使ったエージェントの 21.25% が最高である。",
            "At launch (October 2025) the best agent, Manus, managed 2.5%; on the official leaderboard as of November 2026, an agent built on Claude Opus 5.5 leads at 21.25%.",
          ),
          refs: ["5.2"],
          links: [
            { ja: "Scale AI: Remote Labor Index", en: "Scale AI: Remote Labor Index", href: "https://scale.com/blog/rli" },
            { ja: "RLI のリーダーボード", en: "RLI leaderboard", href: "https://labs.scale.com/leaderboard/rli" },
          ],
        }),
        item("arc-agi-3", t("ARC-AGI-3", "ARC-AGI-3"), {
          summary: t(
            "初めて見るゲームの環境を探り、目的を見つけ、学びながら解けるかを測る対話型のベンチマーク。人間と同じ効率ですべてのゲームを解けば 100% になる。",
            "An interactive benchmark: can an agent explore unfamiliar game environments, work out the goal and learn as it goes? Beating every game as efficiently as humans scores 100%.",
          ),
          note: t(
            "仕事の成果ではなく、初めての環境で学ぶ効率を測る点で、ほかの 3 つとは性格が違う。",
            "Unlike the other three, it measures how efficiently an agent learns in unfamiliar environments rather than work output.",
          ),
          links: [{ ja: "ARC Prize: ARC-AGI-3", en: "ARC Prize: ARC-AGI-3", href: "https://arcprize.org/arc-agi/3" }],
        }),
      ],
    ),
    item("eci", t("総合指数（ECI）", "Capabilities index (ECI)"), {
      summary: t(
        "Epoch AI の Epoch Capabilities Index。50 を超えるベンチマークの結果を 1 つの尺度にまとめ、難しいベンチマークでよい成績を出したモデルほど高くなる。",
        "Epoch AI's Epoch Capabilities Index combines more than 50 benchmarks into one scale; doing well on harder benchmarks scores higher.",
      ),
      note: t(
        "道具を使わない問題集だけでなく、Terminal-Bench 2.0 や OSWorld のようなエージェント型の評価、METR のタイムホライズン、GDPval、RLI も取り込み、考える量などの設定のうち最も高い点数を採る。モデル単体と仕事の完了の両方が混ざった指標である。",
        "Besides tool-free problem sets, it takes in agentic evaluations such as Terminal-Bench 2.0 and OSWorld — and METR's time horizons, GDPval and RLI — using each model's best score across settings such as thinking effort. It mixes the model alone with getting work done.",
      ),
      links: [
        { ja: "Epoch AI: ECI", en: "Epoch AI: ECI", href: "https://epoch.ai/eci" },
        { ja: "ECI に含まれるベンチマーク", en: "Benchmarks included in ECI", href: "https://epoch.ai/data/eci-documentation/data" },
      ],
    }),
    sub(
      "measure-economy",
      t("経済", "Economy"),
      { summary: t("能力が、利用と売上に変わったかどうか。", "Whether capability turned into use and revenue."), refs: ["6.3"] },
      [
        item("adoption", t("利用の広がり", "Adoption"), {
          summary: t("利用者の数と、企業での利用の深さ。", "How many people use it, and how deeply companies use it."),
          note: t(
            "ChatGPT の週間利用者は 10 億人に達し（報道）、Anthropic では 10 万ドル以上を支払う顧客が 1 万 1,900 社を超える。",
            "ChatGPT has reportedly reached a billion weekly users; Anthropic has more than 11,900 customers paying over USD 100,000.",
          ),
          refs: ["6.4"],
        }),
        item("revenue", t("売上と粗利", "Revenue and margin"), {
          summary: t("能力がお金に変わったかどうか。", "Whether capability turned into money."),
          note: t(
            "Anthropic の粗利率は 2025 年の 40% から 2026 年上期の 85% に上がったが、供給の制約と先行契約が生んだ一時的に高い水準と見るべきである。",
            "Anthropic's gross margin rose from 40% in 2025 to 85% in H1 2026, but that is a temporarily high level created by tight supply and contracts signed in advance.",
          ),
          refs: ["2.2", "6.3"],
        }),
        item("productivity", t("生産性", "Productivity"), {
          summary: t("同じ仕事にかかる時間と人手が、どれだけ減ったか。", "How much less time and labour the same work takes."),
        }),
      ],
    ),
    sub(
      "measure-cost",
      t("費用", "Cost"),
      { summary: t("同じ成果を得るのに、いくらかかるか。", "What it costs to get the same result.") },
      [
        item("price-level", t("同じ性能の価格", "Price of fixed performance"), {
          summary: t(
            "ベンチマークで同じ性能を出すための価格。年 5〜10 倍のペースで下がってきた（MIT FutureTech の推計）。",
            "The price of reaching a given benchmark score, which has fallen 5–10x a year (MIT FutureTech estimate).",
          ),
          note: t(
            "一方で、最新のフロンティアモデルを動かす価格は年 3〜18 倍のペースで上がっている。同じ能力は安くなり、最先端の能力は高くなっている。",
            "Meanwhile the price of running the newest frontier models has risen 3–18x a year: fixed capability gets cheaper while the frontier gets dearer.",
          ),
          refs: ["3.2", "5.2"],
        }),
        item("cost-per-task", t("1 件の仕事の費用", "Cost per task"), {
          summary: t(
            "仕事 1 件を完了するまでにかかる推論費。考える量やサブエージェントを増やすほど上がる。",
            "Inference cost to complete one job; it rises as thinking and subagents are added.",
          ),
          refs: ["5.2"],
          links: [
            { ja: "拙稿: フロンティアはモデルからシステムへ", en: "Related post: the frontier moves from models to systems", slug: "outcome-per-dollar-frontier" },
          ],
        }),
        item("energy", t("1 回の応答の電力量", "Energy per response"), {
          summary: t(
            "Google は、Gemini アプリのテキストの応答 1 回に使う電力量を中央値で 0.24 Wh と公表した（2025 年 8 月）。",
            "Google reported that a median Gemini Apps text prompt uses 0.24 Wh (August 2025).",
          ),
          links: [{ ja: "Google の論文（arXiv）", en: "Google's paper (arXiv)", href: "https://arxiv.org/abs/2508.15734" }],
        }),
      ],
    ),
    sub(
      "measure-safety",
      t("安全性", "Safety"),
      { summary: t("任せても問題が起きないか。", "Whether delegating is safe.") },
      [
        item("errors", t("誤りと事故", "Errors and incidents"), {
          summary: t(
            "誤った出力や、エージェントの誤った操作がどれだけ起きるか。任せられる仕事の範囲を決める。",
            "How often outputs are wrong or agents take wrong actions — this limits what can be delegated.",
          ),
        }),
        item("dangerous", t("危険な能力", "Dangerous capabilities"), {
          summary: t(
            "サイバー攻撃や生物兵器などへの悪用につながる能力の評価。",
            "Evaluations of capabilities that could be misused, for example for cyberattacks or biological weapons.",
          ),
        }),
        item("third-party", t("第三者の評価", "Third-party evaluation"), {
          summary: t("開発元以外による評価。", "Evaluations by someone other than the developer."),
          note: t(
            "NIST の CAISI は 2026 年 5 月、中国のオープンウェイトモデルが米国のフロンティアから約 8 か月遅れていると評価した。",
            "In May 2026, NIST's CAISI judged Chinese open-weight models to be about eight months behind the US frontier.",
          ),
          refs: ["3.1"],
        }),
      ],
    ),
  ],
};

export const MATERIALS: GroupDef = {
  kind: "group",
  id: "materials",
  category: "material",
  layout: "row",
  columns: 4,
  label: t("学習の材料", "Training data and tasks"),
  detail: {
    summary: t(
      "学習に使うデータと課題。人間が書いた公開テキストが尽きてきて、ほかの材料の比重が増えている。",
      "The data and tasks models learn from. Public human-written text is running out, so other materials matter more.",
    ),
    refs: ["5.2"],
  },
  children: [
    item("human-data", t("人が書いたデータ", "Human-written data"), {
      summary: t("インターネットの文章、書籍、コード。", "Web text, books and code."),
      note: t(
        "Villalobos らは、人間が書いた公開テキストを約 300 兆トークンと見積もり、2026〜2032 年に使い切ると予測した。",
        "Villalobos et al. estimate public human-written text at about 300 trillion tokens and expect it to be used up between 2026 and 2032.",
      ),
      refs: ["5.2"],
      links: [{ ja: "Villalobos ら（arXiv）", en: "Villalobos et al. (arXiv)", href: "https://arxiv.org/abs/2211.04325" }],
    }),
    item("physical-data", t("実世界のデータ", "Real-world data"), {
      summary: t("動画、センサー、ロボットの操作の記録。", "Video, sensor readings and robot operation logs."),
    }),
    item("experiment-data", t("実験データ", "Experimental data"), {
      summary: t("科学の実験や計算の結果。答えを確かめる手段にもなる。", "Results of experiments and simulations, which can also check answers."),
    }),
    item("world-model", t("世界モデル・シミュレーション", "World models, simulation"), {
      summary: t("現実を模した環境で、安く何度も試行錯誤させる。", "Environments that imitate reality, where trial and error is cheap."),
    }),
    item("deployment-traces", t("利用の記録", "Usage traces"), {
      summary: t(
        "配備したモデルやエージェントの利用の記録。どこで失敗したかがわかる。",
        "Records of how deployed models and agents were used, showing where they failed.",
      ),
      note: t("顧客のデータを学習に使えるかどうかは、契約と規約しだいである。", "Whether customer data may be used for training depends on contracts and terms."),
    }),
    item("synthetic", t("合成データ", "Synthetic data"), {
      summary: t(
        "モデル自身がつくる問題と答え。採点できる課題なら、正しいものだけを選んで学習に使える。",
        "Problems and answers the models produce themselves; for gradable tasks, only the correct ones need be kept.",
      ),
    }),
    item("gradable", t("採点できる課題・環境", "Gradable tasks, environments"), {
      summary: t(
        "正誤を機械で判定できる課題と、エージェントが試行錯誤できる環境。強化学習をどこまで広げられるかを決める。",
        "Tasks a machine can grade and environments where agents can practise; they decide how far RL can be extended.",
      ),
      refs: ["5.2", "5.3"],
    }),
  ],
};
