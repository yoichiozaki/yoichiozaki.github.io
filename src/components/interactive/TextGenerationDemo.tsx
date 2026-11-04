"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
      ja: 'コンテキスト "The cat" を入力すると、モデルの最終層が次のトークンの候補ごとにロジット（softmax 前のスコア）を出力する。',
      en: 'Given the context "The cat", the model\'s final layer outputs a logit (a score before softmax) for each candidate next token.',
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
      ja: "softmax でロジットを確率分布に変換する。温度 T = 1.0（デフォルト）では、ロジットを T で割っても値は変わらない。",
      en: "Softmax converts the logits into probabilities. At temperature T = 1.0 (the default), dividing the logits by T leaves them unchanged.",
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
      ja: "温度を T = 0.5 に下げると、ロジットを 0.5 で割るので分布が鋭くなる。確率の高いトークンがさらに選ばれやすくなり、出力がより決定的になる。",
      en: "Lowering the temperature to T = 0.5 divides the logits by 0.5, which sharpens the distribution. Likely tokens become even more likely, and the output becomes more deterministic.",
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
      ja: "温度を T = 2.0 に上げると分布がなだらかになる。確率の低いトークンも選ばれやすくなり、出力が多様（創造的）になるが、不自然な文も出やすくなる。",
      en: "Raising the temperature to T = 2.0 flattens the distribution. Less likely tokens are chosen more often, so the output becomes more diverse (creative) but also more likely to be incoherent.",
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
      ja: "Top-k サンプリング（k = 3）: 確率上位 3 トークンだけを残し、残りの確率を 0 にする。次のステップで再正規化してサンプリングする。",
      en: "Top-k sampling (k = 3): only the 3 most probable tokens are kept, and the rest are set to zero. The next step renormalizes the remaining probabilities and samples from them.",
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
      ja: '再正規化した分布（0.54、0.36、0.10）からサンプリングし、"sat" が選ばれた。greedy decoding と違って確率的に選ぶので、同じ入力でも 36% の確率で "is" が選ばれる。',
      en: 'A token is sampled from the renormalized distribution (0.54, 0.36, 0.10), and "sat" is chosen. Unlike greedy decoding, sampling is random: with the same input, "is" is chosen 36% of the time.',
    },
  },
  /* 6 */ {
    context: ["The", "cat", "sat"],
    candidates: [
      { token: "on", logit: 4.1, prob: 0.74 },
      { token: "down", logit: 2.3, prob: 0.12 },
      { token: "quietly", logit: 1.8, prob: 0.07 },
      { token: "in", logit: 1.2, prob: 0.04 },
      { token: "and", logit: 0.8, prob: 0.03 },
    ],
    phase: "append",
    desc: {
      ja: '"sat" をコンテキストに追加し、"The cat sat" を新しい入力として次のトークンの分布を計算する。これを繰り返すのが自己回帰生成だ。',
      en: '"sat" is appended to the context, and the distribution over the next token is computed from the new input "The cat sat". Repeating this is autoregressive generation.',
    },
  },
  /* 7 */ {
    context: ["The", "cat", "sat"],
    candidates: [
      { token: "on", logit: 4.1, prob: 0.74, selected: true },
      { token: "down", logit: 2.3, prob: 0.12 },
      { token: "quietly", logit: 1.8, prob: 0.07 },
      { token: "in", logit: 1.2, prob: 0.04 },
      { token: "and", logit: 0.8, prob: 0.03 },
    ],
    phase: "sample",
    desc: {
      ja: '次は "on" が選ばれ、"The cat sat on" になる。こうして左から右へ 1 トークンずつ生成し、停止トークン（EOS）が出るまで繰り返す。',
      en: 'Next, "on" is chosen, giving "The cat sat on". Generation continues left to right, one token at a time, until a stop token (EOS) is produced.',
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
          ? "Text generated one token at a time with temperature and top-k sampling (top five candidates shown, illustrative values)."
          : "温度と top-k サンプリングで、LLM が 1 トークンずつテキストを生成する過程を示す（表示は上位 5 候補、値は説明用）。"
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

        <p className="text-sm leading-relaxed text-muted-foreground">
          {current.desc[lang]}
        </p>
        <StepPlayerControls {...player} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
