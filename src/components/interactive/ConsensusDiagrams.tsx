"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ═══════════════════════════════════════════════════════════
   1. ConsensusTimeline — Evolution from 2PC to Byzantine
   ═══════════════════════════════════════════════════════════ */

export function ConsensusTimeline({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const isEn = locale === "en";

  const milestones = [
    { year: "1978", name: "2PC", color: "#6366f1", desc: isEn ? "Gray" : "Gray" },
    { year: "1982", name: isEn ? "BGP" : "BGP", color: "#ef4444", desc: "Lamport+" },
    { year: "1989", name: "Paxos", color: "#3b82f6", desc: "Lamport" },
    { year: "1999", name: "PBFT", color: "#f59e0b", desc: "Castro+Liskov" },
    { year: "2014", name: "Raft", color: "#22c55e", desc: "Ongaro+Ousterhout" },
  ];

  const w = 600;
  const h = 140;
  const lineY = 70;
  const startX = 60;
  const gap = (w - 120) / (milestones.length - 1);

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-2xl">
        <rect width={w} height={h} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        {/* Timeline line */}
        <line x1={30} y1={lineY} x2={w - 30} y2={lineY} stroke={border} strokeWidth={2} />

        {/* Arrow at end */}
        <polygon points={`${w - 30},${lineY} ${w - 38},${lineY - 5} ${w - 38},${lineY + 5}`} fill={border} />

        {milestones.map((m, i) => {
          const x = startX + i * gap;
          return (
            <g key={i}>
              <circle cx={x} cy={lineY} r={6} fill={m.color} />
              <text x={x} y={lineY - 20} textAnchor="middle" fill={m.color} fontSize={12} fontWeight={700}>
                {m.name}
              </text>
              <text x={x} y={lineY + 22} textAnchor="middle" fill={muted} fontSize={9}>
                {m.year}
              </text>
              <text x={x} y={lineY + 34} textAnchor="middle" fill={muted} fontSize={8}>
                {m.desc}
              </text>
            </g>
          );
        })}

        {/* Labels for regions */}
        <text x={startX + gap * 0.5} y={h - 8} textAnchor="middle" fill={muted} fontSize={8}>
          {isEn ? "Crash fault tolerance" : "クラッシュ障害耐性"}
        </text>
        <text x={startX + gap * 3} y={h - 8} textAnchor="middle" fill={muted} fontSize={8}>
          {isEn ? "Byzantine fault tolerance" : "ビザンチン障害耐性"}
        </text>

        {/* Divider */}
        <line x1={startX + gap * 1.5} y1={lineY + 40} x2={startX + gap * 1.5} y2={h - 2} stroke={border} strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. TwoPhaseCommitDiagram — 2PC sequence
   ═══════════════════════════════════════════════════════════ */

export function TwoPhaseCommitDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const blue = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const isEn = locale === "en";

  const coordX = 100;
  const p1X = 300;
  const p2X = 500;
  const phases = [
    { y: 55, label: isEn ? "Phase 1: Prepare" : "Phase 1: Prepare", color: blue },
    { y: 115, label: isEn ? "Phase 2: Commit" : "Phase 2: Commit", color: green },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 600 180" className="w-full max-w-2xl">
        <rect width={600} height={180} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        {/* Lifelines */}
        {[coordX, p1X, p2X].map((x) => (
          <line key={x} x1={x} y1={35} x2={x} y2={170} stroke={border} strokeDasharray="4 3" />
        ))}

        {/* Participants */}
        <text x={coordX} y={20} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          {isEn ? "Coordinator" : "Coordinator"}
        </text>
        <text x={p1X} y={20} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          {isEn ? "Participant A" : "参加者 A"}
        </text>
        <text x={p2X} y={20} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          {isEn ? "Participant B" : "参加者 B"}
        </text>

        {/* Phase 1: Prepare → Vote Yes */}
        <line x1={coordX} y1={50} x2={p1X} y2={60} stroke={blue} strokeWidth={1.5} markerEnd="url(#arrowBlue)" />
        <line x1={coordX} y1={50} x2={p2X} y2={60} stroke={blue} strokeWidth={1.5} markerEnd="url(#arrowBlue)" />
        <text x={(coordX + p1X) / 2} y={48} textAnchor="middle" fill={blue} fontSize={9}>Prepare</text>

        <line x1={p1X} y1={75} x2={coordX} y2={85} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <line x1={p2X} y1={75} x2={coordX} y2={85} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <text x={(coordX + p1X) / 2} y={80} textAnchor="middle" fill={green} fontSize={9}>
          {isEn ? "Vote Yes" : "Vote Yes"}
        </text>

        {/* Phase 2: Commit → Ack */}
        <line x1={coordX} y1={110} x2={p1X} y2={120} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <line x1={coordX} y1={110} x2={p2X} y2={120} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <text x={(coordX + p1X) / 2} y={108} textAnchor="middle" fill={green} fontSize={9}>Commit</text>

        <line x1={p1X} y1={135} x2={coordX} y2={145} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <line x1={p2X} y1={135} x2={coordX} y2={145} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <text x={(coordX + p1X) / 2} y={143} textAnchor="middle" fill={green} fontSize={9}>Ack</text>

        {/* Phase labels */}
        {phases.map((p) => (
          <text key={p.y} x={15} y={p.y} fill={p.color} fontSize={8} fontWeight={600} transform={`rotate(-90 15 ${p.y})`}>
            {p.label}
          </text>
        ))}

        <defs>
          <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={blue} />
          </marker>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={green} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. ConsensusComparisonTable — Comparison table
   ═══════════════════════════════════════════════════════════ */

export function ConsensusComparisonTable({ locale = "ja" }: DiagramProps) {
  const isEn = locale === "en";

  const headers = isEn
    ? ["Algorithm", "Fault Model", "Tolerance", "Msg Complexity", "Latency", "Use Case"]
    : ["アルゴリズム", "障害モデル", "耐性", "メッセージ計算量", "レイテンシ", "用途"];

  const rows = [
    {
      name: "2PC",
      color: "#6366f1",
      cols: [isEn ? "Crash" : "クラッシュ", "0", "O(n)", isEn ? "2 rounds" : "2ラウンド", isEn ? "Databases" : "データベース"],
    },
    {
      name: "Paxos",
      color: "#3b82f6",
      cols: [isEn ? "Crash" : "クラッシュ", "f < n/2", "O(n)", isEn ? "2 rounds" : "2ラウンド", isEn ? "Chubby, Spanner" : "Chubby, Spanner"],
    },
    {
      name: "Raft",
      color: "#22c55e",
      cols: [isEn ? "Crash" : "クラッシュ", "f < n/2", "O(n)", isEn ? "2 rounds" : "2ラウンド", isEn ? "etcd, CockroachDB" : "etcd, CockroachDB"],
    },
    {
      name: "PBFT",
      color: "#f59e0b",
      cols: [isEn ? "Byzantine" : "ビザンチン", "f < n/3", "O(n²)", isEn ? "3 rounds" : "3ラウンド", isEn ? "Blockchain" : "ブロックチェーン"],
    },
  ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-3 text-left font-semibold text-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/50">
              <td className="py-2 px-3 font-semibold" style={{ color: row.color }}>{row.name}</td>
              {row.cols.map((c, i) => (
                <td key={i} className="py-2 px-3 text-muted-foreground">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   4. FLPDiagram — FLP impossibility visualization
   ═══════════════════════════════════════════════════════════ */

export function FLPDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const red = dark ? "#ef4444" : "#dc2626";
  const blue = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const isEn = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 440 220" className="w-full max-w-md">
        <rect width={440} height={220} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        <text x={220} y={22} textAnchor="middle" fill={text} fontSize={12} fontWeight={700}>
          {isEn ? "FLP Impossibility (1985)" : "FLP 不可能性定理 (1985)"}
        </text>

        {/* Triangle of guarantees */}
        <polygon points="220,50 80,185 360,185" fill="none" stroke={border} strokeWidth={1.5} />

        {/* Vertices */}
        {[
          { x: 220, y: 42, label: isEn ? "Safety" : "安全性", color: blue, desc: isEn ? "Correct result" : "正しい結果" },
          { x: 65, y: 195, label: isEn ? "Liveness" : "活性", color: green, desc: isEn ? "Eventually terminates" : "いつか完了" },
          { x: 365, y: 195, label: isEn ? "Fault Tolerance" : "障害耐性", color: red, desc: isEn ? "Survives crashes" : "クラッシュに耐える" },
        ].map((v, i) => (
          <g key={i}>
            <circle cx={v.x} cy={v.y} r={5} fill={v.color} />
            <text x={v.x} y={v.y - 12} textAnchor="middle" fill={v.color} fontSize={11} fontWeight={600}>{v.label}</text>
            <text x={v.x} y={v.y + (i === 0 ? -24 : 16)} textAnchor="middle" fill={muted} fontSize={8}>{v.desc}</text>
          </g>
        ))}

        {/* Center text */}
        <text x={220} y={140} textAnchor="middle" fill={red} fontSize={10} fontWeight={600}>
          {isEn ? "Cannot have all 3" : "3つ同時は不可能"}
        </text>
        <text x={220} y={155} textAnchor="middle" fill={muted} fontSize={8}>
          {isEn ? "in async model with even 1 crash" : "非同期モデルで1台でもクラッシュがあると"}
        </text>
      </svg>
    </div>
  );
}
