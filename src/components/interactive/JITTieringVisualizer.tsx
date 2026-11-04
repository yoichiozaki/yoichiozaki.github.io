"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
  interpreter: { ja: "インタプリター", en: "Interpreter" },
  baseline: { ja: "ベースライン JIT", en: "Baseline JIT" },
  optimized: { ja: "最適化 JIT", en: "Optimizing JIT" },
  deopt: { ja: "脱最適化", en: "Deoptimized" },
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
        "プログラム開始: すべての関数はインタプリターで実行されます。プロファイル情報の収集が始まります。",
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
      events: ["呼び出し回数をカウント中..."],
      eventsEn: ["Counting calls..."],
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
        "helper(): 500回呼び出し → しきい値に到達",
        "→ ベースライン JIT でコンパイル",
      ],
      eventsEn: [
        "helper(): 500 calls → threshold reached",
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
        "helper(): 十分なプロファイル情報を蓄積",
        "→ 最適化 JIT でコンパイル",
        "  ・型特殊化: int 想定",
        "  ・インライン展開: helper() 内の呼び出しを展開",
        "  ・ガード命令を挿入",
      ],
      eventsEn: [
        "helper(): sufficient profile data accumulated",
        "→ Compiled with optimizing JIT",
        "  - Type specialization: assuming int",
        "  - Inlining: inline calls within helper()",
        "  - Guard instructions inserted",
      ],
      description:
        "helper() が十分なプロファイル情報を蓄積し、最適化 JIT でコンパイルされます。型特殊化（int 前提）、インライン展開、ガード命令の挿入が行われます。",
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
        "format() はコールドなままインタプリターで実行",
        "★ ホットな関数は最適化済みネイティブコードで実行中",
      ],
      eventsEn: [
        "calculate() also promoted to optimizing JIT",
        "format() remains cold, stays in interpreter",
        "★ Hot functions run as optimized native code",
      ],
      description:
        "定常状態: ホットな関数（calculate, helper）は最適化済みネイティブコードで高速実行。コールドな format() はインタプリターのまま（コンパイルコスト不要）。",
      descriptionEn:
        "Steady state: Hot functions (calculate, helper) run quickly as optimized native code. Cold format() stays in the interpreter (no compilation cost).",
    },
    // Step 6: DEOPT!
    {
      functions: [
        { name: "calculate()", callCount: 5001, tier: "optimized", color: TIER_COLORS.optimized },
        { name: "helper()", callCount: 20001, tier: "deopt", color: TIER_COLORS.deopt },
        { name: "format()", callCount: 50, tier: "interpreter", color: TIER_COLORS.interpreter },
      ],
      events: [
        "helper(\"string\") ← string が渡された",
        "→ ガード命令が失敗 (型チェック: int ではない)",
        "→ 脱最適化 (deoptimization) が発生",
        "→ インタプリターのフレームを再構築して制御を戻す",
      ],
      eventsEn: [
        "helper(\"string\") ← string was passed",
        "→ Guard instruction failed (type check: not int)",
        "→ Deoptimization triggered",
        "→ Reconstruct interpreter frame, resume in interpreter",
      ],
      description:
        "予期しない型（string）で helper() が呼ばれました。ガード命令が失敗して脱最適化が発生し、ネイティブコードを破棄してインタプリターに戻ります。",
      descriptionEn:
        "helper() is called with an unexpected type (string). The guard instruction fails and deoptimization occurs: the native code is discarded and execution falls back to the interpreter.",
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
        "helper(): 新しいプロファイル情報で再コンパイル",
        "→ 型特殊化: int | string（多形）",
        "→ 再び最適化 JIT で実行",
        "★ 観測した型に合わせて再最適化",
      ],
      eventsEn: [
        "helper(): recompiled with new profile data",
        "→ Type specialization: int | string (polymorphic)",
        "→ Running in optimizing JIT again",
        "★ Reoptimized for the observed types",
      ],
      description:
        "helper() が更新されたプロファイル情報で再コンパイルされます。今度は int と string の両方に対応する多形（polymorphic）の最適化コードが生成されます。",
      descriptionEn:
        "helper() is recompiled with the updated profile, this time into polymorphic optimized code that handles both int and string.",
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
          ? "3つの関数のうち、呼び出し回数が増えたものがインタプリター → ベースライン JIT → 最適化 JIT へ昇格し、その1つが脱最適化と再コンパイルを経る様子を示します。しきい値と回数は説明用の値です。"
          : "Step through 3 functions: those called often move from interpreter → baseline JIT → optimizing JIT, and one is then deoptimized and recompiled. Thresholds and counts are illustrative."
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

      <StepPlayerControls {...player} label={labelFn} ariaLabels={stepPlayerAriaLabels(locale)} />
    </InteractiveDemo>
  );
}
