"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type Entity = {
  id: string;
  label: string;
  type: "person" | "place" | "org" | "event" | "concept";
  color: string;
  x: number;
  y: number;
  community?: number;
};

type Relationship = {
  source: string;
  target: string;
  label: string;
};

type TextUnit = {
  id: number;
  text: string;
  highlighted: boolean;
};

type PipelineStep = {
  phase: string;
  description: string;
  descriptionEn: string;
  textUnits: TextUnit[];
  entities: Entity[];
  relationships: Relationship[];
  communities: { id: number; color: string; label: string }[];
  communityReports: { id: number; summary: string }[];
  activePhase: number;
  queryMode?: "global" | "local" | "drift" | null;
  queryText?: string;
  queryResult?: string;
};

// ── Colors ──────────────────────────────────────────────────

const ENTITY_COLORS: Record<string, string> = {
  person: "#3b82f6",
  place: "#10b981",
  org: "#f59e0b",
  event: "#ef4444",
  concept: "#8b5cf6",
};

const COMMUNITY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

// ── Scenario data ───────────────────────────────────────────

function buildScenario(): PipelineStep[] {
  // Raw documents
  const rawText1 =
    "Alice は東京大学で AI 研究を行っている。彼女は GraphRAG プロジェクトを主導している。";
  const rawText2 =
    "Bob は Microsoft Research に所属し、知識グラフの研究をしている。Alice と共同研究をしている。";
  const rawText3 =
    "GraphRAG は Leiden アルゴリズムを使ってコミュニティ検出を行う。Microsoft Research が開発した。";

  // Entities
  const alice: Entity = {
    id: "alice",
    label: "Alice",
    type: "person",
    color: ENTITY_COLORS.person,
    x: 120,
    y: 80,
  };
  const bob: Entity = {
    id: "bob",
    label: "Bob",
    type: "person",
    color: ENTITY_COLORS.person,
    x: 280,
    y: 80,
  };
  const tokyoU: Entity = {
    id: "tokyou",
    label: "東京大学",
    type: "org",
    color: ENTITY_COLORS.org,
    x: 60,
    y: 180,
  };
  const msResearch: Entity = {
    id: "msresearch",
    label: "MS Research",
    type: "org",
    color: ENTITY_COLORS.org,
    x: 340,
    y: 180,
  };
  const graphrag: Entity = {
    id: "graphrag",
    label: "GraphRAG",
    type: "concept",
    color: ENTITY_COLORS.concept,
    x: 200,
    y: 160,
  };
  const leiden: Entity = {
    id: "leiden",
    label: "Leiden",
    type: "concept",
    color: ENTITY_COLORS.concept,
    x: 200,
    y: 250,
  };

  const steps: PipelineStep[] = [
    // Step 0: Raw documents
    {
      phase: "入力",
      description:
        "非構造化テキスト文書がパイプラインに入力されます。これが GraphRAG のすべての出発点です。",
      descriptionEn:
        "Unstructured text documents are fed into the pipeline. This is the starting point for GraphRAG.",
      textUnits: [],
      entities: [],
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 0,
    },
    // Step 1: Chunking → TextUnits
    {
      phase: "Phase 1: TextUnit 分割",
      description:
        "文書をトークン単位のチャンク（TextUnit）に分割します。デフォルトは 1200 トークン。各 TextUnit が以降の分析の基本単位になります。",
      descriptionEn:
        "Documents are split into token-based chunks (TextUnits). Default is 1200 tokens. Each TextUnit becomes the basic unit for analysis.",
      textUnits: [
        { id: 1, text: rawText1, highlighted: true },
        { id: 2, text: rawText2, highlighted: true },
        { id: 3, text: rawText3, highlighted: true },
      ],
      entities: [],
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 1,
    },
    // Step 2: Entity extraction
    {
      phase: "Phase 3a: エンティティ抽出",
      description:
        "LLM が各 TextUnit からエンティティ（人物・組織・場所・概念）を抽出します。タイトル・タイプ・説明のトリプレットが生成されます。",
      descriptionEn:
        "The LLM extracts entities (people, orgs, places, concepts) from each TextUnit, producing title-type-description triples.",
      textUnits: [
        { id: 1, text: rawText1, highlighted: false },
        { id: 2, text: rawText2, highlighted: false },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [alice, bob, tokyoU, msResearch, graphrag, leiden],
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 2,
    },
    // Step 3: Relationship extraction
    {
      phase: "Phase 3b: 関係性抽出",
      description:
        "エンティティ間の関係性を抽出し、source→target＋説明のエッジを形成します。同じペアの重複は説明をマージします。",
      descriptionEn:
        "Relationships between entities are extracted, forming source→target edges with descriptions. Duplicates are merged.",
      textUnits: [
        { id: 1, text: rawText1, highlighted: false },
        { id: 2, text: rawText2, highlighted: false },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [alice, bob, tokyoU, msResearch, graphrag, leiden],
      relationships: [
        { source: "alice", target: "tokyou", label: "所属" },
        { source: "alice", target: "graphrag", label: "主導" },
        { source: "bob", target: "msresearch", label: "所属" },
        { source: "alice", target: "bob", label: "共同研究" },
        { source: "graphrag", target: "leiden", label: "使用" },
        { source: "msresearch", target: "graphrag", label: "開発" },
      ],
      communities: [],
      communityReports: [],
      activePhase: 2,
    },
    // Step 4: Community detection
    {
      phase: "Phase 4: コミュニティ検出",
      description:
        "Leiden アルゴリズムによる階層的コミュニティ検出。グラフを意味的クラスターに分割し、エンティティに色（コミュニティ）を割り当てます。",
      descriptionEn:
        "Hierarchical community detection using the Leiden algorithm. The graph is partitioned into semantic clusters, assigning colors (communities) to entities.",
      textUnits: [
        { id: 1, text: rawText1, highlighted: false },
        { id: 2, text: rawText2, highlighted: false },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [
        { ...alice, community: 0, color: COMMUNITY_COLORS[0] },
        { ...bob, community: 1, color: COMMUNITY_COLORS[1] },
        { ...tokyoU, community: 0, color: COMMUNITY_COLORS[0] },
        { ...msResearch, community: 1, color: COMMUNITY_COLORS[1] },
        { ...graphrag, community: 2, color: COMMUNITY_COLORS[2] },
        { ...leiden, community: 2, color: COMMUNITY_COLORS[2] },
      ],
      relationships: [
        { source: "alice", target: "tokyou", label: "所属" },
        { source: "alice", target: "graphrag", label: "主導" },
        { source: "bob", target: "msresearch", label: "所属" },
        { source: "alice", target: "bob", label: "共同研究" },
        { source: "graphrag", target: "leiden", label: "使用" },
        { source: "msresearch", target: "graphrag", label: "開発" },
      ],
      communities: [
        { id: 0, color: COMMUNITY_COLORS[0], label: "学術研究" },
        { id: 1, color: COMMUNITY_COLORS[1], label: "産業研究" },
        { id: 2, color: COMMUNITY_COLORS[2], label: "技術基盤" },
      ],
      communityReports: [],
      activePhase: 3,
    },
    // Step 5: Community summarization
    {
      phase: "Phase 5: コミュニティ要約",
      description:
        "各コミュニティの内容を LLM で要約し、Community Report を生成。上位レベルのコミュニティほど広範なテーマを捉えます。",
      descriptionEn:
        "Community contents are summarized by the LLM to generate Community Reports. Higher-level communities capture broader themes.",
      textUnits: [
        { id: 1, text: rawText1, highlighted: false },
        { id: 2, text: rawText2, highlighted: false },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [
        { ...alice, community: 0, color: COMMUNITY_COLORS[0] },
        { ...bob, community: 1, color: COMMUNITY_COLORS[1] },
        { ...tokyoU, community: 0, color: COMMUNITY_COLORS[0] },
        { ...msResearch, community: 1, color: COMMUNITY_COLORS[1] },
        { ...graphrag, community: 2, color: COMMUNITY_COLORS[2] },
        { ...leiden, community: 2, color: COMMUNITY_COLORS[2] },
      ],
      relationships: [
        { source: "alice", target: "tokyou", label: "所属" },
        { source: "alice", target: "graphrag", label: "主導" },
        { source: "bob", target: "msresearch", label: "所属" },
        { source: "alice", target: "bob", label: "共同研究" },
        { source: "graphrag", target: "leiden", label: "使用" },
        { source: "msresearch", target: "graphrag", label: "開発" },
      ],
      communities: [
        { id: 0, color: COMMUNITY_COLORS[0], label: "学術研究" },
        { id: 1, color: COMMUNITY_COLORS[1], label: "産業研究" },
        { id: 2, color: COMMUNITY_COLORS[2], label: "技術基盤" },
      ],
      communityReports: [
        {
          id: 0,
          summary: "Alice を中心に東京大学で AI・GraphRAG 研究を推進",
        },
        {
          id: 1,
          summary: "Bob が MS Research で知識グラフの研究を行い共同研究を推進",
        },
        {
          id: 2,
          summary: "GraphRAG は Leiden アルゴリズムベースのコミュニティ検出を採用",
        },
      ],
      activePhase: 4,
    },
    // Step 6: Global Search
    {
      phase: "Query: Global Search",
      description:
        "「データ全体の主要テーマは？」のような俯瞰的な質問に対し、コミュニティレポートを Map-Reduce 方式で集約して回答を生成します。",
      descriptionEn:
        'For holistic questions like "What are the main themes?", community reports are aggregated via Map-Reduce to generate an answer.',
      textUnits: [
        { id: 1, text: rawText1, highlighted: false },
        { id: 2, text: rawText2, highlighted: false },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [
        { ...alice, community: 0, color: COMMUNITY_COLORS[0] },
        { ...bob, community: 1, color: COMMUNITY_COLORS[1] },
        { ...tokyoU, community: 0, color: COMMUNITY_COLORS[0] },
        { ...msResearch, community: 1, color: COMMUNITY_COLORS[1] },
        { ...graphrag, community: 2, color: COMMUNITY_COLORS[2] },
        { ...leiden, community: 2, color: COMMUNITY_COLORS[2] },
      ],
      relationships: [
        { source: "alice", target: "tokyou", label: "所属" },
        { source: "alice", target: "graphrag", label: "主導" },
        { source: "bob", target: "msresearch", label: "所属" },
        { source: "alice", target: "bob", label: "共同研究" },
        { source: "graphrag", target: "leiden", label: "使用" },
        { source: "msresearch", target: "graphrag", label: "開発" },
      ],
      communities: [
        { id: 0, color: COMMUNITY_COLORS[0], label: "学術研究" },
        { id: 1, color: COMMUNITY_COLORS[1], label: "産業研究" },
        { id: 2, color: COMMUNITY_COLORS[2], label: "技術基盤" },
      ],
      communityReports: [
        {
          id: 0,
          summary: "Alice を中心に東京大学で AI・GraphRAG 研究を推進",
        },
        {
          id: 1,
          summary: "Bob が MS Research で知識グラフの研究を行い共同研究を推進",
        },
        {
          id: 2,
          summary: "GraphRAG は Leiden アルゴリズムベースのコミュニティ検出を採用",
        },
      ],
      activePhase: 5,
      queryMode: "global",
      queryText: "データ全体の主要テーマは？",
      queryResult:
        "主要テーマ: 1) AI 研究の学術的推進 2) 産業界との共同研究 3) グラフベース検索技術の革新",
    },
    // Step 7: Local Search
    {
      phase: "Query: Local Search",
      description:
        "「Alice の研究内容は？」のような特定エンティティに関する質問に対し、知識グラフ上で近傍のエンティティ・関係・TextUnit を集約して回答します。",
      descriptionEn:
        'For entity-specific questions like "What does Alice research?", the system fans out from the entity in the knowledge graph, collecting neighbors, relationships, and TextUnits.',
      textUnits: [
        { id: 1, text: rawText1, highlighted: true },
        { id: 2, text: rawText2, highlighted: true },
        { id: 3, text: rawText3, highlighted: false },
      ],
      entities: [
        { ...alice, community: 0, color: COMMUNITY_COLORS[0] },
        { ...bob, community: 1, color: COMMUNITY_COLORS[1] },
        { ...tokyoU, community: 0, color: COMMUNITY_COLORS[0] },
        { ...msResearch, community: 1, color: COMMUNITY_COLORS[1] },
        { ...graphrag, community: 2, color: COMMUNITY_COLORS[2] },
        { ...leiden, community: 2, color: COMMUNITY_COLORS[2] },
      ],
      relationships: [
        { source: "alice", target: "tokyou", label: "所属" },
        { source: "alice", target: "graphrag", label: "主導" },
        { source: "bob", target: "msresearch", label: "所属" },
        { source: "alice", target: "bob", label: "共同研究" },
        { source: "graphrag", target: "leiden", label: "使用" },
        { source: "msresearch", target: "graphrag", label: "開発" },
      ],
      communities: [
        { id: 0, color: COMMUNITY_COLORS[0], label: "学術研究" },
        { id: 1, color: COMMUNITY_COLORS[1], label: "産業研究" },
        { id: 2, color: COMMUNITY_COLORS[2], label: "技術基盤" },
      ],
      communityReports: [
        {
          id: 0,
          summary: "Alice を中心に東京大学で AI・GraphRAG 研究を推進",
        },
        {
          id: 1,
          summary: "Bob が MS Research で知識グラフの研究を行い共同研究を推進",
        },
        {
          id: 2,
          summary: "GraphRAG は Leiden アルゴリズムベースのコミュニティ検出を採用",
        },
      ],
      activePhase: 5,
      queryMode: "local",
      queryText: "Alice の研究内容は？",
      queryResult:
        "Alice は東京大学で AI 研究を行い、GraphRAG プロジェクトを主導。Bob と共同研究を行っている。",
    },
  ];

  return steps;
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function GraphRAGPipelineVisualizer({ locale = "ja" }: Props) {
  const steps = buildScenario();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2500 });
  const current = steps[player.step];
  const isJa = locale === "ja";

  const phaseLabels = [
    isJa ? "入力" : "Input",
    isJa ? "TextUnit分割" : "Chunking",
    isJa ? "グラフ抽出" : "Graph Extraction",
    isJa ? "コミュニティ検出" : "Community Detection",
    isJa ? "コミュニティ要約" : "Summarization",
    isJa ? "クエリ" : "Query",
  ];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "GraphRAG インデキシングパイプライン"
          : "GraphRAG Indexing Pipeline"
      }
      description={
        isJa
          ? "各ステップを順に再生して、GraphRAG がどのようにテキストから知識グラフを構築し、クエリに回答するかを確認できます。"
          : "Step through each phase to see how GraphRAG builds a knowledge graph from text and answers queries."
      }
    >
      {/* Phase indicator */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {phaseLabels.map((label, i) => (
          <div
            key={i}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              i === current.activePhase
                ? "bg-blue-500 text-white"
                : i < current.activePhase
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
        <div className="font-semibold text-foreground mb-1">
          {current.phase}
        </div>
        <div className="text-muted-foreground">
          {isJa ? current.description : current.descriptionEn}
        </div>
      </div>

      {/* Main visualization area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Left: Knowledge Graph */}
        <div className="border border-border rounded-lg p-3 min-h-[300px] relative bg-background">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {isJa ? "知識グラフ" : "Knowledge Graph"}
          </div>
          <svg viewBox="0 0 400 300" className="w-full h-[260px]">
            {/* Relationships */}
            {current.relationships.map((rel, i) => {
              const src = current.entities.find((e) => e.id === rel.source);
              const tgt = current.entities.find((e) => e.id === rel.target);
              if (!src || !tgt) return null;
              return (
                <g key={`rel-${i}`}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                    strokeWidth={1.5}
                  />
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={8}
                  >
                    {rel.label}
                  </text>
                </g>
              );
            })}
            {/* Entities */}
            {current.entities.map((entity) => (
              <g key={entity.id}>
                <circle
                  cx={entity.x}
                  cy={entity.y}
                  r={entity.id === "graphrag" ? 22 : 16}
                  fill={entity.color}
                  fillOpacity={0.2}
                  stroke={entity.color}
                  strokeWidth={2}
                  className="transition-all duration-500"
                />
                <text
                  x={entity.x}
                  y={entity.y + 4}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize={9}
                  fontWeight="bold"
                >
                  {entity.label}
                </text>
              </g>
            ))}
            {/* Empty state */}
            {current.entities.length === 0 && (
              <text
                x={200}
                y={150}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={12}
              >
                {isJa
                  ? "エンティティ未抽出"
                  : "No entities extracted yet"}
              </text>
            )}
          </svg>
        </div>

        {/* Right: Data panels */}
        <div className="space-y-3">
          {/* TextUnits panel */}
          {current.textUnits.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-background">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                TextUnits ({current.textUnits.length})
              </div>
              <div className="space-y-1.5">
                {current.textUnits.map((tu) => (
                  <div
                    key={tu.id}
                    className={`text-xs p-1.5 rounded ${
                      tu.highlighted
                        ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                        : "bg-muted/30"
                    }`}
                  >
                    <span className="font-mono text-muted-foreground">
                      TU{tu.id}:{" "}
                    </span>
                    {tu.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities panel */}
          {current.communities.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-background">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {isJa ? "コミュニティ" : "Communities"} (
                {current.communities.length})
              </div>
              <div className="space-y-1">
                {current.communities.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community Reports panel */}
          {current.communityReports.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-background">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                {isJa ? "コミュニティレポート" : "Community Reports"}
              </div>
              <div className="space-y-1.5">
                {current.communityReports.map((r) => (
                  <div
                    key={r.id}
                    className="text-xs p-1.5 rounded bg-muted/30 flex items-start gap-2"
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{
                        backgroundColor: COMMUNITY_COLORS[r.id] ?? "#888",
                      }}
                    />
                    <span>{r.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query panel */}
          {current.queryMode && (
            <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-900/10">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    current.queryMode === "global"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                  }`}
                >
                  {current.queryMode === "global"
                    ? "Global Search"
                    : "Local Search"}
                </span>
              </div>
              <div className="text-xs mb-1">
                <span className="font-semibold">Q: </span>
                {current.queryText}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">A: </span>
                {current.queryResult}
              </div>
            </div>
          )}
        </div>
      </div>

      <StepPlayerControls
        {...player}
        label={(step) => {
          const s = steps[step];
          return s ? s.phase : "";
        }}
      />
    </InteractiveDemo>
  );
}
