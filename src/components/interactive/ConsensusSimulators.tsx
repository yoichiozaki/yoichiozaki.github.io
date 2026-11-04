"use client";

import { useState, useMemo, useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
} from "@/components/interactive";
import { useTheme } from "@/components/ThemeProvider";

/* ═══════════════════════════════════════════════════════════
   Shared types & helpers for all consensus simulators
   ═══════════════════════════════════════════════════════════ */

type NodeRole = "proposer" | "acceptor" | "leader" | "follower" | "candidate" | "primary" | "replica" | "byzantine" | "crashed";

type SimNode = {
  id: number;
  label: string;
  role: NodeRole;
  crashed: boolean;
  info?: string;
};

type Message = {
  from: number;
  to: number;
  type: string;
  color: string;
  dashed?: boolean;
};

type SimStep = {
  nodes: SimNode[];
  messages: Message[];
  description: string;
  descriptionEn: string;
  logEntries?: { text: string; textEn: string; color?: string }[];
};

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  proposer: { bg: "#3b82f620", border: "#3b82f6", text: "#3b82f6" },
  acceptor: { bg: "#10b98120", border: "#10b981", text: "#10b981" },
  leader: { bg: "#3b82f630", border: "#3b82f6", text: "#3b82f6" },
  follower: { bg: "#10b98120", border: "#10b981", text: "#10b981" },
  candidate: { bg: "#f59e0b20", border: "#f59e0b", text: "#f59e0b" },
  primary: { bg: "#3b82f630", border: "#3b82f6", text: "#3b82f6" },
  replica: { bg: "#10b98120", border: "#10b981", text: "#10b981" },
  byzantine: { bg: "#ef444430", border: "#ef4444", text: "#ef4444" },
  crashed: { bg: "#52525b20", border: "#52525b", text: "#71717a" },
};

/* ── Cluster SVG View ──────────────────────────────────── */

function ClusterView({
  nodes,
  messages,
  size = 300,
}: {
  nodes: SimNode[];
  messages: Message[];
  size?: number;
}) {
  const dark = useDark();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40;
  const nodeR = Math.max(16, 28 - nodes.length * 1.5);
  const nodeCount = nodes.length;

  const positions = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, i) => {
        const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
      }),
    [nodeCount, cx, cy, r],
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xs mx-auto">
      {/* Messages */}
      {messages.map((msg, i) => {
        const from = positions[msg.from];
        const to = positions[msg.to];
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const curvature = 20;
        const cpx = mx + nx * curvature;
        const cpy = my + ny * curvature;
        return (
          <g key={`msg-${i}`}>
            <defs>
              <marker
                id={`arrow-${i}-${msg.color.replace("#", "")}`}
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill={msg.color} />
              </marker>
            </defs>
            <path
              d={`M${from.x},${from.y} Q${cpx},${cpy} ${to.x},${to.y}`}
              fill="none"
              stroke={msg.color}
              strokeWidth={1.5}
              strokeDasharray={msg.dashed ? "4 3" : undefined}
              markerEnd={`url(#arrow-${i}-${msg.color.replace("#", "")})`}
              opacity={0.8}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = positions[i];
        const role = node.crashed ? "crashed" : node.role;
        const colors = ROLE_COLORS[role] || ROLE_COLORS.acceptor;
        return (
          <g key={node.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={nodeR}
              fill={colors.bg}
              stroke={colors.border}
              strokeWidth={role === "leader" || role === "primary" ? 3 : 1.5}
              opacity={node.crashed ? 0.4 : 1}
            />
            {node.crashed && (
              <line
                x1={pos.x - nodeR * 0.5}
                y1={pos.y - nodeR * 0.5}
                x2={pos.x + nodeR * 0.5}
                y2={pos.y + nodeR * 0.5}
                stroke="#ef4444"
                strokeWidth={2}
              />
            )}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={colors.text}
              fontSize={nodeR > 20 ? 11 : 9}
              fontWeight={600}
            >
              {node.label}
            </text>
            {node.info && (
              <text
                x={pos.x}
                y={pos.y + nodeR + 12}
                textAnchor="middle"
                fill={dark ? "#a3a3a3" : "#737373"}
                fontSize={8}
              >
                {node.info}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ── Event Log ─────────────────────────────────────────── */

function EventLog({
  entries,
  isEn,
}: {
  entries: { text: string; textEn: string; color?: string }[];
  isEn: boolean;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-border bg-background p-2 text-xs font-mono space-y-0.5">
      {entries.map((e, i) => (
        <div key={i} style={{ color: e.color }}>
          <span className="text-muted-foreground">[{i + 1}]</span>{" "}
          {isEn ? e.textEn : e.text}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   1. Paxos Simulator
   ═══════════════════════════════════════════════════════════ */

function buildPaxosScenario(scenario: number): SimStep[] {
  const mkNode = (id: number, role: NodeRole, info?: string): SimNode => ({
    id, label: `N${id + 1}`, role, crashed: false, info,
  });
  const crashed = (n: SimNode): SimNode => ({ ...n, crashed: true, role: "crashed" });

  if (scenario === 0) {
    // Normal: single proposer
    return [
      {
        nodes: [mkNode(0, "proposer", "Proposer"), mkNode(1, "acceptor"), mkNode(2, "acceptor"), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
        messages: [],
        description: "初期状態: N1 が Proposer、N2〜N5 が Acceptor。N1 が proposal number n=1 で合意を始める。",
        descriptionEn: "Initial state: N1 is the Proposer and N2–N5 are Acceptors. N1 starts consensus with proposal number n=1.",
        logEntries: [{ text: "N1 が Proposer として合意プロセスを開始", textEn: "N1 begins consensus as Proposer" }],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1"), mkNode(1, "acceptor"), mkNode(2, "acceptor"), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
        messages: [
          { from: 0, to: 1, type: "Prepare", color: "#3b82f6" },
          { from: 0, to: 2, type: "Prepare", color: "#3b82f6" },
          { from: 0, to: 3, type: "Prepare", color: "#3b82f6" },
          { from: 0, to: 4, type: "Prepare", color: "#3b82f6" },
        ],
        description: "Phase 1a — Prepare: N1 が全 Acceptor に Prepare(n=1) を送信。「proposal number 1 で提案したいので、それより小さい番号は受理しないと約束してもらえますか？」",
        descriptionEn: "Phase 1a — Prepare: N1 sends Prepare(n=1) to all Acceptors. 'I'd like to propose with number 1. Will you promise not to accept lower numbers?'",
        logEntries: [{ text: "N1 → 全 Acceptor: Prepare(n=1)", textEn: "N1 → All Acceptors: Prepare(n=1)", color: "#3b82f6" }],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1"), mkNode(1, "acceptor", "promised=1"), mkNode(2, "acceptor", "promised=1"), mkNode(3, "acceptor", "promised=1"), mkNode(4, "acceptor", "promised=1")],
        messages: [
          { from: 1, to: 0, type: "Promise", color: "#22c55e" },
          { from: 2, to: 0, type: "Promise", color: "#22c55e" },
          { from: 3, to: 0, type: "Promise", color: "#22c55e" },
          { from: 4, to: 0, type: "Promise", color: "#22c55e" },
        ],
        description: "Phase 1b — Promise: 各 Acceptor は n=1 が今まで見た中で最大なので Promise(n=1, ⊥) を返す。「n=1 より小さい proposal は今後拒否します。過去に受理した値はありません。」",
        descriptionEn: "Phase 1b — Promise: Each Acceptor returns Promise(n=1, ⊥) since n=1 is the highest seen. 'I won't accept proposals lower than 1. No previously accepted value.'",
        logEntries: [{ text: "全 Acceptor → N1: Promise(n=1, 値なし)", textEn: "All Acceptors → N1: Promise(n=1, no value)", color: "#22c55e" }],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1, v=X"), mkNode(1, "acceptor", "promised=1"), mkNode(2, "acceptor", "promised=1"), mkNode(3, "acceptor", "promised=1"), mkNode(4, "acceptor", "promised=1")],
        messages: [
          { from: 0, to: 1, type: "Accept", color: "#f59e0b" },
          { from: 0, to: 2, type: "Accept", color: "#f59e0b" },
          { from: 0, to: 3, type: "Accept", color: "#f59e0b" },
          { from: 0, to: 4, type: "Accept", color: "#f59e0b" },
        ],
        description: "Phase 2a — Accept: N1 が過半数（3以上）の Promise を受信。Promise に過去の受理値がないため、自分の値 v=X を提案。Accept(n=1, v=X) を全 Acceptor に送信。",
        descriptionEn: "Phase 2a — Accept: N1 has received Promises from a majority (3+). None reports a previously accepted value, so N1 proposes its own value v=X and sends Accept(n=1, v=X) to all Acceptors.",
        logEntries: [{ text: "N1 → 全 Acceptor: Accept(n=1, v=X)", textEn: "N1 → All Acceptors: Accept(n=1, v=X)", color: "#f59e0b" }],
      },
      {
        nodes: [mkNode(0, "proposer", "v=X ✓"), mkNode(1, "acceptor", "accepted=X"), mkNode(2, "acceptor", "accepted=X"), mkNode(3, "acceptor", "accepted=X"), mkNode(4, "acceptor", "accepted=X")],
        messages: [
          { from: 1, to: 0, type: "Accepted", color: "#ef4444" },
          { from: 2, to: 0, type: "Accepted", color: "#ef4444" },
          { from: 3, to: 0, type: "Accepted", color: "#ef4444" },
          { from: 4, to: 0, type: "Accepted", color: "#ef4444" },
        ],
        description: "Phase 2b — Accepted: 全 Acceptor が Accept(n=1, v=X) を受理し、Accepted を返す。過半数の Acceptor が同じ値を受理したので合意が成立し、値 X が選ばれる。",
        descriptionEn: "Phase 2b — Accepted: All Acceptors accept Accept(n=1, v=X) and return Accepted. A majority has accepted the same value, so consensus is reached and X is chosen.",
        logEntries: [{ text: "合意成立: 値 X が選ばれた", textEn: "Consensus reached: value X is chosen", color: "#22c55e" }],
      },
    ];
  }
  if (scenario === 1) {
    // Proposer conflict
    return [
      {
        nodes: [mkNode(0, "proposer", "P1"), mkNode(1, "proposer", "P2"), mkNode(2, "acceptor"), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
        messages: [],
        description: "2つの Proposer が競合するシナリオ。N1 (P1) と N2 (P2) がそれぞれ異なる値を提案しようとする。",
        descriptionEn: "Two Proposers compete: N1 (P1) and N2 (P2) each try to propose a different value.",
        logEntries: [{ text: "P1 と P2 が同時に合意を試みる", textEn: "P1 and P2 try to reach consensus at the same time" }],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1"), mkNode(1, "proposer", "P2"), mkNode(2, "acceptor"), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
        messages: [
          { from: 0, to: 2, type: "Prepare", color: "#3b82f6" },
          { from: 0, to: 3, type: "Prepare", color: "#3b82f6" },
          { from: 0, to: 4, type: "Prepare", color: "#3b82f6" },
        ],
        description: "P1 が Prepare(n=1) を送信。P2 はまだ動いていない。",
        descriptionEn: "P1 sends Prepare(n=1). P2 hasn't acted yet.",
        logEntries: [{ text: "P1 → Acceptors: Prepare(n=1)", textEn: "P1 → Acceptors: Prepare(n=1)", color: "#3b82f6" }],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1"), mkNode(1, "proposer", "n=2"), mkNode(2, "acceptor", "promised=1"), mkNode(3, "acceptor", "promised=1"), mkNode(4, "acceptor", "promised=1")],
        messages: [
          { from: 2, to: 0, type: "Promise", color: "#22c55e" },
          { from: 3, to: 0, type: "Promise", color: "#22c55e" },
          { from: 1, to: 2, type: "Prepare", color: "#8b5cf6" },
          { from: 1, to: 3, type: "Prepare", color: "#8b5cf6" },
          { from: 1, to: 4, type: "Prepare", color: "#8b5cf6" },
        ],
        description: "Acceptor が P1 に Promise を返す途中で、P2 がより大きな proposal number n=2 で Prepare を送信。",
        descriptionEn: "While the Acceptors are sending Promises to P1, P2 sends Prepare with a higher number, n=2.",
        logEntries: [
          { text: "Acceptors → P1: Promise(n=1)", textEn: "Acceptors → P1: Promise(n=1)", color: "#22c55e" },
          { text: "P2 → Acceptors: Prepare(n=2)", textEn: "P2 → Acceptors: Prepare(n=2)", color: "#8b5cf6" },
        ],
      },
      {
        nodes: [mkNode(0, "proposer", "n=1"), mkNode(1, "proposer", "n=2"), mkNode(2, "acceptor", "promised=2"), mkNode(3, "acceptor", "promised=2"), mkNode(4, "acceptor", "promised=2")],
        messages: [
          { from: 2, to: 1, type: "Promise", color: "#22c55e" },
          { from: 3, to: 1, type: "Promise", color: "#22c55e" },
          { from: 4, to: 1, type: "Promise", color: "#22c55e" },
        ],
        description: "Acceptor は n=2 > n=1 なので、P2 に Promise(n=2) を返す。P1 の proposal n=1 はもう受理されない。",
        descriptionEn: "Acceptors see n=2 > n=1, so they send Promise(n=2) to P2. P1's proposal n=1 can no longer be accepted.",
        logEntries: [{ text: "Acceptors → P2: Promise(n=2) — P1 の提案は拒否される", textEn: "Acceptors → P2: Promise(n=2) — P1's proposal rejected" }],
      },
      {
        nodes: [mkNode(0, "proposer", "rejected"), mkNode(1, "proposer", "v=Y ✓"), mkNode(2, "acceptor", "accepted=Y"), mkNode(3, "acceptor", "accepted=Y"), mkNode(4, "acceptor", "accepted=Y")],
        messages: [
          { from: 1, to: 2, type: "Accept", color: "#f59e0b" },
          { from: 1, to: 3, type: "Accept", color: "#f59e0b" },
          { from: 1, to: 4, type: "Accept", color: "#f59e0b" },
        ],
        description: "P2 が Accept(n=2, v=Y) を送信し、全 Acceptor が受理。P2 の値 Y で合意成立。P1 は再試行が必要（より大きな n で Prepare からやり直し）。proposal number による順序付けが安全性を保証する。",
        descriptionEn: "P2 sends Accept(n=2, v=Y) and all Acceptors accept it, so consensus is reached on Y. P1 must retry from Prepare with a higher n. Ordering by proposal number guarantees safety.",
        logEntries: [{ text: "合意成立: P2 の値 Y で決定", textEn: "Consensus: P2's value Y chosen", color: "#22c55e" }],
      },
    ];
  }
  // Scenario 2: Majority failure
  return [
    {
      nodes: [mkNode(0, "proposer", "Proposer"), mkNode(1, "acceptor"), mkNode(2, "acceptor"), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
      messages: [],
      description: "障害耐性シナリオ: Acceptor 4台（N2〜N5）の過半数は3台。3台以上が動いていれば合意できるが、2台以上がクラッシュすると止まる。",
      descriptionEn: "Fault tolerance: a majority of the 4 Acceptors (N2–N5) is 3. Consensus works while 3 or more are alive and stalls if 2 or more crash.",
      logEntries: [{ text: "5ノードで障害耐性を検証", textEn: "Testing fault tolerance with 5 nodes" }],
    },
    {
      nodes: [mkNode(0, "proposer", "n=1"), crashed(mkNode(1, "acceptor")), crashed(mkNode(2, "acceptor")), mkNode(3, "acceptor"), mkNode(4, "acceptor")],
      messages: [
        { from: 0, to: 3, type: "Prepare", color: "#3b82f6" },
        { from: 0, to: 4, type: "Prepare", color: "#3b82f6" },
      ],
      description: "N2, N3 がクラッシュ。N1 は Prepare を送信するが、生存 Acceptor は N4, N5 の2台のみ。過半数 = 3 に対して2台 → 合意不可能。",
      descriptionEn: "N2 and N3 crash. N1 sends Prepare, but only 2 Acceptors (N4, N5) are alive. A majority needs 3, so consensus cannot be reached.",
      logEntries: [
        { text: "N2, N3 がクラッシュ", textEn: "N2, N3 crashed", color: "#ef4444" },
        { text: "生存ノード: N1, N4, N5（Acceptor 2台 < 過半数 3）", textEn: "Alive: N1, N4, N5 (2 Acceptors < majority 3)", color: "#ef4444" },
      ],
    },
    {
      nodes: [mkNode(0, "proposer", "blocked"), crashed(mkNode(1, "acceptor")), crashed(mkNode(2, "acceptor")), mkNode(3, "acceptor", "promised=1"), mkNode(4, "acceptor", "promised=1")],
      messages: [
        { from: 3, to: 0, type: "Promise", color: "#22c55e" },
        { from: 4, to: 0, type: "Promise", color: "#22c55e" },
      ],
      description: "N4, N5 から Promise を受信するが、過半数（3）に達しない。Proposer は Phase 2 に進めずブロック。生存 Acceptor が過半数に満たないあいだ、安全性は保たれるが活性（合意の進行）は失われる。",
      descriptionEn: "N1 receives Promises from N4 and N5 but cannot reach a majority (3), so the Proposer is blocked before Phase 2. While fewer than a majority of Acceptors are alive, safety holds but liveness (progress) is lost.",
      logEntries: [{ text: "Promise 2/3 — 過半数に不足、合意不能", textEn: "Promise 2/3 — short of majority, consensus impossible", color: "#ef4444" }],
    },
  ];
}

const PAXOS_SCENARIOS = [
  { label: "正常系", labelEn: "Normal Case" },
  { label: "Proposer 競合", labelEn: "Proposer Conflict" },
  { label: "過半数割れ", labelEn: "Lost Majority" },
];

export function PaxosSimulator({ locale = "ja" }: { locale?: string }) {
  const isEn = locale === "en";
  const [scenario, setScenario] = useState(0);
  const steps = useMemo(() => buildPaxosScenario(scenario), [scenario]);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2000 });
  const current = steps[player.step];

  const allLogs = useMemo(() => {
    const logs: { text: string; textEn: string; color?: string }[] = [];
    for (let i = 0; i <= player.step; i++) {
      if (steps[i].logEntries) logs.push(...steps[i].logEntries!);
    }
    return logs;
  }, [player.step, steps]);

  const handleScenario = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenario(Number(e.target.value));
    player.reset();
  }, [player]);

  return (
    <InteractiveDemo
      title={isEn ? "Paxos Simulator" : "Paxos シミュレーター"}
      description={isEn ? "Step through Single-Decree Paxos with different scenarios." : "Single-Decree Paxos をシナリオごとにステップ実行する。"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">
            {isEn ? "Scenario:" : "シナリオ:"}
          </label>
          <select
            value={scenario}
            onChange={handleScenario}
            className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground"
          >
            {PAXOS_SCENARIOS.map((s, i) => (
              <option key={i} value={i}>{isEn ? s.labelEn : s.label}</option>
            ))}
          </select>
        </div>

        <ClusterView nodes={current.nodes} messages={current.messages} />

        {/* Message legend */}
        <div className="flex flex-wrap gap-3 justify-center text-xs">
          {[
            { color: "#3b82f6", label: "Prepare" },
            { color: "#22c55e", label: "Promise" },
            { color: "#f59e0b", label: "Accept" },
            { color: "#ef4444", label: "Accepted" },
          ].map((m) => (
            <span key={m.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <EventLog entries={allLogs} isEn={isEn} />

        <StepPlayerControls
          {...player}
          label={(s) => `${isEn ? "Step" : "ステップ"} ${s + 1} / ${steps.length}`}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════
   2. Raft Simulator
   ═══════════════════════════════════════════════════════════ */

function buildRaftScenario(scenario: number): (SimStep & { logs?: string[][] })[] {
  const mkNode = (id: number, role: NodeRole, info?: string): SimNode => ({
    id, label: `N${id + 1}`, role, crashed: false, info,
  });
  const crashed = (n: SimNode): SimNode => ({ ...n, crashed: true, role: "crashed" });

  if (scenario === 0) {
    // Normal leader election + log replication
    return [
      {
        nodes: [mkNode(0, "follower", "term=0"), mkNode(1, "follower", "term=0"), mkNode(2, "follower", "term=0"), mkNode(3, "follower", "term=0"), mkNode(4, "follower", "term=0")],
        messages: [],
        logs: [[], [], [], [], []],
        description: "初期状態: 全ノードが Follower で term=0。Leader はまだいない。各ノードは election timeout を持ち、それが切れると Candidate に遷移する。",
        descriptionEn: "Initial state: all nodes are Followers at term=0, and there is no Leader yet. Each node has an election timeout; when it expires, the node becomes a Candidate.",
        logEntries: [{ text: "全ノードが Follower として起動", textEn: "All nodes start as Followers" }],
      },
      {
        nodes: [mkNode(0, "candidate", "term=1"), mkNode(1, "follower", "term=0"), mkNode(2, "follower", "term=0"), mkNode(3, "follower", "term=0"), mkNode(4, "follower", "term=0")],
        messages: [
          { from: 0, to: 1, type: "RequestVote", color: "#f59e0b" },
          { from: 0, to: 2, type: "RequestVote", color: "#f59e0b" },
          { from: 0, to: 3, type: "RequestVote", color: "#f59e0b" },
          { from: 0, to: 4, type: "RequestVote", color: "#f59e0b" },
        ],
        logs: [[], [], [], [], []],
        description: "N1 の election timeout が最初に切れ、Candidate に遷移。term を 1 にインクリメントし、自分自身に投票した上で、他の全ノードに RequestVote RPC を送信。",
        descriptionEn: "N1's election timeout fires first. It becomes a Candidate, increments its term to 1, votes for itself, and sends RequestVote RPCs to all other nodes.",
        logEntries: [{ text: "N1: election timeout → Candidate (term=1)", textEn: "N1: election timeout → Candidate (term=1)", color: "#f59e0b" }],
      },
      {
        nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [
          { from: 1, to: 0, type: "Vote", color: "#22c55e" },
          { from: 2, to: 0, type: "Vote", color: "#22c55e" },
          { from: 3, to: 0, type: "Vote", color: "#22c55e" },
          { from: 4, to: 0, type: "Vote", color: "#22c55e" },
        ],
        logs: [[], [], [], [], []],
        description: "他の全ノードが N1 に投票（まだ他の Candidate がいないため）。N1 は自身の票を含めて5票を得て過半数（3票以上）に達し、term=1 の Leader になる。",
        descriptionEn: "All other nodes vote for N1 (there is no competing Candidate). With 5 votes including its own, N1 has a majority (3+) and becomes Leader for term=1.",
        logEntries: [{ text: "N1 が Leader に選出 (得票: 5/5)", textEn: "N1 elected Leader (votes: 5/5)", color: "#22c55e" }],
      },
      {
        nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [
          { from: 0, to: 1, type: "AppendEntries", color: "#3b82f6" },
          { from: 0, to: 2, type: "AppendEntries", color: "#3b82f6" },
          { from: 0, to: 3, type: "AppendEntries", color: "#3b82f6" },
          { from: 0, to: 4, type: "AppendEntries", color: "#3b82f6" },
        ],
        logs: [["x=1"], [], [], [], []],
        description: "クライアントから書き込みリクエスト到着。Leader がログに x=1 を追記し、AppendEntries RPC で全 Follower にログエントリーを送信。",
        descriptionEn: "A client sends a write request. The Leader appends x=1 to its log and sends the entry to all Followers via AppendEntries RPC.",
        logEntries: [{ text: "Client → Leader: x=1 | Leader → All: AppendEntries", textEn: "Client → Leader: x=1 | Leader → All: AppendEntries", color: "#3b82f6" }],
      },
      {
        nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [
          { from: 1, to: 0, type: "OK", color: "#22c55e" },
          { from: 2, to: 0, type: "OK", color: "#22c55e" },
          { from: 3, to: 0, type: "OK", color: "#22c55e" },
          { from: 4, to: 0, type: "OK", color: "#22c55e" },
        ],
        logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
        description: "全 Follower がログに x=1 を追記し、成功応答を返す。Leader は過半数（3以上）の応答を確認してエントリーをコミットする。全ノードのログが一致している。",
        descriptionEn: "All Followers append x=1 and respond OK. Once a majority (3+) has responded, the Leader commits the entry. All logs now match.",
        logEntries: [{ text: "ログ x=1 をコミット ✓", textEn: "Log entry x=1 committed ✓", color: "#22c55e" }],
      },
    ];
  }
  if (scenario === 1) {
    // Leader failure and re-election
    return [
      {
        nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [],
        logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
        description: "正常稼働中: N1 が Leader (term=1)、全ノードのログに x=1 がコミット済み。",
        descriptionEn: "Normal operation: N1 is the Leader (term=1), and x=1 is committed on all nodes.",
        logEntries: [{ text: "正常稼働中: Leader=N1, term=1", textEn: "Normal: Leader=N1, term=1" }],
      },
      {
        nodes: [crashed(mkNode(0, "leader")), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [],
        logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
        description: "N1（Leader）がクラッシュ。Follower には heartbeat が届かなくなり、各 Follower の election timeout のカウントが進む。",
        descriptionEn: "N1 (the Leader) crashes. Followers stop receiving heartbeats, and their election timeouts keep counting down.",
        logEntries: [{ text: "N1 (Leader) がクラッシュ", textEn: "N1 (Leader) crashes", color: "#ef4444" }],
      },
      {
        nodes: [crashed(mkNode(0, "leader")), mkNode(1, "follower", "term=1"), mkNode(2, "candidate", "term=2"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
        messages: [
          { from: 2, to: 1, type: "RequestVote", color: "#f59e0b" },
          { from: 2, to: 3, type: "RequestVote", color: "#f59e0b" },
          { from: 2, to: 4, type: "RequestVote", color: "#f59e0b" },
        ],
        logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
        description: "N3 の election timeout が最初に切れ、term=2 で Candidate に遷移。RequestVote を送信。Election Restriction: 投票する側は、Candidate のログが自分のログと同じかそれより新しいかを確かめる。",
        descriptionEn: "N3's election timeout fires first. It becomes a Candidate at term=2 and sends RequestVote. Election Restriction: each voter checks that the candidate's log is at least as up-to-date as its own.",
        logEntries: [{ text: "N3: election timeout → Candidate (term=2)", textEn: "N3: election timeout → Candidate (term=2)", color: "#f59e0b" }],
      },
      {
        nodes: [crashed(mkNode(0, "leader")), mkNode(1, "follower", "term=2"), mkNode(2, "leader", "term=2 ♛"), mkNode(3, "follower", "term=2"), mkNode(4, "follower", "term=2")],
        messages: [
          { from: 1, to: 2, type: "Vote", color: "#22c55e" },
          { from: 3, to: 2, type: "Vote", color: "#22c55e" },
          { from: 4, to: 2, type: "Vote", color: "#22c55e" },
        ],
        logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
        description: "N2, N4, N5 が N3 に投票（ログが最新かつ term が最大）。N3 が過半数を獲得し新 Leader (term=2) に。Leader Completeness Property: コミット済みの x=1 は新 Leader のログにも含まれている。",
        descriptionEn: "N2, N4, and N5 vote for N3 (up-to-date log, highest term). N3 wins a majority and becomes the new Leader (term=2). Leader Completeness Property: the committed entry x=1 is in the new Leader's log.",
        logEntries: [{ text: "N3 が新 Leader に選出 (term=2)", textEn: "N3 elected new Leader (term=2)", color: "#22c55e" }],
      },
    ];
  }
  // Scenario 2: Network partition
  return [
    {
      nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
      messages: [],
      logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
      description: "正常稼働中: 5ノードクラスター、N1 が Leader。これからネットワーク分断が起きる。",
      descriptionEn: "Normal operation: a 5-node cluster with N1 as Leader. A network partition is about to occur.",
      logEntries: [{ text: "正常稼働中", textEn: "Normal operation" }],
    },
    {
      nodes: [mkNode(0, "leader", "term=1 ♛"), mkNode(1, "follower", "term=1"), mkNode(2, "follower", "term=1"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
      messages: [],
      logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
      description: "ネットワーク分断が起き、{N1, N2} と {N3, N4, N5} に分かれる。N1 は少数派パーティション（2/5）に取り残される。",
      descriptionEn: "A network partition splits the cluster into {N1, N2} and {N3, N4, N5}. N1 is stranded in the minority partition (2/5).",
      logEntries: [{ text: "ネットワーク分断: {N1,N2} | {N3,N4,N5}", textEn: "Partition: {N1,N2} | {N3,N4,N5}", color: "#ef4444" }],
    },
    {
      nodes: [mkNode(0, "leader", "term=1 old"), mkNode(1, "follower", "term=1"), mkNode(2, "candidate", "term=2"), mkNode(3, "follower", "term=1"), mkNode(4, "follower", "term=1")],
      messages: [
        { from: 2, to: 3, type: "RequestVote", color: "#f59e0b" },
        { from: 2, to: 4, type: "RequestVote", color: "#f59e0b" },
      ],
      logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
      description: "多数派パーティション {N3, N4, N5} で N3 が election timeout → Candidate (term=2)。N4, N5 に RequestVote を送信。旧 Leader N1 のメッセージは届かない。",
      descriptionEn: "In the majority partition {N3, N4, N5}, N3's election timeout fires and it becomes a Candidate (term=2). It sends RequestVote to N4 and N5. Messages from the old Leader N1 can't reach them.",
      logEntries: [{ text: "N3 が多数派パーティションで Candidate に", textEn: "N3 becomes Candidate in majority partition", color: "#f59e0b" }],
    },
    {
      nodes: [mkNode(0, "leader", "term=1 old"), mkNode(1, "follower", "term=1"), mkNode(2, "leader", "term=2 ♛"), mkNode(3, "follower", "term=2"), mkNode(4, "follower", "term=2")],
      messages: [
        { from: 3, to: 2, type: "Vote", color: "#22c55e" },
        { from: 4, to: 2, type: "Vote", color: "#22c55e" },
      ],
      logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
      description: "N3 が多数派で新 Leader (term=2) に選出。N1 は少数派で旧 Leader のまま。N1 の書き込みはコミットできない（過半数の応答を得られない）。Raft の安全性は保たれている。",
      descriptionEn: "N3 is elected the new Leader (term=2) in the majority. N1 remains the old Leader in the minority, but its writes can't commit because it can't reach a majority. Raft stays safe.",
      logEntries: [{ text: "N3 が新 Leader (term=2)、N1 はコミット不能", textEn: "N3 new Leader (term=2), N1 can't commit", color: "#22c55e" }],
    },
    {
      nodes: [mkNode(0, "follower", "term=2"), mkNode(1, "follower", "term=2"), mkNode(2, "leader", "term=2 ♛"), mkNode(3, "follower", "term=2"), mkNode(4, "follower", "term=2")],
      messages: [
        { from: 2, to: 0, type: "AppendEntries", color: "#3b82f6" },
        { from: 2, to: 1, type: "AppendEntries", color: "#3b82f6" },
      ],
      logs: [["x=1"], ["x=1"], ["x=1"], ["x=1"], ["x=1"]],
      description: "ネットワークが復旧。N1 は N3 からの AppendEntries (term=2) を受信し、term=2 > term=1 なので Follower に降格。クラスター全体が term=2 の新 Leader N3 の下で再統合される。",
      descriptionEn: "The network heals. N1 receives AppendEntries from N3 (term=2) and steps down to Follower because term=2 > term=1. The cluster is reunified under N3 (term=2).",
      logEntries: [{ text: "ネットワーク復旧 — クラスター再統合", textEn: "Network healed — cluster reunified", color: "#22c55e" }],
    },
  ];
}

const RAFT_SCENARIOS = [
  { label: "選出 + ログ複製", labelEn: "Election + Replication" },
  { label: "Leader 障害", labelEn: "Leader Failure" },
  { label: "ネットワーク分断", labelEn: "Network Partition" },
];

export function RaftSimulator({ locale = "ja" }: { locale?: string }) {
  const isEn = locale === "en";
  const [scenario, setScenario] = useState(0);
  const steps = useMemo(() => buildRaftScenario(scenario), [scenario]);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2200 });
  const current = steps[player.step];

  const allLogs = useMemo(() => {
    const logs: { text: string; textEn: string; color?: string }[] = [];
    for (let i = 0; i <= player.step; i++) {
      if (steps[i].logEntries) logs.push(...steps[i].logEntries!);
    }
    return logs;
  }, [player.step, steps]);

  const handleScenario = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenario(Number(e.target.value));
    player.reset();
  }, [player]);

  return (
    <InteractiveDemo
      title={isEn ? "Raft Simulator" : "Raft シミュレーター"}
      description={isEn ? "Visualize Raft's leader election, log replication, and fault tolerance." : "Raft の Leader 選出・ログ複製・障害耐性をステップ実行で可視化する。"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">{isEn ? "Scenario:" : "シナリオ:"}</label>
          <select value={scenario} onChange={handleScenario} className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground">
            {RAFT_SCENARIOS.map((s, i) => (
              <option key={i} value={i}>{isEn ? s.labelEn : s.label}</option>
            ))}
          </select>
        </div>

        <ClusterView nodes={current.nodes} messages={current.messages} />

        {/* Raft log visualization */}
        {current.logs && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium">{isEn ? "Replicated Log" : "複製ログ"}</div>
            {current.nodes.map((node, ni) => (
              <div key={ni} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-right font-mono text-muted-foreground">{node.label}</span>
                <div className="flex gap-0.5">
                  {(current.logs![ni] || []).map((entry: string, ei: number) => (
                    <span key={ei} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      {entry}
                    </span>
                  ))}
                  {(current.logs![ni] || []).length === 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">{isEn ? "empty" : "空"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center text-xs">
          {[
            { color: "#f59e0b", label: "RequestVote" },
            { color: "#22c55e", label: "Vote / OK" },
            { color: "#3b82f6", label: "AppendEntries" },
          ].map((m) => (
            <span key={m.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <EventLog entries={allLogs} isEn={isEn} />

        <StepPlayerControls {...player} label={(s) => `${isEn ? "Step" : "ステップ"} ${s + 1} / ${steps.length}`} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}

/* ═══════════════════════════════════════════════════════════
   3. PBFT Simulator
   ═══════════════════════════════════════════════════════════ */

function buildPBFTScenario(scenario: number): SimStep[] {
  const mkNode = (id: number, role: NodeRole, info?: string): SimNode => ({
    id, label: `N${id}`, role, crashed: false, info,
  });

  if (scenario === 0) {
    // Normal case
    return [
      {
        nodes: [mkNode(0, "primary", "Primary"), mkNode(1, "replica", "Backup"), mkNode(2, "replica", "Backup"), mkNode(3, "replica", "Backup")],
        messages: [],
        description: "PBFT 正常系: 4ノード（n=3f+1, f=1）。N0 が Primary、N1〜N3 が Backup（Primary 以外のノード）。クライアントからリクエストが届く。",
        descriptionEn: "PBFT normal case: 4 nodes (n=3f+1, f=1). N0 is the Primary and N1–N3 are Backups (the other nodes). A client request arrives.",
        logEntries: [{ text: "4ノード PBFT (f=1): 1台までのビザンチン障害に耐える", textEn: "4-node PBFT (f=1): tolerates up to 1 Byzantine fault" }],
      },
      {
        nodes: [mkNode(0, "primary", "seq=1"), mkNode(1, "replica"), mkNode(2, "replica"), mkNode(3, "replica")],
        messages: [
          { from: 0, to: 1, type: "Pre-prepare", color: "#3b82f6" },
          { from: 0, to: 2, type: "Pre-prepare", color: "#3b82f6" },
          { from: 0, to: 3, type: "Pre-prepare", color: "#3b82f6" },
        ],
        description: "Pre-prepare: Primary がリクエストにシーケンス番号 seq=1 を割り当て、他の全ノードに Pre-prepare メッセージを送信。「このリクエストを seq=1 として処理してください。」",
        descriptionEn: "Pre-prepare: The Primary assigns sequence number seq=1 and sends Pre-prepare to all other nodes. 'Process this request as seq=1.'",
        logEntries: [{ text: "Primary → All: Pre-prepare(seq=1)", textEn: "Primary → All: Pre-prepare(seq=1)", color: "#3b82f6" }],
      },
      {
        nodes: [mkNode(0, "primary", "prepared"), mkNode(1, "replica", "preparing"), mkNode(2, "replica", "preparing"), mkNode(3, "replica", "preparing")],
        messages: [
          { from: 1, to: 0, type: "Prepare", color: "#22c55e" }, { from: 1, to: 2, type: "Prepare", color: "#22c55e" }, { from: 1, to: 3, type: "Prepare", color: "#22c55e" },
          { from: 2, to: 0, type: "Prepare", color: "#22c55e" }, { from: 2, to: 1, type: "Prepare", color: "#22c55e" }, { from: 2, to: 3, type: "Prepare", color: "#22c55e" },
          { from: 3, to: 0, type: "Prepare", color: "#22c55e" }, { from: 3, to: 1, type: "Prepare", color: "#22c55e" }, { from: 3, to: 2, type: "Prepare", color: "#22c55e" },
        ],
        description: "Prepare: 各バックアップ（N1〜N3）が他の全ノードに Prepare メッセージを送信（全対全通信 → O(n²)）。Primary の Pre-prepare が Primary 自身の Prepare の代わりになる。各ノードは Pre-prepare と一致する Prepare を 2f=2 個（合わせて 2f+1=3 個）そろえると prepared 状態になる。n=4, f=1 では、3 個のうち少なくとも 2 個が正直なノードからのものになる。",
        descriptionEn: "Prepare: Each backup (N1–N3) sends Prepare to all others (all-to-all → O(n²)). The Primary's Pre-prepare stands in for its own Prepare. A node is 'prepared' once it holds the Pre-prepare and 2f=2 matching Prepares (2f+1=3 in total). With n=4, f=1, at least 2 of those 3 come from honest nodes.",
        logEntries: [{ text: "全対全通信: Prepare メッセージ (O(n²))", textEn: "All-to-all: Prepare messages (O(n²))", color: "#22c55e" }],
      },
      {
        nodes: [mkNode(0, "primary", "committed"), mkNode(1, "replica", "committed"), mkNode(2, "replica", "committed"), mkNode(3, "replica", "committed")],
        messages: [
          { from: 0, to: 1, type: "Commit", color: "#f59e0b" }, { from: 0, to: 2, type: "Commit", color: "#f59e0b" }, { from: 0, to: 3, type: "Commit", color: "#f59e0b" },
          { from: 1, to: 0, type: "Commit", color: "#f59e0b" }, { from: 1, to: 2, type: "Commit", color: "#f59e0b" }, { from: 1, to: 3, type: "Commit", color: "#f59e0b" },
          { from: 2, to: 0, type: "Commit", color: "#f59e0b" }, { from: 2, to: 1, type: "Commit", color: "#f59e0b" }, { from: 2, to: 3, type: "Commit", color: "#f59e0b" },
          { from: 3, to: 0, type: "Commit", color: "#f59e0b" }, { from: 3, to: 1, type: "Commit", color: "#f59e0b" }, { from: 3, to: 2, type: "Commit", color: "#f59e0b" },
        ],
        description: "Commit: prepared 状態のノードが他の全ノードに Commit メッセージを送信。2f+1=3 個の Commit を集めると committed 状態になり、リクエストを実行してクライアントに応答する。",
        descriptionEn: "Commit: Prepared nodes send Commit to all other nodes. After collecting 2f+1=3 Commits, a node is 'committed', executes the request, and responds to the client.",
        logEntries: [{ text: "合意成立: 全ノードが committed → リクエスト実行", textEn: "Consensus: all nodes committed → request executed", color: "#22c55e" }],
      },
    ];
  }
  if (scenario === 1) {
    // Byzantine node present
    return [
      {
        nodes: [mkNode(0, "primary", "Primary"), mkNode(1, "replica"), mkNode(2, "byzantine", "Byzantine"), mkNode(3, "replica")],
        messages: [],
        description: "ビザンチン障害シナリオ: N2 がビザンチンノード（任意の不正動作をする）。f=1 なので、ビザンチンノード1台には耐えられる。",
        descriptionEn: "Byzantine scenario: N2 is Byzantine (behaves arbitrarily). With f=1, the system tolerates one Byzantine node.",
        logEntries: [{ text: "N2 がビザンチンノード (f=1 以内)", textEn: "N2 is Byzantine (within f=1)", color: "#ef4444" }],
      },
      {
        nodes: [mkNode(0, "primary", "seq=1"), mkNode(1, "replica"), mkNode(2, "byzantine", "Byzantine"), mkNode(3, "replica")],
        messages: [
          { from: 0, to: 1, type: "Pre-prepare", color: "#3b82f6" },
          { from: 0, to: 2, type: "Pre-prepare", color: "#3b82f6" },
          { from: 0, to: 3, type: "Pre-prepare", color: "#3b82f6" },
        ],
        description: "Pre-prepare: Primary は正常に Pre-prepare を送信。ビザンチンノード N2 もこれを受信する。",
        descriptionEn: "Pre-prepare: The Primary sends Pre-prepare normally. Byzantine node N2 receives it too.",
        logEntries: [{ text: "Primary → All: Pre-prepare (N2 はビザンチン)", textEn: "Primary → All: Pre-prepare (N2 is Byzantine)" }],
      },
      {
        nodes: [mkNode(0, "primary", "preparing"), mkNode(1, "replica", "preparing"), mkNode(2, "byzantine", "lying"), mkNode(3, "replica", "preparing")],
        messages: [
          { from: 1, to: 0, type: "Prepare", color: "#22c55e" }, { from: 1, to: 2, type: "Prepare", color: "#22c55e" }, { from: 1, to: 3, type: "Prepare", color: "#22c55e" },
          { from: 2, to: 0, type: "BadMsg", color: "#ef4444", dashed: true }, { from: 2, to: 1, type: "BadMsg", color: "#ef4444", dashed: true }, { from: 2, to: 3, type: "BadMsg", color: "#ef4444", dashed: true },
          { from: 3, to: 0, type: "Prepare", color: "#22c55e" }, { from: 3, to: 1, type: "Prepare", color: "#22c55e" }, { from: 3, to: 2, type: "Prepare", color: "#22c55e" },
        ],
        description: "Prepare: 正直なバックアップ（N1, N3）は正しい Prepare を送信。ビザンチンの N2 は不正なメッセージを送信（赤い点線）。それでも Pre-prepare と正直なバックアップ 2 台の Prepare で、一致するメッセージが 2f+1=3 個そろうので、合意は進む。",
        descriptionEn: "Prepare: Honest backups (N1, N3) send correct Prepares. Byzantine N2 sends bad messages (red dashed). The Pre-prepare plus the two honest Prepares still make 2f+1=3 matching messages, so consensus proceeds.",
        logEntries: [
          { text: "N2 が不正な Prepare を送信", textEn: "N2 sends fraudulent Prepare", color: "#ef4444" },
          { text: "正直なノード 3台で 2f+1 を確保", textEn: "3 honest nodes meet 2f+1 threshold" },
        ],
      },
      {
        nodes: [mkNode(0, "primary", "committed"), mkNode(1, "replica", "committed"), mkNode(2, "byzantine", "ignored"), mkNode(3, "replica", "committed")],
        messages: [
          { from: 0, to: 1, type: "Commit", color: "#f59e0b" }, { from: 0, to: 3, type: "Commit", color: "#f59e0b" },
          { from: 1, to: 0, type: "Commit", color: "#f59e0b" }, { from: 1, to: 3, type: "Commit", color: "#f59e0b" },
          { from: 3, to: 0, type: "Commit", color: "#f59e0b" }, { from: 3, to: 1, type: "Commit", color: "#f59e0b" },
        ],
        description: "Commit: 正直なノードが Commit を交換し、2f+1=3 の Commit を集めて committed になる。ビザンチン N2 の不正なメッセージは 2f+1 のクォーラムに入らず、安全性は保たれる。",
        descriptionEn: "Commit: Honest nodes exchange Commits and collect 2f+1=3, becoming committed. N2's bad messages never make it into a 2f+1 quorum, so safety is preserved.",
        logEntries: [{ text: "合意成立: ビザンチン障害 1台に耐えた ✓", textEn: "Consensus reached: tolerated 1 Byzantine fault ✓", color: "#22c55e" }],
      },
    ];
  }
  // Scenario 2: Too many Byzantine
  return [
    {
      nodes: [mkNode(0, "primary", "Primary"), mkNode(1, "byzantine", "Byzantine"), mkNode(2, "byzantine", "Byzantine"), mkNode(3, "replica")],
      messages: [],
      description: "f+1 = 2 台がビザンチンのシナリオ。n=4 で耐えられるのは f=1 までなので、2台がビザンチンだと合意は保証されない。",
      descriptionEn: "f+1 = 2 Byzantine nodes. With n=4, the system tolerates only f=1 Byzantine node, so with 2 Byzantine nodes consensus is not guaranteed.",
      logEntries: [{ text: "N1, N2 がビザンチン (f+1 = 2 > f = 1)", textEn: "N1, N2 are Byzantine (f+1 = 2 > f = 1)", color: "#ef4444" }],
    },
    {
      nodes: [mkNode(0, "primary", "seq=1"), mkNode(1, "byzantine", "lying"), mkNode(2, "byzantine", "lying"), mkNode(3, "replica")],
      messages: [
        { from: 0, to: 1, type: "Pre-prepare", color: "#3b82f6" },
        { from: 0, to: 2, type: "Pre-prepare", color: "#3b82f6" },
        { from: 0, to: 3, type: "Pre-prepare", color: "#3b82f6" },
      ],
      description: "Pre-prepare は正常に進行。しかし次の Prepare フェーズでビザンチンノードの影響が出る。",
      descriptionEn: "Pre-prepare proceeds normally. But Byzantine influence appears in the Prepare phase.",
      logEntries: [{ text: "Primary → All: Pre-prepare(seq=1)", textEn: "Primary → All: Pre-prepare(seq=1)" }],
    },
    {
      nodes: [mkNode(0, "primary", "stuck"), mkNode(1, "byzantine", "lying"), mkNode(2, "byzantine", "lying"), mkNode(3, "replica", "stuck")],
      messages: [
        { from: 1, to: 0, type: "Bad", color: "#ef4444", dashed: true }, { from: 1, to: 3, type: "Bad", color: "#ef4444", dashed: true },
        { from: 2, to: 0, type: "Bad", color: "#ef4444", dashed: true }, { from: 2, to: 3, type: "Bad", color: "#ef4444", dashed: true },
        { from: 3, to: 0, type: "Prepare", color: "#22c55e" },
      ],
      description: "正直なノードは N0 と N3 の2台だけ。Pre-prepare と N3 の Prepare を合わせても一致するメッセージは2個で、2f+1=3 に届かないので、合意が進まない。",
      descriptionEn: "Only N0 and N3 are honest. The Pre-prepare and N3's Prepare make only 2 matching messages, short of 2f+1=3, so consensus cannot proceed.",
      logEntries: [
        { text: "一致するメッセージ: 2/3 — 閾値に不足", textEn: "Matching messages: 2/3 — below threshold", color: "#ef4444" },
        { text: "合意不能: ビザンチンノードが多すぎる", textEn: "Cannot reach consensus: too many Byzantine nodes", color: "#ef4444" },
      ],
    },
  ];
}

const PBFT_SCENARIOS = [
  { label: "正常系", labelEn: "Normal Case" },
  { label: "ビザンチン 1台", labelEn: "1 Byzantine Node" },
  { label: "ビザンチン過多", labelEn: "Too Many Byzantine Nodes" },
];

export function PBFTSimulator({ locale = "ja" }: { locale?: string }) {
  const isEn = locale === "en";
  const [scenario, setScenario] = useState(0);
  const steps = useMemo(() => buildPBFTScenario(scenario), [scenario]);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2200 });
  const current = steps[player.step];

  const allLogs = useMemo(() => {
    const logs: { text: string; textEn: string; color?: string }[] = [];
    for (let i = 0; i <= player.step; i++) {
      if (steps[i].logEntries) logs.push(...steps[i].logEntries!);
    }
    return logs;
  }, [player.step, steps]);

  const handleScenario = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setScenario(Number(e.target.value));
    player.reset();
  }, [player]);

  return (
    <InteractiveDemo
      title={isEn ? "PBFT Simulator" : "PBFT シミュレーター"}
      description={isEn ? "Step through PBFT's three phases with zero, one, or two Byzantine nodes." : "PBFT の3フェーズを、ビザンチンノードが0台・1台・2台の場合についてステップ実行する。"}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground">{isEn ? "Scenario:" : "シナリオ:"}</label>
          <select value={scenario} onChange={handleScenario} className="text-xs rounded border border-border bg-background px-2 py-1 text-foreground">
            {PBFT_SCENARIOS.map((s, i) => (
              <option key={i} value={i}>{isEn ? s.labelEn : s.label}</option>
            ))}
          </select>
        </div>

        <ClusterView nodes={current.nodes} messages={current.messages} />

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center text-xs">
          {[
            { color: "#3b82f6", label: "Pre-prepare" },
            { color: "#22c55e", label: "Prepare" },
            { color: "#f59e0b", label: "Commit" },
            { color: "#ef4444", label: isEn ? "Byzantine message" : "不正メッセージ", dashed: true },
          ].map((m) => (
            <span key={m.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: m.color, borderBottom: m.dashed ? "1px dashed" : undefined }} />
              {m.label}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <EventLog entries={allLogs} isEn={isEn} />

        <StepPlayerControls {...player} label={(s) => `${isEn ? "Step" : "ステップ"} ${s + 1} / ${steps.length}`} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
