"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type TNode = {
  id: number;
  label: string;
  x: number;
  y: number;
  community: number;
};

type TEdge = {
  source: number;
  target: number;
};

type TimeStep = {
  t: number;
  nodes: TNode[];
  edges: TEdge[];
  description: string;
  descriptionEn: string;
  event: "none" | "birth" | "growth" | "split" | "merge" | "death";
  eventLabelJa: string;
  eventLabelEn: string;
};

// ── Community Colors ────────────────────────────────────────

const C_COLORS: Record<number, string> = {
  1: "#3b82f6",
  2: "#ef4444",
  3: "#10b981",
  4: "#f59e0b",
  5: "#8b5cf6",
};

// ── Build Temporal Scenario ─────────────────────────────────

function buildTemporalScenario(): TimeStep[] {
  return [
    // t=1: Two communities
    {
      t: 1,
      nodes: [
        { id: 0, label: "A", x: 60, y: 40, community: 1 },
        { id: 1, label: "B", x: 100, y: 25, community: 1 },
        { id: 2, label: "C", x: 100, y: 55, community: 1 },
        { id: 3, label: "D", x: 250, y: 30, community: 2 },
        { id: 4, label: "E", x: 290, y: 50, community: 2 },
        { id: 5, label: "F", x: 250, y: 65, community: 2 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 1, target: 2 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 2, target: 3 },
      ],
      description:
        "t=1: 初期状態。2 つのコミュニティ（青・赤）が存在。辺 C-D がコミュニティ間のブリッジ。",
      descriptionEn:
        "t=1: Initial state. Two communities (blue, red) exist. Edge C-D bridges them.",
      event: "none",
      eventLabelJa: "安定",
      eventLabelEn: "Stable",
    },
    // t=2: Growth — new node G joins blue community
    {
      t: 2,
      nodes: [
        { id: 0, label: "A", x: 60, y: 40, community: 1 },
        { id: 1, label: "B", x: 100, y: 25, community: 1 },
        { id: 2, label: "C", x: 100, y: 55, community: 1 },
        { id: 6, label: "G", x: 55, y: 70, community: 1 },
        { id: 3, label: "D", x: 250, y: 30, community: 2 },
        { id: 4, label: "E", x: 290, y: 50, community: 2 },
        { id: 5, label: "F", x: 250, y: 65, community: 2 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 1, target: 2 },
        { source: 0, target: 6 },
        { source: 2, target: 6 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 2, target: 3 },
      ],
      description:
        "t=2: 成長 — ノード G が青コミュニティに参加。A, C と接続。コミュニティが拡大。",
      descriptionEn:
        "t=2: Growth — Node G joins the blue community, connecting to A and C. Community expands.",
      event: "growth",
      eventLabelJa: "成長",
      eventLabelEn: "Growth",
    },
    // t=3: Birth — new green community emerges
    {
      t: 3,
      nodes: [
        { id: 0, label: "A", x: 60, y: 35, community: 1 },
        { id: 1, label: "B", x: 100, y: 20, community: 1 },
        { id: 2, label: "C", x: 100, y: 50, community: 1 },
        { id: 6, label: "G", x: 55, y: 65, community: 1 },
        { id: 3, label: "D", x: 220, y: 25, community: 2 },
        { id: 4, label: "E", x: 260, y: 42, community: 2 },
        { id: 5, label: "F", x: 220, y: 58, community: 2 },
        { id: 7, label: "H", x: 350, y: 30, community: 3 },
        { id: 8, label: "I", x: 390, y: 50, community: 3 },
        { id: 9, label: "J", x: 350, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 2 },
        { source: 1, target: 2 },
        { source: 0, target: 6 },
        { source: 2, target: 6 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 2, target: 3 },
        { source: 7, target: 8 },
        { source: 7, target: 9 },
        { source: 8, target: 9 },
        { source: 4, target: 7 },
      ],
      description:
        "t=3: 誕生 — 新しい緑コミュニティ {H,I,J} が出現。E-H のブリッジで赤コミュニティと接続。",
      descriptionEn:
        "t=3: Birth — A new green community {H,I,J} emerges, connected to the red community via E-H bridge.",
      event: "birth",
      eventLabelJa: "誕生",
      eventLabelEn: "Birth",
    },
    // t=4: Split — blue community splits
    {
      t: 4,
      nodes: [
        { id: 0, label: "A", x: 40, y: 35, community: 1 },
        { id: 1, label: "B", x: 80, y: 20, community: 1 },
        { id: 2, label: "C", x: 140, y: 40, community: 4 },
        { id: 6, label: "G", x: 35, y: 65, community: 1 },
        { id: 3, label: "D", x: 220, y: 25, community: 2 },
        { id: 4, label: "E", x: 260, y: 42, community: 2 },
        { id: 5, label: "F", x: 220, y: 58, community: 2 },
        { id: 7, label: "H", x: 350, y: 30, community: 3 },
        { id: 8, label: "I", x: 390, y: 50, community: 3 },
        { id: 9, label: "J", x: 350, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 6 },
        { source: 1, target: 6 },
        { source: 2, target: 3 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 7, target: 8 },
        { source: 7, target: 9 },
        { source: 8, target: 9 },
        { source: 4, target: 7 },
      ],
      description:
        "t=4: 分裂 — A-C, B-C の辺が消失し、青コミュニティが分裂。C はノード D との接続から黄コミュニティ（赤寄り）に。{A,B,G} が残存コミュニティとなる。",
      descriptionEn:
        "t=4: Split — Edges A-C and B-C disappear. Blue community splits. C migrates toward D, forming a yellow-ish community. {A,B,G} remains.",
      event: "split",
      eventLabelJa: "分裂",
      eventLabelEn: "Split",
    },
    // t=5: Merge — red and yellow merge
    {
      t: 5,
      nodes: [
        { id: 0, label: "A", x: 40, y: 35, community: 1 },
        { id: 1, label: "B", x: 80, y: 20, community: 1 },
        { id: 6, label: "G", x: 35, y: 65, community: 1 },
        { id: 2, label: "C", x: 180, y: 25, community: 2 },
        { id: 3, label: "D", x: 220, y: 40, community: 2 },
        { id: 4, label: "E", x: 260, y: 55, community: 2 },
        { id: 5, label: "F", x: 220, y: 70, community: 2 },
        { id: 7, label: "H", x: 350, y: 30, community: 3 },
        { id: 8, label: "I", x: 390, y: 50, community: 3 },
        { id: 9, label: "J", x: 350, y: 65, community: 3 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 6 },
        { source: 1, target: 6 },
        { source: 2, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 7, target: 8 },
        { source: 7, target: 9 },
        { source: 8, target: 9 },
        { source: 4, target: 7 },
      ],
      description:
        "t=5: 統合 — C と赤コミュニティの間に辺 C-E が出現。C は完全に赤コミュニティに吸収され、{C,D,E,F} の拡大コミュニティに。",
      descriptionEn:
        "t=5: Merge — Edge C-E appears. C is fully absorbed into the red community, forming the expanded community {C,D,E,F}.",
      event: "merge",
      eventLabelJa: "統合",
      eventLabelEn: "Merge",
    },
    // t=6: Death — green community dissolves
    {
      t: 6,
      nodes: [
        { id: 0, label: "A", x: 40, y: 35, community: 1 },
        { id: 1, label: "B", x: 80, y: 20, community: 1 },
        { id: 6, label: "G", x: 35, y: 65, community: 1 },
        { id: 2, label: "C", x: 180, y: 25, community: 2 },
        { id: 3, label: "D", x: 220, y: 40, community: 2 },
        { id: 4, label: "E", x: 260, y: 55, community: 2 },
        { id: 5, label: "F", x: 220, y: 70, community: 2 },
        { id: 7, label: "H", x: 330, y: 35, community: 2 },
      ],
      edges: [
        { source: 0, target: 1 },
        { source: 0, target: 6 },
        { source: 1, target: 6 },
        { source: 2, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 },
        { source: 4, target: 7 },
        { source: 5, target: 7 },
      ],
      description:
        "t=6: 消滅 — ノード I, J が離脱し、H は赤コミュニティに吸収。緑コミュニティが消滅。ネットワークは 2 コミュニティ構造に回帰。動的ネットワークではこうしたライフサイクルイベントの追跡が課題となります。",
      descriptionEn:
        "t=6: Death — Nodes I, J leave; H is absorbed into the red community. The green community ceases to exist. The network returns to a 2-community structure. Tracking such lifecycle events is a key challenge in dynamic networks.",
      event: "death",
      eventLabelJa: "消滅",
      eventLabelEn: "Death",
    },
  ];
}

// ── Event Colors ────────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
  none: "#94a3b8",
  birth: "#10b981",
  growth: "#3b82f6",
  split: "#ef4444",
  merge: "#8b5cf6",
  death: "#64748b",
};

// ── Component ───────────────────────────────────────────────

type TemporalCommunityVisualizerProps = { locale?: string };

export function TemporalCommunityVisualizer({
  locale = "ja",
}: TemporalCommunityVisualizerProps) {
  const isJa = locale === "ja";
  const steps = buildTemporalScenario();
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2500 });
  const current = steps[player.step];

  const getColor = useCallback(
    (community: number) => C_COLORS[community] || "#94a3b8",
    []
  );

  return (
    <InteractiveDemo
      title={
        isJa
          ? "動的ネットワークにおけるコミュニティのライフサイクル"
          : "Community Lifecycle in Dynamic Networks"
      }
      description={
        isJa
          ? "時間とともにコミュニティが誕生・成長・分裂・統合・消滅する様子を追跡します。"
          : "Track how communities are born, grow, split, merge, and die over time."
      }
    >
      {/* Time indicator */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
          t = {current.t}
        </span>
        <span
          className="px-2 py-0.5 rounded text-xs font-bold text-white"
          style={{ backgroundColor: EVENT_COLORS[current.event] }}
        >
          {isJa ? current.eventLabelJa : current.eventLabelEn}
        </span>
        {/* Time bar */}
        <div className="flex-1 flex gap-1">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i <= player.step
                  ? "bg-indigo-500"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* SVG */}
      <svg
        viewBox="0 0 430 90"
        className="w-full h-auto border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
      >
        {/* Edges */}
        {current.edges.map((e, ei) => {
          const src = current.nodes.find((n) => n.id === e.source)!;
          const tgt = current.nodes.find((n) => n.id === e.target)!;
          const sameComm = src.community === tgt.community;
          return (
            <line
              key={ei}
              x1={src.x}
              y1={src.y}
              x2={tgt.x}
              y2={tgt.y}
              stroke={sameComm ? getColor(src.community) : "#94a3b8"}
              strokeWidth={sameComm ? 2 : 1}
              strokeOpacity={sameComm ? 0.5 : 0.3}
              strokeDasharray={sameComm ? undefined : "3 2"}
            />
          );
        })}

        {/* Nodes */}
        {current.nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={11}
              fill={getColor(node.community)}
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y + 4}
              textAnchor="middle"
              className="text-[9px] font-bold"
              fill="white"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      {/* Description */}
      <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-3 leading-relaxed">
        {isJa ? current.description : current.descriptionEn}
      </p>

      <StepPlayerControls
        {...player}
        label={(step) =>
          isJa ? `t = ${steps[step].t}` : `t = ${steps[step].t}`
        }
      />
    </InteractiveDemo>
  );
}
