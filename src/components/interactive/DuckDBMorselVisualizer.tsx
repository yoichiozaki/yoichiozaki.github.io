"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/** Cost of each morsel in arbitrary time units — deliberately skewed. */
const COST = [3, 1, 2, 1, 1, 4, 1, 1, 2, 1, 1, 1];
const TOTAL_TICKS = 7;

type Slot = { morsel: number; start: number; end: number };

/** Static split: thread t statically owns morsels [3t, 3t+2]. */
const STATIC: Slot[][] = [
  [
    { morsel: 0, start: 0, end: 3 },
    { morsel: 1, start: 3, end: 4 },
    { morsel: 2, start: 4, end: 6 },
  ],
  [
    { morsel: 3, start: 0, end: 1 },
    { morsel: 4, start: 1, end: 2 },
    { morsel: 5, start: 2, end: 6 },
  ],
  [
    { morsel: 6, start: 0, end: 1 },
    { morsel: 7, start: 1, end: 2 },
    { morsel: 8, start: 2, end: 4 },
  ],
  [
    { morsel: 9, start: 0, end: 1 },
    { morsel: 10, start: 1, end: 2 },
    { morsel: 11, start: 2, end: 3 },
  ],
];

/** Morsel-driven: each idle thread grabs the next unclaimed morsel. */
const DYNAMIC: Slot[][] = [
  [
    { morsel: 0, start: 0, end: 3 },
    { morsel: 8, start: 3, end: 5 },
  ],
  [
    { morsel: 1, start: 0, end: 1 },
    { morsel: 4, start: 1, end: 2 },
    { morsel: 6, start: 2, end: 3 },
    { morsel: 9, start: 3, end: 4 },
    { morsel: 11, start: 4, end: 5 },
  ],
  [
    { morsel: 2, start: 0, end: 2 },
    { morsel: 7, start: 2, end: 3 },
    { morsel: 10, start: 3, end: 4 },
  ],
  [
    { morsel: 3, start: 0, end: 1 },
    { morsel: 5, start: 1, end: 5 },
  ],
];

const MAKESPAN_STATIC = 6;
const MAKESPAN_DYNAMIC = 5;

function Lane({
  slots,
  tick,
  threadId,
  idleLabel,
}: {
  slots: Slot[];
  tick: number;
  threadId: number;
  idleLabel: string;
}) {
  const active = slots.find((s) => tick >= s.start && tick < s.end);
  const finished = slots.every((s) => tick >= s.end);
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-[11px] text-muted-foreground">
        thread {threadId}
      </span>
      <div className="flex flex-1 gap-0.5">
        {[...Array(TOTAL_TICKS - 1).keys()].map((t) => {
          const slot = slots.find((s) => t >= s.start && t < s.end);
          const isNow = t === tick;
          const past = t < tick;
          return (
            <div
              key={t}
              className={`h-7 flex-1 rounded-sm border text-center font-mono text-[10px] leading-7 transition-colors ${
                slot
                  ? isNow
                    ? "border-accent bg-accent text-accent-foreground"
                    : past
                      ? "border-border bg-accent/25 text-foreground"
                      : "border-border bg-muted text-muted-foreground"
                  : "border-dashed border-border bg-transparent text-muted-foreground"
              }`}
            >
              {slot ? `m${slot.morsel}` : ""}
            </div>
          );
        })}
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
        {active ? `m${active.morsel}` : finished ? idleLabel : ""}
      </span>
    </div>
  );
}

export function DuckDBMorselVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const player = useStepPlayer({ totalSteps: TOTAL_TICKS, intervalMs: 1100, loop: true });
  const tick = player.step;

  return (
    <InteractiveDemo
      title={isJa ? "モーセル駆動並列化 vs 静的分割" : "Morsel-driven parallelism vs a static split"}
      description={
        isJa
          ? "12 個のモーセル（それぞれ 1 row group 相当）を 4 スレッドで処理します。処理コストは意図的に偏らせてあります。再生ボタンで時間を進めて、2 つの割り当て戦略の差を見てください。"
          : "Twelve morsels (one row group each) processed by four threads, with deliberately skewed costs. Hit play to advance time and compare the two assignment strategies."
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {isJa
              ? `モーセルのコスト（合計 ${COST.reduce((a, b) => a + b, 0)} / 理想 ${(COST.reduce((a, b) => a + b, 0) / 4).toFixed(2)}）`
              : `Morsel costs (total ${COST.reduce((a, b) => a + b, 0)} / ideal ${(COST.reduce((a, b) => a + b, 0) / 4).toFixed(2)})`}
          </div>
          <div className="flex flex-wrap gap-1">
            {COST.map((c, i) => (
              <div
                key={i}
                className="flex min-w-[46px] flex-col items-center rounded-md border border-border bg-background px-1.5 py-1"
              >
                <span className="font-mono text-[10px] text-muted-foreground">m{i}</span>
                <span className="font-mono text-xs text-foreground">{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-foreground">
              {isJa ? "静的分割（1 スレッド = 3 モーセル固定）" : "Static split (3 fixed morsels per thread)"}
            </span>
            <span className="font-mono text-[11px] text-red-600 dark:text-red-400">
              {isJa ? `完了 ${MAKESPAN_STATIC}` : `finishes at ${MAKESPAN_STATIC}`}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {STATIC.map((slots, i) => (
              <Lane
                key={i}
                slots={slots}
                tick={tick}
                threadId={i}
                idleLabel={isJa ? "遊休" : "idle"}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-foreground">
              {isJa
                ? "モーセル駆動（空いたスレッドが次のモーセルを取る）"
                : "Morsel-driven (an idle thread claims the next morsel)"}
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              {isJa ? `完了 ${MAKESPAN_DYNAMIC}` : `finishes at ${MAKESPAN_DYNAMIC}`}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {DYNAMIC.map((slots, i) => (
              <Lane
                key={i}
                slots={slots}
                tick={tick}
                threadId={i}
                idleLabel={isJa ? "遊休" : "idle"}
              />
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
          {isJa
            ? "静的分割ではスレッド 2・3 が早々に手を空け、遅いスレッドを待つ。モーセル駆動では GlobalSourceState の共有カーソルを短いロック（RowGroupCollection::NextParallelScan の lock_guard）の下で 1 つ進めるだけで、負荷が自然に均される。1 回のロックで 1 row group ぶんの仕事を取るので、ロックが競合点になることはない。DuckDB はさらに TaskExecutionMode::PROCESS_PARTIAL で 50 chunk（PipelineTask::PARTIAL_CHUNK_COUNT）ごとにスケジューラへ制御を返し、タスク粒度も動的に保つ。"
            : "With a static split, threads 2 and 3 go idle early and everyone waits for the slowest. Morsel-driven scheduling only needs one short critical section around the shared cursor in GlobalSourceState (the lock_guard in RowGroupCollection::NextParallelScan), and the load balances itself. Each lock hands out a whole row group of work, so the lock never becomes the bottleneck. DuckDB additionally yields back to the scheduler every 50 chunks (PipelineTask::PARTIAL_CHUNK_COUNT) via TaskExecutionMode::PROCESS_PARTIAL, keeping task granularity adaptive."}
        </div>

        <StepPlayerControls
          {...player}
          label={(s) => `t = ${s}`}
          ariaLabels={
            isJa
              ? {
                  reset: "リセット",
                  backward: "1 ステップ戻る",
                  play: "再生",
                  pause: "一時停止",
                  forward: "1 ステップ進む",
                  goToStep: (target: number) => `ステップ ${target} へ`,
                  progress: "再生進行状況",
                }
              : undefined
          }
        />
      </div>
    </InteractiveDemo>
  );
}
