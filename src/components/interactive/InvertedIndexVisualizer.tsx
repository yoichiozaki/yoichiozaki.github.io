"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

/* ── Types ─────────────────────────────────────── */

type DocState = {
  id: number;
  text: string;
  tokens?: string[];
  removed?: string[];
  highlight?: "active" | "match" | null;
};

type IndexEntry = {
  term: string;
  postings: number[];
  highlight?: "new" | "update" | "lookup" | null;
};

type QueryState = {
  text: string;
  tokens?: string[];
  lookups?: { term: string; postings: number[] }[];
  operation?: string;
  result?: number[];
} | null;

type Step = {
  docs: DocState[];
  index: IndexEntry[];
  query: QueryState;
  desc: { ja: string; en: string };
};

/* ── Data ──────────────────────────────────────── */

const DOCS = [
  { id: 1, text: "the cat sat on the mat" },
  { id: 2, text: "the cat and the dog" },
  { id: 3, text: "the dog sat on a log" },
];

const d = (id: number) => DOCS[id - 1];

const steps: Step[] = [
  /* 0 */ {
    docs: [{ ...d(1) }, { ...d(2) }, { ...d(3) }],
    index: [],
    query: null,
    desc: {
      ja: "3つのドキュメントがあります。ここから転置インデックスを構築していきましょう。",
      en: "We have 3 documents. Let's build an inverted index from them step by step.",
    },
  },
  /* 1 */ {
    docs: [
      { ...d(1), tokens: ["the", "cat", "sat", "on", "the", "mat"], highlight: "active" },
      { ...d(2) },
      { ...d(3) },
    ],
    index: [],
    query: null,
    desc: {
      ja: 'D1 をトークン化: "the cat sat on the mat" → [the, cat, sat, on, the, mat]',
      en: 'Tokenize D1: "the cat sat on the mat" → [the, cat, sat, on, the, mat]',
    },
  },
  /* 2 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"], removed: ["the", "on"], highlight: "active" },
      { ...d(2) },
      { ...d(3) },
    ],
    index: [],
    query: null,
    desc: {
      ja: "ストップワード（the, on）を除去し重複を排除 → [cat, sat, mat]",
      en: 'Remove stopwords ("the", "on") and deduplicate → [cat, sat, mat]',
    },
  },
  /* 3 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"], highlight: "active" },
      { ...d(2) },
      { ...d(3) },
    ],
    index: [
      { term: "cat", postings: [1], highlight: "new" },
      { term: "mat", postings: [1], highlight: "new" },
      { term: "sat", postings: [1], highlight: "new" },
    ],
    query: null,
    desc: {
      ja: "D1 の各タームをインデックスに登録。cat→[D1], mat→[D1], sat→[D1]",
      en: "Add D1 terms to the index: cat→[D1], mat→[D1], sat→[D1]",
    },
  },
  /* 4 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["the", "cat", "and", "the", "dog"], highlight: "active" },
      { ...d(3) },
    ],
    index: [
      { term: "cat", postings: [1] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1] },
    ],
    query: null,
    desc: {
      ja: "D2 をトークン化: [the, cat, and, the, dog]",
      en: "Tokenize D2: [the, cat, and, the, dog]",
    },
  },
  /* 5 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"], removed: ["the", "and"], highlight: "active" },
      { ...d(3) },
    ],
    index: [
      { term: "cat", postings: [1] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1] },
    ],
    query: null,
    desc: {
      ja: "ストップワード（the, and）を除去 → [cat, dog]",
      en: 'Remove stopwords ("the", "and") → [cat, dog]',
    },
  },
  /* 6 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"], highlight: "active" },
      { ...d(3) },
    ],
    index: [
      { term: "cat", postings: [1, 2], highlight: "update" },
      { term: "dog", postings: [2], highlight: "new" },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1] },
    ],
    query: null,
    desc: {
      ja: "D2 のタームを追加。cat は既にあるのでポスティングリストに D2 を追加。dog は新規登録。",
      en: 'Add D2 terms. "cat" already exists — append D2. "dog" is new.',
    },
  },
  /* 7 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["the", "dog", "sat", "on", "a", "log"], highlight: "active" },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1] },
    ],
    query: null,
    desc: {
      ja: "D3 をトークン化: [the, dog, sat, on, a, log]",
      en: "Tokenize D3: [the, dog, sat, on, a, log]",
    },
  },
  /* 8 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"], removed: ["the", "on", "a"], highlight: "active" },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1] },
    ],
    query: null,
    desc: {
      ja: "ストップワード（the, on, a）を除去 → [dog, sat, log]",
      en: 'Remove stopwords ("the", "on", "a") → [dog, sat, log]',
    },
  },
  /* 9 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"], highlight: "active" },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2, 3], highlight: "update" },
      { term: "log", postings: [3], highlight: "new" },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3], highlight: "update" },
    ],
    query: null,
    desc: {
      ja: "D3 のタームを追加。dog と sat に D3 を追加。log は新規登録。",
      en: 'Add D3 terms. Append D3 to "dog" and "sat". "log" is new.',
    },
  },
  /* 10 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"] },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2, 3] },
      { term: "log", postings: [3] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3] },
    ],
    query: null,
    desc: {
      ja: "転置インデックスの構築が完了しました！各ターム → ドキュメントIDリストの対応関係ができています。次はこのインデックスで検索してみましょう。",
      en: "Inverted index is complete! Each term maps to a sorted list of document IDs. Now let's use it to search.",
    },
  },
  /* 11 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"] },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"] },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2, 3] },
      { term: "log", postings: [3] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3] },
    ],
    query: { text: "cat sat", tokens: ["cat", "sat"] },
    desc: {
      ja: '検索クエリ "cat sat" をトークン化 → [cat, sat]',
      en: 'Tokenize search query "cat sat" → [cat, sat]',
    },
  },
  /* 12 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"], highlight: "match" },
      { ...d(2), tokens: ["cat", "dog"], highlight: "match" },
      { ...d(3), tokens: ["dog", "sat", "log"] },
    ],
    index: [
      { term: "cat", postings: [1, 2], highlight: "lookup" },
      { term: "dog", postings: [2, 3] },
      { term: "log", postings: [3] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3] },
    ],
    query: {
      text: "cat sat",
      tokens: ["cat", "sat"],
      lookups: [{ term: "cat", postings: [1, 2] }],
    },
    desc: {
      ja: '"cat" をインデックスで検索 → ポスティングリスト {D1, D2}',
      en: 'Look up "cat" in the index → posting list {D1, D2}',
    },
  },
  /* 13 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"], highlight: "match" },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"], highlight: "match" },
    ],
    index: [
      { term: "cat", postings: [1, 2] },
      { term: "dog", postings: [2, 3] },
      { term: "log", postings: [3] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3], highlight: "lookup" },
    ],
    query: {
      text: "cat sat",
      tokens: ["cat", "sat"],
      lookups: [
        { term: "cat", postings: [1, 2] },
        { term: "sat", postings: [1, 3] },
      ],
    },
    desc: {
      ja: '"sat" をインデックスで検索 → ポスティングリスト {D1, D3}',
      en: 'Look up "sat" in the index → posting list {D1, D3}',
    },
  },
  /* 14 */ {
    docs: [
      { ...d(1), tokens: ["cat", "sat", "mat"], highlight: "match" },
      { ...d(2), tokens: ["cat", "dog"] },
      { ...d(3), tokens: ["dog", "sat", "log"] },
    ],
    index: [
      { term: "cat", postings: [1, 2], highlight: "lookup" },
      { term: "dog", postings: [2, 3] },
      { term: "log", postings: [3] },
      { term: "mat", postings: [1] },
      { term: "sat", postings: [1, 3], highlight: "lookup" },
    ],
    query: {
      text: "cat sat",
      tokens: ["cat", "sat"],
      lookups: [
        { term: "cat", postings: [1, 2] },
        { term: "sat", postings: [1, 3] },
      ],
      operation: "AND: {D1,D2} ∩ {D1,D3} = {D1}",
      result: [1],
    },
    desc: {
      ja: "AND 演算: {D1, D2} ∩ {D1, D3} = {D1}。両方のタームを含むのは D1 だけです！",
      en: "AND operation: {D1,D2} ∩ {D1,D3} = {D1}. Only D1 contains both terms!",
    },
  },
];

/* ── Colors ────────────────────────────────────── */

const COLORS = {
  active: { border: "border-blue-400 dark:border-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40" },
  match: { border: "border-green-400 dark:border-green-500", bg: "bg-green-50 dark:bg-green-950/40" },
  new: "bg-green-100 dark:bg-green-900/40",
  update: "bg-yellow-100 dark:bg-yellow-900/40",
  lookup: "bg-blue-100 dark:bg-blue-900/40",
};

/* ── Component ─────────────────────────────────── */

export function InvertedIndexVisualizer({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1800 });
  const current = steps[player.step];
  const lang = locale === "en" ? "en" : "ja";

  return (
    <InteractiveDemo
      title={lang === "en" ? "Inverted Index Builder" : "転置インデックス構築デモ"}
      description={
        lang === "en"
          ? "Watch how an inverted index is built from documents, then used to answer a search query."
          : "ドキュメントから転置インデックスを構築し、検索クエリに応答する過程を見てみましょう。"
      }
    >
      <div className="space-y-4">
        {/* Documents */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {lang === "en" ? "Documents" : "ドキュメント"}
          </h4>
          <div className="grid gap-2">
            {current.docs.map((doc) => {
              const hl = doc.highlight;
              const borderCls = hl ? COLORS[hl].border : "border-border";
              const bgCls = hl ? COLORS[hl].bg : "bg-background";
              return (
                <div
                  key={doc.id}
                  className={`rounded-lg border ${borderCls} ${bgCls} px-3 py-2 transition-colors duration-300`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">
                      D{doc.id}
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      &quot;{doc.text}&quot;
                    </span>
                  </div>
                  {(doc.tokens || doc.removed) && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {doc.removed?.map((t, i) => (
                        <span
                          key={`r-${i}`}
                          className="text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-500 line-through"
                        >
                          {t}
                        </span>
                      ))}
                      {doc.tokens?.map((t, i) => (
                        <span
                          key={`t-${i}`}
                          className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inverted Index */}
        {current.index.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">
              {lang === "en" ? "Inverted Index" : "転置インデックス"}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 px-3 text-muted-foreground font-medium w-28">
                      {lang === "en" ? "Term" : "ターム"}
                    </th>
                    <th className="text-left py-1.5 px-3 text-muted-foreground font-medium">
                      {lang === "en" ? "Posting List" : "ポスティングリスト"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {current.index.map((entry) => {
                    const rowBg = entry.highlight ? COLORS[entry.highlight] : "";
                    return (
                      <tr
                        key={entry.term}
                        className={`border-b border-border/50 transition-colors duration-300 ${rowBg}`}
                      >
                        <td className="py-1.5 px-3 font-mono font-semibold text-foreground">
                          {entry.term}
                        </td>
                        <td className="py-1.5 px-3">
                          <div className="flex gap-1.5">
                            {entry.postings.map((docId) => (
                              <span
                                key={docId}
                                className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground font-semibold"
                              >
                                D{docId}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Query */}
        {current.query && (
          <div className="rounded-lg border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-950/30 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔍</span>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {lang === "en" ? "Query" : "クエリ"}: &quot;{current.query.text}&quot;
              </span>
              {current.query.tokens && (
                <span className="text-xs text-muted-foreground">
                  → [{current.query.tokens.join(", ")}]
                </span>
              )}
            </div>
            {current.query.lookups && current.query.lookups.length > 0 && (
              <div className="space-y-1 text-sm">
                {current.query.lookups.map((lu) => (
                  <div key={lu.term} className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      {lu.term}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">
                      {"{"}D{lu.postings.join(", D")}{"}"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {current.query.operation && (
              <div className="text-sm font-mono text-green-700 dark:text-green-400 font-semibold">
                {current.query.operation}
              </div>
            )}
            {current.query.result && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {lang === "en" ? "Result:" : "結果:"}
                </span>
                {current.query.result.map((docId) => (
                  <span
                    key={docId}
                    className="text-sm px-2 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 font-bold"
                  >
                    D{docId} ✓
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <StepPlayerControls
          {...player}
          label={(s) => steps[s].desc[lang]}
        />
      </div>
    </InteractiveDemo>
  );
}
