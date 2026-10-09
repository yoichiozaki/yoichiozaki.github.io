import { useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Tone = "coral" | "teal" | "amber" | "ink" | "muted" | "error";

function L({ ja, en }: Bilingual) {
  const t = useT();
  return <>{t({ ja, en })}</>;
}

function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  tone = "muted",
  opacity = 1,
  scale = 1,
  mono = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: Bilingual;
  sub?: Bilingual;
  tone?: Tone;
  opacity?: number;
  scale?: number;
  mono?: boolean;
}) {
  const t = useT();
  const palette = {
    coral: [colors.coralSoft, colors.coral],
    teal: [colors.tealSoft, colors.teal],
    amber: [colors.amberSoft, colors.amber],
    ink: [colors.dark, colors.darkElevated],
    muted: ["#ffffff", colors.hairlineStrong],
    error: [colors.errorSoft, colors.error],
  } as const;
  const [bg, border] = palette[tone];
  return (
    <Abs x={x} y={y} w={w} h={h} style={{ opacity, transform: `scale(${scale})`, transformOrigin: "center" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          border: `3px solid ${border}`,
          background: bg,
          color: tone === "ink" ? colors.onDark : colors.ink,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          boxSizing: "border-box",
          padding: 16,
          boxShadow: "0 12px 28px rgba(20,20,19,0.06)",
        }}
      >
        <div style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: 30, fontWeight: 700, lineHeight: 1.16 }}>{t(label)}</div>
        {sub && <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 22, color: tone === "ink" ? colors.onDarkSoft : colors.muted, lineHeight: 1.25 }}>{t(sub)}</div>}
      </div>
    </Abs>
  );
}

function PhaseChip({ x, y, text, tone = "coral", at = 0 }: { x: number; y: number; text: Bilingual; tone?: Tone; at?: number }) {
  const frame = useCurrentFrame();
  return (
    <Abs x={x} y={y} style={{ opacity: progress(frame, at, 14), transform: `translateY(${(1 - progress(frame, at, 14)) * 10}px)` }}>
      <Chip tone={tone} size={26}>
        <L {...text} />
      </Chip>
    </Abs>
  );
}


function SmallTable({
  x,
  y,
  rows,
  visible = 1,
  highlight,
}: {
  x: number;
  y: number;
  rows: { a: Bilingual; b: Bilingual; c?: Bilingual; tone?: Tone }[];
  visible?: number;
  highlight?: number;
}) {
  const t = useT();
  return (
    <Abs x={x} y={y} w={760} h={rows.length * 70} style={{ opacity: visible }}>
      {rows.map((r, i) => {
        const active = highlight === i;
        const bg = active ? (r.tone === "teal" ? colors.tealSoft : r.tone === "coral" ? colors.coralSoft : colors.amberSoft) : "#fff";
        return (
          <div
            key={i}
            style={{
              height: 62,
              marginBottom: 10,
              borderRadius: 12,
              border: `2px solid ${active ? (r.tone === "teal" ? colors.teal : colors.coral) : colors.hairlineStrong}`,
              background: bg,
              display: "grid",
              gridTemplateColumns: r.c ? "1fr 1fr 1fr" : "1fr 1fr",
              alignItems: "center",
              padding: "0 20px",
              boxSizing: "border-box",
              fontFamily: fonts.sans,
              fontSize: 25,
              color: colors.body,
            }}
          >
            <b style={{ color: colors.ink }}>{t(r.a)}</b>
            <span>{t(r.b)}</span>
            {r.c && <span style={{ textAlign: "right", fontFamily: fonts.mono, fontWeight: 700 }}>{t(r.c)}</span>}
          </div>
        );
      })}
    </Abs>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stages = [
    { ja: "SQL", en: "SQL" },
    { ja: "字句解析", en: "Lex" },
    { ja: "構文解析", en: "Parse" },
    { ja: "束縛", en: "Bind" },
    { ja: "最適化", en: "Optimize" },
    { ja: "実行", en: "Execute" },
    { ja: "ページ", en: "Pages" },
    { ja: "pread", en: "pread" },
  ];
  return (
    <TitleCard
      title={{ ja: "SQLはどうやって\nバイト列に届くのか", en: "How SQL Reaches\nBytes on Disk" }}
      subtitle={{ ja: "1本のSELECT文を、クエリエンジンの上から下まで追いかける", en: "Following one SELECT through the query engine, top to bottom" }}
      art={
        <>
          <Svg>
            {stages.slice(0, -1).map((_, i) => (
              <Arrow key={i} x1={1488} y1={245 + i * 70} x2={1488} y2={283 + i * 70} p={progress(frame, 26 + i * 7, 12)} color={colors.coral} width={4} />
            ))}
          </Svg>
          {stages.map((s, i) => {
            const p = pop(frame, 10 + i * 5, fps);
            return (
              <Box
                key={i}
                x={1260 + (i % 2) * 150}
                y={190 + i * 70}
                w={300}
                h={58}
                label={s}
                tone={i < 4 ? "coral" : i < 6 ? "amber" : "teal"}
                opacity={Math.min(1, p)}
                scale={0.8 + Math.min(1, p) * 0.2}
              />
            );
          })}
          <Abs x={1218} y={780} w={560} h={86} style={{ opacity: progress(frame, 72, 20) }}>
            <Card tone="dark" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.onDarkSoft }}>fd=42</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.onDark }}>8192 B</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.coral }}>34,988,032</span>
            </Card>
          </Abs>
        </>
      }
    />
  );
}

export function FrontendScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const sqlIn = progress(frame, cues[0] + 4, 16);
  const tok = progress(frame, cues[0] + 28, 34);
  const hi = progress(frame, cues[1] + 4, 16);
  const ast = progress(frame, cues[2] + 4, 24);
  const tokens = ["SELECT", "name", "FROM", "users", "WHERE", "age", ">", "30"];
  const astNodes = [
    { id: "Select", x: 1260, y: 255, w: 300, tone: "coral" as Tone },
    { id: "Target", x: 1010, y: 430, w: 240, tone: "muted" as Tone },
    { id: "From", x: 1270, y: 430, w: 240, tone: "muted" as Tone },
    { id: "Where", x: 1530, y: 430, w: 240, tone: "amber" as Tone },
    { id: "ColRef", x: 1390, y: 605, w: 240, tone: "muted" as Tone },
    { id: "Const", x: 1670, y: 605, w: 240, tone: "muted" as Tone },
  ];
  return (
    <SceneShell kicker={{ ja: "フロントエンド", en: "Front end" }} title={{ ja: "文字列を、まず構文木へ", en: "From string to syntax tree" }}>
      <Abs x={120} y={245} w={740} h={200} style={{ opacity: sqlIn }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.onDarkSoft, marginBottom: 20 }}>
            <L ja="SQLテキスト" en="SQL text" />
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 35, color: colors.onDark, lineHeight: 1.35 }}>SELECT name FROM users{"\n"}WHERE age &gt; 30</div>
        </Card>
      </Abs>
      <Abs x={120} y={500} w={740} h={185}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {tokens.map((token, i) => {
            const p = Math.min(1, Math.max(0, tok * tokens.length - i));
            const active = token === ">" || token === "30" || token === "age";
            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `3px solid ${active && hi > 0 ? colors.coral : colors.hairlineStrong}`,
                  background: active && hi > 0 ? colors.coralSoft : "#fff",
                  fontFamily: fonts.mono,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {token}
              </div>
            );
          })}
        </div>
      </Abs>
      <Abs x={120} y={730} w={760} h={90} style={{ opacity: hi }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          <Chip tone="coral" size={25}>{">= → 1 token"}</Chip>
          <Chip tone="coral" size={25}>age30 → IDENT</Chip>
          <span style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>
            <L ja="空白がないと1つの語彙" en="no space means one lexeme" />
          </span>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={860} y1={345} x2={1110} y2={345} p={progress(frame, cues[2] - 8, 20)} color={colors.coral} width={5} />
        {ast > 0 &&
          [
            [1260, 347, 1010, 430],
            [1260, 347, 1270, 430],
            [1260, 347, 1530, 430],
            [1530, 522, 1390, 605],
            [1530, 522, 1670, 605],
          ].map(([x1, y1, x2, y2], i) => <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} p={Math.max(0, ast * 2 - 0.35)} color={colors.hairlineStrong} width={3} head={false} />)}
      </Svg>
      {astNodes.map((n, i) => (
        <Box key={n.id} x={n.x - n.w / 2} y={n.y} w={n.w} h={92} label={{ ja: n.id, en: n.id }} tone={n.tone} mono opacity={Math.max(0, Math.min(1, ast * 6 - i))} />
      ))}
      <PhaseChip x={1110} y={742} text={{ ja: "Pratt構文解析で演算子の優先順位を処理", en: "Pratt parsing handles operator precedence" }} tone="amber" at={cues[2] + 34} />
    </SceneShell>
  );
}

export function BindingLogicalScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const ast = progress(frame, cues[0], 16);
  const bind = progress(frame, cues[1] + 2, 26);
  const logical = progress(frame, cues[2] + 4, 22);
  return (
    <SceneShell kicker={{ ja: "束縛", en: "Binding" }} title={{ ja: "名前を、実体に結びつける", en: "Attach names to entities" }}>
      <Box x={130} y={245} w={430} h={150} label={{ ja: "未解決AST", en: "Unresolved AST" }} sub={{ ja: "ColRef(age)", en: "ColRef(age)" }} tone="amber" opacity={ast} mono />
      <Box x={130} y={480} w={430} h={230} label={{ ja: "カタログ", en: "Catalog" }} sub={{ ja: "users(id, name, age)\norders(id, user_id, total)", en: "users(id, name, age)\norders(id, user_id, total)" }} tone="muted" opacity={bind} mono />
      <Svg>
        <Arrow x1={560} y1={320} x2={770} y2={360} p={bind} color={colors.coral} width={5} />
        <Arrow x1={560} y1={585} x2={770} y2={420} p={bind} color={colors.coral} width={5} />
        <Arrow x1={1110} y1={400} x2={1260} y2={510} p={logical} color={colors.teal} width={5} />
      </Svg>
      <Box x={770} y={320} w={360} h={210} label={{ ja: "Varノード", en: "Var nodes" }} sub={{ ja: "表番号 varno\n列番号 varattno", en: "table number varno\ncolumn number varattno" }} tone="coral" opacity={bind} mono />
      <Abs x={1210} y={245} w={590} h={590} style={{ opacity: logical }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 42, fontWeight: 600, marginBottom: 22 }}>
            <L ja="論理プラン" en="Logical plan" />
          </div>
          {[
            ["Limit", "10"],
            ["Sort", "o.total DESC"],
            ["Project", "u.name, o.total"],
            ["Join", "u.id = o.user_id"],
            ["Scan", "users"],
            ["Scan", "orders"],
          ].map((r, i) => (
            <div key={i} style={{ marginLeft: Math.min(i, 4) * 34, marginBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
              <Chip tone={i < 3 ? "coral" : i === 3 ? "amber" : "teal"} size={24}>{r[0]}</Chip>
              <span style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.body }}>{r[1]}</span>
            </div>
          ))}
        </Card>
      </Abs>
      <PhaseChip x={715} y={720} text={{ ja: "以後の最適化は、名前ではなく位置で動く", en: "Later stages operate on positions, not names" }} tone="teal" at={cues[1] + 45} />
    </SceneShell>
  );
}

export function RewriteEstimateScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const push = progress(frame, cues[0] + 16, 50);
  const warn = progress(frame, cues[1], 18);
  const hist = progress(frame, cues[2] + 2, 24);
  const bars = [0.08, 0.12, 0.09, 0.11, 0.1, 0.14, 0.1, 0.09, 0.08, 0.09];
  return (
    <SceneShell kicker={{ ja: "書き換えと推定", en: "Rewrite & estimate" }} title={{ ja: "まず安全に小さくする", en: "Make the plan smaller, safely" }}>
      <Box x={150} y={250} w={330} h={98} label={{ ja: "Filter", en: "Filter" }} sub={{ ja: "age>30 AND total>100", en: "age>30 AND total>100" }} tone="coral" opacity={1 - push * 0.8} />
      <Box x={150} y={450} w={330} h={112} label={{ ja: "Join", en: "Join" }} sub={{ ja: "users ⋈ orders", en: "users ⋈ orders" }} tone="amber" />
      <Box x={80} y={685} w={280} h={112} label={{ ja: "Scan users", en: "Scan users" }} sub={{ ja: "filter: age > 30", en: "filter: age > 30" }} tone="muted" mono />
      <Box x={430} y={685} w={300} h={112} label={{ ja: "Scan orders", en: "Scan orders" }} sub={{ ja: "filter: total > 100", en: "filter: total > 100" }} tone="muted" mono />
      <Svg>
        <Arrow x1={315} y1={348} x2={315} y2={450} p={1 - push} color={colors.hairlineStrong} width={4} head={false} />
        <Arrow x1={315} y1={562} x2={220} y2={685} p={1} color={colors.hairlineStrong} width={4} head={false} />
        <Arrow x1={315} y1={562} x2={580} y2={685} p={1} color={colors.hairlineStrong} width={4} head={false} />
      </Svg>
      <Abs x={820} y={250} w={450} h={265} style={{ opacity: warn }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>
            <L ja="安全とは限らない" en="Not always safe" />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
            <Chip tone="error" size={26}>OR</Chip>
            <Chip tone="error" size={26}>NULL</Chip>
            <Chip tone="error" size={26}><L ja="外部結合" en="outer join" /></Chip>
          </div>
          <div style={{ marginTop: 24, fontFamily: fonts.sans, fontSize: 25, color: colors.body, lineHeight: 1.35 }}>
            <L ja="三値論理やNULL拡張で、同じ移動が答えを変えることがある。" en="Three-valued logic and NULL extension can change the answer." />
          </div>
        </Card>
      </Abs>
      <Abs x={1320} y={245} w={470} h={620} style={{ opacity: hist }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>
            <L ja="ヒストグラム" en="Histogram" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 12, height: 245, marginTop: 26, borderBottom: `3px solid ${colors.hairlineStrong}` }}>
            {bars.map((b, i) => {
              const above = i >= 5 || i === 4;
              return (
                <div key={i} style={{ width: 28, height: 220 * b * 5.5, background: above ? colors.coral : colors.surfaceCream, borderRadius: "6px 6px 0 0" }} />
              );
            })}
          </div>
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 32, fontWeight: 700, color: colors.coralDeep }}>age &gt; 30 → 0.55</div>
            <div style={{ marginTop: 16, fontFamily: fonts.serif, fontSize: 58, fontWeight: 600, color: colors.coral }}>
              55,000 / 100,000
            </div>
          </div>
        </Card>
      </Abs>
      <PhaseChip x={870} y={720} text={{ ja: "推定誤差は結合ごとに増幅する", en: "Estimation errors multiply through joins" }} tone="amber" at={cues[2] + 58} />
    </SceneShell>
  );
}

export function CostOptimizationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cost = progress(frame, cues[0] + 2, 20);
  const corr = progress(frame, cues[1] + 4, 20);
  const join = progress(frame, cues[2] + 2, 22);
  const rows = [
    { a: { ja: "NestedLoop", en: "NestedLoop" }, b: { ja: "users × 索引スキャン", en: "users × index scan" }, c: { ja: "2,651,875", en: "2,651,875" }, tone: "error" as Tone },
    { a: { ja: "MergeJoin", en: "MergeJoin" }, b: { ja: "両側をソート", en: "sort both sides" }, c: { ja: "38,323", en: "38,323" }, tone: "amber" as Tone },
    { a: { ja: "HashJoin", en: "HashJoin" }, b: { ja: "ビルド = users", en: "build = users" }, c: { ja: "25,688", en: "25,688" }, tone: "teal" as Tone },
  ];
  return (
    <SceneShell kicker={{ ja: "コストモデル", en: "Cost model" }} title={{ ja: "時間ではなく、相対スコアで比べる", en: "Compare relative scores, not time" }}>
      <Abs x={120} y={250} w={650} h={250} style={{ opacity: cost }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 32, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 34, lineHeight: 1.6 }}>
            <span style={{ color: colors.coral }}>seq_page_cost</span> = 1.0{"\n"}
            <span style={{ color: colors.coral }}>random_page_cost</span> = 4.0{"\n"}
            <span style={{ color: colors.coral }}>cpu_tuple_cost</span> = 0.01
          </div>
        </Card>
      </Abs>
      <Abs x={850} y={230} w={880} h={390} style={{ opacity: corr }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600 }}>
            <L ja="索引順と物理順" en="Index order vs. heap order" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 42, height: 170, marginTop: 62 }}>
            {[
              { h: 150, label: "0.0", cost: "4,000", tone: colors.error },
              { h: 113, label: "0.5", cost: "3,013", tone: colors.amber },
              { h: 24, label: "1.0", cost: "53", tone: colors.teal },
            ].map((b) => (
              <div key={b.label} style={{ width: 190, textAlign: "center" }}>
                <div style={{ height: b.h, borderRadius: "12px 12px 0 0", background: b.tone, margin: "0 auto", width: 110 }} />
                <div style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, marginTop: 10 }}>{b.cost}</div>
                <div style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>{t({ ja: `相関 ${b.label}`, en: `corr ${b.label}` })}</div>
              </div>
            ))}
            <div style={{ alignSelf: "center", fontFamily: fonts.serif, fontSize: 56, fontWeight: 700, color: colors.coralDeep }}>75×</div>
          </div>
        </Card>
      </Abs>
      <SmallTable x={540} y={640} rows={rows} visible={join} highlight={2} />
      <Abs x={120} y={640} w={340} h={250} style={{ opacity: join }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.onDark }}>
            <L ja="勝者" en="Winner" />
          </div>
          <div style={{ marginTop: 22, fontFamily: fonts.mono, fontSize: 42, fontWeight: 700, color: colors.teal }}>HashJoin</div>
          <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 26, color: colors.onDarkSoft, lineHeight: 1.25 }}>{t({ ja: "行数で順位が変わる", en: "row counts flip ranking" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function JoinOrderScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const states = progress(frame, cues[1] + 4, 20);
  const costs = progress(frame, cues[2] + 4, 22);
  const names = ["u", "o", "i", "p"];
  const subsets = Array.from({ length: 16 }, (_, i) => i);
  return (
    <SceneShell kicker={{ ja: "結合順序", en: "Join order" }} title={{ ja: "探索空間との戦い", en: "Fighting the search space" }}>
      <Abs x={120} y={245} w={640} h={570}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>
            <L ja="DPの状態" en="DP states" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 24 }}>
            {subsets.map((mask) => {
              const p = Math.min(1, Math.max(0, states * 18 - mask));
              const bits = names.filter((_, i) => mask & (1 << i)).join("") || "∅";
              return (
                <div
                  key={mask}
                  style={{
                    opacity: p,
                    height: 76,
                    borderRadius: 12,
                    background: mask === 15 ? colors.tealSoft : mask ? colors.coralSoft : colors.surfaceSoft,
                    border: `3px solid ${mask === 15 ? colors.teal : mask ? colors.coral : colors.hairlineStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 26,
                    fontWeight: 700,
                  }}
                >
                  {bits}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, fontFamily: fonts.sans, fontSize: 26, color: colors.body }}>
            <L ja="状態数は 2ⁿ。分割の列挙は O(3ⁿ)。" en="2ⁿ states. Split enumeration is O(3ⁿ)." />
          </div>
        </Card>
      </Abs>
      <Svg>
        {costs > 0 && (
          <>
            <Arrow x1={920} y1={365} x2={1340} y2={365} p={costs} color={colors.error} width={5} />
            <Arrow x1={920} y1={635} x2={1340} y2={635} p={costs} color={colors.teal} width={5} />
          </>
        )}
      </Svg>
      <Box x={850} y={275} w={240} h={180} label={{ ja: "書いた順序", en: "as written" }} sub={{ ja: "((u ⋈ o) ⋈ i) ⋈ p", en: "((u ⋈ o) ⋈ i) ⋈ p" }} tone="error" opacity={costs} mono />
      <Box x={1330} y={275} w={360} h={180} label={{ ja: "コスト", en: "cost" }} sub={{ ja: "605,000", en: "605,000" }} tone="error" opacity={costs} mono />
      <Box x={850} y={545} w={240} h={180} label={{ ja: "最適順序", en: "best order" }} sub={{ ja: "((i ⋈ p) ⋈ o) ⋈ u", en: "((i ⋈ p) ⋈ o) ⋈ u" }} tone="teal" opacity={costs} mono />
      <Box x={1330} y={545} w={360} h={180} label={{ ja: "コスト", en: "cost" }} sub={{ ja: "15,000", en: "15,000" }} tone="teal" opacity={costs} mono />
      <Abs x={1040} y={780} w={640} style={{ opacity: costs, textAlign: "center" }}>
        <Chip tone="teal" size={30}>
          <L ja="約40倍安い" en="roughly 40× cheaper" />
        </Chip>
      </Abs>
      <PhaseChip x={1010} y={195} text={{ ja: "最も選択的な表から始める、をコストで裏づける", en: "Cost backs the intuition: start from the most selective relation" }} tone="amber" at={cues[2] + 48} />
    </SceneShell>
  );
}

function PlanNode({ x, y, w, label, sub, tone = "muted", active = 1 }: { x: number; y: number; w: number; label: Bilingual; sub?: Bilingual; tone?: Tone; active?: number }) {
  return <Box x={x} y={y} w={w} h={96} label={label} sub={sub} tone={tone} opacity={active} />;
}

export function PhysicalPlanScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const build = progress(frame, cues[1] + 4, 26);
  const topn = progress(frame, cues[2] + 2, 24);
  return (
    <SceneShell kicker={{ ja: "物理プラン", en: "Physical plan" }} title={{ ja: "アルゴリズムを確定する", en: "Commit to algorithms" }}>
      <Svg>
        {[
          [960, 314, 960, 386],
          [960, 482, 690, 565],
          [960, 482, 1220, 565],
          [690, 660, 690, 728],
        ].map(([x1, y1, x2, y2], i) => <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} p={progress(frame, cues[0] + 12, 12)} color={colors.hairlineStrong} width={4} head={false} />)}
      </Svg>
      <PlanNode x={800} y={220} w={320} label={{ ja: "Top-N Sort", en: "Top-N Sort" }} sub={{ ja: "LIMIT 10", en: "LIMIT 10" }} tone={topn ? "teal" : "coral"} />
      <PlanNode x={800} y={388} w={320} label={{ ja: "HashJoin", en: "HashJoin" }} sub={{ ja: "u.id = o.user_id", en: "u.id = o.user_id" }} tone="amber" />
      <PlanNode x={530} y={565} w={320} label={{ ja: "Hash", en: "Hash" }} sub={{ ja: "ビルド: users", en: "build users" }} tone="teal" active={build} />
      <PlanNode x={1060} y={565} w={320} label={{ ja: "SeqScan orders", en: "SeqScan orders" }} sub={{ ja: "プローブ: 100,000 行", en: "probe, 100,000 rows" }} tone="muted" />
      <PlanNode x={530} y={730} w={360} label={{ ja: "SeqScan users", en: "SeqScan users" }} sub={{ ja: "フィルタ: age > 30", en: "Filter: age > 30" }} tone="muted" />
      <Abs x={1120} y={742} w={680} h={100} style={{ opacity: topn }}>
        <Card tone="white" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} style={{ width: 32, height: 32 + (n % 4) * 9, alignSelf: "end", background: colors.teal, borderRadius: 6 }} />
          ))}
          <span style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>
            <L ja="10個だけ保持" en="keep only 10" />
          </span>
        </Card>
      </Abs>
      <PhaseChip x={1200} y={205} text={{ ja: "親の要求が下のアルゴリズムを変える", en: "Parent requirements change child algorithms" }} tone="teal" at={cues[2] + 36} />
    </SceneShell>
  );
}

export function VolcanoExecutionScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const down = cues[1] + 2;
  const block = progress(frame, cues[2] + 2, 18);
  const nodes = [
    { id: "Limit", x: 820, y: 225, w: 280 },
    { id: "Sort", x: 820, y: 360, w: 280 },
    { id: "HashJoin", x: 820, y: 510, w: 320 },
    { id: "Hash build", x: 420, y: 700, w: 300 },
    { id: "Probe scan", x: 1220, y: 700, w: 300 },
  ];
  return (
    <SceneShell kicker={{ ja: "実行", en: "Execution" }} title={{ ja: "Volcano：next() が行を引っ張る", en: "Volcano: next() pulls rows" }}>
      <Svg>
        <Arrow x1={960} y1={321} x2={960} y2={360} p={1} color={colors.hairlineStrong} width={4} head={false} />
        <Arrow x1={960} y1={456} x2={960} y2={510} p={1} color={colors.hairlineStrong} width={4} head={false} />
        <Arrow x1={940} y1={606} x2={570} y2={700} p={1} color={colors.hairlineStrong} width={4} head={false} />
        <Arrow x1={980} y1={606} x2={1370} y2={700} p={1} color={colors.hairlineStrong} width={4} head={false} />
        <Packet x1={960} y1={225} x2={960} y2={760} start={down} dur={56} color={colors.coral} />
        <Packet x1={1370} y1={740} x2={960} y2={250} start={down + 64} dur={56} color={colors.teal} />
        <Packet x1={570} y1={740} x2={960} y2={520} start={cues[2] + 28} dur={36} color={colors.amber} />
      </Svg>
      {nodes.map((n) => {
        const tone: Tone = n.id === "Sort" && block ? "error" : n.id === "HashJoin" && block ? "amber" : n.id.includes("build") && block ? "teal" : "muted";
        return <PlanNode key={n.id} x={n.x} y={n.y} w={n.w} label={{ ja: n.id, en: n.id }} tone={tone} />;
      })}
      <Abs x={120} y={280} w={330} h={330}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.onDark, marginBottom: 20 }}>Operator</div>
          {["open()", "next()", "close()"].map((m) => (
            <div key={m} style={{ fontFamily: fonts.mono, fontSize: 34, color: m === "next()" ? colors.coral : colors.onDarkSoft, marginTop: 22 }}>
              {m}
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={1240} y={250} w={560} h={330} style={{ opacity: block }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>
            <L ja="ブロッキング" en="Blocking" />
          </div>
          <div style={{ marginTop: 26, display: "grid", gap: 18 }}>
            <Chip tone="error" size={26}><L ja="Sort：入力すべて" en="Sort: whole input" /></Chip>
            <Chip tone="amber" size={26}><L ja="HashJoin：ビルド側" en="HashJoin: build side" /></Chip>
          </div>
          <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 25, color: colors.body, lineHeight: 1.4 }}>
            <L ja="最初の行を返す前に、必要な入力を読み切る。" en="Before the first row, the required input is drained." />
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function MemoryParallelScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const sort = progress(frame, cues[1] + 4, 20);
  const hash = progress(frame, cues[2] + 4, 20);
  const par = progress(frame, cues[3] + 2, 22);
  return (
    <SceneShell kicker={{ ja: "メモリと並列", en: "Memory & parallelism" }} title={{ ja: "溢れ方と、Gatherの位置", en: "Spills and where Gather belongs" }}>
      <Abs x={120} y={250} w={780} h={250}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>
            <L ja="Sort：外部マージへ" en="Sort: external merge" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 18, marginTop: 34 }}>
            {[1, 0.8, 1.2, 0.7, 1.1, 0.9].map((h, i) => (
              <div key={i} style={{ width: 74, height: 74 * h, background: colors.coralSoft, border: `3px solid ${colors.coral}`, borderRadius: 10 }} />
            ))}
            <span style={{ fontFamily: fonts.sans, fontSize: 40, color: colors.muted }}>→</span>
            <div style={{ display: "flex", gap: 10, opacity: sort }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ width: 102, height: 76, borderRadius: 10, background: colors.tealSoft, border: `3px solid ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24 }}>run {i}</div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 26, color: colors.tealDeep, opacity: sort }}>
            <L ja="なだらかに劣化：比較コスト + ディスクI/O" en="Graceful: comparison cost + disk I/O" />
          </div>
        </Card>
      </Abs>
      <Abs x={120} y={560} w={780} h={270} style={{ opacity: hash }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>
            <L ja="Hash：再パーティション" en="Hash: repartition" />
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 34, alignItems: "center" }}>
            <div style={{ width: 150, height: 110, borderRadius: 16, background: colors.amberSoft, border: `3px solid ${colors.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 30 }}>hash</div>
            <span style={{ fontSize: 44, color: colors.muted }}>→</span>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: 104, height: 96, borderRadius: 12, background: colors.errorSoft, border: `3px solid ${colors.error}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24 }}>tmp {i}</div>
            ))}
          </div>
          <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 26, color: colors.error }}>
            <L ja="急に重い：入力を書き出して読み戻す" en="Sudden jump: write and read inputs again" />
          </div>
        </Card>
      </Abs>
      <Abs x={1000} y={250} w={800} h={580} style={{ opacity: par }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600, marginBottom: 20 }}>
            <L ja="Gatherはなるべく上へ" en="Place Gather as high as possible" />
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={1270} y1={750} x2={1400} y2={590} p={par} color={colors.teal} width={5} />
        <Arrow x1={1530} y1={750} x2={1400} y2={590} p={par} color={colors.teal} width={5} />
        <Arrow x1={1400} y1={590} x2={1400} y2={485} p={par} color={colors.coral} width={5} />
        <Arrow x1={1400} y1={485} x2={1400} y2={405} p={par} color={colors.coral} width={5} />
      </Svg>
      <Box x={1280} y={372} w={240} h={86} label={{ ja: "Gather", en: "Gather" }} tone="coral" opacity={par} />
      <Box x={1240} y={510} w={320} h={94} label={{ ja: "HashJoin", en: "HashJoin" }} sub={{ ja: "55,000行", en: "55,000 rows" }} tone="teal" opacity={par} />
      <Box x={1130} y={700} w={280} h={90} label={{ ja: "Worker 1", en: "Worker 1" }} tone="muted" opacity={par} />
      <Box x={1470} y={700} w={280} h={90} label={{ ja: "Worker 2", en: "Worker 2" }} tone="muted" opacity={par} />
      <Abs x={1080} y={798} w={650} style={{ textAlign: "center", opacity: par }}>
        <Chip tone="teal" size={26}>
          <L ja="100,000行ではなく55,000行だけを送る" en="ship 55,000 rows, not 100,000" />
        </Chip>
      </Abs>
    </SceneShell>
  );
}

export function StorageStackScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const tid = progress(frame, cues[1] + 4, 20);
  const pool = progress(frame, cues[2] + 2, 22);
  const frames = Array.from({ length: 12 }, (_, i) => i);
  return (
    <SceneShell kicker={{ ja: "ストレージ", en: "Storage" }} title={{ ja: "論理行から、物理位置へ", en: "Logical rows to physical locations" }}>
      <Svg>
        <Arrow x1={330} y1={345} x2={630} y2={345} p={progress(frame, cues[0], 20)} color={colors.coral} width={5} />
        <Arrow x1={910} y1={345} x2={1190} y2={345} p={tid} color={colors.coral} width={5} />
        <Arrow x1={1380} y1={445} x2={1380} y2={560} p={pool} color={colors.teal} width={5} />
      </Svg>
      <Box x={120} y={270} w={260} h={150} label={{ ja: "Executor", en: "Executor" }} sub={{ ja: "next()", en: "next()" }} tone="coral" mono />
      <Box x={620} y={270} w={310} h={150} label={{ ja: "Access Method", en: "Access Method" }} sub={{ ja: "SeqScan / IndexScan", en: "SeqScan / IndexScan" }} tone="amber" />
      <Box x={1160} y={270} w={420} h={170} label={{ ja: "TID", en: "TID" }} sub={{ ja: "(block, line pointer)", en: "(block, line pointer)" }} tone="teal" mono opacity={tid} />
      <Abs x={1320} y={500} w={480} h={390} style={{ opacity: pool }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 600, marginBottom: 18 }}>
            <L ja="バッファプール" en="Buffer pool" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {frames.map((i) => (
              <div
                key={i}
                style={{
                  height: 58,
                  borderRadius: 10,
                  background: i === 5 ? colors.tealSoft : i === 8 ? colors.coralSoft : "#fff",
                  border: `3px solid ${i === 5 ? colors.teal : i === 8 ? colors.coral : colors.hairlineStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.mono,
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                {i === 5 ? "hit" : i === 8 ? "miss" : i}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontFamily: fonts.sans, fontSize: 22, color: colors.body, lineHeight: 1.35 }}>
            <L ja="clock-sweep：usageを下げ、0の枠を犠牲にする" en="clock-sweep: decrement usage, evict a zero frame" />
          </div>
        </Card>
      </Abs>
      <Abs x={120} y={540} w={1110} h={300} style={{ opacity: tid }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>
            <L ja="Index Scan と Bitmap Scan" en="Index scan and bitmap scan" />
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 28, alignItems: "center" }}>
            <Chip tone="coral" size={26}><L ja="Index → TID列" en="Index → TIDs" /></Chip>
            <span style={{ fontSize: 40, color: colors.muted }}>→</span>
            <Chip tone="teal" size={26}><L ja="ブロック順に並べ直す" en="reorder by block" /></Chip>
            <span style={{ fontSize: 40, color: colors.muted }}>→</span>
            <Chip tone="teal" size={26}><L ja="ページを一度だけ読む" en="read each page once" /></Chip>
          </div>
          <div style={{ marginTop: 40, fontFamily: fonts.mono, fontSize: 34, color: colors.body }}>TID = (4271, 17)</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function PageToDiskScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const slots = progress(frame, cues[0] + 4, 22);
  const move = progress(frame, cues[1] + 4, 34);
  const pread = progress(frame, cues[2] + 2, 22);
  return (
    <SceneShell kicker={{ ja: "最下層", en: "Bottom layer" }} title={{ ja: "スロット付きページからpreadへ", en: "From slotted pages to pread" }}>
      <Abs x={120} y={250} w={850} h={575}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>
              <L ja="Heap Page" en="Heap page" />
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.coralDeep }}>8192 B</div>
          </div>
          <div style={{ position: "relative", marginTop: 26, height: 430, border: `3px solid ${colors.hairlineStrong}`, borderRadius: 16, overflow: "hidden", background: colors.surfaceSoft }}>
            <div style={{ height: 58, background: colors.dark, color: colors.onDark, display: "flex", alignItems: "center", paddingLeft: 24, fontFamily: fonts.mono, fontSize: 24 }}>PageHeaderData · 24B</div>
            <div style={{ position: "absolute", top: 78, left: 20, display: "flex", gap: 10, opacity: slots }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{ width: 96, height: 54, borderRadius: 8, background: i === 4 ? colors.tealSoft : "#fff", border: `3px solid ${i === 4 ? colors.teal : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 22 }}>slot {i}</div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 305, top: 180, width: 230, height: 100, borderRadius: 16, background: "rgba(250,249,245,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontSize: 28, color: colors.muted }}>
              <L ja="空き領域" en="free space" />
            </div>
            {[0, 1, 2, 3].map((i) => {
              const x0 = 70 + i * 190;
              const x = i === 2 ? lerp(x0, x0 + 35, move) : x0;
              return (
                <div key={i} style={{ position: "absolute", left: x, bottom: 22, width: 145, height: 84, borderRadius: 12, background: i === 2 ? colors.tealSoft : colors.coralSoft, border: `3px solid ${i === 2 ? colors.teal : colors.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 700 }}>
                  tuple {i}
                </div>
              );
            })}
          </div>
        </Card>
      </Abs>
      <Svg>
        <polyline
          points="494,457 494,520 706,520 706,685"
          fill="none"
          stroke={colors.teal}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={slots}
        />
        <path d="M 706 685 L 690 660 L 722 660 Z" fill={colors.teal} opacity={slots} />
        <Arrow x1={975} y1={540} x2={1185} y2={540} p={pread} color={colors.coral} width={6} />
      </Svg>
      <Abs x={1130} y={250} w={670} h={575} style={{ opacity: pread }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 44, color: colors.onDark, marginBottom: 28 }}>
            <L ja="最後はシステムコール" en="The final system call" />
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 34, color: colors.onDark, lineHeight: 1.65 }}>
            pread(
            <br />
            &nbsp; fd = <span style={{ color: colors.coral }}>42</span>,
            <br />
            &nbsp; bytes = <span style={{ color: colors.coral }}>8192</span>,
            <br />
            &nbsp; offset = <span style={{ color: colors.coral }}>34,988,032</span>
            <br />)
          </div>
          <div style={{ marginTop: 28, fontFamily: fonts.mono, fontSize: 28, color: colors.teal }}>
            4271 × 8192 = 34,988,032
          </div>
        </Card>
      </Abs>
      <PhaseChip x={164} y={835} text={{ ja: "スロットを指すので、TIDを変えずに行を動かせる", en: "Slot indirection lets tuples move without changing TIDs" }} tone="teal" at={cues[1] + 38} />
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const a = progress(frame, 24, 18);
  return (
    <EndCard slug="sql-query-execution-internals" headline={{ ja: "SQL実行は、変換の鎖として読める。", en: "SQL execution is a chain of transformations." }}>
      <div style={{ display: "flex", gap: 16, marginTop: 44, opacity: a, transform: `translateY(${(1 - a) * 12}px)`, flexWrap: "wrap", justifyContent: "center", maxWidth: 1500 }}>
        {[
          { ja: "トークナイザ", en: "Tokenizer" },
          { ja: "結合順序", en: "Join order" },
          { ja: "Volcano", en: "Volcano" },
          { ja: "スピル", en: "Spills" },
          { ja: "バッファプール", en: "Buffer pool" },
          { ja: "ページ構造", en: "Page layout" },
        ].map((x, i) => (
          <Chip key={i} tone={i % 2 ? "teal" : "coral"} size={27}>
            <L {...x} />
          </Chip>
        ))}
      </div>
    </EndCard>
  );
}
