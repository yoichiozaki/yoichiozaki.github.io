"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type SNode = {
  id: number;
  label: string;
  x: number;
  y: number;
  community: number;
};

type SEdge = {
  source: number;
  target: number;
  action: "add" | "remove" | "existing";
};

type StreamStep = {
  nodes: SNode[];
  edges: SEdge[];
  description: string;
  descriptionEn: string;
  highlight: string;
  highlightEn: string;
  phase: "init" | "add" | "remove" | "update" | "split" | "merge" | "result";
};

// ── Community Colors ────────────────────────────────────────

const COLORS: Record<number, string> = {
  0: "#6b7280",
  1: "#3b82f6",
  2: "#ef4444",
  3: "#10b981",
  4: "#f59e0b",
  5: "#8b5cf6",
};

// ── Build Streaming Scenario ────────────────────────────────

function buildStreamingScenario(): StreamStep[] {
  // Demonstrates: edges arriving one-by-one, label propagation updates, community formation,
  // edge removal causing community split
  return [
    // Step 0: Initial empty graph — nodes exist but no community assignments
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 0 },
        { id: 1, label: "B", x: 110, y: 30, community: 0 },
        { id: 2, label: "C", x: 110, y: 70, community: 0 },
        { id: 3, label: "D", x: 200, y: 30, community: 0 },
        { id: 4, label: "E", x: 200, y: 70, community: 0 },
        { id: 5, label: "F", x: 260, y: 50, community: 0 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [],
      description:
        "初期状態: 8 つのノードが存在するが、辺はまだ到着していない。全ノード未割り当て（灰色）。",
      descriptionEn:
        "Initial state: 8 nodes exist but no edges have arrived yet. All nodes unassigned (gray).",
      highlight: "ストリーミング処理の開始を待機",
      highlightEn: "Waiting for streaming edges to arrive",
      phase: "init",
    },
    // Step 1: Edge A-B arrives
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 0 },
        { id: 3, label: "D", x: 200, y: 30, community: 0 },
        { id: 4, label: "E", x: 200, y: 70, community: 0 },
        { id: 5, label: "F", x: 260, y: 50, community: 0 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [{ source: 0, target: 1, action: "add" }],
      description:
        "辺 A-B が到着。両ノードとも未割り当てなので、新しいコミュニティ（青）を作成。",
      descriptionEn:
        "Edge A-B arrives. Both nodes are unassigned, so a new community (blue) is created.",
      highlight: "新規コミュニティの誕生",
      highlightEn: "Birth of a new community",
      phase: "add",
    },
    // Step 2: Edge A-C arrives
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 0 },
        { id: 4, label: "E", x: 200, y: 70, community: 0 },
        { id: 5, label: "F", x: 260, y: 50, community: 0 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "add" },
      ],
      description:
        "辺 A-C が到着。C は未割り当てだが A のコミュニティに合流。ラベル伝搬: A のラベルが C に伝わる。",
      descriptionEn:
        "Edge A-C arrives. C is unassigned — joins A's community via label propagation.",
      highlight: "ラベル伝搬による拡張",
      highlightEn: "Label propagation expansion",
      phase: "add",
    },
    // Step 3: Edge B-C arrives, forming triangle
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 0 },
        { id: 4, label: "E", x: 200, y: 70, community: 0 },
        { id: 5, label: "F", x: 260, y: 50, community: 0 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "add" },
      ],
      description:
        "辺 B-C が到着し、三角形 △ABC が形成。コミュニティ内の密度が上がり、TILES なら三角形の完成をトリガーにコミュニティを確定する。",
      descriptionEn:
        "Edge B-C arrives, forming triangle △ABC. In TILES, triangle completion triggers community confirmation.",
      highlight: "三角形の完成 → コミュニティ強化",
      highlightEn: "Triangle completion → community reinforcement",
      phase: "add",
    },
    // Step 4: Edges D-E and E-F arrive — new community forms
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "add" },
        { source: 4, target: 5, action: "add" },
      ],
      description:
        "辺 D-E と E-F が相次いで到着。別の新規コミュニティ（赤）が形成される。",
      descriptionEn:
        "Edges D-E and E-F arrive in succession. A second community (red) forms.",
      highlight: "2 つ目のコミュニティが並行して成長",
      highlightEn: "Second community grows in parallel",
      phase: "add",
    },
    // Step 5: Edge D-F to complete another triangle
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "add" },
      ],
      description:
        "辺 D-F が到着し、三角形 △DEF が完成。赤コミュニティの結合が強化された。",
      descriptionEn:
        "Edge D-F arrives, completing triangle △DEF. Red community is reinforced.",
      highlight: "2 つ目の三角形も完成",
      highlightEn: "Second triangle completed",
      phase: "add",
    },
    // Step 6: Bridge edge C-D links the two communities
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 0 },
        { id: 7, label: "H", x: 320, y: 65, community: 0 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "existing" },
        { source: 2, target: 3, action: "add" },
      ],
      description:
        "ブリッジ辺 C-D が到着。2 つのコミュニティが接続された。ナイーブな LPA ならマージの可能性があるが、Modularity を監視する手法は「分離を保つ方が Q が高い」と判定し、コミュニティを維持する。",
      descriptionEn:
        "Bridge edge C-D arrives, connecting two communities. Naive LPA might merge them, but modularity-aware methods keep them separate if Q is higher.",
      highlight: "ブリッジ辺: マージか分離か？",
      highlightEn: "Bridge edge: merge or keep separate?",
      phase: "update",
    },
    // Step 7: Edges F-G, F-H, G-H arrive — third community
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 3 },
        { id: 7, label: "H", x: 320, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "existing" },
        { source: 2, target: 3, action: "existing" },
        { source: 5, target: 6, action: "add" },
        { source: 5, target: 7, action: "add" },
        { source: 6, target: 7, action: "add" },
      ],
      description:
        "辺 F-G, F-H, G-H が到着し、3 つ目のコミュニティ（緑）が誕生。G と H は F とも接続されるが、F は赤コミュニティに留まる（F の赤コミュニティ内の辺が多い）。",
      descriptionEn:
        "Edges F-G, F-H, G-H arrive. A third community (green) forms. F stays in red community due to stronger internal connections.",
      highlight: "境界ノード F: 複数コミュニティに接続",
      highlightEn: "Boundary node F: connected to multiple communities",
      phase: "add",
    },
    // Step 8: Edge removal — C-D is removed (relationship dissolved)
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 3 },
        { id: 7, label: "H", x: 320, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "existing" },
        { source: 2, target: 3, action: "remove" },
        { source: 5, target: 6, action: "existing" },
        { source: 5, target: 7, action: "existing" },
        { source: 6, target: 7, action: "existing" },
      ],
      description:
        "辺 C-D が削除（ストリーミングでは辺の削除も発生する）。ブリッジの消失により、青と赤コミュニティは完全に分離。増分的手法ではブリッジ辺の削除時にのみ局所的な再計算を行う。",
      descriptionEn:
        "Edge C-D is removed (edge deletions also occur in streaming). The bridge disappears; blue and red communities are fully separated. Incremental methods only recompute locally when bridge edges are removed.",
      highlight: "辺削除 → 局所的な再計算のみ",
      highlightEn: "Edge deletion → local recomputation only",
      phase: "remove",
    },
    // Step 9: New edge B-D creates a new bridge
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 3 },
        { id: 7, label: "H", x: 320, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "existing" },
        { source: 1, target: 3, action: "add" },
        { source: 5, target: 6, action: "existing" },
        { source: 5, target: 7, action: "existing" },
        { source: 6, target: 7, action: "existing" },
      ],
      description:
        "辺 B-D が到着し新たなブリッジが形成。コミュニティ構造自体は維持されるが、B と D がコミュニティ間の仲介役になる。delta-screening Louvain は、この辺の追加が Modularity に影響する範囲（B, D の近傍）のみを再評価する。",
      descriptionEn:
        "Edge B-D arrives, creating a new bridge. Community structure is maintained. Delta-screening Louvain only re-evaluates the neighborhood of B and D.",
      highlight: "delta-screening: 影響範囲のみ再計算",
      highlightEn: "Delta-screening: recompute only affected scope",
      phase: "update",
    },
    // Step 10: Final state overview
    {
      nodes: [
        { id: 0, label: "A", x: 50, y: 50, community: 1 },
        { id: 1, label: "B", x: 110, y: 30, community: 1 },
        { id: 2, label: "C", x: 110, y: 70, community: 1 },
        { id: 3, label: "D", x: 200, y: 30, community: 2 },
        { id: 4, label: "E", x: 200, y: 70, community: 2 },
        { id: 5, label: "F", x: 260, y: 50, community: 2 },
        { id: 6, label: "G", x: 320, y: 35, community: 3 },
        { id: 7, label: "H", x: 320, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1, action: "existing" },
        { source: 0, target: 2, action: "existing" },
        { source: 1, target: 2, action: "existing" },
        { source: 3, target: 4, action: "existing" },
        { source: 4, target: 5, action: "existing" },
        { source: 3, target: 5, action: "existing" },
        { source: 1, target: 3, action: "existing" },
        { source: 5, target: 6, action: "existing" },
        { source: 5, target: 7, action: "existing" },
        { source: 6, target: 7, action: "existing" },
      ],
      description:
        "最終状態: 3 つの明確なコミュニティが検出された。ストリーミング手法は、辺が 1 本ずつ到着・削除されるたびに局所的に更新を行い、全体の再計算を回避する。",
      descriptionEn:
        "Final state: 3 clear communities detected. Streaming methods update locally as each edge arrives or departs, avoiding full recomputation.",
      highlight: "ストリーミング CD: 局所更新が鍵",
      highlightEn: "Streaming CD: local updates are key",
      phase: "result",
    },
  ];
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function StreamingCommunityVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const steps = buildStreamingScenario();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2000 });
  const current = steps[player.step];

  const nodeMap = new Map(current.nodes.map((n) => [n.id, n]));

  const getLabel = useCallback(
    (step: number) => {
      const s = steps[step];
      return isJa ? s.highlight : s.highlightEn;
    },
    [steps, isJa]
  );

  const phaseColors: Record<string, string> = {
    init: "#6b7280",
    add: "#10b981",
    remove: "#ef4444",
    update: "#f59e0b",
    split: "#8b5cf6",
    merge: "#3b82f6",
    result: "#6366f1",
  };

  const phaseLabels: Record<string, string> = {
    init: isJa ? "初期化" : "Init",
    add: isJa ? "辺追加" : "Edge Add",
    remove: isJa ? "辺削除" : "Edge Remove",
    update: isJa ? "更新" : "Update",
    split: isJa ? "分裂" : "Split",
    merge: isJa ? "統合" : "Merge",
    result: isJa ? "結果" : "Result",
  };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ストリーミング・コミュニティ検出シミュレーター"
          : "Streaming Community Detection Simulator"
      }
      description={
        isJa
          ? "辺がストリームとして 1 本ずつ到着・削除される状況で、コミュニティがどう変化するかを観察します。"
          : "Observe how communities evolve as edges arrive and depart one by one in a streaming fashion."
      }
    >
      {/* Phase indicator */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-bold text-white"
          style={{ backgroundColor: phaseColors[current.phase] }}
        >
          {phaseLabels[current.phase]}
        </span>
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {isJa ? current.description : current.descriptionEn}
        </span>
      </div>

      {/* Graph SVG */}
      <svg
        viewBox="0 0 370 100"
        className="mx-auto mb-4 w-full max-w-2xl"
        style={{ background: "transparent" }}
      >
        {/* Edges */}
        {current.edges.map((e, i) => {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          if (!src || !tgt) return null;
          const isAdding = e.action === "add";
          const isRemoving = e.action === "remove";
          return (
            <line
              key={`e-${i}`}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={
                isRemoving
                  ? "#ef4444"
                  : isAdding
                    ? "#10b981"
                    : "#9ca3af"
              }
              strokeWidth={isAdding || isRemoving ? 2.5 : 1.5}
              strokeDasharray={isRemoving ? "4,3" : isAdding ? "6,3" : "none"}
              opacity={isRemoving ? 0.5 : 1}
            />
          );
        })}
        {/* Nodes */}
        {current.nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={12}
              fill={COLORS[n.community] || COLORS[0]}
              stroke="#fff"
              strokeWidth={2}
              opacity={0.9}
            />
            <text
              x={n.x}
              y={n.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fontWeight="bold"
              fill="#fff"
            >
              {n.label}
            </text>
          </g>
        ))}
        {/* Legend for edge actions */}
        {current.phase !== "init" && current.phase !== "result" && (
          <g>
            <line
              x1={10}
              y1={95}
              x2={25}
              y2={95}
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="6,3"
            />
            <text
              x={28}
              y={96}
              fontSize={7}
              fill="#6b7280"
              dominantBaseline="central"
            >
              {isJa ? "追加" : "Add"}
            </text>
            <line
              x1={60}
              y1={95}
              x2={75}
              y2={95}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="4,3"
            />
            <text
              x={78}
              y={96}
              fontSize={7}
              fill="#6b7280"
              dominantBaseline="central"
            >
              {isJa ? "削除" : "Remove"}
            </text>
            <line
              x1={115}
              y1={95}
              x2={130}
              y2={95}
              stroke="#9ca3af"
              strokeWidth={1.5}
            />
            <text
              x={133}
              y={96}
              fontSize={7}
              fill="#6b7280"
              dominantBaseline="central"
            >
              {isJa ? "既存" : "Existing"}
            </text>
          </g>
        )}
      </svg>

      <StepPlayerControls {...player} label={getLabel} />
    </InteractiveDemo>
  );
}
