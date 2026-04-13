"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type Node = {
  id: number;
  label: string;
  community: number;
  x: number;
  y: number;
};

type Edge = {
  source: number;
  target: number;
  weight: number;
};

type LouvainStep = {
  nodes: Node[];
  edges: Edge[];
  modularity: number;
  description: string;
  descriptionEn: string;
  phase: "init" | "move" | "aggregate" | "done";
  highlight?: number; // node being evaluated
  moveArrow?: { from: number; to: number }; // community move
};

// ── Community colors ────────────────────────────────────────

const COMMUNITY_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// ── Karate Club–inspired small graph ────────────────────────

function buildScenario(): LouvainStep[] {
  // A small 10-node graph with clear community structure
  const baseEdges: Edge[] = [
    // Community A cluster (nodes 0-3)
    { source: 0, target: 1, weight: 1 },
    { source: 0, target: 2, weight: 1 },
    { source: 1, target: 2, weight: 1 },
    { source: 1, target: 3, weight: 1 },
    { source: 2, target: 3, weight: 1 },
    // Community B cluster (nodes 4-6)
    { source: 4, target: 5, weight: 1 },
    { source: 4, target: 6, weight: 1 },
    { source: 5, target: 6, weight: 1 },
    // Community C cluster (nodes 7-9)
    { source: 7, target: 8, weight: 1 },
    { source: 7, target: 9, weight: 1 },
    { source: 8, target: 9, weight: 1 },
    // Inter-community bridges
    { source: 3, target: 4, weight: 1 },
    { source: 6, target: 7, weight: 1 },
    { source: 0, target: 9, weight: 1 },
  ];

  // Positions for visual layout — 3 clusters
  const positions: [number, number][] = [
    [80, 80],   // 0
    [140, 40],  // 1
    [140, 120], // 2
    [200, 80],  // 3
    [300, 60],  // 4
    [360, 30],  // 5
    [360, 90],  // 6
    [460, 80],  // 7
    [520, 40],  // 8
    [520, 120], // 9
  ];

  const mkNodes = (communities: number[]): Node[] =>
    communities.map((c, i) => ({
      id: i,
      label: `${i}`,
      community: c,
      x: positions[i][0],
      y: positions[i][1],
    }));

  const m = baseEdges.reduce((s, e) => s + e.weight, 0); // total edge weight

  // Compute modularity for given community assignment
  function computeModularity(communities: number[]): number {
    const degrees = new Array(10).fill(0);
    for (const e of baseEdges) {
      degrees[e.source] += e.weight;
      degrees[e.target] += e.weight;
    }
    let q = 0;
    for (const e of baseEdges) {
      if (communities[e.source] === communities[e.target]) {
        q += e.weight - (degrees[e.source] * degrees[e.target]) / (2 * m);
      }
    }
    return q / (2 * m);
  }

  // Step 0: Each node in its own community
  const init = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return [
    // Step 0: Initial state
    {
      nodes: mkNodes(init),
      edges: baseEdges,
      modularity: computeModularity(init),
      description:
        "Louvain アルゴリズム開始。Phase 1（局所移動）: 各ノードを独自のコミュニティに初期化します。10 ノード・14 辺のグラフで、3 つのクラスタ構造が潜んでいます。",
      descriptionEn:
        "Louvain algorithm begins. Phase 1 (local moving): Initialize each node in its own community. A 10-node, 14-edge graph with 3 hidden clusters.",
      phase: "init",
    },
    // Step 1: Node 1 → community of node 0
    {
      nodes: mkNodes([0, 0, 2, 3, 4, 5, 6, 7, 8, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 2, 3, 4, 5, 6, 7, 8, 9]),
      description:
        "ノード 1 を評価: 隣接ノード 0, 2, 3 のコミュニティへの移動による ΔQ を計算。ノード 0 のコミュニティに移動すると ΔQ が最大になるため移動。",
      descriptionEn:
        "Evaluate node 1: Compute ΔQ for moving to communities of neighbors 0, 2, 3. Moving to node 0's community yields the largest ΔQ gain.",
      phase: "move",
      highlight: 1,
      moveArrow: { from: 1, to: 0 },
    },
    // Step 2: Node 2 → community 0
    {
      nodes: mkNodes([0, 0, 0, 3, 4, 5, 6, 7, 8, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 3, 4, 5, 6, 7, 8, 9]),
      description:
        "ノード 2 も同様に ΔQ を計算。ノード 0，1 と同じコミュニティに移動すると密結合クラスタの内部辺が増え、ΔQ > 0。",
      descriptionEn:
        "Node 2 similarly joins community 0. The dense internal edges among nodes 0, 1, 2 yield ΔQ > 0.",
      phase: "move",
      highlight: 2,
      moveArrow: { from: 2, to: 0 },
    },
    // Step 3: Node 3 → community 0
    {
      nodes: mkNodes([0, 0, 0, 0, 4, 5, 6, 7, 8, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 0, 4, 5, 6, 7, 8, 9]),
      description:
        "ノード 3 がコミュニティ 0 に合流。左側クラスタ {0,1,2,3} が 1 つのコミュニティを形成。",
      descriptionEn:
        "Node 3 joins community 0, forming the left cluster {0,1,2,3} as one community.",
      phase: "move",
      highlight: 3,
      moveArrow: { from: 3, to: 0 },
    },
    // Step 4: Node 5 → community of 4
    {
      nodes: mkNodes([0, 0, 0, 0, 4, 4, 6, 7, 8, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 6, 7, 8, 9]),
      description:
        "中央クラスタへ。ノード 5 はノード 4 のコミュニティに移動（ΔQ > 0）。辺 4-5 が内部辺に変わります。",
      descriptionEn:
        "Moving to the central cluster. Node 5 joins node 4's community (ΔQ > 0). Edge 4-5 becomes internal.",
      phase: "move",
      highlight: 5,
      moveArrow: { from: 5, to: 4 },
    },
    // Step 5: Node 6 → community 4
    {
      nodes: mkNodes([0, 0, 0, 0, 4, 4, 4, 7, 8, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 8, 9]),
      description:
        "ノード 6 がコミュニティ 4 に合流。中央クラスタ {4,5,6} が完成。",
      descriptionEn:
        "Node 6 joins community 4. The central cluster {4,5,6} is now formed.",
      phase: "move",
      highlight: 6,
      moveArrow: { from: 6, to: 4 },
    },
    // Step 6: Node 8 → community 7
    {
      nodes: mkNodes([0, 0, 0, 0, 4, 4, 4, 7, 7, 9]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 9]),
      description:
        "右側クラスタへ。ノード 8 がノード 7 のコミュニティに移動。",
      descriptionEn:
        "Moving to the right cluster. Node 8 joins node 7's community.",
      phase: "move",
      highlight: 8,
      moveArrow: { from: 8, to: 7 },
    },
    // Step 7: Node 9 → community 7
    {
      nodes: mkNodes([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]),
      edges: baseEdges,
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]),
      description:
        "ノード 9 がコミュニティ 7 に合流。辺 0-9 はコミュニティ間の橋（ブリッジ辺）として残ります。Phase 1 完了 — これ以上 ΔQ > 0 の移動はありません。",
      descriptionEn:
        "Node 9 joins community 7. Edge 0–9 remains as an inter-community bridge. Phase 1 complete — no more moves with ΔQ > 0.",
      phase: "move",
      highlight: 9,
      moveArrow: { from: 9, to: 7 },
    },
    // Step 8: Aggregation phase
    {
      nodes: [
        { id: 0, label: "C₁", community: 0, x: 160, y: 80 },
        { id: 4, label: "C₂", community: 4, x: 330, y: 80 },
        { id: 7, label: "C₃", community: 7, x: 500, y: 80 },
      ],
      edges: [
        { source: 0, target: 4, weight: 1 },
        { source: 4, target: 7, weight: 1 },
        { source: 0, target: 7, weight: 1 },
      ],
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]),
      description:
        "Phase 2（集約）: 各コミュニティを超ノードに縮約。内部辺は自己ループ（自己辺重み）となり、コミュニティ間辺は超辺になります。3 ノードの縮約グラフが得られました。",
      descriptionEn:
        "Phase 2 (aggregation): Collapse each community into a super-node. Internal edges become self-loops; inter-community edges become super-edges. A 3-node coarsened graph is obtained.",
      phase: "aggregate",
    },
    // Step 9: Final — no further improvement
    {
      nodes: [
        { id: 0, label: "C₁", community: 0, x: 160, y: 80 },
        { id: 4, label: "C₂", community: 4, x: 330, y: 80 },
        { id: 7, label: "C₃", community: 7, x: 500, y: 80 },
      ],
      edges: [
        { source: 0, target: 4, weight: 1 },
        { source: 4, target: 7, weight: 1 },
        { source: 0, target: 7, weight: 1 },
      ],
      modularity: computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]),
      description:
        "再び Phase 1 を適用しても ΔQ > 0 の移動がないため収束。最終 Modularity Q ≈ " +
        computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]).toFixed(4) +
        "。3 つのコミュニティ {0,1,2,3}, {4,5,6}, {7,8,9} が検出されました。",
      descriptionEn:
        "Applying Phase 1 again yields no moves with ΔQ > 0 — convergence. Final Modularity Q ≈ " +
        computeModularity([0, 0, 0, 0, 4, 4, 4, 7, 7, 7]).toFixed(4) +
        ". Three communities detected: {0,1,2,3}, {4,5,6}, {7,8,9}.",
      phase: "done",
    },
  ];
}

// ── SVG rendering ───────────────────────────────────────────

function GraphView({ step }: { step: LouvainStep }) {
  const { nodes, edges, highlight } = step;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nodeRadius = nodes.length <= 3 ? 28 : 18;

  return (
    <svg viewBox="0 0 600 160" className="w-full h-auto">
      {/* Edges */}
      {edges.map((e, i) => {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) return null;
        const sameComm = s.community === t.community;
        return (
          <line
            key={`e-${i}`}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke={sameComm ? COMMUNITY_COLORS[s.community % COMMUNITY_COLORS.length] : "#94a3b8"}
            strokeWidth={sameComm ? 2.5 : 1.5}
            strokeOpacity={sameComm ? 0.7 : 0.35}
            strokeDasharray={sameComm ? undefined : "4,3"}
          />
        );
      })}

      {/* Community hulls (simple: colored circle behind cluster) */}
      {nodes.length > 3 &&
        (() => {
          const communities = new Map<number, Node[]>();
          for (const n of nodes) {
            if (!communities.has(n.community)) communities.set(n.community, []);
            communities.get(n.community)!.push(n);
          }
          return Array.from(communities.entries()).map(([cid, members]) => {
            if (members.length < 2) return null;
            const cx = members.reduce((s, n) => s + n.x, 0) / members.length;
            const cy = members.reduce((s, n) => s + n.y, 0) / members.length;
            const maxDist = Math.max(
              ...members.map((n) =>
                Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2)
              )
            );
            return (
              <circle
                key={`hull-${cid}`}
                cx={cx}
                cy={cy}
                r={maxDist + 30}
                fill={COMMUNITY_COLORS[cid % COMMUNITY_COLORS.length]}
                fillOpacity={0.08}
                stroke={COMMUNITY_COLORS[cid % COMMUNITY_COLORS.length]}
                strokeWidth={1.5}
                strokeOpacity={0.2}
                strokeDasharray="6,3"
              />
            );
          });
        })()}

      {/* Nodes */}
      {nodes.map((n) => {
        const color = COMMUNITY_COLORS[n.community % COMMUNITY_COLORS.length];
        const isHighlight = highlight === n.id;
        return (
          <g key={`n-${n.id}`}>
            {isHighlight && (
              <circle
                cx={n.x}
                cy={n.y}
                r={nodeRadius + 6}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeDasharray="4,2"
                className="animate-pulse"
              />
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={nodeRadius}
              fill={color}
              fillOpacity={0.9}
              stroke={color}
              strokeWidth={2}
            />
            <text
              x={n.x}
              y={n.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={nodes.length <= 3 ? 14 : 11}
              fontWeight={600}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Modularity bar ──────────────────────────────────────────

function ModularityBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value + 0.5) * 100)); // range [-0.5,1] → [0,100]
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">
        Q = {value.toFixed(4)}
      </span>
      <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Phase badge ─────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: LouvainStep["phase"] }) {
  const labels: Record<string, [string, string]> = {
    init: ["初期化", "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"],
    move: ["Phase 1: 局所移動", "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"],
    aggregate: ["Phase 2: 集約", "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"],
    done: ["収束", "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"],
  };
  const [label, cls] = labels[phase];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${cls}`}>
      {label}
    </span>
  );
}

// ── Main component ──────────────────────────────────────────

type Props = { locale?: string };

export function CommunityDetectionVisualizer({ locale = "ja" }: Props) {
  const steps = buildScenario();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1500 });
  const current = steps[player.step];
  const isJa = locale === "ja";

  const stepLabel = useCallback(
    (s: number) => `${s + 1} / ${steps.length}`,
    [steps.length]
  );

  return (
    <InteractiveDemo
      title={isJa ? "Louvain アルゴリズム ステップ実行" : "Louvain Algorithm Step-Through"}
      description={
        isJa
          ? "10 ノードのグラフで Louvain の 2 フェーズ（局所移動 → 集約）を追体験します"
          : "Walk through Louvain's two phases (local moving → aggregation) on a 10-node graph"
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <PhaseBadge phase={current.phase} />
          <ModularityBar value={current.modularity} />
        </div>

        <GraphView step={current} />

        <p className="text-sm text-muted-foreground min-h-[3rem]">
          {isJa ? current.description : current.descriptionEn}
        </p>

        <StepPlayerControls {...player} label={stepLabel} />
      </div>
    </InteractiveDemo>
  );
}
