"use client";

import { useTheme } from "@/components/ThemeProvider";

// ── Shared color scheme ─────────────────────────────────────

function useColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    text: isDark ? "#e2e8f0" : "#1e293b",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    primary: isDark ? "#60a5fa" : "#3b82f6",
    primaryBg: isDark ? "#1e3a5f" : "#dbeafe",
    secondary: isDark ? "#34d399" : "#10b981",
    secondaryBg: isDark ? "#064e3b" : "#d1fae5",
    accent: isDark ? "#fbbf24" : "#f59e0b",
    accentBg: isDark ? "#78350f" : "#fef3c7",
    danger: isDark ? "#f87171" : "#ef4444",
    dangerBg: isDark ? "#7f1d1d" : "#fee2e2",
    purple: isDark ? "#a78bfa" : "#8b5cf6",
    purpleBg: isDark ? "#4c1d95" : "#ede9fe",
    line: isDark ? "#475569" : "#cbd5e1",
    bg: isDark ? "#0f172a" : "#ffffff",
    cardBg: isDark ? "#1e293b" : "#f8fafc",
  };
}

// ── Shared SVG helpers ──────────────────────────────────────

function RoundedRect({
  x,
  y,
  w,
  h,
  fill,
  stroke,
  label,
  labelColor,
  fontSize = 13,
  sublabel,
  sublabelColor,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  stroke: string;
  label: string;
  labelColor: string;
  fontSize?: number;
  sublabel?: string;
  sublabelColor?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={sublabel ? y + h / 2 - 6 : y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={labelColor}
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 12}
          textAnchor="middle"
          dominantBaseline="central"
          fill={sublabelColor ?? labelColor}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  const id = `arrow-${x1}-${y1}-${x2}-${y2}`;
  return (
    <g>
      <defs>
        <marker
          id={id}
          markerWidth={8}
          markerHeight={6}
          refX={7}
          refY={3}
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.5}
        markerEnd={`url(#${id})`}
      />
    </g>
  );
}

// ── 1. GC Algorithm Taxonomy ────────────────────────────────

export function GCTaxonomy({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  const nodes = [
    {
      x: 280,
      y: 15,
      w: 160,
      h: 36,
      label: ja ? "ガベージコレクション" : "Garbage Collection",
      fill: c.primaryBg,
      stroke: c.primary,
      labelColor: c.primary,
      fontSize: 12,
    },
    {
      x: 60,
      y: 95,
      w: 150,
      h: 44,
      label: ja ? "参照カウント" : "Reference Counting",
      fill: c.accentBg,
      stroke: c.accent,
      labelColor: c.accent,
      fontSize: 12,
    },
    {
      x: 500,
      y: 95,
      w: 150,
      h: 44,
      label: ja ? "トレース方式" : "Tracing GC",
      fill: c.secondaryBg,
      stroke: c.secondary,
      labelColor: c.secondary,
      fontSize: 12,
    },
    {
      x: 310,
      y: 185,
      w: 130,
      h: 44,
      label: "Mark & Sweep",
      fill: c.secondaryBg,
      stroke: c.secondary,
      labelColor: c.secondary,
      fontSize: 11,
    },
    {
      x: 470,
      y: 185,
      w: 130,
      h: 44,
      label: "Mark-Compact",
      fill: c.secondaryBg,
      stroke: c.secondary,
      labelColor: c.secondary,
      fontSize: 11,
    },
    {
      x: 625,
      y: 185,
      w: 105,
      h: 44,
      label: ja ? "コピーGC" : "Copying GC",
      fill: c.secondaryBg,
      stroke: c.secondary,
      labelColor: c.secondary,
      fontSize: 11,
    },
    {
      x: 220,
      y: 275,
      w: 120,
      h: 44,
      label: ja ? "世代別GC" : "Generational",
      fill: c.purpleBg,
      stroke: c.purple,
      labelColor: c.purple,
      fontSize: 11,
    },
    {
      x: 370,
      y: 275,
      w: 130,
      h: 44,
      label: ja ? "インクリメンタル" : "Incremental",
      fill: c.purpleBg,
      stroke: c.purple,
      labelColor: c.purple,
      fontSize: 11,
    },
    {
      x: 530,
      y: 275,
      w: 110,
      h: 44,
      label: ja ? "並行GC" : "Concurrent",
      fill: c.purpleBg,
      stroke: c.purple,
      labelColor: c.purple,
      fontSize: 11,
    },
  ];

  const lines: [number, number, number, number][] = [
    // GC → RefCount
    [360, 51, 135, 95],
    // GC → Tracing
    [360, 51, 575, 95],
    // Tracing → M&S
    [575, 139, 375, 185],
    // Tracing → M&C
    [575, 139, 535, 185],
    // Tracing → Copying
    [575, 139, 678, 185],
    // M&S → Generational
    [375, 229, 280, 275],
    // M&S → Incremental
    [375, 229, 435, 275],
    // M&S → Concurrent
    [375, 229, 585, 275],
  ];

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 750 340"
        className="w-full max-w-2xl"
        role="img"
        aria-label={
          ja ? "GCアルゴリズムの分類図" : "GC Algorithm Taxonomy Diagram"
        }
      >
        {lines.map(([x1, y1, x2, y2], i) => (
          <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} color={c.line} />
        ))}
        {nodes.map((n, i) => (
          <RoundedRect key={i} {...n} />
        ))}
      </svg>
    </div>
  );
}

// ── 2. Circular Reference Diagram ───────────────────────────

export function CircularRefDiagram({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  const ax = 100,
    bx = 300,
    cy = 80,
    r = 36;
  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 400 160"
        className="w-full max-w-sm"
        role="img"
        aria-label={ja ? "循環参照の図" : "Circular Reference Diagram"}
      >
        {/* A circle */}
        <circle
          cx={ax}
          cy={cy}
          r={r}
          fill={c.dangerBg}
          stroke={c.danger}
          strokeWidth={2}
        />
        <text
          x={ax}
          y={cy - 8}
          textAnchor="middle"
          fill={c.danger}
          fontWeight={700}
          fontSize={16}
          fontFamily="system-ui, sans-serif"
        >
          A
        </text>
        <text
          x={ax}
          y={cy + 10}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          ref=1
        </text>

        {/* B circle */}
        <circle
          cx={bx}
          cy={cy}
          r={r}
          fill={c.dangerBg}
          stroke={c.danger}
          strokeWidth={2}
        />
        <text
          x={bx}
          y={cy - 8}
          textAnchor="middle"
          fill={c.danger}
          fontWeight={700}
          fontSize={16}
          fontFamily="system-ui, sans-serif"
        >
          B
        </text>
        <text
          x={bx}
          y={cy + 10}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          ref=1
        </text>

        {/* A→B arrow (top arc) */}
        <defs>
          <marker
            id="circ-arrow-ab"
            markerWidth={8}
            markerHeight={6}
            refX={7}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={c.danger} />
          </marker>
          <marker
            id="circ-arrow-ba"
            markerWidth={8}
            markerHeight={6}
            refX={7}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={c.danger} />
          </marker>
        </defs>
        <path
          d={`M ${ax + r + 4} ${cy - 16} Q 200 ${cy - 60} ${bx - r - 4} ${cy - 16}`}
          fill="none"
          stroke={c.danger}
          strokeWidth={1.5}
          markerEnd="url(#circ-arrow-ab)"
        />
        <path
          d={`M ${bx - r - 4} ${cy + 16} Q 200 ${cy + 60} ${ax + r + 4} ${cy + 16}`}
          fill="none"
          stroke={c.danger}
          strokeWidth={1.5}
          markerEnd="url(#circ-arrow-ba)"
        />

        {/* Label */}
        <text
          x={200}
          y={148}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
        >
          {ja
            ? "外部参照なし → ref_count ≠ 0 → リーク"
            : "No external refs → ref_count ≠ 0 → Leak"}
        </text>
      </svg>
    </div>
  );
}

// ── 3. Fragmentation / Compaction Diagram ───────────────────

export function FragmentationDiagram({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  const blockH = 40;
  const gap = 2;

  type Block = { w: number; label: string; type: "obj" | "free" | "empty" };

  const before: Block[] = [
    { w: 60, label: "A", type: "obj" },
    { w: 40, label: "", type: "free" },
    { w: 80, label: "B", type: "obj" },
    { w: 50, label: "", type: "free" },
    { w: 70, label: "C", type: "obj" },
    { w: 30, label: "", type: "free" },
    { w: 60, label: "D", type: "obj" },
  ];

  const after: Block[] = [
    { w: 60, label: "A", type: "obj" },
    { w: 80, label: "B", type: "obj" },
    { w: 70, label: "C", type: "obj" },
    { w: 60, label: "D", type: "obj" },
    { w: 120, label: ja ? "空き" : "Free", type: "empty" },
  ];

  function renderRow(blocks: Block[], yOffset: number) {
    let xPos = 50;
    return blocks.map((b, i) => {
      const x = xPos;
      xPos += b.w + gap;
      let fill: string, stroke: string, textFill: string;
      if (b.type === "obj") {
        fill = c.primaryBg;
        stroke = c.primary;
        textFill = c.primary;
      } else if (b.type === "free") {
        fill = c.dangerBg;
        stroke = c.danger;
        textFill = c.danger;
      } else {
        fill = c.secondaryBg;
        stroke = c.secondary;
        textFill = c.secondary;
      }
      return (
        <g key={i}>
          <rect
            x={x}
            y={yOffset}
            width={b.w}
            height={blockH}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          {b.label && (
            <text
              x={x + b.w / 2}
              y={yOffset + blockH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={textFill}
              fontSize={13}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
            >
              {b.label}
            </text>
          )}
          {b.type === "free" && (
            <>
              <line
                x1={x + 4}
                y1={yOffset + 4}
                x2={x + b.w - 4}
                y2={yOffset + blockH - 4}
                stroke={c.danger}
                strokeWidth={1}
                opacity={0.4}
              />
              <line
                x1={x + b.w - 4}
                y1={yOffset + 4}
                x2={x + 4}
                y2={yOffset + blockH - 4}
                stroke={c.danger}
                strokeWidth={1}
                opacity={0.4}
              />
            </>
          )}
        </g>
      );
    });
  }

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 500 200"
        className="w-full max-w-lg"
        role="img"
        aria-label={
          ja
            ? "メモリの断片化とコンパクションの図"
            : "Memory Fragmentation & Compaction Diagram"
        }
      >
        {/* Labels */}
        <text
          x={24}
          y={45}
          textAnchor="end"
          fill={c.textMuted}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "前" : "Before"}
        </text>
        <text
          x={24}
          y={145}
          textAnchor="end"
          fill={c.textMuted}
          fontSize={11}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "後" : "After"}
        </text>

        {renderRow(before, 25)}

        {/* Arrow */}
        <Arrow x1={250} y1={72} x2={250} y2={115} color={c.line} />

        {renderRow(after, 120)}
      </svg>
    </div>
  );
}

// ── 4. Generational Heap Layout ─────────────────────────────

export function GenerationalHeapDiagram({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 560 300"
        className="w-full max-w-lg"
        role="img"
        aria-label={ja ? "世代別ヒープの構造" : "Generational Heap Layout"}
      >
        {/* Young Generation outline */}
        <rect
          x={30}
          y={20}
          width={500}
          height={100}
          rx={10}
          fill="none"
          stroke={c.primary}
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />
        <text
          x={280}
          y={14}
          textAnchor="middle"
          fill={c.primary}
          fontSize={13}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "Young 世代" : "Young Generation"}
        </text>

        {/* Eden */}
        <RoundedRect
          x={45}
          y={35}
          w={220}
          h={70}
          fill={c.primaryBg}
          stroke={c.primary}
          label="Eden"
          labelColor={c.primary}
          fontSize={14}
        />
        {/* Survivor spaces */}
        <RoundedRect
          x={280}
          y={35}
          w={110}
          h={70}
          fill={c.primaryBg}
          stroke={c.primary}
          label="Survivor 0"
          labelColor={c.primary}
          fontSize={12}
        />
        <RoundedRect
          x={405}
          y={35}
          w={110}
          h={70}
          fill={c.primaryBg}
          stroke={c.primary}
          label="Survivor 1"
          labelColor={c.primary}
          fontSize={12}
        />

        {/* Minor GC arrows */}
        <Arrow x1={155} y1={110} x2={335} y2={110} color={c.textMuted} />
        <text
          x={245}
          y={125}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Minor GC
        </text>

        {/* Promotion arrow */}
        <Arrow x1={460} y1={115} x2={460} y2={175} color={c.accent} />
        <text
          x={490}
          y={150}
          fill={c.accent}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "昇格" : "Promote"}
        </text>

        {/* Old Generation outline */}
        <rect
          x={30}
          y={180}
          width={500}
          height={80}
          rx={10}
          fill="none"
          stroke={c.accent}
          strokeWidth={1.5}
          strokeDasharray="6 3"
        />
        <text
          x={280}
          y={174}
          textAnchor="middle"
          fill={c.accent}
          fontSize={13}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "Old 世代" : "Old Generation"}
        </text>

        {/* Tenured */}
        <RoundedRect
          x={45}
          y={195}
          w={470}
          h={50}
          fill={c.accentBg}
          stroke={c.accent}
          label={ja ? "Tenured（長寿命オブジェクト）" : "Tenured (Long-lived Objects)"}
          labelColor={c.accent}
          fontSize={13}
        />

        {/* Major GC note */}
        <text
          x={280}
          y={290}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {ja
            ? "Minor GC: Young世代のみ（高頻度・高速）/ Major GC: 全ヒープ（低頻度・低速）"
            : "Minor GC: Young gen only (frequent, fast) / Major GC: Full heap (rare, slow)"}
        </text>
      </svg>
    </div>
  );
}

// ── 5. Concurrency Timeline / Comparison ────────────────────

export function ConcurrencyTimeline({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  const barY = [35, 95, 155];
  const barH = 30;
  const leftX = 140;
  const totalW = 440;

  type Segment = {
    fraction: number;
    label: string;
    fill: string;
    textColor: string;
  };
  const rows: { title: string; segments: Segment[] }[] = [
    {
      title: "Stop-The-World",
      segments: [
        {
          fraction: 1.0,
          label: ja ? "全ヒープGC" : "Full Heap GC",
          fill: c.dangerBg,
          textColor: c.danger,
        },
      ],
    },
    {
      title: ja ? "インクリメンタル" : "Incremental",
      segments: [
        {
          fraction: 0.18,
          label: "Mark",
          fill: c.accentBg,
          textColor: c.accent,
        },
        {
          fraction: 0.15,
          label: "App",
          fill: c.secondaryBg,
          textColor: c.secondary,
        },
        {
          fraction: 0.18,
          label: "Mark",
          fill: c.accentBg,
          textColor: c.accent,
        },
        {
          fraction: 0.15,
          label: "App",
          fill: c.secondaryBg,
          textColor: c.secondary,
        },
        {
          fraction: 0.18,
          label: "Mark",
          fill: c.accentBg,
          textColor: c.accent,
        },
        {
          fraction: 0.16,
          label: "Sweep",
          fill: c.purpleBg,
          textColor: c.purple,
        },
      ],
    },
    {
      title: ja ? "並行GC" : "Concurrent",
      segments: [
        {
          fraction: 0.6,
          label: ja ? "App (並行マーク)" : "App (concurrent mark)",
          fill: c.secondaryBg,
          textColor: c.secondary,
        },
        {
          fraction: 0.12,
          label: "STW",
          fill: c.dangerBg,
          textColor: c.danger,
        },
        {
          fraction: 0.28,
          label: ja ? "App (並行スイープ)" : "App (concurrent sweep)",
          fill: c.secondaryBg,
          textColor: c.secondary,
        },
      ],
    },
  ];

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 600 210"
        className="w-full max-w-2xl"
        role="img"
        aria-label={
          ja
            ? "GC方式ごとのタイムライン比較"
            : "GC Concurrency Timeline Comparison"
        }
      >
        {rows.map((row, ri) => {
          let xPos = leftX;
          return (
            <g key={ri}>
              <text
                x={leftX - 8}
                y={barY[ri] + barH / 2}
                textAnchor="end"
                dominantBaseline="central"
                fill={c.text}
                fontSize={11}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {row.title}
              </text>
              {row.segments.map((seg, si) => {
                const w = seg.fraction * totalW;
                const x = xPos;
                xPos += w;
                return (
                  <g key={si}>
                    <rect
                      x={x}
                      y={barY[ri]}
                      width={w}
                      height={barH}
                      rx={4}
                      fill={seg.fill}
                      stroke={seg.textColor}
                      strokeWidth={1}
                    />
                    {w > 40 && (
                      <text
                        x={x + w / 2}
                        y={barY[ri] + barH / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={seg.textColor}
                        fontSize={9}
                        fontWeight={500}
                        fontFamily="system-ui, sans-serif"
                      >
                        {seg.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* Time axis */}
        <Arrow
          x1={leftX}
          y1={198}
          x2={leftX + totalW}
          y2={198}
          color={c.textMuted}
        />
        <text
          x={leftX + totalW / 2}
          y={210}
          textAnchor="middle"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "時間 →" : "Time →"}
        </text>
      </svg>
    </div>
  );
}

// ── 6. Python Hybrid GC Flowchart ───────────────────────────

export function PythonHybridDiagram({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox="0 0 540 260"
        className="w-full max-w-lg"
        role="img"
        aria-label={ja ? "PythonのハイブリッドGC" : "Python Hybrid GC"}
      >
        {/* Reference Counting box */}
        <RoundedRect
          x={30}
          y={20}
          w={150}
          h={44}
          fill={c.primaryBg}
          stroke={c.primary}
          label={ja ? "参照カウント" : "Reference Counting"}
          labelColor={c.primary}
          fontSize={12}
        />

        {/* Arrow to diamond */}
        <Arrow x1={180} y1={42} x2={225} y2={42} color={c.line} />

        {/* Diamond: ref == 0? */}
        <polygon
          points="280,12 335,42 280,72 225,42"
          fill={c.cardBg}
          stroke={c.line}
          strokeWidth={1.5}
        />
        <text
          x={280}
          y={42}
          textAnchor="middle"
          dominantBaseline="central"
          fill={c.text}
          fontSize={11}
          fontWeight={600}
          fontFamily="system-ui, sans-serif"
        >
          ref == 0?
        </text>

        {/* Yes → Free */}
        <Arrow x1={335} y1={42} x2={390} y2={42} color={c.secondary} />
        <text
          x={360}
          y={34}
          textAnchor="middle"
          fill={c.secondary}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          Yes
        </text>
        <RoundedRect
          x={390}
          y={20}
          w={120}
          h={44}
          fill={c.secondaryBg}
          stroke={c.secondary}
          label={ja ? "即座に解放" : "Free immediately"}
          labelColor={c.secondary}
          fontSize={12}
        />

        {/* No → Cycle possible */}
        <Arrow x1={280} y1={72} x2={280} y2={110} color={c.danger} />
        <text
          x={295}
          y={94}
          fill={c.danger}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          No
        </text>

        {/* Cycle possible box */}
        <RoundedRect
          x={195}
          y={110}
          w={170}
          h={44}
          fill={c.dangerBg}
          stroke={c.danger}
          label={ja ? "循環参照の可能性" : "Possible circular ref"}
          labelColor={c.danger}
          fontSize={11}
        />

        {/* Arrow to generational GC */}
        <Arrow x1={280} y1={154} x2={280} y2={190} color={c.line} />

        {/* Generational Tracing GC */}
        <RoundedRect
          x={155}
          y={190}
          w={250}
          h={50}
          fill={c.accentBg}
          stroke={c.accent}
          label={ja ? "世代別トレースGC" : "Generational Tracing GC"}
          sublabel={ja ? "循環ガベージを検出・回収" : "Detect & collect cyclic garbage"}
          labelColor={c.accent}
          sublabelColor={c.textMuted}
          fontSize={13}
        />
      </svg>
    </div>
  );
}

// ── 7. GC Timeline ──────────────────────────────────────────

export function GCTimelineDiagram({ locale }: { locale?: string }) {
  const c = useColors();
  const ja = locale === "ja";

  type Entry = { year: string; event: string; category: "theory" | "impl" };
  const entries: Entry[] = [
    { year: "1959", event: "Mark & Sweep (McCarthy, Lisp)", category: "theory" },
    { year: "1960", event: "Reference Counting (Collins)", category: "theory" },
    { year: "1969", event: "Copying GC (Fenichel & Yochelson)", category: "theory" },
    {
      year: "1978",
      event: "Tri-color Marking (Dijkstra et al.)",
      category: "theory",
    },
    {
      year: "1983",
      event: "Generational GC (Lieberman & Hewitt)",
      category: "theory",
    },
    {
      year: "1992",
      event: "Train Algorithm (Hudson & Moss)",
      category: "theory",
    },
    {
      year: "2004",
      event: ja ? "G1 GC 研究論文 (Detlefs et al.)" : "G1 GC research paper (Detlefs et al.)",
      category: "impl",
    },
    {
      year: "2015",
      event: ja ? "Go 1.5 並行GC (STW < 10ms)" : "Go 1.5 concurrent GC (STW < 10ms)",
      category: "impl",
    },
    {
      year: "2017",
      event: ja
        ? "Go 1.8 ハイブリッドバリア (STW < 1ms)"
        : "Go 1.8 hybrid barrier (STW < 1ms)",
      category: "impl",
    },
    {
      year: "2018",
      event: "ZGC experimental (JDK 11)",
      category: "impl",
    },
    {
      year: "2020",
      event: "Shenandoah GA (JDK 15)",
      category: "impl",
    },
    {
      year: "2023",
      event: ja ? "ZGC 世代別化 (JDK 21)" : "Generational ZGC (JDK 21)",
      category: "impl",
    },
  ];

  const lineX = 80;
  const startY = 30;
  const stepY = 38;

  return (
    <div className="my-6 flex justify-center">
      <svg
        viewBox={`0 0 520 ${startY + entries.length * stepY + 10}`}
        className="w-full max-w-lg"
        role="img"
        aria-label={ja ? "GC技術の年表" : "GC Technology Timeline"}
      >
        {/* Vertical line */}
        <line
          x1={lineX}
          y1={startY}
          x2={lineX}
          y2={startY + (entries.length - 1) * stepY}
          stroke={c.line}
          strokeWidth={2}
        />

        {entries.map((entry, i) => {
          const y = startY + i * stepY;
          const dotColor =
            entry.category === "theory" ? c.primary : c.secondary;
          return (
            <g key={i}>
              <circle cx={lineX} cy={y} r={5} fill={dotColor} />
              <text
                x={lineX - 14}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fill={c.textMuted}
                fontSize={11}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                {entry.year}
              </text>
              <text
                x={lineX + 16}
                y={y}
                dominantBaseline="central"
                fill={c.text}
                fontSize={11}
                fontFamily="system-ui, sans-serif"
              >
                {entry.event}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <circle
          cx={lineX + 16}
          cy={startY + entries.length * stepY + 2}
          r={4}
          fill={c.primary}
        />
        <text
          x={lineX + 26}
          y={startY + entries.length * stepY + 2}
          dominantBaseline="central"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "理論" : "Theory"}
        </text>
        <circle
          cx={lineX + 90}
          cy={startY + entries.length * stepY + 2}
          r={4}
          fill={c.secondary}
        />
        <text
          x={lineX + 100}
          y={startY + entries.length * stepY + 2}
          dominantBaseline="central"
          fill={c.textMuted}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {ja ? "実装" : "Implementation"}
        </text>
      </svg>
    </div>
  );
}
