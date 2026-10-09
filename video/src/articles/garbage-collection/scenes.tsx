import { type CSSProperties } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Svg } from "../../kit/ui";

const WHITE = "#ffffff";
const GRAY = "#a9a49b";
const BLACK = colors.ink;

type GcColor = "white" | "gray" | "black" | "teal" | "red" | "dim";
type Obj = { id: string; x: number; y: number; label?: string };
type Edge = { from: string; to: string; bend?: number; dashed?: boolean };

function cueAt(cues: number[], index: number, fallback = 0) {
  return cues[index] ?? fallback;
}

function ObjNode({
  obj,
  color = "white",
  opacity = 1,
  scale = 1,
  badge,
  size = 82,
}: {
  obj: Obj;
  color?: GcColor;
  opacity?: number;
  scale?: number;
  badge?: string;
  size?: number;
}) {
  const fill =
    color === "black"
      ? BLACK
      : color === "gray"
        ? GRAY
        : color === "teal"
          ? colors.tealSoft
          : color === "red"
            ? colors.errorSoft
            : color === "dim"
              ? colors.surfaceCard
              : WHITE;
  const border =
    color === "black"
      ? BLACK
      : color === "gray"
        ? colors.muted
        : color === "teal"
          ? colors.teal
          : color === "red"
            ? colors.error
            : colors.hairlineStrong;
  const text = color === "black" ? colors.onDark : colors.ink;
  return (
    <Abs x={obj.x - size / 2} y={obj.y - size / 2} w={size} h={size} style={{ opacity, transform: `scale(${scale})` }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          background: fill,
          border: `3px solid ${border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          fontFamily: fonts.mono,
          fontSize: size > 70 ? 26 : 22,
          fontWeight: 800,
          color: text,
          boxShadow: "0 10px 24px rgba(20,20,19,0.08)",
        }}
      >
        {obj.label ?? obj.id}
      </div>
      {badge && (
        <div style={{ position: "absolute", right: -24, top: -16 }}>
          <Chip tone={color === "red" ? "error" : color === "black" ? "ink" : "muted"} size={18}>
            {badge}
          </Chip>
        </div>
      )}
    </Abs>
  );
}

function Graph({
  objects,
  edges,
  colorOf,
  edgeColorOf,
  edgeProgress = 1,
  opacity = 1,
  nodeSize,
}: {
  objects: Obj[];
  edges: Edge[];
  colorOf: (id: string) => GcColor;
  edgeColorOf?: (edge: Edge) => string;
  edgeProgress?: number | ((edge: Edge, i: number) => number);
  opacity?: number;
  nodeSize?: number;
}) {
  const byId = Object.fromEntries(objects.map((o) => [o.id, o]));
  return (
    <div style={{ opacity }}>
      <Svg>
        {edges.map((e, i) => {
          const a = byId[e.from];
          const b = byId[e.to];
          const p = typeof edgeProgress === "function" ? edgeProgress(e, i) : edgeProgress;
          if (!a || !b) return null;
          return (
            <Arrow
              key={`${e.from}-${e.to}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              bend={e.bend ?? 0}
              dashed={e.dashed}
              p={p}
              color={edgeColorOf ? edgeColorOf(e) : colors.hairlineStrong}
              width={edgeColorOf ? 5 : 3}
            />
          );
        })}
      </Svg>
      {objects.map((o) => (
        <ObjNode key={o.id} obj={o} color={colorOf(o.id)} size={nodeSize} />
      ))}
    </div>
  );
}

function CodeCard({ title, lines, accent }: { title: string; lines: string[]; accent?: string }) {
  return (
    <Card tone="dark" accent={accent} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
      <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 700, color: colors.onDark, marginBottom: 18 }}>{title}</div>
      <pre
        style={{
          margin: 0,
          fontFamily: fonts.mono,
          fontSize: 23,
          lineHeight: 1.45,
          color: colors.onDark,
          whiteSpace: "pre-wrap",
        }}
      >
        {lines.join("\n")}
      </pre>
    </Card>
  );
}

function SectionLabel({ children, style }: { children: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        fontSize: 26,
        fontWeight: 800,
        color: colors.ink,
        letterSpacing: 0.2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 0. Title                                                                  */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const nodes: Obj[] = [
    { id: "R", x: 1330, y: 360, label: "roots" },
    { id: "A", x: 1500, y: 280 },
    { id: "B", x: 1660, y: 380 },
    { id: "C", x: 1430, y: 520 },
    { id: "D", x: 1610, y: 590 },
    { id: "E", x: 1760, y: 500 },
    { id: "F", x: 1490, y: 700 },
  ];
  const edges: Edge[] = [
    { from: "R", to: "A" },
    { from: "R", to: "C" },
    { from: "A", to: "B" },
    { from: "B", to: "E" },
    { from: "C", to: "D" },
    { from: "D", to: "F" },
  ];
  const colorOf = (id: string): GcColor => {
    if (id === "R") return "teal";
    const step = Math.floor((frame - 36) / 22);
    const order = ["A", "C", "B", "D", "E", "F"];
    const i = order.indexOf(id);
    if (i < 0 || step < i) return "white";
    if (step === i) return "gray";
    return "black";
  };
  return (
    <TitleCard
      title={{ ja: "ガベージコレクションの\n仕組み", en: "How Garbage Collection Works" }}
      subtitle={{
        ja: "参照カウントからトレース、世代別、並行GCまで — GC技術の系譜と言語ごとの戦略",
        en: "From reference counting to tracing, generational and concurrent GC",
      }}
      art={
        <>
          <Abs x={1190} y={210} w={620} h={560}>
            <Card tone="soft" style={{ width: "100%", height: "100%" }}>
              {null}
            </Card>
          </Abs>
          <Graph
            objects={nodes}
            edges={edges}
            colorOf={colorOf}
            edgeProgress={(e, i) => progress(frame, 24 + i * 8, 18)}
            edgeColorOf={(e) => (colorOf(e.from) === "black" || colorOf(e.from) === "teal" ? colors.teal : colors.hairlineStrong)}
            opacity={Math.min(1, pop(frame, 18, fps))}
          />
          <Abs x={1225} y={770} w={550} style={{ display: "flex", justifyContent: "center", gap: 12, opacity: progress(frame, 80, 22) }}>
            <Chip size={22}>{t({ ja: "白", en: "white" })}</Chip>
            <Chip tone="amber" size={22}>{t({ ja: "灰", en: "gray" })}</Chip>
            <Chip tone="ink" size={22}>{t({ ja: "黒", en: "black" })}</Chip>
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Why GC                                                                 */
/* ------------------------------------------------------------------------ */

export function WhyScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const bug = progress(frame, cueAt(cues, 1), 18);
  const history = progress(frame, cueAt(cues, 2), 18);
  const leakLines =
    t({
      ja: "void leak_example() {\n    char *buf = malloc(1024);\n    // buf を使って処理...\n    if (error) return;  // ← free(buf) を忘れてリターン！\n    free(buf);\n}",
      en: "void leak_example() {\n    char *buf = malloc(1024);\n    // use buf for processing...\n    if (error) return;  // ← forgot to free(buf) before return!\n    free(buf);\n}",
    }).split("\n");
  const danglingLines =
    t({
      ja: "void dangling_example() {\n    char *a = malloc(64);\n    char *b = a;  // a と b が同じメモリを指す\n    free(a);\n    // b はまだ解放済みメモリを指している\n    strcpy(b, \"hello\");\n}",
      en: "void dangling_example() {\n    char *a = malloc(64);\n    char *b = a;  // a and b point to the same memory\n    free(a);\n    // b still points to freed memory\n    strcpy(b, \"hello\");\n}",
    }).split("\n");
  return (
    <SceneShell kicker={{ ja: "なぜGCか", en: "Why GC" }} title={{ ja: "手動管理の2つのバグ", en: "Two bugs of manual memory management" }}>
      <Abs x={120} y={270} w={820} h={360}>
        <Appear at={cues[0] + 8}>
          <CodeCard title="leak_example.c" lines={leakLines} accent={bug ? colors.error : undefined} />
        </Appear>
      </Abs>
      <Abs x={980} y={270} w={820} h={360}>
        <Appear at={cues[0] + 18}>
          <CodeCard title="dangling_example.c" lines={danglingLines} accent={bug ? colors.error : undefined} />
        </Appear>
      </Abs>
      <Abs x={150} y={660} w={760} h={130} style={{ opacity: bug }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 22, boxSizing: "border-box" }}>
          <Chip tone="error" size={24}>{t({ ja: "メモリリーク", en: "memory leak" })}</Chip>
          <div style={{ marginTop: 18, height: 22, borderRadius: 12, background: colors.surfaceCard, overflow: "hidden" }}>
            <div style={{ width: `${30 + progress(frame, cues[1] + 12, 120, (x) => x) * 62}%`, height: "100%", background: colors.error }} />
          </div>
        </Card>
      </Abs>
      <Abs x={1025} y={650} w={720} h={150} style={{ opacity: bug }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 20, boxSizing: "border-box" }}>
          <div style={{ position: "absolute", left: 34, top: 32, fontFamily: fonts.mono, fontSize: 28 }}>a</div>
          <div style={{ position: "absolute", left: 34, top: 76, fontFamily: fonts.mono, fontSize: 28 }}>b</div>
          <div
            style={{
              position: "absolute",
              left: 280,
              top: 38,
              width: 190,
              height: 74,
              borderRadius: 14,
              background: colors.errorSoft,
              border: `3px solid ${colors.error}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.sans,
              fontSize: 24,
              fontWeight: 800,
              color: colors.error,
            }}
          >
            {t({ ja: "解放済み", en: "freed" })}
          </div>
          <div style={{ position: "absolute", right: 26, top: 54 }}>
            <Chip tone="error" size={23}>{t({ ja: "ダングリングポインタ", en: "dangling pointer" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={1090} y1={702} x2={1320} y2={722} p={bug} color={colors.error} width={5} />
        <Arrow x1={1090} y1={746} x2={1320} y2={722} p={bug} color={colors.error} width={5} dashed />
      </Svg>
      <Abs x={120} y={806} w={1680} style={{ display: "flex", justifyContent: "center", gap: 20, opacity: history }}>
        <Chip tone="ink" size={27}>1959 · John McCarthy · Lisp</Chip>
        <Chip tone="teal" size={27}>{t({ ja: "GC: 解放を自動化", en: "GC automates freeing" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Reference counting                                                     */
/* ------------------------------------------------------------------------ */

export function RcScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const steps = [
    { at: cues[0] + 16, code: "a = Object()", refs: ["a"], count: 1 },
    { at: cues[0] + 72, code: "b = a", refs: ["a", "b"], count: 2 },
    { at: cues[0] + 128, code: "a = None", refs: ["b"], count: 1 },
    { at: cues[0] + 184, code: "b = None", refs: [], count: 0 },
  ];
  const active = steps.reduce((n, s, i) => (frame >= s.at ? i : n), 0);
  const current = steps[active];
  const freed = frame >= steps[3].at + 10;
  const objectPop = freed ? 1 - progress(frame, steps[3].at + 10, 20) : Math.min(1, pop(frame, steps[0].at, 30));
  const cycle = progress(frame, cues[2], 18);
  const atoms = progress(frame, cues[3], 18);
  return (
    <SceneShell kicker={{ ja: "参照カウント", en: "Reference counting" }} title={{ ja: "参照の数を数える", en: "Count the references" }}>
      <Abs x={120} y={248} w={720} h={385}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <SectionLabel>{t({ ja: "Python の例", en: "Python example" })}</SectionLabel>
          {steps.map((s, i) => (
            <div
              key={s.code}
              style={{
                marginTop: 20,
                padding: "10px 14px",
                borderRadius: 10,
                background: i === active ? colors.coralSoft : "transparent",
                fontFamily: fonts.mono,
                fontSize: 31,
                lineHeight: 1.25,
                color: i === active ? colors.coralDeep : frame >= s.at ? colors.ink : colors.mutedSoft,
                fontWeight: i === active ? 800 : 500,
                opacity: frame >= s.at - 12 ? 1 : 0.25,
              }}
            >
              {s.code.padEnd(15)} <span style={{ color: colors.muted }}># ref_count = {s.count}</span>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={900} y={248} w={900} h={385}>
        <Card tone="soft" style={{ width: "100%", height: "100%", position: "relative" }}>
          {["a", "b"].map((v, i) => {
            const live = current.refs.includes(v);
            return (
              <div
                key={v}
                style={{
                  position: "absolute",
                  left: 78,
                  top: 86 + i * 122,
                  width: 138,
                  height: 76,
                  borderRadius: 14,
                  background: live ? colors.coralSoft : "#fff",
                  border: `3px solid ${live ? colors.coral : colors.hairlineStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.mono,
                  fontSize: 34,
                  fontWeight: 900,
                  color: live ? colors.coralDeep : colors.mutedSoft,
                }}
              >
                {v}
                {!live && <span style={{ marginLeft: 12, fontFamily: fonts.sans, fontSize: 22 }}>None</span>}
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 460,
              top: 94,
              width: 172,
              height: 172,
              borderRadius: 86,
              background: freed ? colors.surfaceCard : colors.tealSoft,
              border: `4px solid ${freed ? colors.hairlineStrong : colors.teal}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.mono,
              fontSize: 38,
              fontWeight: 900,
              color: freed ? colors.mutedSoft : colors.tealDeep,
              opacity: Math.max(0.16, objectPop),
              transform: `scale(${0.75 + objectPop * 0.25})`,
              boxShadow: "0 14px 34px rgba(20,20,19,0.10)",
            }}
          >
            obj
          </div>
          <div
            style={{
              position: "absolute",
              left: 595,
              top: 128,
              width: 190,
              height: 84,
              borderRadius: 18,
              background: current.count === 0 ? colors.tealSoft : colors.dark,
              color: current.count === 0 ? colors.tealDeep : colors.onDark,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.mono,
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            ref_count = {current.count}
          </div>
          {freed && (
            <div style={{ position: "absolute", left: 620, top: 230 }}>
              <Chip tone="teal" size={28}>{t({ ja: "0 → 解放", en: "0 → freed" })}</Chip>
            </div>
          )}
        </Card>
      </Abs>
      <Svg>
        {current.refs.includes("a") && <Arrow x1={1118} y1={372} x2={1360} y2={420} p={1} color={colors.coral} width={6} />}
        {current.refs.includes("b") && <Arrow x1={1118} y1={494} x2={1360} y2={438} p={1} color={colors.coral} width={6} />}
      </Svg>
      <Abs x={900} y={655} style={{ display: "flex", gap: 14, opacity: progress(frame, cues[1], 16) }}>
        <Chip tone="teal" size={25}>{t({ ja: "即時回収", en: "immediate reclamation" })}</Chip>
        <Chip tone="teal" size={25}>{t({ ja: "Stop-The-World なし", en: "no stop-the-world pause" })}</Chip>
      </Abs>
      <Abs x={120} y={705} w={800} h={175} style={{ opacity: cycle }}>
        <Card tone="white" accent={colors.error} style={{ width: "100%", height: "100%" }}>
          {[
            { id: "A", x: 110 },
            { id: "B", x: 390 },
          ].map((n) => (
            <div key={n.id} style={{ position: "absolute", left: n.x, top: 30 }}>
              <div
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                  background: colors.errorSoft,
                  border: `3px solid ${colors.error}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.mono,
                  fontSize: 36,
                  fontWeight: 800,
                }}
              >
                {n.id}
              </div>
              <div style={{ position: "absolute", right: -32, top: -13 }}>
                <Chip tone="error" size={20}>ref=1</Chip>
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", left: 575, top: 58 }}>
            <Chip tone="error" size={28}>{t({ ja: "リーク", en: "leaked forever" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={350} y1={775} x2={510} y2={775} p={cycle} bend={-56} color={colors.error} width={6} />
        <Arrow x1={510} y1={835} x2={350} y2={835} p={cycle} bend={-56} color={colors.error} width={6} />
      </Svg>
      <Abs x={980} y={705} w={820} h={175} style={{ opacity: atoms }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 22, boxSizing: "border-box", position: "relative" }}>
          <div style={{ position: "absolute", left: 28, top: 24, width: 330, fontFamily: fonts.mono, fontSize: 22, lineHeight: 1.25, color: colors.onDark }}>
            {t({ ja: "スレッド1", en: "Thread 1" })} → atomic_increment()
          </div>
          <div style={{ position: "absolute", right: 28, top: 24, width: 330, textAlign: "right", fontFamily: fonts.mono, fontSize: 22, lineHeight: 1.25, color: colors.onDark }}>
            atomic_decrement() ← {t({ ja: "スレッド2", en: "Thread 2" })}
          </div>
          <div style={{ position: "absolute", left: 350, top: 62 }}>
            <Chip tone="amber" size={24}>ref_count</Chip>
          </div>
          <div style={{ position: "absolute", left: 210, bottom: 12 }}>
            <Chip tone="amber" size={20}>{t({ ja: "共有オブジェクトの更新はアトミックに", en: "shared objects need atomic updates" })}</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Tracing                                                                */
/* ------------------------------------------------------------------------ */

export function TracingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const nodes: Obj[] = [
    { id: "A", x: 750, y: 330 },
    { id: "B", x: 960, y: 270 },
    { id: "C", x: 1130, y: 410 },
    { id: "D", x: 880, y: 530 },
    { id: "E", x: 1240, y: 600 },
    { id: "F", x: 1450, y: 350 },
    { id: "G", x: 1530, y: 550 },
    { id: "H", x: 1650, y: 430 },
    { id: "I", x: 1390, y: 710 },
  ];
  const live = new Set(["A", "B", "C", "D", "E"]);
  const edges: Edge[] = [
    { from: "A", to: "B" },
    { from: "A", to: "D" },
    { from: "B", to: "C" },
    { from: "D", to: "E" },
    { from: "F", to: "G" },
    { from: "G", to: "H" },
    { from: "H", to: "F" },
  ];
  const mark = progress(frame, cues[0] + 34, 110, (x) => x);
  const garbage = progress(frame, cues[1] + 20, 24);
  const liveOrder = ["A", "B", "D", "C", "E"];
  return (
    <SceneShell kicker={{ ja: "トレース方式", en: "Tracing" }} title={{ ja: "ルートから、たどれるか", en: "Reachable from the roots?" }}>
      <Abs x={120} y={285} w={430} h={380}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <SectionLabel>{t({ ja: "ルートセット", en: "Root set" })}</SectionLabel>
          {[
            { ja: "スタック", en: "stack" },
            { ja: "グローバル変数", en: "globals" },
            { ja: "レジスタ", en: "registers" },
          ].map((label, i) => (
            <div key={label.en} style={{ marginTop: 28 }}>
              <Chip tone="ink" size={28}>{t(label)}</Chip>
              {i < 2 && <span style={{ marginLeft: 18, fontFamily: fonts.mono, fontSize: 26, color: colors.coral }}>→ {i === 0 ? "A" : "D"}</span>}
            </div>
          ))}
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={500} y1={400} x2={710} y2={330} p={progress(frame, cues[0] + 12, 20)} color={colors.teal} width={5} />
        <Arrow x1={500} y1={492} x2={840} y2={530} p={progress(frame, cues[0] + 20, 20)} color={colors.teal} width={5} />
      </Svg>
      <Graph
        objects={nodes}
        edges={edges}
        colorOf={(id) => (live.has(id) ? (liveOrder.indexOf(id) / liveOrder.length <= mark ? "teal" : "white") : garbage ? "red" : "white")}
        edgeColorOf={(e) => (live.has(e.from) && live.has(e.to) && mark > 0.2 ? colors.teal : colors.hairlineStrong)}
        edgeProgress={(e, i) => progress(frame, cues[0] + 18 + i * 9, 18)}
      />
      {garbage > 0 && (
        <>
          <Svg>
            {["F", "G", "H", "I"].map((id) => {
              const n = nodes.find((o) => o.id === id);
              if (!n) return null;
              return <line key={id} x1={n.x - 48} y1={n.y + 48} x2={n.x + 48} y2={n.y - 48} stroke={colors.error} strokeWidth={5} opacity={garbage} />;
            })}
          </Svg>
          <Abs x={1230} y={785} w={560} style={{ display: "flex", justifyContent: "flex-end" }}>
            <Chip tone="teal" size={28}>{t({ ja: "循環参照も回収できる", en: "cycles are collected too" })}</Chip>
          </Abs>
        </>
      )}
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Tri-color mark & sweep                                                 */
/* ------------------------------------------------------------------------ */

const TRI_NODES: Obj[] = [
  { id: "A", x: 680, y: 400 },
  { id: "B", x: 900, y: 315 },
  { id: "C", x: 1120, y: 400 },
  { id: "D", x: 870, y: 590 },
  { id: "E", x: 1120, y: 620 },
  { id: "F", x: 1370, y: 520 },
  { id: "G", x: 1540, y: 700 },
  { id: "H", x: 1630, y: 440 },
];
const TRI_EDGES: Edge[] = [
  { from: "A", to: "B" },
  { from: "A", to: "D" },
  { from: "B", to: "C" },
  { from: "D", to: "E" },
  { from: "E", to: "F" },
  { from: "H", to: "G" },
];
const TRI_STEPS = [
  { gray: ["A"], black: [], work: ["A"] },
  { gray: ["B", "D"], black: ["A"], work: ["B", "D"] },
  { gray: ["D", "C"], black: ["A", "B"], work: ["D", "C"] },
  { gray: ["C", "E"], black: ["A", "B", "D"], work: ["C", "E"] },
  { gray: ["E"], black: ["A", "B", "C", "D"], work: ["E"] },
  { gray: ["F"], black: ["A", "B", "C", "D", "E"], work: ["F"] },
  { gray: [], black: ["A", "B", "C", "D", "E", "F"], work: [] },
];

export function TricolorScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const start = cueAt(cues, 1);
  const stepIndex = Math.min(TRI_STEPS.length - 1, Math.max(0, Math.floor((frame - start) / 38)));
  const state = frame < start ? TRI_STEPS[0] : TRI_STEPS[stepIndex];
  const sweep = progress(frame, cues[2] + 34, 28);
  const invariant = progress(frame, cues[3], 18);
  const garbage = new Set(["G", "H"]);
  const scanning = frame >= start ? TRI_STEPS[Math.max(0, stepIndex - 1)]?.work[0] : undefined;
  const colorOf = (id: string): GcColor => {
    if (sweep > 0 && garbage.has(id)) return "red";
    if (state.black.includes(id)) return "black";
    if (state.gray.includes(id)) return "gray";
    return "white";
  };
  return (
    <SceneShell kicker={{ ja: "三色マーク&スイープ", en: "Tri-color mark & sweep" }} title={{ ja: "白・灰・黒で塗り分ける", en: "Paint it white, gray, black" }}>
      <Abs x={120} y={218} w={900} style={{ display: "flex", justifyContent: "flex-start", gap: 10 }}>
        <Appear at={cues[0] + 4}>
          <Chip size={22}>{t({ ja: "白 = 未発見", en: "white = not yet found" })}</Chip>
        </Appear>
        <Appear at={cues[0] + 14}>
          <Chip tone="amber" size={22}>{t({ ja: "灰 = スキャン待ち", en: "gray = to be scanned" })}</Chip>
        </Appear>
        <Appear at={cues[0] + 24}>
          <Chip tone="ink" size={22}>{t({ ja: "黒 = スキャン済み", en: "black = scanned" })}</Chip>
        </Appear>
      </Abs>
      <Abs x={120} y={315} w={360} h={350}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box" }}>
          <SectionLabel>{t({ ja: "灰色ワークリスト", en: "gray worklist" })}</SectionLabel>
          <div style={{ marginTop: 26, display: "flex", flexDirection: "column-reverse", gap: 12, alignItems: "stretch" }}>
            {state.work.length === 0 ? (
              <div style={{ height: 64, borderRadius: 12, border: `3px dashed ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Chip tone="teal" size={26}>{t({ ja: "空", en: "empty" })}</Chip>
              </div>
            ) : (
              state.work.map((id, i) => (
                <div
                  key={id}
                  style={{
                    height: 58,
                    borderRadius: 12,
                    background: i === 0 ? colors.amberSoft : "#fff",
                    border: `3px solid ${i === 0 ? colors.amber : colors.hairlineStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 30,
                    fontWeight: 900,
                    color: colors.ink,
                    transform: `translateY(${(1 - progress(frame, start + stepIndex * 38, 12)) * 10}px)`,
                  }}
                >
                  {id}
                </div>
              ))
            )}
          </div>
          <div style={{ position: "absolute", right: 24, bottom: 18, fontFamily: fonts.sans, fontSize: 20, color: colors.muted }}>
            {t({ ja: "上から pop", en: "pop from top" })}
          </div>
        </Card>
      </Abs>
      <Abs x={470} y={382} w={112} h={72}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 14,
            background: colors.tealSoft,
            border: `3px solid ${colors.teal}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.sans,
            fontSize: 27,
            fontWeight: 900,
            color: colors.tealDeep,
          }}
        >
          {t({ ja: "ルート", en: "Roots" })}
        </div>
      </Abs>
      <Svg>
        <Arrow x1={582} y1={418} x2={630} y2={400} p={progress(frame, cues[0] + 18, 18)} color={colors.teal} width={5} />
        {invariant > 0 && (
          <>
            <Arrow x1={680} y1={400} x2={1630} y2={440} p={invariant} color={colors.error} width={6} dashed />
            <line x1={1095} y1={376} x2={1210} y2={466} stroke={colors.error} strokeWidth={8} opacity={invariant} />
          </>
        )}
        {scanning && (() => {
          const n = TRI_NODES.find((o) => o.id === scanning);
          return n ? <circle cx={n.x} cy={n.y} r={64} fill="none" stroke={colors.coral} strokeWidth={6} opacity={1 - progress(frame, start + stepIndex * 38 + 26, 10)} /> : null;
        })()}
      </Svg>
      <Graph
        objects={TRI_NODES}
        edges={TRI_EDGES}
        colorOf={colorOf}
        edgeColorOf={(e) => (state.black.includes(e.from) || state.gray.includes(e.from) ? colors.teal : colors.hairlineStrong)}
        edgeProgress={(e, i) => progress(frame, cues[0] + 28 + i * 9, 16)}
        nodeSize={96}
      />
      {sweep > 0 && (
        <Abs x={1260} y={745} style={{ opacity: sweep * (1 - invariant) }}>
          <Chip tone="error" size={29}>{t({ ja: "白のまま → 解放", en: "still white → freed" })}</Chip>
        </Abs>
      )}
      {invariant > 0 && (
        <Abs x={770} y={735} w={800} style={{ textAlign: "center" }}>
          <Chip tone="error" size={30}>{t({ ja: "黒 → 白 を直接指さない", en: "black never points directly to white" })}</Chip>
        </Abs>
      )}
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Compaction and copying                                                 */
/* ------------------------------------------------------------------------ */

function HeapBlock({ x, y, w, label, live = true, moved = 0 }: { x: number; y: number; w: number; label: string; live?: boolean; moved?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x + moved,
        top: y,
        width: w,
        height: 76,
        borderRadius: 10,
        background: live ? colors.tealSoft : colors.surfaceCard,
        border: `3px solid ${live ? colors.teal : colors.hairlineStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.mono,
        fontSize: 23,
        fontWeight: 700,
        color: live ? colors.tealDeep : colors.mutedSoft,
      }}
    >
      {label}
    </div>
  );
}

export function CompactScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const compact = progress(frame, cues[1] + 10, 46);
  const copy = progress(frame, cues[2] + 8, 36);
  const blocks = [
    { x: 60, w: 190, label: "A", live: true, dest: 0 },
    { x: 280, w: 150, label: "hole", live: false, dest: 0 },
    { x: 460, w: 250, label: "B", live: true, dest: -190 },
    { x: 740, w: 150, label: "hole", live: false, dest: 0 },
    { x: 920, w: 210, label: "C", live: true, dest: -420 },
    { x: 1160, w: 160, label: "hole", live: false, dest: 0 },
  ];
  return (
    <SceneShell kicker={{ ja: "断片化への対策", en: "Fighting fragmentation" }} title={{ ja: "詰めるか、コピーするか", en: "Compact, or copy" }}>
      <Abs x={120} y={270} w={1680} h={230}>
        <Card tone="white" style={{ width: "100%", height: "100%", position: "relative" }}>
          <SectionLabel style={{ position: "absolute", left: 28, top: 22 }}>{t({ ja: "Sweep 後のヒープ", en: "Heap after sweep" })}</SectionLabel>
          {blocks.map((b) => (
            <HeapBlock key={b.x} x={b.x} y={98} w={b.w} label={b.live ? b.label : ""} live={b.live} moved={b.live ? b.dest * compact : 0} />
          ))}
          <div
            style={{
              position: "absolute",
              left: 1370,
              top: 98,
              width: 280,
              height: 76,
              borderRadius: 10,
              background: colors.errorSoft,
              border: `3px dashed ${colors.error}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.sans,
              fontSize: 23,
              fontWeight: 800,
              color: colors.error,
            }}
          >
            {t({ ja: "大きな新規オブジェクト", en: "large new object" })}
          </div>
        </Card>
      </Abs>
      <Abs x={1415} y={452} style={{ opacity: 1 - compact }}>
        <Chip tone="error" size={24}>{t({ ja: "連続領域が足りない", en: "no contiguous space" })}</Chip>
      </Abs>
      <Svg>
        <Arrow x1={810} y1={518} x2={810} y2={610} p={compact} color={colors.coral} width={5} />
      </Svg>
      <Abs x={120} y={595} w={770} h={245} style={{ opacity: compact }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <SectionLabel>{t({ ja: "Mark-Compact", en: "Mark-Compact" })}</SectionLabel>
          <pre style={{ marginTop: 24, fontFamily: fonts.mono, fontSize: 27, lineHeight: 1.5, color: colors.ink }}>
            {"alloc(size):\n    result = ptr\n    ptr += size"}
          </pre>
          <div style={{ position: "absolute", right: 26, bottom: 24 }}>
            <Chip tone="teal" size={24}>{t({ ja: "バンプポインタ割り当て", en: "bump-pointer allocation" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={980} y={555} w={820} h={290} style={{ opacity: copy }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box", position: "relative" }}>
          <SectionLabel>{t({ ja: "コピー / Semispace", en: "Copying / Semispace" })}</SectionLabel>
          {[
            { label: "From", x: 30, clear: copy > 0.8 },
            { label: "To", x: 430, clear: false },
          ].map((space) => (
            <div key={space.label} style={{ position: "absolute", left: space.x, top: 90, width: 340, height: 130 }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 800, color: colors.muted }}>{space.label}</div>
              <div style={{ marginTop: 10, height: 82, borderRadius: 12, background: space.clear ? colors.surfaceCard : colors.surfaceSoft, border: `3px solid ${colors.hairlineStrong}` }}>
                {!space.clear &&
                  ["A", "B", "C"].map((id, i) => (
                    <div
                      key={id}
                      style={{
                        position: "absolute",
                        left: space.label === "To" ? 30 + i * 88 : 30 + i * 95,
                        top: 50,
                        width: 72,
                        height: 58,
                        borderRadius: 8,
                        background: space.label === "To" ? colors.tealSoft : colors.surfaceCream,
                        border: `2px solid ${space.label === "To" ? colors.teal : colors.hairlineStrong}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: fonts.mono,
                        fontSize: 21,
                        fontWeight: 800,
                        opacity: space.label === "To" ? progress(frame, cues[2] + 12 + i * 14, 12) : 1 - copy,
                      }}
                    >
                      {id}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div style={{ position: "absolute", right: 28, bottom: 24 }}>
            <Chip tone="amber" size={23}>{t({ ja: "使えるのはヒープの半分", en: "only half the heap is usable" })}</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. Generational                                                           */
/* ------------------------------------------------------------------------ */

export function GenerationalScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const vanish = progress(frame, cues[0] + 38, 70, (x) => x);
  const minor = progress(frame, cues[1] + 16, 38);
  const promote = progress(frame, cues[2] + 18, 44);
  const dots = Array.from({ length: 72 }, (_, i) => ({ x: 50 + (i % 12) * 56, y: 94 + Math.floor(i / 12) * 48, alive: i % 13 === 0 || i === 15 || i === 34 }));
  return (
    <SceneShell kicker={{ ja: "世代別GC", en: "Generational GC" }} title={{ ja: "ほとんどは若くして死ぬ", en: "Most objects die young" }}>
      <Abs x={120} y={250} w={760} h={535}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <SectionLabel>{t({ ja: "弱い世代仮説", en: "Weak generational hypothesis" })}</SectionLabel>
          {dots.map((d, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: d.x,
                top: d.y,
                width: 26,
                height: 26,
                borderRadius: 13,
                background: d.alive ? colors.teal : mixColor(colors.coral, colors.surfaceCard, vanish),
                opacity: d.alive ? 1 : Math.max(0.18, 1 - vanish),
              }}
            />
          ))}
          <div style={{ position: "absolute", right: 30, bottom: 28 }}>
            <Chip tone="coral" size={28}>{t({ ja: "80〜95% が最初のGCまでに不要", en: "80–95% die before the first GC" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={980} y={250} w={820} h={535}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box", position: "relative" }}>
          <SectionLabel>{t({ ja: "ヒープを世代で分ける", en: "Split the heap by age" })}</SectionLabel>
          <div style={{ position: "absolute", left: 34, top: 100, width: 380, height: 340, borderRadius: 16, background: colors.coralSoft, border: `3px solid ${colors.coral}` }}>
            <div style={{ padding: 18, fontFamily: fonts.sans, fontSize: 27, fontWeight: 800, color: colors.coralDeep }}>Young</div>
            <div style={{ marginLeft: 18, display: "flex", gap: 12 }}>
              <Chip tone="coral" size={22}>Eden</Chip>
              <Chip tone="amber" size={22}>Survivor</Chip>
            </div>
            <div style={{ position: "absolute", left: 28, bottom: 24 }}>
              <Chip tone="teal" size={23}>{t({ ja: "Minor GC: 数ミリ秒", en: "Minor GC: a few ms" })}</Chip>
            </div>
          </div>
          <div style={{ position: "absolute", right: 34, top: 100, width: 330, height: 340, borderRadius: 16, background: colors.surfaceCard, border: `3px solid ${colors.hairlineStrong}` }}>
            <div style={{ padding: 18, fontFamily: fonts.sans, fontSize: 27, fontWeight: 800, color: colors.body }}>Old</div>
            <div style={{ position: "absolute", left: 28, bottom: 24, opacity: promote }}>
              <Chip tone="amber" size={22}>{t({ ja: "Major GC: 数十〜数百ミリ秒", en: "Major GC: tens to hundreds of ms" })}</Chip>
            </div>
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={1190} y1={516} x2={1285} y2={516} p={minor} color={colors.teal} width={6} />
        <Arrow x1={1395} y1={505} x2={1530} y2={505} p={promote} color={colors.amber} width={6} />
      </Svg>
      <Abs x={120} y={810} w={1680} style={{ display: "flex", justifyContent: "center", gap: 18 }}>
        <Appear at={cues[2] + 12}>
          <Chip tone="amber" size={27}>{t({ ja: "昇格（promotion）", en: "promotion" })}</Chip>
        </Appear>
        <Appear at={cues[2] + 34}>
          <Chip tone="muted" size={27}>{t({ ja: "リメンバードセット（カードテーブル）", en: "remembered set (card table)" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Concurrent GC and write barriers                                       */
/* ------------------------------------------------------------------------ */

function TimelineBars({ frame, cue }: { frame: number; cue: number }) {
  const t = useT();
  const p = progress(frame, cue + 6, 70, (x) => x);
  return (
    <Abs x={120} y={260} w={820} h={240}>
      <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
        <SectionLabel>{t({ ja: "停止型と並行GC", en: "Stop-The-World vs concurrent" })}</SectionLabel>
        {[
          { y: 82, label: t({ ja: "STW", en: "STW" }), pauseX: 250, pauseW: 260 },
          { y: 158, label: t({ ja: "並行", en: "concurrent" }), pauseX: 210, pauseW: 54 },
        ].map((r, i) => (
          <div key={r.label}>
            <div style={{ position: "absolute", left: 28, top: r.y + 5, fontFamily: fonts.mono, fontSize: 22, color: colors.muted }}>{r.label}</div>
            <div style={{ position: "absolute", left: 180, top: r.y, width: 570, height: 34, borderRadius: 17, background: colors.tealSoft, overflow: "hidden" }}>
              <div style={{ width: `${p * 100}%`, height: "100%", background: colors.teal }} />
              <div style={{ position: "absolute", left: r.pauseX, top: 0, width: r.pauseW, height: "100%", background: i === 0 ? colors.error : colors.amber }} />
              {i === 1 && <div style={{ position: "absolute", left: 315, top: 9, width: 220, height: 16, borderRadius: 8, background: colors.coral, opacity: 0.75 }} />}
            </div>
          </div>
        ))}
      </Card>
    </Abs>
  );
}

export function BarrierScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const lost = progress(frame, cues[1], 18);
  const barrier = progress(frame, cues[2], 18);
  const go = progress(frame, cues[3], 18);
  const cColor: GcColor = barrier > 0 ? "gray" : lost > 0.65 ? "red" : "white";
  const write1 = progress(frame, cues[1] + 18, 12);
  const write2 = progress(frame, cues[1] + 66, 12);
  return (
    <SceneShell kicker={{ ja: "並行GCと書き込みバリア", en: "Concurrent GC & write barriers" }} title={{ ja: "動かしながら、正しく塗る", en: "Marking while the program runs" }}>
      <TimelineBars frame={frame} cue={cues[0]} />
      <Abs x={1040} y={250} w={760} h={390}>
        <Card
          tone="white"
          accent={frame >= cues[2] ? colors.teal : lost ? colors.error : colors.hairline}
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          <div style={{ position: "absolute", left: 36, top: 22, fontFamily: fonts.sans, fontSize: 24, fontWeight: 800, color: colors.ink }}>
            {t({ ja: "ミューテータの書き換え", en: "Mutator writes" })}
          </div>
          {[
            { code: "A.field = C", p: write1, y: 62 },
            { code: "B.field = nil", p: write2, y: 112 },
          ].map((line) => (
            <div
              key={line.code}
              style={{
                position: "absolute",
                left: 36,
                top: line.y,
                width: 250,
                height: 40,
                borderRadius: 9,
                background: line.p > 0 && line.p < 1 ? colors.coralSoft : line.p >= 1 ? colors.surfaceSoft : "transparent",
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                boxSizing: "border-box",
                fontFamily: fonts.mono,
                fontSize: 24,
                fontWeight: 800,
                color: line.p > 0 ? colors.coralDeep : colors.mutedSoft,
                opacity: lost,
              }}
            >
              {line.code}
            </div>
          ))}
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={1640} y1={430} x2={1510} y2={522} p={1 - progress(frame, cues[1] + 70, 14)} color={colors.amber} width={5} />
        <Arrow x1={1400} y1={430} x2={1510} y2={522} p={progress(frame, cues[1] + 22, 18)} color={barrier ? colors.teal : colors.error} width={6} dashed={barrier === 0} />
      </Svg>
      <ObjNode obj={{ id: "A", x: 1400, y: 385 }} color="black" size={104} />
      <ObjNode obj={{ id: "B", x: 1640, y: 385 }} color="gray" size={104} />
      <ObjNode obj={{ id: "C", x: 1510, y: 568 }} color={cColor} size={104} />
      <Abs x={1060} y={655} style={{ opacity: frame < cues[2] ? lost : 0 }}>
        <Chip tone="error" size={24}>{t({ ja: "生きているのに解放！", en: "freed while still live!" })}</Chip>
      </Abs>
      <Abs x={1060} y={655} style={{ opacity: frame >= cues[2] ? Math.max(0.9, barrier) : 0 }}>
        <Chip tone="teal" size={24}>{t({ ja: "バリアで灰色に → 生存", en: "shaded by the barrier → survives" })}</Chip>
      </Abs>
      <Abs x={120} y={540} w={820} h={250} style={{ opacity: barrier }}>
        <CodeCard
          title={t({ ja: "ヒープポインタ書き込みバリア", en: "Heap pointer write barrier" })}
          lines={["writeBarrier(A, field, C):", "    shade(C)", "    A.field = C"]}
          accent={colors.teal}
        />
      </Abs>
      <Abs x={1030} y={730} w={760} style={{ display: "flex", justifyContent: "flex-end", gap: 12, flexWrap: "wrap", opacity: go }}>
        <Chip tone="coral" size={24}>{t({ ja: "Dijkstra（挿入）+ Yuasa（削除）", en: "Dijkstra (insertion) + Yuasa (deletion)" })}</Chip>
        <Chip tone="teal" size={24}>{t({ ja: "スタック再スキャン不要", en: "no stack rescan" })}</Chip>
        <Chip tone="amber" size={24}>{t({ ja: "STW: 典型的にサブミリ秒", en: "pauses typically sub-millisecond" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Language strategies                                                    */
/* ------------------------------------------------------------------------ */

type LangRow = { lang: string; approach: Bilingual; gen: string; conc: string; group: "go" | "managed" | "nogc" };
const LANG_ROWS: LangRow[] = [
  { lang: "Go", approach: { ja: "並行三色M&S", en: "Tri-color M&S" }, gen: "No", conc: "Yes", group: "go" },
  { lang: "Java", approach: { ja: "選択式 (G1/ZGC/Shenandoah)", en: "Selectable (G1/ZGC/Shenandoah)" }, gen: "Yes", conc: "Yes", group: "managed" },
  { lang: "Python", approach: { ja: "参照カウント + トレース", en: "Ref counting + tracing" }, gen: "Yes (3 gen)", conc: "No", group: "managed" },
  { lang: "JavaScript (V8)", approach: { ja: "コピー + M&S/Compact", en: "Copying + M&S/Compact" }, gen: "Yes", conc: "Yes", group: "managed" },
  { lang: ".NET", approach: { ja: "世代別M&C", en: "Generational M&C" }, gen: "Yes (3 gen+LOH)", conc: "Yes", group: "managed" },
  { lang: "Rust", approach: { ja: "所有権", en: "Ownership" }, gen: "—", conc: "—", group: "nogc" },
  { lang: "Swift", approach: { ja: "ARC", en: "ARC" }, gen: "—", conc: "—", group: "nogc" },
];

export function LanguagesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const phase = frame >= cues[2] ? "nogc" : frame >= cues[1] ? "managed" : "go";
  const y0 = 255;
  const rowH = 72;
  const widths = [230, 850, 300, 300];
  return (
    <SceneShell kicker={{ ja: "言語ごとの戦略", en: "Language strategies" }} title={{ ja: "それぞれのトレードオフ", en: "Different trade-offs" }}>
      <Abs x={120} y={y0} w={1680} h={rowH * (LANG_ROWS.length + 1)}>
        <Card tone="white" style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          {[
            t({ ja: "言語", en: "Language" }),
            t({ ja: "GC方式", en: "Approach" }),
            t({ ja: "世代別", en: "Generational" }),
            t({ ja: "並行", en: "Concurrent" }),
          ].map((h, i) => (
            <div
              key={h}
              style={{
                position: "absolute",
                left: widths.slice(0, i).reduce((a, b) => a + b, 0),
                top: 0,
                width: widths[i],
                height: rowH,
                background: colors.dark,
                color: colors.onDark,
                display: "flex",
                alignItems: "center",
                paddingLeft: 24,
                boxSizing: "border-box",
                fontFamily: fonts.sans,
                fontSize: 25,
                fontWeight: 800,
              }}
            >
              {h}
            </div>
          ))}
          {LANG_ROWS.map((r, ri) => {
            const hot = r.group === phase;
            const top = rowH * (ri + 1);
            return (
              <div key={r.lang} style={{ position: "absolute", left: 0, top, width: "100%", height: rowH, background: hot ? colors.coralSoft : ri % 2 ? colors.surfaceSoft : "#fff", transition: "background 0.2s" }}>
                {[r.lang, t(r.approach), r.gen, r.conc].map((v, i) => (
                  <div
                    key={`${r.lang}-${i}`}
                    style={{
                      position: "absolute",
                      left: widths.slice(0, i).reduce((a, b) => a + b, 0),
                      top: 0,
                      width: widths[i],
                      height: rowH,
                      borderBottom: `2px solid ${colors.hairline}`,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 24,
                      boxSizing: "border-box",
                      fontFamily: i === 0 ? fonts.mono : fonts.sans,
                      fontSize: i === 1 ? 23 : 25,
                      fontWeight: hot || i === 0 ? 800 : 500,
                      color: hot ? colors.coralDeep : colors.body,
                    }}
                  >
                    {v}
                  </div>
                ))}
              </div>
            );
          })}
        </Card>
      </Abs>
      <Abs x={120} y={852} w={1680} style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <Chip tone={phase === "go" ? "coral" : "muted"} size={25}>{t({ ja: "Go: 非世代別・非コンパクション", en: "Go: non-generational · non-compacting" })}</Chip>
        <Chip tone={phase === "managed" ? "coral" : "muted"} size={25}>{t({ ja: "Java / V8 / .NET / Python: 世代別中心", en: "Java / V8 / .NET / Python: mostly generational" })}</Chip>
        <Chip tone={phase === "nogc" ? "coral" : "muted"} size={25}>{t({ ja: "Rust / Swift: トレースGCなし", en: "Rust / Swift: no tracing GC" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Outro                                                                  */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const t = useT();
  return (
    <EndCard slug="garbage-collection" headline={{ ja: "GCは、ランタイム設計を左右する判断。", en: "GC is a defining runtime design decision." }}>
      <div style={{ marginTop: 42, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 1200 }}>
        {[
          { ja: "シンプルさ", en: "simplicity" },
          { ja: "正確さ", en: "completeness" },
          { ja: "スループット", en: "throughput" },
          { ja: "停止時間", en: "pause time" },
        ].map((c, i) => (
          <Appear key={c.en} at={18 + i * 8}>
            <Chip tone={i % 2 ? "teal" : "coral"} size={30}>
              {t(c)}
            </Chip>
          </Appear>
        ))}
      </div>
    </EndCard>
  );
}
