"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

// ── Layer layout: 3 layers (L2 sparse, L0 dense) ───────────────
// Nodes positioned in a 400x200 coordinate system per layer.

type Node = { id: string; x: number; y: number };
type Edge = { from: string; to: string };

// L0: 12 nodes
const L0: Node[] = [
  { id: "a", x: 50, y: 40 },
  { id: "b", x: 110, y: 30 },
  { id: "c", x: 170, y: 70 },
  { id: "d", x: 230, y: 40 },
  { id: "e", x: 290, y: 30 },
  { id: "f", x: 350, y: 80 },
  { id: "g", x: 70, y: 120 },
  { id: "h", x: 140, y: 150 },
  { id: "i", x: 200, y: 130 },
  { id: "j", x: 260, y: 150 },
  { id: "k", x: 320, y: 130 },
  { id: "l", x: 370, y: 160 },
];
const L0E: Edge[] = [
  { from: "a", to: "b" },
  { from: "b", to: "c" },
  { from: "c", to: "d" },
  { from: "d", to: "e" },
  { from: "e", to: "f" },
  { from: "a", to: "g" },
  { from: "b", to: "h" },
  { from: "c", to: "h" },
  { from: "c", to: "i" },
  { from: "d", to: "i" },
  { from: "e", to: "j" },
  { from: "e", to: "k" },
  { from: "f", to: "k" },
  { from: "f", to: "l" },
  { from: "g", to: "h" },
  { from: "h", to: "i" },
  { from: "i", to: "j" },
  { from: "j", to: "k" },
  { from: "k", to: "l" },
];
// L1: 5 nodes (subset of L0)
const L1: Node[] = [
  { id: "b", x: 110, y: 30 },
  { id: "d", x: 230, y: 40 },
  { id: "f", x: 350, y: 80 },
  { id: "h", x: 140, y: 150 },
  { id: "k", x: 320, y: 130 },
];
const L1E: Edge[] = [
  { from: "b", to: "d" },
  { from: "d", to: "f" },
  { from: "b", to: "h" },
  { from: "d", to: "k" },
  { from: "f", to: "k" },
  { from: "h", to: "k" },
];
// L2: 2 nodes
const L2: Node[] = [
  { id: "b", x: 110, y: 30 },
  { id: "f", x: 350, y: 80 },
];
const L2E: Edge[] = [{ from: "b", to: "f" }];

// Query point
const QUERY = { x: 275, y: 110 };

type Step = {
  layer: 2 | 1 | 0;
  current: string; // currently-best node id
  visited: string[]; // nodes evaluated in this step
  descJa: string;
  descEn: string;
};

// Scripted greedy descent (believable path reflecting the graphs above)
const STEPS: Step[] = [
  {
    layer: 2,
    current: "b",
    visited: ["b"],
    descJa: "最上層 L2 に entry point b から入る。隣人を広く見てクエリに最も近いノードへジャンプする。",
    descEn: "Enter at entry point b on the topmost layer L2. Greedily move to the neighbour closest to the query.",
  },
  {
    layer: 2,
    current: "f",
    visited: ["b", "f"],
    descJa: "L2 の隣人 f を評価。クエリに b より近いので f に移動。L2 は 2 ノードしかないのでここで終了。",
    descEn: "Evaluate neighbour f in L2. It is closer to the query than b, so move to f. With only 2 nodes in L2, we stop here.",
  },
  {
    layer: 1,
    current: "f",
    visited: ["f"],
    descJa: "L2 の最良ノード f を L1 に持ち込み、新しい出発点にする。スカスカなグラフから徐々に濃いグラフへ降りていく。",
    descEn: "Carry the best node f down to L1 as the new entry point. We descend from sparse to denser graphs.",
  },
  {
    layer: 1,
    current: "k",
    visited: ["f", "k"],
    descJa: "L1 で f の隣人 d, k を見る。k のほうがクエリに近いので k へ移動。",
    descEn: "In L1, inspect neighbours d and k of f. k is closer to the query, so move to k.",
  },
  {
    layer: 1,
    current: "k",
    visited: ["f", "k", "d", "h"],
    descJa: "k の隣人 d, h も確認したが、どれも k より遠い。L1 での貪欲探索はここで停止。",
    descEn: "Inspect k's neighbours d and h too, but none beats k. Greedy search on L1 stops here.",
  },
  {
    layer: 0,
    current: "k",
    visited: ["k"],
    descJa: "最終層 L0 に降りる。ここから ef 個の候補を保つビーム探索に切り替えて、真の top-k を精密化する。",
    descEn: "Descend to the bottom layer L0. Switch to a beam search that keeps ef candidates and refines the true top-k.",
  },
  {
    layer: 0,
    current: "j",
    visited: ["k", "j", "l"],
    descJa: "k の隣人 j, l を評価。j がクエリに最接近なので暫定解を j に更新。",
    descEn: "Evaluate k's neighbours j and l. j is closest to the query so far; update the candidate to j.",
  },
  {
    layer: 0,
    current: "j",
    visited: ["k", "j", "l", "i", "e"],
    descJa: "j の隣人 i, e も候補プールに追加するが、j 以上に近いものは無い。ef 候補を保持しながら停止条件 (closest-in-candidates ≥ worst-in-top-k) が成立。",
    descEn: "j's neighbours i and e are pushed into the candidate pool, but none beats j. Keeping ef candidates, the stop condition (closest-in-candidates ≥ worst-in-top-k) holds.",
  },
];

export function HNSWSearchVisualizer({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 1400 });
  const s = STEPS[player.step];
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={isJa ? "HNSW: 3 階層を降りながら最近傍を探す" : "HNSW: greedy descent through 3 layers"}
      description={
        isJa
          ? "地図の縮尺が切り替わるイメージです。まず世界地図 (L2) で大雑把に近づき、国地図 (L1)、市街地図 (L0) と段階的にズームしていきます。"
          : "Think of zoom levels on a map. First navigate on the world map (L2), then the country map (L1), then the street map (L0)."
      }
    >
      <div className="flex flex-col gap-4">
        <LayerView
          label="L2"
          nodes={L2}
          edges={L2E}
          active={s.layer === 2}
          current={s.current}
          visited={s.layer === 2 ? s.visited : []}
          showQuery={s.layer === 2}
        />
        <LayerView
          label="L1"
          nodes={L1}
          edges={L1E}
          active={s.layer === 1}
          current={s.current}
          visited={s.layer === 1 ? s.visited : []}
          showQuery={s.layer === 1}
        />
        <LayerView
          label="L0"
          nodes={L0}
          edges={L0E}
          active={s.layer === 0}
          current={s.current}
          visited={s.layer === 0 ? s.visited : []}
          showQuery={s.layer === 0}
        />

        <div className="rounded-md bg-background p-3 text-sm text-foreground">
          {isJa ? s.descJa : s.descEn}
        </div>

        <StepPlayerControls {...player} />
      </div>
    </InteractiveDemo>
  );
}

function LayerView({
  label,
  nodes,
  edges,
  active,
  current,
  visited,
  showQuery,
}: {
  label: string;
  nodes: Node[];
  edges: Edge[];
  active: boolean;
  current: string;
  visited: string[];
  showQuery: boolean;
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return (
    <div
      className={
        "relative rounded-md border p-2 transition-opacity " +
        (active ? "border-accent bg-accent/5 opacity-100" : "border-border bg-muted/40 opacity-50")
      }
    >
      <div className="mb-1 text-xs font-mono text-muted-foreground">
        Layer {label} · {nodes.length} nodes
      </div>
      <svg viewBox="0 0 420 200" className="w-full h-36">
        {edges.map((e, idx) => {
          const a = nodeMap.get(e.from);
          const b = nodeMap.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={idx}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeWidth={0.6}
              className="text-muted-foreground/40"
            />
          );
        })}
        {nodes.map((n) => {
          const isCurrent = active && n.id === current;
          const isVisited = active && visited.includes(n.id);
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={isCurrent ? 9 : 6}
                className={
                  isCurrent
                    ? "fill-accent"
                    : isVisited
                      ? "fill-yellow-400"
                      : "fill-muted"
                }
                stroke="currentColor"
                strokeWidth={1}
              />
              <text
                x={n.x}
                y={n.y + 3}
                textAnchor="middle"
                fontSize={8}
                className="fill-foreground font-mono pointer-events-none"
              >
                {n.id}
              </text>
            </g>
          );
        })}
        {showQuery && (
          <g>
            <circle
              cx={QUERY.x}
              cy={QUERY.y}
              r={6}
              className="fill-red-500"
            />
            <text
              x={QUERY.x}
              y={QUERY.y - 10}
              textAnchor="middle"
              fontSize={9}
              className="fill-red-500 font-mono"
            >
              q
            </text>
            {active && (
              <line
                x1={QUERY.x}
                y1={QUERY.y}
                x2={nodeMap.get(current)?.x ?? QUERY.x}
                y2={nodeMap.get(current)?.y ?? QUERY.y}
                stroke="currentColor"
                strokeWidth={0.8}
                strokeDasharray="3 3"
                className="text-red-500/70"
              />
            )}
          </g>
        )}
      </svg>
    </div>
  );
}
