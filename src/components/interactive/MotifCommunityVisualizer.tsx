"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type Node = {
  id: number;
  label: string;
  x: number;
  y: number;
  community: number;
};

type Edge = {
  source: number;
  target: number;
  motifWeight: number; // number of triangles this edge participates in
};

type MotifStep = {
  nodes: Node[];
  edges: Edge[];
  description: string;
  descriptionEn: string;
  phase: "graph" | "count" | "weight" | "spectral" | "result";
  highlightTriangles?: number[][]; // array of [a,b,c] node IDs
  highlightEdges?: [number, number][];
  communityColors?: Record<number, string>;
};

// ── Colors ──────────────────────────────────────────────────

const COLORS: Record<number, string> = {
  0: "#6366f1", // indigo (default / unassigned)
  1: "#3b82f6", // blue
  2: "#ef4444", // red
  3: "#10b981", // emerald
};

// ── Build Scenario ──────────────────────────────────────────

function buildScenario(): MotifStep[] {
  // 8-node graph with two triangle-dense clusters connected by a weak bridge
  const positions: [number, number][] = [
    [80, 50],   // 0
    [140, 25],  // 1
    [140, 75],  // 2
    [200, 50],  // 3
    [340, 50],  // 4
    [400, 25],  // 5
    [400, 75],  // 6
    [460, 50],  // 7
  ];

  const allEdges: Edge[] = [
    // Cluster A: dense triangles (0-1-2, 0-2-3, 1-2-3, 0-1-3)
    { source: 0, target: 1, motifWeight: 0 },
    { source: 0, target: 2, motifWeight: 0 },
    { source: 1, target: 2, motifWeight: 0 },
    { source: 0, target: 3, motifWeight: 0 },
    { source: 1, target: 3, motifWeight: 0 },
    { source: 2, target: 3, motifWeight: 0 },
    // Cluster B: dense triangles (4-5-6, 4-6-7, 5-6-7, 4-5-7)
    { source: 4, target: 5, motifWeight: 0 },
    { source: 4, target: 6, motifWeight: 0 },
    { source: 5, target: 6, motifWeight: 0 },
    { source: 4, target: 7, motifWeight: 0 },
    { source: 5, target: 7, motifWeight: 0 },
    { source: 6, target: 7, motifWeight: 0 },
    // Bridge: 3 - 4 (no triangle)
    { source: 3, target: 4, motifWeight: 0 },
  ];

  const mkNodes = (communities?: number[]): Node[] =>
    positions.map(([x, y], i) => ({
      id: i,
      label: `${i}`,
      x,
      y,
      community: communities ? communities[i] : 0,
    }));

  // Triangles in cluster A: {0,1,2}, {0,1,3}, {0,2,3}, {1,2,3}
  // Triangles in cluster B: {4,5,6}, {4,5,7}, {4,6,7}, {5,6,7}

  const clusterATriangles = [[0,1,2],[0,1,3],[0,2,3],[1,2,3]];
  const clusterBTriangles = [[4,5,6],[4,5,7],[4,6,7],[5,6,7]];

  // Compute motif weights: each edge (i,j) weight = number of triangles containing both i and j
  function computeWeights(): Edge[] {
    const allTriangles = [...clusterATriangles, ...clusterBTriangles];
    return allEdges.map(e => {
      let count = 0;
      for (const tri of allTriangles) {
        if (tri.includes(e.source) && tri.includes(e.target)) {
          count++;
        }
      }
      return { ...e, motifWeight: count };
    });
  }

  const weightedEdges = computeWeights();

  return [
    // Step 0: Show original graph
    {
      nodes: mkNodes(),
      edges: allEdges,
      description:
        "元のグラフ: 8 ノード・13 辺。左のクラスター A {0,1,2,3} と右のクラスター B {4,5,6,7} が、辺 3-4 でつながっています。どちらのクラスターも辺が密です。",
      descriptionEn:
        "Original graph: 8 nodes, 13 edges. The left cluster A {0,1,2,3} and the right cluster B {4,5,6,7} are connected by edge 3-4. Both clusters are dense in edges.",
      phase: "graph",
    },
    // Step 1: Enumerate triangles in cluster A
    {
      nodes: mkNodes(),
      edges: allEdges,
      description:
        "三角形モチーフを列挙します。クラスター A には {0,1,2}, {0,1,3}, {0,2,3}, {1,2,3} の 4 つの三角形があります。A は 4 ノードの完全グラフ (K₄) なので、どの 3 ノードも三角形を作ります。",
      descriptionEn:
        "Enumerate the triangle motifs. Cluster A contains 4 triangles: {0,1,2}, {0,1,3}, {0,2,3}, and {1,2,3}. Because A is the complete graph K₄, every three of its nodes form a triangle.",
      phase: "count",
      highlightTriangles: clusterATriangles,
    },
    // Step 2: Enumerate triangles in cluster B
    {
      nodes: mkNodes(),
      edges: allEdges,
      description:
        "クラスター B にも同じく 4 つの三角形 {4,5,6}, {4,5,7}, {4,6,7}, {5,6,7} があります。一方、ブリッジ辺 3-4 を含む三角形はありません。",
      descriptionEn:
        "Cluster B likewise has 4 triangles: {4,5,6}, {4,5,7}, {4,6,7}, and {5,6,7}. No triangle contains the bridge edge 3-4.",
      phase: "count",
      highlightTriangles: clusterBTriangles,
      highlightEdges: [[3, 4]],
    },
    // Step 3: Compute motif-weighted adjacency
    {
      nodes: mkNodes(),
      edges: weightedEdges,
      description:
        "モチーフ重み付き隣接行列を作ります。各辺の重みは、その辺を含む三角形の数です。クラスター内の辺は 2 つの三角形に含まれるので重み 2、ブリッジ辺 3-4 は重み 0 です。三角形で見ると、2 つのクラスターはつながっていません。",
      descriptionEn:
        "Build the motif-weighted adjacency matrix: each edge's weight is the number of triangles that contain it. Intra-cluster edges lie in 2 triangles and get weight 2; the bridge edge 3-4 gets weight 0. Seen through triangles, the two clusters are not connected.",
      phase: "weight",
    },
    // Step 4: Spectral clustering on motif-weighted graph
    {
      nodes: mkNodes(),
      edges: weightedEdges,
      description:
        "モチーフ重み付きラプラシアン L(M) = D(M) - W(M) を作り、Fiedler ベクトルでグラフを 2 分割します。ブリッジ辺の重みが 0 なので、この分割で切れる三角形はありません（Motif Conductance は 0）。",
      descriptionEn:
        "Construct the motif-weighted Laplacian L(M) = D(M) - W(M) and split the graph in two with the Fiedler vector. Because the bridge edge has weight 0, the split cuts no triangle (Motif Conductance is 0).",
      phase: "spectral",
    },
    // Step 5: Final result
    {
      nodes: mkNodes([1, 1, 1, 1, 2, 2, 2, 2]),
      edges: weightedEdges,
      description:
        "結果: 三角形モチーフに基づいて、2 つのコミュニティー {0,1,2,3} と {4,5,6,7} が得られました。辺で数えるとこの分割はブリッジ 3-4 の 1 本を切りますが、三角形で数えると切れるモチーフは 0 個です。",
      descriptionEn:
        "Result: the triangle motifs give two communities, {0,1,2,3} and {4,5,6,7}. Counted in edges, the split cuts one edge (the bridge 3-4); counted in triangles, it cuts none.",
      phase: "result",
      communityColors: { 1: "#3b82f6", 2: "#ef4444" },
    },
  ];
}

// ── Main Component ──────────────────────────────────────────

type MotifCommunityVisualizerProps = { locale?: string };

export function MotifCommunityVisualizer({
  locale = "ja",
}: MotifCommunityVisualizerProps) {
  const isJa = locale === "ja";
  const steps = buildScenario();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2500 });
  const current = steps[player.step];

  const getNodeColor = useCallback(
    (node: Node) => {
      if (current.communityColors && node.community !== 0) {
        return current.communityColors[node.community] || COLORS[0];
      }
      return COLORS[0];
    },
    [current]
  );

  const isEdgeHighlighted = useCallback(
    (e: Edge) => {
      if (!current.highlightEdges) return false;
      return current.highlightEdges.some(
        ([s, t]) =>
          (e.source === s && e.target === t) ||
          (e.source === t && e.target === s)
      );
    },
    [current]
  );

  const isNodeInTriangle = useCallback(
    (nodeId: number) => {
      if (!current.highlightTriangles) return false;
      return current.highlightTriangles.some((tri) => tri.includes(nodeId));
    },
    [current]
  );

  return (
    <InteractiveDemo
      title={
        isJa
          ? "モチーフベース・コミュニティー検出のステップ"
          : "Motif-Based Community Detection Steps"
      }
      description={
        isJa
          ? "三角形モチーフの密度に基づいてコミュニティーを検出するプロセスを可視化します。"
          : "Visualizing the process of detecting communities based on triangle motif density."
      }
    >
      {/* SVG visualization */}
      <svg
        viewBox="0 0 540 130"
        className="w-full h-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
      >
        {/* Draw triangle highlights */}
        {current.highlightTriangles?.map((tri, ti) => {
          const nodes = current.nodes;
          const n0 = nodes.find((n) => n.id === tri[0])!;
          const n1 = nodes.find((n) => n.id === tri[1])!;
          const n2 = nodes.find((n) => n.id === tri[2])!;
          return (
            <polygon
              key={ti}
              points={`${n0.x},${n0.y} ${n1.x},${n1.y} ${n2.x},${n2.y}`}
              fill="#fbbf24"
              fillOpacity={0.15}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeOpacity={0.4}
              strokeDasharray="4 2"
            />
          );
        })}

        {/* Draw edges */}
        {current.edges.map((e, ei) => {
          const src = current.nodes.find((n) => n.id === e.source)!;
          const tgt = current.nodes.find((n) => n.id === e.target)!;
          const highlighted = isEdgeHighlighted(e);
          const showWeight = current.phase === "weight" || current.phase === "spectral" || current.phase === "result";
          const strokeWidth = showWeight ? Math.max(1, e.motifWeight * 1.5) : 2;
          const strokeColor = highlighted
            ? "#ef4444"
            : showWeight && e.motifWeight === 0
            ? "#d1d5db"
            : "#94a3b8";
          const opacity = showWeight && e.motifWeight === 0 ? 0.3 : 0.6;

          return (
            <g key={ei}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={opacity}
                strokeDasharray={highlighted ? "4 2" : undefined}
              />
              {showWeight && (
                <text
                  x={(src.x + tgt.x) / 2}
                  y={(src.y + tgt.y) / 2 - 5}
                  textAnchor="middle"
                  className="text-[9px] font-mono font-bold"
                  fill={e.motifWeight === 0 ? "#ef4444" : "#f59e0b"}
                >
                  {e.motifWeight}
                </text>
              )}
            </g>
          );
        })}

        {/* Draw nodes */}
        {current.nodes.map((node) => {
          const inTri = isNodeInTriangle(node.id);
          const color = getNodeColor(node);
          return (
            <g key={node.id}>
              {inTri && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={16}
                  fill="#fbbf24"
                  fillOpacity={0.3}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={12}
                fill={color}
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className="text-[10px] font-bold"
                fill="white"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 mt-3">
        <span
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            current.phase === "graph"
              ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
              : current.phase === "count"
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              : current.phase === "weight"
              ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
              : current.phase === "spectral"
              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
              : "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
          }`}
        >
          {current.phase === "graph"
            ? isJa ? "グラフ確認" : "Graph Overview"
            : current.phase === "count"
            ? isJa ? "モチーフ列挙" : "Motif Enumeration"
            : current.phase === "weight"
            ? isJa ? "重み付け" : "Weighting"
            : current.phase === "spectral"
            ? isJa ? "スペクトラル分割" : "Spectral Partition"
            : isJa ? "結果" : "Result"}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-2 leading-relaxed">
        {isJa ? current.description : current.descriptionEn}
      </p>

      <StepPlayerControls
        {...player}
        label={(step) =>
          isJa
            ? `ステップ ${step + 1} / ${steps.length}`
            : `Step ${step + 1} / ${steps.length}`
        }
        ariaLabels={stepPlayerAriaLabels(locale)}
      />
    </InteractiveDemo>
  );
}
