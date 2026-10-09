import { useMemo, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

const seededSteps = (seed: number, count: number) => {
  let s = seed >>> 0;
  const out: number[] = [0];
  let pos = 0;
  for (let i = 0; i < count; i++) {
    s = (1664525 * s + 1013904223) >>> 0;
    pos += ((s >>> 16) & 1) === 0 ? 1 : -1;
    out.push(pos);
  }
  return out;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function Label({ children, size = 26, color = colors.body, mono = false }: { children: string; size?: number; color?: string; mono?: boolean }) {
  return <span style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: size, fontWeight: 650, color }}>{children}</span>;
}

function MiniSvg({ children, w = 430, h = 320 }: { children: ReactNode; w?: number; h?: number }) {
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      {children}
    </svg>
  );
}

function FormulaCard({ x, y, w, children, at }: { x: number; y: number; w: number; children: string; at: number }) {
  return (
    <Abs x={x} y={y} w={w}>
      <Appear at={at}>
        <Card tone="white" accent={colors.coralSoft} style={{ padding: "22px 28px", fontFamily: fonts.mono, fontSize: 31, fontWeight: 700, color: colors.ink, whiteSpace: "nowrap" }}>
          {children}
        </Card>
      </Appear>
    </Abs>
  );
}

function Node({
  x,
  y,
  label,
  tone = "muted",
  r = 48,
  active = 0,
}: {
  x: number;
  y: number;
  label: string;
  tone?: "muted" | "coral" | "teal" | "amber" | "dark";
  r?: number;
  active?: number;
}) {
  const fill = tone === "coral" ? colors.coral : tone === "teal" ? colors.teal : tone === "amber" ? colors.amber : tone === "dark" ? colors.dark : "#fff";
  const stroke = active > 0 ? colors.coral : tone === "muted" ? colors.hairlineStrong : fill;
  return (
    <g>
      <circle cx={x} cy={y} r={r + active * 8} fill={active > 0 ? colors.coralSoft : "transparent"} />
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={active > 0 ? 7 : 4} />
      <text x={x} y={y + 10} textAnchor="middle" fontFamily={fonts.sans} fontSize={30} fontWeight={800} fill={tone === "dark" || tone === "coral" ? colors.onDark : colors.ink}>
        {label}
      </text>
    </g>
  );
}

function Bar({ x, y, w, h, value, color, label, number }: { x: number; y: number; w: number; h: number; value: number; color: string; label: string; number: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={colors.surfaceSoft} stroke={colors.hairlineStrong} strokeWidth={2} />
      <rect x={x} y={y} width={w * clamp01(value)} height={h} rx={12} fill={color} />
      <text x={x + 18} y={y + h / 2 + 10} fontFamily={fonts.sans} fontSize={28} fontWeight={800} fill={colors.ink}>
        {label}
      </text>
      <text x={x + w - 18} y={y + h / 2 + 9} textAnchor="end" fontFamily={fonts.mono} fontSize={25} fontWeight={800} fill={colors.ink}>
        {number}
      </text>
    </g>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const path = useMemo(() => seededSteps(13, 22), []);
  const d = path
    .map((p, i) => `${i === 0 ? "M" : "L"} ${1220 + i * 21} ${470 - p * 16}`)
    .join(" ");
  const web = [
    { x: 1510, y: 300, r: 46, label: "A" },
    { x: 1690, y: 420, r: 54, label: "B" },
    { x: 1450, y: 610, r: 62, label: "C" },
    { x: 1660, y: 700, r: 42, label: "D" },
  ];
  return (
    <TitleCard
      title={{ ja: "ランダムウォーク\nからPageRankへ", en: "Random Walks\nto PageRank" }}
      subtitle={{ ja: "酔っ払いの千鳥足が、グラフと検索ランキングへつながる道筋", en: "How a drunkard's stagger leads to graphs and search ranking" }}
      art={
        <>
          <Svg>
            <path d={d} fill="none" stroke={colors.coral} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={progress(frame, 20, 48)} />
            <line x1={1180} y1={540} x2={1760} y2={540} stroke={colors.hairlineStrong} strokeWidth={4} />
            <line x1={1220} y1={300} x2={1220} y2={690} stroke={colors.dark} strokeWidth={7} />
            <circle cx={1220} cy={285} r={48} fill={colors.amberSoft} stroke={colors.amber} strokeWidth={5} />
            {web.map((a, i) =>
              web.slice(i + 1).map((b) => <Arrow key={`${a.label}${b.label}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={progress(frame, 55 + i * 4, 24)} color={colors.hairlineStrong} width={4} bend={20} />),
            )}
          </Svg>
          <Abs x={1175} y={694} w={180}>
            <div style={{ opacity: progress(frame, 30, 18), fontFamily: fonts.sans, fontSize: 28, fontWeight: 800, color: colors.coral }}>{t({ ja: "酔歩", en: "walk" })}</div>
          </Abs>
          {web.map((n, i) => {
            const s = pop(frame, 58 + i * 6, fps);
            return (
              <Abs key={n.label} x={n.x - n.r} y={n.y - n.r} w={n.r * 2} h={n.r * 2} style={{ opacity: Math.min(1, s), transform: `scale(${0.75 + 0.25 * s})` }}>
                <svg width={n.r * 2} height={n.r * 2} viewBox={`0 0 ${n.r * 2} ${n.r * 2}`} style={{ overflow: "visible" }}>
                  <Node x={n.r} y={n.r} r={n.r} label={n.label} tone={i === 2 ? "coral" : "muted"} active={i === 2 ? progress(frame, 96, 25) : 0} />
                </svg>
              </Abs>
            );
          })}
          <Abs x={1375} y={780} w={420}>
            <Card tone="dark" style={{ padding: "20px 26px", opacity: progress(frame, 86, 22) }}>
              <Label color={colors.onDark} size={30}>{t({ ja: "定常分布 = 重要度", en: "stationary = importance" })}</Label>
            </Card>
          </Abs>
        </>
      }
    />
  );
}

export function OriginScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const walks = useMemo(() => [7, 13, 29, 43, 71].map((s) => seededSteps(s, 100)), []);
  const show = Math.round(lerp(0, 100, progress(frame, cues[0], 80)));
  return (
    <SceneShell kicker={{ ja: "1次元", en: "One dimension" }} title={{ ja: "平均は0、広がりは√n", en: "Mean zero, spread √n" }}>
      <Abs x={120} y={235} w={1135} h={555}>
        <Card tone="white" style={{ height: "100%", padding: 24, overflow: "hidden" }}>
          <svg width="100%" height={460} viewBox="0 0 1040 460" style={{ display: "block", overflow: "hidden" }}>
            <defs>
              <clipPath id="origin-plot-clip">
                <rect x={60} y={34} width={930} height={386} rx={14} />
              </clipPath>
            </defs>
            <line x1={70} y1={240} x2={980} y2={240} stroke={colors.hairlineStrong} strokeWidth={5} />
            <line x1={525} y1={48} x2={525} y2={420} stroke={colors.hairline} strokeWidth={3} />
            <text x={525} y={444} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fill={colors.muted}>
              0
            </text>
            {[10, -10].map((v) => (
              <g key={v}>
                <line x1={70} y1={240 - v * 14} x2={980} y2={240 - v * 14} stroke={colors.hairline} strokeWidth={2} />
                <text x={44} y={250 - v * 14} textAnchor="end" fontFamily={fonts.mono} fontSize={24} fill={colors.muted}>
                  {v}
                </text>
              </g>
            ))}
            <g clipPath="url(#origin-plot-clip)">
              <rect x={70} y={240 - Math.sqrt(show || 1) * 14} width={910} height={Math.sqrt(show || 1) * 28} fill={colors.coralSoft} opacity={progress(frame, cues[2], 30) * 0.45} />
              {walks.map((walk, wi) => {
                const pts = walk
                  .slice(0, show + 1)
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${70 + i * 9.1} ${240 - p * 14}`)
                  .join(" ");
                return <path key={wi} d={pts} fill="none" stroke={[colors.coral, colors.teal, colors.amber, colors.dark, colors.muted][wi]} strokeWidth={wi === 0 ? 7 : 4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
              })}
            </g>
          </svg>
          <div style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 32, fontWeight: 650, color: colors.muted, opacity: progress(frame, cues[2], 20) }}>
            {t({ ja: `シード固定の5本、n = ${show}`, en: `five seeded walks, n = ${show}` })}
          </div>
        </Card>
      </Abs>
      <Abs x={1305} y={245} w={420}>
        <Appear at={cues[0]}>
          <Card style={{ padding: 28 }}>
            <Chip tone="coral" size={26}>{t({ ja: "ステップ", en: "step" })}</Chip>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
              <Label mono size={46}>+1</Label>
              <Label mono size={46}>1/2</Label>
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between" }}>
              <Label mono size={46}>-1</Label>
              <Label mono size={46}>1/2</Label>
            </div>
          </Card>
        </Appear>
      </Abs>
      <FormulaCard x={1305} y={510} w={430} at={cues[1]}>{t({ ja: "S_n = X_1 + ... + X_n", en: "S_n = X_1 + ... + X_n" })}</FormulaCard>
      <Abs x={1305} y={650} w={430}>
        <Appear at={cues[2]}>
          <Card tone="white" accent={colors.tealSoft} style={{ padding: 28 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <Label mono size={34}>{t({ ja: "E[S_n] = 0", en: "E[S_n] = 0" })}</Label>
              <Label mono size={34}>{t({ ja: "Var(S_n) = n", en: "Var(S_n) = n" })}</Label>
              <Label mono size={34}>{t({ ja: "sd = √n", en: "sd = √n" })}</Label>
            </div>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

export function RecurrenceScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const p2 = progress(frame, cues[2], 60);
  const xs = [240, 360, 480, 600, 720, 840, 960, 1080, 1200];
  return (
    <SceneShell kicker={{ ja: "再帰性", en: "Recurrence" }} title={{ ja: "小さい確率も、足すと無限大", en: "Tiny probabilities still add up" }}>
      <Abs x={120} y={240} w={1135} h={565}>
        <Card tone="white" style={{ height: "100%", padding: 24, overflow: "hidden" }}>
          <svg width="100%" height={515} viewBox="0 0 1040 515" style={{ display: "block" }}>
            <line x1={90} y1={170} x2={950} y2={170} stroke={colors.hairlineStrong} strokeWidth={5} />
            <circle cx={520} cy={170} r={22 + 12 * p2} fill={colors.coralSoft} />
            <circle cx={520} cy={170} r={18} fill={colors.coral} />
            <text x={520} y={222} textAnchor="middle" fontFamily={fonts.sans} fontSize={32} fontWeight={800} fill={colors.coralDeep}>
              {t({ ja: "原点", en: "origin" })}
            </text>
            {xs.map((_, i) => (
              <circle key={i} cx={130 + i * 95} cy={170} r={8} fill={i % 2 === 0 ? colors.hairlineStrong : colors.hairline} />
            ))}
            <Packet x1={520} y1={170} x2={335} y2={170} start={cues[0] + 8} dur={24} color={colors.amber} label="+/-" />
            <Packet x1={335} y1={170} x2={520} y2={170} start={cues[0] + 36} dur={24} color={colors.teal} label={t({ ja: "帰還", en: "return" })} />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
              const h = 220 / Math.sqrt(n);
              return <rect key={n} x={160 + n * 82} y={465 - h * p2} width={48} height={h * p2} rx={9} fill={n % 2 ? colors.coral : colors.teal} opacity={0.86} />;
            })}
            <text x={485} y={500} fontFamily={fonts.mono} fontSize={34} fontWeight={800} fill={colors.ink} opacity={p2}>
              Σ 1/√n = ∞
            </text>
          </svg>
        </Card>
      </Abs>
      <FormulaCard x={1305} y={275} w={455} at={cues[0]}>{t({ ja: "+1 と -1 が同数", en: "same # of +1 and -1" })}</FormulaCard>
      <FormulaCard x={1305} y={430} w={455} at={cues[1]}>{t({ ja: "P(S_2n=0) ≈ 1/√(πn)", en: "P(S_2n=0) ≈ 1/√(πn)" })}</FormulaCard>
      <Abs x={1305} y={602} w={455}>
        <Appear at={cues[2]}>
          <Card tone="dark" style={{ padding: 30 }}>
            <Label color={colors.onDark} size={30}>{t({ ja: "確率1で無限回戻る", en: "returns infinitely often" })}</Label>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

export function FirstReturnScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const draw = progress(frame, cues[1], 55);
  const pts = Array.from({ length: 90 }, (_, i) => {
    const x = 220 + i * 12;
    const y = 780 - 420 / Math.pow(i + 1, 0.72);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return (
    <SceneShell kicker={{ ja: "初到達時間", en: "First return" }} title={{ ja: "必ず帰る、でも平均時間は無限大", en: "Certain return, infinite mean time" }}>
      <Svg>
        <line x1={210} y1={790} x2={1320} y2={790} stroke={colors.hairlineStrong} strokeWidth={4} />
        <line x1={220} y1={300} x2={220} y2={800} stroke={colors.hairlineStrong} strokeWidth={4} />
        <path d={pts} fill="none" stroke={colors.coral} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${draw * 2000} 2000`} />
        <text x={295} y={330} fontFamily={fonts.mono} fontSize={36} fontWeight={800} fill={colors.coralDeep} opacity={progress(frame, cues[1], 20)}>
          1/n^(3/2)
        </text>
        <text x={1040} y={845} fontFamily={fonts.sans} fontSize={30} fontWeight={700} fill={colors.muted}>
          {t({ ja: "待ち時間", en: "waiting time" })}
        </text>
        <text x={310} y={266} fontFamily={fonts.sans} fontSize={30} fontWeight={700} fill={colors.muted}>
          {t({ ja: "初帰還確率", en: "first-return probability" })}
        </text>
      </Svg>
      <Appear at={cues[0]}>
        <Abs x={1010} y={300} w={500}>
          <Card style={{ padding: 30 }}>
            <Label size={34}>{t({ ja: "「帰るか」と「いつ帰るか」は別", en: "“returns” and “when” differ" })}</Label>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[2]}>
        <Abs x={1010} y={470} w={530}>
          <Card tone="dark" accent={colors.teal} style={{ padding: 34 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <Label color={colors.onDark} mono size={42}>{t({ ja: "P(帰還) = 1", en: "P(return) = 1" })}</Label>
              <Label color={colors.onDark} mono size={42}>{t({ ja: "E[帰還時間] = ∞", en: "E[time] = ∞" })}</Label>
              <Chip tone="teal" size={30}>{t({ ja: "零再帰", en: "null recurrent" })}</Chip>
            </div>
          </Card>
        </Abs>
      </Appear>
    </SceneShell>
  );
}

export function DimensionsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const panels = [
    { x: 145, y: 250, title: { ja: "1次元", en: "1D" }, body: { ja: "再帰的", en: "recurrent" }, sub: { ja: "確率1で帰還", en: "return prob. 1" }, tone: colors.teal },
    { x: 665, y: 250, title: { ja: "2次元", en: "2D" }, body: { ja: "再帰的", en: "recurrent" }, sub: { ja: "調和級数の遅さ", en: "harmonic-like" }, tone: colors.teal },
    { x: 1185, y: 250, title: { ja: "3次元以上", en: "3D+" }, body: { ja: "非再帰的", en: "transient" }, sub: { ja: "帰還 ≈ 0.3405", en: "return ≈ 0.3405" }, tone: colors.amber },
  ];
  return (
    <SceneShell kicker={{ ja: "ポリアの定理", en: "Pólya's theorem" }} title={{ ja: "空間が広いほど、戻れない", en: "More space means fewer returns" }}>
      {panels.map((p, i) => (
        <Appear key={p.x} at={cues[Math.min(i, 2)]}>
          <Abs x={p.x} y={p.y} w={455} h={585}>
            <Card tone="white" accent={p.tone} style={{ height: "100%", padding: 34 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Label size={46} color={colors.ink}>{t(p.title)}</Label>
                <Chip tone={i < 2 ? "teal" : "amber"} size={30}>{t(p.body)}</Chip>
              </div>
              <Svg>
                {i === 0 && <line x1={60} y1={265} x2={360} y2={265} stroke={colors.hairlineStrong} strokeWidth={5} />}
                {i === 1 &&
                  Array.from({ length: 5 }, (_, k) => (
                    <g key={k}>
                      <line x1={90 + k * 55} y1={170} x2={90 + k * 55} y2={360} stroke={colors.hairline} strokeWidth={3} />
                      <line x1={90} y1={170 + k * 48} x2={310} y2={170 + k * 48} stroke={colors.hairline} strokeWidth={3} />
                    </g>
                  ))}
                {i === 2 && (
                  <g>
                    <rect x={95} y={180} width={190} height={190} fill="none" stroke={colors.hairlineStrong} strokeWidth={4} />
                    <rect x={150} y={125} width={190} height={190} fill="none" stroke={colors.hairlineStrong} strokeWidth={4} />
                    <Arrow x1={95} y1={180} x2={150} y2={125} color={colors.hairlineStrong} width={3} head={false} />
                    <Arrow x1={285} y1={180} x2={340} y2={125} color={colors.hairlineStrong} width={3} head={false} />
                    <Arrow x1={95} y1={370} x2={150} y2={315} color={colors.hairlineStrong} width={3} head={false} />
                    <Arrow x1={285} y1={370} x2={340} y2={315} color={colors.hairlineStrong} width={3} head={false} />
                  </g>
                )}
                <circle cx={215} cy={265} r={18 + 12 * progress(frame, cues[Math.min(i, 2)] + 25, 30)} fill={i < 2 ? colors.teal : colors.amber} />
              </Svg>
              <div style={{ position: "absolute", left: 30, right: 30, bottom: 38, display: "grid", gap: 16 }}>
                <Label size={38}>{t(p.sub)}</Label>
                {i === 2 && <Label size={31} color={colors.muted}>{t({ ja: "約66%は二度と戻らない", en: "about 66% never return" })}</Label>}
              </div>
            </Card>
          </Abs>
        </Appear>
      ))}
    </SceneShell>
  );
}

const graphNodes = [
  { id: "A", x: 300, y: 360 },
  { id: "B", x: 620, y: 270 },
  { id: "C", x: 880, y: 515 },
  { id: "D", x: 520, y: 750 },
  { id: "E", x: 1135, y: 360 },
  { id: "F", x: 1190, y: 755 },
];
const graphEdges: [number, number][] = [
  [0, 1],
  [0, 3],
  [1, 2],
  [1, 4],
  [2, 3],
  [2, 4],
  [2, 5],
  [3, 5],
  [4, 5],
];

function Graph({ active = -1, directed = false, scale = 1 }: { active?: number; directed?: boolean; scale?: number }) {
  return (
    <Svg>
      {graphEdges.map(([a, b], i) => (
        <Arrow key={i} x1={graphNodes[a].x} y1={graphNodes[a].y} x2={graphNodes[b].x} y2={graphNodes[b].y} p={1} color={colors.hairlineStrong} width={4} head={directed} opacity={0.8} />
      ))}
      {graphNodes.map((n, i) => (
        <Node key={n.id} x={n.x} y={n.y} label={n.id} r={50 * scale} tone={i === active ? "coral" : "muted"} active={i === active ? 1 : 0} />
      ))}
    </Svg>
  );
}

export function GraphWalkScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "グラフへ拡張", en: "Graphs" }} title={{ ja: "次の状態だけを見ればよい", en: "Only the current node matters" }}>
      <Graph active={Math.floor(progress(frame, cues[1], 90) * 5) % 6} />
      <Svg>
        <Packet x1={300} y1={360} x2={620} y2={270} start={cues[1] + 8} dur={28} color={colors.coral} label={t({ ja: "一様", en: "uniform" })} />
        <Packet x1={620} y1={270} x2={880} y2={515} start={cues[1] + 48} dur={28} color={colors.teal} label={t({ ja: "次", en: "next" })} />
      </Svg>
      <Appear at={cues[0]}>
        <Abs x={1285} y={260} w={430}>
          <Card style={{ padding: 30 }}>
            <Chip tone="coral" size={26}>{t({ ja: "遷移ルール", en: "transition" })}</Chip>
            <div style={{ marginTop: 22 }}>
              <Label mono size={32}>{t({ ja: "P(i→j)=1/deg(i)", en: "P(i→j)=1/deg(i)" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[2]}>
        <Abs x={1285} y={475} w={510}>
          <Card tone="dark" style={{ padding: 34 }}>
            <div style={{ display: "grid", gap: 18 }}>
              <Label color={colors.onDark} size={28}>{t({ ja: "時刻tの分布", en: "distribution at time t" })}</Label>
              <Label color={colors.onDark} mono size={40}>{t({ ja: "p(t+1) = p(t) · P", en: "p(t+1) = p(t) · P" })}</Label>
              <Label color={colors.onDarkSoft} size={25}>{t({ ja: "tは添字。べき乗ではない", en: "t is a time index, not a power" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
    </SceneShell>
  );
}

export function StationaryScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const degrees = [2, 3, 4, 3, 3, 3];
  const total = degrees.reduce((a, b) => a + b, 0);
  const build = progress(frame, cues[1], 70);
  return (
    <SceneShell kicker={{ ja: "定常分布", en: "Stationary distribution" }} title={{ ja: "多くの入り口ほど、よく訪問される", en: "More entrances, more visits" }}>
      <Graph active={2} />
      <Abs x={1310} y={250} w={470}>
        <Card tone="white" style={{ padding: 28 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <Chip tone="teal" size={26}>{t({ ja: "長期訪問頻度", en: "long-run frequency" })}</Chip>
            <Label mono size={30}>{t({ ja: "一意な π = πP", en: "unique π = πP" })}</Label>
            <Label mono size={30}>{t({ ja: "π_i = deg(i) / 2|E|", en: "π_i = deg(i) / 2|E|" })}</Label>
            <Appear at={cues[2]}>
              <Label size={24}>{t({ ja: "詳細釣り合い: 流入 = 流出", en: "detailed balance: in = out" })}</Label>
            </Appear>
            <MiniSvg w={430} h={300}>
              {degrees.map((d, i) => (
                <Bar
                  key={i}
                  x={20}
                  y={34 + i * 41}
                  w={380}
                  h={32}
                  value={(d / total) * 3.5 * build}
                  color={i === 2 ? colors.coral : colors.teal}
                  label={graphNodes[i].id}
                  number={`${d}/${total}`}
                />
              ))}
            </MiniSvg>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function MixingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const panelData = [
    { x: 120, title: { ja: "完全グラフ", en: "complete" }, chip: { ja: "数ステップ", en: "few steps" }, gap: 0.92, tone: "teal" as const },
    { x: 655, title: { ja: "遅いパス", en: "slow path" }, chip: { ja: "O(n^2)", en: "O(n²)" }, gap: 0.18, tone: "amber" as const },
    { x: 1190, title: { ja: "エクスパンダー", en: "expander" }, chip: { ja: "O(log n)", en: "O(log n)" }, gap: 0.72, tone: "teal" as const },
  ];
  const p = progress(frame, cues[2], 90);
  return (
    <SceneShell kicker={{ ja: "ミキシング", en: "Mixing" }} title={{ ja: "スペクトルギャップが大きいほど速い", en: "A larger spectral gap mixes faster" }}>
      <Appear at={cues[1]}>
        <Abs x={190} y={215} w={1470}>
          <Card style={{ padding: "18px 28px", textAlign: "center" }}>
            <Label size={30}>{t({ ja: "λ_* が小さいほど、1 - λ_* が大きく、速く定常分布へ近づく", en: "Smaller λ_* means larger 1 - λ_* and faster convergence" })}</Label>
          </Card>
        </Abs>
      </Appear>
      {panelData.map((pd, pi) => (
        <Appear key={pd.x} at={cues[Math.min(pi, 2)]}>
          <Abs x={pd.x} y={305} w={500} h={545}>
            <Card tone="white" accent={pd.tone === "teal" ? colors.teal : colors.amber} style={{ height: "100%", padding: 32 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Label size={38}>{t(pd.title)}</Label>
                <Chip tone={pd.tone} size={28}>{t(pd.chip)}</Chip>
              </div>
              <MiniSvg w={460} h={440}>
                {pi !== 1 &&
                  graphEdges.slice(0, pi === 0 ? 8 : 9).map(([a, b], i) => {
                    const positions =
                      pi === 0
                        ? [
                            [185, 115],
                            [280, 150],
                            [265, 260],
                            [150, 285],
                            [85, 185],
                          ]
                        : [
                            [130, 110],
                            [245, 92],
                            [335, 172],
                            [305, 300],
                            [165, 310],
                            [85, 210],
                          ];
                    const from = positions[a % positions.length];
                    const to = positions[b % positions.length];
                    return <line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={colors.hairlineStrong} strokeWidth={5} />;
                  })}
                {pi !== 1 &&
                  (pi === 0
                    ? [
                        [185, 115],
                        [280, 150],
                        [265, 260],
                        [150, 285],
                        [85, 185],
                      ]
                    : [
                        [130, 110],
                        [245, 92],
                        [335, 172],
                        [305, 300],
                        [165, 310],
                        [85, 210],
                      ]
                  ).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={18} fill={i === 0 ? colors.coral : colors.teal} stroke="#fff" strokeWidth={4} />)}
                {Array.from({ length: 7 }, (_, i) => {
                  const base = pi === 1 ? Math.exp(-Math.abs(i - 2.8) * (1.25 - p * 0.65)) : 1 + (i % 2) * 0.4 * (1 - p);
                  const v = lerp(i === 0 ? 3 : 0.4, base, p * pd.gap + (pi === 1 ? p * 0.2 : 0));
                  const h = 115 * v;
                  return <rect key={i} x={70 + i * 45} y={380 - h} width={32} height={h} rx={8} fill={pi === 1 ? colors.amber : colors.teal} opacity={0.85} />;
                })}
                {pi === 1 &&
                  Array.from({ length: 6 }, (_, i) => (
                    <g key={i}>
                      <circle cx={75 + i * 65} cy={185} r={22} fill={i === 2 ? colors.coral : colors.hairlineStrong} />
                      {i < 5 && <line x1={97 + i * 65} y1={185} x2={118 + i * 65} y2={185} stroke={colors.hairlineStrong} strokeWidth={6} />}
                    </g>
                  ))}
                <text x={70} y={420} fontFamily={fonts.mono} fontSize={30} fontWeight={800} fill={colors.ink}>
                  {pi === 1 ? t({ ja: "怠惰なウォーク: 1/2で留まる", en: "lazy: stay 1/2" }) : t({ ja: `スペクトルギャップ ≈ ${pd.gap}`, en: `gap ≈ ${pd.gap}` })}
                </text>
              </MiniSvg>
            </Card>
          </Abs>
        </Appear>
      ))}
    </SceneShell>
  );
}

const webNodes = [
  { id: "P1", x: 220, y: 380 },
  { id: "P2", x: 555, y: 290 },
  { id: "P3", x: 875, y: 540 },
  { id: "P4", x: 475, y: 815 },
  { id: "P5", x: 1205, y: 395 },
  { id: "P6", x: 1280, y: 820 },
];
const webEdges: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [2, 1],
  [3, 2],
  [5, 2],
  [2, 4],
];

/** PageRank vectors of the web graph after 0…50 power-iteration steps (d = 0.85; dangling pages jump uniformly). */
const powerSteps = (() => {
  const d = 0.85;
  const n = webNodes.length;
  const outDegree = webNodes.map((_, i) => webEdges.filter(([from]) => from === i).length);
  let rank = webNodes.map(() => 1 / n);
  const steps = [rank];
  for (let k = 0; k < 50; k++) {
    const dangling = rank.reduce((sum, r, i) => (outDegree[i] === 0 ? sum + r : sum), 0);
    const next = webNodes.map(() => (1 - d) / n + (d * dangling) / n);
    for (const [from, to] of webEdges) next[to] += (d * rank[from]) / outDegree[from];
    rank = next;
    steps.push(rank);
  }
  return steps;
})();

function nodeEdge(a: (typeof webNodes)[number], b: (typeof webNodes)[number], r = 62) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x1: a.x + (dx / len) * r,
    y1: a.y + (dy / len) * r,
    x2: b.x - (dx / len) * r,
    y2: b.y - (dy / len) * r,
  };
}

function WebGraph({ active = 2 }: { active?: number }) {
  const t = useT();
  return (
    <Svg>
      {webEdges.map(([a, b], i) => {
        const e = nodeEdge(webNodes[a], webNodes[b]);
        return <Arrow key={i} {...e} p={1} color={colors.hairlineStrong} width={5} bend={i % 2 ? 28 : -18} />;
      })}
      {webNodes.map((n, i) => (
        <Node key={n.id} x={n.x} y={n.y} label={n.id} r={50} tone={i === active ? "coral" : "muted"} active={i === active ? 1 : 0} />
      ))}
      <text x={1138} y={366} textAnchor="end" fontFamily={fonts.sans} fontSize={28} fontWeight={800} fill={colors.amber}>
        {t({ ja: "ダングリング", en: "dangling" })}
      </text>
    </Svg>
  );
}

export function PageRankIdeaScene() {
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "PageRankの発明", en: "Inventing PageRank" }} title={{ ja: "重要なページからのリンクは重い", en: "Links from important pages matter" }}>
      <WebGraph />
      <Appear at={cues[1]}>
        <Abs x={1320} y={245} w={430}>
          <Card style={{ padding: 26 }}>
            <Chip tone="amber" size={24}>1976</Chip>
            <div style={{ marginTop: 18 }}>
              <Label size={31}>{t({ ja: "ピンスキー: 引用ネットワーク", en: "Pinski: citation networks" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[2]}>
        <Abs x={1320} y={410} w={430}>
          <Card style={{ padding: 26 }}>
            <Chip tone="coral" size={24}>1998</Chip>
            <div style={{ marginTop: 18 }}>
              <Label size={31}>{t({ ja: "ペイジ & ブリン: ウェブ", en: "Page & Brin: the web" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[3]}>
        <Abs x={1265} y={595} w={525}>
          <Card tone="dark" style={{ padding: 34 }}>
            <Label color={colors.onDark} size={32}>{t({ ja: "重要 → リンク → 重要", en: "important → link → important" })}</Label>
          </Card>
        </Abs>
      </Appear>
      <Svg>
        <Packet x1={625} y1={345} x2={805} y2={485} start={cues[3] + 12} dur={34} color={colors.coral} label={t({ ja: "重み", en: "rank" })} />
      </Svg>
    </SceneShell>
  );
}

export function RandomSurferScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "ランダムサーファー", en: "Random surfer" }} title={{ ja: "リンクをたどり、ときどきジャンプする", en: "Follow links, sometimes jump" }}>
      <WebGraph active={4} />
      <Svg>
        <Packet x1={288} y1={362} x2={487} y2={308} start={cues[0] + 8} dur={28} color={colors.coral} label={t({ ja: "リンク", en: "link" })} />
        <Arrow x1={537} y1={815} x2={1218} y2={820} p={progress(frame, cues[1] + 2, 26)} color={colors.amber} width={5} dashed bend={-115} />
        <Packet x1={537} y1={815} x2={1218} y2={820} start={cues[1] + 8} dur={34} color={colors.amber} label={t({ ja: "15%", en: "15%" })} />
        <Arrow x1={1143} y1={394} x2={282} y2={381} p={progress(frame, cues[2] + 2, 34)} color={colors.teal} width={6} dashed bend={-80} />
        <Packet x1={1143} y1={394} x2={282} y2={381} start={cues[2] + 10} dur={42} color={colors.teal} label={t({ ja: "必ずジャンプ", en: "always jump" })} />
      </Svg>
      <Appear at={cues[1]}>
        <Abs x={1300} y={270} w={460}>
          <Card style={{ padding: 30 }}>
            <Label mono size={36}>{t({ ja: "d = 0.85", en: "d = 0.85" })}</Label>
            <div style={{ marginTop: 18 }}>
              <Label size={27}>{t({ ja: "85% リンク / 15% ジャンプ", en: "85% links / 15% jumps" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[2]}>
        <Abs x={1300} y={480} w={470}>
          <Card tone="dark" style={{ padding: 30 }}>
            <div style={{ display: "grid", gap: 16 }}>
              <Chip tone="amber" size={25}>{t({ ja: "ダングリング", en: "dangling" })}</Chip>
              <Label color={colors.onDark} size={28}>{t({ ja: "リンクなし → 必ずジャンプ", en: "no links → always jump" })}</Label>
              <Label color={colors.onDarkSoft} size={25}>{t({ ja: "吸収状態にも閉じ込められない", en: "absorbing clusters cannot trap it" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
    </SceneShell>
  );
}

export function PowerIterationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const iter = Math.floor(progress(frame, cues[1], 120) * 50);
  const values = powerSteps[iter];
  return (
    <SceneShell kicker={{ ja: "べき乗法", en: "Power iteration" }} title={{ ja: "スコアを反復して定常分布へ", en: "Iterate scores to stationarity" }}>
      <Abs x={160} y={285} w={680} h={525}>
        <Card tone="white" style={{ height: "100%", padding: 32 }}>
          <Chip tone="coral" size={26}>{t({ ja: "PageRankベクトル", en: "PageRank vector" })}</Chip>
          <Svg>
            {values.map((v, i) => (
              <Bar key={i} x={40} y={120 + i * 58} w={560} h={40} value={v * 2.1} color={i === 2 ? colors.coral : colors.teal} label={`P${i + 1}`} number={v.toFixed(2)} />
            ))}
          </Svg>
        </Card>
      </Abs>
      <Appear at={cues[0]}>
        <Abs x={925} y={285} w={390}>
          <Card style={{ padding: 30 }}>
            <Label mono size={38}>{t({ ja: "r = rM", en: "r = rM" })}</Label>
            <div style={{ marginTop: 18 }}>
              <Label size={27}>{t({ ja: "ダンピング付き定常分布", en: "damped stationary distribution" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[1]}>
        <Abs x={1380} y={278} w={330}>
          <Card tone="dark" style={{ padding: 30, textAlign: "center" }}>
            <Label color={colors.onDarkSoft} size={25}>{t({ ja: "反復", en: "iteration" })}</Label>
            <div style={{ fontFamily: fonts.mono, fontSize: 72, fontWeight: 900, color: colors.onDark }}>{iter}</div>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[2]}>
        <Abs x={925} y={510} w={785}>
          <Card style={{ padding: 30 }}>
            <Label size={31}>{t({ ja: "ペロン–フロベニウス: 定常分布は一意", en: "Perron–Frobenius: a unique stationary distribution" })}</Label>
          </Card>
        </Abs>
      </Appear>
      <Appear at={cues[3]}>
        <Abs x={925} y={650} w={785}>
          <Card tone="white" accent={colors.amber} style={{ padding: 30 }}>
            <Label mono size={32}>{t({ ja: "誤差は1ステップごとに 0.85 倍以下", en: "error bound × 0.85 each step" })}</Label>
            <div style={{ marginTop: 18 }}>
              <Label mono size={34} color={colors.coralDeep}>{t({ ja: "50回 → 約2.96×10^-4倍", en: "50× → about 2.96×10^-4" })}</Label>
            </div>
          </Card>
        </Abs>
      </Appear>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <EndCard slug="random-walk" headline={{ ja: "一本の線から、世界の構造へ", en: "From a line to the structure of the world" }}>
      <div style={{ marginTop: 46, display: "flex", gap: 18, opacity: progress(frame, 22, 24) }}>
        {[
          { ja: "1次元デモ", en: "1D demo" },
          { ja: "グラフデモ", en: "graph demo" },
          { ja: "PageRankデモ", en: "PageRank demo" },
        ].map((label) => (
          <Chip key={label.en} tone="teal" size={28}>
            {t(label)}
          </Chip>
        ))}
      </div>
    </EndCard>
  );
}
