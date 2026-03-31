"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type G = { id: number; label: string; color: string };
type M = { id: number; label: string };
type P = { id: number; label: string };

type SchedulerState = {
  ps: { p: P; m: M | null; runningG: G | null }[];
  localQueues: Map<number, G[]>; // P.id → G[]
  globalQueue: G[];
  description: string;
  descriptionEn: string;
  highlight?: string; // element to highlight
};

// ── Color palette ───────────────────────────────────────────

const G_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

// ── Scenario data ───────────────────────────────────────────

function buildScenario(): SchedulerState[] {
  const g1: G = { id: 1, label: "G1", color: G_COLORS[0] };
  const g2: G = { id: 2, label: "G2", color: G_COLORS[1] };
  const g3: G = { id: 3, label: "G3", color: G_COLORS[2] };
  const g4: G = { id: 4, label: "G4", color: G_COLORS[3] };
  const g5: G = { id: 5, label: "G5", color: G_COLORS[4] };
  const g6: G = { id: 6, label: "G6", color: G_COLORS[5] };
  const g7: G = { id: 7, label: "G7", color: G_COLORS[6] };
  const m1: M = { id: 1, label: "M1" };
  const m2: M = { id: 2, label: "M2" };
  const m3: M = { id: 3, label: "M3" };
  const p1: P = { id: 1, label: "P1" };
  const p2: P = { id: 2, label: "P2" };

  return [
    // Step 0: Initial — schedule() loop entry
    {
      ps: [
        { p: p1, m: m1, runningG: null },
        { p: p2, m: m2, runningG: null },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "初期状態: runtime.schedule() ループに入ります。各 M は g0 スタック上で schedule() を実行し、次に実行する G を探します。P1-M1、P2-M2 が紐付いています。",
      descriptionEn:
        "Initial: Entering the runtime.schedule() loop. Each M runs schedule() on its g0 stack, searching for the next G to run. P1-M1 and P2-M2 are bound.",
    },
    // Step 1: newproc → G1 created, placed in runnext
    {
      ps: [
        { p: p1, m: m1, runningG: null },
        { p: p2, m: m2, runningG: null },
      ],
      localQueues: new Map([
        [1, [g1]],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "go func() により runtime.newproc() が呼ばれ、G1 の goroutine 構造体（runtime.g）が生成されます。スタック 2KB が割り当てられ、P1 の runnext スロットに配置されます。",
      descriptionEn:
        "go func() calls runtime.newproc(), allocating a runtime.g struct for G1 with a 2KB stack. G1 is placed in P1's runnext slot.",
      highlight: "G1",
    },
    // Step 2: P1 picks G1 via findRunnable → execute
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: null },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "schedule() → findRunnable() が P1 の runnext を確認し G1 を取得。execute(G1) で G1 の gobuf（PC/SP）を復元し、M1 上でユーザーコードの実行を開始します。",
      descriptionEn:
        "schedule() → findRunnable() checks P1's runnext and gets G1. execute(G1) restores G1's gobuf (PC/SP) and begins user code execution on M1.",
      highlight: "P1",
    },
    // Step 3: G1 spawns G2, G3 during execution
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: null },
      ],
      localQueues: new Map([
        [1, [g2, g3]],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "G1 内で go func() が 2 回呼ばれ G2, G3 が生成。新しい G は P1 のローカルキュー（256 エントリのリングバッファ）に runqput() で追加されます。",
      descriptionEn:
        "G1 calls go func() twice, spawning G2 and G3. New G's are added to P1's local queue (a 256-entry ring buffer) via runqput().",
      highlight: "G2",
    },
    // Step 4: Work stealing — P2 runs findRunnable → steals
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: g3 },
      ],
      localQueues: new Map([
        [1, [g2]],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "P2 の findRunnable(): ① runnext → 空 ② ローカルキュー → 空 ③ グローバルキュー → 空 ④ netpoll → なし ⑤ 他の P から steal。P1 のキューの半分 (G3) を runqsteal() でアトミックに盗みます。",
      descriptionEn:
        "P2's findRunnable(): ① runnext → empty ② local queue → empty ③ global queue → empty ④ netpoll → none ⑤ steal from other P. Atomically steals half of P1's queue (G3) via runqsteal().",
      highlight: "P2",
    },
    // Step 5: Overflow → global queue (runqputslow)
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: g3 },
      ],
      localQueues: new Map([
        [1, [g2]],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "さらに G4〜G6 が生成されます。ローカルキューに空きがない場合、runqputslow() がキューの半分 + 新しい G をグローバルキュー（mutex 保護のリンクリスト）にバッチ移動します。",
      descriptionEn:
        "G4–G6 are spawned. When the local queue is full, runqputslow() batch-moves half the queue + the new G to the global queue (a mutex-protected linked list).",
      highlight: "G4",
    },
    // Step 6: G1 completes → goexit → mcall(schedule)
    {
      ps: [
        { p: p1, m: m1, runningG: g2 },
        { p: p2, m: m2, runningG: g3 },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "G1 が return → runtime.goexit() が呼ばれ、G1 は _Gdead 状態に。G1 の構造体はフリーリスト（gFree）に戻されます。mcall(schedule) で g0 スタックに切り替わり、次の G2 を実行。",
      descriptionEn:
        "G1 returns → runtime.goexit() sets G1 to _Gdead. The g struct is returned to gFree pool. mcall(schedule) switches to g0 stack and runs G2 next.",
      highlight: "P1",
    },
    // Step 7: Syscall → entersyscall → hand-off
    {
      ps: [
        { p: p1, m: m1, runningG: g2 },
        { p: p2, m: null, runningG: null },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "G3 がシステムコール（read(2) など）を実行。runtime.entersyscall() が G3 を _Gsyscall に、P2 を _Psyscall に設定。sysmon が 20μs 後にこれを検知し、handoffp() で P2 を M2 から切り離します。",
      descriptionEn:
        "G3 enters a syscall (e.g., read(2)). runtime.entersyscall() sets G3 to _Gsyscall and P2 to _Psyscall. sysmon detects this after ~20μs and calls handoffp() to detach P2 from M2.",
      highlight: "M2",
    },
    // Step 8: P2 gets M3, fetches from global queue
    {
      ps: [
        { p: p1, m: m1, runningG: g2 },
        { p: p2, m: m3, runningG: g4 },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [g5, g6],
      description:
        "handoffp() がアイドル M を探すか新しい M3 を startm() で生成。P2 が M3 に紐付き、globrunqget() でグローバルキューから G4 を取得して実行再開。グローバルキューからは min(len/GOMAXPROCS+1, len/2) 個取得されます。",
      descriptionEn:
        "handoffp() finds an idle M or creates M3 via startm(). P2 binds to M3 and globrunqget() fetches G4 from the global queue. It takes min(len/GOMAXPROCS+1, len/2) items.",
      highlight: "M3",
    },
    // Step 9: Preemption — sysmon detects long-running G2
    {
      ps: [
        { p: p1, m: m1, runningG: g2 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g7]],
        [2, []],
      ]),
      globalQueue: [g6],
      description:
        "G2 が 10ms 以上実行を続けています。sysmon の retake() が検知し、G2 の stackguard0 に stackPreempt を設定。次の関数プロローグで G2 はプリエンプトされます（cooperative preemption）。Go 1.14+ では SIGURG シグナルで非同期プリエンプションも可能です。",
      descriptionEn:
        "G2 has been running for >10ms. sysmon's retake() detects this and sets G2's stackguard0 to stackPreempt. G2 is preempted at the next function prologue (cooperative). Go 1.14+ also supports async preemption via SIGURG signal.",
      highlight: "G2",
    },
    // Step 10: G2 preempted → back to local queue
    {
      ps: [
        { p: p1, m: m1, runningG: g7 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g2]],
        [2, []],
      ]),
      globalQueue: [g6],
      description:
        "G2 がプリエンプトされ、現在の実行状態（gobuf に PC/SP/BP を保存）を退避してローカルキューの末尾に戻されます（_Grunnable）。schedule() が G7 を選択して実行。公平性のため、61 回に 1 回はグローバルキューが優先されます。",
      descriptionEn:
        "G2 is preempted: its state is saved in gobuf (PC/SP/BP) and pushed back to the local queue as _Grunnable. schedule() picks G7 next. For fairness, the global queue is checked every 61 schedule cycles.",
      highlight: "G7",
    },
    // Step 11: Netpoller — G3 syscall completes
    {
      ps: [
        { p: p1, m: m1, runningG: g7 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g2]],
        [2, [g3]],
      ]),
      globalQueue: [g6],
      description:
        "M2 上でブロックしていた G3 のシステムコールが完了。runtime.exitsyscall() で G3 は _Grunnable に戻ります。元の P2 はすでに別の M に渡っているため、G3 は P2 のローカルキューに入れられます。",
      descriptionEn:
        "G3's syscall on M2 completes. runtime.exitsyscall() sets G3 back to _Grunnable. Since P2 was already handed off, G3 is placed in P2's local queue.",
      highlight: "G3",
    },
    // Step 12: All goroutines draining
    {
      ps: [
        { p: p1, m: m1, runningG: g2 },
        { p: p2, m: m3, runningG: g6 },
      ],
      localQueues: new Map([
        [1, []],
        [2, [g3]],
      ]),
      globalQueue: [],
      description:
        "G7, G5 が完了。P1 は G2 の実行を再開（gobuf から復元）、P2 はグローバルキューから G6 を取得。schedule() ループは「findRunnable → execute → goexit/preempt → schedule」を G がなくなるまで繰り返します。",
      descriptionEn:
        "G7, G5 complete. P1 resumes G2 (restored from gobuf), P2 fetches G6 from global queue. The schedule() loop repeats 'findRunnable → execute → goexit/preempt → schedule' until all G's are done.",
      highlight: "G6",
    },
    // Step 13: Final — all done, M's park
    {
      ps: [
        { p: p1, m: m1, runningG: null },
        { p: p2, m: m3, runningG: null },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "全ての Goroutine が完了。findRunnable() で実行可能な G が見つからない M は stopm() でパークし、futex/semaphore で待機します。M2 は syscall から復帰後にアイドルリストに戻されます。P も pidle リストに戻ります。",
      descriptionEn:
        "All goroutines done. M's that can't find runnable G's call stopm() and park on a futex/semaphore. M2 returns to the idle list after its syscall. P's return to pidle list.",
    },
  ];
}

// ── Rendering helpers ───────────────────────────────────────

function GBadge({
  g,
  highlight,
  small,
}: {
  g: G;
  highlight?: string;
  small?: boolean;
}) {
  const isHighlighted = highlight === g.label;
  const size = small ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold text-white shrink-0 transition-all duration-300 ${isHighlighted ? "ring-2 ring-offset-2 ring-accent scale-110" : ""}`}
      style={{ backgroundColor: g.color }}
    >
      {g.label}
    </div>
  );
}

function ProcessorSlot({
  pState,
  localQueue,
  highlight,
}: {
  pState: SchedulerState["ps"][0];
  localQueue: G[];
  highlight?: string;
}) {
  const { p, m, runningG } = pState;
  const isPHighlighted = highlight === p.label;
  const isMHighlighted = m ? highlight === m.label : false;

  return (
    <div className="flex flex-col items-center gap-2 min-w-[120px]">
      {/* P box */}
      <div
        className={`rounded-lg border-2 px-3 py-2 text-center transition-all duration-300 ${
          isPHighlighted
            ? "border-accent bg-accent/10 scale-105"
            : "border-border bg-background"
        }`}
      >
        <div className="text-xs font-semibold text-foreground">{p.label}</div>
      </div>

      {/* Arrow P→M */}
      <div className="h-3 w-px bg-border" />

      {/* M box */}
      <div
        className={`rounded-lg border-2 px-3 py-2 text-center min-w-[80px] transition-all duration-300 ${
          isMHighlighted
            ? "border-accent bg-accent/10 scale-105"
            : m
              ? "border-border bg-background"
              : "border-dashed border-border/50 bg-muted/30"
        }`}
      >
        <div className="text-xs font-semibold text-foreground">
          {m ? m.label : "—"}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {m ? "OS Thread" : "detached"}
        </div>
      </div>

      {/* Running G */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-[10px] text-muted-foreground">Running</div>
        <div className="h-9 w-9 flex items-center justify-center">
          {runningG ? (
            <GBadge g={runningG} highlight={highlight} />
          ) : (
            <div className="h-9 w-9 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center text-[10px] text-muted-foreground">
              —
            </div>
          )}
        </div>
      </div>

      {/* Local queue */}
      <div className="mt-1 flex flex-col items-center gap-1">
        <div className="text-[10px] text-muted-foreground">Local Queue</div>
        <div className="flex gap-1 min-h-[28px] items-center">
          {localQueue.length > 0 ? (
            localQueue.map((g) => (
              <GBadge key={g.id} g={g} highlight={highlight} small />
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/50">empty</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

type GoRoutineVisualizerProps = {
  locale?: string;
};

export function GoRoutineVisualizer({
  locale = "ja",
}: GoRoutineVisualizerProps) {
  const scenario = buildScenario();
  const isEn = locale === "en";

  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 1500,
  });

  const state = scenario[player.step];

  const getLabel = useCallback(
    (step: number) => {
      const s = scenario[step];
      return isEn ? s.descriptionEn : s.description;
    },
    [scenario, isEn],
  );

  return (
    <InteractiveDemo
      title={
        isEn
          ? "Go Scheduler: G, M, P in Action"
          : "Go スケジューラ: G・M・P の動き"
      }
      description={
        isEn
          ? "Step through how Go's runtime scheduler maps goroutines (G) onto OS threads (M) via processors (P)."
          : "Go ランタイムスケジューラが Goroutine (G) を OS スレッド (M) に Processor (P) 経由でマッピングする様子をステップ実行で見てみましょう。"
      }
    >
      {/* Visualization */}
      <div className="flex flex-col gap-6">
        {/* Processor columns */}
        <div className="flex justify-center gap-8 flex-wrap">
          {state.ps.map((pState) => (
            <ProcessorSlot
              key={pState.p.id}
              pState={pState}
              localQueue={state.localQueues.get(pState.p.id) ?? []}
              highlight={state.highlight}
            />
          ))}
        </div>

        {/* Global queue */}
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">
            Global Run Queue
          </div>
          <div className="flex gap-1 justify-center min-h-[28px] items-center">
            {state.globalQueue.length > 0 ? (
              state.globalQueue.map((g) => (
                <GBadge
                  key={g.id}
                  g={g}
                  highlight={state.highlight}
                  small
                />
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground/50">
                empty
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground min-h-[3rem] flex items-center">
          {isEn ? state.descriptionEn : state.description}
        </div>

        {/* Controls */}
        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
