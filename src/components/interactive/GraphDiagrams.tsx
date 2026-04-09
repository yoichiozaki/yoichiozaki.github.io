"use client";

import { InteractiveDemo } from "@/components/interactive";

type DiagramProps = { locale?: string };

/* ══════════════════════════════════════════════════
   1. Graph Representation Diagram
   ══════════════════════════════════════════════════ */

export function GraphRepresentationDiagram({ locale = "ja" }: DiagramProps) {
  const adjList: Record<string, string[]> = {
    A: ["B", "C"],
    B: ["A", "C", "D"],
    C: ["A", "B", "D"],
    D: ["B", "C"],
  };
  const nodes = ["A", "B", "C", "D"];
  const matrix = [
    [0, 1, 1, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [0, 1, 1, 0],
  ];

  return (
    <InteractiveDemo
      title={
        locale === "ja"
          ? "グラフの表現方法 — 隣接リスト vs 隣接行列"
          : "Graph Representation — Adjacency List vs Matrix"
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Adjacency List */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {locale === "ja" ? "隣接リスト" : "Adjacency List"}
          </h4>
          <div className="space-y-1.5">
            {Object.entries(adjList).map(([node, neighbors]) => (
              <div key={node} className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono font-bold text-sm border border-blue-400">
                  {node}
                </span>
                <span className="text-muted-foreground">→</span>
                <div className="flex gap-1">
                  {neighbors.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center justify-center w-7 h-7 rounded bg-muted text-foreground font-mono text-xs border border-border"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>
              {locale === "ja"
                ? "空間計算量: O(V + E)"
                : "Space: O(V + E)"}
            </p>
            <p>
              {locale === "ja"
                ? "辺の存在確認: O(degree)"
                : "Edge lookup: O(degree)"}
            </p>
            <p>
              {locale === "ja"
                ? "✅ 疎グラフに最適"
                : "✅ Best for sparse graphs"}
            </p>
          </div>
        </div>

        {/* Adjacency Matrix */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {locale === "ja" ? "隣接行列" : "Adjacency Matrix"}
          </h4>
          <table className="text-sm text-center border-collapse">
            <thead>
              <tr>
                <th className="w-8 h-8" />
                {nodes.map((n) => (
                  <th
                    key={n}
                    className="w-8 h-8 font-mono text-blue-600 dark:text-blue-400 font-bold"
                  >
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((row, i) => (
                <tr key={row}>
                  <td className="w-8 h-8 font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {row}
                  </td>
                  {matrix[i].map((val, j) => (
                    <td
                      key={j}
                      className={`w-8 h-8 font-mono ${
                        val === 1
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>
              {locale === "ja"
                ? "空間計算量: O(V²)"
                : "Space: O(V²)"}
            </p>
            <p>
              {locale === "ja"
                ? "辺の存在確認: O(1)"
                : "Edge lookup: O(1)"}
            </p>
            <p>
              {locale === "ja"
                ? "✅ 密グラフに最適"
                : "✅ Best for dense graphs"}
            </p>
          </div>
        </div>
      </div>
    </InteractiveDemo>
  );
}

/* ══════════════════════════════════════════════════
   2. Traversal Comparison Table
   ══════════════════════════════════════════════════ */

export function TraversalComparisonTable({ locale = "ja" }: DiagramProps) {
  const rows =
    locale === "ja"
      ? [
          {
            aspect: "データ構造",
            bfs: "キュー（FIFO）",
            dfs: "スタック / 再帰（LIFO）",
          },
          {
            aspect: "探索の順序",
            bfs: "近い頂点から順に（レベル順）",
            dfs: "深く潜れるところまで先に",
          },
          {
            aspect: "最短経路",
            bfs: "✅ 無重みグラフで保証",
            dfs: "❌ 保証しない",
          },
          {
            aspect: "メモリ使用量",
            bfs: "O(V) — 幅が広いと大量に",
            dfs: "O(V) — 深さ分のスタック",
          },
          {
            aspect: "計算量",
            bfs: "O(V + E)",
            dfs: "O(V + E)",
          },
          {
            aspect: "代表的な用途",
            bfs: "最短経路、レベル探索、ネットワーク解析",
            dfs: "サイクル検出、トポロジカルソート、迷路生成",
          },
          {
            aspect: "直感的イメージ",
            bfs: "水面の波紋 🌊",
            dfs: "迷路を突き進む 🏃",
          },
        ]
      : [
          {
            aspect: "Data Structure",
            bfs: "Queue (FIFO)",
            dfs: "Stack / Recursion (LIFO)",
          },
          {
            aspect: "Traversal Order",
            bfs: "Level by level (breadth first)",
            dfs: "As deep as possible first",
          },
          {
            aspect: "Shortest Path",
            bfs: "✅ Guaranteed (unweighted)",
            dfs: "❌ Not guaranteed",
          },
          {
            aspect: "Memory",
            bfs: "O(V) — can be large for wide graphs",
            dfs: "O(V) — proportional to depth",
          },
          {
            aspect: "Time Complexity",
            bfs: "O(V + E)",
            dfs: "O(V + E)",
          },
          {
            aspect: "Typical Uses",
            bfs: "Shortest path, level traversal, network analysis",
            dfs: "Cycle detection, topological sort, maze generation",
          },
          {
            aspect: "Intuition",
            bfs: "Ripples on water 🌊",
            dfs: "Exploring a maze 🏃",
          },
        ];

  return (
    <InteractiveDemo
      title={
        locale === "ja" ? "BFS vs DFS 比較" : "BFS vs DFS Comparison"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                {locale === "ja" ? "観点" : "Aspect"}
              </th>
              <th className="text-left py-2 px-3 text-blue-600 dark:text-blue-400 font-semibold">
                BFS
              </th>
              <th className="text-left py-2 px-3 text-purple-600 dark:text-purple-400 font-semibold">
                DFS
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.aspect} className="border-b border-border/50">
                <td className="py-2 px-3 text-muted-foreground font-medium">
                  {row.aspect}
                </td>
                <td className="py-2 px-3">{row.bfs}</td>
                <td className="py-2 px-3">{row.dfs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

/* ══════════════════════════════════════════════════
   3. Traversal Applications Diagram
   ══════════════════════════════════════════════════ */

export function TraversalApplicationsDiagram({ locale = "ja" }: DiagramProps) {
  const apps =
    locale === "ja"
      ? [
          {
            icon: "🗺️",
            title: "最短経路探索",
            desc: "カーナビ、ゲームAI のパスファインディング",
            algo: "BFS / Dijkstra / A*",
            color: "blue",
          },
          {
            icon: "🔄",
            title: "サイクル検出",
            desc: "デッドロック検出、依存関係の循環チェック",
            algo: "DFS",
            color: "purple",
          },
          {
            icon: "📦",
            title: "トポロジカルソート",
            desc: "ビルドシステムのタスク順序決定、コンパイル順序",
            algo: "DFS",
            color: "purple",
          },
          {
            icon: "🌐",
            title: "連結成分",
            desc: "SNS の友達グループ検出、ネットワーク分割",
            algo: "BFS / DFS",
            color: "green",
          },
          {
            icon: "🌳",
            title: "全域木",
            desc: "ネットワーク設計、最小コスト接続",
            algo: "BFS / DFS + Kruskal/Prim",
            color: "green",
          },
          {
            icon: "🧩",
            title: "二部グラフ判定",
            desc: "マッチング問題、スケジューリング",
            algo: "BFS",
            color: "blue",
          },
        ]
      : [
          {
            icon: "🗺️",
            title: "Shortest Path",
            desc: "GPS navigation, game AI pathfinding",
            algo: "BFS / Dijkstra / A*",
            color: "blue",
          },
          {
            icon: "🔄",
            title: "Cycle Detection",
            desc: "Deadlock detection, dependency cycle checking",
            algo: "DFS",
            color: "purple",
          },
          {
            icon: "📦",
            title: "Topological Sort",
            desc: "Build systems, compilation order",
            algo: "DFS",
            color: "purple",
          },
          {
            icon: "🌐",
            title: "Connected Components",
            desc: "Social network clusters, network partitioning",
            algo: "BFS / DFS",
            color: "green",
          },
          {
            icon: "🌳",
            title: "Spanning Tree",
            desc: "Network design, minimum-cost connectivity",
            algo: "BFS / DFS + Kruskal/Prim",
            color: "green",
          },
          {
            icon: "🧩",
            title: "Bipartiteness Testing",
            desc: "Matching problems, scheduling",
            algo: "BFS",
            color: "blue",
          },
        ];

  const colorMap: Record<string, string> = {
    blue: "border-blue-400 bg-blue-50 dark:bg-blue-950/40",
    purple: "border-purple-400 bg-purple-50 dark:bg-purple-950/40",
    green: "border-green-400 bg-green-50 dark:bg-green-950/40",
  };

  return (
    <InteractiveDemo
      title={
        locale === "ja"
          ? "グラフ探索の応用例"
          : "Graph Traversal Applications"
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {apps.map((app) => (
          <div
            key={app.title}
            className={`rounded-lg border p-3 ${colorMap[app.color]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{app.icon}</span>
              <span className="font-semibold text-sm text-foreground">
                {app.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{app.desc}</p>
            <span className="inline-block text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {app.algo}
            </span>
          </div>
        ))}
      </div>
    </InteractiveDemo>
  );
}

/* ══════════════════════════════════════════════════
   4. Complexity Comparison
   ══════════════════════════════════════════════════ */

export function GraphComplexityTable({ locale = "ja" }: DiagramProps) {
  const rows =
    locale === "ja"
      ? [
          {
            algo: "BFS",
            time: "O(V + E)",
            space: "O(V)",
            note: "全頂点+全辺を1回ずつ処理",
          },
          {
            algo: "DFS",
            time: "O(V + E)",
            space: "O(V)",
            note: "再帰の深さは最大V",
          },
          {
            algo: "Dijkstra (二分ヒープ)",
            time: "O((V + E) log V)",
            space: "O(V)",
            note: "ヒープ操作が log V",
          },
          {
            algo: "Dijkstra (フィボナッチヒープ)",
            time: "O(V log V + E)",
            space: "O(V)",
            note: "理論的に最速だが実装が複雑",
          },
          {
            algo: "Bellman-Ford",
            time: "O(VE)",
            space: "O(V)",
            note: "負の辺に対応。V-1回の緩和",
          },
        ]
      : [
          {
            algo: "BFS",
            time: "O(V + E)",
            space: "O(V)",
            note: "Processes each vertex and edge once",
          },
          {
            algo: "DFS",
            time: "O(V + E)",
            space: "O(V)",
            note: "Recursion depth up to V",
          },
          {
            algo: "Dijkstra (binary heap)",
            time: "O((V + E) log V)",
            space: "O(V)",
            note: "Heap operations cost log V",
          },
          {
            algo: "Dijkstra (Fibonacci heap)",
            time: "O(V log V + E)",
            space: "O(V)",
            note: "Theoretically fastest but complex",
          },
          {
            algo: "Bellman-Ford",
            time: "O(VE)",
            space: "O(V)",
            note: "Handles negative edges; V-1 relaxation rounds",
          },
        ];

  return (
    <InteractiveDemo
      title={
        locale === "ja"
          ? "計算量の比較"
          : "Complexity Comparison"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground">
                {locale === "ja" ? "アルゴリズム" : "Algorithm"}
              </th>
              <th className="text-left py-2 px-3 text-muted-foreground">
                {locale === "ja" ? "時間" : "Time"}
              </th>
              <th className="text-left py-2 px-3 text-muted-foreground">
                {locale === "ja" ? "空間" : "Space"}
              </th>
              <th className="text-left py-2 px-3 text-muted-foreground">
                {locale === "ja" ? "備考" : "Note"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.algo} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium">{r.algo}</td>
                <td className="py-2 px-3 font-mono text-xs">{r.time}</td>
                <td className="py-2 px-3 font-mono text-xs">{r.space}</td>
                <td className="py-2 px-3 text-xs text-muted-foreground">
                  {r.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}
