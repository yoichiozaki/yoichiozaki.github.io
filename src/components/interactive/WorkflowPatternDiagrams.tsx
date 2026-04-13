"use client";

type PatternDiagramProps = {
  locale?: string;
};

// ── Shared SVG helpers ──────────────────────────────────────

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="var(--color-muted-foreground)"
      strokeWidth={1.5}
      markerEnd="url(#wfArrow)"
    />
  );
}

function ArrowDefs() {
  return (
    <defs>
      <marker id="wfArrow" viewBox="0 0 10 7" refX="10" refY="3.5"
        markerWidth={8} markerHeight={6} orient="auto-start-reverse">
        <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-muted-foreground)" />
      </marker>
    </defs>
  );
}

function Node({ x, y, label, color, icon, w = 80 }: {
  x: number; y: number; label: string; color: string; icon: string; w?: number;
}) {
  return (
    <g>
      <rect x={x - w / 2} y={y - 20} width={w} height={40} rx={8}
        fill={color} fillOpacity={0.12} stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={11} fontWeight={600}>
        {icon} {label}
      </text>
    </g>
  );
}

function EdgeLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
      fill="var(--color-muted-foreground)" fontSize={9}>
      {text}
    </text>
  );
}

// ── 1. Sequential ───────────────────────────────────────────

export function SequentialPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 520 60" className="w-full max-w-lg" role="img"
        aria-label={isJa ? "Sequential パターン図" : "Sequential pattern diagram"}>
        <ArrowDefs />
        <Node x={40} y={30} label="Input" color="#6366f1" icon="📝" w={70} />
        <Arrow x1={75} y1={30} x2={105} y2={30} />
        <Node x={145} y={30} label="Agent A" color="#3b82f6" icon="" w={70} />
        <Arrow x1={180} y1={30} x2={210} y2={30} />
        <Node x={250} y={30} label="Agent B" color="#f59e0b" icon="" w={70} />
        <Arrow x1={285} y1={30} x2={315} y2={30} />
        <Node x={355} y={30} label="Agent C" color="#10b981" icon="" w={70} />
        <Arrow x1={390} y1={30} x2={420} y2={30} />
        <Node x={470} y={30} label="Output" color="#8b5cf6" icon="📤" w={70} />
      </svg>
    </div>
  );
}

// ── 2. Concurrent ───────────────────────────────────────────

export function ConcurrentPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  const aggLabel = isJa ? "集約" : "Agg.";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 460 160" className="w-full max-w-md" role="img"
        aria-label={isJa ? "Concurrent パターン図" : "Concurrent pattern diagram"}>
        <ArrowDefs />
        <Node x={50} y={80} label="Input" color="#6366f1" icon="📝" w={70} />
        {/* Fan-out arrows */}
        <Arrow x1={85} y1={72} x2={145} y2={35} />
        <Arrow x1={85} y1={80} x2={145} y2={80} />
        <Arrow x1={85} y1={88} x2={145} y2={125} />
        {/* Agents */}
        <Node x={190} y={30} label="Agent A" color="#3b82f6" icon="" w={75} />
        <Node x={190} y={80} label="Agent B" color="#f59e0b" icon="" w={75} />
        <Node x={190} y={130} label="Agent C" color="#10b981" icon="" w={75} />
        {/* Fan-in arrows */}
        <Arrow x1={228} y1={35} x2={290} y2={72} />
        <Arrow x1={228} y1={80} x2={290} y2={80} />
        <Arrow x1={228} y1={125} x2={290} y2={88} />
        <Node x={335} y={80} label={aggLabel} color="#8b5cf6" icon="🔗" w={75} />
        <Arrow x1={373} y1={80} x2={395} y2={80} />
        <Node x={425} y={80} label="Output" color="#8b5cf6" icon="📤" w={55} />
      </svg>
    </div>
  );
}

// ── 3. Conditional ──────────────────────────────────────────

export function ConditionalPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 440 120" className="w-full max-w-md" role="img"
        aria-label={isJa ? "Conditional パターン図" : "Conditional pattern diagram"}>
        <ArrowDefs />
        <Node x={50} y={60} label="Input" color="#6366f1" icon="📝" w={70} />
        <Arrow x1={85} y1={60} x2={135} y2={60} />
        <Node x={185} y={60} label="Classifier" color="#f59e0b" icon="🔍" w={90} />
        {/* Branches */}
        <Arrow x1={230} y1={48} x2={300} y2={30} />
        <EdgeLabel x={270} y={30} text="true" />
        <Arrow x1={230} y1={72} x2={300} y2={90} />
        <EdgeLabel x={270} y={90} text="false" />
        <Node x={355} y={30} label="Agent B" color="#3b82f6" icon="" w={80} />
        <Node x={355} y={90} label="Agent C" color="#10b981" icon="" w={80} />
      </svg>
    </div>
  );
}

// ── 4. Handoff ──────────────────────────────────────────────

export function HandoffPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  const mathLabel = isJa ? "数学" : "Math";
  const histLabel = isJa ? "歴史" : "History";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 440 130" className="w-full max-w-md" role="img"
        aria-label={isJa ? "Handoff パターン図" : "Handoff pattern diagram"}>
        <ArrowDefs />
        <Node x={60} y={65} label="Triage" color="#6366f1" icon="🎯" w={80} />
        <Arrow x1={100} y1={50} x2={170} y2={30} />
        <Arrow x1={100} y1={80} x2={170} y2={100} />
        <Node x={230} y={30} label={`${mathLabel} Tutor`} color="#3b82f6" icon="🔢" w={100} />
        <Node x={230} y={100} label={`${histLabel} Tutor`} color="#f59e0b" icon="📚" w={100} />
        <Arrow x1={280} y1={30} x2={350} y2={60} />
        <Arrow x1={280} y1={100} x2={350} y2={70} />
        <Node x={390} y={65} label="Output" color="#10b981" icon="💡" w={70} />
      </svg>
    </div>
  );
}

// ── 5. Writer-Critic ────────────────────────────────────────

export function WriterCriticPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  const approvedLabel = isJa ? "承認" : "approved";
  const rejectedLabel = isJa ? "拒否" : "rejected";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 520 120" className="w-full max-w-lg" role="img"
        aria-label={isJa ? "Writer-Critic パターン図" : "Writer-Critic pattern diagram"}>
        <ArrowDefs />
        <Node x={50} y={60} label="Input" color="#6366f1" icon="📝" w={70} />
        <Arrow x1={85} y1={60} x2={115} y2={60} />
        <Node x={160} y={60} label="Writer" color="#3b82f6" icon="✏️" w={75} />
        <Arrow x1={198} y1={60} x2={230} y2={60} />
        <Node x={280} y={60} label="Critic" color="#f59e0b" icon="🔍" w={75} />
        {/* Approved path */}
        <Arrow x1={318} y1={60} x2={355} y2={60} />
        <EdgeLabel x={338} y={50} text={`✅ ${approvedLabel}`} />
        <Node x={400} y={60} label="Summary" color="#10b981" icon="📄" w={75} />
        <Arrow x1={438} y1={60} x2={455} y2={60} />
        <Node x={485} y={60} label="Output" color="#8b5cf6" icon="✅" w={50} />
        {/* Rejected loop */}
        <path
          d="M 268 40 C 268 10, 172 10, 172 40"
          fill="none" stroke="#ef4444" strokeWidth={1.5}
          strokeDasharray="5 3" markerEnd="url(#wfArrow)"
        />
        <text x={220} y={12} textAnchor="middle" fill="#ef4444" fontSize={9} fontWeight={600}>
          ❌ {rejectedLabel}
        </text>
      </svg>
    </div>
  );
}

// ── 6. Group Chat ───────────────────────────────────────────

export function GroupChatPatternDiagram({ locale = "ja" }: PatternDiagramProps) {
  const isJa = locale === "ja";
  return (
    <div className="not-prose my-4 flex justify-center">
      <svg viewBox="0 0 460 160" className="w-full max-w-md" role="img"
        aria-label={isJa ? "Group Chat パターン図" : "Group Chat pattern diagram"}>
        <ArrowDefs />
        <Node x={55} y={80} label="Manager" color="#6366f1" icon="🎯" w={85} />
        {/* Fan-out */}
        <Arrow x1={98} y1={72} x2={155} y2={35} />
        <Arrow x1={98} y1={80} x2={155} y2={80} />
        <Arrow x1={98} y1={88} x2={155} y2={125} />
        {/* Agents */}
        <Node x={200} y={30} label="Agent A" color="#3b82f6" icon="" w={75} />
        <Node x={200} y={80} label="Agent B" color="#f59e0b" icon="" w={75} />
        <Node x={200} y={130} label="Agent C" color="#10b981" icon="" w={75} />
        {/* Back to Manager (loop) */}
        <Arrow x1={238} y1={35} x2={290} y2={72} />
        <Arrow x1={238} y1={80} x2={290} y2={80} />
        <Arrow x1={238} y1={125} x2={290} y2={88} />
        <Node x={335} y={80} label="Manager" color="#6366f1" icon="🔄" w={80} />
        <EdgeLabel x={335} y={110} text="repeat..." />
        <Arrow x1={375} y1={80} x2={400} y2={80} />
        <Node x={430} y={80} label="Output" color="#8b5cf6" icon="📤" w={55} />
      </svg>
    </div>
  );
}
