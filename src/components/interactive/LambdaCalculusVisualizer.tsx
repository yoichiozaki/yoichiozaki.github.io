"use client";

import { useCallback } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { stepPlayerAriaLabels } from "./stepPlayerAriaLabels";
import { useStepPlayer } from "./useStepPlayer";

type ReductionStep = {
  expression: string;
  rule: string;
  ruleEn: string;
  description: string;
  descriptionEn: string;
  highlight?: [number, number]; // start, end index in expression to highlight
};

const betaReduction: ReductionStep[] = [
  {
    expression: "(λx. λy. x + y) 3 5",
    rule: "初期式",
    ruleEn: "Initial",
    description: "x + y を返すカリー化されたラムダ式を、引数 3 と 5 に適用する。λx は「x を受け取る関数」を表す。",
    descriptionEn: "Apply a curried lambda expression that returns x + y to the arguments 3 and 5. λx means 'a function that takes x'.",
  },
  {
    expression: "(λy. 3 + y) 5",
    rule: "β簡約 [x := 3]",
    ruleEn: "β-reduction [x := 3]",
    description: "最も外側の λx に 3 を渡し、本体の x を 3 に置き換える（β簡約）。一般形は (λx. body) arg → body[x := arg]。",
    descriptionEn: "Pass 3 to the outermost λx and replace x with 3 in its body (β-reduction). In general, (λx. body) arg → body[x := arg].",
  },
  {
    expression: "3 + 5",
    rule: "β簡約 [y := 5]",
    ruleEn: "β-reduction [y := 5]",
    description: "残りの λy の本体で y を 5 に置き換える。カリー化により、2 引数の関数を 1 引数の関数の連鎖として表している。",
    descriptionEn: "Replace y with 5 in the body of the remaining λy. Currying expresses a two-argument function as a chain of one-argument functions.",
  },
  {
    expression: "8",
    rule: "δ簡約（算術）",
    ruleEn: "δ-reduction (arithmetic)",
    description: "組み込みの加算を適用して最終値 8 を得る。純粋なラムダ計算には組み込みの演算がなく、数も Church エンコーディングで関数として表せる。",
    descriptionEn: "Apply the built-in addition to get the final value 8. Pure lambda calculus has no built-in arithmetic; numbers, too, can be represented as functions with Church encoding.",
  },
];

const churchEncoding: ReductionStep[] = [
  {
    expression: "TRUE  = λx. λy. x",
    rule: "Church ブール値",
    ruleEn: "Church Boolean",
    description: "TRUE は 2 つの引数のうち最初の引数を返す関数。Church エンコーディングでは、このようにデータを関数として表す。",
    descriptionEn: "TRUE is the function that returns the first of its two arguments. Church encoding represents data as functions in this way.",
  },
  {
    expression: "FALSE = λx. λy. y",
    rule: "Church ブール値",
    ruleEn: "Church Boolean",
    description: "FALSE は 2 つの引数のうち 2 番目の引数を返す関数。",
    descriptionEn: "FALSE is the function that returns the second of its two arguments.",
  },
  {
    expression: "AND = λp. λq. p q FALSE",
    rule: "論理 AND",
    ruleEn: "Logical AND",
    description: "p は TRUE か FALSE なので、p q FALSE は p が TRUE なら q を、FALSE なら FALSE を返す。条件分岐を関数適用だけで表している。",
    descriptionEn: "Since p is TRUE or FALSE, p q FALSE returns q when p is TRUE and FALSE when p is FALSE: a conditional built from function application alone.",
  },
  {
    expression: "AND TRUE FALSE",
    rule: "適用",
    ruleEn: "Application",
    description: "AND に TRUE と FALSE を渡す。",
    descriptionEn: "Apply AND to TRUE and FALSE.",
  },
  {
    expression: "(λp. λq. p q FALSE) TRUE FALSE",
    rule: "展開",
    ruleEn: "Expand",
    description: "AND の定義を展開。",
    descriptionEn: "Expand the definition of AND.",
  },
  {
    expression: "TRUE FALSE FALSE",
    rule: "β簡約 [p:=TRUE, q:=FALSE]",
    ruleEn: "β-reduction [p:=TRUE, q:=FALSE]",
    description: "本体の p を TRUE に、q を FALSE に置き換える。",
    descriptionEn: "Replace p with TRUE and q with FALSE in the body.",
  },
  {
    expression: "(λx. λy. x) FALSE FALSE",
    rule: "TRUE を展開",
    ruleEn: "Expand TRUE",
    description: "TRUE の定義 λx.λy.x を展開。「最初の引数を返す」関数。",
    descriptionEn: "Expand TRUE's definition λx.λy.x — 'return the first argument'.",
  },
  {
    expression: "FALSE",
    rule: "β簡約 → 結果",
    ruleEn: "β-reduction → Result",
    description: "TRUE は最初の引数 FALSE を返す。AND TRUE FALSE = FALSE。ブール演算を関数適用だけで計算できた。",
    descriptionEn: "TRUE returns its first argument, FALSE. AND TRUE FALSE = FALSE: boolean logic computed by function application alone.",
  },
];

function ExpressionDisplay({ expression, step }: { expression: string; step: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-background border border-border px-6 py-4 font-mono text-lg sm:text-xl text-foreground min-h-[60px] transition-all">
      <span className="transition-all duration-300" key={step}>
        {expression}
      </span>
    </div>
  );
}

type LambdaCalculusVisualizerProps = { locale?: string };

export function LambdaCalculusVisualizer({ locale = "ja" }: LambdaCalculusVisualizerProps) {
  const isEn = locale === "en";

  const allSteps = [...betaReduction, ...churchEncoding];

  const player = useStepPlayer({
    totalSteps: allSteps.length,
    intervalMs: 2000,
  });

  const current = allSteps[player.step];
  const isBetaSection = player.step < betaReduction.length;

  const getLabel = useCallback(
    (step: number) => {
      const s = allSteps[step];
      return isEn ? s.ruleEn : s.rule;
    },
    [allSteps, isEn],
  );

  return (
    <InteractiveDemo
      title={isEn ? "Lambda Calculus Step-by-Step" : "ラムダ計算ステップ実行"}
      description={
        isEn
          ? "The first part rewrites an expression one β-reduction at a time; the second uses Church encoding to represent booleans and AND as functions and reduces AND TRUE FALSE."
          : "前半は β簡約で式を 1 ステップずつ書き換え、後半は Church エンコーディングでブール値と AND を関数として表し、AND TRUE FALSE を簡約します。"
      }
    >
      <div className="flex flex-col gap-4">
        {/* Section label */}
        <div className="flex gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isBetaSection
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isEn ? "β-reduction" : "β簡約"}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              !isBetaSection
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isEn ? "Church encoding" : "Church エンコーディング"}
          </span>
        </div>

        {/* Expression */}
        <ExpressionDisplay expression={current.expression} step={player.step} />

        {/* Rule badge */}
        <div className="flex items-center justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent font-mono">
            {isEn ? current.ruleEn : current.rule}
          </span>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <StepPlayerControls {...player} label={getLabel} ariaLabels={stepPlayerAriaLabels(locale)} />
      </div>
    </InteractiveDemo>
  );
}
