"use client";

import { useCallback } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
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
    description: "加算を行うカリー化されたラムダ式に引数 3 と 5 を適用します。λx は「x を受け取る関数」を意味します。",
    descriptionEn: "Apply arguments 3 and 5 to a curried lambda expression for addition. λx means 'a function that takes x'.",
  },
  {
    expression: "(λy. 3 + y) 5",
    rule: "β簡約 [x := 3]",
    ruleEn: "β-reduction [x := 3]",
    description: "最外のλxに 3 を代入（β簡約）。(λx. body) arg → body[x := arg]。関数適用の本質。",
    descriptionEn: "Substitute 3 for x (β-reduction). (λx. body) arg → body[x := arg]. The essence of function application.",
  },
  {
    expression: "3 + 5",
    rule: "β簡約 [y := 5]",
    ruleEn: "β-reduction [y := 5]",
    description: "残りのλyに 5 を代入。カリー化により、2引数関数が1引数関数の連鎖として表現されている。",
    descriptionEn: "Substitute 5 for y. Through currying, a 2-argument function is expressed as a chain of 1-argument functions.",
  },
  {
    expression: "8",
    rule: "δ簡約（算術）",
    ruleEn: "δ-reduction (arithmetic)",
    description: "組み込み演算を適用して最終値を得る。ラムダ計算ではすべての計算がこの「適用と簡約」に帰着する。",
    descriptionEn: "Apply built-in arithmetic to get the final value. In lambda calculus, all computation reduces to 'apply and reduce'.",
  },
];

const churchEncoding: ReductionStep[] = [
  {
    expression: "TRUE  = λx. λy. x",
    rule: "Church真理値",
    ruleEn: "Church Boolean",
    description: "TRUE は「2つの引数のうち最初を返す」関数。データを関数としてエンコードする Church エンコーディング。",
    descriptionEn: "TRUE is 'return the first of two arguments'. Church encoding represents data as functions.",
  },
  {
    expression: "FALSE = λx. λy. y",
    rule: "Church真理値",
    ruleEn: "Church Boolean",
    description: "FALSE は「2つの引数のうち2番目を返す」関数。TRUE と対を成す。",
    descriptionEn: "FALSE is 'return the second of two arguments'. The counterpart of TRUE.",
  },
  {
    expression: "AND = λp. λq. p q FALSE",
    rule: "論理AND",
    ruleEn: "Logical AND",
    description: "AND は p が TRUE なら q を、FALSE なら FALSE を返す。条件分岐が関数適用で実現されている！",
    descriptionEn: "AND: if p is TRUE return q, if FALSE return FALSE. Conditionals via function application!",
  },
  {
    expression: "AND TRUE FALSE",
    rule: "適用",
    ruleEn: "Application",
    description: "AND に TRUE と FALSE を渡す。",
    descriptionEn: "Apply TRUE and FALSE to AND.",
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
    description: "p に TRUE を、q に FALSE を代入。",
    descriptionEn: "Substitute TRUE for p, FALSE for q.",
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
    description: "TRUE は最初の引数 FALSE を返す。AND TRUE FALSE = FALSE。ブール論理が純粋な関数で実現された！",
    descriptionEn: "TRUE returns its first argument FALSE. AND TRUE FALSE = FALSE. Boolean logic from pure functions!",
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
          ? "Watch β-reduction in action, then see how Church encoding represents booleans as pure functions."
          : "β簡約の動作を見てから、Church エンコーディングでブール値が純粋な関数として表現される様子を確認しましょう。"
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
            {isEn ? "Church Encoding" : "Church エンコーディング"}
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

        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
