"use client";

import { useMemo, useState } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";
import {
  DEFAULT_STALENESS_CONFIG,
  STALENESS_POLICIES,
  compareStaleness,
  simulateStaleness,
  type StalenessConfig,
  type StalenessPolicy,
} from "@/lib/llm-load-balancing-model";

type Props = { locale?: string };

const REPLICA_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-cyan-600",
];

const TEXT = {
  ja: {
    title: "信号の鮮度と群れ現象",
    description:
      "ルーターはミリ秒単位で判断し、メトリクスは数秒周期でしか更新されません。この時間差だけを変えて、負荷の振動がどう生まれ、どう収まるかを 1 ティックずつ追います。",
    policy: "選択規則",
    policyNames: {
      "least-outstanding": "最小未完了数（古い値をそのまま信じる）",
      "in-flight-aware": "最小未完了数＋自分が投げた分",
      "power-of-two": "ランダムに 2 台だけ比較（補正なし）",
      "in-flight-aware-p2c": "両方",
    } satisfies Record<StalenessPolicy, string>,
    policyDescriptions: {
      "least-outstanding":
        "取得したスナップショットの最小値を選びます。取得タイミングをずらさない場合、全ルーターが同じスナップショットを見るため、更新までの間は同じレプリカへ投げ続けます（同点はランダムに分散します）。",
      "in-flight-aware":
        "スナップショットに「前回の取得以降に自分が投げた件数」を足してから選びます。ルーター内部の盲点は消えますが、ルーター同士の衝突は残ります。台数を 1 にすると効果が最大になります。",
      "power-of-two":
        "毎回ランダムに 2 台選び、古い値の小さい方を採ります（自分の投入分の加算はしません）。全員が同じ最小値へ殺到する経路そのものを断ちます。",
      "in-flight-aware-p2c":
        "自分の投入分を加算したうえで 2 台を比べます。ルーター内部の盲点とルーター間の同期の両方に効きます。",
    } satisfies Record<StalenessPolicy, string>,
    scrapeInterval: "メトリクス取得間隔（ティック）",
    routers: "ルーター台数",
    stagger: "取得タイミングをずらす",
    on: "する",
    off: "しない",
    tick: "ティック",
    trueLoad: "実際の未完了数",
    believed: "ルーターが見ている値",
    router: "ルーター",
    replica: "レプリカ",
    placed: "この時点の投入先",
    trueLoadShort: "未完了",
    placedShort: "今回",
    notProbed: "この回は見ていない",
    scraped: "この時点で取得",
    none: "なし",
    spread: "最大値 − 最小値",
    spreadTimeline: "偏りの推移",
    compare: "4 方式の比較",
    maxSpread: "偏りの最大値",
    meanSpread: "偏りの平均",
    oscillation: "振動幅（偏りのティック間変化の平均）",
    pileUp: "全投入が 1 台へ集中したティックの割合",
    spreadChart: (max: number, mean: string) =>
      `偏りの推移を示す棒グラフ。最大 ${max}、平均 ${mean}。`,
    loadChart: (loads: string) => `実際の未完了数：${loads}`,
    caution:
      "サービス時間を固定した抽象モデルです。実際のスクレイプはルーターごとに位相がずれ、メトリクス自体にも平滑化が入ります。ここで見るべきは絶対値ではなく、「同じ古い値を全員が信じると振動が持続する」という構造です。",
  },
  en: {
    title: "Signal freshness and herding",
    description:
      "Routers decide at millisecond cadence while metrics refresh every few seconds. Changing only that gap, watch the oscillation appear and then damp out, one tick at a time.",
    policy: "Selection rule",
    policyNames: {
      "least-outstanding": "Least outstanding (trust the stale view)",
      "in-flight-aware": "Least outstanding + my own dispatches",
      "power-of-two": "Two random replicas (no correction)",
      "in-flight-aware-p2c": "Both",
    } satisfies Record<StalenessPolicy, string>,
    policyDescriptions: {
      "least-outstanding":
        "Take the minimum of the last snapshot. Unless scrapes are staggered, every router reads the same snapshot, so they all keep sending to the same replica until the next scrape (ties are broken at random).",
      "in-flight-aware":
        "Add \"requests I dispatched since the last scrape\" before choosing. This removes the router's blindness to itself, but not the collision between routers, so it works best with a single router.",
      "power-of-two":
        "Sample two replicas at random and take the lower stale value, with no in-flight correction. This severs the path by which every router stampedes toward the same minimum.",
      "in-flight-aware-p2c":
        "Correct for your own dispatches and then compare two. Addresses both the intra-router blind spot and the inter-router synchronization.",
    } satisfies Record<StalenessPolicy, string>,
    scrapeInterval: "Scrape interval (ticks)",
    routers: "Routers",
    stagger: "Stagger scrape times",
    on: "on",
    off: "off",
    tick: "Tick",
    trueLoad: "Actual outstanding",
    believed: "What the router sees",
    router: "Router",
    replica: "Replica",
    placed: "Dispatched this tick to",
    trueLoadShort: "live",
    placedShort: "new",
    notProbed: "not probed this time",
    scraped: "Scraped this tick",
    none: "none",
    spread: "max − min",
    spreadTimeline: "Skew over time",
    compare: "The four rules compared",
    maxSpread: "Peak skew",
    meanSpread: "Mean skew",
    oscillation: "Oscillation (mean tick-over-tick change in skew)",
    pileUp: "Ticks where every arrival hit one replica",
    spreadChart: (max: number, mean: string) =>
      `Bar chart of skew over time. Peak ${max}, mean ${mean}.`,
    loadChart: (loads: string) => `Actual outstanding requests: ${loads}`,
    caution:
      "An abstract model with fixed service time. Real scrapes are phase-shifted per router and the metrics themselves are smoothed. What to read here is not the absolute numbers but the structure: when everyone trusts the same stale value, the oscillation sustains.",
  },
} as const;

export function SignalStalenessLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const t = isJa ? TEXT.ja : TEXT.en;

  const [policy, setPolicy] = useState<StalenessPolicy>("least-outstanding");
  const [scrapeIntervalTicks, setScrapeIntervalTicks] = useState(
    DEFAULT_STALENESS_CONFIG.scrapeIntervalTicks,
  );
  const [routers, setRouters] = useState(DEFAULT_STALENESS_CONFIG.routers);
  const [staggerScrapes, setStaggerScrapes] = useState(false);

  const config: StalenessConfig = useMemo(
    () => ({
      ...DEFAULT_STALENESS_CONFIG,
      scrapeIntervalTicks,
      routers,
      staggerScrapes,
    }),
    [scrapeIntervalTicks, routers, staggerScrapes],
  );

  const result = useMemo(
    () => simulateStaleness(policy, config),
    [policy, config],
  );
  const allResults = useMemo(() => compareStaleness(config), [config]);

  const player = useStepPlayer({
    totalSteps: result.ticks.length,
    intervalMs: 220,
    loop: true,
  });
  const step = Math.min(player.step, result.ticks.length - 1);
  const current = result.ticks[step];

  const maxLoad = Math.max(
    1,
    ...result.ticks.flatMap((entry) => entry.trueLoads),
  );
  const maxSpreadForChart = Math.max(
    1,
    ...result.ticks.map((entry) => entry.spread),
  );

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">{t.policy}</span>
            <select
              value={policy}
              onChange={(event) => {
                setPolicy(event.target.value as StalenessPolicy);
                player.reset();
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {STALENESS_POLICIES.map((option) => (
                <option key={option} value={option}>
                  {t.policyNames[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {t.scrapeInterval}:{" "}
              <span className="font-mono">{scrapeIntervalTicks}</span>
            </span>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={scrapeIntervalTicks}
              onChange={(event) =>
                setScrapeIntervalTicks(Number(event.target.value))
              }
              className="accent-current"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {t.routers}: <span className="font-mono">{routers}</span>
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={routers}
              onChange={(event) => setRouters(Number(event.target.value))}
              className="accent-current"
            />
          </label>

          <button
            type="button"
            onClick={() => setStaggerScrapes((value) => !value)}
            className={`self-end rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              staggerScrapes
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-border bg-background text-muted-foreground"
            }`}
            aria-pressed={staggerScrapes}
          >
            {t.stagger}: {staggerScrapes ? t.on : t.off}
          </button>
        </section>

        <p className="text-xs text-muted-foreground">
          {t.policyDescriptions[policy]}
        </p>

        <section className="space-y-2 rounded-lg border border-border bg-background p-3">
          <div className="flex items-baseline justify-between text-xs">
            <h4 className="font-semibold">{t.trueLoad}</h4>
            <span className="font-mono text-muted-foreground">
              {t.tick} {current.tick} · {t.spread} {current.spread}
            </span>
          </div>
          <p className="sr-only">
            {t.loadChart(
              current.trueLoads
                .map((load, replica) => `${t.replica} ${replica + 1}: ${load}`)
                .join(", "),
            )}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="w-16 shrink-0" />
            <span className="flex-1" />
            <span className="w-8 shrink-0 text-right">{t.trueLoadShort}</span>
            <span className="w-8 shrink-0 text-right">{t.placedShort}</span>
          </div>
          <div className="space-y-1" aria-hidden="true">
            {current.trueLoads.map((load, replica) => {
              const placedHere = current.placements.filter(
                (value) => value === replica,
              ).length;
              return (
                <div key={replica} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                    {t.replica} {replica + 1}
                  </span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className={`h-full transition-all ${
                        REPLICA_COLORS[replica % REPLICA_COLORS.length]
                      }`}
                      style={{ width: `${(load / maxLoad) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums">
                    {load}
                  </span>
                  <span
                    className={`w-8 shrink-0 text-right font-mono text-[11px] tabular-nums ${
                      placedHere > 0
                        ? "text-accent"
                        : "text-transparent select-none"
                    }`}
                  >
                    +{placedHere}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {t.scraped}:{" "}
            {current.scrapedRouters.length === 0
              ? t.none
              : current.scrapedRouters
                  .map((router) => `${t.router} ${router + 1}`)
                  .join(", ")}
          </div>
        </section>

        <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
          <h4 className="mb-2 text-xs font-semibold">{t.believed}</h4>
          <table className="w-full min-w-[360px] text-right text-xs">
            <caption className="sr-only">{t.believed}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.router}
                </th>
                {current.trueLoads.map((_, replica) => (
                  <th key={replica} scope="col" className="px-2 py-1">
                    {t.replica} {replica + 1}
                  </th>
                ))}
                <th scope="col" className="px-2 py-1">
                  {t.placed}
                </th>
              </tr>
            </thead>
            <tbody>
              {current.effectiveViews.map((view, arrival) => {
                // Two-choice policies only look at two replicas, so the accented
                // "minimum" must be the minimum of what was probed, not of the row.
                const sampled = current.sampledReplicas[arrival];
                const considered = sampled ?? view.map((_, index) => index);
                const seenMin = Math.min(
                  ...considered.map((index) => view[index]),
                );
                const chosen = current.placements[arrival];
                const router = current.arrivalRouters[arrival];
                return (
                  <tr key={arrival} className="border-t border-border/60">
                    <th
                      scope="row"
                      className="px-2 py-1 text-left font-normal"
                    >
                      {t.router} {router + 1}
                      <span className="ml-1 text-muted-foreground">
                        #{arrival + 1}
                      </span>
                    </th>
                    {view.map((value, replica) => {
                      const probed = considered.includes(replica);
                      return (
                        <td
                          key={replica}
                          className={`px-2 py-1 font-mono tabular-nums ${
                            !probed
                              ? "text-muted-foreground/70"
                              : value === seenMin
                                ? "font-semibold text-accent"
                                : "text-muted-foreground"
                          }`}
                        >
                          {probed ? (
                            value
                          ) : (
                            <>
                              ({value})
                              <span className="sr-only"> {t.notProbed}</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1 font-mono tabular-nums">
                      {`${t.replica} ${chosen + 1}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="space-y-1">
          <h4 className="text-xs font-semibold">{t.spreadTimeline}</h4>
          <p className="sr-only">
            {t.spreadChart(result.maxSpread, result.meanSpread.toFixed(1))}
          </p>
          <div className="overflow-x-auto">
            <div
              className="flex min-w-[480px] items-end gap-px"
              style={{ height: 56 }}
              aria-hidden="true"
            >
              {result.ticks.map((entry, index) => (
                <div
                  key={entry.tick}
                  className={`flex-1 ${
                    index === step ? "bg-foreground" : "bg-accent/70"
                  }`}
                  style={{
                    height: `${Math.max(2, (entry.spread / maxSpreadForChart) * 56)}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(value) =>
            `${t.tick} ${result.ticks[value]?.tick ?? 0} · ${t.spread} ${result.ticks[value]?.spread ?? 0}`
          }
        />

        <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
          <h4 className="mb-2 text-xs font-semibold">{t.compare}</h4>
          <table className="w-full min-w-[520px] text-right text-xs">
            <caption className="sr-only">{t.compare}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.policy}
                </th>
                <th scope="col">{t.maxSpread}</th>
                <th scope="col">{t.meanSpread}</th>
                <th scope="col">{t.oscillation}</th>
                <th scope="col">{t.pileUp}</th>
              </tr>
            </thead>
            <tbody>
              {allResults.map((entry) => (
                <tr
                  key={entry.policy}
                  className={`border-t border-border/60 ${
                    entry.policy === policy ? "bg-muted/60" : ""
                  }`}
                >
                  <th scope="row" className="px-2 py-1.5 text-left font-normal">
                    {t.policyNames[entry.policy]}
                  </th>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {entry.maxSpread}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {entry.meanSpread.toFixed(1)}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {entry.oscillation.toFixed(2)}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {(entry.pileUpRate * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t.caution}
        </p>
      </div>
    </InteractiveDemo>
  );
}
