"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type MachineState = {
  stackInstructions: string[];
  stackStack: string[];
  stackHighlight: number; // which instruction is active (-1 = none)
  regInstructions: string[];
  regRegisters: Record<string, string>;
  regHighlight: number;
  description: string;
  descriptionEn: string;
};

// ── Scenario: computing a + b * c  (a=2, b=3, c=4) ─────────

function buildScenario(): MachineState[] {
  const sInst = [
    "LOAD a",
    "LOAD b",
    "LOAD c",
    "MUL",
    "ADD",
    "STORE result",
  ];
  const rInst = [
    "MUL R1, b, c",
    "ADD R0, a, R1",
    "MOV result, R0",
  ];

  return [
    // Step 0: Initial
    {
      stackInstructions: sInst,
      stackStack: [],
      stackHighlight: -1,
      regInstructions: rInst,
      regRegisters: { a: "2", b: "3", c: "4", R0: "-", R1: "-" },
      regHighlight: -1,
      description:
        "初期状態: a=2, b=3, c=4 として a + b * c を計算します。左がスタックマシン、右がレジスタマシンです。",
      descriptionEn:
        "Initial: Computing a + b * c where a=2, b=3, c=4. Left is a stack machine, right is a register machine.",
    },
    // Step 1: Stack: LOAD a / Reg: MUL R1, b, c
    {
      stackInstructions: sInst,
      stackStack: ["2"],
      stackHighlight: 0,
      regInstructions: rInst,
      regRegisters: { a: "2", b: "3", c: "4", R0: "-", R1: "12" },
      regHighlight: 0,
      description:
        "スタック: LOAD a → a(2)をプッシュ。レジスタ: MUL R1, b, c → R1 = 3 × 4 = 12。レジスタマシンは1命令で乗算完了！",
      descriptionEn:
        "Stack: LOAD a → push a(2). Register: MUL R1, b, c → R1 = 3 × 4 = 12. Register machine completes multiply in 1 instruction!",
    },
    // Step 2: Stack: LOAD b / Reg: ADD R0, a, R1
    {
      stackInstructions: sInst,
      stackStack: ["2", "3"],
      stackHighlight: 1,
      regInstructions: rInst,
      regRegisters: { a: "2", b: "3", c: "4", R0: "14", R1: "12" },
      regHighlight: 1,
      description:
        "スタック: LOAD b → b(3)をプッシュ。レジスタ: ADD R0, a, R1 → R0 = 2 + 12 = 14。レジスタマシンはもう計算完了です。",
      descriptionEn:
        "Stack: LOAD b → push b(3). Register: ADD R0, a, R1 → R0 = 2 + 12 = 14. Register machine has already finished computation.",
    },
    // Step 3: Stack: LOAD c / Reg: MOV result
    {
      stackInstructions: sInst,
      stackStack: ["2", "3", "4"],
      stackHighlight: 2,
      regInstructions: rInst,
      regRegisters: {
        a: "2",
        b: "3",
        c: "4",
        R0: "14",
        R1: "12",
        result: "14",
      },
      regHighlight: 2,
      description:
        "スタック: LOAD c → c(4)をプッシュ（まだ計算していない）。レジスタ: MOV result, R0 → 結果を格納。3命令で完了！",
      descriptionEn:
        "Stack: LOAD c → push c(4) (hasn't computed yet). Register: MOV result, R0 → store result. Done in 3 instructions!",
    },
    // Step 4: Stack: MUL
    {
      stackInstructions: sInst,
      stackStack: ["2", "12"],
      stackHighlight: 3,
      regInstructions: rInst,
      regRegisters: {
        a: "2",
        b: "3",
        c: "4",
        R0: "14",
        R1: "12",
        result: "14",
      },
      regHighlight: -1,
      description:
        "スタック: MUL → 3 × 4 = 12 をプッシュ。レジスタマシンは既に完了しています（待機中）。",
      descriptionEn:
        "Stack: MUL → 3 × 4 = 12 pushed. Register machine already done (idle).",
    },
    // Step 5: Stack: ADD
    {
      stackInstructions: sInst,
      stackStack: ["14"],
      stackHighlight: 4,
      regInstructions: rInst,
      regRegisters: {
        a: "2",
        b: "3",
        c: "4",
        R0: "14",
        R1: "12",
        result: "14",
      },
      regHighlight: -1,
      description:
        "スタック: ADD → 2 + 12 = 14 をプッシュ。ようやく計算結果が出ました。",
      descriptionEn:
        "Stack: ADD → 2 + 12 = 14 pushed. Finally got the computation result.",
    },
    // Step 6: Stack: STORE result
    {
      stackInstructions: sInst,
      stackStack: [],
      stackHighlight: 5,
      regInstructions: rInst,
      regRegisters: {
        a: "2",
        b: "3",
        c: "4",
        R0: "14",
        R1: "12",
        result: "14",
      },
      regHighlight: -1,
      description:
        "スタック: STORE result → 結果を格納。6命令で完了。レジスタマシンは3命令でした。命令ディスパッチ回数が半分に！",
      descriptionEn:
        "Stack: STORE result → store result. Done in 6 instructions. Register machine took only 3. Dispatch count halved!",
    },
  ];
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function StackVsRegisterComparison({ locale = "ja" }: Props) {
  const scenario = buildScenario();
  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 1200,
  });
  const current = scenario[player.step];
  const isJa = locale === "ja";

  const labelFn = (step: number) =>
    isJa ? scenario[step].description : scenario[step].descriptionEn;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "スタックマシン vs レジスタマシン"
          : "Stack Machine vs Register Machine"
      }
      description={
        isJa
          ? "a + b × c を計算する過程を、スタックマシンとレジスタマシンで同時に実行比較します。"
          : "Compare stack and register machine execution side by side, computing a + b × c."
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stack Machine */}
        <div className="border rounded-lg p-3">
          <div className="text-sm font-bold mb-2 text-blue-600 dark:text-blue-400">
            {isJa ? "スタックマシン" : "Stack Machine"}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ({current.stackInstructions.length}{" "}
              {isJa ? "命令" : "instructions"})
            </span>
          </div>
          {/* Instructions */}
          <div className="font-mono text-xs space-y-0.5 mb-3">
            {current.stackInstructions.map((inst, i) => (
              <div
                key={i}
                className={`px-2 py-0.5 rounded transition-colors ${
                  i === current.stackHighlight
                    ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold"
                    : i < current.stackHighlight
                      ? "text-muted-foreground/50 line-through"
                      : "text-muted-foreground"
                }`}
              >
                {inst}
              </div>
            ))}
          </div>
          {/* Stack */}
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Stack
          </div>
          <div className="border rounded p-2 min-h-[60px] bg-blue-500/5">
            {current.stackStack.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                {isJa ? "(空)" : "(empty)"}
              </div>
            ) : (
              <div className="flex flex-col-reverse gap-1">
                {current.stackStack.map((val, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1 rounded text-center text-sm font-mono font-bold ${
                      i === current.stackStack.length - 1
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                        : "bg-muted"
                    }`}
                  >
                    {val}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Register Machine */}
        <div className="border rounded-lg p-3">
          <div className="text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">
            {isJa ? "レジスタマシン" : "Register Machine"}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              ({current.regInstructions.length}{" "}
              {isJa ? "命令" : "instructions"})
            </span>
          </div>
          {/* Instructions */}
          <div className="font-mono text-xs space-y-0.5 mb-3">
            {current.regInstructions.map((inst, i) => (
              <div
                key={i}
                className={`px-2 py-0.5 rounded transition-colors ${
                  i === current.regHighlight
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                    : i < current.regHighlight ||
                        (current.regHighlight === -1 && player.step > 3)
                      ? "text-muted-foreground/50 line-through"
                      : "text-muted-foreground"
                }`}
              >
                {inst}
              </div>
            ))}
          </div>
          {/* Registers */}
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Registers
          </div>
          <div className="border rounded p-2 min-h-[60px] bg-emerald-500/5">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(current.regRegisters).map(([name, val]) => (
                <div
                  key={name}
                  className="flex justify-between text-sm font-mono"
                >
                  <span className="text-muted-foreground">{name}</span>
                  <span
                    className={`font-bold ${
                      val !== "-"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StepPlayerControls {...player} label={labelFn} />
    </InteractiveDemo>
  );
}
