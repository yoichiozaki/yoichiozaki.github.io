import { SOURCES as S } from "./capability-map-sources";
import { item, sub, t, type GroupDef, type NodeDef } from "./capability-map-types";

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
    refs: ["2.1:link4", "5.2:twoKinds"],
    links: [S.kaplan, S.schaeffer, S.epochEci],
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
    refs: ["5.2:harness", "5.2:twoKinds"],
    links: [S.sweAgent, S.anthropicHarness, S.postClaudeCode, S.postAgenticWorkflow],
  },
  children: [
    item("agent-loop", t("エージェントループ", "Agent loop"), {
      summary: t(
        "モデルを呼び、その出力に従って道具を使い、結果を返してまた呼ぶ。この繰り返しで、何手もかかる仕事を進める。",
        "Call the model, turn its output into tool calls, feed the results back and call it again — the loop that carries multi-step work.",
      ),
      note: t(
        "考えることと行動すること（検索や環境の操作）を交互に行わせる ReAct（2022 年）は、対話型の課題 ALFWorld と WebShop で、模倣学習や強化学習の手法を成功率で 34 ポイントと 10 ポイント上回った。",
        "ReAct (2022), which interleaves reasoning with actions, beat imitation- and reinforcement-learning methods on the interactive ALFWorld and WebShop benchmarks by 34 and 10 points of success rate.",
      ),
      refs: ["5.2:harness"],
      links: [S.react, S.sweAgent],
    }),
    item("tools", t("道具の利用", "Tool use"), {
      summary: t(
        "コードの実行、ファイルの編集、検索、ブラウザの操作など。道具の設計しだいで、同じモデルの成績が変わる。",
        "Running code, editing files, searching, driving a browser. How the tools are designed changes how well the same model does.",
      ),
      note: t(
        "Toolformer（2023 年）は、電卓、検索、翻訳、カレンダーなどの API をいつ、どう呼ぶかを、モデルが少数の例から自分で学べることを示した。",
        "Toolformer (2023) showed that a model can teach itself, from a handful of examples, when and how to call APIs such as a calculator, search, translation and a calendar.",
      ),
      refs: ["5.2:harness"],
      links: [S.toolformer, S.sweAgent, S.postMcp],
    }),
    item("context-mgmt", t("文脈の管理", "Context management"), {
      summary: t(
        "作業の途中で、限られた文脈に何を残し、何を捨て、いつ外へ情報を取りに行くかを決める。古いやり取りの要約（コンパクション）や、情報を必要になった時点で道具で読み込むといった工夫がある。取りに行った先から何が返ってくるかは、推論時の文脈（IQ 層）の側で決まる。",
        "Deciding, as a job goes on, what to keep in a limited context, what to drop and when to go out for more: summarizing old turns (compaction) and loading information through tools only when it is needed. What comes back from a fetch is decided on the context-layer (IQ) side.",
      ),
      note: t(
        "長い文脈は KV キャッシュを膨らませて HBM の負担を増やすので、何を残すかの判断は推論費にも響く。文脈が長いと、真ん中にある情報ほど使われにくいという研究もある（Liu ら、2023 年）。",
        "Long contexts swell the KV cache and load HBM, so deciding what to keep also shows up in inference cost. Research also finds that models use information in the middle of a long context less well than at its start or end (Liu et al., 2023).",
      ),
      refs: ["5.2:longRun", "4.4:kvCache"],
      links: [S.anthropicHarness, S.contextEngineering, S.lostInTheMiddle],
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
      refs: ["5.2:handoff"],
      links: [S.anthropicHarness, S.memGpt],
    }),
    item("verify", t("検証（テスト・採点）", "Checks (tests, graders)"), {
      summary: t(
        "テストや採点で出力を確かめ、通らなければやり直す。同じ仕組みは、強化学習の報酬にもなる。",
        "Checking the output with tests or graders and retrying on failure; the same checks can serve as RL rewards.",
      ),
      note: t(
        "途中の各ステップを採点する報酬モデル（プロセス監督）は、最終的な答えだけを採点するものより成績が良かった。この報酬モデルで多数の解答から 1 つを選ぶと、MATH の代表的な問題の 78% を解けた（Lightman ら、2023 年）。",
        "A reward model that grades each intermediate step (process supervision) outperformed one that grades only the final answer; using it to pick from many sampled solutions solved 78% of a representative subset of MATH (Lightman et al., 2023).",
      ),
      refs: ["5.3:answer"],
      links: [S.verifyStepByStep, S.verifiers, S.postJudge],
    }),
    item("subagents", t("分担（サブエージェント）", "Subagents"), {
      summary: t(
        "仕事を分けて別のエージェントに任せ、並列に進める。それぞれが自分の文脈を持つので、1 つの文脈に収まらない仕事も扱える。",
        "Splitting the work across agents that run in parallel, each with its own context, so jobs larger than one context window can be handled.",
      ),
      note: t(
        "Anthropic の分析では、エージェントは会話の約 4 倍、複数のエージェントで分担するシステムは約 15 倍のトークンを使う。調査のように並列に進めやすい仕事では成績が上がるが、推論費も増える。",
        "Anthropic found that agents use about 4x the tokens of a chat and multi-agent systems about 15x — better results on parallelizable work such as research, but higher inference cost.",
      ),
      refs: ["5.2:tokens"],
      links: [S.anthropicMultiAgent],
    }),
    item("guardrails", t("権限と安全装置", "Permissions and safeguards"), {
      summary: t(
        "実行できる操作を絞り、危険な操作の前には人の確認を挟む。どこまで任せられるかを決める。",
        "Limiting what the agent may do and asking a person before risky actions — this decides how much can be delegated.",
      ),
      note: t(
        "Anthropic は、Claude Code に作業できる範囲を限るサンドボックスを入れたことで、社内の利用で権限の確認を求める回数が 84% 減ったと報告した。",
        "Anthropic reported that adding a sandbox that limits where Claude Code can act cut permission prompts by 84% in its internal use.",
      ),
      links: [S.anthropicSandbox, S.postClaudeCode],
    }),
  ],
};

export const CONTEXT: GroupDef = {
  kind: "group",
  id: "context-layer",
  category: "context",
  layout: "column",
  label: t("推論時の文脈（IQ 層）", "Context (IQ layer)"),
  detail: {
    summary: t(
      "モデルが学習していない社内の情報や最新の情報を、推論のたびに探して渡す層。どこを、誰の権限で探し、何を渡すかで、同じモデルとハーネスでも完了できる仕事が変わる。文脈は実際にはハーネスの道具を通じてモデルに届くが、この層はどのハーネスからも呼べる別のレバーなので、地図では仕事を完了する能力に直接つないだ。Microsoft はこの層を Microsoft IQ と呼ぶ。",
      "The layer that finds and hands over, at every inference, what the model never learned: company information and anything recent. Where it looks, under whose permissions, and what it hands over change how much work the same model and harness can finish. At run time, context reaches the model through the harness's tools, but any harness can call this layer, so it is a separate lever, and the map connects it straight to getting work done. Microsoft calls this layer Microsoft IQ.",
    ),
    note: t(
      "Microsoft の Satya Nadella CEO は 2026 年 10 月の決算説明で、人、人どうしの関係、文書、メール、会議、チャット、プロジェクトなど、Microsoft 365 に蓄積された知識を「企業にとって最も重要なデータベースの 1 つ」と呼んだ。Microsoft IQ を通じて文脈を利用している顧客は 6 万近くで、前四半期から 25% 増えた。どの IQ も MCP で呼べるので、他社のモデルで動くエージェントからも使える。",
      "On Microsoft's October 2026 earnings call, CEO Satya Nadella called the knowledge underneath Microsoft 365 — people, their relationships, documents, emails, meetings, chats, projects and other artifacts — one of the most important databases for any enterprise. Nearly 60,000 customers access context through Microsoft IQ, up 25% from the previous quarter. Each IQ can be called over MCP, so agents running on other companies' models can use it too.",
    ),
    refs: ["5.2:iq", "5.2:contextMoney", "5.2:context", "5.3:notCounted", "7.3:iq", "8:context"],
    links: [S.microsoftIq, S.msftEarningsCall, S.contextEngineering, S.postMcp],
  },
  children: [
    sub(
      "context-sources",
      t("情報源", "Sources"),
      {
        summary: t(
          "モデルの重みにない情報の出どころ。Microsoft はこれを 4 つに分けて提供している。",
          "Where the information missing from the weights comes from. Microsoft offers it in four parts.",
        ),
        refs: ["5.2:iq"],
        links: [S.microsoftIq],
      },
      [
        item("work-iq", t("仕事の文脈（Work IQ）", "Work context (Work IQ)"), {
          summary: t(
            "メール、会議、チャット、文書と、誰と誰が一緒に働いているか。Microsoft 365 にある情報のうち、利用者が見てよい範囲から組み立てる。",
            "Emails, meetings, chats and documents, and who works with whom — assembled on Microsoft 365 from what the user is allowed to see.",
          ),
          note: t(
            "2026 年 9 月時点のドキュメントによれば、Work IQ は Microsoft 365 Copilot のライセンスとは別に、他社のエージェントからも MCP、A2A、REST で使え、利用量に応じて課金される。要求はすべて利用者の権限で実行し、MCP サーバーでは数百ある操作を 10 個の汎用的な道具にまとめている。Copilot が使う索引を外のアプリから引ける Retrieval API は、2025 年に先に出ていた。",
            "According to its September 2026 documentation, Work IQ can also be used by other companies' agents, over MCP, A2A or REST, with usage-based billing independent of Microsoft 365 Copilot licensing. Every request runs under the user's own permissions, and its MCP server collapses hundreds of operations into 10 generic tools. The Retrieval API, which lets outside apps query the index behind Copilot, came first, in 2025.",
          ),
          refs: ["7.3:iq"],
          links: [S.workIq, S.retrievalApi, S.msftEarningsCall],
        }),
        item("fabric-iq", t("データの意味（Fabric IQ）", "Semantics (Fabric IQ)"), {
          summary: t(
            "顧客、注文、出荷といった業務の概念と、その関係、指標、規則。テーブルの列だけを見せても、エージェントは数字の意味を取り違える。",
            "Business concepts such as customers, orders and shipments, with their relationships, metrics and rules. Shown only table columns, an agent misreads what the numbers mean.",
          ),
          note: t(
            "Fabric IQ のオントロジーは、こうした概念を OneLake のデータに結び付け、人とエージェントが同じ言葉で業務を扱えるようにする。概念を一度定義すれば、レポートにもエージェントにも使い回せる。",
            "The Fabric IQ ontology binds these concepts to data in OneLake so that people and agents work with the business in the same vocabulary; a concept defined once can be reused across reports and agents.",
          ),
          refs: ["5.2:iq"],
          links: [S.fabricIq, S.postOntology],
        }),
        item("foundry-iq", t("組織の知識（Foundry IQ）", "Knowledge (Foundry IQ)"), {
          summary: t(
            "規程、手順書、契約書など、根拠になる文書。複数の情報源を 1 つの知識ベースにまとめ、質問に合う部分を引用付きで返す。",
            "Policies, manuals, contracts and other authoritative documents. Several sources are combined into one knowledge base, which returns the passages that fit a question, with citations.",
          ),
          note: t(
            "Microsoft の測定では、質問を分解して情報源を選ばせ、足りなければ探し直させると、5 つのデータセットでの回答の評価が平均 59 点から 80 点に上がった（2025 年 11 月）。",
            "In Microsoft's measurements, having the knowledge base break a question down, choose its sources and search again when results fall short raised answer scores across five datasets from 59 to 80 on average (November 2025).",
          ),
          refs: ["5.2:retrievalEffort"],
          links: [S.foundryIq, S.foundryIqRelevance],
        }),
        item("web-iq", t("Web の情報（Web IQ）", "Web content (Web IQ)"), {
          summary: t(
            "学習データの締め切りより後の出来事や、社外の最新の情報。",
            "Events after the training cutoff, and current information from outside the company.",
          ),
          note: t(
            "見つけにくい情報を Web から探し出す力を測る OpenAI の BrowseComp では、2025 年 4 月の時点で、ブラウズ機能を付けた GPT-4o の正答率は 1.9%、この種の課題に向けて学習した Deep Research は 51.5% だった。2026 年 9 月の GPT-6 Astra は 91.5% である。Web を見られるだけでは足りず、探し方を学習させると成績が大きく伸びる。",
            "On OpenAI's BrowseComp, which measures the ability to dig hard-to-find information out of the web, GPT-4o with browsing scored 1.9% in April 2025 and Deep Research, trained for this kind of task, 51.5%; GPT-6 Astra scored 91.5% in September 2026. Access to the web is not enough; training a model in how to search raises the score sharply.",
          ),
          refs: ["5.2:iq"],
          links: [S.webIq, S.browseComp, S.gpt6Astra],
        }),
      ],
    ),
    sub(
      "context-delivery",
      t("探し方と渡し方", "Finding and handing over"),
      {
        summary: t(
          "どの情報源にも共通する、探し方と渡し方。ここを外すと、情報源がそろっていても正しい文脈は届かない。",
          "How context is found and handed over, whatever the source. Get this wrong and the right context does not arrive even when every source is in place.",
        ),
        refs: ["5.2:retrievalEffort"],
        links: [S.contextEngineering, S.foundryIqRelevance],
      },
      [
        item("search-ranking", t("検索と並べ替え", "Search and ranking"), {
          summary: t(
            "キーワードとベクトルを組み合わせて探し、結果を並べ替えて、上位だけを返す。文書をどこで断片に切り、何を添えて索引にするかでも、見つかるものが変わる。",
            "Searching by keywords and vectors together, reranking the results and returning only the top ones. Where documents are split, and what is attached to each piece, also changes what can be found.",
          ),
          note: t(
            "Anthropic の Contextual Retrieval（2024 年）は、文書の断片ごとに前後の文脈の説明を付けてから索引を作ることで、検索の失敗を 49%、並べ替え（リランキング）と組み合わせると 67% 減らした。検索先のデータを 1.4 兆トークンまで増やすと、言語モデリングといくつかの課題の成績が目立った頭打ちもなく上がり続けたという研究もある（Shao ら、2024 年）。",
            "Anthropic's Contextual Retrieval (2024) cut failed retrievals by 49%, and by 67% with reranking, by attaching a short explanation of its context to each chunk before indexing. Another study found that language modelling and several downstream tasks kept improving without obvious saturation as the datastore grew to 1.4 trillion tokens (Shao et al., 2024).",
          ),
          refs: ["5.2:retrievalEffort"],
          links: [S.contextualRetrieval, S.massiveDs, S.rag, S.postGraphRag, S.postSearch],
        }),
        item("permissions", t("権限と鮮度", "Permissions, freshness"), {
          summary: t(
            "利用者が見てよいものだけを、最新の状態で渡す。見てはいけない情報を渡せば、答えが正しくても事故になる。",
            "Handing over only what the user may see, in its current state. Handing over anything they must not see is an incident, even if the answer is right.",
          ),
          note: t(
            "Foundry IQ は、対応する情報源ではアクセス制御リストを同期し、Microsoft Purview の秘密度ラベルとともに検索の時点で適用して、呼び出した人の Microsoft Entra の ID で検索する。OpenAI が 2025 年 10 月に ChatGPT に加えた company knowledge も、既存の権限に従い、利用者が見てよいものだけを読む。",
            "For supported sources, Foundry IQ syncs access control lists and enforces them at query time together with Microsoft Purview sensitivity labels, searching under the caller's Microsoft Entra identity. The company knowledge feature OpenAI added to ChatGPT in October 2025 likewise respects existing permissions, reading only what each user may see.",
          ),
          refs: ["5.2:iq"],
          links: [S.foundryIq, S.companyKnowledge],
        }),
      ],
    ),
  ],
};

export const SYSTEM: NodeDef = {
  kind: "node",
  id: "system",
  category: "capability",
  emphasis: true,
  label: t("仕事を完了する能力", "Getting work done"),
  sublabel: t(
    "モデル、ハーネス、推論計算、文脈を合わせたシステム全体の力",
    "What the model, harness, inference compute and context achieve together",
  ),
  detail: {
    summary: t(
      "任された仕事を最後までやり遂げる力。モデルの能力に、ハーネスと、1 件の仕事に使える推論計算が組み合わさって決まり、推論時に持ち込む文脈（IQ 層）の正しさにも左右される。売上に直接つながるのは、モデル単体の能力ではなくこの能力である。",
      "The ability to see a delegated job through to the end. It depends on the model, the harness and how much inference compute each job gets, and on how accurately context is brought in at inference time (the IQ layer). It is this ability, not the model alone, that revenue tracks.",
    ),
    note: t(
      "売上をけん引しているのもこの能力である。Anthropic の売上を押し上げた Claude Code はモデルとハーネスを組み合わせた製品で、Claude Enterprise の利用者では、Claude Code を使う上位 5% が、使わない利用者の平均の約 20 倍を支払う（2026 年 7〜9 月期）。",
      "This is what drives revenue: Claude Code, which powered Anthropic's growth, combines a model with a harness, and the top 5% of Claude Enterprise users who use it pay about 20 times the average of Enterprise users who don't (July–September 2026).",
    ),
    refs: ["5.3:target", "5.2:twoKinds", "5.2:metrSystem", "2.2:agents", "5.2:context"],
    links: [S.metrTimeHorizons, S.rliLeaderboard, S.s1, S.postOutcome],
  },
};

export const USES: GroupDef = {
  kind: "group",
  id: "uses",
  category: "capability",
  layout: "column",
  label: t("使い道（需要）", "Uses (demand)"),
  sublabel: t("契約と継続利用で裏づけられるか", "Contract-backed and recurring?"),
  detail: {
    summary: t(
      "仕事を完了する能力が使われる先で、チェーンの環 6（需要）にあたる。顧客の利用は、「価格」の矢印で売上に変わる。ラボが自社の研究開発に使う分は、売上を生まず、計算資源費として研究開発費に入るが、次のモデルの開発を速める。",
      "Where getting work done is put to use — link 6 of the chain (demand). Customers' use turns into revenue through the “Price” arrow. A lab's own use in AI research earns no revenue — its compute is booked as R&D — but speeds up work on the next model.",
    ),
    refs: ["2.1:link6", "3.3", "6.3:demand"],
    links: [S.menlo, S.gdpval],
  },
  children: [
    item("ai-research", t("AI の研究開発", "AI research"), {
      summary: t(
        "次のモデルの開発を AI が手伝う。Anthropic の S-1 はこれを「ループを閉じる」と呼ぶ。",
        "AI helping to build the next models — what Anthropic's S-1 calls “closing the loop”.",
      ),
      note: t(
        "Anthropic の S-1 によれば、2026 年 9 月にコードベースへ加えられた変更の 90% 超は Claude が書いた。Google DeepMind の AlphaEvolve は、Gemini のアーキテクチャの重要なカーネルを 23% 速くし、Gemini の学習時間を 1% 縮めた。Lu ら（2024 年）の The AI Scientist は、アイデアの立案から実験、論文の執筆までを 1 本あたり 15 ドル未満で行った。",
        "According to Anthropic's S-1, Claude wrote over 90% of the contributions to its codebase in September 2026. Google DeepMind's AlphaEvolve sped up a key kernel in Gemini's architecture by 23%, cutting Gemini's training time by 1%; Lu et al.'s The AI Scientist (2024) went from idea to experiments to a written paper for under USD 15 per paper.",
      ),
      refs: ["2.2:loop", "5.3:loop"],
      links: [S.s1, S.aiScientist, S.alphaEvolve],
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
      refs: ["3.3", "5.3:coding"],
      links: [S.menlo, S.sweBench, S.sweAgent],
    }),
    item("knowledge-work", t("知識労働", "Knowledge work"), {
      summary: t(
        "調査、文書の作成、分析。正誤を判定しにくい部分が多く、強化学習をそのまま当てはめにくい。",
        "Research, writing and analysis — much of it hard to grade, so RL is hard to apply as is.",
      ),
      note: t(
        "コーディングの次に、エージェントの売上がどこまで広がるかを決める分野である。第 8 章の 1 つ目の道筋は、エージェントが知識労働の多くの仕事に広がり、推論の需要が供給を上回り続ける場合である。",
        "This is where agent revenue has to spread next after coding. Chapter 8's first scenario is the one in which agents spread to much of knowledge work and inference demand keeps exceeding supply.",
      ),
      refs: ["2.2:cowork", "5.3:hardToJudge", "8:knowledge"],
      links: [S.gdpval, S.genAiAtWork, S.s1],
    }),
    item("science", t("科学", "Science"), {
      summary: t(
        "仮説を立て、計算や実験で確かめる。結果を確かめる手段がある分野ほど、AI を使いやすい。",
        "Forming hypotheses and testing them by computation or experiment; the easier results are to check, the easier AI is to apply.",
      ),
      note: t(
        "Google DeepMind の AlphaEvolve は、4×4 の複素行列の積を 48 回のスカラー乗算で計算する方法を見つけ、1969 年の Strassen の方法を改良した。",
        "Google DeepMind's AlphaEvolve found a way to multiply 4×4 complex-valued matrices with 48 scalar multiplications, improving on Strassen's 1969 algorithm.",
      ),
      links: [S.alphaEvolve, S.coscientist, S.aiScientist],
    }),
    item("robotics", t("ロボット", "Robotics"), {
      summary: t(
        "物理的な世界での作業。データが少なく、試行錯誤に時間がかかる。",
        "Work in the physical world, where data is scarce and trial and error is slow.",
      ),
      note: t(
        "Open X-Embodiment は、21 の研究機関が 22 種類のロボットで集めたデータ（527 のスキル）を 1 つにまとめた。",
        "Open X-Embodiment pooled data from 22 kinds of robots collected by 21 institutions, covering 527 skills.",
      ),
      links: [S.rt2, S.openX, S.genie3],
    }),
  ],
};
