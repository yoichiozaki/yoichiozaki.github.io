"use client";

import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// ── Streaming CD Timeline ───────────────────────────────────

type TimelineEvent = {
  year: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  color: string;
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    year: "2006",
    title: "Evolutionary Clustering",
    titleEn: "Evolutionary Clustering",
    desc: "Chakrabarti らが時間的一貫性と品質のトレードオフを定式化",
    descEn: "Chakrabarti et al. formalize the trade-off between temporal consistency and quality",
    color: "#3b82f6",
  },
  {
    year: "2007",
    title: "GraphScope",
    titleEn: "GraphScope",
    desc: "Sun らが MDL に基づく変化点検出と送信元・送信先グループのモデル化を組み合わせた手法を提案",
    descEn: "Sun et al. propose combining MDL-based change-point detection with source/destination group modeling",
    color: "#6366f1",
  },
  {
    year: "2010",
    title: "DiDiC",
    titleEn: "DiDiC",
    desc: "Gehweiler と Meyerhenke が分散拡散型クラスタリングを提案",
    descEn: "Gehweiler and Meyerhenke propose distributed diffusive clustering",
    color: "#8b5cf6",
  },
  {
    year: "2011",
    title: "OSLOM",
    titleEn: "OSLOM",
    desc: "Lancichinetti らがコミュニティーの統計的有意性を局所的に検定する手法を提案",
    descEn: "Lancichinetti et al. propose testing the statistical significance of communities locally",
    color: "#f59e0b",
  },
  {
    year: "2012",
    title: "DEMON",
    titleEn: "DEMON",
    desc: "Coscia らが各ノードのエゴネットにラベル伝搬を適用する局所的 CD を提案",
    descEn: "Coscia et al. propose local CD that runs label propagation on each node's ego-net",
    color: "#ef4444",
  },
  {
    year: "2013",
    title: "LabelRankT",
    titleEn: "LabelRankT",
    desc: "Xie らが LabelRank を辺の変更に合わせて増分的に更新する動的 CD を提案",
    descEn: "Xie et al. propose dynamic CD that updates LabelRank incrementally as edges change",
    color: "#10b981",
  },
  {
    year: "2017",
    title: "TILES",
    titleEn: "TILES",
    desc: "Rossetti らが三角形ベースの真のストリーミング CD を提案",
    descEn: "Rossetti et al. propose triangle-based true streaming CD",
    color: "#e11d48",
  },
  {
    year: "2019",
    title: "DynaMo",
    titleEn: "DynaMo",
    desc: "Zhuang らが辺の追加・削除に合わせて Modularity を増分的に更新する手法を提案",
    descEn: "Zhuang et al. propose updating Modularity incrementally as edges are added and removed",
    color: "#14b8a6",
  },
  {
    year: "2020",
    title: "EvolveGCN",
    titleEn: "EvolveGCN",
    desc: "Pareja らが GCN の重みを RNN で時間方向に更新する手法を提案",
    descEn: "Pareja et al. propose updating GCN weights over time with an RNN",
    color: "#a855f7",
  },
  {
    year: "2020",
    title: "ANGEL",
    titleEn: "ANGEL",
    desc: "Rossetti がマージベースの重複 CD 手法と、スナップショット単位の動的版 ArchAngel を提案",
    descEn: "Rossetti proposes a merge-based overlapping CD method and ArchAngel, its snapshot-based dynamic version",
    color: "#f97316",
  },
  {
    year: "2021",
    title: "delta-screening",
    titleEn: "Delta-screening",
    desc: "Zarayeneh と Kalyanaraman が、辺の変更で影響を受けるノードだけで Louvain を再実行する手法を提案",
    descEn: "Zarayeneh and Kalyanaraman propose re-running Louvain only on the nodes an edge change affects",
    color: "#0ea5e9",
  },
  {
    year: "2022",
    title: "ROLAND",
    titleEn: "ROLAND",
    desc: "You らが GNN の各層の出力に時系列モデリングを適用し、ノード表現を継続的に更新する手法を提案",
    descEn: "You et al. propose applying temporal modeling to each GNN layer's output to keep node representations up to date",
    color: "#ec4899",
  },
];

export function StreamingCDTimeline({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "ストリーミング CD の歴史" : "History of Streaming CD"}
      description={
        isJa
          ? "動的グラフや辺ストリームでのコミュニティー検出 (CD) に関わる主な研究（年は論文の発表年）"
          : "Key work on community detection (CD) in dynamic graphs and edge streams (years are publication years)"
      }
    >
      <div className="relative ml-4 border-l-2 border-neutral-300 pl-6 dark:border-neutral-600">
        {TIMELINE_EVENTS.map((ev, i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div
              className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white dark:border-neutral-900"
              style={{ backgroundColor: ev.color }}
            />
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: ev.color }}
              >
                {ev.year}
              </span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                {isJa ? ev.title : ev.titleEn}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {isJa ? ev.desc : ev.descEn}
            </p>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Batch vs Incremental vs Streaming Comparison ────────────

export function BatchVsStreamingDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  const approaches = [
    {
      label: isJa ? "バッチ再計算" : "Batch Recompute",
      desc: isJa
        ? "辺が変わるたびに、グラフ全体（n ノード、m 辺）で CD を最初から再実行"
        : "Re-run CD from scratch on the whole graph (n nodes, m edges) after every change",
      cost: "O(m + n)",
      color: "#ef4444",
      icon: "🔄",
    },
    {
      label: isJa ? "増分的更新" : "Incremental Update",
      desc: isJa
        ? "変更の影響が及ぶ範囲だけを再計算（Δ = 変更辺数、k = 平均次数）"
        : "Recompute only the region the change affects (Δ = changed edges, k = average degree)",
      cost: "O(Δ · k)",
      color: "#f59e0b",
      icon: "📍",
    },
    {
      label: isJa ? "真のストリーミング" : "True Streaming",
      desc: isJa
        ? "辺 1 本の到着につき、定数時間か対数時間で内部状態を更新"
        : "Update the internal state in constant or logarithmic time per arriving edge",
      cost: "O(1)–O(log n)",
      color: "#10b981",
      icon: "⚡",
    },
  ];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "バッチ vs 増分 vs ストリーミング"
          : "Batch vs Incremental vs Streaming"
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {approaches.map((a, i) => (
          <div
            key={i}
            className="rounded-lg border-2 p-4"
            style={{ borderColor: a.color }}
          >
            <div className="mb-2 text-center text-2xl">{a.icon}</div>
            <h4
              className="mb-1 text-center text-sm font-bold"
              style={{ color: a.color }}
            >
              {a.label}
            </h4>
            <p className="mb-2 text-center text-xs text-neutral-600 dark:text-neutral-400">
              {a.desc}
            </p>
            <div className="text-center">
              <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs dark:bg-neutral-800">
                {isJa ? "更新コスト: " : "Update cost: "}
                {a.cost}
              </span>
            </div>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Streaming CD Comparison Table ───────────────────────────

type AlgoRow = {
  name: string;
  year: string;
  paradigm: string;
  paradigmEn: string;
  overlap: boolean;
  edgeDel: boolean;
  complexity: string;
  strength: string;
  strengthEn: string;
};

const ALGO_DATA: AlgoRow[] = [
  {
    name: "LabelRankT",
    year: "2013",
    paradigm: "ラベル分布の伝搬",
    paradigmEn: "Label-distribution propagation",
    overlap: false,
    edgeDel: true,
    complexity: "O(k·m_Δ)",
    strength: "高速、比較的シンプル",
    strengthEn: "Fast, relatively simple",
  },
  {
    name: "OSLOM",
    year: "2011",
    paradigm: "統計検定",
    paradigmEn: "Statistical test",
    overlap: true,
    edgeDel: true,
    complexity: "O(c²)",
    strength: "統計的有意性に基づく",
    strengthEn: "Based on statistical significance",
  },
  {
    name: "DEMON",
    year: "2012",
    paradigm: "エゴネット + LPA",
    paradigmEn: "Ego-net + LPA",
    overlap: true,
    edgeDel: false,
    complexity: "O(d²)",
    strength: "局所的、重複コミュニティー",
    strengthEn: "Local, overlapping communities",
  },
  {
    name: "DynaMo",
    year: "2019",
    paradigm: "Modularity 増分",
    paradigmEn: "Incremental Modularity",
    overlap: false,
    edgeDel: true,
    complexity: "O(d)",
    strength: "Modularity を正確に追跡",
    strengthEn: "Accurately tracks Modularity",
  },
  {
    name: "TILES",
    year: "2017",
    paradigm: "三角形ベース",
    paradigmEn: "Triangle-based",
    overlap: true,
    edgeDel: true,
    complexity: "O(d + |W|·|labels|)",
    strength: "真のストリーミング、TTL 機構",
    strengthEn: "True streaming, TTL mechanism",
  },
  {
    name: "ANGEL",
    year: "2020",
    paradigm: "マージベース",
    paradigmEn: "Merge-based",
    overlap: true,
    edgeDel: false,
    complexity: "—",
    strength: "ノード中心、重複コミュニティー",
    strengthEn: "Node-centric, overlapping communities",
  },
  {
    name: "Delta-screening",
    year: "2021",
    paradigm: "Louvain 増分",
    paradigmEn: "Incremental Louvain",
    overlap: false,
    edgeDel: true,
    complexity: "O(d)",
    strength: "Louvain の再実行比で最大 38 倍高速、Modularity はほぼ同じ（報告値）",
    strengthEn: "Up to 38× faster than rerunning Louvain, similar Modularity (reported)",
  },
];

export function StreamingCDComparisonTable({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={
        isJa
          ? "ストリーミング CD アルゴリズム比較"
          : "Streaming CD Algorithm Comparison"
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-neutral-300 dark:border-neutral-600">
              <th className="px-2 py-1 text-left font-bold">
                {isJa ? "アルゴリズム" : "Algorithm"}
              </th>
              <th className="px-2 py-1 text-left font-bold">
                {isJa ? "年" : "Year"}
              </th>
              <th className="px-2 py-1 text-left font-bold">
                {isJa ? "アプローチ" : "Approach"}
              </th>
              <th className="px-2 py-1 text-center font-bold">
                {isJa ? "重複" : "Overlap"}
              </th>
              <th className="px-2 py-1 text-center font-bold">
                {isJa ? "辺削除" : "Edge deletion"}
              </th>
              <th className="px-2 py-1 text-left font-bold">
                {isJa ? "計算量 (辺あたり)" : "Complexity (per edge)"}
              </th>
              <th className="px-2 py-1 text-left font-bold">
                {isJa ? "強み" : "Strength"}
              </th>
            </tr>
          </thead>
          <tbody>
            {ALGO_DATA.map((row, i) => (
              <tr
                key={i}
                className="border-b border-neutral-200 dark:border-neutral-700"
              >
                <td className="px-2 py-1 font-mono font-bold">{row.name}</td>
                <td className="px-2 py-1">{row.year}</td>
                <td className="px-2 py-1">
                  {isJa ? row.paradigm : row.paradigmEn}
                </td>
                <td className="px-2 py-1 text-center">
                  {row.overlap ? "✅" : "—"}
                </td>
                <td className="px-2 py-1 text-center">
                  {row.edgeDel ? "✅" : "—"}
                </td>
                <td className="px-2 py-1 font-mono">{row.complexity}</td>
                <td className="px-2 py-1">
                  {isJa ? row.strength : row.strengthEn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
        {isJa
          ? "d = 端点の次数, c = コミュニティーサイズ, k = 局所反復回数, m_Δ = 影響集合 Δ の内外で触れる辺数, W = u と v の共通近傍, labels = 各ノードのラベル集合, — = 辺ごとの更新なし（ArchAngel はスナップショット単位）"
          : "d = endpoint degree, c = community size, k = local iterations, m_Δ = edges touched in and around the affected set Δ, W = common neighbors of u and v, labels = a node's label set, — = no per-edge update (ArchAngel works per snapshot)"}
      </p>
    </InteractiveDemo>
  );
}

// ── Design Space Diagram ────────────────────────────────────

export function StreamingDesignSpaceDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  const dimensions = [
    {
      axis: isJa ? "更新戦略" : "Update Strategy",
      options: [
        {
          label: isJa ? "全体再計算" : "Full Recompute",
          desc: isJa ? "正確だが遅い" : "Accurate but slow",
        },
        {
          label: isJa ? "局所更新" : "Local Update",
          desc: isJa ? "高速だが近似的" : "Fast but approximate",
        },
        {
          label: isJa ? "遅延更新" : "Lazy Update",
          desc: isJa ? "変更をためてまとめて更新" : "Buffer changes, update in batches",
        },
      ],
      color: "#3b82f6",
    },
    {
      axis: isJa ? "時間モデル" : "Temporal Model",
      options: [
        {
          label: isJa ? "スナップショット" : "Snapshot",
          desc: isJa ? "離散的な時刻" : "Discrete time points",
        },
        {
          label: isJa ? "スライディングウィンドウ" : "Sliding Window",
          desc: isJa ? "最近の辺のみ保持" : "Keep only recent edges",
        },
        {
          label: isJa ? "減衰 (Decay)" : "Decay",
          desc: isJa ? "古い辺の重みを減少" : "Decrease old edge weights",
        },
      ],
      color: "#10b981",
    },
    {
      axis: isJa ? "コミュニティーの性質" : "Community Properties",
      options: [
        {
          label: isJa ? "排他的" : "Disjoint",
          desc: isJa ? "各ノードは高々 1 つに所属" : "Each node in at most one community",
        },
        {
          label: isJa ? "重複" : "Overlapping",
          desc: isJa ? "複数コミュニティーに所属可" : "Node in multiple communities",
        },
        {
          label: isJa ? "ファジー" : "Fuzzy",
          desc: isJa ? "所属度が連続値" : "Continuous membership degree",
        },
      ],
      color: "#f59e0b",
    },
    {
      axis: isJa ? "品質基準" : "Quality Criterion",
      options: [
        {
          label: "Modularity",
          desc: isJa ? "辺密度 vs 帰無モデル" : "Edge density vs null model",
        },
        {
          label: isJa ? "統計検定" : "Statistical Test",
          desc: isJa ? "有意性に基づく" : "Significance-based",
        },
        {
          label: isJa ? "三角形密度" : "Triangle Density",
          desc: isJa ? "三角形の共有で定義（TILES）" : "Shared triangles define communities (TILES)",
        },
        {
          label: isJa ? "情報理論" : "Information-theoretic",
          desc: isJa ? "Map Equation など" : "e.g., Map Equation",
        },
      ],
      color: "#8b5cf6",
    },
  ];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ストリーミング CD の設計空間"
          : "Design Space of Streaming CD"
      }
      description={
        isJa
          ? "ストリーミング CD の設計を、おおむね独立に選べる 4 つの次元で整理した図"
          : "Streaming CD design organized along four dimensions that can be chosen largely independently"
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dimensions.map((dim, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 border-neutral-200 dark:border-neutral-700"
          >
            <h4
              className="mb-2 text-sm font-bold"
              style={{ color: dim.color }}
            >
              {dim.axis}
            </h4>
            <div className="space-y-1">
              {dim.options.map((opt, j) => (
                <div key={j} className="flex items-baseline gap-2">
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dim.color, display: "inline-block" }}
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {opt.label}
                    </span>
                    <span className="ml-1 text-xs text-neutral-500">
                      — {opt.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── TILES Algorithm Diagram ─────────────────────────────────

export function TILESProcessDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  const steps = [
    {
      icon: "📨",
      label: isJa ? "辺 (u, v) が到着" : "Edge (u, v) arrives",
      desc: isJa
        ? "タイムスタンプ付きの辺がストリームから到着"
        : "A timestamped edge arrives from the stream",
    },
    {
      icon: "🔺",
      label: isJa ? "三角形チェック" : "Triangle check",
      desc: isJa
        ? "u と v の共通近傍 w を探索。三角形 (u, v, w) が存在するか？"
        : "Search for a common neighbor w. Does triangle (u, v, w) exist?",
    },
    {
      icon: "🏠",
      label: isJa ? "コミュニティー更新" : "Community update",
      desc: isJa
        ? "三角形ができたら、u, v, w のうち 2 ノードが共有するコミュニティーに 3 ノードを加える。該当がなければ新しいコミュニティーを作成"
        : "If a triangle forms, add u, v, w to each community shared by two of them; if there is none, create a new community",
    },
    {
      icon: "⏳",
      label: isJa ? "TTL チェック" : "TTL check",
      desc: isJa
        ? "辺の TTL（生存時間）を確認。期限切れの辺を除去し、影響を受けるコミュニティーを再評価"
        : "Check each edge's TTL (time-to-live). Remove expired edges and re-evaluate the affected communities",
    },
    {
      icon: "📤",
      label: isJa ? "結果を出力" : "Emit result",
      desc: isJa
        ? "現在のコミュニティー構造を出力（随時更新）"
        : "Output the current community structure (updated continuously)",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "TILES の処理フロー" : "TILES Processing Flow"}
      description={
        isJa
          ? "辺が 1 本到着するたびに実行される TILES の処理パイプライン"
          : "TILES processing pipeline executed for each arriving edge"
      }
    >
      <div className="flex flex-col items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="w-full max-w-md">
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-800">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {i + 1}. {s.label}
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  {s.desc}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center">
                <span className="text-neutral-400">↓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

// ── Delta-Screening Diagram ─────────────────────────────────

export function DeltaScreeningDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={
        isJa
          ? "delta-screening Louvain の動作原理"
          : "Delta-screening Louvain Mechanism"
      }
      description={
        isJa
          ? "辺の変更で Modularity 利得が変わりうるノードを先に絞り込み、そのノードだけに Louvain の局所移動を適用する"
          : "Screen for nodes whose Modularity gain may change after an edge update, then apply Louvain's local moves only to those nodes"
      }
    >
      <svg
        viewBox="0 0 400 160"
        className="mx-auto w-full max-w-xl"
        style={{ background: "transparent" }}
      >
        {/* Left: full graph with highlighted change region */}
        <text
          x={100}
          y={15}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          className="fill-neutral-800 dark:fill-neutral-200"
        >
          {isJa ? "ステップ 1: スクリーニング" : "Step 1: Screening"}
        </text>
        {/* Cluster 1 */}
        <circle cx={40} cy={60} r={8} fill="#3b82f6" opacity={0.3} />
        <circle cx={60} cy={45} r={8} fill="#3b82f6" opacity={0.3} />
        <circle cx={60} cy={75} r={8} fill="#3b82f6" opacity={0.3} />
        <line x1={40} y1={60} x2={60} y2={45} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
        <line x1={40} y1={60} x2={60} y2={75} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
        <line x1={60} y1={45} x2={60} y2={75} stroke="#3b82f6" strokeWidth={1} opacity={0.3} />
        {/* Cluster 2 */}
        <circle cx={130} cy={55} r={8} fill="#ef4444" opacity={0.3} />
        <circle cx={150} cy={40} r={8} fill="#ef4444" opacity={0.3} />
        <circle cx={150} cy={70} r={8} fill="#ef4444" opacity={0.3} />
        <line x1={130} y1={55} x2={150} y2={40} stroke="#ef4444" strokeWidth={1} opacity={0.3} />
        <line x1={130} y1={55} x2={150} y2={70} stroke="#ef4444" strokeWidth={1} opacity={0.3} />
        <line x1={150} y1={40} x2={150} y2={70} stroke="#ef4444" strokeWidth={1} opacity={0.3} />
        {/* New edge (bridge) */}
        <line
          x1={60}
          y1={75}
          x2={130}
          y2={55}
          stroke="#10b981"
          strokeWidth={2.5}
          strokeDasharray="5,3"
        />
        <text x={95} y={58} textAnchor="middle" fontSize={7} fill="#10b981" fontWeight="bold">
          {isJa ? "新しい辺" : "new edge"}
        </text>
        {/* Affected zone */}
        <ellipse
          cx={95}
          cy={65}
          rx={55}
          ry={30}
          fill="#f59e0b"
          fillOpacity={0.1}
          stroke="#f59e0b"
          strokeWidth={1}
          strokeDasharray="3,2"
        />
        <text x={95} y={105} textAnchor="middle" fontSize={8} fill="#f59e0b">
          {isJa ? "影響範囲" : "Affected zone"}
        </text>

        {/* Arrow */}
        <line x1={185} y1={60} x2={210} y2={60} stroke="#6b7280" strokeWidth={1.5} markerEnd="url(#arr)" />

        {/* Right: only affected nodes recomputed */}
        <text
          x={310}
          y={15}
          textAnchor="middle"
          fontSize={10}
          fontWeight="bold"
          className="fill-neutral-800 dark:fill-neutral-200"
        >
          {isJa ? "ステップ 2: 局所的に Louvain 再実行" : "Step 2: Local Louvain Re-run"}
        </text>
        {/* Unaffected nodes (dimmed) */}
        <circle cx={240} cy={60} r={7} fill="#3b82f6" opacity={0.15} />
        <circle cx={260} cy={45} r={7} fill="#3b82f6" opacity={0.15} />
        {/* Affected nodes (highlighted) */}
        <circle cx={260} cy={75} r={8} fill="#3b82f6" stroke="#f59e0b" strokeWidth={2} />
        <circle cx={330} cy={55} r={8} fill="#ef4444" stroke="#f59e0b" strokeWidth={2} />
        <circle cx={350} cy={40} r={7} fill="#ef4444" opacity={0.15} />
        <circle cx={350} cy={70} r={7} fill="#ef4444" opacity={0.15} />
        {/* Bridge */}
        <line x1={260} y1={75} x2={330} y2={55} stroke="#10b981" strokeWidth={2} />
        {/* Internal edges (dimmed) */}
        <line x1={240} y1={60} x2={260} y2={45} stroke="#3b82f6" strokeWidth={0.7} opacity={0.2} />
        <line x1={240} y1={60} x2={260} y2={75} stroke="#3b82f6" strokeWidth={0.7} opacity={0.2} />
        <line x1={330} y1={55} x2={350} y2={40} stroke="#ef4444" strokeWidth={0.7} opacity={0.2} />
        <line x1={330} y1={55} x2={350} y2={70} stroke="#ef4444" strokeWidth={0.7} opacity={0.2} />

        <text x={310} y={105} textAnchor="middle" fontSize={8} fill="#f59e0b">
          {isJa ? "黄枠のノードのみ再評価" : "Only outlined nodes are re-evaluated"}
        </text>

        {/* Savings text */}
        <text
          x={200}
          y={140}
          textAnchor="middle"
          fontSize={9}
          fontWeight="bold"
          fill="#10b981"
        >
          {isJa
            ? "→ 大部分のノードをスキップ。全体の再実行より最大 38 倍高速（報告値）"
            : "→ Most nodes skipped: up to 38× faster than full reruns (reported)"}
        </text>

        <defs>
          <marker id="arr" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6" fill="#6b7280" />
          </marker>
        </defs>
      </svg>
    </InteractiveDemo>
  );
}
