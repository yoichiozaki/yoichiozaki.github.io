"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
    nameJa?: string;
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
      ja: "トークン ID をまず埋め込み行列でベクトルに変換し、位置エンコーディングを加算する。各トークンが d_model = 4 のベクトルになる（実際の LLM では例えば 4096 次元）。",
      en: "Token IDs are first converted to vectors by the embedding matrix, and positional encoding is added. Each token becomes a vector with d_model = 4 (real LLMs use, for example, 4096 dimensions).",
    },
  },
  /* 1: RMSNorm */
  {
    label: { ja: "RMSNorm（注意前）", en: "RMSNorm (Pre-Attention)" },
    data: [
      {
        name: "X (input)",
        nameJa: "X（入力）",
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
          ["1.25", "−0.23", "0.67", "1.39"],
          ["0.64", "1.50", "−0.42", "1.08"],
          ["1.17", "0.81", "1.40", "−0.15"],
        ],
        color: "green",
      },
    ],
    highlight: "norm",
    desc: {
      ja: "RMSNorm は各トークンのベクトルを二乗平均平方根で正規化する。RMS(x) = √(Σxᵢ²/d) で割り、学習可能なスケールパラメーター γ を掛ける（ここでは γ = 1）。LayerNorm と違って平均を引かないので、その分計算量が少ない。",
      en: "RMSNorm normalizes each token's vector by its root mean square: it divides by RMS(x) = √(Σxᵢ²/d) and multiplies by a learnable scale γ (γ = 1 here). Unlike LayerNorm, it does not subtract the mean, so it needs less computation.",
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
      ja: "正規化後のベクトルに 3 つの学習済み重み行列 W_Q, W_K, W_V を掛けて、d_k = 2 のベクトルを得る。マルチヘッド注意では各ヘッドが独自の W_Q, W_K, W_V を持つ（ここでは 1 ヘッドの例）。",
      en: "The normalized vectors are multiplied by three learned weight matrices, W_Q, W_K, and W_V, giving vectors with d_k = 2. In multi-head attention, each head has its own W_Q, W_K, and W_V; this example shows one head.",
    },
  },
  /* 3: Attention weights */
  {
    label: { ja: "注意重み計算", en: "Attention Weight Computation" },
    data: [
      {
        name: "softmax(Q·Kᵀ/√d_k + Causal Mask)",
        rows: [
          ["1.00", "0.00", "0.00"],
          ["0.52", "0.48", "0.00"],
          ["0.35", "0.35", "0.29"],
        ],
        color: "red",
      },
    ],
    highlight: "attn",
    desc: {
      ja: "Q と K の内積 → √d_k でスケーリング → 因果マスクで未来のトークンへのスコアを −∞ に → softmax の順に計算する。1 行目の \"I\" は自分だけに、2 行目の \"love\" は \"I\" と \"love\" に、3 行目の \"cats\" は全トークンに注意する。",
      en: 'Q·Kᵀ → scale by √d_k → causal mask sets future positions to −∞ → softmax. Row 1 ("I") attends only to itself, row 2 ("love") to "I" and "love", and row 3 ("cats") to all tokens.',
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
          ["0.65", "0.43"],
          ["0.57", "0.55"],
        ],
        color: "purple",
      },
    ],
    highlight: "attnout",
    desc: {
      ja: "注意重みと V の行列積で、各トークンの文脈ベクトルを得る。\"cats\" の出力 [0.57, 0.55] は、3 トークンの V を重み 0.35、0.35、0.29 で平均したものだ。",
      en: 'Multiplying the attention weights by V gives each token a context vector. The output for "cats", [0.57, 0.55], averages the V vectors of the three tokens with weights 0.35, 0.35, and 0.29.',
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
      ja: "注意の出力に W_O を掛けて元の次元に戻し、入力 X を加算する（残差接続）。勾配が残差接続の経路を通って入力側の層まで直接届くので、100 層近い深いネットワークも学習できる。",
      en: "The attention output is projected back to d_model by W_O, and the input X is added (residual connection). Gradients flow back through this shortcut directly to the layers near the input, so networks of nearly 100 layers can be trained.",
    },
  },
  /* 6: RMSNorm for FFN */
  {
    label: { ja: "RMSNorm（FFN 前）", en: "RMSNorm (Pre-FFN)" },
    data: [
      {
        name: "RMSNorm(X + Attn)",
        rows: [
          ["1.25", "0.10", "0.79", "1.35"],
          ["0.87", "1.43", "−0.01", "1.09"],
          ["1.16", "0.92", "1.32", "0.24"],
        ],
        color: "green",
      },
    ],
    highlight: "norm2",
    desc: {
      ja: "FFN の前にもう一度 RMSNorm を適用する。このように各サブ層（自己注意・FFN）の前で正規化する構成が Pre-LN で、Post-LN より学習が安定しやすい。",
      en: "RMSNorm is applied again before the FFN. Normalizing before each sublayer (self-attention and FFN) is the Pre-LN arrangement, which trains more stably than Post-LN.",
    },
  },
  /* 7: FFN (SwiGLU) */
  {
    label: { ja: "FFN（SwiGLU）", en: "FFN (SwiGLU)" },
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
      ja: "SwiGLU FFN では、2 つの線形変換（W₁, W₃）で d_ff 次元に広げ、Swish 活性化の出力とゲートの要素積をとり、W₂ で元の次元に戻す。d_ff は、標準 FFN とパラメーター数を揃えるため、通常 d_model の約 8/3 倍にする。",
      en: "In the SwiGLU FFN, W₁ and W₃ project the input up to d_ff dimensions, the Swish output is multiplied element-wise by the gate, and W₂ projects the result back to d_model. To match the parameter count of a standard FFN, d_ff is usually about 8/3 × d_model.",
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
      ja: "FFN の出力に、ステップ 5 の値（注意後の残差和）を加算する。これで 1 つの Transformer ブロックの処理が終わり、この出力が次のブロックの入力になる。",
      en: "The FFN output is added to the value from step 5 (the sum after the attention residual). This completes one Transformer block, and its output becomes the input to the next block.",
    },
  },
  /* 9: Block output summary */
  {
    label: { ja: "ブロック出力", en: "Block Output" },
    data: [
      {
        name: "Input X",
        nameJa: "入力 X",
        rows: [
          ["0.82", "−0.15", "0.44", "0.91"],
          ["0.33", "0.78", "−0.22", "0.56"],
          ["0.61", "0.42", "0.73", "−0.08"],
        ],
        color: "gray",
      },
      {
        name: "Output",
        nameJa: "出力",
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
      ja: "\"cats\" のベクトルは、入力 X から出力までの間に、自己注意で \"I\" と \"love\" の情報を取り込み、FFN で変換された。このブロックを N 個積み重ね、最後のブロックの出力から次のトークンを予測する。",
      en: 'Between input X and the output, the "cats" vector took in information from "I" and "love" through self-attention and was transformed by the FFN. A model stacks N such blocks and predicts the next token from the output of the last one.',
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
    { short: lang === "en" ? "Embed+PE" : "埋め込み+PE", icon: "📥" },
    { short: "RMSNorm", icon: "📏" },
    { short: "Q,K,V", icon: "🔀" },
    { short: lang === "en" ? "Attn weights" : "注意重み", icon: "🎯" },
    { short: lang === "en" ? "Attn output" : "注意出力", icon: "✨" },
    { short: lang === "en" ? "Residual" : "残差", icon: "➕" },
    { short: "RMSNorm", icon: "📏" },
    { short: "FFN", icon: "⚡" },
    { short: lang === "en" ? "Residual" : "残差", icon: "➕" },
    { short: lang === "en" ? "Output" : "出力", icon: "📤" },
  ];

  return (
    <InteractiveDemo
      title={lang === "en" ? "Transformer Block Forward Pass" : "Transformer ブロックの順伝播"}
      description={
        lang === "en"
          ? 'The three tokens of "I love cats" passing through one Transformer block, step by step (d_model = 4, illustrative values).'
          : '"I love cats" の 3 トークンが 1 つの Transformer ブロックを通る過程を、1 ステップずつ示す（d_model = 4、値は説明用）。'
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
                {lang === "ja" && mat.nameJa ? mat.nameJa : mat.name}
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

        <p className="text-sm leading-relaxed text-muted-foreground">
          {current.desc[lang]}
        </p>
        <StepPlayerControls {...player} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
