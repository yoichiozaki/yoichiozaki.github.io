"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
} from "@/components/interactive";

type Props = { locale?: string };

/* ── Self-Attention Step Data ──────────────────── */

/*
 * Simplified self-attention on 3 tokens: "The cat sat"
 * Using d_k=2 for illustration. Values are stylized but demonstrate the real mechanics.
 *
 * Embedding vectors (d=4):
 *   The = [1.0, 0.2, 0.5, 0.8]
 *   cat = [0.3, 0.9, 0.1, 0.6]
 *   sat = [0.7, 0.4, 0.8, 0.2]
 *
 * Q = X·W_Q,  K = X·W_K,  V = X·W_V  (d_k=2)
 *
 * Attention(Q,K,V) = softmax(Q·Kᵀ / √d_k) · V
 */

type CellHighlight = "q" | "k" | "v" | "score" | "weight" | "output" | null;

type MatrixDisplay = {
  label: string;
  labelJa?: string;
  rows: { cells: string[]; highlights?: CellHighlight[] }[];
  color: string;
};

type Step = {
  matrices: MatrixDisplay[];
  activeTokens?: number[];
  desc: { ja: string; en: string };
};

const TOKENS = ["The", "cat", "sat"];

const steps: Step[] = [
  /* 0 */ {
    matrices: [
      {
        label: "X (Input)",
        labelJa: "X（入力）",
        rows: [
          { cells: ["1.0", "0.2", "0.5", "0.8"] },
          { cells: ["0.3", "0.9", "0.1", "0.6"] },
          { cells: ["0.7", "0.4", "0.8", "0.2"] },
        ],
        color: "gray",
      },
    ],
    desc: {
      ja: '入力は "The cat sat" の 3 トークンの埋め込み X だ。各行が 1 トークンの 4 次元ベクトルで、ここから Q, K, V の 3 つの行列を計算する。',
      en: 'The input is X, the embeddings of the three tokens in "The cat sat". Each row is the 4-dimensional vector of one token, and Q, K, and V are computed from X.',
    },
  },
  /* 1 */ {
    matrices: [
      {
        label: "Q = X · W_Q",
        rows: [
          { cells: ["0.8", "0.3"], highlights: ["q", "q"] },
          { cells: ["0.2", "0.7"], highlights: ["q", "q"] },
          { cells: ["0.6", "0.5"], highlights: ["q", "q"] },
        ],
        color: "blue",
      },
      {
        label: "K = X · W_K",
        rows: [
          { cells: ["0.5", "0.9"], highlights: ["k", "k"] },
          { cells: ["0.7", "0.1"], highlights: ["k", "k"] },
          { cells: ["0.4", "0.6"], highlights: ["k", "k"] },
        ],
        color: "green",
      },
      {
        label: "V = X · W_V",
        rows: [
          { cells: ["0.6", "0.4"], highlights: ["v", "v"] },
          { cells: ["0.3", "0.8"], highlights: ["v", "v"] },
          { cells: ["0.7", "0.2"], highlights: ["v", "v"] },
        ],
        color: "orange",
      },
    ],
    desc: {
      ja: "入力 X に学習済み重み行列 W_Q, W_K, W_V を掛けて Query, Key, Value を得る。Q は「何を探しているか」、K は「何を持っているか」、V は「実際に渡す情報」を表す。",
      en: 'Multiplying X by the learned weight matrices W_Q, W_K, and W_V gives the Query, Key, and Value matrices. Q represents what each token is "looking for," K what it "contains," and V the information it passes along.',
    },
  },
  /* 2 */ {
    matrices: [
      {
        label: "Q · Kᵀ (raw scores)",
        labelJa: "Q · Kᵀ（正規化前のスコア）",
        rows: [
          { cells: ["0.67", "0.59", "0.50"], highlights: ["score", "score", "score"] },
          { cells: ["0.73", "0.21", "0.50"], highlights: ["score", "score", "score"] },
          { cells: ["0.75", "0.47", "0.54"], highlights: ["score", "score", "score"] },
        ],
        color: "purple",
      },
    ],
    activeTokens: [0, 1, 2],
    desc: {
      ja: "Q と Kᵀ の積をとる。i 行 j 列は q_i と k_j の内積で、トークン i がトークン j にどれだけ注意するかを表す正規化前のスコアだ。列も行と同じ The, cat, sat の順なので、対角成分は自分自身へのスコアになる。",
      en: "Q is multiplied by Kᵀ. Row i, column j holds the dot product q_i · k_j, an unnormalized score for how much token i attends to token j. Columns follow the row order (The, cat, sat), so the diagonal holds each token's score for itself.",
    },
  },
  /* 3 */ {
    matrices: [
      {
        label: "Q · Kᵀ / √d_k (scaled)",
        labelJa: "Q · Kᵀ / √d_k（スケーリング後）",
        rows: [
          { cells: ["0.47", "0.42", "0.35"], highlights: ["score", "score", "score"] },
          { cells: ["0.52", "0.15", "0.35"], highlights: ["score", "score", "score"] },
          { cells: ["0.53", "0.33", "0.38"], highlights: ["score", "score", "score"] },
        ],
        color: "purple",
      },
    ],
    desc: {
      ja: "スコアを √d_k（= √2 ≈ 1.41）で割る。d_k が大きいと内積が大きくなりすぎて softmax が飽和し、勾配がほぼ 0 になる。この割り算でそれを防ぐ。",
      en: "The scores are divided by √d_k (= √2 ≈ 1.41). With a large d_k, dot products grow large enough to saturate softmax, leaving gradients near zero; the division prevents this.",
    },
  },
  /* 4 */ {
    matrices: [
      {
        label: "softmax(scores) → Attention Weights",
        labelJa: "softmax（スコア）→ 注意重み",
        rows: [
          { cells: ["0.35", "0.34", "0.31"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.39", "0.27", "0.34"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.37", "0.31", "0.32"], highlights: ["weight", "weight", "weight"] },
        ],
        color: "red",
      },
    ],
    desc: {
      ja: "行ごとに softmax を適用し、各行を合計 1.0 の確率分布にする。これが注意重み（Attention Weights）で、各トークンが自分を含む各トークンにどれだけ注意するかを表す。",
      en: "Softmax is applied to each row, turning it into a probability distribution that sums to 1.0. These are the attention weights: how much each token attends to every token, including itself.",
    },
  },
  /* 5 */ {
    matrices: [
      {
        label: "Attention Weights",
        labelJa: "注意重み",
        rows: [
          { cells: ["0.35", "0.34", "0.31"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.39", "0.27", "0.34"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.37", "0.31", "0.32"], highlights: ["weight", "weight", "weight"] },
        ],
        color: "red",
      },
      {
        label: "× V",
        rows: [
          { cells: ["0.6", "0.4"], highlights: ["v", "v"] },
          { cells: ["0.3", "0.8"], highlights: ["v", "v"] },
          { cells: ["0.7", "0.2"], highlights: ["v", "v"] },
        ],
        color: "orange",
      },
    ],
    desc: {
      ja: "注意重みと V 行列を掛け合わせて出力を得る。各トークンの出力は、全トークンの V ベクトルの重み付き平均になる。",
      en: "The attention weights are multiplied by V. Each token's output is a weighted average of all tokens' V vectors.",
    },
  },
  /* 6 */ {
    matrices: [
      {
        label: "Output = Weights · V",
        labelJa: "出力 = 注意重み · V",
        rows: [
          { cells: ["0.53", "0.47"], highlights: ["output", "output"] },
          { cells: ["0.55", "0.44"], highlights: ["output", "output"] },
          { cells: ["0.54", "0.46"], highlights: ["output", "output"] },
        ],
        color: "purple",
      },
    ],
    desc: {
      ja: "これが自己注意の出力で、各トークンは文脈を反映した新しいベクトルになる。例えば \"sat\" の出力 [0.54, 0.46] は、\"The\"、\"cat\"、\"sat\" の V を重み 0.37、0.31、0.32 で平均したもので、\"cat\" の情報も含む。",
      en: 'This is the self-attention output: each token now has a context-aware vector. For example, the output for "sat", [0.54, 0.46], averages the V vectors of "The", "cat", and "sat" with weights 0.37, 0.31, and 0.32, so it includes information from "cat".',
    },
  },
  /* 7 */ {
    matrices: [],
    desc: {
      ja: "マルチヘッド注意では、複数のヘッドが注意を並列に計算し、出力を連結して W_O で線形変換する。異なるヘッドが、主語と動詞、形容詞と名詞のような異なる関係を学習できる。",
      en: "In multi-head attention, several heads compute attention in parallel; their outputs are concatenated and multiplied by W_O. Different heads can learn different relationships, such as subject-verb or adjective-noun.",
    },
  },
];

/* ── Colors ────────────────────────────────────── */

const CELL_COLORS: Record<string, string> = {
  q: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  k: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  v: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  score: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  weight: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  output: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300",
};

const LABEL_COLORS: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  orange: "text-orange-600 dark:text-orange-400",
  purple: "text-purple-600 dark:text-purple-400",
  red: "text-red-600 dark:text-red-400",
  gray: "text-muted-foreground",
};

/* ── Component ─────────────────────────────────── */

export function SelfAttentionVisualizer({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 3000 });
  const current = steps[player.step];
  const lang = locale === "en" ? "en" : "ja";

  return (
    <InteractiveDemo
      title={lang === "en" ? "Self-Attention Mechanism" : "自己注意機構（Self-Attention）"}
      description={
        lang === "en"
          ? 'Self-attention on the three tokens of "The cat sat", computed step by step (d_k = 2, no causal mask, illustrative values).'
          : '"The cat sat" の 3 トークンで自己注意を計算する過程を、1 ステップずつ示す（d_k = 2、因果マスクなし、値は説明用）。'
      }
    >
      <div className="space-y-4">
        {/* Token header */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {lang === "en" ? "Tokens:" : "トークン:"}
          </span>
          {TOKENS.map((t, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded font-mono font-semibold transition-colors ${
                current.activeTokens?.includes(i)
                  ? "bg-accent/20 text-accent"
                  : "bg-muted text-foreground"
              }`}
            >
              {t}
            </span>
          ))}
        </div>

        {/* Matrices */}
        {current.matrices.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {current.matrices.map((mat, mi) => (
              <div key={mi} className="flex-shrink-0">
                <div className={`text-xs font-semibold mb-1.5 ${LABEL_COLORS[mat.color] ?? "text-foreground"}`}>
                  {lang === "ja" && mat.labelJa ? mat.labelJa : mat.label}
                </div>
                <table className="border-collapse">
                  <tbody>
                    {mat.rows.map((row, ri) => (
                      <tr key={ri}>
                        {/* Row label */}
                        <td className="pr-2 text-[10px] text-muted-foreground font-mono w-8 text-right">
                          {TOKENS[ri]}
                        </td>
                        {row.cells.map((cell, ci) => {
                          const hl = row.highlights?.[ci];
                          const cls = hl ? CELL_COLORS[hl] : "bg-muted/50 text-foreground";
                          return (
                            <td
                              key={ci}
                              className={`px-2 py-1 text-xs font-mono text-center border border-border/30 transition-colors duration-300 ${cls}`}
                            >
                              {cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* Multi-head info (step 7) */}
        {current.matrices.length === 0 && (
          <div className="rounded-lg border border-dashed border-accent/50 bg-accent/5 px-4 py-3 space-y-2">
            <div className="font-semibold text-accent text-sm">
              {lang === "en" ? "Multi-Head Attention" : "マルチヘッド注意機構"}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed font-mono">
              MultiHead(Q,K,V) = Concat(head₁, …, headₕ) · W_O
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="px-2 py-1 rounded text-[10px] font-mono bg-muted text-foreground">
                  {lang === "en" ? `Head ${i + 1}` : `ヘッド ${i + 1}`}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === "en"
                ? "h is the number of heads (8 here). Each head has its own W_Q, W_K, and W_V."
                : "h はヘッド数（ここでは 8）。各ヘッドが独自の W_Q, W_K, W_V を持つ。"}
            </div>
          </div>
        )}

        <p className="text-sm leading-relaxed text-muted-foreground">
          {current.desc[lang]}
        </p>
        <StepPlayerControls {...player} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
