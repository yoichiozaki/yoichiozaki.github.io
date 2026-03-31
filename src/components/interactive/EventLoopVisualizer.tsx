"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type EventLoopVisualizerProps = { locale?: string };

/* ── Types ─────────────────────────────────────── */

type TaskItem = {
  id: string;
  label: string;
  type: "sync" | "microtask" | "macrotask" | "running" | "done";
};

type LoopState = {
  callStack: TaskItem[];
  microtaskQueue: TaskItem[];
  macrotaskQueue: TaskItem[];
  webApi: TaskItem[];
  log: string[];
  description: { ja: string; en: string };
  phase: "stack" | "microtask" | "macrotask" | "webapi" | "idle";
};

/* ── Step data ─────────────────────────────────── */

const steps: LoopState[] = [
  // Step 0: initial script
  {
    callStack: [{ id: "main", label: "main()", type: "running" }],
    microtaskQueue: [],
    macrotaskQueue: [],
    webApi: [],
    log: [],
    phase: "stack",
    description: {
      ja: "スクリプトの実行開始。main() がコールスタックにプッシュされます。",
      en: "Script execution begins. main() is pushed onto the call stack.",
    },
  },
  // Step 1: console.log("1")
  {
    callStack: [
      { id: "main", label: "main()", type: "sync" },
      { id: "log1", label: 'console.log("1")', type: "running" },
    ],
    microtaskQueue: [],
    macrotaskQueue: [],
    webApi: [],
    log: ["1"],
    phase: "stack",
    description: {
      ja: 'console.log("1") を実行 → 同期処理なので即座に出力されます。',
      en: 'Execute console.log("1") → synchronous, outputs immediately.',
    },
  },
  // Step 2: setTimeout callback registered
  {
    callStack: [
      { id: "main", label: "main()", type: "sync" },
      { id: "timeout", label: "setTimeout(cb, 0)", type: "running" },
    ],
    microtaskQueue: [],
    macrotaskQueue: [],
    webApi: [{ id: "timer", label: "Timer (0ms)", type: "macrotask" }],
    log: ["1"],
    phase: "webapi",
    description: {
      ja: "setTimeout(cb, 0) を呼び出し。コールバックはWeb APIのタイマーに登録され、0ms後にマクロタスクキューに入ります。",
      en: "Call setTimeout(cb, 0). The callback is registered with the Web API timer and will be added to the macrotask queue after 0ms.",
    },
  },
  // Step 3: Promise.resolve().then(cb2) 
  {
    callStack: [
      { id: "main", label: "main()", type: "sync" },
      { id: "promise", label: "Promise.resolve().then(cb2)", type: "running" },
    ],
    microtaskQueue: [{ id: "micro1", label: 'cb2: log("3")', type: "microtask" }],
    macrotaskQueue: [],
    webApi: [{ id: "timer", label: "Timer (0ms)", type: "macrotask" }],
    log: ["1"],
    phase: "stack",
    description: {
      ja: "Promise.resolve().then(cb2) を実行。既に解決済みのPromiseなので、cb2 は即座にマイクロタスクキューに入ります。",
      en: "Execute Promise.resolve().then(cb2). The Promise is already resolved, so cb2 is immediately enqueued in the microtask queue.",
    },
  },
  // Step 4: console.log("2")
  {
    callStack: [
      { id: "main", label: "main()", type: "sync" },
      { id: "log2", label: 'console.log("2")', type: "running" },
    ],
    microtaskQueue: [{ id: "micro1", label: 'cb2: log("3")', type: "microtask" }],
    macrotaskQueue: [{ id: "macro1", label: 'cb: log("4")', type: "macrotask" }],
    webApi: [],
    log: ["1", "2"],
    phase: "stack",
    description: {
      ja: 'console.log("2") を実行 → 出力。タイマーが完了し、コールバックがマクロタスクキューに移動しました。',
      en: 'Execute console.log("2") → outputs. The timer has completed and the callback moved to the macrotask queue.',
    },
  },
  // Step 5: main() completes, stack empty → microtask check
  {
    callStack: [],
    microtaskQueue: [{ id: "micro1", label: 'cb2: log("3")', type: "microtask" }],
    macrotaskQueue: [{ id: "macro1", label: 'cb: log("4")', type: "macrotask" }],
    webApi: [],
    log: ["1", "2"],
    phase: "microtask",
    description: {
      ja: "main() が完了し、コールスタックが空に。イベントループはまずマイクロタスクキューをチェックします。",
      en: "main() completes, call stack is empty. The event loop checks the microtask queue first.",
    },
  },
  // Step 6: execute microtask
  {
    callStack: [{ id: "micro1", label: 'cb2: log("3")', type: "running" }],
    microtaskQueue: [],
    macrotaskQueue: [{ id: "macro1", label: 'cb: log("4")', type: "macrotask" }],
    webApi: [],
    log: ["1", "2", "3"],
    phase: "microtask",
    description: {
      ja: 'マイクロタスク cb2 を実行 → "3" を出力。マイクロタスクキューが空になるまで全て実行します。',
      en: 'Execute microtask cb2 → outputs "3". All microtasks run until the queue is empty.',
    },
  },
  // Step 7: microtask done, pick macrotask
  {
    callStack: [],
    microtaskQueue: [],
    macrotaskQueue: [{ id: "macro1", label: 'cb: log("4")', type: "macrotask" }],
    webApi: [],
    log: ["1", "2", "3"],
    phase: "macrotask",
    description: {
      ja: "マイクロタスクキューが空になりました。次にマクロタスクキューから1つ取り出します。",
      en: "Microtask queue is empty. Now pick one task from the macrotask queue.",
    },
  },
  // Step 8: execute macrotask
  {
    callStack: [{ id: "macro1", label: 'cb: log("4")', type: "running" }],
    microtaskQueue: [],
    macrotaskQueue: [],
    webApi: [],
    log: ["1", "2", "3", "4"],
    phase: "macrotask",
    description: {
      ja: 'マクロタスク cb を実行 → "4" を出力。最終的な出力順: 1, 2, 3, 4。',
      en: 'Execute macrotask cb → outputs "4". Final output order: 1, 2, 3, 4.',
    },
  },
  // Step 9: idle
  {
    callStack: [],
    microtaskQueue: [],
    macrotaskQueue: [],
    webApi: [],
    log: ["1", "2", "3", "4"],
    phase: "idle",
    description: {
      ja: "すべてのタスクが完了。イベントループは次のイベントを待機します。重要: マイクロタスク（Promise）はマクロタスク（setTimeout）より常に先に実行されます。",
      en: "All tasks complete. The event loop waits for the next event. Key insight: microtasks (Promise) always run before macrotasks (setTimeout).",
    },
  },
];

/* ── Colors ────────────────────────────────────── */

function queueBg(type: string, dark: boolean): string {
  switch (type) {
    case "running":
      return dark ? "#065f46" : "#d1fae5";
    case "sync":
      return dark ? "#1e3a5f" : "#dbeafe";
    case "microtask":
      return dark ? "#4c1d95" : "#ede9fe";
    case "macrotask":
      return dark ? "#78350f" : "#fef3c7";
    default:
      return dark ? "#262626" : "#f5f5f5";
  }
}

function queueBorder(type: string, dark: boolean): string {
  switch (type) {
    case "running":
      return dark ? "#10b981" : "#059669";
    case "sync":
      return dark ? "#3b82f6" : "#2563eb";
    case "microtask":
      return dark ? "#8b5cf6" : "#7c3aed";
    case "macrotask":
      return dark ? "#f59e0b" : "#d97706";
    default:
      return dark ? "#404040" : "#d4d4d4";
  }
}

/* ── Queue column ──────────────────────────────── */

function QueueColumn({
  title,
  items,
  dark,
  color,
  active,
}: {
  title: string;
  items: TaskItem[];
  dark: boolean;
  color: string;
  active: boolean;
}) {
  const borderColor = dark ? "#404040" : "#d4d4d4";
  const textColor = dark ? "#e5e5e5" : "#171717";
  const mutedColor = dark ? "#a3a3a3" : "#737373";

  return (
    <div
      className={`flex flex-col rounded-lg border p-2 min-h-[100px] transition-colors ${
        active
          ? dark
            ? "border-accent bg-accent/5"
            : "border-accent bg-accent/5"
          : dark
            ? "border-neutral-700 bg-neutral-900"
            : "border-neutral-200 bg-neutral-50"
      }`}
    >
      <div
        className="mb-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        {items.length === 0 ? (
          <div className="text-xs italic" style={{ color: mutedColor }}>
            (empty)
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded px-2 py-1 text-xs font-mono transition-colors"
              style={{
                backgroundColor: queueBg(item.type, dark),
                border: `1px solid ${queueBorder(item.type, dark)}`,
                color: textColor,
              }}
            >
              {item.label}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────── */

export function EventLoopVisualizer({ locale = "ja" }: EventLoopVisualizerProps) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1500 });
  const state = steps[player.step];

  // Simple dark mode detection via CSS class
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  const green = isDark ? "#10b981" : "#059669";
  const purple = isDark ? "#8b5cf6" : "#7c3aed";
  const amber = isDark ? "#f59e0b" : "#d97706";
  const blue = isDark ? "#3b82f6" : "#2563eb";

  return (
    <InteractiveDemo
      title={locale === "en" ? "JavaScript Event Loop" : "JavaScriptイベントループ"}
      description={
        locale === "en"
          ? "Step through: console.log('1'), setTimeout(cb,0), Promise.resolve().then(cb2), console.log('2')"
          : "実行例: console.log('1'), setTimeout(cb,0), Promise.resolve().then(cb2), console.log('2')"
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QueueColumn
          title={locale === "en" ? "Call Stack" : "コールスタック"}
          items={state.callStack}
          dark={isDark}
          color={green}
          active={state.phase === "stack"}
        />
        <QueueColumn
          title={locale === "en" ? "Web APIs" : "Web API"}
          items={state.webApi}
          dark={isDark}
          color={blue}
          active={state.phase === "webapi"}
        />
        <QueueColumn
          title={locale === "en" ? "Microtask Q" : "マイクロタスクQ"}
          items={state.microtaskQueue}
          dark={isDark}
          color={purple}
          active={state.phase === "microtask"}
        />
        <QueueColumn
          title={locale === "en" ? "Macrotask Q" : "マクロタスクQ"}
          items={state.macrotaskQueue}
          dark={isDark}
          color={amber}
          active={state.phase === "macrotask"}
        />
      </div>

      {/* Console output */}
      <div className="mt-3 rounded-lg bg-neutral-900 dark:bg-neutral-950 p-3 font-mono text-sm text-green-400">
        <div className="text-xs text-neutral-500 mb-1">Console:</div>
        {state.log.length === 0 ? (
          <span className="text-neutral-600">// waiting...</span>
        ) : (
          state.log.map((line, i) => (
            <div key={i}>
              <span className="text-neutral-500">{">"} </span>
              {line}
            </div>
          ))
        )}
      </div>

      {/* Step description */}
      <div className="mt-3 min-h-[3rem] rounded-lg bg-muted/70 px-4 py-2 text-sm text-foreground">
        {locale === "en" ? state.description.en : state.description.ja}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: green }} />
          {locale === "en" ? "Running" : "実行中"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: purple }} />
          {locale === "en" ? "Microtask" : "マイクロタスク"}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: amber }} />
          {locale === "en" ? "Macrotask" : "マクロタスク"}
        </span>
      </div>

      <StepPlayerControls {...player} />
    </InteractiveDemo>
  );
}
