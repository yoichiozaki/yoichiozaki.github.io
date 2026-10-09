import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function Txt({ text, size = 28, weight = 600, color = colors.ink }: { text: Bilingual; size?: number; weight?: number; color?: string }) {
  const t = useT();
  return <span style={{ fontFamily: fonts.sans, fontSize: size, fontWeight: weight, color }}>{t(text)}</span>;
}

function Mono({ children, size = 28, color = colors.ink }: { children: string; size?: number; color?: string }) {
  return <span style={{ fontFamily: fonts.mono, fontSize: size, fontWeight: 700, color }}>{children}</span>;
}

function PhaseChip({ text, x, y, tone = "coral", at = 0 }: { text: Bilingual; x: number; y: number; tone?: "coral" | "teal" | "amber" | "muted" | "ink" | "error"; at?: number }) {
  const t = useT();
  return (
    <Abs x={x} y={y} style={{ opacity: progress(useCurrentFrame(), at, 12) }}>
      <Chip tone={tone} size={26}>{t(text)}</Chip>
    </Abs>
  );
}

function Cell({
  x,
  y,
  w,
  h,
  children,
  hot = 0,
  done = 0,
  muted = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: string;
  hot?: number;
  done?: number;
  muted?: boolean;
}) {
  const bg = hot > 0 ? mixColor("#ffffff", colors.coralSoft, hot) : done > 0 ? mixColor("#ffffff", colors.tealSoft, done) : muted ? colors.surfaceSoft : "#ffffff";
  const border = hot > 0 ? colors.coral : done > 0 ? colors.teal : colors.hairlineStrong;
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 12,
          border: `3px solid ${border}`,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: 26,
          fontWeight: 700,
          color: muted ? colors.mutedSoft : colors.ink,
        }}
      >
        {children}
      </div>
    </Abs>
  );
}

/* -------------------------------------------------------------------------- */
/* 0. Intro                                                                   */
/* -------------------------------------------------------------------------- */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const node = (label: string, x: number, y: number, at: number, hot = false) => {
    const s = pop(frame, at, fps);
    return (
      <Abs key={`${label}-${x}-${y}`} x={x - 48} y={y - 36} w={96} h={72} style={{ opacity: clamp01(s), transform: `scale(${0.8 + 0.2 * clamp01(s)})` }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            border: `4px solid ${hot ? colors.coral : colors.hairlineStrong}`,
            background: hot ? colors.coralSoft : "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.mono,
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
      </Abs>
    );
  };
  const gridIn = progress(frame, 52, 26);
  return (
    <TitleCard
      title={{ ja: "動的計画法の\n思考法", en: "How to Think in\nDynamic Programming" }}
      subtitle={{ ja: "全探索を «状態» に畳み、表に落とすまで", en: "Folding brute force into states, then into a table" }}
      art={
        <>
          <Svg>
            {[
              [1480, 245, 1360, 365],
              [1480, 245, 1600, 365],
              [1360, 365, 1290, 485],
              [1360, 365, 1430, 485],
              [1600, 365, 1530, 485],
              [1600, 365, 1670, 485],
            ].map(([x1, y1, x2, y2], i) => (
              <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} p={progress(frame, 18 + i * 3, 16)} color={colors.hairlineStrong} width={4} head={false} />
            ))}
          </Svg>
          {node("f(5)", 1480, 245, 12, true)}
          {node("f(4)", 1360, 365, 18)}
          {node("f(3)", 1600, 365, 20)}
          {node("f(3)", 1290, 485, 26, frame > 42)}
          {node("f(2)", 1430, 485, 28)}
          {node("f(2)", 1530, 485, 30, frame > 42)}
          {node("f(1)", 1670, 485, 32)}
          <Abs x={1240} y={566} w={520} h={250} style={{ opacity: gridIn, transform: `translateY(${(1 - gridIn) * 20}px)` }}>
            <Card style={{ width: "100%", height: "100%", padding: 24 }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: colors.coral, marginBottom: 18 }}>
                {t({ ja: "状態の表", en: "STATE TABLE" })}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {["0", "1", "2", "3", "4", "5", "0", "?", "?", "?", "?", "?"].map((v, i) => (
                  <div
                    key={i}
                    style={{
                      height: 58,
                      borderRadius: 12,
                      background: i < 6 ? colors.surfaceSoft : i === 9 || i === 8 ? colors.tealSoft : "#fff",
                      border: `2px solid ${i === 9 || i === 8 ? colors.teal : colors.hairlineStrong}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: fonts.mono,
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {i < 6 ? `i=${v}` : v}
                  </div>
                ))}
              </div>
            </Card>
          </Abs>
        </>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Fork                                                                    */
/* -------------------------------------------------------------------------- */

export function ForkScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const boxes = [
    { id: "bf", text: { ja: "全探索", en: "Brute force" }, x: 750, y: 235, tone: "coral" as const, at: cues[0] },
    { id: "overlap", text: { ja: "部分問題が重複？", en: "Subproblems overlap?" }, x: 520, y: 405, tone: "amber" as const, at: cues[1] },
    { id: "opt", text: { ja: "最適部分構造？", en: "Optimal substructure?" }, x: 980, y: 405, tone: "amber" as const, at: cues[1] + 20 },
    { id: "greedy", text: { ja: "証明できる局所最良？", en: "Provable local best?" }, x: 1220, y: 600, tone: "teal" as const, at: cues[2] },
    { id: "dp", text: { ja: "動的計画法", en: "Dynamic programming" }, x: 740, y: 690, tone: "coral" as const, at: cues[1] + 56 },
    { id: "dc", text: { ja: "分割統治", en: "Divide & conquer" }, x: 270, y: 600, tone: "muted" as const, at: cues[1] + 36 },
  ];
  const box = boxes.reduce<Record<string, (typeof boxes)[number]>>((a, b) => ({ ...a, [b.id]: b }), {});
  const line = (a: string, b: string, at: number, label: Bilingual, tone: string = colors.coral) => {
    const A = box[a], B = box[b];
    return (
      <g key={`${a}-${b}`}>
        <Arrow x1={A.x + 170} y1={A.y + 45} x2={B.x + 170} y2={B.y + 45} p={progress(frame, at, 18)} color={tone} width={5} bend={a === "bf" ? -40 : 0} />
        <text x={(A.x + B.x) / 2 + 170} y={(A.y + B.y) / 2 + 22} textAnchor="middle" fontFamily={fonts.sans} fontSize={24} fontWeight={700} fill={tone} opacity={progress(frame, at + 8, 12)}>
          {t(label)}
        </text>
      </g>
    );
  };
  return (
    <SceneShell kicker={{ ja: "分岐点", en: "The fork" }} title={{ ja: "全探索から、圧縮の軸を探す", en: "Start from brute force, then find the compression" }}>
      <Svg>
        {line("bf", "overlap", cues[1] + 4, { ja: "見る", en: "inspect" }, colors.amber)}
        {line("overlap", "dc", cues[1] + 34, { ja: "重複なし", en: "no overlap" }, colors.muted)}
        {line("overlap", "opt", cues[1] + 28, { ja: "重複あり", en: "overlap" }, colors.amber)}
        {line("opt", "dp", cues[1] + 58, { ja: "両方あり", en: "both" }, colors.coral)}
        {line("opt", "greedy", cues[2] + 8, { ja: "証明できる", en: "provable" }, colors.teal)}
      </Svg>
      {boxes.map((b) => {
        const p = progress(frame, b.at, 16);
        const accent = b.tone === "coral" ? colors.coral : b.tone === "teal" ? colors.teal : b.tone === "amber" ? colors.amber : colors.hairlineStrong;
        return (
          <Abs key={b.id} x={b.x} y={b.y} w={340} h={90} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}>
            <Card accent={accent} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 18px", boxSizing: "border-box" }}>
              <Txt text={b.text} size={b.id === "dp" ? 30 : 28} color={b.id === "dp" ? colors.coralDeep : colors.ink} />
            </Card>
          </Abs>
        );
      })}
      <PhaseChip x={120} y={790} at={cues[3]} tone="coral" text={{ ja: "証明できないなら、まず全通り試す", en: "If proof is missing, try every first move" }} />
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Frog recursion                                                          */
/* -------------------------------------------------------------------------- */

const stones = [
  { i: 0, h: 20 },
  { i: 1, h: 55 },
  { i: 2, h: 35 },
  { i: 3, h: 80 },
  { i: 4, h: 45 },
  { i: 5, h: 70 },
];

function Stones({ active = -1 }: { active?: number }) {
  const base = 423;
  const scale = 3.15;
  const xAt = (i: number) => 190 + i * 112;
  const yAt = (h: number) => base - h * scale;
  const onCircle = (from: number, to: number, r = 46) => {
    const a = stones[from];
    const b = stones[to];
    const x1 = xAt(a.i);
    const y1 = yAt(a.h);
    const x2 = xAt(b.i);
    const y2 = yAt(b.h);
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    return { x1: x1 + ux * r, y1: y1 + uy * r, x2: x2 - ux * r, y2: y2 - uy * r };
  };
  const incoming = [
    { from: 4, to: 5, bend: -36 },
    { from: 3, to: 5, bend: -82 },
  ].map((j) => ({ ...j, ...onCircle(j.from, j.to) }));
  return (
    <>
      <Svg>
        {stones.slice(0, -1).map((s, i) => {
          const a = stones[i + 1];
          return <Arrow key={`one-${i}`} x1={xAt(i)} y1={yAt(s.h)} x2={xAt(i + 1)} y2={yAt(a.h)} p={1} color={colors.hairlineStrong} width={4} head={false} />;
        })}
        {incoming.map((j) => (
          <Arrow key={`jump-${j.from}-${j.to}`} x1={j.x1} y1={j.y1} x2={j.x2} y2={j.y2} p={1} color={colors.amber} width={5} dashed bend={j.bend} opacity={0.9} />
        ))}
      </Svg>
      {stones.map((s) => (
        <Abs key={s.i} x={xAt(s.i) - 42} y={yAt(s.h) - 42} w={84} h={120}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: active === s.i ? colors.coralSoft : "#fff",
              border: `4px solid ${active === s.i ? colors.coral : colors.hairlineStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.mono,
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            {s.i}
          </div>
          <div style={{ marginTop: 6, textAlign: "center", fontFamily: fonts.mono, fontSize: 26, color: colors.muted }}>h={s.h}</div>
        </Abs>
      ))}
    </>
  );
}

export function FrogRecursionScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const nodes = [
    ["f(5)", 1250, 255, cues[1]],
    ["f(4)", 1120, 380, cues[1] + 18],
    ["f(3)", 1380, 380, cues[1] + 20],
    ["f(3)", 1040, 510, cues[1] + 42],
    ["f(2)", 1200, 510, cues[1] + 44],
    ["f(2)", 1320, 510, cues[1] + 48],
    ["f(1)", 1480, 510, cues[1] + 50],
  ] as const;
  return (
    <SceneShell kicker={{ ja: "Frog 1", en: "Frog 1" }} title={{ ja: "同じ小問題が、再帰木に何度も出る", en: "The same subproblem repeats in the recursion tree" }}>
      <Abs x={120} y={250} w={820} h={540}>
        <Card tone="soft" style={{ width: "100%", height: "100%" }}>
          <Abs x={30} y={26}><Txt text={{ ja: "石とジャンプ", en: "Stones and jumps" }} size={28} color={colors.muted} /></Abs>
          <Stones active={frame > cues[0] + 40 ? 5 : -1} />
          <Abs x={585} y={76}>
            <Chip tone="coral" size={24}>|hᵢ - hⱼ|</Chip>
          </Abs>
        </Card>
      </Abs>
      <Svg>
        {[
          [1250, 295, 1120, 340],
          [1250, 295, 1380, 340],
          [1120, 420, 1040, 470],
          [1120, 420, 1200, 470],
          [1380, 420, 1320, 470],
          [1380, 420, 1480, 470],
        ].map(([x1, y1, x2, y2], i) => (
          <Arrow key={i} x1={x1} y1={y1} x2={x2} y2={y2} p={progress(frame, cues[1] + 18 + i * 5, 12)} color={colors.hairlineStrong} width={4} head={false} />
        ))}
      </Svg>
      {nodes.map(([label, x, y, at]) => {
        const duplicate = label === "f(3)" || label === "f(2)";
        const hot = duplicate ? progress(frame, cues[1] + 74, 18) : 0;
        return (
          <Abs key={`${label}-${x}`} x={x - 52} y={y - 35} w={104} h={70} style={{ opacity: progress(frame, at, 12) }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                border: `4px solid ${hot ? colors.coral : colors.hairlineStrong}`,
                background: hot ? colors.coralSoft : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {label}
            </div>
          </Abs>
        );
      })}
      <Abs x={1260} y={585} w={500} h={180}>
        <Appear at={cues[2]}>
          <Card style={{ padding: "22px 28px", borderColor: colors.coral, height: "100%" }}>
            <div style={{ fontFamily: fonts.sans, fontSize: 25, color: colors.muted, marginBottom: 8 }}>T(i) = 1 + T(i-1) + T(i-2)</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 800, color: colors.coralDeep }}>2F(45)-1 = 2,269,806,339</div>
            <div style={{ marginTop: 16 }}>
              <Chip tone="teal" size={26}>{t({ ja: "種類は石の番号だけ", en: "Only stone indices are distinct" })}</Chip>
            </div>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Memoization                                                             */
/* -------------------------------------------------------------------------- */

export function MemoizationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cached = progress(frame, cues[1] + 35, 20);
  const bad = progress(frame, cues[2], 18);
  const nodes = ["f(0)", "f(1)", "f(2)", "f(3)", "f(4)", "f(5)"];
  return (
    <SceneShell kicker={{ ja: "メモ化", en: "Memoization" }} title={{ ja: "同じ引数は、1回だけ計算する", en: "Compute each argument once" }}>
      <Abs x={120} y={245} w={980} h={540}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30, position: "relative" }}>
          <Txt text={{ ja: "再帰木がキャッシュへ畳まれる", en: "The recursion tree folds into a cache" }} size={30} color={colors.muted} />
          {nodes.map((n, i) => (
            <Abs key={n} x={68 + i * 130} y={246} w={96} h={78}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 16,
                  border: `4px solid ${frame > cues[1] + 20 + i * 8 ? colors.teal : colors.hairlineStrong}`,
                  background: frame > cues[1] + 20 + i * 8 ? colors.tealSoft : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: fonts.mono,
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {n}
              </div>
            </Abs>
          ))}
          <Abs x={685} y={192} style={{ opacity: cached }}>
            <Chip tone="teal" size={24}>{t({ ja: "計算済み", en: "cached" })}</Chip>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1160} y={245} w={640} h={250}>
        <Appear at={cues[1]}>
          <Card style={{ padding: 30, width: "100%", height: "100%" }}>
            <Txt text={{ ja: "正しい条件", en: "Correct when" }} size={30} color={colors.coralDeep} />
            <div style={{ marginTop: 26, fontFamily: fonts.mono, fontSize: 32, fontWeight: 800 }}>{t({ ja: "f(引数) → 値", en: "f(args) → value" })}</div>
            <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{t({ ja: "戻り値は引数だけで決まる", en: "The result depends only on arguments" })}</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1160} y={535} w={640} h={250}>
        <Appear at={cues[2]}>
          <Card accent={colors.error} style={{ padding: 30, width: "100%", height: "100%" }}>
            <Txt text={{ ja: "壊れる条件", en: "Breaks when" }} size={30} color={colors.error} />
            <div style={{ display: "flex", gap: 18, marginTop: 28 }}>
              <Chip tone="error" size={25}>{t({ ja: "可変状態", en: "mutable state" })}</Chip>
              <Chip tone="error" size={25}>{t({ ja: "乱数", en: "randomness" })}</Chip>
            </div>
            <div style={{ marginTop: 26, opacity: bad, fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{t({ ja: "同じ引数でも答えが変わる", en: "Same argument, different answer" })}</div>
          </Card>
        </Appear>
      </Abs>
      <PhaseChip x={500} y={805} at={cues[3]} tone="teal" text={{ ja: "指数時間 → 線形時間", en: "Exponential → linear" }} />
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. State                                                                   */
/* -------------------------------------------------------------------------- */

const lisSeq = [3, 1, 4, 1, 5, 9, 2, 6];
const lisDp = [1, 1, 2, 1, 3, 4, 2, 4];

export function StateScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const hot = frame > cues[2] ? 1 : 0;
  return (
    <SceneShell kicker={{ ja: "状態設計", en: "State design" }} title={{ ja: "未来に効く情報だけを残す", en: "Keep only what the future needs" }}>
      <Abs x={120} y={250} w={1680} h={180}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28 }}>
          <Txt text={{ ja: "入力列", en: "Sequence" }} size={28} color={colors.muted} />
          <div style={{ display: "flex", gap: 16, marginTop: 22 }}>
            {lisSeq.map((v, i) => (
              <div key={i} style={{ width: 86, height: 78, borderRadius: 16, border: `4px solid ${i === 6 && frame > cues[1] ? colors.coral : colors.hairlineStrong}`, background: i === 6 && frame > cues[1] ? colors.coralSoft : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 32, fontWeight: 800 }}>
                {v}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Abs x={120} y={490} w={760} h={255}>
        <Appear at={cues[1]}>
          <Card accent={colors.error} style={{ padding: 30, width: "100%", height: "100%" }}>
            <Chip tone="error" size={26}>{t({ ja: "足りない状態", en: "Missing state" })}</Chip>
            <div style={{ marginTop: 28, fontFamily: fonts.mono, fontSize: 32, fontWeight: 800 }}>{t({ ja: "dp[i] = a[0..i] の最長", en: "dp[i] = best in a[0..i]" })}</div>
            <div style={{ marginTop: 20, fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{t({ ja: "末尾が分からず、次を足せない", en: "No tail value, so extension is unknown" })}</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={960} y={490} w={840} h={255}>
        <Appear at={cues[2]}>
          <Card accent={colors.teal} style={{ padding: 30, width: "100%", height: "100%" }}>
            <Chip tone="teal" size={26}>{t({ ja: "十分な状態", en: "Enough state" })}</Chip>
            <div style={{ marginTop: 24, fontFamily: fonts.mono, fontSize: 30, fontWeight: 800 }}>{t({ ja: "dp[i] = iで終わる長さ", en: "dp[i] = LIS ending at i" })}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {lisDp.map((v, i) => (
                <div key={i} style={{ width: 72, height: 58, borderRadius: 12, background: i === 6 && hot ? colors.tealSoft : "#fff", border: `3px solid ${i === 6 && hot ? colors.teal : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 800 }}>
                  {v}
                </div>
              ))}
            </div>
          </Card>
        </Appear>
      </Abs>
      <PhaseChip x={560} y={790} at={cues[3]} tone="amber" text={{ ja: "定義を変えたら、答えの取り出し方も確認", en: "Change the definition → re-check the final extraction" }} />
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. Cost                                                                    */
/* -------------------------------------------------------------------------- */

export function CostScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const boom = progress(frame, cues[1], 18);
  return (
    <SceneShell kicker={{ ja: "計算量", en: "Cost" }} title={{ ja: "状態数 × 遷移数を、実装前に掛ける", en: "Multiply states by transitions before coding" }}>
      <Abs x={240} y={260} w={1440} h={185}>
        <Appear at={cues[0]}>
          <Card style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
            <Mono size={54}>cost</Mono>
            <span style={{ fontFamily: fonts.serif, fontSize: 62 }}>=</span>
            <Chip tone="coral" size={34}>{t({ ja: "状態数", en: "states" })}</Chip>
            <span style={{ fontFamily: fonts.serif, fontSize: 62 }}>×</span>
            <Chip tone="amber" size={34}>{t({ ja: "遷移数", en: "transitions" })}</Chip>
          </Card>
        </Appear>
      </Abs>
      <Abs x={160} y={515} w={760} h={270}>
        <Appear at={cues[1]}>
          <Card accent={colors.error} style={{ padding: 34, width: "100%", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
              <Txt text={{ ja: "制約", en: "Limit" }} size={28} color={colors.muted} />
              <Mono size={38}>N ≤ 100,000</Mono>
            </div>
            <div style={{ marginTop: 32, display: "flex", alignItems: "center", gap: 18 }}>
              <Mono size={46}>N² = 10,000,000,000</Mono>
              <div style={{ width: 90 * boom, height: 42, borderRadius: 8, background: colors.error }} />
            </div>
            <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 28, color: colors.error }}>{t({ ja: "実装前に捨てる", en: "discard before coding" })}</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1000} y={515} w={760} h={270}>
        <Appear at={cues[2]}>
          <Card style={{ padding: 34, width: "100%", height: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Chip tone="error" size={27}>{t({ ja: "遷移が書けない → 状態が足りない", en: "No transition → state is missing data" })}</Chip>
              <Chip tone="amber" size={27}>{t({ ja: "状態数が爆発 → 余計な情報を疑う", en: "State explosion → suspect extra data" })}</Chip>
              <Chip tone="teal" size={27}>{t({ ja: "足す ↔ 畳む", en: "add ↔ fold" })}</Chip>
            </div>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. DAG                                                                     */
/* -------------------------------------------------------------------------- */

export function DagScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const pts = Array.from({ length: 6 }, (_, i) => ({ i, x: 290 + i * 250, y: 520 + (i % 2 ? -90 : 70) }));
  const settled = Math.min(5, Math.max(0, Math.floor((frame - cues[1]) / 32)));
  return (
    <SceneShell kicker={{ ja: "DAG", en: "DAG" }} title={{ ja: "評価順序は、トポロジカル順序", en: "Evaluation order is topological order" }}>
      <Svg>
        {pts.slice(0, -1).map((p, i) => (
          <Arrow key={`a-${i}`} x1={p.x + 50} y1={p.y} x2={pts[i + 1].x - 50} y2={pts[i + 1].y} p={progress(frame, cues[0] + i * 8, 16)} color={i < settled ? colors.teal : colors.hairlineStrong} width={5} />
        ))}
        {pts.slice(0, -2).map((p, i) => (
          <Arrow key={`b-${i}`} x1={p.x + 50} y1={p.y} x2={pts[i + 2].x - 50} y2={pts[i + 2].y} p={progress(frame, cues[0] + 20 + i * 8, 16)} color={i + 2 <= settled ? colors.teal : colors.amber} width={4} dashed bend={-80} opacity={0.8} />
        ))}
      </Svg>
      {pts.map((p, i) => {
        const done = i <= settled && frame > cues[1];
        const readEarly = i === 4 && frame > cues[2] && frame < cues[2] + 60;
        return (
          <Abs key={i} x={p.x - 58} y={p.y - 58} w={116} h={116}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: `5px solid ${readEarly ? colors.error : done ? colors.teal : colors.hairlineStrong}`, background: readEarly ? colors.errorSoft : done ? colors.tealSoft : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 34, fontWeight: 800 }}>
              {i}
            </div>
          </Abs>
        );
      })}
      <Abs x={280} y={750} w={1320} style={{ display: "flex", justifyContent: "center", gap: 24 }}>
        <Appear at={cues[1]}>
          <Chip tone="teal" size={28}>{t({ ja: "小さい添字から確定", en: "settle in index order" })}</Chip>
        </Appear>
        <Appear at={cues[2]}>
          <Chip tone="error" size={28}>{t({ ja: "逆向きループ = 未確定を読む", en: "wrong loop = read unsettled values" })}</Chip>
        </Appear>
        <Appear at={cues[3]}>
          <Chip tone="amber" size={28}>{t({ ja: "閉路なら、層・貪欲順・反復", en: "cycles need layers, greedy order, or iteration" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Fill                                                                    */
/* -------------------------------------------------------------------------- */

export function FillScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const dp = [0, 20, 30, 30];
  return (
    <SceneShell kicker={{ ja: "表を埋める", en: "Filling the table" }} title={{ ja: "もらう DP と、配る DP", en: "Pull DP and push DP" }}>
      <Abs x={140} y={245} w={760} h={530}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Chip tone="coral" size={28}>{t({ ja: "もらう", en: "Pull" })}</Chip>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 118px)", gap: 16 }}>
            {dp.map((v, i) => (
              <div key={i} style={{ height: 86, borderRadius: 16, background: i <= 2 || frame > cues[1] ? colors.tealSoft : "#fff", border: `4px solid ${i === 3 && frame > cues[1] ? colors.coral : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>
                {frame > cues[1] || i < 3 ? v : "∞"}
              </div>
            ))}
          </div>
          <svg width={700} height={220} viewBox="0 0 700 220" style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
            <Arrow x1={357} y1={104} x2={491} y2={104} p={progress(frame, cues[1], 18)} color={colors.coral} width={6} bend={-44} />
            <Arrow x1={223} y1={104} x2={491} y2={104} p={progress(frame, cues[1] + 8, 18)} color={colors.coral} width={6} bend={-78} />
          </svg>
          <Abs x={46} y={310}>
            <Txt text={{ ja: "入ってくる遷移でセルを確定", en: "Finalize from incoming transitions" }} size={27} color={colors.body} />
          </Abs>
        </Card>
      </Abs>
      <Abs x={1020} y={245} w={760} h={530}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30 }}>
          <Chip tone="amber" size={28}>{t({ ja: "配る", en: "Push" })}</Chip>
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 118px)", gap: 16 }}>
            {["0", "20", "∞", "∞"].map((v, i) => (
              <div key={i} style={{ height: 86, borderRadius: 16, background: i === 2 && frame > cues[2] ? colors.errorSoft : i < 2 ? colors.tealSoft : "#fff", border: `4px solid ${i === 2 && frame > cues[2] ? colors.error : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>
                {v}
              </div>
            ))}
          </div>
          <Svg>
            <Packet x1={146} y1={148} x2={280} y2={148} start={cues[2] + 4} dur={28} color={colors.amber} label="+cost" />
            <Packet x1={416} y1={148} x2={550} y2={148} start={cues[2] + 38} dur={20} color={colors.error} label="∞" />
          </Svg>
          <Abs x={46} y={310}>
            <Txt text={{ ja: "届かない状態からは配らない", en: "Never push from unreachable states" }} size={27} color={colors.body} />
          </Abs>
        </Card>
      </Abs>
      <PhaseChip x={570} y={805} at={cues[3]} tone="teal" text={{ ja: "まず再帰、必要ならループへ", en: "Start recursive; rewrite as loops when needed" }} />
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Knapsack                                                                */
/* -------------------------------------------------------------------------- */

export function KnapsackScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const row = [0, 0, 3, 4, 5, 7, 8, 9];
  return (
    <SceneShell kicker={{ ja: "ナップサック", en: "Knapsack" }} title={{ ja: "未来に効くのは、使った重さ", en: "The future only needs used weight" }}>
      <Abs x={120} y={230} w={780} h={600}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28 }}>
          <Txt text={{ ja: "品物", en: "Items" }} size={28} color={colors.muted} />
          <div style={{ display: "flex", gap: 18, marginTop: 22 }}>
            {[
              ["w2", "v3"],
              ["w3", "v4"],
              ["w4", "v5"],
            ].map((it, i) => (
              <Card key={i} style={{ width: 150, height: 110, padding: 16, borderColor: colors.coral }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>{it[0]}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 800, color: colors.coral }}>{it[1]}</div>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "repeat(8, 76px)", gap: 10 }}>
            {row.map((v, w) => (
              <div key={w} style={{ height: 58, borderRadius: 10, background: colors.surfaceCard, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, color: colors.muted }}>w={w}</div>
            ))}
            {row.map((v, w) => (
              <div key={w} style={{ height: 70, borderRadius: 12, background: frame > cues[0] + 38 ? colors.tealSoft : "#fff", border: `3px solid ${colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 800 }}>{v}</div>
            ))}
          </div>
          <Abs x={36} y={475}><Chip tone="teal" size={25}>W=7 → 9</Chip></Abs>
        </Card>
      </Abs>
      <Abs x={980} y={230} w={820} h={180}>
        <Appear at={cues[1]}>
          <Card accent={colors.coral} style={{ padding: 26, width: "100%", height: "100%" }}>
            <Txt text={{ ja: "1行に潰すとき", en: "When using one row" }} size={28} color={colors.coralDeep} />
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 28 }}>
              <Chip tone="teal" size={27}>{t({ ja: "逆順", en: "backward" })}</Chip>
              <Mono size={30}>w = W ... wt[i]</Mono>
              <Chip tone="error" size={27}>{t({ ja: "順方向は個数無制限", en: "forward = unbounded" })}</Chip>
            </div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={980} y={455} w={820} h={170}>
        <Appear at={cues[2]}>
          <Card style={{ padding: 26, width: "100%", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Chip tone="amber" size={27}>W = 100,000</Chip>
              <Txt text={{ ja: "重さ添字で通る", en: "weight index works" }} size={27} />
            </div>
            <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Chip tone="error" size={27}>W = 1,000,000,000</Chip>
              <Txt text={{ ja: "表が大きすぎる", en: "table too large" }} size={27} color={colors.error} />
            </div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={980} y={670} w={820} h={160}>
        <Appear at={cues[3]}>
          <Card accent={colors.teal} style={{ padding: 26, width: "100%", height: "100%" }}>
            <Txt text={{ ja: "役割を入れ替える", en: "Swap roles" }} size={28} color={colors.tealDeep} />
            <div style={{ marginTop: 22, fontFamily: fonts.mono, fontSize: 27, fontWeight: 800 }}>{t({ ja: "dp[価値] = 最小重さ", en: "dp[value] = min weight" })}</div>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. Grid                                                                    */
/* -------------------------------------------------------------------------- */

export function GridScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const s = "AXYB";
  const u = "ABYXB";
  const gridX = 249, gridY = 120, size = 86, cellSize = 78;
  const lcs = Array.from({ length: s.length + 1 }, () => Array(u.length + 1).fill(0) as number[]);
  for (let i = 1; i <= s.length; i++) {
    for (let j = 1; j <= u.length; j++) {
      lcs[i][j] = s[i - 1] === u[j - 1] ? lcs[i - 1][j - 1] + 1 : Math.max(lcs[i - 1][j], lcs[i][j - 1]);
    }
  }
  return (
    <SceneShell kicker={{ ja: "格子 DP", en: "Grid DP" }} title={{ ja: "2本の列は、接頭辞の格子で比べる", en: "Two sequences become a grid of prefixes" }}>
      <Abs x={120} y={230} w={950} h={610}>
        <Card tone="soft" style={{ width: "100%", height: "100%", position: "relative" }}>
          {["", ...u].map((ch, j) => (
            <Abs key={`h-${j}`} x={gridX + j * size} y={gridY - 58} w={size} h={48}>
              <div style={{ textAlign: "center", fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>{ch}</div>
            </Abs>
          ))}
          {["", ...s].map((ch, i) => (
            <Abs key={`v-${i}`} x={gridX - 70} y={gridY + i * size + 15} w={64} h={48}>
              <div style={{ textAlign: "center", fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>{ch}</div>
            </Abs>
          ))}
          {lcs.map((row, i) =>
            row.map((v, j) => {
              const reveal = frame > cues[0] + (i + j) * 6;
              const match = (i === 1 && j === 1) || (i === 3 && j === 3) || (i === 4 && j === 5);
              return <Cell key={`${i}-${j}`} x={gridX + j * size} y={gridY + i * size} w={cellSize} h={cellSize} done={reveal ? 1 : 0} hot={match && frame > cues[1] ? 1 : 0} muted={!reveal}>{reveal ? String(v) : ""}</Cell>;
            }),
          )}
        </Card>
      </Abs>
      <Abs x={1160} y={260} w={620} h={185}>
        <Appear at={cues[1]}>
          <Card accent={colors.teal} style={{ padding: 28, width: "100%", height: "100%" }}>
            <Chip tone="teal" size={27}>{t({ ja: "最長共通部分列", en: "LCS" })}</Chip>
            <div style={{ marginTop: 22, fontFamily: fonts.mono, fontSize: 28, fontWeight: 800 }}>{t({ ja: "一致 → dp[i-1][j-1]+1", en: "match → dp[i-1][j-1]+1" })}</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1160} y={490} w={620} h={185}>
        <Appear at={cues[1] + 30}>
          <Card accent={colors.amber} style={{ padding: 28, width: "100%", height: "100%" }}>
            <Chip tone="amber" size={27}>{t({ ja: "編集距離", en: "Edit distance" })}</Chip>
            <div style={{ marginTop: 22, fontFamily: fonts.mono, fontSize: 27, fontWeight: 800 }}>1 + min(↖, ↑, ←)</div>
          </Card>
        </Appear>
      </Abs>
      <Abs x={1160} y={725} w={620}>
        <Appear at={cues[2]}>
          <Chip tone="coral" size={27}>{t({ ja: "差分表示・スペル訂正・DTW", en: "diffs · spell correction · DTW" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. Speedups                                                               */
/* -------------------------------------------------------------------------- */

export function SpeedupsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const panels = [
    { title: { ja: "区間の総和", en: "Range sum" }, tool: { ja: "累積和", en: "Prefix sums" }, x: 120, at: cues[1], color: colors.coral },
    { title: { ja: "窓の最小値", en: "Window min" }, tool: { ja: "単調キュー", en: "Monotonic deque" }, x: 710, at: cues[1] + 20, color: colors.amber },
    { title: { ja: "直線の族", en: "Lines" }, tool: { ja: "包絡線", en: "Envelope" }, x: 1300, at: cues[1] + 40, color: colors.teal },
  ];
  return (
    <SceneShell kicker={{ ja: "高速化", en: "Speedups" }} title={{ ja: "遷移の形を認識する", en: "Recognize the transition's shape" }}>
      {panels.map((p, idx) => (
        <Abs key={idx} x={p.x} y={230} w={500} h={500}>
          <Appear at={p.at}>
            <Card style={{ width: "100%", height: "100%", padding: 28, borderColor: p.color }}>
              <Txt text={p.title} size={30} color={colors.muted} />
              <div style={{ height: 300, marginTop: 24, position: "relative" }}>
                {idx === 0 &&
                  [0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ position: "absolute", left: 18 + i * 76, bottom: 32, width: 58, height: 115 + i * 24, borderRadius: 12, background: i >= 1 && i <= 3 ? colors.coralSoft : colors.surfaceCard, border: `3px solid ${i >= 1 && i <= 3 ? colors.coral : colors.hairlineStrong}` }} />
                  ))}
                {idx === 1 && (
                  <>
                    {[36, 22, 30, 18, 26].map((h, i) => (
                      <div key={i} style={{ position: "absolute", left: 24 + i * 78, top: 140 - h * 1.8, width: 58, height: 58, borderRadius: "50%", background: i === 3 ? colors.amberSoft : colors.surfaceCard, border: `5px solid ${i === 3 ? colors.amber : colors.hairlineStrong}` }} />
                    ))}
                    <div style={{ position: "absolute", left: 45, bottom: 46, width: 330 * progress(frame, p.at + 20, 18), height: 8, borderRadius: 4, background: colors.amber }} />
                  </>
                )}
                {idx === 2 && (
                  <svg width={430} height={285} viewBox="0 0 430 285" style={{ position: "absolute", left: 0, top: 0 }}>
                    <path d="M 35 230 L 395 58" stroke={colors.hairlineStrong} strokeWidth={5} />
                    <path d="M 35 70 L 395 236" stroke={colors.hairlineStrong} strokeWidth={5} />
                    <path d="M 35 175 Q 210 38 395 118" stroke={colors.teal} strokeWidth={9} fill="none" />
                  </svg>
                )}
              </div>
              <Chip tone={idx === 0 ? "coral" : idx === 1 ? "amber" : "teal"} size={29}>{t(p.tool)}</Chip>
            </Card>
          </Appear>
        </Abs>
      ))}
      <Abs x={260} y={765} w={1400} h={115}>
        <Appear at={cues[3]}>
          <Card style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
            <Chip tone="muted" size={26}>{t({ ja: "テキスト差分", en: "text diffs" })}</Chip>
            <Chip tone="muted" size={26}>{t({ ja: "形態素解析", en: "morphological analysis" })}</Chip>
            <Chip tone="muted" size={26}>{t({ ja: "DB結合順序", en: "DB join order" })}</Chip>
          </Card>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 11. Outro                                                                  */
/* -------------------------------------------------------------------------- */

export function OutroScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <EndCard slug="dynamic-programming" headline={{ ja: "全探索を書き、引数を状態へ言い換える", en: "Write brute force, then rename its arguments as state" }}>
      <div style={{ marginTop: 48, display: "flex", gap: 18, opacity: progress(frame, cues[1], 18), flexWrap: "wrap", justifyContent: "center", maxWidth: 1280 }}>
        {[
          { ja: "再帰木", en: "recursion tree" },
          { ja: "表埋め", en: "table fill" },
          { ja: "ナップサック", en: "knapsack" },
          { ja: "最長共通部分列", en: "LCS" },
        ].map((label) => (
          <Chip key={label.en} tone="coral" size={28}>{t(label)}</Chip>
        ))}
      </div>
    </EndCard>
  );
}
