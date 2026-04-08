"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type TestRunnerVisualizerProps = { locale?: string };

type TestState = "pending" | "running" | "passed" | "failed";

interface Step {
  phase: string;
  phaseEn: string;
  description: string;
  descriptionEn: string;
  suites: SuiteState[];
  output: string[];
  outputEn: string[];
  highlight?: string;
}

interface SuiteState {
  name: string;
  tests: { name: string; nameEn: string; state: TestState; hook?: string }[];
}

const steps: Step[] = [
  // Phase 1: Discovery
  {
    phase: "テストディスカバリ",
    phaseEn: "Test Discovery",
    description: "glob パターンでテストファイルを探索中...",
    descriptionEn: "Scanning for test files using glob patterns...",
    suites: [],
    output: [
      '> rglob("test_*.py")',
      "  📁 test_math.py を発見",
      "  📁 test_string.py を発見",
    ],
    outputEn: [
      '> rglob("test_*.py")',
      "  📁 Found test_math.py",
      "  📁 Found test_string.py",
    ],
    highlight: "discovery",
  },
  // Phase 2: Collection
  {
    phase: "テスト収集",
    phaseEn: "Test Collection",
    description:
      "モジュールをインポートし、test_ 関数を inspect で収集中...",
    descriptionEn:
      "Importing modules and collecting test_ functions via inspect...",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "pending" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "pending",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "テストレジストリ構築:",
      '  Module "test_math" → 2 tests',
      '  Module "test_string" → 2 tests',
      "  合計: 2 modules, 4 tests",
    ],
    outputEn: [
      "Building test registry:",
      '  Module "test_math" → 2 tests',
      '  Module "test_string" → 2 tests',
      "  Total: 2 modules, 4 tests",
    ],
    highlight: "collection",
  },
  // Phase 3: setup_module hook
  {
    phase: "ライフサイクル",
    phaseEn: "Lifecycle",
    description: "Module 'test_math' の setup_module フックを実行中...",
    descriptionEn: "Running setup_module hook for module 'test_math'...",
    suites: [
      {
        name: "test_math",
        tests: [
          {
            name: "test_addition",
            nameEn: "test_addition",
            state: "pending",
            hook: "setup_module",
          },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "pending",
            hook: "setup_module",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "🔧 setup_module(): db = create_test_db()",
      "  → モジュールレベルの初期化を実行",
    ],
    outputEn: [
      "🔧 setup_module(): db = create_test_db()",
      "  → Running module-level setup",
    ],
    highlight: "lifecycle",
  },
  // Phase 4: setup_function + test 1 execution
  {
    phase: "テスト実行",
    phaseEn: "Test Execution",
    description: "setup_function → テスト 'test_addition' を実行中...",
    descriptionEn: "setup_function → Running test 'test_addition'...",
    suites: [
      {
        name: "test_math",
        tests: [
          {
            name: "test_addition",
            nameEn: "test_addition",
            state: "running",
            hook: "setup_function",
          },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "pending",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "🔧 setup_function(): counter = 0",
      "▶ def test_addition():",
      "      assert add(1, 1) == 2",
    ],
    outputEn: [
      "🔧 setup_function(): counter = 0",
      "▶ def test_addition():",
      "      assert add(1, 1) == 2",
    ],
    highlight: "execution",
  },
  // Phase 5: Assertion
  {
    phase: "アサーション",
    phaseEn: "Assertion",
    description:
      "assert 2 == 2 — actual と expected を比較。一致 → PASS",
    descriptionEn:
      "assert 2 == 2 — comparing actual vs expected. Match → PASS",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "pending",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "🔍 Assertion: assert 2 == 2",
      "  left:    2",
      "  right:   2",
      "  result:  ✅ PASS (0.3ms)",
    ],
    outputEn: [
      "🔍 Assertion: assert 2 == 2",
      "  left:    2",
      "  right:   2",
      "  result:  ✅ PASS (0.3ms)",
    ],
    highlight: "assertion",
  },
  // Phase 6: teardown_function + setup_function + test 2 (raises)
  {
    phase: "テスト実行",
    phaseEn: "Test Execution",
    description:
      "teardown_function → setup_function → テスト 'test_division_by_zero' を実行中...",
    descriptionEn:
      "teardown_function → setup_function → Running test 'test_division_by_zero'...",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "running",
            hook: "setup_function",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "🔧 teardown_function() → cleanup",
      "🔧 setup_function(): counter = 0",
      "▶ def test_division_by_zero():",
      "      with pytest.raises(ZeroDivisionError):",
      "          divide(1, 0)",
    ],
    outputEn: [
      "🔧 teardown_function() → cleanup",
      "🔧 setup_function(): counter = 0",
      "▶ def test_division_by_zero():",
      "      with pytest.raises(ZeroDivisionError):",
      "          divide(1, 0)",
    ],
    highlight: "execution",
  },
  // Phase 7: pytest.raises assertion
  {
    phase: "アサーション",
    phaseEn: "Assertion",
    description:
      "pytest.raises() — 関数を try-except で実行し、例外を検証",
    descriptionEn:
      "pytest.raises() — execute function in try-except and verify exception",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "passed",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "pending",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "🔍 Assertion: pytest.raises(ZeroDivisionError)",
      "  try: divide(1, 0)",
      "  except ZeroDivisionError: caught ✓",
      "  result: ✅ PASS (0.1ms)",
    ],
    outputEn: [
      "🔍 Assertion: pytest.raises(ZeroDivisionError)",
      "  try: divide(1, 0)",
      "  except ZeroDivisionError: caught ✓",
      "  result: ✅ PASS (0.1ms)",
    ],
    highlight: "assertion",
  },
  // Phase 8: Module 2, test 3 runs
  {
    phase: "テスト実行",
    phaseEn: "Test Execution",
    description: "Module 'test_string' → setup_function → テスト 'test_strip' を実行中...",
    descriptionEn: "Module 'test_string' → setup_function → Running test 'test_strip'...",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "passed",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "running",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "pending",
          },
        ],
      },
    ],
    output: [
      "▶ Module test_string に移行",
      "🔧 setup_function()",
      "▶ def test_strip():",
      '      assert "  hi  ".strip() == "hi"',
    ],
    outputEn: [
      "▶ Entering module test_string",
      "🔧 setup_function()",
      "▶ def test_strip():",
      '      assert "  hi  ".strip() == "hi"',
    ],
    highlight: "execution",
  },
  // Phase 9: Test 3 passes, test 4 fails
  {
    phase: "テスト実行",
    phaseEn: "Test Execution",
    description:
      "test_strip PASS → test_upper を実行... FAIL! AssertionError",
    descriptionEn:
      "test_strip PASS → Running test_upper... FAIL! AssertionError",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "passed",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "passed",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "failed",
          },
        ],
      },
    ],
    output: [
      "  ✅ test_strip: PASS (0.2ms)",
      "▶ def test_upper():",
      '      assert upper("hello") == "HELLO"',
      "  ❌ AssertionError:",
      "      assert 'Hello' == 'HELLO'",
    ],
    outputEn: [
      "  ✅ test_strip: PASS (0.2ms)",
      "▶ def test_upper():",
      '      assert upper("hello") == "HELLO"',
      "  ❌ AssertionError:",
      "      assert 'Hello' == 'HELLO'",
    ],
    highlight: "assertion",
  },
  // Phase 10: Reporter
  {
    phase: "レポート生成",
    phaseEn: "Report Generation",
    description: "すべてのテスト結果を集計し、レポートを出力",
    descriptionEn: "Aggregating all test results and generating report",
    suites: [
      {
        name: "test_math",
        tests: [
          { name: "test_addition", nameEn: "test_addition", state: "passed" },
          {
            name: "test_division_by_zero",
            nameEn: "test_division_by_zero",
            state: "passed",
          },
        ],
      },
      {
        name: "test_string",
        tests: [
          {
            name: "test_strip",
            nameEn: "test_strip",
            state: "passed",
          },
          {
            name: "test_upper",
            nameEn: "test_upper",
            state: "failed",
          },
        ],
      },
    ],
    output: [
      "━━━ Test Results ━━━",
      " ✅ test_math::test_addition          0.3ms",
      " ✅ test_math::test_division_by_zero  0.1ms",
      " ✅ test_string::test_strip           0.2ms",
      " ❌ test_string::test_upper  'Hello' != 'HELLO'",
      "",
      " Tests:  3 passed, 1 failed, 4 total",
      " Time:   12ms",
    ],
    outputEn: [
      "━━━ Test Results ━━━",
      " ✅ test_math::test_addition          0.3ms",
      " ✅ test_math::test_division_by_zero  0.1ms",
      " ✅ test_string::test_strip           0.2ms",
      " ❌ test_string::test_upper  'Hello' != 'HELLO'",
      "",
      " Tests:  3 passed, 1 failed, 4 total",
      " Time:   12ms",
    ],
    highlight: "reporter",
  },
];

const phaseColors: Record<string, string> = {
  discovery:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  collection:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  lifecycle:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  execution:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  assertion:
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  reporter:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const stateIcons: Record<TestState, string> = {
  pending: "○",
  running: "▶",
  passed: "✅",
  failed: "❌",
};

const stateColors: Record<TestState, string> = {
  pending: "text-muted-foreground",
  running: "text-amber-600 dark:text-amber-400",
  passed: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
};

export function TestRunnerVisualizer({
  locale = "ja",
}: TestRunnerVisualizerProps) {
  const isJa = locale === "ja";
  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: 2000,
  });
  const current = steps[player.step];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "テストランナーの内部動作"
          : "Test Runner Internals"
      }
      description={
        isJa
          ? "ステップ実行して、テストフレームワークが裏で何をしているか見てみましょう"
          : "Step through to see what a test framework does behind the scenes"
      }
    >
      <div className="space-y-4">
        {/* Phase badge */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${phaseColors[current.highlight ?? ""] ?? "bg-muted text-muted-foreground"}`}
          >
            {isJa ? current.phase : current.phaseEn}
          </span>
          <span className="text-sm text-muted-foreground">
            {isJa ? current.description : current.descriptionEn}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Test Suites */}
          <div className="rounded-lg border border-border bg-background p-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {isJa ? "テストレジストリ" : "Test Registry"}
            </h4>
            {current.suites.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">
                {isJa ? "（まだ空）" : "(empty)"}
              </div>
            ) : (
              <div className="space-y-3">
                {current.suites.map((suite) => (
                  <div key={suite.name}>
                    <div className="text-sm font-medium text-foreground mb-1">
                      📦 {suite.name}.py
                    </div>
                    <div className="ml-4 space-y-1">
                      {suite.tests.map((test) => (
                        <div
                          key={test.name}
                          className={`flex items-center gap-2 text-sm ${stateColors[test.state]} ${test.state === "running" ? "font-medium" : ""}`}
                        >
                          <span className="w-4 text-center">
                            {stateIcons[test.state]}
                          </span>
                          <span>{isJa ? test.name : test.nameEn}</span>
                          {test.hook && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              {test.hook}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Console output */}
          <div className="rounded-lg border border-border bg-neutral-950 dark:bg-neutral-900 p-4">
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              {isJa ? "内部ログ" : "Internal Log"}
            </h4>
            <div className="font-mono text-xs leading-relaxed space-y-0.5">
              {(isJa ? current.output : current.outputEn).map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes("✅")
                      ? "text-emerald-400"
                      : line.includes("❌")
                        ? "text-red-400"
                        : line.includes("🔧")
                          ? "text-amber-400"
                          : line.includes("▶")
                            ? "text-blue-400"
                            : "text-neutral-300"
                  }
                >
                  {line || "\u00A0"}
                </div>
              ))}
            </div>
          </div>
        </div>

        <StepPlayerControls
          {...player}
          label={(s) =>
            `${s + 1}/${steps.length} — ${isJa ? steps[s].phase : steps[s].phaseEn}`
          }
        />
      </div>
    </InteractiveDemo>
  );
}
