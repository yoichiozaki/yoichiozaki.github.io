"use client";

import { useMemo, useRef, useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { ControlRow, Panel, SIDE_HEX, Segmented } from "./stableMatchingUi";
import { sampleRandomMarket, type MarketSample } from "@/lib/stable-matching";

type Props = { locale?: string };

const SIZES_SMALL = [10, 20, 30, 50, 75, 100];
const SIZES_LARGE = [10, 20, 30, 50, 75, 100, 150, 200];

type Extra = "-1" | "0" | "1" | "2";

function runSweep(sizes: number[], extra: number, trials: number): MarketSample[] {
  return sizes.map((n, k) => sampleRandomMarket(n, n + extra, trials, 1000 + k * 17 + extra * 101));
}

export function RandomMarketLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [extra, setExtra] = useState<Extra>("0");
  const [trials, setTrials] = useState<"30" | "100">("30");
  const [large, setLarge] = useState(false);
  const [custom, setCustom] = useState<{ key: string; data: MarketSample[] } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const runRef = useRef(0);

  const key = `${extra}-${trials}-${large}`;
  // The default view (small sizes, 30 trials) is cheap enough to compute while rendering.
  const quick = useMemo(
    () => (large || trials !== "30" ? null : runSweep(SIZES_SMALL, Number(extra), 30)),
    [extra, trials, large],
  );
  const data = quick ?? (custom?.key === key ? custom.data : null);

  const cancelRun = () => {
    runRef.current++;
    setProgress(null);
  };

  const runHeavy = () => {
    const sizes = large ? SIZES_LARGE : SIZES_SMALL;
    const ex = Number(extra);
    const tr = Number(trials);
    const runId = ++runRef.current;
    const out: MarketSample[] = [];
    setProgress(0);
    const stepAt = (k: number) => {
      if (runRef.current !== runId) return;
      if (k >= sizes.length) {
        setCustom({ key, data: out });
        setProgress(null);
        return;
      }
      out.push(sampleRandomMarket(sizes[k], sizes[k] + ex, tr, 1000 + k * 17 + ex * 101));
      setProgress((k + 1) / sizes.length);
      setTimeout(() => stepAt(k + 1), 0);
    };
    setTimeout(() => stepAt(0), 0);
  };

  /* ── chart ───────────────────────────────────────────── */

  const W = 560;
  const H = 260;
  const pad = { l: 40, r: 12, t: 12, b: 30 };
  const sizes = data ? data.map((d) => d.nLeft) : large ? SIZES_LARGE : SIZES_SMALL;
  const maxN = sizes[sizes.length - 1];
  const yMax = data
    ? Math.max(
        ...data.flatMap((d) => [d.leftRankWhenRightProposes, d.leftRankWhenLeftProposes]),
        maxN / Math.log(maxN),
      ) * 1.08
    : 40;
  const sx = (n: number) => pad.l + ((n - 0) / maxN) * (W - pad.l - pad.r);
  const sy = (v: number) => H - pad.b - (v / yMax) * (H - pad.t - pad.b);
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const curve = (f: (n: number) => number) => {
    const pts: { x: number; y: number }[] = [];
    for (let n = 3; n <= maxN; n += Math.max(1, Math.floor(maxN / 80))) {
      pts.push({ x: sx(n), y: sy(f(n)) });
    }
    return path(pts);
  };
  const ticksY = (() => {
    const step = yMax > 60 ? 20 : yMax > 30 ? 10 : 5;
    const out: number[] = [];
    for (let v = 0; v <= yMax; v += step) out.push(v);
    return out;
  })();

  const last = data?.[data.length - 1];
  const ex = Number(extra);
  const extraLabel = (e: Extra) =>
    e === "0"
      ? isJa
        ? "同数（n 対 n）"
        : "balanced (n vs n)"
      : e === "-1"
        ? isJa
          ? "右が 1 人少ない"
          : "right side −1"
        : isJa
          ? `右が ${e} 人多い`
          : `right side +${e}`;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ランダムな市場で «提案する側» はどれだけ得をするか"
          : "How much does proposing pay in a random market?"
      }
      description={
        isJa
          ? "全員の好みを一様ランダムに生成し、左側（n 人）が提案した場合と右側が提案した場合の両方で GS を実行して、左側が得る相手の平均順位を比べます（1 位が最良）。右側の人数を 1 人増やすと何が起きるかを見てください。"
          : "Preferences are drawn uniformly at random. GS is run twice — left side (n agents) proposing and right side proposing — and we plot the average rank the left side gets (1 is best). Then add a single agent to the right side and watch."
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <ControlRow label={isJa ? "右側の人数" : "Right side"}>
          <Segmented
            ariaLabel={isJa ? "右側の人数" : "Right side size"}
            value={extra}
            options={(["-1", "0", "1", "2"] as Extra[]).map((e) => ({ value: e, label: extraLabel(e) }))}
            onChange={(v) => {
              cancelRun();
              setExtra(v);
            }}
          />
        </ControlRow>
        <ControlRow label={isJa ? "規模と試行" : "Scale"}>
          <Segmented
            ariaLabel={isJa ? "試行回数" : "Trials"}
            value={trials}
            options={[
              { value: "30", label: isJa ? "各 30 回" : "30 trials" },
              { value: "100", label: isJa ? "各 100 回" : "100 trials" },
            ]}
            onChange={(v) => {
              cancelRun();
              setTrials(v);
            }}
          />
          <Segmented
            ariaLabel={isJa ? "最大の n" : "Largest n"}
            value={large ? "200" : "100"}
            options={[
              { value: "100", label: "n ≤ 100" },
              { value: "200", label: "n ≤ 200" },
            ]}
            onChange={(v) => {
              cancelRun();
              setLarge(v === "200");
            }}
          />
          {!quick && (
            <button
              type="button"
              onClick={runHeavy}
              disabled={progress !== null}
              className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
            >
              {progress !== null
                ? isJa
                  ? `計算中… ${Math.round(progress * 100)}%`
                  : `Running… ${Math.round(progress * 100)}%`
                : isJa
                  ? "シミュレーションを実行"
                  : "Run simulation"}
            </button>
          )}
        </ControlRow>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-background p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto block w-full min-w-[480px] max-w-[640px] text-foreground"
          role="img"
          aria-label={
            isJa
              ? "n に対する左側の平均順位のグラフ"
              : "Average rank obtained by the left side as a function of n"
          }
        >
          {ticksY.map((v) => (
            <g key={v}>
              <line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke="currentColor" strokeOpacity={0.08} />
              <text x={pad.l - 6} y={sy(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity={0.6}>
                {v}
              </text>
            </g>
          ))}
          {sizes.map((n) => (
            <text key={n} x={sx(n)} y={H - pad.b + 14} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity={0.6}>
              {n}
            </text>
          ))}
          <text x={(W + pad.l) / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity={0.7}>
            {isJa ? "n（左側の人数）" : "n (left side size)"}
          </text>
          <line x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} stroke="currentColor" strokeOpacity={0.3} />
          <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="currentColor" strokeOpacity={0.3} />

          <path d={curve((n) => Math.log(n))} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeDasharray="2 3" />
          <path d={curve((n) => n / Math.log(n))} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeDasharray="6 4" />
          <text x={sx(maxN) - 4} y={sy(Math.log(maxN)) - 6} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity={0.7}>
            ln n
          </text>
          <text x={sx(maxN) - 4} y={sy(maxN / Math.log(maxN)) - 6} textAnchor="end" fontSize="10" fill="currentColor" fillOpacity={0.7}>
            n / ln n
          </text>

          {data && (
            <>
              <path
                d={path(data.map((d) => ({ x: sx(d.nLeft), y: sy(d.leftRankWhenLeftProposes) })))}
                fill="none"
                stroke={SIDE_HEX.left}
                strokeWidth={2.5}
              />
              <path
                d={path(data.map((d) => ({ x: sx(d.nLeft), y: sy(d.leftRankWhenRightProposes) })))}
                fill="none"
                stroke={SIDE_HEX.right}
                strokeWidth={2.5}
              />
              {data.map((d) => (
                <g key={d.nLeft}>
                  <circle cx={sx(d.nLeft)} cy={sy(d.leftRankWhenLeftProposes)} r={3.5} fill={SIDE_HEX.left} />
                  <circle cx={sx(d.nLeft)} cy={sy(d.leftRankWhenRightProposes)} r={3.5} fill={SIDE_HEX.right} />
                </g>
              ))}
            </>
          )}
          {!data && (
            <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity={0.6}>
              {isJa ? "「シミュレーションを実行」を押してください" : "Press “Run simulation”"}
            </text>
          )}
        </svg>
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: SIDE_HEX.left }} />
            {isJa ? "左側が提案したときの左側の平均順位" : "left's average rank, left proposes"}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-5" style={{ backgroundColor: SIDE_HEX.right }} />
            {isJa ? "右側が提案したときの左側の平均順位" : "left's average rank, right proposes"}
          </span>
        </div>
      </div>

      {last && (
        <Panel className="mt-3" title={isJa ? `n = ${last.nLeft}（右側 ${last.nRight} 人）、${last.trials} 回の平均` : `n = ${last.nLeft} (right side ${last.nRight}), mean of ${last.trials} runs`}>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium" />
                <th className="text-right font-medium">{isJa ? "左側の平均順位" : "left avg rank"}</th>
                <th className="text-right font-medium">{isJa ? "右側の平均順位" : "right avg rank"}</th>
              </tr>
            </thead>
            <tbody className="font-mono text-foreground">
              <tr>
                <td className="font-sans">{isJa ? "左側が提案" : "left proposes"}</td>
                <td className="text-right">{last.leftRankWhenLeftProposes.toFixed(2)}</td>
                <td className="text-right">{last.rightRankWhenLeftProposes.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="font-sans">{isJa ? "右側が提案" : "right proposes"}</td>
                <td className="text-right">{last.leftRankWhenRightProposes.toFixed(2)}</td>
                <td className="text-right">{last.rightRankWhenRightProposes.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 space-y-0.5 text-[11px] text-foreground">
            <div>
              {isJa ? "参考: ln n = " : "For reference: ln n = "}
              <span className="font-mono">{Math.log(last.nLeft).toFixed(2)}</span>
              {isJa ? "、n / ln n = " : ", n / ln n = "}
              <span className="font-mono">{(last.nLeft / Math.log(last.nLeft)).toFixed(2)}</span>
            </div>
            <div>
              {isJa ? "左側が提案したときの申し込み総数: " : "Proposals when the left proposes: "}
              <span className="font-mono">{last.proposalsWhenLeftProposes.toFixed(1)}</span>
              {ex === 0 && (
                <span className="text-muted-foreground">
                  {isJa ? "（n·H_n = " : " (n·H_n = "}
                  <span className="font-mono">
                    {(last.nLeft * Array.from({ length: last.nLeft }, (_, k) => 1 / (k + 1)).reduce((a, b) => a + b, 0)).toFixed(1)}
                  </span>
                  {isJa ? " が上界）" : " is an upper bound)"}
                </span>
              )}
            </div>
            <div>
              {isJa
                ? "2 つの極端な安定マッチングで相手が異なる左側の割合（＝右側が申し込むとき、嘘で得をできる左側の割合）: "
                : "Share of the left side whose partner differs between the two extreme stable matchings (= the left agents who could gain by lying when the right proposes): "}
              <span className="font-mono font-semibold">
                {(last.leftAgentsWithDifferentPartners * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </Panel>
      )}
    </InteractiveDemo>
  );
}
