"use client";

import { useMemo, useState } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";
import {
  simulateBatching,
  type BatchJob,
  type BatchingMode,
} from "@/lib/llm-load-balancing-model";

type Props = { locale?: string };

const JOBS: BatchJob[] = [
  { id: "A", arrival: 0, prefillChunks: 2, decodeSteps: 6 },
  { id: "B", arrival: 0, prefillChunks: 1, decodeSteps: 3 },
  { id: "C", arrival: 1, prefillChunks: 3, decodeSteps: 4 },
  { id: "D", arrival: 2, prefillChunks: 1, decodeSteps: 8 },
  { id: "E", arrival: 4, prefillChunks: 2, decodeSteps: 3 },
  { id: "F", arrival: 6, prefillChunks: 1, decodeSteps: 5 },
];

const SLOTS = 3;
const MODES: BatchingMode[] = ["static", "continuous", "chunked"];

// Darkened one step from the -600 ramp so white chip text clears WCAG AA (4.5:1)
// even with the opacity-70 applied to prefill chips.
const JOB_STYLE: Record<string, string> = {
  A: "bg-blue-800",
  B: "bg-emerald-800",
  C: "bg-amber-800",
  D: "bg-violet-800",
  E: "bg-rose-800",
  F: "bg-cyan-900",
};

const TEXT = {
  ja: {
    title: "エンジン内スケジューリング：静的 / 連続 / チャンク化プレフィル",
    description:
      "同じ到着列を 3 つのバッチ処理方式で回し、スロットの空きとデコード停止がどこで生じるかを 1 反復ずつ確認します。",
    mode: "方式",
    modes: {
      static: "静的バッチ",
      continuous: "連続バッチ",
      chunked: "チャンク化プレフィル",
    } satisfies Record<BatchingMode, string>,
    modeDescriptions: {
      static:
        "バッチ全体が完了するまでスロットを再利用しません。短いリクエストが長いリクエストの完了を待たされ、スロットが遊びます。",
      continuous:
        "反復ごとに空きスロットを補充します。ただしプレフィルは 1 反復を占有するため、その間デコードは停止します。",
      chunked:
        "プレフィルをチャンクに分割し、同じ反復でデコードと同居させます。デコードが始まったあとの停止が消え、トークン間遅延が安定します（最初の反復だけは、まだ 1 本もプレフィルを終えていないため出力が 0 です）。",
    } satisfies Record<BatchingMode, string>,
    iteration: "反復",
    slot: "スロット",
    prefill: "プレフィル",
    decode: "デコード",
    idle: "空き",
    stalled: "出力トークン 0 の反復",
    waiting: "待機中",
    done: "完了",
    none: "なし",
    tokensThis: "この反復の出力トークン",
    summary: "3 方式の比較",
    finishedAt: "全完了までの反復数",
    stalls: "出力 0 の反復数",
    utilization: "スロット占有率",
    caution:
      "1 反復あたりのプレフィルチャンク数とデコード歩数を整数に単純化した模式図です。実機ではチャンク化プレフィルにも計算予算の上限があり、プレフィルとデコードの比率を変えるとスループットとトークン間遅延がトレードオフになります。",
  },
  en: {
    title: "Engine scheduling: static, continuous, and chunked prefill",
    description:
      "One arrival trace under three batching styles, iteration by iteration, showing where slots idle and where decode stalls.",
    mode: "Mode",
    modes: {
      static: "Static batching",
      continuous: "Continuous batching",
      chunked: "Chunked prefill",
    } satisfies Record<BatchingMode, string>,
    modeDescriptions: {
      static:
        "Slots are not reused until the whole batch finishes. Short requests wait for the longest one and slots sit idle.",
      continuous:
        "Free slots are refilled every iteration, but a prefill occupies the whole iteration, so decode stalls while it runs.",
      chunked:
        "Prefill is split into chunks that ride along with decode in the same iteration. Stalls after decode has started disappear and inter-token latency steadies. Only the very first iteration still emits nothing, because no sequence has finished prefill yet.",
    } satisfies Record<BatchingMode, string>,
    iteration: "Iteration",
    slot: "Slot",
    prefill: "prefill",
    decode: "decode",
    idle: "idle",
    stalled: "iteration with zero output tokens",
    waiting: "Waiting",
    done: "Completed",
    none: "none",
    tokensThis: "Output tokens this iteration",
    summary: "Comparison of the three modes",
    finishedAt: "Iterations to drain",
    stalls: "Zero-output iterations",
    utilization: "Slot occupancy",
    caution:
      "Prefill chunks and decode steps are integer-quantised for legibility. Real chunked prefill has a per-iteration token budget, and shifting the prefill/decode mix trades throughput against inter-token latency.",
  },
} as const;

export function ContinuousBatchingVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const t = isJa ? TEXT.ja : TEXT.en;

  const [mode, setMode] = useState<BatchingMode>("continuous");

  const runs = useMemo(
    () =>
      Object.fromEntries(
        MODES.map((entry) => [entry, simulateBatching(entry, JOBS, SLOTS)]),
      ) as Record<BatchingMode, ReturnType<typeof simulateBatching>>,
    [],
  );
  const run = runs[mode];

  const player = useStepPlayer({
    totalSteps: run.iterations.length,
    intervalMs: 700,
  });
  const step = Math.min(player.step, run.iterations.length - 1);
  const current = run.iterations[step];

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((entry) => (
            <button
              key={entry}
              type="button"
              onClick={() => {
                setMode(entry);
                player.reset();
              }}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === entry
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={mode === entry}
            >
              {t.modes[entry]}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t.modeDescriptions[mode]}</p>

        <section className="space-y-2">
          <div className="flex items-baseline justify-between text-xs">
            <h4 className="font-semibold">
              {t.iteration} {current.index + 1} / {run.iterations.length}
            </h4>
            <span className="font-mono text-muted-foreground">
              {t.tokensThis}: {current.tokens}
            </span>
          </div>

          <div className="space-y-1.5">
            {current.slots.map((slot, slotIndex) => (
              <div key={slotIndex} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] text-muted-foreground">
                  {t.slot} {slotIndex + 1}
                </span>
                <div
                  className={`flex h-8 flex-1 items-center justify-center rounded-md border text-xs font-semibold ${
                    slot.jobId === null
                      ? "border-dashed border-border bg-muted/40 text-muted-foreground"
                      : slot.phase === "prefill"
                        ? `border-transparent ${JOB_STYLE[slot.jobId]} text-white`
                        : slot.phase === "decode"
                          ? `border-transparent ${JOB_STYLE[slot.jobId]} text-white opacity-70`
                          : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {slot.jobId === null
                    ? t.idle
                    : `${slot.jobId} · ${
                        slot.phase === "prefill"
                          ? t.prefill
                          : slot.phase === "decode"
                            ? t.decode
                            : t.idle
                      }`}
                </div>
              </div>
            ))}
          </div>

          {current.stalled && (
            <p className="rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
              {t.stalled}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 text-xs">
            <div>
              <dt className="text-muted-foreground">{t.waiting}</dt>
              <dd className="font-mono">
                {current.waiting.length === 0 ? t.none : current.waiting.join(", ")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.done}</dt>
              <dd className="font-mono">
                {current.completed.length === 0
                  ? t.none
                  : current.completed.join(", ")}
              </dd>
            </div>
          </dl>
        </section>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(value) =>
            `${t.iteration} ${value + 1} · ${
              run.iterations[value]?.stalled ? t.stalled : `${run.iterations[value]?.tokens ?? 0} tok`
            }`
          }
        />

        <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
          <h4 className="mb-2 text-xs font-semibold">{t.summary}</h4>
          <table className="w-full min-w-[380px] text-right text-xs">
            <caption className="sr-only">{t.summary}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.mode}
                </th>
                <th scope="col">{t.finishedAt}</th>
                <th scope="col">{t.stalls}</th>
                <th scope="col">{t.utilization}</th>
              </tr>
            </thead>
            <tbody>
              {MODES.map((entry) => {
                const entryRun = runs[entry];
                const busy = entryRun.iterations.reduce(
                  (sum, iteration) =>
                    sum +
                    iteration.slots.filter((slot) => slot.jobId !== null).length,
                  0,
                );
                const capacity = entryRun.iterations.length * SLOTS;
                return (
                  <tr
                    key={entry}
                    className={`border-t border-border/60 ${
                      entry === mode ? "bg-muted/60" : ""
                    }`}
                  >
                    <th scope="row" className="px-2 py-1.5 text-left font-normal">
                      {t.modes[entry]}
                    </th>
                    <td className="px-2 py-1.5 font-mono tabular-nums">
                      {entryRun.finishedAt + 1}
                    </td>
                    <td className="px-2 py-1.5 font-mono tabular-nums">
                      {entryRun.stalledIterations}
                    </td>
                    <td className="px-2 py-1.5 font-mono tabular-nums">
                      {((busy / capacity) * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t.caution}
        </p>
      </div>
    </InteractiveDemo>
  );
}
