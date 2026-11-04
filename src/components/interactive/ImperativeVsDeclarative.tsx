"use client";

import { useCallback } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { stepPlayerAriaLabels } from "./stepPlayerAriaLabels";
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
    descriptionEn: "Imperative: create an empty array (mutable state). Declarative: start the method chain.",
  },
  {
    imperative: { line: 2, state: { numbers: "[1,2,3,4,5,6]", result: "[]", i: "0" } },
    declarative: { line: 3, state: { numbers: "[1,2,3,4,5,6]", filtered: "[2,4,6]" } },
    description: "命令型: ループ変数 i=0 で反復開始。宣言型: filter が偶数を取り出す（反復は filter の内部で行われる）。",
    descriptionEn: "Imperative: the loop starts at i=0. Declarative: filter keeps the even numbers (the iteration happens inside filter).",
  },
  {
    imperative: { line: 3, state: { numbers: "[1,2,3,4,5,6]", result: "[]", i: "0", "1%2===0": "false" } },
    declarative: { line: 4, state: { filtered: "[2,4,6]", result: "[4,8,12]" } },
    description: "命令型: 1 は奇数 → スキップ。宣言型: map が各要素を 2 倍にする（反復は map の内部）。",
    descriptionEn: "Imperative: 1 is odd → skip. Declarative: map doubles each element (again iterating internally).",
  },
  {
    imperative: { line: 3, state: { result: "[]", i: "1", "2%2===0": "true" } },
    declarative: { line: 4, state: { result: "[4,8,12]" } },
    description: "命令型: 2 は偶数 → 条件分岐へ。宣言型: 完了。「何を」だけを書き、「どうやるか」は処理系に任せた。",
    descriptionEn: "Imperative: 2 is even → enter the branch. Declarative: done. Only the 'what' was written; the 'how' was left to the runtime.",
  },
  {
    imperative: { line: 4, state: { result: "[4]", i: "1" } },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "命令型: result に 2*2=4 を push。宣言型: 結果が得られた。",
    descriptionEn: "Imperative: push 2*2=4 onto result. Declarative: the result is ready.",
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
    descriptionEn: "Imperative: skip 5; 6 is even → push 6*2=12.",
  },
  {
    imperative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    declarative: { line: 7, state: { result: "[4,8,12]" }, output: "[4, 8, 12]" },
    description: "両方とも同じ結果。命令型はループ変数・条件分岐・push という「どうやるか」を書き、宣言型は filter と map で「何がほしいか」だけを書いた。",
    descriptionEn: "Both produce the same result. The imperative code spells out the 'how' (loop variable, branch, push); the declarative code states only the 'what' with filter and map.",
  },
];

function CodePanel({
  title,
  code,
  activeLine,
  state,
  output,
  stateLabel,
}: {
  title: string;
  code: string[];
  activeLine: number;
  state: Record<string, string>;
  output?: string;
  stateLabel: string;
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
          <div className="text-[10px] text-muted-foreground mb-1">{stateLabel}</div>
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
          ? "Step through the same task in imperative and declarative style side by side: keep the even numbers and double them."
          : "偶数を取り出して 2 倍する同じ処理を、命令型と宣言型で並べてステップ実行します。"
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
            stateLabel={isEn ? "State:" : "状態:"}
          />
          <CodePanel
            title={isEn ? "Declarative (What)" : "宣言型（What）"}
            code={declarativeCode}
            activeLine={current.declarative.line}
            state={current.declarative.state}
            output={current.declarative.output}
            stateLabel={isEn ? "State:" : "状態:"}
          />
        </div>

        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <StepPlayerControls {...player} label={getLabel} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
