"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
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
        rows: [
          { cells: ["1.0", "0.2", "0.5", "0.8"] },
          { cells: ["0.3", "0.9", "0.1", "0.6"] },
          { cells: ["0.7", "0.4", "0.8", "0.2"] },
        ],
        color: "gray",
      },
    ],
    desc: {
      ja: '3つのトークン "The cat sat" の入力埋め込みベクトル X（各トークンは4次元ベクトル）。ここから Q, K, V の3つの行列を計算します。',
      en: 'Input embedding matrix X for "The cat sat" (each token is a 4-dim vector). We will compute Q, K, V matrices from this.',
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
      en: "Multiply X by learned weight matrices W_Q, W_K, W_V to get Query, Key, Value. Q = 'what am I looking for', K = 'what do I contain', V = 'information to pass along'.",
    },
  },
  /* 2 */ {
    matrices: [
      {
        label: "Q · Kᵀ (raw scores)",
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
      ja: "Q と K の転置の内積を計算。各スコアは「トークン i が トークン j にどれだけ注目すべきか」の生スコア。対角成分は自分自身への注目度。",
      en: "Compute dot product of Q and Kᵀ. Each score measures how much token i should attend to token j. Diagonal = self-attention score.",
    },
  },
  /* 3 */ {
    matrices: [
      {
        label: "Q · Kᵀ / √d_k (scaled)",
        rows: [
          { cells: ["0.47", "0.42", "0.35"], highlights: ["score", "score", "score"] },
          { cells: ["0.52", "0.15", "0.35"], highlights: ["score", "score", "score"] },
          { cells: ["0.53", "0.33", "0.38"], highlights: ["score", "score", "score"] },
        ],
        color: "purple",
      },
    ],
    desc: {
      ja: "√d_k (= √2 ≈ 1.41) で割ってスケーリング。d_k が大きいと内積が大きくなりすぎ、softmax の勾配が消失するのを防ぐ。",
      en: "Divide by √d_k (= √2 ≈ 1.41) for scaling. Without this, large d_k causes dot products to grow large, pushing softmax into regions with vanishing gradients.",
    },
  },
  /* 4 */ {
    matrices: [
      {
        label: "softmax(scores) → Attention Weights",
        rows: [
          { cells: ["0.35", "0.34", "0.31"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.39", "0.27", "0.34"], highlights: ["weight", "weight", "weight"] },
          { cells: ["0.37", "0.31", "0.32"], highlights: ["weight", "weight", "weight"] },
        ],
        color: "red",
      },
    ],
    desc: {
      ja: "行ごとに softmax を適用し、確率分布に変換。各行の合計 = 1.0。これが注意重み（Attention Weights）で、各トークンが他のトークンにどれだけ注目するかを決定する。",
      en: "Apply softmax row-wise to get probability distribution. Each row sums to 1.0. These are the attention weights — how much each token attends to every other token.",
    },
  },
  /* 5 */ {
    matrices: [
      {
        label: "Attention Weights",
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
      ja: "注意重みと V 行列を掛け合わせて最終出力を得る。各トークンの出力は、全トークンの V ベクトルの重み付き平均になる。",
      en: "Multiply attention weights by V to get the final output. Each token's output is a weighted average of all tokens' V vectors.",
    },
  },
  /* 6 */ {
    matrices: [
      {
        label: "Output = Weights · V",
        rows: [
          { cells: ["0.53", "0.47"], highlights: ["output", "output"] },
          { cells: ["0.55", "0.44"], highlights: ["output", "output"] },
          { cells: ["0.54", "0.46"], highlights: ["output", "output"] },
        ],
        color: "purple",
      },
    ],
    desc: {
      ja: "自己注意機構の出力。各トークンは文脈を反映した新しいベクトルを持つ。例えば \"sat\" の出力には \"cat\" の情報が混ざっている（\"cat が sat した\" という関係を捉えている）。",
      en: 'Self-attention output. Each token now has a context-aware vector. e.g., "sat" output blends in "cat" information (capturing "the cat sat" relationship).',
    },
  },
  /* 7 */ {
    matrices: [],
    desc: {
      ja: "マルチヘッドの場合、複数の注意ヘッド（例: 8個）が異なる W_Q, W_K, W_V で並行計算し、結果を連結→線形変換する。各ヘッドが異なる関係性パターン（主語-動詞、形容詞-名詞など）を学習する。",
      en: "With multi-head attention, multiple heads (e.g., 8) compute in parallel with different W_Q, W_K, W_V, then concatenate → linear transform. Each head learns different relationship patterns (subject-verb, adjective-noun, etc.).",
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
          ? 'Step through the self-attention computation on "The cat sat".'
          : '"The cat sat" に対する自己注意の計算過程を見てみましょう。'
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
                  {mat.label}
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
                  Head {i + 1}
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === "en"
                ? "Each head has independent W_Q, W_K, W_V and captures different patterns."
                : "各ヘッドが独立した W_Q, W_K, W_V を持ち、異なるパターンを捉える。"}
            </div>
          </div>
        )}

        <StepPlayerControls {...player} label={(s) => steps[s].desc[lang]} />
      </div>
    </InteractiveDemo>
  );
}
