"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type Tier = "interpreter" | "baseline" | "optimized" | "deopt";

type FunctionState = {
  name: string;
  callCount: number;
  tier: Tier;
  color: string;
};

type JITState = {
  functions: FunctionState[];
  events: string[];
  eventsEn: string[];
  description: string;
  descriptionEn: string;
  highlight?: string;
};

// ── Tier colors ─────────────────────────────────────────────

const TIER_COLORS: Record<Tier, string> = {
  interpreter: "#6b7280", // gray
  baseline: "#3b82f6", // blue
  optimized: "#10b981", // emerald
  deopt: "#ef4444", // red
};

const TIER_LABELS: Record<Tier, { ja: string; en: string }> = {
  interpreter: { ja: "インタプリタ", en: "Interpreter" },
  baseline: { ja: "ベースライン JIT", en: "Baseline JIT" },
  optimized: { ja: "最適化 JIT", en: "Optimizing JIT" },
  deopt: { ja: "脱最適化!", en: "Deoptimized!" },
};

// ── Scenario ────────────────────────────────────────────────

function buildScenario(): JITState[] {
  return [
    // Step 0
    {
      functions: [
        { name: "calculate()", callCount: 0, tier: "interpreter", color: TIER_COLORS.interpreter },
        { name: "helper()", callCount: 0, tier: "interpreter", color: TIER_COLORS.interpreter },
        { name: "format()", callCount: 0, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [],
      eventsEn: [],
      description:
        "プログラム開始: すべての関数はインタプリタで実行されます。プロファイリングデータの収集が始まります。",
      descriptionEn:
        "Program start: All functions execute in the interpreter. Profiling data collection begins.",
    },
    // Step 1
    {
      functions: [
        { name: "calculate()", callCount: 50, tier: "interpreter", color: TIER_COLORS.interpreter },
        { name: "helper()", callCount: 200, tier: "interpreter", color: TIER_COLORS.interpreter },
        { name: "format()", callCount: 5, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: ["呼び出しカウンタを蓄積中..."],
      eventsEn: ["Accumulating call counters..."],
      description:
        "実行開始直後: 各関数の呼び出し回数がカウントされています。helper() が最も頻繁に呼ばれています。",
      descriptionEn:
        "Early execution: Call counts accumulate for each function. helper() is called most frequently.",
    },
    // Step 2
    {
      functions: [
        { name: "calculate()", callCount: 100, tier: "interpreter", color: TIER_COLORS.interpreter },
        { name: "helper()", callCount: 500, tier: "baseline", color: TIER_COLORS.baseline },
        { name: "format()", callCount: 10, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "helper(): 500回呼び出し → しきい値到達!",
        "→ ベースライン JIT でコンパイル",
      ],
      eventsEn: [
        "helper(): 500 calls → threshold reached!",
        "→ Compiled with baseline JIT",
      ],
      description:
        "helper() が 500 回呼び出されてしきい値に到達。ベースライン JIT（素早い非最適化コンパイル）でネイティブコードに変換されます。",
      descriptionEn:
        "helper() reaches 500 calls — threshold hit. Baseline JIT (fast non-optimizing compile) converts it to native code.",
      highlight: "helper()",
    },
    // Step 3
    {
      functions: [
        { name: "calculate()", callCount: 500, tier: "baseline", color: TIER_COLORS.baseline },
        { name: "helper()", callCount: 2000, tier: "baseline", color: TIER_COLORS.baseline },
        { name: "format()", callCount: 20, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "calculate(): 500回 → ベースライン JIT",
        "helper(): 型プロファイル収集中 (int, int, int...)",
      ],
      eventsEn: [
        "calculate(): 500 calls → baseline JIT",
        "helper(): collecting type profile (int, int, int...)",
      ],
      description:
        "calculate() もしきい値に到達しベースライン JIT へ。helper() ではプロファイリングにより型情報が蓄積されています（常に int 引数）。",
      descriptionEn:
        "calculate() also reaches threshold → baseline JIT. helper() accumulates type profile data (always int arguments).",
      highlight: "calculate()",
    },
    // Step 4
    {
      functions: [
        { name: "calculate()", callCount: 1000, tier: "baseline", color: TIER_COLORS.baseline },
        { name: "helper()", callCount: 5000, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "format()", callCount: 30, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "helper(): 十分なプロファイルデータ蓄積",
        "→ 最適化 JIT でコンパイル!",
        "  ・型特殊化: int 想定",
        "  ・インライン展開: calculate() 内の呼び出しをインライン化",
        "  ・ガード命令を挿入",
      ],
      eventsEn: [
        "helper(): sufficient profile data accumulated",
        "→ Compiled with optimizing JIT!",
        "  - Type specialization: assuming int",
        "  - Inlining: inline calls within calculate()",
        "  - Guard instructions inserted",
      ],
      description:
        "helper() が十分なプロファイルデータを蓄積し、最適化 JIT でコンパイルされます。型特殊化（int 前提）、インライン展開、ガード命令の挿入が行われます。",
      descriptionEn:
        "helper() has enough profile data — compiled by optimizing JIT. Type specialization (assuming int), inlining, and guard instruction insertion are performed.",
      highlight: "helper()",
    },
    // Step 5
    {
      functions: [
        { name: "calculate()", callCount: 5000, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "helper()", callCount: 20000, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "format()", callCount: 50, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "calculate() も最適化 JIT へ昇格",
        "format() はコールドなままインタプリタで実行",
        "★ ホットコードはネイティブ速度で動作中!",
      ],
      eventsEn: [
        "calculate() also promoted to optimizing JIT",
        "format() remains cold, stays in interpreter",
        "★ Hot code running at native speed!",
      ],
      description:
        "定常状態: ホットな関数（calculate, helper）は最適化済みネイティブコードで高速実行。コールドな format() はインタプリタのまま（コンパイルコスト不要）。",
      descriptionEn:
        "Steady state: Hot functions (calculate, helper) run as optimized native code at full speed. Cold format() stays in interpreter (no compilation cost).",
    },
    // Step 6: DEOPT!
    {
      functions: [
        { name: "calculate()", callCount: 5001, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "helper()", callCount: 20001, tier: "deopt", color: TIER_COLORS.deopt },
        { name: "format()", callCount: 50, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "helper(\"string\") ← string が渡された!",
        "→ ガード命令が失敗 (型チェック: int ではない!)",
        "→ 脱最適化 (deoptimization) 発生!",
        "→ インタプリタに戻ってフレームを再構築",
      ],
      eventsEn: [
        "helper(\"string\") ← string was passed!",
        "→ Guard instruction failed (type check: not int!)",
        "→ Deoptimization triggered!",
        "→ Fall back to interpreter, reconstruct frame",
      ],
      description:
        "予期しない型（string）で helper() が呼ばれました！ガード命令が失敗し、脱最適化が発生。ネイティブコードを破棄してインタプリタに戻ります。",
      descriptionEn:
        "helper() called with unexpected type (string)! Guard instruction fails, deoptimization occurs. Native code discarded, falls back to interpreter.",
      highlight: "helper()",
    },
    // Step 7: Recompile
    {
      functions: [
        { name: "calculate()", callCount: 6000, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "helper()", callCount: 25000, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "format()", callCount: 50, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "helper(): 新しいプロファイルデータで再コンパイル",
        "→ 型特殊化: int | string（多相版）",
        "→ 再び最適化 JIT で実行",
        "★ VM は学習し適応する!",
      ],
      eventsEn: [
        "helper(): recompiled with new profile data",
        "→ Type specialization: int | string (polymorphic)",
        "→ Running in optimizing JIT again",
        "★ The VM learns and adapts!",
      ],
      description:
        "helper() が更新されたプロファイルで再コンパイル。今度は int と string の両方に対応する多相版の最適化コードが生成されます。VM は経験から学習します。",
      descriptionEn:
        "helper() recompiled with updated profile. Now generates polymorphic optimized code handling both int and string. The VM learns from experience.",
      highlight: "helper()",
    },
  ];
}

// ── Component ───────────────────────────────────────────────

type Props = { locale?: string };

export function JITTieringVisualizer({ locale = "ja" }: Props) {
  const scenario = buildScenario();
  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 1500,
  });
  const current = scenario[player.step];
  const isJa = locale === "ja";

  const labelFn = (step: number) =>
    isJa ? scenario[step].description : scenario[step].descriptionEn;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "多段階 JIT コンパイルの動作"
          : "Multi-Tier JIT Compilation in Action"
      }
      description={
        isJa
          ? "3つの関数が実行されるにつれて、インタプリタ → ベースライン JIT → 最適化 JIT へ昇格していく過程を追いかけます。脱最適化と再コンパイルも体験できます。"
          : "Watch 3 functions progress from interpreter → baseline JIT → optimizing JIT as they execute. Experience deoptimization and recompilation."
      }
    >
      {/* Tier legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(Object.entries(TIER_LABELS) as [Tier, { ja: string; en: string }][]).map(
          ([tier, labels]) => (
            <div key={tier} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: TIER_COLORS[tier] }}
              />
              <span>{isJa ? labels.ja : labels.en}</span>
            </div>
          )
        )}
      </div>

      {/* Function cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {current.functions.map((fn) => {
          const isHighlighted = current.highlight === fn.name;
          return (
            <div
              key={fn.name}
              className={`border rounded-lg p-3 transition-all ${
                isHighlighted
                  ? "ring-2 ring-offset-1 ring-offset-background"
                  : ""
              }`}
              style={{
                borderColor: fn.color,
                ...(isHighlighted ? { boxShadow: `0 0 12px ${fn.color}40` } : {}),
              }}
            >
              <div className="font-mono text-sm font-bold mb-1">{fn.name}</div>
              {/* Tier badge */}
              <div
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold text-white mb-2"
                style={{ backgroundColor: fn.color }}
              >
                {isJa
                  ? TIER_LABELS[fn.tier].ja
                  : TIER_LABELS[fn.tier].en}
              </div>
              {/* Call count */}
              <div className="text-xs text-muted-foreground">
                {isJa ? "呼び出し回数" : "Call count"}:{" "}
                <span className="font-mono font-bold text-foreground">
                  {fn.callCount.toLocaleString()}
                </span>
              </div>
              {/* Tier progress bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: fn.color,
                    width:
                      fn.tier === "interpreter"
                        ? "15%"
                        : fn.tier === "baseline"
                          ? "50%"
                          : fn.tier === "optimized"
                            ? "100%"
                            : "25%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Event log */}
      {(isJa ? current.events : current.eventsEn).length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30 mb-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {isJa ? "イベントログ" : "Event Log"}
          </div>
          <div className="font-mono text-xs space-y-0.5">
            {(isJa ? current.events : current.eventsEn).map((evt, i) => (
              <div
                key={i}
                className={`${
                  evt.startsWith("→") || evt.startsWith("  ")
                    ? "text-muted-foreground pl-3"
                    : evt.startsWith("★")
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-foreground"
                }`}
              >
                {evt}
              </div>
            ))}
          </div>
        </div>
      )}

      <StepPlayerControls {...player} label={labelFn} />
    </InteractiveDemo>
  );
}
