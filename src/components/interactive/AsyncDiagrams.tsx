"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Concurrency model taxonomy ─────────────── */

export function ConcurrencyTaxonomy({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const purple = dark ? "#8b5cf6" : "#7c3aed";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const models = [
    {
      x: 20,
      color: accent,
      label: locale === "en" ? "Multi-threading" : "マルチスレッド",
      desc: locale === "en" ? "OS threads, preemptive" : "OSスレッド、プリエンプティブ",
      langs: "Java, C++, C#",
    },
    {
      x: 200,
      color: green,
      label: locale === "en" ? "Event Loop" : "イベントループ",
      desc: locale === "en" ? "Single-threaded, non-blocking" : "シングルスレッド、ノンブロッキング",
      langs: "JavaScript, Dart",
    },
    {
      x: 380,
      color: purple,
      label: locale === "en" ? "Coroutines" : "コルーチン",
      desc: locale === "en" ? "Cooperative scheduling" : "協調的スケジューリング",
      langs: "Python, Kotlin, Rust",
    },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 560 180" className="w-full max-w-lg">
        <text x={280} y={22} textAnchor="middle" fill={text} fontSize={14} fontWeight={700}>
          {locale === "en" ? "Concurrency Models" : "並行処理モデル"}
        </text>
        {models.map((m, i) => (
          <g key={i}>
            <rect x={m.x} y={40} width={150} height={44} rx={8} fill={m.color} opacity={0.15} stroke={m.color} strokeWidth={1.5} />
            <text x={m.x + 75} y={60} textAnchor="middle" fill={m.color} fontSize={13} fontWeight={600}>
              {m.label}
            </text>
            <text x={m.x + 75} y={76} textAnchor="middle" fill={muted} fontSize={9}>
              {m.desc}
            </text>
            <text x={m.x + 75} y={106} textAnchor="middle" fill={text} fontSize={11}>
              {m.langs}
            </text>
            {/* async/await support indicator */}
            <rect x={m.x + 25} y={115} width={100} height={20} rx={4} fill={bg} stroke={border} strokeWidth={0.5} />
            <text x={m.x + 75} y={129} textAnchor="middle" fill={muted} fontSize={9}>
              async/await ✓
            </text>
          </g>
        ))}
        <text x={280} y={160} textAnchor="middle" fill={muted} fontSize={10}>
          {locale === "en"
            ? "async/await syntax works across all three models"
            : "async/await構文は3つのモデルすべてで使える"}
        </text>
      </svg>
    </div>
  );
}

/* ── 2. Event loop cycle diagram ───────────────── */

export function EventLoopCycle({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const border = dark ? "#404040" : "#d4d4d4";
  const green = dark ? "#10b981" : "#059669";
  const purple = dark ? "#8b5cf6" : "#7c3aed";
  const amber = dark ? "#f59e0b" : "#d97706";
  const blue = dark ? "#3b82f6" : "#2563eb";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const bg = dark ? "#1a1a1a" : "#fafafa";

  const cx = 220;
  const cy = 130;
  const r = 80;

  const phases = [
    { angle: -90, color: green, label: locale === "en" ? "1. Run stack" : "1. スタック実行" },
    { angle: 0, color: purple, label: locale === "en" ? "2. Microtasks" : "2. マイクロタスク" },
    { angle: 90, color: amber, label: locale === "en" ? "3. One macrotask" : "3. マクロタスク1つ" },
    { angle: 180, color: blue, label: locale === "en" ? "4. Render?" : "4. レンダリング?" },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 440 270" className="w-full max-w-md">
        <text x={220} y={22} textAnchor="middle" fill={text} fontSize={14} fontWeight={700}>
          {locale === "en" ? "Event Loop Cycle" : "イベントループのサイクル"}
        </text>

        {/* Cycle circle */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={border} strokeWidth={1.5} strokeDasharray="8 4" />

        {/* Arrow showing direction */}
        <path
          d={`M ${cx} ${cy - r + 6} A ${r - 6} ${r - 6} 0 1 1 ${cx - 6} ${cy - r + 8}`}
          fill="none"
          stroke={border}
          strokeWidth={1}
          markerEnd="url(#cycleArrow)"
        />

        {/* Phase nodes */}
        {phases.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const px = cx + r * Math.cos(rad);
          const py = cy + r * Math.sin(rad);
          const labelX = cx + (r + 65) * Math.cos(rad);
          const labelY = cy + (r + 65) * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={px} cy={py} r={14} fill={p.color} opacity={0.2} stroke={p.color} strokeWidth={2} />
              <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="middle" fill={p.color} fontSize={11} fontWeight={700}>
                {i + 1}
              </text>
              <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill={text} fontSize={10} fontWeight={500}>
                {p.label}
              </text>
            </g>
          );
        })}

        {/* Key note */}
        <rect x={60} y={230} width={320} height={28} rx={6} fill={bg} stroke={purple} strokeWidth={1} />
        <text x={220} y={248} textAnchor="middle" fill={purple} fontSize={10} fontWeight={500}>
          {locale === "en"
            ? "Microtasks run to exhaustion before any macrotask"
            : "マイクロタスクはマクロタスクより常に先にすべて実行される"}
        </text>

        <defs>
          <marker id="cycleArrow" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill={border} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── 3. Coroutine state machine ────────────────── */

export function CoroutineStateMachine({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const amber = dark ? "#f59e0b" : "#d97706";
  const red = dark ? "#ef4444" : "#dc2626";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const states = [
    { x: 40, y: 50, label: locale === "en" ? "Created" : "生成済み", color: border },
    { x: 200, y: 50, label: locale === "en" ? "Running" : "実行中", color: green },
    { x: 360, y: 50, label: locale === "en" ? "Suspended" : "中断中", color: amber },
    { x: 200, y: 150, label: locale === "en" ? "Completed" : "完了", color: accent },
  ];

  const transitions = [
    { from: 0, to: 1, label: "start/resume" },
    { from: 1, to: 2, label: "await (yield)" },
    { from: 2, to: 1, label: "resume" },
    { from: 1, to: 3, label: "return / throw" },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 480 210" className="w-full max-w-md">
        <text x={240} y={22} textAnchor="middle" fill={text} fontSize={14} fontWeight={700}>
          {locale === "en" ? "Coroutine State Machine" : "コルーチンの状態遷移"}
        </text>

        {/* States */}
        {states.map((s, i) => (
          <g key={i}>
            <rect x={s.x} y={s.y} width={110} height={36} rx={8} fill={bg} stroke={s.color} strokeWidth={2} />
            <text x={s.x + 55} y={s.y + 22} textAnchor="middle" fill={text} fontSize={12} fontWeight={600}>
              {s.label}
            </text>
          </g>
        ))}

        {/* Transitions */}
        {/* Created → Running */}
        <line x1={150} y1={68} x2={198} y2={68} stroke={border} strokeWidth={1.5} markerEnd="url(#stateArr)" />
        <text x={174} y={60} textAnchor="middle" fill={muted} fontSize={8}>start</text>

        {/* Running → Suspended */}
        <line x1={310} y1={60} x2={358} y2={60} stroke={amber} strokeWidth={1.5} markerEnd="url(#stateArr)" />
        <text x={334} y={52} textAnchor="middle" fill={amber} fontSize={8}>await</text>

        {/* Suspended → Running */}
        <line x1={358} y1={80} x2={310} y2={80} stroke={green} strokeWidth={1.5} markerEnd="url(#stateArr)" />
        <text x={334} y={96} textAnchor="middle" fill={green} fontSize={8}>resume</text>

        {/* Running → Completed */}
        <line x1={255} y1={86} x2={255} y2={148} stroke={accent} strokeWidth={1.5} markerEnd="url(#stateArr)" />
        <text x={275} y={120} fill={accent} fontSize={8}>return</text>

        <defs>
          <marker id="stateArr" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill={border} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── 4. Language comparison table ───────────────── */

export function AsyncComparison({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const purple = dark ? "#8b5cf6" : "#7c3aed";
  const amber = dark ? "#f59e0b" : "#d97706";

  const langs = [
    {
      name: "JavaScript",
      runtime: locale === "en" ? "Event Loop (V8)" : "イベントループ (V8)",
      syntax: "async/await, Promise",
      model: locale === "en" ? "Single-threaded" : "シングルスレッド",
      color: amber,
    },
    {
      name: "Python",
      runtime: "asyncio",
      syntax: "async/await, coroutine",
      model: locale === "en" ? "Single-threaded" : "シングルスレッド",
      color: green,
    },
    {
      name: "Rust",
      runtime: "tokio / async-std",
      syntax: "async/await, Future",
      model: locale === "en" ? "Multi-threaded runtime" : "マルチスレッドランタイム",
      color: accent,
    },
    {
      name: "C#",
      runtime: "Task / ThreadPool",
      syntax: "async/await, Task",
      model: locale === "en" ? "Multi-threaded" : "マルチスレッド",
      color: purple,
    },
    {
      name: "Kotlin",
      runtime: "Dispatchers",
      syntax: "suspend, coroutine",
      model: locale === "en" ? "Structured concurrency" : "構造化並行性",
      color: green,
    },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 580 220" className="w-full max-w-xl">
        <text x={290} y={20} textAnchor="middle" fill={text} fontSize={13} fontWeight={700}>
          {locale === "en" ? "async/await Across Languages" : "言語ごとのasync/await実装"}
        </text>
        {/* Header */}
        {[
          { x: 20, label: locale === "en" ? "Language" : "言語" },
          { x: 120, label: locale === "en" ? "Runtime" : "ランタイム" },
          { x: 280, label: locale === "en" ? "Syntax" : "構文" },
          { x: 440, label: locale === "en" ? "Model" : "モデル" },
        ].map((h, i) => (
          <text key={i} x={h.x} y={46} fill={muted} fontSize={10} fontWeight={600}>
            {h.label}
          </text>
        ))}
        <line x1={10} y1={52} x2={570} y2={52} stroke={border} strokeWidth={0.5} />

        {langs.map((lang, i) => {
          const y = 72 + i * 28;
          return (
            <g key={i}>
              <circle cx={14} cy={y - 4} r={4} fill={lang.color} opacity={0.6} />
              <text x={24} y={y} fill={text} fontSize={11} fontWeight={500}>{lang.name}</text>
              <text x={120} y={y} fill={muted} fontSize={10}>{lang.runtime}</text>
              <text x={280} y={y} fill={muted} fontSize={10}>{lang.syntax}</text>
              <text x={440} y={y} fill={muted} fontSize={10}>{lang.model}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
