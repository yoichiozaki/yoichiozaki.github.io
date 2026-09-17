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
 * 0-1 ナップサック（AtCoder EDPC D の縮小版）。
 *
 *   dp[i][w] = max( dp[i-1][w], dp[i-1][w-w_i] + v_i )
 *
 * 2 次元表 → 1 次元ローリング配列（逆順ループ）→ 順方向ループの
 * バグ（＝個数無制限ナップサックになる）の 3 モードを切り替える。
 * ────────────────────────────────────────────────────────── */

type Item = { name: string; w: number; v: number };

const ITEMS: Item[] = [
  { name: "A", w: 3, v: 30 },
  { name: "B", w: 4, v: 50 },
  { name: "C", w: 5, v: 60 },
  { name: "D", w: 2, v: 25 },
];
const N = ITEMS.length;
const CAP = 8;

type Mode = "2d" | "1d-reverse" | "1d-forward";

type Step = {
  grid: number[][];
  row: number[];
  cur: { i: number; w: number } | null;
  reads: { i: number; w: number }[];
  took: boolean;
  path: { i: number; w: number }[];
  chosen: string[];
  formula: string;
  ja: string;
  en: string;
};

function emptyGrid(): number[][] {
  return Array.from({ length: N + 1 }, () => Array(CAP + 1).fill(0));
}

function build2D(): Step[] {
  const steps: Step[] = [];
  const grid = emptyGrid();

  steps.push({
    grid: grid.map((r) => [...r]),
    row: [],
    cur: null,
    reads: [],
    took: false,
    path: [],
    chosen: [],
    formula: "dp[0][w] = 0",
    ja: "第 0 行は «品物を 1 つも見ていない» 状態。どの容量でも価値は 0 です。この行が漸化式の «底» になります。",
    en: "Row 0 means “no items considered yet”: the value is 0 for every capacity. This row is the base of the recurrence.",
  });

  for (let i = 1; i <= N; i++) {
    const it = ITEMS[i - 1];
    for (let w = 0; w <= CAP; w++) {
      const skip = grid[i - 1][w];
      const canTake = w >= it.w;
      const take = canTake ? grid[i - 1][w - it.w] + it.v : -1;
      const took = canTake && take > skip;
      grid[i][w] = took ? take : skip;
      steps.push({
        grid: grid.map((r) => [...r]),
        row: [],
        cur: { i, w },
        reads: canTake
          ? [
              { i: i - 1, w },
              { i: i - 1, w: w - it.w },
            ]
          : [{ i: i - 1, w }],
        took,
        path: [],
        chosen: [],
        formula: canTake
          ? `dp[${i}][${w}] = max( ${skip}, dp[${i - 1}][${w - it.w}]+${it.v} = ${take} ) = ${grid[i][w]}`
          : `dp[${i}][${w}] = dp[${i - 1}][${w}] = ${skip}   (w=${w} < ${it.w})`,
        ja: canTake
          ? `品物 ${it.name}（重さ ${it.w}、価値 ${it.v}）を容量 ${w} で «使わない»(${skip}) か «使う»(${take}) か。${
              took ? "使ったほうが得です。" : "使わないほうが得か、同じです。"
            }`
          : `容量 ${w} には品物 ${it.name}（重さ ${it.w}）が入りません。上の行をそのまま引き継ぎます。`,
        en: canTake
          ? `At capacity ${w}, compare skipping item ${it.name} (w=${it.w}, v=${it.v}) worth ${skip} against taking it, worth ${take}. ${
              took ? "Taking it wins." : "Skipping is at least as good."
            }`
          : `Item ${it.name} (weight ${it.w}) does not fit in capacity ${w}, so we copy the row above.`,
      });
    }
  }

  // 復元：最後のセルから «上の行と値が違うか» を見て採用を判定する
  const trace: { i: number; w: number }[] = [];
  const chosen: string[] = [];
  let w = CAP;
  for (let i = N; i >= 1; i--) {
    trace.push({ i, w });
    const it = ITEMS[i - 1];
    if (grid[i][w] !== grid[i - 1][w]) {
      chosen.unshift(it.name);
      w -= it.w;
    }
  }
  trace.push({ i: 0, w });

  const shownPath: { i: number; w: number }[] = [];
  const shownChosen: string[] = [];
  for (let k = 0; k < trace.length; k++) {
    const node = trace[k];
    shownPath.push(node);
    const it = node.i >= 1 ? ITEMS[node.i - 1] : null;
    const taken =
      it !== null && grid[node.i][node.w] !== grid[node.i - 1][node.w];
    if (taken && it) shownChosen.unshift(it.name);
    steps.push({
      grid: grid.map((r) => [...r]),
      row: [],
      cur: node,
      reads: [],
      took: taken,
      path: [...shownPath],
      chosen: [...shownChosen],
      formula:
        node.i === 0
          ? `answer = ${grid[N][CAP]},  items = { ${chosen.join(", ")} }`
          : taken
            ? `dp[${node.i}][${node.w}] ≠ dp[${node.i - 1}][${node.w}] → ${it!.name} を採用`
            : `dp[${node.i}][${node.w}] = dp[${node.i - 1}][${node.w}] → ${it!.name} は不採用`,
      ja:
        node.i === 0
          ? `復元完了。選んだのは { ${chosen.join(", ")} }、合計価値 ${grid[N][CAP]}、合計重さ ${chosen.reduce((a, nm) => a + ITEMS.find((x) => x.name === nm)!.w, 0)} です。`
          : taken
            ? `dp[${node.i}][${node.w}] が上の行と違う ⇒ 品物 ${it!.name} を使ったから値が変わった、と分かります。容量を ${it!.w} 戻して dp[${node.i - 1}][${node.w - it!.w}] へ移動します。`
            : `dp[${node.i}][${node.w}] が上の行と同じ ⇒ 品物 ${it!.name} は使っていません。容量はそのままで真上へ移動します。`,
      en:
        node.i === 0
          ? `Reconstruction complete: we picked { ${chosen.join(", ")} } for value ${grid[N][CAP]} at weight ${chosen.reduce((a, nm) => a + ITEMS.find((x) => x.name === nm)!.w, 0)}.`
          : taken
            ? `dp[${node.i}][${node.w}] differs from the row above, so item ${it!.name} must have been used. Step back ${it!.w} units of capacity to dp[${node.i - 1}][${node.w - it!.w}].`
            : `dp[${node.i}][${node.w}] equals the row above, so item ${it!.name} was not used. Move straight up, keeping the capacity.`,
    });
  }

  return steps;
}

function build1D(forward: boolean): Step[] {
  const steps: Step[] = [];
  const row = Array(CAP + 1).fill(0);

  steps.push({
    grid: [],
    row: [...row],
    cur: null,
    reads: [],
    took: false,
    path: [],
    chosen: [],
    formula: "dp[w] = 0",
    ja: "1 次元に潰します。dp[w] は «いま見ている品物までを使ったときの、容量 w での最大価値» を表します。",
    en: "Collapse to one dimension: dp[w] is the best value for capacity w using the items processed so far.",
  });

  for (let i = 1; i <= N; i++) {
    const it = ITEMS[i - 1];
    const order: number[] = [];
    if (forward) {
      for (let w = it.w; w <= CAP; w++) order.push(w);
    } else {
      for (let w = CAP; w >= it.w; w--) order.push(w);
    }
    // この品物のループで実際に値を書き換えたセル（＝その品物を含む値になったセル）
    const raisedByThisItem = new Set<number>();
    for (const w of order) {
      const before = row[w];
      const src = row[w - it.w];
      const cand = src + it.v;
      const took = cand > before;
      // 順方向ループでは dp[w - w_i] が「同じ品物 i ですでに書き換えられた」値であり得る
      const stale = forward && raisedByThisItem.has(w - it.w);
      if (took) {
        row[w] = cand;
        raisedByThisItem.add(w);
      }
      steps.push({
        grid: [],
        row: [...row],
        cur: { i, w },
        reads: [{ i, w: w - it.w }],
        took,
        path: [],
        chosen: [],
        formula: `dp[${w}] = max(${before}, dp[${w - it.w}]+${it.v} = ${cand}) = ${row[w]}`,
        ja: `容量 ${w} について、品物 ${it.name}（重さ ${it.w}、価値 ${it.v}）を使う場合を試します。参照元は dp[${w - it.w}] = ${src}。${
          stale
            ? "⚠ この dp[" +
              (w - it.w) +
              "] は、この品物ですでに書き換えられた値です — この候補は同じ品物を 2 個以上使っています。"
            : forward
              ? "この参照元は今回の品物ではまだ書き換えられていないので、この品物を含まない値のままです。"
              : "逆順なので、参照元は必ず «前の品物までの値» のままです。"
        }`,
        en: `Apply item ${it.name} (w=${it.w}, v=${it.v}) at capacity ${w}, reading dp[${w - it.w}] = ${src}. ${
          stale
            ? "⚠ That cell was already raised by this same item, so this candidate uses the item more than once."
            : forward
              ? "This source cell has not been raised by the current item, so it still holds a value without it."
              : "Because we go downwards, the source is guaranteed to still hold the previous item's value."
        }`,
      });
    }
  }

  const answer = row[CAP];
  steps.push({
    grid: [],
    row: [...row],
    cur: null,
    reads: [],
    took: false,
    path: [],
    chosen: [],
    formula: `answer = dp[${CAP}] = ${answer}`,
    ja: forward
      ? `順方向ループの答えは ${answer}。正しい 0-1 ナップサックの答え 90 より大きく、これは «同じ品物を何個でも使ってよい» 個数無制限ナップサックの答えです（B を 2 個、あるいは D を 4 個）。ループの向きひとつで問題そのものが変わります。`
      : `逆順ループの答えは ${answer}。2 次元表の右下と一致します。dp[w−w_i] を読む時点でその値が «前の品物まで» の状態であることが、0-1 制約そのものです。`,
    en: forward
      ? `The forward loop reports ${answer}, larger than the correct 0-1 answer of 90. It is the unbounded-knapsack answer (two copies of B, or four of D). Loop direction alone changed the problem being solved.`
      : `The downward loop reports ${answer}, matching the bottom-right cell of the 2-D table. Reading dp[w−w_i] while it still holds the previous item's value is precisely what enforces the 0-1 constraint.`,
  });

  return steps;
}

export function KnapsackDPVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [mode, setMode] = useState<Mode>("2d");
  const steps = useMemo(
    () =>
      mode === "2d"
        ? build2D()
        : build1D(mode === "1d-forward"),
    [mode],
  );
  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: mode === "2d" ? 420 : 900,
  });
  const idx = Math.min(player.step, steps.length - 1);
  const s = steps[idx];

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    player.reset();
    setMode(m);
  };

  const modeLabels: Record<Mode, { ja: string; en: string }> = {
    "2d": { ja: "2 次元表", en: "2-D table" },
    "1d-reverse": { ja: "1 次元・逆順（正解）", en: "1-D, downward (correct)" },
    "1d-forward": { ja: "1 次元・順方向（バグ）", en: "1-D, upward (bug)" },
  };

  const inPath = (i: number, w: number) =>
    s.path.some((p) => p.i === i && p.w === w);
  const isRead = (i: number, w: number) =>
    s.reads.some((r) => r.i === i && r.w === w);

  // 2 次元モードでは 1 ステップ = 1 セル。行優先で「何セルまで埋めたか」を数える。
  const cellsFilled = Math.min(idx, N * (CAP + 1));
  const isRevealed = (i: number, w: number) =>
    i === 0 || (i - 1) * (CAP + 1) + w < cellsFilled;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "0-1 ナップサック — 表を埋め、復元し、1 次元に潰す"
          : "0-1 knapsack — fill, reconstruct, then collapse to 1-D"
      }
      description={
        isJa
          ? `品物 ${ITEMS.map((i) => `${i.name}(w${i.w},v${i.v})`).join(" ")}、容量 ${CAP}。3 つのモードを切り替えると、同じ漸化式が «表» → «配列» → «バグ» と姿を変えるのが見えます。`
          : `Items ${ITEMS.map((i) => `${i.name}(w${i.w},v${i.v})`).join(" ")} with capacity ${CAP}. Switch modes to watch the same recurrence turn into a table, an array, and a bug.`
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(Object.keys(modeLabels) as Mode[]).map((m) => (
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
            {isJa ? modeLabels[m].ja : modeLabels[m].en}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background p-3 overflow-x-auto">
        {mode === "2d" ? (
          <table className="border-collapse text-[11px] font-mono mx-auto">
            <thead>
              <tr>
                <th className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground text-right">
                  {isJa ? "品物＼容量" : "item＼cap"}
                </th>
                {Array.from({ length: CAP + 1 }, (_, w) => (
                  <th
                    key={w}
                    scope="col"
                    className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground"
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.grid.map((rowVals, i) => (
                <tr key={i}>
                  <th
                    scope="row"
                    className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground text-right whitespace-nowrap"
                  >
                    {i === 0
                      ? isJa
                        ? "なし"
                        : "none"
                      : `${ITEMS[i - 1].name} (${ITEMS[i - 1].w},${ITEMS[i - 1].v})`}
                  </th>
                  {rowVals.map((v, w) => {
                    const cur = s.cur?.i === i && s.cur?.w === w;
                    const revealed = isRevealed(i, w);
                    return (
                      <td
                        key={w}
                        className={`w-8 border px-1 py-1 text-center transition-colors ${
                          cur
                            ? "border-accent bg-accent/25 text-foreground font-semibold"
                            : inPath(i, w)
                              ? "border-[#5db8a6] bg-[#5db8a6]/20 text-foreground"
                              : isRead(i, w)
                                ? "border-[#e8a55a] bg-[#e8a55a]/20 text-foreground"
                                : "border-border text-muted-foreground"
                        }`}
                      >
                        {revealed ? v : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">
                {isJa ? "処理中の品物:" : "current item:"}
              </span>
              {ITEMS.map((it, k) => (
                <span
                  key={it.name}
                  className={`rounded px-1.5 py-0.5 font-mono ${
                    s.cur?.i === k + 1
                      ? "bg-accent text-accent-foreground"
                      : s.cur && s.cur.i > k + 1
                        ? "bg-muted text-muted-foreground line-through"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {it.name}(w{it.w},v{it.v})
                </span>
              ))}
            </div>
            <table className="border-collapse text-[11px] font-mono mx-auto">
              <thead>
                <tr>
                  <th className="px-1.5 py-1 text-[10px] text-muted-foreground text-right">
                    w
                  </th>
                  {Array.from({ length: CAP + 1 }, (_, w) => (
                    <th
                      key={w}
                      scope="col"
                      className="px-1.5 py-1 text-[10px] font-semibold text-muted-foreground"
                    >
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th
                    scope="row"
                    className="px-1.5 py-1 text-[10px] text-muted-foreground text-right"
                  >
                    dp
                  </th>
                  {s.row.map((v, w) => {
                    const cur = s.cur?.w === w;
                    return (
                      <td
                        key={w}
                        className={`w-9 border px-1 py-1.5 text-center transition-colors ${
                          cur
                            ? "border-accent bg-accent/25 text-foreground font-semibold"
                            : isRead(s.cur?.i ?? -1, w)
                              ? "border-[#e8a55a] bg-[#e8a55a]/20 text-foreground"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-[10px] font-semibold text-muted-foreground mb-1">
            {isJa ? "いま適用している式" : "Recurrence applied now"}
          </div>
          <code className="block text-[11px] font-mono text-foreground break-words">
            {s.formula}
          </code>
          {s.chosen.length > 0 && (
            <div className="mt-2 text-[11px] text-foreground">
              {isJa ? "採用中の品物: " : "chosen so far: "}
              <span className="font-mono">{s.chosen.join(", ")}</span>
            </div>
          )}
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
