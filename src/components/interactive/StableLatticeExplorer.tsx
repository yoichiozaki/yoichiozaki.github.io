"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import {
  ControlRow,
  Panel,
  SIDE_HEX,
  STABLE_HEX,
  Segmented,
  matchingCode,
  sideText,
} from "./stableMatchingUi";
import {
  MAX_LATTICE,
  RUNNING_EXAMPLE,
  joinMeet,
  leftLabel,
  randomInstance,
  rightLabel,
  stableLattice,
  type Instance,
} from "@/lib/stable-matching";

type Props = { locale?: string };
type PresetKey = "running" | "max" | "random";

const BOX_W = 104;
const BOX_H = 36;
const GAP_X = 18;
const LEVEL_H = 74;

export function StableLatticeExplorer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [presetKey, setPresetKey] = useState<PresetKey>("running");
  const [randomSeed, setRandomSeed] = useState(41);
  const [selected, setSelected] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [other, setOther] = useState<number | null>(null);
  const [awaitingSecond, setAwaitingSecond] = useState(false);

  const inst: Instance = useMemo(() => {
    if (presetKey === "running") return RUNNING_EXAMPLE;
    if (presetKey === "max") return MAX_LATTICE;
    return randomInstance(5, randomSeed);
  }, [presetKey, randomSeed]);

  const n = inst.left.length;
  const lattice = useMemo(() => stableLattice(inst), [inst]);
  const L = (i: number) => leftLabel(i);
  const Rn = (j: number) => rightLabel(j, n);
  const code = (m: number[]) => matchingCode(m, L, Rn);
  const leftNames = `${L(0)}–${L(n - 1)}`;
  const rightNames = `${Rn(0)}–${Rn(n - 1)}`;

  // Name each distinct rotation ρ1, ρ2, … in order of first appearance from the top.
  const rotationIds = useMemo(() => {
    const ids = new Map<string, number>();
    const sig = (e: (typeof lattice.edges)[number]) =>
      e.rotation.map((m) => `${m.left}:${m.from}>${m.to}`).join("|");
    const sorted = [...lattice.edges].sort(
      (a, b) => lattice.nodes[a.from].level - lattice.nodes[b.from].level,
    );
    for (const e of sorted) {
      const s = sig(e);
      if (!ids.has(s)) ids.set(s, ids.size + 1);
    }
    return { ids, sig };
  }, [lattice]);

  const layout = useMemo(() => {
    const levels: number[][] = [];
    lattice.nodes.forEach((node, idx) => {
      (levels[node.level] ??= []).push(idx);
    });
    const pos = new Map<number, number>();
    levels.forEach((row, lvl) => {
      if (lvl > 0) {
        const bary = (idx: number) => {
          const parents = lattice.edges.filter((e) => e.to === idx).map((e) => pos.get(e.from) ?? 0);
          return parents.length ? parents.reduce((a, b) => a + b, 0) / parents.length : 0;
        };
        row.sort((a, b) => bary(a) - bary(b));
      }
      row.forEach((idx, k) => pos.set(idx, k - (row.length - 1) / 2));
    });
    const widest = Math.max(...levels.map((r) => r.length));
    const width = widest * (BOX_W + GAP_X) + GAP_X;
    const height = levels.length * LEVEL_H - (LEVEL_H - BOX_H) + 24;
    const xy = (idx: number) => ({
      x: width / 2 + (pos.get(idx) ?? 0) * (BOX_W + GAP_X),
      y: 12 + lattice.nodes[idx].level * LEVEL_H + BOX_H / 2,
    });
    return { width, height, xy };
  }, [lattice]);

  const totals = lattice.nodes.map((nd) => nd.score.leftSum + nd.score.rightSum);
  const minTotal = Math.min(...totals);
  const minRegret = Math.min(...lattice.nodes.map((nd) => nd.score.regret));
  const minGap = Math.min(
    ...lattice.nodes.map((nd) => Math.abs(nd.score.leftSum - nd.score.rightSum)),
  );

  const current = selected !== null && selected < lattice.nodes.length ? selected : lattice.top;
  const node = lattice.nodes[current];
  const otherIdx = other !== null && other < lattice.nodes.length && other !== current ? other : null;
  const indexOfMatch = (m: number[]) =>
    lattice.nodes.findIndex((nd) => nd.match.join() === m.join());
  const jm =
    otherIdx === null
      ? null
      : (() => {
          const { join, meet } = joinMeet(inst, node.match, lattice.nodes[otherIdx].match);
          return { join, meet, joinIdx: indexOfMatch(join), meetIdx: indexOfMatch(meet) };
        })();

  const onNodeClick = (idx: number) => {
    if (compareMode && awaitingSecond && idx !== current) {
      setOther(idx);
      setAwaitingSecond(false);
      return;
    }
    setSelected(idx);
    setOther(null);
    setAwaitingSecond(compareMode);
  };

  const badges = (idx: number) => {
    const nd = lattice.nodes[idx];
    const out: string[] = [];
    if (idx === lattice.top)
      out.push(
        isJa
          ? `${leftNames} 側最適（${leftNames} が提案した GS の出力）`
          : `${leftNames}-optimal (GS output when ${leftNames} propose)`,
      );
    if (idx === lattice.bottom)
      out.push(
        isJa
          ? `${rightNames} 側最適（${rightNames} が提案した GS の出力）`
          : `${rightNames}-optimal (GS output when ${rightNames} propose)`,
      );
    if (nd.score.leftSum + nd.score.rightSum === minTotal)
      out.push(isJa ? "平等主義（順位の総和が最小）" : "egalitarian (minimum total rank)");
    if (nd.score.regret === minRegret)
      out.push(isJa ? "最小後悔（最悪の順位が最小）" : "minimum regret (best worst-off rank)");
    if (Math.abs(nd.score.leftSum - nd.score.rightSum) === minGap)
      out.push(isJa ? "両側の差が最小" : "most balanced between sides");
    return out;
  };

  const choosePreset = (k: PresetKey) => {
    setSelected(null);
    setOther(null);
    setAwaitingSecond(false);
    if (k === "random") {
      setRandomSeed((s) => s + 1);
    }
    setPresetKey(k);
  };

  const rotationList = [...rotationIds.ids.entries()].map(([s, id]) => ({
    id,
    moves: s.split("|").map((part) => {
      const [i, rest] = part.split(":");
      const [from, to] = rest.split(">");
      return { left: Number(i), from: Number(from), to: Number(to) };
    }),
  }));

  return (
    <InteractiveDemo
      title={
        isJa
          ? "安定マッチングの束 — 全員の利害が一列に並ぶ"
          : "The lattice of stable matchings — interests line up along one axis"
      }
      description={
        isJa
          ? `${n}! = ${lattice.examined} 通りの完全マッチングを総当たりし、安定なものだけを «左側の全員が弱く好む» 順に並べた図（ハッセ図）です。上ほど左側（${leftNames}）に有利、下ほど右側（${rightNames}）に有利。ノードをクリックすると詳細を表示し、辺のラベル ρ は «回転»（rotation）を表します。`
          : `All ${n}! = ${lattice.examined} perfect matchings are checked by brute force; the stable ones are drawn in the order “every left agent weakly prefers” (a Hasse diagram). Higher is better for ${leftNames}, lower is better for ${rightNames}. Click a node for details; edge labels ρ are rotations.`
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <ControlRow label={isJa ? "インスタンス" : "Instance"}>
          <Segmented
            ariaLabel={isJa ? "インスタンス" : "Instance"}
            value={presetKey}
            options={[
              { value: "running", label: isJa ? "基本例（4×4）" : "Running example (4×4)" },
              { value: "max", label: isJa ? "4×4 の最多（10 個）" : "4×4 maximum (10)" },
              { value: "random", label: isJa ? "ランダム（5×5）" : "Random (5×5)" },
            ]}
            onChange={choosePreset}
          />
          {presetKey === "random" && (
            <button
              type="button"
              onClick={() => choosePreset("random")}
              className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {isJa ? "別のインスタンス" : "Another instance"}
            </button>
          )}
        </ControlRow>
        <ControlRow label={isJa ? "クリックの動作" : "Click to"}>
          <Segmented
            ariaLabel={isJa ? "クリックの動作" : "Click behaviour"}
            value={compareMode ? "compare" : "select"}
            options={[
              { value: "select", label: isJa ? "詳細を見る" : "Inspect" },
              { value: "compare", label: isJa ? "2 つ選んで結び・交わり" : "Pick two for join / meet" },
            ]}
            onChange={(v) => {
              setCompareMode(v === "compare");
              setOther(null);
              setAwaitingSecond(false);
            }}
          />
        </ControlRow>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="self-start overflow-x-auto rounded-lg border border-border bg-background p-2">
          <div className="mb-1 flex justify-between text-[10px] font-semibold">
            <span className={sideText.left}>
              {isJa ? `▲ ${leftNames} に有利` : `▲ better for ${leftNames}`}
            </span>
            <span className="text-muted-foreground">
              {isJa
                ? `安定マッチング ${lattice.nodes.length} 個 / ${lattice.examined} 通り`
                : `${lattice.nodes.length} stable of ${lattice.examined}`}
            </span>
          </div>
          <svg
            width={layout.width}
            height={layout.height}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="mx-auto block text-foreground"
            role="img"
            aria-label={
              isJa
                ? `安定マッチングのハッセ図。${lattice.nodes.length} 個のノード`
                : `Hasse diagram with ${lattice.nodes.length} stable matchings`
            }
          >
            {lattice.edges.map((e) => {
              const a = layout.xy(e.from);
              const b = layout.xy(e.to);
              const id = rotationIds.ids.get(rotationIds.sig(e));
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <g key={`${e.from}-${e.to}`}>
                  <line
                    x1={a.x}
                    y1={a.y + BOX_H / 2}
                    x2={b.x}
                    y2={b.y - BOX_H / 2}
                    stroke="currentColor"
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                  />
                  <rect
                    x={mx - 12}
                    y={my - 8}
                    width={24}
                    height={14}
                    rx={7}
                    className="fill-[var(--background)]"
                    stroke="currentColor"
                    strokeOpacity={0.25}
                  />
                  <text
                    x={mx}
                    y={my + 3}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    fontFamily="ui-monospace, monospace"
                  >
                    ρ{id}
                  </text>
                </g>
              );
            })}
            {lattice.nodes.map((nd, idx) => {
              const { x, y } = layout.xy(idx);
              const isSel = idx === current;
              const isOther = idx === otherIdx;
              const isJoin = jm !== null && idx === jm.joinIdx;
              const isMeet = jm !== null && idx === jm.meetIdx;
              const stroke =
                idx === lattice.top
                  ? SIDE_HEX.left
                  : idx === lattice.bottom
                    ? SIDE_HEX.right
                    : "currentColor";
              return (
                <g
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={code(nd.match)}
                  aria-pressed={isSel || isOther}
                  onClick={() => onNodeClick(idx)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      onNodeClick(idx);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  {(isJoin || isMeet) && (
                    <rect
                      x={x - BOX_W / 2 - 6}
                      y={y - BOX_H / 2 - 6}
                      width={BOX_W + 12}
                      height={BOX_H + 12}
                      rx={10}
                      fill={STABLE_HEX}
                      fillOpacity={0.18}
                      stroke={STABLE_HEX}
                      strokeDasharray="4 3"
                    />
                  )}
                  <rect
                    x={x - BOX_W / 2}
                    y={y - BOX_H / 2}
                    width={BOX_W}
                    height={BOX_H}
                    rx={6}
                    className="fill-[var(--background)]"
                    stroke={stroke}
                    strokeOpacity={stroke === "currentColor" ? 0.45 : 1}
                    strokeWidth={isSel ? 3 : 1.5}
                  />
                  {(isSel || isOther) && (
                    <rect
                      x={x - BOX_W / 2 - 3}
                      y={y - BOX_H / 2 - 3}
                      width={BOX_W + 6}
                      height={BOX_H + 6}
                      rx={8}
                      fill="none"
                      stroke="#e8a55a"
                      strokeWidth={1.5}
                      strokeDasharray={isOther ? "3 2" : undefined}
                    />
                  )}
                  {(isJoin || isMeet) && (
                    <text
                      x={x + BOX_W / 2 + 4}
                      y={y - BOX_H / 2 - 1}
                      fontSize="9"
                      fontWeight="700"
                      fill={STABLE_HEX}
                    >
                      {isJoin && isMeet ? "∨∧" : isJoin ? "∨" : "∧"}
                    </text>
                  )}
                  <text
                    x={x}
                    y={y - 3}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="currentColor"
                    fontFamily="ui-monospace, monospace"
                  >
                    {code(nd.match)}
                  </text>
                  <text
                    x={x}
                    y={y + 11}
                    textAnchor="middle"
                    fontSize="9"
                    fill="currentColor"
                    fillOpacity={0.65}
                    fontFamily="ui-monospace, monospace"
                  >
                    Σ {nd.score.leftSum} / {nd.score.rightSum}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-1 flex justify-between text-[10px] font-semibold">
            <span className={sideText.right}>
              {isJa ? `▼ ${rightNames} に有利` : `▼ better for ${rightNames}`}
            </span>
            <span className="text-muted-foreground">
              {isJa ? "Σ 左側の順位和 / 右側の順位和" : "Σ left rank sum / right rank sum"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title={isJa ? "選択中のマッチング" : "Selected matching"}>
            <div className="font-mono text-sm font-semibold text-foreground">{code(node.match)}</div>
            <table className="mt-2 w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="text-left font-medium">{isJa ? "組" : "pair"}</th>
                  <th className={`text-right font-medium ${sideText.left}`}>{isJa ? "左の順位" : "left rank"}</th>
                  <th className={`text-right font-medium ${sideText.right}`}>{isJa ? "右の順位" : "right rank"}</th>
                </tr>
              </thead>
              <tbody className="font-mono text-foreground">
                {node.match.map((j, i) => (
                  <tr key={i}>
                    <td>
                      {L(i)}–{Rn(j)}
                    </td>
                    <td className="text-right">{node.score.leftRanks[i]}</td>
                    <td className="text-right">{node.score.rightRanks[j]}</td>
                  </tr>
                ))}
                <tr className="border-t border-border font-semibold">
                  <td>Σ</td>
                  <td className="text-right">{node.score.leftSum}</td>
                  <td className="text-right">{node.score.rightSum}</td>
                </tr>
              </tbody>
            </table>
            <ul className="mt-2 space-y-0.5 text-[11px]">
              {badges(current).map((b) => (
                <li key={b} style={{ color: STABLE_HEX }}>
                  ● {b}
                </li>
              ))}
            </ul>
          </Panel>
          {compareMode && (
            <Panel title={isJa ? "結び（∨）と交わり（∧）" : "Join (∨) and meet (∧)"}>
              {jm === null || otherIdx === null ? (
                <p className="text-[11px] text-muted-foreground">
                  {awaitingSecond
                    ? isJa
                      ? `1 つ目は ${code(node.match)}。2 つ目のノードをクリックしてください。`
                      : `First pick: ${code(node.match)}. Now click a second node.`
                    : isJa
                      ? "図の中で 2 つのノードを順にクリックしてください。"
                      : "Click two nodes in the diagram, one after the other."}
                </p>
              ) : (
                <div className="space-y-1 text-[11px] text-foreground">
                  <div className="font-mono">
                    {code(node.match)} <span className="text-muted-foreground">&</span>{" "}
                    {code(lattice.nodes[otherIdx].match)}
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: STABLE_HEX }}>∨ </span>
                    {isJa ? "左側の各人に «好きなほう» の相手: " : "each left agent's better partner: "}
                    <span className="font-mono font-semibold">{code(jm.join)}</span>
                  </div>
                  <div>
                    <span className="font-semibold" style={{ color: STABLE_HEX }}>∧ </span>
                    {isJa ? "左側の各人に «嫌いなほう» の相手: " : "each left agent's worse partner: "}
                    <span className="font-mono font-semibold">{code(jm.meet)}</span>
                  </div>
                  <p className="pt-1 text-muted-foreground">
                    {jm.joinIdx >= 0 && jm.meetIdx >= 0
                      ? isJa
                        ? "どちらもきちんとしたマッチングで、しかも図の中にある（＝安定）ことを確かめてください。"
                        : "Both are genuine matchings, and both appear in the diagram — they are stable."
                      : isJa
                        ? "（安定マッチングの組では起こりえないはずの結果です）"
                        : "(This should never happen for stable inputs.)"}
                  </p>
                </div>
              )}
            </Panel>
          )}
          <Panel title={isJa ? "回転（辺 ρ の中身）" : "Rotations (edge labels)"}>
            <ul className="space-y-1 text-[11px] text-foreground">
              {rotationList.map((r) => (
                <li key={r.id} className="font-mono">
                  <span className="font-semibold">ρ{r.id}</span>:{" "}
                  {r.moves.map((m) => `${L(m.left)} ${Rn(m.from)}→${Rn(m.to)}`).join(", ")}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              {isJa
                ? "回転は «左側の数人が、輪になって 1 つずつ次の相手へずれる» 操作です。ずれた左側は全員少し損をし、関係する右側は全員少し得をします。"
                : "A rotation shifts a few left agents, in a cycle, each to the next partner: every one of them loses a little and every right agent involved gains."}
            </p>
          </Panel>
        </div>
      </div>
    </InteractiveDemo>
  );
}
