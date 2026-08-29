"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "@/components/interactive";
import {
  DEFAULT_CONFIG,
  DEFAULT_WORKLOAD,
  ROUTING_POLICIES,
  comparePolicies,
  generateWorkload,
  simulateLoadBalancing,
  workloadSummary,
  type LbConfig,
  type RoutingPolicy,
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
    title: "LLM ルーティング・ラボ",
    description:
      "同じ到着列に対してルーティング方式だけを差し替え、TTFT の裾、キャッシュヒット率、レプリカ間の偏りがどう動くかを比べます。",
    policy: "ルーティング方式",
    arrivalRate: "到着率 λ（件/ティック）",
    heavyRatio: "長文リクエストの割合",
    replicas: "レプリカ数",
    prefixCache: "プレフィックスキャッシュ",
    on: "有効",
    off: "無効",
    workload: "ワークロード",
    meanPrompt: "平均プロンプト長",
    cv: "プロンプト長の変動係数 CV",
    range: "最小 / 最大",
    tokens: "トークン",
    metrics: "この方式の結果",
    ttftP50: "TTFT 中央値",
    ttftP95: "TTFT P95",
    e2eP95: "E2E P95",
    goodput: "TTFT SLO 達成率",
    cacheHit: "プロンプトのキャッシュ充足率",
    throughput: "出力スループット",
    spread: "割当件数の最大差",
    ticks: "ティック",
    perTick: "トークン/ティック",
    perReplica: "レプリカ別の内訳",
    replica: "レプリカ",
    assigned: "割当",
    served: "完了",
    utilization: "稼働率",
    prefillShare: "うちプレフィル",
    queueTimeline: "待ち行列の推移（各レプリカの未完了件数）",
    compare: "全方式の比較（同じ到着列・同じ設定）",
    best: "最良",
    caution:
      "これは教育用の離散イベントモデルです。1 ティックは 1 エンジン反復ぶんの予算で、実測のミリ秒ではありません。レプリカは 1 ティックでプレフィルかデコードのどちらか一方だけを行い（チャンク化プレフィルは未実装）、キャッシュ済みブロックは KV 容量を消費しないものとして扱っています。テンソル並列、投機的デコード、プリエンプション、ネットワーク遅延も含みません。絶対値ではなく方式間の相対差を読んでください。",
    policyNames: {
      random: "ランダム",
      "round-robin": "ラウンドロビン",
      "least-outstanding": "最小未完了数",
      "power-of-two": "2 択のべき乗（P2C）",
      "least-kv": "最小 KV 使用量",
      "prefix-aware": "プレフィックス考慮",
    } satisfies Record<RoutingPolicy, string>,
    policyDescriptions: {
      random: "毎回一様ランダムに選びます。実装は最も簡単ですが、たまたま重いリクエストが同じレプリカに集中すると裾が伸びます。",
      "round-robin": "順番に配ります。件数は完全に揃いますが、1 件あたりの仕事量が違うため資源は揃いません。",
      "least-outstanding": "未完了件数（待機＋実行中）が最小のレプリカを選びます。全レプリカを毎回走査します。",
      "power-of-two": "ランダムに 2 台選び、未完了件数の少ない方を採用します。2 回の観測で最小選択にほぼ追いつきます。",
      "least-kv": "実行中および現在プレフィル中のシーケンスが占有する KV ブロック数が最小のレプリカを選びます。まだ実行が始まっていない待機中の仕事は、同点時の副次的な判定材料としてしか効きません。",
      "prefix-aware": "負荷差が閾値以内なら同じプレフィックスを持つレプリカへ、閾値を超えたら最小未完了数へ切り替えます。",
    } satisfies Record<RoutingPolicy, string>,
  },
  en: {
    title: "LLM Routing Lab",
    description:
      "Replay one arrival trace under different routing policies and compare TTFT tails, cache hit rates, and replica skew.",
    policy: "Routing policy",
    arrivalRate: "Arrival rate λ (requests/tick)",
    heavyRatio: "Share of long requests",
    replicas: "Replicas",
    prefixCache: "Prefix cache",
    on: "on",
    off: "off",
    workload: "Workload",
    meanPrompt: "Mean prompt length",
    cv: "Prompt-length CV",
    range: "min / max",
    tokens: "tokens",
    metrics: "Result for this policy",
    ttftP50: "TTFT median",
    ttftP95: "TTFT P95",
    e2eP95: "E2E P95",
    goodput: "TTFT SLO attainment",
    cacheHit: "Prompt tokens served from cache",
    throughput: "Output throughput",
    spread: "Max assignment gap",
    ticks: "ticks",
    perTick: "tokens/tick",
    perReplica: "Per-replica breakdown",
    replica: "Replica",
    assigned: "Assigned",
    served: "Completed",
    utilization: "Utilization",
    prefillShare: "of which prefill",
    queueTimeline: "Queue evolution (outstanding requests per replica)",
    compare: "All policies on the same trace and settings",
    best: "best",
    caution:
      "This is a teaching-scale discrete-event model. One tick is one engine-iteration budget, not a measured millisecond. A replica performs either a prefill step or a decode step in a tick (no chunked prefill), and cached blocks are assumed not to consume KV capacity. Tensor parallelism, speculative decoding, preemption, and network latency are out of scope. Read the relative gaps between policies, not the absolute values.",
    policyNames: {
      random: "Random",
      "round-robin": "Round robin",
      "least-outstanding": "Least outstanding",
      "power-of-two": "Power of two choices",
      "least-kv": "Least KV usage",
      "prefix-aware": "Prefix-aware",
    } satisfies Record<RoutingPolicy, string>,
    policyDescriptions: {
      random: "Pick uniformly at random. Simplest to implement, but coincidental collisions of heavy requests stretch the tail.",
      "round-robin": "Deal requests in turn. Counts are perfectly even; resource usage is not, because request cost varies.",
      "least-outstanding": "Choose the replica with the fewest outstanding requests (waiting plus running), scanning the whole pool.",
      "power-of-two": "Sample two replicas at random and take the less loaded one. Two probes get most of the benefit of a full scan.",
      "least-kv": "Choose the replica whose running and currently-prefilling sequences occupy the fewest KV blocks. Work that is queued but not yet admitted only acts as a secondary tie-breaker.",
      "prefix-aware": "Prefer the replica holding the prompt prefix while the load gap stays under threshold; fall back to least outstanding above it.",
    } satisfies Record<RoutingPolicy, string>,
  },
} as const;

function formatNumber(value: number, digits = 1) {
  return value.toFixed(digits);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export function LLMLoadBalancerLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const t = isJa ? TEXT.ja : TEXT.en;

  const [policy, setPolicy] = useState<RoutingPolicy>("least-outstanding");
  const [arrivalRate, setArrivalRate] = useState(DEFAULT_WORKLOAD.arrivalRate);
  const [heavyRatio, setHeavyRatio] = useState(DEFAULT_WORKLOAD.heavyRatio);
  const [replicas, setReplicas] = useState(DEFAULT_CONFIG.replicas);
  const [prefixCacheEnabled, setPrefixCacheEnabled] = useState(true);

  const requests = useMemo(
    () =>
      generateWorkload({
        ...DEFAULT_WORKLOAD,
        arrivalRate,
        heavyRatio,
      }),
    [arrivalRate, heavyRatio],
  );

  const config: LbConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, replicas, prefixCacheEnabled }),
    [replicas, prefixCacheEnabled],
  );

  const summary = useMemo(() => workloadSummary(requests), [requests]);
  const result = useMemo(
    () => simulateLoadBalancing(policy, requests, config),
    [policy, requests, config],
  );
  const allResults = useMemo(
    () => comparePolicies(requests, config),
    [requests, config],
  );

  const bestTtft = Math.min(...allResults.map((entry) => entry.ttftP95));
  const bestGoodput = Math.max(...allResults.map((entry) => entry.goodput));
  const bestCache = Math.max(...allResults.map((entry) => entry.cacheHitRate));
  const maxDepth = Math.max(
    1,
    ...result.timeline.flatMap((sample) => sample.depths),
  );

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">{t.policy}</span>
            <select
              value={policy}
              onChange={(event) => setPolicy(event.target.value as RoutingPolicy)}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              {ROUTING_POLICIES.map((option) => (
                <option key={option} value={option}>
                  {t.policyNames[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {t.replicas}: <span className="font-mono">{replicas}</span>
            </span>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={replicas}
              onChange={(event) => setReplicas(Number(event.target.value))}
              className="accent-current"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {t.arrivalRate}:{" "}
              <span className="font-mono">{arrivalRate.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.05}
              max={0.4}
              step={0.01}
              value={arrivalRate}
              onChange={(event) => setArrivalRate(Number(event.target.value))}
              className="accent-current"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold">
              {t.heavyRatio}:{" "}
              <span className="font-mono">{formatPercent(heavyRatio)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.05}
              value={heavyRatio}
              onChange={(event) => setHeavyRatio(Number(event.target.value))}
              className="accent-current"
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPrefixCacheEnabled((value) => !value)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              prefixCacheEnabled
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                : "border-border bg-background text-muted-foreground"
            }`}
            aria-pressed={prefixCacheEnabled}
          >
            {t.prefixCache}: {prefixCacheEnabled ? t.on : t.off}
          </button>
          <p className="text-xs text-muted-foreground">
            {t.policyDescriptions[policy]}
          </p>
        </div>

        <section className="rounded-lg border border-border bg-background p-3 text-xs">
          <h4 className="font-semibold">{t.workload}</h4>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">{t.meanPrompt}</dt>
              <dd className="font-mono tabular-nums">
                {summary.meanPromptTokens.toFixed(0)} {t.tokens}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.cv}</dt>
              <dd className="font-mono tabular-nums">
                {summary.promptCv.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.range}</dt>
              <dd className="font-mono tabular-nums">
                {summary.minPromptTokens} / {summary.maxPromptTokens}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t.replicas}</dt>
              <dd className="font-mono tabular-nums">{replicas}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">{t.metrics}</h4>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: t.ttftP50, value: `${formatNumber(result.ttftP50)} ${t.ticks}` },
              { label: t.ttftP95, value: `${formatNumber(result.ttftP95)} ${t.ticks}` },
              { label: t.e2eP95, value: `${formatNumber(result.e2eP95, 0)} ${t.ticks}` },
              { label: t.goodput, value: formatPercent(result.goodput) },
              { label: t.cacheHit, value: formatPercent(result.cacheHitRate) },
              {
                label: t.throughput,
                value: `${formatNumber(result.outputTokensPerTick)} ${t.perTick}`,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-background px-3 py-2"
              >
                <div className="text-[11px] text-muted-foreground">{item.label}</div>
                <div className="font-mono text-sm tabular-nums">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-semibold">{t.queueTimeline}</h4>
          <div className="overflow-x-auto">
            <div className="flex min-w-[520px] items-end gap-px" aria-hidden="true">
              {result.timeline.map((sample) => (
                <div
                  key={sample.tick}
                  className="flex flex-1 flex-col-reverse gap-px"
                  style={{ height: 72 }}
                >
                  {sample.depths.map((depth, replicaIndex) => (
                    <div
                      key={replicaIndex}
                      className={REPLICA_COLORS[replicaIndex % REPLICA_COLORS.length]}
                      style={{
                        height: `${(depth / maxDepth) * (72 / sample.depths.length)}px`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {result.replicas.map((replica) => (
              <span key={replica.id} className="flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-sm ${
                    REPLICA_COLORS[replica.id % REPLICA_COLORS.length]
                  }`}
                />
                {t.replica} {replica.id + 1}
              </span>
            ))}
          </div>
        </section>

        <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
          <h4 className="mb-2 text-xs font-semibold">{t.perReplica}</h4>
          <table className="w-full min-w-[460px] text-right text-xs">
            <caption className="sr-only">{t.perReplica}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.replica}
                </th>
                <th scope="col">{t.assigned}</th>
                <th scope="col">{t.served}</th>
                <th scope="col">{t.utilization}</th>
                <th scope="col">{t.prefillShare}</th>
              </tr>
            </thead>
            <tbody>
              {result.replicas.map((replica) => (
                <tr key={replica.id} className="border-t border-border/60">
                  <th scope="row" className="px-2 py-1.5 text-left font-normal">
                    <span
                      className={`mr-1.5 inline-block h-2 w-2 rounded-sm ${
                        REPLICA_COLORS[replica.id % REPLICA_COLORS.length]
                      }`}
                    />
                    {replica.id + 1}
                  </th>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {replica.assigned}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {replica.served}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {formatPercent(replica.utilization)}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {replica.busyTicks === 0
                      ? "–"
                      : formatPercent(replica.prefillTicks / replica.busyTicks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-x-auto rounded-lg border border-border bg-background p-3">
          <h4 className="mb-2 text-xs font-semibold">{t.compare}</h4>
          <table className="w-full min-w-[560px] text-right text-xs">
            <caption className="sr-only">{t.compare}</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 text-left">
                  {t.policy}
                </th>
                <th scope="col">{t.ttftP95}</th>
                <th scope="col">{t.goodput}</th>
                <th scope="col">{t.cacheHit}</th>
                <th scope="col">{t.spread}</th>
                <th scope="col">{t.throughput}</th>
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
                  <td
                    className={`px-2 py-1.5 font-mono tabular-nums ${
                      entry.ttftP95 === bestTtft ? "font-semibold text-accent" : ""
                    }`}
                  >
                    {formatNumber(entry.ttftP95)}
                    {entry.ttftP95 === bestTtft && (
                      <span className="sr-only"> ({t.best})</span>
                    )}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-mono tabular-nums ${
                      entry.goodput === bestGoodput
                        ? "font-semibold text-accent"
                        : ""
                    }`}
                  >
                    {formatPercent(entry.goodput)}
                    {entry.goodput === bestGoodput && (
                      <span className="sr-only"> ({t.best})</span>
                    )}
                  </td>
                  <td
                    className={`px-2 py-1.5 font-mono tabular-nums ${
                      entry.cacheHitRate === bestCache
                        ? "font-semibold text-accent"
                        : ""
                    }`}
                  >
                    {formatPercent(entry.cacheHitRate)}
                    {entry.cacheHitRate === bestCache && (
                      <span className="sr-only"> ({t.best})</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {entry.assignedSpread}
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums">
                    {formatNumber(entry.outputTokensPerTick)}
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
