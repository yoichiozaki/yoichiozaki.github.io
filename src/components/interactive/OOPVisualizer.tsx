"use client";

import { useCallback } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { useStepPlayer } from "./useStepPlayer";

type OOPStep = {
  objects: ObjectState[];
  message?: { from: string; to: string; label: string };
  description: string;
  descriptionEn: string;
};

type ObjectState = {
  name: string;
  class: string;
  fields: Record<string, string>;
  highlight?: boolean;
  color: string;
};

const steps: OOPStep[] = [
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
      },
    ],
    description: "基底クラス Animal を定義。name フィールドと speak メソッドを持つ。OOP の出発点は「抽象化」。",
    descriptionEn: "Define base class Animal with name field and speak method. OOP starts with 'abstraction'.",
  },
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
      },
      {
        name: "Dog",
        class: "extends Animal",
        fields: { name: "string", speak: '() → "Woof!"', fetch: "() → void" },
        color: "#3b82f6",
      },
      {
        name: "Cat",
        class: "extends Animal",
        fields: { name: "string", speak: '() → "Meow!"' },
        color: "#10b981",
      },
    ],
    description: "Dog と Cat が Animal を継承（Inheritance）。speak を各クラスでオーバーライド。共通のインターフェースで異なる振る舞い。",
    descriptionEn: "Dog and Cat inherit from Animal (Inheritance). Each overrides speak. Same interface, different behavior.",
  },
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
      },
      {
        name: "Dog",
        class: "extends Animal",
        fields: { name: '"Rex"', speak: '() → "Woof!"', fetch: "() → void" },
        color: "#3b82f6",
        highlight: true,
      },
      {
        name: "Cat",
        class: "extends Animal",
        fields: { name: '"Whiskers"', speak: '() → "Meow!"' },
        color: "#10b981",
      },
    ],
    description: "Dog のインスタンス rex を生成。クラスは設計図、インスタンスは実体。name フィールドはオブジェクト内に隠蔽（Encapsulation）。",
    descriptionEn: "Instantiate rex from Dog. Class is the blueprint, instance is the entity. name is hidden inside the object (Encapsulation).",
  },
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
      },
      {
        name: "Dog",
        class: "extends Animal",
        fields: { name: '"Rex"', speak: '() → "Woof!"', fetch: "() → void" },
        color: "#3b82f6",
        highlight: true,
      },
      {
        name: "Cat",
        class: "extends Animal",
        fields: { name: '"Whiskers"', speak: '() → "Meow!"' },
        color: "#10b981",
      },
    ],
    message: { from: "caller", to: "Dog", label: "rex.speak()" },
    description: "rex.speak() を呼び出す → メッセージパッシング。Smalltalk では「オブジェクトにメッセージを送る」と表現。実行時に Dog の speak が選択される。",
    descriptionEn: "Call rex.speak() → message passing. Smalltalk says 'send a message to the object'. Dog's speak is selected at runtime.",
  },
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
        highlight: true,
      },
      {
        name: "Dog",
        class: "extends Animal",
        fields: { name: '"Rex"', speak: '() → "Woof!"' },
        color: "#3b82f6",
      },
      {
        name: "Cat",
        class: "extends Animal",
        fields: { name: '"Whiskers"', speak: '() → "Meow!"' },
        color: "#10b981",
      },
    ],
    message: { from: "caller", to: "Animal", label: "animals.forEach(a => a.speak())" },
    description: "ポリモーフィズム（Polymorphism）: Animal 型の配列を走査。各要素は実行時の型に応じて適切な speak を実行。Liskov の置換原則。",
    descriptionEn: "Polymorphism: iterate an Animal array. Each element executes the correct speak based on runtime type. Liskov substitution principle.",
  },
  {
    objects: [
      {
        name: "Animal",
        class: "class",
        fields: { name: "string", speak: "() → string" },
        color: "#6b7280",
      },
      {
        name: "Dog",
        class: "extends Animal",
        fields: { speak: '→ "Woof!"' },
        color: "#3b82f6",
      },
      {
        name: "Cat",
        class: "extends Animal",
        fields: { speak: '→ "Meow!"' },
        color: "#10b981",
      },
    ],
    description: "OOP の三本柱: ① カプセル化（データ隠蔽）② 継承（コード再利用と is-a 関係）③ ポリモーフィズム（同じインターフェースで異なる振る舞い）。",
    descriptionEn: "Three pillars of OOP: ① Encapsulation (data hiding) ② Inheritance (code reuse & is-a) ③ Polymorphism (same interface, different behavior).",
  },
];

function ObjectBox({
  obj,
}: {
  obj: ObjectState;
}) {
  return (
    <div
      className={`rounded-lg border-2 p-3 min-w-[140px] transition-all duration-300 ${
        obj.highlight
          ? "border-accent bg-accent/10 scale-105"
          : "border-border bg-background"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: obj.color }}
        />
        <span className="font-semibold text-sm text-foreground">{obj.name}</span>
        <span className="text-[10px] text-muted-foreground">{obj.class}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        {Object.entries(obj.fields).map(([k, v]) => (
          <div key={k} className="text-[11px] font-mono">
            <span className="text-accent">{k}</span>
            <span className="text-muted-foreground">: </span>
            <span className="text-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type OOPVisualizerProps = { locale?: string };

export function OOPVisualizer({ locale = "ja" }: OOPVisualizerProps) {
  const isEn = locale === "en";

  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: 2500,
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
      title={isEn ? "OOP: Objects, Inheritance & Polymorphism" : "OOP: オブジェクト・継承・ポリモーフィズム"}
      description={
        isEn
          ? "Step through the three pillars of object-oriented programming."
          : "オブジェクト指向の三本柱をステップ実行で理解しましょう。"
      }
    >
      <div className="flex flex-col gap-4">
        {/* Objects */}
        <div className="flex flex-wrap gap-3 justify-center">
          {current.objects.map((obj) => (
            <ObjectBox key={obj.name} obj={obj} />
          ))}
        </div>

        {/* Inheritance arrows */}
        {current.objects.length > 1 && (
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            {current.objects
              .filter((o) => o.class.startsWith("extends"))
              .map((o) => (
                <span key={o.name} className="flex items-center gap-1">
                  {o.name}
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Animal
                </span>
              ))}
          </div>
        )}

        {/* Message */}
        {current.message && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-accent/20 text-accent font-mono text-xs">
              {current.message.label}
            </span>
            <svg className="h-4 w-4 text-accent animate-pulse" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-xs text-muted-foreground">{current.message.to}</span>
          </div>
        )}

        {/* Description */}
        <div className="rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
          {isEn ? current.descriptionEn : current.description}
        </div>

        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
