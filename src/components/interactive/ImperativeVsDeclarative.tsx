"use client";

import { useCallback } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { useStepPlayer } from "./useStepPlayer";

type ExecutionStep = {
  imperative: { line: number; state: Record<string, string>; output?: string };
  declarative: { line: number; state: Record<string, string>; output?: string };
  description: string;
  descriptionEn: string;
};

const imperativeCode = [
  "const numbers = [1, 2, 3, 4, 5, 6];",
  "const result = [];",
  "for (let i = 0; i < numbers.length; i++) {",
  "  if (numbers[i] % 2 === 0) {",
  "    result.push(numbers[i] * 2);",
  "  }",
  "}",
  "// result = [4, 8, 12]",
];

const declarativeCode = [
  "const numbers = [1, 2, 3, 4, 5, 6];",
  "",
  "const result = numbers",
  "  .filter(n => n % 2 === 0)",
  "  .map(n => n * 2);",
  "",
  "",
  "// result = [4, 8, 12]",
];

const steps: ExecutionStep[] = [
  {
    imperative: { line: 0, state: { numbers: "[1,2,3,4,5,6]" } },
    declarative: { line: 0, state: { numbers: "[1,2,3,4,5,6]" } },
    description: "配列を初期化。同じデータから出発。",
    descriptionEn: "Initialize the array. Both start from the same data.",
  },
  {
    imperative: { line: 1, state: { numbers: "[1,2,3,4,5,6]", result: "[]" } },
    declarative: { line: 2, state: { numbers: "[1,2,3,4,5,6]" } },
    description: "命令型: 空の配列を用意（ミュータブルな状態）。宣言型: メソッドチェーンを開始。",
    descriptionEn: "Imperative: prepare empty array (mutable state). Declarative: begin method chain.",
  },
  {
    imperative: { line: 2, state: { numbers: "[1,2,3,4,5,6]", result: "[]", i: "0" } },
    declarative: { line: 3, state: { numbers: "[1,2,3,4,5,6]", filtered: "[2,4,6]" } },
    description: "命令型: ループ変数 i=0 で反復開始。宣言型: filter で偶数を抽出（一度に！）。",
    descriptionEn: "Imperative: loop starts at i=0. Declarative: filter extracts evens (all at once!).",
  },
  {
    imperative: { line: 3, state: { numbers: "[1,2,3,4,5,6]", result: "[]", i: "0", "1%2===0": "false" } },
    declarative: { line: 4, state: { filtered: "[2,4,6]", result: "[4,8,12]" } },
    description: "命令型: 1 は奇数 → スキップ。宣言型: map で各要素を2倍（一度に！）。",
    descriptionEn: "Imperative: 1 is odd → skip. Declarative: map doubles each element (all at once!).",
  },
  {
    imperative: { line: 3, state: { result: "[]", i: "1", "2%2===0": "true" } },
    declarative: { line: 4, state: { result: "[4,8,12]" } },
    description: "命令型: 2 は偶数 → 条件分岐へ。宣言型: 完了。「何を」だけ記述して処理系に任せた。",
    descriptionEn: "Imperative: 2 is even → enter branch. Declarative: done. Described 'what', left 'how' to runtime.",
  },
  {
    imperative: { line: 4, state: { result: "[4]", i: "1" } },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "命令型: result に 2*2=4 を push。宣言型: 結果が得られた。",
    descriptionEn: "Imperative: push 2*2=4 to result. Declarative: result obtained.",
  },
  {
    imperative: { line: 3, state: { result: "[4]", i: "2", "3%2===0": "false" } },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "命令型: 3 は奇数 → スキップ。ループはまだ続く...",
    descriptionEn: "Imperative: 3 is odd → skip. Loop continues...",
  },
  {
    imperative: { line: 4, state: { result: "[4,8]", i: "3" } },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "命令型: 4 は偶数 → 4*2=8 を push。",
    descriptionEn: "Imperative: 4 is even → push 4*2=8.",
  },
  {
    imperative: { line: 4, state: { result: "[4,8,12]", i: "5" } },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "命令型: 5 をスキップし、6 は偶数 → 6*2=12 を push。",
    descriptionEn: "Imperative: skip 5, 6 is even → push 6*2=12.",
  },
  {
    imperative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "両方とも同じ結果。命令型は「どうやるか」を10ステップで記述。宣言型は「何がほしいか」を2行で記述。",
    descriptionEn: "Both produce the same result. Imperative: 10 steps describing 'how'. Declarative: 2 lines describing 'what'.",
  },
];

function CodePanel({
  title,
  code,
  activeLine,
  state,
  output,
}: {
  title: string;
  code: string[];
  activeLine: number;
  state: Record<string, string>;
  output?: string;
}) {
  return (
    <div className="flex-1 min-w-[260px]">
      <div className="text-xs font-semibold text-muted-foreground mb-2">{title}</div>
      <div className="rounded-lg border border-border bg-background font-mono text-xs overflow-hidden">
        <div className="p-3">
          {code.map((line, i) => (
            <div
              key={i}
              className={`px-2 py-0.5 rounded transition-colors ${
                i === activeLine
                  ? "bg-accent/20 text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <span className="inline-block w-5 text-right mr-2 opacity-40 select-none">
                {i + 1}
              </span>
              {line || "\u00A0"}
            </div>
          ))}
        </div>
        {/* State panel */}
        <div className="border-t border-border px-3 py-2 bg-muted/30">
          <div className="text-[10px] text-muted-foreground mb-1">State:</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {Object.entries(state).map(([k, v]) => (
              <span key={k} className="text-[11px]">
                <span className="text-accent">{k}</span>
                <span className="text-muted-foreground">=</span>
                <span className="text-foreground">{v}</span>
              </span>
            ))}
          </div>
          {output && (
            <div className="mt-1 text-[11px] text-green-600 dark:text-green-400">
              → {output}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ImperativeVsDeclarativeProps = { locale?: string };

export function ImperativeVsDeclarative({ locale = "ja" }: ImperativeVsDeclarativeProps) {
  const isEn = locale === "en";

  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: 1800,
  });

  const current = steps[player.step];

  const getLabel = useCallback(
    (step: number) => {
      const s = steps[step];
      return isEn ? s.descriptionEn : s.description;
    },
    [isEn],
  );

  return (
    <InteractiveDemo
      title={isEn ? "Imperative vs Declarative Execution" : "命令型 vs 宣言型の実行比較"}
      description={
        isEn
          ? "Step through the same task in imperative and declarative styles side by side."
          : "同じタスクを命令型と宣言型で並べてステップ実行します。"
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 flex-wrap">
          <CodePanel
            title={isEn ? "Imperative (How)" : "命令型（How）"}
            code={imperativeCode}
            activeLine={current.imperative.line}
            state={current.imperative.state}
            output={current.imperative.output}
          />
          <CodePanel
            title={isEn ? "Declarative (What)" : "宣言型（What）"}
            code={declarativeCode}
            activeLine={current.declarative.line}
            state={current.declarative.state}
            output={current.declarative.output}
          />
        </div>

        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
