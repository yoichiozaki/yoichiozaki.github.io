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
 * bit DP（Held–Karp）による有向 TSP。
 *
 *   dp[S][v] = 0 から出発し、集合 S をちょうど訪問して、
 *              いま v にいるときの最小コスト
 *
 * 「順列 (n−1)! を全部試す」から「訪問済み集合と現在地だけ覚える」
 * へ状態を圧縮すると 2ⁿ·n² に落ちる、という一点を見せる。
 * ────────────────────────────────────────────────────────── */

const CITY = ["0", "1", "2", "3"];
const N = 4;
const FULL = (1 << N) - 1;
const INF = Infinity;

// D[u][v] = u から v への距離（非対称）
const D = [
  [0, 3, 8, 5],
  [4, 0, 2, 7],
  [6, 9, 0, 3],
  [2, 6, 4, 0],
];

type Step = {
  dp: number[][];
  cur: { S: number; v: number } | null;
  reads: { S: number; v: number }[];
  path: number[];
  answer: number | null;
  formula: string;
  ja: string;
  en: string;
};

const setLabel = (S: number) =>
  `{${CITY.filter((_, i) => (S >> i) & 1).join(",")}}`;

function buildSteps(): Step[] {
  const steps: Step[] = [];
  const dp: number[][] = Array.from({ length: 1 << N }, () =>
    Array(N).fill(INF),
  );
  const par: number[][] = Array.from({ length: 1 << N }, () => Array(N).fill(-1));
  dp[1][0] = 0;

  const snap = (p: Partial<Step>): Step => ({
    dp: dp.map((r) => [...r]),
    cur: null,
    reads: [],
    path: [],
    answer: null,
    formula: "",
    ja: "",
    en: "",
    ...p,
  });

  steps.push(
    snap({
      cur: { S: 1, v: 0 },
      formula: "dp[{0}][0] = 0",
      ja: "状態は «どの都市を訪問済みか（ビット集合 S）» と «いまどこにいるか（v）» の 2 つだけ。どの順番で回ったかは、この先の最適な続け方に影響しないので捨てて構いません。これが状態圧縮の核心です。",
      en: "A state is just “which cities are visited (bitset S)” plus “where I am now (v)”. The order in which S was visited does not affect the best way to continue, so it can be discarded — that is the whole idea of state compression.",
    }),
  );

  for (let S = 1; S <= FULL; S++) {
    if (!(S & 1)) continue; // 出発地 0 を含まない集合は使わない
    for (let v = 0; v < N; v++) {
      if (!((S >> v) & 1)) continue;
      if (v === 0) continue; // 0 に戻るのは最後だけ
      const prevS = S ^ (1 << v);
      const cands: { u: number; cost: number }[] = [];
      for (let u = 0; u < N; u++) {
        if (!((prevS >> u) & 1)) continue;
        if (dp[prevS][u] === INF) continue;
        cands.push({ u, cost: dp[prevS][u] + D[u][v] });
      }
      if (cands.length === 0) continue;
      const best = cands.reduce((a, b) => (b.cost < a.cost ? b : a));
      dp[S][v] = best.cost;
      par[S][v] = best.u;
      steps.push(
        snap({
          cur: { S, v },
          reads: cands.map((c) => ({ S: prevS, v: c.u })),
          formula: `dp[${setLabel(S)}][${v}] = min( ${cands
            .map(
              (c) =>
                `dp[${setLabel(prevS)}][${c.u}]+D[${c.u}][${v}] = ${dp[prevS][c.u]}+${D[c.u][v]}`,
            )
            .join(", ")} ) = ${best.cost}`,
          ja: `集合 ${setLabel(S)} を訪問して ${v} にいる状態を作ります。直前にいた都市 u の候補は ${cands
            .map((c) => c.u)
            .join(", ")}。それぞれ «${setLabel(prevS)} を訪問して u にいた» 状態から 1 手伸ばし、最小の ${best.cost}（u = ${best.u}）を採用します。`,
          en: `Build the state “visited ${setLabel(S)}, standing on ${v}”. The possible previous cities are ${cands
            .map((c) => c.u)
            .join(", ")}. Extend each “visited ${setLabel(prevS)}, standing on u” state by one edge and keep the minimum, ${best.cost}, via u = ${best.u}.`,
        }),
      );
    }
  }

  const finals: { v: number; cost: number }[] = [];
  for (let v = 1; v < N; v++) {
    if (dp[FULL][v] === INF) continue;
    finals.push({ v, cost: dp[FULL][v] + D[v][0] });
  }
  const bestFinal = finals.reduce((a, b) => (b.cost < a.cost ? b : a));

  steps.push(
    snap({
      reads: finals.map((f) => ({ S: FULL, v: f.v })),
      answer: bestFinal.cost,
      formula: `answer = min( ${finals
        .map((f) => `dp[full][${f.v}]+D[${f.v}][0] = ${dp[FULL][f.v]}+${D[f.v][0]}`)
        .join(", ")} ) = ${bestFinal.cost}`,
      ja: `全都市を訪問した状態から出発地 0 に帰る辺を足して比較します。最小は ${bestFinal.cost}（最後の都市は ${bestFinal.v}）。`,
      en: `Close the tour by adding the edge back to city 0 from each full-set state. The minimum is ${bestFinal.cost}, ending at city ${bestFinal.v}.`,
    }),
  );

  // 復元
  const tour: number[] = [];
  let S = FULL;
  let v = bestFinal.v;
  while (v !== -1) {
    tour.unshift(v);
    const pu = par[S][v];
    if (pu === -1) break;
    S ^= 1 << v;
    v = pu;
  }
  const fullTour = [...tour, 0];
  for (let k = 1; k <= fullTour.length; k++) {
    const shown = fullTour.slice(0, k);
    steps.push(
      snap({
        path: shown,
        answer: bestFinal.cost,
        formula: shown.join(" → "),
        ja:
          k === fullTour.length
            ? `復元完了。巡回路は ${fullTour.join(" → ")}、総距離 ${bestFinal.cost} です。par[S][v] に «直前の都市» を持たせておくと、S から v のビットを落としながら遡れます。`
            : `par を辿って経路を復元中です（${shown.join(" → ")}）。`,
        en:
          k === fullTour.length
            ? `Reconstruction complete: the tour is ${fullTour.join(" → ")} with total length ${bestFinal.cost}. Storing the previous city in par[S][v] lets you walk backwards, clearing one bit at a time.`
            : `Walking the parent table backwards (${shown.join(" → ")}).`,
      }),
    );
  }

  return steps;
}

function formatBig(x: number): string {
  if (x >= 1e15) return x.toExponential(2);
  return Math.round(x).toLocaleString("en-US");
}

export function BitmaskTSPVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const steps = useMemo(() => buildSteps(), []);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1600 });
  const idx = Math.min(player.step, steps.length - 1);
  const s = steps[idx];
  const [nSlider, setNSlider] = useState(16);

  const subsets: number[] = [];
  for (let S = 1; S <= FULL; S++) if (S & 1) subsets.push(S);

  const isCur = (S: number, v: number) => s.cur?.S === S && s.cur?.v === v;
  const isRead = (S: number, v: number) =>
    s.reads.some((r) => r.S === S && r.v === v);

  const pos: Record<number, { x: number; y: number }> = {
    0: { x: 40, y: 40 },
    1: { x: 150, y: 40 },
    2: { x: 150, y: 130 },
    3: { x: 40, y: 130 },
  };

  const pathEdges: [number, number][] = [];
  for (let k = 1; k < s.path.length; k++) {
    pathEdges.push([s.path[k - 1], s.path[k]]);
  }

  let factorial = 1;
  for (let k = 2; k <= nSlider - 1; k++) factorial *= k;
  const heldKarp = Math.pow(2, nSlider) * nSlider * nSlider;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "bit DP — 順列を «集合と現在地» に畳む"
          : "Bitmask DP — folding permutations into “set plus current position”"
      }
      description={
        isJa
          ? "4 都市の有向 TSP。訪問順そのものではなく «訪問済み集合» を状態に取ると、(n−1)! の探索が 2ⁿ·n² に落ちます。"
          : "A directed 4-city TSP. Taking the visited set — not the visiting order — as the state turns (n−1)! enumeration into 2ⁿ·n² work."
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
        <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
          <table className="border-collapse text-[11px] font-mono mx-auto">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-[10px] font-semibold text-muted-foreground">
                  S
                </th>
                {CITY.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                  >
                    v={c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subsets.map((S) => (
                <tr key={S}>
                  <th
                    scope="row"
                    className="px-2 py-1 text-left text-[10px] whitespace-nowrap text-muted-foreground"
                  >
                    <span className="text-foreground">
                      {S.toString(2).padStart(N, "0")}
                    </span>{" "}
                    {setLabel(S)}
                  </th>
                  {CITY.map((_, v) => {
                    const val = s.dp[S][v];
                    const valid = ((S >> v) & 1) === 1 && (v !== 0 || S === 1);
                    return (
                      <td
                        key={v}
                        className={`w-12 border px-1 py-1 text-center transition-colors ${
                          isCur(S, v)
                            ? "border-accent bg-accent/25 text-foreground font-semibold"
                            : isRead(S, v)
                              ? "border-[#e8a55a] bg-[#e8a55a]/20 text-foreground"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {!valid ? (
                          <span className="text-muted-foreground/40">·</span>
                        ) : val === INF ? (
                          "∞"
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background p-2">
            <svg
              viewBox="0 0 190 170"
              className="w-full h-auto max-h-52"
              role="img"
              aria-label={isJa ? "4 都市のグラフ" : "Four-city graph"}
            >
              <defs>
                <marker
                  id="tsp-arrow"
                  viewBox="0 0 10 7"
                  refX="9"
                  refY="3.5"
                  markerWidth="7"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#5db8a6" />
                </marker>
              </defs>
              {pathEdges.map(([a, b], k) => {
                const p1 = pos[a];
                const p2 = pos[b];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.hypot(dx, dy) || 1;
                const off = 17;
                return (
                  <line
                    key={k}
                    x1={p1.x + (dx / len) * off}
                    y1={p1.y + (dy / len) * off}
                    x2={p2.x - (dx / len) * off}
                    y2={p2.y - (dy / len) * off}
                    className="stroke-[#5db8a6]"
                    strokeWidth={2.2}
                    markerEnd="url(#tsp-arrow)"
                  />
                );
              })}
              {CITY.map((c, i) => {
                const active = s.cur?.v === i || s.path.includes(i);
                return (
                  <g key={c}>
                    <circle
                      cx={pos[i].x}
                      cy={pos[i].y}
                      r={16}
                      className={
                        active
                          ? "fill-accent stroke-accent"
                          : "fill-muted stroke-border"
                      }
                      strokeWidth={1.5}
                    />
                    <text
                      x={pos[i].x}
                      y={pos[i].y + 4}
                      textAnchor="middle"
                      className={`text-[12px] font-mono ${
                        active ? "fill-accent-foreground" : "fill-foreground"
                      }`}
                    >
                      {c}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-1">
              <div className="text-[10px] font-semibold text-muted-foreground mb-1">
                {isJa ? "距離行列 D[u][v]（非対称）" : "Distance matrix D[u][v] (asymmetric)"}
              </div>
              <table className="border-collapse text-[10px] font-mono">
                <tbody>
                  <tr>
                    <td className="px-1 text-muted-foreground">u＼v</td>
                    {CITY.map((c) => (
                      <td key={c} className="px-1.5 text-muted-foreground">
                        {c}
                      </td>
                    ))}
                  </tr>
                  {D.map((row, u) => (
                    <tr key={u}>
                      <td className="px-1 text-muted-foreground">{u}</td>
                      {row.map((d, v) => (
                        <td
                          key={v}
                          className={`px-1.5 text-center ${
                            u === v ? "text-muted-foreground/40" : "text-foreground"
                          }`}
                        >
                          {u === v ? "·" : d}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <label
              htmlFor="tsp-n"
              className="block text-[11px] font-semibold text-muted-foreground mb-1"
            >
              {isJa ? `都市数 n = ${nSlider} のとき` : `At n = ${nSlider} cities`}
            </label>
            <input
              id="tsp-n"
              type="range"
              min={5}
              max={22}
              value={nSlider}
              onChange={(e) => setNSlider(Number(e.target.value))}
              className="w-full accent-[#cc785c]"
            />
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded border border-[#e8a55a] bg-[#e8a55a]/15 py-1.5">
                <div className="text-[9px] text-muted-foreground">
                  {isJa ? "順列全探索 (n−1)!" : "brute force (n−1)!"}
                </div>
                <div className="font-mono text-xs text-foreground">
                  {formatBig(factorial)}
                </div>
              </div>
              <div className="rounded border border-[#5db8a6] bg-[#5db8a6]/15 py-1.5">
                <div className="text-[9px] text-muted-foreground">
                  {isJa ? "Held–Karp 2ⁿ·n²" : "Held–Karp 2ⁿ·n²"}
                </div>
                <div className="font-mono text-xs text-foreground">
                  {formatBig(heldKarp)}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {isJa
                ? "指数は消えません。消えるのは «階乗» です。だから bit DP の適用範囲は n ≤ 20 前後が目安になります。"
                : "The exponential does not vanish — the factorial does. That is why bitmask DP is usually a tool for n up to roughly 20."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1">
            {isJa ? "いま適用している式" : "Recurrence applied now"}
          </div>
          <code className="block text-[11px] font-mono text-foreground break-words">
            {s.formula || "—"}
          </code>
          {s.answer !== null && (
            <div className="mt-2 text-[11px] text-foreground">
              {isJa ? "最短巡回路長: " : "optimal tour length: "}
              <span className="font-mono font-semibold">{s.answer}</span>
            </div>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground min-h-[84px]">
          {isJa ? s.ja : s.en}
        </div>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          step={idx}
          isFirst={idx === 0}
          isLast={idx === steps.length - 1}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
