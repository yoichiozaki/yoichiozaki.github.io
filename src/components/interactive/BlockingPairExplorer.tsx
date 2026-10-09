"use client";

import { useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import {
  AgentBadge,
  ControlRow,
  GraphNode,
  Panel,
  PrefChip,
  REJECT_HEX,
  STABLE_HEX,
  Segmented,
  matchingCode,
  sideText,
  type ChipState,
} from "./stableMatchingUi";
import {
  CYCLE_EXAMPLE,
  CYCLE_SEQUENCE,
  CYCLE_START,
  RUNNING_EXAMPLE,
  blockingPairs,
  leftLabel,
  rankTable,
  resolveBlockingPair,
  rightLabel,
  stableMatchingFor,
  type Instance,
  type Pair,
  type Side,
} from "@/lib/stable-matching";

type Props = { locale?: string };
type PresetKey = "cycle" | "running";

const PRESETS: Record<PresetKey, { inst: Instance; start: number[] }> = {
  cycle: { inst: CYCLE_EXAMPLE, start: CYCLE_START },
  running: { inst: RUNNING_EXAMPLE, start: [0, 1, 2, 3] },
};

type HistoryEntry = { match: number[]; via: string };

/** Matchings visited by the scripted cycle: CYCLE_STATES[k] is resolved by CYCLE_SEQUENCE[k]. */
const CYCLE_STATES: number[][] = CYCLE_SEQUENCE.reduce<number[][]>(
  (acc, pair) => [...acc, resolveBlockingPair(acc[acc.length - 1], pair)],
  [[...CYCLE_START]],
).slice(0, CYCLE_SEQUENCE.length);

const ROW_H = 40;
const SVG_W = 150;

export function BlockingPairExplorer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [presetKey, setPresetKey] = useState<PresetKey>("cycle");
  const [match, setMatch] = useState<number[]>(() => [...CYCLE_START]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => [
    { match: [...CYCLE_START], via: "start" },
  ]);
  const [scenarioPos, setScenarioPos] = useState(0);
  const [focus, setFocus] = useState<Pair | null>(null);

  const { inst } = PRESETS[presetKey];
  const n = inst.left.length;
  const rL = rankTable(inst.left, n);
  const rR = rankTable(inst.right, n);
  const inv = new Array<number>(n);
  match.forEach((j, i) => (inv[j] = i));
  const blocking = blockingPairs(inst, match);
  const L = (i: number) => leftLabel(i);
  const Rn = (j: number) => rightLabel(j, n);
  const code = (m: number[]) => matchingCode(m, L, Rn);

  const revisit = history
    .slice(0, -1)
    .findIndex((h) => h.match.join() === match.join());

  const push = (m: number[], via: string) => {
    setMatch(m);
    setHistory((h) => [...h, { match: m, via }]);
    setFocus(null);
  };

  const choosePreset = (k: PresetKey) => {
    setPresetKey(k);
    const start = [...PRESETS[k].start];
    setMatch(start);
    setHistory([{ match: start, via: "start" }]);
    setScenarioPos(0);
    setFocus(null);
  };

  const assign = (i: number, j: number) => {
    if (match[i] === j) return;
    const m = [...match];
    const other = m.indexOf(j);
    m[other] = m[i];
    m[i] = j;
    push(m, isJa ? `手動: ${L(i)}–${Rn(j)}` : `manual: ${L(i)}–${Rn(j)}`);
  };

  const resolve = (pair: Pair) => {
    push(resolveBlockingPair(match, pair), `(${L(pair[0])}, ${Rn(pair[1])})`);
  };

  const scenarioNext = () => {
    if (presetKey !== "cycle") return;
    if (match.join() !== CYCLE_STATES[scenarioPos].join()) {
      setMatch([...CYCLE_START]);
      setHistory([{ match: [...CYCLE_START], via: "start" }]);
      setScenarioPos(0);
      setFocus(null);
      return;
    }
    resolve(CYCLE_SEQUENCE[scenarioPos]);
    setScenarioPos((p) => (p + 1) % CYCLE_SEQUENCE.length);
  };

  const runGS = () => {
    const m = stableMatchingFor(inst, "left") as number[];
    push(m, isJa ? "GS（A 側が提案）" : "GS (left proposes)");
  };

  const reset = () => choosePreset(presetKey);

  const isFocus = (i: number, j: number) => focus?.[0] === i && focus?.[1] === j;

  const chipState = (side: Side, idx: number, other: number): ChipState => {
    const i = side === "left" ? idx : other;
    const j = side === "left" ? other : idx;
    if (match[i] === j) return "held";
    if (focus && focus[0] === i && focus[1] === j) return "proposing";
    return "idle";
  };

  const explain = ([i, j]: Pair) => {
    const myRank = rL[i][j] + 1;
    const curRank = rL[i][match[i]] + 1;
    const theirRank = rR[j][i] + 1;
    const theirCur = rR[j][inv[j]] + 1;
    return isJa
      ? `${L(i)} は今の ${Rn(match[i])}（${curRank} 位）より ${Rn(j)}（${myRank} 位）を好み、${Rn(j)} も今の ${L(inv[j])}（${theirCur} 位）より ${L(i)}（${theirRank} 位）を好む。`
      : `${L(i)} prefers ${Rn(j)} (#${myRank}) to its partner ${Rn(match[i])} (#${curRank}), and ${Rn(j)} prefers ${L(i)} (#${theirRank}) to its partner ${L(inv[j])} (#${theirCur}).`;
  };

  const y = (k: number) => k * ROW_H + ROW_H / 2;
  const xL = 14;
  const xR = SVG_W - 14;

  const column = (side: Side) => {
    const lists = side === "left" ? inst.left : inst.right;
    return (
      <div className="min-w-0">
        <div className={`flex h-7 items-center text-[11px] font-semibold ${sideText[side]}`}>
          {side === "left"
            ? `${L(0)}–${L(n - 1)}`
            : `${Rn(0)}–${Rn(n - 1)}`}
          <span className="ml-1.5 font-normal text-muted-foreground">
            {isJa ? "· クリックで組を作る" : "· click to pair"}
          </span>
        </div>
        {lists.map((list, idx) => (
          <div key={idx} className="flex h-10 items-center gap-1.5">
            <AgentBadge side={side} name={side === "left" ? L(idx) : Rn(idx)} />
            <div className="flex flex-wrap gap-1">
              {list.map((other) => {
                const i = side === "left" ? idx : other;
                const j = side === "left" ? other : idx;
                const name = side === "left" ? Rn(other) : L(other);
                return (
                  <PrefChip
                    key={other}
                    name={name}
                    state={chipState(side, idx, other)}
                    onClick={() => assign(i, j)}
                    title={
                      isJa
                        ? `${L(i)} と ${Rn(j)} を組にする`
                        : `Pair ${L(i)} with ${Rn(j)}`
                    }
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "ブロッキングペアを探す — そして «1 組ずつ直す» が失敗する様子"
          : "Hunting blocking pairs — and watching one-at-a-time repair fail"
      }
      description={
        isJa
          ? "好みのチップをクリックしてマッチングを組み替えると、ブロッキングペアが赤い破線で現れます。ペアを «解消» すると、その 2 人が組になり、取り残された 2 人同士が組になります。"
          : "Click chips to rearrange the matching; blocking pairs appear as red dashed lines. Resolving one pairs those two up and pairs their abandoned partners with each other."
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <ControlRow label={isJa ? "インスタンス" : "Instance"}>
          <Segmented
            ariaLabel={isJa ? "インスタンス" : "Instance"}
            value={presetKey}
            options={[
              { value: "cycle", label: isJa ? "循環する例（3×3）" : "Cycling example (3×3)" },
              { value: "running", label: isJa ? "基本例（4×4）" : "Running example (4×4)" },
            ]}
            onChange={choosePreset}
          />
        </ControlRow>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[max-content_150px_max-content] md:justify-center md:gap-2">
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
                ? `マッチング ${code(match)}、ブロッキングペア ${blocking.length} 組`
                : `Matching ${code(match)} with ${blocking.length} blocking pairs`
            }
          >
            {match.map((j, i) => (
              <line
                key={`m-${i}`}
                x1={xL + 11}
                y1={y(i)}
                x2={xR - 11}
                y2={y(j)}
                stroke={blocking.length === 0 ? STABLE_HEX : "currentColor"}
                strokeOpacity={blocking.length === 0 ? 1 : 0.6}
                strokeWidth={2.5}
              />
            ))}
            {blocking.map(([i, j]) => (
              <line
                key={`b-${i}-${j}`}
                x1={xL + 11}
                y1={y(i)}
                x2={xR - 11}
                y2={y(j)}
                stroke={REJECT_HEX}
                strokeWidth={isFocus(i, j) ? 3.5 : 2}
                strokeDasharray="5 4"
              />
            ))}
            {Array.from({ length: n }, (_, k) => (
              <g key={k}>
                <GraphNode x={xL} y={y(k)} dotX={xL + 11} side="left" name={L(k)} />
                <GraphNode x={xR} y={y(k)} dotX={xR - 11} side="right" name={Rn(k)} />
              </g>
            ))}
          </svg>
        </div>
        {column("right")}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel
          title={
            blocking.length === 0
              ? isJa
                ? "判定"
                : "Verdict"
              : isJa
                ? `ブロッキングペア ${blocking.length} 組`
                : `${blocking.length} blocking pair${blocking.length > 1 ? "s" : ""}`
          }
        >
          {blocking.length === 0 ? (
            <p className="text-xs font-semibold" style={{ color: STABLE_HEX }}>
              {isJa
                ? `✓ ${code(match)} は安定です。誰と誰が駆け落ちしても、少なくとも一方は損をします。`
                : `✓ ${code(match)} is stable: any pair that ran off together would leave at least one of them worse off.`}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {blocking.map((pair) => (
                <li
                  key={pair.join()}
                  className="flex flex-col gap-1 rounded-md border border-border p-2 sm:flex-row sm:items-center sm:justify-between"
                  onMouseEnter={() => setFocus(pair)}
                  onMouseLeave={() => setFocus(null)}
                >
                  <span className="text-xs leading-relaxed text-foreground">
                    <span className="font-mono font-semibold" style={{ color: REJECT_HEX }}>
                      ({L(pair[0])}, {Rn(pair[1])})
                    </span>{" "}
                    {explain(pair)}
                  </span>
                  <button
                    type="button"
                    onClick={() => resolve(pair)}
                    onFocus={() => setFocus(pair)}
                    onBlur={() => setFocus(null)}
                    className="shrink-0 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
                  >
                    {isJa ? "この組で解消" : "Resolve"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={isJa ? "操作" : "Actions"}>
          <div className="flex flex-wrap gap-2">
            {presetKey === "cycle" && (
              <button
                type="button"
                onClick={scenarioNext}
                className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground hover:bg-accent/90"
              >
                {isJa
                  ? `循環シナリオ: 次の 1 手（${scenarioPos + 1}/4）`
                  : `Cycle scenario: next move (${scenarioPos + 1}/4)`}
              </button>
            )}
            <button
              type="button"
              onClick={runGS}
              className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
            >
              {isJa ? "Gale–Shapley で求める" : "Solve with Gale–Shapley"}
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-accent hover:text-foreground"
            >
              {isJa ? "最初に戻す" : "Reset"}
            </button>
          </div>
          {presetKey === "cycle" && (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {isJa
                ? "シナリオは (C, X) → (C, Y) → (A, Y) → (A, X) の順に、その時点で実在するブロッキングペアだけを解消します。4 手で出発点に戻ります。"
                : "The scenario resolves (C, X) → (C, Y) → (A, Y) → (A, X), each a genuine blocking pair at that moment. After four moves it is back where it started."}
            </p>
          )}
        </Panel>
      </div>

      <Panel className="mt-3" title={isJa ? "たどったマッチング" : "Matchings visited"}>
        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
          {history.map((h, k) => (
            <span key={k} className="inline-flex items-center gap-1">
              {k > 0 && (
                <span className="text-muted-foreground">
                  →<span className="mx-0.5 text-[10px]">{h.via}</span>→
                </span>
              )}
              <span
                className={`rounded border px-1.5 py-0.5 ${
                  k === history.length - 1
                    ? "border-accent text-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {code(h.match)}
              </span>
            </span>
          ))}
        </div>
        {revisit >= 0 && (
          <p className="mt-2 text-xs font-semibold" style={{ color: REJECT_HEX }}>
            {isJa
              ? `⚠ ${code(match)} は ${revisit + 1} 番目に一度訪れたマッチングです。同じ選び方を続ける限り、この手続きは永遠に回り続けます。`
              : `⚠ ${code(match)} was already visited (entry ${revisit + 1}). Keep choosing the same way and this process loops forever.`}
          </p>
        )}
      </Panel>
    </InteractiveDemo>
  );
}
