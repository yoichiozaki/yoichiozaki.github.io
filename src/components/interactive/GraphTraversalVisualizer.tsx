"use client";

import { useState, useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type GraphTraversalVisualizerProps = { locale?: string };

/* ── Graph definition ─────────────────────────── */

type NodeId = "A" | "B" | "C" | "D" | "E" | "F";

const nodePositions: Record<NodeId, { x: number; y: number }> = {
  A: { x: 80, y: 60 },
  B: { x: 240, y: 60 },
  C: { x: 80, y: 200 },
  D: { x: 240, y: 200 },
  E: { x: 400, y: 60 },
  F: { x: 400, y: 200 },
};

const edges: [NodeId, NodeId][] = [
  ["A", "B"],
  ["A", "C"],
  ["B", "C"],
  ["B", "D"],
  ["B", "E"],
  ["C", "D"],
  ["D", "F"],
  ["E", "F"],
];

const adjacencyList: Record<NodeId, NodeId[]> = {
  A: ["B", "C"],
  B: ["A", "C", "D", "E"],
  C: ["A", "B", "D"],
  D: ["B", "C", "F"],
  E: ["B", "F"],
  F: ["D", "E"],
};

/* ── Step types ───────────────────────────────── */

type NodeState = "unvisited" | "queued" | "current" | "visited";

type TraversalStep = {
  nodeStates: Record<NodeId, NodeState>;
  highlightEdge?: [NodeId, NodeId];
  dataStructure: NodeId[]; // queue (BFS) or stack (DFS)
  visitOrder: NodeId[];
  callStack?: NodeId[]; // DFS recursion stack
  description: { ja: string; en: string };
};

/* ── BFS Steps ────────────────────────────────── */

function generateBFSSteps(): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const init: Record<NodeId, NodeState> = {
    A: "unvisited",
    B: "unvisited",
    C: "unvisited",
    D: "unvisited",
    E: "unvisited",
    F: "unvisited",
  };

  // Step 0: Initial state
  steps.push({
    nodeStates: { ...init },
    dataStructure: [],
    visitOrder: [],
    description: {
      ja: "BFS（幅優先探索）を頂点 A から開始します。キューを使って「近い頂点から順に」探索します。水面に石を落としたときの波紋のように、同心円状に広がっていくイメージです。",
      en: "Starting BFS (Breadth-First Search) from vertex A. Using a queue to explore vertices level by level — like ripples spreading outward from where a stone hits water.",
    },
  });

  // Step 1: Enqueue A
  steps.push({
    nodeStates: { ...init, A: "queued" },
    dataStructure: ["A"],
    visitOrder: [],
    description: {
      ja: "始点 A をキューに追加します。キュー: [A]。BFS ではキュー（先入れ先出し: FIFO）を使うのがポイントです。",
      en: "Enqueue the starting vertex A. Queue: [A]. The key insight of BFS is using a queue (First-In-First-Out).",
    },
  });

  // Step 2: Dequeue A, visit A
  steps.push({
    nodeStates: { ...init, A: "current" },
    dataStructure: [],
    visitOrder: ["A"],
    description: {
      ja: "キューから A を取り出して訪問します。A の隣接頂点 [B, C] を確認して、未訪問のものをキューに追加していきます。",
      en: "Dequeue A and visit it. Check A's neighbors [B, C] and enqueue any unvisited ones.",
    },
  });

  // Step 3: Enqueue B, C (neighbors of A)
  steps.push({
    nodeStates: { ...init, A: "visited", B: "queued", C: "queued" },
    highlightEdge: ["A", "B"],
    dataStructure: ["B", "C"],
    visitOrder: ["A"],
    description: {
      ja: "A の隣接頂点 B, C をキューに追加。キュー: [B, C]。これが「距離1」の頂点たちです。A は訪問済みになります。",
      en: "Enqueue A's neighbors B and C. Queue: [B, C]. These are all vertices at distance 1 from A. A is now fully visited.",
    },
  });

  // Step 4: Dequeue B, visit B
  steps.push({
    nodeStates: { ...init, A: "visited", B: "current", C: "queued" },
    dataStructure: ["C"],
    visitOrder: ["A", "B"],
    description: {
      ja: "キューの先頭から B を取り出して訪問。B の隣接頂点は [A, C, D, E]。このうち A は訪問済み、C はキューに入っているので、D と E を追加します。",
      en: "Dequeue B (front of queue) and visit it. B's neighbors are [A, C, D, E]. A is visited and C is already queued, so enqueue D and E.",
    },
  });

  // Step 5: Enqueue D, E (new neighbors of B)
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "queued",
      D: "queued",
      E: "queued",
    },
    highlightEdge: ["B", "D"],
    dataStructure: ["C", "D", "E"],
    visitOrder: ["A", "B"],
    description: {
      ja: "D, E をキューに追加。キュー: [C, D, E]。大事なポイント: C は B より先にキューにいるので、B の「子」である D, E より先に処理されます。これが「幅優先」の本質です。",
      en: "Enqueue D and E. Queue: [C, D, E]. Key insight: C was enqueued before D and E, so it will be processed first. This is the essence of 'breadth-first' — older entries go first.",
    },
  });

  // Step 6: Dequeue C, visit C
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "current",
      D: "queued",
      E: "queued",
    },
    dataStructure: ["D", "E"],
    visitOrder: ["A", "B", "C"],
    description: {
      ja: "キューの先頭 C を取り出して訪問。C の隣接頂点 [A, B, D] はすべて訪問済みまたはキュー内なので、新しい追加はありません。",
      en: "Dequeue C and visit it. C's neighbors [A, B, D] are all either visited or already in the queue — nothing new to add.",
    },
  });

  // Step 7: C done
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "queued",
      E: "queued",
    },
    dataStructure: ["D", "E"],
    visitOrder: ["A", "B", "C"],
    description: {
      ja: "C 完了。キュー: [D, E]。ここまでで距離1の頂点をすべて訪問しました。次は距離2の頂点たちです。",
      en: "C is done. Queue: [D, E]. We've now visited all vertices at distance 1. Next up: distance-2 vertices.",
    },
  });

  // Step 8: Dequeue D, visit D
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "current",
      E: "queued",
    },
    dataStructure: ["E"],
    visitOrder: ["A", "B", "C", "D"],
    description: {
      ja: "D を取り出して訪問。D の隣接頂点 [B, C, F] のうち、F だけが未訪問です。",
      en: "Dequeue D and visit it. Among D's neighbors [B, C, F], only F is unvisited.",
    },
  });

  // Step 9: Enqueue F
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "queued",
      F: "queued",
    },
    highlightEdge: ["D", "F"],
    dataStructure: ["E", "F"],
    visitOrder: ["A", "B", "C", "D"],
    description: {
      ja: "F をキューに追加。キュー: [E, F]。E は D より先にキューにいるので、先に処理されます。",
      en: "Enqueue F. Queue: [E, F]. E was enqueued before F, so it will be processed first.",
    },
  });

  // Step 10: Dequeue E, visit E
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "current",
      F: "queued",
    },
    dataStructure: ["F"],
    visitOrder: ["A", "B", "C", "D", "E"],
    description: {
      ja: "E を取り出して訪問。E の隣接頂点 [B, F] はすべて処理済み。",
      en: "Dequeue E and visit it. E's neighbors [B, F] are all processed.",
    },
  });

  // Step 11: E done
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "queued",
    },
    dataStructure: ["F"],
    visitOrder: ["A", "B", "C", "D", "E"],
    description: {
      ja: "E 完了。キュー: [F]。残り1頂点。",
      en: "E is done. Queue: [F]. One vertex remaining.",
    },
  });

  // Step 12: Dequeue F, visit F
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "current",
    },
    dataStructure: [],
    visitOrder: ["A", "B", "C", "D", "E", "F"],
    description: {
      ja: "F を取り出して訪問。F の隣接頂点 [D, E] はすべて訪問済み。キューが空になりました。",
      en: "Dequeue F and visit it. F's neighbors [D, E] are all visited. The queue is now empty.",
    },
  });

  // Step 13: Complete
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "visited",
    },
    dataStructure: [],
    visitOrder: ["A", "B", "C", "D", "E", "F"],
    description: {
      ja: "BFS 完了！ 訪問順序: A → B → C → D → E → F。同じ距離の頂点をまとめて処理してから、次の距離に進んでいきました。BFS が最短経路を保証するのは、このレベルごとの探索のおかげです。",
      en: "BFS complete! Visit order: A → B → C → D → E → F. We processed all vertices at each distance level before moving to the next. This level-by-level exploration is why BFS guarantees the shortest path in unweighted graphs.",
    },
  });

  return steps;
}

/* ── DFS Steps ────────────────────────────────── */

function generateDFSSteps(): TraversalStep[] {
  const steps: TraversalStep[] = [];
  const init: Record<NodeId, NodeState> = {
    A: "unvisited",
    B: "unvisited",
    C: "unvisited",
    D: "unvisited",
    E: "unvisited",
    F: "unvisited",
  };

  // Step 0: Initial
  steps.push({
    nodeStates: { ...init },
    dataStructure: [],
    callStack: [],
    visitOrder: [],
    description: {
      ja: "DFS（深さ優先探索）を頂点 A から開始します。再帰（コールスタック）を使って「行けるところまで深く」探索します。迷路で壁にぶつかるまでまっすぐ進み、行き止まりで引き返すイメージです。",
      en: "Starting DFS (Depth-First Search) from vertex A. Using recursion (call stack) to explore as deeply as possible. Think of navigating a maze — go straight until you hit a dead end, then backtrack.",
    },
  });

  // Step 1: Call dfs(A)
  steps.push({
    nodeStates: { ...init, A: "current" },
    dataStructure: ["A"],
    callStack: ["A"],
    visitOrder: ["A"],
    description: {
      ja: "dfs(A) を呼び出し、A を訪問。A の隣接頂点は [B, C]。最初の未訪問隣接頂点 B へ再帰します。",
      en: "Call dfs(A), visit A. A's neighbors are [B, C]. Recurse into the first unvisited neighbor B.",
    },
  });

  // Step 2: Call dfs(B)
  steps.push({
    nodeStates: { ...init, A: "visited", B: "current" },
    highlightEdge: ["A", "B"],
    dataStructure: ["A", "B"],
    callStack: ["A", "B"],
    visitOrder: ["A", "B"],
    description: {
      ja: "dfs(B) を呼び出し、B を訪問。コールスタック: [A, B]。B の隣接頂点は [A, C, D, E]。A は訪問済みなので、次の未訪問隣接頂点 C へ。",
      en: "Call dfs(B), visit B. Call stack: [A, B]. B's neighbors are [A, C, D, E]. A is visited, so recurse into C.",
    },
  });

  // Step 3: Call dfs(C)
  steps.push({
    nodeStates: { ...init, A: "visited", B: "visited", C: "current" },
    highlightEdge: ["B", "C"],
    dataStructure: ["A", "B", "C"],
    callStack: ["A", "B", "C"],
    visitOrder: ["A", "B", "C"],
    description: {
      ja: "dfs(C) を呼び出し、C を訪問。コールスタック: [A, B, C]。C の隣接頂点は [A, B, D]。A, B は訪問済みなので D へ。どんどん深く潜っています！",
      en: "Call dfs(C), visit C. Call stack: [A, B, C]. C's neighbors are [A, B, D]. A and B are visited, so recurse into D. We keep going deeper!",
    },
  });

  // Step 4: Call dfs(D)
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "current",
    },
    highlightEdge: ["C", "D"],
    dataStructure: ["A", "B", "C", "D"],
    callStack: ["A", "B", "C", "D"],
    visitOrder: ["A", "B", "C", "D"],
    description: {
      ja: "dfs(D) を呼び出し、D を訪問。コールスタック: [A, B, C, D]（深さ4！）。D の隣接頂点 [B, C, F] のうち、F だけが未訪問。",
      en: "Call dfs(D), visit D. Call stack: [A, B, C, D] (depth 4!). Among D's neighbors [B, C, F], only F is unvisited.",
    },
  });

  // Step 5: Call dfs(F)
  steps.push({
    nodeStates: {
      ...init,
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      F: "current",
    },
    highlightEdge: ["D", "F"],
    dataStructure: ["A", "B", "C", "D", "F"],
    callStack: ["A", "B", "C", "D", "F"],
    visitOrder: ["A", "B", "C", "D", "F"],
    description: {
      ja: "dfs(F) を呼び出し、F を訪問。コールスタック: [A, B, C, D, F]。F の隣接頂点 [D, E] のうち、E だけが未訪問。",
      en: "Call dfs(F), visit F. Call stack: [A, B, C, D, F]. Among F's neighbors [D, E], only E is unvisited.",
    },
  });

  // Step 6: Call dfs(E)
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "current",
      F: "visited",
    },
    highlightEdge: ["F", "E"],
    dataStructure: ["A", "B", "C", "D", "F", "E"],
    callStack: ["A", "B", "C", "D", "F", "E"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(E) を呼び出し、E を訪問。E の隣接頂点 [B, F] はすべて訪問済み。ここが「最深部」— 行き止まりです！ここからバックトラック（巻き戻し）が始まります。",
      en: "Call dfs(E), visit E. E's neighbors [B, F] are all visited. This is the deepest point — a dead end! Backtracking begins here.",
    },
  });

  // Step 7: Return from dfs(E) back to dfs(F)
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "current",
    },
    dataStructure: ["A", "B", "C", "D", "F"],
    callStack: ["A", "B", "C", "D", "F"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(E) から dfs(F) に戻ります。F の未訪問隣接頂点はもうありません。さらに戻ります。",
      en: "Return from dfs(E) to dfs(F). F has no more unvisited neighbors. Continue backtracking.",
    },
  });

  // Step 8: Return from dfs(F) back to dfs(D)
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "visited",
      D: "current",
      E: "visited",
      F: "visited",
    },
    dataStructure: ["A", "B", "C", "D"],
    callStack: ["A", "B", "C", "D"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(D) に戻る。D の未訪問隣接頂点もなし。さらに戻ります。",
      en: "Return to dfs(D). D has no more unvisited neighbors. Continue backtracking.",
    },
  });

  // Step 9: Return to dfs(C)
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "current",
      D: "visited",
      E: "visited",
      F: "visited",
    },
    dataStructure: ["A", "B", "C"],
    callStack: ["A", "B", "C"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(C) に戻る。C の未訪問隣接頂点もなし。再帰が巻き戻っています。",
      en: "Return to dfs(C). No unvisited neighbors left. The recursion keeps unwinding.",
    },
  });

  // Step 10: Return to dfs(B)
  steps.push({
    nodeStates: {
      A: "visited",
      B: "current",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "visited",
    },
    dataStructure: ["A", "B"],
    callStack: ["A", "B"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(B) に戻る。B の隣接頂点 [A, C, D, E] はすべて訪問済み。B からの探索も完了です。",
      en: "Return to dfs(B). B's neighbors [A, C, D, E] are all visited. B's exploration is complete.",
    },
  });

  // Step 11: Return to dfs(A)
  steps.push({
    nodeStates: {
      A: "current",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "visited",
    },
    dataStructure: ["A"],
    callStack: ["A"],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "dfs(A) に戻る。A の隣接頂点 C は訪問済み（B 側からすでに到達済み）。すべての頂点を訪問できたのでここで終了。",
      en: "Return to dfs(A). A's other neighbor C is already visited (reached via B's path). All vertices explored — done!",
    },
  });

  // Step 12: Complete
  steps.push({
    nodeStates: {
      A: "visited",
      B: "visited",
      C: "visited",
      D: "visited",
      E: "visited",
      F: "visited",
    },
    dataStructure: [],
    callStack: [],
    visitOrder: ["A", "B", "C", "D", "F", "E"],
    description: {
      ja: "DFS 完了！ 訪問順序: A → B → C → D → F → E。BFS (A→B→C→D→E→F) と比べてみてください。DFS はまず A→B→C→D→F→E と一本道を深く進み、行き止まりで引き返しています。この「深く潜って戻る」動きがDFS の本質です。",
      en: "DFS complete! Visit order: A → B → C → D → F → E. Compare with BFS (A→B→C→D→E→F). DFS dove deep along A→B→C→D→F→E, backtracking at dead ends. This 'go deep then backtrack' behavior is the essence of DFS.",
    },
  });

  return steps;
}

/* ── Colors ────────────────────────────────────── */

const nodeColors: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  unvisited: { fill: "#f3f4f6", stroke: "#d1d5db", text: "#374151" },
  queued: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e40af" },
  current: { fill: "#fef3c7", stroke: "#f59e0b", text: "#92400e" },
  visited: { fill: "#dcfce7", stroke: "#22c55e", text: "#166534" },
};

const nodeColorsDark: Record<NodeState, { fill: string; stroke: string; text: string }> = {
  unvisited: { fill: "#374151", stroke: "#6b7280", text: "#d1d5db" },
  queued: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
  current: { fill: "#78350f", stroke: "#f59e0b", text: "#fde68a" },
  visited: { fill: "#14532d", stroke: "#22c55e", text: "#86efac" },
};

/* ── Component ────────────────────────────────── */

export function GraphTraversalVisualizer({
  locale = "ja",
}: GraphTraversalVisualizerProps) {
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const bfsSteps = generateBFSSteps();
  const dfsSteps = generateDFSSteps();
  const steps = mode === "bfs" ? bfsSteps : dfsSteps;

  const player = useStepPlayer({
    totalSteps: steps.length,
    intervalMs: 1800,
  });

  const current = steps[player.step];

  const handleModeChange = useCallback(
    (newMode: "bfs" | "dfs") => {
      setMode(newMode);
      player.reset();
    },
    [player],
  );

  const dsLabel =
    mode === "bfs"
      ? locale === "ja"
        ? "キュー (FIFO)"
        : "Queue (FIFO)"
      : locale === "ja"
        ? "コールスタック"
        : "Call Stack";

  return (
    <InteractiveDemo
      title={
        locale === "ja"
          ? "グラフ探索ビジュアライザ — BFS vs DFS"
          : "Graph Traversal Visualizer — BFS vs DFS"
      }
      description={
        locale === "ja"
          ? "同じグラフで BFS と DFS の動きを見比べてみましょう。再生ボタンを押すか、ステップを手動で送ってください。"
          : "Compare how BFS and DFS traverse the same graph. Press play or step manually."
      }
    >
      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleModeChange("bfs")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "bfs"
              ? "bg-blue-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          BFS
        </button>
        <button
          onClick={() => handleModeChange("dfs")}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "dfs"
              ? "bg-purple-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          DFS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Graph SVG */}
        <div className="bg-background rounded-lg border border-border p-2">
          <svg viewBox="0 0 480 260" className="w-full h-auto">
            {/* Edges */}
            {edges.map(([a, b]) => {
              const pa = nodePositions[a];
              const pb = nodePositions[b];
              const hl = current.highlightEdge;
              const isHighlighted =
                hl &&
                ((hl[0] === a && hl[1] === b) ||
                  (hl[0] === b && hl[1] === a));
              return (
                <line
                  key={`${a}-${b}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={isHighlighted ? "#f59e0b" : "currentColor"}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  className={isHighlighted ? "" : "text-border"}
                  strokeDasharray={isHighlighted ? "6 3" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {(Object.keys(nodePositions) as NodeId[]).map((id) => {
              const pos = nodePositions[id];
              const state = current.nodeStates[id];
              const lightC = nodeColors[state];
              const darkC = nodeColorsDark[state];
              return (
                <g key={id}>
                  {/* Light mode */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={lightC.fill}
                    stroke={lightC.stroke}
                    strokeWidth={state === "current" ? 3 : 2}
                    className="dark:hidden"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={16}
                    fontWeight={600}
                    fill={lightC.text}
                    className="dark:hidden"
                  >
                    {id}
                  </text>
                  {/* Dark mode */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={24}
                    fill={darkC.fill}
                    stroke={darkC.stroke}
                    strokeWidth={state === "current" ? 3 : 2}
                    className="hidden dark:block"
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={16}
                    fontWeight={600}
                    fill={darkC.text}
                    className="hidden dark:block"
                  >
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2 px-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600 border border-gray-400" />
              {locale === "ja" ? "未訪問" : "Unvisited"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-200 dark:bg-blue-900 border border-blue-500" />
              {locale === "ja"
                ? mode === "bfs"
                  ? "キュー内"
                  : "スタック内"
                : mode === "bfs"
                  ? "In Queue"
                  : "In Stack"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-amber-200 dark:bg-amber-900 border border-amber-500" />
              {locale === "ja" ? "処理中" : "Current"}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-green-200 dark:bg-green-900 border border-green-500" />
              {locale === "ja" ? "訪問済み" : "Visited"}
            </span>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-3">
          {/* Data structure */}
          <div className="bg-background rounded-lg border border-border p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {dsLabel}
            </div>
            <div className="flex gap-1 min-h-[32px] flex-wrap">
              {current.dataStructure.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  {locale === "ja" ? "（空）" : "(empty)"}
                </span>
              ) : (
                current.dataStructure.map((id, i) => (
                  <span
                    key={`${id}-${i}`}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm font-mono font-bold ${
                      i === 0 && mode === "bfs"
                        ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-2 border-amber-500"
                        : i === current.dataStructure.length - 1 &&
                            mode === "dfs"
                          ? "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-2 border-amber-500"
                          : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-400"
                    }`}
                  >
                    {id}
                  </span>
                ))
              )}
            </div>
            {current.dataStructure.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {mode === "bfs"
                  ? locale === "ja"
                    ? "← 先頭から取り出す（FIFO）"
                    : "← Dequeue from front (FIFO)"
                  : locale === "ja"
                    ? "末尾が現在の再帰先 →"
                    : "Top of stack = current call →"}
              </div>
            )}
          </div>

          {/* Visit order */}
          <div className="bg-background rounded-lg border border-border p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {locale === "ja" ? "訪問順序" : "Visit Order"}
            </div>
            <div className="flex gap-1 min-h-[32px] flex-wrap items-center">
              {current.visitOrder.length === 0 ? (
                <span className="text-xs text-muted-foreground italic">
                  {locale === "ja" ? "（まだなし）" : "(none yet)"}
                </span>
              ) : (
                current.visitOrder.map((id, i) => (
                  <span key={`visit-${id}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <span className="text-muted-foreground text-xs">→</span>
                    )}
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-mono font-bold border border-green-400">
                      {id}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-background rounded-lg border border-border p-3 flex-1">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              {locale === "ja" ? "解説" : "Explanation"}
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {locale === "ja"
                ? current.description.ja
                : current.description.en}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          label={(s) =>
            locale === "ja"
              ? `ステップ ${s}/${steps.length - 1}`
              : `Step ${s}/${steps.length - 1}`
          }
        />
      </div>
    </InteractiveDemo>
  );
}
