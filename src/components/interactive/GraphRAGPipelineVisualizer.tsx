"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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

function buildScenario(isJa: boolean): PipelineStep[] {
  const L = (ja: string, en: string) => (isJa ? ja : en);

  // Raw documents
  const rawText1 = L(
    "Alice は東京大学で AI 研究を行っている。彼女は GraphRAG プロジェクトを主導している。",
    "Alice does AI research at the University of Tokyo. She leads the GraphRAG project.",
  );
  const rawText2 = L(
    "Bob は Microsoft Research に所属し、知識グラフの研究をしている。Alice と共同研究をしている。",
    "Bob works at Microsoft Research on knowledge graphs. He collaborates with Alice.",
  );
  const rawText3 = L(
    "GraphRAG は Leiden アルゴリズムを使ってコミュニティーを検出する。Microsoft Research が開発した。",
    "GraphRAG detects communities with the Leiden algorithm. It was developed by Microsoft Research.",
  );

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
    label: L("東京大学", "UTokyo"),
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

  const textUnits = (highlighted: [boolean, boolean, boolean]): TextUnit[] => [
    { id: 1, text: rawText1, highlighted: highlighted[0] },
    { id: 2, text: rawText2, highlighted: highlighted[1] },
    { id: 3, text: rawText3, highlighted: highlighted[2] },
  ];
  const plainEntities = [alice, bob, tokyoU, msResearch, graphrag, leiden];
  const clusteredEntities: Entity[] = [
    { ...alice, community: 0, color: COMMUNITY_COLORS[0] },
    { ...bob, community: 1, color: COMMUNITY_COLORS[1] },
    { ...tokyoU, community: 0, color: COMMUNITY_COLORS[0] },
    { ...msResearch, community: 1, color: COMMUNITY_COLORS[1] },
    { ...graphrag, community: 2, color: COMMUNITY_COLORS[2] },
    { ...leiden, community: 2, color: COMMUNITY_COLORS[2] },
  ];
  const relationships: Relationship[] = [
    { source: "alice", target: "tokyou", label: L("所属", "member of") },
    { source: "alice", target: "graphrag", label: L("主導", "leads") },
    { source: "bob", target: "msresearch", label: L("所属", "member of") },
    { source: "alice", target: "bob", label: L("共同研究", "collaborates") },
    { source: "graphrag", target: "leiden", label: L("使用", "uses") },
    { source: "msresearch", target: "graphrag", label: L("開発", "developed") },
  ];
  const communities = [
    { id: 0, color: COMMUNITY_COLORS[0], label: L("学術研究", "Academic research") },
    { id: 1, color: COMMUNITY_COLORS[1], label: L("産業研究", "Industry research") },
    { id: 2, color: COMMUNITY_COLORS[2], label: L("技術基盤", "Technical foundation") },
  ];
  const communityReports = [
    {
      id: 0,
      summary: L(
        "Alice を中心に東京大学で AI・GraphRAG 研究を推進",
        "Alice leads AI and GraphRAG research at the University of Tokyo",
      ),
    },
    {
      id: 1,
      summary: L(
        "Bob が MS Research で知識グラフを研究し、Alice と共同研究",
        "Bob studies knowledge graphs at MS Research and collaborates with Alice",
      ),
    },
    {
      id: 2,
      summary: L(
        "GraphRAG は Leiden アルゴリズムベースのコミュニティー検出を採用",
        "GraphRAG uses community detection based on the Leiden algorithm",
      ),
    },
  ];

  const steps: PipelineStep[] = [
    // Step 0: Raw documents
    {
      phase: L("入力", "Input"),
      description:
        "非構造化テキストの文書がパイプラインに入力されます。",
      descriptionEn:
        "Unstructured text documents are fed into the pipeline.",
      textUnits: [],
      entities: [],
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 0,
    },
    // Step 1: Chunking → TextUnits
    {
      phase: L("Phase 1: TextUnit 分割", "Phase 1: Chunking into TextUnits"),
      description:
        "文書をトークン数で区切ったチャンク（TextUnit）に分割します。チャンクサイズのデフォルトは 1,200 トークンです。各 TextUnit が以降の分析の基本単位になります。",
      descriptionEn:
        "Documents are split into token-based chunks (TextUnits). The default chunk size is 1,200 tokens. Each TextUnit becomes the basic unit for analysis.",
      textUnits: textUnits([true, true, true]),
      entities: [],
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 1,
    },
    // Step 2: Entity extraction
    {
      phase: L("Phase 3a: エンティティー抽出", "Phase 3a: Entity extraction"),
      description:
        "LLM が各 TextUnit からエンティティー（人物・組織・場所・概念など）を抽出します。各エンティティーはタイトル・タイプ・説明を持ちます。",
      descriptionEn:
        "The LLM extracts entities (people, organizations, locations, concepts) from each TextUnit; every entity has a title, type, and description.",
      textUnits: textUnits([false, false, false]),
      entities: plainEntities,
      relationships: [],
      communities: [],
      communityReports: [],
      activePhase: 2,
    },
    // Step 3: Relationship extraction
    {
      phase: L("Phase 3a: 関係性抽出", "Phase 3a: Relationship extraction"),
      description:
        "エンティティー間の関係性を、ソース→ターゲットと説明を持つエッジとして抽出します。同じペアの説明が複数の TextUnit から得られた場合はマージします。",
      descriptionEn:
        "Relationships between entities are extracted as source→target edges with descriptions. Descriptions of the same pair from several TextUnits are merged.",
      textUnits: textUnits([false, false, false]),
      entities: plainEntities,
      relationships,
      communities: [],
      communityReports: [],
      activePhase: 2,
    },
    // Step 4: Community detection
    {
      phase: L("Phase 4: コミュニティー検出", "Phase 4: Community detection"),
      description:
        "Leiden アルゴリズムで階層的にコミュニティーを検出します。グラフを意味的なクラスターに分け、各エンティティーをいずれかのコミュニティーに割り当てます（図では色で表示）。",
      descriptionEn:
        "The Leiden algorithm detects a hierarchy of communities, partitioning the graph into semantic clusters and assigning each entity to a community (shown by color).",
      textUnits: textUnits([false, false, false]),
      entities: clusteredEntities,
      relationships,
      communities,
      communityReports: [],
      activePhase: 3,
    },
    // Step 5: Community summarization
    {
      phase: L("Phase 5: コミュニティー要約", "Phase 5: Community summarization"),
      description:
        "LLM が各コミュニティーの内容を要約し、コミュニティーレポートを生成します。レポートは階層の各レベルで作られ、粗いレベルほど広いテーマを扱います。",
      descriptionEn:
        "The LLM summarizes each community into a community report. Reports are generated at every level of the hierarchy; coarser levels cover broader themes.",
      textUnits: textUnits([false, false, false]),
      entities: clusteredEntities,
      relationships,
      communities,
      communityReports,
      activePhase: 4,
    },
    // Step 6: Global Search
    {
      phase: "Query: Global Search",
      description:
        "「データ全体の主要テーマは？」のような俯瞰的な質問に対し、コミュニティーレポートを Map-Reduce 方式で集約して回答を生成します。",
      descriptionEn:
        'For holistic questions like "What are the main themes?", community reports are aggregated via Map-Reduce to generate an answer.',
      textUnits: textUnits([false, false, false]),
      entities: clusteredEntities,
      relationships,
      communities,
      communityReports,
      activePhase: 5,
      queryMode: "global",
      queryText: L("データ全体の主要テーマは？", "What are the main themes in the data?"),
      queryResult: L(
        "主要テーマ: 1) 大学での AI 研究 2) 産業界との共同研究 3) グラフベース検索の技術基盤",
        "Main themes: 1) AI research at a university 2) collaboration with industry 3) the technical foundation of graph-based retrieval",
      ),
    },
    // Step 7: Local Search
    {
      phase: "Query: Local Search",
      description:
        "「Alice の研究内容は？」のような特定エンティティーに関する質問に対し、知識グラフ上でそのエンティティーを起点に、関連するエンティティー・関係性・TextUnit を集めて回答します。",
      descriptionEn:
        'For entity-specific questions like "What does Alice research?", the system fans out from the entity in the knowledge graph, collecting related entities, relationships, and TextUnits.',
      textUnits: textUnits([true, true, false]),
      entities: clusteredEntities,
      relationships,
      communities,
      communityReports,
      activePhase: 5,
      queryMode: "local",
      queryText: L("Alice の研究内容は？", "What does Alice research?"),
      queryResult: L(
        "Alice は東京大学で AI 研究を行い、GraphRAG プロジェクトを主導。Bob と共同研究を行っている。",
        "Alice does AI research at the University of Tokyo, leads the GraphRAG project, and collaborates with Bob.",
      ),
    },
  ];

  return steps;
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function GraphRAGPipelineVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const steps = buildScenario(isJa);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2500 });
  const current = steps[player.step];

  const phaseLabels = [
    isJa ? "入力" : "Input",
    isJa ? "TextUnit 分割" : "Chunking",
    isJa ? "グラフ抽出" : "Graph Extraction",
    isJa ? "コミュニティー検出" : "Community Detection",
    isJa ? "コミュニティー要約" : "Community Summarization",
    isJa ? "クエリー" : "Query",
  ];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "GraphRAG のインデキシングとクエリー"
          : "GraphRAG Indexing and Querying"
      }
      description={
        isJa
          ? "3 つの短い文書を例に、インデキシング（Phase 2 と 6 は省略）から Global Search と Local Search による回答までを順に示します。"
          : "Follows three short documents through indexing (Phases 2 and 6 omitted) to answers from Global Search and Local Search."
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
                  ? "エンティティー未抽出"
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
                {isJa ? "コミュニティー" : "Communities"} (
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
                {isJa ? "コミュニティーレポート" : "Community Reports"}
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
        ariaLabels={stepPlayerAriaLabels(locale)}
      />
    </InteractiveDemo>
  );
}
