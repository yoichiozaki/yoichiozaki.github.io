"use client";

import { useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";

type ParadigmNode = {
  id: string;
  label: string;
  labelEn: string;
  color: string;
  description: string;
  descriptionEn: string;
  children?: ParadigmNode[];
};

const tree: ParadigmNode = {
  id: "root",
  label: "プログラミングパラダイム",
  labelEn: "Programming Paradigms",
  color: "#6b7280",
  description: "プログラムをどう構成し、問題をどう解くかについての基本的な考え方。",
  descriptionEn: "Basic approaches to structuring programs and solving problems.",
  children: [
    {
      id: "imperative",
      label: "命令型",
      labelEn: "Imperative",
      color: "#3b82f6",
      description:
        "「どのように（How）」計算するかを逐次的な命令で記述する。状態の変更を中心に構成される。チューリングマシンが理論的基盤。",
      descriptionEn:
        "Describes 'how' to compute via sequential instructions. Centered around state mutation. Theoretically grounded in Turing machines.",
      children: [
        {
          id: "procedural",
          label: "手続き型",
          labelEn: "Procedural",
          color: "#60a5fa",
          description:
            "プログラムを手続き（プロシージャ/関数）に分割して構造化。C, Pascal, FORTRAN が代表例。制御フロー（if/for/while）で処理を記述。",
          descriptionEn:
            "Structures programs into procedures/functions. Examples: C, Pascal, FORTRAN. Uses control flow (if/for/while).",
        },
        {
          id: "oop",
          label: "オブジェクト指向",
          labelEn: "Object-Oriented",
          color: "#10b981",
          description:
            "データと振る舞いをオブジェクトとしてカプセル化。継承・ポリモーフィズム・カプセル化が三本柱。Simula 系（C++, Java）と Smalltalk 系（Ruby, Objective-C）の 2 系統がある。",
          descriptionEn:
            "Encapsulates data and behavior into objects. Inheritance, polymorphism, and encapsulation are the three pillars. Two lineages: Simula (C++, Java) and Smalltalk (Ruby, Objective-C).",
        },
      ],
    },
    {
      id: "declarative",
      label: "宣言型",
      labelEn: "Declarative",
      color: "#8b5cf6",
      description:
        "「何を（What）」計算するかを記述し、具体的な手順は処理系に委ねる。副作用を最小化し、数学的な推論を可能にする。",
      descriptionEn:
        "Describes 'what' to compute, leaving the 'how' to the runtime. Minimizes side effects and enables mathematical reasoning.",
      children: [
        {
          id: "functional",
          label: "関数型",
          labelEn: "Functional",
          color: "#a78bfa",
          description:
            "純粋関数と不変データを中心に組み立てる。ラムダ計算が理論的基盤。参照透過性により並行処理を安全に書きやすい。Haskell, Erlang, Elixir が代表例。",
          descriptionEn:
            "Based on pure functions and immutable data. Lambda calculus is the theoretical foundation. Referential transparency makes concurrency safer. Examples: Haskell, Erlang, Elixir.",
        },
        {
          id: "logic",
          label: "論理型",
          labelEn: "Logic",
          color: "#f59e0b",
          description:
            "事実と規則を論理式で記述し、推論エンジンが解を探索。述語論理が基盤。Prolog, Datalog が代表例。",
          descriptionEn:
            "Defines facts and rules as logical formulas; an inference engine searches for solutions. Based on predicate logic. Examples: Prolog, Datalog.",
        },
        {
          id: "reactive",
          label: "リアクティブ",
          labelEn: "Reactive",
          color: "#06b6d4",
          description:
            "データストリームと変更の伝播に基づく。非同期データフローを宣言的に記述。RxJS, React, Elm が代表例。",
          descriptionEn:
            "Based on data streams and change propagation. Declaratively describes asynchronous data flows. Examples: RxJS, React, Elm.",
        },
      ],
    },
    {
      id: "concurrent",
      label: "並行指向",
      labelEn: "Concurrency-Oriented",
      color: "#ef4444",
      description:
        "並行処理を言語やランタイムのレベルで安全に扱う。命令型・宣言型の軸と直交する面を持つ。アクターモデル、CSP、データフロープログラミングなどが含まれる。",
      descriptionEn:
        "Makes concurrency safe at the language or runtime level, cutting across the imperative/declarative axis. Includes the actor model, CSP, and dataflow programming.",
      children: [
        {
          id: "actor",
          label: "アクターモデル",
          labelEn: "Actor Model",
          color: "#f87171",
          description:
            "アクター間のメッセージパッシングで並行処理を実現。各アクターは自分だけの状態を持ち、共有状態はない。Erlang/OTP, Akka が代表例。",
          descriptionEn:
            "Achieves concurrency via message passing between actors, each with its own private state. No shared state. Examples: Erlang/OTP, Akka.",
        },
        {
          id: "csp",
          label: "CSP",
          labelEn: "CSP",
          color: "#fb923c",
          description:
            "Communicating Sequential Processes。チャネルを介した同期通信で並行処理を構成。Go の goroutine + channel が代表例。",
          descriptionEn:
            "Communicating Sequential Processes. Processes communicate synchronously over channels. Example: Go's goroutines and channels.",
        },
      ],
    },
  ],
};

function TreeNode({
  node,
  depth,
  isEn,
  selected,
  onSelect,
}: {
  node: ParadigmNode;
  depth: number;
  isEn: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const isSelected = selected === node.id;
  return (
    <div className={depth > 0 ? "ml-4 sm:ml-6" : ""}>
      <button
        onClick={() => onSelect(node.id)}
        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left text-sm transition-all w-full ${
          isSelected
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border bg-background hover:border-accent/50"
        }`}
      >
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: node.color }}
        />
        <span className="font-semibold text-foreground">
          {isEn ? node.labelEn : node.label}
        </span>
      </button>
      {node.children && (
        <div className="ml-3 mt-1 flex flex-col gap-1 border-l-2 border-border/50 pl-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              isEn={isEn}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findNode(node: ParadigmNode, id: string): ParadigmNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

type ParadigmTaxonomyProps = { locale?: string };

export function ParadigmTaxonomy({ locale = "ja" }: ParadigmTaxonomyProps) {
  const isEn = locale === "en";
  const [selected, setSelected] = useState<string | null>("root");

  const selectedNode = selected ? findNode(tree, selected) : null;

  return (
    <InteractiveDemo
      title={isEn ? "Paradigm Taxonomy" : "パラダイム分類図"}
      description={
        isEn
          ? "Imperative and declarative form the two main branches; concurrency-oriented paradigms cut across that split, so they are grouped separately. Click a node to see its description."
          : "命令型と宣言型という軸で 2 系統に分け、この軸と直交する面を持つ並行指向は別枠にしています。各ノードをクリックすると説明が表示されます。"
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <TreeNode
            node={tree}
            depth={0}
            isEn={isEn}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {selectedNode && (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
            <span className="font-semibold" style={{ color: selectedNode.color }}>
              {isEn ? selectedNode.labelEn : selectedNode.label}
            </span>
            <span className="mx-2 text-muted-foreground">—</span>
            <span>{isEn ? selectedNode.descriptionEn : selectedNode.description}</span>
          </div>
        )}
      </div>
    </InteractiveDemo>
  );
}
