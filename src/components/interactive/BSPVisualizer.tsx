"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type ExecutorState = {
  id: string;
  label: string;
  color: string;
  status: "idle" | "computing" | "sending" | "waiting";
  inbox: string[];
  outbox: string[];
};

type StateEntry = {
  key: string;
  value: string;
  pending?: string; // queued update not yet applied
};

type BSPStep = {
  phase: "init" | "compute" | "send" | "barrier" | "deliver" | "done";
  phaseLabel: string;
  phaseLabelEn: string;
  executors: ExecutorState[];
  stateEntries: StateEntry[];
  description: string;
  descriptionEn: string;
  superstepNumber: number;
  checkpoint?: boolean;
};

// ── Scenario: Concurrent Translation ────────────────────────

function buildScenario(): BSPStep[] {
  return [
    // Step 0: Initial state
    {
      phase: "init",
      phaseLabel: "初期状態",
      phaseLabelEn: "Initial State",
      superstepNumber: 0,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: ["Hello!"], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "ワークフロー開始前です。StepContext の Input 宛てのキューに「Hello!」が入っています。AdvanceAsync() が _nextStep をアトミックにスワップすると、スーパーステップ 1 が始まります。",
      descriptionEn: "Before the workflow starts, 'Hello!' waits in the StepContext queue for Input. When AdvanceAsync() atomically swaps _nextStep, superstep 1 begins.",
    },
    // Step 1: Superstep 1 — Compute (Input processes)
    {
      phase: "compute",
      phaseLabel: "フェーズ 1: ローカル計算",
      phaseLabelEn: "Phase 1: Local Computation",
      superstepNumber: 1,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "computing", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "スーパーステップ 1: Input Executor が [MessageHandler] でメッセージを処理しています。Task.WhenAll は同じスーパーステップのアクティブな Executor を並行に実行します（ここでは Input だけ）。",
      descriptionEn: "Superstep 1: Input Executor processes the message via [MessageHandler]. Task.WhenAll runs active Executors in the same superstep concurrently (only Input is active here).",
    },
    // Step 2: Superstep 1 — Send (Input sends to French & Spanish via Fan-out Edge)
    {
      phase: "send",
      phaseLabel: "フェーズ 2: メッセージ送信",
      phaseLabelEn: "Phase 2: Message Sending",
      superstepNumber: 1,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "sending", inbox: [], outbox: ["Hello!", "Hello!"] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "Input が context.SendMessageAsync() を呼ぶと、Fan-out Edge が French 宛てと Spanish 宛てのメッセージを _nextStep（次のスーパーステップ用の StepContext）に入れます。French と Spanish がこれを受け取るのは次のスーパーステップです。",
      descriptionEn: "Input calls context.SendMessageAsync(), and the Fan-out Edge enqueues the message for both French and Spanish in _nextStep (the StepContext for the next superstep). French and Spanish receive it in the next superstep.",
    },
    // Step 3: Superstep 1 — Barrier
    {
      phase: "barrier",
      phaseLabel: "フェーズ 3: バリア同期",
      phaseLabelEn: "Phase 3: Barrier Synchronization",
      superstepNumber: 1,
      checkpoint: true,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "waiting", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "waiting", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "waiting", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "waiting", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "バリア同期: 全 Executor が完了すると、StateManager.PublishUpdatesAsync() がキューされたステート更新をまとめて適用します（今回は更新なし）。チェックポイントが有効なら、ここで作成されます。最後に SuperStepCompletedEvent が発火します。",
      descriptionEn: "Barrier sync: Once all Executors are done, StateManager.PublishUpdatesAsync() batch-applies queued state updates (no state changes this superstep). If checkpointing is enabled, a checkpoint is created here. Then SuperStepCompletedEvent fires.",
    },
    // Step 4: Deliver messages for Superstep 2
    {
      phase: "deliver",
      phaseLabel: "メッセージ配信",
      phaseLabelEn: "Message Delivery",
      superstepNumber: 2,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: ["Hello!"], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: ["Hello!"], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "AdvanceAsync() が _nextStep をスワップし、前のスーパーステップでキューされたメッセージが French と Spanish に届きます。スワップは Interlocked.Exchange(ref _nextStep, new StepContext()) によるアトミックな操作です。",
      descriptionEn: "AdvanceAsync() swaps _nextStep. Messages queued in the previous superstep are delivered to French and Spanish inboxes. Interlocked.Exchange(ref _nextStep, new StepContext()) performs the atomic swap.",
    },
    // Step 5: Superstep 2 — Compute (French & Spanish in parallel)
    {
      phase: "compute",
      phaseLabel: "フェーズ 1: ローカル計算（並行）",
      phaseLabelEn: "Phase 1: Local Computation (Parallel)",
      superstepNumber: 2,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "computing", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "computing", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]" },
      ],
      description: "スーパーステップ 2: Task.WhenAll が French と Spanish を並行に実行します。Fan-out で複数のエージェントが同時に動くのは、この並行実行によるものです。各 Executor の [MessageHandler] が LLM を呼び出し、翻訳を生成します。",
      descriptionEn: "Superstep 2: Task.WhenAll runs French and Spanish in parallel, which is why the agents in a Fan-out run simultaneously. Each Executor's [MessageHandler] calls the LLM to generate its translation.",
    },
    // Step 6: Superstep 2 — Send (both send results)
    {
      phase: "send",
      phaseLabel: "フェーズ 2: メッセージ送信",
      phaseLabelEn: "Phase 2: Message Sending",
      superstepNumber: 2,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "sending", inbox: [], outbox: ["Bonjour!"] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "sending", inbox: [], outbox: ["¡Hola!"] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[]", pending: "[\"Bonjour!\",\"¡Hola!\"]" },
      ],
      description: "French が「Bonjour!」、Spanish が「¡Hola!」を出力し、それぞれ QueueStateUpdateAsync() でステート更新をキューします。Fan-in Barrier Edge は、すべてのソースから少なくとも 1 つずつメッセージが届くまで、Aggregator への配信を保留します。",
      descriptionEn: "French outputs 'Bonjour!' and Spanish outputs '¡Hola!'. Each Executor queues state updates via QueueStateUpdateAsync(). The Fan-in Barrier Edge holds delivery to the Aggregator until every source has sent at least one message.",
    },
    // Step 7: Superstep 2 — Barrier
    {
      phase: "barrier",
      phaseLabel: "フェーズ 3: バリア同期",
      phaseLabelEn: "Phase 3: Barrier Synchronization",
      superstepNumber: 2,
      checkpoint: true,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "waiting", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "waiting", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "waiting", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "waiting", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[\"Bonjour!\",\"¡Hola!\"]" },
      ],
      description: "バリア同期: PublishUpdatesAsync() が pending のステート更新をまとめて適用し、translations は空配列から [\"Bonjour!\",\"¡Hola!\"] になります。Fan-in Barrier の条件が満たされたので、Aggregator へのメッセージは次のスーパーステップで配信されます。",
      descriptionEn: "Barrier sync: PublishUpdatesAsync() batch-applies the pending state updates, and translations changes from an empty array to [\"Bonjour!\",\"¡Hola!\"]. The Fan-in Barrier condition is met, so the messages reach the Aggregator in the next superstep.",
    },
    // Step 8: Deliver to Aggregator
    {
      phase: "deliver",
      phaseLabel: "メッセージ配信",
      phaseLabelEn: "Message Delivery",
      superstepNumber: 3,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: ["Bonjour!", "¡Hola!"], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[\"Bonjour!\",\"¡Hola!\"]" },
      ],
      description: "Fan-in Barrier Edge が保留していた French と Spanish のメッセージが、まとめて Aggregator に届きます。",
      descriptionEn: "The Fan-in Barrier Edge releases the held messages: both the French and Spanish messages are delivered to the Aggregator's inbox.",
    },
    // Step 9: Superstep 3 — Aggregator computes
    {
      phase: "compute",
      phaseLabel: "フェーズ 1: ローカル計算",
      phaseLabelEn: "Phase 1: Local Computation",
      superstepNumber: 3,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "computing", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[\"Bonjour!\",\"¡Hola!\"]" },
      ],
      description: "スーパーステップ 3: Aggregator が 2 つの翻訳結果を集約し、YieldOutputAsync() で出力します。これにより WorkflowOutputEvent が Event Queue（ConcurrentEventSink）に流れます。",
      descriptionEn: "Superstep 3: The Aggregator combines both translation results and outputs them with YieldOutputAsync(), which raises a WorkflowOutputEvent in the Event Queue (ConcurrentEventSink).",
    },
    // Step 10: Done
    {
      phase: "done",
      phaseLabel: "ワークフロー完了",
      phaseLabelEn: "Workflow Complete",
      superstepNumber: 3,
      executors: [
        { id: "input", label: "Input", color: "#6366f1", status: "idle", inbox: [], outbox: [] },
        { id: "fr", label: "French", color: "#3b82f6", status: "idle", inbox: [], outbox: [] },
        { id: "es", label: "Spanish", color: "#f59e0b", status: "idle", inbox: [], outbox: [] },
        { id: "agg", label: "Aggregator", color: "#10b981", status: "idle", inbox: [], outbox: [] },
      ],
      stateEntries: [
        { key: "translations", value: "[\"Bonjour!\",\"¡Hola!\"]" },
      ],
      description: "全 Executor 宛てのキューが空になりました。配送待ちのメッセージがなく、外部入力も待っていないので、ワークフローは完了します。Fan-out → 並行計算 → Fan-in → 集約の一巡を、3 スーパーステップで実行しました。",
      descriptionEn: "All Executor queues are empty. No messages remain to be delivered and the workflow is not waiting for external input, so it completes. The full Fan-out → parallel computation → Fan-in → aggregation cycle took 3 supersteps.",
    },
  ];
}

// ── Rendering ───────────────────────────────────────────────

const STATUS_COLORS: Record<ExecutorState["status"], { bg: string; border: string; text: string }> = {
  idle: { bg: "var(--color-muted)", border: "var(--color-border)", text: "var(--color-muted-foreground)" },
  computing: { bg: "#3b82f620", border: "#3b82f6", text: "#3b82f6" },
  sending: { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b" },
  waiting: { bg: "#8b5cf620", border: "#8b5cf6", text: "#8b5cf6" },
};

const STATUS_LABELS: Record<ExecutorState["status"], { ja: string; en: string }> = {
  idle: { ja: "待機", en: "Idle" },
  computing: { ja: "計算中", en: "Computing" },
  sending: { ja: "送信中", en: "Sending" },
  waiting: { ja: "同期待ち", en: "Waiting" },
};

function ExecutorCard({ executor, locale }: { executor: ExecutorState; locale: string }) {
  const isJa = locale === "ja";
  const sc = STATUS_COLORS[executor.status];
  const sl = STATUS_LABELS[executor.status];

  return (
    <div
      className="rounded-lg border-2 p-3 transition-all duration-300 min-w-[120px]"
      style={{ borderColor: executor.status !== "idle" ? sc.border : "var(--color-border)", background: sc.bg }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-sm font-bold" style={{ color: executor.color }}>{executor.label}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: sc.border + "30", color: sc.text }}
        >
          {isJa ? sl.ja : sl.en}
        </span>
      </div>

      {/* Inbox */}
      <div className="mt-1.5">
        <div className="text-[10px] text-muted-foreground mb-0.5">
          📥 {isJa ? "受信" : "Inbox"}
        </div>
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {executor.inbox.map((msg, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono">
              {msg}
            </span>
          ))}
          {executor.inbox.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50">—</span>
          )}
        </div>
      </div>

      {/* Outbox */}
      <div className="mt-1">
        <div className="text-[10px] text-muted-foreground mb-0.5">
          📤 {isJa ? "送信" : "Outbox"}
        </div>
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {executor.outbox.map((msg, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono">
              {msg}
            </span>
          ))}
          {executor.outbox.length === 0 && (
            <span className="text-[10px] text-muted-foreground/50">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

function StatePanel({ entries, locale }: { entries: StateEntry[]; locale: string }) {
  const isJa = locale === "ja";
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        🗄️ {isJa ? "共有ステート（StateManager）" : "Shared State (StateManager)"}
      </div>
      <div className="space-y-1">
        {entries.map((entry) => (
          <div key={entry.key} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{entry.key}:</span>
            <span className="font-mono text-foreground">{entry.value}</span>
            {entry.pending && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400">
                ⏳ pending: {entry.pending}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseIndicator({ step, locale }: { step: BSPStep; locale: string }) {
  const isJa = locale === "ja";
  const phases = [
    { key: "compute", label: isJa ? "計算" : "Compute", icon: "⚙️" },
    { key: "send", label: isJa ? "送信" : "Send", icon: "📨" },
    { key: "barrier", label: isJa ? "同期" : "Barrier", icon: "🔒" },
  ];

  return (
    <div className="flex items-center gap-1 mb-3">
      <div className="text-xs font-semibold text-muted-foreground mr-2">
        {isJa ? `SS ${step.superstepNumber}` : `SS ${step.superstepNumber}`}
      </div>
      {phases.map((p, i) => {
        const isActive = step.phase === p.key;
        const isPast = step.phase === "barrier" && p.key !== "barrier"
          || step.phase === "send" && p.key === "compute";
        return (
          <div key={p.key} className="flex items-center">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                isActive
                  ? "bg-accent text-white"
                  : isPast
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </div>
            {i < phases.length - 1 && (
              <span className="mx-0.5 text-muted-foreground">→</span>
            )}
          </div>
        );
      })}
      {step.checkpoint && (
        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 font-medium">
          💾 {isJa ? "チェックポイント" : "Checkpoint"}
        </span>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────

type BSPVisualizerProps = { locale?: string };

export function BSPVisualizer({ locale = "ja" }: BSPVisualizerProps) {
  const isJa = locale === "ja";
  const steps = buildScenario();

  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: 2500,
  });
  const current = steps[player.step];

  const getStepLabel = useCallback(
    (step: number) => {
      const s = steps[step];
      return isJa ? s.phaseLabel : s.phaseLabelEn;
    },
    [isJa, steps]
  );

  return (
    <InteractiveDemo
      title={isJa ? "BSP スーパーステップ実行シミュレーター" : "BSP Superstep Execution Simulator"}
      description={
        isJa
          ? "2 言語に翻訳する Concurrent ワークフローで、スーパーステップ（SS）ごとに各 Executor の受信・送信メッセージと共有ステートがどう変わるかを示します"
          : "How each Executor's inbox and outbox and the shared state change in each superstep (SS) of a Concurrent workflow that translates into two languages"
      }
    >
      {/* Phase indicator */}
      {current.phase !== "init" && current.phase !== "done" && current.phase !== "deliver" && (
        <PhaseIndicator step={current} locale={locale} />
      )}
      {(current.phase === "init" || current.phase === "done" || current.phase === "deliver") && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground">
            {current.phase === "init" ? (isJa ? "開始前" : "Pre-start")
              : current.phase === "done" ? (isJa ? "完了" : "Complete")
              : `SS ${current.superstepNumber}`}
          </span>
          <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium">
            {isJa ? current.phaseLabel : current.phaseLabelEn}
          </span>
        </div>
      )}

      {/* Executor cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {current.executors.map((ex) => (
          <ExecutorCard key={ex.id} executor={ex} locale={locale} />
        ))}
      </div>

      {/* State panel */}
      <StatePanel entries={current.stateEntries} locale={locale} />

      {/* Description */}
      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground min-h-[3.5rem]">
        {isJa ? current.description : current.descriptionEn}
      </div>

      <StepPlayerControls {...player} label={getStepLabel} ariaLabels={stepPlayerAriaLabels(locale)} />
    </InteractiveDemo>
  );
}
