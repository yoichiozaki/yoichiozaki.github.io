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
            "64–128 MB ブロック単位の分割",
            "3重レプリケーション",
            "データローカリティの活用",
          ]
        : [
            "64–128 MB block-level splitting",
            "3-way replication",
            "Data locality optimization",
          ],
    },
    {
      label: isJa ? "コモディティハードウェア" : "Commodity Hardware",
      sublabel: isJa ? "数千台のマシンクラスタ" : "Clusters of thousands of machines",
      color: "#64748b",
      items: isJa
        ? ["安価なサーバー群", "故障は日常 (年間数%のディスク障害)"]
        : ["Inexpensive servers", "Failures are routine (several % disk failures/year)"],
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce アーキテクチャ" : "MapReduce Architecture"}
      description={
        isJa
          ? "MapReduce のレイヤー構造 — プログラマが書くのは最上位の2関数だけ"
          : "MapReduce layer architecture — programmers only write the top two functions"
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
        ? "Master が定期的に ping し、応答がなければ障害と判断。そのWorkerの完了済み Map タスクも含め再実行。"
        : "Master pings workers periodically. No response = failure. Re-executes all tasks (including completed Map tasks) on that worker.",
      mechanism: isJa
        ? "Map の出力はローカルディスクにあるため、障害時はアクセス不可 → 再実行が必要。Reduce の出力は GFS に書かれるため再実行不要。"
        : "Map output is on local disk, inaccessible after failure → must re-execute. Reduce output is on GFS, so no re-execution needed.",
      color: "#ef4444",
    },
    {
      icon: "👑",
      title: isJa ? "Master 障害" : "Master Failure",
      description: isJa
        ? "初期実装ではジョブ全体を中止。チェックポイントから再開も可能だが、Master は 1 台なので障害確率は低い。"
        : "In the original implementation, abort the entire job. Checkpoint-based recovery is possible, but Master failure is rare (single machine).",
      mechanism: isJa
        ? "Master の状態（タスク割り当て、進捗）を定期的にチェックポイント保存 → 別のマシンで再開可能。"
        : "Master state (task assignments, progress) is periodically checkpointed → can resume on another machine.",
      color: "#f59e0b",
    },
    {
      icon: "🐢",
      title: isJa ? "Straggler 対策" : "Straggler Mitigation",
      description: isJa
        ? "一部のタスクが異常に遅い場合（ディスク劣化、ネットワーク輻輳）、ジョブ全体のボトルネックになる。"
        : "Some tasks run abnormally slow (degraded disk, network congestion), becoming a bottleneck for the entire job.",
      mechanism: isJa
        ? "ジョブ終盤で残りのin-progressタスクのバックアップタスクを起動。先に完了した方の結果を採用（投機的実行）。"
        : 'Near job completion, launch backup copies of remaining in-progress tasks. Use whichever finishes first (speculative execution).',
      color: "#8b5cf6",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "耐障害性メカニズム" : "Fault Tolerance Mechanisms"}
      description={
        isJa
          ? "MapReduce が数千台規模のクラスタで信頼性を確保する仕組み"
          : "How MapReduce ensures reliability in clusters of thousands of machines"
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
        { aspect: "並列化", before: "プログラマが手動で管理", after: "フレームワークが自動処理" },
        { aspect: "障害復旧", before: "アプリケーション固有のロジック", after: "フレームワークが透過的に再実行" },
        { aspect: "データ分散", before: "明示的なパーティショニング", after: "分散FS + 自動スプリット" },
        { aspect: "スケーラビリティ", before: "アーキテクチャの再設計が必要", after: "マシン追加で線形にスケール" },
        { aspect: "プログラミングモデル", before: "ソケット/RPC/スレッド管理", after: "map() と reduce() の2関数" },
        { aspect: "デバッグ", before: "分散デバッグは極めて困難", after: "個々の map/reduce を単体テスト可能" },
      ]
    : [
        { aspect: "Parallelization", before: "Manually managed by programmer", after: "Automatically handled by framework" },
        { aspect: "Fault Recovery", before: "Application-specific logic", after: "Framework transparently re-executes" },
        { aspect: "Data Distribution", before: "Explicit partitioning", after: "Distributed FS + auto-splitting" },
        { aspect: "Scalability", before: "Requires architecture redesign", after: "Linear scaling by adding machines" },
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
        ? "Yahoo! が Hadoop をオープンソース化。MapReduce の OSS 実装"
        : "Yahoo! open-sources Hadoop. OSS implementation of MapReduce",
      color: "#f59e0b",
    },
    {
      year: "2008",
      title: "Hadoop @ Scale",
      description: isJa
        ? "Yahoo! が 10,000 ノードの Hadoop クラスタを運用"
        : "Yahoo! operates a 10,000-node Hadoop cluster",
      color: "#f59e0b",
    },
    {
      year: "2010",
      title: "Spark",
      description: isJa
        ? "Apache Spark 登場。インメモリ処理で MapReduce の 10–100 倍高速化"
        : "Apache Spark emerges. In-memory processing, 10–100x faster than MapReduce",
      color: "#ef4444",
    },
    {
      year: "2014",
      title: isJa ? "Google 社内で非推奨" : "Deprecated at Google",
      description: isJa
        ? "Google が社内で MapReduce を Cloud Dataflow に移行開始"
        : "Google begins migrating from MapReduce to Cloud Dataflow internally",
      color: "#64748b",
    },
    {
      year: "2015+",
      title: isJa ? "レガシー化" : "Legacy",
      description: isJa
        ? "Spark, Flink, Beam が主流に。MapReduce は教育・歴史的意義として残る"
        : "Spark, Flink, Beam become mainstream. MapReduce remains for education & historical significance",
      color: "#64748b",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "MapReduce とビッグデータの年表" : "MapReduce & Big Data Timeline"}
      description={
        isJa
          ? "2003年の GFS から始まるビッグデータ処理の進化"
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
