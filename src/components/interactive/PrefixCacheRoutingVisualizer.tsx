"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";
import {
  simulatePrefixRouting,
  type LbRequest,
} from "@/lib/llm-load-balancing-model";

type Props = { locale?: string };

// Dark enough that the white badge text clears WCAG AA at 12px.
const REPLICA_COLORS = ["bg-blue-700", "bg-emerald-800", "bg-amber-800"];
const PREFIX_STYLE: Record<string, string> = {
  P1: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/50",
  P2: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/50",
  P3: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/50",
};

// A fixed trace. One prefix is far more popular than the others, so affinity
// alone would pile its replica up — which is what makes the load-imbalance
// escape hatch fire partway through.
const TRACE: LbRequest[] = [
  ["P1", 4000, 180],
  ["P2", 3200, 150],
  ["P3", 2400, 210],
  ["P1", 4000, 120],
  ["P1", 4000, 260],
  ["P1", 4000, 140],
  ["P1", 4000, 160],
  ["P2", 3200, 130],
  ["P1", 4000, 200],
  ["P3", 2400, 110],
  ["P1", 4000, 170],
  ["P1", 4000, 150],
].map(([prefixId, prefixTokens, fresh], index) => ({
  id: `R${index + 1}`,
  arrival: index,
  prefixId: prefixId as string,
  prefixTokens: prefixTokens as number,
  promptTokens: (prefixTokens as number) + (fresh as number),
  outputTokens: 120,
  tenant: prefixId as string,
  heavy: false,
}));

const TEXT = {
  ja: {
    title: "プレフィックスキャッシュ考慮ルーティング",
    description:
      "同じ到着列を「最小未完了数だけを見るルーター」と「プレフィックス親和性を優先するルーター」に流し、プレフィルすべきトークン数の差を追います。レプリカ 3 台、各レプリカのキャッシュ枠は 1 系列ぶんです。",
    baseline: "最小未完了数のみ",
    aware: "プレフィックス考慮",
    request: "リクエスト",
    prefix: "プレフィックス",
    promptLen: "プロンプト長",
    routedTo: "配送先",
    replica: "レプリカ",
    hit: "キャッシュヒット",
    miss: "キャッシュミス",
    prefill: "このリクエストのプレフィル",
    cumulative: "累積プレフィルトークン",
    saving: "削減率",
    cacheState: "各レプリカのキャッシュ（LRU 1 枠）",
    loads: "累積割当件数",
    empty: "空",
    fallback: "負荷差が閾値を超えたため親和性を放棄",
    firstSeen: "このプレフィックスは初出のため最小負荷へ",
    affinity: "親和性で選択",
    tokens: "トークン",
    caution:
      "キャッシュ枠を 1 系列ぶんに絞ることで競合を強調しています。実装ではキャッシュ状態の追跡がルーター側の近似木（SGLang）、KV イベント購読（Dynamo）、外部インデクサのいずれかになり、粒度もブロック単位です。",
  },
  en: {
    title: "Prefix-cache-aware routing",
    description:
      "One arrival trace, two routers: least-outstanding only, versus prefix affinity with a load-balance escape hatch. Three replicas, each with a single prefix cache slot.",
    baseline: "Least outstanding only",
    aware: "Prefix-aware",
    request: "Request",
    prefix: "Prefix",
    promptLen: "Prompt length",
    routedTo: "Routed to",
    replica: "Replica",
    hit: "cache hit",
    miss: "cache miss",
    prefill: "Prefill for this request",
    cumulative: "Cumulative prefill tokens",
    saving: "Reduction",
    cacheState: "Per-replica cache (LRU, 1 slot)",
    loads: "Cumulative assignments",
    empty: "empty",
    fallback: "load gap over threshold — affinity dropped",
    firstSeen: "first sight of this prefix — routed by load",
    affinity: "chosen by affinity",
    tokens: "tokens",
    caution:
      "The single cache slot exaggerates contention on purpose. Real routers track cache state through a router-side approximate tree (SGLang), a KV-event subscription (Dynamo), or an external indexer, and they work at block granularity.",
  },
} as const;

export function PrefixCacheRoutingVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const t = isJa ? TEXT.ja : TEXT.en;

  const steps = useMemo(() => simulatePrefixRouting(TRACE, 3, 1), []);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1100 });
  const current = steps[player.step];

  const saving =
    current.cumulativeBaselinePrefill === 0
      ? 0
      : 1 - current.cumulativeAwarePrefill / current.cumulativeBaselinePrefill;

  const panes = [
    {
      key: "baseline" as const,
      label: t.baseline,
      replica: current.baselineReplica,
      hit: current.baselineHit,
      prefill: current.baselinePrefillTokens,
      cumulative: current.cumulativeBaselinePrefill,
      caches: current.baselineCaches,
      loads: current.baselineLoads,
      note: null as string | null,
    },
    {
      key: "aware" as const,
      label: t.aware,
      replica: current.awareReplica,
      hit: current.awareHit,
      prefill: current.awarePrefillTokens,
      cumulative: current.cumulativeAwarePrefill,
      caches: current.awareCaches,
      loads: current.awareLoads,
      note:
        current.awareReason === "affinity"
          ? t.affinity
          : current.awareReason === "first-sight"
            ? t.firstSeen
            : t.fallback,
    },
  ];

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-5">
        <section
          className="rounded-lg bg-muted px-3 py-2 text-sm"
          role={player.playing ? undefined : "status"}
          aria-atomic="true"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-semibold">
              {t.request} {current.request.id}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                PREFIX_STYLE[current.request.prefixId]
              }`}
            >
              {t.prefix} {current.request.prefixId}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {t.promptLen} {current.request.promptTokens} {t.tokens} (
              {current.request.prefixTokens} + {current.request.promptTokens - current.request.prefixTokens})
            </span>
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          {panes.map((pane) => (
            <section
              key={pane.key}
              className="space-y-2 rounded-lg border border-border bg-background p-3"
            >
              <h4 className="text-xs font-semibold">{pane.label}</h4>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t.routedTo}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-semibold text-white ${
                    REPLICA_COLORS[pane.replica]
                  }`}
                >
                  {t.replica} {pane.replica + 1}
                </span>
                <span
                  className={
                    pane.hit
                    ? "font-semibold text-emerald-700 dark:text-emerald-400"
                    : "font-semibold text-rose-700 dark:text-rose-400"
                  }
                >
                  {pane.hit ? t.hit : t.miss}
                </span>
              </div>

              {pane.note && (
                <p className="text-[11px] text-muted-foreground">{pane.note}</p>
              )}

              <div className="space-y-1">
                <div className="text-[11px] text-muted-foreground">{t.cacheState}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {pane.caches.map((cache, replicaIndex) => (
                    <div
                      key={replicaIndex}
                      className="rounded border border-border px-1.5 py-1 text-center"
                    >
                      <div className="text-[10px] text-muted-foreground">
                        {replicaIndex + 1}
                      </div>
                      <div className="font-mono text-[11px]">
                        {cache.length === 0 ? t.empty : cache.join(",")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pane.loads[replicaIndex]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground">{t.loads}</div>
              </div>

              <dl className="grid grid-cols-2 gap-x-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">{t.prefill}</dt>
                  <dd className="font-mono tabular-nums">{pane.prefill}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t.cumulative}</dt>
                  <dd className="font-mono tabular-nums">{pane.cumulative}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">{t.saving}: </span>
          <strong className="font-mono tabular-nums">
            {(saving * 100).toFixed(1)}%
          </strong>
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            ({current.cumulativeAwarePrefill} / {current.cumulativeBaselinePrefill}{" "}
            {t.tokens})
          </span>
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(step) =>
            `${steps[step].request.id} · ${steps[step].request.prefixId} · ${
              steps[step].awareHit ? t.hit : t.miss
            }`
          }
        />

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {t.caution}
        </p>
      </div>
    </InteractiveDemo>
  );
}
