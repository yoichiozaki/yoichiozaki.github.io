"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ── Step data: autoregressive generation with temperature / top-k ── */

type TokenCandidate = {
  token: string;
  logit: number;
  prob: number;
  selected?: boolean;
  eliminated?: boolean;
};

type Step = {
  context: string[];
  candidates: TokenCandidate[];
  temperature?: number;
  topK?: number;
  phase: "logits" | "temperature" | "topk" | "sample" | "append";
  desc: { ja: string; en: string };
};

const steps: Step[] = [
  /* 0 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.0 },
      { token: "is", logit: 2.8, prob: 0.0 },
      { token: "ran", logit: 1.5, prob: 0.0 },
      { token: "the", logit: 0.9, prob: 0.0 },
      { token: "very", logit: 0.4, prob: 0.0 },
    ],
    phase: "logits",
    desc: {
      ja: 'コンテキスト "The cat" を入力。モデルの最終層が次トークンの生ロジット（スコア）を出力する。',
      en: 'Input context "The cat". The model\'s final layer outputs raw logits (scores) for the next token.',
    },
  },
  /* 1 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.50 },
      { token: "is", logit: 2.8, prob: 0.33 },
      { token: "ran", logit: 1.5, prob: 0.09 },
      { token: "the", logit: 0.9, prob: 0.05 },
      { token: "very", logit: 0.4, prob: 0.03 },
    ],
    phase: "logits",
    desc: {
      ja: "softmax を適用してロジットを確率分布に変換。温度 T=1.0（デフォルト）では元のロジット分布がそのまま反映される。",
      en: "Apply softmax to convert logits to probabilities. With temperature T=1.0 (default), the original logit distribution is preserved.",
    },
  },
  /* 2 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.67 },
      { token: "is", logit: 2.8, prob: 0.30 },
      { token: "ran", logit: 1.5, prob: 0.02 },
      { token: "the", logit: 0.9, prob: 0.01 },
      { token: "very", logit: 0.4, prob: 0.00 },
    ],
    temperature: 0.5,
    phase: "temperature",
    desc: {
      ja: "温度 T=0.5 に下げると分布が鋭くなる（logit/T で割る）。高確率トークンがさらに支配的になり、出力がより決定的になる。",
      en: "Lower temperature T=0.5 sharpens the distribution (divide logits by T). High-probability tokens become more dominant — output becomes more deterministic.",
    },
  },
  /* 3 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.36 },
      { token: "is", logit: 2.8, prob: 0.29 },
      { token: "ran", logit: 1.5, prob: 0.15 },
      { token: "the", logit: 0.9, prob: 0.11 },
      { token: "very", logit: 0.4, prob: 0.09 },
    ],
    temperature: 2.0,
    phase: "temperature",
    desc: {
      ja: "温度 T=2.0 に上げると分布がなだらかなる。低確率トークンも選ばれやすくなり、出力が多様（創造的）になるが、不自然な文も生成しやすい。",
      en: "Higher temperature T=2.0 flattens the distribution. Low-probability tokens become more likely — output is more diverse (creative) but may be less coherent.",
    },
  },
  /* 4 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.50, selected: false },
      { token: "is", logit: 2.8, prob: 0.33, selected: false },
      { token: "ran", logit: 1.5, prob: 0.09, selected: false },
      { token: "the", logit: 0.9, prob: 0.05, eliminated: true },
      { token: "very", logit: 0.4, prob: 0.03, eliminated: true },
    ],
    topK: 3,
    phase: "topk",
    desc: {
      ja: "Top-k サンプリング（k=3）: 確率上位 3 トークンだけを残し、残りを排除する。次のステップで再正規化してサンプリングする。",
      en: "Top-k sampling (k=3): Keep only the top 3 tokens by probability and eliminate the rest. The remaining probabilities will be renormalized in the next step.",
    },
  },
  /* 5 */ {
    context: ["The", "cat"],
    candidates: [
      { token: "sat", logit: 3.2, prob: 0.54, selected: true },
      { token: "is", logit: 2.8, prob: 0.36 },
      { token: "ran", logit: 1.5, prob: 0.10 },
      { token: "the", logit: 0.9, prob: 0.0, eliminated: true },
      { token: "very", logit: 0.4, prob: 0.0, eliminated: true },
    ],
    topK: 3,
    phase: "sample",
    desc: {
      ja: '残った確率分布からサンプリング → "sat" が選ばれた！Greedy ではなく確率的に選ぶので、同じ入力でも毎回異なる結果になりうる。',
      en: 'Sample from the remaining distribution → "sat" was selected! Since sampling is stochastic (not greedy), the same input can produce different outputs.',
    },
  },
  /* 6 */ {
    context: ["The", "cat", "sat"],
    candidates: [
      { token: "on", logit: 4.1, prob: 0.52 },
      { token: "down", logit: 2.3, prob: 0.18 },
      { token: "quietly", logit: 1.8, prob: 0.10 },
      { token: "in", logit: 1.2, prob: 0.06 },
      { token: "and", logit: 0.8, prob: 0.04 },
    ],
    phase: "append",
    desc: {
      ja: '"sat" がコンテキストに追加され、"The cat sat" が新しい入力に。このプロセスを繰り返すのが自己回帰生成。1トークンずつ文を構築していく。',
      en: '"sat" is appended to context, making "The cat sat" the new input. Repeating this process is autoregressive generation — building the sentence one token at a time.',
    },
  },
  /* 7 */ {
    context: ["The", "cat", "sat"],
    candidates: [
      { token: "on", logit: 4.1, prob: 0.52, selected: true },
      { token: "down", logit: 2.3, prob: 0.18 },
      { token: "quietly", logit: 1.8, prob: 0.10 },
      { token: "in", logit: 1.2, prob: 0.06 },
      { token: "and", logit: 0.8, prob: 0.04 },
    ],
    phase: "sample",
    desc: {
      ja: '"on" を選択 → "The cat sat on" ... このように左から右へ1トークンずつ生成し、停止トークン（EOS）が出るまで繰り返す。これがLLMのテキスト生成の全体像。',
      en: 'Select "on" → "The cat sat on" ... Generation proceeds left-to-right, one token at a time, until a stop token (EOS) is produced. This is the complete LLM text generation loop.',
    },
  },
];

/* ── Component ─────────────────────────────────── */

export function TextGenerationDemo({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 3000 });
  const current = steps[player.step];
  const lang = locale === "en" ? "en" : "ja";

  const maxProb = Math.max(...current.candidates.map((c) => c.prob));

  return (
    <InteractiveDemo
      title={lang === "en" ? "Text Generation Demo" : "テキスト生成デモ"}
      description={
        lang === "en"
          ? "Watch how LLMs generate text one token at a time using temperature and top-k sampling."
          : "LLMが温度とtop-kサンプリングで1トークンずつテキストを生成する過程を見てみましょう。"
      }
    >
      <div className="space-y-4">
        {/* Context display */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            {lang === "en" ? "Context:" : "コンテキスト:"}
          </span>
          {current.context.map((tok, i) => (
            <span
              key={i}
              className="text-sm px-2 py-0.5 rounded bg-muted text-foreground font-mono font-semibold"
            >
              {tok}
            </span>
          ))}
          <span className="text-sm text-accent animate-pulse font-bold">▌</span>
        </div>

        {/* Parameter badges */}
        <div className="flex gap-2 flex-wrap text-xs">
          {current.temperature != null && (
            <span className={`px-2 py-0.5 rounded border font-mono ${
              current.temperature < 1 
                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
            }`}>
              T = {current.temperature}
            </span>
          )}
          {current.topK != null && (
            <span className="px-2 py-0.5 rounded border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 font-mono">
              top-k = {current.topK}
            </span>
          )}
        </div>

        {/* Candidates */}
        <div className="space-y-1.5">
          {current.candidates.map((cand, i) => {
            const barWidth = maxProb > 0 ? (cand.prob / maxProb) * 100 : 0;
            const isSelected = cand.selected;
            const isEliminated = cand.eliminated;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg px-3 py-1.5 transition-all duration-300 ${
                  isSelected
                    ? "border-2 border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950/30"
                    : isEliminated
                    ? "border border-border/50 bg-muted/30 opacity-40"
                    : "border border-border bg-background"
                }`}
              >
                {/* Token */}
                <span className={`text-sm font-mono font-semibold w-14 shrink-0 ${
                  isEliminated ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {cand.token}
                </span>

                {/* Probability bar */}
                <div className="flex-1 h-5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected
                        ? "bg-green-400 dark:bg-green-500"
                        : isEliminated
                        ? "bg-gray-300 dark:bg-gray-700"
                        : "bg-accent/60"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Values */}
                <span className="text-[10px] text-muted-foreground font-mono w-16 text-right">
                  logit: {cand.logit.toFixed(1)}
                </span>
                <span className={`text-xs font-mono font-semibold w-12 text-right ${
                  isSelected ? "text-green-600 dark:text-green-400" : "text-foreground"
                }`}>
                  {(cand.prob * 100).toFixed(0)}%
                </span>

                {isSelected && <span className="text-green-600 dark:text-green-400 text-sm">✓</span>}
              </div>
            );
          })}
        </div>

        <StepPlayerControls {...player} label={(s) => steps[s].desc[lang]} />
      </div>
    </InteractiveDemo>
  );
}
