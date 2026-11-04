"use client";

import { InteractiveDemo } from "./InteractiveDemo";

type TimelineEvent = {
  year: number;
  name: string;
  nameEn: string;
  paradigm: string;
  color: string;
  description: string;
  descriptionEn: string;
};

const events: TimelineEvent[] = [
  {
    year: 1936,
    name: "ラムダ計算",
    nameEn: "Lambda Calculus",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "Alonzo Church がラムダ計算を発表。関数型プログラミングの数学的基盤。",
    descriptionEn: "Alonzo Church publishes lambda calculus — the mathematical foundation of functional programming.",
  },
  {
    year: 1936,
    name: "チューリングマシン",
    nameEn: "Turing Machine",
    paradigm: "imperative",
    color: "#3b82f6",
    description: "Alan Turing がチューリングマシンを発表。状態遷移と逐次実行の概念は命令型プログラミングの基盤。",
    descriptionEn: "Alan Turing introduces the Turing machine. State transitions and sequential execution form the basis of imperative programming.",
  },
  {
    year: 1957,
    name: "FORTRAN",
    nameEn: "FORTRAN",
    paradigm: "imperative",
    color: "#3b82f6",
    description: "John Backus のチームが IBM で開発。最初に広く普及した高水準言語で、代表的な手続き型言語。",
    descriptionEn: "Developed by John Backus's team at IBM. The first widely adopted high-level language and a typical procedural language.",
  },
  {
    year: 1958,
    name: "LISP",
    nameEn: "LISP",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "John McCarthy が開発。ラムダ計算の λ記法を取り入れた最初の関数型言語。S式、ガベージコレクション、再帰を導入。",
    descriptionEn: "Created by John McCarthy. The first functional language, borrowing the λ-notation of lambda calculus. Introduced S-expressions, garbage collection, and recursion.",
  },
  {
    year: 1967,
    name: "Simula 67",
    nameEn: "Simula 67",
    paradigm: "oop",
    color: "#10b981",
    description: "Ole-Johan Dahl と Kristen Nygaard が開発。クラス・継承・仮想手続きを導入した OOP の祖。（初期の Simula I は 1962年に遡る）",
    descriptionEn: "Created by Ole-Johan Dahl and Kristen Nygaard. Introduced classes, inheritance, and virtual procedures — the ancestor of OOP. (The earlier Simula I dates back to 1962.)",
  },
  {
    year: 1972,
    name: "Prolog",
    nameEn: "Prolog",
    paradigm: "logic",
    color: "#f59e0b",
    description: "Alain Colmerauer らが開発。述語論理に基づく論理型プログラミング言語。",
    descriptionEn: "Created by Alain Colmerauer and colleagues. A logic programming language based on predicate logic.",
  },
  {
    year: 1972,
    name: "Smalltalk",
    nameEn: "Smalltalk",
    paradigm: "oop",
    color: "#10b981",
    description: "Alan Kay らが Xerox PARC で開発。「すべてがオブジェクト」「メッセージパッシング」を徹底した純粋 OOP 言語。",
    descriptionEn: "Developed by Alan Kay et al. at Xerox PARC. A pure OOP language built on 'everything is an object' and message passing.",
  },
  {
    year: 1973,
    name: "ML",
    nameEn: "ML",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "Robin Milner らが Edinburgh 大学で開発。型推論（Hindley–Milner）を導入した静的型付き関数型言語。後の ML 系言語が代数的データ型を普及させた。",
    descriptionEn: "Created by Robin Milner's group at the University of Edinburgh. A statically typed functional language that introduced type inference (Hindley–Milner); later ML-family languages popularized algebraic data types.",
  },
  {
    year: 1986,
    name: "Erlang",
    nameEn: "Erlang",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "Ericsson で開発。アクターモデルに基づく並行・分散・耐障害性を備えた関数型言語。",
    descriptionEn: "Developed at Ericsson. A functional language with actor-model concurrency, distribution, and fault tolerance.",
  },
  {
    year: 1990,
    name: "Haskell",
    nameEn: "Haskell",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "純粋関数型言語の標準として設計。遅延評価と型クラスを備え、後にモナドで副作用を扱うようになった。",
    descriptionEn: "Designed as a standard for pure functional programming, with lazy evaluation and type classes; monads were later adopted for side effects.",
  },
  {
    year: 1995,
    name: "Java",
    nameEn: "Java",
    paradigm: "oop",
    color: "#10b981",
    description: "Sun Microsystems が開発。「Write Once, Run Anywhere」を掲げたクラスベース OOP 言語。",
    descriptionEn: "Developed by Sun Microsystems. A class-based OOP language with the 'Write Once, Run Anywhere' philosophy.",
  },
  {
    year: 2003,
    name: "Scala",
    nameEn: "Scala",
    paradigm: "multi",
    color: "#ec4899",
    description: "Martin Odersky が開発。OOP と関数型を融合したマルチパラダイム言語。JVM 上で動作。",
    descriptionEn: "Created by Martin Odersky. A multi-paradigm language that unifies OOP and functional programming; runs on the JVM.",
  },
  {
    year: 2010,
    name: "Rust",
    nameEn: "Rust",
    paradigm: "multi",
    color: "#ec4899",
    description: "Mozilla Research が開発。所有権システムによりメモリー安全性を保証しつつ、関数型・命令型・並行プログラミングを統合。",
    descriptionEn: "Developed by Mozilla Research. Guarantees memory safety via ownership while integrating functional, imperative, and concurrent paradigms.",
  },
  {
    year: 2012,
    name: "Elixir",
    nameEn: "Elixir",
    paradigm: "functional",
    color: "#8b5cf6",
    description: "José Valim が開発。Erlang VM (BEAM) 上で動作する関数型言語。マクロとプロトコルを追加。",
    descriptionEn: "Created by José Valim. A functional language on the Erlang VM (BEAM) adding macros and protocols.",
  },
];

const paradigmLabels: Record<string, { ja: string; en: string }> = {
  imperative: { ja: "命令型", en: "Imperative" },
  functional: { ja: "関数型", en: "Functional" },
  oop: { ja: "オブジェクト指向", en: "OOP" },
  logic: { ja: "論理型", en: "Logic" },
  multi: { ja: "マルチパラダイム", en: "Multi-paradigm" },
};

type ParadigmTimelineProps = { locale?: string };

export function ParadigmTimeline({ locale = "ja" }: ParadigmTimelineProps) {
  const isEn = locale === "en";

  return (
    <InteractiveDemo
      title={isEn ? "Programming Paradigm Timeline" : "プログラミングパラダイム年表"}
      description={
        isEn
          ? "Key theories and languages from 1936 to 2012, colored by paradigm."
          : "1936年から2012年までに登場した主要な理論と言語。色はパラダイムを表す。"
      }
    >
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(paradigmLabels).map(([key, label]) => {
          const color = events.find((e) => e.paradigm === key)?.color ?? "#666";
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">
                {isEn ? label.en : label.ja}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

        <div className="flex flex-col gap-4">
          {events.map((event, i) => (
            <div key={i} className="relative pl-10 group">
              {/* Dot */}
              <div
                className="absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background transition-transform group-hover:scale-125"
                style={{ backgroundColor: event.color }}
              />
              {/* Content */}
              <div className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-accent/50">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {event.year}
                  </span>
                  <span className="font-semibold text-sm text-foreground">
                    {isEn ? event.nameEn : event.name}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: event.color }}
                  >
                    {isEn
                      ? paradigmLabels[event.paradigm].en
                      : paradigmLabels[event.paradigm].ja}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {isEn ? event.descriptionEn : event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InteractiveDemo>
  );
}
