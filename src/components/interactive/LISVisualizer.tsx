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
 * 最長増加部分列（strictly increasing）。
 *
 *   素朴 O(n²): dp[i] = 1 + max{ dp[j] | j < i, a[j] < a[i] }
 *   高速 O(n log n): tails[k] = 「長さ k+1 の増加列を作れる末尾の最小値」
 *
 * tails 配列そのものは LIS ではない、という点を明示する。
 * ────────────────────────────────────────────────────────── */

const A = [3, 1, 4, 1, 5, 9, 2, 6, 5];
const N = A.length;

type Mode = "n2" | "nlogn";

type Probe = { lo: number; hi: number; mid: number; ok: boolean };

type Step = {
  dp: (number | null)[];
  tails: number[];
  tailsIdx: number[];
  cur: number | null;
  scanned: number[];
  chosen: number | null;
  insertAt: number | null;
  appended: boolean;
  probes: Probe[];
  path: number[];
  formula: string;
  ja: string;
  en: string;
};

function lowerBound(arr: number[], x: number): { idx: number; probes: Probe[] } {
  let lo = 0;
  let hi = arr.length;
  const probes: Probe[] = [];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const ok = arr[mid] >= x;
    probes.push({ lo, hi, mid, ok });
    if (ok) hi = mid;
    else lo = mid + 1;
  }
  return { idx: lo, probes };
}

function buildN2(): Step[] {
  const steps: Step[] = [];
  const dp: (number | null)[] = Array.from({ length: N }, () => null);
  const prev: number[] = Array.from({ length: N }, () => -1);

  const snap = (p: Partial<Step>): Step => ({
    dp: [...dp],
    tails: [],
    tailsIdx: [],
    cur: null,
    scanned: [],
    chosen: null,
    insertAt: null,
    appended: false,
    probes: [],
    path: [],
    formula: "",
    ja: "",
    en: "",
    ...p,
  });

  steps.push(
    snap({
      formula: "dp[i] = 1 + max{ dp[j] | j < i, a[j] < a[i] }",
      ja: "dp[i] は a[i] で終わる最長増加部分列の長さです。«i 番目まで見た» と定義すると末尾の値が分からず、次の要素で伸ばせるか判定できません。",
      en: "dp[i] is the length of the longest increasing subsequence ending exactly at a[i]. With “best among the first i elements”, the tail value would be unknown, so you could not tell whether the next element extends it.",
    }),
  );

  for (let i = 0; i < N; i++) {
    let best = 1;
    let arg = -1;
    const scanned: number[] = [];
    for (let j = 0; j < i; j++) {
      scanned.push(j);
      if (A[j] < A[i] && (dp[j] as number) + 1 > best) {
        best = (dp[j] as number) + 1;
        arg = j;
      }
    }
    dp[i] = best;
    prev[i] = arg;
    steps.push(
      snap({
        cur: i,
        scanned,
        chosen: arg,
        formula:
          i === 0
            ? `dp[0] = 1`
            : `dp[${i}] = 1 + max{ dp[j] | j < ${i}, a[j] < ${A[i]} } = ${best}`,
        ja:
          arg === -1
            ? `a[${i}] = ${A[i]}。左側に «自分より小さい値で終わる列» がないので、自分ひとりの長さ 1 です。`
            : `a[${i}] = ${A[i]}。左側の j を全部見て、a[j] < ${A[i]} を満たす中で dp[j] が最大の j=${arg}（a=${A[arg]}, dp=${dp[arg]}）の列を a[${i}] で伸ばします。`,
        en:
          arg === -1
            ? `a[${i}] = ${A[i]}. No earlier element is smaller, so the best we can do is the length-1 subsequence consisting of a[${i}] alone.`
            : `a[${i}] = ${A[i]}. Scan every j to the left, keep those with a[j] < ${A[i]}, and extend the one with the largest dp — here j=${arg} (a=${A[arg]}, dp=${dp[arg]}).`,
      }),
    );
  }

  let bestI = 0;
  for (let i = 1; i < N; i++) if ((dp[i] as number) > (dp[bestI] as number)) bestI = i;
  const path: number[] = [];
  let cur = bestI;
  while (cur !== -1) {
    path.unshift(cur);
    cur = prev[cur];
  }
  for (let k = path.length - 1; k >= 0; k--) {
    steps.push(
      snap({
        cur: path[k],
        path: path.slice(k),
        formula: `prev[${path[k]}] = ${k > 0 ? path[k - 1] : -1}`,
        ja:
          k === 0
            ? `復元完了。LIS は ${path.map((p) => A[p]).join(" < ")}（長さ ${dp[bestI]}）。dp の最大値を持つ位置から prev を辿るだけです。`
            : `dp[${path[k]}] を作った直前の要素は添字 ${path[k - 1]}（値 ${A[path[k - 1]]}）です。`,
        en:
          k === 0
            ? `Reconstruction complete: the LIS is ${path.map((p) => A[p]).join(" < ")} of length ${dp[bestI]}. Start from the position holding the maximum dp and follow prev[] back.`
            : `dp[${path[k]}] was built from index ${path[k - 1]} (value ${A[path[k - 1]]}).`,
      }),
    );
  }

  return steps;
}

function buildNLogN(): Step[] {
  const steps: Step[] = [];
  const tails: number[] = [];
  const tailsIdx: number[] = [];
  const lenAt: number[] = Array(N).fill(0);
  const prev: number[] = Array(N).fill(-1);

  const snap = (p: Partial<Step>): Step => ({
    dp: lenAt.map((v) => (v === 0 ? null : v)),
    tails: [...tails],
    tailsIdx: [...tailsIdx],
    cur: null,
    scanned: [],
    chosen: null,
    insertAt: null,
    appended: false,
    probes: [],
    path: [],
    formula: "",
    ja: "",
    en: "",
    ...p,
  });

  steps.push(
    snap({
      formula: "tails = []",
      ja: "dp の «値» と «添字» を入れ替え、tails[k] に «長さ k+1 の増加列の末尾として達成できる最小値» だけを覚えます。この配列は常に狭義単調増加なので、二分探索が使えます。",
      en: "Swap the roles of value and index in the DP: tails[k] keeps only the smallest value that can end an increasing subsequence of length k+1. That array is always strictly increasing, so binary search applies.",
    }),
  );

  for (let i = 0; i < N; i++) {
    const { idx, probes } = lowerBound(tails, A[i]);
    const appended = idx === tails.length;
    prev[i] = idx > 0 ? tailsIdx[idx - 1] : -1;
    if (appended) {
      tails.push(A[i]);
      tailsIdx.push(i);
    } else {
      tails[idx] = A[i];
      tailsIdx[idx] = i;
    }
    lenAt[i] = idx + 1;
    steps.push(
      snap({
        cur: i,
        insertAt: idx,
        appended,
        probes,
        formula: appended
          ? `lower_bound(tails, ${A[i]}) = ${idx} = |tails| → push_back(${A[i]})`
          : `lower_bound(tails, ${A[i]}) = ${idx} → tails[${idx}] = ${A[i]}`,
        ja: appended
          ? `a[${i}] = ${A[i]} は現在の tails の全要素より大きいので、最長記録が ${tails.length} に伸びます。`
          : `tails のうち ${A[i]} 以上で最初の要素 tails[${idx}] を a[${i}] = ${A[i]} で上書きします。長さは伸びませんが、«長さ ${idx + 1} の増加列の末尾» は小さくなるか変わらないので、後の要素で伸ばせる可能性は下がりません。`,
        en: appended
          ? `a[${i}] = ${A[i]} exceeds every entry in tails, so the record length grows to ${tails.length}.`
          : `a[${i}] = ${A[i]} overwrites tails[${idx}], the first entry that is ≥ it. The length does not grow, but the best tail for length ${idx + 1} gets smaller or stays the same, so later elements can extend it at least as easily.`,
      }),
    );
  }

  let bestI = 0;
  for (let i = 1; i < N; i++) if (lenAt[i] >= lenAt[bestI]) bestI = i;
  const path: number[] = [];
  let cur = bestI;
  while (cur !== -1) {
    path.unshift(cur);
    cur = prev[cur];
  }

  steps.push(
    snap({
      formula: `tails = [${tails.join(", ")}]`,
      ja: `注意：この tails = [${tails.join(", ")}] は «長さ» は正しいのに、そのままでは部分列になっていません（各スロットの持ち主は上の i= 表示のとおり添字 ${tailsIdx.join(", ")} で、単調増加になっていません）。長さだけが欲しいなら tails で十分ですが、列そのものが欲しいなら別に親を記録する必要があります。`,
      en: `Careful: tails = [${tails.join(", ")}] has the right length but is not a subsequence of the input — its entries come from indices ${tailsIdx.join(", ")} (see the i= labels above), which are not increasing. tails answers “how long”; recovering “which elements” needs separate parent pointers.`,
    }),
  );

  for (let k = path.length - 1; k >= 0; k--) {
    steps.push(
      snap({
        cur: path[k],
        path: path.slice(k),
        formula: `prev[${path[k]}] = ${k > 0 ? path[k - 1] : -1}`,
        ja:
          k === 0
            ? `正しい復元結果は ${path.map((p) => A[p]).join(" < ")}（添字 ${path.join(", ")}）。要素を tails に置いた瞬間の «ひとつ左の持ち主» を親として記録しておけば、こうして復元できます。`
            : `添字 ${path[k]}（値 ${A[path[k]]}）を置いたとき、tails[${k - 1}] を持っていたのは添字 ${path[k - 1]}（値 ${A[path[k - 1]]}）でした。`,
        en:
          k === 0
            ? `The correct reconstruction is ${path.map((p) => A[p]).join(" < ")} at indices ${path.join(", ")}. Recording, at insertion time, who owned the slot immediately to the left is all you need.`
            : `When index ${path[k]} (value ${A[path[k]]}) was placed, slot tails[${k - 1}] was owned by index ${path[k - 1]} (value ${A[path[k - 1]]}).`,
      }),
    );
  }

  return steps;
}

export function LISVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [mode, setMode] = useState<Mode>("n2");
  const steps = useMemo(
    () => (mode === "n2" ? buildN2() : buildNLogN()),
    [mode],
  );
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1400 });
  const idx = Math.min(player.step, steps.length - 1);
  const s = steps[idx];

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    player.reset();
    setMode(m);
  };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "最長増加部分列 — O(n²) から O(n log n) への «添字と値の入れ替え»"
          : "Longest increasing subsequence — swapping the roles of index and value"
      }
      description={
        isJa
          ? `a = [${A.join(", ")}] から、狭義単調増加の部分列のうち最長のものを求めます。素朴 DP と、tails 配列を使う高速版を切り替えて比べてください。`
          : `a = [${A.join(", ")}]; find the longest strictly increasing subsequence. Toggle between the naive DP and the tails-array version.`
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(["n2", "nlogn"] as Mode[]).map((m) => (
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
            {m === "n2" ? "O(n²) dp[i]" : "O(n log n) tails[]"}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
        <div className="text-[10px] font-semibold text-muted-foreground mb-1">
          {isJa ? "入力列 a" : "input a"}
        </div>
        <div className="flex gap-1">
          {A.map((v, i) => {
            const isCur = s.cur === i;
            const onPath = s.path.includes(i);
            const scanned = s.scanned.includes(i);
            const chosen = s.chosen === i;
            return (
              <div key={i} className="flex-1 min-w-[38px] text-center">
                <div className="text-[9px] text-muted-foreground font-mono">
                  {i}
                </div>
                <div
                  className={`rounded border py-1.5 text-[13px] font-mono transition-colors ${
                    isCur
                      ? "border-accent bg-accent/25 text-foreground font-semibold"
                      : onPath
                        ? "border-[#5db8a6] bg-[#5db8a6]/25 text-foreground"
                        : chosen
                          ? "border-[#e8a55a] bg-[#e8a55a]/35 text-foreground"
                          : scanned
                            ? "border-[#e8a55a]/60 bg-[#e8a55a]/10 text-foreground"
                            : "border-border text-muted-foreground"
                  }`}
                >
                  {v}
                </div>
                <div
                  className={`mt-0.5 text-[10px] font-mono ${
                    s.dp[i] === null ? "text-muted-foreground/40" : "text-foreground"
                  }`}
                >
                  {s.dp[i] === null ? "·" : s.dp[i]}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {mode === "n2"
            ? isJa
              ? "下段 = dp[i]（a[i] で終わる LIS の長さ）"
              : "bottom row = dp[i], the LIS length ending at i"
            : isJa
              ? "下段 = その要素を置いたときの位置 + 1（= その要素で終わる LIS の長さ）"
              : "bottom row = insertion slot + 1, i.e. the LIS length ending at that element"}
        </div>

        {mode === "nlogn" && (
          <div className="mt-3">
            <div className="text-[10px] font-semibold text-muted-foreground mb-1">
              {isJa ? "tails 配列" : "tails array"}
            </div>
            <div className="flex gap-1">
              {s.tails.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  {isJa ? "（空）" : "(empty)"}
                </span>
              ) : (
                s.tails.map((v, k) => (
                  <div key={k} className="min-w-[42px] text-center">
                    <div className="text-[9px] text-muted-foreground font-mono">
                      {isJa ? `長さ ${k + 1}` : `len ${k + 1}`}
                    </div>
                    <div
                      className={`rounded border py-1.5 text-[13px] font-mono ${
                        s.insertAt === k
                          ? s.appended
                            ? "border-[#5db8a6] bg-[#5db8a6]/25 text-foreground font-semibold"
                            : "border-accent bg-accent/25 text-foreground font-semibold"
                          : "border-border bg-muted text-foreground"
                      }`}
                    >
                      {v}
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">
                      i={s.tailsIdx[k]}
                    </div>
                  </div>
                ))
              )}
            </div>
            {s.probes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {s.probes.map((p, k) => (
                  <span
                    key={k}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                  >
                    [{p.lo},{p.hi}) mid={p.mid} {p.ok ? "≥ → hi=mid" : "< → lo=mid+1"}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1">
            {isJa ? "いま適用している式" : "Rule applied now"}
          </div>
          <code className="block text-[11px] font-mono text-foreground break-words">
            {s.formula || "—"}
          </code>
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
