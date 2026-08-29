"use client";

import { useMemo, useState } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";
import {
  jainsFairness,
  simulateCpu,
  simulateFairDispatch,
  type CpuAlgorithm,
  type CpuSimulation,
  type CpuTask,
  type FairAlgorithm,
  type FairClient,
  type FairSimulation,
} from "@/lib/task-scheduling-model";

type Locale = "ja" | "en";
type Props = { locale?: string };

const STYLE: Record<
  string,
  { bg: string; pale: string; border: string; text: string }
> = {
  A: {
    bg: "bg-blue-700",
    pale: "bg-blue-500/15",
    border: "border-blue-500/50",
    text: "text-blue-700 dark:text-blue-300",
  },
  B: {
    bg: "bg-emerald-700",
    pale: "bg-emerald-500/15",
    border: "border-emerald-500/50",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  C: {
    bg: "bg-amber-700",
    pale: "bg-amber-500/15",
    border: "border-amber-500/50",
    text: "text-amber-800 dark:text-amber-300",
  },
  D: {
    bg: "bg-violet-700",
    pale: "bg-violet-500/15",
    border: "border-violet-500/50",
    text: "text-violet-700 dark:text-violet-300",
  },
};

const INITIAL_TASKS: CpuTask[] = [
  { id: "A", arrival: 0, burst: 7 },
  { id: "B", arrival: 1, burst: 4 },
  { id: "C", arrival: 2, burst: 1 },
  { id: "D", arrival: 4, burst: 3 },
];

const INITIAL_CLIENTS: FairClient[] = [
  { id: "A", requestCost: 8, requestCount: 3, weight: 1, joinAfter: 0 },
  { id: "B", requestCost: 2, requestCount: 7, weight: 1, joinAfter: 0 },
  { id: "C", requestCost: 4, requestCount: 4, weight: 1, joinAfter: 3 },
];

const TEXT = {
  ja: {
    title: "スケジューリング・ラボ",
    description:
      "CPU の時間軸と LLM ルーターの投入順序を切り替え、パラメータを変えながら 1 判断ずつ追跡できます。",
    cpuTab: "CPU：応答時間と実行中断",
    llmTab: "LLM: テナント間の公平性",
    algorithm: "アルゴリズム",
    quantum: "タイムクォンタム",
    arrival: "到着",
    burst: "実行時間",
    task: "タスク",
    tenant: "テナント",
    timeline: "実行時間軸",
    runnable: "実行待ちキュー",
    remaining: "残り時間",
    empty: "空",
    idle: "アイドル",
    executed: "直前の実行区間",
    notExecuted: "まだ実行していません",
    metrics: "完了後の指標",
    completion: "完了",
    turnaround: "ターンアラウンド",
    waiting: "待ち",
    response: "応答",
    average: "平均",
    estimatedCost: "推定コスト",
    requests: "件数",
    weight: "重み",
    cJoins: "C の参加（論理時刻）",
    logicalTime: "論理時刻",
    sequence: "投入順序",
    selected: "今回の選択",
    noSelection: "この段階では投入なし",
    joined: "この段階で参加",
    reset:
      "直前の混雑期間が終了したため、V を最大完了タグまで進めました。",
    queues: "テナント別待機キュー",
    meters: "SFQ の開始メーター",
    virtualTime: "仮想時刻 V",
    intervalService: "共通待機区間の正規化済み投入コスト",
    cohort: "投入直前の比較対象",
    jain: "Jain の公平性指標",
    cumulative: "累積",
    cost: "コスト",
    cpuCaution:
      "単一 CPU・整数時間・切替コスト 0 の教育用モデルです。SJF/SRTF は実行時間を既知と仮定します。各段階は直前の 1 時間単位の遷移と、遷移後の状態を表します。",
    llmCaution:
      "これは独立した論理到着時刻と、サーバー手前の投入順序を比べるモデルです。GPU 並列実行、継続的バッチ処理、KV キャッシュ、VTC のトークン単位課金は含みません。",
    costNote:
      "棒と Jain 指標は、投入直前の比較対象が共通して待ち仕事を持ち始めてからの増分です。待ち行列は投入後の状態、括弧内は全期間の累積値です。",
    cpuAlgorithms: {
      fcfs: "FCFS / FIFO",
      sjf: "SJF（実行中断なし）",
      srtf: "SRTF（実行中断あり）",
      rr: "ラウンドロビン",
    },
    cpuDescriptions: {
      fcfs: "最初に到着したタスクを完了まで実行します。長い A の後ろで短い C が待つコンボイ効果を確認できます。",
      sjf: "CPU が空くたび、到着済みのうち総実行時間が最短のタスクを選びます。実行中のタスクは止めません。",
      srtf: "残り時間が最短のタスクを毎時間単位で選び直し、短い新着タスクなら実行を中断して切り替えます。",
      rr: "実行可能タスクを巡回し、タイムクォンタムを使い切ると末尾へ戻します。",
    },
    fairAlgorithms: {
      fifo: "全体 FIFO",
      "round-robin": "テナント別ラウンドロビン",
      "shortest-request": "最短リクエスト優先",
      sfq: "SFQ（開始時刻公平キューイング）",
    },
    fairDescriptions: {
      fifo: "全体の到着順だけを見ます。同時に到着した一連のリクエストは設定上のテナント順で並べるため、A が先頭を占有します。",
      "round-robin": "各テナントから 1 件ずつ選びます。件数は揃っても、コストが違えば資源配分は揃いません。",
      "shortest-request": "各テナントの先頭から推定コスト最小を選びます。重いテナントは飢餓状態になり得ます。",
      sfq: "メーターが最小のテナントを選び、その後で推定コスト ÷ 重みを課金します。",
    },
    events: {
      initial: "初期状態",
      dispatch: "新しいタスクを割り当て",
      continue: "同じタスクを継続",
      preempt: "残り時間の短いタスクへ切り替え",
      quantum: "タイムクォンタム終了、キュー末尾へ",
      complete: "タスクが完了",
      idle: "到着待ちで CPU はアイドル",
    },
  },
  en: {
    title: "Scheduling Lab",
    description:
      "Switch between a CPU timeline and LLM-router admission, tune parameters, and inspect one decision at a time.",
    cpuTab: "CPU: latency and preemption",
    llmTab: "LLM: cross-tenant fairness",
    algorithm: "Algorithm",
    quantum: "Time quantum",
    arrival: "Arrival",
    burst: "Burst",
    task: "Task",
    tenant: "Tenant",
    timeline: "Execution timeline",
    runnable: "Ready queue (waiting runnable tasks)",
    remaining: "Remaining time",
    empty: "empty",
    idle: "idle",
    executed: "Executed in the preceding interval",
    notExecuted: "No interval has executed yet",
    metrics: "Final metrics",
    completion: "Completion",
    turnaround: "Turnaround",
    waiting: "Waiting",
    response: "Response",
    average: "Average",
    estimatedCost: "Estimated cost",
    requests: "Requests",
    weight: "Weight",
    cJoins: "Tenant C joins (logical time)",
    logicalTime: "Logical time",
    sequence: "Admission sequence",
    selected: "Current selection",
    noSelection: "No admission at this stage",
    joined: "Joined at this stage",
    reset:
      "The preceding busy period ended, so V advanced to the largest finish tag.",
    queues: "Waiting queues by tenant",
    meters: "SFQ start meters",
    virtualTime: "Virtual time V",
    intervalService: "Normalized admitted cost in the common-backlog interval",
    cohort: "Pre-admission cohort",
    jain: "Jain index",
    cumulative: "cumulative",
    cost: "cost",
    cpuCaution:
      "This teaching model uses one CPU, integer ticks, and zero switch cost. SJF/SRTF assume known bursts. Each stage shows the preceding one-tick transition and its post-transition state.",
    llmCaution:
      "This model compares independent logical arrival time and admission order in front of a server pool. It omits parallel GPU execution, continuous batching, KV caches, and VTC token-level charging.",
    costNote:
      "Bars and the Jain index use increments since the pre-admission cohort became commonly backlogged. Queue cards show post-admission state; parentheses show all-time totals.",
    cpuAlgorithms: {
      fcfs: "FCFS / FIFO",
      sjf: "SJF (non-preemptive)",
      srtf: "SRTF (preemptive)",
      rr: "Round Robin",
    },
    cpuDescriptions: {
      fcfs: "Runs the earliest arrival to completion. Short C waits behind long A—the convoy effect.",
      sjf: "Whenever the CPU is free, selects the arrived task with the shortest total burst without stopping a running task.",
      srtf: "Re-selects the shortest remaining task every tick and preempts for a shorter arrival.",
      rr: "Cycles through runnable tasks and returns each task to the tail after its quantum.",
    },
    fairAlgorithms: {
      fifo: "Global FIFO",
      "round-robin": "Tenant Round Robin",
      "shortest-request": "Shortest request first",
      sfq: "Start-time Fair Queueing",
    },
    fairDescriptions: {
      fifo: "Uses global arrival order. Simultaneous bursts use configured tenant order, so A occupies the head.",
      "round-robin": "Takes one request per tenant. Counts balance, but resource shares do not when costs differ.",
      "shortest-request": "Selects the cheapest tenant head. Heavy tenants can starve.",
      sfq: "Selects the smallest meter and then charges estimated cost ÷ weight.",
    },
    events: {
      initial: "Initial state",
      dispatch: "Dispatch a new task",
      continue: "Continue the same task",
      preempt: "Preempt for a shorter remaining task",
      quantum: "Quantum expired; return task to tail",
      complete: "Task completed",
      idle: "CPU idle while awaiting arrival",
    },
  },
} as const;

function playerAriaLabels(locale: Locale) {
  return locale === "ja"
    ? {
        reset: "最初に戻る",
        backward: "1 段階戻る",
        play: "再生",
        pause: "一時停止",
        forward: "1 段階進む",
        goToStep: (step: number) => `${step} 段階目へ移動`,
        progress: "再生進捗",
      }
    : {
        reset: "Reset",
        backward: "Step backward",
        play: "Play",
        pause: "Pause",
        forward: "Step forward",
        goToStep: (step: number) => `Go to step ${step}`,
        progress: "Playback progress",
      };
}

function Slider({
  label,
  accessibleLabel,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  accessibleLabel?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
      <span className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-foreground">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-6 w-full cursor-pointer accent-[var(--accent)]"
        aria-label={accessibleLabel ?? label}
      />
    </label>
  );
}

function CpuPlayback({
  result,
  tasks,
  locale,
}: {
  result: CpuSimulation;
  tasks: CpuTask[];
  locale: Locale;
}) {
  const t = TEXT[locale];
  const player = useStepPlayer({ totalSteps: result.steps.length, intervalMs: 700 });
  const current = result.steps[player.step];
  const eventText = (step: number) =>
    result.steps[step].events.map((event) => t.events[event]).join(" + ");

  return (
    <div className="space-y-5">
      <section className="space-y-2" aria-label={t.timeline}>
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-semibold">{t.timeline}</h4>
          <span className="font-mono text-muted-foreground">t = {current.time}</span>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[560px]">
            <div className="relative h-14 overflow-hidden rounded-lg border border-border bg-background">
              <div className="flex h-full" role="list" aria-label={t.timeline}>
                {result.slices.map((slice, index) => (
                  <div
                    key={`${slice.taskId ?? "idle"}-${slice.start}-${index}`}
                    role="listitem"
                    aria-label={`${slice.taskId ? `${t.task} ${slice.taskId}` : t.idle}: ${slice.start}–${slice.end}`}
                    className={`flex items-center justify-center border-r border-background/50 text-xs font-semibold ${
                      slice.taskId ? STYLE[slice.taskId].bg : "bg-muted"
                    } ${slice.taskId ? "text-white" : "text-foreground"}`}
                    style={{
                      width: `${((slice.end - slice.start) / result.finishTime) * 100}%`,
                    }}
                  >
                    {slice.end - slice.start >= 2
                      ? (slice.taskId ?? t.idle)
                      : slice.taskId}
                  </div>
                ))}
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-white/15 transition-all"
                style={{ width: `${(current.time / result.finishTime) * 100}%` }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground transition-all"
                style={{
                  left: `calc(${(current.time / result.finishTime) * 100}% - ${current.time === result.finishTime ? "2px" : "0px"})`,
                }}
                aria-hidden="true"
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>0</span><span>{result.finishTime}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-background p-3">
          <h4 className="text-xs font-semibold">{t.runnable}</h4>
          <div className="mt-2 flex min-h-8 flex-wrap gap-1.5">
            {current.ready.length === 0 ? (
              <span className="text-xs text-muted-foreground">{t.empty}</span>
            ) : current.ready.map((id) => (
              <span key={id} className={`rounded-md border px-2 py-1 text-xs font-semibold ${STYLE[id].pale} ${STYLE[id].border} ${STYLE[id].text}`}>
                {id}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-border bg-background p-3">
          <h4 className="text-xs font-semibold">{t.remaining}</h4>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            {tasks.map((task) => (
              <div key={task.id}>
                <div className={`text-xs font-semibold ${STYLE[task.id].text}`}>{task.id}</div>
                <div className="font-mono text-sm tabular-nums">{current.remaining[task.id]}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-lg bg-muted px-3 py-2 text-sm" role="status" aria-atomic="true">
        <div className="font-semibold">
          {eventText(player.step)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {current.executedTask && current.intervalStart !== null && current.intervalEnd !== null ? (
            <>{t.executed} [{current.intervalStart}, {current.intervalEnd}): <strong className="text-foreground">{current.executedTask}</strong></>
          ) : t.notExecuted}
        </div>
      </div>

      <StepPlayerControls {...player} label={(step) => `${eventText(step)} · t=${result.steps[step].time}`} ariaLabels={playerAriaLabels(locale)} />

      <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
        <h4 className="mb-2 text-xs font-semibold">{t.metrics}</h4>
        <table className="w-full min-w-[520px] text-right text-xs">
          <caption className="sr-only">{t.metrics}</caption>
          <thead className="text-muted-foreground"><tr>
            <th scope="col" className="px-2 py-1 text-left">{t.task}</th><th scope="col">{t.completion}</th><th scope="col">{t.turnaround}</th><th scope="col">{t.waiting}</th><th scope="col">{t.response}</th>
          </tr></thead>
          <tbody>{tasks.map((task) => {
            const metric = result.metrics[task.id];
            return <tr key={task.id} className="border-t border-border/60">
              <th scope="row" className={`px-2 py-1.5 text-left ${STYLE[task.id].text}`}>{task.id}</th>
              {[metric.completion, metric.turnaround, metric.waiting, metric.response].map((value, index) => <td key={index} className="px-2 py-1.5 font-mono tabular-nums">{value}</td>)}
            </tr>;
          })}</tbody>
          <tfoot className="border-t border-border font-semibold"><tr>
            <th scope="row" className="px-2 py-1.5 text-left">{t.average}</th><td /><td />
            <td className="font-mono">{result.averageWaiting.toFixed(2)}</td>
            <td className="font-mono">{result.averageResponse.toFixed(2)}</td>
          </tr></tfoot>
        </table>
      </section>
    </div>
  );
}

function FairPlayback({ result, clients, algorithm, locale }: {
  result: FairSimulation;
  clients: FairClient[];
  algorithm: FairAlgorithm;
  locale: Locale;
}) {
  const t = TEXT[locale];
  const player = useStepPlayer({ totalSteps: result.steps.length, intervalMs: 850 });
  const current = result.steps[player.step];
  const fairnessValues = current.fairnessCohort.map((id) => current.fairnessService[id] ?? 0);
  const fairness = current.fairnessCohort.length >= 2 ? jainsFairness(fairnessValues) : null;
  const maxWindow = fairnessValues.reduce(
    (maximum, value) => Math.max(maximum, value),
    1,
  );
  const stepLabel = (step: number) => {
    const state = result.steps[step];
    return state.chosen ? `${state.chosen.id} · ${t.cost} ${state.chosen.cost}` : `${t.logicalTime} ${state.logicalTime}`;
  };

  return <div className="space-y-5">
    <section className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <h4 className="font-semibold">{t.sequence}</h4>
        <span className="font-mono text-muted-foreground">{current.index} / {result.sequence.length} · {t.logicalTime} {current.logicalTime}</span>
      </div>
      <div className="flex min-h-10 flex-wrap gap-1.5 rounded-lg border border-border bg-background p-2">
        {result.sequence.map((request, index) => <span
          key={request.id}
          className={`rounded-md px-2 py-1 text-xs font-semibold text-white transition-all ${STYLE[request.clientId].bg} ${index < current.index ? "ring-2 ring-inset ring-white/70" : ""}`}
          title={`${request.id}: ${t.cost} ${request.cost}`}
        >{request.id}<span className="ml-1">·{request.cost}</span></span>)}
      </div>
    </section>

    <div className="rounded-lg bg-muted px-3 py-2 text-sm" role="status" aria-atomic="true">
      <div><span className="font-semibold">{t.selected}: </span>
        {current.chosen ? <><span className={STYLE[current.chosen.clientId].text}>{current.chosen.id}</span> <span className="text-muted-foreground">· {t.cost} {current.chosen.cost}</span></> : <span className="text-muted-foreground">{t.noSelection}</span>}
      </div>
      {current.joinedClients.length > 0 && <div className="mt-1 text-xs text-muted-foreground">{t.joined}: {current.joinedClients.join(", ")}</div>}
      {current.idleReset && <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t.reset}</div>}
    </div>

    <StepPlayerControls {...player} label={stepLabel} ariaLabels={playerAriaLabels(locale)} />

    <section className="rounded-lg border border-border bg-background p-3">
      <h4 className="text-xs font-semibold">{t.queues}</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">{clients.map((client) => {
        const queue = current.queues[client.id] ?? [];
        return <div key={client.id} className={`rounded-lg border p-2 ${STYLE[client.id].border} ${STYLE[client.id].pale}`}>
          <div className="flex justify-between text-xs"><span className={`font-semibold ${STYLE[client.id].text}`}>{client.id}</span><span className="font-mono text-muted-foreground">{queue.length}</span></div>
          <div className="mt-2 flex min-h-6 flex-wrap gap-1">{queue.length === 0 ? <span className="text-[10px] text-muted-foreground">{t.empty}</span> : queue.map((request) => <span key={request.id} className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">{request.id}</span>)}</div>
        </div>;
      })}</div>
    </section>

    {algorithm === "sfq" && <section className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3 text-xs"><h4 className="font-semibold">{t.meters}</h4><span className="font-mono text-muted-foreground">{t.virtualTime} = {current.virtualTime.toFixed(3)}</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">{clients.map((client) => <div key={client.id}>
        <div className={`text-xs font-semibold ${STYLE[client.id].text}`}>M<sub>{client.id}</sub></div>
        <div className="font-mono text-lg tabular-nums">{current.meters[client.id].toFixed(3)}</div>
        {current.chosen?.clientId === client.id && <div className="text-[10px] text-muted-foreground">{current.metersBefore[client.id].toFixed(3)} + {current.chosen.cost}/{client.weight}</div>}
      </div>)}</div>
    </section>}

    <section className="rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><h4 className="font-semibold">{t.intervalService}</h4><span className="font-mono text-muted-foreground">{t.jain}: {fairness === null ? "N/A" : fairness.toFixed(3)}</span></div>
      <div className="mt-1 text-right text-[10px] text-muted-foreground">{t.cohort}: {current.fairnessCohort.join(", ") || "—"}</div>
      <div className="mt-3 space-y-2">{clients.filter((client) => current.fairnessCohort.includes(client.id)).map((client) => {
        const windowValue = current.fairnessService[client.id] ?? 0;
        const cumulative = current.normalizedService[client.id] ?? 0;
        return <div key={client.id} className="grid grid-cols-[1.5rem_1fr_7rem] items-center gap-2">
          <span className={`text-xs font-semibold ${STYLE[client.id].text}`}>{client.id}</span>
          <div className="h-4 overflow-hidden rounded bg-muted"><div className={`h-full rounded transition-all ${STYLE[client.id].bg}`} style={{ width: `${(windowValue / maxWindow) * 100}%` }} /></div>
          <span className="text-right font-mono text-xs tabular-nums">{windowValue.toFixed(1)}<span className="ml-1 text-[10px] text-muted-foreground">({t.cumulative}: {cumulative.toFixed(1)})</span></span>
        </div>;
      })}</div>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t.costNote}</p>
    </section>
  </div>;
}

export function TaskSchedulingLab({ locale = "ja" }: Props) {
  const lang: Locale = locale === "en" ? "en" : "ja";
  const t = TEXT[lang];
  const [tab, setTab] = useState<"cpu" | "llm">("cpu");
  const [cpuAlgorithm, setCpuAlgorithm] = useState<CpuAlgorithm>("fcfs");
  const [quantum, setQuantum] = useState(2);
  const [tasks, setTasks] = useState<CpuTask[]>(INITIAL_TASKS);
  const [fairAlgorithm, setFairAlgorithm] = useState<FairAlgorithm>("fifo");
  const [clients, setClients] = useState<FairClient[]>(INITIAL_CLIENTS);
  const cpu = useMemo(() => simulateCpu(tasks, cpuAlgorithm, quantum), [tasks, cpuAlgorithm, quantum]);
  const fair = useMemo(() => simulateFairDispatch(clients, fairAlgorithm), [clients, fairAlgorithm]);

  const updateTask = (id: string, field: "arrival" | "burst", value: number) => setTasks((current) => current.map((task) => task.id === id ? { ...task, [field]: value } : task));
  const updateClient = (id: string, field: "requestCost" | "requestCount" | "weight" | "joinAfter", value: number) => setClients((current) => current.map((client) => client.id === id ? { ...client, [field]: value } : client));
  const cpuKey = `${cpuAlgorithm}-${quantum}-${tasks.map((task) => `${task.arrival}-${task.burst}`).join("-")}`;
  const fairKey = `${fairAlgorithm}-${clients.map((client) => `${client.requestCost}-${client.requestCount}-${client.weight}-${client.joinAfter}`).join("-")}`;

  return <InteractiveDemo title={t.title} description={t.description}>
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-lg bg-background p-1" role="group" aria-label={t.title}>{(["cpu", "llm"] as const).map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${tab === value ? "bg-blue-700 text-white" : "text-foreground hover:bg-muted"}`}>{value === "cpu" ? t.cpuTab : t.llmTab}</button>)}</div>

      {tab === "cpu" ? <>
        <section className="space-y-4 rounded-lg border border-border bg-background p-4">
          <label className="block text-xs text-muted-foreground"><span className="mb-1 block font-semibold text-foreground">{t.algorithm}</span><select value={cpuAlgorithm} onChange={(event) => setCpuAlgorithm(event.target.value as CpuAlgorithm)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">{(Object.keys(t.cpuAlgorithms) as CpuAlgorithm[]).map((value) => <option key={value} value={value}>{t.cpuAlgorithms[value]}</option>)}</select></label>
          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">{t.cpuDescriptions[cpuAlgorithm]}</p>
          {cpuAlgorithm === "rr" && <Slider label={t.quantum} value={quantum} min={1} max={5} onChange={setQuantum} />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tasks.map((task) => <div key={task.id} className={`space-y-3 rounded-lg border p-3 ${STYLE[task.id].border} ${STYLE[task.id].pale}`}>
            <div className={`font-semibold ${STYLE[task.id].text}`}>{t.task} {task.id}</div>
            <Slider label={t.arrival} accessibleLabel={`${t.task} ${task.id} — ${t.arrival}`} value={task.arrival} min={0} max={6} onChange={(value) => updateTask(task.id, "arrival", value)} />
            <Slider label={t.burst} accessibleLabel={`${t.task} ${task.id} — ${t.burst}`} value={task.burst} min={1} max={10} onChange={(value) => updateTask(task.id, "burst", value)} />
          </div>)}</div>
        </section>
        <CpuPlayback key={cpuKey} result={cpu} tasks={tasks} locale={lang} />
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{t.cpuCaution}</p>
      </> : <>
        <section className="space-y-4 rounded-lg border border-border bg-background p-4">
          <label className="block text-xs text-muted-foreground"><span className="mb-1 block font-semibold text-foreground">{t.algorithm}</span><select value={fairAlgorithm} onChange={(event) => setFairAlgorithm(event.target.value as FairAlgorithm)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">{(Object.keys(t.fairAlgorithms) as FairAlgorithm[]).map((value) => <option key={value} value={value}>{t.fairAlgorithms[value]}</option>)}</select></label>
          <p className="rounded-md bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">{t.fairDescriptions[fairAlgorithm]}</p>
          <div className="grid gap-3 sm:grid-cols-3">{clients.map((client) => <div key={client.id} className={`space-y-3 rounded-lg border p-3 ${STYLE[client.id].border} ${STYLE[client.id].pale}`}>
            <div className={`font-semibold ${STYLE[client.id].text}`}>{t.tenant} {client.id}</div>
            <Slider label={t.estimatedCost} accessibleLabel={`${t.tenant} ${client.id} — ${t.estimatedCost}`} value={client.requestCost} min={1} max={10} onChange={(value) => updateClient(client.id, "requestCost", value)} />
            <Slider label={t.requests} accessibleLabel={`${t.tenant} ${client.id} — ${t.requests}`} value={client.requestCount} min={1} max={8} onChange={(value) => updateClient(client.id, "requestCount", value)} />
            <Slider label={t.weight} accessibleLabel={`${t.tenant} ${client.id} — ${t.weight}`} value={client.weight} min={1} max={3} onChange={(value) => updateClient(client.id, "weight", value)} />
            {client.id === "C" && <Slider label={t.cJoins} accessibleLabel={`${t.tenant} C — ${t.cJoins}`} value={client.joinAfter} min={0} max={6} onChange={(value) => updateClient(client.id, "joinAfter", value)} />}
          </div>)}</div>
        </section>
        <FairPlayback key={fairKey} result={fair} clients={clients} algorithm={fairAlgorithm} locale={lang} />
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{t.llmCaution}</p>
      </>}
    </div>
  </InteractiveDemo>;
}
