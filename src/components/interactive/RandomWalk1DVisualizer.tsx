"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { InteractiveDemo } from "./InteractiveDemo";

type RandomWalk1DVisualizerProps = { locale?: string };

const CANVAS_W = 640;
const CANVAS_H = 260;
const MAX_STEPS = 200;
const NUM_PATHS = 5;
const PATH_COLORS = [
  "rgb(59,130,246)",
  "rgb(239,68,68)",
  "rgb(16,185,129)",
  "rgb(245,158,11)",
  "rgb(139,92,246)",
];

function generatePath(steps: number): number[] {
  const path = [0];
  for (let i = 1; i <= steps; i++) {
    path.push(path[i - 1] + (Math.random() < 0.5 ? 1 : -1));
  }
  return path;
}

export function RandomWalk1DVisualizer({
  locale = "ja",
}: RandomWalk1DVisualizerProps) {
  const isJa = locale === "ja";
  const [paths, setPaths] = useState<number[][]>(() =>
    Array.from({ length: NUM_PATHS }, () => generatePath(MAX_STEPS))
  );
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setVisibleSteps((prev) => {
          if (prev >= MAX_STEPS) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 30);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, clearTimer]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setVisibleSteps(0);
    setPaths(
      Array.from({ length: NUM_PATHS }, () => generatePath(MAX_STEPS))
    );
  }, []);

  const handlePlayPause = useCallback(() => {
    if (visibleSteps >= MAX_STEPS) {
      handleReset();
      setTimeout(() => setPlaying(true), 50);
    } else {
      setPlaying((p) => !p);
    }
  }, [visibleSteps, handleReset]);

  // Compute Y range for visible portion
  let minY = 0;
  let maxY = 0;
  for (const path of paths) {
    for (let i = 0; i <= visibleSteps; i++) {
      if (path[i] < minY) minY = path[i];
      if (path[i] > maxY) maxY = path[i];
    }
  }
  const yPad = Math.max(5, Math.ceil((maxY - minY) * 0.15));
  const yMin = minY - yPad;
  const yMax = maxY + yPad;
  const yRange = yMax - yMin || 1;

  const marginL = 40;
  const marginR = 10;
  const marginT = 10;
  const marginB = 30;
  const plotW = CANVAS_W - marginL - marginR;
  const plotH = CANVAS_H - marginT - marginB;

  const toX = (step: number) => marginL + (step / MAX_STEPS) * plotW;
  const toY = (val: number) => marginT + ((yMax - val) / yRange) * plotH;

  // Mean path
  const meanValues: number[] = [];
  for (let i = 0; i <= visibleSteps; i++) {
    let sum = 0;
    for (const p of paths) sum += p[i];
    meanValues.push(sum / paths.length);
  }

  // Variance
  let variance = 0;
  if (visibleSteps > 0) {
    for (const p of paths) {
      variance += p[visibleSteps] ** 2;
    }
    variance /= paths.length;
  }

  return (
    <InteractiveDemo
      title={isJa ? "1D ランダムウォーク" : "1D Random Walk"}
      description={
        isJa
          ? `${NUM_PATHS} 本の独立したランダムウォーク。期待値は常に 0 だが、分散は時間とともに拡大する`
          : `${NUM_PATHS} independent random walks. Expected value stays at 0, but variance grows over time`
      }
    >
      <svg
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        className="w-full h-auto"
        style={{ maxHeight: 280 }}
      >
        {/* Grid lines */}
        <line
          x1={marginL}
          y1={toY(0)}
          x2={CANVAS_W - marginR}
          y2={toY(0)}
          stroke="currentColor"
          strokeOpacity={0.2}
          strokeDasharray="4 4"
        />
        {/* Y axis */}
        <line
          x1={marginL}
          y1={marginT}
          x2={marginL}
          y2={CANVAS_H - marginB}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        {/* X axis */}
        <line
          x1={marginL}
          y1={CANVAS_H - marginB}
          x2={CANVAS_W - marginR}
          y2={CANVAS_H - marginB}
          stroke="currentColor"
          strokeOpacity={0.3}
        />
        {/* Y labels */}
        <text
          x={marginL - 4}
          y={toY(0) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={10}
        >
          0
        </text>
        <text
          x={marginL - 4}
          y={toY(yMax - yPad / 2) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={10}
        >
          {Math.round(yMax - yPad / 2)}
        </text>
        <text
          x={marginL - 4}
          y={toY(yMin + yPad / 2) + 4}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={10}
        >
          {Math.round(yMin + yPad / 2)}
        </text>
        {/* X labels */}
        <text
          x={toX(0)}
          y={CANVAS_H - marginB + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          0
        </text>
        <text
          x={toX(MAX_STEPS)}
          y={CANVAS_H - marginB + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          {MAX_STEPS}
        </text>
        <text
          x={toX(MAX_STEPS / 2)}
          y={CANVAS_H - marginB + 16}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize={10}
        >
          {isJa ? "ステップ" : "steps"}
        </text>

        {/* Paths */}
        {paths.map((path, pi) => {
          if (visibleSteps === 0) return null;
          const d = path
            .slice(0, visibleSteps + 1)
            .map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`)
            .join(" ");
          return (
            <path
              key={pi}
              d={d}
              fill="none"
              stroke={PATH_COLORS[pi]}
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
          );
        })}

        {/* Mean line */}
        {visibleSteps > 0 && (
          <path
            d={meanValues
              .map(
                (v, i) =>
                  `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`
              )
              .join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="6 3"
            strokeOpacity={0.8}
          />
        )}
      </svg>

      {/* Stats */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          {isJa ? "ステップ" : "Step"}: <span className="font-mono text-foreground">{visibleSteps}</span>
        </span>
        <span>
          {isJa ? "平均位置" : "Mean position"}:{" "}
          <span className="font-mono text-foreground">
            {visibleSteps > 0
              ? (paths.reduce((s, p) => s + p[visibleSteps], 0) / paths.length).toFixed(1)
              : "0.0"}
          </span>
        </span>
        <span>
          {isJa ? "分散" : "Variance"}:{" "}
          <span className="font-mono text-foreground">{variance.toFixed(1)}</span>
          <span className="text-xs ml-1">
            ({isJa ? "理論値" : "theory"}: {visibleSteps})
          </span>
        </span>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handlePlayPause}
          className="rounded-md px-3 py-1.5 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors text-sm"
        >
          {playing
            ? isJa
              ? "一時停止"
              : "Pause"
            : visibleSteps >= MAX_STEPS
              ? isJa
                ? "リセット & 再生"
                : "Reset & Play"
              : isJa
                ? "再生"
                : "Play"}
        </button>
        <button
          onClick={handleReset}
          className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isJa ? "新しいパスで再生成" : "Regenerate paths"}
        </button>
        {/* Progress */}
        <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden ml-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${(visibleSteps / MAX_STEPS) * 100}%`,
            }}
          />
        </div>
      </div>
    </InteractiveDemo>
  );
}
