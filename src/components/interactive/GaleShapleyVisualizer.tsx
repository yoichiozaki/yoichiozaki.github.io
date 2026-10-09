"use client";

import { useId, useMemo, useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { stepPlayerAriaLabels } from "./stepPlayerAriaLabels";
import { useStepPlayer } from "./useStepPlayer";
import {
  AgentBadge,
  ControlRow,
  GraphNode,
  PROPOSAL_HEX,
  Panel,
  PrefChip,
  REJECT_HEX,
  STABLE_HEX,
  Segmented,
  matchingCode,
  sanitizeId,
  sideText,
  type ChipState,
} from "./stableMatchingUi";
import {
  IDENTICAL_LISTS,
  RUNNING_EXAMPLE,
  WORST_CASE,
  blockingPairs,
  cloneInstance,
  deferredAcceptance,
  immediateAcceptance,
  invert,
  leftLabel,
  orient,
  randomInstance,
  rankTable,
  rightLabel,
  type Instance,
  type Order,
  type Side,
  type Trace,
  type TraceStep,
} from "@/lib/stable-matching";

type Props = { locale?: string };
type Preset = "running" | "worst" | "identical" | "random" | "custom";
type Mechanism = "da" | "boston";

const ROW_H = 44;
const SVG_W = 160;

const PRESET_INSTANCES: Record<"running" | "worst" | "identical", Instance> = {
  running: RUNNING_EXAMPLE,
  worst: WORST_CASE,
  identical: IDENTICAL_LISTS,
};

type Text = { ja: string; en: string };

export function GaleShapleyVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const t = (x: Text) => (isJa ? x.ja : x.en);
  const markerId = sanitizeId(useId());

  const [instance, setInstance] = useState<Instance>(() => cloneInstance(RUNNING_EXAMPLE));
  const [preset, setPreset] = useState<Preset>("running");
  const [proposing, setProposing] = useState<Side>("left");
  const [order, setOrder] = useState<Order>("queue");
  const [mechanism, setMechanism] = useState<Mechanism>("da");
  const [seed, setSeed] = useState(1);
  const [randomSeed, setRandomSeed] = useState(7);

  const n = instance.left.length;
  const receiving: Side = proposing === "left" ? "right" : "left";
  const nameOf = (side: Side, idx: number) =>
    side === "left" ? leftLabel(idx) : rightLabel(idx, n);
  const pName = (p: number) => nameOf(proposing, p);
  const rName = (r: number) => nameOf(receiving, r);

  const effectiveOrder: Order = mechanism === "boston" ? "round" : order;

  const trace: Trace = useMemo(() => {
    const { P, R } = orient(instance, proposing);
    return mechanism === "da"
      ? deferredAcceptance(P, R, { order: effectiveOrder, seed })
      : immediateAcceptance(P, R);
  }, [instance, proposing, mechanism, effectiveOrder, seed]);

  const { P, R } = orient(instance, proposing);
  const rankR = useMemo(() => rankTable(R, P.length), [R, P.length]);
  const rankP = useMemo(() => rankTable(P, R.length), [P, R.length]);

  const totalFrames = trace.steps.length + 1;
  const player = useStepPlayer({
    totalSteps: totalFrames,
    intervalMs: effectiveOrder === "round" ? 1700 : 1200,
  });
  const frame = Math.min(player.step, totalFrames - 1);
  const step: TraceStep | null = frame === 0 ? null : trace.steps[frame - 1];
  const isFinal = frame === totalFrames - 1;
  const held = step ? step.held : R.map(() => [] as number[]);
  const next = step ? step.next : P.map(() => 0);

  const holderOf = new Array<number | null>(P.length).fill(null);
  held.forEach((list, r) => list.forEach((p) => (holderOf[p] = r)));
  const proposedTo = (p: number, r: number) => P[p].slice(0, next[p]).includes(r);
  const inStep = (p: number, r: number) =>
    step?.proposals.some((x) => x.p === p && x.r === r) ?? false;

  const leftMatch =
    proposing === "left" ? holderOf : invert(holderOf, instance.left.length);
  const blocking = isFinal ? blockingPairs(instance, leftMatch) : [];

  const resetWith = (fn: () => void) => {
    player.reset();
    fn();
  };

  const choosePreset = (p: Preset) => {
    if (p === "custom") return;
    resetWith(() => {
      setPreset(p);
      if (p === "random") {
        const s = randomSeed + 1;
        setRandomSeed(s);
        setInstance(randomInstance(4, s));
      } else {
        setInstance(cloneInstance(PRESET_INSTANCES[p]));
      }
    });
  };

  const bump = (side: Side, idx: number, k: number) => {
    if (k === 0) return;
    resetWith(() => {
      setInstance((prev) => {
        const copy = cloneInstance(prev);
        const list = side === "left" ? copy.left[idx] : copy.right[idx];
        [list[k - 1], list[k]] = [list[k], list[k - 1]];
        return copy;
      });
      setPreset("custom");
    });
  };

  /* ── chip states ─────────────────────────────────────── */

  const proposerChip = (p: number, k: number): ChipState => {
    const r = P[p][k];
    if (isFinal && holderOf[p] === r) return "final";
    if (inStep(p, r)) return "proposing";
    if (holderOf[p] === r) return "held";
    if (k < next[p]) return "rejected";
    if (k === next[p] && holderOf[p] === null && !isFinal) return "next";
    return "idle";
  };
  const receiverChip = (r: number, k: number): ChipState => {
    const p = R[r][k];
    if (isFinal && held[r].includes(p)) return "final";
    if (inStep(p, r)) return "proposing";
    if (held[r].includes(p)) return "held";
    if (proposedTo(p, r)) return "rejected";
    return "idle";
  };

  const chipStateFor = (side: Side, idx: number, k: number): ChipState =>
    side === proposing ? proposerChip(idx, k) : receiverChip(idx, k);

  /* ── step narration ──────────────────────────────────── */

  const ord = (k: number) => (isJa ? `第 ${k} 希望` : `choice #${k}`);
  const describe = (): Text => {
    if (!step) {
      return {
        ja: `全員がフリーの状態から始めます。提案側（${pName(0)}〜${pName(P.length - 1)}）は自分のリストの上から順に申し込みます。${
          mechanism === "da"
            ? "受理側は «いちばん良い申し込み» を仮に保持し、それ以外を断ります。"
            : "即時受入では、受理側は受け入れた申し込みを «その場で確定» します。"
        }`,
        en: `Everyone starts free. The proposers (${pName(0)}–${pName(P.length - 1)}) apply down their lists from the top. ${
          mechanism === "da"
            ? "Each receiver tentatively holds the best offer so far and rejects the rest."
            : "Under immediate acceptance, a receiver's acceptance is final on the spot."
        }`,
      };
    }
    if (mechanism === "boston") {
      const parts: Text[] = [];
      for (let r = 0; r < R.length; r++) {
        const incoming = step.proposals.filter((x) => x.r === r);
        if (incoming.length === 0) continue;
        const won = incoming.find((x) => x.outcome === "held");
        const losers = incoming.filter((x) => x.outcome !== "held").map((x) => pName(x.p));
        if (won) {
          parts.push({
            ja: `${rName(r)} は ${incoming.map((x) => pName(x.p)).join("・")} の中から ${pName(won.p)} を確定で受け入れ${
              losers.length ? `、${losers.join("・")} を断ります` : "ます"
            }。`,
            en: `${rName(r)} accepts ${pName(won.p)} for good${
              losers.length ? ` and turns away ${losers.join(", ")}` : ""
            }.`,
          });
        } else {
          parts.push({
            ja: `${rName(r)} はすでに ${pName(held[r][0])} で埋まっているので、${losers.join("・")} を断ります（席が空いていない）。`,
            en: `${rName(r)} is already filled by ${pName(held[r][0])}, so it turns away ${losers.join(", ")} — no matter how much it would prefer them.`,
          });
        }
      }
      const list = step.proposals.map((x) => `${pName(x.p)}→${rName(x.r)}`).join(", ");
      return {
        ja: `ラウンド ${step.round}（未確定者は第 ${step.round} 希望へ）: ${list}。${parts.map((x) => x.ja).join("")}`,
        en: `Round ${step.round} (everyone unassigned applies to choice #${step.round}): ${list}. ${parts
          .map((x) => x.en)
          .join(" ")}`,
      };
    }
    if (effectiveOrder === "round") {
      const list = step.proposals.map((x) => `${pName(x.p)}→${rName(x.r)}`).join(", ");
      const parts: Text[] = [];
      for (let r = 0; r < R.length; r++) {
        const incoming = step.proposals.filter((x) => x.r === r);
        if (incoming.length === 0) continue;
        const keeper = held[r][0];
        const dropped = step.displaced.filter((d) => d.r === r).map((d) => pName(d.p));
        const rejected = incoming.filter((x) => x.outcome !== "held").map((x) => pName(x.p));
        const cut = [...dropped, ...rejected];
        parts.push({
          ja: `${rName(r)} は ${pName(keeper)} を保持${cut.length ? `し、${cut.join("・")} を断ります` : "します"}${
            dropped.length ? `（${dropped.join("・")} は前ラウンドまで保持されていました）` : ""
          }。`,
          en: `${rName(r)} holds ${pName(keeper)}${cut.length ? ` and rejects ${cut.join(", ")}` : ""}${
            dropped.length ? ` (${dropped.join(", ")} had been held until now)` : ""
          }.`,
        });
      }
      return {
        ja: `ラウンド ${step.round}: フリーな全員が同時に申し込みます — ${list}。${parts.map((x) => x.ja).join("")}`,
        en: `Round ${step.round}: every free proposer applies at once — ${list}. ${parts
          .map((x) => x.en)
          .join(" ")}`,
      };
    }
    const { p, r, outcome } = step.proposals[0];
    const k = rankP[p][r] + 1;
    const d = step.displaced[0];
    if (outcome === "held" && d) {
      return {
        ja: `${pName(p)} が ${rName(r)} に申し込み（${ord(k)}）。${rName(r)} は ${pName(d.p)} を仮保持していましたが、${rName(r)} の好みでは ${pName(p)}（${rankR[r][p] + 1} 位）が ${pName(d.p)}（${rankR[r][d.p] + 1} 位）より上。${pName(d.p)} を手放して ${pName(p)} に乗り換えます。${pName(d.p)} はフリーに戻り、リストの次の相手へ進みます。`,
        en: `${pName(p)} proposes to ${rName(r)} (${ord(k)}). ${rName(r)} was holding ${pName(d.p)}, but ranks ${pName(p)} #${rankR[r][p] + 1} above ${pName(d.p)} #${rankR[r][d.p] + 1}, so it trades up. ${pName(d.p)} is free again and moves on down their list.`,
      };
    }
    if (outcome === "held") {
      return {
        ja: `${pName(p)} が ${rName(r)} に申し込み（${ord(k)}）。${rName(r)} は誰も保持していないので、${pName(p)} を «仮に» 保持します。まだ確定ではありません。`,
        en: `${pName(p)} proposes to ${rName(r)} (${ord(k)}). ${rName(r)} holds nobody yet, so it keeps ${pName(p)} — tentatively, not for good.`,
      };
    }
    const h = held[r][0];
    return {
      ja: `${pName(p)} が ${rName(r)} に申し込み（${ord(k)}）。${rName(r)} は ${pName(h)}（${rankR[r][h] + 1} 位）を保持中で、${pName(p)}（${rankR[r][p] + 1} 位）よりそちらを好むので断ります。`,
      en: `${pName(p)} proposes to ${rName(r)} (${ord(k)}). ${rName(r)} already holds ${pName(h)} (#${rankR[r][h] + 1}), whom it prefers to ${pName(p)} (#${rankR[r][p] + 1}), so ${pName(p)} is rejected.`,
    };
  };

  const narration = describe();

  /* ── final summary ───────────────────────────────────── */

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const proposerRanks = holderOf.flatMap((r, p) => (r === null ? [] : [rankP[p][r] + 1]));
  const receiverRanks = held.flatMap((list, r) => list.map((p) => rankR[r][p] + 1));
  const code = matchingCode(leftMatch, leftLabel, (j) => rightLabel(j, n));

  /* ── geometry ────────────────────────────────────────── */

  const y = (k: number) => k * ROW_H + ROW_H / 2;
  const xL = 16;
  const xR = SVG_W - 16;
  const toDisplay = (p: number, r: number) =>
    proposing === "left" ? { l: p, r } : { l: r, r: p };
  const segment = (l: number, r: number, from: Side) => {
    const ax = xL + 12;
    const bx = xR - 12;
    const ay = y(l);
    const by = y(r);
    return from === "left"
      ? { x1: ax, y1: ay, x2: bx, y2: by }
      : { x1: bx, y1: by, x2: ax, y2: ay };
  };

  const heldLines = held.flatMap((list, r) =>
    list.map((p) => {
      const d = toDisplay(p, r);
      return { key: `h-${p}-${r}`, ...segment(d.l, d.r, "left") };
    }),
  );
  const proposalLines = (step?.proposals ?? []).map((x) => {
    const d = toDisplay(x.p, x.r);
    return { key: `p-${x.p}-${x.r}`, outcome: x.outcome, ...segment(d.l, d.r, proposing) };
  });
  const displacedLines = (step?.displaced ?? []).map((x) => {
    const d = toDisplay(x.p, x.r);
    return { key: `d-${x.p}-${x.r}`, ...segment(d.l, d.r, receiving) };
  });

  const heldStroke = isFinal ? STABLE_HEX : "currentColor";
  const blockingLines = blocking.map(([i, j]) => ({
    key: `b-${i}-${j}`,
    ...segment(i, j, "left"),
  }));

  /** Rank of the current (or next) partner: proposers' numbers only grow, receivers' only shrink. */
  const rankTrack = (side: Side, idx: number) => {
    let text = "";
    let title = "";
    if (side === proposing) {
      const r = holderOf[idx];
      if (r !== null) {
        text = `#${rankP[idx][r] + 1}`;
        title = isJa ? "今の相手の順位（増える一方）" : "rank of current partner (only grows)";
      } else if (next[idx] < P[idx].length && !isFinal) {
        text = `→#${next[idx] + 1}`;
        title = isJa ? "次に申し込む相手の順位" : "rank of the next proposal";
      } else {
        text = "–";
      }
    } else {
      const p = held[idx][0];
      if (p !== undefined) {
        text = `#${rankR[idx][p] + 1}`;
        title = isJa ? "保持中の相手の順位（減る一方）" : "rank of the held proposer (only shrinks)";
      } else {
        text = "–";
      }
    }
    return (
      <span
        className="ml-1 w-8 shrink-0 font-mono text-[10px] text-muted-foreground"
        title={title}
      >
        {text}
      </span>
    );
  };

  const sideHeader = (side: Side) => {
    const names =
      side === "left"
        ? `${leftLabel(0)}–${leftLabel(n - 1)}`
        : `${rightLabel(0, n)}–${rightLabel(n - 1, n)}`;
    const role =
      side === proposing
        ? isJa
          ? "提案側"
          : "proposers"
        : isJa
          ? "受理側"
          : "receivers";
    return (
      <div className="flex h-7 items-center gap-1.5 text-[11px] font-semibold">
        <span className={sideText[side]}>{names}</span>
        <span className="text-muted-foreground">· {role}</span>
      </div>
    );
  };

  const column = (side: Side) => {
    const lists = side === "left" ? instance.left : instance.right;
    return (
      <div className="min-w-0">
        {sideHeader(side)}
        {lists.map((list, idx) => {
          const self = nameOf(side, idx);
          return (
            <div key={idx} className="flex h-11 items-center gap-1.5">
              <AgentBadge side={side} name={self} />
              <span className="text-[10px] text-muted-foreground">:</span>
              <div className="flex flex-wrap gap-1">
                {list.map((other, k) => {
                  const otherName = nameOf(side === "left" ? "right" : "left", other);
                  return (
                    <PrefChip
                      key={other}
                      name={otherName}
                      state={chipStateFor(side, idx, k)}
                      onClick={k > 0 ? () => bump(side, idx, k) : undefined}
                      title={
                        k > 0
                          ? isJa
                            ? `${self} の好みで ${otherName} を 1 つ上げる`
                            : `Move ${otherName} up one place in ${self}'s list`
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              {rankTrack(side, idx)}
            </div>
          );
        })}
      </div>
    );
  };

  const presetOptions: { value: Preset; label: string }[] = [
    { value: "running", label: isJa ? "基本例" : "Running example" },
    { value: "worst", label: isJa ? "最悪ケース" : "Worst case" },
    { value: "identical", label: isJa ? "全員同じ好み" : "Identical lists" },
    { value: "random", label: isJa ? "ランダム" : "Random" },
  ];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "Gale–Shapley（受入保留）を 1 手ずつ動かす"
          : "Gale–Shapley deferred acceptance, one move at a time"
      }
      description={
        isJa
          ? "提案側・提案順序・受入方式を切り替えて再生できます。好みのチップをクリックすると 1 つ上に繰り上がり、好みを自由に編集できます。"
          : "Switch the proposing side, the proposal order and the acceptance rule, then play. Click any chip in a list to move it up one place and edit preferences."
      }
    >
      <div className="mb-4 flex flex-col gap-2">
        <ControlRow label={isJa ? "インスタンス" : "Instance"}>
          <Segmented
            ariaLabel={isJa ? "インスタンス" : "Instance"}
            value={preset}
            options={presetOptions}
            onChange={choosePreset}
          />
          {preset === "custom" && (
            <span className="text-[11px] text-muted-foreground">
              {isJa ? "（編集済み）" : "(edited)"}
            </span>
          )}
        </ControlRow>
        <ControlRow label={isJa ? "提案する側" : "Who proposes"}>
          <Segmented
            ariaLabel={isJa ? "提案する側" : "Who proposes"}
            value={proposing}
            options={[
              { value: "left", label: isJa ? "A〜D が提案" : "A–D propose" },
              { value: "right", label: isJa ? "W〜Z が提案" : "W–Z propose" },
            ]}
            onChange={(v) => resetWith(() => setProposing(v))}
          />
        </ControlRow>
        <ControlRow label={isJa ? "受入方式" : "Acceptance"}>
          <Segmented
            ariaLabel={isJa ? "受入方式" : "Acceptance rule"}
            value={mechanism}
            options={[
              { value: "da", label: isJa ? "受入保留（DA）" : "Deferred (DA)" },
              { value: "boston", label: isJa ? "即時受入（Boston）" : "Immediate (Boston)" },
            ]}
            onChange={(v) => resetWith(() => setMechanism(v))}
          />
        </ControlRow>
        <ControlRow label={isJa ? "提案の順序" : "Proposal order"}>
          <Segmented
            ariaLabel={isJa ? "提案の順序" : "Proposal order"}
            value={effectiveOrder}
            disabled={mechanism === "boston"}
            options={[
              { value: "queue", label: isJa ? "キュー" : "Queue" },
              { value: "stack", label: isJa ? "スタック" : "Stack" },
              { value: "random", label: isJa ? "ランダム" : "Random" },
              { value: "round", label: isJa ? "全員同時（ラウンド）" : "All at once (rounds)" },
            ]}
            onChange={(v) => resetWith(() => setOrder(v))}
          />
          {effectiveOrder === "random" && (
            <button
              type="button"
              onClick={() => resetWith(() => setSeed((s) => s + 1))}
              className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {isJa ? "別の順序を引く" : "Draw another order"}
            </button>
          )}
        </ControlRow>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[max-content_160px_max-content] md:justify-center md:gap-2">
        {column("left")}
        <div className="order-first flex flex-col items-center md:order-none">
          <div className="hidden h-7 md:block" />
          <svg
            width={SVG_W}
            height={n * ROW_H}
            viewBox={`0 0 ${SVG_W} ${n * ROW_H}`}
            className="text-foreground"
            role="img"
            aria-label={
              isJa
                ? `現在の仮マッチング: ${code}`
                : `Current tentative matching: ${code}`
            }
          >
            <defs>
              <marker
                id={`${markerId}-arrow`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={PROPOSAL_HEX} />
              </marker>
            </defs>
            {heldLines.map((l) => (
              <line
                key={l.key}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={heldStroke}
                strokeOpacity={isFinal ? 1 : 0.55}
                strokeWidth={isFinal ? 3 : 2.25}
                strokeDasharray={!isFinal && mechanism === "da" ? "5 3" : undefined}
              />
            ))}
            {displacedLines.map((l) => (
              <g key={l.key}>
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={REJECT_HEX}
                  strokeWidth={1.75}
                  strokeDasharray="3 3"
                />
                <text
                  x={l.x2 + (l.x2 < SVG_W / 2 ? 9 : -9)}
                  y={l.y2 - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={REJECT_HEX}
                >
                  ×
                </text>
              </g>
            ))}
            {proposalLines.map((l) => (
              <g key={l.key}>
                <line
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={PROPOSAL_HEX}
                  strokeWidth={2.5}
                  markerEnd={`url(#${markerId}-arrow)`}
                />
                {l.outcome !== "held" && (
                  <text
                    x={(l.x1 + l.x2 * 3) / 4}
                    y={(l.y1 + l.y2 * 3) / 4 - 6}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill={REJECT_HEX}
                  >
                    ×
                  </text>
                )}
              </g>
            ))}
            {blockingLines.map((l) => (
              <line
                key={l.key}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke={REJECT_HEX}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ))}
            {Array.from({ length: n }, (_, k) => (
              <g key={`nodes-${k}`}>
                <GraphNode x={xL} y={y(k)} dotX={xL + 12} side="left" name={leftLabel(k)} />
                <GraphNode x={xR} y={y(k)} dotX={xR - 12} side="right" name={rightLabel(k, n)} />
              </g>
            ))}
          </svg>
        </div>
        {column("right")}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-5" style={{ backgroundColor: PROPOSAL_HEX }} />
          {isJa ? "この手の申し込み" : "proposal in this step"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-4 rounded border border-dashed border-[#e8a55a]" />
          {isJa ? "次に申し込む相手" : "next proposal"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-5 border-t-2 border-dashed border-foreground/50" />
          {mechanism === "da"
            ? isJa
              ? "仮の保持（まだ覆りうる）"
              : "tentatively held (may still change)"
            : isJa
              ? "確定した受け入れ"
              : "final acceptance"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="font-bold" style={{ color: REJECT_HEX }}>
            ×
          </span>
          {isJa ? "拒否・手放し" : "rejection / dropped"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-0.5 w-5" style={{ backgroundColor: STABLE_HEX }} />
          {isJa ? "最終結果" : "final result"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: REJECT_HEX }} />
          {isJa ? "結果に残ったブロッキングペア" : "blocking pair left in the result"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="font-mono">#k</span>
          {isJa
            ? "行末: 今の相手の順位（提案側は増える一方、受理側は減る一方）"
            : "row end: rank of the current partner (grows for proposers, shrinks for receivers)"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title={isJa ? "この手で起きたこと" : "What happened"}>
          <p className="text-xs leading-relaxed text-foreground">{t(narration)}</p>
        </Panel>
        <Panel title={isJa ? "集計" : "Tally"}>
          <div className="space-y-1 text-xs text-foreground">
            <div>
              {isJa ? "申し込み回数: " : "Proposals so far: "}
              <span className="font-mono font-semibold">{step?.totalProposals ?? 0}</span>
              {mechanism === "da" && (
                <span className="text-muted-foreground">
                  {isJa
                    ? ` / 上限 ${n * n - n + 1}（n²−n+1）`
                    : ` / bound ${n * n - n + 1} (n²−n+1)`}
                </span>
              )}
              {isFinal && mechanism === "da" && (
                <span className="text-muted-foreground">
                  {isJa
                    ? `（= 提案側の最終順位の合計 ${proposerRanks.join("+")}）`
                    : ` (= sum of proposers' final ranks ${proposerRanks.join("+")})`}
                </span>
              )}
              {mechanism === "da" && (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ((step?.totalProposals ?? 0) / (n * n - n + 1)) * 100)}%`,
                      backgroundColor: PROPOSAL_HEX,
                    }}
                  />
                </div>
              )}
            </div>
            <div>
              {isJa ? "現在の組: " : "Current pairs: "}
              <span className="font-mono">{code}</span>
            </div>
            {isFinal && (
              <>
                <div>
                  {isJa ? "平均順位: 提案側 " : "Average rank: proposers "}
                  <span className="font-mono font-semibold">{avg(proposerRanks).toFixed(2)}</span>
                  {isJa ? " / 受理側 " : " / receivers "}
                  <span className="font-mono font-semibold">{avg(receiverRanks).toFixed(2)}</span>
                </div>
                {blocking.length === 0 ? (
                  <div className="font-semibold" style={{ color: STABLE_HEX }}>
                    {isJa ? "✓ ブロッキングペアなし — 安定" : "✓ No blocking pair — stable"}
                  </div>
                ) : (
                  <div className="font-semibold" style={{ color: REJECT_HEX }}>
                    {isJa ? "✗ ブロッキングペア: " : "✗ Blocking pairs: "}
                    {blocking
                      .map(([i, j]) => `(${leftLabel(i)}, ${rightLabel(j, n)})`)
                      .join(", ")}
                    {isJa ? " — 不安定" : " — unstable"}
                  </div>
                )}
                {mechanism === "da" && (
                  <div className="text-muted-foreground">
                    {isJa
                      ? "提案の順序を変えて再生しても、最終結果と申し込み回数は変わりません。"
                      : "Replay with another proposal order: the result and the proposal count stay the same."}
                  </div>
                )}
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          step={frame}
          isFirst={frame === 0}
          isLast={isFinal}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(s) =>
            s === 0
              ? isJa
                ? "開始"
                : "start"
              : effectiveOrder === "round"
                ? isJa
                  ? `ラウンド ${trace.steps[s - 1]?.round ?? ""}`
                  : `round ${trace.steps[s - 1]?.round ?? ""}`
                : isJa
                  ? `申し込み ${s}`
                  : `proposal ${s}`
          }
        />
      </div>
    </InteractiveDemo>
  );
}
