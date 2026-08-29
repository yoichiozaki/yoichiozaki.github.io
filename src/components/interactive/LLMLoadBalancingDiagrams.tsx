"use client";

import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// ── Decision layers ─────────────────────────────────────────────────────────

const LAYERS = [
  {
    ja: "クライアント / SDK",
    en: "Client / SDK",
    unitJa: "1 回の API 呼び出し",
    unitEn: "one API call",
    decisionsJa: [
      "タイムアウト、リトライ回数、バックオフ",
      "ヘッジ（投機的な二重発行）",
      "ストリーミングを使うかどうか",
    ],
    decisionsEn: [
      "timeout, retry count, backoff",
      "hedging (speculative duplicate issue)",
      "streaming or not",
    ],
    color: "#3b82f6",
  },
  {
    ja: "ゲートウェイ / ルーター",
    en: "Gateway / router",
    unitJa: "テナントとモデル",
    unitEn: "tenant and model",
    decisionsJa: [
      "どのモデル・どのプロバイダへ出すか",
      "テナント間の公平性、優先度、レート制限",
      "サーキットブレーカーとフェイルオーバー",
    ],
    decisionsEn: [
      "which model and which provider",
      "cross-tenant fairness, priority, rate limits",
      "circuit breaking and failover",
    ],
    color: "#6366f1",
  },
  {
    ja: "エンドポイント選択",
    en: "Endpoint selection",
    unitJa: "1 リクエスト → 1 レプリカ",
    unitEn: "one request to one replica",
    decisionsJa: [
      "最小未完了数、P2C、KV 使用量",
      "プレフィックスキャッシュ親和性",
      "プレフィル用とデコード用の振り分け",
    ],
    decisionsEn: [
      "least outstanding, P2C, KV usage",
      "prefix-cache affinity",
      "prefill-worker vs decode-worker split",
    ],
    color: "#8b5cf6",
  },
  {
    ja: "エンジン内スケジューラ",
    en: "Engine scheduler",
    unitJa: "1 反復（イテレーション）",
    unitEn: "one iteration",
    decisionsJa: [
      "連続バッチ処理での投入順序",
      "チャンク化プレフィルの計算予算配分",
      "KV 不足時のプリエンプションと再計算",
    ],
    decisionsEn: [
      "admission order under continuous batching",
      "compute budget split for chunked prefill",
      "preemption and recompute under KV pressure",
    ],
    color: "#10b981",
  },
  {
    ja: "アクセラレータ",
    en: "Accelerator",
    unitJa: "1 カーネル / 1 デバイス",
    unitEn: "one kernel, one device",
    decisionsJa: [
      "テンソル並列・パイプライン並列・エキスパート並列",
      "KV キャッシュの階層配置（HBM / ホスト / ディスク）",
      "投機的デコードの採択率",
    ],
    decisionsEn: [
      "tensor, pipeline, and expert parallelism",
      "KV cache tiering (HBM / host / disk)",
      "speculative decoding acceptance rate",
    ],
    color: "#f59e0b",
  },
];

export function LBLayerMap({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "決定が起きる 5 つの層" : "Five layers where decisions happen"}
      description={
        isJa
          ? "「負荷分散」と呼ばれるものは、粒度も権限も異なる 5 段の判断の重なりです"
          : "What we call load balancing is five stacked decisions with different granularity and authority"
      }
    >
      <ol className="space-y-2">
        {LAYERS.map((layer, index) => (
          <li
            key={layer.en}
            className="rounded-lg border-l-4 border border-border bg-background p-3"
            style={{ borderLeftColor: layer.color }}
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: layer.color }}
              >
                L{index + 1}
              </span>
              <span className="font-semibold text-foreground">
                {isJa ? layer.ja : layer.en}
              </span>
              <span className="text-xs text-muted-foreground">
                {isJa ? layer.unitJa : layer.unitEn}
              </span>
            </div>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
              {(isJa ? layer.decisionsJa : layer.decisionsEn).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </InteractiveDemo>
  );
}

// ── Metric map ──────────────────────────────────────────────────────────────

const METRICS = [
  {
    ja: "TTFT（最初のトークンまでの時間）",
    en: "TTFT (time to first token)",
    defJa: "到着から最初のトークンが返るまで",
    defEn: "arrival to first returned token",
    drivenJa: "キュー待ち時間 + プレフィル時間",
    drivenEn: "queue delay + prefill time",
    leverJa: "エンドポイント選択、プレフィックスキャッシュ、受付制御",
    leverEn: "endpoint selection, prefix cache, admission control",
  },
  {
    ja: "ITL / TPOT（トークン間遅延）",
    en: "ITL / TPOT (inter-token latency)",
    defJa: "2 番目以降のトークンの平均間隔",
    defEn: "mean gap between subsequent tokens",
    drivenJa: "同居バッチの大きさとプレフィル割り込み",
    drivenEn: "co-resident batch size and prefill interference",
    leverJa: "バッチ上限、チャンク化プレフィル、PD 分離",
    leverEn: "batch cap, chunked prefill, prefill/decode disaggregation",
  },
  {
    ja: "E2E レイテンシ",
    en: "End-to-end latency",
    defJa: "到着から最後のトークンまで",
    defEn: "arrival to last token",
    drivenJa: "TTFT + 出力長 × ITL",
    drivenEn: "TTFT + output length × ITL",
    leverJa: "出力長の制御、モデル選択",
    leverEn: "output length control, model selection",
  },
  {
    ja: "正規化レイテンシ",
    en: "Normalized latency",
    defJa: "E2E ÷ 出力トークン数",
    defEn: "E2E divided by output tokens",
    drivenJa: "出力長の違いを取り除いた比較",
    drivenEn: "comparison with output length factored out",
    leverJa: "負荷水準の異なる系の比較に使う",
    leverEn: "used to compare systems at different load levels",
  },
  {
    ja: "グッドプット",
    en: "Goodput",
    defJa: "SLO を満たした完了リクエストの割合または率",
    defEn: "share or rate of completions that met the SLO",
    drivenJa: "テールを含めた全体の質",
    drivenEn: "overall quality including the tail",
    leverJa: "容量計画の主指標。スループット単独より有用",
    leverEn: "the primary capacity metric; more useful than raw throughput",
  },
  {
    ja: "KV キャッシュ使用率",
    en: "KV cache utilization",
    defJa: "使用中の KV ブロック ÷ 総ブロック",
    defEn: "used KV blocks divided by total blocks",
    drivenJa: "同居シーケンス数と文脈長",
    drivenEn: "resident sequence count and context length",
    leverJa: "飽和するとプリエンプションが発生し ITL が跳ねる",
    leverEn: "saturation triggers preemption and spikes ITL",
  },
];

export function LBMetricMap({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "何を測るか" : "What to measure"}
      description={
        isJa
          ? "指標ごとに、支配する要因と効く打ち手が違います"
          : "Each metric has a different dominant cause and a different effective lever"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">
            {isJa ? "指標一覧" : "Metric reference"}
          </caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3">
                {isJa ? "指標" : "Metric"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "定義" : "Definition"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "支配要因" : "Dominant cause"}
              </th>
              <th scope="col" className="py-2">
                {isJa ? "効く打ち手" : "Effective lever"}
              </th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((metric) => (
              <tr key={metric.en} className="border-b border-border/60 align-top">
                <th scope="row" className="py-2 pr-3 font-semibold">
                  {isJa ? metric.ja : metric.en}
                </th>
                <td className="py-2 pr-3 text-muted-foreground">
                  {isJa ? metric.defJa : metric.defEn}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {isJa ? metric.drivenJa : metric.drivenEn}
                </td>
                <td className="py-2 text-muted-foreground">
                  {isJa ? metric.leverJa : metric.leverEn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

// ── Policy comparison ───────────────────────────────────────────────────────

const POLICIES = [
  {
    ja: "ラウンドロビン",
    en: "Round robin",
    signalJa: "なし（順番のみ）",
    signalEn: "none (position only)",
    costJa: "O(1)",
    costEn: "O(1)",
    failJa: "1 件あたりの仕事量が違うと資源が偏る",
    failEn: "skews resources when per-request cost varies",
  },
  {
    ja: "重み付きラウンドロビン",
    en: "Weighted round robin",
    signalJa: "静的な容量比",
    signalEn: "static capacity ratio",
    costJa: "O(1)",
    costEn: "O(1)",
    failJa: "重みが静的なので実際の混雑に追随しない",
    failEn: "static weights cannot track live congestion",
  },
  {
    ja: "最小未完了数",
    en: "Least outstanding requests",
    signalJa: "未完了件数",
    signalEn: "outstanding count",
    costJa: "O(n)",
    costEn: "O(n)",
    failJa: "件数は仕事量の代理でしかない。分散環境では観測がずれる",
    failEn: "count only proxies work; observations skew in distributed routers",
  },
  {
    ja: "2 択のべき乗（P2C）",
    en: "Power of two choices",
    signalJa: "2 台ぶんの未完了件数",
    signalEn: "outstanding count of two samples",
    costJa: "O(1)",
    costEn: "O(1)",
    failJa: "単独最小より僅かに劣るが、群れ現象を避けやすい",
    failEn: "slightly worse than a full scan, but avoids herding",
  },
  {
    ja: "レイテンシ加重（EWMA）",
    en: "Latency weighted (EWMA)",
    signalJa: "観測レイテンシの指数移動平均",
    signalEn: "exponentially weighted latency",
    costJa: "O(n)",
    costEn: "O(n)",
    failJa: "ストリーミングでは完了時刻が遅れて届き、信号が古くなる",
    failEn: "streaming delays completion signals, so the signal goes stale",
  },
  {
    ja: "一貫性ハッシュ",
    en: "Consistent hashing",
    signalJa: "キー（会話 ID・プレフィックス）",
    signalEn: "key (conversation ID or prefix)",
    costJa: "O(log n)",
    costEn: "O(log n)",
    failJa: "キー分布が偏るとホットスポット。有界負荷版で緩和する",
    failEn: "hot spots under skewed keys; bounded-load variants mitigate",
  },
  {
    ja: "KV / キュー考慮",
    en: "KV and queue aware",
    signalJa: "実行中・待機中の件数と KV ブロック",
    signalEn: "running and waiting counts plus KV blocks",
    costJa: "O(n)",
    costEn: "O(n)",
    failJa: "待機中の仕事を数えない実装は群れ現象を起こす",
    failEn: "implementations that ignore queued work cause herding",
  },
  {
    ja: "プレフィックス考慮",
    en: "Prefix aware",
    signalJa: "上の全部 + プレフィックス重なり",
    signalEn: "all of the above plus prefix overlap",
    costJa: "O(n) + 索引",
    costEn: "O(n) + index",
    failJa: "親和性を強くしすぎると負荷が偏る。閾値での切り替えが要る",
    failEn: "too much affinity skews load; needs a threshold escape hatch",
  },
];

export function LBPolicyComparison({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  return (
    <InteractiveDemo
      title={isJa ? "選択規則の比較" : "Selection rules compared"}
      description={
        isJa
          ? "「何を見て決めるか」と「その信号が壊れる条件」を並べます"
          : "What each rule observes, and the condition under which that signal breaks"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">
            {isJa ? "選択規則の比較" : "Selection rule comparison"}
          </caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3">
                {isJa ? "規則" : "Rule"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "見る信号" : "Signal"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "1 決定の計算量" : "Cost per decision"}
              </th>
              <th scope="col" className="py-2">
                {isJa ? "壊れる条件" : "Failure mode"}
              </th>
            </tr>
          </thead>
          <tbody>
            {POLICIES.map((policy) => (
              <tr key={policy.en} className="border-b border-border/60 align-top">
                <th scope="row" className="py-2 pr-3 font-semibold">
                  {isJa ? policy.ja : policy.en}
                </th>
                <td className="py-2 pr-3 text-muted-foreground">
                  {isJa ? policy.signalJa : policy.signalEn}
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">
                  {isJa ? policy.costJa : policy.costEn}
                </td>
                <td className="py-2 text-muted-foreground">
                  {isJa ? policy.failJa : policy.failEn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}

// ── Utilization / latency knee ──────────────────────────────────────────────

export function QueueingKneeCurve({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const width = 560;
  const height = 240;
  const padding = { left: 44, right: 16, top: 16, bottom: 34 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxY = 12;

  const curve = (cv2: number) => {
    const points: string[] = [];
    for (let index = 0; index <= 100; index += 1) {
      const rho = (index / 100) * 0.95;
      // Pollaczek–Khinchine: Wq/E[S] = rho/(1-rho) * (1+Cs^2)/2
      const value = (rho / (1 - rho)) * ((1 + cv2) / 2);
      const clamped = Math.min(value, maxY);
      const x = padding.left + rho * (plotWidth / 0.95);
      const y = padding.top + plotHeight - (clamped / maxY) * plotHeight;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      if (value > maxY) break;
    }
    return points.join(" ");
  };

  // Each series carries a distinct dash pattern as well as a colour, so the
  // three curves stay distinguishable without colour vision.
  const series = [
    {
      cv2: 0,
      color: "#047857",
      dash: "none",
      ja: "決定的（CV² = 0・実線）",
      en: "Deterministic (CV² = 0, solid)",
    },
    {
      cv2: 1,
      color: "#4338ca",
      dash: "7 4",
      ja: "指数分布（CV² = 1・破線）",
      en: "Exponential (CV² = 1, dashed)",
    },
    {
      cv2: 4,
      color: "#b91c1c",
      dash: "2 3",
      ja: "長い裾（CV² = 4・点線）",
      en: "Heavy tail (CV² = 4, dotted)",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "稼働率と待ち時間の膝" : "The utilization / waiting-time knee"}
      description={
        isJa
          ? "Pollaczek–Khinchine の式による、単一待ち行列の平均待ち時間（サービス時間で正規化）"
          : "Mean waiting time of a single queue, normalized by service time, from the Pollaczek–Khinchine formula"
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[420px]"
          role="img"
          aria-label={
            isJa
              ? "稼働率が上がるほど待ち時間が急増し、サービス時間のばらつきが大きいほど早く急増することを示す折れ線グラフ"
              : "Line chart showing waiting time rising sharply with utilization, and rising sooner when service-time variability is higher"
          }
        >
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            className="stroke-border"
            strokeWidth={1}
          />
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            className="stroke-border"
            strokeWidth={1}
          />
          {[0, 3, 6, 9, 12].map((tick) => {
            const y = padding.top + plotHeight - (tick / maxY) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={0.5}
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-current text-[9px] text-muted-foreground"
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {[0, 0.25, 0.5, 0.75, 0.95].map((tick) => {
            const x = padding.left + tick * (plotWidth / 0.95);
            return (
              <text
                key={tick}
                x={x}
                y={padding.top + plotHeight + 14}
                textAnchor="middle"
                className="fill-current text-[9px] text-muted-foreground"
              >
                {tick}
              </text>
            );
          })}
          <text
            x={padding.left + plotWidth / 2}
            y={height - 4}
            textAnchor="middle"
            className="fill-current text-[10px] text-muted-foreground"
          >
            {isJa ? "稼働率 ρ" : "Utilization ρ"}
          </text>
          <text
            x={12}
            y={padding.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${padding.top + plotHeight / 2})`}
            className="fill-current text-[10px] text-muted-foreground"
          >
            {isJa ? "待ち時間 / サービス時間" : "Wait / service time"}
          </text>
          {series.map((entry) => (
            <polyline
              key={entry.cv2}
              points={curve(entry.cv2)}
              fill="none"
              stroke={entry.color}
              strokeWidth={2}
              strokeDasharray={entry.dash === "none" ? undefined : entry.dash}
            />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {series.map((entry) => (
          <span key={entry.cv2} className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {isJa ? entry.ja : entry.en}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {isJa
          ? "LLM のリクエストはプロンプト長と出力長のばらつきが大きく、CV² が 1 を大きく超えます。同じ稼働率でも待ち時間が跳ね上がるため、稼働率を上げ切る運用は成立しません。"
          : "LLM request sizes vary enough that CV² sits well above 1. At the same utilization the queue is far deeper, which is why running an LLM pool near full utilization does not work."}
      </p>
    </InteractiveDemo>
  );
}

// ── Retry amplification ─────────────────────────────────────────────────────

export function RetryAmplificationDiagram({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const rows = [
    { depth: 1, retries: 2, ja: "クライアント SDK", en: "Client SDK" },
    { depth: 2, retries: 3, ja: "エージェントのツール実行ループ", en: "Agent tool loop" },
    { depth: 3, retries: 3, ja: "ゲートウェイのルーター", en: "Gateway router" },
    { depth: 4, retries: 2, ja: "プロバイダ SDK", en: "Provider SDK" },
  ];
  let cumulative = 1;
  const computed = rows.map((row) => {
    cumulative *= 1 + row.retries;
    return { ...row, cumulative };
  });

  return (
    <InteractiveDemo
      title={isJa ? "リトライの多層増幅" : "Retry amplification across layers"}
      description={
        isJa
          ? "各層が独立にリトライすると、上流から見た試行回数は積になります"
          : "When every layer retries independently, upstream attempts multiply"
      }
    >
      <div className="space-y-1.5">
        {computed.map((row) => (
          <div key={row.depth} className="flex items-center gap-3">
            <span className="w-56 shrink-0 text-sm">
              {isJa ? row.ja : row.en}
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                (+{row.retries})
              </span>
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
              <div
                className="h-full bg-rose-600"
                style={{
                  width: `${Math.min(100, (row.cumulative / computed[computed.length - 1].cumulative) * 100)}%`,
                }}
              />
            </div>
            <span className="w-20 shrink-0 text-right font-mono text-sm tabular-nums">
              &times;{row.cumulative}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {isJa
          ? `1 回のユーザー操作が最悪 ${computed[computed.length - 1].cumulative} 回のモデル呼び出しになります。各層の試行回数は足し算ではなく掛け算で効くため、どの層も「自分は 2、3 回しかリトライしていない」と正しく主張できてしまうのがこの障害の厄介なところです。`
          : `One user action can become ${computed[computed.length - 1].cumulative} model calls in the worst case. The per-layer attempt counts multiply rather than add, which is why every layer can truthfully say it only retried two or three times.`}
      </p>
    </InteractiveDemo>
  );
}

// ── Hedging timeline ────────────────────────────────────────────────────────

export function HedgingTimeline({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  // One unit = 10 ms. Replica A draws a slow 920 ms; replica B is a typical
  // 300 ms. Both numbers stay fixed across all three rows — only the dispatch
  // policy changes, so the rows are actually comparable.
  const scenarios = [
    {
      ja: "ヘッジなし・運が悪い場合",
      en: "No hedging, unlucky draw",
      bars: [
        {
          start: 0,
          width: 92,
          ja: "レプリカ A（遅い・920 ms）",
          en: "Replica A (slow, 920 ms)",
          color: "#b91c1c",
        },
      ],
      resultJa: "920 ms・追加負荷なし",
      resultEn: "920 ms, no extra load",
    },
    {
      ja: "P95（240 ms）でヘッジ",
      en: "Hedge at P95 (240 ms)",
      bars: [
        {
          start: 0,
          width: 54,
          ja: "レプリカ A（B の応答時に中断）",
          en: "Replica A (cancelled when B returns)",
          color: "#b91c1c",
        },
        {
          start: 24,
          width: 30,
          ja: "レプリカ B（ヘッジ・300 ms・採用）",
          en: "Replica B (hedge, 300 ms, kept)",
          color: "#047857",
        },
      ],
      resultJa: "540 ms・追加負荷は約 5%",
      resultEn: "540 ms, about 5% extra load",
    },
    {
      ja: "常時 2 重発行",
      en: "Always duplicate",
      bars: [
        {
          start: 0,
          width: 92,
          ja: "レプリカ A（破棄）",
          en: "Replica A (discarded)",
          color: "#b91c1c",
        },
        {
          start: 0,
          width: 30,
          ja: "レプリカ B（300 ms・採用）",
          en: "Replica B (300 ms, kept)",
          color: "#b45309",
        },
      ],
      resultJa: "300 ms・費用と負荷は 2 倍",
      resultEn: "300 ms, at double cost and load",
    },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "ヘッジ（投機的二重発行）の損得" : "The hedging trade-off"}
      description={
        isJa
          ? "P95 を超えたときだけ二重発行すると、追加負荷を数 % に抑えつつテールを削れます"
          : "Issuing a duplicate only after the P95 threshold trims the tail while adding only a few percent of load"
      }
    >
      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.en} className="space-y-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold">{isJa ? scenario.ja : scenario.en}</span>
              <span className="font-mono text-muted-foreground">
                {isJa ? scenario.resultJa : scenario.resultEn}
              </span>
            </div>
            <div className="relative h-12 rounded-md border border-border bg-muted/40">
              <p className="sr-only">
                {scenario.bars
                  .map((bar) => (isJa ? bar.ja : bar.en))
                  .join(isJa ? "、" : "; ")}
              </p>
              {scenario.bars.map((bar, index) => (
                <div
                  key={index}
                  aria-hidden="true"
                  className="absolute flex items-center overflow-hidden rounded px-1.5 text-[10px] font-semibold text-white"
                  style={{
                    left: `${bar.start}%`,
                    width: `${bar.width}%`,
                    top: index * 24 + 3,
                    height: 20,
                    backgroundColor: bar.color,
                  }}
                >
                  {isJa ? bar.ja : bar.en}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {isJa
          ? "この図の比較対象はミリ秒ではなく追加負荷です。P95 でヘッジすれば、定義上 5% のリクエストしか二重発行されないので、定常状態の追加負荷はおよそ 5% です。常時 2 重発行は 100% 。ミリ秒の数字ではなくこの比が、閾値が存在する理由です。"
          : "What this figure is really comparing is not milliseconds but added load. Hedging at P95 duplicates 5% of requests by construction, so steady-state extra load is about 5%. Always-duplicate is 100%. That ratio, not the millisecond numbers, is why the threshold exists."}
      </p>
    </InteractiveDemo>
  );
}

// ── Agent traffic shape ─────────────────────────────────────────────────────

export function AgentTrafficShape({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const rows = [
    {
      ja: "チャット 1 往復",
      en: "One chat turn",
      calls: 1,
      spanJa: "数秒",
      spanEn: "seconds",
      stateJa: "会話履歴のみ",
      stateEn: "conversation history only",
      shapeJa: "単発",
      shapeEn: "single call",
    },
    {
      ja: "RAG 応答",
      en: "RAG answer",
      calls: 2,
      spanJa: "数秒",
      spanEn: "seconds",
      stateJa: "検索結果を含む長いプロンプト",
      stateEn: "long prompt including retrieved chunks",
      shapeJa: "直列 2 段",
      shapeEn: "two sequential steps",
    },
    {
      ja: "ツール利用エージェント",
      en: "Tool-using agent",
      calls: 12,
      spanJa: "数十秒〜数分",
      spanEn: "tens of seconds to minutes",
      stateJa: "毎ステップ伸び続ける同一プレフィックス",
      stateEn: "one prefix that keeps growing each step",
      shapeJa: "長い直列",
      shapeEn: "long sequential chain",
    },
    {
      ja: "サブエージェント並列",
      en: "Parallel subagents",
      calls: 40,
      spanJa: "数分",
      spanEn: "minutes",
      stateJa: "共有プレフィックス + 枝ごとの差分",
      stateEn: "shared prefix plus per-branch deltas",
      shapeJa: "扇形の突発負荷",
      shapeEn: "fan-out burst",
    },
    {
      ja: "常駐エージェント",
      en: "Long-running agent",
      calls: 300,
      spanJa: "時間単位",
      spanEn: "hours",
      stateJa: "圧縮・要約を挟む長期文脈",
      stateEn: "long-lived context with compaction",
      shapeJa: "断続的な直列",
      shapeEn: "intermittent sequential",
    },
  ];
  const maxCalls = Math.max(...rows.map((row) => row.calls));

  return (
    <InteractiveDemo
      title={isJa ? "エージェント化で変わる負荷の形" : "How agents change the traffic shape"}
      description={
        isJa
          ? "スケジューリングの単位が「1 リクエスト」から「1 セッション」へ移ります"
          : "The scheduling unit shifts from one request to one session"
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">
            {isJa ? "呼び出し形状の比較" : "Call-shape comparison"}
          </caption>
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th scope="col" className="py-2 pr-3">
                {isJa ? "作業単位" : "Unit of work"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "モデル呼び出し数" : "Model calls"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "所要時間" : "Span"}
              </th>
              <th scope="col" className="py-2 pr-3">
                {isJa ? "状態" : "State"}
              </th>
              <th scope="col" className="py-2">
                {isJa ? "負荷の形" : "Shape"}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.en} className="border-b border-border/60 align-top">
                <th scope="row" className="py-2 pr-3 font-semibold">
                  {isJa ? row.ja : row.en}
                </th>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-violet-600"
                        style={{ width: `${(row.calls / maxCalls) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums">
                      ~{row.calls}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {isJa ? row.spanJa : row.spanEn}
                </td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {isJa ? row.stateJa : row.stateEn}
                </td>
                <td className="py-2 text-muted-foreground">
                  {isJa ? row.shapeJa : row.shapeEn}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InteractiveDemo>
  );
}
