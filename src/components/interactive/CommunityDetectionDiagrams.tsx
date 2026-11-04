"use client";

import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// ── Timeline of Community Detection Research ────────────────

const timelineData = [
  {
    year: "1933",
    titleJa: "社会ネットワーク分析の萌芽",
    titleEn: "Social Network Analysis Begins",
    descJa:
      "Moreno がソシオグラムを発表。人間関係をグラフとして描いた最初期の例。",
    descEn:
      "Moreno presents the sociogram, one of the earliest drawings of human relationships as a graph.",
    color: "#94a3b8",
  },
  {
    year: "1970",
    titleJa: "グラフ分割問題",
    titleEn: "Graph Partitioning",
    descJa:
      "Kernighan-Lin アルゴリズム。回路設計のため、グラフを同じ大きさの 2 つに分け、カット辺が減るようにノードの交換を繰り返す。",
    descEn:
      "Kernighan-Lin algorithm. For circuit design, splits a graph into two equal-sized halves and swaps nodes to reduce the cut edges.",
    color: "#64748b",
  },
  {
    year: "2002",
    titleJa: "Girvan-Newman",
    titleEn: "Girvan-Newman",
    descJa:
      "辺媒介中心性（Edge Betweenness）が最大の辺（多くはコミュニティー間の橋）を順に取り除いてグラフを分けるトップダウン法。",
    descEn:
      "Top-down method that splits the graph by repeatedly removing the edge with the highest edge betweenness, typically a bridge between communities.",
    color: "#3b82f6",
  },
  {
    year: "2004",
    titleJa: "Modularity Q の定式化",
    titleEn: "Modularity Q Formalized",
    descJa:
      "Newman & Girvan が Modularity Q を定義。コミュニティー分割の良さを測る定量的な基準になる。",
    descEn:
      "Newman & Girvan define Modularity Q, a quantitative criterion for how good a community partition is.",
    color: "#10b981",
  },
  {
    year: "2007",
    titleJa: "Resolution Limit 発見",
    titleEn: "Resolution Limit Discovered",
    descJa:
      "Fortunato & Barthélemy が Modularity の Resolution Limit を発見。大きなグラフでは、小さなコミュニティーが Modularity 最適化で隣のコミュニティーと統合され得る。",
    descEn:
      "Fortunato & Barthélemy discover the resolution limit: in a large graph, Modularity optimization can merge small communities with their neighbors.",
    color: "#f59e0b",
  },
  {
    year: "2008",
    titleJa: "NP 困難性の証明",
    titleEn: "NP-Hardness Proved",
    descJa:
      "Brandes らが Modularity 最大化の NP 困難性を証明（IEEE TKDE 掲載）。P ≠ NP なら、最適解を効率的に求めるアルゴリズムはない。",
    descEn:
      "Brandes et al. prove that Modularity maximization is NP-hard (published in IEEE TKDE). Assuming P ≠ NP, no efficient algorithm finds the optimum.",
    color: "#ef4444",
  },
  {
    year: "2008",
    titleJa: "Louvain アルゴリズム",
    titleEn: "Louvain Algorithm",
    descJa:
      "Blondel らが提案した貪欲法。局所移動と集約を繰り返す。原論文では 1 億 1800 万ノードの Web グラフに適用。事実上の標準に。",
    descEn:
      "Blondel et al.'s greedy method. Alternates local moving and aggregation; the original paper applied it to a web graph with 118 million nodes. Became the de facto standard.",
    color: "#8b5cf6",
  },
  {
    year: "2008",
    titleJa: "LFR ベンチマーク",
    titleEn: "LFR Benchmark",
    descJa:
      "Lancichinetti-Fortunato-Radicchi ベンチマーク。次数とコミュニティーサイズがべき乗則に従う合成グラフを生成し、アルゴリズム評価の標準になる。",
    descEn:
      "Lancichinetti-Fortunato-Radicchi benchmark. Generates synthetic graphs whose degrees and community sizes follow power laws; became a standard for evaluating algorithms.",
    color: "#06b6d4",
  },
  {
    year: "2011",
    titleJa: "Stochastic Block Model の復権",
    titleEn: "SBM Revival",
    descJa:
      "Karrer & Newman が Degree-Corrected SBM を提案。統計的推論に基づくコミュニティー検出が盛んに。",
    descEn:
      "Karrer & Newman propose the Degree-Corrected SBM. Statistical inference-based detection gains momentum.",
    color: "#ec4899",
  },
  {
    year: "2011",
    titleJa: "検出限界の導出",
    titleEn: "Detectability Threshold",
    descJa:
      "Decelle らが cavity 法で検出限界の閾値を導き、コミュニティーが原理的に検出できなくなる相転移を予想（証明は 2014–2018 年に発表）。",
    descEn:
      "Decelle et al. derive the detectability threshold with the cavity method, conjecturing a phase transition below which communities cannot be detected (proofs were published in 2014–2018).",
    color: "#f97316",
  },
  {
    year: "2019",
    titleJa: "Leiden アルゴリズム",
    titleEn: "Leiden Algorithm",
    descJa:
      "Traag らが Louvain の欠陥（非連結なコミュニティー）を修正。各反復後のコミュニティーが内部で連結であることを保証。",
    descEn:
      "Traag et al. fix Louvain's flaw (disconnected communities). Guarantees that communities are internally connected after each iteration.",
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
          ? "1933 年のソシオグラムから 2019 年の Leiden アルゴリズムまでの主要なマイルストーン"
          : "Key milestones from Moreno's sociogram (1933) to the Leiden algorithm (2019)"
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
    approach: { ja: "貪欲な Modularity 最適化", en: "Greedy Modularity optimization" },
    complexity: "≈ O(m)",
    scalability: "★★★★★",
    overlapping: false,
    strengths: { ja: "高速、大規模グラフ対応", en: "Fast, scales to large graphs" },
    weaknesses: { ja: "非連結コミュニティーの可能性", en: "May produce disconnected communities" },
  },
  {
    name: "Leiden",
    year: 2019,
    approach: { ja: "改良 Louvain + 精錬フェーズ", en: "Improved Louvain + refinement" },
    complexity: "≈ O(m)",
    scalability: "★★★★★",
    overlapping: false,
    strengths: { ja: "連結性を保証、Modularity も高い", en: "Guaranteed connectivity, high Modularity" },
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
    approach: { ja: "ランダムウォークの圧縮（Map Equation）", en: "Random walk compression (Map Equation)" },
    complexity: "O(m)",
    scalability: "★★★★☆",
    overlapping: false,
    strengths: { ja: "情報理論に基づく、フロー構造を捉える", en: "Information-theoretic, captures flow" },
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
    name: "SBM",
    year: 2011,
    approach: { ja: "確率的ブロックモデル推論", en: "Stochastic Block Model inference" },
    complexity: "O(n log²n)",
    scalability: "★★★☆☆",
    overlapping: false,
    strengths: { ja: "モデル選択で k や構造の有無も推論", en: "Model selection infers k and whether structure exists" },
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
                {isJa ? "大規模対応" : "Scalability"}
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
          ? "実際のコミュニティー内辺数と、ランダムに辺を張り直した場合の期待値を比較"
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
            <strong>Modularity Q</strong> = (コミュニティー内辺の割合) − (ランダムに辺を張った場合の期待割合)。Q が高いほど、コミュニティー内の結合がランダムな場合より密であることを示します。理論上の範囲は [-0.5, 1] で、コミュニティー構造がはっきりしたネットワークでは 0.3〜0.7 が典型的です（Newman &amp; Girvan, 2004）。
          </>
        ) : (
          <>
            <strong>Modularity Q</strong> = (fraction of intra-community edges) − (expected fraction under random rewiring).
            Higher Q means the connections inside communities are denser than random wiring would make them.
            The theoretical range is [-0.5, 1]; networks with strong community structure typically score 0.3–0.7 (Newman &amp; Girvan, 2004).
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
          ? "Fortunato & Barthélemy (2007): Modularity 最大化は小さなコミュニティーを見落とすことがある"
          : "Fortunato & Barthélemy (2007): Modularity maximization can miss small communities"
      }
    >
      <div className="space-y-4">
        <svg viewBox="0 0 560 160" className="w-full h-auto">
          {/* Large community (left) */}
          <ellipse cx="140" cy="80" rx="120" ry="65" fill="#3b82f6" fillOpacity={0.08} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x="140" y="30" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight={600}>
            {isJa ? "大規模コミュニティー" : "Large community"}
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
            {isJa ? "誤って統合" : "Incorrectly merged"}
          </text>
        </svg>

        <div className="p-3 rounded-lg bg-muted/80 text-xs text-muted-foreground leading-relaxed">
          {isJa ? (
            <>
              グラフ全体の辺数 <em>m</em> が大きいと、Modularity Q の最適解では、内部辺が約 √(m/2)
              本未満の小さなクリークが、明確なコミュニティーであっても隣のクリークと統合され得ます。
              <strong>グラフが大きいほど小さなコミュニティーを区別しにくくなる</strong>のが
              Resolution Limit です。
            </>
          ) : (
            <>
              When the total number of edges <em>m</em> is large, the Modularity-optimal partition can merge
              a small clique with fewer than about √(m/2) internal edges into a neighboring clique, even though each clique is a clear community.{" "}
              <strong>The larger the graph, the harder it is to separate small communities</strong>: this is the resolution limit.
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
          ? "コミュニティー構造が原理的に検出不可能になる情報理論的限界"
          : "The information-theoretic limit below which community structure is fundamentally undetectable"
      }
    >
      <svg viewBox="0 0 500 220" className="w-full h-auto">
        {/* Axes */}
        <line x1="60" y1="180" x2="460" y2="180" stroke="currentColor" strokeWidth={1.5} />
        <line x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth={1.5} />

        {/* X-axis label */}
        <text x="260" y="210" textAnchor="middle" fill="currentColor" fontSize="11">
          {isJa ? "コミュニティー内外の辺確率の差 (c_in − c_out)" : "Difference in edge probability (c_in − c_out)"}
        </text>

        {/* Y-axis label */}
        <text x="20" y="100" textAnchor="middle" fill="currentColor" fontSize="11" transform="rotate(-90, 20, 100)">
          {isJa ? "ランダムを上回る精度" : "Accuracy above chance"}
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
            同じ大きさの 2 コミュニティーからなる SBM で、コミュニティー内・間の辺確率をそれぞれ{" "}
            <em>c<sub>in</sub></em>/<em>n</em>、<em>c<sub>out</sub></em>/<em>n</em> とします。<em>n</em> が十分大きく
            (c<sub>in</sub> − c<sub>out</sub>)² &lt; 2(c<sub>in</sub> + c<sub>out</sub>) のとき、<strong>どのアルゴリズムでもランダムな割り当てよりうまく検出できません</strong>。この閾値は
            Decelle ら (2011) が cavity 法で予想し、Mossel, Neeman &amp; Sly (2015, 2018) と Massoulié (2014) が証明しました。曲線は、平均次数を固定したときに閾値で起こる相転移の模式図です。
          </>
        ) : (
          <>
            Take an SBM with two equal-sized communities and edge probabilities{" "}
            <em>c<sub>in</sub></em>/<em>n</em> within and <em>c<sub>out</sub></em>/<em>n</em> between communities.
            For large <em>n</em>, when (c<sub>in</sub> − c<sub>out</sub>)² &lt; 2(c<sub>in</sub> + c<sub>out</sub>),{" "}
            <strong>no algorithm can detect the communities better than a random assignment</strong>.
            Decelle et al. (2011) conjectured this threshold with the cavity method; Mossel, Neeman &amp; Sly (2015, 2018)
            and Massoulié (2014) proved it. The curve sketches the resulting phase transition at a fixed average degree.
          </>
        )}
      </div>
    </InteractiveDemo>
  );
}
