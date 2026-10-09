import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Svg } from "../../kit/ui";

type Tone = "neutral" | "coral" | "teal" | "amber" | "error" | "dark" | "muted";
type Point = { x: number; y: number };

const toneColors: Record<Tone, { bg: string; fg: string; stroke: string }> = {
  neutral: { bg: "#ffffff", fg: colors.ink, stroke: colors.hairlineStrong },
  coral: { bg: colors.coralSoft, fg: colors.coralDeep, stroke: colors.coral },
  teal: { bg: colors.tealSoft, fg: colors.tealDeep, stroke: colors.teal },
  amber: { bg: colors.amberSoft, fg: "#9a6420", stroke: colors.amber },
  error: { bg: colors.errorSoft, fg: colors.error, stroke: colors.error },
  dark: { bg: colors.dark, fg: colors.onDark, stroke: colors.darkElevated },
  muted: { bg: colors.surfaceCard, fg: colors.muted, stroke: colors.hairlineStrong },
};

function textWrapStyle(lang: "ja" | "en"): CSSProperties {
  return {
    wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal",
    textWrap: "balance" as never,
  };
}

function Node({
  x,
  y,
  label,
  sub,
  tone = "neutral",
  size = 92,
  opacity = 1,
  scale = 1,
  crashed = false,
  pulse = 0,
  children,
}: {
  x: number;
  y: number;
  label: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  size?: number;
  opacity?: number;
  scale?: number;
  crashed?: boolean;
  pulse?: number;
  children?: ReactNode;
}) {
  const c = toneColors[crashed ? "muted" : tone];
  return (
    <Abs x={x - size / 2} y={y - size / 2} w={size} h={size + (sub ? 48 : 0)} style={{ opacity, transform: `scale(${scale})`, transformOrigin: "50% 46px" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: c.bg,
          border: `4px solid ${c.stroke}`,
          boxShadow: pulse > 0 ? `0 0 0 ${Math.round(16 * pulse)}px rgba(232,165,90,${0.22 * (1 - pulse)})` : "0 12px 26px rgba(20,20,19,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: size > 80 ? 30 : 24,
          fontWeight: 800,
          color: c.fg,
          position: "relative",
        }}
      >
        {label}
        {crashed && <span style={{ position: "absolute", fontFamily: fonts.sans, fontSize: 50, color: colors.muted }}>×</span>}
        {children}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 10,
            width: 240,
            marginLeft: (size - 240) / 2,
            textAlign: "center",
            fontFamily: fonts.sans,
            fontSize: 22,
            fontWeight: 650,
            lineHeight: 1.2,
            color: c.fg,
          }}
        >
          {sub}
        </div>
      )}
    </Abs>
  );
}

function SmallLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontFamily: fonts.sans, fontSize: 24, fontWeight: 650, color: colors.body, lineHeight: 1.25, ...style }}>
      {children}
    </div>
  );
}

function FormulaCard({ children, tone = "muted", style }: { children: ReactNode; tone?: "muted" | "teal" | "error" | "coral" | "amber"; style?: CSSProperties }) {
  return (
    <Chip tone={tone} size={28} style={{ padding: "12px 22px", ...style }}>
      <span style={{ fontFamily: fonts.mono }}>{children}</span>
    </Chip>
  );
}

function MiniNode({ label, tone = "neutral" }: { label: ReactNode; tone?: Tone }) {
  const c = toneColors[tone];
  return (
    <span
      style={{
        width: 54,
        height: 54,
        borderRadius: 999,
        background: c.bg,
        border: `3px solid ${c.stroke}`,
        color: c.fg,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
        fontSize: 19,
        fontWeight: 800,
      }}
    >
      {label}
    </span>
  );
}

function PhaseBanner({ phases, active, x = 560, y = 226, w = 800 }: { phases: string[]; active: number; x?: number; y?: number; w?: number }) {
  return (
    <Abs x={x} y={y} w={w}>
      <Card tone="white" style={{ padding: "14px 18px", display: "flex", gap: 12, justifyContent: "center" }}>
        {phases.map((phase, i) => (
          <Chip key={phase} tone={i === active ? "coral" : "muted"} size={22} style={{ opacity: i === active ? 1 : 0.48 }}>
            {phase}
          </Chip>
        ))}
      </Card>
    </Abs>
  );
}

function MessagePill({
  x1,
  y1,
  x2,
  y2,
  start,
  dur = 26,
  label,
  tone = "coral",
  dy = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start: number;
  dur?: number;
  label: string;
  tone?: "coral" | "teal" | "amber" | "error";
  dy?: number;
}) {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + dur + 8) return null;
  const p = progress(frame, start, dur);
  const fade = 1 - progress(frame, start + dur, 8);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p + dy * Math.sin(Math.PI * p);
  return (
    <Abs x={x - 58} y={y - 18} w={116} style={{ opacity: fade, textAlign: "center" }}>
      <Chip tone={tone} size={20} style={{ boxShadow: "0 10px 22px rgba(20,20,19,0.14)" }}>
        {label}
      </Chip>
    </Abs>
  );
}

function StatusDot({ tone = "muted" }: { tone?: "muted" | "teal" | "amber" | "coral" | "error" }) {
  const map = { muted: colors.hairlineStrong, teal: colors.teal, amber: colors.amber, coral: colors.coral, error: colors.error };
  return <span style={{ width: 13, height: 13, borderRadius: 999, background: map[tone], display: "inline-block" }} />;
}

function ringPoints(cx: number, cy: number, r: number, count: number, offset = -Math.PI / 2): Point[] {
  return Array.from({ length: count }, (_, i) => ({ x: cx + Math.cos(offset + (i / count) * Math.PI * 2) * r, y: cy + Math.sin(offset + (i / count) * Math.PI * 2) * r }));
}

function useCue(index: number, fallback = 0) {
  const { cues } = useScene();
  return cues[index] ?? fallback;
}

/* ------------------------------------------------------------------------ */
/* 0. Intro                                                                  */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pts = ringPoints(1500, 420, 190, 5);
  const values = ["7", "2", "9", "4", "1"];
  const years = ["1978 2PC", "1989 Paxos", "1999 PBFT", "2014 Raft"];

  return (
    <TitleCard
      title={{ ja: "合意アルゴリズムの系譜", en: "The Evolution of Consensus" }}
      subtitle={{
        ja: "2PC から Paxos、Raft、PBFT へ — 分散合意は何を解決してきたか",
        en: "From 2PC to Paxos, Raft, and PBFT: what each one solved",
      }}
      art={
        <>
          <Svg>
            <circle cx={1500} cy={420} r={190} fill="none" stroke={colors.hairlineStrong} strokeWidth={3} strokeDasharray="10 10" opacity={progress(frame, 8, 20)} />
            {pts.map((a, i) => {
              const b = pts[(i + 1) % pts.length];
              return <Arrow key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={progress(frame, 18 + i * 5, 18)} color={colors.hairlineStrong} width={3} head={false} bend={20} />;
            })}
          </Svg>
          {pts.map((p, i) => {
            const converged = progress(frame, 72 + i * 14, 16);
            const s = Math.min(1, pop(frame, 18 + i * 5, fps));
            return (
              <Node
                key={i}
                x={p.x}
                y={p.y}
                size={92}
                label={converged > 0.6 ? "5" : values[i]}
                tone={converged > 0.45 ? "teal" : "neutral"}
                opacity={s}
                scale={0.82 + s * 0.18}
              />
            );
          })}
          <Abs x={1345} y={386} w={310} style={{ textAlign: "center", opacity: progress(frame, 78, 22) }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 34, color: colors.tealDeep, fontWeight: 650 }}>consensus</div>
            <div style={{ marginTop: 8, fontFamily: fonts.mono, fontSize: 32, color: colors.tealDeep }}>v = 5</div>
          </Abs>
          <Abs x={1228} y={675} w={544} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, opacity: progress(frame, 108, 24) }}>
            {years.map((year, i) => (
              <Chip key={year} tone={i === 0 ? "amber" : i === 1 || i === 3 ? "teal" : "error"} size={22} style={{ justifyContent: "center" }}>
                {year}
              </Chip>
            ))}
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Fault models                                                           */
/* ------------------------------------------------------------------------ */

export function FaultsScene() {
  const frame = useCurrentFrame();
  const { lang } = useScene();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 160);
  const c2 = useCue(2, 360);
  const crash = progress(frame, c0 + 42, 14);
  const byz = progress(frame, c1 + 26, 14);
  const compare = progress(frame, c2 + 6, 20);

  return (
    <SceneShell kicker={{ ja: "障害モデル", en: "Failure models" }} title={{ ja: "止まるか、嘘をつくか", en: "Stop, or lie?" }}>
      <Abs x={150} y={260} w={700} h={370}>
        <Appear at={c0 + 4}>
          <Card style={{ width: "100%", height: "100%", padding: 30 }} accent={mixColor(colors.hairline, colors.teal, crash)}>
            <Chip tone="teal" size={26}>{t({ ja: "クラッシュ障害", en: "Crash fault" })}</Chip>
            <SmallLabel style={{ marginTop: 26, maxWidth: 460, ...textWrapStyle(lang) }}>
              {t({ ja: "止まるだけ・嘘はつかない", en: "just stops, never lies" })}
            </SmallLabel>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1070} y={260} w={700} h={370}>
        <Appear at={c1 + 2}>
          <Card style={{ width: "100%", height: "100%", padding: 30 }} accent={mixColor(colors.hairline, colors.error, byz)}>
            <Chip tone="error" size={26}>{t({ ja: "ビザンチン障害", en: "Byzantine fault" })}</Chip>
            <SmallLabel style={{ marginTop: 26, maxWidth: 540, ...textWrapStyle(lang) }}>
              {t({ ja: "嘘・改ざん・無視 — なんでもあり", en: "lies, tampers, ignores: anything goes" })}
            </SmallLabel>
          </Card>
        </Appear>
      </Abs>
      <Svg>
        <g opacity={progress(frame, c0 + 16, 18)}>
          <Arrow x1={410} y1={440} x2={590} y2={440} p={progress(frame, c0 + 16, 18)} color={colors.teal} width={5} />
          <Arrow x1={590} y1={440} x2={710} y2={440} p={(1 - crash) * progress(frame, c0 + 34, 18)} color={colors.teal} width={5} dashed />
        </g>
        <g opacity={progress(frame, c1 + 38, 18)}>
          <Arrow x1={1420} y1={430} x2={1280} y2={515} p={progress(frame, c1 + 38, 18)} color={colors.error} width={5} bend={-40} />
          <Arrow x1={1420} y1={430} x2={1605} y2={515} p={progress(frame, c1 + 50, 18)} color={colors.error} width={5} bend={45} />
        </g>
      </Svg>
      <div style={{ opacity: progress(frame, c0 + 18, 18) }}>
        <Node x={410} y={440} label="A" tone="teal" />
        <Node x={590} y={440} label="B" tone="neutral" crashed={crash > 0.55} />
        <Node x={710} y={440} label="C" tone="neutral" opacity={1 - crash * 0.25} />
      </div>
      <div style={{ opacity: progress(frame, c1 + 18, 18) }}>
        <Node x={1420} y={430} label="B" tone="error" />
        <Node x={1280} y={540} label="A" tone="neutral" />
        <Node x={1605} y={540} label="C" tone="neutral" />
        <Abs x={1210} y={448}><Chip tone="error" size={22}>v=1</Chip></Abs>
        <Abs x={1542} y={448}><Chip tone="error" size={22}>v=2</Chip></Abs>
      </div>
      <Abs x={250} y={695} w={1420} h={145} style={{ opacity: compare, transform: `translateY(${(1 - compare) * 18}px)` }}>
        <Card tone="soft" style={{ height: "100%", padding: "26px 34px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[0, 1, 2].map((i) => <MiniNode key={i} label={i + 1} tone={i === 2 ? "muted" : "teal"} />)}
            <FormulaCard tone="teal">2f + 1 = 3</FormulaCard>
            <SmallLabel>{t({ ja: "f = 1 を許容", en: "tolerate f = 1" })}</SmallLabel>
          </div>
          <div style={{ width: 2, height: 80, background: colors.hairlineStrong }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[0, 1, 2, 3].map((i) => <MiniNode key={i} label={i + 1} tone={i === 3 ? "error" : "teal"} />)}
            <FormulaCard tone="error">3f + 1 = 4</FormulaCard>
            <SmallLabel>{t({ ja: "正直な多数を残す", en: "leave an honest majority" })}</SmallLabel>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. FLP                                                                    */
/* ------------------------------------------------------------------------ */

export function FlpScene() {
  const frame = useCurrentFrame();
  const { lang } = useScene();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 420);
  const pts = [
    { x: 960, y: 270, label: t({ ja: "安全性", en: "Safety" }), sub: t({ ja: "矛盾しない", en: "no contradiction" }), tone: "teal" as const },
    { x: 650, y: 642, label: t({ ja: "活性", en: "Liveness" }), sub: t({ ja: "いつか決まる", en: "eventual decision" }), tone: "amber" as const },
    { x: 1270, y: 642, label: t({ ja: "障害耐性", en: "Fault tolerance" }), sub: t({ ja: "1台止まる", en: "one crash" }), tone: "coral" as const },
  ];
  const tri = progress(frame, c0 + 12, 34);
  const strategy = progress(frame, c1 + 4, 22);

  return (
    <SceneShell kicker={{ ja: "FLP 不可能性", en: "FLP impossibility" }} title={{ ja: "完璧な合意は存在しない", en: "No perfect consensus" }}>
      <Svg>
        <path
          d={`M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y} L ${pts[2].x} ${pts[2].y} Z`}
          fill="rgba(204,120,92,0.04)"
          stroke={colors.hairlineStrong}
          strokeWidth={4}
          strokeDasharray={`${Math.max(1, tri) * 1700} 1700`}
          opacity={tri}
        />
        <line x1={810} y1={458} x2={1110} y2={458} stroke={colors.error} strokeWidth={8} strokeLinecap="round" opacity={progress(frame, c0 + 120, 18)} />
        <line x1={1110} y1={458} x2={810} y2={458} stroke={colors.error} strokeWidth={8} strokeLinecap="round" opacity={progress(frame, c0 + 120, 18)} />
      </Svg>
      <Abs x={1180} y={136} style={{ opacity: progress(frame, c0 + 32, 20) }}>
        <Chip tone="coral" size={26}>1985 · Fischer, Lynch, Paterson</Chip>
      </Abs>
      {pts.map((p, i) => (
        <Abs key={p.label} x={p.x - 155} y={p.y - 58} w={310} h={116} style={{ opacity: progress(frame, c0 + 26 + i * 12, 20) }}>
          <Card tone="white" accent={toneColors[p.tone].stroke} style={{ padding: "18px 20px", textAlign: "center" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: lang === "ja" ? 34 : 32, color: toneColors[p.tone].fg, fontWeight: 650 }}>{p.label}</div>
            <div style={{ marginTop: 6, fontFamily: fonts.sans, fontSize: 20, color: colors.muted, ...textWrapStyle(lang) }}>{p.sub}</div>
          </Card>
        </Abs>
      ))}
      <Abs x={690} y={438} w={540} style={{ opacity: progress(frame, c0 + 132, 22), textAlign: "center" }}>
        <Chip tone="error" size={30}>{t({ ja: "非同期 × 決定性 では同時達成不可", en: "async × deterministic cannot guarantee all three" })}</Chip>
      </Abs>
      <Abs x={210} y={770} w={1500} style={{ opacity: strategy, transform: `translateY(${(1 - strategy) * 18}px)` }}>
        <Card tone="soft" style={{ padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <Chip tone="teal" size={28}>{t({ ja: "安全性: 常に保証", en: "Safety: always" })}</Chip>
          <Chip tone="amber" size={28}>{t({ ja: "活性: ネットワークが安定すれば", en: "Liveness: once the network settles" })}</Chip>
          {[{ ja: "ランダム化", en: "randomization" }, { ja: "部分同期", en: "partial synchrony" }, { ja: "タイムアウト（障害検知器）", en: "timeouts (failure detectors)" }].map((x) => (
            <Chip key={x.en} tone="muted" size={24}>{t(x)}</Chip>
          ))}
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. 2PC                                                                    */
/* ------------------------------------------------------------------------ */

export function TwoPcScene() {
  const frame = useCurrentFrame();
  const { lang } = useScene();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 280);
  const c2 = useCue(2, 570);
  const coord = { x: 350, y: 540 };
  const parts = [{ x: 980, y: 360 }, { x: 980, y: 540 }, { x: 980, y: 720 }];
  const crashAt = c1 + 112;
  const crashed = frame >= crashAt;
  const waiting = progress(frame, crashAt + 8, 20);
  const phase = frame < c1 ? (frame < c0 + 76 ? 0 : frame < c0 + 136 ? 1 : 2) : frame < crashAt ? (frame < c1 + 70 ? 0 : 1) : 1;
  const committed = frame >= c0 + 162 && frame < c1;
  const voted = (frame >= c0 + 98 && frame < c1) || frame >= c1 + 60;

  return (
    <SceneShell kicker={{ ja: "2PC", en: "2PC" }} title={{ ja: "2フェーズコミット", en: "Two-phase commit" }}>
      <PhaseBanner phases={["Prepare", "Yes", "Commit"]} active={phase} x={510} y={206} w={700} />
      <Svg>
        {parts.map((p, i) => (
          <g key={i}>
            <Arrow x1={coord.x + 62} y1={coord.y} x2={p.x - 62} y2={p.y} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.6} />
            <Arrow x1={p.x - 62} y1={p.y + 8} x2={coord.x + 62} y2={coord.y + 8} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.38} />
          </g>
        ))}
      </Svg>
      <Node x={coord.x} y={coord.y} label="C" tone={crashed ? "muted" : "coral"} size={106} crashed={crashed} sub={t({ ja: "コーディネーター", en: "Coordinator" })} />
      {parts.map((p, i) => (
        <Node
          key={i}
          x={p.x}
          y={p.y}
          label={`P${i + 1}`}
          tone={waiting > 0 ? "amber" : committed ? "teal" : voted ? "teal" : "neutral"}
          size={98}
          pulse={waiting * Math.abs(Math.sin(frame / 9))}
          sub={t({ ja: "参加者", en: "Participant" })}
        />
      ))}
      {parts.map((p, i) => {
        const prepareStart = (frame < c1 ? c0 + 28 : c1 + 22) + i * 5;
        const yesStart = (frame < c1 ? c0 + 90 : c1 + 50) + i * 6;
        const commitStart = c0 + 148 + i * 5;
        return (
          <div key={`m-${i}`}>
            {phase === 0 && <MessagePill x1={coord.x + 70} y1={coord.y} x2={p.x - 70} y2={p.y} start={prepareStart} label="Prepare" tone="coral" dy={i === 1 ? -18 : 0} />}
            {phase === 1 && <MessagePill x1={p.x - 70} y1={p.y + 8} x2={coord.x + 70} y2={coord.y + 8} start={yesStart} label="Yes" tone="teal" dy={i === 1 ? 18 : 0} />}
            {phase === 2 && frame < c1 && <MessagePill x1={coord.x + 70} y1={coord.y - 8} x2={p.x - 70} y2={p.y - 8} start={commitStart} label="Commit" tone="teal" dy={i === 1 ? -18 : 0} />}
          </div>
        );
      })}
      <Abs x={1260} y={300} w={500}>
        <Card tone="white" accent={waiting ? colors.amber : colors.teal} style={{ padding: 26 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: lang === "ja" ? 32 : 30, color: colors.ink, marginBottom: 22 }}>{t({ ja: "参加者の状態", en: "Participant states" })}</div>
          {parts.map((_, i) => {
            const state = waiting > 0 ? t({ ja: "復旧まで待機…", en: "blocked until recovery" }) : committed ? t({ ja: "コミット済み", en: "committed" }) : voted ? t({ ja: "Yes 済み", en: "voted Yes" }) : "—";
            const tone: "muted" | "teal" | "amber" = waiting > 0 ? "amber" : committed || voted ? "teal" : "muted";
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 18px 1fr", alignItems: "center", gap: 12, padding: "12px 0", borderTop: i ? `1px solid ${colors.hairline}` : undefined }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 25, fontWeight: 800 }}>P{i + 1}</span>
                <StatusDot tone={tone} />
                <span style={{ fontFamily: fonts.sans, fontSize: 25, color: tone === "amber" ? colors.amber : colors.body, fontWeight: 650 }}>{state}</span>
              </div>
            );
          })}
        </Card>
      </Abs>
      <Abs x={170} y={790} w={1580} style={{ display: "flex", justifyContent: "center", gap: 18, opacity: progress(frame, c2 + 4, 20), ...textWrapStyle(lang) }}>
        <Chip tone="error" size={25}>{t({ ja: "障害耐性 f = 0", en: "tolerates f = 0" })}</Chip>
        <Chip tone="error" size={25}>{t({ ja: "単一障害点", en: "single point of failure" })}</Chip>
        <Chip tone="amber" size={25}>{t({ ja: "勝手にタイムアウト → 不整合の恐れ", en: "timing out alone risks inconsistency" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Paxos                                                                  */
/* ------------------------------------------------------------------------ */

const acceptors = [360, 480, 600, 720, 840].map((y, i) => ({ x: 1110, y, id: `A${i + 1}` }));

export function PaxosScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 220);
  const c2 = useCue(2, 440);
  const c3 = useCue(3, 650);
  const c4 = useCue(4, 930);
  const proposer = { x: 260, y: 520 };
  const acc = acceptors.map((a) => ({ ...a, x: 780 }));
  const phase = frame < c2 ? 0 : 1;
  const counter1 = Math.min(3, Math.floor(progress(frame, c1 + 88, 64) * 3.99));
  const counter2 = Math.min(3, Math.floor(progress(frame, c2 + 82, 60) * 3.99));
  const showingProtocol = frame < c3 + 24;
  const problems = progress(frame, c4 + 8, 20);
  const duel = Math.floor((frame - c4) / 22) % 2;

  return (
    <SceneShell kicker={{ ja: "Paxos", en: "Paxos" }} title={{ ja: "過半数で決める", en: "Decide by majority" }}>
      <Abs x={1180} y={136} style={{ opacity: progress(frame, c0 + 16, 18) }}>
        <Chip tone="coral" size={26}>1989 · Lamport</Chip>
        <Chip tone="teal" size={26} style={{ marginLeft: 12 }}>{t({ ja: "過半数 = 3 / 5", en: "majority = 3 / 5" })}</Chip>
      </Abs>
      {showingProtocol && <PhaseBanner phases={["Phase 1: Prepare / Promise", "Phase 2: Accept / Accepted"]} active={phase} x={430} y={214} w={820} />}
      <div style={{ opacity: 1 - progress(frame, c3 + 20, 18) }}>
        <Svg>
          {acc.map((a) => (
            <g key={a.id}>
              <Arrow x1={proposer.x + 68} y1={proposer.y} x2={a.x - 62} y2={a.y} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.58} />
              <Arrow x1={a.x - 62} y1={a.y + 8} x2={proposer.x + 68} y2={proposer.y + 8} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.34} />
            </g>
          ))}
        </Svg>
        <Node x={proposer.x} y={proposer.y} label="P" tone="coral" size={108} sub={t({ ja: "プロポーザー", en: "Proposer" })} />
        <Abs x={670} y={292} w={220} style={{ textAlign: "center", opacity: progress(frame, c0 + 22, 18) }}>
          <Chip tone="muted" size={24}>{t({ ja: "アクセプター", en: "Acceptors" })}</Chip>
        </Abs>
        {acc.map((a, i) => (
          <Node key={a.id} x={a.x} y={a.y} label={a.id} tone={i === 4 ? "muted" : counter2 >= 3 && i < 3 ? "teal" : "neutral"} size={90} />
        ))}
        {acc.map((a, i) => (
          <div key={`pkt-${a.id}`}>
            {phase === 0 && <MessagePill x1={proposer.x + 72} y1={proposer.y} x2={a.x - 68} y2={a.y} start={c1 + 24 + i * 4} label="Prepare(n)" tone="coral" dy={i === 2 ? -18 : 0} />}
            {phase === 0 && i < 3 && <MessagePill x1={a.x - 68} y1={a.y + 9} x2={proposer.x + 72} y2={proposer.y + 9} start={c1 + 82 + i * 7} label="Promise" tone="teal" dy={i === 1 ? 18 : 0} />}
            {phase === 1 && <MessagePill x1={proposer.x + 72} y1={proposer.y} x2={a.x - 68} y2={a.y} start={c2 + 22 + i * 4} label="Accept(n,v)" tone="coral" dy={i === 2 ? -18 : 0} />}
            {phase === 1 && i < 3 && <MessagePill x1={a.x - 68} y1={a.y + 9} x2={proposer.x + 72} y2={proposer.y + 9} start={c2 + 78 + i * 6} label="Accepted" tone="teal" dy={i === 1 ? 18 : 0} />}
          </div>
        ))}
        <PaxosAcceptorPanel counter={phase === 0 ? counter1 : counter2} accepted={frame >= c2 + 112} promised={frame >= c1 + 105} chosen={frame >= c2 + 134} />
      </div>
      <QuorumIntersection visible={progress(frame, c3, 22) * (1 - progress(frame, c4 - 12, 16))} label={t({ ja: "必ず重なる", en: "always overlap" })} note={t({ ja: "番号最大の受理値を引き継ぐ", en: "adopt the highest-numbered accepted value" })} />
      <Abs x={180} y={294} w={1560} style={{ opacity: problems, transform: `translateY(${(1 - problems) * 18}px)` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr 1.55fr", gap: 24 }}>
          <ProblemCard n="1" text={t({ ja: "難解", en: "hard to understand" })} />
          <ProblemCard n="2" text={t({ ja: "ログ複製への拡張が自明でない", en: "Multi-Paxos not obvious" })} />
          <ProblemCard n="3" text={t({ ja: "Proposer の競合 → いつまでも決まらない", en: "dueling proposers → no progress" })} />
        </div>
      </Abs>
      <Abs x={610} y={610} w={700} style={{ opacity: progress(frame, c4 + 78, 20) }}>
        <Card tone="soft" style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <Chip tone={duel === 0 ? "coral" : "muted"} size={28}>P1 · n={duel === 0 ? 7 : 5}</Chip>
          <span style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.muted }}>↔</span>
          <Chip tone={duel === 1 ? "coral" : "muted"} size={28}>P2 · n={duel === 1 ? 8 : 6}</Chip>
        </Card>
      </Abs>
    </SceneShell>
  );
}

function PaxosAcceptorPanel({ counter, promised, accepted, chosen }: { counter: number; promised: boolean; accepted: boolean; chosen: boolean }) {
  const t = useT();
  return (
    <Abs x={1170} y={300} w={560}>
      <Card tone="white" accent={chosen ? colors.teal : colors.coralSoft} style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.ink }}>{t({ ja: "アクセプターの状態", en: "Acceptor state" })}</div>
          <Chip tone={counter >= 3 ? "teal" : "amber"} size={23}>{t({ ja: "過半数", en: "majority" })}: {counter}/5</Chip>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr", gap: 8, fontFamily: fonts.sans, fontSize: 20, color: colors.muted, paddingBottom: 8 }}>
          <b>ID</b><b>promised n</b><b>accepted (n,v)</b>
        </div>
        {acceptors.map((a, i) => {
          const active = i < 3;
          return (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr 1fr", gap: 8, alignItems: "center", padding: "10px 0", borderTop: `1px solid ${colors.hairline}`, fontFamily: fonts.mono, fontSize: 22 }}>
              <span style={{ fontWeight: 800 }}>{a.id}</span>
              <span style={{ color: promised && active ? colors.tealDeep : colors.mutedSoft }}>{promised && active ? "n=7" : "—"}</span>
              <span style={{ color: accepted && active ? colors.tealDeep : colors.mutedSoft }}>{accepted && active ? "(7,v)" : "—"}</span>
            </div>
          );
        })}
        {chosen && <Chip tone="teal" size={26} style={{ marginTop: 16 }}>{t({ ja: "合意成立: v", en: "value chosen: v" })}</Chip>}
      </Card>
    </Abs>
  );
}

function ProblemCard({ n, text }: { n: string; text: string }) {
  return (
    <Card tone="white" accent={colors.coralSoft} style={{ minHeight: 140, padding: 24 }}>
      <div style={{ fontFamily: fonts.mono, fontSize: 26, color: colors.coral, fontWeight: 800 }}>0{n}</div>
      <div style={{ marginTop: 12, fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: colors.body, lineHeight: 1.25 }}>{text}</div>
    </Card>
  );
}

function QuorumIntersection({ visible, label, note }: { visible: number; label: string; note: string }) {
  const xs = [600, 770, 940, 1110, 1280];
  const ys = 492;
  return (
    <div style={{ opacity: visible }}>
      <Svg>
        <ellipse cx={820} cy={492} rx={360} ry={150} fill="rgba(93,184,166,0.20)" stroke={colors.teal} strokeWidth={4} />
        <ellipse cx={1060} cy={492} rx={360} ry={150} fill="rgba(204,120,92,0.18)" stroke={colors.coral} strokeWidth={4} />
      </Svg>
      {xs.map((x, i) => <Node key={i} x={x} y={ys} label={`A${i + 1}`} size={78} tone={i === 2 ? "teal" : "neutral"} />)}
      <Abs x={760} y={690} w={400} style={{ textAlign: "center" }}><Chip tone="teal" size={30}>{label}</Chip></Abs>
      <Abs x={620} y={748} w={680} style={{ textAlign: "center" }}><Chip tone="coral" size={26}>{note}</Chip></Abs>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Raft                                                                   */
/* ------------------------------------------------------------------------ */

export function RaftScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 260);
  const c2 = useCue(2, 500);
  const c3 = useCue(3, 790);
  const nodes = [
    { x: 300, y: 500 },
    { x: 520, y: 315 },
    { x: 760, y: 390 },
    { x: 760, y: 640 },
    { x: 520, y: 715 },
  ];
  const leader = nodes[0];
  const elected = frame >= c1 + 128;
  const commitCount = Math.min(3, Math.floor(progress(frame, c2 + 84, 70) * 3.99));
  const committed = commitCount >= 3;
  const requestingVotes = frame >= c3 + 34;

  return (
    <SceneShell kicker={{ ja: "Raft", en: "Raft" }} title={{ ja: "理解しやすさのための再設計", en: "Redesigned for understandability" }}>
      <Abs x={1180} y={136} style={{ opacity: progress(frame, c0 + 12, 18) }}><Chip tone="coral" size={26}>2014 · Ongaro & Ousterhout</Chip></Abs>
      <Abs x={1080} y={226} w={690}>
        <Card tone="white" style={{ padding: "14px 18px", display: "flex", gap: 12, justifyContent: "center" }}>
          <Chip tone={frame < c2 ? "coral" : "muted"} size={21}>{t({ ja: "リーダー選出", en: "Leader election" })}</Chip>
          <Chip tone={frame >= c2 && frame < c3 ? "teal" : "muted"} size={21}>{t({ ja: "ログ複製", en: "Log replication" })}</Chip>
          <Chip tone={frame >= c3 ? "amber" : "muted"} size={21}>{t({ ja: "安全性", en: "Safety" })}</Chip>
        </Card>
      </Abs>
      <Svg>
        {nodes.slice(1).map((p, i) => (
          <g key={i}>
            <Arrow x1={leader.x + 64} y1={leader.y} x2={p.x - 58} y2={p.y} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.55} />
            <Arrow x1={p.x - 58} y1={p.y + 8} x2={leader.x + 64} y2={leader.y + 8} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.28} />
          </g>
        ))}
      </Svg>
      {nodes.map((p, i) => {
        const isLeader = i === 0 && elected;
        const oldCandidate = i === 3 && requestingVotes;
        return (
          <Node
            key={i}
            x={p.x}
            y={p.y}
            label={`N${i + 1}`}
            tone={oldCandidate ? "amber" : isLeader ? "coral" : committed && i < 3 ? "teal" : "neutral"}
            size={96}
            pulse={i === 0 && frame >= c1 && frame < c1 + 76 ? progress(frame, c1 + 8, 90) : 0}
            sub={isLeader ? t({ ja: "リーダー", en: "Leader" }) : frame >= c1 + 48 && i === 0 ? t({ ja: "候補者", en: "Candidate" }) : t({ ja: "フォロワー", en: "Follower" })}
          >
            {isLeader && <span style={{ position: "absolute", right: -18, top: -16, background: colors.coral, color: "#fff", borderRadius: 999, padding: "4px 10px", fontFamily: fonts.sans, fontSize: 20 }}>term 2</span>}
          </Node>
        );
      })}
      {nodes.slice(1).map((p, i) => (
        <div key={`raft-msg-${i}`}>
          {frame >= c1 && frame < c2 && <MessagePill x1={leader.x + 70} y1={leader.y} x2={p.x - 64} y2={p.y} start={c1 + 78 + i * 5} label="RequestVote" tone="coral" dy={i % 2 ? -18 : 18} />}
          {frame >= c1 && frame < c2 && i < 3 && <MessagePill x1={p.x - 64} y1={p.y + 9} x2={leader.x + 70} y2={leader.y + 9} start={c1 + 120 + i * 6} label="Vote" tone="teal" dy={i % 2 ? 18 : -18} />}
          {frame >= c2 && frame < c3 && <MessagePill x1={leader.x + 70} y1={leader.y} x2={p.x - 64} y2={p.y} start={c2 + 42 + i * 6} label="AppendEntries" tone="teal" dy={i % 2 ? -20 : 20} />}
          {frame >= c3 && i !== 2 && <MessagePill x1={nodes[3].x - 60} y1={nodes[3].y - 5} x2={p.x - 60} y2={p.y - 5} start={c3 + 42 + i * 7} label="RequestVote" tone="amber" dy={i % 2 ? -20 : 20} />}
        </div>
      ))}
      <RaftLogPanel commitCount={commitCount} committed={committed} voteReject={requestingVotes} />
      <Abs x={1010} y={780} w={760} style={{ opacity: progress(frame, c3 + 50, 18) }}>
        <Chip tone="amber" size={25}>{t({ ja: "ログが古い → 投票しない", en: "log out of date → no vote" })}</Chip>
        <Chip tone="teal" size={25} style={{ marginLeft: 12 }}>{t({ ja: "コミット済みエントリは残る", en: "committed entries survive" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

function RaftLogPanel({ commitCount, committed, voteReject }: { commitCount: number; committed: boolean; voteReject: boolean }) {
  const t = useT();
  return (
    <Abs x={1010} y={300} w={760}>
      <Card tone="white" accent={committed ? colors.teal : colors.amberSoft} style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 31, color: colors.ink }}>{t({ ja: "各ノードのログ", en: "Per-node logs" })}</div>
          <Chip tone={committed ? "teal" : "amber"} size={23}>{committed ? t({ ja: "コミット", en: "committed" }) : `${commitCount}/5`}</Chip>
        </div>
        {[0, 1, 2, 3, 4].map((i) => {
          const hasEntry = i < Math.max(1, commitCount) || (i === 3 && voteReject ? false : i === 3 && commitCount > 3);
          const stale = i === 3 && voteReject;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "58px 1fr 46px", alignItems: "center", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${colors.hairline}` : undefined }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 23, fontWeight: 800 }}>N{i + 1}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ width: 76, height: 42, borderRadius: 9, border: `2px solid ${colors.hairlineStrong}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, color: colors.muted }}>t1</span>
                <span style={{ width: 90, height: 42, borderRadius: 9, border: `3px solid ${hasEntry && committed ? colors.teal : hasEntry ? colors.amber : colors.hairlineStrong}`, background: hasEntry && committed ? colors.tealSoft : hasEntry ? colors.amberSoft : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontWeight: 800, color: hasEntry ? colors.body : colors.mutedSoft }}>{hasEntry ? "x=5" : "—"}</span>
                {hasEntry && committed && <Chip tone="teal" size={18}>✓</Chip>}
              </div>
              <span style={{ fontFamily: fonts.serif, fontSize: 38, color: stale ? colors.error : colors.mutedSoft }}>{stale ? "✕" : ""}</span>
            </div>
          );
        })}
      </Card>
    </Abs>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. PBFT                                                                   */
/* ------------------------------------------------------------------------ */

export function PbftScene() {
  const frame = useCurrentFrame();
  const { lang } = useScene();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 220);
  const c2 = useCue(2, 500);
  const c3 = useCue(3, 780);
  const replicas = [
    { x: 280, y: 560, id: "P", tone: "coral" as Tone, role: t({ ja: "プライマリ", en: "Primary" }) },
    { x: 660, y: 380, id: "R1", tone: "teal" as Tone, role: t({ ja: "レプリカ", en: "Replica" }) },
    { x: 660, y: 740, id: "R2", tone: "teal" as Tone, role: t({ ja: "レプリカ", en: "Replica" }) },
    { x: 1010, y: 560, id: "R3", tone: "error" as Tone, role: t({ ja: "ビザンチン", en: "Byzantine" }) },
  ];
  const protocolVisible = 1 - progress(frame, c2 - 4, 14);
  const phase = frame < c1 + 98 ? 0 : frame < c1 + 174 ? 1 : 2;
  const prepareCount = Math.min(3, Math.floor(progress(frame, c1 + 126, 62) * 3.99));
  const commitCount = Math.min(3, Math.floor(progress(frame, c1 + 202, 62) * 3.99));
  const bars = progress(frame, c3 + 20, 28);

  return (
    <SceneShell kicker={{ ja: "PBFT", en: "PBFT" }} title={{ ja: "嘘をつくノードにも耐える", en: "Tolerating nodes that lie" }}>
      <Abs x={1180} y={136} style={{ opacity: progress(frame, c0 + 10, 18) }}>
        <Chip tone="coral" size={26}>1999 · Castro & Liskov</Chip>
        <Chip tone="error" size={26} style={{ marginLeft: 12 }}>n = 4, f = 1</Chip>
      </Abs>
      <div style={{ opacity: protocolVisible }}>
        <PhaseBanner phases={["Pre-prepare", "Prepare", "Commit"]} active={phase} x={420} y={206} w={820} />
        <Svg>
          {replicas.flatMap((a, i) => replicas.map((b, j) => i < j ? <Arrow key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={1} color={colors.hairlineStrong} width={3} head={false} opacity={0.35} /> : null))}
        </Svg>
        {replicas.map((n) => <Node key={n.id} x={n.x} y={n.y} label={n.id} tone={n.tone} size={96} sub={n.role} />)}
        {replicas.slice(1).map((r, i) => phase === 0 && <MessagePill key={`pre-${r.id}`} x1={replicas[0].x + 70} y1={replicas[0].y} x2={r.x - 65} y2={r.y} start={c1 + 36 + i * 8} label="Pre-prepare" tone={i === 2 ? "error" : "coral"} dy={i === 1 ? 20 : -20} />)}
        {phase === 1 && replicas.flatMap((a, i) => replicas.map((b, j) => i !== j ? <MessagePill key={`prep-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} start={c1 + 106 + ((i + j) % 3) * 8} dur={30} label={i === 3 ? "bad" : "Prepare"} tone={i === 3 ? "error" : "teal"} dy={(i - j) * 7} /> : null))}
        {phase === 2 && replicas.flatMap((a, i) => replicas.map((b, j) => i !== j ? <MessagePill key={`com-${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} start={c1 + 184 + ((i + j) % 3) * 8} dur={30} label={i === 3 ? "bad" : "Commit"} tone={i === 3 ? "error" : "amber"} dy={(j - i) * 7} /> : null))}
        <PbftCounterPanel prepareCount={prepareCount} commitCount={commitCount} />
      </div>
      <QuorumMath visible={progress(frame, c2 + 8, 20) * (1 - progress(frame, c3 - 10, 16))} />
      <Abs x={230} y={286} w={1460} style={{ opacity: bars, transform: `translateY(${(1 - bars) * 18}px)` }}>
        <Card tone="soft" style={{ padding: 34 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: lang === "ja" ? 42 : 40, color: colors.ink }}>{t({ ja: "メッセージは O(n²) で増える", en: "Messages grow as O(n²)" })}</div>
          <div style={{ marginTop: 36, display: "flex", alignItems: "end", gap: 58 }}>
            {[4, 7, 10, 40].map((n) => (
              <div key={n} style={{ width: 230, textAlign: "center" }}>
                <div style={{ margin: "0 auto", width: 90, height: Math.min(310, n * n * 0.18) * bars, borderRadius: 12, background: n >= 40 ? colors.error : colors.coral }} />
                <div style={{ marginTop: 16, fontFamily: fonts.mono, fontSize: 24, color: colors.body }}>n={n}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 22, color: colors.muted }}>{n * n} {t({ ja: "通", en: "msgs" })}</div>
              </div>
            ))}
            <Chip tone="error" size={28}>{t({ ja: "実用的には数十ノード程度が限界", en: "practical limit: a few dozen nodes" })}</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

function PbftCounterPanel({ prepareCount, commitCount }: { prepareCount: number; commitCount: number }) {
  const t = useT();
  return (
    <Abs x={1235} y={304} w={520}>
      <Card tone="white" accent={commitCount >= 3 ? colors.teal : colors.coralSoft} style={{ padding: 24 }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginBottom: 16 }}>{t({ ja: "一致メッセージ数", en: "Matching messages" })}</div>
        {["P", "R1", "R2", "R3"].map((id, i) => {
          const byz = i === 3;
          return (
            <div key={id} style={{ display: "grid", gridTemplateColumns: "58px 1fr 1fr", gap: 10, alignItems: "center", padding: "11px 0", borderTop: i ? `1px solid ${colors.hairline}` : undefined }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 23, fontWeight: 800, color: byz ? colors.error : colors.body }}>{id}</span>
              <Chip tone={byz ? "error" : prepareCount >= 3 ? "teal" : "amber"} size={20}>Prepare {byz ? "bad" : `${prepareCount}/3`}</Chip>
              <Chip tone={byz ? "error" : commitCount >= 3 ? "teal" : "amber"} size={20}>Commit {byz ? "bad" : `${commitCount}/3`}</Chip>
            </div>
          );
        })}
        <Chip tone="teal" size={24} style={{ marginTop: 16 }}>2f+1 = 3 {t({ ja: "一致", en: "matching" })}</Chip>
      </Card>
    </Abs>
  );
}

function QuorumMath({ visible }: { visible: number }) {
  const t = useT();
  return (
    <div style={{ opacity: visible }}>
      <Svg>
        <ellipse cx={780} cy={490} rx={310} ry={160} fill="rgba(93,184,166,0.22)" stroke={colors.teal} strokeWidth={4} />
        <ellipse cx={1040} cy={490} rx={310} ry={160} fill="rgba(204,120,92,0.18)" stroke={colors.coral} strokeWidth={4} />
      </Svg>
      {[620, 840, 1060, 1280].map((x, i) => <Node key={i} x={x} y={490} label={`N${i + 1}`} tone={i === 3 ? "error" : "teal"} size={82} />)}
      <Abs x={590} y={690} w={760} style={{ display: "flex", justifyContent: "center", gap: 18 }}>
        <FormulaCard tone="teal">{t({ ja: "2f+1台のクォーラムは少なくとも f+1 台で重なる", en: "Any two 2f+1 quorums overlap in at least f+1 nodes" })}</FormulaCard>
        <FormulaCard tone="coral">n - f ≥ 2f + 1 ⇒ n ≥ 3f + 1</FormulaCard>
      </Abs>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Adoption                                                               */
/* ------------------------------------------------------------------------ */

export function AdoptionScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const c0 = useCue(0);
  const c1 = useCue(1, 250);
  const columns = [
    { title: "Paxos", tone: "coral" as const, items: ["Google Chubby", "Google Spanner", "Apache ZooKeeper (Zab)"], at: c0 + 8 },
    { title: "Raft", tone: "teal" as const, items: ["etcd", "CockroachDB", "TiKV", "Consul"], at: c0 + 38 },
    { title: "BFT", tone: "error" as const, items: ["Hyperledger Fabric", "Tendermint"], at: c1 + 4 },
  ];
  return (
    <SceneShell kicker={{ ja: "実世界での採用", en: "In production" }} title={{ ja: "どこで使われているか", en: "Where they run" }}>
      <Abs x={180} y={286} w={1560} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
        {columns.map((col) => (
          <Appear key={col.title} at={col.at}>
            <Card tone="white" accent={toneColors[col.tone].stroke} style={{ minHeight: 500, padding: 32 }}>
              <Chip tone={col.tone} size={30}>{col.title} {t(col.title === "BFT" ? { ja: "系", en: "family" } : { ja: "系", en: "family" })}</Chip>
              <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 20 }}>
                {col.items.map((item, i) => (
                  <div key={item} style={{ opacity: progress(frame, col.at + 24 + i * 14, 16), transform: `translateX(${(1 - progress(frame, col.at + 24 + i * 14, 16)) * 20}px)` }}>
                    <Chip tone="muted" size={27} style={{ width: "100%", justifyContent: "center", whiteSpace: "normal" }}>{item}</Chip>
                  </div>
                ))}
              </div>
            </Card>
          </Appear>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Lessons                                                                */
/* ------------------------------------------------------------------------ */

export function LessonsScene() {
  const { lang, cues } = useScene();
  const t = useT();
  const lessons: { text: Bilingual; tone: "coral" | "teal" | "amber" }[] = [
    { tone: "coral", text: { ja: "障害モデルが強いほど、ノード数とメッセージが増える", en: "stronger failure models cost more nodes and messages" } },
    { tone: "teal", text: { ja: "理解しやすさも設計指標", en: "understandability is a design goal" } },
    { tone: "amber", text: { ja: "安全性は常に、活性はいずれ", en: "always safe, eventually live" } },
  ];
  return (
    <SceneShell kicker={{ ja: "まとめ", en: "Takeaways" }} title={{ ja: "40年の研究が教えること", en: "What four decades taught us" }}>
      <Abs x={180} y={282} w={1560} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28 }}>
        {lessons.map((lesson, i) => (
          <Appear key={lesson.text.en} at={(cues[i] ?? i * 180) + 8}>
            <Card tone="white" accent={toneColors[lesson.tone].stroke} style={{ minHeight: 410, padding: 34 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 54, fontWeight: 800, color: toneColors[lesson.tone].stroke }}>0{i + 1}</div>
              <div style={{ marginTop: 38, fontFamily: fonts.serif, fontSize: lang === "ja" ? 43 : 39, lineHeight: 1.25, color: colors.ink, ...textWrapStyle(lang) }}>
                {t(lesson.text)}
              </div>
              {i === 1 && <Chip tone="muted" size={24} style={{ marginTop: 30 }}>Paxos → Raft</Chip>}
            </Card>
          </Appear>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Outro                                                                  */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const frame = useCurrentFrame();
  return (
    <EndCard slug="consensus-algorithms" headline={{ ja: "安全性は常に、活性はいずれ。", en: "Always safe, eventually live." }}>
      <div style={{ marginTop: 46, display: "flex", gap: 18, opacity: progress(frame, 24, 20) }}>
        {["Paxos", "Raft", "PBFT"].map((name, i) => (
          <Chip key={name} tone={i === 0 ? "coral" : i === 1 ? "teal" : "error"} size={30}>{name}</Chip>
        ))}
      </div>
    </EndCard>
  );
}
