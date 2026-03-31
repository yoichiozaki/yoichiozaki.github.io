"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type BPlusTreeVisualizerProps = { locale?: string };

/* ── Types ─────────────────────────────────────── */

type InternalNode = {
  id: string;
  keys: number[];
  children: string[];
  highlight?: "search" | "split" | "insert";
};

type LeafNode = {
  id: string;
  keys: number[];
  next?: string;
  highlight?: "search" | "found" | "split" | "insert";
};

type TreeState = {
  internals: InternalNode[];
  leaves: LeafNode[];
  description: { ja: string; en: string };
};

/* ── Step data: insert 1,4,7,10,17,21,31,25,19,20 into order-4 B+Tree ── */

const steps: TreeState[] = [
  // Step 0: empty
  {
    internals: [],
    leaves: [{ id: "L0", keys: [] }],
    description: {
      ja: "空のB+木（次数4: 各ノード最大3キー）。これからキーを挿入していきます。",
      en: "Empty B+ tree (order 4: max 3 keys per node). We will insert keys one by one.",
    },
  },
  // Step 1: insert 1
  {
    internals: [],
    leaves: [{ id: "L0", keys: [1], highlight: "insert" }],
    description: {
      ja: "キー 1 を挿入。リーフにそのまま入ります。",
      en: "Insert key 1. It fits directly in the leaf node.",
    },
  },
  // Step 2: insert 4
  {
    internals: [],
    leaves: [{ id: "L0", keys: [1, 4], highlight: "insert" }],
    description: {
      ja: "キー 4 を挿入。まだ空きがあるのでそのまま入ります。",
      en: "Insert key 4. The leaf still has space.",
    },
  },
  // Step 3: insert 7
  {
    internals: [],
    leaves: [{ id: "L0", keys: [1, 4, 7], highlight: "insert" }],
    description: {
      ja: "キー 7 を挿入。リーフが満杯（3キー）になりました。次の挿入で分割が起きます。",
      en: "Insert key 7. The leaf is now full (3 keys). The next insert will cause a split.",
    },
  },
  // Step 4: insert 10 → split
  {
    internals: [
      { id: "I0", keys: [7], children: ["L0", "L1"], highlight: "split" },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1", highlight: "split" },
      { id: "L1", keys: [7, 10], highlight: "split" },
    ],
    description: {
      ja: "キー 10 を挿入 → リーフが溢れたので分割！中央値 7 が新しいルート（内部ノード）に昇格します。リーフは [1,4] と [7,10] に分かれます。",
      en: "Insert key 10 → leaf overflows, so it splits! The middle key 7 is promoted to a new root (internal node). Leaves become [1,4] and [7,10].",
    },
  },
  // Step 5: insert 17
  {
    internals: [{ id: "I0", keys: [7], children: ["L0", "L1"] }],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10, 17], highlight: "insert" },
    ],
    description: {
      ja: "キー 17 を挿入。17 ≥ 7 なので右のリーフへ。まだ空きがあります。",
      en: "Insert key 17. Since 17 ≥ 7, it goes to the right leaf. Still has room.",
    },
  },
  // Step 6: insert 21 → split right leaf
  {
    internals: [
      {
        id: "I0",
        keys: [7, 17],
        children: ["L0", "L1", "L2"],
        highlight: "split",
      },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2", highlight: "split" },
      { id: "L2", keys: [17, 21], highlight: "split" },
    ],
    description: {
      ja: "キー 21 を挿入 → 右リーフが溢れて分割。中央値 17 がルートに昇格し、ルートのキーは [7, 17] に。",
      en: "Insert key 21 → right leaf overflows and splits. Middle key 17 is promoted to root, which becomes [7, 17].",
    },
  },
  // Step 7: insert 31
  {
    internals: [{ id: "I0", keys: [7, 17], children: ["L0", "L1", "L2"] }],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2" },
      { id: "L2", keys: [17, 21, 31], highlight: "insert" },
    ],
    description: {
      ja: "キー 31 を挿入。31 ≥ 17 なので一番右のリーフへ。満杯になりました。",
      en: "Insert key 31. Since 31 ≥ 17, it goes to the rightmost leaf, which is now full.",
    },
  },
  // Step 8: insert 25 → split rightmost leaf → root splits
  {
    internals: [
      { id: "I0", keys: [17], children: ["I1", "I2"], highlight: "split" },
      { id: "I1", keys: [7], children: ["L0", "L1"] },
      { id: "I2", keys: [25], children: ["L2", "L3"] },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2" },
      { id: "L2", keys: [17, 21], next: "L3", highlight: "split" },
      { id: "L3", keys: [25, 31], highlight: "split" },
    ],
    description: {
      ja: "キー 25 を挿入 → リーフ分割 & ルートも満杯なのでルートも分割！木の高さが1段増えました。新ルートは [17]、左子 [7]、右子 [25]。",
      en: "Insert key 25 → leaf splits AND root is full, so root splits too! Tree height increases by 1. New root is [17], left child [7], right child [25].",
    },
  },
  // Step 9: insert 19
  {
    internals: [
      { id: "I0", keys: [17], children: ["I1", "I2"] },
      { id: "I1", keys: [7], children: ["L0", "L1"] },
      { id: "I2", keys: [25], children: ["L2", "L3"] },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2" },
      { id: "L2", keys: [17, 19, 21], next: "L3", highlight: "insert" },
      { id: "L3", keys: [25, 31] },
    ],
    description: {
      ja: "キー 19 を挿入。17 ≤ 19 < 25 なのでリーフ [17,21] へ → [17,19,21] に。",
      en: "Insert key 19. Since 17 ≤ 19 < 25, it goes to leaf [17,21] → becomes [17,19,21].",
    },
  },
  // Step 10: insert 20 → split leaf [17,19,20,21]
  {
    internals: [
      { id: "I0", keys: [17], children: ["I1", "I2"] },
      { id: "I1", keys: [7], children: ["L0", "L1"] },
      {
        id: "I2",
        keys: [20, 25],
        children: ["L2", "L2b", "L3"],
        highlight: "split",
      },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2" },
      { id: "L2", keys: [17, 19], next: "L2b", highlight: "split" },
      { id: "L2b", keys: [20, 21], next: "L3", highlight: "split" },
      { id: "L3", keys: [25, 31] },
    ],
    description: {
      ja: "キー 20 を挿入 → リーフ [17,19,21] が溢れて分割。中央値 20 が親ノードへ昇格し [20, 25] に。リーフは [17,19] と [20,21] に分かれます。",
      en: "Insert key 20 → leaf [17,19,21] overflows and splits. Middle key 20 promoted to parent, which becomes [20, 25]. Leaves split into [17,19] and [20,21].",
    },
  },
  // Step 11: range search 10..21
  {
    internals: [
      { id: "I0", keys: [17], children: ["I1", "I2"], highlight: "search" },
      { id: "I1", keys: [7], children: ["L0", "L1"], highlight: "search" },
      { id: "I2", keys: [20, 25], children: ["L2", "L2b", "L3"] },
    ],
    leaves: [
      { id: "L0", keys: [1, 4], next: "L1" },
      { id: "L1", keys: [7, 10], next: "L2", highlight: "found" },
      { id: "L2", keys: [17, 19], next: "L2b", highlight: "found" },
      { id: "L2b", keys: [20, 21], next: "L3", highlight: "found" },
      { id: "L3", keys: [25, 31] },
    ],
    description: {
      ja: "範囲検索 [10, 21]：まずルートから 10 を含むリーフへ下り、そこからリーフの連結リストを右に辿ります（→印）。B+木ではリーフが連結されているため、範囲検索が高速です。",
      en: "Range search [10, 21]: First descend from root to the leaf containing 10, then follow the leaf linked list rightward (→). In B+ trees, linked leaves make range scans fast.",
    },
  },
];

/* ── Layout constants ──────────────────────────── */

const NODE_W = 100;
const NODE_H = 32;
const KEY_W = 30;
const LEVEL_GAP = 60;
const LEAF_GAP = 16;

/* ── Rendering ─────────────────────────────────── */

function nodeColor(highlight?: string, dark?: boolean) {
  const base = dark ? "stroke-neutral-500" : "stroke-neutral-400";
  switch (highlight) {
    case "search":
      return dark ? "fill-blue-900 stroke-blue-400" : "fill-blue-100 stroke-blue-500";
    case "found":
      return dark ? "fill-green-900 stroke-green-400" : "fill-green-100 stroke-green-500";
    case "split":
      return dark ? "fill-amber-900 stroke-amber-400" : "fill-amber-100 stroke-amber-500";
    case "insert":
      return dark ? "fill-sky-900 stroke-sky-400" : "fill-sky-100 stroke-sky-500";
    default:
      return dark ? `fill-neutral-800 ${base}` : `fill-white ${base}`;
  }
}

function textColor(dark: boolean) {
  return dark ? "fill-neutral-200" : "fill-neutral-800";
}

type RenderedNode = {
  id: string;
  x: number;
  y: number;
  keys: number[];
  highlight?: string;
  children?: string[];
  next?: string;
  isLeaf: boolean;
};

function layoutTree(state: TreeState): { nodes: RenderedNode[]; width: number; height: number } {
  const nodes: RenderedNode[] = [];

  // Determine tree levels
  const internals = state.internals;
  const leaves = state.leaves;

  if (internals.length === 0) {
    // Only leaves (just root leaf)
    const totalW = leaves.length * NODE_W + (leaves.length - 1) * LEAF_GAP;
    let x = 0;
    for (const leaf of leaves) {
      nodes.push({
        id: leaf.id,
        x,
        y: 0,
        keys: leaf.keys,
        highlight: leaf.highlight,
        next: leaf.next,
        isLeaf: true,
      });
      x += NODE_W + LEAF_GAP;
    }
    return { nodes, width: totalW, height: NODE_H + 8 };
  }

  // Build parent->children map for internals
  // Find root (the internal node whose id is not referenced as a child of another)
  const allChildIds = new Set<string>();
  for (const n of internals) {
    for (const c of n.children) allChildIds.add(c);
  }
  const rootId = internals.find((n) => !allChildIds.has(n.id))?.id ?? internals[0].id;

  // BFS to assign levels
  const nodeMap = new Map<string, InternalNode>();
  for (const n of internals) nodeMap.set(n.id, n);
  const leafMap = new Map<string, LeafNode>();
  for (const l of leaves) leafMap.set(l.id, l);

  type QItem = { id: string; level: number };
  const queue: QItem[] = [{ id: rootId, level: 0 }];
  const levelMap = new Map<string, number>();
  let maxLevel = 0;

  while (queue.length > 0) {
    const item = queue.shift()!;
    levelMap.set(item.id, item.level);
    const iNode = nodeMap.get(item.id);
    if (iNode) {
      for (const cid of iNode.children) {
        queue.push({ id: cid, level: item.level + 1 });
        if (item.level + 1 > maxLevel) maxLevel = item.level + 1;
      }
    }
  }

  // Layout leaves first (bottom row)
  const leafY = maxLevel * LEVEL_GAP;
  const totalLeafW = leaves.length * NODE_W + (leaves.length - 1) * LEAF_GAP;
  let lx = 0;
  const posMap = new Map<string, { x: number; y: number }>();

  for (const leaf of leaves) {
    const pos = { x: lx, y: leafY };
    posMap.set(leaf.id, pos);
    nodes.push({
      id: leaf.id,
      x: lx,
      y: leafY,
      keys: leaf.keys,
      highlight: leaf.highlight,
      next: leaf.next,
      isLeaf: true,
    });
    lx += NODE_W + LEAF_GAP;
  }

  // Layout internals bottom-up
  const levels: string[][] = [];
  for (let l = maxLevel; l >= 0; l--) {
    levels[l] = [];
  }
  for (const [id, level] of levelMap.entries()) {
    if (leafMap.has(id)) continue;
    levels[level].push(id);
  }

  for (let l = maxLevel - 1; l >= 0; l--) {
    // This level should not include leaves
    for (const nid of levels[l]) {
      const iNode = nodeMap.get(nid);
      if (!iNode) continue;
      // Center above children
      let minX = Infinity;
      let maxX = -Infinity;
      for (const cid of iNode.children) {
        const cp = posMap.get(cid);
        if (cp) {
          minX = Math.min(minX, cp.x);
          maxX = Math.max(maxX, cp.x + NODE_W);
        }
      }
      const cx = (minX + maxX) / 2 - NODE_W / 2;
      const y = l * LEVEL_GAP;
      posMap.set(nid, { x: cx, y });
      nodes.push({
        id: nid,
        x: cx,
        y,
        keys: iNode.keys,
        highlight: iNode.highlight,
        children: iNode.children,
        isLeaf: false,
      });
    }
  }

  return { nodes, width: totalLeafW, height: leafY + NODE_H + 8 };
}

export function BPlusTreeVisualizer({ locale = "ja" }: BPlusTreeVisualizerProps) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1200 });
  const state = steps[player.step];
  const { nodes, width, height } = layoutTree(state);

  const posMap = new Map<string, { x: number; y: number }>();
  for (const n of nodes) posMap.set(n.id, { x: n.x, y: n.y });

  const svgW = Math.max(width + 40, 400);
  const svgH = height + 60;
  const offsetX = (svgW - width) / 2;

  return (
    <InteractiveDemo
      title={locale === "en" ? "B+ Tree Insert & Range Search" : "B+木の挿入と範囲検索"}
      description={
        locale === "en"
          ? "Step through insertions into an order-4 B+ tree, then see a range scan."
          : "次数4のB+木へのキー挿入をステップ実行し、最後に範囲検索を確認します。"
      }
    >
      <div className="flex justify-center overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-2xl"
          style={{ minHeight: 200 }}
        >
          {/* Edges: internal → children */}
          {nodes
            .filter((n) => !n.isLeaf && n.children)
            .map((n) =>
              n.children!.map((cid) => {
                const cp = posMap.get(cid);
                if (!cp) return null;
                const x1 = n.x + offsetX + NODE_W / 2;
                const y1 = n.y + NODE_H;
                const x2 = cp.x + offsetX + NODE_W / 2;
                const y2 = cp.y;
                return (
                  <line
                    key={`${n.id}-${cid}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="stroke-neutral-400 dark:stroke-neutral-500"
                    strokeWidth={1.5}
                  />
                );
              }),
            )}

          {/* Leaf linked-list arrows */}
          {nodes
            .filter((n) => n.isLeaf && n.next)
            .map((n) => {
              const np = posMap.get(n.next!);
              if (!np) return null;
              const x1 = n.x + offsetX + NODE_W + 2;
              const y1 = n.y + NODE_H / 2;
              const x2 = np.x + offsetX - 2;
              const y2 = np.y + NODE_H / 2;
              return (
                <g key={`arrow-${n.id}`}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="stroke-accent"
                    strokeWidth={1.5}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              );
            })}

          {/* Arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                className="fill-accent"
              />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((n) => {
            const nx = n.x + offsetX;
            const w = Math.max(NODE_W, n.keys.length * KEY_W + 10);
            return (
              <g key={n.id}>
                {/* Node background */}
                <rect
                  x={nx}
                  y={n.y}
                  width={w}
                  height={NODE_H}
                  rx={n.isLeaf ? 4 : 6}
                  className={`${nodeColor(n.highlight, false)} dark:hidden`}
                  strokeWidth={1.5}
                />
                <rect
                  x={nx}
                  y={n.y}
                  width={w}
                  height={NODE_H}
                  rx={n.isLeaf ? 4 : 6}
                  className={`hidden ${nodeColor(n.highlight, true)} dark:block`}
                  strokeWidth={1.5}
                />
                {/* Keys */}
                {n.keys.map((k, i) => (
                  <text
                    key={`${n.id}-k${i}`}
                    x={nx + (w / (n.keys.length + 1)) * (i + 1)}
                    y={n.y + NODE_H / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[11px] font-mono font-semibold ${textColor(false)} dark:hidden`}
                  >
                    {k}
                  </text>
                ))}
                {n.keys.map((k, i) => (
                  <text
                    key={`${n.id}-kd${i}`}
                    x={nx + (w / (n.keys.length + 1)) * (i + 1)}
                    y={n.y + NODE_H / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`hidden text-[11px] font-mono font-semibold ${textColor(true)} dark:block`}
                  >
                    {k}
                  </text>
                ))}
                {/* Key separators */}
                {n.keys.length > 1 &&
                  n.keys.slice(0, -1).map((_, i) => {
                    const sx =
                      nx + (w / (n.keys.length + 1)) * (i + 1) + w / (n.keys.length + 1) / 2;
                    return (
                      <line
                        key={`${n.id}-sep${i}`}
                        x1={sx}
                        y1={n.y + 4}
                        x2={sx}
                        y2={n.y + NODE_H - 4}
                        className="stroke-neutral-300 dark:stroke-neutral-600"
                        strokeWidth={0.5}
                      />
                    );
                  })}
                {/* Leaf indicator */}
                {n.isLeaf && n.keys.length === 0 && (
                  <text
                    x={nx + w / 2}
                    y={n.y + NODE_H / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] fill-muted-foreground"
                  >
                    ∅
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Step description */}
      <div className="mt-3 min-h-[3rem] rounded-lg bg-muted/70 px-4 py-2 text-sm text-foreground">
        {locale === "en" ? state.description.en : state.description.ja}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-sky-200 dark:bg-sky-900" /> {locale === "en" ? "Insert" : "挿入"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-200 dark:bg-amber-900" /> {locale === "en" ? "Split" : "分割"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-200 dark:bg-green-900" /> {locale === "en" ? "Found" : "検索結果"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-blue-200 dark:bg-blue-900" /> {locale === "en" ? "Search path" : "検索パス"}
        </span>
      </div>

      <StepPlayerControls
        {...player}
        label={(s) => {
          const d = steps[s]?.description;
          if (!d) return "";
          const text = locale === "en" ? d.en : d.ja;
          return text.length > 60 ? text.slice(0, 57) + "…" : text;
        }}
      />
    </InteractiveDemo>
  );
}
