"use client";

import { useMemo } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import { StepPlayerControls } from "./StepPlayerControls";
import { stepPlayerAriaLabels } from "./stepPlayerAriaLabels";
import { useStepPlayer } from "./useStepPlayer";
import {
  AgentBadge,
  Panel,
  PrefChip,
  REJECT_HEX,
  SIDE_HEX,
  STABLE_HEX,
  sideText,
  type ChipState,
} from "./stableMatchingUi";
import {
  RESIDENCY_EXAMPLE,
  applicantProposing,
  collegeCutoffs,
  hospitalProposing,
  leftLabel,
  rankTable,
  rightLabel,
} from "@/lib/stable-matching";

type Props = { locale?: string };

const inst = RESIDENCY_EXAMPLE;
const nA = inst.applicants.length;
const nH = inst.hospitals.length;
const A = (i: number) => leftLabel(i);
const H = (h: number) => rightLabel(h, nH);

export function ResidencyMatchVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const trace = useMemo(() => applicantProposing(inst), []);
  const byHospitals = useMemo(() => hospitalProposing(inst), []);
  const rankH = useMemo(() => rankTable(inst.hospitals, nA), []);

  const totalFrames = trace.steps.length + 1;
  const player = useStepPlayer({ totalSteps: totalFrames, intervalMs: 2200 });
  const frame = Math.min(player.step, totalFrames - 1);
  const step = frame === 0 ? null : trace.steps[frame - 1];
  const isFinal = frame === totalFrames - 1;
  const held = step ? step.held : inst.hospitals.map(() => [] as number[]);
  const next = step ? step.next : inst.applicants.map(() => 0);

  const holder = new Array<number | null>(nA).fill(null);
  held.forEach((list, h) => list.forEach((a) => (holder[a] = h)));
  const inStep = (a: number, h: number) =>
    step?.proposals.some((p) => p.p === a && p.r === h) ?? false;
  const outcomeOf = (a: number, h: number) =>
    step?.proposals.find((p) => p.p === a && p.r === h)?.outcome;

  const applicantChip = (a: number, k: number): ChipState => {
    const h = inst.applicants[a][k];
    if (inStep(a, h)) return outcomeOf(a, h) === "unacceptable" ? "unacceptable" : "proposing";
    if (holder[a] === h) return isFinal ? "final" : "held";
    if (k < next[a]) return rankH[h][a] === Infinity ? "unacceptable" : "rejected";
    if (k === next[a] && holder[a] === null && !isFinal) return "next";
    return "idle";
  };
  const hospitalChip = (h: number, a: number): ChipState => {
    if (inStep(a, h)) return "proposing";
    if (held[h].includes(a)) return isFinal ? "final" : "held";
    if (inst.applicants[a].slice(0, next[a]).includes(h)) return "rejected";
    return "idle";
  };

  const names = (xs: number[]) => xs.map(A).join(isJa ? "・" : ", ");

  const narration = (() => {
    if (!step) {
      return isJa
        ? "研修医 A〜F が、病院 X・Y・Z（定員は各 2）に希望順位どおりに応募します。病院は «定員までの順番待ちリスト» を持ち、リストにない応募者は即座に断ります。"
        : "Residents A–F apply to hospitals X, Y and Z (two positions each) in order of preference. Each hospital keeps a waiting list up to its capacity and turns away anyone not on its rank list.";
    }
    const list = step.proposals.map((p) => `${A(p.p)}→${H(p.r)}`).join(", ");
    const parts: string[] = [];
    for (let h = 0; h < nH; h++) {
      const incoming = step.proposals.filter((p) => p.r === h);
      if (incoming.length === 0) continue;
      const unacc = incoming.filter((p) => p.outcome === "unacceptable").map((p) => p.p);
      const rejected = incoming.filter((p) => p.outcome === "rejected").map((p) => p.p);
      const dropped = step.displaced.filter((d) => d.r === h).map((d) => d.p);
      const keep = held[h];
      if (isJa) {
        let s = `${H(h)}: `;
        if (unacc.length) s += `${names(unacc)} は ${H(h)} の順位表にないので即座に不採用。`;
        s += `保持は [${names(keep)}]`;
        if (dropped.length) s += `（${names(dropped)} を押し出す）`;
        if (rejected.length) s += `、${names(rejected)} は定員の外で不採用`;
        parts.push(`${s}。`);
      } else {
        let s = `${H(h)}: `;
        if (unacc.length) s += `${names(unacc)} ${unacc.length > 1 ? "are" : "is"} not on ${H(h)}'s rank list and is turned away. `;
        s += `holds [${names(keep)}]`;
        if (dropped.length) s += `, bumping ${names(dropped)}`;
        if (rejected.length) s += `; ${names(rejected)} miss${rejected.length > 1 ? "" : "es"} the cut`;
        parts.push(`${s}.`);
      }
    }
    return isJa
      ? `ラウンド ${step.round}: ${list}。${parts.join(" ")}`
      : `Round ${step.round}: ${list}. ${parts.join(" ")}`;
  })();

  const finalMatch = trace.match;
  const fmt = (m: (number | null)[]) =>
    m.map((h, a) => `${A(a)}${h === null ? "–" : H(h)}`).join(" ");
  const differs = finalMatch
    .map((h, a) => (h !== byHospitals[a] ? a : -1))
    .filter((a) => a >= 0);
  const underfilled = inst.capacity
    .map((q, h) => ({ h, q, members: finalMatch.flatMap((x, a) => (x === h ? [a] : [])) }))
    .filter((x) => x.members.length < x.q);
  const unmatched = finalMatch.flatMap((h, a) => (h === null ? [a] : []));

  // Cutoff = lowest-ranked admitted resident of a full hospital (null = a seat is free).
  const cutoff = collegeCutoffs(inst, finalMatch);
  const whyNot = (a: number): string[] => {
    const mine = finalMatch[a];
    const list = inst.applicants[a];
    const better = mine === null ? list : list.slice(0, list.indexOf(mine));
    return better.map((h) => {
      if (rankH[h][a] === Infinity) {
        return isJa ? `${H(h)}: 順位表に載っていない` : `${H(h)}: not on its list`;
      }
      const c = cutoff[h];
      if (c === null) return isJa ? `${H(h)}: （空きあり）` : `${H(h)}: (seat free)`;
      return isJa
        ? `${H(h)}: ${rankH[h][a] + 1} 位で、境界 ${A(c)}（${rankH[h][c] + 1} 位）より下`
        : `${H(h)}: ranked #${rankH[h][a] + 1}, below cutoff ${A(c)} (#${rankH[h][c] + 1})`;
    });
  };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "研修医マッチング（多対一）— 定員つきの受入保留"
          : "Residency matching (many-to-one) — deferred acceptance with capacities"
      }
      description={
        isJa
          ? "Gale と Shapley の原論文と同じ «ラウンド» 形式です。各ラウンドでフリーな応募者が一斉に次の希望へ応募し、各病院は «これまでの保持者＋新しい応募者» から順位の高い順に定員分だけを残します。"
          : "This is the round-by-round form of the original 1962 paper. In each round every free applicant applies to their next choice, and each hospital keeps the best applicants among those it held and the new ones, up to capacity."
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel title={isJa ? "研修医の希望順位" : "Residents' rank lists"}>
          <div className="space-y-1.5">
            {inst.applicants.map((list, a) => (
              <div key={a} className="flex items-center gap-1.5">
                <AgentBadge side="left" name={A(a)} dim={isFinal && holder[a] === null} />
                <div className="flex flex-wrap gap-1">
                  {list.map((h, k) => (
                    <PrefChip key={h} name={H(h)} state={applicantChip(a, k)} />
                  ))}
                </div>
                {isFinal && holder[a] === null && (
                  <span className="text-[10px]" style={{ color: REJECT_HEX }}>
                    {isJa ? "未配属" : "unmatched"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={isJa ? "病院の順番待ちリスト" : "Hospitals' waiting lists"}>
          <div className="space-y-2.5">
            {inst.hospitals.map((list, h) => {
              const offList = Array.from({ length: nA }, (_, a) => a).filter((a) => !list.includes(a));
              return (
                <div key={h} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <AgentBadge side="right" name={H(h)} />
                    <div className="flex gap-1">
                      {Array.from({ length: inst.capacity[h] }, (_, s) => {
                        const a = held[h][s];
                        return (
                          <span
                            key={s}
                            className="inline-flex h-7 w-9 items-center justify-center rounded border font-mono text-xs font-semibold"
                            style={{
                              borderColor: a === undefined ? "var(--border)" : isFinal ? STABLE_HEX : SIDE_HEX.left,
                              borderStyle: a === undefined ? "dashed" : "solid",
                              backgroundColor: a === undefined ? "transparent" : isFinal ? `${STABLE_HEX}22` : `${SIDE_HEX.left}1f`,
                            }}
                          >
                            {a === undefined ? "" : A(a)}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {isJa ? `定員 ${inst.capacity[h]}` : `capacity ${inst.capacity[h]}`}
                      {" · "}
                      {held[h].length < inst.capacity[h]
                        ? isJa
                          ? "空きあり"
                          : "seat free"
                        : isJa
                          ? `境界 ${A(held[h][held[h].length - 1])}（${rankH[h][held[h][held[h].length - 1]] + 1} 位）`
                          : `cutoff ${A(held[h][held[h].length - 1])} (#${rankH[h][held[h][held[h].length - 1]] + 1})`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pl-8">
                    <span className={`text-[10px] ${sideText.right}`}>{isJa ? "順位表:" : "ranks:"}</span>
                    {list.map((a) => (
                      <PrefChip key={a} name={A(a)} state={hospitalChip(h, a)} />
                    ))}
                    {offList.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {isJa ? `（${names(offList)} は載せていない）` : `(${names(offList)} not ranked)`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="mt-3" title={isJa ? "このラウンドで起きたこと" : "This round"}>
        <p className="text-xs leading-relaxed text-foreground">{narration}</p>
      </Panel>

      {isFinal && (
        <Panel className="mt-3" title={isJa ? "結果と 2 つの定理" : "Result and two theorems"}>
          <div className="space-y-1.5 text-xs text-foreground">
            <div>
              {isJa ? "研修医が提案（研修医最適）: " : "Residents propose (resident-optimal): "}
              <span className="font-mono font-semibold">{fmt(finalMatch)}</span>
            </div>
            <div>
              {isJa ? "病院が提案（病院最適）: " : "Hospitals propose (hospital-optimal): "}
              <span className="font-mono font-semibold">{fmt(byHospitals)}</span>
              {differs.length > 0 && (
                <span className="text-muted-foreground">
                  {isJa
                    ? `（${names(differs)} の配属先が変わる）`
                    : ` (${names(differs)} move)`}
                </span>
              )}
            </div>
            {underfilled.map((u) => (
              <div key={u.h}>
                <span className="font-semibold" style={{ color: STABLE_HEX }}>
                  {isJa ? "地方病院定理: " : "Rural hospitals theorem: "}
                </span>
                {isJa
                  ? `${H(u.h)} は定員 ${u.q} に対して ${u.members.length} 人（${names(u.members)}）。定員割れの病院は、どの安定マッチングでもまったく同じ研修医の集合を受け入れます。`
                  : `${H(u.h)} fills ${u.members.length} of ${u.q} positions (${names(u.members)}). An under-filled hospital receives exactly the same residents in every stable matching.`}
              </div>
            ))}
            {unmatched.length > 0 && (
              <div>
                {isJa
                  ? `${names(unmatched)} は未配属。未配属になる研修医の集合も、すべての安定マッチングで同じです。`
                  : `${names(unmatched)} ${unmatched.length > 1 ? "are" : "is"} unmatched — and the set of unmatched residents is the same in every stable matching.`}
              </div>
            )}
          </div>
          <div className="mt-3 border-t border-border pt-2">
            <div className="mb-1 text-[11px] font-semibold text-foreground">
              {isJa
                ? "カットオフで説明する: «もっと好きな病院に入れなかった理由»"
                : "Explained by cutoffs: why each resident missed the hospitals they prefer"}
            </div>
            <div className="mb-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
              {cutoff.map((c, h) => (
                <span key={h} className="font-mono">
                  {H(h)}:{" "}
                  {c === null
                    ? isJa
                      ? "空きあり"
                      : "seat free"
                    : isJa
                      ? `境界 ${A(c)}（${rankH[h][c] + 1} 位）`
                      : `cutoff ${A(c)} (#${rankH[h][c] + 1})`}
                </span>
              ))}
            </div>
            <table className="w-full text-[11px]">
              <tbody className="text-foreground">
                {finalMatch.map((h, a) => {
                  const reasons = whyNot(a);
                  return (
                    <tr key={a} className="align-top">
                      <td className="w-8 py-0.5 font-mono font-semibold">{A(a)}</td>
                      <td className="w-14 py-0.5 font-mono">
                        {h === null ? (isJa ? "未配属" : "none") : H(h)}
                      </td>
                      <td className="py-0.5 text-muted-foreground">
                        {reasons.length === 0
                          ? isJa
                            ? "第 1 希望に配属"
                            : "got their first choice"
                          : reasons.join(isJa ? "、" : "; ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <div className="mt-4">
        <StepPlayerControls
          {...player}
          step={frame}
          isFirst={frame === 0}
          isLast={isFinal}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(s) => (s === 0 ? (isJa ? "開始" : "start") : isJa ? `ラウンド ${s}` : `round ${s}`)}
        />
      </div>
    </InteractiveDemo>
  );
}
