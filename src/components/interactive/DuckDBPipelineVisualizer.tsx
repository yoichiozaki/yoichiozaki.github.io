"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type Props = { locale?: string };

type PipelineDef = {
  id: string;
  source: string;
  operators: string[];
  sink: string;
  dependsOn: string[];
};

const PIPELINES: PipelineDef[] = [
  {
    id: "P1",
    source: "SEQ_SCAN orders",
    operators: ["FILTER o_orderdate >= '1995-01-01'"],
    sink: "HASH_JOIN (build)",
    dependsOn: [],
  },
  {
    id: "P2",
    source: "SEQ_SCAN lineitem",
    operators: ["HASH_JOIN (probe)"],
    sink: "HASH_GROUP_BY (build)",
    dependsOn: ["P1"],
  },
  {
    id: "P3",
    source: "HASH_GROUP_BY (scan)",
    operators: [],
    sink: "ORDER_BY (build)",
    dependsOn: ["P2"],
  },
  {
    id: "P4",
    source: "ORDER_BY (scan)",
    operators: [],
    sink: "RESULT_COLLECTOR",
    dependsOn: ["P3"],
  },
];

type Step = {
  /** Index into PIPELINES, or -1 when no pipeline is running. */
  pipeline: number;
  /** -1 = nothing held, 0 = source, 1..n = operator i-1, n+1 = sink. */
  slot: number;
  ret?: string;
  ja: string;
  en: string;
};

const STEPS: Step[] = [
  {
    pipeline: -1,
    slot: -1,
    ja: "オプティマイザが出した物理プランを、Executor が MetaPipeline に分解する。パイプラインの切れ目は「パイプラインブレーカ」— 入力を全部受け取るまで 1 行も返せない演算子（ハッシュ結合の build、集約、ソート）の位置に入る。",
    en: "The Executor decomposes the physical plan into MetaPipelines. The cut points are pipeline breakers — operators that cannot emit a single row until they have consumed all input (hash-join build, aggregation, sort).",
  },
  {
    pipeline: 0,
    slot: -1,
    ja: "P2 は P1 の sink（ハッシュテーブル）に依存するので、まず P1 だけがスケジュールされる。Pipeline::Schedule() が GetMaxThreads() 個の PipelineTask を Event に積む。",
    en: "P2 depends on P1's sink (the hash table), so only P1 is scheduled first. Pipeline::Schedule() pushes GetMaxThreads() PipelineTasks onto an Event.",
  },
  {
    pipeline: 0,
    slot: 0,
    ret: "SourceResultType::HAVE_MORE_OUTPUT",
    ja: "PipelineExecutor::FetchFromSource() が source の GetData() を呼び、orders から 2048 行の DataChunk を 1 つ受け取る。ここが「プル」なのはパイプラインの先頭だけ。",
    en: "PipelineExecutor::FetchFromSource() calls the source's GetData(), pulling one 2048-row DataChunk out of orders. This is the only place in the pipeline that pulls.",
  },
  {
    pipeline: 0,
    slot: 1,
    ret: "OperatorResultType::NEED_MORE_INPUT",
    ja: "FILTER の Execute() が chunk を受け取り、合致行の添字を SelectionVector に書いて Slice する。行はコピーされない。返り値 NEED_MORE_INPUT は「この入力は使い切った、次をくれ」の意味。",
    en: "FILTER's Execute() receives the chunk, writes matching indices into a SelectionVector and slices. No rows are copied. NEED_MORE_INPUT means \"I am done with this input, give me the next one\".",
  },
  {
    pipeline: 0,
    slot: 2,
    ret: "SinkResultType::NEED_MORE_INPUT",
    ja: "sink の Sink() が結合キーをハッシュし、行を TupleDataCollection（行指向レイアウト）に追記する。build 側だけは列指向をやめて行指向にするのが定石 — probe 時に 1 タプルを丸ごと触るから。",
    en: "The sink's Sink() hashes the join keys and appends rows into a TupleDataCollection (row-major layout). The build side deliberately abandons columnar layout because probing touches whole tuples.",
  },
  {
    pipeline: 0,
    slot: -1,
    ja: "source が枯れると各スレッドが Combine() でローカル状態を global sink state にマージし、全員が終わったところで Executor の finish event が Finalize() を呼ぶ。ここでポインタテーブルが確保され、ハッシュテーブルが完成する。",
    en: "Once the source is exhausted each thread merges its local state via Combine(), and when every thread is done the executor's finish event calls Finalize(), which allocates the pointer table and completes the hash table.",
  },
  {
    pipeline: 1,
    slot: -1,
    ja: "依存が解けたので P2 がスケジュールされる。P2 の中間演算子は HASH_JOIN の probe 側 — 同じ PhysicalHashJoin オブジェクトが、P1 では sink、P2 では operator として二役を演じている。",
    en: "With its dependency satisfied, P2 is scheduled. Its intermediate operator is the probe side of the join — the very same PhysicalHashJoin object acts as a sink in P1 and as an operator in P2.",
  },
  {
    pipeline: 1,
    slot: 0,
    ret: "SourceResultType::HAVE_MORE_OUTPUT",
    ja: "lineitem から 2048 行。この chunk はスレッドローカルで、他スレッドと共有されない。共有されるのは GlobalSourceState 内の「次に読む row group はどれか」というカーソルだけ。",
    en: "2048 rows from lineitem. The chunk is thread-local; the only shared state is the cursor in GlobalSourceState saying which row group to read next.",
  },
  {
    pipeline: 1,
    slot: 1,
    ret: "OperatorResultType::HAVE_MORE_OUTPUT",
    ja: "probe が 2048 行を超える結合結果を生んだ。出力 chunk は 2048 行で頭打ちなので、演算子は HAVE_MORE_OUTPUT を返し、PipelineExecutor は in_process_operators スタックにこの演算子を積む。",
    en: "The probe produced more than 2048 matches. Output chunks are capped at 2048 rows, so the operator returns HAVE_MORE_OUTPUT and the PipelineExecutor pushes it onto the in_process_operators stack.",
  },
  {
    pipeline: 1,
    slot: 2,
    ret: "SinkResultType::NEED_MORE_INPUT",
    ja: "RadixPartitionedHashTable に流し込む。ハッシュ上位 16 ビット（ソルト用に予約）のすぐ下の radix_bits ビットでパーティションを決め、スレッドローカル HT に書く。ロックは取らない。",
    en: "The chunk is sunk into the RadixPartitionedHashTable: the radix_bits just below the hash's top 16 salt bits choose a partition, and the row lands in a thread-local hash table. No locks are taken.",
  },
  {
    pipeline: 1,
    slot: 1,
    ret: "OperatorResultType::NEED_MORE_INPUT",
    ja: "in_process_operators が空でないので、source には戻らず同じ入力 chunk で probe を再入する。残りのマッチが吐き出され、今度こそ NEED_MORE_INPUT。",
    en: "Because in_process_operators is non-empty, the executor re-enters the probe with the same input chunk instead of going back to the source. The remaining matches come out and it finally returns NEED_MORE_INPUT.",
  },
  {
    pipeline: 1,
    slot: -1,
    ja: "P2 完了。HASH_GROUP_BY が Combine() → Finalize() で全スレッドのパーティションを AggregatePartition にまとめる。",
    en: "P2 finishes. HASH_GROUP_BY runs Combine() then Finalize(), gathering every thread's partitions into AggregatePartitions.",
  },
  {
    pipeline: 2,
    slot: 0,
    ja: "P3 では集約が source に転じる。パーティション単位でスキャンできるので、ここも並列。出力はソートの sink に積まれる。",
    en: "In P3 the aggregation flips into a source. Partitions can be scanned independently, so this stage is parallel too. Output is pushed into the sort's sink.",
  },
  {
    pipeline: 3,
    slot: 1,
    ja: "P4 でソート結果を読み出し、RESULT_COLLECTOR に渡してクエリ完了。パイプラインごとに source と sink の役割が入れ替わっていくのが push ベースモデルの骨格。",
    en: "P4 reads the sorted output and hands it to the RESULT_COLLECTOR — query complete. Roles flipping between source and sink from pipeline to pipeline is the skeleton of the push-based model.",
  },
];

export function DuckDBPipelineVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 2400 });
  const cur = STEPS[player.step];

  const slotsOf = (p: PipelineDef) => [p.source, ...p.operators, p.sink];

  return (
    <InteractiveDemo
      title={isJa ? "push ベース実行を 1 ステップずつ追う" : "Walk through push-based execution"}
      description={
        isJa
          ? "SELECT o_orderpriority, count(*) FROM orders JOIN lineitem ON o_orderkey = l_orderkey WHERE o_orderdate >= DATE '1995-01-01' GROUP BY 1 ORDER BY 1 — このクエリが 4 本のパイプラインに分解され、DataChunk が押し込まれていく様子。"
          : "SELECT o_orderpriority, count(*) FROM orders JOIN lineitem ON o_orderkey = l_orderkey WHERE o_orderdate >= DATE '1995-01-01' GROUP BY 1 ORDER BY 1 — how this query splits into four pipelines and how DataChunks get pushed through them."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-2">
          {PIPELINES.map((p, pi) => {
            const active = cur.pipeline === pi;
            const done = cur.pipeline > pi;
            return (
              <div
                key={p.id}
                className={`rounded-lg border px-3 py-2 transition-colors ${
                  active
                    ? "border-accent bg-accent/10"
                    : done
                      ? "border-border bg-muted/40 opacity-60"
                      : "border-border bg-background opacity-45"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-accent">{p.id}</span>
                  {p.dependsOn.length > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      depends on {p.dependsOn.join(", ")}
                    </span>
                  )}
                  {done && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {isJa ? "完了" : "done"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {slotsOf(p).map((label, si) => {
                    const holding = active && cur.slot === si;
                    const role =
                      si === 0
                        ? "source"
                        : si === slotsOf(p).length - 1
                          ? "sink"
                          : "operator";
                    return (
                      <div key={si} className="flex items-center gap-1">
                        {si > 0 && (
                          <span
                            className={`font-mono text-xs ${
                              holding ? "text-accent" : "text-muted-foreground"
                            }`}
                          >
                            →
                          </span>
                        )}
                        <div
                          className={`rounded-md border px-2 py-1 transition-all ${
                            holding
                              ? "border-accent bg-accent text-accent-foreground shadow-sm"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          <div className="font-mono text-[11px] leading-tight">{label}</div>
                          <div
                            className={`font-mono text-[9px] leading-tight ${
                              holding ? "text-accent-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {role}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {cur.ret && (
          <div className="rounded-md border border-blue-500/50 bg-blue-500/10 px-3 py-1.5 font-mono text-[11px] text-foreground">
            return {cur.ret}
          </div>
        )}

        <div className="min-h-[76px] rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
          {isJa ? cur.ja : cur.en}
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={
            isJa
              ? {
                  reset: "リセット",
                  backward: "1 ステップ戻る",
                  play: "再生",
                  pause: "一時停止",
                  forward: "1 ステップ進む",
                  goToStep: (target: number) => `ステップ ${target} へ`,
                  progress: "再生進行状況",
                }
              : undefined
          }
        />
      </div>
    </InteractiveDemo>
  );
}
