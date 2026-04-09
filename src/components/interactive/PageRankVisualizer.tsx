"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { InteractiveDemo } from "./InteractiveDemo";

type PageRankVisualizerProps = { locale?: string };

// A small web graph: 6 pages
const PAGES = [
  { id: 0, label: "Page A", x: 160, y: 35 },
  { id: 1, label: "Page B", x: 50, y: 120 },
  { id: 2, label: "Page C", x: 270, y: 120 },
  { id: 3, label: "Page D", x: 50, y: 220 },
  { id: 4, label: "Page E", x: 160, y: 220 },
  { id: 5, label: "Page F", x: 270, y: 220 },
];

// Directed links (from -> to)
const LINKS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 4],
  [2, 5],
  [3, 1],
  [3, 4],
  [4, 0],
  [4, 5],
  [5, 2],
];

const N = PAGES.length;
const DAMPING = 0.85;
const SVG_W = 320;
const SVG_H = 260;
const NODE_R = 20;
const MAX_ITERATIONS = 40;

// Build outgoing links
const OUT_LINKS: number[][] = Array.from({ length: N }, () => []);
for (const [u, v] of LINKS) {
  OUT_LINKS[u].push(v);
}

// Compute true PageRank via power iteration (many iterations)
function computeTruePageRank(): number[] {
  let pr = new Array(N).fill(1 / N);
  for (let iter = 0; iter < 200; iter++) {
    const next = new Array(N).fill((1 - DAMPING) / N);
    for (let i = 0; i < N; i++) {
      const out = OUT_LINKS[i];
      if (out.length > 0) {
        const share = pr[i] / out.length;
        for (const j of out) {
          next[j] += DAMPING * share;
        }
      } else {
        // Dangling node: distribute evenly
        for (let j = 0; j < N; j++) {
          next[j] += DAMPING * (pr[i] / N);
        }
      }
    }
    pr = next;
  }
  return pr;
}

const TRUE_PR = computeTruePageRank();

export function PageRankVisualizer({
  locale = "ja",
}: PageRankVisualizerProps) {
  const isJa = locale === "ja";
  const [iteration, setIteration] = useState(0);
  const [prHistory, setPrHistory] = useState<number[][]>([
    new Array(N).fill(1 / N),
  ]);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const doIteration = useCallback(() => {
    setPrHistory((prev) => {
      const current = prev[prev.length - 1];
      const next = new Array(N).fill((1 - DAMPING) / N);
      for (let i = 0; i < N; i++) {
        const out = OUT_LINKS[i];
        if (out.length > 0) {
          const share = current[i] / out.length;
          for (const j of out) {
            next[j] += DAMPING * share;
          }
        } else {
          for (let j = 0; j < N; j++) {
            next[j] += DAMPING * (current[i] / N);
          }
        }
      }
      return [...prev, next];
    });
    setIteration((prev) => {
      const next = prev + 1;
      if (next >= MAX_ITERATIONS) {
        setPlaying(false);
      }
      return Math.min(next, MAX_ITERATIONS);
    });
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(doIteration, 400);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, doIteration, clearTimer]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setIteration(0);
    setPrHistory([new Array(N).fill(1 / N)]);
  }, []);

  const currentPR = prHistory[iteration];
  const maxPR = Math.max(...currentPR);

  // Arrow marker helper
  const arrowId = "pagerank-arrow";

  return (
    <InteractiveDemo
      title={isJa ? "PageRank シミュレーション" : "PageRank Simulation"}
      description={
        isJa
          ? "ランダムサーファーモデルに基づく PageRank のべき乗法。ノードの大きさがスコアに比例"
          : "Power iteration PageRank based on the random surfer model. Node size proportional to score"
      }
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Graph */}
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full md:w-1/2 h-auto"
          style={{ maxHeight: 280 }}
        >
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                className="fill-muted-foreground"
                fillOpacity={0.5}
              />
            </marker>
          </defs>

          {/* Edges (directed) */}
          {LINKS.map(([u, v], i) => {
            const dx = PAGES[v].x - PAGES[u].x;
            const dy = PAGES[v].y - PAGES[u].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / dist;
            const ny = dy / dist;
            const gap = NODE_R + 8;
            return (
              <line
                key={i}
                x1={PAGES[u].x + nx * (NODE_R + 2)}
                y1={PAGES[u].y + ny * (NODE_R + 2)}
                x2={PAGES[v].x - nx * gap}
                y2={PAGES[v].y - ny * gap}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth={1.5}
                markerEnd={`url(#${arrowId})`}
              />
            );
          })}

          {/* Nodes */}
          {PAGES.map((page, i) => {
            const scale = 0.6 + (currentPR[i] / (maxPR || 1)) * 0.6;
            const r = NODE_R * scale;
            return (
              <g key={i}>
                <circle
                  cx={page.x}
                  cy={page.y}
                  r={r}
                  className="fill-accent/20 stroke-accent"
                  strokeWidth={2}
                />
                <text
                  x={page.x}
                  y={page.y - 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-foreground"
                  fontSize={10}
                  fontWeight={600}
                >
                  {page.label.replace("Page ", "")}
                </text>
                <text
                  x={page.x}
                  y={page.y + 10}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-accent"
                  fontSize={8}
                  fontWeight={500}
                >
                  {currentPR[i].toFixed(3)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Table + convergence */}
        <div className="flex-1">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-1 px-2 text-muted-foreground font-medium">
                  {isJa ? "ページ" : "Page"}
                </th>
                <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                  PR(n)
                </th>
                <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                  {isJa ? "収束値" : "converged"}
                </th>
                <th className="text-right py-1 px-2 text-muted-foreground font-medium">
                  {isJa ? "差" : "diff"}
                </th>
              </tr>
            </thead>
            <tbody>
              {PAGES.map((page, i) => (
                <tr key={i}>
                  <td className="py-1 px-2 font-mono font-semibold text-foreground">
                    {page.label.replace("Page ", "")}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-foreground">
                    {currentPR[i].toFixed(4)}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-foreground">
                    {TRUE_PR[i].toFixed(4)}
                  </td>
                  <td className="py-1 px-2 text-right font-mono text-muted-foreground">
                    {Math.abs(currentPR[i] - TRUE_PR[i]).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-xs text-muted-foreground">
            {isJa ? "反復回数" : "Iteration"}:{" "}
            <span className="font-mono text-foreground">{iteration}</span>
            {" / "}
            <span className="font-mono">{MAX_ITERATIONS}</span>
            <span className="ml-3">d = {DAMPING}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => {
            if (iteration >= MAX_ITERATIONS) {
              handleReset();
              setTimeout(() => setPlaying(true), 50);
            } else {
              setPlaying((p) => !p);
            }
          }}
          className="rounded-md px-3 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm"
        >
          {playing
            ? isJa
              ? "一時停止"
              : "Pause"
            : iteration >= MAX_ITERATIONS
              ? isJa
                ? "リセット & 再生"
                : "Reset & Play"
              : isJa
                ? "べき乗法を実行"
                : "Run Power Iteration"}
        </button>
        <button
          onClick={() => {
            if (!playing && iteration < MAX_ITERATIONS) doIteration();
          }}
          disabled={playing || iteration >= MAX_ITERATIONS}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
        >
          {isJa ? "1 反復" : "1 Iteration"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isJa ? "リセット" : "Reset"}
        </button>
        {/* Progress */}
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden ml-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${(iteration / MAX_ITERATIONS) * 100}%`,
            }}
          />
        </div>
      </div>
    </InteractiveDemo>
  );
}
