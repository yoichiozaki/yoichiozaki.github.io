"use client";

import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// ── Edge Density vs Triangle Density Diagram ────────────────

export function EdgeVsTriangleDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  // Graph A: 6 nodes, 9 edges, 4 triangles (two overlapping triangles sharing an edge, forming K4-like structure)
  // Layout: two triangles sharing edge 1-2, plus triangle 4-5-0 bridging
  const graphA = {
    nodes: [
      { x: 30, y: 25, id: 0 },
      { x: 70, y: 15, id: 1 },
      { x: 70, y: 55, id: 2 },
      { x: 110, y: 35, id: 3 },
      { x: 30, y: 65, id: 4 },
      { x: 70, y: 80, id: 5 },
    ],
    edges: [
      // Triangle {0,1,2}
      [0, 1], [1, 2], [0, 2],
      // Triangle {1,2,3}
      [1, 3], [2, 3],
      // Triangle {0,4,2} - shared edge 0-2
      [0, 4], [4, 2],
      // extra edges to reach 9
      [4, 5], [2, 5],
    ] as [number, number][],
    triangles: [
      [0, 1, 2],
      [1, 2, 3],
      [0, 2, 4],
      [2, 4, 5],
    ],
  };
  // Graph B: 6 nodes, 9 edges, 0 triangles — K_{3,3} complete bipartite graph
  // Partition: {0,2,4} and {1,3,5}. Bipartite graphs have no odd cycles, so 0 triangles.
  const graphB = {
    nodes: [
      { x: 30, y: 25, id: 0 },
      { x: 70, y: 25, id: 1 },
      { x: 110, y: 25, id: 2 },
      { x: 30, y: 65, id: 3 },
      { x: 70, y: 65, id: 4 },
      { x: 110, y: 65, id: 5 },
    ],
    edges: [
      // Every node in {0,1,2} connects to every node in {3,4,5}
      [0, 3], [0, 4], [0, 5],
      [1, 3], [1, 4], [1, 5],
      [2, 3], [2, 4], [2, 5],
    ] as [number, number][],
    triangles: [] as number[][],
  };

  const renderGraph = (
    g: typeof graphA,
    label: string,
    triCount: number,
    color: string,
    offsetX: number
  ) => (
    <g>
      {/* Triangle fills */}
      {g.triangles.map((tri, ti) => {
        const [a, b, c] = tri;
        const na = g.nodes[a];
        const nb = g.nodes[b];
        const nc = g.nodes[c];
        return (
          <polygon
            key={`tri-${ti}`}
            points={`${na.x + offsetX},${na.y} ${nb.x + offsetX},${nb.y} ${nc.x + offsetX},${nc.y}`}
            fill="#fbbf24"
            fillOpacity={0.18}
            stroke="#f59e0b"
            strokeWidth={1}
            strokeOpacity={0.3}
          />
        );
      })}
      {/* Edges */}
      {g.edges.map(([s, t], ei) => (
        <line
          key={`e-${ei}`}
          x1={g.nodes[s].x + offsetX}
          y1={g.nodes[s].y}
          x2={g.nodes[t].x + offsetX}
          y2={g.nodes[t].y}
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.5}
        />
      ))}
      {/* Nodes */}
      {g.nodes.map((n) => (
        <circle
          key={`n-${n.id}`}
          cx={n.x + offsetX}
          cy={n.y}
          r={7}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
      {/* Label */}
      <text
        x={70 + offsetX}
        y={103}
        textAnchor="middle"
        className="text-xs font-bold fill-neutral-700 dark:fill-neutral-200"
      >
        {label}
      </text>
      <text
        x={70 + offsetX}
        y={116}
        textAnchor="middle"
        className="text-[10px] fill-neutral-500 dark:fill-neutral-400"
      >
        {isJa
          ? `6 ノード・9 辺・三角形 ${triCount} 個`
          : `6 nodes · 9 edges · ${triCount} triangles`}
      </text>
    </g>
  );

  return (
    <InteractiveDemo
      title={
        isJa
          ? "辺密度 vs 三角形密度 — 同じ辺密度でも構造は異なる"
          : "Edge Density vs Triangle Density — Same Edge Count, Different Structure"
      }
      description={
        isJa
          ? "グラフ A と B はノード数・辺数が同じですが、A は全ての辺が三角形に含まれ、B には三角形が 1 つもありません。辺密度だけではこの違いを区別できません。"
          : "Graphs A and B have the same numbers of nodes and edges, but every edge of A lies in a triangle, while B has no triangles at all. Edge density alone cannot tell them apart."
      }
    >
      <svg
        viewBox="0 0 310 125"
        className="w-full h-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
      >
        {renderGraph(graphA, isJa ? "グラフ A" : "Graph A", 4, "#3b82f6", 5)}
        {/* Divider */}
        <line
          x1={155}
          y1={5}
          x2={155}
          y2={120}
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="4 3"
          className="dark:stroke-neutral-600"
        />
        <text
          x={155}
          y={50}
          textAnchor="middle"
          className="text-[10px] fill-neutral-400 dark:fill-neutral-500"
        >
          vs
        </text>
        {renderGraph(graphB, isJa ? "グラフ B" : "Graph B", 0, "#ef4444", 165)}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5 text-xs text-blue-800 dark:text-blue-300">
          <span className="font-bold">
            {isJa ? "グラフ A" : "Graph A"}
          </span>
          <span className="mx-1">—</span>
          {isJa
            ? "全ての辺が三角形に含まれる。三角形の閉包（triadic closure）による局所的な凝集が強く、「友人の友人は友人」にあたる構造。"
            : "Every edge lies in a triangle. Strong local cohesion from triadic closure ('a friend of a friend is a friend')."}
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2.5 text-xs text-red-800 dark:text-red-300">
          <span className="font-bold">
            {isJa ? "グラフ B" : "Graph B"}
          </span>
          <span className="mx-1">—</span>
          {isJa
            ? "三角形なし。完全二部グラフ K\u{2083},\u{2083} には奇数長のサイクルがないため、同じ辺密度でも三角形を 1 つも持たない。"
            : "No triangles. The complete bipartite graph K\u{2083},\u{2083} has no odd cycles, so despite the same edge density it has no triangles."}
        </div>
      </div>
    </InteractiveDemo>
  );
}

// ── Timeline of Advanced Community Detection Research ────────

const timelineData = [
  {
    year: "2005",
    titleJa: "Palla — CPM（重複コミュニティー）",
    titleEn: "Palla — CPM (Overlapping)",
    descJa:
      "Palla らが Clique Percolation Method (CPM) を提案。隣接する k-クリークの連鎖でコミュニティーを定義し、重複コミュニティーも検出できる初期の代表的手法。",
    descEn:
      "Palla et al. propose the Clique Percolation Method (CPM), an early representative method that defines communities as chains of adjacent k-cliques and can detect overlapping communities.",
    color: "#3b82f6",
  },
  {
    year: "2010",
    titleJa: "Ahn — リンクコミュニティー",
    titleEn: "Ahn — Link Communities",
    descJa:
      "Ahn, Bagrow, Lehmann がノードではなくリンク（辺）をクラスタリングする手法を提案。辺が複数のコミュニティーに分かれるノードは、その全てに属する。",
    descEn:
      "Ahn, Bagrow & Lehmann propose clustering links (edges) rather than nodes. A node whose links fall into several communities belongs to all of them.",
    color: "#10b981",
  },
  {
    year: "2010",
    titleJa: "Mucha — 多重・時間依存ネットワーク",
    titleEn: "Mucha — Multislice Networks",
    descJa:
      "Mucha らが時間依存・マルチスケール・多重ネットワークのコミュニティー検出を、Modularity の拡張（Multislice Modularity）として統一的に定式化（Science 掲載）。",
    descEn:
      "Mucha et al. unify community detection in time-dependent, multiscale, and multiplex networks with Multislice Modularity, a generalization of Modularity (published in Science).",
    color: "#8b5cf6",
  },
  {
    year: "2013",
    titleJa: "De Domenico — テンソルフレームワーク",
    titleEn: "De Domenico — Tensor Framework",
    descJa:
      "De Domenico らが多重ネットワークのテンソル的定式化を提案。レイヤー間の結合を明示的に扱う数学的枠組み。",
    descEn:
      "De Domenico et al. propose a tensorial framework for multiplex networks, explicitly handling inter-layer coupling.",
    color: "#f59e0b",
  },
  {
    year: "2013",
    titleJa: "Yang & Leskovec — BigCLAM",
    titleEn: "Yang & Leskovec — BigCLAM",
    descJa:
      "大規模ネットワークにおける重複コミュニティー検出。非負行列分解に基づくスケーラブルな手法。",
    descEn:
      "Scalable overlapping community detection for large networks using non-negative matrix factorization.",
    color: "#ef4444",
  },
  {
    year: "2014",
    titleJa: "Gauvin — 非負テンソル因子分解",
    titleEn: "Gauvin — Non-Negative Tensor Factorization",
    descJa:
      "Gauvin らが対面接触ネットワークに非負テンソル因子分解 (NTF) を適用し、コミュニティーのメンバーシップと時間的な活動パターンを同時に推定。",
    descEn:
      "Gauvin et al. apply non-negative tensor factorization (NTF) to face-to-face contact networks, estimating community membership and temporal activity patterns together.",
    color: "#06b6d4",
  },
  {
    year: "2016",
    titleJa: "Benson — 高次モチーフ",
    titleEn: "Benson — Higher-Order Motifs",
    descJa:
      "Benson, Gleich, Leskovec がモチーフの密度に基づくコミュニティー検出を提案（Science 掲載）。辺だけでなく三角形などの部分グラフパターンを考慮。",
    descEn:
      "Benson, Gleich & Leskovec propose motif-based community detection (published in Science). Considers subgraph patterns like triangles, not just edges.",
    color: "#ec4899",
  },
  {
    year: "2016",
    titleJa: "Benson — モチーフ版 Cheeger 不等式",
    titleEn: "Benson — Motif Cheeger Inequality",
    descJa:
      "同じ論文で、モチーフ重み付きラプラシアンによるスペクトラル法に Cheeger 不等式の類似物を証明。三角形などアンカーが 3 ノードのモチーフで成り立ち、得られる分割の質に保証を与える。",
    descEn:
      "The same paper proves a Cheeger-like inequality for spectral clustering with the motif-weighted Laplacian. It holds for motifs with three anchor nodes, such as triangles, and bounds the quality of the resulting partition.",
    color: "#ec4899",
  },
  {
    year: "2019",
    titleJa: "Rossetti — CDlib",
    titleEn: "Rossetti — CDlib",
    descJa:
      "Rossetti, Milli, Cazabet が Python ライブラリー CDlib を発表。重複コミュニティー用を含む多数の検出アルゴリズムと、結果の評価・比較・可視化の機能をまとめて提供。",
    descEn:
      "Rossetti, Milli & Cazabet release CDlib, a Python library that bundles many detection algorithms, including overlapping ones, with tools to evaluate, compare, and visualize the results.",
    color: "#10b981",
  },
  {
    year: "2021",
    titleJa: "Magnani — 多重ネットワークのサーベイ",
    titleEn: "Magnani — Multiplex Survey",
    descJa:
      "Magnani, Hanteer, Interdonato, Rossi, Tagarelli のサーベイ（ACM Computing Surveys）。多重ネットワークの手法を、レイヤーの扱い方でフラット化・レイヤー単位・多層型に分類。",
    descEn:
      "Survey by Magnani, Hanteer, Interdonato, Rossi & Tagarelli (ACM Computing Surveys) that classifies multiplex methods by how they handle layers: flattening, layer-by-layer, and multilayer.",
    color: "#64748b",
  },
  {
    year: "2023",
    titleJa: "GNN ベース手法の台頭",
    titleEn: "GNN-Based Methods Rise",
    descJa:
      "Graph Neural Network (GNN) を使うコミュニティー検出の研究が増える。例: Modularity を微分可能な形に緩和し、GNN でコミュニティー割り当てを直接予測する DMoN（Tsitsulin ら, JMLR）。",
    descEn:
      "Research on Graph Neural Network (GNN)-based community detection grows; for example, DMoN (Tsitsulin et al., JMLR) relaxes Modularity into a differentiable form and predicts community assignments directly with a GNN.",
    color: "#f97316",
  },
];

export function AdvancedCDTimeline({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={
        isJa
          ? "高次・動的コミュニティー検出の年表"
          : "Timeline: Higher-Order & Dynamic Community Detection"
      }
      description={
        isJa
          ? "2000 年代半ば以降の、重複・高次構造・動的・多重ネットワークを扱うコミュニティー検出の主な研究。"
          : "Key work since the mid-2000s on overlapping, higher-order, dynamic, and multiplex community detection."
      }
    >
      <div className="relative space-y-0 py-4">
        <div className="absolute left-[60px] top-0 bottom-0 w-0.5 bg-neutral-300 dark:bg-neutral-600" />
        {timelineData.map((item, idx) => (
          <div key={idx} className="relative flex items-start gap-4 pl-[80px] py-3">
            <div
              className="absolute left-[52px] top-[18px] h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{ color: item.color }}
                >
                  {item.year}
                </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                  {isJa ? item.titleJa : item.titleEn}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {isJa ? item.descJa : item.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Motif Examples Diagram ──────────────────────────────────

const MOTIF_DATA = [
  {
    nameJa: "三角形 (M₃)",
    nameEn: "Triangle (M₃)",
    descJa: "3 ノードが互いに結ばれた、最も基本的な高次構造。社会ネットワークの「友人の友人は友人」（三角形の閉包）にあたる。",
    descEn: "The most basic higher-order structure: 3 mutually connected nodes. Corresponds to 'a friend of a friend is a friend' (triadic closure) in social networks.",
    nodes: [
      { x: 50, y: 15 },
      { x: 20, y: 70 },
      { x: 80, y: 70 },
    ],
    edges: [[0, 1], [1, 2], [0, 2]] as [number, number][],
  },
  {
    nameJa: "4-サイクル (M₄)",
    nameEn: "4-Cycle (M₄)",
    descJa: "二部グラフ的な構造に多く現れる。ユーザー–商品ネットワークでは協調フィルタリングの基盤になる。",
    descEn: "Frequent in bipartite-like structures; underlies collaborative filtering in user–product networks.",
    nodes: [
      { x: 20, y: 20 },
      { x: 80, y: 20 },
      { x: 80, y: 70 },
      { x: 20, y: 70 },
    ],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0]] as [number, number][],
  },
  {
    nameJa: "フィードフォワードループ",
    nameEn: "Feed-Forward Loop",
    descJa: "有向ネットワークのモチーフ。遺伝子調節ネットワークや神経回路に多く現れ、遺伝子調節では信号のフィルタリングを担う。",
    descEn: "Directed motif common in gene regulatory networks and neural circuits; filters signals in gene regulation.",
    nodes: [
      { x: 50, y: 15 },
      { x: 20, y: 70 },
      { x: 80, y: 70 },
    ],
    edges: [[0, 1], [0, 2], [1, 2]] as [number, number][],
    directed: true,
  },
  {
    nameJa: "4-クリーク (K₄)",
    nameEn: "4-Clique (K₄)",
    descJa: "4 ノードの完全グラフ。強いグループ凝集性の指標。k = 4 の CPM の構成単位。",
    descEn: "Complete graph of 4 nodes. Indicator of strong group cohesion. Building block of CPM with k = 4.",
    nodes: [
      { x: 30, y: 15 },
      { x: 70, y: 15 },
      { x: 85, y: 65 },
      { x: 15, y: 65 },
    ],
    edges: [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as [number, number][],
  },
];

export function MotifCatalog({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "ネットワークモチーフのカタログ" : "Catalog of Network Motifs"}
      description={
        isJa
          ? "高次構造に基づくコミュニティー検出で使われる代表的なモチーフ（小さな部分グラフのパターン）。"
          : "Representative motifs (small subgraph patterns) used in higher-order community detection."
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOTIF_DATA.map((motif, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3"
          >
            <svg
              viewBox="0 0 100 85"
              className="w-full h-20 mb-2"
            >
              {motif.edges.map(([s, t], ei) => {
                const ns = motif.nodes[s];
                const nt = motif.nodes[t];
                return (
                  <g key={ei}>
                    <line
                      x1={ns.x}
                      y1={ns.y}
                      x2={nt.x}
                      y2={nt.y}
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                    {motif.directed && (
                      <polygon
                        points={(() => {
                          const dx = nt.x - ns.x;
                          const dy = nt.y - ns.y;
                          const len = Math.sqrt(dx * dx + dy * dy);
                          const ux = dx / len;
                          const uy = dy / len;
                          const tipX = nt.x - ux * 6;
                          const tipY = nt.y - uy * 6;
                          const px = -uy * 4;
                          const py = ux * 4;
                          return `${nt.x},${nt.y} ${tipX + px},${tipY + py} ${tipX - px},${tipY - py}`;
                        })()}
                        fill="#6366f1"
                        fillOpacity={0.7}
                      />
                    )}
                  </g>
                );
              })}
              {motif.nodes.map((n, ni) => (
                <circle
                  key={ni}
                  cx={n.x}
                  cy={n.y}
                  r={6}
                  fill="#6366f1"
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </svg>
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
              {isJa ? motif.nameJa : motif.nameEn}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {isJa ? motif.descJa : motif.descEn}
            </p>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Multiplex Network Diagram ───────────────────────────────

export function MultiplexNetworkDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const layers = [
    {
      nameJa: "レイヤー 1: 友人関係",
      nameEn: "Layer 1: Friendship",
      color: "#3b82f6",
      edges: [[0, 1], [1, 2], [0, 2], [2, 3]] as [number, number][],
    },
    {
      nameJa: "レイヤー 2: 仕事関係",
      nameEn: "Layer 2: Work",
      color: "#10b981",
      edges: [[0, 3], [1, 3], [2, 3]] as [number, number][],
    },
    {
      nameJa: "レイヤー 3: 趣味のつながり",
      nameEn: "Layer 3: Shared Hobbies",
      color: "#f59e0b",
      edges: [[0, 1], [0, 3], [1, 2]] as [number, number][],
    },
  ];

  const nodePositions = [
    { x: 30, y: 25 },
    { x: 70, y: 20 },
    { x: 75, y: 65 },
    { x: 25, y: 70 },
  ];

  const nodeLabels = ["A", "B", "C", "D"];

  return (
    <InteractiveDemo
      title={isJa ? "多重 (Multiplex) ネットワークの構造" : "Multiplex Network Structure"}
      description={
        isJa
          ? "同じノード集合が異なる種類の関係（レイヤー）で結ばれています。各レイヤーのコミュニティー構造は異なり得ます。"
          : "The same nodes are connected by different types of relationships (layers), and each layer can have a different community structure."
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {layers.map((layer, li) => (
          <div
            key={li}
            className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3"
          >
            <h4
              className="text-sm font-bold mb-2 text-center"
              style={{ color: layer.color }}
            >
              {isJa ? layer.nameJa : layer.nameEn}
            </h4>
            <svg viewBox="0 0 100 90" className="w-full h-24">
              {layer.edges.map(([s, t], ei) => (
                <line
                  key={ei}
                  x1={nodePositions[s].x}
                  y1={nodePositions[s].y}
                  x2={nodePositions[t].x}
                  y2={nodePositions[t].y}
                  stroke={layer.color}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              ))}
              {nodePositions.map((n, ni) => (
                <g key={ni}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={10}
                    fill={layer.color}
                    fillOpacity={0.2}
                    stroke={layer.color}
                    strokeWidth={2}
                  />
                  <text
                    x={n.x}
                    y={n.y + 4}
                    textAnchor="middle"
                    className="text-xs font-bold fill-neutral-700 dark:fill-neutral-200"
                  >
                    {nodeLabels[ni]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400">
        {isJa
          ? "💡 ノード A〜D は全レイヤーで共通ですが、辺の構造はレイヤーごとに異なります。多重ネットワークの手法は、これらのレイヤーをどう組み合わせて扱うかで分かれます。"
          : "💡 Nodes A–D are shared across all layers, but the edges differ from layer to layer. Multiplex methods differ in how they combine the layers."}
      </div>
    </InteractiveDemo>
  );
}

// ── Advanced CD Comparison Table ────────────────────────────

const comparisonData = [
  {
    nameJa: "CPM (Clique Percolation)",
    nameEn: "CPM (Clique Percolation)",
    yearRange: "2005–",
    typeJa: "重複",
    typeEn: "Overlapping",
    basisJa: "k-クリークの隣接",
    basisEn: "k-clique adjacency",
    complexityJa: "NP困難（k依存）",
    complexityEn: "NP-hard (k-dependent)",
    prosJa: "重複構造を自然に検出",
    prosEn: "Naturally detects overlap",
    consJa: "k の選択が困難、スパースグラフに弱い",
    consEn: "Choosing k is hard; weak on sparse graphs",
  },
  {
    nameJa: "Multislice Modularity",
    nameEn: "Multislice Modularity",
    yearRange: "2010–",
    typeJa: "動的・多重",
    typeEn: "Dynamic / Multiplex",
    basisJa: "時刻・レイヤー間を結合した Modularity",
    basisEn: "Time/layer-coupled Modularity",
    complexityJa: "O(n log n) per slice",
    complexityEn: "O(n log n) per slice",
    prosJa: "統一的な定式化",
    prosEn: "Unified formulation",
    consJa: "結合パラメーター ω の選択",
    consEn: "Coupling parameter ω selection",
  },
  {
    nameJa: "Motif Conductance",
    nameEn: "Motif Conductance",
    yearRange: "2016–",
    typeJa: "高次構造",
    typeEn: "Higher-Order",
    basisJa: "モチーフ重み付き Conductance",
    basisEn: "Motif-weighted Conductance",
    complexityJa: "モチーフ列挙 + スペクトラル",
    complexityEn: "Motif enumeration + spectral",
    prosJa: "高次パターンの検出",
    prosEn: "Detects higher-order patterns",
    consJa: "モチーフ列挙が計算コスト高",
    consEn: "Motif enumeration is costly",
  },
  {
    nameJa: "Evolutionary Clustering",
    nameEn: "Evolutionary Clustering",
    yearRange: "2006–",
    typeJa: "動的",
    typeEn: "Dynamic",
    basisJa: "スナップショットの品質 + 時間平滑化",
    basisEn: "Snapshot quality + temporal smoothing",
    complexityJa: "ベースアルゴリズム依存",
    complexityEn: "Depends on base algorithm",
    prosJa: "既存手法を動的に拡張可能",
    prosEn: "Extends existing methods to dynamic networks",
    consJa: "トレードオフパラメーター α の設定",
    consEn: "Setting the trade-off parameter α",
  },
  {
    nameJa: "テンソル分解",
    nameEn: "Tensor Decomposition",
    yearRange: "2013–",
    typeJa: "動的・多重",
    typeEn: "Dynamic / Multiplex",
    basisJa: "テンソル分解（CP / Tucker）",
    basisEn: "Tensor decomposition (CP / Tucker)",
    complexityJa: "O(n²L) 〜 O(n³L)",
    complexityEn: "O(n²L) to O(n³L)",
    prosJa: "レイヤー間相関を捕捉",
    prosEn: "Captures inter-layer correlations",
    consJa: "大規模ネットワークへの適用が難しい",
    consEn: "Scales poorly to large networks",
  },
  {
    nameJa: "GNN (DMoN, MinCutPool 等)",
    nameEn: "GNN (DMoN, MinCutPool, etc.)",
    yearRange: "2020–",
    typeJa: "汎用・学習ベース",
    typeEn: "General / Learning-based",
    basisJa: "微分可能な目的関数の勾配降下",
    basisEn: "Gradient descent on differentiable objectives",
    complexityJa: "O(n·d·L) (d=特徴次元, L=層数)",
    complexityEn: "O(n·d·L) (d=feature dim, L=layers)",
    prosJa: "ノード特徴量を活用可能",
    prosEn: "Can use node features",
    consJa: "解釈性・汎化性に課題",
    consEn: "Interpretability and generalization issues",
  },
];

export function AdvancedCDComparisonTable({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "高次・動的手法の比較" : "Comparison of Higher-Order and Dynamic Methods"}
      description={
        isJa
          ? "高次構造・動的・多重ネットワーク向けの主要アルゴリズムの特徴を比較します。"
          : "Comparing key algorithms for higher-order, dynamic, and multiplex networks."
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 dark:border-neutral-600">
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "手法" : "Method"}
              </th>
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "年代" : "Era"}
              </th>
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "種類" : "Type"}
              </th>
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "基盤" : "Basis"}
              </th>
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "利点" : "Pros"}
              </th>
              <th className="text-left p-2 font-bold text-neutral-700 dark:text-neutral-300">
                {isJa ? "欠点" : "Cons"}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, ri) => (
              <tr
                key={ri}
                className="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="p-2 font-semibold text-neutral-800 dark:text-neutral-200">
                  {isJa ? row.nameJa : row.nameEn}
                </td>
                <td className="p-2 text-neutral-600 dark:text-neutral-400">
                  {row.yearRange}
                </td>
                <td className="p-2">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs">
                    {isJa ? row.typeJa : row.typeEn}
                  </span>
                </td>
                <td className="p-2 text-neutral-600 dark:text-neutral-400">
                  {isJa ? row.basisJa : row.basisEn}
                </td>
                <td className="p-2 text-green-600 dark:text-green-400">
                  {isJa ? row.prosJa : row.prosEn}
                </td>
                <td className="p-2 text-amber-600 dark:text-amber-400">
                  {isJa ? row.consJa : row.consEn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

// ── Community Lifecycle Diagram ─────────────────────────────

export function CommunityLifecycleDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  const events = [
    {
      labelJa: "誕生",
      labelEn: "Birth",
      color: "#10b981",
      descJa: "新しいコミュニティーが出現",
      descEn: "A new community emerges",
      icon: "●",
    },
    {
      labelJa: "成長",
      labelEn: "Growth",
      color: "#3b82f6",
      descJa: "既存コミュニティーにメンバーが増加",
      descEn: "Members join an existing community",
      icon: "▲",
    },
    {
      labelJa: "縮小",
      labelEn: "Shrink",
      color: "#f59e0b",
      descJa: "メンバーが離脱して規模が縮小",
      descEn: "Members leave and the community shrinks",
      icon: "▽",
    },
    {
      labelJa: "分裂",
      labelEn: "Split",
      color: "#ef4444",
      descJa: "1 つのコミュニティーが 2 つ以上に分かれる",
      descEn: "One community splits into two or more",
      icon: "⟨",
    },
    {
      labelJa: "統合",
      labelEn: "Merge",
      color: "#8b5cf6",
      descJa: "2 つ以上のコミュニティーが合併する",
      descEn: "Two or more communities merge",
      icon: "⟩",
    },
    {
      labelJa: "消滅",
      labelEn: "Death",
      color: "#94a3b8",
      descJa: "コミュニティーが消える",
      descEn: "The community ceases to exist",
      icon: "✕",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "コミュニティーのライフサイクルイベント" : "Community Lifecycle Events"}
      description={
        isJa
          ? "連続するスナップショットの間で、コミュニティーに起こる主な変化。"
          : "The main changes a community can go through between consecutive snapshots."
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {events.map((ev, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3"
          >
            <span
              className="text-2xl leading-none mt-0.5"
              style={{ color: ev.color }}
            >
              {ev.icon}
            </span>
            <div>
              <span
                className="text-sm font-bold"
                style={{ color: ev.color }}
              >
                {isJa ? ev.labelJa : ev.labelEn}
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isJa ? ev.descJa : ev.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Motif-Weighted Adjacency Diagram ────────────────────────

export function MotifWeightedAdjacencyDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "モチーフ重み付き隣接行列の構築" : "Building the Motif-Weighted Adjacency Matrix"}
      description={
        isJa
          ? "通常の隣接行列は辺の有無（0/1）を記録しますが、モチーフ重み付き隣接行列は、ノード i と j を両方含むモチーフ（ここでは三角形）の数を記録します。"
          : "The standard adjacency matrix records whether an edge exists (0/1); the motif-weighted adjacency matrix records how many instances of the motif (here, triangles) contain both nodes i and j."
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Original Graph */}
        <div className="text-center">
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2">
            {isJa ? "① 元のグラフ" : "① Original Graph"}
          </p>
          <svg viewBox="0 0 140 120" className="w-full h-28 mx-auto">
            {/* Triangle: 0-1-2 */}
            <line x1="70" y1="15" x2="30" y2="85" stroke="#94a3b8" strokeWidth={2} />
            <line x1="70" y1="15" x2="110" y2="85" stroke="#94a3b8" strokeWidth={2} />
            <line x1="30" y1="85" x2="110" y2="85" stroke="#94a3b8" strokeWidth={2} />
            {/* Extra edges forming another triangle 1-2-3 */}
            <line x1="30" y1="85" x2="70" y2="105" stroke="#94a3b8" strokeWidth={2} />
            <line x1="110" y1="85" x2="70" y2="105" stroke="#94a3b8" strokeWidth={2} />
            {/* Node 4 connects only to 0 */}
            <line x1="70" y1="15" x2="130" y2="30" stroke="#94a3b8" strokeWidth={2} />
            {["0","1","2","3","4"].map((l, i) => {
              const pos = [[70,15],[30,85],[110,85],[70,105],[130,30]][i];
              return (
                <g key={i}>
                  <circle cx={pos[0]} cy={pos[1]} r={10} fill="#6366f1" stroke="white" strokeWidth={2} />
                  <text x={pos[0]} y={pos[1]+4} textAnchor="middle" className="text-xs font-bold" fill="white">{l}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {isJa ? "三角形モチーフで" : "Count triangles"}
            </p>
            <span className="text-2xl text-neutral-400">→</span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {isJa ? "重み付け" : "for weights"}
            </p>
          </div>
        </div>

        {/* Weighted Matrix */}
        <div className="text-center">
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-2">
            {isJa ? "② モチーフ重み付き隣接行列 W(M₃)" : "② Motif-Weighted Adjacency Matrix W(M₃)"}
          </p>
          <div className="inline-block">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-1"></th>
                  {[0,1,2,3,4].map(i => (
                    <th key={i} className="p-1 font-mono text-indigo-600 dark:text-indigo-400">{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [0, 1, 1, 0, 0],
                  [1, 0, 2, 1, 0],
                  [1, 2, 0, 1, 0],
                  [0, 1, 1, 0, 0],
                  [0, 0, 0, 0, 0],
                ].map((row, ri) => (
                  <tr key={ri}>
                    <td className="p-1 font-mono font-bold text-indigo-600 dark:text-indigo-400">{ri}</td>
                    {row.map((v, ci) => (
                      <td
                        key={ci}
                        className={`p-1 text-center font-mono ${
                          v > 1
                            ? "text-red-600 dark:text-red-400 font-bold"
                            : v === 1
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-neutral-300 dark:text-neutral-600"
                        }`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            {isJa
              ? "辺(1,2)は三角形 {0,1,2} と {1,2,3} に含まれるので重み 2、辺(0,4)はどの三角形にも含まれないので重み 0"
              : "Edge (1,2) is in triangles {0,1,2} and {1,2,3}, so its weight is 2; edge (0,4) is in no triangle, so its weight is 0"}
          </p>
        </div>
      </div>
    </InteractiveDemo>
  );
}
