"use client";

import { InteractiveDemo } from "@/components/interactive";

// ── MapReduce Architecture Diagram ──────────────────────────

type MapReduceArchitectureProps = { locale?: string };

export function MapReduceArchitecture({
  locale = "ja",
}: MapReduceArchitectureProps) {
  const isJa = locale === "ja";

  const layers = [
    {
      label: isJa ? "ユーザープログラム" : "User Program",
      sublabel: "map() + reduce()",
      color: "#6366f1",
      items: isJa
        ? ["map(key, value) → emit(k2, v2)", "reduce(k2, list(v2)) → emit(k3, v3)"]
        : ["map(key, value) → emit(k2, v2)", "reduce(k2, list(v2)) → emit(k3, v3)"],
    },
    {
      label: isJa ? "MapReduce フレームワーク" : "MapReduce Framework",
      sublabel: isJa ? "Master が全体を管理" : "Master coordinates everything",
      color: "#f59e0b",
      items: isJa
        ? [
            "タスク分割・スケジューリング",
            "Shuffle & Sort (ネットワーク転送)",
            "障害検知・タスク再実行",
            "Straggler 対策 (投機的実行)",
          ]
        : [
            "Task splitting & scheduling",
            "Shuffle & Sort (network transfer)",
            "Failure detection & task re-execution",
            "Straggler mitigation (speculative execution)",
          ],
    },
    {
      label: isJa ? "分散ファイルシステム" : "Distributed File System",
      sublabel: "GFS / HDFS",
      color: "#10b981",
      items: isJa
        ? [
            "64〜128 MB ブロック単位の分割",
            "3重レプリケーション",
            "データローカリティーの活用",
          ]
        : [
            "64–128 MB block-level splitting",
            "3-way replication",
            "Data locality optimization",
          ],
    },
    {
      label: isJa ? "コモディティーハードウェア" : "Commodity Hardware",
      sublabel: isJa ? "数千台のマシンクラスター" : "Clusters of thousands of machines",
      color: "#64748b",
      items: isJa
        ? ["安価なサーバー群", "故障は日常 (年間数%のディスク障害)"]
        : ["Inexpensive servers", "Failures are routine (a few % of disks fail per year)"],
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce アーキテクチャ" : "MapReduce Architecture"}
      description={
        isJa
          ? "MapReduce のレイヤー構造 — プログラマーが書くのは最上位の 2 つの関数だけ"
          : "MapReduce layer architecture — programmers write only the two functions in the top layer"
      }
    >
      <div className="flex flex-col gap-3">
        {layers.map((layer, i) => (
          <div key={i}>
            <div
              className="rounded-xl border-2 p-4 transition-all"
              style={{
                borderColor: layer.color,
                backgroundColor: layer.color + "08",
              }}
            >
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: layer.color }}
                >
                  {layer.label}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {layer.sublabel}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {layer.items.map((item, j) => (
                  <span
                    key={j}
                    className="text-xs px-2 py-1 rounded-md border"
                    style={{
                      borderColor: layer.color + "40",
                      backgroundColor: layer.color + "10",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            {i < layers.length - 1 && (
              <div className="flex justify-center">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 16 16">
                  <path
                    d="M8 2 L8 14 M4 10 L8 14 L12 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Fault Tolerance Diagram ──────────────────────────────────

type FaultToleranceDiagramProps = { locale?: string };

export function FaultToleranceDiagram({
  locale = "ja",
}: FaultToleranceDiagramProps) {
  const isJa = locale === "ja";

  const scenarios = [
    {
      icon: "⚙️",
      title: isJa ? "Worker 障害" : "Worker Failure",
      description: isJa
        ? "Master が定期的に ping し、応答がなければ障害と判断。その Worker の実行中タスクと完了済み Map タスクを再実行。"
        : "Master pings workers periodically; no response = failure. That worker's in-progress tasks and its completed Map tasks are re-executed.",
      mechanism: isJa
        ? "Map の出力はローカルディスクにあるため、障害時はアクセス不可 → 再実行が必要。完了済み Reduce タスクの出力は GFS にあるため再実行不要。"
        : "Map output is on local disk, inaccessible after failure → must re-execute. Completed Reduce tasks' output is on GFS, so they need no re-execution.",
      color: "#ef4444",
    },
    {
      icon: "👑",
      title: isJa ? "Master 障害" : "Master Failure",
      description: isJa
        ? "初期実装ではジョブ全体を中止。チェックポイントから再開も可能だが、Master は 1 台なので障害確率は低い。"
        : "The original implementation aborts the entire job. Recovery from a checkpoint is possible, but with only one Master, its failure is unlikely.",
      mechanism: isJa
        ? "Master の状態（タスク割り当て、進捗）を定期的にチェックポイントに保存しておけば、別のマシンで再開できる。"
        : "If the Master periodically checkpoints its state (task assignments, progress), a new copy can resume on another machine.",
      color: "#f59e0b",
    },
    {
      icon: "🐢",
      title: isJa ? "Straggler 対策" : "Straggler Mitigation",
      description: isJa
        ? "終盤に残ったタスクの 1 つに異常に時間をかけるマシン（Straggler）が、ジョブ全体を遅らせる。原因はディスク劣化やネットワーク輻輳など。"
        : "A straggler, a machine that is unusually slow on one of the last few tasks, delays the whole job. Causes include a degraded disk or network congestion.",
      mechanism: isJa
        ? "ジョブ終盤で、実行中のタスクのバックアップを別のマシンで起動。先に完了した方の結果を採用（投機的実行）。"
        : "Near job completion, launch backup copies of the remaining in-progress tasks on other machines. Use whichever copy finishes first (speculative execution).",
      color: "#8b5cf6",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "耐障害性メカニズム" : "Fault Tolerance Mechanisms"}
      description={
        isJa
          ? "数千台規模のクラスターで、マシンが故障したり遅くなったりしてもジョブを完了させる仕組み"
          : "How MapReduce finishes jobs on clusters of thousands of machines even when some machines fail or slow down"
      }
    >
      <div className="flex flex-col gap-4">
        {scenarios.map((s, i) => (
          <div
            key={i}
            className="rounded-lg border p-4"
            style={{
              borderColor: s.color + "40",
              backgroundColor: s.color + "08",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="font-bold text-sm" style={{ color: s.color }}>
                {s.title}
              </span>
            </div>
            <p className="text-sm text-foreground mb-2">{s.description}</p>
            <div
              className="text-xs p-2 rounded border"
              style={{
                borderColor: s.color + "30",
                backgroundColor: s.color + "05",
              }}
            >
              <span className="font-semibold text-muted-foreground">
                {isJa ? "仕組み: " : "Mechanism: "}
              </span>
              {s.mechanism}
            </div>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── MapReduce vs Traditional Comparison ─────────────────────

type MapReduceComparisonProps = { locale?: string };

export function MapReduceComparison({
  locale = "ja",
}: MapReduceComparisonProps) {
  const isJa = locale === "ja";

  const rows = isJa
    ? [
        { aspect: "並列化", before: "プログラマーが手動で管理", after: "フレームワークが自動処理" },
        { aspect: "障害復旧", before: "アプリケーション固有のロジック", after: "フレームワークが透過的に再実行" },
        { aspect: "データ分散", before: "明示的なパーティショニング", after: "分散FS + 自動スプリット" },
        { aspect: "スケーラビリティー", before: "アーキテクチャの再設計が必要", after: "マシン追加でスケールアウト" },
        { aspect: "プログラミングモデル", before: "ソケット/RPC/スレッド管理", after: "map() と reduce() の 2 つの関数" },
        { aspect: "デバッグ", before: "分散デバッグは極めて困難", after: "個々の map/reduce を単体テスト可能" },
      ]
    : [
        { aspect: "Parallelization", before: "Manually managed by programmer", after: "Automatically handled by framework" },
        { aspect: "Fault Recovery", before: "Application-specific logic", after: "Framework transparently re-executes" },
        { aspect: "Data Distribution", before: "Explicit partitioning", after: "Distributed FS + auto-splitting" },
        { aspect: "Scalability", before: "Requires architecture redesign", after: "Scales out by adding machines" },
        { aspect: "Programming Model", before: "Sockets/RPC/thread management", after: "Just map() and reduce()" },
        { aspect: "Debugging", before: "Distributed debugging is very hard", after: "Unit test individual map/reduce" },
      ];

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce 以前 vs 以後" : "Before vs After MapReduce"}
      description={
        isJa
          ? "MapReduce が大規模データ処理をどう変えたか"
          : "How MapReduce changed large-scale data processing"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider border-b border-border">
                {isJa ? "観点" : "Aspect"}
              </th>
              <th className="text-left py-2 px-3 text-red-500 font-semibold text-xs uppercase tracking-wider border-b border-border">
                {isJa ? "以前" : "Before"}
              </th>
              <th className="text-left py-2 px-3 text-emerald-500 font-semibold text-xs uppercase tracking-wider border-b border-border">
                {isJa ? "MapReduce" : "MapReduce"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium text-foreground">
                  {r.aspect}
                </td>
                <td className="py-2 px-3 text-muted-foreground">{r.before}</td>
                <td className="py-2 px-3 text-foreground">{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

// ── Timeline Diagram ─────────────────────────────────────────

type MapReduceTimelineProps = { locale?: string };

export function MapReduceTimeline({ locale = "ja" }: MapReduceTimelineProps) {
  const isJa = locale === "ja";

  const events = [
    {
      year: "2003",
      title: "GFS",
      description: isJa
        ? "Google File System 論文発表。大規模分散ファイルシステムの基盤"
        : "Google File System paper published. Foundation for large-scale distributed storage",
      color: "#10b981",
    },
    {
      year: "2004",
      title: "MapReduce",
      description: isJa
        ? "MapReduce 論文発表 (OSDI'04)。分散計算の抽象化"
        : "MapReduce paper published (OSDI'04). Abstraction for distributed computation",
      color: "#3b82f6",
      highlight: true,
    },
    {
      year: "2006",
      title: "Hadoop",
      description: isJa
        ? "Hadoop 登場（Yahoo! が開発を支援）。MapReduce の OSS 実装"
        : "Hadoop emerges, with Yahoo! backing its development. OSS implementation of MapReduce",
      color: "#f59e0b",
    },
    {
      year: "2008",
      title: "Hadoop @ Scale",
      description: isJa
        ? "Yahoo! が 10,000 コア超の Hadoop クラスターを運用"
        : "Yahoo! operates a Hadoop cluster with more than 10,000 cores",
      color: "#f59e0b",
    },
    {
      year: "2010",
      title: "Spark",
      description: isJa
        ? "Apache Spark 登場。インメモリー処理で、反復処理が Hadoop より最大 20 倍高速に（NSDI'12）"
        : "Apache Spark emerges. In-memory processing makes iterative jobs up to 20x faster than Hadoop (NSDI'12)",
      color: "#ef4444",
    },
    {
      year: "2014",
      title: isJa ? "Google 社内で非推奨" : "Deprecated at Google",
      description: isJa
        ? "Google が MapReduce の後継として Cloud Dataflow を発表。社内では MapReduce をほぼ使っていないと説明"
        : "Google announces Cloud Dataflow as MapReduce's successor and says it no longer really uses MapReduce internally",
      color: "#64748b",
    },
    {
      year: "2015+",
      title: isJa ? "レガシー化" : "Legacy",
      description: isJa
        ? "Spark・Flink・Beam が主流に。MapReduce の考え方はこれらに受け継がれる"
        : "Spark, Flink, and Beam become mainstream and carry MapReduce's ideas forward",
      color: "#64748b",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce とビッグデータの年表" : "MapReduce & Big Data Timeline"}
      description={
        isJa
          ? "2003 年の GFS から始まるビッグデータ処理の進化"
          : "The evolution of big data processing starting from GFS in 2003"
      }
    >
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
        <div className="flex flex-col gap-4">
          {events.map((e, i) => (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div
                className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 bg-background z-10"
                style={{
                  borderColor: e.color,
                  backgroundColor: e.highlight ? e.color : "var(--color-background)",
                }}
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: e.color }}
                  >
                    {e.year}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {e.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </InteractiveDemo>
  );
}
