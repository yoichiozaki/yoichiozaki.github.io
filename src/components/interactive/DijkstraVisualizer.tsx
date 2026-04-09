"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type DijkstraVisualizerProps = { locale?: string };

/* ── Weighted graph definition ─────────────────── */

type NodeId = "A" | "B" | "C" | "D" | "E" | "F";

const nodePositions: Record<NodeId, { x: number; y: number }> = {
  A: { x: 80, y: 60 },
  B: { x: 240, y: 60 },
  C: { x: 80, y: 200 },
  D: { x: 240, y: 200 },
  E: { x: 400, y: 60 },
  F: { x: 400, y: 200 },
};

const weightedEdges: { from: NodeId; to: NodeId; weight: number }[] = [
  { from: "A", to: "B", weight: 4 },
  { from: "A", to: "C", weight: 2 },
  { from: "B", to: "D", weight: 3 },
  { from: "B", to: "E", weight: 1 },
  { from: "C", to: "B", weight: 1 },
  { from: "C", to: "D", weight: 5 },
  { from: "D", to: "F", weight: 2 },
  { from: "E", to: "F", weight: 4 },
];

const allNodes: NodeId[] = ["A", "B", "C", "D", "E", "F"];

/* ── Step types ────────────────────────────────── */

type NodeVisualState = "unvisited" | "inPQ" | "current" | "finalized";

type DistEntry = {
  dist: number | null; // null = infinity
  prev: NodeId | null;
  updated?: boolean; // flash on update
};

type DijkstraStep = {
  nodeStates: Record<NodeId, NodeVisualState>;
  distances: Record<NodeId, DistEntry>;
  priorityQueue: { node: NodeId; dist: number }[];
  highlightEdge?: [NodeId, NodeId];
  description: { ja: string; en: string };
};

/* ── Generate Dijkstra steps ───────────────────── */

function generateSteps(): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const INF = null;

  const mkDist = (): Record<NodeId, DistEntry> => ({
    A: { dist: INF, prev: null },
    B: { dist: INF, prev: null },
    C: { dist: INF, prev: null },
    D: { dist: INF, prev: null },
    E: { dist: INF, prev: null },
    F: { dist: INF, prev: null },
  });

  const mkStates = (): Record<NodeId, NodeVisualState> => ({
    A: "unvisited",
    B: "unvisited",
    C: "unvisited",
    D: "unvisited",
    E: "unvisited",
    F: "unvisited",
  });

  // Step 0: Init
  const d0 = mkDist();
  d0.A = { dist: 0, prev: null, updated: true };
  steps.push({
    nodeStates: { ...mkStates(), A: "inPQ" },
    distances: d0,
    priorityQueue: [{ node: "A", dist: 0 }],
    description: {
      ja: "Dijkstraのアルゴリズムを頂点 A から開始します。始点 A の距離を 0 に、それ以外を ∞ に初期化します。優先度付きキューに A(距離0) を入れます。",
      en: "Start Dijkstra's algorithm from vertex A. Initialize distance to A as 0, all others as ∞. Insert A(dist=0) into the priority queue.",
    },
  });

  // Step 1: Extract A (dist=0), relax A→B(4), A→C(2)
  const d1 = { ...d0 };
  d1.B = { dist: 4, prev: "A", updated: true };
  d1.C = { dist: 2, prev: "A", updated: true };
  d1.A = { dist: 0, prev: null };
  steps.push({
    nodeStates: { ...mkStates(), A: "current", B: "inPQ", C: "inPQ" },
    distances: d1,
    priorityQueue: [
      { node: "C", dist: 2 },
      { node: "B", dist: 4 },
    ],
    highlightEdge: ["A", "B"],
    description: {
      ja: "優先度付きキューから最小距離の A(0) を取り出し、確定します。A から出る辺を緩和: A→B(0+4=4), A→C(0+2=2)。既知の ∞ より小さいので距離を更新。",
      en: "Extract min A(0) from PQ and finalize it. Relax edges: A→B(0+4=4), A→C(0+2=2). Both improve upon ∞, so update distances.",
    },
  });

  // Step 2: A is finalized
  const d2 = { ...d1 };
  d2.B = { dist: 4, prev: "A" };
  d2.C = { dist: 2, prev: "A" };
  steps.push({
    nodeStates: { ...mkStates(), A: "finalized", B: "inPQ", C: "inPQ" },
    distances: d2,
    priorityQueue: [
      { node: "C", dist: 2 },
      { node: "B", dist: 4 },
    ],
    description: {
      ja: "A を確定（緑）。優先度付きキュー: [C(2), B(4)]。次は最小距離の C(2) を取り出します。",
      en: "A is finalized (green). Priority queue: [C(2), B(4)]. Next: extract C(2), the minimum.",
    },
  });

  // Step 3: Extract C (dist=2), relax C→B(2+1=3), C→D(2+5=7)
  const d3 = { ...d2 };
  d3.B = { dist: 3, prev: "C", updated: true }; // improved from 4 to 3!
  d3.D = { dist: 7, prev: "C", updated: true };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "inPQ",
      C: "current",
      D: "inPQ",
    },
    distances: d3,
    priorityQueue: [
      { node: "B", dist: 3 },
      { node: "D", dist: 7 },
    ],
    highlightEdge: ["C", "B"],
    description: {
      ja: "C(2) を取り出して緩和。C→B: 2+1=3 < 4（更新！ A→B直行より A→C→B 経由の方が近い）。C→D: 2+5=7 < ∞（更新）。これが「緩和」の本質 — より良い経路が見つかったら更新します。",
      en: "Extract C(2) and relax. C→B: 2+1=3 < 4 (improvement! Going A→C→B is shorter than A→B). C→D: 2+5=7 < ∞ (update). This is the essence of 'relaxation' — update when a better path is found.",
    },
  });

  // Step 4: C finalized
  const d4 = { ...d3 };
  d4.B = { dist: 3, prev: "C" };
  d4.D = { dist: 7, prev: "C" };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "inPQ",
      C: "finalized",
      D: "inPQ",
    },
    distances: d4,
    priorityQueue: [
      { node: "B", dist: 3 },
      { node: "D", dist: 7 },
    ],
    description: {
      ja: "C を確定。優先度付きキュー: [B(3), D(7)]。次は B(3)。",
      en: "C is finalized. PQ: [B(3), D(7)]. Next: B(3).",
    },
  });

  // Step 5: Extract B(3), relax B→D(3+3=6 < 7), B→E(3+1=4)
  const d5 = { ...d4 };
  d5.D = { dist: 6, prev: "B", updated: true }; // improved 7 → 6
  d5.E = { dist: 4, prev: "B", updated: true };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "current",
      C: "finalized",
      D: "inPQ",
      E: "inPQ",
    },
    distances: d5,
    priorityQueue: [
      { node: "E", dist: 4 },
      { node: "D", dist: 6 },
    ],
    highlightEdge: ["B", "D"],
    description: {
      ja: "B(3) を取り出して緩和。B→D: 3+3=6 < 7（改善！C経由よりB経由の方が近い）。B→E: 3+1=4 < ∞。距離の更新が連鎖していく様子がわかりますか？",
      en: "Extract B(3) and relax. B→D: 3+3=6 < 7 (improved! Via B is shorter than via C). B→E: 3+1=4 < ∞. Notice how distance updates cascade as we discover better paths.",
    },
  });

  // Step 6: B finalized
  const d6 = { ...d5 };
  d6.D = { dist: 6, prev: "B" };
  d6.E = { dist: 4, prev: "B" };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "inPQ",
      E: "inPQ",
    },
    distances: d6,
    priorityQueue: [
      { node: "E", dist: 4 },
      { node: "D", dist: 6 },
    ],
    description: {
      ja: "B を確定。PQ: [E(4), D(6)]。次は E(4)。",
      en: "B finalized. PQ: [E(4), D(6)]. Next: E(4).",
    },
  });

  // Step 7: Extract E(4), relax E→F(4+4=8)
  const d7 = { ...d6 };
  d7.F = { dist: 8, prev: "E", updated: true };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "inPQ",
      E: "current",
      F: "inPQ",
    },
    distances: d7,
    priorityQueue: [
      { node: "D", dist: 6 },
      { node: "F", dist: 8 },
    ],
    highlightEdge: ["E", "F"],
    description: {
      ja: "E(4) を取り出して緩和。E→F: 4+4=8 < ∞（更新）。E→B は確定済みなのでスキップ。",
      en: "Extract E(4) and relax. E→F: 4+4=8 < ∞ (update). E→B is already finalized — skip.",
    },
  });

  // Step 8: E finalized
  const d8 = { ...d7 };
  d8.F = { dist: 8, prev: "E" };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "inPQ",
      E: "finalized",
      F: "inPQ",
    },
    distances: d8,
    priorityQueue: [
      { node: "D", dist: 6 },
      { node: "F", dist: 8 },
    ],
    description: {
      ja: "E 確定。PQ: [D(6), F(8)]。次は D(6)。",
      en: "E finalized. PQ: [D(6), F(8)]. Next: D(6).",
    },
  });

  // Step 9: Extract D(6), relax D→F(6+2=8, not better than 8)
  const d9 = { ...d8 };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "current",
      E: "finalized",
      F: "inPQ",
    },
    distances: d9,
    priorityQueue: [{ node: "F", dist: 8 }],
    highlightEdge: ["D", "F"],
    description: {
      ja: "D(6) を取り出して緩和。D→F: 6+2=8 = 現在の距離8（改善なし！E経由ですでに同じ距離に到達済み）。距離が同じなので更新は不要です。",
      en: "Extract D(6) and relax. D→F: 6+2=8 = current distance 8 (no improvement! Already reachable via E at the same cost). No update needed.",
    },
  });

  // Step 10: D finalized
  const d10 = { ...d9 };
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "finalized",
      E: "finalized",
      F: "inPQ",
    },
    distances: d10,
    priorityQueue: [{ node: "F", dist: 8 }],
    description: {
      ja: "D 確定。PQ: [F(8)]。最後の頂点です。",
      en: "D finalized. PQ: [F(8)]. Last vertex remaining.",
    },
  });

  // Step 11: Extract F(8)
  steps.push({
    nodeStates: {
      ...mkStates(),
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "finalized",
      E: "finalized",
      F: "current",
    },
    distances: d10,
    priorityQueue: [],
    description: {
      ja: "F(8) を取り出し。F から出る辺の先はすべて確定済み。キューが空になりました。",
      en: "Extract F(8). All of F's neighbors are finalized. The queue is now empty.",
    },
  });

  // Step 12: Complete
  steps.push({
    nodeStates: {
      A: "finalized",
      B: "finalized",
      C: "finalized",
      D: "finalized",
      E: "finalized",
      F: "finalized",
    },
    distances: d10,
    priorityQueue: [],
    description: {
      ja: "Dijkstra 完了！ A からの最短距離: B=3(A→C→B), C=2(A→C), D=6(A→C→B→D), E=4(A→C→B→E), F=8(A→C→B→E→F)。貪欲に「今わかっている最短距離の頂点」を確定させていくことで、全頂点への最短経路が得られました。",
      en: "Dijkstra complete! Shortest distances from A: B=3(A→C→B), C=2(A→C), D=6(A→C→B→D), E=4(A→C→B→E), F=8(A→C→B→E→F). By greedily finalizing the vertex with the smallest known distance, we found shortest paths to all vertices.",
    },
  });

  return steps;
}

/* ── Colors ────────────────────────────────────── */

const stateColors: Record<
  NodeVisualState,
  { fill: string; stroke: string; text: string }
> = {
  unvisited: { fill: "#f3f4f6", stroke: "#d1d5db", text: "#374151" },
  inPQ: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  current: { fill: "#fef3c7", stroke: "#f59e0b", text: "#92400e" },
  finalized: { fill: "#dcfce7", stroke: "#22c55e", text: "#166534" },
};

const stateColorsDark: Record<
  NodeVisualState,
  { fill: string; stroke: string; text: string }
> = {
  unvisited: { fill: "#374151", stroke: "#6b7280", text: "#d1d5db" },
  inPQ: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
  current: { fill: "#78350f", stroke: "#f59e0b", text: "#fde68a" },
  finalized: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
};

/* ── Component ────────────────────────────────── */

export function DijkstraVisualizer({
  locale = "ja",
}: DijkstraVisualizerProps) {
  const steps = generateSteps();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2200 });
  const current = steps[player.step];

  return (
    <InteractiveDemo
      title={
        locale === "ja"
          ? "Dijkstra のアルゴリズム ビジュアライザ"
          : "Dijkstra's Algorithm Visualizer"
      }
      description={
        locale === "ja"
          ? "重み付きグラフで最短経路を求める過程をステップごとに追います。"
          : "Step through Dijkstra's algorithm on a weighted directed graph."
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
        {/* Graph SVG */}
        <div className="bg-background rounded-lg border border-border p-2">
          <svg viewBox="0 0 480 260" className="w-full h-auto">
            <defs>
              <marker
                id="dijkstra-arrow"
                viewBox="0 0 10 7"
                refX="10"
                refY="3.5"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
                className="text-border"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="currentColor"
                />
              </marker>
              <marker
                id="dijkstra-arrow-hl"
                viewBox="0 0 10 7"
                refX="10"
                refY="3.5"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
              </marker>
            </defs>

            {/* Edges */}
            {weightedEdges.map(({ from, to, weight }) => {
              const pf = nodePositions[from];
              const pt = nodePositions[to];
              const hl = current.highlightEdge;
              const isHl =
                hl && hl[0] === from && hl[1] === to;

              // offset for directional edge
              const dx = pt.x - pf.x;
              const dy = pt.y - pf.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = dx / len;
              const ny = dy / len;
              // perpendicular offset for bidirectional edges
              const px = -ny * 6;
              const py = nx * 6;
              const x1 = pf.x + nx * 26 + px;
              const y1 = pf.y + ny * 26 + py;
              const x2 = pt.x - nx * 26 + px;
              const y2 = pt.y - ny * 26 + py;
              const mx = (x1 + x2) / 2 + px;
              const my = (y1 + y2) / 2 + py;

              return (
                <g key={`${from}-${to}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHl ? "#f59e0b" : "currentColor"}
                    strokeWidth={isHl ? 2.5 : 1.5}
                    className={isHl ? "" : "text-border"}
                    markerEnd={
                      isHl
                        ? "url(#dijkstra-arrow-hl)"
                        : "url(#dijkstra-arrow)"
                    }
                  />
                  <text
                    x={mx}
                    y={my}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11}
                    fontWeight={700}
                    className={
                      isHl
                        ? "fill-amber-600 dark:fill-amber-400"
                        : "fill-muted-foreground"
                    }
                  >
                    {weight}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {allNodes.map((id) => {
              const pos = nodePositions[id];
              const state = current.nodeStates[id];
              const lc = stateColors[state];
              const dc = stateColorsDark[state];
              return (
                <g key={id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={lc.fill}
                    stroke={lc.stroke}
                    strokeWidth={state === "current" ? 3 : 2}
                    className="dark:hidden"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={16}
                    fontWeight={600}
                    fill={lc.text}
                    className="dark:hidden"
                  >
                    {id}
                  </text>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={dc.fill}
                    stroke={dc.stroke}
                    strokeWidth={state === "current" ? 3 : 2}
                    className="hidden dark:block"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={16}
                    fontWeight={600}
                    fill={dc.text}
                    className="hidden dark:block"
                  >
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-3">
          {/* Distance table */}
          <div className="bg-background rounded-lg border border-border p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {locale === "ja" ? "距離テーブル" : "Distance Table"}
            </div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 text-sm">
              {allNodes.map((n) => {
                const entry = current.distances[n];
                return (
                  <div key={n} className="contents">
                    <span className="font-mono font-bold text-foreground py-0.5">{n}</span>
                    <span className={`font-mono text-right py-0.5 ${
                      entry.updated
                        ? "text-amber-600 dark:text-amber-400 font-bold"
                        : "text-foreground"
                    }`}>
                      {entry.dist === null ? "∞" : entry.dist}
                    </span>
                    <span className="font-mono text-right py-0.5 text-muted-foreground">
                      {entry.prev ? `via ${entry.prev}` : "−"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Queue */}
          <div className="bg-background rounded-lg border border-border p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {locale === "ja" ? "優先度付きキュー" : "Priority Queue"}
            </div>
            <div className="flex gap-1.5 min-h-[32px] flex-wrap">
              {current.priorityQueue.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  {locale === "ja" ? "（空）" : "(empty)"}
                </span>
              ) : (
                current.priorityQueue.map(({ node, dist }, i) => (
                  <span
                    key={`${node}-${i}`}
                    className={`inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-mono ${
                      i === 0
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-2 border-amber-500"
                        : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-400"
                    }`}
                  >
                    {node}({dist})
                  </span>
                ))
              )}
            </div>
            {current.priorityQueue.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {locale === "ja"
                  ? "← 最小距離から取り出す"
                  : "← Extract minimum distance first"}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-background rounded-lg border border-border p-3 flex-1">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              {locale === "ja" ? "解説" : "Explanation"}
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {locale === "ja"
                ? current.description.ja
                : current.description.en}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          label={(s) =>
            locale === "ja"
              ? `ステップ ${s}/${steps.length - 1}`
              : `Step ${s}/${steps.length - 1}`
          }
        />
      </div>
    </InteractiveDemo>
  );
}
