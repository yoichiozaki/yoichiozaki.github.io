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
 * 同じ漸化式を「もらう DP（pull）」と「配る DP（push）」の
 * 二通りのループで埋めて、書き込む向きの違いを見せる。
 * 題材は Frog 1（AtCoder EDPC A）のサンプル 3。
 * ────────────────────────────────────────────────────────── */

const H = [30, 10, 60, 10, 60, 50];
const N = H.length;
const cost = (i: number, j: number) => Math.abs(H[i] - H[j]);

type Phase = "init" | "fill" | "trace" | "done";

type Step = {
  dp: (number | null)[];
  from: (number | null)[];
  focus: number | null;
  reads: number[];
  writes: number[];
  path: number[];
  phase: Phase;
  formula: string | null;
  ja: string;
  en: string;
};

function buildSteps(mode: "pull" | "push"): Step[] {
  const steps: Step[] = [];
  const dp: (number | null)[] = Array.from({ length: N }, () => null);
  const from: (number | null)[] = Array.from({ length: N }, () => null);
  dp[0] = 0;

  const snap = (
    partial: Omit<Step, "dp" | "from" | "path"> & { path?: number[] },
  ) => {
    steps.push({
      ...partial,
      dp: [...dp],
      from: [...from],
      path: partial.path ?? [],
    });
  };

  snap({
    focus: 0,
    reads: [],
    writes: [0],
    phase: "init",
    formula: "dp[0] = 0",
    ja: "初期化。石 0 には «そこにいる» ためのコストが要らないので dp[0] = 0、残りは «まだ到達方法が分かっていない» という意味で ∞ にします。",
    en: "Initialise. Standing on stone 0 costs nothing, so dp[0] = 0; every other cell starts at ∞, meaning “no way known yet”.",
  });

  if (mode === "pull") {
    for (let i = 1; i < N; i++) {
      const cands = [i - 1, i - 2].filter((j) => j >= 0);
      const parts = cands.map((j) => ({ j, v: (dp[j] as number) + cost(j, i) }));
      const best = parts.reduce((a, b) => (b.v < a.v ? b : a));
      dp[i] = best.v;
      from[i] = best.j;
      const expr = parts
        .map((p) => `dp[${p.j}]+|h${i}−h${p.j}| = ${dp[p.j]}+${cost(p.j, i)} = ${p.v}`)
        .join(",  ");
      snap({
        focus: i,
        reads: cands,
        writes: [i],
        phase: "fill",
        formula: `dp[${i}] = min( ${expr} ) = ${best.v}`,
        ja: `dp[${i}] を «自分に入ってくる辺» から決めます。候補は ${cands
          .map((j) => `dp[${j}]`)
          .join(" と ")}。小さいほうを採用して dp[${i}] = ${best.v}、直前の石は ${best.j} と記録します。`,
        en: `Fill dp[${i}] from the edges that point into it. The candidates are ${cands
          .map((j) => `dp[${j}]`)
          .join(" and ")}. Take the smaller: dp[${i}] = ${best.v}, coming from stone ${best.j}.`,
      });
    }
  } else {
    for (let i = 0; i < N - 1; i++) {
      const targets = [i + 1, i + 2].filter((j) => j < N);
      const improved: number[] = [];
      const parts: string[] = [];
      for (const j of targets) {
        const c = (dp[i] as number) + cost(i, j);
        const before = dp[j];
        if (before === null || c < before) {
          dp[j] = c;
          from[j] = i;
          improved.push(j);
        }
        parts.push(
          `dp[${j}] ← min(${before === null ? "∞" : before}, ${dp[i]}+${cost(i, j)}) = ${dp[j]}`,
        );
      }
      snap({
        focus: i,
        reads: [i],
        writes: improved,
        phase: "fill",
        formula: parts.join(",  "),
        ja: `石 ${i} が確定したので、そこから «出ていく辺» を配ります。${targets
          .map((j) => `石 ${j}`)
          .join(" と ")} の暫定値を更新できるか調べます。${
          improved.length === 0
            ? "今回はどちらも改善しませんでした。"
            : `${improved.map((j) => `dp[${j}]`).join(" と ")} が改善しました。`
        }`,
        en: `Stone ${i} is final, so we push along its outgoing edges and try to improve ${targets
          .map((j) => `stone ${j}`)
          .join(" and ")}. ${
          improved.length === 0
            ? "Neither tentative value improved this time."
            : `${improved.map((j) => `dp[${j}]`).join(" and ")} improved.`
        }`,
      });
    }
  }

  // 経路復元：末尾から from[] を辿る
  const full: number[] = [];
  let cur: number | null = N - 1;
  while (cur !== null) {
    full.push(cur);
    cur = from[cur];
  }
  full.reverse();

  for (let k = full.length - 1; k >= 0; k--) {
    const shown = full.slice(k);
    const node = full[k];
    snap({
      focus: node,
      reads: k > 0 ? [full[k - 1]] : [],
      writes: [],
      phase: k === 0 ? "done" : "trace",
      path: shown,
      formula:
        k === 0
          ? `${full.join(" → ")}   (${dp[N - 1]})`
          : `from[${node}] = ${full[k - 1]}`,
      ja:
        k === 0
          ? `復元完了。経路は ${full.join(" → ")}、総コストは ${dp[N - 1]} です。dp 表そのものは «値» しか持ちませんが、from 配列（または再計算）で «選択» を取り出せます。`
          : `dp[${node}] を作った直前の石は ${full[k - 1]} でした。from 配列を末尾から辿ると経路が逆順に出てきます。`,
      en:
        k === 0
          ? `Reconstruction done: the path is ${full.join(" → ")} with total cost ${dp[N - 1]}. The table itself stores only values; the choices come back from the parent array (or by recomputing the argmin).`
          : `dp[${node}] was produced from stone ${full[k - 1]}. Walking the parent array backwards yields the path in reverse.`,
    });
  }

  return steps;
}

export function DPTableFillVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [mode, setMode] = useState<"pull" | "push">("pull");
  const steps = useMemo(() => buildSteps(mode), [mode]);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1600 });
  const idx = Math.min(player.step, steps.length - 1);
  const s = steps[idx];

  const switchMode = (next: "pull" | "push") => {
    if (next === mode) return;
    player.reset();
    setMode(next);
  };

  const maxH = Math.max(...H);
  const colW = 84;
  const svgW = colW * N;
  const barTop = 26;
  const barH = 74;

  const arrowY = 14;
  const xCenter = (i: number) => i * colW + colW / 2;

  const arrows: { a: number; b: number; active: boolean }[] = [];
  if (s.phase === "fill" && s.focus !== null) {
    if (mode === "pull") {
      for (const r of s.reads) arrows.push({ a: r, b: s.focus, active: true });
    } else {
      for (const j of [s.focus + 1, s.focus + 2].filter((j) => j < N)) {
        arrows.push({ a: s.focus, b: j, active: s.writes.includes(j) });
      }
    }
  }
  const pathEdges: [number, number][] = [];
  for (let k = 1; k < s.path.length; k++) {
    pathEdges.push([s.path[k - 1], s.path[k]]);
  }

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ボトムアップで表を埋める — もらう DP と配る DP"
          : "Filling the table bottom-up — pull DP vs push DP"
      }
      description={
        isJa
          ? "同じ漸化式でも、ループの中で «読む» のか «書く» のかで実装の形が変わります。両方を切り替えて、矢印の向きを比べてください。"
          : "The same recurrence can be written as a loop that reads into the current cell or one that writes out of it. Toggle between them and watch the arrows flip."
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(["pull", "push"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground border border-border"
            }`}
            aria-pressed={mode === m}
          >
            {m === "pull"
              ? isJa
                ? "もらう DP（pull）"
                : "Pull DP"
              : isJa
                ? "配る DP（push）"
                : "Push DP"}
          </button>
        ))}
        <span className="text-[11px] text-muted-foreground">
          {mode === "pull"
            ? isJa
              ? "dp[i] ← 入ってくる辺をすべて見る"
              : "dp[i] ← look at every incoming edge"
            : isJa
              ? "dp[i] → 出ていく辺に値を配る"
              : "dp[i] → relax every outgoing edge"}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-background p-2 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} 210`}
          className="h-auto"
          style={{ width: "100%", minWidth: `${svgW * 0.7}px` }}
          role="img"
          aria-label={isJa ? "石と dp 表" : "Stones and the dp table"}
        >
          <defs>
            <marker
              id="dp-fill-arrow"
              viewBox="0 0 10 7"
              refX="9"
              refY="3.5"
              markerWidth="7"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#cc785c" />
            </marker>
            <marker
              id="dp-fill-arrow-dim"
              viewBox="0 0 10 7"
              refX="9"
              refY="3.5"
              markerWidth="7"
              markerHeight="5"
              orient="auto-start-reverse"
              className="text-muted-foreground"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
            </marker>
          </defs>

          {/* transition arrows */}
          {arrows.map((ar, k) => {
            const x1 = xCenter(ar.a);
            const x2 = xCenter(ar.b);
            const lift = 8 + Math.abs(ar.b - ar.a) * 6;
            return (
              <path
                key={`ar-${k}`}
                d={`M ${x1} ${arrowY + 8} Q ${(x1 + x2) / 2} ${arrowY - lift} ${x2} ${arrowY + 8}`}
                fill="none"
                strokeWidth={ar.active ? 2 : 1.2}
                className={ar.active ? "stroke-[#cc785c]" : "stroke-border"}
                strokeDasharray={ar.active ? undefined : "3 3"}
                markerEnd={
                  ar.active ? "url(#dp-fill-arrow)" : "url(#dp-fill-arrow-dim)"
                }
              />
            );
          })}

          {/* reconstructed path */}
          {pathEdges.map(([a, b], k) => (
            <path
              key={`p-${k}`}
              d={`M ${xCenter(a)} ${barTop + barH + 4} Q ${(xCenter(a) + xCenter(b)) / 2} ${barTop + barH + 30} ${xCenter(b)} ${barTop + barH + 4}`}
              fill="none"
              strokeWidth={2.5}
              className="stroke-[#5db8a6]"
            />
          ))}

          {H.map((h, i) => {
            const bh = (h / maxH) * barH;
            const isFocus = s.focus === i;
            const isRead = s.reads.includes(i);
            const isWrite = s.writes.includes(i);
            const onPath = s.path.includes(i);
            return (
              <g key={i}>
                <rect
                  x={i * colW + 22}
                  y={barTop + (barH - bh)}
                  width={colW - 44}
                  height={bh}
                  rx={3}
                  className={
                    onPath
                      ? "fill-[#5db8a6]/40 stroke-[#5db8a6]"
                      : isFocus
                        ? "fill-accent/30 stroke-accent"
                        : isRead
                          ? "fill-[#e8a55a]/25 stroke-[#e8a55a]"
                          : "fill-muted stroke-border"
                  }
                  strokeWidth={1.4}
                />
                <text
                  x={xCenter(i)}
                  y={barTop + barH + 16}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-muted-foreground"
                >
                  h={h}
                </text>
                <rect
                  x={i * colW + 14}
                  y={150}
                  width={colW - 28}
                  height={28}
                  rx={4}
                  className={
                    isWrite
                      ? "fill-accent/20 stroke-accent"
                      : s.dp[i] === null
                        ? "fill-transparent stroke-border"
                        : "fill-muted stroke-border"
                  }
                  strokeWidth={isWrite ? 2 : 1.2}
                  strokeDasharray={s.dp[i] === null ? "3 3" : undefined}
                />
                <text
                  x={xCenter(i)}
                  y={169}
                  textAnchor="middle"
                  className="text-[12px] font-mono fill-foreground"
                >
                  {s.dp[i] === null ? "∞" : s.dp[i]}
                </text>
                <text
                  x={xCenter(i)}
                  y={196}
                  textAnchor="middle"
                  className="text-[10px] font-mono fill-muted-foreground"
                >
                  dp[{i}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1">
            {isJa ? "いま適用している式" : "Recurrence applied now"}
          </div>
          <code className="block text-[11px] font-mono text-foreground break-words">
            {s.formula ?? "—"}
          </code>
        </div>
        <div className="rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground">
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
