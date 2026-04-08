"use client";

import { useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";

type Paradigm = {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  coreIdea: string;
  coreIdeaEn: string;
  stateModel: string;
  stateModelEn: string;
  controlFlow: string;
  controlFlowEn: string;
  composition: string;
  compositionEn: string;
  strengths: string;
  strengthsEn: string;
  weaknesses: string;
  weaknessesEn: string;
  languages: string;
};

const paradigms: Paradigm[] = [
  {
    id: "procedural",
    name: "手続き型",
    nameEn: "Procedural",
    color: "#3b82f6",
    coreIdea: "逐次的な命令の列で状態を変更",
    coreIdeaEn: "Sequential instructions that mutate state",
    stateModel: "ミュータブルな共有状態",
    stateModelEn: "Mutable shared state",
    controlFlow: "if/for/while + 関数呼び出し",
    controlFlowEn: "if/for/while + function calls",
    composition: "プロシージャ（関数）の呼び出し",
    compositionEn: "Procedure (function) calls",
    strengths: "直感的・ハードウェアに近い・高速",
    strengthsEn: "Intuitive, close to hardware, fast",
    weaknesses: "状態管理が複雑化・並行処理が困難",
    weaknessesEn: "Complex state management, hard concurrency",
    languages: "C, Pascal, FORTRAN, BASIC",
  },
  {
    id: "oop",
    name: "オブジェクト指向",
    nameEn: "Object-Oriented",
    color: "#10b981",
    coreIdea: "データと振る舞いをオブジェクトにカプセル化",
    coreIdeaEn: "Encapsulate data and behavior into objects",
    stateModel: "オブジェクト内にカプセル化された状態",
    stateModelEn: "State encapsulated within objects",
    controlFlow: "メッセージパッシング + メソッド呼び出し",
    controlFlowEn: "Message passing + method dispatch",
    composition: "継承・コンポジション・委譲",
    compositionEn: "Inheritance, composition, delegation",
    strengths: "現実世界のモデル化・再利用性・設計パターン",
    strengthsEn: "Real-world modeling, reusability, design patterns",
    weaknesses: "深い継承階層・過剰設計のリスク",
    weaknessesEn: "Deep hierarchies, over-engineering risk",
    languages: "Java, C#, Python, Ruby, Smalltalk",
  },
  {
    id: "functional",
    name: "関数型",
    nameEn: "Functional",
    color: "#8b5cf6",
    coreIdea: "純粋関数と不変データによる変換",
    coreIdeaEn: "Transformations via pure functions and immutable data",
    stateModel: "不変（Immutable）— 新しい値を生成",
    stateModelEn: "Immutable — produce new values",
    controlFlow: "再帰 + パターンマッチング + 高階関数",
    controlFlowEn: "Recursion + pattern matching + higher-order functions",
    composition: "関数合成（f ∘ g）",
    compositionEn: "Function composition (f ∘ g)",
    strengths: "テスト容易・並行安全・数学的推論",
    strengthsEn: "Easy testing, concurrency-safe, mathematical reasoning",
    weaknesses: "学習曲線・パフォーマンスの予測が困難",
    weaknessesEn: "Learning curve, harder performance prediction",
    languages: "Haskell, Erlang, Elixir, OCaml, F#",
  },
  {
    id: "logic",
    name: "論理型",
    nameEn: "Logic",
    color: "#f59e0b",
    coreIdea: "事実とルールから推論エンジンが解を探索",
    coreIdeaEn: "Inference engine searches for solutions from facts and rules",
    stateModel: "知識ベース（事実の集合）",
    stateModelEn: "Knowledge base (set of facts)",
    controlFlow: "ユニフィケーション + バックトラッキング",
    controlFlowEn: "Unification + backtracking",
    composition: "ルールの連鎖",
    compositionEn: "Rule chaining",
    strengths: "宣言的な問題記述・探索問題に強い",
    strengthsEn: "Declarative problem description, strong at search problems",
    weaknesses: "汎用用途には非効率・デバッグが困難",
    weaknessesEn: "Inefficient for general-purpose, hard debugging",
    languages: "Prolog, Datalog, Mercury",
  },
  {
    id: "reactive",
    name: "リアクティブ",
    nameEn: "Reactive",
    color: "#06b6d4",
    coreIdea: "データストリームと変更の自動伝播",
    coreIdeaEn: "Data streams and automatic change propagation",
    stateModel: "Observable なストリーム",
    stateModelEn: "Observable streams",
    controlFlow: "演算子チェーン（map/filter/merge）",
    controlFlowEn: "Operator chains (map/filter/merge)",
    composition: "ストリームの合成",
    compositionEn: "Stream composition",
    strengths: "非同期処理・UI・リアルタイムデータ",
    strengthsEn: "Async processing, UI, real-time data",
    weaknesses: "デバッグが困難・学習コスト",
    weaknessesEn: "Hard debugging, learning cost",
    languages: "RxJS, Elm, React (部分的)",
  },
];

const fields = [
  { key: "coreIdea", label: "核となるアイデア", labelEn: "Core Idea" },
  { key: "stateModel", label: "状態モデル", labelEn: "State Model" },
  { key: "controlFlow", label: "制御フロー", labelEn: "Control Flow" },
  { key: "composition", label: "合成の仕方", labelEn: "Composition" },
  { key: "strengths", label: "強み", labelEn: "Strengths" },
  { key: "weaknesses", label: "弱み", labelEn: "Weaknesses" },
  { key: "languages", label: "代表的な言語", labelEn: "Languages" },
] as const;

type ParadigmComparisonProps = { locale?: string };

export function ParadigmComparison({ locale = "ja" }: ParadigmComparisonProps) {
  const isEn = locale === "en";
  const [selected, setSelected] = useState<string[]>(["procedural", "functional"]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((s) => s !== id)
          : prev
        : prev.length < 3
          ? [...prev, id]
          : prev,
    );
  };

  const selectedParadigms = paradigms.filter((p) => selected.includes(p.id));

  return (
    <InteractiveDemo
      title={isEn ? "Paradigm Comparison" : "パラダイム比較表"}
      description={
        isEn
          ? "Select 1–3 paradigms to compare side by side."
          : "1〜3 つのパラダイムを選んで比較しましょう。"
      }
    >
      <div className="flex flex-col gap-4">
        {/* Paradigm selector */}
        <div className="flex flex-wrap gap-2">
          {paradigms.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={isSelected ? { backgroundColor: p.color } : undefined}
              >
                {isEn ? p.nameEn : p.name}
              </button>
            );
          })}
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left p-2 text-muted-foreground font-medium w-28" />
                {selectedParadigms.map((p) => (
                  <th key={p.id} className="p-2 text-left">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-semibold text-foreground">
                        {isEn ? p.nameEn : p.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.key} className="border-t border-border">
                  <td className="p-2 text-muted-foreground font-medium align-top whitespace-nowrap">
                    {isEn ? field.labelEn : field.label}
                  </td>
                  {selectedParadigms.map((p) => (
                    <td key={p.id} className="p-2 text-foreground align-top">
                      {isEn
                        ? p[`${field.key}En` as keyof Paradigm] ?? p[field.key as keyof Paradigm]
                        : p[field.key as keyof Paradigm]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InteractiveDemo>
  );
}
