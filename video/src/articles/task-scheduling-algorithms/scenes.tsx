import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Task = { id: string; arrival: number; burst: number };
type Slot = { id: string; start: number; end: number };
type Schedule = { slots: Slot[]; completion: Record<string, number>; firstStart: Record<string, number> };

const CPU_TASKS: Task[] = [
  { id: "A", arrival: 0, burst: 8 },
  { id: "B", arrival: 1, burst: 2 },
  { id: "C", arrival: 2, burst: 1 },
  { id: "D", arrival: 3, burst: 2 },
];

const taskColor: Record<string, string> = {
  A: colors.coral,
  B: colors.teal,
  C: colors.amber,
  D: colors.ink,
  J1: colors.coral,
  J2: colors.teal,
  J3: colors.amber,
};

function mergeSlots(slots: Slot[]): Slot[] {
  const out: Slot[] = [];
  for (const s of slots) {
    const last = out[out.length - 1];
    if (last && last.id === s.id && last.end === s.start) last.end = s.end;
    else out.push({ ...s });
  }
  return out;
}

function finalize(tasks: Task[], slots: Slot[]): Schedule {
  const completion: Record<string, number> = {};
  const firstStart: Record<string, number> = {};
  for (const slot of slots) {
    if (firstStart[slot.id] === undefined) firstStart[slot.id] = slot.start;
    completion[slot.id] = slot.end;
  }
  for (const task of tasks) {
    completion[task.id] ??= 0;
    firstStart[task.id] ??= 0;
  }
  return { slots: mergeSlots(slots), completion, firstStart };
}

function fcfs(tasks: Task[]): Schedule {
  const slots: Slot[] = [];
  let t = 0;
  for (const task of [...tasks].sort((a, b) => a.arrival - b.arrival)) {
    t = Math.max(t, task.arrival);
    slots.push({ id: task.id, start: t, end: t + task.burst });
    t += task.burst;
  }
  return finalize(tasks, slots);
}

function sjf(tasks: Task[]): Schedule {
  const remaining = [...tasks];
  const slots: Slot[] = [];
  let t = 0;
  while (remaining.length) {
    const ready = remaining.filter((task) => task.arrival <= t);
    if (!ready.length) {
      t = Math.min(...remaining.map((task) => task.arrival));
      continue;
    }
    ready.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival || a.id.localeCompare(b.id));
    const task = ready[0];
    remaining.splice(remaining.indexOf(task), 1);
    slots.push({ id: task.id, start: t, end: t + task.burst });
    t += task.burst;
  }
  return finalize(tasks, slots);
}

function srtf(tasks: Task[]): Schedule {
  const rem = Object.fromEntries(tasks.map((task) => [task.id, task.burst]));
  const slots: Slot[] = [];
  let done = 0;
  let t = 0;
  while (done < tasks.length) {
    const ready = tasks
      .filter((task) => task.arrival <= t && rem[task.id] > 0)
      .sort((a, b) => rem[a.id] - rem[b.id] || a.arrival - b.arrival || a.id.localeCompare(b.id));
    if (!ready.length) {
      t = Math.min(...tasks.filter((task) => rem[task.id] > 0).map((task) => task.arrival));
      continue;
    }
    const task = ready[0];
    slots.push({ id: task.id, start: t, end: t + 1 });
    rem[task.id] -= 1;
    if (rem[task.id] === 0) done += 1;
    t += 1;
  }
  return finalize(tasks, slots);
}

function rr(tasks: Task[], quantum: number): Schedule {
  const rem = Object.fromEntries(tasks.map((task) => [task.id, task.burst]));
  const slots: Slot[] = [];
  const q: Task[] = [];
  let t = 0;
  let i = 0;
  const sorted = [...tasks].sort((a, b) => a.arrival - b.arrival);
  while (i < sorted.length || q.length) {
    if (!q.length && i < sorted.length && sorted[i].arrival > t) t = sorted[i].arrival;
    while (i < sorted.length && sorted[i].arrival <= t) q.push(sorted[i++]);
    const task = q.shift();
    if (!task) continue;
    const run = Math.min(quantum, rem[task.id]);
    slots.push({ id: task.id, start: t, end: t + run });
    t += run;
    rem[task.id] -= run;
    while (i < sorted.length && sorted[i].arrival <= t) q.push(sorted[i++]);
    if (rem[task.id] > 0) q.push(task);
  }
  return finalize(tasks, slots);
}

function avgWaiting(tasks: Task[], schedule: Schedule) {
  return tasks.reduce((sum, task) => sum + (schedule.completion[task.id] - task.arrival - task.burst), 0) / tasks.length;
}

function avgResponse(tasks: Task[], schedule: Schedule) {
  return tasks.reduce((sum, task) => sum + (schedule.firstStart[task.id] - task.arrival), 0) / tasks.length;
}

function TaskLegend({ tasks = CPU_TASKS, x = 120, y = 820 }: { tasks?: Task[]; x?: number; y?: number }) {
  return (
    <Abs x={x} y={y} w={1680} style={{ display: "flex", gap: 16, justifyContent: "center" }}>
      {tasks.map((task) => (
        <Chip key={task.id} tone="muted" size={22}>
          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: taskColor[task.id], marginRight: 2 }} />
          <span style={{ fontFamily: fonts.mono }}>
            {task.id}: a={task.arrival}, p={task.burst}
          </span>
        </Chip>
      ))}
    </Abs>
  );
}

function GanttRow({
  label,
  schedule,
  y,
  at,
  horizon,
  highlight,
  x = 360,
  width = 1120,
}: {
  label: Bilingual;
  schedule: Schedule;
  y: number;
  at: number;
  horizon: number;
  highlight?: boolean;
  x?: number;
  width?: number;
}) {
  const frame = useCurrentFrame();
  const t = useT();
  const p = progress(frame, at, 22);
  return (
    <>
      <Abs x={120} y={y + 10} w={210} h={56} style={{ opacity: p, fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: highlight ? colors.coralDeep : colors.body }}>
        {t(label)}
      </Abs>
      <Abs x={x} y={y} w={width} h={66} style={{ opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: colors.surfaceSoft, border: `2px solid ${highlight ? colors.coral : colors.hairlineStrong}` }} />
        {schedule.slots.map((slot, i) => {
          const sx = (slot.start / horizon) * width;
          const sw = ((slot.end - slot.start) / horizon) * width;
          return (
            <div
              key={`${slot.id}-${slot.start}-${i}`}
              style={{
                position: "absolute",
                left: sx,
                top: 7,
                width: Math.max(4, sw - 3),
                height: 52,
                borderRadius: 10,
                background: taskColor[slot.id],
                color: slot.id === "D" ? colors.onDark : colors.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {slot.id}
            </div>
          );
        })}
      </Abs>
    </>
  );
}

function MetricBadge({ x, y, label, value, at, tone = "muted" }: { x: number; y: number; label: Bilingual; value: string; at: number; tone?: "coral" | "teal" | "amber" | "muted" }) {
  const frame = useCurrentFrame();
  const t = useT();
  const p = progress(frame, at, 16);
  return (
    <Abs x={x} y={y} w={210} h={104} style={{ opacity: p, transform: `translateY(${(1 - p) * 14}px)` }}>
      <Card tone="white" accent={tone === "coral" ? colors.coral : tone === "teal" ? colors.teal : tone === "amber" ? colors.amber : colors.hairlineStrong} style={{ width: "100%", height: "100%", padding: "12px 16px 14px", boxSizing: "border-box" }}>
        <div style={{ fontFamily: fonts.sans, fontSize: 22, color: colors.muted, fontWeight: 600 }}>{t(label)}</div>
        <div style={{ marginTop: 4, fontFamily: fonts.mono, fontSize: 34, lineHeight: 1.2, fontWeight: 800, color: tone === "coral" ? colors.coralDeep : tone === "teal" ? colors.tealDeep : colors.body }}>{value}</div>
      </Card>
    </Abs>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tt = useT();
  const t = progress(frame, 18, 50);
  const branches = [
    { label: "FCFS", x: 1290, y: 274, color: colors.coral },
    { label: "SRTF", x: 1540, y: 274, color: colors.amber },
    { label: "EDF", x: 1740, y: 418, color: colors.teal },
    { label: "SFQ", x: 1290, y: 620, color: colors.tealDeep },
    { label: "VTC", x: 1545, y: 738, color: colors.coralDeep },
    { label: "DRR", x: 1740, y: 620, color: colors.ink },
  ];
  return (
    <TitleCard
      title={{ ja: "タスク\nスケジューリングの系譜", en: "A Genealogy of\nTask Scheduling" }}
      subtitle={{ ja: "FIFO から公平キューイング、LLM 推論まで", en: "From FIFO to fair queueing and LLM inference" }}
      art={
        <>
          <Svg>
            {branches.map((b, i) => (
              <Arrow key={b.label} x1={1510} y1={500} x2={b.x} y2={b.y} p={progress(frame, 22 + i * 4, 22)} color={b.color} width={5} head />
            ))}
          </Svg>
          <Abs x={1370} y={430} w={280} h={140} style={{ opacity: pop(frame, 8, fps), transform: `scale(${0.75 + 0.25 * pop(frame, 8, fps)})` }}>
            <Card tone="dark" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 42, fontWeight: 600 }}>
              {tt({ ja: "待ち行列", en: "Queue" })}
            </Card>
          </Abs>
          {branches.map((b, i) => {
            const p = pop(frame, 32 + i * 5, fps);
            return (
              <Abs key={b.label} x={b.x - 74} y={b.y - 42} w={148} h={84} style={{ opacity: Math.min(1, p), transform: `scale(${0.78 + 0.22 * p})` }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 18, background: mixColor("#ffffff", b.color, 0.18), border: `4px solid ${b.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 31, fontWeight: 800, color: colors.ink }}>
                  {b.label}
                </div>
              </Abs>
            );
          })}
          <Abs x={1230} y={825} w={620} style={{ opacity: t, fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: colors.muted, textAlign: "center" }}>
            {tt({ ja: "目的 → 前提 → 課金単位 → 層", en: "objective → assumptions → charge unit → layer" })}
          </Abs>
        </>
      }
    />
  );
}

export function ObjectivesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cards = [
    { title: { ja: "平均", en: "Mean" }, value: { ja: "完了 − 到着", en: "Cᵢ − aᵢ" }, body: { ja: "早く終える", en: "finish sooner" }, color: colors.coral },
    { title: { ja: "応答", en: "Response" }, value: { ja: "初回実行 − 到着", en: "first − aᵢ" }, body: { ja: "まず一度動く", en: "run once soon" }, color: colors.amber },
    { title: { ja: "締切", en: "Deadline" }, value: "dᵢ", body: { ja: "期限内に処理", en: "finish on time" }, color: colors.teal },
    { title: { ja: "公平", en: "Fairness" }, value: { ja: "サービス量 / 重み", en: "Wᵢ / wᵢ" }, body: { ja: "正規化量を揃える", en: "normalize service" }, color: colors.tealDeep },
    { title: { ja: "能力", en: "Capacity" }, value: { ja: "利用率", en: "utilization" }, body: { ja: "遊ばせない", en: "stay work-conserving" }, color: colors.ink },
    { title: { ja: "予測可能性", en: "Predictable" }, value: "P99", body: { ja: "テールを抑える", en: "control tails" }, color: colors.coralDeep },
  ];
  const assumptions = [
    { ja: "プリエンプション", en: "preemptible?" },
    { ja: "処理量は既知？", en: "known size?" },
    { ja: "資源は1種類？", en: "one resource?" },
    { ja: "公平性の主体", en: "fairness principal" },
    { ja: "決定の層", en: "decision layer" },
  ];
  return (
    <SceneShell kicker={{ ja: "目的", en: "Objectives" }} title={{ ja: "良いスケジュールを先に定義する", en: "Define a good schedule first" }}>
      <Abs x={120} y={224} w={1680} h={392}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
          {cards.map((c, i) => {
            const p = progress(frame, cues[0] + i * 5, 18);
            return (
              <div key={c.title.en} style={{ opacity: p, transform: `translateY(${(1 - p) * 22}px)` }}>
                <Card tone="white" accent={c.color} style={{ height: 176, padding: "22px 28px", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t(c.title)}</span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 27, fontWeight: 800, color: c.color }}>{typeof c.value === "string" ? c.value : t(c.value)}</span>
                  </div>
                  <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{t(c.body)}</div>
                </Card>
              </div>
            );
          })}
        </div>
      </Abs>
      <Svg>
        <Arrow x1={590} y1={662} x2={1330} y2={662} p={progress(frame, cues[1] + 4, 30)} color={colors.coral} width={6} head />
      </Svg>
      <Abs x={120} y={638} w={420}>
        <Chip tone="coral" size={28}>{t({ ja: "目的は衝突する", en: "Objectives conflict" })}</Chip>
      </Abs>
      <Abs x={1370} y={628} w={430}>
        <Chip tone="ink" size={28}>{t({ ja: "前提を固定する", en: "Fix assumptions" })}</Chip>
      </Abs>
      <Abs x={220} y={725} w={1480} h={124}>
        <Card tone="soft" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
          {assumptions.map((a, i) => (
            <div key={a.en} style={{ opacity: progress(frame, cues[1] + 26 + i * 4, 14) }}>
              <Chip tone={i % 2 ? "teal" : "muted"} size={25}>{t(a)}</Chip>
            </div>
          ))}
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function CpuScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const schedules = {
    fcfs: fcfs(CPU_TASKS),
    sjf: sjf(CPU_TASKS),
    srtf: srtf(CPU_TASKS),
    rr: rr(CPU_TASKS, 2),
  };
  const horizon = 14;
  return (
    <SceneShell kicker={{ ja: "CPU", en: "CPU" }} title={{ ja: "完了時間と応答性の枝", en: "Completion time vs. responsiveness" }}>
      <GanttRow label={{ ja: "FCFS", en: "FCFS" }} schedule={schedules.fcfs} y={228} at={cues[0] + 2} horizon={horizon} highlight />
      <MetricBadge x={1520} y={218} label={{ ja: "平均待ち", en: "avg wait" }} value={avgWaiting(CPU_TASKS, schedules.fcfs).toFixed(1)} at={cues[0] + 18} tone="coral" />
      <GanttRow label={{ ja: "SJF", en: "SJF" }} schedule={schedules.sjf} y={338} at={cues[1] + 2} horizon={horizon} />
      <Abs x={360} y={306} style={{ opacity: progress(frame, cues[1] + 12, 14) }}>
        <Chip tone="muted" size={22}>{t({ ja: "t=0 に届いているのは A だけ", en: "only A has arrived at t=0" })}</Chip>
      </Abs>
      <MetricBadge x={1520} y={328} label={{ ja: "平均待ち", en: "avg wait" }} value={avgWaiting(CPU_TASKS, schedules.sjf).toFixed(1)} at={cues[1] + 14} tone="teal" />
      <GanttRow label={{ ja: "SRTF", en: "SRTF" }} schedule={schedules.srtf} y={448} at={cues[2] + 2} horizon={horizon} highlight />
      <MetricBadge x={1520} y={438} label={{ ja: "平均フロー", en: "avg flow" }} value={(avgWaiting(CPU_TASKS, schedules.srtf) + CPU_TASKS.reduce((s, x) => s + x.burst, 0) / CPU_TASKS.length).toFixed(1)} at={cues[2] + 14} tone="amber" />
      <GanttRow label={{ ja: "RR q=2", en: "RR q=2" }} schedule={schedules.rr} y={558} at={cues[3] + 2} horizon={horizon} />
      <MetricBadge x={1520} y={548} label={{ ja: "平均応答", en: "avg response" }} value={avgResponse(CPU_TASKS, schedules.rr).toFixed(1)} at={cues[3] + 14} tone="teal" />
      <Abs x={120} y={690} w={1680} h={104}>
        <Card tone="soft" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <Chip tone="coral" size={26}>{t({ ja: "FCFS: コンボイ", en: "FCFS: convoy" })}</Chip>
          <Chip tone="teal" size={26}>{t({ ja: "SJF/SRTF: 短い仕事優先", en: "SJF/SRTF: short first" })}</Chip>
          <Chip tone="amber" size={26}>{t({ ja: "RR: 初回応答を早く", en: "RR: quick first response" })}</Chip>
          <Chip tone="muted" size={26}>{t({ ja: "MLFQ: 履歴から推測", en: "MLFQ: infer from history" })}</Chip>
        </Card>
      </Abs>
      <TaskLegend y={828} />
    </SceneShell>
  );
}

type Job = { id: string; arrival: number; work: number; deadline: number; period?: number };

function edf(jobs: Job[]): Schedule {
  const tasks = jobs.map((j) => ({ id: j.id, arrival: j.arrival, burst: j.work }));
  const rem = Object.fromEntries(jobs.map((j) => [j.id, j.work]));
  const slots: Slot[] = [];
  let done = 0;
  let t = 0;
  while (done < jobs.length) {
    const ready = jobs.filter((j) => j.arrival <= t && rem[j.id] > 0).sort((a, b) => a.deadline - b.deadline || a.arrival - b.arrival);
    if (!ready.length) {
      t = Math.min(...jobs.filter((j) => rem[j.id] > 0).map((j) => j.arrival));
      continue;
    }
    const job = ready[0];
    slots.push({ id: job.id, start: t, end: t + 1 });
    rem[job.id] -= 1;
    if (rem[job.id] === 0) done += 1;
    t += 1;
  }
  return finalize(tasks, slots);
}

export function DeadlinesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const jobs: Job[] = [
    { id: "J1", arrival: 0, work: 3, deadline: 7 },
    { id: "J2", arrival: 1, work: 2, deadline: 4 },
    { id: "J3", arrival: 2, work: 1, deadline: 5 },
  ];
  const schedule = edf(jobs);
  const horizon = 8;
  return (
    <SceneShell kicker={{ ja: "締切", en: "Deadlines" }} title={{ ja: "EDF は最早締切を選ぶ", en: "EDF picks the earliest deadline" }}>
      <GanttRow label={{ ja: "EDF", en: "EDF" }} schedule={schedule} y={286} at={cues[0] + 2} horizon={horizon} x={340} width={1040} highlight />
      <Svg>
        {jobs.map((job, i) => {
          const x = 340 + (job.deadline / horizon) * 1040;
          return (
            <g key={job.id} opacity={progress(frame, cues[0] + 18 + i * 5, 14)}>
              <line x1={x} x2={x} y1={248} y2={430} stroke={taskColor[job.id]} strokeWidth={4} strokeDasharray="9 9" />
              <text x={x + 8} y={244} fontFamily={fonts.mono} fontSize={26} fontWeight={800} fill={taskColor[job.id]}>
                d={job.deadline}
              </text>
            </g>
          );
        })}
      </Svg>
      <Abs x={1430} y={252} w={370} h={150} style={{ opacity: progress(frame, cues[1] + 4, 18) }}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 22, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: colors.tealDeep }}>{t({ ja: "前提", en: "Assumptions" })}</div>
          <div style={{ fontFamily: fonts.sans, fontSize: 24, marginTop: 8, lineHeight: 1.28 }}>{t({ ja: "独立・プリエンプティブ・単一CPU", en: "independent · preemptive · one CPU" })}</div>
        </Card>
      </Abs>
      <Abs x={180} y={510} w={1560} h={175}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box", display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          {jobs.map((job, i) => {
            const ok = schedule.completion[job.id] <= job.deadline;
            return (
              <div key={job.id} style={{ opacity: progress(frame, cues[1] + 18 + i * 8, 14), textAlign: "center" }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 38, fontWeight: 800, color: taskColor[job.id] }}>{job.id}</div>
                <div style={{ fontFamily: fonts.sans, fontSize: 27, marginTop: 8 }}>C={schedule.completion[job.id]} ≤ d={job.deadline}</div>
                <Chip tone={ok ? "teal" : "error"} size={23}>{ok ? t({ ja: "達成", en: "met" }) : t({ ja: "未達", en: "miss" })}</Chip>
              </div>
            );
          })}
        </Card>
      </Abs>
      <Abs x={230} y={735} w={1460} h={86} style={{ opacity: progress(frame, cues[0] + 28, 18) }}>
        <Card tone="white" accent={colors.amber} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <Chip tone="amber" size={27}>RM</Chip>
          <span style={{ fontFamily: fonts.sans, fontSize: 29, color: colors.body }}>{t({ ja: "周期が短いタスクほど高い固定優先度", en: "shorter period means higher fixed priority" })}</span>
        </Card>
      </Abs>
    </SceneShell>
  );
}

function strideSequence() {
  const tasks = [
    { id: "A", weight: 1, pass: 0, stride: 120 },
    { id: "B", weight: 2, pass: 0, stride: 60 },
    { id: "C", weight: 4, pass: 0, stride: 30 },
  ];
  const seq: { id: string; before: number; after: number }[] = [];
  for (let i = 0; i < 9; i++) {
    tasks.sort((a, b) => a.pass - b.pass || a.id.localeCompare(b.id));
    const t = tasks[0];
    seq.push({ id: t.id, before: t.pass, after: t.pass + t.stride });
    t.pass += t.stride;
  }
  return seq;
}

export function VirtualTimeScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const seq = strideSequence();
  const weights = [
    { id: "A", w: 1, color: colors.coral },
    { id: "B", w: 2, color: colors.teal },
    { id: "C", w: 4, color: colors.amber },
  ];
  return (
    <SceneShell kicker={{ ja: "比例配分", en: "Proportional share" }} title={{ ja: "仮想時間が遅いものを選ぶ", en: "Pick the slowest virtual time" }}>
      <Abs x={120} y={236} w={670} h={420}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "Stride", en: "Stride" })}</div>
          {weights.map((w, i) => (
            <div key={w.id} style={{ marginTop: 28, opacity: progress(frame, cues[1] + i * 4, 14) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, width: 42, color: w.color }}>{w.id}</span>
                <span style={{ fontFamily: fonts.sans, fontSize: 25, width: 130 }}>w={w.w}</span>
                <div style={{ position: "relative", width: 340, height: 28, borderRadius: 999, background: colors.surfaceSoft }}>
                  <div style={{ position: "absolute", left: 0, top: 0, height: 28, width: `${Math.max(20, 220 / w.w)}px`, borderRadius: 999, background: w.color }} />
                </div>
                <span style={{ fontFamily: fonts.mono, fontSize: 22 }}>stride={120 / w.w}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 34, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {seq.map((s, i) => (
              <div key={i} style={{ opacity: progress(frame, cues[1] + 22 + i * 5, 10), width: 54, height: 54, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: taskColor[s.id], color: s.id === "D" ? colors.onDark : colors.ink, fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>
                {s.id}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Abs x={860} y={222} w={940} h={315}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>CFS → EEVDF</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 26 }}>
            <div style={{ opacity: progress(frame, cues[1] + 32, 16) }}>
              <Chip tone="muted" size={24}>CFS</Chip>
              <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 27 }}>{t({ ja: "vruntime 最小で知られる", en: "known for minimum vruntime" })}</div>
              <div style={{ marginTop: 16, height: 46, borderRadius: 999, background: colors.surfaceCard, position: "relative" }}>
                <div style={{ position: "absolute", left: 34, top: -8, width: 60, height: 60, borderRadius: 999, background: colors.coral, border: `5px solid ${colors.canvas}` }} />
              </div>
            </div>
            <div style={{ opacity: progress(frame, cues[2] + 4, 16) }}>
              <Chip tone="teal" size={24}>Linux 6.6+ · EEVDF</Chip>
              <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 27 }}>{t({ ja: "適格タスクから仮想締切最小", en: "earliest virtual deadline among eligible tasks" })}</div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                {[
                  { id: "X", lag: "+", d: 12, on: true },
                  { id: "Y", lag: "-", d: 8, on: false },
                  { id: "Z", lag: "+", d: 9, on: true },
                ].map((r) => (
                  <div key={r.id} style={{ flex: 1, padding: 12, borderRadius: 12, background: r.on ? colors.tealSoft : colors.surfaceCard, border: `3px solid ${r.id === "Z" ? colors.teal : colors.hairlineStrong}`, fontFamily: fonts.mono, fontSize: 24, fontWeight: 700, opacity: r.on ? 1 : 0.45 }}>
                    {r.id} lag {r.lag}<br />vd={r.d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </Abs>
      <Abs x={860} y={590} w={940} h={255} style={{ opacity: progress(frame, cues[0] + 44, 18) }}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: colors.tealDeep }}>{t({ ja: "EEVDF の選択規則", en: "EEVDF selection rule" })}</div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 22, justifyContent: "center" }}>
            <Chip tone="teal" size={29}>{t({ ja: "公平な取り分より先行していない", en: "not ahead of fair share" })}</Chip>
            <span style={{ fontFamily: fonts.sans, fontSize: 44, color: colors.muted }}>→</span>
            <Chip tone="coral" size={29}>{t({ ja: "仮想締切が最も早い", en: "earliest virtual deadline" })}</Chip>
          </div>
          <div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 26, lineHeight: 1.32, color: colors.body, textAlign: "center" }}>
            {t({ ja: "CFS と同じ仮想時間の家系だが、適格性と締切を明示する。", en: "Same virtual-time family as CFS, but eligibility and deadlines are explicit." })}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function FairQueueingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const flows = [
    { id: "A", weight: 1, y: 292, color: colors.coral },
    { id: "B", weight: 2, y: 382, color: colors.teal },
    { id: "C", weight: 3, y: 472, color: colors.amber },
  ];
  return (
    <SceneShell kicker={{ ja: "公平キューイング", en: "Fair queueing" }} title={{ ja: "不可分なパケットを公平に流す", en: "Fair sharing with indivisible packets" }}>
      <Abs x={120} y={224} w={770} h={330}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>GPS</div>
          {flows.map((f, i) => (
            <div key={f.id} style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18, opacity: progress(frame, cues[1] + i * 5, 16) }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 800, color: f.color, width: 40 }}>{f.id}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 22, width: 72 }}>w={f.weight}</span>
              <div style={{ width: 500, height: 30, borderRadius: 999, background: colors.surfaceSoft, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${f.weight * 28}%`, background: f.color, borderRadius: 999 }} />
              </div>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={970} y={224} w={830} h={330}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>{t({ ja: "タグによる近似", en: "Tag approximations" })}</div>
          {[
            { label: "WFQ", tag: "min Fᵢᵏ", body: { ja: "完了タグを選ぶ", en: "select finish tag" }, color: colors.coral },
            { label: "SFQ", tag: "min Sᵢᵏ", body: { ja: "開始タグを選ぶ", en: "select start tag" }, color: colors.teal },
          ].map((r, i) => (
            <div key={r.label} style={{ marginTop: 28, display: "grid", gridTemplateColumns: "130px 180px 1fr", columnGap: 18, alignItems: "center", opacity: progress(frame, cues[2] + i * 10, 16) }}>
              <Chip tone={i ? "teal" : "coral"} size={26}>{r.label}</Chip>
              <span style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 800, color: r.color }}>{r.tag}</span>
              <span style={{ fontFamily: fonts.sans, fontSize: 28 }}>{t(r.body)}</span>
            </div>
          ))}
          <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>{t({ ja: "SFQ は選んでから長さが次回へ効く", en: "SFQ lets length affect the next turn" })}</div>
        </Card>
      </Abs>
      <Svg>
        {flows.map((f, i) => (
          <Packet key={f.id} x1={180} y1={f.y + 350} x2={1640} y2={f.y + 350} start={cues[0] + 20 + i * 18} dur={90 - i * 12} color={f.color} r={15} label={f.id} />
        ))}
      </Svg>
      <Abs x={120} y={690} w={1680} h={150} style={{ opacity: progress(frame, cues[0] + 44, 18) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: "26px 36px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Chip tone="amber" size={28}>DRR</Chip>
          <span style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.onDark }}>{t({ ja: "巡回 → 割当量 → 不足カウンター", en: "round visits → quantum → deficit counter" })}</span>
          <span style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.amber }}>O(1)</span>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function LlmSpecialScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "LLM", en: "LLM" }} title={{ ja: "長さは選択時に確定しない", en: "Length is unknown at selection time" }}>
      <Abs x={120} y={240} w={520} h={330}>
        <Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "入力", en: "Input" })}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
            {Array.from({ length: 18 }, (_, i) => (
              <span key={i} style={{ width: 42, height: 34, borderRadius: 7, background: colors.tealSoft, border: `2px solid ${colors.teal}`, opacity: progress(frame, cues[0] + i * 2, 10) }} />
            ))}
          </div>
          <Chip tone="teal" size={24} style={{ marginTop: 28 }}>{t({ ja: "既知", en: "known" })}</Chip>
        </Card>
      </Abs>
      <Abs x={700} y={240} w={520} h={330}>
        <Card tone="white" accent={colors.amber} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "出力", en: "Output" })}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} style={{ width: 36, height: 34, borderRadius: 7, background: i < 10 ? colors.amberSoft : colors.surfaceSoft, border: `2px solid ${i < 10 ? colors.amber : colors.hairlineStrong}`, opacity: i < 10 ? progress(frame, cues[0] + 32 + i * 4, 10) : 0.55 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            <Chip tone="amber" size={23}>max_tokens</Chip>
            <Chip tone="muted" size={23}>{t({ ja: "上限だけ", en: "only a cap" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={1280} y={240} w={520} h={330}>
        <Card tone="white" accent={colors.coralDeep} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "予測器が必要", en: "Needs predictor" })}</div>
          <div style={{ fontFamily: fonts.sans, fontSize: 30, lineHeight: 1.45, marginTop: 32, color: colors.body }}>
            SJF / WFQ<br />→ {t({ ja: "入力 + 出力予測", en: "input + predicted output" })}
          </div>
        </Card>
      </Abs>
      <Abs x={120} y={625} w={1680} h={215}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.1fr 1fr", gap: 22, height: "100%" }}>
            {[
              { title: { ja: "プリフィル", en: "Prefill" }, body: { ja: "プロンプトを並列処理", en: "parallel prompt processing" }, color: colors.coral, cue: 2 },
              { title: { ja: "デコード", en: "Decode" }, body: { ja: "1トークンずつ生成 + KV読み取り", en: "one token at a time + KV reads" }, color: colors.teal, cue: 2 },
              { title: { ja: "層を分ける", en: "Layer matters" }, body: { ja: "外は不可分、内は反復境界で組み替え", en: "outer indivisible; inner can regroup" }, color: colors.amber, cue: 3 },
            ].map((c, i) => (
              <div key={c.title.en} style={{ opacity: progress(frame, cues[c.cue] + i * 5, 16), borderRadius: 18, background: "#fff", border: `3px solid ${c.color}`, padding: 22 }}>
                <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>{t(c.title)}</div>
                <div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.35 }}>{t(c.body)}</div>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

type Request = { tenant: string; cost: number };

function sfqOrder(requests: Record<string, Request[]>) {
  const queues: Record<string, Request[]> = Object.fromEntries(Object.entries(requests).map(([k, v]) => [k, [...v]]));
  const meters: Record<string, number> = Object.fromEntries(Object.keys(requests).map((k) => [k, 0]));
  const out: { tenant: string; cost: number; before: number; after: number }[] = [];
  while (Object.values(queues).some((q) => q.length)) {
    const active = Object.keys(queues).filter((k) => queues[k].length);
    active.sort((a, b) => meters[a] - meters[b] || a.localeCompare(b));
    const tenant = active[0];
    const req = queues[tenant].shift()!;
    const before = meters[tenant];
    meters[tenant] += req.cost;
    out.push({ tenant, cost: req.cost, before, after: meters[tenant] });
  }
  return out;
}

export function RouterSfqScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const requests = {
    A: [{ tenant: "A", cost: 8 }, { tenant: "A", cost: 8 }, { tenant: "A", cost: 8 }],
    B: [{ tenant: "B", cost: 2 }, { tenant: "B", cost: 2 }, { tenant: "B", cost: 2 }, { tenant: "B", cost: 2 }, { tenant: "B", cost: 2 }],
    C: [{ tenant: "C", cost: 4 }, { tenant: "C", cost: 4 }],
  };
  const order = sfqOrder(requests);
  const visible = Math.min(order.length, Math.max(0, Math.floor((frame - (cues[1] + 8)) / 10) + 1));
  const charged: Record<string, number> = { A: 0, B: 0, C: 0 };
  order.slice(0, visible).forEach((o) => (charged[o.tenant] += o.cost));
  return (
    <SceneShell kicker={{ ja: "ルーター層", en: "Router layer" }} title={{ ja: "SFQ は選んでから課金する", en: "SFQ selects, then charges" }}>
      <Abs x={120} y={230} w={520} h={430}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "テナント別 FIFO", en: "Per-tenant FIFO" })}</div>
          {Object.entries(requests).map(([tenant, reqs], i) => (
            <div key={tenant} style={{ marginTop: 30, opacity: progress(frame, cues[0] + i * 5, 14), display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 34, fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, color: taskColor[tenant] }}>{tenant}</span>
              {reqs.map((r, j) => (
                <div key={j} style={{ width: 58 + r.cost * 4, height: 46, borderRadius: 9, background: mixColor("#fff", taskColor[tenant], 0.28), border: `3px solid ${taskColor[tenant]}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 22, fontWeight: 800 }}>
                  {r.cost}
                </div>
              ))}
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={700} y={230} w={1100} h={258}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>{t({ ja: "投入順序", en: "Admission order" })}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {order.map((o, i) => (
              <div key={i} style={{ width: 86, height: 86, borderRadius: 16, opacity: i < visible ? 1 : 0.18, background: taskColor[o.tenant], color: o.tenant === "D" ? colors.onDark : colors.ink, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontWeight: 800 }}>
                <span style={{ fontSize: 30 }}>{o.tenant}</span>
                <span style={{ fontSize: 22 }}>+{o.cost}</span>
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Abs x={700} y={525} w={1100} h={315}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>{t({ ja: "メーター", en: "Meters" })}</div>
          {(["A", "B", "C"] as const).map((id, i) => (
            <div key={id} style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ width: 40, fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, color: taskColor[id] }}>{id}</span>
              <div style={{ width: 760, height: 38, borderRadius: 999, background: colors.surfaceSoft, position: "relative" }}>
                <div style={{ width: `${Math.min(100, (charged[id] / 24) * 100)}%`, height: "100%", borderRadius: 999, background: taskColor[id] }} />
              </div>
              <span style={{ fontFamily: fonts.mono, fontSize: 27, width: 70 }}>{charged[id]}</span>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={120} y={700} w={520} h={140} style={{ opacity: progress(frame, cues[3] + 4, 18) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.35, color: colors.onDark }}>
            {t({ ja: "復帰時は M = max(M, V)。アイドル中の権利は貯めない。", en: "On return: M = max(M, V). No idle credit is banked." })}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function EngineLocalityScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const counters = [
    { id: "A", input: 5, outputs: [1, 1, 1], color: colors.coral },
    { id: "B", input: 3, outputs: [1, 1], color: colors.teal },
    { id: "C", input: 7, outputs: [1], color: colors.amber },
  ];
  const vtcStep = Math.max(0, Math.floor((frame - (cues[1] + 6)) / 16));
  return (
    <SceneShell kicker={{ ja: "エンジン内", en: "Inside the engine" }} title={{ ja: "未知の出力は、出た分だけ課金する", en: "Charge unknown output as it appears" }}>
      <Abs x={120} y={230} w={760} h={430}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>VTC</div>
            <Chip tone="teal" size={24}>{t({ ja: "仮想トークンカウンター", en: "Virtual Token Counter" })}</Chip>
          </div>
          {counters.map((c, i) => {
            const out = Math.min(c.outputs.length, Math.max(0, vtcStep - i));
            const total = c.input + out;
            return (
              <div key={c.id} style={{ marginTop: 30, opacity: progress(frame, cues[0] + i * 5, 14), display: "grid", gridTemplateColumns: "52px 1fr 80px", gap: 16, alignItems: "center" }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 32, fontWeight: 800, color: c.color }}>{c.id}</span>
                <div style={{ height: 44, borderRadius: 999, background: colors.surfaceSoft, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${c.input * 32}px`, background: mixColor("#fff", c.color, 0.42) }} />
                  <div style={{ width: `${out * 32}px`, background: c.color }} />
                </div>
                <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 800 }}>{total}</span>
              </div>
            );
          })}
          <div style={{ marginTop: 32, display: "flex", gap: 14, opacity: progress(frame, cues[2] + 2, 16) }}>
            <Chip tone="teal" size={24}>{t({ ja: "最小カウンターを優先", en: "favor smallest counter" })}</Chip>
            <Chip tone="muted" size={24}>{t({ ja: "出力を逐次観測", en: "observe generated output" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={960} y={230} w={840} h={275}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>DLPM</div>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            <div>
              <Chip tone="coral" size={24}>{t({ ja: "公平順序", en: "fair order" })}</Chip>
              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                {["A", "B", "A", "C"].map((id, i) => (
                  <div key={i} style={{ width: 58, height: 58, borderRadius: 12, background: taskColor[id], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 800 }}>{id}</div>
                ))}
              </div>
            </div>
            <div style={{ opacity: progress(frame, cues[4] + 2, 18) }}>
              <Chip tone="teal" size={24}>{t({ ja: "接頭辞一致を優先", en: "prefer prefix match" })}</Chip>
              <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
                {["A", "A", "B", "C"].map((id, i) => (
                  <div key={i} style={{ width: 58, height: 58, borderRadius: 12, background: taskColor[id], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 800 }}>{id}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </Abs>
      <Abs x={960} y={545} w={840} h={295} style={{ opacity: progress(frame, cues[0] + 52, 18) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600, color: colors.onDark }}>Equinox</div>
          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {[
              { ja: "遅延", en: "latency" },
              { ja: "スループット", en: "throughput" },
              { ja: "GPU稼働率", en: "GPU utilization" },
            ].map((m, i) => (
              <div key={m.en} style={{ height: 120, borderRadius: 16, background: colors.darkElevated, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: i === 0 ? colors.coral : i === 1 ? colors.teal : colors.amber }}>
                {t(m)}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, fontFamily: fonts.sans, fontSize: 24, color: colors.onDarkSoft }}>{t({ ja: "1つのトークン指標では足りないという問題提起", en: "one token metric is not enough" })}</div>
        </Card>
      </Abs>
      <Abs x={120} y={705} w={760} h={135} style={{ opacity: progress(frame, cues[0] + 58, 18) }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: colors.body, textAlign: "center" }}>
            {t({ ja: "SFQ は上流の投入順序、VTC は下流の実行公平性。併用できる。", en: "SFQ orders upstream admission; VTC controls downstream execution fairness. They can be combined." })}
          </span>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <EndCard slug="task-scheduling-algorithms" headline={{ ja: "名前ではなく、目的・課金単位・層から選ぶ。", en: "Choose from goal, charge unit, and layer—not by name." }}>
      <div style={{ display: "flex", gap: 18, marginTop: 42, opacity: progress(frame, 18, 18) }}>
        <Chip tone="coral" size={27}>{t({ ja: "CPU ラボ", en: "CPU lab" })}</Chip>
        <Chip tone="teal" size={27}>{t({ ja: "LLM ラボ", en: "LLM lab" })}</Chip>
        <Chip tone="amber" size={27}>{t({ ja: "インタラクティブデモ", en: "interactive demos" })}</Chip>
      </div>
    </EndCard>
  );
}
