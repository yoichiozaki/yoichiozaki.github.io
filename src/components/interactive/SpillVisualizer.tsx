"use client";

import { useMemo, useState, useId } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Sorting and hash aggregation both "spill" when they exceed
 * work_mem — but they degrade in opposite ways. Everything
 * below is computed from the article's own constants, so the
 * numbers move with the slider instead of being hard-coded.
 * ────────────────────────────────────────────────────────── */

const ROWS = 5_500_000;
const ROW_BYTES = 60;
const DATA_BYTES = ROWS * ROW_BYTES; // 330,000,000
const PAGE_SIZE = 8192;
const PAGES = Math.ceil(DATA_BYTES / PAGE_SIZE); // 40,284

const SEQ_PAGE_COST = 1.0;
const RANDOM_PAGE_COST = 4.0;
const CPU_TUPLE_COST = 0.01;
const CPU_OPERATOR_COST = 0.0025;
const COMPARISON_COST = 2.0 * CPU_OPERATOR_COST;

/** cost_tuplesort assumes 3/4 sequential, 1/4 random. */
const DISK_WEIGHT = 0.75 * SEQ_PAGE_COST + 0.25 * RANDOM_PAGE_COST; // 1.75

const GROUPS = 1_000_000;
/**
 * hash_agg_entry_size(numTrans = 1, tupleWidth = 60, transitionSpace = 0):
 *     TupleHashEntrySize()                = 16
 *   + MAXALIGN(MAXALIGN(15) + 60)         = 80  (minimal-tuple header + row)
 *   + 1 * sizeof(AggStatePerGroupData)    = 16
 *   + 0                                        (count(*) accumulates into an
 *                                               int8, which is by value, so
 *                                               transitionSpace is zero)
 */
const HASH_ENTRY_BYTES = 112;
const HASH_TABLE_BYTES = GROUPS * HASH_ENTRY_BYTES; // 112,000,000
const HASH_MEM_MULTIPLIER = 2.0; // PostgreSQL 15+ default

/* nodeAgg.c spill constants. Read and write buffers are both BLCKSZ. */
const HASHAGG_PARTITION_FACTOR = 1.5;
const HASHAGG_MIN_PARTITIONS = 4;
const HASHAGG_MAX_PARTITIONS = 1024;
const HASHAGG_BUFFER_SIZE = PAGE_SIZE;

const MB = 1024 * 1024;
const WORK_MEM_CHOICES = [4, 8, 16, 32, 64, 128, 256, 512];

/**
 * tuplesort_merge_order(): each input tape costs one block of tape overhead
 * plus a 32-block pre-read buffer, and each output tape costs a block too, so
 * the budget is 2 * BLCKSZ + MERGE_BUFFER_SIZE per tape. Clamped to
 * [MINORDER, MAXORDER] = [6, 500].
 */
function mergeOrder(workMemBytes: number): number {
  const raw = Math.floor(workMemBytes / (2 * PAGE_SIZE + PAGE_SIZE * 32));
  return Math.min(500, Math.max(6, raw));
}

/** nodeAgg.c hash_choose_num_partitions(): always rounded to a power of two. */
function aggPartitions(hashMemLimit: number): number {
  const partitionLimit =
    (hashMemLimit * 0.25 - HASHAGG_BUFFER_SIZE) / HASHAGG_BUFFER_SIZE;
  const memWanted = HASHAGG_PARTITION_FACTOR * GROUPS * HASH_ENTRY_BYTES;
  let d = 1 + memWanted / hashMemLimit;
  if (d > partitionLimit) d = partitionLimit;
  if (d < HASHAGG_MIN_PARTITIONS) d = HASHAGG_MIN_PARTITIONS;
  if (d > HASHAGG_MAX_PARTITIONS) d = HASHAGG_MAX_PARTITIONS;
  return 2 ** Math.ceil(Math.log2(Math.trunc(d)));
}

/**
 * nodeAgg.c hash_agg_set_limits(): the open spill tapes need buffers, and that
 * memory comes out of the hash table's own budget.
 */
function aggLimits(hashMemLimit: number) {
  if (HASH_TABLE_BYTES <= hashMemLimit) {
    return {
      memLimit: hashMemLimit,
      ngroupsLimit: hashMemLimit / HASH_ENTRY_BYTES,
      partitions: 0,
    };
  }
  const partitions = aggPartitions(hashMemLimit);
  const partitionMem = HASHAGG_BUFFER_SIZE * (1 + partitions);
  const memLimit =
    hashMemLimit > 4 * partitionMem
      ? hashMemLimit - partitionMem
      : hashMemLimit * 0.75;
  return {
    memLimit,
    ngroupsLimit: memLimit > HASH_ENTRY_BYTES ? memLimit / HASH_ENTRY_BYTES : 1,
    partitions,
  };
}

type SortModel = {
  fits: boolean;
  runs: number;
  order: number;
  passes: number;
  pageAccesses: number;
  cpu: number;
  disk: number;
  total: number;
};

type AggModel = {
  fits: boolean;
  budgetBytes: number;
  batches: number;
  partitions: number;
  depth: number;
  cpu: number;
  disk: number;
  spillCpu: number;
  total: number;
};

function modelSort(workMemMB: number): SortModel {
  const workMemBytes = workMemMB * MB;
  const cpu = COMPARISON_COST * ROWS * Math.log2(ROWS);
  if (DATA_BYTES <= workMemBytes) {
    return {
      fits: true,
      runs: 1,
      order: mergeOrder(workMemBytes),
      passes: 0,
      pageAccesses: 0,
      cpu,
      disk: 0,
      total: cpu,
    };
  }
  // cost_tuplesort keeps nruns as a raw ratio; we round up so the displayed
  // run count is a whole number. It never changes the pass count here.
  const runs = Math.ceil(DATA_BYTES / workMemBytes);
  const order = mergeOrder(workMemBytes);
  const passes =
    runs > order ? Math.ceil(Math.log(runs) / Math.log(order)) : 1;
  const pageAccesses = 2 * PAGES * passes;
  const disk = pageAccesses * DISK_WEIGHT;
  return { fits: false, runs, order, passes, pageAccesses, cpu, disk, total: cpu + disk };
}

function modelAgg(workMemMB: number): AggModel {
  // get_hash_memory_limit() = work_mem * hash_mem_multiplier.
  const budgetBytes = workMemMB * MB * HASH_MEM_MULTIPLIER;
  const cpu = CPU_OPERATOR_COST * ROWS + CPU_TUPLE_COST * GROUPS;
  if (HASH_TABLE_BYTES <= budgetBytes) {
    return {
      fits: true,
      budgetBytes,
      batches: 1,
      partitions: 0,
      depth: 0,
      cpu,
      disk: 0,
      spillCpu: 0,
      total: cpu,
    };
  }
  const { memLimit, ngroupsLimit, partitions } = aggLimits(budgetBytes);
  // cost_agg: nbatches = max(table / mem_limit, groups / ngroups_limit).
  const batches = Math.max(
    1,
    Math.ceil(
      Math.max(HASH_TABLE_BYTES / memLimit, GROUPS / ngroupsLimit),
    ),
  );
  const depth = Math.ceil(
    Math.log(batches) / Math.log(Math.max(partitions, 2)),
  );
  // cost_agg: pages written at random_page_cost, read at seq_page_cost,
  // both inflated 2x ("HashAgg has somewhat worse IO behavior than Sort").
  const disk =
    PAGES * depth * 2 * RANDOM_PAGE_COST + PAGES * depth * 2 * SEQ_PAGE_COST;
  const spillCpu = depth * ROWS * 2 * CPU_TUPLE_COST;
  return {
    fits: false,
    budgetBytes,
    batches,
    partitions,
    depth,
    cpu,
    disk,
    spillCpu,
    total: cpu + disk + spillCpu,
  };
}

const SORT_BASE = modelSort(1024).total; // fully in memory
const AGG_BASE = modelAgg(1024).total;

const num = (n: number) => Math.round(n).toLocaleString("en-US");
const ratio = (n: number, base: number) => (n / base).toFixed(2);

type StepDef = {
  side: "both" | "sort" | "agg";
  title: (ja: boolean) => string;
  body: (ja: boolean, s: SortModel, a: AggModel, mb: number) => string;
};

const STEPS: StepDef[] = [
  {
    side: "both",
    title: (ja) => (ja ? "入力とメモリ予算" : "Input and memory budget"),
    body: (ja, s, a, mb) =>
      ja
        ? `${num(ROWS)} 行 × ${ROW_BYTES} バイト = 330MB を、work_mem = ${mb}MB で処理します。ソートは全行を並べ替え、集約は同じ入力を ${num(GROUPS)} グループにまとめます（第11章前半のソート例と同じ入力です。表の 1,000,000 行 / 100,000 グループの例ではありません）。予算はソートが work_mem そのもの、ハッシュ集約は hash_mem_multiplier = ${HASH_MEM_MULTIPLIER} 倍の ${mb * HASH_MEM_MULTIPLIER}MB です。ソートは${s.fits ? "収まります" : "収まりません"}。ハッシュ表 ${num(GROUPS)} × ${HASH_ENTRY_BYTES}B = ${num(HASH_TABLE_BYTES / MB)}MB は${a.fits ? "収まります" : "収まりません"}。`
        : `${num(ROWS)} rows × ${ROW_BYTES} bytes = 330 MB, processed with work_mem = ${mb} MB. The sort orders every row; the aggregate folds that same input into ${num(GROUPS)} groups (this is the chapter's sort example, not the 1,000,000-row / 100,000-group table above). Sorting gets work_mem itself; hash aggregation gets hash_mem_multiplier = ${HASH_MEM_MULTIPLIER}× that, i.e. ${mb * HASH_MEM_MULTIPLIER} MB. The sort ${s.fits ? "fits" : "does not fit"}. The hash table, ${num(GROUPS)} × ${HASH_ENTRY_BYTES} B = ${num(HASH_TABLE_BYTES / MB)} MB, ${a.fits ? "fits" : "does not fit"}.`,
  },
  {
    side: "sort",
    title: (ja) => (ja ? "ソート: run の生成" : "Sort: generating runs"),
    body: (ja, s, _a, mb) =>
      s.fits
        ? ja
          ? `入力全体が work_mem に収まるので run は作られません。メモリ内クイックソート1回で終わりです。`
          : `The whole input fits in work_mem, so no runs are produced — a single in-memory quicksort finishes the job.`
        : ja
          ? `work_mem を使い切るたびに、その分だけをソートして一時ファイルへ書き出します。330MB ÷ ${mb}MB = ${num(s.runs)} 本の run ができます。ここまでは書き込みだけです。`
          : `Each time work_mem fills up, that chunk is sorted and written to a temp file. 330 MB ÷ ${mb} MB gives ${num(s.runs)} runs. So far this is writes only.`,
  },
  {
    side: "sort",
    title: (ja) => (ja ? "ソート: マージ次数" : "Sort: merge order"),
    body: (ja, s, _a, mb) =>
      s.fits
        ? ja
          ? "マージ段階そのものが存在しません。"
          : "There is no merge phase at all."
        : ja
          ? `マージ中は入力テープ 1 本につき 32 ブロック（256KB）の先読みバッファと、入力・出力それぞれ 1 ブロックずつのテープ用バッファが要ります。合わせて 34 ブロック = 272KB。work_mem = ${mb}MB なら同時に扱えるのは ${s.order} 本です。run が ${num(s.runs)} 本なので、${s.runs > s.order ? "1 パスでは足りません" : "1 パスで足ります"}。`
          : `During the merge each input tape needs a 32-block (256 KB) pre-read buffer, plus one block of tape buffer for the input tape and one for the output tape — 34 blocks, 272 KB in all. At work_mem = ${mb} MB that allows ${s.order} tapes at once. With ${num(s.runs)} runs, one pass is ${s.runs > s.order ? "not enough" : "enough"}.`,
  },
  {
    side: "sort",
    title: (ja) => (ja ? "ソート: マージパス" : "Sort: merge passes"),
    body: (ja, s) =>
      s.fits
        ? ja
          ? "ディスク I/O はゼロです。"
          : "Disk I/O is zero."
        : ja
          ? `パス数は ⌈log_${s.order} ${num(s.runs)}⌉ = ${s.passes}。各パスで全データを1回書いて1回読むので、ページアクセスは 2 × ${num(PAGES)} × ${s.passes} = ${num(s.pageAccesses)} 回です。`
          : `The pass count is ⌈log_${s.order} ${num(s.runs)}⌉ = ${s.passes}. Each pass writes and reads all the data once, so page accesses come to 2 × ${num(PAGES)} × ${s.passes} = ${num(s.pageAccesses)}.`,
  },
  {
    side: "sort",
    title: (ja) => (ja ? "ソート: 合計" : "Sort: the total"),
    body: (ja, s) =>
      ja
        ? `比較コストは ${num(s.cpu)} で、work_mem に関係なく一定です。ディスクは ${num(s.disk)}。合計 ${num(s.total)}、メモリ内実行の ${ratio(s.total, SORT_BASE)} 倍にとどまります。`
        : `Comparison cost is ${num(s.cpu)} and does not depend on work_mem at all. Disk adds ${num(s.disk)}. Total ${num(s.total)} — only ${ratio(s.total, SORT_BASE)}× the fully in-memory run.`,
  },
  {
    side: "agg",
    title: (ja) => (ja ? "ハッシュ集約: 溢れる" : "Hash aggregation: overflowing"),
    body: (ja, _s, a, mb) =>
      a.fits
        ? ja
          ? `ハッシュ表 ${num(HASH_TABLE_BYTES / MB)}MB が予算 ${mb * HASH_MEM_MULTIPLIER}MB に収まります。溢れないのでディスクは一切使いません。`
          : `The ${num(HASH_TABLE_BYTES / MB)} MB hash table fits the ${mb * HASH_MEM_MULTIPLIER} MB budget. Nothing spills, so no disk is touched.`
        : ja
          ? `ハッシュ表 ${num(HASH_TABLE_BYTES / MB)}MB が予算 ${mb * HASH_MEM_MULTIPLIER}MB を超えます。グループをハッシュ値で ${a.partitions} 個のパーティションに振り分け、全体を ${num(a.batches)} バッチとして処理します。コストを決めるのはバッチ数そのものではなく再帰の深さ ⌈log_${a.partitions} ${num(a.batches)}⌉ = ${a.depth} 段のほうです。収まらない分は入力タプルごと書き出して後で読み直します。ソートと違い、書き出すのは中間結果ではなく入力そのものです。`
          : `The ${num(HASH_TABLE_BYTES / MB)} MB hash table exceeds the ${mb * HASH_MEM_MULTIPLIER} MB budget. Groups are routed by hash into ${a.partitions} partitions and the whole input is processed as ${num(a.batches)} batches. What sets the cost is not the batch count itself but the recursion depth, ⌈log_${a.partitions} ${num(a.batches)}⌉ = ${a.depth}. Whatever does not fit is written out as input tuples to be re-read later — unlike sorting, what spills is the input itself, not an intermediate result.`,
  },
  {
    side: "both",
    title: (ja) => (ja ? "判定" : "The verdict"),
    body: (ja, s, a) =>
      ja
        ? `ソートは ${ratio(s.total, SORT_BASE)} 倍、ハッシュ集約は ${ratio(a.total, AGG_BASE)} 倍。同じ「メモリが足りない」でも、片方はなだらかに劣化し、もう片方は崖から落ちます。`
        : `Sorting lands at ${ratio(s.total, SORT_BASE)}× and hash aggregation at ${ratio(a.total, AGG_BASE)}×. Same "out of memory", but one degrades gently and the other falls off a cliff.`,
  },
];

/* ── Chart ────────────────────────────────────────────────── */

function Chart({ current, isJa }: { current: number; isJa: boolean }) {
  const titleId = useId();
  const points = WORK_MEM_CHOICES.map((mb) => ({
    mb,
    sort: modelSort(mb).total / SORT_BASE,
    agg: modelAgg(mb).total / AGG_BASE,
  }));
  const maxRatio = Math.max(...points.map((p) => Math.max(p.sort, p.agg)));
  const W = 520;
  const H = 180;
  const padL = 40;
  const padB = 26;
  const padT = 12;
  // If nothing ever spilled, every ratio would be 1.0 and the span would be
  // zero; keep the divisor positive so the whole series lands on the baseline.
  const span = Math.max(maxRatio - 1, 1e-9);
  const x = (i: number) =>
    padL + (i * (W - padL - 12)) / (WORK_MEM_CHOICES.length - 1);
  const y = (r: number) => H - padB - ((r - 1) / span) * (H - padB - padT);

  const path = (key: "sort" | "agg") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p[key])}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto w-full min-w-[440px] max-w-2xl"
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>
          {isJa
            ? "work_mem を変えたときの、メモリ内実行に対するコスト倍率の折れ線グラフ。正確な数値はこの下の「グラフの数値を表で見る」にあります。"
            : "Line chart of cost relative to a fully in-memory run as work_mem varies. Exact values are in the table below the chart."}
        </title>

        {/* baseline */}
        <line
          x1={padL}
          y1={y(1)}
          x2={W - 12}
          y2={y(1)}
          className="stroke-border"
          strokeDasharray="3 3"
        />
        <text x={4} y={y(1) + 4} className="fill-muted-foreground" fontSize={10}>
          1.0×
        </text>
        <text x={4} y={padT + 8} className="fill-muted-foreground" fontSize={10}>
          {maxRatio.toFixed(1)}×
        </text>

        <path
          d={path("agg")}
          fill="none"
          strokeWidth={2}
          className="stroke-rose-600 dark:stroke-rose-400"
        />
        <path
          d={path("sort")}
          fill="none"
          strokeWidth={2}
          className="stroke-sky-600 dark:stroke-sky-400"
        />

        {points.map((p, i) => (
          <g key={p.mb}>
            <circle
              cx={x(i)}
              cy={y(p.agg)}
              r={p.mb === current ? 4.5 : 2.5}
              className="fill-rose-600 dark:fill-rose-400"
            />
            <circle
              cx={x(i)}
              cy={y(p.sort)}
              r={p.mb === current ? 4.5 : 2.5}
              className="fill-sky-600 dark:fill-sky-400"
            />
            <text
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={9}
              className={p.mb === current ? "fill-foreground font-bold" : "fill-muted-foreground"}
            >
              {p.mb}
            </text>
          </g>
        ))}

        <line
          x1={x(WORK_MEM_CHOICES.indexOf(current))}
          y1={padT}
          x2={x(WORK_MEM_CHOICES.indexOf(current))}
          y2={H - padB}
          className="stroke-accent"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────── */

type Props = { locale?: string };

export function SpillVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [workMem, setWorkMem] = useState(4);
  const sliderId = useId();

  const sort = useMemo(() => modelSort(workMem), [workMem]);
  const agg = useMemo(() => modelAgg(workMem), [workMem]);

  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 2600 });
  const step = STEPS[player.step];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "work_mem を超えたとき — ソートとハッシュ集約の壊れ方"
          : "Crossing work_mem — How Sorting and Hash Aggregation Break"
      }
      description={
        isJa
          ? "同じ 330MB の入力に対して、work_mem を動かしながらソートとハッシュ集約のコストを比べます。ソートはなだらかに、ハッシュ集約は段差で悪化します。"
          : "The same 330 MB input, with work_mem as a dial: sorting degrades smoothly, hash aggregation degrades in steps."
      }
    >
      <div className="space-y-4">
        {/* Slider */}
        <div className="rounded-lg border border-border bg-background p-3">
          <label
            htmlFor={sliderId}
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            work_mem
          </label>
          <div className="flex items-center gap-3">
            <input
              id={sliderId}
              type="range"
              min={0}
              max={WORK_MEM_CHOICES.length - 1}
              step={1}
              value={WORK_MEM_CHOICES.indexOf(workMem)}
              onChange={(e) =>
                setWorkMem(WORK_MEM_CHOICES[Number(e.target.value)])
              }
              aria-valuetext={`${workMem} MB`}
              className="h-1.5 w-full cursor-pointer accent-accent"
            />
            <span className="w-20 shrink-0 text-right font-mono text-sm font-bold text-foreground">
              {workMem} MB
            </span>
          </div>
        </div>

        {/* Two sides */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={`rounded-lg border p-3 transition-colors ${
              step.side === "sort"
                ? "border-sky-600 bg-sky-600/10 dark:border-sky-400 dark:bg-sky-400/10"
                : "border-border bg-background"
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                {isJa ? "外部マージソート" : "External merge sort"}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {ratio(sort.total, SORT_BASE)}×
              </span>
            </div>
            <dl className="space-y-0.5 font-mono text-[11px]">
              {[
                [isJa ? "run 数" : "runs", sort.fits ? "—" : num(sort.runs)],
                [isJa ? "マージ次数" : "merge order", String(sort.order)],
                [isJa ? "パス数" : "passes", sort.fits ? "0" : String(sort.passes)],
                ["CPU", num(sort.cpu)],
                [isJa ? "ディスク" : "disk", num(sort.disk)],
                [isJa ? "合計" : "total", num(sort.total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div
            className={`rounded-lg border p-3 transition-colors ${
              step.side === "agg"
                ? "border-rose-600 bg-rose-600/10 dark:border-rose-400 dark:bg-rose-400/10"
                : "border-border bg-background"
            }`}
          >
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                {isJa ? "ハッシュ集約" : "Hash aggregation"}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {ratio(agg.total, AGG_BASE)}×
              </span>
            </div>
            <dl className="space-y-0.5 font-mono text-[11px]">
              {[
                [
                  isJa ? "予算" : "budget",
                  `${num(agg.budgetBytes / MB)} MB`,
                ],
                [
                  isJa ? "ハッシュ表" : "hash table",
                  `${num(HASH_TABLE_BYTES / MB)} MB`,
                ],
                [isJa ? "バッチ数" : "batches", num(agg.batches)],
                [
                  isJa ? "再帰の深さ" : "spill depth",
                  String(agg.depth),
                ],
                ["CPU", num(agg.cpu)],
                [
                  isJa ? "ディスク" : "disk",
                  num(agg.disk + agg.spillCpu),
                ],
                [isJa ? "合計" : "total", num(agg.total)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Narration */}
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
          <div className="mb-1 text-xs font-semibold text-foreground">
            {step.title(isJa)}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {step.body(isJa, sort, agg, workMem)}
          </p>
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />

        {/* Chart */}
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">
              {isJa
                ? "メモリ内実行に対するコスト倍率"
                : "Cost relative to a fully in-memory run"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-sky-600 dark:bg-sky-400" />
              {isJa ? "ソート" : "sort"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-rose-600 dark:bg-rose-400" />
              {isJa ? "ハッシュ集約" : "hash agg"}
            </span>
            <span className="ml-auto font-mono">work_mem (MB)</span>
          </div>
          <Chart current={workMem} isJa={isJa} />
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {isJa
              ? "ハッシュ集約の線が 4〜32MB で平らなのは、cost_agg が見ているのが連続量ではなく整数の再帰の深さだからです。この範囲ではバッチ数が増えても深さは 1 のままなので、コストも動きません。平坦な区間はモデルの性質であって、実測値が本当に一定だという意味ではありません。"
              : "The hash-aggregate line is flat from 4 to 32 MB because cost_agg keys off an integer — the recursion depth — rather than a continuous quantity. Across this range the batch count grows but the depth stays at 1, so the cost does not move. The plateau is a property of the model, not a claim that real runtimes are constant there."}
          </p>
        </div>

        {/* Text mirror of the chart */}
        <details className="rounded-lg border border-border bg-background p-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-muted-foreground">
            {isJa ? "グラフの数値を表で見る" : "The chart as a table"}
          </summary>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="py-1 pr-2 font-medium">work_mem</th>
                <th scope="col" className="py-1 pr-2 text-right font-medium">
                  {isJa ? "ソート" : "sort"}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {isJa ? "ハッシュ集約" : "hash agg"}
                </th>
              </tr>
            </thead>
            <tbody>
              {WORK_MEM_CHOICES.map((mb) => (
                <tr
                  key={mb}
                  className={`border-b border-border/40 last:border-0 font-mono ${
                    mb === workMem ? "font-bold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <td className="py-1 pr-2">{mb} MB</td>
                  <td className="py-1 pr-2 text-right">
                    {ratio(modelSort(mb).total, SORT_BASE)}×
                  </td>
                  <td className="py-1 text-right">
                    {ratio(modelAgg(mb).total, AGG_BASE)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </InteractiveDemo>
  );
}
