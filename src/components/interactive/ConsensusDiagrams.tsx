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

  const coordX = 150;
  const p1X = 320;
  const p2X = 490;

  /* y positions for each message row */
  const y1 = 70;   /* Prepare */
  const y2 = 115;  /* Vote Yes */
  const y3 = 175;  /* Commit */
  const y4 = 220;  /* Ack */

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 560 260" className="w-full max-w-2xl">
        <rect width={560} height={260} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        {/* Lifelines */}
        {[coordX, p1X, p2X].map((x) => (
          <line key={x} x1={x} y1={40} x2={x} y2={250} stroke={border} strokeDasharray="4 3" />
        ))}

        {/* Participant headers */}
        <text x={coordX} y={24} textAnchor="middle" fill={text} fontSize={12} fontWeight={600}>
          Coordinator
        </text>
        <text x={p1X} y={24} textAnchor="middle" fill={text} fontSize={12} fontWeight={600}>
          {isEn ? "Participant A" : "参加者 A"}
        </text>
        <text x={p2X} y={24} textAnchor="middle" fill={text} fontSize={12} fontWeight={600}>
          {isEn ? "Participant B" : "参加者 B"}
        </text>

        {/* Phase 1 label */}
        <text x={40} y={93} textAnchor="middle" fill={blue} fontSize={10} fontWeight={600}>Phase 1</text>

        {/* Phase 1: Prepare */}
        <line x1={coordX} y1={y1} x2={p1X} y2={y1} stroke={blue} strokeWidth={1.5} markerEnd="url(#arrowBlue)" />
        <line x1={coordX} y1={y1 + 4} x2={p2X} y2={y1 + 4} stroke={blue} strokeWidth={1.5} markerEnd="url(#arrowBlue)" />
        <text x={(coordX + p1X) / 2} y={y1 - 8} textAnchor="middle" fill={blue} fontSize={10}>Prepare</text>

        {/* Phase 1: Vote Yes */}
        <line x1={p1X} y1={y2} x2={coordX} y2={y2} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <line x1={p2X} y1={y2 + 4} x2={coordX} y2={y2 + 4} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <text x={(coordX + p1X) / 2} y={y2 - 8} textAnchor="middle" fill={green} fontSize={10}>Vote Yes</text>

        {/* Phase divider */}
        <line x1={70} y1={145} x2={530} y2={145} stroke={border} strokeDasharray="6 4" strokeWidth={0.5} />

        {/* Phase 2 label */}
        <text x={40} y={198} textAnchor="middle" fill={green} fontSize={10} fontWeight={600}>Phase 2</text>

        {/* Phase 2: Commit */}
        <line x1={coordX} y1={y3} x2={p1X} y2={y3} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <line x1={coordX} y1={y3 + 4} x2={p2X} y2={y3 + 4} stroke={green} strokeWidth={1.5} markerEnd="url(#arrowGreen)" />
        <text x={(coordX + p1X) / 2} y={y3 - 8} textAnchor="middle" fill={green} fontSize={10}>Commit</text>

        {/* Phase 2: Ack */}
        <line x1={p1X} y1={y4} x2={coordX} y2={y4} stroke={muted} strokeWidth={1.5} markerEnd="url(#arrowMuted)" />
        <line x1={p2X} y1={y4 + 4} x2={coordX} y2={y4 + 4} stroke={muted} strokeWidth={1.5} markerEnd="url(#arrowMuted)" />
        <text x={(coordX + p1X) / 2} y={y4 - 8} textAnchor="middle" fill={muted} fontSize={10}>Ack</text>

        <defs>
          <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={blue} />
          </marker>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={green} />
          </marker>
          <marker id="arrowMuted" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={muted} />
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
      <svg viewBox="0 0 440 260" className="w-full max-w-md">
        <rect width={440} height={260} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        <text x={220} y={24} textAnchor="middle" fill={text} fontSize={12} fontWeight={700}>
          {isEn ? "FLP Impossibility (1985)" : "FLP 不可能性定理 (1985)"}
        </text>

        {/* Triangle of guarantees */}
        <polygon points="220,90 80,225 360,225" fill="none" stroke={border} strokeWidth={1.5} />

        {/* Vertices */}
        {[
          { x: 220, y: 82, label: isEn ? "Safety" : "安全性", color: blue, desc: isEn ? "Correct result" : "正しい結果" },
          { x: 65, y: 235, label: isEn ? "Liveness" : "活性", color: green, desc: isEn ? "Eventually terminates" : "いつか完了" },
          { x: 365, y: 235, label: isEn ? "Fault Tolerance" : "障害耐性", color: red, desc: isEn ? "Survives crashes" : "クラッシュに耐える" },
        ].map((v, i) => (
          <g key={i}>
            <circle cx={v.x} cy={v.y} r={5} fill={v.color} />
            <text x={v.x} y={v.y - 12} textAnchor="middle" fill={v.color} fontSize={11} fontWeight={600}>{v.label}</text>
            <text x={v.x} y={v.y + (i === 0 ? -24 : 16)} textAnchor="middle" fill={muted} fontSize={8}>{v.desc}</text>
          </g>
        ))}

        {/* Center text */}
        <text x={220} y={170} textAnchor="middle" fill={red} fontSize={10} fontWeight={600}>
          {isEn ? "Cannot have all 3" : "3つ同時は不可能"}
        </text>
        <text x={220} y={185} textAnchor="middle" fill={muted} fontSize={8}>
          {isEn ? "in async model with even 1 crash" : "非同期モデルで1台でもクラッシュがあると"}
        </text>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   5. RaftStateTransition — Raft node state diagram
   ═══════════════════════════════════════════════════════════ */

export function RaftStateTransition({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const blue = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const amber = dark ? "#f59e0b" : "#d97706";
  const isEn = locale === "en";

  const fX = 90, cX = 270, lX = 450;
  const midY = 80;
  const boxW = 100, boxH = 36;
  const boxTop = midY - boxH / 2;
  const boxBot = midY + boxH / 2;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 540 190" className="w-full max-w-2xl">
        <rect width={540} height={190} rx={8} fill={bg} stroke={border} strokeWidth={1} />

        {/* State boxes */}
        {[
          { x: fX, label: "Follower", color: blue },
          { x: cX, label: "Candidate", color: amber },
          { x: lX, label: "Leader", color: green },
        ].map((s) => (
          <g key={s.label}>
            <rect x={s.x - boxW / 2} y={boxTop} width={boxW} height={boxH} rx={6} fill="none" stroke={s.color} strokeWidth={2} />
            <text x={s.x} y={midY + 5} textAnchor="middle" fill={s.color} fontSize={13} fontWeight={700}>{s.label}</text>
          </g>
        ))}

        {/* Follower → Candidate (top edge) */}
        <line x1={fX + boxW / 2} y1={midY} x2={cX - boxW / 2} y2={midY} stroke={text} strokeWidth={1.5} markerEnd="url(#stArrow)" />
        <text x={(fX + cX) / 2} y={midY - 10} textAnchor="middle" fill={muted} fontSize={10}>timeout</text>

        {/* Candidate → Leader (top edge) */}
        <line x1={cX + boxW / 2} y1={midY} x2={lX - boxW / 2} y2={midY} stroke={text} strokeWidth={1.5} markerEnd="url(#stArrow)" />
        <text x={(cX + lX) / 2} y={midY - 10} textAnchor="middle" fill={muted} fontSize={10}>{isEn ? "wins election" : "選挙に勝利"}</text>

        {/* Candidate → Follower — curved below boxes */}
        <path
          d={`M ${cX - 20} ${boxBot} Q ${(fX + cX) / 2} ${boxBot + 45} ${fX + 20} ${boxBot}`}
          fill="none" stroke={text} strokeWidth={1.5} markerEnd="url(#stArrow)"
        />
        <text x={(fX + cX) / 2} y={boxBot + 42} textAnchor="middle" fill={muted} fontSize={10}>
          {isEn ? "loses / higher term" : "敗北 / 高い term"}
        </text>

        {/* Leader → Follower — wider curve below */}
        <path
          d={`M ${lX - 10} ${boxBot} Q ${(fX + lX) / 2} ${boxBot + 68} ${fX + 10} ${boxBot}`}
          fill="none" stroke={text} strokeWidth={1.5} markerEnd="url(#stArrow)"
        />
        <text x={(fX + lX) / 2} y={boxBot + 65} textAnchor="middle" fill={muted} fontSize={10}>
          {isEn ? "discovers higher term" : "高い term を発見"}
        </text>

        {/* Candidate self-loop — above box */}
        <path
          d={`M ${cX + 15} ${boxTop} Q ${cX + 40} ${boxTop - 35} ${cX - 15} ${boxTop}`}
          fill="none" stroke={text} strokeWidth={1.5} markerEnd="url(#stArrow)"
        />
        <text x={cX} y={boxTop - 32} textAnchor="middle" fill={muted} fontSize={9}>
          {isEn ? "split vote" : "票割れ"}
        </text>

        <defs>
          <marker id="stArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={text} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}
