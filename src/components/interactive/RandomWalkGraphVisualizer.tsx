"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { InteractiveDemo } from "./InteractiveDemo";

type RandomWalkGraphVisualizerProps = { locale?: string };

// A small graph: 6 nodes with edges
const NODES = [
  { id: 0, label: "A", x: 160, y: 40 },
  { id: 1, label: "B", x: 60, y: 130 },
  { id: 2, label: "C", x: 260, y: 130 },
  { id: 3, label: "D", x: 30, y: 240 },
  { id: 4, label: "E", x: 160, y: 240 },
  { id: 5, label: "F", x: 290, y: 240 },
];

const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 4],
  [4, 5],
];

// Build adjacency list
const ADJ: number[][] = Array.from({ length: NODES.length }, () => []);
for (const [u, v] of EDGES) {
  ADJ[u].push(v);
  ADJ[v].push(u);
}

// Compute degree for each node
const DEGREES = NODES.map((_, i) => ADJ[i].length);
const TOTAL_DEGREE = DEGREES.reduce((s, d) => s + d, 0);
// Stationary distribution: π_i = deg(i) / (2 * |E|)
const STATIONARY = DEGREES.map((d) => d / TOTAL_DEGREE);

const SVG_W = 320;
const SVG_H = 280;
const NODE_R = 22;

export function RandomWalkGraphVisualizer({
  locale = "ja",
}: RandomWalkGraphVisualizerProps) {
  const isJa = locale === "ja";
  const [visitCounts, setVisitCounts] = useState<number[]>(
    () => new Array(NODES.length).fill(0)
  );
  const [currentNode, setCurrentNode] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const doStep = useCallback(() => {
    setCurrentNode((prev) => {
      const neighbors = ADJ[prev];
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      setVisitCounts((counts) => {
        const c = [...counts];
        c[next]++;
        return c;
      });
      setTotalSteps((t) => t + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(doStep, 120);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, doStep, clearTimer]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setVisitCounts(new Array(NODES.length).fill(0));
    setCurrentNode(0);
    setTotalSteps(0);
  }, []);

  // Compute empirical distribution
  const empirical =
    totalSteps > 0
      ? visitCounts.map((c) => c / totalSteps)
      : new Array(NODES.length).fill(0);

  return (
    <InteractiveDemo
      title={
        isJa
          ? "グラフ上のランダムウォーク → 定常分布"
          : "Random Walk on Graph → Stationary Distribution"
      }
      description={
        isJa
          ? "ランダムウォーカーの訪問頻度が定常分布 π_i = deg(i) / 2|E| に収束する様子"
          : "Watch the walker's visit frequency converge to π_i = deg(i) / 2|E|"
      }
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Graph visualization */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full lg:w-1/2 h-auto"
          style={{ maxHeight: 300 }}
        >
          {/* Edges */}
          {EDGES.map(([u, v], i) => (
            <line
              key={i}
              x1={NODES[u].x}
              y1={NODES[u].y}
              x2={NODES[v].x}
              y2={NODES[v].y}
              stroke="currentColor"
              strokeOpacity={0.2}
              strokeWidth={2}
            />
          ))}
          {/* Nodes */}
          {NODES.map((node, i) => {
            const isCurrent = i === currentNode;
            const heat =
              totalSteps > 0
                ? Math.min(1, (visitCounts[i] / totalSteps) * NODES.length)
                : 0;
            return (
              <g key={i}>
                {/* Heat glow */}
                {heat > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_R + 6}
                    fill="rgb(59,130,246)"
                    fillOpacity={heat * 0.3}
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  className={
                    isCurrent
                      ? "fill-accent stroke-accent"
                      : "fill-muted stroke-border"
                  }
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={
                    isCurrent
                      ? "fill-accent-foreground"
                      : "fill-foreground"
                  }
                  fontSize={13}
                  fontWeight={600}
                >
                  {node.label}
                </text>
                {/* Visit count */}
                <text
                  x={node.x}
                  y={node.y + NODE_R + 14}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize={9}
                >
                  {visitCounts[i]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Distribution comparison table */}
        <div className="flex-1 min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-1.5 text-muted-foreground font-medium">
                    {isJa ? "ノード" : "Node"}
                  </th>
                  <th className="text-right py-1 px-1.5 text-muted-foreground font-medium">
                    deg
                  </th>
                  <th className="text-right py-1 px-1.5 text-muted-foreground font-medium">
                    π
                  </th>
                  <th className="text-right py-1 px-1.5 text-muted-foreground font-medium">
                    {isJa ? "実測" : "obs"}
                  </th>
                  <th className="text-right py-1 px-1.5 text-muted-foreground font-medium">
                    {isJa ? "差" : "err"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {NODES.map((node, i) => {
                  const err =
                    totalSteps > 0
                      ? Math.abs(empirical[i] - STATIONARY[i])
                      : 0;
                  return (
                    <tr
                      key={i}
                      className={
                        i === currentNode
                          ? "bg-accent/10"
                          : ""
                      }
                    >
                      <td className="py-1 px-1.5 font-mono font-semibold text-foreground">
                        {node.label}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-foreground">
                        {DEGREES[i]}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-foreground">
                        {STATIONARY[i].toFixed(3)}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-foreground">
                        {totalSteps > 0 ? empirical[i].toFixed(3) : "—"}
                      </td>
                      <td className="py-1 px-1.5 text-right font-mono text-muted-foreground">
                        {totalSteps > 0 ? err.toFixed(3) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {isJa ? "合計ステップ" : "Total steps"}:{" "}
            <span className="font-mono text-foreground">{totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="rounded-md px-3 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm"
        >
          {playing
            ? isJa
              ? "一時停止"
              : "Pause"
            : isJa
              ? "歩かせる"
              : "Walk"}
        </button>
        <button
          onClick={() => {
            if (!playing) doStep();
          }}
          disabled={playing}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
        >
          {isJa ? "1 ステップ" : "1 Step"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isJa ? "リセット" : "Reset"}
        </button>
      </div>
    </InteractiveDemo>
  );
}
