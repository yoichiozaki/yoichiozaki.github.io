"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import {
  AgentBadge,
  ControlRow,
  Panel,
  PrefChip,
  REJECT_HEX,
  STABLE_HEX,
  Segmented,
  matchingCode,
  sideText,
} from "./stableMatchingUi";
import {
  IMPOSSIBILITY_EXAMPLE,
  RUNNING_EXAMPLE,
  TRUNCATION_EXAMPLE,
  TRUNCATION_RISK_EXAMPLE,
  cloneInstance,
  leftLabel,
  matchingFor,
  rightLabel,
  searchManipulations,
  validPartners,
  type Instance,
  type Mechanism,
  type Side,
} from "@/lib/stable-matching";

type Props = { locale?: string };
type PresetKey = "truncation" | "risk" | "impossible" | "running";

const PRESETS: Record<PresetKey, { inst: Instance; agent: { side: Side; idx: number } }> = {
  truncation: { inst: TRUNCATION_EXAMPLE, agent: { side: "right", idx: 0 } },
  risk: { inst: TRUNCATION_RISK_EXAMPLE, agent: { side: "right", idx: 0 } },
  impossible: { inst: IMPOSSIBILITY_EXAMPLE, agent: { side: "right", idx: 0 } },
  running: { inst: RUNNING_EXAMPLE, agent: { side: "left", idx: 1 } },
};

export function MatchingStrategyLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [presetKey, setPresetKey] = useState<PresetKey>("truncation");
  const [proposing, setProposing] = useState<Side>("left");
  const [mechanism, setMechanism] = useState<Mechanism>("da");
  const [agent, setAgent] = useState<{ side: Side; idx: number }>(PRESETS.truncation.agent);
  const [report, setReport] = useState<number[]>(() => [...TRUNCATION_EXAMPLE.right[0]]);

  const inst = PRESETS[presetKey].inst;
  const n = inst.left.length;
  const L = (i: number) => leftLabel(i);
  const Rn = (j: number) => rightLabel(j, n);
  const nameOf = (side: Side, idx: number) => (side === "left" ? L(idx) : Rn(idx));
  const otherSide: Side = agent.side === "left" ? "right" : "left";
  const trueList = agent.side === "left" ? inst.left[agent.idx] : inst.right[agent.idx];
  const self = nameOf(agent.side, agent.idx);

  const truthful = useMemo(
    () => matchingFor(inst, proposing, mechanism),
    [inst, proposing, mechanism],
  );
  const lied = useMemo(() => {
    const copy = cloneInstance(inst);
    if (agent.side === "left") copy.left[agent.idx] = report;
    else copy.right[agent.idx] = report;
    return matchingFor(copy, proposing, mechanism);
  }, [inst, proposing, mechanism, agent, report]);
  const search = useMemo(
    () => searchManipulations(inst, proposing, agent.side, agent.idx, mechanism),
    [inst, proposing, agent, mechanism],
  );
  const valid = useMemo(() => validPartners(inst, agent.side, agent.idx), [inst, agent]);

  const partnerIn = (m: (number | null)[]) => {
    if (agent.side === "left") return m[agent.idx];
    const i = m.indexOf(agent.idx);
    return i < 0 ? null : i;
  };
  const trueRank = (p: number | null) => {
    if (p === null) return Infinity;
    const k = trueList.indexOf(p);
    return k < 0 ? Infinity : k + 1;
  };
  const fmtPartner = (p: number | null) =>
    p === null
      ? isJa
        ? "相手なし"
        : "unmatched"
      : `${nameOf(otherSide, p)}${isJa ? `（本当の ${trueRank(p)} 位）` : ` (true #${trueRank(p)})`}`;

  const pTruth = partnerIn(truthful);
  const pLie = partnerIn(lied);
  const delta = trueRank(pTruth) - trueRank(pLie);

  const selectAgent = (side: Side, idx: number) => {
    setAgent({ side, idx });
    setReport([...(side === "left" ? inst.left[idx] : inst.right[idx])]);
  };
  const choosePreset = (k: PresetKey) => {
    setPresetKey(k);
    const { inst: base, agent: a } = PRESETS[k];
    setAgent(a);
    setReport([...(a.side === "left" ? base.left[a.idx] : base.right[a.idx])]);
    if (k === "running") setMechanism("boston");
    if (k !== "running") setMechanism("da");
    setProposing("left");
  };
  const changeProposing = (s: Side) => {
    setProposing(s);
    setReport([...trueList]);
  };
  const changeMechanism = (m: Mechanism) => {
    setMechanism(m);
    setReport([...trueList]);
  };

  const bump = (k: number) => {
    if (k === 0) return;
    setReport((r) => {
      const c = [...r];
      [c[k - 1], c[k]] = [c[k], c[k - 1]];
      return c;
    });
  };
  const truncate = (len: number) => {
    // keep the current order of the reported prefix, then the rest in true order
    setReport((r) => {
      const full = [...r, ...trueList.filter((x) => !r.includes(x))];
      return full.slice(0, len);
    });
  };

  const isProposer = agent.side === proposing;
  const code = (m: (number | null)[]) => matchingCode(m, L, Rn);

  const agentButtons = (side: Side) => (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: n }, (_, idx) => {
        const active = agent.side === side && agent.idx === idx;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => selectAgent(side, idx)}
            aria-pressed={active}
            className={`rounded-full p-0.5 transition-shadow ${
              active ? "ring-2 ring-[#e8a55a]" : "opacity-70 hover:opacity-100"
            }`}
            aria-label={isJa ? `${nameOf(side, idx)} を選ぶ` : `Select ${nameOf(side, idx)}`}
          >
            <AgentBadge side={side} name={nameOf(side, idx)} />
          </button>
        );
      })}
    </div>
  );

  return (
    <InteractiveDemo
      title={
        isJa
          ? "嘘の申告で得ができるか — 全通り試す実験室"
          : "Can lying pay? A lab that tries every lie"
      }
      description={
        isJa
          ? "1 人を選び、その人の «申告する好み» を書き換えます（チップのクリックで繰り上げ、長さで切り捨て）。他の全員は正直に申告します。下のパネルでは、ありうるすべての申告（並べ替え＋切り捨て）を総当たりします。"
          : "Pick one agent and edit what they report (click a chip to move it up; set a length to truncate). Everyone else tells the truth. The bottom panel tries every possible report — every order, every truncation."
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <ControlRow label={isJa ? "インスタンス" : "Instance"}>
          <Segmented
            ariaLabel={isJa ? "インスタンス" : "Instance"}
            value={presetKey}
            options={[
              { value: "truncation", label: isJa ? "切り捨てが効く（3×3）" : "Truncation pays (3×3)" },
              { value: "risk", label: isJa ? "切り捨てが裏目（3×3）" : "Truncation backfires (3×3)" },
              { value: "impossible", label: isJa ? "不可能性（2×2）" : "Impossibility (2×2)" },
              { value: "running", label: isJa ? "基本例（4×4）" : "Running example (4×4)" },
            ]}
            onChange={choosePreset}
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
            onChange={changeMechanism}
          />
        </ControlRow>
        <ControlRow label={isJa ? "提案する側" : "Who proposes"}>
          <Segmented
            ariaLabel={isJa ? "提案する側" : "Who proposes"}
            value={proposing}
            options={[
              { value: "left", label: isJa ? `${L(0)}〜${L(n - 1)} が提案` : `${L(0)}–${L(n - 1)} propose` },
              { value: "right", label: isJa ? `${Rn(0)}〜${Rn(n - 1)} が提案` : `${Rn(0)}–${Rn(n - 1)} propose` },
            ]}
            onChange={changeProposing}
          />
        </ControlRow>
        <ControlRow label={isJa ? "嘘をつく人" : "Who lies"}>
          {agentButtons("left")}
          <span className="text-muted-foreground">·</span>
          {agentButtons("right")}
          <span className="text-[11px] text-muted-foreground">
            {isProposer ? (isJa ? "（提案側）" : "(a proposer)") : isJa ? "（受理側）" : "(a receiver)"}
          </span>
        </ControlRow>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel title={isJa ? `${self} の好み` : `${self}'s preferences`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{isJa ? "本当" : "true"}</span>
              <div className="flex flex-wrap gap-1">
                {trueList.map((x) => (
                  <PrefChip key={x} name={nameOf(otherSide, x)} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] font-semibold text-foreground">
                {isJa ? "申告" : "reported"}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {report.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {isJa ? "（誰も受け入れない）" : "(nobody acceptable)"}
                  </span>
                )}
                {report.map((x, k) => (
                  <PrefChip
                    key={x}
                    name={nameOf(otherSide, x)}
                    state={k === 0 ? "held" : "idle"}
                    onClick={k > 0 ? () => bump(k) : undefined}
                    title={isJa ? `${nameOf(otherSide, x)} を 1 つ上げる` : `Move ${nameOf(otherSide, x)} up`}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] text-muted-foreground">{isJa ? "長さ" : "length"}</span>
              <Segmented
                ariaLabel={isJa ? "申告リストの長さ" : "Reported list length"}
                value={String(report.length)}
                options={Array.from({ length: n + 1 }, (_, k) => ({ value: String(k), label: String(k) }))}
                onChange={(v) => truncate(Number(v))}
              />
              <button
                type="button"
                onClick={() => setReport([...trueList])}
                className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {isJa ? "正直に戻す" : "Back to truth"}
              </button>
            </div>
          </div>
        </Panel>

        <Panel title={isJa ? "結果の比較" : "Outcome"}>
          <div className="space-y-1 text-xs text-foreground">
            <div>
              {isJa ? "正直に申告: " : "Truthful: "}
              <span className="font-mono">{code(truthful)}</span>
              {" → "}
              <span className="font-semibold">{fmtPartner(pTruth)}</span>
            </div>
            <div>
              {isJa ? "この申告: " : "This report: "}
              <span className="font-mono">{code(lied)}</span>
              {" → "}
              <span className="font-semibold">{fmtPartner(pLie)}</span>
            </div>
            <div
              className="pt-1 font-semibold"
              style={{ color: delta > 0 ? REJECT_HEX : delta < 0 ? undefined : STABLE_HEX }}
            >
              {delta > 0
                ? isJa
                  ? `▲ 嘘で得をした（${self} の本当の好みで ${delta} 段階改善）`
                  : `▲ The lie paid off (${delta} place${delta > 1 ? "s" : ""} better by ${self}'s true ranking)`
                : delta < 0
                  ? isJa
                    ? "▼ 嘘で損をした"
                    : "▼ The lie backfired"
                  : isJa
                    ? "＝ 結果は変わらない"
                    : "= No change"}
            </div>
            {mechanism === "da" && (
              <div className="mt-2 border-t border-border pt-2 text-[11px] text-foreground">
                <div>
                  {isJa ? "安定パートナー（本当の好み順）: " : "Valid partners (true order): "}
                  <span className="font-mono font-semibold">
                    {valid.map((x) => nameOf(otherSide, x)).join(", ")}
                  </span>
                  <span className="text-muted-foreground">
                    {isJa ? `（${valid.length} 人）` : ` (${valid.length})`}
                  </span>
                </div>
                <div className="mt-0.5 text-muted-foreground">
                  {isProposer
                    ? isJa
                      ? "提案側なので、安定パートナーが何人いても嘘では得をしません（6.1 節）。"
                      : "As a proposer, no lie helps, however many valid partners there are (section 6.1)."
                    : valid.length >= 2
                      ? isJa
                        ? `受理側で安定パートナーが 2 人以上いるので、最良の ${nameOf(otherSide, valid[0])} のすぐ下で切る（長さ ${trueList.indexOf(valid[0]) + 1}）と ${nameOf(otherSide, valid[0])} を得られます（6.2 節）。`
                        : `As a receiver with two or more valid partners, truncating just below the best one, ${nameOf(otherSide, valid[0])} (length ${trueList.indexOf(valid[0]) + 1}), gets ${nameOf(otherSide, valid[0])} (section 6.2).`
                      : isJa
                        ? "安定パートナーが 1 人だけなので、どんな嘘でも得はできません（6.2 節）。"
                        : "With a single valid partner, no lie can help (section 6.2)."}
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        title={
          isJa
            ? `総当たり: ${self} がとりうる全 ${search.examined} 通りの申告`
            : `Exhaustive search: all ${search.examined} reports ${self} could make`
        }
      >
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-left font-medium">{isJa ? "得られる相手" : "partner obtained"}</th>
              <th className="text-right font-medium">{isJa ? "そうなる申告の数" : "# reports"}</th>
              <th className="pl-3 text-left font-medium">{isJa ? "申告の例" : "example report"}</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {search.outcomes.map((o) => {
              const isTruth = o.partner === search.truthful.partner;
              return (
                <tr key={String(o.partner)} className={o === search.best ? "font-semibold" : ""}>
                  <td>
                    {fmtPartner(o.partner)}
                    {isTruth && (
                      <span className="ml-1 text-muted-foreground">{isJa ? "← 正直" : "← truthful"}</span>
                    )}
                  </td>
                  <td className="text-right font-mono">{o.reports}</td>
                  <td className="pl-3 font-mono">
                    {o.example.length === 0
                      ? "∅"
                      : o.example.map((x) => nameOf(otherSide, x)).join(" > ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p
          className="mt-2 text-xs font-semibold"
          style={{
            color: search.best.trueRank < search.truthful.trueRank ? REJECT_HEX : STABLE_HEX,
          }}
        >
          {search.best.trueRank < search.truthful.trueRank
            ? isJa
              ? `${self} は嘘で得をできます: 最良は ${fmtPartner(search.best.partner)}。`
              : `${self} can gain by lying: the best reachable partner is ${fmtPartner(search.best.partner)}.`
            : isJa
              ? `${self} にとって正直な申告より良い申告は存在しません。`
              : `No report does better for ${self} than the truth.`}
          {isProposer && mechanism === "da"
            ? isJa
              ? "（DA の提案側はつねにこうなる — 耐戦略性）"
              : " (Always the case for DA proposers — strategy-proofness.)"
            : ""}
          {mechanism === "boston" && search.best.trueRank < search.truthful.trueRank
            ? isJa
              ? "（即時受入では、提案側でも «受かりそうな相手を上に書く» 嘘が得になりうる）"
              : " (Under immediate acceptance even proposers can gain by ranking a safer option higher.)"
            : ""}
        </p>
        <p className={`mt-1 text-[10px] ${sideText[agent.side]}`}>
          {isJa
            ? "「相手なし」は、本当は受け入れられる相手まで切り捨てた結果、誰とも組めなかったことを表します。"
            : "“Unmatched” means the report cut off every partner that was actually available."}
        </p>
      </Panel>
    </InteractiveDemo>
  );
}
