"use client";

import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// ── Timeline of Community Detection Research ────────────────

const timelineData = [
  {
    year: "1927",
    titleJa: "社会ネットワーク分析の萌芽",
    titleEn: "Social Network Analysis Begins",
    descJa:
      "Moreno がソシオグラムを考案。人間関係を「グラフ」として可視化する試みが始まる。",
    descEn:
      "Moreno invents the sociogram — the first attempt to visualize human relationships as graphs.",
    color: "#94a3b8",
  },
  {
    year: "1970",
    titleJa: "グラフ分割問題",
    titleEn: "Graph Partitioning",
    descJa:
      "Kernighan-Lin アルゴリズム (1970)。回路設計の最適化のためにグラフの 2 分割を反復改善する手法。均等分割が前提。",
    descEn:
      "Kernighan-Lin algorithm (1970). Iteratively improves a bisection of a graph for circuit design. Assumes balanced partition.",
    color: "#64748b",
  },
  {
    year: "2002",
    titleJa: "Girvan-Newman",
    titleEn: "Girvan-Newman",
    descJa:
      "辺媒介中心性（Edge Betweenness）に基づくトップダウン法。社会ネットワーク分析に革命をもたらした手法。",
    descEn:
      "Top-down method based on edge betweenness centrality. Revolutionized social network analysis.",
    color: "#3b82f6",
  },
  {
    year: "2004",
    titleJa: "Modularity Q の定式化",
    titleEn: "Modularity Q Formalized",
    descJa:
      "Newman & Girvan がモジュラリティ Q を定義。「良いコミュニティ分割」の定量的基準が確立。",
    descEn:
      "Newman & Girvan define Modularity Q — establishing a quantitative criterion for good community structure.",
    color: "#10b981",
  },
  {
    year: "2008",
    titleJa: "NP困難性の証明",
    titleEn: "NP-Hardness Proved",
    descJa:
      "Brandes らがモジュラリティ最大化の NP 困難性を証明（IEEE TKDE掲載）。厳密解は大規模グラフでは事実上不可能に。",
    descEn:
      "Brandes et al. prove modularity maximization is NP-hard (published in IEEE TKDE). Exact solutions intractable for large graphs.",
    color: "#ef4444",
  },
  {
    year: "2007",
    titleJa: "Resolution Limit 発見",
    titleEn: "Resolution Limit Discovered",
    descJa:
      "Fortunato & Barthélemy がモジュラリティの解像度限界を発見。グラフのサイズに依存して小さなコミュニティが検出不能になる根本的問題。",
    descEn:
      "Fortunato & Barthélemy discover the resolution limit. Small communities become undetectable depending on graph size.",
    color: "#f59e0b",
  },
  {
    year: "2008",
    titleJa: "Louvain アルゴリズム",
    titleEn: "Louvain Algorithm",
    descJa:
      "Blondel らが提案した貪欲法。局所移動と集約を繰り返し、数百万ノード規模のグラフに適用可能。事実上のスタンダードに。",
    descEn:
      "Blondel et al.'s greedy method. Alternates local moving and aggregation, scaling to millions of nodes. Became the de facto standard.",
    color: "#8b5cf6",
  },
  {
    year: "2009",
    titleJa: "LFR ベンチマーク",
    titleEn: "LFR Benchmark",
    descJa:
      "Lancichinetti-Fortunato-Radicchi ベンチマーク。コミュニティ構造を持つ合成グラフの生成器。アルゴリズム評価の標準ツールに。",
    descEn:
      "Lancichinetti-Fortunato-Radicchi benchmark. Generates synthetic graphs with planted community structure for algorithm evaluation.",
    color: "#06b6d4",
  },
  {
    year: "2011",
    titleJa: "Stochastic Block Model の復権",
    titleEn: "SBM Revival",
    descJa:
      "Karrer & Newman が Degree-Corrected SBM を提案。統計的推論に基づくコミュニティ検出が盛んに。",
    descEn:
      "Karrer & Newman propose Degree-Corrected SBM. Statistical inference-based detection gains momentum.",
    color: "#ec4899",
  },
  {
    year: "2011",
    titleJa: "検出限界の導出",
    titleEn: "Detectability Threshold",
    descJa:
      "Decelle らが cavity 法により検出限界の閾値を導出。コミュニティが原理的に検出不可能になる相転移の存在を示す（厳密証明は 2013–2015 年）。",
    descEn:
      "Decelle et al. derive the detectability threshold via the cavity method, showing a phase transition below which communities are fundamentally undetectable (rigorous proofs followed in 2013–2015).",
    color: "#f97316",
  },
  {
    year: "2019",
    titleJa: "Leiden アルゴリズム",
    titleEn: "Leiden Algorithm",
    descJa:
      "Traag らが Louvain の欠陥（disconnected communities）を修正。品質保証付きの改良版。",
    descEn:
      "Traag et al. fix Louvain's flaw (disconnected communities). An improved version with quality guarantees.",
    color: "#3b82f6",
  },
];

export function CommunityDetectionTimeline({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "Community Detection 研究の歴史" : "History of Community Detection Research"}
      description={
        isJa
          ? "1927 年のソシオグラムから 2019 年の Leiden アルゴリズムまでの主要なマイルストーン"
          : "Key milestones from Moreno's sociogram (1927) to the Leiden algorithm (2019)"
      }
    >
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {timelineData.map((item, i) => (
            <div key={i} className="flex gap-4 items-start">
              {/* Year badge */}
              <div
                className="shrink-0 w-[44px] text-right text-xs font-mono font-bold mt-1"
                style={{ color: item.color }}
              >
                {item.year}
              </div>
              {/* Dot */}
              <div className="relative shrink-0 mt-2">
                <div
                  className="w-3 h-3 rounded-full border-2 bg-background"
                  style={{ borderColor: item.color }}
                />
              </div>
              {/* Content */}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {isJa ? item.titleJa : item.titleEn}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isJa ? item.descJa : item.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InteractiveDemo>
  );
}

// ── Algorithm Comparison Table ──────────────────────────────

const algorithms = [
  {
    name: "Girvan-Newman",
    year: 2002,
    approach: { ja: "辺媒介中心性（除去）", en: "Edge betweenness (removal)" },
    complexity: "O(m²n)",
    scalability: "★☆☆☆☆",
    overlapping: false,
    strengths: { ja: "直感的、階層的デンドログラム", en: "Intuitive, hierarchical dendrogram" },
    weaknesses: { ja: "大規模グラフに不向き", en: "Does not scale to large graphs" },
  },
  {
    name: "Louvain",
    year: 2008,
    approach: { ja: "貪欲モジュラリティ最適化", en: "Greedy modularity optimization" },
    complexity: "O(n log n)",
    scalability: "★★★★★",
    overlapping: false,
    strengths: { ja: "高速、大規模グラフ対応", en: "Fast, scales to large graphs" },
    weaknesses: { ja: "非連結コミュニティの可能性", en: "May produce disconnected communities" },
  },
  {
    name: "Leiden",
    year: 2019,
    approach: { ja: "改良 Louvain + 精錬フェーズ", en: "Improved Louvain + refinement" },
    complexity: "O(n log n)",
    scalability: "★★★★★",
    overlapping: false,
    strengths: { ja: "連結保証、高品質", en: "Connectivity guarantee, high quality" },
    weaknesses: { ja: "実装が複雑", en: "More complex implementation" },
  },
  {
    name: "Label Propagation",
    year: 2007,
    approach: { ja: "近傍ラベルの多数決伝播", en: "Majority-vote label spreading" },
    complexity: "O(m)",
    scalability: "★★★★★",
    overlapping: false,
    strengths: { ja: "最速の手法の一つ", en: "One of the fastest methods" },
    weaknesses: { ja: "非決定的、不安定", en: "Non-deterministic, unstable" },
  },
  {
    name: "Infomap",
    year: 2008,
    approach: { ja: "ランダムウォーク圧縮", en: "Random walk compression (map equation)" },
    complexity: "O(m)",
    scalability: "★★★★☆",
    overlapping: false,
    strengths: { ja: "情報量基準、フロー構造を捉える", en: "Information-theoretic, captures flow" },
    weaknesses: { ja: "有向グラフ前提が強い", en: "Strongly favors directed flow" },
  },
  {
    name: "Spectral Clustering",
    year: "~2000",
    approach: { ja: "ラプラシアン固有ベクトル", en: "Laplacian eigenvectors" },
    complexity: "O(n³)",
    scalability: "★★☆☆☆",
    overlapping: false,
    strengths: { ja: "理論的基盤が強固", en: "Strong theoretical foundation" },
    weaknesses: { ja: "k の事前指定が必要", en: "Requires pre-specified k" },
  },
  {
    name: "SBM (統計的推論)",
    year: 2011,
    approach: { ja: "確率的ブロックモデル推論", en: "Stochastic Block Model inference" },
    complexity: "O(n log²n)",
    scalability: "★★★☆☆",
    overlapping: false,
    strengths: { ja: "モデル選択、検出限界を尊重", en: "Model selection, respects detectability" },
    weaknesses: { ja: "モデル仮定に依存", en: "Depends on model assumptions" },
  },
];

export function AlgorithmComparisonTable({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "主要アルゴリズム比較表" : "Algorithm Comparison Table"}
    >
      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "手法" : "Method"}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "年" : "Year"}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "アプローチ" : "Approach"}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "計算量" : "Complexity"}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "大規模対応" : "Scale"}
              </th>
              <th className="text-left py-2 px-2 font-semibold text-foreground">
                {isJa ? "強み" : "Strengths"}
              </th>
            </tr>
          </thead>
          <tbody>
            {algorithms.map((a, i) => (
              <tr
                key={i}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors"
              >
                <td className="py-2 px-2 font-medium text-foreground whitespace-nowrap">
                  {a.name}
                </td>
                <td className="py-2 px-2 text-muted-foreground">{a.year}</td>
                <td className="py-2 px-2 text-muted-foreground">
                  {isJa ? a.approach.ja : a.approach.en}
                </td>
                <td className="py-2 px-2 font-mono text-muted-foreground">
                  {a.complexity}
                </td>
                <td className="py-2 px-2">{a.scalability}</td>
                <td className="py-2 px-2 text-muted-foreground">
                  {isJa ? a.strengths.ja : a.strengths.en}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

// ── Modularity Concept Diagram ──────────────────────────────

export function ModularityConceptDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={isJa ? "Modularity Q の直感" : "Intuition Behind Modularity Q"}
      description={
        isJa
          ? "実際のコミュニティ内辺数と、ランダムに辺を張り直した場合の期待値を比較"
          : "Compare actual intra-community edges with expected values under a random null model"
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Good partition */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {isJa ? "良い分割 (Q が高い)" : "Good partition (high Q)"}
          </p>
          <svg viewBox="0 0 200 140" className="w-full h-auto">
            {/* Community A hull */}
            <circle cx="65" cy="70" r="50" fill="#10b981" fillOpacity={0.1} stroke="#10b981" strokeWidth={1} strokeDasharray="4,2" />
            {/* Community B hull */}
            <circle cx="140" cy="70" r="50" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={1} strokeDasharray="4,2" />
            {/* Internal edges A */}
            <line x1="45" y1="50" x2="85" y2="50" stroke="#10b981" strokeWidth={2} strokeOpacity={0.6} />
            <line x1="45" y1="50" x2="65" y2="90" stroke="#10b981" strokeWidth={2} strokeOpacity={0.6} />
            <line x1="85" y1="50" x2="65" y2="90" stroke="#10b981" strokeWidth={2} strokeOpacity={0.6} />
            {/* Internal edges B */}
            <line x1="120" y1="50" x2="160" y2="50" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.6} />
            <line x1="120" y1="50" x2="140" y2="90" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.6} />
            <line x1="160" y1="50" x2="140" y2="90" stroke="#3b82f6" strokeWidth={2} strokeOpacity={0.6} />
            {/* Bridge */}
            <line x1="85" y1="50" x2="120" y2="50" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3,2" />
            {/* Nodes A */}
            <circle cx="45" cy="50" r="8" fill="#10b981" />
            <circle cx="85" cy="50" r="8" fill="#10b981" />
            <circle cx="65" cy="90" r="8" fill="#10b981" />
            {/* Nodes B */}
            <circle cx="120" cy="50" r="8" fill="#3b82f6" />
            <circle cx="160" cy="50" r="8" fill="#3b82f6" />
            <circle cx="140" cy="90" r="8" fill="#3b82f6" />
            <text x="100" y="130" textAnchor="middle" fill="currentColor" fontSize="10">
              {isJa ? "内部辺 ≫ 期待値" : "Internal edges ≫ expected"}
            </text>
          </svg>
        </div>

        {/* Bad partition */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {isJa ? "悪い分割 (Q が低い)" : "Bad partition (low Q)"}
          </p>
          <svg viewBox="0 0 200 140" className="w-full h-auto">
            {/* Community A hull */}
            <circle cx="65" cy="70" r="50" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2" />
            {/* Community B hull */}
            <circle cx="140" cy="70" r="50" fill="#f59e0b" fillOpacity={0.1} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4,2" />
            {/* Cross-community edges (many) */}
            <line x1="45" y1="50" x2="120" y2="50" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,2" />
            <line x1="85" y1="50" x2="140" y2="90" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,2" />
            <line x1="65" y1="90" x2="160" y2="50" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3,2" />
            {/* Few internal */}
            <line x1="45" y1="50" x2="65" y2="90" stroke="#ef4444" strokeWidth={2} strokeOpacity={0.4} />
            <line x1="120" y1="50" x2="160" y2="50" stroke="#f59e0b" strokeWidth={2} strokeOpacity={0.4} />
            {/* Nodes (mixed colors = bad partition) */}
            <circle cx="45" cy="50" r="8" fill="#ef4444" />
            <circle cx="85" cy="50" r="8" fill="#ef4444" />
            <circle cx="65" cy="90" r="8" fill="#ef4444" />
            <circle cx="120" cy="50" r="8" fill="#f59e0b" />
            <circle cx="160" cy="50" r="8" fill="#f59e0b" />
            <circle cx="140" cy="90" r="8" fill="#f59e0b" />
            <text x="100" y="130" textAnchor="middle" fill="currentColor" fontSize="10">
              {isJa ? "内部辺 ≈ 期待値" : "Internal edges ≈ expected"}
            </text>
          </svg>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/80 text-xs text-muted-foreground leading-relaxed">
        {isJa ? (
          <>
            <strong>Modularity Q</strong> = (コミュニティ内辺の割合) − (ランダム帰無モデルでの期待値)。
            Q が高いほど、ランダムに比べて「コミュニティ内のつながりが異常に密」であることを意味します。
            範囲は [-0.5, 1] で、0.3〜0.7 が実ネットワークで典型的な値です。
          </>
        ) : (
          <>
            <strong>Modularity Q</strong> = (fraction of intra-community edges) − (expected fraction under a random null model).
            Higher Q means intra-community connectivity is denser than random.
            Range is [-0.5, 1]; real networks typically yield 0.3–0.7.
          </>
        )}
      </div>
    </InteractiveDemo>
  );
}

// ── Resolution Limit Diagram ────────────────────────────────

export function ResolutionLimitDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={isJa ? "Resolution Limit（解像度限界）" : "The Resolution Limit"}
      description={
        isJa
          ? "Fortunato & Barthélemy (2007): モジュラリティ最大化は小さなコミュニティを見落とす"
          : "Fortunato & Barthélemy (2007): Modularity maximization misses small communities"
      }
    >
      <div className="space-y-4">
        <svg viewBox="0 0 560 160" className="w-full h-auto">
          {/* Large community (left) */}
          <ellipse cx="140" cy="80" rx="120" ry="65" fill="#3b82f6" fillOpacity={0.08} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x="140" y="30" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight={600}>
            {isJa ? "大規模コミュニティ" : "Large community"}
          </text>
          {/* nodes in large community */}
          {[[80, 60], [120, 50], [160, 55], [200, 65], [90, 90], [130, 95], [150, 100], [180, 90], [100, 70], [170, 75]].map(([x, y], i) => (
            <circle key={`ln-${i}`} cx={x} cy={y} r={5} fill="#3b82f6" fillOpacity={0.7} />
          ))}

          {/* Two small cliques (right) — should be separate communities */}
          <ellipse cx="380" cy="55" rx="45" ry="35" fill="#10b981" fillOpacity={0.08} stroke="#10b981" strokeWidth={1.5} strokeDasharray="4,2" />
          <ellipse cx="480" cy="55" rx="45" ry="35" fill="#f59e0b" fillOpacity={0.08} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,2" />

          {/* Small clique A */}
          {[[365, 45], [380, 65], [395, 45]].map(([x, y], i) => (
            <circle key={`sa-${i}`} cx={x} cy={y} r={5} fill="#10b981" fillOpacity={0.7} />
          ))}
          <line x1="365" y1="45" x2="395" y2="45" stroke="#10b981" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1="365" y1="45" x2="380" y2="65" stroke="#10b981" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1="395" y1="45" x2="380" y2="65" stroke="#10b981" strokeWidth={1.5} strokeOpacity={0.5} />

          {/* Small clique B */}
          {[[465, 45], [480, 65], [495, 45]].map(([x, y], i) => (
            <circle key={`sb-${i}`} cx={x} cy={y} r={5} fill="#f59e0b" fillOpacity={0.7} />
          ))}
          <line x1="465" y1="45" x2="495" y2="45" stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1="465" y1="45" x2="480" y2="65" stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.5} />
          <line x1="495" y1="45" x2="480" y2="65" stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.5} />

          {/* Bridge between two small cliques */}
          <line x1="395" y1="45" x2="465" y2="45" stroke="#94a3b8" strokeWidth={1.5} />

          {/* Merge arrow */}
          <path d="M 430 90 L 430 110" stroke="#ef4444" strokeWidth={2} markerEnd="url(#arrowRed)" />
          <defs>
            <marker id="arrowRed" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="#ef4444" />
            </marker>
          </defs>

          {/* Merged (wrong) */}
          <ellipse cx="430" cy="135" rx="70" ry="20" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3,2" />
          <text x="430" y="140" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight={600}>
            {isJa ? "誤って統合!" : "Incorrectly merged!"}
          </text>
        </svg>

        <div className="p-3 rounded-lg bg-muted/80 text-xs text-muted-foreground leading-relaxed">
          {isJa ? (
            <>
              グラフ全体の辺数 <em>m</em> が大きくなると、モジュラリティ Q の最適解は
              辺数 &lt; √(2m) 程度の小さなクリークを統合してしまいます。
              つまり、<strong>グラフが大きくなるほど小さな真のコミュニティが「見えなく」なる</strong>
              という根本的な限界があります。これが Resolution Limit です。
            </>
          ) : (
            <>
              As total edges <em>m</em> grows, the modularity-optimal partition merges
              small cliques with fewer than ~√(2m) edges.
              In other words, <strong>the larger the graph, the more small true communities become invisible</strong>.
              This is the Resolution Limit.
            </>
          )}
        </div>
      </div>
    </InteractiveDemo>
  );
}

// ── Detectability Threshold Diagram ─────────────────────────

export function DetectabilityThresholdDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={isJa ? "検出限界（Detectability Threshold）" : "Detectability Threshold"}
      description={
        isJa
          ? "コミュニティ構造が原理的に検出不可能になる情報理論的限界"
          : "The information-theoretic limit below which community structure is fundamentally undetectable"
      }
    >
      <svg viewBox="0 0 500 220" className="w-full h-auto">
        {/* Axes */}
        <line x1="60" y1="180" x2="460" y2="180" stroke="currentColor" strokeWidth={1.5} />
        <line x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth={1.5} />

        {/* X-axis label */}
        <text x="260" y="210" textAnchor="middle" fill="currentColor" fontSize="11">
          {isJa ? "コミュニティ内外の辺密度の差 (c_in - c_out)" : "Difference in edge density (c_in - c_out)"}
        </text>

        {/* Y-axis label */}
        <text x="20" y="100" textAnchor="middle" fill="currentColor" fontSize="11" transform="rotate(-90, 20, 100)">
          {isJa ? "検出精度" : "Detection accuracy"}
        </text>

        {/* Threshold line */}
        <line x1="200" y1="20" x2="200" y2="180" stroke="#ef4444" strokeWidth={2} strokeDasharray="6,3" />
        <text x="200" y="15" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight={600}>
          {isJa ? "検出限界" : "Threshold"}
        </text>

        {/* Undetectable region */}
        <rect x="60" y="20" width="140" height="160" fill="#ef4444" fillOpacity={0.05} />
        <text x="130" y="100" textAnchor="middle" fill="#ef4444" fontSize="10" fillOpacity={0.7}>
          {isJa ? "検出不可能" : "Undetectable"}
        </text>

        {/* Detectable region */}
        <rect x="200" y="20" width="260" height="160" fill="#10b981" fillOpacity={0.05} />
        <text x="350" y="60" textAnchor="middle" fill="#10b981" fontSize="10" fillOpacity={0.7}>
          {isJa ? "検出可能" : "Detectable"}
        </text>

        {/* Phase transition curve */}
        <path
          d="M 60 170 Q 130 168, 190 165 Q 200 160, 210 130 Q 230 80, 280 50 Q 350 35, 460 30"
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2.5}
        />

        {/* Annotations */}
        <text x="320" y="45" fill="#3b82f6" fontSize="9">
          {isJa ? "最適アルゴリズム" : "Optimal algorithm"}
        </text>
      </svg>

      <div className="mt-3 p-3 rounded-lg bg-muted/80 text-xs text-muted-foreground leading-relaxed">
        {isJa ? (
          <>
            SBM において、コミュニティ内の平均次数を <em>c<sub>in</sub></em>、
            コミュニティ間の平均次数を <em>c<sub>out</sub></em> とすると、
            (c<sub>in</sub> − c<sub>out</sub>)² &lt; 2(c<sub>in</sub> + c<sub>out</sub>) のとき、
            <strong>いかなるアルゴリズムでもコミュニティをランダムよりうまく検出できない</strong>ことが
            証明されています（Decelle et al., 2011）。これは物理学の「相転移」と深い関係があります。
          </>
        ) : (
          <>
            In the SBM, let <em>c<sub>in</sub></em> be the average intra-community degree and{" "}
            <em>c<sub>out</sub></em> the inter-community degree. When
            (c<sub>in</sub> − c<sub>out</sub>)² &lt; 2(c<sub>in</sub> + c<sub>out</sub>),{" "}
            <strong>no algorithm can detect communities better than random</strong>{" "}
            (Decelle et al., 2011). This is deeply connected to phase transitions in physics.
          </>
        )}
      </div>
    </InteractiveDemo>
  );
}
