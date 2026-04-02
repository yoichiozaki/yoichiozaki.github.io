"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ── Data ──────────────────────────────────────── */

/*
 * Corpus (after stopword removal):
 *   D1: [cat, sat, mat]   (3 terms)
 *   D2: [cat, dog]        (2 terms)
 *   D3: [dog, sat, log]   (3 terms)
 *
 * Query: "cat mat"
 *   TF(cat, D1)=1 TF(cat, D2)=1 TF(cat, D3)=0
 *   TF(mat, D1)=1 TF(mat, D2)=0 TF(mat, D3)=0
 *   DF(cat)=2  IDF(cat)=log10(3/2)≈0.176
 *   DF(mat)=1  IDF(mat)=log10(3/1)≈0.477
 */

type DocScore = {
  id: number;
  terms: string[];
  tfCat?: number;
  tfMat?: number;
  scoreCat?: number;
  scoreMat?: number;
  total?: number;
};

type Step = {
  docs: DocScore[];
  idfCat?: number;
  idfMat?: number;
  showRank?: boolean;
  showBM25?: boolean;
  desc: { ja: string; en: string };
};

const steps: Step[] = [
  /* 0 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"] },
      { id: 2, terms: ["cat", "dog"] },
      { id: 3, terms: ["dog", "sat", "log"] },
    ],
    desc: {
      ja: '3つのドキュメント（ストップワード除去済み）に対して、クエリ "cat mat" の TF-IDF スコアを計算してみましょう。',
      en: 'Let\'s calculate TF-IDF scores for the query "cat mat" across 3 documents (after stopword removal).',
    },
  },
  /* 1 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0 },
    ],
    desc: {
      ja: 'TF（出現頻度）の計算 — "cat" の各ドキュメント内での出現回数: D1=1回, D2=1回, D3=0回',
      en: 'Calculate TF (Term Frequency) for "cat" in each document: D1=1, D2=1, D3=0',
    },
  },
  /* 2 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1, tfMat: 1 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1, tfMat: 0 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0, tfMat: 0 },
    ],
    desc: {
      ja: '"mat" の出現回数: D1=1回, D2=0回, D3=0回',
      en: 'TF for "mat": D1=1, D2=0, D3=0',
    },
  },
  /* 3 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1, tfMat: 1 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1, tfMat: 0 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0, tfMat: 0 },
    ],
    idfCat: 0.176,
    idfMat: 0.477,
    desc: {
      ja: "IDF（逆文書頻度）を計算。cat: DF=2, IDF=log₁₀(3/2)≈0.176。mat: DF=1, IDF=log₁₀(3/1)≈0.477。mat の方が珍しいので IDF が高い！",
      en: "Calculate IDF. cat: DF=2, IDF=log₁₀(3/2)≈0.176. mat: DF=1, IDF=log₁₀(3/1)≈0.477. mat is rarer, so it has higher IDF!",
    },
  },
  /* 4 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1, tfMat: 1, scoreCat: 0.176, scoreMat: 0.477, total: 0.653 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1, tfMat: 0, scoreCat: 0.176, scoreMat: 0, total: 0.176 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0, tfMat: 0, scoreCat: 0, scoreMat: 0, total: 0 },
    ],
    idfCat: 0.176,
    idfMat: 0.477,
    desc: {
      ja: "TF-IDF = TF × IDF を各ドキュメントで計算。D1: 0.176+0.477=0.653、D2: 0.176+0=0.176、D3: 0",
      en: "Compute TF-IDF = TF × IDF for each doc. D1: 0.176+0.477=0.653, D2: 0.176+0=0.176, D3: 0",
    },
  },
  /* 5 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1, tfMat: 1, scoreCat: 0.176, scoreMat: 0.477, total: 0.653 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1, tfMat: 0, scoreCat: 0.176, scoreMat: 0, total: 0.176 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0, tfMat: 0, scoreCat: 0, scoreMat: 0, total: 0 },
    ],
    idfCat: 0.176,
    idfMat: 0.477,
    showRank: true,
    desc: {
      ja: "ランキング結果: D1（0.653）> D2（0.176）> D3（0）。珍しいターム mat を含む D1 が最上位！",
      en: "Ranking: D1 (0.653) > D2 (0.176) > D3 (0). D1 ranks highest thanks to the rare term mat!",
    },
  },
  /* 6 */ {
    docs: [
      { id: 1, terms: ["cat", "sat", "mat"], tfCat: 1, tfMat: 1, scoreCat: 0.176, scoreMat: 0.477, total: 0.653 },
      { id: 2, terms: ["cat", "dog"], tfCat: 1, tfMat: 0, scoreCat: 0.176, scoreMat: 0, total: 0.176 },
      { id: 3, terms: ["dog", "sat", "log"], tfCat: 0, tfMat: 0, scoreCat: 0, scoreMat: 0, total: 0 },
    ],
    idfCat: 0.176,
    idfMat: 0.477,
    showRank: true,
    showBM25: true,
    desc: {
      ja: "BM25 は TF-IDF を改良したアルゴリズム。TF の飽和関数と文書長の正規化を加え、より実用的なランキングを実現します。",
      en: "BM25 improves on TF-IDF with TF saturation and document length normalization for more practical ranking.",
    },
  },
];

/* ── Component ─────────────────────────────────── */

export function TFIDFCalculator({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2500 });
  const current = steps[player.step];
  const lang = locale === "en" ? "en" : "ja";
  const maxScore = 0.653;

  return (
    <InteractiveDemo
      title={lang === "en" ? "TF-IDF Score Calculator" : "TF-IDF スコア計算デモ"}
      description={
        lang === "en"
          ? 'Step through the TF-IDF scoring process for the query "cat mat".'
          : 'クエリ "cat mat" に対する TF-IDF スコア計算の過程を見てみましょう。'
      }
    >
      <div className="space-y-4">
        {/* Query badge */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">
            {lang === "en" ? "Query:" : "クエリ:"}
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono font-semibold">
            &quot;cat mat&quot;
          </span>
          <span className="text-xs text-muted-foreground">N=3</span>
        </div>

        {/* IDF panel */}
        {(current.idfCat != null || current.idfMat != null) && (
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="px-2.5 py-1.5 rounded border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">IDF(cat)</span>
              <span className="mx-1 text-muted-foreground">=</span>
              <span className="font-mono text-foreground">log₁₀(3/2) ≈ 0.176</span>
            </div>
            <div className="px-2.5 py-1.5 rounded border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30">
              <span className="text-orange-600 dark:text-orange-400 font-semibold">IDF(mat)</span>
              <span className="mx-1 text-muted-foreground">=</span>
              <span className="font-mono text-foreground">log₁₀(3/1) ≈ 0.477</span>
            </div>
          </div>
        )}

        {/* Document scores */}
        <div className="space-y-3">
          {current.docs.map((doc, idx) => {
            const rank =
              current.showRank && doc.total != null
                ? [...current.docs]
                    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
                    .findIndex((d) => d.id === doc.id) + 1
                : null;

            return (
              <div
                key={doc.id}
                className={`rounded-lg border px-3 py-2.5 transition-colors duration-300 ${
                  rank === 1
                    ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-muted-foreground">D{doc.id}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      [{doc.terms.join(", ")}]
                    </span>
                  </div>
                  {rank != null && (
                    <span
                      className={`text-xs font-bold ${
                        rank === 1 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                      }`}
                    >
                      #{rank}
                    </span>
                  )}
                </div>

                {/* TF values */}
                {(doc.tfCat != null || doc.tfMat != null) && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mb-1.5">
                    {doc.tfCat != null && (
                      <span>
                        <span className="text-blue-600 dark:text-blue-400">TF(cat)</span>
                        <span className="text-muted-foreground"> = </span>
                        <span className="font-mono text-foreground">{doc.tfCat}</span>
                      </span>
                    )}
                    {doc.tfMat != null && (
                      <span>
                        <span className="text-orange-600 dark:text-orange-400">TF(mat)</span>
                        <span className="text-muted-foreground"> = </span>
                        <span className="font-mono text-foreground">{doc.tfMat}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Score bar */}
                {doc.total != null && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden flex">
                        {doc.scoreCat != null && doc.scoreCat > 0 && (
                          <div
                            className="h-full bg-blue-400 dark:bg-blue-500 transition-all duration-500"
                            style={{ width: `${(doc.scoreCat / maxScore) * 100}%` }}
                          />
                        )}
                        {doc.scoreMat != null && doc.scoreMat > 0 && (
                          <div
                            className="h-full bg-orange-400 dark:bg-orange-500 transition-all duration-500"
                            style={{ width: `${(doc.scoreMat / maxScore) * 100}%` }}
                          />
                        )}
                      </div>
                      <span className="text-xs font-mono font-semibold text-foreground w-12 text-right">
                        {doc.total.toFixed(3)}
                      </span>
                    </div>
                    {(doc.scoreCat != null || doc.scoreMat != null) && (
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        {doc.scoreCat != null && doc.scoreCat > 0 && (
                          <span>
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 dark:bg-blue-500 mr-0.5" />
                            cat: {doc.scoreCat.toFixed(3)}
                          </span>
                        )}
                        {doc.scoreMat != null && doc.scoreMat > 0 && (
                          <span>
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 dark:bg-orange-500 mr-0.5" />
                            mat: {doc.scoreMat.toFixed(3)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BM25 note */}
        {current.showBM25 && (
          <div className="rounded-lg border border-dashed border-accent/50 bg-accent/5 px-3 py-2.5 text-sm space-y-1">
            <div className="font-semibold text-accent">
              BM25 ({lang === "en" ? "Improvement" : "改良版"})
            </div>
            <div className="text-xs text-muted-foreground font-mono leading-relaxed">
              BM25(t, d) = IDF(t) × TF(t,d) × (k₁ + 1) / (TF(t,d) + k₁ × (1 − b + b × |d| / avgdl))
            </div>
            <div className="text-xs text-muted-foreground">
              {lang === "en"
                ? "k₁=1.2 controls TF saturation (diminishing returns). b=0.75 normalizes for document length."
                : "k₁=1.2: TF の飽和（出現回数の増加に対して収穫逓減）。b=0.75: 文書長の正規化。"}
            </div>
          </div>
        )}

        <StepPlayerControls {...player} label={(s) => steps[s].desc[lang]} />
      </div>
    </InteractiveDemo>
  );
}
