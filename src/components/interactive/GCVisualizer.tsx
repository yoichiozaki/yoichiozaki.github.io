"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type ObjColor = "white" | "gray" | "black" | "freed";

type Obj = {
  id: string;
  label: string;
  color: ObjColor;
  refs: string[]; // ids of referenced objects
  isRoot?: boolean;
};

type GCState = {
  objects: Obj[];
  grayStack: string[]; // ids in the gray stack/queue
  phase: "idle" | "mark" | "sweep" | "done";
  description: string;
  descriptionEn: string;
  highlight?: string[];
};

// ── Scenario: Tri-color Mark & Sweep ────────────────────────

function buildScenario(): GCState[] {
  // Object graph:
  //   Root1 → A → C → F
  //   Root1 → B → D
  //   Root2 → E → C (already referenced)
  //   G (unreachable — garbage)
  //   H → I (unreachable subgraph — garbage)

  const mkObj = (
    id: string,
    label: string,
    refs: string[],
    color: ObjColor = "white",
    isRoot = false,
  ): Obj => ({ id, label, refs, color, isRoot });

  return [
    // Step 0: Initial — all objects allocated, no GC yet
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "white", true),
        mkObj("root2", "Root2", ["E"], "white", true),
        mkObj("A", "A", ["C"], "white"),
        mkObj("B", "B", ["D"], "white"),
        mkObj("C", "C", ["F"], "white"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "white"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: [],
      phase: "idle",
      description:
        "初期状態: ヒープ上に 11 個のオブジェクトが存在します。すべてのオブジェクトは白色（未探索）です。Root1 からは A, B へ、Root2 からは E への参照があります。G, H, I はどのルートからも到達不可能です。",
      descriptionEn:
        "Initial state: 11 objects exist on the heap. All are white (unvisited). Root1 references A and B; Root2 references E. G, H, and I are unreachable from any root.",
    },
    // Step 1: GC triggered — roots turn gray
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "gray", true),
        mkObj("root2", "Root2", ["E"], "gray", true),
        mkObj("A", "A", ["C"], "white"),
        mkObj("B", "B", ["D"], "white"),
        mkObj("C", "C", ["F"], "white"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "white"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["root1", "root2"],
      phase: "mark",
      description:
        "GC 開始: マークフェーズに入ります。GC ルート（グローバル変数、スタック上のポインタ）を灰色に塗り、灰色スタックに追加します。灰色 = 「自分は発見されたが、参照先はまだ未探索」を意味します。",
      descriptionEn:
        "GC starts: Entering the mark phase. GC roots (global variables, stack pointers) are colored gray and pushed onto the gray stack. Gray means 'discovered, but references not yet scanned'.",
      highlight: ["root1", "root2"],
    },
    // Step 2: Scan Root1 — A, B become gray; Root1 becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "gray", true),
        mkObj("A", "A", ["C"], "gray"),
        mkObj("B", "B", ["D"], "gray"),
        mkObj("C", "C", ["F"], "white"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "white"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["root2", "A", "B"],
      phase: "mark",
      description:
        "Root1 をスキャン: Root1 が参照するオブジェクト A, B を灰色に塗ります。Root1 自身はすべての参照先を灰色にしたので黒色に変わります。黒色 = 「自分も参照先も探索済み」を意味します。",
      descriptionEn:
        "Scan Root1: Objects A and B (referenced by Root1) are colored gray. Root1 turns black since all its references have been grayed. Black means 'fully scanned'.",
      highlight: ["root1", "A", "B"],
    },
    // Step 3: Scan Root2 — E becomes gray; Root2 becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "gray"),
        mkObj("B", "B", ["D"], "gray"),
        mkObj("C", "C", ["F"], "white"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "gray"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["A", "B", "E"],
      phase: "mark",
      description:
        "Root2 をスキャン: Root2 → E を灰色に。Root2 は黒色に。灰色スタックには A, B, E が残っています。三色不変条件（黒が白を直接参照しない）が常に維持されていることに注目してください。",
      descriptionEn:
        "Scan Root2: E turns gray. Root2 turns black. The gray stack still has A, B, E. Notice the tri-color invariant (black never directly references white) is always maintained.",
      highlight: ["root2", "E"],
    },
    // Step 4: Scan A — C becomes gray; A becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "gray"),
        mkObj("C", "C", ["F"], "gray"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "gray"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["B", "E", "C"],
      phase: "mark",
      description:
        "A をスキャン: A → C を灰色に。A は黒色に。灰色オブジェクトを一つずつ処理し、そのポインタフィールドをすべて走査するのがマークフェーズの基本動作です。",
      descriptionEn:
        "Scan A: C turns gray. A turns black. The mark phase processes gray objects one by one, scanning all their pointer fields.",
      highlight: ["A", "C"],
    },
    // Step 5: Scan B — D becomes gray; B becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "gray"),
        mkObj("D", "D", [], "gray"),
        mkObj("E", "E", ["C"], "gray"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["E", "C", "D"],
      phase: "mark",
      description:
        "B をスキャン: B → D を灰色に。B は黒色に。到達可能なオブジェクトが次々と灰色→黒色へ遷移していきます。",
      descriptionEn:
        "Scan B: D turns gray. B turns black. Reachable objects progressively transition from gray to black.",
      highlight: ["B", "D"],
    },
    // Step 6: Scan E — C is already gray, no new graying; E becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "gray"),
        mkObj("D", "D", [], "gray"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "white"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["C", "D"],
      phase: "mark",
      description:
        "E をスキャン: E → C ですが C はすでに灰色なので何もしません。E は黒色に。すでにマーク済みのオブジェクトを再度マークしないことで、循環参照でも無限ループに陥りません。",
      descriptionEn:
        "Scan E: E references C, but C is already gray — no action needed. E turns black. Skipping already-marked objects prevents infinite loops even with circular references.",
      highlight: ["E"],
    },
    // Step 7: Scan C — F becomes gray; C becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "black"),
        mkObj("D", "D", [], "gray"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "gray"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["D", "F"],
      phase: "mark",
      description:
        "C をスキャン: C → F を灰色に。C は黒色に。到達可能なオブジェクトグラフの末端に近づいています。",
      descriptionEn:
        "Scan C: F turns gray. C turns black. We're approaching the leaves of the reachable object graph.",
      highlight: ["C", "F"],
    },
    // Step 8: Scan D (leaf) — no refs; D becomes black
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "black"),
        mkObj("D", "D", [], "black"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "gray"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: ["F"],
      phase: "mark",
      description:
        "D をスキャン: D はリーフノード（参照先なし）なので、そのまま黒色に遷移します。",
      descriptionEn:
        "Scan D: D is a leaf node (no references), so it simply turns black.",
      highlight: ["D"],
    },
    // Step 9: Scan F (leaf) — no refs; F becomes black. Gray stack empty!
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "black"),
        mkObj("D", "D", [], "black"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "black"),
        mkObj("G", "G", [], "white"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: [],
      phase: "mark",
      description:
        "F をスキャン: F もリーフノード。黒色に。灰色スタックが空になりました！ マークフェーズが完了です。白色のまま残っている G, H, I はどのルートからも到達不可能 — つまりガベージです。",
      descriptionEn:
        "Scan F: Another leaf node — turns black. The gray stack is now empty! Mark phase complete. G, H, and I remain white — unreachable from any root — they are garbage.",
      highlight: ["F", "G", "H", "I"],
    },
    // Step 10: Sweep phase — free white objects (G)
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "black"),
        mkObj("D", "D", [], "black"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "black"),
        mkObj("G", "G", [], "freed"),
        mkObj("H", "H", ["I"], "white"),
        mkObj("I", "I", [], "white"),
      ],
      grayStack: [],
      phase: "sweep",
      description:
        "スイープフェーズ開始: ヒープを走査し白色オブジェクトを解放します。G はどこからも参照されていなかったため解放（free）されます。メモリはフリーリストに戻されます。",
      descriptionEn:
        "Sweep phase begins: Walk the heap and free white objects. G was unreachable, so it is freed. Its memory returns to the free list.",
      highlight: ["G"],
    },
    // Step 11: Sweep H and I
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "black", true),
        mkObj("root2", "Root2", ["E"], "black", true),
        mkObj("A", "A", ["C"], "black"),
        mkObj("B", "B", ["D"], "black"),
        mkObj("C", "C", ["F"], "black"),
        mkObj("D", "D", [], "black"),
        mkObj("E", "E", ["C"], "black"),
        mkObj("F", "F", [], "black"),
        mkObj("G", "G", [], "freed"),
        mkObj("H", "H", ["I"], "freed"),
        mkObj("I", "I", [], "freed"),
      ],
      grayStack: [],
      phase: "sweep",
      description:
        "H と I も白色のため解放されます。H→I の参照があっても、ルートから到達不可能なら「循環ゴミ」としてまとめて回収されます。これが参照カウント方式にはない、トレースGCの強みです。",
      descriptionEn:
        "H and I are also white, so they are freed. Even though H references I, both are unreachable from roots — they're collected as 'cyclic garbage'. This is an advantage of tracing GC over reference counting.",
      highlight: ["H", "I"],
    },
    // Step 12: Reset — all surviving objects back to white for next cycle
    {
      objects: [
        mkObj("root1", "Root1", ["A", "B"], "white", true),
        mkObj("root2", "Root2", ["E"], "white", true),
        mkObj("A", "A", ["C"], "white"),
        mkObj("B", "B", ["D"], "white"),
        mkObj("C", "C", ["F"], "white"),
        mkObj("D", "D", [], "white"),
        mkObj("E", "E", ["C"], "white"),
        mkObj("F", "F", [], "white"),
      ],
      grayStack: [],
      phase: "done",
      description:
        "GC サイクル完了: 生存オブジェクトの色を白にリセットし、次の GC サイクルに備えます。解放された G, H, I のメモリは新しいオブジェクトの割り当てに再利用されます。Go では実際には黒→白のリセットにビットフリップを使い、O(1) で行います。",
      descriptionEn:
        "GC cycle complete: Surviving objects are reset to white, preparing for the next cycle. Freed memory from G, H, I can be reused. In Go, the black→white reset uses a bit flip for O(1) operation.",
    },
  ];
}

// ── Rendering helpers ───────────────────────────────────────

const COLOR_MAP: Record<ObjColor, { bg: string; border: string; text: string }> = {
  white: {
    bg: "bg-white dark:bg-neutral-800",
    border: "border-neutral-300 dark:border-neutral-600",
    text: "text-neutral-700 dark:text-neutral-300",
  },
  gray: {
    bg: "bg-neutral-400 dark:bg-neutral-500",
    border: "border-neutral-500 dark:border-neutral-400",
    text: "text-white",
  },
  black: {
    bg: "bg-neutral-900 dark:bg-neutral-200",
    border: "border-neutral-900 dark:border-neutral-200",
    text: "text-white dark:text-neutral-900",
  },
  freed: {
    bg: "bg-red-100 dark:bg-red-950",
    border: "border-red-300 dark:border-red-800 border-dashed",
    text: "text-red-400 dark:text-red-500 line-through",
  },
};

// Layout positions for the object graph (grid-based)
const POSITIONS: Record<string, { col: number; row: number }> = {
  root1: { col: 1, row: 0 },
  root2: { col: 3, row: 0 },
  A: { col: 0, row: 1 },
  B: { col: 2, row: 1 },
  E: { col: 3, row: 1 },
  C: { col: 1, row: 2 },
  D: { col: 2, row: 2 },
  F: { col: 1, row: 3 },
  G: { col: 4, row: 2 },
  H: { col: 4, row: 1 },
  I: { col: 4, row: 3 },
};

function ObjectNode({
  obj,
  highlighted,
}: {
  obj: Obj;
  highlighted: boolean;
}) {
  const colors = COLOR_MAP[obj.color];
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 transition-all duration-500
        ${colors.bg} ${colors.border} ${colors.text}
        ${highlighted ? "ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400 scale-110" : ""}
        ${obj.isRoot ? "ring-1 ring-amber-400 dark:ring-amber-500" : ""}
      `}
    >
      <span className="text-xs sm:text-sm font-bold">{obj.label}</span>
      {obj.isRoot && (
        <span className="absolute -top-2 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-background px-1 rounded">
          root
        </span>
      )}
      {obj.color === "freed" && (
        <span className="text-[8px] sm:text-[9px] font-medium">freed</span>
      )}
    </div>
  );
}

function Arrow({
  from,
  to,
  freed,
}: {
  from: { col: number; row: number };
  to: { col: number; row: number };
  freed: boolean;
}) {
  // Simple SVG line between positions
  const cellW = 80;
  const cellH = 80;
  const offsetX = 32; // half of node width
  const offsetY = 32;

  const x1 = from.col * cellW + offsetX;
  const y1 = from.row * cellH + offsetY;
  const x2 = to.col * cellW + offsetX;
  const y2 = to.row * cellH + offsetY;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={`transition-all duration-500 ${
        freed
          ? "stroke-red-300 dark:stroke-red-800"
          : "stroke-neutral-400 dark:stroke-neutral-600"
      }`}
      strokeWidth={1.5}
      strokeDasharray={freed ? "4 3" : undefined}
      markerEnd={freed ? undefined : "url(#arrowhead)"}
    />
  );
}

function GrayStackDisplay({
  stack,
  objects,
}: {
  stack: string[];
  objects: Obj[];
}) {
  const objMap = new Map(objects.map((o) => [o.id, o]));
  return (
    <div className="rounded-lg border border-border bg-background p-3 min-w-[120px]">
      <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">
        Gray Stack
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center min-h-[28px] items-center">
        {stack.length > 0 ? (
          stack.map((id) => {
            const obj = objMap.get(id);
            return (
              <div
                key={id}
                className="h-7 px-2 rounded bg-neutral-400 dark:bg-neutral-500 text-white text-[10px] font-bold flex items-center justify-center"
              >
                {obj?.label ?? id}
              </div>
            );
          })
        ) : (
          <span className="text-[10px] text-muted-foreground/50">empty</span>
        )}
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: GCState["phase"] }) {
  const config = {
    idle: { label: "Idle", color: "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300" },
    mark: { label: "Mark", color: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
    sweep: { label: "Sweep", color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
    done: { label: "Done", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" },
  };
  const c = config[phase];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.color}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${
        phase === "idle" ? "bg-neutral-400" :
        phase === "mark" ? "bg-amber-500" :
        phase === "sweep" ? "bg-red-500" :
        "bg-emerald-500"
      }`} />
      {c.label} Phase
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[10px] sm:text-xs text-muted-foreground justify-center">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800" />
        White (未探索)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-neutral-400 dark:bg-neutral-500" />
        Gray (発見済)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-neutral-900 dark:bg-neutral-200" />
        Black (走査済)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded border border-dashed border-red-300 dark:border-red-800 bg-red-100 dark:bg-red-950" />
        Freed (解放)
      </span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

type GCVisualizerProps = {
  locale?: string;
};

export function GCVisualizer({ locale = "ja" }: GCVisualizerProps) {
  const scenario = buildScenario();
  const isEn = locale === "en";

  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 2000,
  });

  const state = scenario[player.step];
  const highlightSet = new Set(state.highlight ?? []);

  const getLabel = useCallback(
    (step: number) => {
      const s = scenario[step];
      return isEn ? s.descriptionEn : s.description;
    },
    [scenario, isEn],
  );

  // Build object map for arrow lookups
  const objMap = new Map(state.objects.map((o) => [o.id, o]));
  const freedSet = new Set(
    state.objects.filter((o) => o.color === "freed").map((o) => o.id),
  );

  // Calculate SVG viewport
  const cellW = 80;
  const cellH = 80;
  const maxCol = Math.max(...Object.values(POSITIONS).map((p) => p.col));
  const maxRow = Math.max(...Object.values(POSITIONS).map((p) => p.row));
  const svgW = (maxCol + 1) * cellW;
  const svgH = (maxRow + 1) * cellH;

  return (
    <InteractiveDemo
      title={
        isEn
          ? "Tri-color Mark & Sweep in Action"
          : "三色マーク&スイープの動き"
      }
      description={
        isEn
          ? "Step through how a tri-color mark-and-sweep garbage collector traces reachable objects and frees garbage."
          : "三色マーク&スイープ GC がオブジェクトを辿り、ガベージを回収する過程をステップ実行で見てみましょう。"
      }
    >
      <div className="flex flex-col gap-4">
        {/* Phase + Legend row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <PhaseIndicator phase={state.phase} />
          <Legend />
        </div>

        {/* Object graph */}
        <div className="relative overflow-x-auto">
          <div className="relative" style={{ width: svgW, height: svgH, margin: "0 auto" }}>
            {/* Arrows */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={svgW}
              height={svgH}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <path
                    d="M0,0 L8,3 L0,6 Z"
                    className="fill-neutral-400 dark:fill-neutral-600"
                  />
                </marker>
              </defs>
              {state.objects.map((obj) =>
                obj.refs
                  .filter((refId) => POSITIONS[refId] && POSITIONS[obj.id])
                  .map((refId) => (
                    <Arrow
                      key={`${obj.id}-${refId}`}
                      from={POSITIONS[obj.id]}
                      to={POSITIONS[refId]}
                      freed={freedSet.has(obj.id) || freedSet.has(refId)}
                    />
                  )),
              )}
            </svg>

            {/* Nodes */}
            {state.objects
              .filter((obj) => POSITIONS[obj.id])
              .map((obj) => {
                const pos = POSITIONS[obj.id];
                return (
                  <div
                    key={obj.id}
                    className="absolute transition-all duration-500"
                    style={{
                      left: pos.col * cellW + (cellW - 64) / 2,
                      top: pos.row * cellH + (cellH - 64) / 2,
                    }}
                  >
                    <ObjectNode
                      obj={obj}
                      highlighted={highlightSet.has(obj.id)}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Gray Stack */}
        <GrayStackDisplay stack={state.grayStack} objects={state.objects} />

        {/* Description */}
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground min-h-[3rem] flex items-center">
          {isEn ? state.descriptionEn : state.description}
        </div>

        {/* Controls */}
        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
