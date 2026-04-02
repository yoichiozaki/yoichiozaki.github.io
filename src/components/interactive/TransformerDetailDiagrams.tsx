"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Positional Encoding Diagram ──────────────── */

export function PositionalEncodingDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const orange = dark ? "#f59e0b" : "#d97706";
  const green = dark ? "#22c55e" : "#16a34a";
  const en = locale === "en";

  // Generate sinusoidal PE values for visualization
  // PE(pos,2i) = sin(pos/10000^(2i/d)), PE(pos,2i+1) = cos(pos/10000^(2i/d))
  const positions = 8;
  const dims = 16;
  const peValues: number[][] = [];
  for (let pos = 0; pos < positions; pos++) {
    const row: number[] = [];
    for (let i = 0; i < dims; i++) {
      const dModel = 64;
      const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel);
      row.push(i % 2 === 0 ? Math.sin(angle) : Math.cos(angle));
    }
    peValues.push(row);
  }

  const cellW = 22;
  const cellH = 18;
  const offsetX = 50;
  const offsetY = 60;

  function valueToColor(v: number): string {
    // Map [-1, 1] to color intensity
    if (v >= 0) {
      const intensity = Math.round(v * 255);
      return dark
        ? `rgb(${30 + intensity * 0.4}, ${30 + intensity * 0.7}, ${30 + intensity})`
        : `rgb(${255 - intensity * 0.5}, ${255 - intensity * 0.3}, ${255 - intensity})`;
    } else {
      const intensity = Math.round(-v * 255);
      return dark
        ? `rgb(${30 + intensity}, ${30 + intensity * 0.3}, ${30})`
        : `rgb(${255 - intensity * 0.1}, ${255 - intensity * 0.6}, ${255 - intensity * 0.5})`;
    }
  }

  return (
    <div className="not-prose my-6 flex justify-center overflow-x-auto">
      <svg viewBox="0 0 480 260" className="w-full max-w-lg">
        <text x={240} y={20} textAnchor="middle" fill={text} fontSize={13} fontWeight={700}>
          {en ? "Sinusoidal Positional Encoding" : "正弦波位置エンコーディング"}
        </text>
        <text x={240} y={38} textAnchor="middle" fill={muted} fontSize={9}>
          PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
        </text>

        {/* Y-axis label: position */}
        <text x={12} y={offsetY + (positions * cellH) / 2} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9} transform={`rotate(-90, 12, ${offsetY + (positions * cellH) / 2})`}>
          {en ? "Position" : "位置"}
        </text>

        {/* X-axis label: dimension */}
        <text x={offsetX + (dims * cellW) / 2} y={offsetY + positions * cellH + 18} textAnchor="middle" fill={muted} fontSize={9}>
          {en ? "Dimension" : "次元"}
        </text>

        {/* Position labels */}
        {Array.from({ length: positions }, (_, p) => (
          <text key={`pos-${p}`} x={offsetX - 6} y={offsetY + p * cellH + cellH / 2} textAnchor="end" dominantBaseline="central" fill={muted} fontSize={8} fontFamily="monospace">
            {p}
          </text>
        ))}

        {/* Dimension labels */}
        {Array.from({ length: dims }, (_, d) => (
          <text key={`dim-${d}`} x={offsetX + d * cellW + cellW / 2} y={offsetY - 6} textAnchor="middle" fill={muted} fontSize={7} fontFamily="monospace">
            {d}
          </text>
        ))}

        {/* Heatmap cells */}
        {peValues.map((row, p) =>
          row.map((v, d) => (
            <rect
              key={`${p}-${d}`}
              x={offsetX + d * cellW}
              y={offsetY + p * cellH}
              width={cellW}
              height={cellH}
              fill={valueToColor(v)}
              stroke={border}
              strokeWidth={0.3}
            />
          ))
        )}

        {/* Legend */}
        <text x={offsetX} y={offsetY + positions * cellH + 38} fill={muted} fontSize={8}>
          {en ? "Blue = positive    Red = negative    (sin for even dims, cos for odd dims)" : "青 = 正    赤 = 負    (偶数次元: sin, 奇数次元: cos)"}
        </text>

        {/* Highlight: low-freq vs high-freq annotation */}
        <line x1={offsetX} y1={offsetY + positions * cellH + 48} x2={offsetX + 4 * cellW} y2={offsetY + positions * cellH + 48} stroke={accent} strokeWidth={1.5} />
        <text x={offsetX + 2 * cellW} y={offsetY + positions * cellH + 58} textAnchor="middle" fill={accent} fontSize={7}>
          {en ? "High frequency" : "高周波"}
        </text>
        <line x1={offsetX + 12 * cellW} y1={offsetY + positions * cellH + 48} x2={offsetX + 16 * cellW} y2={offsetY + positions * cellH + 48} stroke={orange} strokeWidth={1.5} />
        <text x={offsetX + 14 * cellW} y={offsetY + positions * cellH + 58} textAnchor="middle" fill={orange} fontSize={7}>
          {en ? "Low frequency" : "低周波"}
        </text>
      </svg>
    </div>
  );
}

/* ── 2. Pre-LN vs Post-LN ────────────────────────── */

export function PreLNvsPostLN({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const en = locale === "en";

  const bw = 130;
  const bh = 24;

  type Block = { y: number; label: string; color: string };

  const postLN: Block[] = [
    { y: 20, label: "x", color: muted },
    { y: 56, label: en ? "Self-Attention" : "自己注意", color: accent },
    { y: 92, label: en ? "Add (residual)" : "加算 (残差)", color: orange },
    { y: 128, label: "LayerNorm", color: green },
    { y: 164, label: "FFN", color: accent },
    { y: 200, label: en ? "Add (residual)" : "加算 (残差)", color: orange },
    { y: 236, label: "LayerNorm", color: green },
  ];

  const preLN: Block[] = [
    { y: 20, label: "x", color: muted },
    { y: 56, label: "RMSNorm", color: green },
    { y: 92, label: en ? "Self-Attention" : "自己注意", color: accent },
    { y: 128, label: en ? "Add (residual)" : "加算 (残差)", color: orange },
    { y: 164, label: "RMSNorm", color: green },
    { y: 200, label: "FFN", color: accent },
    { y: 236, label: en ? "Add (residual)" : "加算 (残差)", color: orange },
  ];

  function renderColumn(blocks: Block[], cx: number, title: string, titleColor: string) {
    return (
      <g>
        <text x={cx} y={12} textAnchor="middle" fill={titleColor} fontSize={11} fontWeight={700}>
          {title}
        </text>
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={cx - bw / 2} y={b.y} width={bw} height={bh} rx={4} fill={bg} stroke={b.color} strokeWidth={1.5} />
            <text x={cx} y={b.y + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600}>
              {b.label}
            </text>
            {i < blocks.length - 1 && (
              <line x1={cx} y1={b.y + bh} x2={cx} y2={blocks[i + 1].y} stroke={border} strokeWidth={1} markerEnd="url(#arrowDown)" />
            )}
          </g>
        ))}
        {/* Residual skip arrows */}
        {/* For Post-LN: x → Add at y=92, and LN(128) → Add at y=200 */}
        {/* For Pre-LN: x → Add at y=128, and Add(128) → Add at y=236 */}
      </g>
    );
  }

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 400 280" className="w-full max-w-md">
        {renderColumn(postLN, 110, en ? "Post-LN (Original)" : "Post-LN (オリジナル)", muted)}
        {renderColumn(preLN, 290, en ? "Pre-LN (Modern)" : "Pre-LN (現代)", accent)}

        {/* Divider */}
        <line x1={200} y1={0} x2={200} y2={270} stroke={border} strokeWidth={0.5} strokeDasharray="4 2" />

        {/* Post-LN residual arrow: x → Add */}
        <path d={`M ${110 - bw / 2 - 6} ${20 + bh / 2} L ${110 - bw / 2 - 6} ${92 + bh / 2} L ${110 - bw / 2} ${92 + bh / 2}`} fill="none" stroke={orange} strokeWidth={1} strokeDasharray="3 2" />
        <path d={`M ${110 - bw / 2 - 6} ${128 + bh / 2} L ${110 - bw / 2 - 6} ${200 + bh / 2} L ${110 - bw / 2} ${200 + bh / 2}`} fill="none" stroke={orange} strokeWidth={1} strokeDasharray="3 2" />

        {/* Pre-LN residual arrow: x → Add */}
        <path d={`M ${290 + bw / 2 + 6} ${20 + bh / 2} L ${290 + bw / 2 + 6} ${128 + bh / 2} L ${290 + bw / 2} ${128 + bh / 2}`} fill="none" stroke={orange} strokeWidth={1} strokeDasharray="3 2" />
        <path d={`M ${290 + bw / 2 + 6} ${128 + bh / 2} L ${290 + bw / 2 + 6} ${236 + bh / 2} L ${290 + bw / 2} ${236 + bh / 2}`} fill="none" stroke={orange} strokeWidth={1} strokeDasharray="3 2" />

        <defs>
          <marker id="arrowDown" markerWidth="6" markerHeight="5" refX="3" refY="0" orient="auto">
            <path d="M0,0 L3,5 L6,0" fill="none" stroke={border} strokeWidth={0.8} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── 3. Multi-Head Attention Diagram ──────────────── */

export function MultiHeadAttentionDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const red = dark ? "#ef4444" : "#dc2626";
  const en = locale === "en";

  const headColors = [accent, green, orange, purple];
  const numHeads = 4;
  const headW = 70;
  const headH = 60;
  const headGap = 14;
  const startX = (500 - (numHeads * headW + (numHeads - 1) * headGap)) / 2;

  return (
    <div className="not-prose my-6 flex justify-center overflow-x-auto">
      <svg viewBox="0 0 500 320" className="w-full max-w-lg">
        {/* Input */}
        <rect x={150} y={270} width={200} height={28} rx={5} fill={bg} stroke={border} strokeWidth={1.5} />
        <text x={250} y={284} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
          {en ? "Input X (d_model = 512)" : "入力 X (d_model = 512)"}
        </text>

        {/* Linear projections */}
        {Array.from({ length: numHeads }, (_, i) => {
          const hx = startX + i * (headW + headGap);
          const hcx = hx + headW / 2;
          return (
            <g key={i}>
              {/* Arrow from input to head */}
              <line x1={250} y1={270} x2={hcx} y2={230} stroke={headColors[i]} strokeWidth={1} />

              {/* Head box */}
              <rect x={hx} y={168} width={headW} height={headH} rx={5} fill={bg} stroke={headColors[i]} strokeWidth={1.5} />
              <text x={hcx} y={182} textAnchor="middle" dominantBaseline="central" fill={headColors[i]} fontSize={8} fontWeight={700}>
                Head {i + 1}
              </text>
              <text x={hcx} y={196} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={7} fontFamily="monospace">
                d_k = {en ? "128" : "128"}
              </text>
              <text x={hcx} y={208} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={7} fontFamily="monospace">
                Q·Kᵀ/√d_k → V
              </text>
              <text x={hcx} y={222} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={6}>
                {en
                  ? i === 0 ? "subj–verb" : i === 1 ? "adj–noun" : i === 2 ? "coref" : "syntax"
                  : i === 0 ? "主語-動詞" : i === 1 ? "形容詞-名詞" : i === 2 ? "共参照" : "構文"}
              </text>

              {/* Arrow from head to concat */}
              <line x1={hcx} y1={168} x2={hcx} y2={145} stroke={headColors[i]} strokeWidth={1} />
            </g>
          );
        })}

        {/* Concat */}
        <rect x={startX} y={115} width={numHeads * headW + (numHeads - 1) * headGap} height={28} rx={5} fill={bg} stroke={red} strokeWidth={1.5} />
        <text x={250} y={129} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
          {en ? "Concat (d_k × h = 512)" : "連結 (d_k × h = 512)"}
        </text>

        {/* Arrow to linear */}
        <line x1={250} y1={115} x2={250} y2={95} stroke={border} strokeWidth={1} />

        {/* Linear W_O */}
        <rect x={150} y={65} width={200} height={28} rx={5} fill={bg} stroke={accent} strokeWidth={1.5} />
        <text x={250} y={79} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
          {en ? "Linear W_O → Output" : "線形変換 W_O → 出力"}
        </text>

        {/* Arrow out */}
        <line x1={250} y1={65} x2={250} y2={45} stroke={border} strokeWidth={1} />
        <text x={250} y={38} textAnchor="middle" fill={muted} fontSize={9}>
          {en ? "Multi-Head Output (d_model = 512)" : "マルチヘッド出力 (d_model = 512)"}
        </text>

        {/* Annotation */}
        <text x={250} y={12} textAnchor="middle" fill={text} fontSize={11} fontWeight={700}>
          MultiHead(Q,K,V) = Concat(head₁, …, headₕ) · W_O
        </text>
      </svg>
    </div>
  );
}

/* ── 4. Causal Mask Diagram ───────────────────────── */

export function CausalMaskDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const blocked = dark ? "#dc2626" : "#ef4444";
  const allowed = dark ? "#22c55e" : "#16a34a";
  const en = locale === "en";

  const tokens = ["The", "cat", "sat", "on", "the"];
  const n = tokens.length;
  const cellSize = 40;
  const offsetX = 80;
  const offsetY = 60;

  return (
    <div className="not-prose my-6 flex justify-center overflow-x-auto">
      <svg viewBox="0 0 380 340" className="w-full max-w-sm">
        <text x={190} y={18} textAnchor="middle" fill={text} fontSize={12} fontWeight={700}>
          {en ? "Causal Mask (Attention Matrix)" : "因果マスク (注意行列)"}
        </text>
        <text x={190} y={35} textAnchor="middle" fill={muted} fontSize={9}>
          {en ? "Green = attend, Red = masked (-∞)" : "緑 = 注意可能, 赤 = マスク (-∞)"}
        </text>

        {/* Column headers (Key) */}
        <text x={offsetX + (n * cellSize) / 2} y={offsetY - 20} textAnchor="middle" fill={muted} fontSize={9} fontWeight={600}>
          Key →
        </text>
        {tokens.map((t, i) => (
          <text key={`col-${i}`} x={offsetX + i * cellSize + cellSize / 2} y={offsetY - 6} textAnchor="middle" fill={text} fontSize={9} fontFamily="monospace">
            {t}
          </text>
        ))}

        {/* Row headers (Query) */}
        <text x={offsetX - 16} y={offsetY + (n * cellSize) / 2} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9} fontWeight={600} transform={`rotate(-90, ${offsetX - 16}, ${offsetY + (n * cellSize) / 2})`}>
          Query →
        </text>
        {tokens.map((t, i) => (
          <text key={`row-${i}`} x={offsetX - 6} y={offsetY + i * cellSize + cellSize / 2} textAnchor="end" dominantBaseline="central" fill={text} fontSize={9} fontFamily="monospace">
            {t}
          </text>
        ))}

        {/* Mask grid */}
        {tokens.map((_, qi) =>
          tokens.map((_, ki) => {
            const canAttend = ki <= qi;
            return (
              <g key={`${qi}-${ki}`}>
                <rect
                  x={offsetX + ki * cellSize}
                  y={offsetY + qi * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill={canAttend ? (dark ? "#052e16" : "#dcfce7") : (dark ? "#450a0a" : "#fee2e2")}
                  stroke={border}
                  strokeWidth={0.5}
                />
                <text
                  x={offsetX + ki * cellSize + cellSize / 2}
                  y={offsetY + qi * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={canAttend ? allowed : blocked}
                  fontSize={10}
                  fontWeight={600}
                >
                  {canAttend ? "✓" : "−∞"}
                </text>
              </g>
            );
          })
        )}

        {/* Annotation */}
        <text x={190} y={offsetY + n * cellSize + 22} textAnchor="middle" fill={muted} fontSize={8}>
          {en
            ? 'Token "sat" (row 3) can see "The", "cat", "sat" but NOT "on", "the"'
            : '"sat" (行3) は "The", "cat", "sat" を参照可能、"on", "the" は不可'}
        </text>
      </svg>
    </div>
  );
}

/* ── 5. SwiGLU FFN Diagram ────────────────────────── */

export function SwiGLUDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const en = locale === "en";

  const cx = 220;
  const bw = 140;
  const bh = 28;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 440 300" className="w-full max-w-sm">
        <text x={cx} y={18} textAnchor="middle" fill={text} fontSize={12} fontWeight={700}>
          {en ? "SwiGLU Feed-Forward Network" : "SwiGLU フィードフォワードネットワーク"}
        </text>

        {/* Input */}
        <rect x={cx - bw / 2} y={40} width={bw} height={bh} rx={5} fill={bg} stroke={border} strokeWidth={1.5} />
        <text x={cx} y={40 + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
          x (d_model)
        </text>

        {/* Split into two branches */}
        <line x1={cx} y1={40 + bh} x2={cx - 60} y2={90} stroke={border} strokeWidth={1} />
        <line x1={cx} y1={40 + bh} x2={cx + 60} y2={90} stroke={border} strokeWidth={1} />

        {/* Left branch: W1 → Swish */}
        <rect x={cx - 60 - 55} y={90} width={110} height={bh} rx={5} fill={bg} stroke={accent} strokeWidth={1.5} />
        <text x={cx - 60} y={90 + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600}>
          x · W₁ (d_ff)
        </text>

        <line x1={cx - 60} y1={90 + bh} x2={cx - 60} y2={140} stroke={border} strokeWidth={1} />

        <rect x={cx - 60 - 55} y={140} width={110} height={bh} rx={5} fill={bg} stroke={green} strokeWidth={1.5} />
        <text x={cx - 60} y={140 + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600}>
          Swish(x) = x · σ(x)
        </text>

        {/* Right branch: W3 (gate) */}
        <rect x={cx + 60 - 55} y={90} width={110} height={bh} rx={5} fill={bg} stroke={orange} strokeWidth={1.5} />
        <text x={cx + 60} y={90 + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600}>
          x · W₃ (d_ff)
        </text>
        <text x={cx + 60} y={90 + bh + 14} textAnchor="middle" fill={muted} fontSize={7}>
          {en ? "(gate)" : "(ゲート)"}
        </text>

        {/* Merge: element-wise multiply */}
        <line x1={cx - 60} y1={140 + bh} x2={cx} y2={195} stroke={border} strokeWidth={1} />
        <line x1={cx + 60} y1={90 + bh} x2={cx} y2={195} stroke={border} strokeWidth={1} />

        <circle cx={cx} cy={200} r={14} fill={bg} stroke={purple} strokeWidth={1.5} />
        <text x={cx} y={200} textAnchor="middle" dominantBaseline="central" fill={purple} fontSize={14} fontWeight={700}>
          ⊙
        </text>
        <text x={cx + 22} y={200} textAnchor="start" dominantBaseline="central" fill={muted} fontSize={8}>
          {en ? "element-wise" : "要素積"}
        </text>

        {/* W2 projection */}
        <line x1={cx} y1={214} x2={cx} y2={230} stroke={border} strokeWidth={1} />

        <rect x={cx - bw / 2} y={230} width={bw} height={bh} rx={5} fill={bg} stroke={accent} strokeWidth={1.5} />
        <text x={cx} y={230 + bh / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={9} fontWeight={600}>
          · W₂ → {en ? "output" : "出力"} (d_model)
        </text>

        {/* Formula */}
        <text x={cx} y={282} textAnchor="middle" fill={muted} fontSize={8}>
          SwiGLU(x) = (Swish(x · W₁) ⊙ (x · W₃)) · W₂
        </text>
      </svg>
    </div>
  );
}

/* ── 6. RoPE Diagram ─────────────────────────────── */

export function RoPEDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const en = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 460 240" className="w-full max-w-md">
        <text x={230} y={18} textAnchor="middle" fill={text} fontSize={12} fontWeight={700}>
          {en ? "RoPE (Rotary Position Embedding)" : "RoPE (回転位置埋め込み)"}
        </text>

        {/* Vector pair concept */}
        <text x={230} y={42} textAnchor="middle" fill={muted} fontSize={9}>
          {en
            ? "Pairs of dimensions are rotated by position-dependent angles"
            : "次元のペアを位置に依存した角度で回転させる"}
        </text>

        {/* Show 2D rotation for dimension pair (d0, d1) */}
        {/* Circle representing rotation */}
        {[0, 1, 2].map((posIdx) => {
          const cx = 80 + posIdx * 140;
          const cy = 130;
          const r = 50;
          const angle = (posIdx * 30 * Math.PI) / 180;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy - r * Math.sin(angle);
          const posColors = [accent, green, orange];

          return (
            <g key={posIdx}>
              <text x={cx} y={65} textAnchor="middle" fill={posColors[posIdx]} fontSize={10} fontWeight={700}>
                pos = {posIdx}
              </text>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke={border} strokeWidth={0.8} strokeDasharray="3 2" />
              {/* Axes */}
              <line x1={cx - r - 5} y1={cy} x2={cx + r + 5} y2={cy} stroke={border} strokeWidth={0.5} />
              <line x1={cx} y1={cy - r - 5} x2={cx} y2={cy + r + 5} stroke={border} strokeWidth={0.5} />
              {/* Vector arrow */}
              <line x1={cx} y1={cy} x2={x1} y2={y1} stroke={posColors[posIdx]} strokeWidth={2} />
              <circle cx={x1} cy={y1} r={3} fill={posColors[posIdx]} />
              {/* Angle arc */}
              {posIdx > 0 && (
                <path
                  d={`M ${cx + 20} ${cy} A 20 20 0 0 0 ${cx + 20 * Math.cos(angle)} ${cy - 20 * Math.sin(angle)}`}
                  fill="none"
                  stroke={posColors[posIdx]}
                  strokeWidth={1}
                />
              )}
              <text x={cx} y={cy + r + 18} textAnchor="middle" fill={muted} fontSize={8}>
                θ = {posIdx * 30}°
              </text>
              {/* Dimension labels */}
              <text x={cx + r + 8} y={cy + 3} fill={muted} fontSize={7}>d₀</text>
              <text x={cx + 3} y={cy - r - 4} fill={muted} fontSize={7}>d₁</text>
            </g>
          );
        })}

        {/* Key insight */}
        <text x={230} y={215} textAnchor="middle" fill={text} fontSize={9} fontWeight={600}>
          {en
            ? "q_m · k_n depends only on relative position (m − n)"
            : "q_m · k_n は相対位置 (m − n) のみに依存"}
        </text>
        <text x={230} y={232} textAnchor="middle" fill={muted} fontSize={8}>
          {en
            ? "→ Naturally captures relative positional relationships"
            : "→ 相対的な位置関係を自然に捉える"}
        </text>
      </svg>
    </div>
  );
}
