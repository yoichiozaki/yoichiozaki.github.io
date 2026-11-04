"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
        "go func() により runtime.newproc() が呼ばれ、G1 の goroutine 構造体（runtime.g）が生成されます。G1 は 2KB 以上の初期スタックを割り当てられ、P1 の runnext スロットに置かれます。",
      descriptionEn:
        "go func() calls runtime.newproc(), which allocates a runtime.g struct for G1 with an initial stack of 2 KB or more. G1 is placed in P1's runnext slot.",
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
        "schedule() → findRunnable() checks P1's runnext and gets G1. execute(G1) restores G1's gobuf (PC/SP) and starts running user code on M1.",
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
        "G1 内で go func() が 2 回呼ばれ G2, G3 が生成。runqput() は新しい G を P1 の runnext に入れ、それまで runnext にいた G をローカルキュー（256 エントリーのリングバッファー）の末尾へ押し出します。G2 はキューに、G3 は runnext に入ります（図では runnext をキューの末尾に表示）。",
      descriptionEn:
        "G1 calls go func() twice, spawning G2 and G3. runqput() puts each new G in P1's runnext and pushes the previous runnext G to the tail of the local queue (a 256-entry ring buffer), so G2 ends up in the queue and G3 in runnext (drawn at the end of the queue).",
      highlight: "G2",
    },
    // Step 4: Work stealing — P2 runs findRunnable → steals
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: g2 },
      ],
      localQueues: new Map([
        [1, [g3]],
        [2, []],
      ]),
      globalQueue: [],
      description:
        "P2 の findRunnable(): ① runnext → 空 ② ローカルキュー → 空 ③ グローバルキュー → 空 ④ netpoll → なし ⑤ 他の P から steal。runqsteal() は P1 のキューの先頭から半分（ここでは G2 の 1 個）をアトミックに盗みます。runnext の G3 は P1 に残ります。",
      descriptionEn:
        "P2's findRunnable(): ① runnext → empty ② local queue → empty ③ global queue → empty ④ netpoll → none ⑤ steal from another P. runqsteal() atomically takes half of P1's queue from its head (here, just G2); G3 stays in P1's runnext.",
      highlight: "P2",
    },
    // Step 5: Overflow → global queue (runqputslow)
    {
      ps: [
        { p: p1, m: m1, runningG: g1 },
        { p: p2, m: m2, runningG: g2 },
      ],
      localQueues: new Map([
        [1, [g3]],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "さらに G4〜G6 が生成されます。ここでは P1 のローカルキューが満杯だったとします（図では省略）。満杯のキューに G を追加しようとすると、runqputslow() がキューの半分とその G をまとめてグローバルキュー（mutex で保護されたリンクリスト）へ移します。図では簡略化して、G4〜G6 がグローバルキューに入ったものとして描いています。",
      descriptionEn:
        "G4–G6 are spawned. Here P1's local queue is assumed to be full (not drawn), so adding a G calls runqputslow(), which moves half of the queue plus that G to the global queue (a mutex-protected linked list) in one batch. For simplicity, the figure shows G4–G6 landing in the global queue.",
      highlight: "G4",
    },
    // Step 6: G1 completes → goexit → mcall(schedule)
    {
      ps: [
        { p: p1, m: m1, runningG: g3 },
        { p: p2, m: m2, runningG: g2 },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "G1 が return すると runtime.goexit() が呼ばれ、mcall(goexit0) で g0 スタックに切り替わります。G1 は _Gdead になって構造体が gFree リストに戻され、schedule() が次の G3 を実行します。",
      descriptionEn:
        "G1 returns → runtime.goexit() runs, and mcall(goexit0) switches to the g0 stack. G1 becomes _Gdead, its g struct goes back to the gFree list, and schedule() runs G3 next.",
      highlight: "P1",
    },
    // Step 7: Syscall → entersyscall → hand-off
    {
      ps: [
        { p: p1, m: m1, runningG: g3 },
        { p: p2, m: null, runningG: null },
      ],
      localQueues: new Map([
        [1, []],
        [2, []],
      ]),
      globalQueue: [g4, g5, g6],
      description:
        "G2 がシステムコール（read(2) など）に入り、runtime.entersyscall() で G2 は _Gsyscall になります。sysmon は 20μs 以上続いている syscall を検知し、handoffp() で P2 を M2 から切り離します。",
      descriptionEn:
        "G2 enters a syscall (e.g., read(2)), and runtime.entersyscall() sets G2 to _Gsyscall. sysmon finds that the syscall has lasted 20 μs or more and calls handoffp() to detach P2 from M2.",
      highlight: "M2",
    },
    // Step 8: P2 gets M3, fetches from global queue
    {
      ps: [
        { p: p1, m: m1, runningG: g3 },
        { p: p2, m: m3, runningG: g4 },
      ],
      localQueues: new Map([
        [1, []],
        [2, [g5]],
      ]),
      globalQueue: [g6],
      description:
        "handoffp() が startm() を呼び、アイドル M がないので新しい M3 を起動します。P2 が M3 に紐付き、findRunnable() がグローバルキューから 2 個（min(3/2+1, 3, 128)）をまとめて取ります。G4 を実行し、G5 を P2 のローカルキューに入れます。",
      descriptionEn:
        "handoffp() calls startm(), which starts a new M3 because no idle M is available. P2 binds to M3, and findRunnable() takes two G's from the global queue in one batch (min(3/2+1, 3, 128)): it runs G4 and puts G5 in P2's local queue.",
      highlight: "M3",
    },
    // Step 9: Preemption — sysmon detects long-running G3
    {
      ps: [
        { p: p1, m: m1, runningG: g3 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g7]],
        [2, []],
      ]),
      globalQueue: [g6],
      description:
        "G3 が 10ms 以上実行を続けています。sysmon の retake() が検知し、G3 の stackguard0 に stackPreempt を設定。次の関数プロローグで G3 はプリエンプトされます（協調的プリエンプション）。Go 1.14 以降は、シグナル（Unix 系では SIGURG）による非同期プリエンプションも可能です。",
      descriptionEn:
        "G3 has been running for more than 10 ms. sysmon's retake() detects this and sets G3's stackguard0 to stackPreempt, so G3 is preempted at its next function prologue (cooperative preemption). Since Go 1.14, a signal (SIGURG on Unix-like platforms) can also preempt it asynchronously.",
      highlight: "G3",
    },
    // Step 10: G3 preempted → back to local queue
    {
      ps: [
        { p: p1, m: m1, runningG: g7 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g3]],
        [2, []],
      ]),
      globalQueue: [g6],
      description:
        "G3 がプリエンプトされ、PC/SP/BP が gobuf に保存されます。G3 は _Grunnable に戻ってグローバルキューに入ります（図では簡略化して P1 のキューに表示）。schedule() が G7 を選択して実行。公平性のため、61 回に 1 回はグローバルキューが優先されます。",
      descriptionEn:
        "G3 is preempted: its PC/SP/BP are saved in gobuf, and it becomes _Grunnable and goes to the global queue (drawn in P1's queue for simplicity). schedule() picks G7 next. For fairness, the global queue is checked every 61 schedule cycles.",
      highlight: "G7",
    },
    // Step 11: Netpoller — G2 syscall completes
    {
      ps: [
        { p: p1, m: m1, runningG: g7 },
        { p: p2, m: m3, runningG: g5 },
      ],
      localQueues: new Map([
        [1, [g3]],
        [2, [g2]],
      ]),
      globalQueue: [g6],
      description:
        "M2 上でブロックしていた G2 のシステムコールが完了し、runtime.exitsyscall() で G2 は _Grunnable に戻ります。P2 は M3 に渡っていて空いている P もないので、G2 はグローバルキューに入ります（図では簡略化して P2 のキューに表示）。",
      descriptionEn:
        "G2's syscall on M2 completes, and runtime.exitsyscall() sets G2 back to _Grunnable. P2 is now on M3 and no P is idle, so G2 goes to the global queue (drawn in P2's queue for simplicity).",
      highlight: "G2",
    },
    // Step 12: All goroutines draining
    {
      ps: [
        { p: p1, m: m1, runningG: g3 },
        { p: p2, m: m3, runningG: g6 },
      ],
      localQueues: new Map([
        [1, []],
        [2, [g2]],
      ]),
      globalQueue: [],
      description:
        "G7, G5 が完了。P1 は G3 の実行を再開（gobuf から復元）、P2 はグローバルキューから G6 を取得。schedule() ループは「findRunnable → execute → goexit/preempt → schedule」を G がなくなるまで繰り返します。",
      descriptionEn:
        "G7, G5 complete. P1 resumes G3 (restored from gobuf), P2 fetches G6 from the global queue. The schedule() loop repeats 'findRunnable → execute → goexit/preempt → schedule' until all G's are done.",
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
        "全ての goroutine が完了。findRunnable() で実行可能な G が見つからない M は stopm() でパークし、futex/semaphore で待機します。M2 は syscall から復帰後にアイドルリストに戻されます。P も pidle リストに戻ります。",
      descriptionEn:
        "All goroutines done. M's that can't find runnable G's call stopm() and park on a futex/semaphore. M2 returns to the idle list after its syscall. P's return to the pidle list.",
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
  isEn,
}: {
  pState: SchedulerState["ps"][0];
  localQueue: G[];
  highlight?: string;
  isEn: boolean;
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
          {m ? (isEn ? "OS thread" : "OS スレッド") : isEn ? "detached" : "切り離し中"}
        </div>
      </div>

      {/* Running G */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-[10px] text-muted-foreground">{isEn ? "Running" : "実行中"}</div>
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
        <div className="text-[10px] text-muted-foreground">{isEn ? "Local queue" : "ローカルキュー"}</div>
        <div className="flex gap-1 min-h-[28px] items-center">
          {localQueue.length > 0 ? (
            localQueue.map((g) => (
              <GBadge key={g.id} g={g} highlight={highlight} small />
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground/50">{isEn ? "empty" : "空"}</span>
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

  const getLabel = (step: number) => {
    const s = scenario[step];
    return isEn ? s.descriptionEn : s.description;
  };

  return (
    <InteractiveDemo
      title={
        isEn
          ? "Go Scheduler: G, M, P in Action"
          : "Go スケジューラー: G・M・P の動き"
      }
      description={
        isEn
          ? "Step through how Go's runtime scheduler maps goroutines (G) onto OS threads (M) via processors (P)."
          : "Go のランタイムスケジューラーが goroutine（G）を P（Processor）経由で OS スレッド（M）に割り当てて実行する流れを、1 ステップずつ確認できます。"
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
              isEn={isEn}
            />
          ))}
        </div>

        {/* Global queue */}
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 text-center">
            {isEn ? "Global run queue" : "グローバルキュー"}
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
                {isEn ? "empty" : "空"}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground min-h-[3rem] flex items-center">
          {isEn ? state.descriptionEn : state.description}
        </div>

        {/* Controls */}
        <StepPlayerControls {...player} label={getLabel} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
