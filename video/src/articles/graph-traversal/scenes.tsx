import { useCurrentFrame } from "remotion";
import { progress, window as fadeWindow } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Point = { id: string; x: number; y: number };
type Edge = { a: string; b: string; w?: string; bend?: number };

const GRAPH: Point[] = [
  { id: "A", x: 380, y: 500 },
  { id: "B", x: 650, y: 350 },
  { id: "C", x: 650, y: 650 },
  { id: "D", x: 930, y: 360 },
  { id: "E", x: 930, y: 650 },
  { id: "F", x: 1210, y: 500 },
];

const EDGES: Edge[] = [
  { a: "A", b: "B" },
  { a: "A", b: "C" },
  { a: "B", b: "D" },
  { a: "B", b: "E" },
  { a: "C", b: "E" },
  { a: "D", b: "F" },
  { a: "E", b: "F" },
  { a: "B", b: "C", bend: 80 },
];

const WEIGHTED: Point[] = [
  { id: "S", x: 300, y: 520 },
  { id: "A", x: 600, y: 350 },
  { id: "B", x: 620, y: 690 },
  { id: "C", x: 950, y: 370 },
  { id: "D", x: 980, y: 650 },
  { id: "T", x: 1290, y: 510 },
];

const WEDGES: Edge[] = [
  { a: "S", b: "A", w: "5" },
  { a: "S", b: "B", w: "2" },
  { a: "B", b: "A", w: "1" },
  { a: "A", b: "C", w: "2" },
  { a: "B", b: "D", w: "4" },
  { a: "C", b: "T", w: "4" },
  { a: "D", b: "T", w: "1" },
  { a: "C", b: "D", w: "1" },
];

function node(points: Point[], id: string) {
  const p = points.find((v) => v.id === id);
  if (!p) throw new Error(`Unknown node ${id}`);
  return p;
}

function GraphNode({
  p,
  tone = "white",
  label,
  scale = 1,
  ring = false,
  sub,
}: {
  p: Point;
  tone?: "white" | "active" | "done" | "wait" | "error" | "dark";
  label?: string;
  scale?: number;
  ring?: boolean;
  sub?: string;
}) {
  const bg =
    tone === "active"
      ? colors.coral
      : tone === "done"
        ? colors.teal
        : tone === "wait"
          ? colors.amber
          : tone === "error"
            ? colors.error
            : tone === "dark"
              ? colors.dark
              : "#ffffff";
  const fg = tone === "white" || tone === "wait" ? colors.ink : colors.onDark;
  const border = ring ? colors.coral : tone === "white" ? colors.hairlineStrong : bg;
  const size = 100 * scale;
  return (
    <Abs x={p.x - size / 2} y={p.y - size / 2} w={size} h={size}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          background: bg,
          border: `5px solid ${border}`,
          boxShadow: ring ? "0 0 0 12px rgba(204,120,92,0.16)" : "0 14px 26px rgba(20,20,19,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: fg,
          fontFamily: fonts.mono,
          fontWeight: 800,
          fontSize: 36 * scale,
        }}
      >
        {label ?? p.id}
        {sub && <span style={{ marginTop: 3, fontSize: 24 * scale, fontWeight: 700 }}>{sub}</span>}
      </div>
    </Abs>
  );
}

function Edges({
  points,
  edges,
  hot = () => 0,
  faded = false,
  weights = false,
}: {
  points: Point[];
  edges: Edge[];
  hot?: (e: Edge, i: number) => number;
  faded?: boolean;
  weights?: boolean;
}) {
  return (
    <Svg>
      {edges.map((e, i) => {
        const a = node(points, e.a);
        const b = node(points, e.b);
        const h = hot(e, i);
        const bend = e.bend ?? 0;
        return (
          <g key={`${e.a}-${e.b}-${i}`}>
            <Arrow x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={1} head={false} bend={bend} width={4} color={colors.hairlineStrong} opacity={faded ? 0.45 : 1} />
            {h > 0 && <Arrow x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={h} head={false} bend={bend} width={8} color={colors.coral} />}
            {weights && e.w && (
              <circle cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2 - 12} r={25} fill={colors.surfaceSoft} stroke={colors.hairlineStrong} strokeWidth={3} />
            )}
            {weights && e.w && (
              <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={800} fill={colors.body}>
                {e.w}
              </text>
            )}
          </g>
        );
      })}
    </Svg>
  );
}

function PanelTitle({ children }: { children: string }) {
  return <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: colors.bodyStrong, marginBottom: 18 }}>{children}</div>;
}

function StateList({ title, items, active = -1 }: { title: string; items: string[]; active?: number }) {
  return (
    <Card tone="white" style={{ padding: 28 }}>
      <PanelTitle>{title}</PanelTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((it, i) => (
          <div
            key={`${it}-${i}`}
            style={{
              minHeight: 52,
              padding: "10px 18px",
              borderRadius: 14,
              background: i === active ? colors.coralSoft : colors.surfaceSoft,
              border: `2px solid ${i === active ? colors.coral : colors.hairline}`,
              fontFamily: fonts.mono,
              fontSize: 30,
              fontWeight: 700,
              color: i === active ? colors.coralDeep : colors.body,
              display: "flex",
              alignItems: "center",
            }}
          >
            {it}
          </div>
        ))}
      </div>
    </Card>
  );
}

function phase(frame: number, cues: number[], cuts: number[]) {
  let p = 0;
  cuts.forEach((cut, i) => {
    if (frame >= cues[cut]) p = i + 1;
  });
  return p;
}

/* ------------------------------------------------------------------------ */
/* 0. Title                                                                  */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const nodes = [
    { id: "A", x: 1330, y: 330 },
    { id: "B", x: 1540, y: 250 },
    { id: "C", x: 1570, y: 470 },
    { id: "D", x: 1760, y: 360 },
    { id: "E", x: 1450, y: 680 },
    { id: "F", x: 1710, y: 710 },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [2, 4],
    [4, 5],
    [3, 5],
  ];
  return (
    <TitleCard
      title={{ ja: "グラフ探索を\n発明する", en: "Inventing\nGraph Traversal" }}
      subtitle={{ ja: "BFS・DFS・Dijkstraを、問題の構造から組み立てる", en: "Build BFS, DFS, and Dijkstra from the structure of the problem" }}
      art={
        <>
          <Svg>
            {edges.map(([a, b], i) => (
              <Arrow
                key={i}
                x1={nodes[a].x}
                y1={nodes[a].y}
                x2={nodes[b].x}
                y2={nodes[b].y}
                p={progress(frame, 18 + i * 5, 18)}
                color={i < 3 ? colors.coral : colors.hairlineStrong}
                width={i < 3 ? 7 : 4}
                head={false}
              />
            ))}
          </Svg>
          {nodes.map((n, i) => {
            const tone = i === 0 ? "active" : i < 4 ? "done" : "white";
            return <GraphNode key={n.id} p={n} tone={tone as "active" | "done" | "white"} scale={1.08} ring={i === 0} />;
          })}
          <Abs x={1215} y={790} w={625} style={{ display: "flex", justifyContent: "center", gap: 18, opacity: progress(frame, 54, 20) }}>
            <Chip tone="coral" size={32}>BFS</Chip>
            <Chip tone="teal" size={32}>DFS</Chip>
            <Chip tone="amber" size={32}>Dijkstra</Chip>
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Graph model                                                            */
/* ------------------------------------------------------------------------ */

export function GraphModelScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const abstract = progress(frame, cues[1], 30);
  const chips = [
    { ja: "道路網", en: "roads" },
    { ja: "SNS", en: "social" },
    { ja: "Web", en: "web" },
    { ja: "依存関係", en: "deps" },
  ];
  return (
    <SceneShell kicker={{ ja: "問題を定義する", en: "Define the problem" }} title={{ ja: "街を、頂点と辺に変える", en: "Turn a city into vertices and edges" }}>
      <Abs x={150} y={240} w={1040} h={570}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Svg>
            {[
              [320, 380, 600, 300],
              [320, 380, 600, 490],
              [600, 300, 810, 380],
              [600, 490, 810, 380],
              [810, 380, 925, 490],
            ].map(([x1, y1, x2, y2], i) => (
              <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} p={progress(frame, cues[0] + i * 5, 18)} head={false} width={9} color={abstract > 0.55 ? colors.hairlineStrong : colors.amber} />
            ))}
          </Svg>
          {[
            { id: "A", x: 320, y: 380 },
            { id: "B", x: 600, y: 300 },
            { id: "C", x: 600, y: 490 },
            { id: "D", x: 810, y: 380 },
            { id: "E", x: 925, y: 490 },
          ].map((p, i) => (
            <GraphNode key={p.id} p={p} tone={abstract > 0.5 ? "done" : "wait"} label={abstract > 0.5 ? p.id : "＋"} scale={1 + 0.08 * progress(frame, cues[1] + i * 4, 12)} />
          ))}
          <Abs x={70} y={35} w={450}>
            <Chip tone={abstract > 0.5 ? "teal" : "amber"} size={26}>
              {abstract > 0.5 ? t({ ja: "グラフ G = (V, E)", en: "Graph G = (V, E)" }) : t({ ja: "見知らぬ街", en: "unfamiliar city" })}
            </Chip>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1255} y={320} w={540}>
        <Appear at={cues[1]}>
          <StateList title={t({ ja: "抽象化", en: "Abstraction" })} active={1} items={[t({ ja: "交差点 → 頂点 V", en: "intersections → V" }), t({ ja: "道路 → 辺 E", en: "roads → E" }), t({ ja: "街 → グラフ G", en: "city → graph G" })]} />
        </Appear>
      </Abs>
      <Abs x={1265} y={680} w={520} style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {chips.map((c, i) => (
          <Appear key={c.en} at={cues[2] + i * 8}>
            <Chip tone={i === 0 ? "coral" : i === 1 ? "teal" : "muted"} size={28}>
              {t(c)}
            </Chip>
          </Appear>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Representation                                                         */
/* ------------------------------------------------------------------------ */

export function RepresentationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const listOn = frame >= cues[1];
  const matrixOn = frame >= cues[2];
  const rows = [
    ["A", "B", "C"],
    ["B", "A", "D", "E"],
    ["C", "A", "E"],
    ["D", "B", "F"],
    ["E", "B", "C", "F"],
  ];
  return (
    <SceneShell kicker={{ ja: "表現を選ぶ", en: "Choose representation" }} title={{ ja: "隣人を知る仕組み", en: "Build the neighbor machinery" }}>
      <Abs x={130} y={245} w={790} h={640}>
        <Card tone="white" style={{ padding: 30, height: "100%", borderColor: listOn ? colors.coral : colors.hairline }}>
          <PanelTitle>{t({ ja: "隣接リスト", en: "Adjacency list" })}</PanelTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map((r, i) => (
              <div key={r[0]} style={{ display: "flex", alignItems: "center", gap: 14, opacity: progress(frame, cues[1] + i * 5, 15) }}>
                <Chip tone={i === 0 ? "coral" : "muted"} size={27}>{r[0]}</Chip>
                <span style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.muted }}>→</span>
                {r.slice(1).map((n) => (
                  <span key={n} style={{ padding: "8px 14px", borderRadius: 12, background: n === "B" || n === "C" ? colors.tealSoft : colors.surfaceSoft, fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>
                    {n}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 34 }}>
            <Chip tone="teal" size={28}>{t({ ja: "空間 O(V + E)", en: "space O(V + E)" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={1010} y={245} w={780} h={640}>
        <Card tone="soft" style={{ padding: 30, height: "100%", borderColor: matrixOn ? colors.amber : colors.hairline }}>
          <PanelTitle>{t({ ja: "隣接行列", en: "Adjacency matrix" })}</PanelTitle>
          <div style={{ display: "grid", gridTemplateColumns: "70px repeat(5, 86px)", gridAutoRows: "66px", gap: 8, fontFamily: fonts.mono, fontSize: 26, alignItems: "center", justifyItems: "center" }}>
            <div />
            {["A", "B", "C", "D", "E"].map((h) => <b key={h}>{h}</b>)}
            {["A", "B", "C", "D", "E"].map((r, ri) => [
              <b key={`${r}-h`}>{r}</b>,
              ...["A", "B", "C", "D", "E"].map((_, ci) => {
                const one = (ri === 0 && (ci === 1 || ci === 2)) || (ri === 1 && (ci === 0 || ci === 3 || ci === 4)) || (ri === 2 && (ci === 0 || ci === 4)) || (ri === 3 && ci === 1) || (ri === 4 && (ci === 1 || ci === 2));
                return (
                  <div key={`${r}-${ci}`} style={{ width: 62, height: 54, borderRadius: 10, background: one ? colors.coralSoft : "#fff", border: `2px solid ${one ? colors.coral : colors.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: progress(frame, cues[2] + ri * 4 + ci, 14) }}>
                    {one ? 1 : 0}
                  </div>
                );
              }),
            ])}
          </div>
          <div style={{ marginTop: 26, display: "flex", gap: 18 }}>
            <Chip tone="amber" size={28}>{t({ ja: "空間 O(V²)", en: "space O(V²)" })}</Chip>
            <Chip tone="coral" size={28}>{t({ ja: "辺の有無 O(1)", en: "edge lookup O(1)" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={630} y={190}>
        <Appear at={cues[3]}>
          <Chip tone="teal" size={29}>{t({ ja: "探索では隣人の列挙が主役", en: "traversal mostly enumerates neighbors" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Visited                                                                */
/* ------------------------------------------------------------------------ */

export function VisitedScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const visited = frame >= cues[2] ? ["A", "B", "C"] : frame >= cues[1] ? ["A", "B"] : ["A"];
  const cycle = [
    { id: "A", x: 360, y: 575 },
    { id: "B", x: 735, y: 315 },
    { id: "C", x: 1110, y: 575 },
  ];
  const loopStart = cues[0] + 12;
  const loopToken = (() => {
    if (frame < loopStart || frame >= cues[2]) return null;
    const f = (frame - loopStart) % 90;
    const seg = f < 30 ? 0 : f < 60 ? 1 : 2;
    const p = (f - seg * 30) / 30;
    const from = cycle[seg];
    const to = cycle[(seg + 1) % cycle.length];
    return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p, label: seg === 2 ? t({ ja: "またA", en: "A again" }) : t({ ja: "進む", en: "go" }) };
  })();
  const tokenStarts = [cues[0] + 12, cues[0] + 72, cues[1] + 18];
  return (
    <SceneShell kicker={{ ja: "ナイーブ探索", en: "Naive traversal" }} title={{ ja: "サイクルには、記録が必要", en: "Cycles require memory" }}>
      <Abs x={120} y={220} w={1240} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Svg>
        <Arrow x1={360} y1={575} x2={735} y2={315} p={1} width={8} head color={colors.hairlineStrong} />
        <Arrow x1={735} y1={315} x2={1110} y2={575} p={1} width={8} head color={colors.hairlineStrong} />
        <Arrow x1={1110} y1={575} x2={360} y2={575} p={progress(frame, cues[1], 25)} width={8} head color={colors.error} bend={210} opacity={frame < cues[2] ? 1 : 0.35} />
        {frame < cues[2] &&
          tokenStarts.map((start) => (
            <g key={start}>
              <Packet x1={360} y1={575} x2={735} y2={315} start={start} dur={24} r={18} color={colors.coral} label={t({ ja: "進む", en: "go" })} />
              <Packet x1={735} y1={315} x2={1110} y2={575} start={start + 28} dur={24} r={18} color={colors.coral} label={t({ ja: "進む", en: "go" })} />
              <Packet x1={1110} y1={575} x2={360} y2={575} start={start + 56} dur={30} r={18} color={colors.error} label={t({ ja: "またA", en: "A again" })} />
            </g>
          ))}
        {frame >= cues[2] && <Packet x1={1110} y1={575} x2={360} y2={575} start={cues[2] + 8} dur={32} r={18} color={colors.teal} label={t({ ja: "停止", en: "stop" })} />}
        {loopToken && (
          <g>
            <circle cx={loopToken.x} cy={loopToken.y} r={24} fill={colors.error} stroke="#fff" strokeWidth={5} />
            <text x={loopToken.x} y={loopToken.y - 34} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={800} fill={colors.error}>
              {loopToken.label}
            </text>
          </g>
        )}
      </Svg>
      {cycle.map((p) => (
        <GraphNode key={p.id} p={p} tone={visited.includes(p.id) ? "done" : "white"} ring={p.id === "A" && frame < cues[2]} scale={1.35} />
      ))}
      <Abs x={1390} y={315} w={395}>
        <StateList title={t({ ja: "visited 集合", en: "visited set" })} items={visited.length ? visited : ["∅"]} active={visited.length - 1} />
      </Abs>
      <Abs x={1390} y={675} w={395}>
        <Appear at={cues[2]}>
          <Card tone="soft" style={{ padding: 24 }}>
            <Chip tone="teal" size={26}>{t({ ja: "発見したら印を付ける", en: "mark when discovered" })}</Chip>
            <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.35, color: colors.body }}>
              {t({ ja: "二度目の訪問を止める", en: "stop the second visit" })}
            </div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={500} y={755} w={500} style={{ display: "flex", justifyContent: "center" }}>
        <Appear at={cues[1]} until={cues[2] + 40}>
          <Chip tone={frame >= cues[2] ? "teal" : "error"} size={30}>{frame >= cues[2] ? t({ ja: "visited がループを止める", en: "visited stops the loop" }) : "A → B → C → A → …"}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. BFS                                                                    */
/* ------------------------------------------------------------------------ */

export function BfsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const step = phase(frame, cues, [1, 2]);
  const states: Record<string, "white" | "active" | "done" | "wait"> = {};
  GRAPH.forEach((p) => (states[p.id] = "white"));
  if (step === 0) states.A = "active";
  if (step >= 1) states.A = "done";
  if (step >= 1) {
    states.B = "active";
    states.C = "wait";
  }
  if (step >= 2) {
    states.B = "done";
    states.C = "done";
    states.D = "active";
    states.E = "wait";
  }
  const queue = step < 1 ? ["A"] : step < 2 ? ["B", "C"] : ["E"];
  return (
    <SceneShell kicker={{ ja: "BFS", en: "BFS" }} title={{ ja: "近い場所から、波紋のように", en: "Expand nearby first, like ripples" }}>
      <Abs x={130} y={220} w={1220} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Edges
        points={GRAPH}
        edges={EDGES}
        hot={(e) => (step >= 1 && ["A-B", "A-C"].includes(`${e.a}-${e.b}`) ? 1 : step >= 2 && ["B-D", "B-E"].includes(`${e.a}-${e.b}`) ? 1 : 0)}
        faded
      />
      {GRAPH.map((p) => <GraphNode key={p.id} p={p} tone={states[p.id]} ring={p.id === (step === 0 ? "A" : step === 1 ? "B" : "D")} sub={step >= 1 && ["B", "C"].includes(p.id) ? "d=1" : step >= 2 && ["D", "E"].includes(p.id) ? "d=2" : p.id === "A" ? "d=0" : undefined} />)}
      <Svg>
        <circle cx={380} cy={500} r={200 * progress(frame, cues[1], 35)} fill="none" stroke={colors.coral} strokeWidth={6} opacity={1 - progress(frame, cues[1] + 40, 20)} />
        <circle cx={380} cy={500} r={510 * progress(frame, cues[2], 44)} fill="none" stroke={colors.amber} strokeWidth={6} opacity={1 - progress(frame, cues[2] + 50, 25)} />
        {step >= 1 && <Packet x1={380} y1={500} x2={650} y2={350} start={cues[1] + 8} dur={22} label="B" />}
        {step >= 1 && <Packet x1={380} y1={500} x2={650} y2={650} start={cues[1] + 16} dur={22} label="C" />}
        {step >= 2 && <Packet x1={1530} y1={410} x2={930} y2={360} start={cues[2] + 4} dur={24} color={colors.amber} label={t({ ja: "現在", en: "current" })} />}
      </Svg>
      <Abs x={1385} y={330} w={415}>
        <StateList title={t({ ja: "キュー", en: "Queue" })} items={queue} active={0} />
      </Abs>
      <Abs x={1385} y={620} w={415}>
        <Appear at={cues[2]}>
          <Chip tone="coral" size={28}>{t({ ja: "FIFO", en: "FIFO" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. BFS shortest paths                                                     */
/* ------------------------------------------------------------------------ */

export function BfsShortestScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const mark = frame >= cues[3];
  const duplicate = frame >= cues[4];
  return (
    <SceneShell kicker={{ ja: "最短経路", en: "Shortest paths" }} title={{ ja: "レベル順だから、最初の距離が最短", en: "Level order makes first distance shortest" }}>
      <Abs x={125} y={220} w={1260} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Abs x={190} y={285} w={370} h={470}>
        <div style={{ width: "100%", height: "100%", borderRadius: 34, background: colors.tealSoft, opacity: 0.52 }} />
      </Abs>
      <Abs x={560} y={285} w={330} h={470}>
        <div style={{ width: "100%", height: "100%", borderRadius: 34, background: colors.coralSoft, opacity: 0.5 }} />
      </Abs>
      <Abs x={890} y={285} w={400} h={470}>
        <div style={{ width: "100%", height: "100%", borderRadius: 34, background: colors.amberSoft, opacity: 0.58 }} />
      </Abs>
      <Edges points={GRAPH} edges={EDGES} hot={(e) => (["A-B", "A-C", "B-D", "B-E", "C-E"].includes(`${e.a}-${e.b}`) ? progress(frame, cues[1], 24) : 0)} faded />
      {GRAPH.map((p) => {
        const d = p.id === "A" ? 0 : ["B", "C"].includes(p.id) ? 1 : ["D", "E"].includes(p.id) ? 2 : 3;
        return <GraphNode key={p.id} p={p} tone={d <= 1 || (d === 2 && frame >= cues[1]) ? "done" : "white"} sub={`d=${d}`} ring={duplicate && p.id === "E"} />;
      })}
      <Abs x={170} y={760} w={1130} style={{ display: "flex", gap: 18, justifyContent: "center" }}>
        <Chip tone="teal" size={26}>{t({ ja: "距離 0", en: "distance 0" })}</Chip>
        <Chip tone="coral" size={26}>{t({ ja: "距離 1", en: "distance 1" })}</Chip>
        <Chip tone="amber" size={26}>{t({ ja: "距離 2", en: "distance 2" })}</Chip>
      </Abs>
      <Abs x={1410} y={305} w={385}>
        <StateList title={t({ ja: "キュー", en: "Queue" })} items={mark ? ["D", "E"] : ["B", "C"]} active={0} />
      </Abs>
      <Abs x={1410} y={590} w={385}>
        <Appear at={cues[3]}>
          <Card tone="soft" style={{ padding: 22 }}>
            <Chip tone="teal" size={25}>{t({ ja: "enqueue 時に印", en: "mark on enqueue" })}</Chip>
            <div style={{ marginTop: 18, fontFamily: fonts.mono, fontSize: 29, color: duplicate ? colors.coralDeep : colors.body }}>
              {duplicate ? "E × 1" : "B, C"}
            </div>
          </Card>
        </Appear>
      </Abs>
      {duplicate && (
        <Svg>
          <Packet x1={650} y1={350} x2={930} y2={650} start={cues[4] + 3} dur={22} color={colors.coral} label="E" />
          <Packet x1={650} y1={650} x2={930} y2={650} start={cues[4] + 18} dur={22} color={colors.error} label="skip" />
        </Svg>
      )}
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. DFS                                                                    */
/* ------------------------------------------------------------------------ */

export function DfsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const deep = progress(frame, cues[0], 70);
  const order = frame < cues[1] ? ["A", "B", "D", "F"] : ["A", "B", "D"];
  const active = frame < cues[1] ? "F" : frame < cues[2] ? "D" : "C";
  const finish = frame >= cues[3];
  return (
    <SceneShell kicker={{ ja: "DFS", en: "DFS" }} title={{ ja: "一本道を深く、戻りながら調べる", en: "Go deep, then backtrack" }}>
      <Abs x={135} y={220} w={1190} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Edges points={GRAPH} edges={EDGES} hot={(e) => (["A-B", "B-D", "D-F"].includes(`${e.a}-${e.b}`) ? deep : e.a === "A" && e.b === "C" ? progress(frame, cues[2], 24) : 0)} faded />
      {GRAPH.map((p) => <GraphNode key={p.id} p={p} tone={order.includes(p.id) ? "done" : p.id === "C" && frame >= cues[2] ? "wait" : "white"} ring={p.id === active} sub={finish && ["A", "B", "D", "F"].includes(p.id) ? `f${["F", "D", "B", "A"].indexOf(p.id) + 1}` : undefined} />)}
      <Svg>
        {frame >= cues[1] && <Packet x1={1210} y1={500} x2={930} y2={360} start={cues[1] + 5} dur={28} color={colors.amber} label={t({ ja: "戻る", en: "back" })} />}
      </Svg>
      <Abs x={1385} y={315} w={415}>
        <StateList title={frame < cues[2] ? t({ ja: "再帰スタック", en: "Call stack" }) : t({ ja: "明示スタック", en: "Stack" })} items={[...order].reverse()} active={0} />
      </Abs>
      <Abs x={1385} y={675} w={415}>
        <Appear at={cues[3]}>
          <Chip tone="teal" size={25}>{t({ ja: "完了時刻の逆順", en: "reverse finish order" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Structure comparison                                                    */
/* ------------------------------------------------------------------------ */

export function StructureScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cards = [
    {
      tone: "coral" as const,
      title: { ja: "BFS", en: "BFS" },
      key: { ja: "距離", en: "distance" },
      items: [
        { ja: "無重み最短経路", en: "unweighted shortest path" },
        { ja: "kホップ以内", en: "within k hops" },
        { ja: "二部グラフ判定", en: "bipartite test" },
      ],
    },
    {
      tone: "teal" as const,
      title: { ja: "DFS", en: "DFS" },
      key: { ja: "構造", en: "structure" },
      items: [
        { ja: "サイクル検出", en: "cycle detection" },
        { ja: "トポロジカルソート", en: "topological sort" },
        { ja: "連結成分", en: "components" },
      ],
    },
  ];
  return (
    <SceneShell kicker={{ ja: "使い分け", en: "Choosing" }} title={{ ja: "同じ計算量、違う順序", en: "Same complexity, different order" }}>
      <Abs x={140} y={250} w={1640} h={560} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34 }}>
        {cards.map((c, i) => (
          <Appear key={c.title.en} at={cues[i] ?? 0}>
            <Card tone="white" style={{ height: 540, padding: 36, borderColor: c.tone === "coral" ? colors.coral : colors.teal }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: fonts.serif, fontSize: 70, color: c.tone === "coral" ? colors.coralDeep : colors.tealDeep }}>{t(c.title)}</div>
                <Chip tone={c.tone} size={28}>{t(c.key)}</Chip>
              </div>
              <div style={{ marginTop: 35, fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, color: colors.body }}>
                {i === 0 ? "Queue → FIFO" : "Stack → LIFO"}
              </div>
              <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 18 }}>
                {c.items.map((it, j) => (
                  <div key={it.en} style={{ opacity: progress(frame, cues[1] + j * 7, 14), display: "flex", alignItems: "center", gap: 14, fontFamily: fonts.sans, fontSize: 32, color: colors.body }}>
                    <span style={{ width: 18, height: 18, borderRadius: 99, background: c.tone === "coral" ? colors.coral : colors.teal }} />
                    {t(it)}
                  </div>
                ))}
              </div>
            </Card>
          </Appear>
        ))}
      </Abs>
      <Abs x={610} y={815}>
        <Chip tone="muted" size={30}>{t({ ja: "時間 O(V + E)・空間 O(V)", en: "time O(V + E) · space O(V)" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Dijkstra                                                               */
/* ------------------------------------------------------------------------ */

export function DijkstraScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const step = phase(frame, cues, [1, 2, 3]);
  const dist: Record<string, string> =
    step < 1 ? { S: "0", A: "∞", B: "∞", C: "∞", D: "∞", T: "∞" } : step < 2 ? { S: "0", A: "5", B: "2", C: "∞", D: "∞", T: "∞" } : step < 3 ? { S: "0", A: "3", B: "2", C: "∞", D: "6", T: "∞" } : { S: "0", A: "3", B: "2", C: "5", D: "6", T: "∞" };
  const pq = step < 1 ? ["S:0"] : step < 2 ? ["B:2", "A:5"] : step < 3 ? ["A:3", "D:6"] : ["C:5", "D:6"];
  return (
    <SceneShell kicker={{ ja: "Dijkstra", en: "Dijkstra" }} title={{ ja: "キューを、距離順に並べ替える", en: "Sort the queue by distance" }}>
      <Abs x={120} y={220} w={1270} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Edges points={WEIGHTED} edges={WEDGES} weights faded hot={(e) => (step >= 1 && e.a === "S" ? 1 : step >= 2 && e.a === "B" ? 1 : step >= 3 && e.a === "A" ? 1 : 0)} />
      {WEIGHTED.map((p) => {
        const done = p.id === "S" || (step >= 2 && p.id === "B") || (step >= 3 && p.id === "A");
        return <GraphNode key={p.id} p={p} tone={done ? "done" : pq.some((q) => q.startsWith(`${p.id}:`)) ? "wait" : "white"} ring={(step < 2 && p.id === "B") || (step >= 2 && step < 3 && p.id === "A")} sub={dist[p.id]} />;
      })}
      <Svg>
        {step >= 1 && <Packet x1={300} y1={520} x2={620} y2={690} start={cues[1] + 8} dur={24} label="2" />}
        {step >= 2 && <Packet x1={620} y1={690} x2={600} y2={350} start={cues[2] + 8} dur={24} color={colors.teal} label="3" />}
        {step >= 3 && <Packet x1={600} y1={350} x2={950} y2={370} start={cues[3] + 6} dur={26} color={colors.coral} label="5" />}
      </Svg>
      <Abs x={1400} y={275} w={400}>
        <StateList title={t({ ja: "優先度付きキュー", en: "Priority queue" })} items={pq} active={0} />
      </Abs>
      <Abs x={1400} y={565} w={400}>
        <Card tone="soft" style={{ padding: 26 }}>
          <PanelTitle>{t({ ja: "dist 表", en: "dist table" })}</PanelTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {WEIGHTED.map((p) => (
              <div key={p.id} style={{ minHeight: 52, padding: "10px 8px", borderRadius: 12, background: dist[p.id] === "∞" ? "#fff" : colors.tealSoft, fontFamily: fonts.mono, fontSize: 27, fontWeight: 800, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.id}:{dist[p.id]}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Dijkstra proof                                                         */
/* ------------------------------------------------------------------------ */

export function DijkstraProofScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const proof = progress(frame, cues[1], 26);
  const neg = frame >= cues[2];
  const nonNegativeFormula = frame >= cues[1] && frame < cues[2] - 4 ? 1 : 0;
  const negativeFormula = frame >= cues[2] + 4 ? 1 : 0;
  return (
    <SceneShell kicker={{ ja: "正しさの条件", en: "Correctness condition" }} title={{ ja: "確定できるのは、重みが負でないから", en: "Finalization relies on non-negative weights" }}>
      <Abs x={105} y={220} w={1285} h={650}>
        <Card tone="white" style={{ width: "100%", height: "100%" }}>{null}</Card>
      </Abs>
      <Svg>
        <circle cx={430} cy={540} r={170} fill={colors.tealSoft} opacity={0.9} />
        <circle cx={790} cy={540} r={230} fill={colors.coralSoft} opacity={0.72 * proof} />
        <Arrow x1={430} y1={540} x2={790} y2={540} p={proof} color={colors.coral} width={10} head={false} />
        <Arrow x1={790} y1={440} x2={430} y2={440} p={proof} color={neg ? colors.error : colors.teal} width={7} head bend={-80} dashed={neg} opacity={0.95} />
      </Svg>
      <GraphNode p={{ id: "u", x: 430, y: 540 }} tone="done" label="u" sub="dist=3" ring scale={1.9} />
      <GraphNode p={{ id: "x", x: 790, y: 540 }} tone={neg ? "error" : "wait"} label="x" sub="≥3" scale={1.9} />
      <Abs x={540} y={335} w={230} h={58}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 999,
            background: neg ? colors.errorSoft : colors.surfaceSoft,
            border: `3px solid ${neg ? colors.error : colors.hairlineStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.mono,
            fontSize: 30,
            fontWeight: 800,
            color: neg ? colors.error : colors.body,
          }}
        >
          {neg ? "-5" : t({ ja: "+w (w ≥ 0)", en: "+w (w ≥ 0)" })}
        </div>
      </Abs>
      <Abs x={250} y={680} w={1000}>
        <div style={{ position: "relative", height: 106 }}>
          <Card tone="white" style={{ position: "absolute", inset: 0, padding: "18px 26px", borderColor: colors.teal, opacity: nonNegativeFormula }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, lineHeight: 1.35, color: colors.tealDeep, textAlign: "center" }}>
              {t({ ja: "dist(x) ≥ dist(u) = 3 → 3 + w ≥ 3：回り道で短くならない", en: "dist(x) ≥ 3, so 3 + w ≥ 3: no shorter detour" })}
            </div>
          </Card>
          <Card tone="white" style={{ position: "absolute", inset: 0, padding: "18px 26px", borderColor: colors.error, opacity: negativeFormula }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, lineHeight: 1.35, color: colors.error, textAlign: "center" }}>
              {t({ ja: "w = −5 なら 3 + (−5) < 3：確定が壊れる", en: "with w = −5, 3 + (−5) < 3: finalizing breaks" })}
            </div>
          </Card>
        </div>
      </Abs>
      <Abs x={1450} y={285} w={345}>
        <Appear at={cues[0]}>
          <Card tone="soft" style={{ padding: 24 }}>
            <Chip tone="teal" size={26}>{t({ ja: "最小を確定", en: "finalize min" })}</Chip>
            <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.35, color: colors.body }}>
              {t({ ja: "未処理はすべて同じか遠い", en: "unprocessed is no closer" })}
            </div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1450} y={580} w={345}>
        <Appear at={cues[2]}>
          <Card tone={neg ? "white" : "soft"} style={{ padding: 24, borderColor: neg ? colors.error : colors.hairline }}>
            <Chip tone="error" size={26}>{t({ ja: "負の辺は不可", en: "negative breaks it" })}</Chip>
            <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 27, color: colors.body }}>{t({ ja: "Bellman-Fordへ", en: "Use Bellman-Ford" })}</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={460} y={810}>
        <Appear at={cues[3]}>
          <Chip tone="muted" size={30}>{t({ ja: "二分ヒープ: O((V + E) log V)", en: "binary heap: O((V + E) log V)" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 10. Outro                                                                 */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const items: Bilingual[] = [
    { ja: "訪問済み集合", en: "visited set" },
    { ja: "キュー", en: "queue" },
    { ja: "スタック", en: "stack" },
    { ja: "優先度付きキュー", en: "priority queue" },
  ];
  return (
    <EndCard slug="graph-traversal" headline={{ ja: "暗記ではなく、再発明する", en: "Do not memorize — reinvent" }}>
      <div style={{ marginTop: 42, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 1180 }}>
        {items.map((item, i) => (
          <span key={item.en} style={{ opacity: progress(frame, cues[1] + i * 7, 16) }}>
            <Chip tone={i === 0 ? "teal" : i === 3 ? "amber" : "coral"} size={28}>
              {t(item)}
            </Chip>
          </span>
        ))}
      </div>
      <div style={{ marginTop: 38, fontFamily: fonts.sans, fontSize: 30, color: colors.muted, opacity: fadeWindow(frame, cues[2], cues[3] + 30), textAlign: "center" }}>
        {t({ ja: "図で比べ、デモで一歩ずつ確認できます", en: "Compare diagrams, then step through the demos" })}
      </div>
    </EndCard>
  );
}
