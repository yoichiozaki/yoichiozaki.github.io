"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";
import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Type System Taxonomy ───────────────────── */

export function TypeSystemTaxonomy({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const amber = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#8b5cf6" : "#7c3aed";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const isEn = locale === "en";

  const categories = [
    {
      x: 20,
      color: accent,
      label: isEn ? "Static Typing" : "静的型付け",
      desc: isEn ? "Checked at compile time" : "コンパイル時にチェック",
      langs: "Java, Go, Rust, C++",
    },
    {
      x: 200,
      color: green,
      label: isEn ? "Dynamic Typing" : "動的型付け",
      desc: isEn ? "Checked at runtime" : "実行時にチェック",
      langs: "Python, Ruby, JS",
    },
    {
      x: 380,
      color: purple,
      label: isEn ? "Gradual Typing" : "漸進的型付け",
      desc: isEn ? "Mix of static & dynamic" : "静的と動的の混合",
      langs: "TypeScript, Python+mypy",
    },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 560 160" className="w-full max-w-lg">
        <text
          x={280}
          y={22}
          textAnchor="middle"
          fill={text}
          fontSize={14}
          fontWeight={700}
        >
          {isEn ? "Type System Classification" : "型システムの分類"}
        </text>
        {/* Root node */}
        <rect
          x={210}
          y={36}
          width={140}
          height={24}
          rx={6}
          fill={amber}
          opacity={0.15}
          stroke={amber}
          strokeWidth={1}
        />
        <text
          x={280}
          y={52}
          textAnchor="middle"
          fill={amber}
          fontSize={11}
          fontWeight={600}
        >
          {isEn ? "Type Systems" : "型システム"}
        </text>
        {/* Connector lines */}
        {categories.map((c, i) => (
          <line
            key={`line-${i}`}
            x1={280}
            y1={60}
            x2={c.x + 75}
            y2={78}
            stroke={border}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        ))}
        {categories.map((c, i) => (
          <g key={i}>
            <rect
              x={c.x}
              y={78}
              width={150}
              height={44}
              rx={8}
              fill={c.color}
              opacity={0.15}
              stroke={c.color}
              strokeWidth={1.5}
            />
            <text
              x={c.x + 75}
              y={97}
              textAnchor="middle"
              fill={c.color}
              fontSize={12}
              fontWeight={600}
            >
              {c.label}
            </text>
            <text
              x={c.x + 75}
              y={113}
              textAnchor="middle"
              fill={muted}
              fontSize={9}
            >
              {c.desc}
            </text>
            <text
              x={c.x + 75}
              y={140}
              textAnchor="middle"
              fill={text}
              fontSize={10}
            >
              {c.langs}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── 2. Structural vs Nominal Typing ──────────── */

export function StructuralVsNominal({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const red = dark ? "#ef4444" : "#dc2626";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const border = dark ? "#404040" : "#d4d4d4";
  const bg = dark ? "#262626" : "#f5f5f5";

  const isEn = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 580 280" className="w-full max-w-xl">
        <text
          x={290}
          y={22}
          textAnchor="middle"
          fill={text}
          fontSize={14}
          fontWeight={700}
        >
          {isEn ? "Structural vs Nominal Typing" : "構造的型付け vs 公称型付け"}
        </text>

        {/* Structural side */}
        <rect
          x={15}
          y={40}
          width={260}
          height={220}
          rx={10}
          fill={accent}
          opacity={0.05}
          stroke={accent}
          strokeWidth={1}
        />
        <text
          x={145}
          y={62}
          textAnchor="middle"
          fill={accent}
          fontSize={13}
          fontWeight={600}
        >
          {isEn ? "Structural Typing" : "構造的型付け"}
        </text>
        <text
          x={145}
          y={78}
          textAnchor="middle"
          fill={muted}
          fontSize={9}
        >
          TypeScript, Go (interface)
        </text>

        {/* Type A */}
        <rect
          x={35}
          y={92}
          width={100}
          height={60}
          rx={6}
          fill={bg}
          stroke={border}
          strokeWidth={1}
        />
        <text x={85} y={110} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          Dog
        </text>
        <text x={85} y={126} textAnchor="middle" fill={muted} fontSize={9}>
          name: string
        </text>
        <text x={85} y={139} textAnchor="middle" fill={muted} fontSize={9}>
          age: number
        </text>

        {/* Type B */}
        <rect
          x={155}
          y={92}
          width={100}
          height={60}
          rx={6}
          fill={bg}
          stroke={border}
          strokeWidth={1}
        />
        <text x={205} y={110} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          Cat
        </text>
        <text x={205} y={126} textAnchor="middle" fill={muted} fontSize={9}>
          name: string
        </text>
        <text x={205} y={139} textAnchor="middle" fill={muted} fontSize={9}>
          age: number
        </text>

        {/* Compatible */}
        <text x={145} y={170} textAnchor="middle" fill={green} fontSize={10} fontWeight={600}>
          {isEn ? "✓ Compatible (same shape)" : "✓ 互換 (同じ形状)"}
        </text>
        <text x={145} y={186} textAnchor="middle" fill={muted} fontSize={9}>
          {isEn
            ? "Dog = Cat is allowed"
            : "Dog = Cat が許される"}
        </text>

        {/* Code */}
        <rect x={30} y={196} width={230} height={50} rx={6} fill={dark ? "#1e1e1e" : "#f8f8f8"} stroke={border} strokeWidth={0.5} />
        <text x={42} y={214} fill={muted} fontSize={9} fontFamily="monospace">
          {isEn ? "// Both have {name, age}" : "// どちらも {name, age} を持つ"}
        </text>
        <text x={42} y={228} fill={green} fontSize={9} fontFamily="monospace">
          {"let x: Dog = cat; // OK ✓"}
        </text>

        {/* Nominal side */}
        <rect
          x={305}
          y={40}
          width={260}
          height={220}
          rx={10}
          fill={green}
          opacity={0.05}
          stroke={green}
          strokeWidth={1}
        />
        <text
          x={435}
          y={62}
          textAnchor="middle"
          fill={green}
          fontSize={13}
          fontWeight={600}
        >
          {isEn ? "Nominal Typing" : "公称型付け"}
        </text>
        <text
          x={435}
          y={78}
          textAnchor="middle"
          fill={muted}
          fontSize={9}
        >
          Java, C#, Rust, Kotlin
        </text>

        {/* Type A */}
        <rect
          x={325}
          y={92}
          width={100}
          height={60}
          rx={6}
          fill={bg}
          stroke={border}
          strokeWidth={1}
        />
        <text x={375} y={110} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          Dog
        </text>
        <text x={375} y={126} textAnchor="middle" fill={muted} fontSize={9}>
          name: String
        </text>
        <text x={375} y={139} textAnchor="middle" fill={muted} fontSize={9}>
          age: int
        </text>

        {/* Type B */}
        <rect
          x={445}
          y={92}
          width={100}
          height={60}
          rx={6}
          fill={bg}
          stroke={border}
          strokeWidth={1}
        />
        <text x={495} y={110} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>
          Cat
        </text>
        <text x={495} y={126} textAnchor="middle" fill={muted} fontSize={9}>
          name: String
        </text>
        <text x={495} y={139} textAnchor="middle" fill={muted} fontSize={9}>
          age: int
        </text>

        {/* Incompatible */}
        <text x={435} y={170} textAnchor="middle" fill={red} fontSize={10} fontWeight={600}>
          {isEn ? "✗ Incompatible (different names)" : "✗ 非互換 (異なる型名)"}
        </text>
        <text x={435} y={186} textAnchor="middle" fill={muted} fontSize={9}>
          {isEn
            ? "Dog ≠ Cat despite same fields"
            : "フィールドが同じでも Dog ≠ Cat"}
        </text>

        {/* Code */}
        <rect x={320} y={196} width={230} height={50} rx={6} fill={dark ? "#1e1e1e" : "#f8f8f8"} stroke={border} strokeWidth={0.5} />
        <text x={332} y={214} fill={muted} fontSize={9} fontFamily="monospace">
          {isEn ? "// Same fields, different types" : "// 同じフィールド、別の型"}
        </text>
        <text x={332} y={228} fill={red} fontSize={9} fontFamily="monospace">
          {"Dog x = cat; // Error ✗"}
        </text>
      </svg>
    </div>
  );
}

/* ── 3. Type Inference Visualizer (Step-based) ── */

type InferenceStep = {
  line: string;
  inferred: string;
  explanation: string;
  explanationEn: string;
  highlight: "info" | "success" | "warning";
};

const inferenceSteps: InferenceStep[] = [
  {
    line: 'let x = 42;',
    inferred: "x: number",
    explanation: "リテラル 42 から x の型を number と推論",
    explanationEn: "Infers x as number from literal 42",
    highlight: "info",
  },
  {
    line: 'let s = "hello";',
    inferred: "s: string",
    explanation: '文字列リテラル "hello" から s の型を string と推論',
    explanationEn: 'Infers s as string from string literal "hello"',
    highlight: "info",
  },
  {
    line: "let arr = [1, 2, 3];",
    inferred: "arr: number[]",
    explanation: "配列の要素がすべて number なので number[] と推論",
    explanationEn: "All elements are numbers, so infers number[]",
    highlight: "info",
  },
  {
    line: "let mixed = [1, \"two\"];",
    inferred: "mixed: (string | number)[]",
    explanation: "number と string が混在 → ユニオン型 (string | number)[] と推論",
    explanationEn: "Mixed number and string → infers union type (string | number)[]",
    highlight: "warning",
  },
  {
    line: "function add(a: number, b: number) {\n  return a + b;\n}",
    inferred: "add: (a: number, b: number) => number",
    explanation: "引数の型と return 文から戻り値の型を number と推論",
    explanationEn: "Infers return type as number from parameter types and return statement",
    highlight: "info",
  },
  {
    line: "let result = add(x, 10);",
    inferred: "result: number",
    explanation: "add() の戻り値型 number が result に伝播",
    explanationEn: "Return type number of add() propagates to result",
    highlight: "success",
  },
  {
    line: "let pair = { name: s, value: x };",
    inferred: "pair: { name: string; value: number }",
    explanation: "s: string, x: number からオブジェクトリテラルの型を推論",
    explanationEn: "Infers object literal type from s: string and x: number",
    highlight: "success",
  },
];

export function TypeInferenceVisualizer({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const isEn = locale === "en";
  const player = useStepPlayer({
    totalSteps: inferenceSteps.length,
    intervalMs: 1800,
  });
  const current = inferenceSteps[player.step];

  const highlightColors = {
    info: dark ? "border-blue-500/50 bg-blue-500/10" : "border-blue-400/50 bg-blue-50",
    success: dark ? "border-emerald-500/50 bg-emerald-500/10" : "border-emerald-400/50 bg-emerald-50",
    warning: dark ? "border-amber-500/50 bg-amber-500/10" : "border-amber-400/50 bg-amber-50",
  };

  const badgeColors = {
    info: "bg-blue-500/20 text-blue-400",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
  };

  return (
    <InteractiveDemo
      title={isEn ? "Type Inference Step by Step" : "型推論のステップ"}
      description={
        isEn
          ? "Watch how TypeScript infers types from expressions without explicit annotations."
          : "TypeScript が式から型注釈なしで型を推論する過程を見てみましょう。"
      }
    >
      <div className="space-y-4">
        {/* Code display */}
        <div className={`rounded-lg border p-4 font-mono text-sm ${highlightColors[current.highlight]}`}>
          <pre className="whitespace-pre-wrap text-foreground">{current.line}</pre>
        </div>

        {/* Inferred type */}
        <div className="flex items-center gap-3">
          <span className={`rounded-md px-2 py-1 text-xs font-medium ${badgeColors[current.highlight]}`}>
            {isEn ? "Inferred" : "推論結果"}
          </span>
          <code className="text-sm font-mono text-foreground">
            {current.inferred}
          </code>
        </div>

        {/* Explanation */}
        <p className="text-sm text-muted-foreground">
          {isEn ? current.explanationEn : current.explanation}
        </p>

        {/* Accumulated types table */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {isEn ? "Type Environment" : "型環境"}
          </div>
          <div className="flex flex-wrap gap-2">
            {inferenceSteps.slice(0, player.step + 1).map((s, i) => (
              <span
                key={i}
                className={`inline-block rounded px-2 py-0.5 text-xs font-mono ${
                  i === player.step
                    ? "bg-accent/20 text-accent font-semibold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.inferred}
              </span>
            ))}
          </div>
        </div>

        <StepPlayerControls
          {...player}
          label={(step) =>
            `${isEn ? "Step" : "ステップ"} ${step + 1} / ${inferenceSteps.length}`
          }
        />
      </div>
    </InteractiveDemo>
  );
}

/* ── 4. Language Comparison ────────────────────── */

export function TypeSystemComparison({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const border = dark ? "#404040" : "#d4d4d4";
  const bg = dark ? "#262626" : "#f5f5f5";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const amber = dark ? "#f59e0b" : "#d97706";
  const purple = dark ? "#8b5cf6" : "#7c3aed";
  const red = dark ? "#ef4444" : "#dc2626";

  const isEn = locale === "en";

  const langs = [
    {
      name: "TypeScript",
      color: accent,
      typing: isEn ? "Static (Gradual)" : "静的 (漸進的)",
      structural: true,
      inference: isEn ? "Strong" : "強力",
      generics: "✓",
      nullSafety: isEn ? "strict mode" : "strictモード",
    },
    {
      name: "Go",
      color: green,
      typing: isEn ? "Static" : "静的",
      structural: true,
      inference: isEn ? "Limited (:=)" : "限定的 (:=)",
      generics: isEn ? "✓ (1.18+)" : "✓ (1.18〜)",
      nullSafety: isEn ? "nil (no)" : "nil (なし)",
    },
    {
      name: "Rust",
      color: amber,
      typing: isEn ? "Static" : "静的",
      structural: false,
      inference: isEn ? "Strong" : "強力",
      generics: "✓",
      nullSafety: "Option<T>",
    },
    {
      name: "Java",
      color: red,
      typing: isEn ? "Static" : "静的",
      structural: false,
      inference: isEn ? "Limited (var)" : "限定的 (var)",
      generics: isEn ? "✓ (erased)" : "✓ (イレイジャ)",
      nullSafety: isEn ? "Optional (partial)" : "Optional (部分的)",
    },
    {
      name: "Python",
      color: purple,
      typing: isEn ? "Dynamic (+ hints)" : "動的 (+ ヒント)",
      structural: false,
      inference: "—",
      generics: isEn ? "✓ (hints)" : "✓ (ヒント)",
      nullSafety: isEn ? "Optional (hints)" : "Optional (ヒント)",
    },
  ];

  const headers = isEn
    ? ["Language", "Typing", "Struct?", "Inference", "Generics", "Null Safety"]
    : ["言語", "型付け", "構造的?", "型推論", "ジェネリクス", "null安全"];

  const colX = [10, 100, 210, 280, 355, 440];
  const rowH = 28;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg
        viewBox={`0 0 540 ${60 + (langs.length + 1) * rowH}`}
        className="w-full max-w-xl"
      >
        <text
          x={270}
          y={22}
          textAnchor="middle"
          fill={text}
          fontSize={14}
          fontWeight={700}
        >
          {isEn ? "Type System Comparison" : "型システムの比較"}
        </text>

        {/* Header row */}
        <rect
          x={5}
          y={34}
          width={530}
          height={rowH}
          rx={4}
          fill={bg}
          stroke={border}
          strokeWidth={0.5}
        />
        {headers.map((h, i) => (
          <text
            key={`h-${i}`}
            x={colX[i] + 10}
            y={52}
            fill={text}
            fontSize={10}
            fontWeight={600}
          >
            {h}
          </text>
        ))}

        {/* Data rows */}
        {langs.map((lang, ri) => {
          const y = 34 + (ri + 1) * rowH;
          const values = [
            lang.name,
            lang.typing,
            lang.structural ? "✓" : "✗",
            lang.inference,
            lang.generics,
            lang.nullSafety,
          ];
          return (
            <g key={ri}>
              {ri % 2 === 0 && (
                <rect x={5} y={y} width={530} height={rowH} rx={2} fill={bg} opacity={0.5} />
              )}
              {values.map((v, ci) => (
                <text
                  key={`${ri}-${ci}`}
                  x={colX[ci] + 10}
                  y={y + 18}
                  fill={ci === 0 ? lang.color : ci === 2 ? (lang.structural ? green : red) : muted}
                  fontSize={ci === 0 ? 11 : 10}
                  fontWeight={ci === 0 ? 600 : 400}
                >
                  {v}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
