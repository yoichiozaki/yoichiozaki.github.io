"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
        "辺 A-B が到着。両ノードとも未割り当てなので、新しいコミュニティー（青）を作成。",
      descriptionEn:
        "Edge A-B arrives. Both nodes are unassigned, so a new community (blue) is created.",
      highlight: "新規コミュニティーの誕生",
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
        "辺 A-C が到着。C は未割り当てなので A のラベルが伝わり、A のコミュニティー（青）に加わる（ラベル伝搬）。",
      descriptionEn:
        "Edge A-C arrives. C is unassigned, so it takes A's label and joins A's community (blue) via label propagation.",
      highlight: "ラベル伝搬による拡張",
      highlightEn: "Expansion via label propagation",
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
        "辺 B-C が到着し、三角形 △ABC が形成。コミュニティー内の密度が上がる。TILES なら、この三角形ができた時点で初めてコミュニティーを作る。",
      descriptionEn:
        "Edge B-C arrives, forming triangle △ABC, and the community becomes denser. TILES would create the community only now, when the triangle forms.",
      highlight: "三角形の完成 → コミュニティー強化",
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
        "辺 D-E と E-F が相次いで到着。別の新規コミュニティー（赤）が形成される。",
      descriptionEn:
        "Edges D-E and E-F arrive in succession. A second community (red) forms.",
      highlight: "2 つ目のコミュニティーが並行して成長",
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
        "辺 D-F が到着し、三角形 △DEF が完成。赤コミュニティーの結合が強化された。",
      descriptionEn:
        "Edge D-F arrives, completing triangle △DEF. The red community is reinforced.",
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
        "ブリッジ辺 C-D が到着。2 つのコミュニティーが接続された。ナイーブな LPA ならマージの可能性があるが、Modularity を監視する手法は、分離したままの方が Modularity Q が高いと判定し、2 つのコミュニティーを維持する。",
      descriptionEn:
        "Bridge edge C-D arrives, connecting two communities. Naive LPA might merge them, but Modularity-aware methods keep them separate because Modularity Q is higher that way.",
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
        "辺 F-G, F-H, G-H が到着し、3 つ目のコミュニティー（緑）が誕生。F は赤（D, E）と緑（G, H）に 2 本ずつ辺を持ち、どちらに入れるかは手法による。この図では赤に残す（重複を許す TILES なら両方に属する）。",
      descriptionEn:
        "Edges F-G, F-H, G-H arrive. A third community (green) forms. F has two edges into red (D, E) and two into green (G, H), so its placement depends on the method; here it stays red (TILES, which allows overlap, would put F in both).",
      highlight: "境界ノード F: 複数コミュニティーに接続",
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
        "辺 C-D が削除（ストリーミングでは辺の削除も発生する）。ブリッジがなくなり、青と赤のコミュニティーは完全に分離。増分的手法は、この削除でも影響を受ける C, D の周辺だけを再計算する。",
      descriptionEn:
        "Edge C-D is removed (edge deletions also occur in streaming). With the bridge gone, the blue and red communities are fully separated. Incremental methods recompute only around C and D, the nodes this deletion affects.",
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
        "辺 B-D が到着し新たなブリッジが形成。コミュニティー構造自体は維持されるが、B と D がコミュニティー間の仲介役になる。delta-screening Louvain は、Modularity 利得が変わりうるノード（B, D の近傍と、B, D が属するコミュニティーのノード）だけを再評価する。",
      descriptionEn:
        "Edge B-D arrives, creating a new bridge. The community structure is maintained, with B and D now linking the communities. Delta-screening Louvain re-evaluates only nodes whose Modularity gain may change: the neighbors of B and D and the members of their communities.",
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
        "最終状態: 青・赤・緑の 3 つのコミュニティー。ストリーミング手法は、辺が 1 本到着・削除されるたびに変更の周辺だけを更新し、グラフ全体の再計算を避ける。",
      descriptionEn:
        "Final state: three communities (blue, red, green). Streaming methods update only the region around each edge that arrives or is removed, avoiding a full recomputation.",
      highlight: "ストリーミング CD: 変更の周辺だけを更新",
      highlightEn: "Streaming CD: update only around each change",
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

  const getLabel = (step: number) => {
    const s = steps[step];
    return isJa ? s.highlight : s.highlightEn;
  };

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
    init: isJa ? "初期状態" : "Initial state",
    add: isJa ? "辺追加" : "Edge added",
    remove: isJa ? "辺削除" : "Edge removed",
    update: isJa ? "更新" : "Update",
    split: isJa ? "分裂" : "Split",
    merge: isJa ? "統合" : "Merge",
    result: isJa ? "結果" : "Result",
  };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ストリーミング・コミュニティー検出シミュレーター"
          : "Streaming Community Detection Simulator"
      }
      description={
        isJa
          ? "説明用のシナリオで、辺が 1 本ずつ到着・削除されるたびにコミュニティーがどう変わるかを示します。ノードの色は所属コミュニティー（灰色は未所属）です。"
          : "An illustrative scenario showing how communities change as edges arrive and are removed one at a time. Node color shows community membership (gray = unassigned)."
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
              {isJa ? "追加" : "Added"}
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
              {isJa ? "削除" : "Removed"}
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

      <StepPlayerControls {...player} label={getLabel} ariaLabels={stepPlayerAriaLabels(locale)} />
    </InteractiveDemo>
  );
}
