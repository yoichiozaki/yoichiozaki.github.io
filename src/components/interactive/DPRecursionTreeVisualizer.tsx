"use client";

import { useMemo, useState } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ──────────────────────────────────────────────────────────
 * Frog 1 (AtCoder Educational DP Contest A) の再帰木。
 *
 *   f(0) = 0
 *   f(1) = |h1 - h0|
 *   f(i) = min( f(i-1) + |hi - h(i-1)|, f(i-2) + |hi - h(i-2)| )
 *
 * 素朴な再帰では同じ f(i) を何度も計算する。メモ化を入れると
 * 再帰木が「計算済みの枝を刈った木」に潰れ、計算回数が n 回になる。
 * ────────────────────────────────────────────────────────── */

const H = [30, 10, 60, 10, 60, 50];
const N = H.length;

type NodeKind = "compute" | "base" | "cacheHit";

type TreeNode = {
  key: string;
  i: number;
  depth: number;
  parent: string | null;
  kind: NodeKind;
  leafX: number;
  value: number;
  completeAt: number;
  duplicate: boolean;
};

function buildTree(memoize: boolean): TreeNode[] {
  const order: TreeNode[] = [];
  const memo = new Map<number, number>();
  const leaf = { next: 0 };

  function build(
    i: number,
    depth: number,
    parentKey: string | null,
  ): { value: number; leafX: number } {
    const key = parentKey === null ? `r${i}` : `${parentKey}-${i}`;

    if (memoize && memo.has(i)) {
      const value = memo.get(i)!;
      const leafX = leaf.next++;
      order.push({
        key,
        i,
        depth,
        parent: parentKey,
        kind: "cacheHit",
        leafX,
        value,
        completeAt: order.length,
        duplicate: true,
      });
      return { value, leafX };
    }

    if (i <= 1) {
      const value = i === 0 ? 0 : Math.abs(H[1] - H[0]);
      const leafX = leaf.next++;
      memo.set(i, value);
      order.push({
        key,
        i,
        depth,
        parent: parentKey,
        kind: "base",
        leafX,
        value,
        completeAt: order.length,
        duplicate: false,
      });
      return { value, leafX };
    }

    const self: TreeNode = {
      key,
      i,
      depth,
      parent: parentKey,
      kind: "compute",
      leafX: 0,
      value: 0,
      completeAt: 0,
      duplicate: false,
    };
    order.push(self);

    const a = build(i - 1, depth + 1, key);
    const b = build(i - 2, depth + 1, key);

    self.value = Math.min(
      a.value + Math.abs(H[i] - H[i - 1]),
      b.value + Math.abs(H[i] - H[i - 2]),
    );
    self.leafX = (a.leafX + b.leafX) / 2;
    self.completeAt = order.length - 1;
    memo.set(i, self.value);
    return { value: self.value, leafX: self.leafX };
  }

  build(N - 1, 0, null);

  // 素朴版では「同じ引数が再び現れた」ノードを重複としてマークする。
  const seen = new Set<number>();
  for (const node of order) {
    if (node.kind === "cacheHit") continue;
    if (seen.has(node.i)) node.duplicate = true;
    else seen.add(node.i);
  }
  return order;
}

/** f(i) を素朴な再帰で解いたときの関数呼び出し回数 = 2·Fib(i+1) − 1 */
function naiveCalls(n: number): number {
  let a = 1; // calls(0)
  let b = 1; // calls(1)
  if (n <= 1) return 1;
  for (let k = 2; k <= n; k++) {
    const c = 1 + a + b;
    a = b;
    b = c;
  }
  return b;
}

function formatCount(x: number): string {
  return x.toLocaleString("en-US");
}

export function DPRecursionTreeVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [memoize, setMemoize] = useState(false);
  const [sliderN, setSliderN] = useState(30);

  const tree = useMemo(() => buildTree(memoize), [memoize]);
  const player = useStepPlayer({ totalSteps: tree.length, intervalMs: 1100 });
  const idx = Math.min(player.step, tree.length - 1);
  const current = tree[idx];

  const toggleMemoize = () => {
    player.reset();
    setMemoize((v) => !v);
  };

  const leafCount = tree.filter((n) => n.kind !== "compute").length;
  const maxDepth = Math.max(...tree.map((n) => n.depth));
  const width = 520;
  const height = 40 + maxDepth * 54 + 30;
  const xOf = (leafX: number) =>
    leafCount <= 1 ? width / 2 : 40 + (leafX / (leafCount - 1)) * (width - 80);
  const yOf = (depth: number) => 30 + depth * 54;

  const revealed = tree.slice(0, idx + 1);
  const revealedKeys = new Set(revealed.map((n) => n.key));

  // 現在のノードから根までの呼び出しスタック
  const stackKeys = new Set<string>();
  {
    let cursor: TreeNode | undefined = current;
    while (cursor) {
      stackKeys.add(cursor.key);
      const parentKey: string | null = cursor.parent;
      cursor = parentKey
        ? tree.find((n) => n.key === parentKey)
        : undefined;
    }
  }

  const memoState: (number | null)[] = Array.from({ length: N }, () => null);
  for (const node of revealed) {
    if (node.kind === "cacheHit") continue;
    if (node.completeAt <= idx) memoState[node.i] = node.value;
  }

  const computeCount = revealed.filter((n) => n.kind !== "cacheHit").length;
  const totalCompute = tree.filter((n) => n.kind !== "cacheHit").length;

  const description = (() => {
    const i = current.i;
    if (current.kind === "base") {
      return isJa
        ? `f(${i}) は基底ケース。f(0)=0、f(1)=|h₁−h₀|=${Math.abs(H[1] - H[0])} と即座に決まります。`
        : `f(${i}) is a base case: f(0)=0 and f(1)=|h₁−h₀|=${Math.abs(H[1] - H[0])} are known immediately.`;
    }
    if (current.kind === "cacheHit") {
      return isJa
        ? `f(${i}) は計算済み。メモから ${current.value} を返し、この枝は展開しません。ここが指数を多項式に変える瞬間です。`
        : `f(${i}) is already memoized. Return ${current.value} from the table and prune this branch — this is exactly where exponential becomes polynomial.`;
    }
    if (current.duplicate) {
      return isJa
        ? `f(${i}) を再び最初から計算し始めました。まったく同じ部分問題を、別の経路から重複して解いています。`
        : `We start recomputing f(${i}) from scratch. The identical subproblem is being solved again along a different path.`;
    }
    return isJa
      ? `f(${i}) を求めるには f(${i - 1}) と f(${i - 2}) が要ります。まだ答えを知らないので再帰的に呼び出します。`
      : `To evaluate f(${i}) we need f(${i - 1}) and f(${i - 2}). We do not know them yet, so we recurse.`;
  })();

  const naive = naiveCalls(sliderN - 1);
  const ratio = naive / sliderN;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "再帰木が DP 表になる瞬間"
          : "The moment a recursion tree becomes a DP table"
      }
      description={
        isJa
          ? "Frog 1（石 6 個、高さ 30 10 60 10 60 50）の f(5) を再帰で解きます。メモ化を切り替えて、同じ部分問題が何度現れるかを比べてください。"
          : "Solving f(5) for Frog 1 (6 stones with heights 30 10 60 10 60 50) by recursion. Toggle memoization and compare how often the same subproblem reappears."
      }
    >
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <button
          type="button"
          onClick={toggleMemoize}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            memoize
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground border border-border"
          }`}
          aria-pressed={memoize}
        >
          {memoize
            ? isJa
              ? "メモ化: ON"
              : "Memoization: ON"
            : isJa
              ? "メモ化: OFF"
              : "Memoization: OFF"}
        </button>
        <span className="text-xs text-muted-foreground">
          {isJa ? "呼び出しノード数" : "call nodes"}:{" "}
          <span className="font-mono text-foreground">{tree.length}</span>
          {" / "}
          {isJa ? "実際に計算した部分問題" : "subproblems actually evaluated"}:{" "}
          <span className="font-mono text-foreground">
            {computeCount}/{totalCompute}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
        <div className="rounded-lg border border-border bg-background p-2">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label={
              isJa ? "再帰呼び出しの木" : "Tree of recursive calls"
            }
          >
            {revealed.map((node) => {
              if (!node.parent || !revealedKeys.has(node.parent)) return null;
              const parent = tree.find((n) => n.key === node.parent)!;
              const onStack =
                stackKeys.has(node.key) && stackKeys.has(parent.key);
              return (
                <line
                  key={`e-${node.key}`}
                  x1={xOf(parent.leafX)}
                  y1={yOf(parent.depth) + 14}
                  x2={xOf(node.leafX)}
                  y2={yOf(node.depth) - 14}
                  className={onStack ? "stroke-accent" : "stroke-border"}
                  strokeWidth={onStack ? 2 : 1.2}
                />
              );
            })}
            {revealed.map((node) => {
              const isCurrent = node.key === current.key;
              const fill = isCurrent
                ? "fill-accent"
                : node.kind === "cacheHit"
                  ? "fill-[#5db8a6]/25"
                  : node.duplicate
                    ? "fill-[#e8a55a]/25"
                    : "fill-muted";
              const stroke = isCurrent
                ? "stroke-accent"
                : node.kind === "cacheHit"
                  ? "stroke-[#5db8a6]"
                  : node.duplicate
                    ? "stroke-[#e8a55a]"
                    : "stroke-border";
              return (
                <g key={`n-${node.key}`}>
                  <circle
                    cx={xOf(node.leafX)}
                    cy={yOf(node.depth)}
                    r={14}
                    className={`${fill} ${stroke}`}
                    strokeWidth={1.5}
                  />
                  <text
                    x={xOf(node.leafX)}
                    y={yOf(node.depth) + 4}
                    textAnchor="middle"
                    className={`text-[11px] font-mono ${
                      isCurrent ? "fill-accent-foreground" : "fill-foreground"
                    }`}
                  >
                    {node.i}
                  </text>
                  {node.completeAt <= idx && node.kind !== "compute" && (
                    <text
                      x={xOf(node.leafX)}
                      y={yOf(node.depth) + 27}
                      textAnchor="middle"
                      className="text-[9px] font-mono fill-muted-foreground"
                    >
                      {node.value}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <div className="flex flex-wrap gap-3 px-2 pb-1 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              {isJa ? "評価中" : "evaluating"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#e8a55a]" />
              {isJa ? "重複した部分問題" : "duplicated subproblem"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-[#5db8a6]" />
              {isJa ? "メモから返した" : "served from memo"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="text-[11px] font-semibold text-muted-foreground mb-2">
              {isJa ? "メモ表 dp[i]" : "Memo table dp[i]"}
            </div>
            <div className="grid grid-cols-6 gap-1 text-center">
              {memoState.map((v, i) => (
                <div key={i}>
                  <div className="text-[9px] text-muted-foreground font-mono">
                    {i}
                  </div>
                  <div
                    className={`rounded border py-1 text-[11px] font-mono ${
                      v === null
                        ? "border-dashed border-border text-muted-foreground"
                        : "border-[#5db8a6] bg-[#5db8a6]/15 text-foreground"
                    }`}
                  >
                    {v === null ? "—" : v}
                  </div>
                  <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                    h{H[i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground min-h-[76px]">
            {description}
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <label
              htmlFor="dp-rec-n"
              className="block text-[11px] font-semibold text-muted-foreground mb-1"
            >
              {isJa
                ? `石が N = ${sliderN} 個だったら`
                : `If there were N = ${sliderN} stones`}
            </label>
            <input
              id="dp-rec-n"
              type="range"
              min={5}
              max={45}
              value={sliderN}
              onChange={(e) => setSliderN(Number(e.target.value))}
              className="w-full accent-[#cc785c]"
            />
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded border border-[#e8a55a] bg-[#e8a55a]/15 py-1.5">
                <div className="text-[9px] text-muted-foreground">
                  {isJa ? "素朴な再帰の呼び出し回数" : "naive recursive calls"}
                </div>
                <div className="font-mono text-sm text-foreground">
                  {formatCount(naive)}
                </div>
              </div>
              <div className="rounded border border-[#5db8a6] bg-[#5db8a6]/15 py-1.5">
                <div className="text-[9px] text-muted-foreground">
                  {isJa ? "DP の計算回数" : "DP evaluations"}
                </div>
                <div className="font-mono text-sm text-foreground">
                  {formatCount(sliderN)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {isJa
                ? `差は約 ${formatCount(Math.round(ratio))} 倍。状態は N 個しかないのに、素朴な再帰は経路の数だけ仕事をしています。`
                : `A factor of about ${formatCount(Math.round(ratio))}. There are only N states, yet naive recursion does work proportional to the number of paths.`}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          step={idx}
          isFirst={idx === 0}
          isLast={idx === tree.length - 1}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
