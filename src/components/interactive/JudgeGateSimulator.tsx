"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "@/components/interactive";
import {
  DEFAULT_GATE_PARAMS,
  type GateParams,
  type GateSummary,
  noJudgeSummary,
  servedStrata,
  simulateGate,
  summarizeGate,
  sweepRetryBudget,
} from "@/lib/llm-judge-lifecycle";

type Props = { locale?: string };

const MAX_K = 12;

const SERIES = [
  { key: "servedRate", color: "#5db8a6", ja: "提供率", en: "served rate" },
  { key: "escapeShare", color: "#cc785c", ja: "提供物中の不良率", en: "defect share of served" },
  { key: "escapesPerItem", color: "#e8a55a", ja: "不良の提供 / 生成 item", en: "defects served per item" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

type SliderSpec = {
  key: keyof GateParams;
  ja: string;
  en: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pct0 = (v: number) => `${Math.round(v * 100)}%`;

const SLIDERS: SliderSpec[] = [
  { key: "firstDraftDefectRate", ja: "初稿の不良率（直せる item）", en: "first-draft defect rate (fixable items)", min: 0, max: 0.95, step: 0.05, format: pct0 },
  { key: "hardShare", ja: "直せない item の割合", en: "share of unfixable items", min: 0, max: 0.6, step: 0.05, format: pct0 },
  { key: "fixRate", ja: "1 回の修正で直る確率", en: "P(one revision fixes a bad draft)", min: 0, max: 1, step: 0.05, format: pct0 },
  { key: "regressionRate", ja: "誤って落とされた良稿の改悪率", en: "P(revising a falsely rejected good draft breaks it)", min: 0, max: 0.5, step: 0.05, format: pct0 },
  { key: "specificity", ja: "ジャッジの Specificity（fail 再現率）", en: "judge specificity (fail-recall)", min: 0.5, max: 1, step: 0.01, format: pct0 },
  { key: "recall", ja: "ジャッジの Recall（pass 再現率）", en: "judge recall (pass-recall)", min: 0.5, max: 1, step: 0.01, format: pct0 },
  { key: "persistence", ja: "見逃しの持続性 ρ", en: "persistence of misses ρ", min: 0, max: 1, step: 0.1, format: (v) => v.toFixed(1) },
  { key: "retryBudget", ja: "リトライ予算 K", en: "retry budget K", min: 0, max: MAX_K, step: 1, format: (v) => String(v) },
];

const PRESETS: Array<{ id: string; ja: string; en: string; params: GateParams }> = [
  { id: "default", ja: "既定", en: "default", params: DEFAULT_GATE_PARAMS },
  { id: "independent", ja: "見逃しが毎回独立 (ρ=0)", en: "independent misses (ρ=0)", params: { ...DEFAULT_GATE_PARAMS, persistence: 0 } },
  { id: "persistent", ja: "見逃しが一貫 (ρ=1)", en: "persistent misses (ρ=1)", params: { ...DEFAULT_GATE_PARAMS, persistence: 1 } },
  {
    id: "weak",
    ja: "弱い生成器",
    en: "weak generator",
    params: { ...DEFAULT_GATE_PARAMS, firstDraftDefectRate: 0.9, fixRate: 0.15, hardShare: 0.4 },
  },
  {
    id: "strict",
    ja: "厳しいジャッジ",
    en: "strict judge",
    params: { ...DEFAULT_GATE_PARAMS, specificity: 0.98, recall: 0.7 },
  },
];

export function JudgeGateSimulator({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [params, setParams] = useState<GateParams>(DEFAULT_GATE_PARAMS);

  const { none, gateOnly, current, sweep, strata, strataPersistent, strataIndependent } = useMemo(
    () => ({
      none: noJudgeSummary(params),
      gateOnly: summarizeGate(simulateGate({ ...params, retryBudget: 0 })),
      current: summarizeGate(simulateGate(params)),
      sweep: sweepRetryBudget(params, MAX_K),
      strata: servedStrata(params),
      strataPersistent: servedStrata({ ...params, persistence: 1 }),
      strataIndependent: servedStrata({ ...params, persistence: 0 }),
    }),
    [params],
  );

  const set = (key: keyof GateParams, value: number) => setParams((p) => ({ ...p, [key]: value }));

  const K = params.retryBudget;
  const servedGain = gateOnly.servedRate > 0 ? current.servedRate / gateOnly.servedRate : 0;
  const escapeGain = gateOnly.escapesPerItem > 0 ? current.escapesPerItem / gateOnly.escapesPerItem : 0;
  const hasPostRevision = K > 0 && strata.postRevisionServed > 1e-9;

  const verdicts: string[] = [];
  if (K > 0 && gateOnly.escapesPerItem > 0) {
    const shareWorse = escapeGain > servedGain + 1e-9;
    const countRises = escapeGain > 1.01;
    verdicts.push(
      isJa
        ? `K=0 と比べて、提供数は ${servedGain.toFixed(2)} 倍、不良の提供数は ${escapeGain.toFixed(2)} 倍になります。${
            shareWorse
              ? "不良の増え方が提供数の増え方より速く、利用者が目にするものの不良率も悪化しています。"
              : countRises
                ? "提供物中の不良率は悪化していませんが、不良の絶対数は増えています。"
                : "不良の提供数はほとんど変わらず、リトライはほぼ良品だけを上乗せしています。"
          }`
        : `Compared with K=0, the served volume grows ${servedGain.toFixed(2)}× and the number of defects served grows ${escapeGain.toFixed(2)}×. ${
            shareWorse
              ? "Defects grow faster than coverage, so the defect share users see gets worse too."
              : countRises
                ? "The defect share of what is served does not get worse, but the absolute number of defects served still rises."
                : "The number of defects served barely changes: retries are adding almost only good items."
          }`,
    );
  }
  if (hasPostRevision) {
    verdicts.push(
      isJa
        ? `修正後に提供された層の不良率は ${pct(strata.postRevisionShare)}（同じ設定で ρ=1 なら ${pct(strataPersistent.postRevisionShare)}、ρ=0 なら ${pct(strataIndependent.postRevisionShare)}）。人手監査で測ったこの層の不良率がこの範囲のどこにあるかで、ρ の見当が付きます（ただしこのモデルは草稿の欠陥を 1 つとして扱います。捕まる欠陥と見逃される欠陥が相乗りする実際のシステムでは ρ=1 の値を上回ることがあり、そのときは ρ ではなく相乗りを疑います）。この層はリトライが K=0 に上乗せした提供そのものなので、その不良率が損益分岐（フォールバックの価値を 0 とすれば、良品 1 件の価値 ÷（その価値 + 不良 1 件の損害））を上回るなら K を下げるべきです。`
        : `The defect share of the "served after revision" stratum is ${pct(strata.postRevisionShare)} (with the same settings: ${pct(strataPersistent.postRevisionShare)} at ρ=1, ${pct(strataIndependent.postRevisionShare)} at ρ=0). Where your human-audited share falls in that range gives a rough idea of your ρ, within this single-defect model: in a real system where a caught defect can ride along with an always-missed one, the share can exceed the ρ=1 value, and if it does, suspect ride-along defects rather than ρ. This stratum is exactly what retries add on top of K=0, so if its defect share exceeds the break-even rate (with a fallback worth 0: value of a good item ÷ (that value + cost of a defect)), lower K.`,
    );
  }
  if (current.escapeShare >= 0.1) {
    verdicts.push(
      isJa
        ? `提供物の ${pct(current.escapeShare)} が人間基準では不良です。Specificity が高く見えても、初稿の不良率（事前確率）が高いと提供物は汚れます。`
        : `${pct(current.escapeShare)} of what users see is defective by the human standard. A specificity that sounds high is not enough when most drafts start out bad.`,
    );
  }
  if (current.dropRate >= 0.25) {
    verdicts.push(
      isJa
        ? `${pct(current.dropRate)} の item が破棄されます。破棄時のフォールバック（何も出さない／定型文／人手キュー）が設計されているか確認してください。`
        : `${pct(current.dropRate)} of items are dropped. Make sure the fallback for a drop (nothing / template / human queue) is designed.`,
    );
  }

  const columns = [
    { title: isJa ? "ジャッジなし" : "no judge", summary: none },
    { title: isJa ? "ゲートのみ (K=0)" : "gate only (K=0)", summary: gateOnly },
    { title: isJa ? `ゲート + 批評家 (K=${K})` : `gate + critic (K=${K})`, summary: current },
  ];

  const rows: Array<{ label: string; cells: string[] }> = [
    { label: isJa ? "提供率" : "served rate", get: (s: GateSummary) => pct(s.servedRate) },
    { label: isJa ? "提供物中の不良率 P(不良 | 提供)" : "defect share of served P(bad | served)", get: (s: GateSummary) => pct(s.escapeShare) },
    {
      label: isJa ? "不良の提供数 / 1 万 item" : "defects served / 10k items",
      get: (s: GateSummary) => Math.round(s.escapesPerItem * 1e4).toLocaleString("en-US"),
    },
    { label: isJa ? "破棄率" : "drop rate", get: (s: GateSummary) => pct(s.dropRate) },
    { label: isJa ? "生成回数 / item" : "drafts / item", get: (s: GateSummary) => s.attemptsPerItem.toFixed(2) },
    {
      label: isJa ? "生成回数 / 提供 1 件" : "drafts / served item",
      get: (s: GateSummary) => (Number.isFinite(s.attemptsPerServed) ? s.attemptsPerServed.toFixed(2) : "—"),
    },
  ]
    .map((row) => ({ label: row.label, cells: columns.map((c) => row.get(c.summary)) }))
    .concat([
      {
        label: isJa ? "うち「修正後に提供」層の不良率" : "defect share of the \"served after revision\" stratum",
        cells: ["—", "—", hasPostRevision ? pct(strata.postRevisionShare) : "—"],
      },
    ]);

  return (
    <InteractiveDemo
      title={isJa ? "ゲート + 批評家ループのシミュレータ" : "Gate + critic loop simulator"}
      description={
        isJa
          ? "生成 → 判定 → 修正のループを、人間基準の良否とジャッジの Specificity / Recall で表した小さなマルコフ連鎖です。リトライ予算 K を増やすと提供率は上がりますが、ジャッジの見逃しが試行ごとに独立なほど、不良の提供も増えます。"
          : "A small Markov chain of the generate → judge → revise loop, with human-standard quality and the judge's specificity / recall. Raising the retry budget K serves more items, but the more independent the judge's misses are across attempts, the more defects slip through too."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setParams(preset.params)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {isJa ? preset.ja : preset.en}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SLIDERS.map((s) => (
            <Slider
              key={s.key}
              label={isJa ? s.ja : s.en}
              min={s.min}
              max={s.max}
              step={s.step}
              value={params[s.key]}
              display={s.format(params[s.key])}
              onChange={(v) => set(s.key, v)}
            />
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-normal">{isJa ? "指標" : "metric"}</th>
                {columns.map((c) => (
                  <th key={c.title} className="py-1.5 pr-3 text-right font-normal">
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/60">
                  <td className="py-1.5 pr-3 text-foreground">{row.label}</td>
                  {row.cells.map((cell, i) => (
                    <td key={columns[i].title} className={`py-1.5 pr-3 text-right ${i === 2 ? "text-accent" : "text-foreground"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SweepChart sweep={sweep} currentK={K} isJa={isJa} />

        {verdicts.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-muted-foreground">
            {verdicts.map((v) => (
              <p key={v}>{v}</p>
            ))}
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          {isJa
            ? "前提: 良否は人間の基準。草稿は全体として良か不良かの 2 値で表し、基準ごとに別々の欠陥が同時に存在する状況（捕まる欠陥と見逃される欠陥の相乗り）は扱いません。直せない item の草稿は何度直しても不良のまま。ρ は「同じ item の欠陥をジャッジが見逃すかどうか」が試行間でどれだけ一貫しているかで、ρ=0 は毎回独立（リトライにとって最悪）、ρ=1 は item ごとに常に捕まえるか常に見逃すか。誤って落とされた良稿の修正は、改悪率の確率で不良になります。数値はすべて仮定であり、論文の Netflix システムを再現したものではありません。"
            : "Assumptions: good/bad follows the human standard. A draft is good or bad as a whole; separate defects co-occurring across criteria (a caught defect riding along with an always-missed one) are not modeled. Drafts of unfixable items stay bad however often they are revised. ρ is how consistent the judge's miss/catch decision is across attempts on the same item: ρ=0 means independent draws (the worst case for retries), ρ=1 means each item is either always caught or always missed. Revising a falsely rejected good draft breaks it with the regression probability. All numbers are assumptions; this does not reconstruct Netflix's system."}
        </p>
      </div>
    </InteractiveDemo>
  );
}

function SweepChart({ sweep, currentK, isJa }: { sweep: GateSummary[]; currentK: number; isJa: boolean }) {
  const width = 560;
  const height = 230;
  const m = { left: 44, right: 16, top: 12, bottom: 36 };
  const w = width - m.left - m.right;
  const h = height - m.top - m.bottom;
  const x = (k: number) => m.left + (k / MAX_K) * w;
  const y = (v: number) => m.top + (1 - Math.min(1, Math.max(0, v))) * h;
  const path = (key: SeriesKey) => sweep.map((s, k) => `${k === 0 ? "M" : "L"}${x(k).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={isJa ? "リトライ予算 K ごとの提供率と不良率" : "Served rate and defect rates by retry budget K"}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={m.left - 6} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        {sweep.map((_, k) => (
          <text key={k} x={x(k)} y={height - m.bottom + 14} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
            {k}
          </text>
        ))}
        <text x={m.left + w / 2} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
          {isJa ? "リトライ予算 K" : "retry budget K"}
        </text>
        <line
          x1={x(currentK)}
          x2={x(currentK)}
          y1={m.top}
          y2={m.top + h}
          className="stroke-muted-foreground"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        {SERIES.map((s) => (
          <g key={s.key}>
            <path d={path(s.key)} fill="none" stroke={s.color} strokeWidth={2} />
            <circle cx={x(currentK)} cy={y(sweep[currentK][s.key])} r={3.5} fill={s.color} />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {SERIES.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
            {isJa ? s.ja : s.en}
          </span>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-accent">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
