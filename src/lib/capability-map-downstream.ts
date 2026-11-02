import { item, t, type GroupDef, type NodeDef } from "./capability-map-types";

const METR = { ja: "METR: Time Horizons", en: "METR: Time Horizons", href: "https://metr.org/time-horizons/" };
const SWE_AGENT = { ja: "SWE-agent（論文）", en: "SWE-agent (paper)", href: "https://arxiv.org/abs/2405.15793" };
const HARNESS_ARTICLE = {
  ja: "Anthropic: Effective harnesses for long-running agents",
  en: "Anthropic: Effective harnesses for long-running agents",
  href: "https://www.anthropic.com/research/effective-harnesses-for-long-running-agents",
};
const MULTI_AGENT_ARTICLE = {
  ja: "Anthropic: How we built our multi-agent research system",
  en: "Anthropic: How we built our multi-agent research system",
  href: "https://www.anthropic.com/research/multi-agent-research-system",
};

export const MODEL: NodeDef = {
  kind: "node",
  id: "model",
  category: "capability",
  label: t("モデルの能力", "Model capability"),
  sublabel: t("1 回の呼び出しで解ける問題の難しさ", "How hard a problem one call can solve"),
  detail: {
    summary: t(
      "重みそのものが持つ知識と推論の力。事前学習の損失や、道具を使わずに決まった問題を解かせるベンチマークで測る。",
      "The knowledge and reasoning held in the weights themselves, measured by pretraining loss and by benchmarks that pose fixed problems without tools.",
    ),
    note: t(
      "学習の段階で伸びる。ただしベンチマークは次々に飽和して入れ替わり、損失の低下がどの能力として現れるかも読みにくい。",
      "It grows through training, but benchmarks keep saturating and being replaced, and which capabilities a lower loss turns into is hard to read.",
    ),
    refs: ["2.1", "5.2"],
  },
};

export const HARNESS: GroupDef = {
  kind: "group",
  id: "harness",
  category: "harness",
  layout: "column",
  label: t("ハーネス", "Harness"),
  detail: {
    summary: t(
      "モデルに道具を使わせ、文脈を管理し、結果を検証し、作業を引き継ぐ、モデルの外側の仕組み。同じモデルでも、ハーネスによって仕事を完了できるかどうかが大きく変わる。",
      "The machinery outside the model that lets it use tools, manages its context, checks its results and hands work over. With the same model, the harness decides much of whether the work gets done.",
    ),
    note: t(
      "SWE-agent の論文（2024 年）では、同じ GPT-4 Turbo でも、シェルを直接操作させたときの SWE-bench Lite の解決率 11% が、エージェント向けに設計したインターフェースを与えると 18% に上がった。エージェント向けの強化学習はモデルをハーネスの中で動かして学ばせるので、モデルとハーネスは一緒に改良されていく。",
      "In the SWE-agent paper (2024), the same GPT-4 Turbo solved 11% of SWE-bench Lite when driving a raw shell and 18% with an interface designed for agents. Agentic RL trains the model while it runs inside a harness, so the two are improved as a pair.",
    ),
    refs: ["5.2"],
    links: [
      {
        ja: "拙稿: 本番 AI エージェントの設計空間を読む（Claude Code の解剖）",
        en: "Related post: the design space of a production AI agent (Claude Code)",
        slug: "claude-code-design-space",
      },
      { ja: "拙稿: Agentic Workflow 完全解説", en: "Related post: Agentic Workflow deep dive", slug: "agentic-workflow" },
      SWE_AGENT,
      HARNESS_ARTICLE,
    ],
  },
  children: [
    item("agent-loop", t("エージェントループ", "Agent loop"), {
      summary: t(
        "モデルを呼び、その出力に従って道具を使い、結果を返してまた呼ぶ。この繰り返しで、何手もかかる仕事を進める。",
        "Call the model, turn its output into tool calls, feed the results back and call it again — the loop that carries multi-step work.",
      ),
    }),
    item("tools", t("道具の利用", "Tool use"), {
      summary: t(
        "コードの実行、ファイルの編集、検索、ブラウザの操作など。道具の設計しだいで、同じモデルの成績が変わる。",
        "Running code, editing files, searching, driving a browser. How the tools are designed changes how well the same model does.",
      ),
      links: [
        { ja: "拙稿: Model Context Protocol (MCP) 超詳細解説", en: "Related post: Model Context Protocol deep dive", slug: "model-context-protocol" },
      ],
    }),
    item("context-mgmt", t("文脈の管理", "Context management"), {
      summary: t(
        "限られた文脈に、何を入れて何を捨てるかを決める。古いやり取りの要約（コンパクション）や、必要な情報の検索。",
        "Deciding what goes into a limited context and what is dropped: summarising old turns (compaction) and retrieving what is needed.",
      ),
      note: t(
        "Anthropic は 2025 年 11 月、Opus 4.5 でも、大まかな指示だけを与えて何セッションにもわたって Web アプリを開発させると、コンパクションを使っても本番に使える水準まで仕上げられないと報告した。",
        "In November 2025, Anthropic reported that even Opus 4.5, given only a high-level prompt and many sessions, fell short of a production-quality web app despite compaction.",
      ),
      refs: ["5.2"],
      links: [HARNESS_ARTICLE],
    }),
    item("memory", t("記憶と引き継ぎ", "Memory and handoff"), {
      summary: t(
        "文脈の外に進捗を書き残し、次のセッションが続きから始められるようにする。",
        "Writing progress down outside the context so the next session can pick up where the last one stopped.",
      ),
      note: t(
        "Anthropic は、最初のセッションで環境を整えるエージェントと、少しずつ進めるエージェントを分け、進捗ファイルと git の履歴で引き継ぐ方式を紹介した。",
        "Anthropic described splitting the work between an agent that sets up the environment in the first session and one that makes incremental progress, handing over through a progress file and the git history.",
      ),
      refs: ["5.2"],
      links: [HARNESS_ARTICLE],
    }),
    item("verify", t("検証（テスト・採点）", "Checks (tests, graders)"), {
      summary: t(
        "テストや採点で出力を確かめ、通らなければやり直す。同じ仕組みは、強化学習の報酬にもなる。",
        "Checking the output with tests or graders and retrying on failure; the same checks can serve as RL rewards.",
      ),
      links: [
        { ja: "拙稿: LLM-as-a-Judge を「育てて運用する」", en: "Related post: raising an LLM judge", slug: "llm-as-a-judge-lifecycle" },
      ],
    }),
    item("subagents", t("分担（サブエージェント）", "Subagents"), {
      summary: t(
        "仕事を分けて別のエージェントに任せ、並列に進める。それぞれが自分の文脈を持つので、1 つの文脈に収まらない仕事も扱える。",
        "Splitting the work across agents that run in parallel, each with its own context, so jobs larger than one context window can be handled.",
      ),
      note: t(
        "Anthropic の分析では、エージェントは会話の約 4 倍、複数のエージェントで分担するシステムは約 15 倍のトークンを使う。調査のように並列に進めやすい仕事では成績が上がるが、推論費も増える。",
        "Anthropic found that agents use about 4× the tokens of a chat and multi-agent systems about 15× — better results on parallelizable work such as research, but higher inference cost.",
      ),
      refs: ["5.2"],
      links: [MULTI_AGENT_ARTICLE],
    }),
    item("guardrails", t("権限と安全装置", "Permissions, safeguards"), {
      summary: t(
        "実行できる操作を絞り、危険な操作の前には人の確認を挟む。どこまで任せられるかを決める。",
        "Limiting what the agent may do and asking a person before risky actions — this decides how much can be delegated.",
      ),
    }),
  ],
};

export const SYSTEM: NodeDef = {
  kind: "node",
  id: "system",
  category: "capability",
  emphasis: true,
  label: t("仕事を完了する能力", "Getting work done"),
  sublabel: t(
    "モデル、ハーネス、推論計算を合わせたシステム全体の力",
    "What the model, harness and inference compute achieve together",
  ),
  detail: {
    summary: t(
      "任された仕事を最後までやり遂げる力。モデルの能力に、ハーネスと、1 件の仕事に使える推論計算が組み合わさって決まる。売上に直接つながるのは、モデル単体の能力ではなくこの能力である。",
      "The ability to see a delegated job through to the end. It depends on the model, the harness and how much inference compute each job gets — and it, not the model alone, is what revenue tracks.",
    ),
    note: t(
      "METR のタイムホライズンも、道具を与えて作業のループを回す仕組み（スキャフォールド）にモデルを組み込んで測っている。測っているのはモデル単体ではなく、システムの能力である。",
      "METR's time horizons are measured with the model inside a scaffold that provides tools and runs the loop — they measure the system, not the model alone.",
    ),
    refs: ["5.2", "5.3"],
    links: [
      METR,
      { ja: "拙稿: フロンティアはモデルからシステムへ", en: "Related post: the frontier moves from models to systems", slug: "outcome-per-dollar-frontier" },
    ],
  },
};

export const USES: GroupDef = {
  kind: "group",
  id: "uses",
  category: "capability",
  layout: "column",
  label: t("使い道", "Uses"),
  detail: {
    summary: t("仕事を完了する能力が、売上や研究の成果に変わる場所。", "Where getting work done turns into revenue and results."),
    refs: ["3.3"],
  },
  children: [
    item("ai-research", t("AI の研究開発", "AI research"), {
      summary: t(
        "次のモデルの開発を AI が手伝う。Anthropic の S-1 はこれを「ループを閉じる」と呼ぶ。",
        "AI helping to build the next models — what Anthropic's S-1 calls “closing the loop”.",
      ),
      note: t(
        "アルゴリズムの効率の伸びを速める可能性があるが、予測できる軸とは言えない。",
        "It may speed up algorithmic progress, but it is not a predictable axis.",
      ),
      refs: ["2.2", "5.3"],
    }),
    item("software", t("ソフトウェア開発", "Software development"), {
      summary: t(
        "テストで正誤を確かめやすく、最初にエージェントが大きな売上を生んだ分野。",
        "Easy to check with tests, and the first field where agents earned large revenue.",
      ),
      note: t(
        "コーディング用途の企業の LLM API 支出では、Anthropic のシェアが 54% に達した（Menlo Ventures、2025 年）。",
        "Anthropic took 54% of enterprise LLM API spending on coding (Menlo Ventures, 2025).",
      ),
      refs: ["3.3", "5.3"],
    }),
    item("knowledge-work", t("知識労働", "Knowledge work"), {
      summary: t(
        "調査、文書の作成、分析。正誤を判定しにくい部分が多く、強化学習をそのまま当てはめにくい。",
        "Research, writing and analysis — much of it hard to grade, so RL does not transfer directly.",
      ),
      note: t(
        "Anthropic は Claude Code の仕組みを知識労働に広げた Claude Cowork を出している。",
        "Anthropic extended the Claude Code approach to knowledge work with Claude Cowork.",
      ),
      refs: ["2.2", "5.3"],
    }),
    item("science", t("科学", "Science"), {
      summary: t(
        "仮説を立て、計算や実験で確かめる。結果を確かめる手段がある分野ほど、AI を使いやすい。",
        "Forming hypotheses and testing them by computation or experiment; the easier results are to check, the easier AI is to apply.",
      ),
    }),
    item("robotics", t("ロボット", "Robotics"), {
      summary: t(
        "物理的な世界での作業。データが少なく、試行錯誤に時間がかかる。",
        "Work in the physical world, where data is scarce and trial and error is slow.",
      ),
    }),
  ],
};
