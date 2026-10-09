import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { lerp, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Tone = "coral" | "teal" | "amber" | "muted" | "dark" | "error";
type NodeId = "a1" | "a2" | "a3" | "a4" | "b1" | "b2" | "b3" | "b4" | "c1" | "c2" | "c3" | "c4";
type Community = "A" | "B" | "C";
type NodeData = { id: NodeId; label: string; c: Community; x: number; y: number };
type EdgeData = [NodeId, NodeId];

const tone: Record<Tone, { bg: string; fg: string; stroke: string }> = {
  coral: { bg: colors.coralSoft, fg: colors.coralDeep, stroke: colors.coral },
  teal: { bg: colors.tealSoft, fg: colors.tealDeep, stroke: colors.teal },
  amber: { bg: colors.amberSoft, fg: "#9a6420", stroke: colors.amber },
  muted: { bg: colors.surfaceCard, fg: colors.body, stroke: colors.hairlineStrong },
  dark: { bg: colors.dark, fg: colors.onDark, stroke: colors.darkElevated },
  error: { bg: colors.errorSoft, fg: colors.error, stroke: colors.error },
};
const communityTone: Record<Community, Tone> = { A: "coral", B: "teal", C: "amber" };

const NODES: NodeData[] = [
  { id: "a1", label: "A1", c: "A", x: 300, y: 360 },
  { id: "a2", label: "A2", c: "A", x: 535, y: 330 },
  { id: "a3", label: "A3", c: "A", x: 385, y: 620 },
  { id: "a4", label: "A4", c: "A", x: 620, y: 660 },
  { id: "b1", label: "B1", c: "B", x: 830, y: 640 },
  { id: "b2", label: "B2", c: "B", x: 965, y: 360 },
  { id: "b3", label: "B3", c: "B", x: 1120, y: 590 },
  { id: "b4", label: "B4", c: "B", x: 1140, y: 785 },
  { id: "c1", label: "C1", c: "C", x: 1350, y: 760 },
  { id: "c2", label: "C2", c: "C", x: 1460, y: 430 },
  { id: "c3", label: "C3", c: "C", x: 1670, y: 370 },
  { id: "c4", label: "C4", c: "C", x: 1600, y: 690 },
];
const EDGES: EdgeData[] = [
  ["a1", "a2"], ["a1", "a3"], ["a1", "a4"], ["a2", "a3"], ["a2", "a4"], ["a3", "a4"],
  ["b1", "b2"], ["b1", "b3"], ["b1", "b4"], ["b2", "b3"], ["b2", "b4"], ["b3", "b4"],
  ["c1", "c2"], ["c1", "c3"], ["c1", "c4"], ["c2", "c3"], ["c2", "c4"], ["c3", "c4"],
  ["a4", "b1"], ["b4", "c1"],
];
const node = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<NodeId, NodeData>;
const degrees = Object.fromEntries(NODES.map((n) => [n.id, 0])) as Record<NodeId, number>;
for (const [a, b] of EDGES) {
  degrees[a] += 1;
  degrees[b] += 1;
}
const GROUPS: NodeId[][] = [["a1", "a2", "a3", "a4"], ["b1", "b2", "b3", "b4"], ["c1", "c2", "c3", "c4"]];
const MERGED: NodeId[][] = [["a1", "a2", "a3", "a4"], ["b1", "b2", "b3", "b4", "c1", "c2", "c3", "c4"]];

function modularity(groups: NodeId[][]): number {
  const m = EDGES.length;
  return groups.reduce((sum, group) => {
    const set = new Set(group);
    const internal = EDGES.filter(([a, b]) => set.has(a) && set.has(b)).length;
    const degreeSum = group.reduce((acc, id) => acc + degrees[id], 0);
    return sum + internal / m - (degreeSum / (2 * m)) ** 2;
  }, 0);
}
const qThree = modularity(GROUPS);
const qMerged = modularity(MERGED);

function ts(lang: "ja" | "en"): CSSProperties {
  return { wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal", textWrap: "balance" as never };
}
function NodeCircle({ n, r = 52, active = false, muted = false, label }: { n: NodeData; r?: number; active?: boolean; muted?: boolean; label?: string }) {
  const c = tone[muted ? "muted" : communityTone[n.c]];
  return (
    <g transform={`translate(${n.x} ${n.y})`}>
      {active && <circle r={r + 13} fill={c.stroke} opacity={0.18} />}
      <circle r={r} fill={c.bg} stroke={active ? colors.coralDeep : c.stroke} strokeWidth={active ? 7 : 4} />
      <text textAnchor="middle" y={9} fontFamily={fonts.mono} fontSize={28} fontWeight={850} fill={c.fg}>
        {label ?? n.label}
      </text>
    </g>
  );
}
function Edge({ e, color, width = 4, opacity = 1, dashed = false }: { e: EdgeData; color?: string; width?: number; opacity?: number; dashed?: boolean }) {
  const a = node[e[0]];
  const b = node[e[1]];
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color ?? colors.hairlineStrong} strokeWidth={width} strokeLinecap="round" opacity={opacity} strokeDasharray={dashed ? "14 14" : undefined} />;
}
function Hull({ c, label, opacity = 1 }: { c: Community; label?: string; opacity?: number }) {
  const ns = NODES.filter((n) => n.c === c);
  const minX = Math.min(...ns.map((n) => n.x)) - 92;
  const minY = Math.min(...ns.map((n) => n.y)) - 92;
  const maxX = Math.max(...ns.map((n) => n.x)) + 92;
  const maxY = Math.max(...ns.map((n) => n.y)) + 92;
  const ctm = tone[communityTone[c]];
  return (
    <g opacity={opacity}>
      <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} rx={44} fill={ctm.bg} stroke={ctm.stroke} strokeWidth={4} opacity={0.58} />
      {label && <text x={minX + 28} y={minY + 44} fontFamily={fonts.sans} fontSize={28} fontWeight={800} fill={ctm.fg}>{label}</text>}
    </g>
  );
}
function ExampleGraph({ activeBridge = false, hulls = true, scale = 1, dx = 0, dy = 0 }: { activeBridge?: boolean; hulls?: boolean; scale?: number; dx?: number; dy?: number }) {
  return (
    <g transform={`translate(${dx} ${dy}) scale(${scale})`}>
      {hulls && <><Hull c="A" label="A" /><Hull c="B" label="B" /><Hull c="C" label="C" /></>}
      {EDGES.map((e) => {
        const bridge = node[e[0]].c !== node[e[1]].c;
        return <Edge key={e.join("-")} e={e} color={bridge ? colors.coral : colors.hairlineStrong} width={bridge ? (activeBridge ? 9 : 5) : 4} opacity={bridge ? 0.95 : 0.88} dashed={bridge && !activeBridge} />;
      })}
      {NODES.map((n) => <NodeCircle key={n.id} n={n} active={activeBridge && ["a4", "b1", "b4", "c1"].includes(n.id)} />)}
    </g>
  );
}
function BigStat({ value, label, toneName = "coral" }: { value: ReactNode; label: ReactNode; toneName?: Tone }) {
  const c = tone[toneName];
  return (
    <Card tone="white" accent={c.stroke} style={{ padding: "20px 24px", minWidth: 220, textAlign: "center" }}>
      <div style={{ fontFamily: fonts.serif, fontSize: 52, color: c.fg, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 23, fontWeight: 700, color: colors.muted }}>{label}</div>
    </Card>
  );
}
function Bar({ label, value, p, toneName, text }: { label: string; value: number; p: number; toneName: Tone; text: string }) {
  const c = tone[toneName];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 25, fontWeight: 750, color: colors.body }}>
        <span>{label}</span>
        <span style={{ fontFamily: fonts.mono }}>{text}</span>
      </div>
      <div style={{ marginTop: 10, height: 34, borderRadius: 999, background: colors.surfaceCard, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(value * 100 * p)}%`, height: "100%", borderRadius: 999, background: c.stroke }} />
      </div>
    </div>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const clusters = progress(frame, 16, 28);
  const links = progress(frame, 42, 26);
  return (
    <TitleCard
      title={{ ja: "Community Detection\nグラフの仲間探し", en: "Community Detection\nFinding Hidden Groups" }}
      subtitle={{ ja: "密な内部、疎な外部 — でも正解はひとつではない", en: "Dense inside, sparse outside — yet no single right answer" }}
      art={
        <>
          <Abs x={1130} y={178} w={670} h={690}>
            <Card tone="soft" style={{ width: "100%", height: "100%", borderRadius: 34 }}><span /></Card>
          </Abs>
          <Svg>
            {[
              [1320, 330, colors.coralSoft, colors.coral],
              [1600, 350, colors.tealSoft, colors.teal],
              [1460, 640, colors.amberSoft, colors.amber],
            ].map(([cx, cy, bg, stroke], i) => (
              <circle key={i} cx={cx as number} cy={cy as number} r={150 * clusters} fill={bg as string} stroke={stroke as string} strokeWidth={5} opacity={0.85} />
            ))}
            <Arrow x1={1425} y1={390} x2={1490} y2={560} p={links} color={colors.coral} width={6} dashed />
            <Arrow x1={1530} y1={510} x2={1554} y2={440} p={links} color={colors.coral} width={6} dashed />
            {[
              [1275, 290, "A"], [1365, 330, "A"], [1288, 405, "A"], [1396, 455, "A"],
              [1560, 285, "B"], [1660, 335, "B"], [1570, 430, "B"], [1680, 468, "B"],
              [1396, 590, "C"], [1510, 590, "C"], [1438, 720, "C"], [1564, 720, "C"],
            ].map(([x, y, l], i) => (
              <g key={i} opacity={progress(frame, 24 + i * 2, 14)}>
                <circle cx={x as number} cy={y as number} r={34} fill="#fff" stroke={colors.hairlineStrong} strokeWidth={4} />
                <text x={x as number} y={(y as number) + 9} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={800} fill={colors.body}>{l}</text>
              </g>
            ))}
          </Svg>
        </>
      }
    />
  );
}

export function WhatScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const showExamples = progress(frame, cues[1] - 4, 18);
  const showGoal = progress(frame, cues[2] - 4, 18);
  return (
    <SceneShell kicker={{ ja: "定義", en: "Definition" }} title={{ ja: "コミュニティとは何か", en: "What is a community?" }}>
      <Abs x={1260} y={150} w={510} h={78} style={{ opacity: showExamples }}>
        <Card tone="white" style={{ padding: "16px 24px", display: "flex", gap: 16, justifyContent: "center" }}>
          <Chip tone="coral" size={24}>SNS</Chip><Chip tone="teal" size={24}>Web</Chip><Chip tone="amber" size={24}>{t({ ja: "タンパク質", en: "protein" })}</Chip>
        </Card>
      </Abs>
      <Svg><ExampleGraph activeBridge={showGoal > 0.4} /></Svg>
      <Abs x={170} y={800} w={620} style={{ display: "flex", justifyContent: "flex-start", gap: 26, opacity: showGoal }}>
        <Chip tone="teal" size={30}>{t({ ja: "内部の辺が密", en: "dense inside" })}</Chip>
        <Chip tone="coral" size={30}>{t({ ja: "外部との辺が疎", en: "sparse outside" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function HistoryScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const milestones = [
    ["1970", "KL", "amber"], ["2002", "GN", "coral"], ["2004", "Q", "teal"], ["2008", "Louvain", "coral"], ["2019", "Leiden", "teal"],
  ] as const;
  return (
    <SceneShell kicker={{ ja: "歴史", en: "History" }} title={{ ja: "分割問題から独自分野へ", en: "From partitioning to its own field" }}>
      <Svg><Arrow x1={170} y1={500} x2={1740} y2={500} p={progress(frame, cues[0] + 6, 30)} color={colors.hairlineStrong} width={5} head /></Svg>
      {milestones.map((m, i) => {
        const x = 210 + i * 370;
        const p = progress(frame, cues[0] + 18 + i * 8, 16);
        return (
          <Abs key={m[0]} x={x - 84} y={384} w={168} style={{ opacity: p, transform: `translateY(${(1 - p) * 20}px)`, textAlign: "center" }}>
            <Card tone="white" accent={tone[m[2]].stroke} style={{ padding: "18px 12px" }}>
              <div style={{ fontFamily: fonts.serif, fontSize: 42, color: tone[m[2]].fg }}>{m[0]}</div>
              <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 750, color: colors.body }}>{m[1]}</div>
            </Card>
          </Abs>
        );
      })}
      <HistoryCard x={140} y={650} show={progress(frame, cues[1] - 8, 18)} chip={{ ja: "グラフ分割", en: "Graph partitioning" }} body={{ ja: "均等な2分割で、カット辺を最小化", en: "Two balanced halves, minimize cut edges" }} lang={lang} toneName="amber" />
      <HistoryCard x={1020} y={650} show={progress(frame, cues[2] - 8, 18)} chip={{ ja: "Community Detection", en: "Community detection" }} body={{ ja: "分割数もサイズも、アルゴリズムが見つける", en: "The algorithm discovers count and sizes" }} lang={lang} toneName="coral" />
    </SceneShell>
  );
}
function HistoryCard({ x, y, show, chip, body, lang, toneName }: { x: number; y: number; show: number; chip: Bilingual; body: Bilingual; lang: "ja" | "en"; toneName: Tone }) {
  const t = useT();
  return (
    <Abs x={x} y={y} w={760} h={210} style={{ opacity: show }}>
      <Card tone="soft" style={{ width: "100%", height: "100%", padding: 26 }}>
        <Chip tone={toneName === "dark" ? "ink" : toneName} size={26}>{t(chip)}</Chip>
        <div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 30, fontWeight: 700, color: colors.body, ...ts(lang) }}>{t(body)}</div>
      </Card>
    </Abs>
  );
}

export function GirvanScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "Girvan–Newman", en: "Girvan–Newman" }} title={{ ja: "橋を見つけて取り除く", en: "Find the bridges and remove them" }}>
      <Svg>
        <ExampleGraph activeBridge={frame >= cues[1]} />
        {frame >= cues[2] && <>
          <Packet x1={300} y1={360} x2={830} y2={640} start={cues[2]} dur={32} label={t({ ja: "最短路", en: "path" })} />
          <Packet x1={535} y1={330} x2={1350} y2={760} start={cues[2] + 12} dur={48} label={t({ ja: "最短路", en: "path" })} color={colors.amber} />
          <Packet x1={385} y1={620} x2={1600} y2={690} start={cues[2] + 28} dur={58} label={t({ ja: "最短路", en: "path" })} color={colors.teal} />
        </>}
        {frame > cues[3] - 2 && <>
          <line x1={672} y1={655} x2={779} y2={645} stroke={colors.canvas} strokeWidth={18} />
          <line x1={672} y1={655} x2={779} y2={645} stroke={colors.error} strokeWidth={8} strokeDasharray="18 14" opacity={0.85} />
        </>}
      </Svg>
      <Abs x={1220} y={220} style={{ opacity: progress(frame, cues[1] - 4, 16) * (1 - progress(frame, cues[3] - 12, 10)) }}><Chip tone="coral" size={28}>{t({ ja: "コミュニティ間の橋", en: "bridge between groups" })}</Chip></Abs>
      <Abs x={1252} y={188} w={548} h={56} style={{ opacity: progress(frame, cues[3] - 8, 18) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: "0 14px", display: "flex", alignItems: "center", gap: 12, borderRadius: 999 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 900, color: colors.onDark, whiteSpace: "nowrap" }}>O(m²n)</div>
          <div style={{ fontFamily: fonts.sans, fontSize: 22, fontWeight: 700, color: colors.onDarkSoft, whiteSpace: "nowrap" }}>{t({ ja: "m=辺数・n=ノード数・再計算", en: "m=edges · n=nodes · recompute" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function ModularityScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "Modularity Q", en: "Modularity Q" }} title={{ ja: "実際の密度を、ランダムと比べる", en: "Compare actual density with random" }}>
      <Abs x={105} y={210} w={970} h={650}><Card tone="soft" style={{ width: "100%", height: "100%" }}><span /></Card></Abs>
      <Svg>
        <ExampleGraph dx={-20} dy={65} scale={0.62} />
      </Svg>
      <Abs x={155} y={662} w={880} h={160} style={{ opacity: progress(frame, cues[2] + 10, 18) }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 24, display: "flex", alignItems: "center", gap: 24 }}>
          <Chip tone="amber" size={25}>{t({ ja: "配置モデル", en: "Configuration model" })}</Chip>
          <div style={{ flex: 1, height: 54, display: "flex", alignItems: "center", gap: 8 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} style={{ width: 30, height: 12 + (i % 4) * 8, borderRadius: 999, background: i % 2 ? colors.amber : colors.teal, opacity: 0.7 }} />
            ))}
            <span style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.muted }}>→</span>
            <Chip tone="muted" size={22}>{t({ ja: "次数列を保存", en: "preserve degrees" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={1120} y={230} w={650} h={630}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 46, color: colors.ink }}>{t({ ja: "Q = 実際 − 期待", en: "Q = actual − expected" })}</div>
          <div style={{ marginTop: 34, display: "grid", gap: 28 }}>
            <Bar label={t({ ja: "実際の内部辺", en: "actual inside" })} value={18 / 20} p={progress(frame, cues[2] - 8, 18)} toneName="teal" text="18 / 20" />
            <Bar label={t({ ja: "ランダム期待", en: "random expected" })} value={0.334} p={progress(frame, cues[3] - 8, 18)} toneName="amber" text="0.334" />
          </div>
          <div style={{ marginTop: 40, display: "flex", gap: 22, alignItems: "center", opacity: progress(frame, cues[2] + 18, 20) }}>
            <BigStat value={`Q=${qThree.toFixed(3)}`} label={t({ ja: "3コミュニティ", en: "3 groups" })} toneName="coral" />
            <BigStat value={qMerged.toFixed(3)} label={t({ ja: "1つ統合", en: "one merge" })} toneName="muted" />
          </div>
          <div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 24, color: colors.muted, lineHeight: 1.35, ...ts(lang), opacity: progress(frame, cues[3] - 8, 18) }}>{t({ ja: "値はこの固定グラフからコードで計算しています。", en: "Values are computed in code from this fixed graph." })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function LouvainScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  const move = progress(frame, cues[1], 38);
  const aggregate = progress(frame, cues[2] - 6, 32);
  const flaw = progress(frame, cues[3] - 8, 18);
  const stepsOut = progress(frame, cues[3] - 12, 12);
  const panel = { x: 110, y: 220, w: 1130, h: 650 };
  const p = (x: number, y: number) => ({ x: panel.x + x, y: panel.y + y });
  const localNodes = [
    { id: "A1", x: 180, y: 160, group: "A" as Community },
    { id: "A2", x: 350, y: 140, group: "A" as Community },
    { id: "A3", x: 230, y: 345, group: "A" as Community },
    { id: "A4", x: lerp(390, 500, move), y: lerp(355, 470, move), group: move > 0.62 ? ("B" as Community) : ("A" as Community), hot: true },
    { id: "B1", x: 585, y: 360, group: "B" as Community },
    { id: "B2", x: 670, y: 160, group: "B" as Community },
    { id: "B3", x: 825, y: 305, group: "B" as Community },
    { id: "B4", x: 770, y: 495, group: "B" as Community },
    { id: "C1", x: 925, y: 500, group: "C" as Community },
    { id: "C2", x: 905, y: 185, group: "C" as Community },
    { id: "C3", x: 1050, y: 155, group: "C" as Community },
    { id: "C4", x: 1040, y: 405, group: "C" as Community },
  ];
  const localEdges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
    [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7],
    [8, 9], [8, 10], [8, 11], [9, 10], [9, 11], [10, 11],
    [3, 4], [7, 8],
  ];
  const superNodes = [
    { id: "A", x: panel.x + 310, y: panel.y + 330, r: 92, group: "A" as Community, loop: "6" },
    { id: "B", x: panel.x + 595, y: panel.y + 330, r: 105, group: "B" as Community, loop: "6" },
    { id: "C", x: panel.x + 900, y: panel.y + 330, r: 92, group: "C" as Community, loop: "6" },
  ];
  return (
    <SceneShell kicker={{ ja: "Louvain", en: "Louvain" }} title={{ ja: "局所移動して、集約する", en: "Move locally, then aggregate" }}>
      <Abs x={panel.x} y={panel.y} w={panel.w} h={panel.h}><Card tone="soft" style={{ width: "100%", height: "100%" }}><span /></Card></Abs>
      <Svg>
        <g opacity={(1 - aggregate) * (1 - flaw)}>
          {(["A", "B", "C"] as Community[]).map((group) => {
            const ns = localNodes.filter((n) => n.group === group || (n.id === "A4" && group === "A" && move < 0.62));
            const minX = Math.min(...ns.map((n) => p(n.x, n.y).x)) - 72;
            const minY = Math.min(...ns.map((n) => p(n.x, n.y).y)) - 72;
            const maxX = Math.max(...ns.map((n) => p(n.x, n.y).x)) + 72;
            const maxY = Math.max(...ns.map((n) => p(n.x, n.y).y)) + 72;
            const c = tone[communityTone[group]];
            return <rect key={group} x={minX} y={minY} width={maxX - minX} height={maxY - minY} rx={36} fill={c.bg} stroke={c.stroke} strokeWidth={4} opacity={0.38} />;
          })}
          {localEdges.map(([a, b]) => {
            const na = localNodes[a];
            const nb = localNodes[b];
            const pa = p(na.x, na.y);
            const pb = p(nb.x, nb.y);
            const crossing = na.group !== nb.group;
            return <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={crossing ? colors.coral : colors.hairlineStrong} strokeWidth={crossing ? 6 : 4} opacity={crossing ? 0.9 : 0.75} strokeDasharray={crossing ? "12 12" : undefined} />;
          })}
          {localNodes.map((n) => {
            const c = tone[communityTone[n.group]];
            const pt = p(n.x, n.y);
            return (
              <g key={n.id} transform={`translate(${pt.x} ${pt.y})`}>
                {n.hot && <circle r={62} fill={colors.coral} opacity={0.18 * move} />}
                <circle r={46} fill={c.bg} stroke={n.hot ? colors.coralDeep : c.stroke} strokeWidth={n.hot ? 6 : 4} />
                <text y={9} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fontWeight={850} fill={c.fg}>{n.id}</text>
              </g>
            );
          })}
          <g opacity={move}>
            <rect x={panel.x + 390} y={panel.y + 525} width={176} height={50} rx={25} fill={colors.coralSoft} stroke={colors.coral} strokeWidth={3} />
            <text x={panel.x + 478} y={panel.y + 559} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fontWeight={800} fill={colors.coralDeep}>ΔQ = +0.04</text>
          </g>
        </g>
        <g opacity={aggregate * (1 - flaw)}>
          <line x1={superNodes[0].x + 92} y1={superNodes[0].y} x2={superNodes[1].x - 105} y2={superNodes[1].y} stroke={colors.coral} strokeWidth={8} strokeLinecap="round" opacity={0.8} />
          <line x1={superNodes[1].x + 105} y1={superNodes[1].y} x2={superNodes[2].x - 92} y2={superNodes[2].y} stroke={colors.coral} strokeWidth={12} strokeLinecap="round" opacity={0.8} />
          {superNodes.map((s) => {
            const c = tone[communityTone[s.group]];
            return (
              <g key={s.id}>
                <path d={`M ${s.x - 58} ${s.y - s.r + 8} C ${s.x - 145} ${s.y - 190}, ${s.x + 145} ${s.y - 190}, ${s.x + 58} ${s.y - s.r + 8}`} fill="none" stroke={c.stroke} strokeWidth={7} strokeLinecap="round" />
                <rect x={s.x - 42} y={s.y - 196} width={84} height={42} rx={21} fill="#fff" stroke={c.stroke} strokeWidth={3} />
                <text x={s.x} y={s.y - 168} textAnchor="middle" fontFamily={fonts.mono} fontSize={25} fontWeight={800} fill={c.fg}>{s.loop}</text>
                <circle cx={s.x} cy={s.y} r={s.r} fill={c.bg} stroke={c.stroke} strokeWidth={6} />
                <text x={s.x} y={s.y + 15} textAnchor="middle" fontFamily={fonts.mono} fontSize={52} fontWeight={900} fill={c.fg}>{s.id}</text>
              </g>
            );
          })}
          <text x={panel.x + 455} y={panel.y + 356} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fontWeight={800} fill={colors.coralDeep}>1</text>
          <text x={panel.x + 750} y={panel.y + 356} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fontWeight={800} fill={colors.coralDeep}>2</text>
        </g>
        <g opacity={flaw}>
          <rect x={panel.x + 135} y={panel.y + 165} width={330} height={330} rx={42} fill={colors.errorSoft} stroke={colors.error} strokeWidth={5} strokeDasharray="16 12" />
          <rect x={panel.x + 635} y={panel.y + 165} width={330} height={330} rx={42} fill={colors.errorSoft} stroke={colors.error} strokeWidth={5} strokeDasharray="16 12" />
          {[[245, 260, 355, 260], [245, 260, 300, 390], [355, 260, 300, 390], [745, 260, 855, 260], [745, 260, 800, 390], [855, 260, 800, 390], [355, 260, 550, 330], [550, 330, 745, 260]].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={panel.x + x1} y1={panel.y + y1} x2={panel.x + x2} y2={panel.y + y2} stroke={i >= 6 ? colors.teal : colors.error} strokeWidth={i >= 6 ? 6 : 5} strokeLinecap="round" opacity={i >= 6 ? 0.9 : 0.72} />
          ))}
          {[[245, 260], [355, 260], [300, 390], [745, 260], [855, 260], [800, 390]].map(([x, y], i) => (
            <g key={i} transform={`translate(${panel.x + x} ${panel.y + y})`}>
              <circle r={42} fill={colors.errorSoft} stroke={colors.error} strokeWidth={5} />
              <text y={9} textAnchor="middle" fontFamily={fonts.mono} fontSize={28} fontWeight={900} fill={colors.error}>A</text>
            </g>
          ))}
          <g transform={`translate(${panel.x + 550} ${panel.y + 330})`}>
            <circle r={46} fill={colors.tealSoft} stroke={colors.teal} strokeWidth={6} />
            <text y={10} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fontWeight={900} fill={colors.tealDeep}>B</text>
          </g>
          <text x={panel.x + 552} y={panel.y + 555} textAnchor="middle" fontFamily={fonts.sans} fontSize={34} fontWeight={800} fill={colors.error}>{t({ ja: "内部で非連結", en: "disconnected inside" })}</text>
          <text x={panel.x + 552} y={panel.y + 610} textAnchor="middle" fontFamily={fonts.sans} fontSize={28} fontWeight={750} fill={colors.tealDeep}>{t({ ja: "→ Leiden で修正", en: "→ fixed by Leiden" })}</text>
        </g>
      </Svg>
      <Abs x={1305} y={318} w={500} style={{ opacity: 1 - stepsOut }}>
        <Card tone="white" style={{ padding: 34 }}>
          <StepLine active={frame >= cues[1]} label={t({ ja: "1. ΔQが最大の移動", en: "1. best ΔQ move" })} />
          <StepLine active={frame >= cues[2]} label={t({ ja: "2. コミュニティを縮約", en: "2. aggregate groups" })} />
          <StepLine active={frame >= cues[3]} label={t({ ja: "3. 内部構造が隠れる", en: "3. internal structure hidden" })} />
        </Card>
      </Abs>
      <Abs x={1305} y={318} w={500} h={360} style={{ opacity: flaw }}>
        <Card tone="white" accent={colors.error} style={{ width: "100%", height: "100%", padding: 34 }}>
          <Chip tone="error" size={30}>{t({ ja: "欠陥", en: "flaw" })}</Chip>
          <div style={{ marginTop: 34, display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <MiniComponent label="A" />
            <div style={{ width: 52, borderTop: `6px solid ${colors.teal}` }} />
            <div style={{ width: 74, height: 74, borderRadius: 22, background: colors.tealSoft, border: `4px solid ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 30, fontWeight: 900, color: colors.tealDeep }}>B</div>
            <div style={{ width: 52, borderTop: `6px solid ${colors.teal}` }} />
            <MiniComponent label="A" />
          </div>
          <div style={{ marginTop: 28, fontFamily: fonts.sans, fontSize: 30, lineHeight: 1.22, fontWeight: 750, color: colors.body, textAlign: "center", ...ts(lang) }}>{t({ ja: "同じコミュニティなのに、内部パスがない", en: "same community, no internal path" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}
function StepLine({ active, label }: { active: boolean; label: string }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 26, fontFamily: fonts.sans, fontSize: 30, lineHeight: 1.18, fontWeight: 760, color: active ? colors.bodyStrong : colors.mutedSoft }}><span style={{ width: 20, height: 20, borderRadius: 99, background: active ? colors.coral : colors.hairlineStrong, flex: "0 0 auto" }} />{label}</div>;
}
function MiniComponent({ label }: { label: string }) {
  return <div style={{ width: 86, height: 86, borderRadius: 24, background: colors.errorSoft, border: `4px solid ${colors.error}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 32, fontWeight: 900, color: colors.error }}>{label}</div>;
}

export function LeidenLabelScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  const phases = [
    { label: t({ ja: "局所移動", en: "local move" }), at: cues[0], toneName: "coral" as Tone },
    { label: t({ ja: "精錬", en: "refine" }), at: cues[0] + 55, toneName: "teal" as Tone },
    { label: t({ ja: "集約", en: "aggregate" }), at: cues[1] - 10, toneName: "amber" as Tone },
  ];
  return (
    <SceneShell kicker={{ ja: "Leiden と LPA", en: "Leiden and LPA" }} title={{ ja: "つながりを守るか、ラベルを流すか", en: "Keep groups connected, or let labels flow" }}>
      <Abs x={120} y={220} w={800} h={650}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28 }}>
          <Chip tone="teal" size={28}>Leiden 2019</Chip>
          <div style={{ marginTop: 42, display: "grid", gap: 28 }}>{phases.map((p) => <PhaseCard key={p.label} {...p} active={frame >= p.at} />)}</div>
          <div style={{ marginTop: 42, opacity: progress(frame, cues[1] - 8, 18), display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
            <MiniComponent label="✓" /><div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 750, color: colors.tealDeep, ...ts(lang) }}>{t({ ja: "内部連結を保証", en: "internally connected" })}</div>
          </div>
        </Card>
      </Abs>
      <Abs x={1000} y={220} w={800} h={650}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28 }}>
          <Chip tone="coral" size={28}>{t({ ja: "ラベル伝播 2007", en: "Label propagation 2007" })}</Chip>
          <svg width={740} height={420} viewBox="0 0 740 420" style={{ marginTop: 36 }}>
            {[[96, 86, 222, 86], [96, 86, 160, 196], [222, 86, 160, 196], [442, 82, 568, 82], [442, 82, 505, 196], [568, 82, 505, 196], [275, 320, 370, 250], [465, 320, 370, 250], [305, 160, 370, 250], [435, 160, 370, 250]].map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.hairlineStrong} strokeWidth={4} />
            ))}
            {[
              [96, 86, "A", "coral"], [222, 86, "A", "coral"], [160, 196, frame >= cues[2] + 28 ? "A" : "?", frame >= cues[2] + 28 ? "coral" : "amber"],
              [442, 82, "B", "teal"], [568, 82, "B", "teal"], [505, 196, frame >= cues[2] + 42 ? "B" : "?", frame >= cues[2] + 42 ? "teal" : "amber"],
              [275, 320, "A", "coral"], [305, 160, "A", "coral"], [435, 160, "B", "teal"], [465, 320, "B", "teal"],
              [370, 250, frame >= cues[3] + 22 ? "A" : "?", frame >= cues[3] + 22 ? "coral" : "amber"],
            ].map(([x, y, l, tn], i) => {
              const c = tone[tn as Tone];
              return <g key={i}><circle cx={x as number} cy={y as number} r={42} fill={c.bg} stroke={c.stroke} strokeWidth={5} /><text x={x as number} y={(y as number) + 10} textAnchor="middle" fontFamily={fonts.mono} fontSize={30} fontWeight={900} fill={c.fg}>{l}</text></g>;
            })}
            <Packet x1={96} y1={86} x2={160} y2={196} start={cues[2]} dur={30} color={colors.coral} />
            <Packet x1={568} y1={82} x2={505} y2={196} start={cues[2] + 14} dur={30} color={colors.teal} />
            <g opacity={progress(frame, cues[3] - 6, 18)}>
              <rect x={256} y={362} width={248} height={48} rx={24} fill={colors.amberSoft} stroke={colors.amber} strokeWidth={3} />
              <text x={380} y={394} textAnchor="middle" fontFamily={fonts.sans} fontSize={24} fontWeight={800} fill="#9a6420">{t({ ja: "同票 → ランダムに選択", en: "tie → random pick" })}</text>
            </g>
          </svg>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, opacity: progress(frame, cues[3] - 6, 18) }}>
            <Chip tone="amber" size={25}>{t({ ja: "順序依存", en: "order matters" })}</Chip><Chip tone="amber" size={25}>{t({ ja: "同票処理", en: "tie-breaking" })}</Chip><Chip tone="teal" size={25}>O(m)</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}
function PhaseCard({ label, toneName, active }: { label: string; toneName: Tone; active: boolean }) {
  const c = tone[toneName];
  return <div style={{ height: 90, borderRadius: 22, background: active ? c.bg : colors.surfaceCard, border: `4px solid ${active ? c.stroke : colors.hairlineStrong}`, display: "flex", alignItems: "center", padding: "0 28px", fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color: active ? c.fg : colors.mutedSoft }}>{label}</div>;
}

export function OtherMethodsScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  const cards = [
    { title: t({ ja: "Spectral", en: "Spectral" }), body: t({ ja: "ラプラシアンの固有ベクトル", en: "Laplacian eigenvectors" }), tn: "amber" as Tone, icon: "λ" },
    { title: "Infomap", body: t({ ja: "ランダムウォークを圧縮", en: "compress random walks" }), tn: "coral" as Tone, icon: "↻" },
    { title: "SBM", body: t({ ja: "生成モデルを当てはめる", en: "fit a generative model" }), tn: "teal" as Tone, icon: "P(G)" },
    { title: t({ ja: "目的が違う", en: "different goals" }), body: t({ ja: "正解の前提が違う", en: "different assumptions" }), tn: "muted" as Tone, icon: "?" },
  ];
  return (
    <SceneShell kicker={{ ja: "多様な目的関数", en: "Many objectives" }} title={{ ja: "何をコミュニティと呼ぶか", en: "What counts as a community?" }}>
      <Abs x={140} y={220} w={1640} h={650} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {cards.map((c, i) => <MethodCard key={c.title} {...c} at={cues[Math.min(i, cues.length - 1)] - 8} frame={frame} lang={lang} />)}
      </Abs>
    </SceneShell>
  );
}
function MethodCard({ title, body, tn, icon, at, frame, lang }: { title: string; body: string; tn: Tone; icon: string; at: number; frame: number; lang: "ja" | "en" }) {
  const p = progress(frame, at, 20);
  const c = tone[tn];
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
      <Card tone="white" accent={c.stroke} style={{ height: "100%", padding: 34, display: "flex", alignItems: "center", gap: 32 }}>
        <div style={{ width: 126, height: 126, borderRadius: 36, background: c.bg, border: `5px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 46, fontWeight: 800, color: c.fg }}>{icon}</div>
        <div><div style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.ink }}>{title}</div><div style={{ marginTop: 12, fontFamily: fonts.sans, fontSize: 29, fontWeight: 650, color: colors.body, lineHeight: 1.3, ...ts(lang) }}>{body}</div></div>
      </Card>
    </div>
  );
}

function MiniGraph({ x, y, groups, title, active = false }: { x: number; y: number; groups: NodeId[][]; title: Bilingual; active?: boolean }) {
  const t = useT();
  const { lang } = useScene();
  const groupOf = new Map<NodeId, number>();
  groups.forEach((g, i) => g.forEach((id) => groupOf.set(id, i)));
  const palette = [colors.coralSoft, colors.tealSoft, colors.amberSoft, colors.errorSoft];
  const strokes = [colors.coral, colors.teal, colors.amber, colors.error];
  return (
    <Abs x={x} y={y} w={640} h={295}>
      <Card tone="white" accent={active ? colors.coral : colors.hairlineStrong} style={{ width: "100%", height: "100%", padding: 18 }}>
        <div style={{ fontFamily: fonts.sans, fontSize: 24, fontWeight: 750, color: active ? colors.coralDeep : colors.body, ...ts(lang) }}>{t(title)}</div>
        <svg width={604} height={224} viewBox="0 0 604 224" style={{ marginTop: 8 }}>
          {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={miniPt(a)[0]} y1={miniPt(a)[1]} x2={miniPt(b)[0]} y2={miniPt(b)[1]} stroke={groupOf.get(a) === groupOf.get(b) ? colors.hairlineStrong : colors.coral} strokeWidth={3} opacity={0.85} />)}
          {NODES.map((n) => { const gi = groupOf.get(n.id) ?? 0; const [cx, cy] = miniPt(n.id); return <circle key={n.id} cx={cx} cy={cy} r={18} fill={palette[gi % palette.length]} stroke={strokes[gi % strokes.length]} strokeWidth={3} />; })}
        </svg>
      </Card>
    </Abs>
  );
}
function miniPt(id: NodeId): [number, number] {
  const map: Record<NodeId, [number, number]> = {
    a1: [60, 72], a2: [138, 52], a3: [88, 148], a4: [168, 146],
    b1: [242, 146], b2: [290, 62], b3: [366, 128], b4: [366, 196],
    c1: [448, 196], c2: [492, 80], c3: [566, 58], c4: [550, 166],
  };
  return map[id];
}
export function HardnessScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "本質的な難しさ", en: "Fundamental hardness" }} title={{ ja: "同じグラフに、複数の答え", en: "One graph, many answers" }}>
      <MiniGraph x={125} y={215} groups={GROUPS} title={{ ja: "内部密度", en: "density" }} active={frame >= cues[1]} />
      <MiniGraph x={125} y={548} groups={MERGED} title={{ ja: "カット最小", en: "cut view" }} />
      <MiniGraph x={1155} y={215} groups={[["a1", "a2", "b2", "b3"], ["a3", "a4", "b1", "b4", "c1"], ["c2", "c3", "c4"]]} title={{ ja: "ランダムウォーク", en: "random walk" }} />
      <MiniGraph x={1155} y={548} groups={[["a1", "a2", "a3"], ["a4", "b1", "b2", "b3", "b4"], ["c1", "c2", "c3", "c4"]]} title={{ ja: "確率モデル", en: "probabilistic" }} />
      <Abs x={810} y={362} w={300} h={300} style={{ opacity: progress(frame, cues[2] - 8, 18) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 28, textAlign: "center" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 54, color: colors.onDark }}>NP-hard</div>
          <div style={{ marginTop: 24, fontFamily: fonts.sans, fontSize: 25, lineHeight: 1.3, color: colors.onDarkSoft, ...ts(lang) }}>{t({ ja: "Modularity最大化は\n厳密解が現実的でない", en: "Exact modularity maximization\nis not practical" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function LimitsScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  const res = progress(frame, cues[1] - 8, 18);
  const th = progress(frame, cues[2] - 8, 18);
  const sig = progress(frame, cues[3] - 8, 18);
  const noise = progress(frame, cues[4] - 8, 18);
  return (
    <SceneShell kicker={{ ja: "限界", en: "Limits" }} title={{ ja: "小さすぎる、または薄すぎる構造", en: "Too small, or too faint" }}>
      <Abs x={120} y={216} w={800} h={648}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Chip tone="coral" size={27}>{t({ ja: "解像度限界", en: "Resolution limit" })}</Chip>
          <svg width={740} height={420} viewBox="0 0 740 420" style={{ marginTop: 28 }}>
            {(() => {
              const pts = [
                [370, 56], [492, 92], [564, 186], [492, 280],
                [370, 316], [248, 280], [176, 186], [248, 92],
              ];
              const capsules = [[0, 1], [2, 3], [4, 5], [6, 7]];
              return (
                <>
                  {pts.map(([x, y], i) => {
                    const [x2, y2] = pts[(i + 1) % pts.length];
                    return <line key={`e${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke={colors.hairlineStrong} strokeWidth={4} />;
                  })}
                  {capsules.map(([a, b], i) => {
                    const [x1, y1] = pts[a];
                    const [x2, y2] = pts[b];
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    const d = Math.hypot(x2 - x1, y2 - y1);
                    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
                    return (
                      <g key={i} transform={`translate(${mx} ${my}) rotate(${angle})`} opacity={res}>
                        <rect x={-d / 2 - 40} y={-40} width={d + 80} height={80} rx={40} fill="none" stroke={colors.coral} strokeWidth={6} strokeDasharray="16 12" />
                      </g>
                    );
                  })}
                  {pts.map(([x, y], i) => (
                    <g key={`k${i}`}>
                      <circle cx={x} cy={y} r={28} fill={colors.tealSoft} stroke={colors.teal} strokeWidth={5} />
                      <text x={x} y={y + 8} textAnchor="middle" fontFamily={fonts.mono} fontSize={22} fontWeight={900} fill={colors.tealDeep}>K{i + 1}</text>
                    </g>
                  ))}
                  <g opacity={res}>
                    <rect x={138} y={372} width={464} height={30} rx={15} fill={colors.coralSoft} />
                    <text x="370" y="394" textAnchor="middle" fontFamily={fonts.sans} fontSize="22" fontWeight="800" fill={colors.coralDeep}>{t({ ja: "明確な小コミュニティも統合", en: "even clear small communities get merged" })}</text>
                  </g>
                </>
              );
            })()}
          </svg>
          <div style={{ fontFamily: fonts.sans, fontSize: 25, color: colors.body, lineHeight: 1.35, ...ts(lang), opacity: res }}>{t({ ja: "基準は周囲のグラフ構造に依存します。", en: "The behavior depends on the surrounding graph." })}</div>
        </Card>
      </Abs>
      <Abs x={1000} y={216} w={800} h={648}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Chip tone="teal" size={27}>{t({ ja: "検出限界", en: "Detectability threshold" })}</Chip>
          <div style={{ marginTop: 34, fontFamily: fonts.mono, fontSize: 39, color: colors.ink, opacity: th }}>
            (c<span style={{ fontSize: 24 }}>in</span> − c<span style={{ fontSize: 24 }}>out</span>)² &lt; 2(c<span style={{ fontSize: 24 }}>in</span> + c<span style={{ fontSize: 24 }}>out</span>)
          </div>
          <div style={{ marginTop: 28, display: "flex", gap: 18, opacity: th }}>
            <Chip tone="teal" size={24}>{t({ ja: "c_in = n·p_in（群内）", en: "c_in = n·p_in (within)" })}</Chip>
            <Chip tone="amber" size={24}>{t({ ja: "c_out = n·p_out（群間）", en: "c_out = n·p_out (between)" })}</Chip>
          </div>
          <div style={{ marginTop: 62 }}>
            <Bar label={t({ ja: "シグナル = 差の二乗", en: "signal = squared gap" })} value={0.42} p={sig} toneName="teal" text="(c_in−c_out)²" />
            <div style={{ height: 34 }} />
            <Bar label={t({ ja: "ノイズ ∝ 平均次数", en: "noise ∝ average degree" })} value={0.74} p={noise} toneName="coral" text="2(c_in+c_out)" />
          </div>
          <div style={{ marginTop: 42, opacity: noise }}><Chip tone="error" size={29}>{t({ ja: "下回ると、検出不可能", en: "below it: impossible" })}</Chip></div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function PracticeScene() {
  const frame = useCurrentFrame();
  const { cues, lang } = useScene();
  const t = useT();
  const rows = [
    { q: t({ ja: "大きい無向グラフ", en: "large graph, no directions" }), a: "Leiden", tn: "teal" as Tone, at: cues[1] - 4 },
    { q: t({ ja: "向き・フロー構造", en: "directions or flow" }), a: "Infomap", tn: "coral" as Tone, at: cues[1] + 22 },
    { q: t({ ja: "構造の有無を判定", en: "does structure exist?" }), a: "Nested SBM", tn: "amber" as Tone, at: cues[2] - 4 },
    { q: t({ ja: "前提と目的を合わせる", en: "match assumptions to goals" }), a: t({ ja: "使い分け", en: "choose deliberately" }), tn: "dark" as Tone, at: cues[3] - 4 },
  ];
  return (
    <SceneShell kicker={{ ja: "実践", en: "Practice" }} title={{ ja: "完璧ではなく、目的に合う道具を", en: "Choose the tool for the job" }}>
      <Abs x={170} y={222} w={1580} h={640}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }}>
            {rows.map((r, i) => { const p = progress(frame, r.at, 18); const c = tone[r.tn]; return (
              <div key={i} style={{ display: "contents", opacity: p }}>
                <div style={{ height: 122, borderRadius: 22, background: colors.surfaceSoft, border: `3px solid ${colors.hairline}`, display: "flex", alignItems: "center", padding: "0 32px", fontFamily: fonts.sans, fontSize: 32, fontWeight: 750, color: colors.body, ...ts(lang) }}>{r.q}</div>
                <div style={{ height: 122, borderRadius: 22, background: c.bg, border: `4px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 44, fontWeight: 700, color: c.fg, ...ts(lang) }}>{r.a}</div>
              </div>
            ); })}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const p = progress(frame, 24, 22);
  const t = useT();
  return (
    <EndCard slug="community-detection" headline={{ ja: "グラフの仲間探しを、記事でさらに深く", en: "Go deeper in the full article" }}>
      <div style={{ marginTop: 42, display: "flex", gap: 18, opacity: p }}>
        <Chip tone="coral" size={28}>{t({ ja: "インタラクティブデモ", en: "interactive demo" })}</Chip>
        <Chip tone="teal" size={28}>Louvain</Chip>
        <Chip tone="amber" size={28}>{t({ ja: "限界の図解", en: "limits visualized" })}</Chip>
      </div>
      <Abs x={180} y={660} w={1560} h={210} style={{ opacity: p }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", borderRadius: 30 }}>
          <svg width={1560} height={210} viewBox="0 0 1560 210" style={{ display: "block" }}>
            {[[210, 95, "coral"], [330, 70, "coral"], [450, 120, "coral"], [750, 90, "teal"], [890, 130, "teal"], [1040, 82, "teal"], [1230, 128, "amber"], [1360, 80, "amber"]].map(([x, y, tn], i) => (
              <g key={i}>
                {i > 0 && <line x1={x as number} y1={y as number} x2={[[210, 95], [330, 70], [450, 120], [750, 90], [890, 130], [1040, 82], [1230, 128], [1360, 80]][i - 1][0]} y2={[[210, 95], [330, 70], [450, 120], [750, 90], [890, 130], [1040, 82], [1230, 128], [1360, 80]][i - 1][1]} stroke={colors.hairlineStrong} strokeWidth={4} />}
                <circle cx={x as number} cy={y as number} r={42} fill={tone[tn as Tone].bg} stroke={tone[tn as Tone].stroke} strokeWidth={5} />
              </g>
            ))}
          </svg>
        </Card>
      </Abs>
    </EndCard>
  );
}
