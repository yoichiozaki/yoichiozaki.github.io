import { useCurrentFrame } from "remotion";
import { progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

const L = ["A", "B", "C", "D"];
const R = ["W", "X", "Y", "Z"];
const prefsL: Record<string, string[]> = {
  A: ["W", "X", "Z", "Y"],
  B: ["Z", "W", "Y", "X"],
  C: ["Z", "Y", "W", "X"],
  D: ["Z", "X", "Y", "W"],
};
const prefsR: Record<string, string[]> = {
  W: ["C", "B", "D", "A"],
  X: ["D", "B", "A", "C"],
  Y: ["B", "C", "D", "A"],
  Z: ["A", "D", "C", "B"],
};
const finalMatch: Record<string, string> = { A: "X", B: "W", C: "Y", D: "Z" };
const badMatch: Record<string, string> = { A: "W", B: "X", C: "Y", D: "Z" };

const tr = (t: (b: Bilingual) => string, ja: string, en: string) => t({ ja, en });

function nodeTone(tone: "left" | "right" | "hold" | "good" | "bad" | "plain") {
  if (tone === "left") return [colors.coralSoft, colors.coral, colors.coralDeep];
  if (tone === "right") return [colors.tealSoft, colors.teal, colors.tealDeep];
  if (tone === "hold") return [colors.amberSoft, colors.amber, "#9a6420"];
  if (tone === "good") return [colors.tealSoft, colors.teal, colors.tealDeep];
  if (tone === "bad") return [colors.errorSoft, colors.error, colors.error];
  return ["#fff", colors.hairlineStrong, colors.ink];
}

function Person({ name, x, y, tone = "plain", size = 82, pulse = 0 }: { name: string; x: number; y: number; tone?: "left" | "right" | "hold" | "good" | "bad" | "plain"; size?: number; pulse?: number }) {
  const [bg, border, fg] = nodeTone(tone);
  return (
    <Abs x={x - size / 2} y={y - size / 2} w={size} h={size}>
      <div style={{ width: size, height: size, borderRadius: 20, background: bg, border: `${3 + pulse * 4}px solid ${border}`, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: size * 0.45, fontWeight: 700, color: fg, boxShadow: pulse ? `0 0 0 ${12 * pulse}px rgba(204,120,92,0.14)` : "none" }}>
        {name}
      </div>
    </Abs>
  );
}

function AgentPrefRow({ name, pref, x, y, side = "left", hi, pulse = 0 }: { name: string; pref: string[]; x: number; y: number; side?: "left" | "right"; hi?: string; pulse?: number }) {
  const [bg, border, fg] = nodeTone(side === "left" ? "left" : "right");
  const token = (
    <div style={{ width: 64, height: 64, borderRadius: 16, background: bg, color: fg, border: `${3 + pulse * 3}px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 34, fontWeight: 700, boxSizing: "border-box" }}>{name}</div>
  );
  const list = (
    <div style={{ display: "flex", gap: 8 }}>
      {pref.map((p) => <span key={p} style={{ width: 40, height: 40, borderRadius: 10, background: p === hi ? colors.amber : "#fff", border: `2px solid ${p === hi ? colors.amber : colors.hairlineStrong}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, color: p === hi ? "#fff" : colors.body }}>{p}</span>)}
    </div>
  );
  return (
    <Abs x={x} y={y} w={330} h={74}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {side === "left" ? <>{list}{token}</> : <>{token}{list}</>}
      </div>
    </Abs>
  );
}

function RoutedLine({ x1, y1, x2, y2, p, color = colors.teal, width = 6, dashed = false, lane }: { x1: number; y1: number; x2: number; y2: number; p: number; color?: string; width?: number; dashed?: boolean; lane?: number }) {
  if (p <= 0) return null;
  void lane;
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  return <path d={`M ${x1} ${y1} L ${x} ${y}`} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "14 12" : undefined} />;
}

function Metric({ value, label, tone = "teal" }: { value: string; label: string; tone?: "teal" | "coral" | "amber" }) {
  const color = tone === "coral" ? colors.coralDeep : tone === "amber" ? "#9a6420" : colors.tealDeep;
  return <div style={{ textAlign: "center" }}><div style={{ fontFamily: fonts.serif, fontSize: 54, fontWeight: 700, color, lineHeight: 1 }}>{value}</div><div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 26, fontWeight: 600, color: colors.muted }}>{label}</div></div>;
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <TitleCard
      title={{ ja: "ゲール・シャープレー\n受入保留アルゴリズム", en: "Gale-Shapley\nDeferred Acceptance" }}
      subtitle={{ ja: "仮の保留が、なぜ安定マッチングを生むのか", en: "Why tentative holds produce stable matchings" }}
      art={
        <>
          <Svg>
            {[0, 1, 2].map((i) => <Arrow key={i} x1={1280} y1={320 + i * 112} x2={1700} y2={275 + i * 128} p={progress(frame, 40 + i * 14, 24)} color={colors.hairlineStrong} width={4} head={false} />)}
            <Packet x1={1280} y1={432} x2={1700} y2={403} start={62} dur={42} label={tr(t, "保留", "hold")} color={colors.coral} />
            <Packet x1={1280} y1={544} x2={1700} y2={275} start={105} dur={42} label={tr(t, "乗り換え", "trade up")} color={colors.teal} />
          </Svg>
          <Abs x={1130} y={180} w={760} h={590} style={{ opacity: progress(frame, 24, 26), transform: `translateY(${(1 - progress(frame, 24, 26)) * 18}px)` }}>
            <Card tone="white" style={{ height: "100%", padding: 34, boxSizing: "border-box", position: "relative" }}>
              <Abs x={34} y={34}><Chip tone="coral" size={26}>{tr(t, "提案側", "Proposers")}</Chip></Abs>
              <Abs x={500} y={34}><Chip tone="teal" size={26}>{tr(t, "受理側", "Receivers")}</Chip></Abs>
              {["A", "B", "C"].map((n, i) => <Person key={n} name={n} tone="left" x={118} y={146 + i * 112} size={82} pulse={i === 1 ? progress(frame, 60, 60) : 0} />)}
              {["W", "X", "Y"].map((n, i) => <Person key={n} name={n} tone={i === 1 && frame > 100 ? "hold" : "right"} x={570} y={146 + i * 112} size={88} pulse={i === 1 ? progress(frame, 100, 22) : 0} />)}
              <Abs x={190} y={438} w={390} style={{ fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.4, color: colors.body }}>{tr(t, "仮の保留 → 安定した最終ペア", "temporary holds → stable final pairs")}</Abs>
            </Card>
          </Abs>
        </>
      }
    />
  );
}

export function StabilityScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const pairs = progress(frame, cues[1] + 6, 18);
  const block = progress(frame, cues[2] + 4, 20);
  const stable = progress(frame, cues[3] + 8, 18);
  const rowY = (i: number) => 300 + i * 124;
  const leftX = 100;
  const rightX = 1320;
  const edgeL = leftX + 264;
  const edgeR = rightX;
  return (
    <SceneShell kicker={{ ja: "問題設定", en: "The problem" }} title={{ ja: "ブロッキングペアがない組み合わせ", en: "No blocking pair" }}>
      <Abs x={645} y={210} w={630} style={{ opacity: progress(frame, cues[0] + 3, 18), textAlign: "center" }}><Card tone="soft" style={{ padding: 20 }}><div style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.body }}>{tr(t, "左右とも、相手を好きな順に並べる", "Both sides rank partners")}</div></Card></Abs>
      <Svg>
        {Object.entries(badMatch).map(([l, r], idx) => <RoutedLine key={`${l}${r}`} x1={edgeL} y1={rowY(L.indexOf(l)) + 32} x2={edgeR} y2={rowY(R.indexOf(r)) + 32} lane={rowY(L.indexOf(l)) + 84 + idx * 3} p={pairs * (1 - stable)} color={colors.hairlineStrong} width={5} />)}
        {Object.entries(finalMatch).map(([l, r], idx) => <RoutedLine key={`f${l}${r}`} x1={edgeL} y1={rowY(L.indexOf(l)) + 32} x2={edgeR} y2={rowY(R.indexOf(r)) + 32} lane={rowY(L.indexOf(l)) + 84 + idx * 3} p={stable} color={colors.teal} width={7} />)}
        <RoutedLine x1={edgeL} y1={rowY(1) + 32} x2={edgeR} y2={rowY(0) + 32} lane={375} p={block * (1 - stable)} color={colors.error} width={7} dashed />
      </Svg>
      {L.map((n, i) => <AgentPrefRow key={n} name={n} pref={prefsL[n]} x={leftX} y={rowY(i)} hi={n === "B" && block > 0 ? "W" : undefined} pulse={n === "B" ? block * (1 - stable) : 0} />)}
      {R.map((n, i) => <AgentPrefRow key={n} name={n} pref={prefsR[n]} x={rightX} y={rowY(i)} side="right" hi={n === "W" && block > 0 ? "B" : undefined} pulse={n === "W" ? block * (1 - stable) : 0} />)}
      <Abs x={735} y={350} w={450} style={{ textAlign: "center", opacity: block * (1 - stable) }}><Chip tone="error" size={29}>{tr(t, "B と W が抜け駆けしたい", "B and W want to defect")}</Chip></Abs>
      <Abs x={760} y={760} w={400} style={{ textAlign: "center", opacity: stable }}><Chip tone="teal" size={31}>{tr(t, "ブロッキングペアなし", "no blocking pair")}</Chip></Abs>
    </SceneShell>
  );
}

export function WhyStabilityScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const events = [
    ["1940s", tr(t, "採用が卒業の2年前へ", "appointments nearly 2 years early"), "error", cues[1]],
    ["1945", tr(t, "返答期限 10日", "10-day reply window"), "amber", cues[2] - 25],
    [tr(t, "数年後", "later"), tr(t, "約12時間へ短縮", "~12 hours"), "error", cues[2] + 25],
    ["1952", tr(t, "中央集権的マッチング", "centralized match"), "teal", cues[3]],
    ["Roth", tr(t, "安定性が成功理由", "stability explains success"), "coral", cues[3] + 95],
  ] as const;
  return (
    <SceneShell kicker={{ ja: "なぜ安定性か", en: "Why stability" }} title={{ ja: "制度の外で崩れないために", en: "Prevent side deals" }}>
      <Abs x={170} y={245} w={1580} h={122}>
        <Card tone="dark" style={{ height: "100%", padding: "26px 34px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 32, fontWeight: 700, lineHeight: 1.35, color: colors.onDark }}>
            {tr(t, "ブロッキングペア：制度の外で二人だけの取引をする動機", "Blocking pair: an incentive for a private side deal")}
          </div>
        </Card>
      </Abs>
      <Svg><line x1={220} x2={1700} y1={585} y2={585} stroke={colors.hairlineStrong} strokeWidth={5} /></Svg>
      {events.map(([year, body, tone, at], i) => {
        const p = progress(frame, at + 8, 18);
        const x = 260 + i * 350;
        const accent = tone === "error" ? colors.error : tone === "teal" ? colors.teal : tone === "coral" ? colors.coral : colors.amber;
        return <Abs key={`${year}`} x={x - 155} y={462 + (i % 2) * 158} w={310} h={150} style={{ opacity: p, transform: `translateY(${(1 - p) * 18}px)` }}><Card tone="white" accent={accent} style={{ padding: 18, height: "100%", boxSizing: "border-box" }}><div style={{ fontFamily: fonts.mono, fontSize: 26, fontWeight: 700, color: colors.muted }}>{year}</div><div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, lineHeight: 1.18 }}>{body}</div></Card></Abs>;
      })}
      <Abs x={605} y={780} w={710} style={{ textAlign: "center", opacity: progress(frame, cues[3] + 110, 20) }}><Chip tone="teal" size={28}>{tr(t, "安定な結果だから、参加者が制度に留まる", "Stable outcomes keep participants in the system")}</Chip></Abs>
    </SceneShell>
  );
}

const cycleStates: Record<string, string>[] = [
  { A: "X", B: "Y", C: "Z" }, { A: "Z", B: "Y", C: "X" }, { A: "Z", B: "X", C: "Y" }, { A: "Y", B: "X", C: "Z" }, { A: "X", B: "Y", C: "Z" },
];
const cycleBlocks = [["C", "X"], ["C", "Y"], ["A", "Y"], ["A", "X"]];

export function NaiveCycleScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const starts = [cues[2] - 8, cues[2] + 42, cues[2] + 92, cues[2] + 142];
  const idx = starts.reduce((a, s, i) => (frame >= s ? i + 1 : a), 0);
  const state = cycleStates[Math.min(idx, 4)];
  const block = cycleBlocks[Math.min(idx, 3)];
  const LL = ["A", "B", "C"], RR = ["X", "Y", "Z"];
  const ys = [340, 510, 680], lx = 440, rx = 1420;
  return (
    <SceneShell kicker={{ ja: "素朴な方法", en: "Naive repair" }} title={{ ja: "直しても、元に戻ることがある", en: "Fixes can cycle" }}>
      <Abs x={1240} y={140} w={560} style={{ textAlign: "right", opacity: progress(frame, cues[0], 16) }}><Chip tone="error" size={26}>{tr(t, "局所修理だけでは不十分", "Local repair is not enough")}</Chip></Abs>
      <Svg>
        {Object.entries(state).map(([l, r]) => <Arrow key={`${l}${r}`} x1={lx + 58} y1={ys[LL.indexOf(l)]} x2={rx - 58} y2={ys[RR.indexOf(r)]} p={1} color={colors.hairlineStrong} width={5} head={false} />)}
        <Arrow x1={lx + 62} y1={ys[LL.indexOf(block[0])]} x2={rx - 62} y2={ys[RR.indexOf(block[1])]} p={progress(frame, cues[0] + 18, 16)} color={colors.error} width={7} dashed />
      </Svg>
      {LL.map((n, i) => <Person key={n} name={n} tone="left" x={lx} y={ys[i]} pulse={n === block[0] ? 0.75 : 0} />)}
      {RR.map((n, i) => <Person key={n} name={n} tone="right" x={rx} y={ys[i]} pulse={n === block[1] ? 0.75 : 0} />)}
      <Abs x={760} y={245} w={400} style={{ textAlign: "center" }}><Chip tone="error" size={30}>{block[0]} ↔ {block[1]}</Chip></Abs>
      <Abs x={630} y={760} w={660} h={94}><Card tone="white" style={{ height: "100%", padding: "20px 28px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between" }}>{cycleBlocks.map((b, i) => <Chip key={i} tone={idx > i ? "teal" : idx === i ? "coral" : "muted"} size={24}>{b[0]}→{b[1]}</Chip>)}</Card></Abs>
      <Abs x={675} y={246} w={570} style={{ textAlign: "center", opacity: progress(frame, cues[2] + 150, 20) }}><Chip tone="amber" size={28}>{tr(t, "4手後に最初の AX BY CZ へ戻る", "After four repairs: back to AX BY CZ")}</Chip></Abs>
    </SceneShell>
  );
}

export function DeferredScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const hold = progress(frame, cues[1] + 6, 18);
  const better = progress(frame, cues[2] + 8, 34);
  return (
    <SceneShell kicker={{ ja: "受入保留", en: "Deferred acceptance" }} title={{ ja: "保留して、最後に確定する", en: "Hold now, finalize later" }}>
      <Abs x={120} y={245} w={520} h={520}><Card tone="soft" style={{ height: "100%", padding: 28, boxSizing: "border-box", position: "relative" }}><Chip tone="coral" size={26}>{tr(t, "提案側", "Proposers")}</Chip>{["P1", "P2", "P3"].map((n, i) => <Person key={n} name={n} tone="left" x={120} y={145 + i * 126} size={84} />)}<Abs x={220} y={90} style={{ fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{tr(t, "好きな順に申し込む", "apply in preference order")}</Abs></Card></Abs>
      <Abs x={1280} y={245} w={520} h={520}><Card tone="white" style={{ height: "100%", padding: 28, boxSizing: "border-box", position: "relative" }}><Chip tone="teal" size={26}>{tr(t, "受理側", "Receivers")}</Chip>{["R1", "R2", "R3"].map((n, i) => <Person key={n} name={n} tone={i === 1 ? "hold" : "right"} x={120} y={145 + i * 126} size={84} pulse={i === 1 ? Math.max(hold, better) : 0} />)}<Abs x={210} y={100} style={{ opacity: hold }}><Chip tone="amber" size={24}>{tr(t, "最良の一件だけ保留", "hold only the best")}</Chip></Abs><Abs x={210} y={226} style={{ opacity: better }}><Chip tone="teal" size={24}>{tr(t, "より良ければ乗り換え", "trade up if better")}</Chip></Abs></Card></Abs>
      <Svg><Packet x1={240} y1={390} x2={1400} y2={515} start={cues[0] + 30} dur={34} label={tr(t, "提案", "proposal")} color={colors.coral} /><Packet x1={240} y1={260} x2={1400} y2={515} start={cues[2] + 10} dur={34} label={tr(t, "より良い", "better")} color={colors.teal} /><Packet x1={1400} y1={515} x2={240} y2={390} start={cues[2] + 48} dur={30} label={tr(t, "手放す", "release")} color={colors.amber} /></Svg>
      <Abs x={735} y={300} w={450} h={320} style={{ opacity: Math.max(hold, better) }}><Card tone="dark" style={{ height: "100%", padding: 32, boxSizing: "border-box", textAlign: "center" }}><div style={{ fontFamily: fonts.serif, fontSize: 54, color: colors.onDark }}>{tr(t, "仮の保留", "Tentative hold")}</div><div style={{ marginTop: 30, fontFamily: fonts.sans, fontSize: 27, lineHeight: 1.45, color: colors.onDarkSoft }}>{tr(t, "確定は最後まで延ばす。", "Commitment is delayed until the end.")}</div></Card></Abs>
      <Abs x={530} y={800} w={860} style={{ textAlign: "center", opacity: progress(frame, cues[3] + 5, 18) }}><Chip tone="error" size={28}>{tr(t, "即時受入なら、後から良い相手が来ても動けない", "Immediate acceptance cannot trade up later")}</Chip></Abs>
    </SceneShell>
  );
}

const run = [["A", "W"], ["B", "Z"], ["C", "Z"], ["D", "Z"], ["B", "W"], ["C", "Y"], ["A", "X"]] as const;

export function RunExampleScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const zHot = progress(frame, cues[1] + 4, 24);
  const final = progress(frame, cues[3] + 4, 20);
  const step = Math.max(-1, Math.min(6, Math.floor((frame - (cues[2] + 6)) / 38)));
  const active = step >= 0 ? run[step] : null;
  const leftX = 100;
  const rightX = 1320;
  const rowY = (i: number) => 300 + i * 124;
  const edgeL = leftX + 264;
  const edgeR = rightX;
  return (
    <SceneShell kicker={{ ja: "基本例", en: "Running example" }} title={{ ja: "人気の Z をめぐる玉突き", en: "A chain reaction around Z" }}>
      <Abs x={60} y={220} w={420} h={635}><Card tone="soft" style={{ height: "100%", padding: 22, boxSizing: "border-box" }}><Chip tone="coral" size={26}>A–D</Chip></Card></Abs>
      <Abs x={1280} y={220} w={520} h={635}><Card tone="white" style={{ height: "100%", padding: 22, boxSizing: "border-box" }}><Chip tone="teal" size={26}>W–Z</Chip></Card></Abs>
      <Svg>
        {run.map(([p, r], i) => {
          const y1 = rowY(L.indexOf(p)) + 32;
          const y2 = rowY(R.indexOf(r)) + 32;
          return <Packet key={i} x1={edgeL} y1={y1} x2={edgeR} y2={y2} start={cues[2] + 8 + i * 38} dur={26} label={`${p}→${r}`} color={i < 2 ? colors.coral : i < 5 ? colors.amber : colors.teal} />;
        })}
        {Object.entries(finalMatch).map(([l, r], idx) => <RoutedLine key={l} x1={edgeL} y1={rowY(L.indexOf(l)) + 32} x2={edgeR} y2={rowY(R.indexOf(r)) + 32} lane={rowY(L.indexOf(l)) + 84 + idx * 3} p={final} color={colors.teal} width={7} />)}
      </Svg>
      {L.map((n, i) => <AgentPrefRow key={n} name={n} pref={prefsL[n]} x={leftX} y={rowY(i)} hi={zHot > 0 && ["B", "C", "D"].includes(n) ? "Z" : undefined} pulse={active?.[0] === n ? 0.7 : 0} />)}
      {R.map((n, i) => <AgentPrefRow key={n} name={n} pref={prefsR[n]} x={rightX} y={rowY(i)} side="right" hi={n === "Z" && zHot > 0 ? "D" : undefined} pulse={active?.[1] === n ? 0.7 : 0} />)}
      <Abs x={675} y={770} w={570} h={96} style={{ opacity: zHot }}><Card tone="dark" style={{ padding: "14px 24px", height: "100%", boxSizing: "border-box", textAlign: "center" }}><div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: colors.onDark }}>Z: B → C → D</div><div style={{ marginTop: 7, fontFamily: fonts.sans, fontSize: 24, color: colors.onDarkSoft }}>A &gt; D &gt; C &gt; B</div></Card></Abs>
      <Abs x={650} y={460} w={620} h={150} style={{ opacity: step >= 0 && final < 1 ? 1 : 0 }}><Card tone="white" accent={active?.[1] === "Z" && step > 1 ? colors.amber : colors.teal} style={{ height: "100%", padding: 24, boxSizing: "border-box", textAlign: "center" }}><div style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 700 }}>{step + 1} / 7 · {active?.[0]} → {active?.[1]}</div><div style={{ marginTop: 16, fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: step >= 2 && step <= 4 ? "#9a6420" : colors.tealDeep }}>{step >= 2 && step <= 4 ? tr(t, "乗り換え", "trade up") : tr(t, "保留", "hold")}</div></Card></Abs>
    </SceneShell>
  );
}

export function WhyWorksScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "正しさ", en: "Correctness" }} title={{ ja: "二つの単調性だけで証明する", en: "Two monotonic facts" }}>
      <Abs x={140} y={255} w={760} h={360} style={{ opacity: progress(frame, cues[0] + 4, 18) }}><Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 34, boxSizing: "border-box" }}><Chip tone="teal" size={25}>{tr(t, "受理側：良くなる一方", "Receivers: only better")}</Chip><div style={{ display: "flex", gap: 18, marginTop: 60 }}>{[4, 3, 2, 1].map((r, i) => <div key={r} style={{ width: 120, height: 90, borderRadius: 16, background: i <= Math.floor(progress(frame, cues[1] + 5, 70) * 3) ? colors.tealSoft : colors.surfaceSoft, border: `3px solid ${i <= Math.floor(progress(frame, cues[1] + 5, 70) * 3) ? colors.teal : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 30, fontWeight: 700 }}>#{r}</div>)}</div></Card></Abs>
      <Abs x={1020} y={255} w={760} h={360} style={{ opacity: progress(frame, cues[0] + 12, 18) }}><Card tone="white" accent={colors.coral} style={{ height: "100%", padding: 34, boxSizing: "border-box" }}><Chip tone="coral" size={25}>{tr(t, "提案側：下へ進むだけ", "Proposers: only down")}</Chip><div style={{ display: "flex", gap: 18, marginTop: 60 }}>{["W", "X", "Z", "Y"].map((n, i) => <div key={n} style={{ width: 120, height: 90, borderRadius: 16, background: i <= Math.floor(progress(frame, cues[1] + 35, 70) * 3) ? colors.coralSoft : "#fff", border: `3px solid ${i <= Math.floor(progress(frame, cues[1] + 35, 70) * 3) ? colors.coral : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 38, fontWeight: 700 }}>{n}</div>)}</div></Card></Abs>
      <Abs x={160} y={700} w={480} style={{ opacity: progress(frame, cues[2] + 10, 22) }}><Metric label={tr(t, "有限個の申し込み", "finite proposals")} value="≤ n²" tone="amber" /></Abs>
      <Abs x={720} y={700} w={480} style={{ opacity: progress(frame, cues[3] + 8, 24) }}><Metric label={tr(t, "完全な n 対 n の上界", "complete n-by-n bound")} value="n²−n+1" tone="coral" /></Abs>
      <Abs x={1280} y={685} w={500} h={150} style={{ opacity: progress(frame, cues[4] + 8, 20) }}><Card tone="dark" style={{ padding: 24, boxSizing: "border-box", height: "100%" }}><div style={{ fontFamily: fonts.sans, fontSize: 26, lineHeight: 1.35, color: colors.onDark }}>{tr(t, "断った相手より最後の相手が好き。だからブロッキングペアになれない。", "After rejecting someone, the receiver only improves; no blocking pair remains.")}</div></Card></Abs>
    </SceneShell>
  );
}

const latticeNodes = [
  ["top", "AX BW CY DZ", 960, 270, "7 / 9"], ["mid1", "AX BY CW DZ", 690, 495, "9 / 7"], ["mid2", "AZ BW CY DX", 1230, 495, "9 / 6"], ["bottom", "AZ BY CW DX", 960, 720, "11 / 4"],
] as const;

export function OptimalityScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "どの安定マッチングか", en: "Which stable matching?" }} title={{ ja: "提案側最適から受理側最適へ", en: "Stable matching lattice" }}>
      <Abs x={1380} y={138} w={420} style={{ opacity: progress(frame, cues[0] + 6, 18), textAlign: "right" }}><Chip tone="muted" size={25}>{tr(t, "処理順には依存しない", "independent of proposal order")}</Chip></Abs>
      <Svg>{[["top", "mid1"], ["top", "mid2"], ["mid1", "bottom"], ["mid2", "bottom"]].map(([a, b]) => { const A = latticeNodes.find((n) => n[0] === a)!; const B = latticeNodes.find((n) => n[0] === b)!; return <Arrow key={`${a}${b}`} x1={A[2]} y1={A[3] + 42} x2={B[2]} y2={B[3] - 42} p={progress(frame, cues[1] + 30, 28)} color={colors.hairlineStrong} width={5} head={false} />; })}</Svg>
      {latticeNodes.map(([id, label, x, y, rank], i) => <Abs key={id} x={x - 190} y={y - 58} w={380} h={116} style={{ opacity: progress(frame, cues[1] + 8 + i * 5, 16) }}><Card tone="white" accent={id === "top" ? colors.teal : id === "bottom" ? colors.amber : colors.hairlineStrong} style={{ height: "100%", padding: 18, boxSizing: "border-box", textAlign: "center" }}><div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 800, color: id === "top" ? colors.tealDeep : id === "bottom" ? "#9a6420" : colors.ink }}>{label}</div><div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>{tr(t, "順位和", "rank sums")} {rank}</div></Card></Abs>)}
      <Abs x={1168} y={256} w={310} style={{ opacity: progress(frame, cues[1] + 4, 22) }}><Chip tone="teal" size={24}>{tr(t, "提案側最適", "proposer-optimal")}</Chip></Abs>
      <Abs x={1168} y={706} w={310} style={{ opacity: progress(frame, cues[2] + 4, 22) }}><Chip tone="amber" size={24}>{tr(t, "受理側最適", "receiver-optimal")}</Chip></Abs>
      <Abs x={120} y={760} w={430} style={{ opacity: progress(frame, cues[1] + 4, 22) }}><Card tone="soft" style={{ padding: 20 }}><div style={{ fontFamily: fonts.sans, fontSize: 26, lineHeight: 1.35 }}>{tr(t, "提案側は、安定な中で自分に最良の相手を得る。", "Each proposer gets its best stable partner.")}</div></Card></Abs>
      <Abs x={1370} y={760} w={430} style={{ opacity: progress(frame, cues[2] + 4, 22) }}><Card tone="soft" style={{ padding: 20 }}><div style={{ fontFamily: fonts.sans, fontSize: 26, lineHeight: 1.35 }}>{tr(t, "同じ結果は、受理側にとっては最悪の安定結果。", "The same result is the receivers' worst stable outcome.")}</div></Card></Abs>
    </SceneShell>
  );
}

export function IncentivesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "戦略", en: "Incentives" }} title={{ ja: "正直が得になるのは誰か", en: "Who can safely tell the truth?" }}>
      <Abs x={150} y={245} w={760} h={420} style={{ opacity: progress(frame, cues[1] + 2, 20) }}><Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 34, boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between" }}><Chip tone="teal" size={26}>{tr(t, "提案側", "Proposers")}</Chip><Chip tone="teal" size={26}>{tr(t, "正直が支配戦略", "truth is dominant")}</Chip></div><div style={{ marginTop: 64, display: "flex", alignItems: "center", gap: 28 }}><div style={{ width: 88, height: 88, borderRadius: 20, background: colors.coralSoft, border: `3px solid ${colors.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 40, fontWeight: 700, color: colors.coralDeep }}>A</div><div style={{ fontFamily: fonts.mono, fontSize: 34, color: colors.body }}>W &gt; X &gt; Z &gt; Y</div></div><div style={{ marginTop: 62, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.4 }}>{tr(t, "本当の希望を書くのが最善。", "The true list is the best report.")}</div></Card></Abs>
      <Abs x={1010} y={245} w={760} h={420} style={{ opacity: progress(frame, cues[2] + 2, 20) }}><Card tone="white" accent={colors.amber} style={{ height: "100%", padding: 34, boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between" }}><Chip tone="amber" size={26}>{tr(t, "受理側", "Receivers")}</Chip><Chip tone="amber" size={26}>{tr(t, "切り捨て", "truncation")}</Chip></div><div style={{ marginTop: 55, display: "flex", gap: 16, justifyContent: "center" }}>{["B", "A", "C"].map((n, i) => <div key={n} style={{ width: 110, height: 80, borderRadius: 14, background: i === 0 ? colors.amberSoft : colors.surfaceSoft, border: `3px solid ${i === 0 ? colors.amber : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 36, fontWeight: 700, color: i === 0 ? "#9a6420" : colors.mutedSoft, textDecoration: i === 0 ? "none" : "line-through" }}>{n}</div>)}</div><div style={{ marginTop: 42, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.4 }}>{tr(t, "相手が安定マッチングによって変わる人だけが得をできる。", "Only receivers whose partner can differ across stable matchings may gain.")}</div></Card></Abs>
      <Abs x={250} y={720} w={1420} style={{ display: "flex", justifyContent: "center", gap: 28, opacity: progress(frame, cues[2] + 28, 22) }}><Chip tone="muted" size={27}>{tr(t, "相手が一意 → 嘘の余地なし", "unique partner → no gain")}</Chip><Chip tone="amber" size={27}>{tr(t, "相手が複数 → 切り捨ての余地", "several partners → truncation may help")}</Chip></Abs>
      <Abs x={455} y={810} w={1010} style={{ textAlign: "center", opacity: progress(frame, cues[3] + 16, 22) }}><Chip tone="error" size={29}>{tr(t, "安定で、全員に正直が最善な仕組みは存在しない", "No stable mechanism makes truth-telling best for everyone")}</Chip></Abs>
    </SceneShell>
  );
}

export function LargeMarketsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const proposals = progress(frame, cues[0] + 6, 24);
  const formula = progress(frame, cues[1] + 4, 20);
  const balanced = progress(frame, cues[2] + 4, 22);
  const unbalanced = progress(frame, cues[3] + 4, 22);
  const pts = Array.from({ length: 9 }, (_, i) => [210 + i * 112, 700 - Math.log(i + 2) * 82] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <SceneShell kicker={{ ja: "大きな市場", en: "Large markets" }} title={{ ja: "平均では、最悪よりずっと軽い", en: "Average behavior is gentler" }}>
      <Abs x={130} y={230} w={1060} h={610}><Card tone="white" style={{ height: "100%", padding: 34, boxSizing: "border-box" }}><div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700 }}>{tr(t, "ランダムな好みでのスケール", "Scale under random preferences")}</div></Card></Abs>
      <Svg><line x1={210} y1={745} x2={1110} y2={745} stroke={colors.hairlineStrong} strokeWidth={3} /><line x1={210} y1={745} x2={210} y2={300} stroke={colors.hairlineStrong} strokeWidth={3} /><path d={d} fill="none" stroke={colors.coral} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${proposals * 1200} 1200`} /><path d="M 210 733 Q 660 500 1110 340" fill="none" stroke={colors.error} strokeWidth={3} strokeDasharray="14 12" opacity={formula} /></Svg>
      <Abs x={260} y={630} style={{ opacity: proposals }}><Chip tone="coral" size={27}>n Hₙ ≈ n log n</Chip></Abs>
      <Abs x={750} y={360} style={{ opacity: formula }}><Chip tone="error" size={24}>{tr(t, "最悪 n²−n+1 より小さい", "below the n²−n+1 worst case")}</Chip></Abs>
      <Abs x={1240} y={230} w={560} h={285} style={{ opacity: balanced }}><Card tone="soft" style={{ height: "100%", padding: 28, boxSizing: "border-box" }}><Chip tone="muted" size={24}>{tr(t, "同数 n 対 n", "balanced n vs n")}</Chip><div style={{ marginTop: 34, display: "flex", justifyContent: "space-around" }}><Metric label={tr(t, "提案側 平均順位", "proposer rank")} value="log n" /><Metric label={tr(t, "受理側 平均順位", "receiver rank")} value="n/log n" tone="coral" /></div></Card></Abs>
      <Abs x={1240} y={555} w={560} h={285} style={{ opacity: unbalanced }}><Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 28, boxSizing: "border-box" }}><Chip tone="teal" size={24}>{tr(t, "片側が1人多い", "one extra agent")}</Chip><div style={{ marginTop: 30, fontFamily: fonts.sans, fontSize: 28, lineHeight: 1.45 }}>{tr(t, "少ない側は、どちらが申し込んでも平均順位が約 log n。", "The short side averages about log n no matter who proposes.")}</div></Card></Abs>
    </SceneShell>
  );
}

export function ManyToOneScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rural = progress(frame, cues[2] + 4, 22);
  const cutoffs = progress(frame, cues[3] + 4, 22);
  const hospitals = [{ name: "X", admitted: ["B", "E"], cutoff: "B" }, { name: "Y", admitted: ["A", "F"], cutoff: "F" }, { name: "Z", admitted: ["C"], cutoff: null }];
  return (
    <SceneShell kicker={{ ja: "多対一", en: "Many-to-one" }} title={{ ja: "病院は定員分だけ保留する", en: "Hospitals hold up to quota" }}>
      <Abs x={120} y={230} w={570} h={530}><Card tone="soft" style={{ height: "100%", padding: 28, boxSizing: "border-box" }}><Chip tone="coral" size={26}>{tr(t, "研修医", "Residents")}</Chip><div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22, marginTop: 42 }}>{["A", "B", "C", "D", "E", "F"].map((r) => {
        const unmatched = r === "D" && rural > 0;
        return <div key={r} style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 70, height: 70, borderRadius: 18, background: unmatched ? colors.errorSoft : colors.coralSoft, border: `3px solid ${unmatched ? colors.error : colors.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 32, fontWeight: 700, color: unmatched ? colors.error : colors.coralDeep }}>{r}</div>
          <span style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: unmatched ? colors.error : colors.body }}>{unmatched ? tr(t, "未配属", "unmatched") : tr(t, "応募", "applies")}</span>
        </div>;
      })}</div></Card></Abs>
      <Abs x={760} y={230} w={1040} h={530}><Card tone="white" style={{ height: "100%", padding: 28, boxSizing: "border-box" }}><Chip tone="teal" size={26}>{tr(t, "病院", "Hospitals")}</Chip><div style={{ display: "flex", gap: 20, marginTop: 38 }}>{hospitals.map((h, idx) => <div key={h.name} style={{ width: 320, height: 390, borderRadius: 18, border: `3px solid ${h.name === "Z" && rural > 0 ? colors.amber : colors.teal}`, background: h.name === "Z" && rural > 0 ? colors.amberSoft : colors.tealSoft, padding: 18, boxSizing: "border-box" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: fonts.serif, fontSize: 54, fontWeight: 700 }}>{h.name}</span><Chip tone="muted" size={26}>{tr(t, "定員", "quota")} 2</Chip></div><div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>{[0, 1].map((seat) => { const who = h.admitted[seat]; const p = progress(frame, cues[1] + idx * 16 + seat * 12, 16); return <div key={seat} style={{ height: 72, borderRadius: 14, background: who ? "#fff" : "rgba(255,255,255,0.5)", border: `3px ${who ? "solid" : "dashed"} ${who ? colors.teal : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 38, fontWeight: 700, opacity: who ? p : 1 }}>{who ?? tr(t, "空き", "open")}</div>; })}</div><div style={{ marginTop: 20, opacity: cutoffs }}>{h.cutoff ? <Chip tone="coral" size={26}>{tr(t, "カットオフ", "cutoff")} = {h.cutoff}</Chip> : <Chip tone="amber" size={26}>{tr(t, "境界なし", "no cutoff")}</Chip>}</div></div>)}</div></Card></Abs>
      <Abs x={804} y={795} w={632} style={{ textAlign: "center", opacity: cutoffs }}><Chip tone="teal" size={26}>{tr(t, "満員: 最下位採用者がカットオフ", "Full: cutoff is lowest admit")}</Chip></Abs>
      <Abs x={1468} y={795} w={320} style={{ opacity: rural, textAlign: "center" }}><Chip tone="amber" size={24}>{tr(t, "Z定員割れ: Cだけ", "Under-filled Z: only C")}</Chip></Abs>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const p = progress(frame, 20, 20);
  return (
    <EndCard slug="gale-shapley" headline={{ ja: "保留するから、安定する。", en: "Stability comes from deferring acceptance." }}>
      <Abs x={360} y={760} w={1200} style={{ display: "flex", justifyContent: "center", gap: 16, opacity: p }}>
        <Chip tone="teal" size={24}>{tr(t, "安定性", "stability")}</Chip>
        <Chip tone="coral" size={24}>{tr(t, "提案側最適", "proposer-optimal")}</Chip>
        <Chip tone="amber" size={24}>{tr(t, "正直な申告", "truthful proposing")}</Chip>
      </Abs>
      <div style={{ display: "flex", gap: 18, marginTop: 44, opacity: p, transform: `translateY(${(1 - p) * 12}px)`, flexWrap: "wrap", justifyContent: "center", maxWidth: 1350 }}>
        <Chip tone="coral" size={26}>{tr(t, "ブロッキングペア", "blocking pairs")}</Chip>
        <Chip tone="teal" size={26}>{tr(t, "受入保留", "deferred acceptance")}</Chip>
        <Chip tone="amber" size={26}>{tr(t, "束と戦略", "lattices and strategy")}</Chip>
        <Chip tone="muted" size={26}>{tr(t, "ランダム市場のデモ", "random-market demos")}</Chip>
      </div>
    </EndCard>
  );
}
