"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. LLM Timeline ──────────────────────────── */

export function LLMTimeline({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  const events = [
    { year: "2013", label: "Word2Vec", desc: en ? "Word embeddings" : "単語埋め込み", color: border, x: 40 },
    { year: "2017", label: "Transformer", desc: en ? "Attention Is All You Need" : "Attention Is All You Need", color: accent, x: 140 },
    { year: "2018", label: "BERT / GPT-1", desc: en ? "Pre-training era begins" : "事前学習時代の幕開け", color: green, x: 250 },
    { year: "2020", label: "GPT-3", desc: en ? "175B params, few-shot" : "1750億パラメータ", color: orange, x: 380 },
    { year: "2022", label: "ChatGPT", desc: en ? "RLHF + Instruction tuning" : "RLHF + 指示チューニング", color: purple, x: 500 },
    { year: "2024–", label: en ? "GPT-4o / Gemini / Claude" : "GPT-4o / Gemini / Claude", desc: en ? "Multimodal, reasoning" : "マルチモーダル・推論", color: purple, x: 640 },
  ];

  const lineY = 50;
  const boxY = 75;

  return (
    <div className="not-prose my-6 flex justify-center overflow-x-auto">
      <svg viewBox="0 0 780 160" className="w-full max-w-4xl min-w-[600px]">
        {/* Main timeline line */}
        <line x1={30} y1={lineY} x2={750} y2={lineY} stroke={border} strokeWidth={2} />
        <polygon points={`748,${lineY - 4} 756,${lineY} 748,${lineY + 4}`} fill={border} />

        {events.map((ev, i) => (
          <g key={i}>
            {/* Dot */}
            <circle cx={ev.x} cy={lineY} r={5} fill={ev.color} />
            {/* Year */}
            <text x={ev.x} y={lineY - 14} textAnchor="middle" dominantBaseline="auto" fill={muted} fontSize={10} fontWeight={600}>
              {ev.year}
            </text>
            {/* Connector */}
            <line x1={ev.x} y1={lineY + 5} x2={ev.x} y2={boxY} stroke={ev.color} strokeWidth={1} strokeDasharray="3 2" />
            {/* Label */}
            <rect x={ev.x - 55} y={boxY} width={110} height={42} rx={6} fill={bg} stroke={ev.color} strokeWidth={1.5} />
            <text x={ev.x} y={boxY + 16} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={11} fontWeight={700}>
              {ev.label}
            </text>
            <text x={ev.x} y={boxY + 32} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
              {ev.desc}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── 2. Transformer Architecture ───────────────── */

export function TransformerArchitecture({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  const bw = 160;
  const cx = 200;
  const layers = [
    { y: 350, h: 36, label: en ? "Input Embedding + Positional Encoding" : "入力埋め込み + 位置エンコーディング", color: border },
    { y: 290, h: 42, label: en ? "Multi-Head Self-Attention" : "マルチヘッド自己注意機構", color: accent },
    { y: 240, h: 30, label: en ? "Add & Layer Norm" : "残差接続 & 層正規化", color: muted },
    { y: 190, h: 36, label: en ? "Feed-Forward Network" : "フィードフォワードネットワーク", color: green },
    { y: 140, h: 30, label: en ? "Add & Layer Norm" : "残差接続 & 層正規化", color: muted },
    { y: 70, h: 36, label: en ? "Linear + Softmax → Probabilities" : "線形層 + Softmax → 確率分布", color: purple },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 400 420" className="w-full max-w-sm">
        {/* Nx bracket */}
        <text x={cx + bw / 2 + 20} y={240} textAnchor="start" dominantBaseline="central" fill={orange} fontSize={14} fontWeight={700}>
          × N
        </text>
        <rect x={cx - bw / 2 - 10} y={135} width={bw + 20} height={210} rx={8} fill="none" stroke={orange} strokeWidth={1.5} strokeDasharray="6 3" />

        {layers.map((layer, i) => (
          <g key={i}>
            <rect x={cx - bw / 2} y={layer.y} width={bw} height={layer.h} rx={6} fill={bg} stroke={layer.color} strokeWidth={1.5} />
            <text x={cx} y={layer.y + layer.h / 2} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
              {layer.label}
            </text>
            {/* Arrow upward */}
            {i < layers.length - 1 && (
              <line x1={cx} y1={layer.y} x2={cx} y2={layers[i + 1] ? layers[i + 1].y + layers[i + 1].h + 4 : layer.y - 10} stroke={border} strokeWidth={1.2} markerEnd="url(#arrowUp)" />
            )}
          </g>
        ))}
        {/* Input arrow */}
        <line x1={cx} y1={405} x2={cx} y2={390} stroke={border} strokeWidth={1.2} markerEnd="url(#arrowUp)" />
        <text x={cx} y={415} textAnchor="middle" dominantBaseline="auto" fill={muted} fontSize={10}>
          {en ? "Token IDs" : "トークン ID 列"}
        </text>
        {/* Output arrow */}
        <line x1={cx} y1={70} x2={cx} y2={40} stroke={border} strokeWidth={1.2} markerEnd="url(#arrowUp)" />
        <text x={cx} y={30} textAnchor="middle" dominantBaseline="auto" fill={muted} fontSize={10}>
          {en ? "Next token prediction" : "次トークン予測"}
        </text>

        <defs>
          <marker id="arrowUp" markerWidth="8" markerHeight="6" refX="4" refY="6" orient="auto">
            <path d="M0,6 L4,0 L8,6" fill="none" stroke={border} strokeWidth={1} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── 3. Training Pipeline ──────────────────────── */

export function TrainingPipeline({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  const stages = [
    {
      label: en ? "Pre-training" : "事前学習",
      desc: en ? "Next-token prediction on massive corpus" : "大規模コーパスで次トークン予測",
      detail: en ? "Trillions of tokens" : "数兆トークン",
      color: accent,
    },
    {
      label: en ? "SFT" : "SFT（教師ありFT）",
      desc: en ? "Supervised Fine-Tuning on instructions" : "指示データで教師あり微調整",
      detail: en ? "~100K examples" : "〜10万件の指示データ",
      color: green,
    },
    {
      label: "RLHF / DPO",
      desc: en ? "Align with human preferences" : "人間の選好に合わせて整合",
      detail: en ? "Reward model + PPO or DPO" : "報酬モデル + PPO or DPO",
      color: orange,
    },
    {
      label: en ? "Deployment" : "デプロイ",
      desc: en ? "API / chat interface" : "API / チャットインターフェース",
      detail: en ? "Quantization, serving" : "量子化・推論最適化",
      color: purple,
    },
  ];

  const boxW = 150;
  const boxH = 78;
  const gap = 30;
  const startX = 20;

  return (
    <div className="not-prose my-6 flex justify-center overflow-x-auto">
      <svg viewBox={`0 0 ${startX * 2 + stages.length * (boxW + gap) - gap} ${boxH + 20}`} className="w-full max-w-3xl min-w-[500px]">
        <defs>
          <marker id="arrow-tp" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={border} />
          </marker>
        </defs>
        {stages.map((stage, i) => {
          const x = startX + i * (boxW + gap);
          const cy = 10 + boxH / 2;
          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={x - gap + 4}
                  y1={cy}
                  x2={x - 4}
                  y2={cy}
                  stroke={border}
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-tp)"
                />
              )}
              <rect x={x} y={10} width={boxW} height={boxH} rx={8} fill={bg} stroke={stage.color} strokeWidth={2} />
              <text x={x + boxW / 2} y={28} textAnchor="middle" dominantBaseline="central" fill={stage.color} fontSize={12} fontWeight={700}>
                {stage.label}
              </text>
              <text x={x + boxW / 2} y={46} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10}>
                {stage.desc}
              </text>
              <text x={x + boxW / 2} y={64} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
                {stage.detail}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── 4. Scaling Laws Diagram ───────────────────── */

export function ScalingLawsDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const orange = dark ? "#f59e0b" : "#d97706";
  const green = dark ? "#22c55e" : "#16a34a";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  /* Chart: log-log relationship (stylized) */
  const w = 300;
  const h = 180;
  const pad = 50;
  const pw = w - pad * 2;
  const ph = h - pad - 20;

  /* Stylized power-law curve */
  const points: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const x = pad + t * pw;
    const y = h - pad - ph * (1 - 0.55 * Math.pow(1 - t, 0.45));
    points.push([x, y]);
  }
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  const factors = [
    { label: en ? "Parameters (N)" : "パラメータ数 (N)", color: accent },
    { label: en ? "Data (D)" : "データ量 (D)", color: green },
    { label: en ? "Compute (C)" : "計算量 (C)", color: orange },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox={`0 0 ${w + 200} ${h + 30}`} className="w-full max-w-lg">
        {/* Axes */}
        <line x1={pad} y1={h - pad} x2={pad + pw + 10} y2={h - pad} stroke={border} strokeWidth={1.5} />
        <line x1={pad} y1={h - pad} x2={pad} y2={15} stroke={border} strokeWidth={1.5} />
        {/* Axis labels */}
        <text x={pad + pw / 2} y={h - 8} textAnchor="middle" fill={muted} fontSize={10}>
          {en ? "log(Compute / Parameters / Data)" : "log(計算量 / パラメータ数 / データ量)"}
        </text>
        <text x={14} y={15 + ph / 2} textAnchor="middle" fill={muted} fontSize={10} transform={`rotate(-90, 14, ${15 + ph / 2})`}>
          {en ? "log(Loss)" : "log(損失)"}
        </text>
        {/* Curve */}
        <path d={pathD} fill="none" stroke={accent} strokeWidth={2.5} />
        {/* Arrow label */}
        <text x={pad + pw * 0.65} y={h - pad - ph * 0.58} fill={accent} fontSize={10} fontWeight={600}>
          L(x) ∝ x^(−α)
        </text>

        {/* Factor legend */}
        {factors.map((f, i) => (
          <g key={i}>
            <rect x={w + 10} y={30 + i * 44} width={180} height={34} rx={6} fill={bg} stroke={f.color} strokeWidth={1.5} />
            <circle cx={w + 26} cy={30 + i * 44 + 17} r={5} fill={f.color} />
            <text x={w + 38} y={30 + i * 44 + 17} dominantBaseline="central" fill={text} fontSize={11} fontWeight={600}>
              {f.label}
            </text>
          </g>
        ))}
        {/* Formula */}
        <text x={w + 100} y={h + 5} textAnchor="middle" fill={muted} fontSize={9}>
          Kaplan et al. 2020, Hoffmann et al. 2022
        </text>
      </svg>
    </div>
  );
}

/* ── 5. Model Family Tree ──────────────────────── */

export function LLMFamilyTree({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#a855f7" : "#9333ea";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 620 310" className="w-full max-w-2xl">
        {/* Root: Transformer */}
        <rect x={250} y={5} width={120} height={32} rx={8} fill={accent} stroke={accent} />
        <text x={310} y={21} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={12} fontWeight={700}>
          Transformer
        </text>
        <text x={310} y={48} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>2017 — Vaswani et al.</text>

        {/* Branch lines */}
        <line x1={250} y1={37} x2={100} y2={80} stroke={border} strokeWidth={1.5} />
        <line x1={310} y1={37} x2={310} y2={80} stroke={border} strokeWidth={1.5} />
        <line x1={370} y1={37} x2={520} y2={80} stroke={border} strokeWidth={1.5} />

        {/* Encoder-only */}
        <rect x={30} y={80} width={140} height={30} rx={6} fill={bg} stroke={green} strokeWidth={2} />
        <text x={100} y={95} textAnchor="middle" dominantBaseline="central" fill={green} fontSize={11} fontWeight={700}>
          {en ? "Encoder-only" : "エンコーダ系"}
        </text>
        {[
          { label: "BERT", year: "2018", desc: en ? "Masked LM" : "マスク言語モデル" },
          { label: "RoBERTa", year: "2019", desc: en ? "Robust BERT" : "頑健なBERT" },
          { label: "DeBERTa", year: "2020", desc: en ? "Disentangled attn" : "分離注意" },
        ].map((m, i) => (
          <g key={i}>
            <line x1={100} y1={110} x2={100} y2={130 + i * 44} stroke={border} strokeWidth={1} strokeDasharray="3 2" />
            <rect x={30} y={130 + i * 44} width={140} height={34} rx={5} fill={bg} stroke={border} strokeWidth={1} />
            <text x={100} y={142 + i * 44} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
              {m.label} ({m.year})
            </text>
            <text x={100} y={156 + i * 44} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
              {m.desc}
            </text>
          </g>
        ))}

        {/* Encoder-Decoder */}
        <rect x={240} y={80} width={140} height={30} rx={6} fill={bg} stroke={orange} strokeWidth={2} />
        <text x={310} y={95} textAnchor="middle" dominantBaseline="central" fill={orange} fontSize={11} fontWeight={700}>
          {en ? "Encoder-Decoder" : "エンコーダ・デコーダ系"}
        </text>
        {[
          { label: "T5", year: "2019", desc: en ? "Text-to-Text" : "テキスト→テキスト" },
          { label: "BART", year: "2019", desc: en ? "Denoising AE" : "ノイズ除去AE" },
          { label: "Flan-T5", year: "2022", desc: en ? "Instruction tuned" : "指示チューニング" },
        ].map((m, i) => (
          <g key={i}>
            <line x1={310} y1={110} x2={310} y2={130 + i * 44} stroke={border} strokeWidth={1} strokeDasharray="3 2" />
            <rect x={240} y={130 + i * 44} width={140} height={34} rx={5} fill={bg} stroke={border} strokeWidth={1} />
            <text x={310} y={142 + i * 44} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
              {m.label} ({m.year})
            </text>
            <text x={310} y={156 + i * 44} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
              {m.desc}
            </text>
          </g>
        ))}

        {/* Decoder-only */}
        <rect x={450} y={80} width={140} height={30} rx={6} fill={bg} stroke={purple} strokeWidth={2} />
        <text x={520} y={95} textAnchor="middle" dominantBaseline="central" fill={purple} fontSize={11} fontWeight={700}>
          {en ? "Decoder-only" : "デコーダ系"}
        </text>
        {[
          { label: "GPT-2/3", year: "2019–20", desc: en ? "Autoregressive LM" : "自己回帰型LM" },
          { label: "LLaMA", year: "2023", desc: en ? "Open-weight" : "オープンウェイト" },
          { label: "GPT-4 / Claude", year: "2023–", desc: en ? "Frontier models" : "最先端モデル" },
        ].map((m, i) => (
          <g key={i}>
            <line x1={520} y1={110} x2={520} y2={130 + i * 44} stroke={border} strokeWidth={1} strokeDasharray="3 2" />
            <rect x={450} y={130 + i * 44} width={140} height={34} rx={5} fill={bg} stroke={border} strokeWidth={1} />
            <text x={520} y={142 + i * 44} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={10} fontWeight={600}>
              {m.label} ({m.year})
            </text>
            <text x={520} y={156 + i * 44} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
              {m.desc}
            </text>
          </g>
        ))}

        {/* Category descriptions */}
        <text x={100} y={270} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={8}>
          {en ? "Classification, NER, embeddings" : "分類・固有表現抽出・埋め込み"}
        </text>
        <text x={310} y={270} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={8}>
          {en ? "Translation, summarization" : "翻訳・要約"}
        </text>
        <text x={520} y={270} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={8}>
          {en ? "Chat, code generation, reasoning" : "対話・コード生成・推論"}
        </text>
      </svg>
    </div>
  );
}

/* ── 6. Tokenization Diagram ────────────────── */

export function BPETokenizationDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const en = locale === "en";

  const tokens = [
    { text: "The", id: 464, color: accent },
    { text: "Ġcat", id: 3797, color: green },
    { text: "Ġsat", id: 3520, color: green },
    { text: "Ġon", id: 319, color: border },
    { text: "Ġthe", id: 262, color: border },
    { text: "Ġmat", id: 2603, color: green },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 620 170" className="w-full max-w-xl">
        {/* Raw text */}
        <text x={310} y={20} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={10} fontWeight={600}>
          {en ? "Input text" : "入力テキスト"}
        </text>
        <rect x={115} y={30} width={390} height={30} rx={6} fill={bg} stroke={border} strokeWidth={1.5} />
        <text x={310} y={45} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={14} fontFamily="monospace">
          &quot;The cat sat on the mat&quot;
        </text>

        {/* Arrow */}
        <text x={310} y={78} textAnchor="middle" fill={muted} fontSize={11}>
          ↓ BPE {en ? "Tokenizer" : "トークナイザ"}
        </text>

        {/* Tokens */}
        <text x={310} y={100} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={10} fontWeight={600}>
          {en ? "Tokens (subwords)" : "トークン（サブワード）"}
        </text>
        {tokens.map((tok, i) => {
          const w = 80;
          const gap = 8;
          const totalW = tokens.length * w + (tokens.length - 1) * gap;
          const x = (620 - totalW) / 2 + i * (w + gap);
          return (
            <g key={i}>
              <rect x={x} y={110} width={w} height={44} rx={6} fill={bg} stroke={tok.color} strokeWidth={1.5} />
              <text x={x + w / 2} y={125} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={11} fontFamily="monospace" fontWeight={600}>
                {tok.text}
              </text>
              <text x={x + w / 2} y={143} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={9}>
                ID: {tok.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
