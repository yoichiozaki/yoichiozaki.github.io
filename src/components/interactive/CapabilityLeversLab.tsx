"use client";

import { useEffect, useRef, useState } from "react";
import { InteractiveDemo } from "@/components/interactive";
import {
  ANCHORS,
  LEVER_RANGE,
  PRESET_2023,
  PRESET_2026,
  evaluate,
  interpolateLevers,
  sameLevers,
  sweepLever,
  type LeverKey,
  type Levers,
  type Outcome,
  type Status,
} from "@/lib/capability-levers";

type Props = { locale?: string };
type Group = "training" | "inference" | "research";
type LeverCopy = { name: string; shape: string; predict: string; cost: string; limit: string };

const COLOR = {
  verifiable: "#5db8a6",
  hard: "#e8a55a",
  training: "#cc785c",
  inference: "#6a9bcc",
  research: "#8e8b82",
} as const;

const STATUS_COLOR: Record<Status, string> = { ok: "#5db872", warn: "#d4a017", limit: "#c64545" };

const GROUPS: { key: Group; ja: string; en: string }[] = [
  { key: "training", ja: "学習のレバー（費用は前払い・環 3）", en: "Training levers (paid up front, link 3)" },
  { key: "inference", ja: "推論のレバー（費用は使うたび・環 5）", en: "Inference lever (paid per use, link 5)" },
  { key: "research", ja: "研究と設備のレバー（研究費・環 2）", en: "Research and hardware levers (R&D, link 2)" },
];

const LEVERS: { key: LeverKey; group: Group; ja: LeverCopy; en: LeverCopy }[] = [
  {
    key: "pretrain",
    group: "training",
    ja: {
      name: "事前学習の計算量",
      shape: "損失はべき乗則に沿って滑らかに下がるが、能力の伸びは 10 倍ごとに小さくなる。",
      predict: "損失は予測しやすい。どの能力として現れるかは読みにくく、帯が広がっていく。",
      cost: "学習費（前払い・環 3）。モデルが売れる期間のうちに回収する必要がある。",
      limit: "電力（GW 級）と、人間が書いた公開テキストの枯渇。",
    },
    en: {
      name: "Pretraining compute",
      shape: "Loss falls smoothly along a power law, but each 10x adds less capability.",
      predict: "Loss is predictable; which capabilities appear is not, so the band keeps widening.",
      cost: "Training cost (up front, link 3), to be recovered while the model sells.",
      limit: "Power (GW scale) and running out of public human-written text.",
    },
  },
  {
    key: "rl",
    group: "training",
    ja: {
      name: "強化学習の計算量",
      shape: "S 字。正誤を判定できる仕事の範囲で決まる上限に近づくと、伸びが止まる。",
      predict: "範囲を決めれば予測しやすい。",
      cost: "学習費（前払い・環 3）。事前学習と同じく、回収を待つ必要がある。",
      limit: "正誤を判定できる課題と環境の数。",
    },
    en: {
      name: "RL compute",
      shape: "An S-curve that flattens as it nears a ceiling set by the range of work whose correctness can be judged.",
      predict: "Predictable once the range of tasks is fixed.",
      cost: "Training cost (up front, link 3); like pretraining, it must wait to be recovered.",
      limit: "The number of tasks and environments whose correctness can be judged.",
    },
  },
  {
    key: "inference",
    group: "inference",
    ja: {
      name: "推論時計算（1 タスクで考える量）",
      shape: "10 倍にするごとに、残りの失敗がほぼ一定の割合で減る。強化学習で考え方を学んだモデルほどよく効く。",
      predict: "課題ごとには予測しやすい。",
      cost: "推論費（使うたび・環 5、売上原価）。トークン単位の売上にもなる。",
      limit: "HBM の帯域と KV キャッシュ、顧客が払う価格。",
    },
    en: {
      name: "Inference-time compute (thinking per task)",
      shape: "Each 10x removes a roughly constant share of the remaining failures — far more so for models that learned to reason through RL.",
      predict: "Predictable task by task.",
      cost: "Inference cost (per use, link 5, cost of revenue), which also earns per-token revenue.",
      limit: "HBM bandwidth and the KV cache, and the price customers will pay.",
    },
  },
  {
    key: "coverage",
    group: "research",
    ja: {
      name: "正誤を判定できる仕事の範囲",
      shape: "強化学習の上限そのものを引き上げる。判定しにくい仕事にも少しだけ波及する。",
      predict: "読みにくい。環境と採点基準をつくれるかどうかに左右される。",
      cost: "研究費と人件費（環境と採点基準づくり）。",
      limit: "報酬を設計できるかどうか。",
    },
    en: {
      name: "Range of work whose correctness can be judged",
      shape: "Raises the RL ceiling itself, with a small spillover to work whose correctness is hard to judge.",
      predict: "Hard to predict: it depends on building environments and graders.",
      cost: "Research and staff costs (building environments and graders).",
      limit: "Whether a reward can be designed at all.",
    },
  },
  {
    key: "algorithms",
    group: "research",
    ja: {
      name: "アルゴリズムの効率",
      shape: "同じ計算量で得られる能力が上がり、推論も安くなる（曲線が左にずれる）。同じ性能に必要な計算量は約 8 か月で半分。",
      predict: "長期の傾向はあるが、発見次第で変わる。",
      cost: "研究費。",
      limit: "発見が続くかどうか。",
    },
    en: {
      name: "Algorithmic efficiency",
      shape: "More capability from the same compute and cheaper inference (the curves shift left); compute for a given performance halves about every 8 months.",
      predict: "There is a long-run trend, but it depends on discoveries.",
      cost: "Research cost.",
      limit: "Whether the discoveries keep coming.",
    },
  },
  {
    key: "hardware",
    group: "research",
    ja: {
      name: "1 ドル・1 ワットあたりの計算量",
      shape: "能力ではなく費用と電力に効く。同じ計算量を安く、少ない電力で回せる。",
      predict: "長期では指数関数的に伸びるが、世代ごとに段階的に進む。",
      cost: "設備投資（環 2）。",
      limit: "電力、HBM、パッケージ、そして低精度化の残りの余地（第 4 章）。",
    },
    en: {
      name: "Compute per dollar and per watt",
      shape: "Acts on cost and power, not capability: the same compute runs cheaper and on less power.",
      predict: "Exponential over the long run, but it arrives in steps with each generation.",
      cost: "Capex (link 2).",
      limit: "Power, HBM, packaging and how much low precision has left (Chapter 4).",
    },
  },
];

const COST_LOG_MIN = -3;
const COST_LOG_MAX = 5;

const sig2 = (v: number) => Number(v.toPrecision(2));

function formatMultiplier(v: number): string {
  if (v >= 100) return `×${sig2(v).toLocaleString("en-US")}`;
  if (v >= 10) return `×${Math.round(v)}`;
  return `×${sig2(v)}`;
}

function coverageLabel(v: number, isJa: boolean): string {
  if (v < 0.15) return isJa ? "ほぼない（数学の一部）" : "almost none (some math)";
  if (v < 0.4) return isJa ? "数学・競技プログラミング" : "math, competitive programming";
  if (v < 0.65) return isJa ? "ソフトウェア開発の一部まで" : "parts of software work";
  if (v < 0.85) return isJa ? "ソフトウェア開発全般と一部の業務" : "most software work, some business tasks";
  return isJa ? "多くの業務" : "much of knowledge work";
}

function leverDisplay(key: LeverKey, value: number, isJa: boolean): string {
  return key === "coverage" ? coverageLabel(value, isJa) : formatMultiplier(10 ** value);
}

function formatPower(mw: number, isJa: boolean): string {
  const text = mw >= 1000 ? `${sig2(mw / 1000)} GW` : `${sig2(mw)} MW`;
  return isJa ? `約 ${text}` : `about ${text}`;
}

function constraintText(o: Outcome, levers: Levers, isJa: boolean) {
  const [lo, hi] = ANCHORS.powerOutlook2030GW;
  const power =
    o.status.power === "ok"
      ? isJa ? "余裕" : "headroom"
      : o.status.power === "warn"
        ? isJa ? "電源と系統の確保が必要" : "needs new power and grid capacity"
        : o.powerMW > hi * 1000
          ? isJa ? `2030 年の見通し（${lo}〜${hi} GW）を超える` : `beyond the 2030 outlook (${lo}–${hi} GW)`
          : isJa ? `2030 年の見通し（${lo}〜${hi} GW）の水準` : `at the 2030 outlook (${lo}–${hi} GW)`;
  const data =
    o.status.data === "ok"
      ? isJa ? "余裕" : "headroom"
      : o.status.data === "warn"
        ? isJa ? "逼迫しはじめる" : "getting tight"
        : isJa ? "公開テキストを使い切る" : "public text runs out";
  const dataValue =
    o.dataShare < 1
      ? isJa ? `必要量は総量の約 ${Math.round(o.dataShare * 100)}%` : `needs ~${Math.round(o.dataShare * 100)}% of the stock`
      : isJa ? `必要量は総量の約 ${sig2(o.dataShare)} 倍` : `needs ~${sig2(o.dataShare)}x the stock`;
  const hbm =
    o.status.hbm === "ok" ? (isJa ? "余裕" : "headroom") : o.status.hbm === "warn" ? (isJa ? "逼迫" : "tight") : isJa ? "上限を決める" : "binding";
  const rl =
    o.status.rl === "ok"
      ? isJa ? "余地あり" : "room left"
      : levers.coverage >= 0.95
        ? isJa ? "範囲を広げきった" : "range fully widened"
        : o.status.rl === "warn"
          ? isJa ? "この範囲では上限に近い" : "near the ceiling for this range"
          : isJa ? "この範囲では飽和" : "saturated for this range";
  return { power, data, dataValue, hbm, rl };
}

function insights(o: Outcome, levers: Levers, isJa: boolean): string[] {
  const out: string[] = [];
  if (o.status.power === "limit") {
    out.push(
      isJa
        ? "学習 1 回に必要な電力が、2030 年に見込まれる最大級の学習（4〜16 GW）の水準に達した。事前学習の規模は、電力という物理的な上限に当たる。"
        : "One training run now needs power on the scale of the largest runs expected in 2030 (4–16 GW). Pretraining scale runs into the physical ceiling of power.",
    );
  }
  if (o.status.data === "limit") {
    out.push(
      isJa
        ? "必要な学習データが、人間が書いた公開テキストの総量を超えた。合成データなどに頼ることになる。"
        : "The training data needed now exceeds the stock of public human-written text; synthetic data and the like must fill the gap.",
    );
  }
  if (o.status.hbm === "limit") {
    const thinking = levers.inference >= 0.5 * levers.pretrain;
    out.push(
      thinking
        ? isJa
          ? "長く考えさせるほど、HBM の帯域と 1 タスクあたりの推論費が上限を決める。"
          : "The longer models think, the more HBM bandwidth and the inference cost per task set the ceiling."
        : isJa
          ? "モデルが大きくなるほど、1 トークンを出すたびに HBM から読み出す量が増え、HBM の帯域と推論費が上限を決める。"
          : "The bigger the model, the more it reads from HBM for every token, so HBM bandwidth and inference cost set the ceiling.",
    );
  }
  if (o.status.rl !== "ok") {
    out.push(
      levers.coverage >= 0.95
        ? isJa
          ? "正誤を判定できる仕事の範囲は広げきった。残るのは、判定しにくい仕事である。"
          : "The range of work whose correctness can be judged is fully widened; what remains is work whose correctness is hard to judge."
        : isJa
          ? "強化学習は、いまの範囲で決まる上限に近い。さらに伸ばすには、正誤を判定できる仕事の範囲を広げて、上限そのものを上げる必要がある。"
          : "RL is close to the ceiling set by the current range. Going further means widening the range of work whose correctness can be judged, which raises the ceiling itself.",
    );
  }
  if (o.verifiable - o.hard >= 8) {
    out.push(
      isJa
        ? "強化学習と推論時計算は、正誤を判定できる仕事によく効く。判定しにくい仕事の伸びは小さく、予測の幅も広い。"
        : "RL and inference-time compute work best where correctness can be judged; work whose correctness is hard to judge gains less and is harder to predict.",
    );
  }
  if (levers.inference >= 1.5 && o.rlProgress < 0.3) {
    out.push(
      isJa
        ? "強化学習で考え方を学んでいないモデルに長く考えさせても、伸びは小さい。"
        : "Making a model think longer helps little if it has not learned to reason through RL.",
    );
  }
  if (out.length === 0) {
    out.push(
      isJa
        ? "レバーを動かして、能力、費用、制約の変わり方を比べてみてほしい。"
        : "Move the levers and compare how capability, cost and constraints respond.",
    );
  }
  return out.slice(0, 3);
}

export function CapabilityLeversLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [levers, setLevers] = useState<Levers>(PRESET_2023);
  const [focus, setFocus] = useState<LeverKey>("pretrain");
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const handle = frame;
    return () => {
      if (handle.current !== null) cancelAnimationFrame(handle.current);
    };
  }, []);

  const stopAnimation = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  };

  const setLever = (key: LeverKey, value: number) => {
    stopAnimation();
    setFocus(key);
    setLevers((prev) => ({ ...prev, [key]: value }));
  };

  const animateTo = (target: Levers) => {
    stopAnimation();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLevers(target);
      return;
    }
    const from = levers;
    const duration = 700;
    let start: number | null = null;
    const tick = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      setLevers(interpolateLevers(from, target, 1 - (1 - t) ** 3));
      frame.current = t < 1 ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  };

  const outcome = evaluate(levers);
  const baseline = evaluate(PRESET_2023);
  const text = constraintText(outcome, levers, isJa);
  const focused = LEVERS.find((l) => l.key === focus) ?? LEVERS[0];
  const focusedCopy = isJa ? focused.ja : focused.en;
  const presets = [
    { key: "2023", label: isJa ? "2023 年秋（GPT-4 世代）" : "Autumn 2023 (GPT-4 era)", levers: PRESET_2023 },
    { key: "2026", label: isJa ? "2026 年秋（目安）" : "Autumn 2026 (rough)", levers: PRESET_2026 },
  ];

  return (
    <InteractiveDemo
      title={isJa ? "AI の能力を伸ばす 6 つのレバー" : "Six levers for growing AI capability"}
      description={
        isJa
          ? "レバーを動かすと、2 種類の仕事での能力、費用の出どころ、ぶつかる制約が変わる。ボタンで 2023 年秋と 2026 年秋の位置に切り替えられる。数値は説明用の概念モデルで、予測ではない。"
          : "Move the levers to see how capability on two kinds of work, where the costs land and which constraints bind all change. The buttons jump to rough positions for autumn 2023 and autumn 2026. The numbers come from an illustrative model, not a forecast."
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((p) => {
            const active = sameLevers(levers, p.levers);
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={active}
                onClick={() => animateTo(p.levers)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  active
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background text-foreground hover:border-accent"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            {GROUPS.map((g) => (
              <fieldset key={g.key} className="rounded-lg border border-border bg-background px-2 pb-2 pt-1">
                <legend className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: COLOR[g.key] }} />
                  {isJa ? g.ja : g.en}
                </legend>
                {LEVERS.filter((l) => l.group === g.key).map((l) => {
                  const range = LEVER_RANGE[l.key];
                  const display = leverDisplay(l.key, levers[l.key], isJa);
                  return (
                    <label
                      key={l.key}
                      className={`block rounded-md px-2 py-1.5 transition-colors ${focus === l.key ? "bg-muted" : ""}`}
                    >
                      <span className="mb-0.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                        <span className="text-foreground">{(isJa ? l.ja : l.en).name}</span>
                        <span className="ml-auto text-right font-mono text-xs text-accent">{display}</span>
                      </span>
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={levers[l.key]}
                        aria-valuetext={display}
                        onChange={(e) => setLever(l.key, Number(e.target.value))}
                        onFocus={() => setFocus(l.key)}
                        onPointerDown={() => setFocus(l.key)}
                        className="w-full cursor-pointer scheme-light dark:scheme-dark"
                        style={{ accentColor: COLOR[l.group] }}
                      />
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-background p-3">
            <section>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                {isJa ? "能力（相対値。縦線は 2023 年秋、枠は予測の幅）" : "Capability (relative; tick = autumn 2023, box = uncertainty)"}
              </h4>
              <div className="flex flex-col gap-3">
                <CapabilityBar
                  label={isJa ? "正誤を判定できる仕事" : "Work whose correctness can be judged"}
                  sub={isJa ? "コーディング、数学など" : "coding, math…"}
                  value={outcome.verifiable}
                  band={outcome.verifiableBand}
                  baseline={baseline.verifiable}
                  color={COLOR.verifiable}
                />
                <CapabilityBar
                  label={isJa ? "正誤を判定しにくい仕事" : "Work whose correctness is hard to judge"}
                  sub={isJa ? "長い文書の質、経営判断など" : "long documents, judgment…"}
                  value={outcome.hard}
                  band={outcome.hardBand}
                  baseline={baseline.hard}
                  color={COLOR.hard}
                />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                {isJa ? "費用（対数目盛。縦線は 2023 年秋 = ×1）" : "Cost (log scale; tick = autumn 2023 = ×1)"}
              </h4>
              <div className="flex flex-col gap-3">
                <CostBar label={isJa ? "学習費（前払い）" : "Training cost (up front)"} value={outcome.trainingCost} color={COLOR.training} />
                <CostBar label={isJa ? "推論費（1 タスクあたり）" : "Inference cost per task"} value={outcome.inferenceCostPerTask} color={COLOR.inference} />
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">{isJa ? "ぶつかる制約" : "Constraints you hit"}</h4>
              <div className="grid grid-cols-2 gap-2">
                <ConstraintChip
                  title={isJa ? "電力（学習 1 回）" : "Power (one training run)"}
                  status={outcome.status.power}
                  text={text.power}
                  detail={formatPower(outcome.powerMW, isJa)}
                />
                <ConstraintChip
                  title={isJa ? "データ（人間が書いた公開テキスト）" : "Data (public human text)"}
                  status={outcome.status.data}
                  text={text.data}
                  detail={text.dataValue}
                />
                <ConstraintChip title={isJa ? "HBM（メモリ帯域）" : "HBM (memory bandwidth)"} status={outcome.status.hbm} text={text.hbm} />
                <ConstraintChip
                  title={isJa ? "検証できる課題（強化学習の環境）" : "Verifiable tasks (RL environments)"}
                  status={outcome.status.rl}
                  text={text.rl}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">{isJa ? "読み取れること" : "What this shows"}</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground">
            {insights(outcome, levers, isJa).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="grid gap-4 rounded-lg border border-border bg-background p-3 md:grid-cols-[1.15fr_1fr]">
          <ResponseChart levers={levers} focus={focus} isJa={isJa} />
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLOR[focused.group] }} />
              <h4 className="text-sm font-semibold text-foreground">{focusedCopy.name}</h4>
            </div>
            <dl className="mt-2 space-y-2 text-sm leading-relaxed">
              {[
                { term: isJa ? "伸び方" : "How it grows", desc: focusedCopy.shape },
                { term: isJa ? "予測しやすさ" : "Predictability", desc: focusedCopy.predict },
                { term: isJa ? "費用の出るところ" : "Where the cost lands", desc: focusedCopy.cost },
                { term: isJa ? "主な制約" : "Main constraint", desc: focusedCopy.limit },
              ].map((row) => (
                <div key={row.term}>
                  <dt className="text-xs text-muted-foreground">{row.term}</dt>
                  <dd className="text-foreground">{row.desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <details className="text-xs leading-relaxed text-muted-foreground">
          <summary className="cursor-pointer select-none text-foreground">{isJa ? "モデルの前提と出典" : "Model assumptions and sources"}</summary>
          <p className="mt-2">
            {isJa
              ? `説明のための概念モデルで、数値は予測ではない。2023 年秋を GPT-4（学習計算量 2.1 × 10²⁵ FLOP、学習時の電力 約 ${ANCHORS.baselinePowerMW} MW〔Epoch AI〕、学習データ 約 ${ANCHORS.baselineTokensT} 兆トークン〔報道〕）として ×1 とし、人間が書いた公開テキストの総量を約 ${ANCHORS.publicTextTokensT} 兆トークン（Villalobos ら）とした。事前学習は損失がべき乗則に従うとし、能力への対応の不確かさを帯の幅で表した。強化学習は上限に近づくと飽和する S 字（Khatri ら）とし、その上限は正誤を判定できる仕事の範囲で決まるとした。推論時計算は 10 倍ごとに残りの失敗が一定の割合で減る形とし、強化学習で考え方を学んだモデルほどよく効くとした。傾きは、AIME の正答率を 20% から 80% に上げるのに推論時計算なら約 100 倍、強化学習なら約 1 万倍が必要という Toby Ord の読み取りに合わせた。2026 年秋の目安は、事前学習 約 45 倍（Epoch AI による GPT-6 Astra の推計）、強化学習は事前学習に近い規模、考える量 約 100 倍、アルゴリズムの効率 約 22 倍（約 8 か月で半分）、1 ワットあたりの学習性能 約 5.6 倍（主力 GPU のエネルギー効率が年 40% 改善〔Epoch AI〕し、学習が BF16 から FP8 に移った分）とした。1 ドルあたりの計算量も 1 ワットあたりと同じだけ伸びると仮定している。事前学習の計算量を増やすとモデルが大きくなり、1 トークンあたりの推論費と HBM の読み出しも増えるとした。`
              : `An illustrative model, not a forecast. Autumn 2023 is GPT-4 at ×1 (2.1 × 10²⁵ FLOP of training compute, about ${ANCHORS.baselinePowerMW} MW of training power per Epoch AI, about ${ANCHORS.baselineTokensT} trillion training tokens as reported), and the stock of public human-written text is about ${ANCHORS.publicTextTokensT} trillion tokens (Villalobos et al.). Pretraining loss follows a power law, and the uncertainty in how loss maps to capability is shown as the band. RL follows a saturating S-curve (Khatri et al.) whose ceiling is set by the range of work whose correctness can be judged. Each 10x of inference-time compute removes a constant share of remaining failures, much more so for models that learned to reason through RL; the slopes match Toby Ord's reading that raising AIME accuracy from 20% to 80% takes about 100x inference compute but about 10,000x RL compute. The autumn-2026 position assumes about 45x pretraining (Epoch AI's estimate for GPT-6 Astra), RL on a scale close to pretraining, about 100x thinking per task, about 22x algorithmic efficiency (halving every ~8 months) and about 5.6x training performance per watt (GPU energy efficiency +40% a year per Epoch AI, plus the move from BF16 to FP8). Compute per dollar is assumed to improve as much as compute per watt. Larger pretraining makes the model bigger, raising inference cost and HBM traffic per token.`}
          </p>
        </details>
      </div>
    </InteractiveDemo>
  );
}

function CapabilityBar({
  label,
  sub,
  value,
  band,
  baseline,
  color,
}: {
  label: string;
  sub: string;
  value: number;
  band: number;
  baseline: number;
  color: string;
}) {
  const lo = Math.max(0, value - band);
  const hi = Math.min(100, value + band);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-foreground">
          {label}
          <span className="ml-1.5 text-xs text-muted-foreground">{sub}</span>
        </span>
        <span className="shrink-0 font-mono text-xs text-foreground">
          {Math.round(value)}
          <span className="text-muted-foreground"> ±{Math.round(band)}</span>
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
        <div
          className="absolute -inset-y-1 rounded-sm border border-foreground/50 bg-foreground/10"
          style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        />
        <div className="absolute -inset-y-1.5 w-0.5 bg-foreground/70" style={{ left: `${baseline}%` }} />
      </div>
    </div>
  );
}

function CostBar({ label, value, color }: { label: string; value: number; color: string }) {
  const span = COST_LOG_MAX - COST_LOG_MIN;
  const clamped = Math.min(10 ** COST_LOG_MAX, Math.max(10 ** COST_LOG_MIN, value));
  const width = ((Math.log10(clamped) - COST_LOG_MIN) / span) * 100;
  const one = ((0 - COST_LOG_MIN) / span) * 100;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="shrink-0 font-mono text-xs text-foreground">{formatMultiplier(value)}</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
        <div className="absolute -inset-y-1.5 w-0.5 bg-foreground/70" style={{ left: `${one}%` }} />
      </div>
    </div>
  );
}

function ConstraintChip({ title, status, text, detail }: { title: string; status: Status; text: string; detail?: string }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
        <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
        {title}
      </div>
      <div className="mt-1 text-sm leading-snug text-foreground">{text}</div>
      {detail && <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{detail}</div>}
    </div>
  );
}

function ResponseChart({ levers, focus, isJa }: { levers: Levers; focus: LeverKey; isJa: boolean }) {
  const range = LEVER_RANGE[focus];
  const points = sweepLever(levers, focus, 49);
  const now = evaluate(levers);
  const width = 360;
  const height = 210;
  const m = { left: 30, right: 12, top: 20, bottom: 34 };
  const w = width - m.left - m.right;
  const h = height - m.top - m.bottom;
  const x = (v: number) => m.left + ((v - range.min) / (range.max - range.min)) * w;
  const y = (v: number) => m.top + (1 - Math.min(100, Math.max(0, v)) / 100) * h;
  const line = (pick: (o: Outcome) => number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x).toFixed(1)},${y(pick(p.outcome)).toFixed(1)}`).join(" ");
  const area = (pick: (o: Outcome) => number, band: (o: Outcome) => number) => {
    const upper = points.map(
      (p, i) => `${i === 0 ? "M" : "L"}${x(p.x).toFixed(1)},${y(pick(p.outcome) + band(p.outcome)).toFixed(1)}`,
    );
    const lower = [...points]
      .reverse()
      .map((p) => `L${x(p.x).toFixed(1)},${y(pick(p.outcome) - band(p.outcome)).toFixed(1)}`);
    return `${upper.join(" ")} ${lower.join(" ")} Z`;
  };
  const ticks = range.log
    ? Array.from({ length: Math.floor(range.max) - Math.ceil(range.min) + 1 }, (_, i) => Math.ceil(range.min) + i)
    : [0, 0.5, 1];
  const tickLabel = (t: number) => (range.log ? formatMultiplier(10 ** t) : `${Math.round(t * 100)}%`);
  const copy = LEVERS.find((l) => l.key === focus);
  const name = copy ? (isJa ? copy.ja.name : copy.en.name) : focus;
  const series = [
    { key: "hard", color: COLOR.hard, pick: (o: Outcome) => o.hard, band: (o: Outcome) => o.hardBand, label: isJa ? "判定しにくい仕事" : "hard to judge" },
    {
      key: "verifiable",
      color: COLOR.verifiable,
      pick: (o: Outcome) => o.verifiable,
      band: (o: Outcome) => o.verifiableBand,
      label: isJa ? "判定できる仕事" : "can be judged",
    },
  ];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          isJa
            ? `${name}を動かしたときの能力の変化（ほかのレバーは現在の位置のまま）`
            : `How capability changes with ${name}, other levers held where they are`
        }
      >
        <text x={2} y={9} textAnchor="start" className="fill-muted-foreground" fontSize={10}>
          {isJa ? "能力（相対値）" : "capability (relative)"}
        </text>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={m.left} x2={width - m.right} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={m.left - 5} y={y(v) + 3.5} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
              {v}
            </text>
          </g>
        ))}
        {ticks.map((t, i) => (
          <text
            key={t}
            x={x(t)}
            y={m.top + h + 14}
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 && x(t) > width - m.right - 20 ? "end" : "middle"}
            className="fill-muted-foreground"
            fontSize={10}
          >
            {tickLabel(t)}
          </text>
        ))}
        <text x={m.left + w / 2} y={height - 3} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
          {isJa ? `横軸: ${name}` : `x-axis: ${name}`}
        </text>
        {series.map((s) => (
          <path key={`${s.key}-band`} d={area(s.pick, s.band)} fill={s.color} fillOpacity={0.16} />
        ))}
        {series.map((s) => (
          <path key={`${s.key}-line`} d={line(s.pick)} fill="none" stroke={s.color} strokeWidth={2} />
        ))}
        <line
          x1={x(levers[focus])}
          x2={x(levers[focus])}
          y1={m.top}
          y2={m.top + h}
          className="stroke-muted-foreground"
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        {series.map((s) => (
          <circle key={`${s.key}-now`} cx={x(levers[focus])} cy={y(s.pick(now))} r={3.5} fill={s.color} />
        ))}
      </svg>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {[...series].reverse().map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
        <span>{isJa ? "帯は予測の幅、点線は現在の位置" : "bands = uncertainty, dashed line = current setting"}</span>
      </div>
    </div>
  );
}
