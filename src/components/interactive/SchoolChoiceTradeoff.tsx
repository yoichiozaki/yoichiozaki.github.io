"use client";

import { useId, useMemo, useState } from "react";
import { InteractiveDemo } from "./InteractiveDemo";
import {
  ControlRow,
  Panel,
  PROPOSAL_HEX,
  REJECT_HEX,
  SIDE_HEX,
  STABLE_HEX,
  Segmented,
  sanitizeId,
} from "./stableMatchingUi";
import {
  EFFICIENCY_EXAMPLE,
  applicantProposing,
  collegeBlockingPairs,
  paretoImprovement,
  topTradingCyclesTrace,
  type Matching,
} from "@/lib/stable-matching";

type Props = { locale?: string };
type View = "da" | "swap" | "ttc";

const inst = EFFICIENCY_EXAMPLE;
const STUDENTS = ["1", "2", "3"];
const SCHOOLS = ["a", "b", "c"];
const W = 300;
const ROW = 52;
const TOP = 26;
const XS = 46;
const XH = W - 46;

export function SchoolChoiceTradeoff({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const markerId = sanitizeId(useId());
  const [view, setView] = useState<View>("da");
  const [round, setRound] = useState(0);

  const da = useMemo(() => applicantProposing(inst).match, []);
  const swap = useMemo(() => paretoImprovement(inst, da) ?? da, [da]);
  const ttc = useMemo(() => topTradingCyclesTrace(inst), []);

  const match: Matching = view === "da" ? da : view === "swap" ? swap : ttc.match;
  const envy = collegeBlockingPairs(inst, match);
  const improvement = paretoImprovement(inst, match);
  const rankOf = (s: number, h: number | null) =>
    h === null ? null : inst.applicants[s].indexOf(h) + 1;
  const code = (m: Matching) =>
    m.map((h, s) => `${STUDENTS[s]}${h === null ? "–" : SCHOOLS[h]}`).join(" ");

  const y = (k: number) => TOP + k * ROW;
  const H = TOP * 2 + ROW * 2;
  const r = ttc.rounds[Math.min(round, ttc.rounds.length - 1)];

  /** Quadratic curve between two points, bent to one side so opposite arrows do not overlap. */
  const curve = (x1: number, y1: number, x2: number, y2: number, bend: number) => {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / len) * bend;
    const cy = my + (dx / len) * bend;
    return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  };

  const viewLabel: Record<View, string> = isJa
    ? { da: "受入保留（DA）", swap: "DA から 1 と 2 が交換", ttc: "TTC" }
    : { da: "Deferred acceptance (DA)", swap: "DA, then 1 and 2 swap", ttc: "TTC" };

  return (
    <InteractiveDemo
      title={
        isJa
          ? "安定性と効率性のトレードオフ — 受入保留と TTC"
          : "Stability versus efficiency — deferred acceptance and TTC"
      }
      description={
        isJa
          ? "学校 a, b, c（定員 1）と生徒 1, 2, 3。受入保留の結果、1 と 2 が交換した結果、トップ・トレーディング・サイクル（TTC）の結果を切り替え、«正当な羨望»（ブロッキングペア）と «誰も損をしない改善» の有無を比べます。"
          : "Schools a, b, c (one seat each) and students 1, 2, 3. Switch between the deferred-acceptance outcome, the outcome after 1 and 2 swap, and top trading cycles (TTC), and compare justified envy (blocking pairs) with the existence of an improvement that hurts nobody."
      }
    >
      <div className="mb-3 flex flex-col gap-2">
        <ControlRow label={isJa ? "割り当て" : "Assignment"}>
          <Segmented
            ariaLabel={isJa ? "割り当て" : "Assignment"}
            value={view}
            options={(["da", "swap", "ttc"] as View[]).map((v) => ({ value: v, label: viewLabel[v] }))}
            onChange={(v) => {
              setView(v);
              setRound(0);
            }}
          />
        </ControlRow>
        {view === "ttc" && (
          <ControlRow label={isJa ? "TTC のラウンド" : "TTC round"}>
            <Segmented
              ariaLabel={isJa ? "TTC のラウンド" : "TTC round"}
              value={String(round)}
              options={ttc.rounds.map((_, k) => ({
                value: String(k),
                label: isJa ? `ラウンド ${k + 1}` : `Round ${k + 1}`,
              }))}
              onChange={(v) => setRound(Number(v))}
            />
          </ControlRow>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title={isJa ? "希望と優先順位" : "Preferences and priorities"}>
          <table className="w-full text-[11px]">
            <tbody className="font-mono text-foreground">
              {inst.applicants.map((list, s) => (
                <tr key={`s${s}`}>
                  <td className="py-0.5 pr-2 font-sans text-muted-foreground">
                    {isJa ? `生徒 ${STUDENTS[s]} の希望` : `student ${STUDENTS[s]} prefers`}
                  </td>
                  <td className="py-0.5">{list.map((h) => SCHOOLS[h]).join(" > ")}</td>
                </tr>
              ))}
              {inst.hospitals.map((list, h) => (
                <tr key={`h${h}`}>
                  <td className="py-0.5 pr-2 font-sans text-muted-foreground">
                    {isJa ? `学校 ${SCHOOLS[h]} の優先順位` : `school ${SCHOOLS[h]} priority`}
                  </td>
                  <td className="py-0.5">{list.map((s) => STUDENTS[s]).join(" > ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="flex justify-center rounded-lg border border-border bg-background p-2">
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="text-foreground"
            role="img"
            aria-label={
              view === "ttc"
                ? isJa
                  ? `TTC ラウンド ${round + 1} の指し先`
                  : `TTC round ${round + 1} pointers`
                : code(match)
            }
          >
            <defs>
              <marker
                id={`${markerId}-s`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={PROPOSAL_HEX} />
              </marker>
              <marker
                id={`${markerId}-h`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={SIDE_HEX.right} />
              </marker>
            </defs>
            {view !== "ttc" &&
              match.map((h, s) =>
                h === null ? null : (
                  <line
                    key={`m${s}`}
                    x1={XS + 13}
                    y1={y(s)}
                    x2={XH - 13}
                    y2={y(h)}
                    stroke={envy.length === 0 ? STABLE_HEX : "currentColor"}
                    strokeOpacity={envy.length === 0 ? 1 : 0.55}
                    strokeWidth={2.5}
                  />
                ),
              )}
            {view !== "ttc" &&
              envy.map(([s, h]) => (
                <line
                  key={`e${s}${h}`}
                  x1={XS + 13}
                  y1={y(s)}
                  x2={XH - 13}
                  y2={y(h)}
                  stroke={REJECT_HEX}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              ))}
            {view === "ttc" &&
              r.pointS.map((h, s) => {
                if (h < 0) return null;
                const inCycle = r.traded.includes(s);
                return (
                  <path
                    key={`ps${s}`}
                    d={curve(XS + 13, y(s), XH - 15, y(h), -10)}
                    fill="none"
                    stroke={PROPOSAL_HEX}
                    strokeWidth={inCycle ? 3 : 1.5}
                    strokeOpacity={inCycle ? 1 : 0.6}
                    markerEnd={`url(#${markerId}-s)`}
                  />
                );
              })}
            {view === "ttc" &&
              r.pointH.map((s, h) => {
                if (s < 0) return null;
                const inCycle = r.traded.includes(s) && r.pointS[s] >= 0 && r.traded.some((t) => r.pointS[t] === h);
                return (
                  <path
                    key={`ph${h}`}
                    d={curve(XH - 13, y(h), XS + 15, y(s), -10)}
                    fill="none"
                    stroke={SIDE_HEX.right}
                    strokeWidth={inCycle ? 3 : 1.5}
                    strokeOpacity={inCycle ? 1 : 0.6}
                    markerEnd={`url(#${markerId}-h)`}
                  />
                );
              })}
            {STUDENTS.map((name, k) => (
              <g key={`sn${k}`}>
                <circle cx={XS} cy={y(k)} r={12} fill={SIDE_HEX.left} />
                <text
                  x={XS}
                  y={y(k) + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="ui-monospace, monospace"
                >
                  {name}
                </text>
              </g>
            ))}
            {SCHOOLS.map((name, k) => (
              <g key={`hn${k}`}>
                <circle cx={XH} cy={y(k)} r={12} fill={SIDE_HEX.right} />
                <text
                  x={XH}
                  y={y(k) + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="ui-monospace, monospace"
                >
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      <Panel className="mt-3" title={viewLabel[view]}>
        <div className="space-y-1 text-xs text-foreground">
          {view === "ttc" && (
            <p className="text-muted-foreground">
              {isJa
                ? `ラウンド ${round + 1}: 各生徒は空きのある最も好きな学校を（橙）、各学校は残っている中で優先順位の最も高い生徒を（青緑）指します。太線の輪の中で席を交換します。この回で確定: ${r.traded.map((s) => `${STUDENTS[s]}→${SCHOOLS[r.pointS[s]]}`).join(", ")}。`
                : `Round ${round + 1}: each student points to her favorite school with a free seat (amber), each school to its highest-priority remaining student (teal). Seats are traded around the bold cycle. Settled now: ${r.traded.map((s) => `${STUDENTS[s]}→${SCHOOLS[r.pointS[s]]}`).join(", ")}.`}
            </p>
          )}
          <div>
            {view === "ttc"
              ? isJa
                ? "TTC の最終結果: "
                : "Final TTC assignment: "
              : isJa
                ? "割り当て: "
                : "Assignment: "}
            <span className="font-mono font-semibold">{code(match)}</span>
            <span className="text-muted-foreground">
              {"  ("}
              {match
                .map((h, s) =>
                  isJa
                    ? `${STUDENTS[s]}: 第 ${rankOf(s, h)} 希望`
                    : `${STUDENTS[s]}: choice #${rankOf(s, h)}`,
                )
                .join(", ")}
              {")"}
            </span>
          </div>
          <div
            className="font-semibold"
            style={{ color: envy.length === 0 ? STABLE_HEX : REJECT_HEX }}
          >
            {envy.length === 0
              ? isJa
                ? "✓ 正当な羨望（ブロッキングペア）なし — 安定"
                : "✓ No justified envy (no blocking pair) — stable"
              : isJa
                ? `✗ 正当な羨望: ${envy.map(([s, h]) => `(${STUDENTS[s]}, ${SCHOOLS[h]})`).join(", ")} — ${STUDENTS[envy[0][0]]} は ${SCHOOLS[envy[0][1]]} を望み、${SCHOOLS[envy[0][1]]} の優先順位では ${STUDENTS[envy[0][0]]} が今の生徒より上`
                : `✗ Justified envy: ${envy.map(([s, h]) => `(${STUDENTS[s]}, ${SCHOOLS[h]})`).join(", ")} — ${STUDENTS[envy[0][0]]} wants ${SCHOOLS[envy[0][1]]} and outranks its current student there`}
          </div>
          <div
            className="font-semibold"
            style={{ color: improvement === null ? STABLE_HEX : REJECT_HEX }}
          >
            {improvement === null
              ? isJa
                ? "✓ 誰も損をせずに誰かが得をする組み替えはない — パレート効率的"
                : "✓ No reassignment makes someone better off without hurting anyone — Pareto efficient"
              : isJa
                ? `✗ 誰も損をしない改善がある: ${code(improvement)}`
                : `✗ An improvement that hurts nobody exists: ${code(improvement)}`}
          </div>
        </div>
      </Panel>
    </InteractiveDemo>
  );
}
