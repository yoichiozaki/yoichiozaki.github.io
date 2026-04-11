"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type KV = { key: string; value: string | number };

type MapReduceState = {
  phase: "input" | "split" | "map" | "shuffle" | "reduce" | "output";
  inputDocs: { id: number; text: string; active: boolean }[];
  splits: { id: number; lines: string[]; active: boolean }[];
  mapOutputs: { mapperId: number; pairs: KV[]; active: boolean }[];
  shuffled: { key: string; values: number[]; active: boolean }[];
  reduceOutputs: KV[];
  description: string;
  descriptionEn: string;
};

// ── Colors ───────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  input: "#6366f1",    // indigo
  split: "#8b5cf6",    // violet
  map: "#3b82f6",      // blue
  shuffle: "#f59e0b",  // amber
  reduce: "#10b981",   // emerald
  output: "#06b6d4",   // cyan
};

const MAPPER_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899"];

// ── Scenario ─────────────────────────────────────────────────

function buildScenario(): MapReduceState[] {
  return [
    // Step 0: Input documents
    {
      phase: "input",
      inputDocs: [
        { id: 1, text: "hello world hello", active: true },
        { id: 2, text: "world foo bar", active: true },
        { id: 3, text: "hello foo hello", active: true },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [],
      reduceOutputs: [],
      description:
        "入力データ: 3つのドキュメントがあります。これらのドキュメントに含まれる各単語の出現回数を数える（Word Count）のが今回のタスクです。",
      descriptionEn:
        "Input data: We have 3 documents. Our task is to count the occurrences of each word across all documents (Word Count).",
    },
    // Step 1: Split
    {
      phase: "split",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [
        { id: 1, lines: ["hello world hello"], active: true },
        { id: 2, lines: ["world foo bar"], active: true },
        { id: 3, lines: ["hello foo hello"], active: true },
      ],
      mapOutputs: [],
      shuffled: [],
      reduceOutputs: [],
      description:
        "Split フェーズ: 入力データが InputSplit に分割され、各 Mapper に割り当てられます。GFS/HDFS では 64MB (または 128MB) のブロック単位で分割されます。ここでは各ドキュメントが 1 つの Split になります。",
      descriptionEn:
        "Split phase: Input data is divided into InputSplits and assigned to each Mapper. In GFS/HDFS, data is split into 64MB (or 128MB) blocks. Here each document becomes one split.",
    },
    // Step 2: Map — Mapper 1 processes
    {
      phase: "map",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [
        { id: 1, lines: ["hello world hello"], active: true },
        { id: 2, lines: ["world foo bar"], active: false },
        { id: 3, lines: ["hello foo hello"], active: false },
      ],
      mapOutputs: [
        {
          mapperId: 1,
          pairs: [
            { key: "hello", value: 1 },
            { key: "world", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: true,
        },
      ],
      shuffled: [],
      reduceOutputs: [],
      description:
        "Map フェーズ (1/3): Mapper 1 が Split 1 を処理します。map(key, value) 関数が各単語に対して (word, 1) のペアを出力します。「hello world hello」→ (hello,1), (world,1), (hello,1)",
      descriptionEn:
        'Map phase (1/3): Mapper 1 processes Split 1. The map(key, value) function emits (word, 1) for each word. "hello world hello" → (hello,1), (world,1), (hello,1)',
    },
    // Step 3: Map — Mapper 2 processes
    {
      phase: "map",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [
        { id: 1, lines: ["hello world hello"], active: false },
        { id: 2, lines: ["world foo bar"], active: true },
        { id: 3, lines: ["hello foo hello"], active: false },
      ],
      mapOutputs: [
        {
          mapperId: 1,
          pairs: [
            { key: "hello", value: 1 },
            { key: "world", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: false,
        },
        {
          mapperId: 2,
          pairs: [
            { key: "world", value: 1 },
            { key: "foo", value: 1 },
            { key: "bar", value: 1 },
          ],
          active: true,
        },
      ],
      shuffled: [],
      reduceOutputs: [],
      description:
        "Map フェーズ (2/3): Mapper 2 が Split 2 を処理。「world foo bar」→ (world,1), (foo,1), (bar,1)。各 Mapper は独立・並列に実行されます。",
      descriptionEn:
        'Map phase (2/3): Mapper 2 processes Split 2. "world foo bar" → (world,1), (foo,1), (bar,1). Each Mapper runs independently in parallel.',
    },
    // Step 4: Map — Mapper 3 processes
    {
      phase: "map",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [
        { id: 1, lines: ["hello world hello"], active: false },
        { id: 2, lines: ["world foo bar"], active: false },
        { id: 3, lines: ["hello foo hello"], active: true },
      ],
      mapOutputs: [
        {
          mapperId: 1,
          pairs: [
            { key: "hello", value: 1 },
            { key: "world", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: false,
        },
        {
          mapperId: 2,
          pairs: [
            { key: "world", value: 1 },
            { key: "foo", value: 1 },
            { key: "bar", value: 1 },
          ],
          active: false,
        },
        {
          mapperId: 3,
          pairs: [
            { key: "hello", value: 1 },
            { key: "foo", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: true,
        },
      ],
      shuffled: [],
      reduceOutputs: [],
      description:
        "Map フェーズ (3/3): Mapper 3 が Split 3 を処理。「hello foo hello」→ (hello,1), (foo,1), (hello,1)。全 Mapper の処理が完了しました。",
      descriptionEn:
        'Map phase (3/3): Mapper 3 processes Split 3. "hello foo hello" → (hello,1), (foo,1), (hello,1). All Mappers have finished processing.',
    },
    // Step 5: Shuffle & Sort — grouping by key
    {
      phase: "shuffle",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [
        {
          mapperId: 1,
          pairs: [
            { key: "hello", value: 1 },
            { key: "world", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: true,
        },
        {
          mapperId: 2,
          pairs: [
            { key: "world", value: 1 },
            { key: "foo", value: 1 },
            { key: "bar", value: 1 },
          ],
          active: true,
        },
        {
          mapperId: 3,
          pairs: [
            { key: "hello", value: 1 },
            { key: "foo", value: 1 },
            { key: "hello", value: 1 },
          ],
          active: true,
        },
      ],
      shuffled: [
        { key: "bar", values: [1], active: true },
        { key: "foo", values: [1, 1], active: true },
        { key: "hello", values: [1, 1, 1, 1], active: true },
        { key: "world", values: [1, 1], active: true },
      ],
      reduceOutputs: [],
      description:
        "Shuffle & Sort フェーズ: フレームワークが全 Mapper の出力をキーでソートし、同じキーの値をグループ化します。これがMapReduceの「隠れた心臓部」です。ネットワーク越しにデータが転送され（この通信量がボトルネックになりやすい）、Reducer に届けられます。",
      descriptionEn:
        'Shuffle & Sort phase: The framework sorts all Mapper outputs by key and groups values with the same key. This is the "hidden heart" of MapReduce. Data is transferred over the network (this transfer volume often becomes a bottleneck) and delivered to Reducers.',
    },
    // Step 6: Reduce — bar
    {
      phase: "reduce",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [
        { key: "bar", values: [1], active: true },
        { key: "foo", values: [1, 1], active: false },
        { key: "hello", values: [1, 1, 1, 1], active: false },
        { key: "world", values: [1, 1], active: false },
      ],
      reduceOutputs: [{ key: "bar", value: 1 }],
      description:
        'Reduce フェーズ (1/4): reduce("bar", [1]) を実行。値のリストを合計して bar → 1。Reducer は各キーについて集約関数を適用します。',
      descriptionEn:
        'Reduce phase (1/4): Execute reduce("bar", [1]). Sum the list of values: bar → 1. The Reducer applies an aggregation function for each key.',
    },
    // Step 7: Reduce — foo
    {
      phase: "reduce",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [
        { key: "bar", values: [1], active: false },
        { key: "foo", values: [1, 1], active: true },
        { key: "hello", values: [1, 1, 1, 1], active: false },
        { key: "world", values: [1, 1], active: false },
      ],
      reduceOutputs: [
        { key: "bar", value: 1 },
        { key: "foo", value: 2 },
      ],
      description:
        'Reduce フェーズ (2/4): reduce("foo", [1, 1]) → foo = 1 + 1 = 2。同じキーの全ての値が 1 つの Reducer に集約されます。',
      descriptionEn:
        'Reduce phase (2/4): reduce("foo", [1, 1]) → foo = 1 + 1 = 2. All values for the same key are aggregated by a single Reducer.',
    },
    // Step 8: Reduce — hello
    {
      phase: "reduce",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [
        { key: "bar", values: [1], active: false },
        { key: "foo", values: [1, 1], active: false },
        { key: "hello", values: [1, 1, 1, 1], active: true },
        { key: "world", values: [1, 1], active: false },
      ],
      reduceOutputs: [
        { key: "bar", value: 1 },
        { key: "foo", value: 2 },
        { key: "hello", value: 4 },
      ],
      description:
        'Reduce フェーズ (3/4): reduce("hello", [1, 1, 1, 1]) → hello = 4。3つの Mapper にまたがっていた "hello" が 1 つの結果に集約されました。',
      descriptionEn:
        'Reduce phase (3/4): reduce("hello", [1, 1, 1, 1]) → hello = 4. The word "hello" scattered across 3 Mappers is aggregated into a single result.',
    },
    // Step 9: Reduce — world
    {
      phase: "reduce",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [
        { key: "bar", values: [1], active: false },
        { key: "foo", values: [1, 1], active: false },
        { key: "hello", values: [1, 1, 1, 1], active: false },
        { key: "world", values: [1, 1], active: true },
      ],
      reduceOutputs: [
        { key: "bar", value: 1 },
        { key: "foo", value: 2 },
        { key: "hello", value: 4 },
        { key: "world", value: 2 },
      ],
      description:
        'Reduce フェーズ (4/4): reduce("world", [1, 1]) → world = 2。全てのキーの Reduce が完了しました。',
      descriptionEn:
        'Reduce phase (4/4): reduce("world", [1, 1]) → world = 2. Reduce is complete for all keys.',
    },
    // Step 10: Final output
    {
      phase: "output",
      inputDocs: [
        { id: 1, text: "hello world hello", active: false },
        { id: 2, text: "world foo bar", active: false },
        { id: 3, text: "hello foo hello", active: false },
      ],
      splits: [],
      mapOutputs: [],
      shuffled: [],
      reduceOutputs: [
        { key: "bar", value: 1 },
        { key: "foo", value: 2 },
        { key: "hello", value: 4 },
        { key: "world", value: 2 },
      ],
      description:
        "完了: 最終結果が分散ファイルシステム (GFS/HDFS) に書き出されます。bar=1, foo=2, hello=4, world=2。プログラマが書いたのは map() と reduce() の 2 つの関数だけ — 分散処理・障害復旧・データ転送はすべてフレームワークが担当しました。",
      descriptionEn:
        "Done: Final results are written to the distributed file system (GFS/HDFS). bar=1, foo=2, hello=4, world=2. The programmer only wrote two functions — map() and reduce() — the framework handled all distribution, fault recovery, and data transfer.",
    },
  ];
}

// ── Component ────────────────────────────────────────────────

type MapReduceVisualizerProps = { locale?: string };

export function MapReduceVisualizer({
  locale = "ja",
}: MapReduceVisualizerProps) {
  const scenario = buildScenario();
  const player = useStepPlayer({
    totalSteps: scenario.length,
    intervalMs: 1800,
  });
  const state = scenario[player.step];
  const isJa = locale === "ja";

  const phaseLabel = useCallback(
    (step: number) => {
      const s = scenario[step];
      const labels: Record<string, string> = isJa
        ? {
            input: "入力",
            split: "分割",
            map: "Map",
            shuffle: "Shuffle & Sort",
            reduce: "Reduce",
            output: "出力",
          }
        : {
            input: "Input",
            split: "Split",
            map: "Map",
            shuffle: "Shuffle & Sort",
            reduce: "Reduce",
            output: "Output",
          };
      return labels[s.phase] ?? s.phase;
    },
    [scenario, isJa],
  );

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce 実行フロー" : "MapReduce Execution Flow"}
      description={
        isJa
          ? "Word Count の例で MapReduce の各フェーズを追体験します"
          : "Walk through each MapReduce phase using a Word Count example"
      }
    >
      {/* Phase indicator */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(
          ["input", "split", "map", "shuffle", "reduce", "output"] as const
        ).map((p) => (
          <span
            key={p}
            className="text-xs font-mono px-2 py-0.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor:
                state.phase === p ? PHASE_COLORS[p] : "transparent",
              color: state.phase === p ? "#fff" : "var(--color-muted-foreground)",
              border: `1px solid ${state.phase === p ? PHASE_COLORS[p] : "var(--color-border)"}`,
            }}
          >
            {p === "input"
              ? isJa
                ? "入力"
                : "Input"
              : p === "split"
                ? isJa
                  ? "分割"
                  : "Split"
                : p === "shuffle"
                  ? "Shuffle"
                  : p === "reduce"
                    ? "Reduce"
                    : p === "output"
                      ? isJa
                        ? "出力"
                        : "Output"
                      : "Map"}
          </span>
        ))}
      </div>

      {/* Visualization area */}
      <div className="min-h-[320px] flex flex-col gap-4">
        {/* Input Documents */}
        {state.inputDocs.some((d) => d.active) && (
          <Section
            title={isJa ? "入力ドキュメント" : "Input Documents"}
            color={PHASE_COLORS.input}
          >
            <div className="flex flex-wrap gap-2">
              {state.inputDocs
                .filter((d) => d.active)
                .map((doc) => (
                  <div
                    key={doc.id}
                    className="px-3 py-2 rounded-lg text-sm font-mono border transition-all duration-300"
                    style={{
                      borderColor: PHASE_COLORS.input,
                      backgroundColor: PHASE_COLORS.input + "15",
                    }}
                  >
                    Doc{doc.id}: &quot;{doc.text}&quot;
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* Splits */}
        {state.splits.length > 0 && (
          <Section
            title={isJa ? "入力スプリット" : "Input Splits"}
            color={PHASE_COLORS.split}
          >
            <div className="flex flex-wrap gap-2">
              {state.splits.map((s) => (
                <div
                  key={s.id}
                  className="px-3 py-2 rounded-lg text-sm font-mono border transition-all duration-300"
                  style={{
                    borderColor: s.active
                      ? MAPPER_COLORS[s.id - 1]
                      : "var(--color-border)",
                    backgroundColor: s.active
                      ? MAPPER_COLORS[s.id - 1] + "15"
                      : "transparent",
                    opacity: s.active ? 1 : 0.4,
                  }}
                >
                  Split{s.id}: &quot;{s.lines[0]}&quot;
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Map Outputs */}
        {state.mapOutputs.length > 0 && (
          <Section
            title={isJa ? "Map 出力" : "Map Output"}
            color={PHASE_COLORS.map}
          >
            <div className="flex flex-col gap-2">
              {state.mapOutputs.map((mo) => (
                <div
                  key={mo.mapperId}
                  className="flex items-start gap-2 transition-all duration-300"
                  style={{ opacity: mo.active ? 1 : 0.4 }}
                >
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                    style={{
                      backgroundColor: MAPPER_COLORS[mo.mapperId - 1],
                      color: "#fff",
                    }}
                  >
                    M{mo.mapperId}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mo.pairs.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono px-2 py-0.5 rounded border"
                        style={{
                          borderColor: MAPPER_COLORS[mo.mapperId - 1] + "60",
                          backgroundColor:
                            MAPPER_COLORS[mo.mapperId - 1] + "10",
                        }}
                      >
                        ({p.key}, {String(p.value)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Shuffled groups */}
        {state.shuffled.length > 0 && (
          <Section
            title={isJa ? "Shuffle & Sort 結果" : "Shuffle & Sort Result"}
            color={PHASE_COLORS.shuffle}
          >
            <div className="flex flex-col gap-1.5">
              {state.shuffled.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center gap-2 transition-all duration-300"
                  style={{ opacity: s.active ? 1 : 0.35 }}
                >
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded min-w-[48px] text-center"
                    style={{
                      backgroundColor: s.active
                        ? PHASE_COLORS.shuffle
                        : "var(--color-muted)",
                      color: s.active ? "#fff" : "var(--color-muted-foreground)",
                    }}
                  >
                    {s.key}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs font-mono">
                    [{s.values.join(", ")}]
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Reduce Outputs */}
        {state.reduceOutputs.length > 0 && (
          <Section
            title={
              state.phase === "output"
                ? isJa
                  ? "最終出力"
                  : "Final Output"
                : isJa
                  ? "Reduce 出力"
                  : "Reduce Output"
            }
            color={
              state.phase === "output"
                ? PHASE_COLORS.output
                : PHASE_COLORS.reduce
            }
          >
            <div className="flex flex-wrap gap-2">
              {state.reduceOutputs.map((r) => (
                <div
                  key={r.key}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-mono border transition-all duration-300"
                  style={{
                    borderColor:
                      state.phase === "output"
                        ? PHASE_COLORS.output
                        : PHASE_COLORS.reduce,
                    backgroundColor:
                      (state.phase === "output"
                        ? PHASE_COLORS.output
                        : PHASE_COLORS.reduce) + "15",
                  }}
                >
                  <span className="font-bold">{r.key}</span>
                  <span className="text-muted-foreground">=</span>
                  <span>{String(r.value)}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Description */}
      <div className="mt-4 p-3 rounded-lg bg-muted/80 text-sm text-foreground min-h-[60px]">
        {isJa ? state.description : state.descriptionEn}
      </div>

      <div className="mt-4">
        <StepPlayerControls {...player} label={phaseLabel} />
      </div>
    </InteractiveDemo>
  );
}

// ── Helper ───────────────────────────────────────────────────

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
