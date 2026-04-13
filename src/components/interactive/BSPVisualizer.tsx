"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
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
      description: "ワークフロー開始前。Input Executor のメッセージキュー（StepContext）に「Hello!」が入っている。AdvanceAsync() で _nextStep がアトミックにスワップされ、スーパーステップ 1 が始まる。",
      descriptionEn: "Before workflow starts. 'Hello!' is in the Input Executor's message queue (StepContext). AdvanceAsync() atomically swaps _nextStep, and superstep 1 begins.",
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
      description: "スーパーステップ 1: Input Executor が [MessageHandler] でメッセージを処理中。Task.WhenAll で同一ステップのアクティブな Executor が並行実行される（この場合は Input のみ）。",
      descriptionEn: "Superstep 1: Input Executor processes the message via [MessageHandler]. Task.WhenAll runs active Executors in the same step concurrently (only Input is active here).",
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
      description: "Input が context.SendMessageAsync() を呼び出し。Fan-out Edge がメッセージを French と Spanish の両方に配信予定としてキューする。この時点ではまだ _nextStep（次のスーパーステップ用 StepContext）にエンキューされるだけ。",
      descriptionEn: "Input calls context.SendMessageAsync(). The Fan-out Edge queues the message for delivery to both French and Spanish. At this point, messages are only enqueued into _nextStep (the StepContext for the next superstep).",
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
      description: "バリア同期: 全 Executor の完了を確認。StateManager.PublishUpdatesAsync() でキューされたステート更新をバッチ適用（今回はステート変更なし）。チェックポイントを作成。SuperStepCompletedEvent を発火。",
      descriptionEn: "Barrier sync: Confirm all Executors are done. StateManager.PublishUpdatesAsync() batch-applies queued state updates (no state changes this step). Checkpoint created. SuperStepCompletedEvent fires.",
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
      description: "AdvanceAsync() が _nextStep をスワップし、前ステップでキューされたメッセージが French と Spanish の inbox に配信される。Interlocked.Exchange(ref _nextStep, new StepContext()) でアトミックに切り替え。",
      descriptionEn: "AdvanceAsync() swaps _nextStep. Messages queued in the previous step are delivered to French and Spanish inboxes. Interlocked.Exchange(ref _nextStep, new StepContext()) performs the atomic swap.",
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
      description: "スーパーステップ 2: French と Spanish が Task.WhenAll で並行実行！ これが Fan-out パターンの核心。各 Executor の [MessageHandler] が同時に LLM を呼び出し、翻訳を生成する。",
      descriptionEn: "Superstep 2: French and Spanish run in parallel via Task.WhenAll! This is the core of the Fan-out pattern. Each Executor's [MessageHandler] calls the LLM simultaneously to generate translations.",
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
      description: "French が「Bonjour!」、Spanish が「¡Hola!」を出力。各 Executor が QueueStateUpdateAsync() でステート更新をキュー。Fan-in Barrier Edge が「全ソースから 1 つ以上のメッセージを受信」するまでバッファリング。",
      descriptionEn: "French outputs 'Bonjour!', Spanish outputs '¡Hola!'. Each Executor queues state updates via QueueStateUpdateAsync(). The Fan-in Barrier Edge buffers until 'at least one message from every source' is received.",
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
      description: "バリア同期: PublishUpdatesAsync() で pending ステート更新がバッチ適用される。translations が空配列から [\"Bonjour!\",\"¡Hola!\"] に更新。Fan-in Barrier の条件が満たされ、Aggregator へのメッセージ配信が次ステップで開始される。",
      descriptionEn: "Barrier sync: PublishUpdatesAsync() batch-applies pending state updates. translations updates from empty to [\"Bonjour!\",\"¡Hola!\"]. Fan-in Barrier condition met — message delivery to Aggregator begins next step.",
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
      description: "Fan-in Barrier Edge がリリース: French と Spanish 両方のメッセージが Aggregator の inbox に配信される。",
      descriptionEn: "Fan-in Barrier Edge releases: Both French and Spanish messages are delivered to the Aggregator's inbox.",
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
      description: "スーパーステップ 3: Aggregator が全翻訳結果を集約。YieldOutputAsync() でワークフロー出力としてマーク。WorkflowOutputEvent が Event Queue（ConcurrentEventSink）に発火される。",
      descriptionEn: "Superstep 3: Aggregator aggregates all translation results. YieldOutputAsync() marks them as workflow output. WorkflowOutputEvent fires into the Event Queue (ConcurrentEventSink).",
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
      description: "全 Executor のキューが空。WithOutputFrom(aggregator) で指定された Executor が出力を生成したため、ワークフローが完了。3 スーパーステップで Fan-out → 並行計算 → Fan-in → 集約の全サイクルが完了した。",
      descriptionEn: "All Executor queues are empty. The Executor specified by WithOutputFrom(aggregator) produced output, so the workflow completes. The full Fan-out → parallel computation → Fan-in → aggregation cycle completed in 3 supersteps.",
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
  waiting: { ja: "同期待ち", en: "Syncing" },
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
          ? "Concurrent 翻訳ワークフローを例に、スーパーステップ方式の実行フローを視覚化します"
          : "Visualizes the superstep execution flow using a Concurrent translation workflow example"
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

      <StepPlayerControls {...player} label={getStepLabel} />
    </InteractiveDemo>
  );
}
