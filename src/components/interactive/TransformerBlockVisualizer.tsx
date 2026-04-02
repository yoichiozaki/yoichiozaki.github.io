"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ── Transformer Block Forward Pass ───────────── */

/*
 * Simplified single-block forward pass for 3 tokens with d_model=4.
 * Shows how data flows through: Input → Pre-LN → Self-Attention → Residual Add → Pre-LN → FFN → Residual Add → Output
 *
 * We use small numbers for illustration. Steps:
 * 0. Input embeddings + positional encoding
 * 1. Pre-LN (RMSNorm)
 * 2. Q, K, V projection
 * 3. Attention weights
 * 4. Attention output
 * 5. Residual connection (add input)
 * 6. Pre-LN (RMSNorm) for FFN
 * 7. FFN forward pass (SwiGLU)
 * 8. Residual connection (add pre-FFN)
 * 9. Block output
 */

type Layer = {
  label: { ja: string; en: string };
  data: {
    name: string;
    rows: string[][];
    color: string;
  }[];
  highlight: string;
  desc: { ja: string; en: string };
};

const TOKENS = ["I", "love", "cats"];

const steps: Layer[] = [
  /* 0: Input + PE */
  {
    label: { ja: "入力埋め込み + 位置エンコーディング", en: "Input Embedding + Positional Encoding" },
    data: [
      {
        name: "X = Embed + PE",
        rows: [
          ["0.82", "−0.15", "0.44", "0.91"],
          ["0.33", "0.78", "−0.22", "0.56"],
          ["0.61", "0.42", "0.73", "−0.08"],
        ],
        color: "gray",
      },
    ],
    highlight: "input",
    desc: {
      ja: "トークン ID をまず埋め込み行列でベクトル化し、位置エンコーディングを加算する。各トークンが d_model=4 のベクトルになる（実際の LLM では 4096 次元以上）。",
      en: "Token IDs are first converted to vectors via the embedding matrix, then positional encoding is added. Each token becomes a d_model=4 vector (real LLMs use 4096+ dimensions).",
    },
  },
  /* 1: RMSNorm */
  {
    label: { ja: "RMSNorm (Pre-LN)", en: "RMSNorm (Pre-LN)" },
    data: [
      {
        name: "X (input)",
        rows: [
          ["0.82", "−0.15", "0.44", "0.91"],
          ["0.33", "0.78", "−0.22", "0.56"],
          ["0.61", "0.42", "0.73", "−0.08"],
        ],
        color: "gray",
      },
      {
        name: "RMSNorm(X)",
        rows: [
          ["1.24", "−0.23", "0.67", "1.38"],
          ["0.56", "1.32", "−0.37", "0.95"],
          ["1.05", "0.72", "1.25", "−0.14"],
        ],
        color: "green",
      },
    ],
    highlight: "norm",
    desc: {
      ja: "RMSNorm は各トークンのベクトルを二乗平均平方根で正規化する。RMS(x) = √(Σxᵢ²/d) で割り、学習可能なスケールパラメータ γ を掛ける。LayerNorm と違い平均を引かないため計算が高速。",
      en: "RMSNorm normalizes each token's vector by its root mean square: divide by RMS(x) = √(Σxᵢ²/d), then multiply by learnable scale γ. Unlike LayerNorm, it doesn't subtract the mean, making it faster.",
    },
  },
  /* 2: Q, K, V projection */
  {
    label: { ja: "Q, K, V 射影", en: "Q, K, V Projection" },
    data: [
      {
        name: "Q = Norm(X) · W_Q",
        rows: [
          ["0.71", "0.95"],
          ["0.88", "0.32"],
          ["0.54", "0.77"],
        ],
        color: "blue",
      },
      {
        name: "K = Norm(X) · W_K",
        rows: [
          ["0.63", "0.81"],
          ["0.45", "0.92"],
          ["0.79", "0.36"],
        ],
        color: "green",
      },
      {
        name: "V = Norm(X) · W_V",
        rows: [
          ["0.42", "0.68"],
          ["0.91", "0.15"],
          ["0.33", "0.87"],
        ],
        color: "orange",
      },
    ],
    highlight: "proj",
    desc: {
      ja: "正規化後のベクトルに3つの学習済み重み行列 W_Q, W_K, W_V を掛けて d_k=2 のベクトルを得る。MHA では各ヘッドが独立した W_Q, W_K, W_V を持つ（ここでは1ヘッドの例）。",
      en: "Multiply normalized vectors by 3 learned weight matrices W_Q, W_K, W_V to get d_k=2 vectors. In MHA, each head has independent W_Q, W_K, W_V (showing 1 head here).",
    },
  },
  /* 3: Attention weights */
  {
    label: { ja: "注意重み計算", en: "Attention Weight Computation" },
    data: [
      {
        name: "softmax(Q·Kᵀ/√d_k) + Causal Mask",
        rows: [
          ["1.00", "0.00", "0.00"],
          ["0.54", "0.46", "0.00"],
          ["0.31", "0.28", "0.41"],
        ],
        color: "red",
      },
    ],
    highlight: "attn",
    desc: {
      ja: "Q と K の内積 → √d_k でスケーリング → 因果マスクで未来を -∞ に → softmax。行1: \"I\" は自分だけ参照。行2: \"love\" は \"I\" と \"love\" を参照。行3: \"cats\" は全トークンを参照。",
      en: "Q·Kᵀ → scale by √d_k → causal mask future to -∞ → softmax. Row 1: 'I' attends only to itself. Row 2: 'love' attends to 'I' and 'love'. Row 3: 'cats' attends to all tokens.",
    },
  },
  /* 4: Attention output */
  {
    label: { ja: "注意機構の出力", en: "Attention Output" },
    data: [
      {
        name: "Attn(Q,K,V) = Weights · V",
        rows: [
          ["0.42", "0.68"],
          ["0.64", "0.44"],
          ["0.52", "0.61"],
        ],
        color: "purple",
      },
    ],
    highlight: "attnout",
    desc: {
      ja: "注意重みと V の行列積で各トークンの文脈ベクトルを得る。\"cats\" の出力 [0.52, 0.61] は全トークンの V の重み付き平均——\"I love cats\" という文脈が凝縮されている。",
      en: "Matrix multiply attention weights with V to get context vectors. 'cats' output [0.52, 0.61] is a weighted average of all V vectors — condensing the 'I love cats' context.",
    },
  },
  /* 5: Residual connection */
  {
    label: { ja: "残差接続①（注意後）", en: "Residual Connection 1 (Post-Attention)" },
    data: [
      {
        name: "W_O · Attn + X (residual)",
        rows: [
          ["1.14", "0.09", "0.72", "1.23"],
          ["0.68", "1.11", "−0.01", "0.85"],
          ["0.92", "0.73", "1.05", "0.19"],
        ],
        color: "orange",
      },
    ],
    highlight: "res1",
    desc: {
      ja: "注意出力に W_O を掛けて元の次元に戻し、入力 X を加算する（残差接続）。勾配がショートカットで流れ、100層以上の深いネットワークでも安定して学習できる鍵。",
      en: "Project attention output back to d_model via W_O, then add original input X (residual connection). This shortcut allows gradients to flow directly, enabling stable training of 100+ layer networks.",
    },
  },
  /* 6: RMSNorm for FFN */
  {
    label: { ja: "RMSNorm（FFN 前）", en: "RMSNorm (Pre-FFN)" },
    data: [
      {
        name: "RMSNorm(X + Attn)",
        rows: [
          ["1.30", "0.10", "0.82", "1.40"],
          ["0.81", "1.32", "−0.01", "1.01"],
          ["1.10", "0.87", "1.26", "0.23"],
        ],
        color: "green",
      },
    ],
    highlight: "norm2",
    desc: {
      ja: "FFN の前にもう一度 RMSNorm を適用する。Transformer の各サブ層（自己注意・FFN）の前に正規化を入れるのが Pre-LN パターン。学習の安定性が大幅に向上する。",
      en: "Apply RMSNorm again before FFN. Placing normalization before each sublayer (self-attention, FFN) is the Pre-LN pattern, which greatly improves training stability.",
    },
  },
  /* 7: FFN (SwiGLU) */
  {
    label: { ja: "FFN (SwiGLU)", en: "FFN (SwiGLU)" },
    data: [
      {
        name: "SwiGLU(x) = (Swish(x·W₁) ⊙ x·W₃) · W₂",
        rows: [
          ["0.28", "−0.11", "0.45", "0.19"],
          ["−0.06", "0.37", "0.12", "−0.22"],
          ["0.33", "0.08", "−0.15", "0.41"],
        ],
        color: "blue",
      },
    ],
    highlight: "ffn",
    desc: {
      ja: "SwiGLU FFN: まず2つの線形変換 (W₁, W₃) で d_ff 次元に拡大し、Swish 活性化とゲートの要素積をとり、W₂ で元の次元に戻す。d_ff は通常 d_model の約 8/3 倍（SwiGLU の場合）。",
      en: "SwiGLU FFN: two linear projections (W₁, W₃) expand to d_ff, element-wise product of Swish activation and gate, then W₂ projects back. d_ff is typically ~8/3 × d_model for SwiGLU.",
    },
  },
  /* 8: Residual connection 2 */
  {
    label: { ja: "残差接続②（FFN 後）", en: "Residual Connection 2 (Post-FFN)" },
    data: [
      {
        name: "FFN(x) + x (residual)",
        rows: [
          ["1.42", "−0.02", "1.17", "1.42"],
          ["0.62", "1.48", "0.11", "0.63"],
          ["1.25", "0.81", "0.90", "0.60"],
        ],
        color: "orange",
      },
    ],
    highlight: "res2",
    desc: {
      ja: "FFN の出力にステップ5の値（注意機構後の残差和）を加算。これで1つの Transformer ブロックの処理が完了。この出力が次のブロックの入力になる。",
      en: "Add FFN output to step 5's value (post-attention residual sum). This completes one Transformer block. The output becomes input to the next block.",
    },
  },
  /* 9: Block output summary */
  {
    label: { ja: "ブロック出力", en: "Block Output" },
    data: [
      {
        name: "Input X",
        rows: [
          ["0.82", "−0.15", "0.44", "0.91"],
          ["0.33", "0.78", "−0.22", "0.56"],
          ["0.61", "0.42", "0.73", "−0.08"],
        ],
        color: "gray",
      },
      {
        name: "Output",
        rows: [
          ["1.42", "−0.02", "1.17", "1.42"],
          ["0.62", "1.48", "0.11", "0.63"],
          ["1.25", "0.81", "0.90", "0.60"],
        ],
        color: "purple",
      },
    ],
    highlight: "output",
    desc: {
      ja: "入力と出力を比較。\"cats\" のベクトルは自己注意を通じて \"I\" と \"love\" の文脈を取り込み、FFN で特徴変換されている。N 個のブロックを積み重ね、最終層の出力で次トークンを予測する。",
      en: "Compare input vs output. 'cats' vector has absorbed 'I' and 'love' context via self-attention, then been feature-transformed by FFN. Stack N blocks, then predict the next token from the final layer's output.",
    },
  },
];

/* ── Colors ────────────────────────────────────── */

const HIGHLIGHT_COLORS: Record<string, string> = {
  input: "bg-neutral-100 dark:bg-neutral-800/60",
  norm: "bg-green-50 dark:bg-green-950/40",
  proj: "bg-blue-50 dark:bg-blue-950/40",
  attn: "bg-red-50 dark:bg-red-950/40",
  attnout: "bg-purple-50 dark:bg-purple-950/40",
  res1: "bg-orange-50 dark:bg-orange-950/40",
  norm2: "bg-green-50 dark:bg-green-950/40",
  ffn: "bg-blue-50 dark:bg-blue-950/40",
  res2: "bg-orange-50 dark:bg-orange-950/40",
  output: "bg-purple-50 dark:bg-purple-950/40",
};

const DATA_COLORS: Record<string, string> = {
  gray: "text-neutral-600 dark:text-neutral-400",
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  orange: "text-orange-600 dark:text-orange-400",
  red: "text-red-600 dark:text-red-400",
  purple: "text-purple-600 dark:text-purple-400",
};

const CELL_STYLES: Record<string, string> = {
  gray: "bg-neutral-100 dark:bg-neutral-900/50 text-neutral-700 dark:text-neutral-300",
  blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  green: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  orange: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  red: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  purple: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
};

/* ── Component ─────────────────────────────────── */

export function TransformerBlockVisualizer({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 4000 });
  const current = steps[player.step];
  const lang = locale === "en" ? "en" : "ja";

  /* Flow progress indicator */
  const flowSteps = [
    { short: "Embed+PE", icon: "📥" },
    { short: "RMSNorm", icon: "📏" },
    { short: "Q,K,V", icon: "🔀" },
    { short: "Attn W", icon: "🎯" },
    { short: "Attn Out", icon: "✨" },
    { short: "Res+", icon: "➕" },
    { short: "RMSNorm", icon: "📏" },
    { short: "FFN", icon: "⚡" },
    { short: "Res+", icon: "➕" },
    { short: "Output", icon: "📤" },
  ];

  return (
    <InteractiveDemo
      title={lang === "en" ? "Transformer Block Forward Pass" : "Transformer ブロック順伝播"}
      description={
        lang === "en"
          ? 'Trace data flow through a single Transformer block on "I love cats".'
          : '"I love cats" のデータが1つの Transformer ブロックをどう通過するか追跡しましょう。'
      }
    >
      <div className="space-y-4">
        {/* Flow progress bar */}
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
          {flowSteps.map((fs, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`flex flex-col items-center px-1.5 py-1 rounded text-[9px] transition-all ${
                  i === player.step
                    ? "bg-accent/20 text-accent font-bold scale-105"
                    : i < player.step
                    ? "text-muted-foreground/70"
                    : "text-muted-foreground/40"
                }`}
              >
                <span className="text-sm">{fs.icon}</span>
                <span className="whitespace-nowrap">{fs.short}</span>
              </div>
              {i < flowSteps.length - 1 && (
                <span className={`text-[10px] mx-0.5 ${i < player.step ? "text-muted-foreground/50" : "text-muted-foreground/20"}`}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Current step label */}
        <div className={`px-3 py-2 rounded-lg ${HIGHLIGHT_COLORS[current.highlight]}`}>
          <div className="text-sm font-semibold text-foreground">
            {lang === "en" ? `Step ${player.step}: ` : `ステップ ${player.step}: `}
            {current.label[lang]}
          </div>
        </div>

        {/* Token header */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {lang === "en" ? "Tokens:" : "トークン:"}
          </span>
          {TOKENS.map((t, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-muted text-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Data matrices */}
        <div className="flex flex-wrap gap-4">
          {current.data.map((mat, mi) => (
            <div key={mi} className="flex-shrink-0">
              <div className={`text-xs font-semibold mb-1.5 ${DATA_COLORS[mat.color] ?? "text-foreground"}`}>
                {mat.name}
              </div>
              <table className="border-collapse">
                <tbody>
                  {mat.rows.map((row, ri) => (
                    <tr key={ri}>
                      <td className="pr-2 text-[10px] text-muted-foreground font-mono w-10 text-right">
                        {TOKENS[ri]}
                      </td>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`px-2 py-1 text-xs font-mono text-center border border-border/30 transition-colors duration-300 ${CELL_STYLES[mat.color]}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <StepPlayerControls {...player} label={(s) => steps[s].desc[lang]} />
      </div>
    </InteractiveDemo>
  );
}
