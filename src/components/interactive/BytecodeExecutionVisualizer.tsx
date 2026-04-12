"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type VMState = {
  ip: number; // instruction pointer (index into bytecode)
  stack: string[];
  locals: Record<string, string>;
  description: string;
  descriptionEn: string;
  highlight?: "ip" | "stack" | "locals";
};

type Instruction = {
  offset: number;
  opcode: string;
  operand?: string;
};

// ── Bytecode & Scenario ─────────────────────────────────────

const bytecodeInstructions: Instruction[] = [
  { offset: 0, opcode: "RESUME", operand: "0" },
  { offset: 1, opcode: "LOAD_CONST", operand: "0 (0)" },
  { offset: 2, opcode: "STORE_FAST", operand: "0 (total)" },
  { offset: 3, opcode: "LOAD_CONST", operand: "1 (1)" },
  { offset: 4, opcode: "STORE_FAST", operand: "1 (i)" },
  { offset: 5, opcode: "LOAD_FAST", operand: "0 (total)" },
  { offset: 6, opcode: "LOAD_FAST", operand: "1 (i)" },
  { offset: 7, opcode: "BINARY_OP", operand: "+=" },
  { offset: 8, opcode: "STORE_FAST", operand: "0 (total)" },
  { offset: 9, opcode: "LOAD_FAST", operand: "1 (i)" },
  { offset: 10, opcode: "LOAD_CONST", operand: "2 (1)" },
  { offset: 11, opcode: "BINARY_OP", operand: "+" },
  { offset: 12, opcode: "STORE_FAST", operand: "1 (i)" },
  { offset: 13, opcode: "LOAD_FAST", operand: "1 (i)" },
  { offset: 14, opcode: "LOAD_CONST", operand: "3 (3)" },
  { offset: 15, opcode: "COMPARE_OP", operand: "<" },
  { offset: 16, opcode: "POP_JUMP_IF_TRUE", operand: "5" },
  { offset: 17, opcode: "LOAD_FAST", operand: "0 (total)" },
  { offset: 18, opcode: "RETURN_VALUE" },
];

function buildScenario(): VMState[] {
  return [
    // Step 0: Start
    {
      ip: 0,
      stack: [],
      locals: {},
      description:
        "VM起動: RESUME 命令でフレームを初期化します。IP(命令ポインタ)はバイトコード先頭を指しています。",
      descriptionEn:
        "VM start: RESUME initializes the frame. The IP (instruction pointer) points to the beginning of bytecode.",
      highlight: "ip",
    },
    // Step 1: LOAD_CONST 0
    {
      ip: 1,
      stack: ["0"],
      locals: {},
      description:
        "LOAD_CONST 0: 定数テーブルからインデックス0の値「0」をスタックにプッシュします。",
      descriptionEn:
        "LOAD_CONST 0: Pushes value '0' from constant table index 0 onto the stack.",
      highlight: "stack",
    },
    // Step 2: STORE_FAST total
    {
      ip: 2,
      stack: [],
      locals: { total: "0" },
      description:
        "STORE_FAST 0 (total): スタックトップの値をポップし、ローカル変数スロット0 (total) に格納します。",
      descriptionEn:
        "STORE_FAST 0 (total): Pops stack top and stores it into local variable slot 0 (total).",
      highlight: "locals",
    },
    // Step 3: LOAD_CONST 1
    {
      ip: 3,
      stack: ["1"],
      locals: { total: "0" },
      description:
        "LOAD_CONST 1: 定数「1」をスタックにプッシュします（ループカウンタの初期値）。",
      descriptionEn:
        "LOAD_CONST 1: Pushes constant '1' onto the stack (loop counter initial value).",
      highlight: "stack",
    },
    // Step 4: STORE_FAST i
    {
      ip: 4,
      stack: [],
      locals: { total: "0", i: "1" },
      description:
        "STORE_FAST 1 (i): スタックから値をポップし、ローカル変数 i に格納します。i=1 でループ開始。",
      descriptionEn:
        "STORE_FAST 1 (i): Pops value from stack and stores into local variable i. Loop starts with i=1.",
      highlight: "locals",
    },
    // ── Loop iteration 1 (i=1) ──────────────────
    // Step 5: LOAD_FAST total
    {
      ip: 5,
      stack: ["0"],
      locals: { total: "0", i: "1" },
      description:
        "【ループ1回目 i=1】LOAD_FAST 0 (total): ローカル変数 total の値「0」をスタックにプッシュ。",
      descriptionEn:
        "[Loop iter 1, i=1] LOAD_FAST 0 (total): Pushes local variable total (0) onto stack.",
      highlight: "stack",
    },
    // Step 6: LOAD_FAST i
    {
      ip: 6,
      stack: ["0", "1"],
      locals: { total: "0", i: "1" },
      description:
        "LOAD_FAST 1 (i): ローカル変数 i の値「1」をスタックにプッシュ。スタックに [0, 1] の2値が積まれました。",
      descriptionEn:
        "LOAD_FAST 1 (i): Pushes local variable i (1) onto stack. Stack now holds [0, 1].",
      highlight: "stack",
    },
    // Step 7: BINARY_OP +=
    {
      ip: 7,
      stack: ["1"],
      locals: { total: "0", i: "1" },
      description:
        "BINARY_OP +=: スタックから 2 値をポップ (0, 1)、加算して結果「1」をプッシュ。0 + 1 = 1。",
      descriptionEn:
        "BINARY_OP +=: Pops 2 values (0, 1), adds them, pushes result '1'. 0 + 1 = 1.",
      highlight: "stack",
    },
    // Step 8: STORE_FAST total
    {
      ip: 8,
      stack: [],
      locals: { total: "1", i: "1" },
      description:
        "STORE_FAST 0 (total): 結果「1」をスタックからポップし、total を更新。total = 1 になりました。",
      descriptionEn:
        "STORE_FAST 0 (total): Pops result '1' and updates total. total = 1.",
      highlight: "locals",
    },
    // Step 9: LOAD_FAST i (for increment)
    {
      ip: 9,
      stack: ["1"],
      locals: { total: "1", i: "1" },
      description:
        "LOAD_FAST 1 (i): i の現在値「1」をスタックにプッシュ。これからインクリメントします。",
      descriptionEn:
        "LOAD_FAST 1 (i): Pushes current i value (1) onto stack. About to increment.",
      highlight: "stack",
    },
    // Step 10: LOAD_CONST 1
    {
      ip: 10,
      stack: ["1", "1"],
      locals: { total: "1", i: "1" },
      description:
        "LOAD_CONST 2 (1): 加算用の定数「1」をプッシュ。",
      descriptionEn:
        "LOAD_CONST 2 (1): Pushes constant '1' for the increment.",
      highlight: "stack",
    },
    // Step 11: BINARY_OP +
    {
      ip: 11,
      stack: ["2"],
      locals: { total: "1", i: "1" },
      description:
        "BINARY_OP +: 1 + 1 = 2。i の新しい値がスタックトップにあります。",
      descriptionEn:
        "BINARY_OP +: 1 + 1 = 2. The new value for i is at stack top.",
      highlight: "stack",
    },
    // Step 12: STORE_FAST i
    {
      ip: 12,
      stack: [],
      locals: { total: "1", i: "2" },
      description:
        "STORE_FAST 1 (i): i = 2 に更新。ループの継続判定に進みます。",
      descriptionEn:
        "STORE_FAST 1 (i): Updated i = 2. Proceeding to loop condition check.",
      highlight: "locals",
    },
    // Step 13: LOAD_FAST i (for compare)
    {
      ip: 13,
      stack: ["2"],
      locals: { total: "1", i: "2" },
      description:
        "LOAD_FAST 1 (i): 比較のため i=2 をプッシュ。",
      descriptionEn:
        "LOAD_FAST 1 (i): Pushes i=2 for comparison.",
      highlight: "stack",
    },
    // Step 14: LOAD_CONST 3
    {
      ip: 14,
      stack: ["2", "3"],
      locals: { total: "1", i: "2" },
      description:
        "LOAD_CONST 3 (3): 比較対象の上限値「3」をプッシュ。",
      descriptionEn:
        "LOAD_CONST 3 (3): Pushes upper bound '3' for comparison.",
      highlight: "stack",
    },
    // Step 15: COMPARE_OP <
    {
      ip: 15,
      stack: ["True"],
      locals: { total: "1", i: "2" },
      description:
        "COMPARE_OP <: 2 < 3 → True。ループ継続条件が成立しました。",
      descriptionEn:
        "COMPARE_OP <: 2 < 3 → True. Loop condition is met.",
      highlight: "stack",
    },
    // Step 16: POP_JUMP_IF_TRUE → loop back
    {
      ip: 5,
      stack: [],
      locals: { total: "1", i: "2" },
      description:
        "POP_JUMP_IF_TRUE 5: True なのでオフセット 5（ループ先頭）にジャンプ！IP が巻き戻ります。",
      descriptionEn:
        "POP_JUMP_IF_TRUE 5: True, so jump to offset 5 (loop start)! IP rewinds.",
      highlight: "ip",
    },
    // ── Loop iteration 2 (i=2) ──────────────────
    // Step 17: LOAD_FAST total
    {
      ip: 5,
      stack: ["1"],
      locals: { total: "1", i: "2" },
      description:
        "【ループ2回目 i=2】LOAD_FAST 0 (total): total=1 をプッシュ。",
      descriptionEn:
        "[Loop iter 2, i=2] LOAD_FAST 0 (total): Pushes total=1.",
      highlight: "stack",
    },
    // Step 18: LOAD_FAST i
    {
      ip: 6,
      stack: ["1", "2"],
      locals: { total: "1", i: "2" },
      description:
        "LOAD_FAST 1 (i): i=2 をプッシュ。スタックに [1, 2] が積まれました。",
      descriptionEn:
        "LOAD_FAST 1 (i): Pushes i=2. Stack now holds [1, 2].",
      highlight: "stack",
    },
    // Step 19: BINARY_OP +=
    {
      ip: 7,
      stack: ["3"],
      locals: { total: "1", i: "2" },
      description:
        "BINARY_OP +=: 1 + 2 = 3。結果をスタックにプッシュ。",
      descriptionEn:
        "BINARY_OP +=: 1 + 2 = 3. Result pushed onto stack.",
      highlight: "stack",
    },
    // Step 20: STORE_FAST total
    {
      ip: 8,
      stack: [],
      locals: { total: "3", i: "2" },
      description:
        "STORE_FAST 0 (total): total = 3 に更新。1 + 2 の累積が完了。",
      descriptionEn:
        "STORE_FAST 0 (total): Updates total = 3. Accumulation of 1 + 2 complete.",
      highlight: "locals",
    },
    // Step 21: i++ → i=3
    {
      ip: 12,
      stack: [],
      locals: { total: "3", i: "3" },
      description:
        "i のインクリメント処理（LOAD_FAST → LOAD_CONST → BINARY_OP → STORE_FAST）。i = 2 + 1 = 3 に。",
      descriptionEn:
        "Increment i (LOAD_FAST → LOAD_CONST → BINARY_OP → STORE_FAST). i = 2 + 1 = 3.",
      highlight: "locals",
    },
    // Step 22: COMPARE_OP
    {
      ip: 15,
      stack: ["False"],
      locals: { total: "3", i: "3" },
      description:
        "COMPARE_OP <: 3 < 3 → False。ループ終了条件に到達しました！",
      descriptionEn:
        "COMPARE_OP <: 3 < 3 → False. Loop termination condition reached!",
      highlight: "stack",
    },
    // Step 23: POP_JUMP_IF_TRUE → falls through
    {
      ip: 17,
      stack: [],
      locals: { total: "3", i: "3" },
      description:
        "POP_JUMP_IF_TRUE: False なのでジャンプせずフォールスルー。ループを抜けます。",
      descriptionEn:
        "POP_JUMP_IF_TRUE: False, so no jump — falls through. Exiting the loop.",
      highlight: "ip",
    },
    // Step 24: LOAD_FAST total
    {
      ip: 17,
      stack: ["3"],
      locals: { total: "3", i: "3" },
      description:
        "LOAD_FAST 0 (total): 返却値として total=3 をスタックにプッシュ。",
      descriptionEn:
        "LOAD_FAST 0 (total): Pushes total=3 as the return value.",
      highlight: "stack",
    },
    // Step 25: RETURN_VALUE
    {
      ip: 18,
      stack: [],
      locals: { total: "3", i: "3" },
      description:
        "RETURN_VALUE: スタックトップの値「3」を呼び出し元に返します。関数の実行が完了しました！ total = 1 + 2 = 3。",
      descriptionEn:
        "RETURN_VALUE: Returns stack top value '3' to the caller. Function execution complete! total = 1 + 2 = 3.",
      highlight: "ip",
    },
  ];
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function BytecodeExecutionVisualizer({ locale = "ja" }: Props) {
  const scenario = buildScenario();
  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 900,
  });
  const current = scenario[player.step];
  const isJa = locale === "ja";

  const labelFn = (step: number) =>
    isJa ? scenario[step].description : scenario[step].descriptionEn;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "バイトコード実行シミュレータ"
          : "Bytecode Execution Simulator"
      }
      description={
        isJa
          ? "total = 0; i = 1 から始めて total += i; i += 1 を i < 3 の間繰り返す関数のバイトコード実行を1命令ずつ追いかけます。"
          : "Step through bytecode execution of a function that starts with total=0, i=1 and repeats total += i; i += 1 while i < 3."
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        {/* Bytecode listing */}
        <div className="overflow-x-auto">
          <div className="font-mono text-xs sm:text-sm space-y-0.5">
            {bytecodeInstructions.map((inst) => {
              const isActive = inst.offset === current.ip;
              return (
                <div
                  key={inst.offset}
                  className={`flex items-center gap-2 px-2 py-0.5 rounded transition-colors ${
                    isActive
                      ? "bg-blue-500/20 dark:bg-blue-400/20 font-bold text-blue-700 dark:text-blue-300"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="w-5 text-right opacity-50">
                    {inst.offset}
                  </span>
                  <span
                    className={`${
                      isActive ? "text-blue-600 dark:text-blue-300" : ""
                    }`}
                  >
                    →
                  </span>
                  <span className="font-semibold">{inst.opcode}</span>
                  {inst.operand && (
                    <span className="opacity-70">{inst.operand}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stack & Locals panel */}
        <div className="flex flex-col gap-3 min-w-[180px]">
          {/* Operand Stack */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {isJa ? "オペランドスタック" : "Operand Stack"}
            </div>
            <div
              className={`border rounded-lg p-2 min-h-[80px] transition-colors ${
                current.highlight === "stack"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border"
              }`}
            >
              {current.stack.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  {isJa ? "(空)" : "(empty)"}
                </div>
              ) : (
                <div className="flex flex-col-reverse gap-1">
                  {current.stack.map((val, i) => (
                    <div
                      key={i}
                      className={`px-3 py-1 rounded text-center text-sm font-mono font-bold ${
                        i === current.stack.length - 1
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {val}
                      {i === current.stack.length - 1 && (
                        <span className="text-[10px] ml-1 opacity-60">
                          ← TOS
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Local Variables */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {isJa ? "ローカル変数" : "Local Variables"}
            </div>
            <div
              className={`border rounded-lg p-2 min-h-[60px] transition-colors ${
                current.highlight === "locals"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border"
              }`}
            >
              {Object.keys(current.locals).length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  {isJa ? "(なし)" : "(none)"}
                </div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(current.locals).map(([name, val]) => (
                    <div
                      key={name}
                      className="flex justify-between text-sm font-mono"
                    >
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* IP indicator */}
          <div
            className={`border rounded-lg p-2 text-center transition-colors ${
              current.highlight === "ip"
                ? "border-blue-500 bg-blue-500/10"
                : "border-border"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              IP
            </div>
            <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
              {current.ip}
            </div>
          </div>
        </div>
      </div>

      <StepPlayerControls {...player} label={labelFn} />
    </InteractiveDemo>
  );
}
