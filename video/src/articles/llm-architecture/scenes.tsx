import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

function Txt({ children, size = 28, weight = 500, color = colors.body, style }: { children: ReactNode; size?: number; weight?: number; color?: string; style?: CSSProperties }) {
  return <div style={{ fontFamily: fonts.sans, fontSize: size, fontWeight: weight, color, lineHeight: 1.25, ...style }}>{children}</div>;
}

function Mono({ children, size = 26, color = colors.body, style }: { children: ReactNode; size?: number; color?: string; style?: CSSProperties }) {
  return <span style={{ fontFamily: fonts.mono, fontSize: size, fontWeight: 700, color, ...style }}>{children}</span>;
}

function BigBox({ x, y, w, h, children, tone = "white", accent, style }: { x: number; y: number; w: number; h: number; children: ReactNode; tone?: "white" | "soft" | "dark" | "card"; accent?: string; style?: CSSProperties }) {
  return (
    <Abs x={x} y={y} w={w} h={h} style={style}>
      <Card tone={tone} accent={accent} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
        {children}
      </Card>
    </Abs>
  );
}

function TokenBox({ x, y, label, tone = "muted", active = 1, w = 130, h = 78, fontSize = 28 }: { x: number; y: number; label: ReactNode; tone?: "coral" | "teal" | "amber" | "muted" | "ink"; active?: number; w?: number; h?: number; fontSize?: number }) {
  const palette = {
    coral: [colors.coralSoft, colors.coral],
    teal: [colors.tealSoft, colors.teal],
    amber: [colors.amberSoft, colors.amber],
    muted: ["#fff", colors.hairlineStrong],
    ink: [colors.darkElevated, colors.ink],
  } as const;
  const [bg, border] = palette[tone];
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          border: `4px solid ${mixColor(colors.hairlineStrong, border, active)}`,
          background: mixColor("#ffffff", bg, active),
          color: tone === "ink" ? colors.onDark : colors.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize,
          fontWeight: 800,
          boxShadow: "0 12px 26px rgba(20,20,19,0.08)",
          textAlign: "center",
        }}
      >
        {label}
      </div>
    </Abs>
  );
}

function IntroArt() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const tokens = [
    { ja: "LLM", en: "LLM" },
    { ja: "トークン", en: "Token" },
    { ja: "QKᵀ", en: "QKᵀ" },
    { ja: "softmax", en: "softmax" },
    { ja: "次", en: "next" },
  ];
  const boxes = [
    { x: 1150, w: 100 },
    { x: 1262, w: 140 },
    { x: 1414, w: 105 },
    { x: 1531, w: 160 },
    { x: 1703, w: 90 },
  ];
  const qktCenter = boxes[2].x + boxes[2].w / 2;
  return (
    <>
      <Svg>
        {boxes.slice(0, -1).map((box, i) => (
          <Arrow key={i} x1={box.x + box.w + 8} y1={410} x2={boxes[i + 1].x - 8} y2={410} p={progress(frame, 22 + i * 8, 18)} color={colors.coral} width={5} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <Arrow
            key={`down-${i}`}
            x1={qktCenter}
            y1={460}
            x2={1245 + i * 115}
            y2={570}
            p={progress(frame, 56 + i * 4, 18)}
            color={colors.teal}
            width={4}
            bend={(i - 2) * 22}
            opacity={0.75}
          />
        ))}
      </Svg>
      {tokens.map((tok, i) => {
        const s = pop(frame, 12 + i * 8, fps);
        return <TokenBox key={tok.en} x={boxes[i].x} y={360} w={boxes[i].w} h={100} label={t(tok)} tone={i === 0 ? "ink" : i === 4 ? "teal" : "coral"} active={Math.min(1, s)} />;
      })}
      <Abs x={1210} y={570} w={540} h={270}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {Array.from({ length: 36 }, (_, i) => {
              const p = progress(frame, 44 + i * 1.5, 12);
              return <div key={i} style={{ height: 22, borderRadius: 5, background: mixColor(colors.darkElevated, i % 7 === 0 ? colors.coral : colors.teal, p), opacity: 0.35 + p * 0.6 }} />;
            })}
          </div>
          <div style={{ marginTop: 16, fontFamily: fonts.mono, fontSize: 24, color: colors.onDark, opacity: progress(frame, 84, 16) }}>{t({ ja: "予測 → 追加 → 反復", en: "predict → append → repeat" })}</div>
        </Card>
      </Abs>
    </>
  );
}

export function IntroScene() {
  return (
    <TitleCard
      title={{ ja: "大規模言語モデルの\n系譜と仕組み", en: "How Large Language\nModels Work" }}
      subtitle={{ ja: "Word2VecからTransformer、RLHFまでをアニメーションでたどる", en: "From Word2Vec to Transformers and RLHF, animated step by step" }}
      art={<IntroArt />}
    />
  );
}

export function LineageScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const a = progress(frame, cues[0] + 8, 18);
  const b = progress(frame, cues[1] + 2, 18);
  const years = [
    { x: 190, year: "2013", title: { ja: "Word2Vec", en: "Word2Vec" }, body: { ja: "単語 → ベクトル\n文脈では変わらない", en: "word → vector\nstatic across contexts" }, tone: "amber" as const },
    { x: 710, year: "2017", title: { ja: "Transformer", en: "Transformer" }, body: { ja: "逐次処理を\n自己注意で置換", en: "replaces sequence\nsteps with attention" }, tone: "coral" as const },
    { x: 1230, year: "2018–", title: { ja: "事前学習時代", en: "Pre-training era" }, body: { ja: "BERT · T5 · GPT\n大規模化へ", en: "BERT · T5 · GPT\nscaling up" }, tone: "teal" as const },
  ];
  return (
    <SceneShell kicker={{ ja: "系譜", en: "Lineage" }} title={{ ja: "静的な単語ベクトルから、自己注意へ", en: "From static word vectors to self-attention" }}>
      <Svg>
        <Arrow x1={250} y1={520} x2={1650} y2={520} p={progress(frame, cues[0] + 16, 44)} color={colors.hairlineStrong} width={6} head={false} />
        <Arrow x1={530} y1={520} x2={710} y2={520} p={progress(frame, cues[1] - 12, 24)} color={colors.coral} width={8} />
      </Svg>
      {years.map((item, i) => {
        const on = i < 2 ? Math.min(1, a + b) : b;
        const accent = item.tone === "coral" ? colors.coral : item.tone === "teal" ? colors.teal : colors.amber;
        return (
          <Abs key={item.year} x={item.x} y={330} w={430} h={380} style={{ opacity: on, transform: `translateY(${(1 - on) * 18}px)` }}>
            <Card tone="white" accent={accent} style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
              <Mono size={38} color={accent}>{item.year}</Mono>
              <div style={{ marginTop: 24, fontFamily: fonts.serif, fontSize: 46, color: colors.ink }}>{t(item.title)}</div>
              <Txt size={30} style={{ marginTop: 26, whiteSpace: "pre-line" }}>{t(item.body)}</Txt>
            </Card>
          </Abs>
        );
      })}
      <Abs x={245} y={770} w={1440} style={{ display: "flex", gap: 18, justifyContent: "center", opacity: b }}>
        <Chip tone="coral" size={28}>{t({ ja: "RNNの逐次処理", en: "RNN sequence steps" })}</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "自己注意で並列化", en: "parallelized by self-attention" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function FamiliesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const families = [
    { id: "BERT", x: 190, y: 490, title: { ja: "BERT系", en: "BERT family" }, task: { ja: "マスク予測\n理解タスク", en: "masked tokens\nunderstanding" }, tone: "amber" as const, at: cues[1] },
    { id: "T5", x: 745, y: 490, title: { ja: "T5系", en: "T5 family" }, task: { ja: "text → text\n翻訳・要約・QA", en: "text → text\ntranslation · summary · QA" }, tone: "teal" as const, at: cues[2] },
    { id: "GPT", x: 1300, y: 490, title: { ja: "GPT系", en: "GPT family" }, task: { ja: "左から右へ\n1トークンずつ", en: "left to right\none token at a time" }, tone: "coral" as const, at: cues[2] },
  ];
  return (
    <SceneShell kicker={{ ja: "ファミリー", en: "Families" }} title={{ ja: "Transformerから伸びた3つの系統", en: "Three branches from the Transformer" }}>
      <Svg>
        <Arrow x1={960} y1={350} x2={405} y2={490} p={progress(frame, cues[0] + 20, 22)} color={colors.hairlineStrong} width={5} />
        <Arrow x1={960} y1={350} x2={960} y2={490} p={progress(frame, cues[0] + 28, 22)} color={colors.hairlineStrong} width={5} />
        <Arrow x1={960} y1={350} x2={1515} y2={490} p={progress(frame, cues[0] + 36, 22)} color={colors.hairlineStrong} width={5} />
      </Svg>
      <Abs x={715} y={230} w={490} h={140} style={{ opacity: progress(frame, cues[0] + 4, 16) }}>
        <Card tone="dark" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 50, color: colors.onDark }}>Transformer</div>
            <Txt size={24} color={colors.onDarkSoft}>{t({ ja: "2018年以降の基盤", en: "base for the 2018+ era" })}</Txt>
          </div>
        </Card>
      </Abs>
      {families.map((f) => {
        const on = progress(frame, f.at, 18);
        return (
          <Abs key={f.id} x={f.x} y={f.y} w={430} h={300} style={{ opacity: on, transform: `translateY(${(1 - on) * 22}px)` }}>
            <Card tone="white" accent={f.tone === "coral" ? colors.coral : f.tone === "teal" ? colors.teal : colors.amber} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
              <Chip tone={f.tone} size={30}>{f.id}</Chip>
              <div style={{ marginTop: 24, fontFamily: fonts.serif, fontSize: 42 }}>{t(f.title)}</div>
              <Txt size={30} style={{ marginTop: 22, whiteSpace: "pre-line" }}>{t(f.task)}</Txt>
            </Card>
          </Abs>
        );
      })}
      <Abs x={1260} y={815} w={510} h={58} style={{ opacity: progress(frame, cues[3], 18), display: "flex", gap: 14, justifyContent: "center" }}>
        {["GPT-3", "ChatGPT", "Claude", "Gemini"].map((m) => <Chip key={m} tone="coral" size={24}>{m}</Chip>)}
      </Abs>
    </SceneShell>
  );
}

export function ScalingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const curve = progress(frame, cues[0] + 8, 42);
  const chin = progress(frame, cues[1] + 4, 20);
  const ratio = progress(frame, cues[2] + 4, 24);
  const points = [[130, 125], [300, 205], [530, 295], [790, 365], [980, 435], [1080, 500]];
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <SceneShell kicker={{ ja: "スケーリング則", en: "Scaling laws" }} title={{ ja: "大きくすると、損失はべき乗則で下がる", en: "Scale up, and loss follows a power law" }}>
      <BigBox x={120} y={230} w={1120} h={600} tone="white">
        <Svg>
          <line x1={130} y1={500} x2={1080} y2={500} stroke={colors.ink} strokeWidth={4} />
          <line x1={130} y1={500} x2={130} y2={100} stroke={colors.ink} strokeWidth={4} />
          <path d={d} stroke={colors.coral} strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray={`${curve * 1500} 1500`} />
          {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={12} fill={i < curve * points.length ? colors.coral : colors.surfaceCream} />)}
        </Svg>
        <Abs x={160} y={110} w={260}><Mono size={30} color={colors.coralDeep}>L(x) ∝ x^-α</Mono></Abs>
        <Abs x={150} y={530}><Txt size={25}>{t({ ja: "パラメータ · データ · 計算量", en: "parameters · data · compute" })}</Txt></Abs>
      </BigBox>
      <Abs x={1310} y={250} w={490} h={250} style={{ opacity: chin, transform: `translateX(${(1 - chin) * 24}px)` }}>
        <Card tone="soft" accent={colors.amber} style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <Chip tone="amber" size={26}>2022 · Chinchilla</Chip>
          <Txt size={31} weight={600} style={{ marginTop: 26 }}>{t({ ja: "計算最適なら、従来より多くの学習トークンが必要", en: "Compute-optimal models need far more training tokens" })}</Txt>
        </Card>
      </Abs>
      <Abs x={1310} y={545} w={490} h={285} style={{ opacity: ratio, transform: `translateX(${(1 - ratio) * 24}px)` }}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box", textAlign: "center" }}>
          <Txt size={26} weight={700} color={colors.tealDeep}>{t({ ja: "同論文の設定", en: "In that setup" })}</Txt>
          <div style={{ marginTop: 18 }}><Mono size={50} color={colors.tealDeep}>20</Mono><Txt size={28} style={{ display: "inline", marginLeft: 8 }}>{t({ ja: "トークン / パラメータ", en: "tokens / parameter" })}</Txt></div>
          <div style={{ marginTop: 26, height: 20, borderRadius: 10, background: colors.surfaceCream, overflow: "hidden" }}><div style={{ width: `${ratio * 100}%`, height: "100%", background: colors.teal }} /></div>
          <Txt size={26} style={{ marginTop: 22 }}>70B → 1.4T tokens</Txt>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function TokenizationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const chars = ["t", "r", "a", "n", "s", "f", "o", "r", "m", "e", "r"];
  const pairs = [[0, 1, "tr"], [5, 6, "fo"], [7, 8, "rm"], [9, 10, "er"]] as const;
  const mergeP = progress(frame, cues[1] + 10, 70, (x) => x);
  const vocab = progress(frame, cues[2] + 5, 24);
  return (
    <SceneShell kicker={{ ja: "トークナイゼーション", en: "Tokenization" }} title={{ ja: "BPEは、よく出るペアをマージする", en: "BPE merges frequent pairs" }}>
      <Abs x={120} y={250} w={1680} h={160}>
        <Card tone="dark" style={{ width: "100%", height: "100%", padding: "30px 36px", boxSizing: "border-box" }}>
          <Txt size={32} color={colors.onDark} weight={700}>{t({ ja: "テキスト", en: "Text" })}</Txt>
          <div style={{ marginTop: 16, fontFamily: fonts.mono, fontSize: 44, color: colors.onDark }}>"transformer architecture"</div>
        </Card>
      </Abs>
      <Svg>
        {pairs.map(([a, b], i) => {
          const p = Math.min(1, Math.max(0, mergeP * 4 - i));
          return <Arrow key={i} x1={190 + a * 125 + 55} y1={555} x2={190 + b * 125 + 55} y2={555} p={p} color={colors.coral} width={8} head={false} bend={-44} opacity={0.8} />;
        })}
      </Svg>
      {chars.map((c, i) => {
        const pairIndex = pairs.findIndex(([a, b]) => i === a || i === b);
        const active = pairIndex >= 0 ? progress(frame, cues[1] + 10 + pairIndex * 16, 16) : 0;
        return <TokenBox key={i} x={190 + i * 125} y={500} w={108} h={90} label={c} tone={pairIndex >= 0 ? "coral" : "muted"} active={Math.max(progress(frame, cues[0] + i * 2, 10), active)} />;
      })}
      {pairs.map(([a, , text], i) => <TokenBox key={text} x={212 + a * 125} y={660} w={180} h={86} label={text} tone="teal" active={Math.min(1, Math.max(0, mergeP * 4 - i))} />)}
      <Abs x={120} y={800} w={820} h={80} style={{ display: "flex", alignItems: "center", gap: 18, opacity: progress(frame, cues[1] + 8, 18) }}>
        <Chip tone="coral" size={28}>{t({ ja: "最頻ペア", en: "most frequent pair" })}</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "新しいトークン", en: "new token" })}</Chip>
      </Abs>
      <Abs x={1010} y={766} w={790} h={105} style={{ opacity: vocab }}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-around", gap: 18 }}>
          <Txt size={26} weight={700} style={{ minWidth: 210 }}>{t({ ja: "GPT-4の語彙", en: "GPT-4 vocabulary" })}</Txt>
          <Mono size={48} color={colors.tealDeep}>≈100K</Mono>
          <Txt size={24} style={{ width: 300 }}>{t({ ja: "日本語1文字も\n1+トークンに", en: "one Japanese character\noften takes 1+ tokens" })}</Txt>
        </Card>
      </Abs>
    </SceneShell>
  );
}

export function PositionsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rope = progress(frame, cues[2] + 2, 22);
  const rel = progress(frame, cues[3] + 4, 20);
  const angle = (frame - cues[2]) * 0.035;
  return (
    <SceneShell kicker={{ ja: "位置情報", en: "Position" }} title={{ ja: "並列処理には、順序の注入が必要", en: "Parallel tokens still need order" }}>
      <BigBox x={120} y={250} w={710} h={590} tone="white" accent={colors.coral}>
        <Txt size={30} weight={700}>{t({ ja: "トークンID → 4096次元の埋め込み", en: "Token ID → 4096-dimensional embedding" })}</Txt>
        <div style={{ display: "flex", gap: 16, marginTop: 38, alignItems: "flex-end" }}>
          {Array.from({ length: 11 }, (_, i) => {
            const h = 110 + ((i * 73) % 220);
            const p = progress(frame, cues[0] + i * 2, 14);
            return <div key={i} style={{ width: 42, height: h * p, borderRadius: 10, background: i % 2 ? colors.coralSoft : colors.coral, border: `3px solid ${colors.coral}`, opacity: 0.85 }} />;
          })}
        </div>
        <div style={{ marginTop: 36, height: 26, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}><div style={{ width: `${progress(frame, cues[0] + 8, 24) * 100}%`, height: "100%", background: colors.coral }} /></div>
        <Txt size={26} style={{ marginTop: 20 }}>{t({ ja: "RNNと違い、入力を並列に処理する", en: "Unlike RNNs, inputs are processed in parallel" })}</Txt>
      </BigBox>
      <BigBox x={910} y={250} w={890} h={590} tone="soft" accent={colors.teal}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Txt size={32} weight={700}>RoPE</Txt>
          <Chip tone="teal" size={24}>{t({ ja: "次元のペアを回転", en: "rotate dimension pairs" })}</Chip>
        </div>
      </BigBox>
      <Svg>
        {[0, 1, 2, 3].map((_, i) => {
          const cx = 1065 + i * 175;
          const cy = 535;
          const a = angle + i * 0.65;
          return (
            <g key={i} opacity={rope}>
              <circle cx={cx} cy={cy} r={92} fill="#fff" stroke={colors.hairlineStrong} strokeWidth={3} />
              <line x1={cx - 96} y1={cy} x2={cx + 96} y2={cy} stroke={colors.hairlineStrong} strokeWidth={2} />
              <line x1={cx} y1={cy - 96} x2={cx} y2={cy + 96} stroke={colors.hairlineStrong} strokeWidth={2} />
              <Arrow x1={cx} y1={cy} x2={cx + Math.cos(a) * 82} y2={cy + Math.sin(a) * 82} p={rope} color={colors.teal} width={7} />
              <text x={cx} y={cy + 138} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={700} fill={colors.tealDeep}>({i * 2}, {i * 2 + 1})</text>
            </g>
          );
        })}
        <Arrow x1={1110} y1={760} x2={1570} y2={760} p={rel} color={colors.coral} width={6} />
      </Svg>
      <Abs x={975} y={328} w={760} style={{ opacity: progress(frame, cues[2], 18) }}>
        <Txt size={28}>{t({ ja: "位置に応じた角度で2D回転を適用", en: "apply 2D rotations at position-dependent angles" })}</Txt>
      </Abs>
      <Abs x={1120} y={762} w={520} style={{ opacity: rel, textAlign: "center" }}>
        <Chip tone="coral" size={27}>{t({ ja: "内積に効くのは相対位置", en: "dot product sees relative position" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function AttentionScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const tokens = [
    { ja: "吾輩", en: "The" },
    { ja: "猫", en: "cat" },
    { ja: "座る", en: "sat" },
    { ja: "そこ", en: "there" },
  ];
  const qkv = progress(frame, cues[0] + 8, 24);
  const scores = progress(frame, cues[1] + 4, 32);
  const mix = progress(frame, cues[2] + 4, 28);
  return (
    <SceneShell kicker={{ ja: "自己注意", en: "Self-attention" }} title={{ ja: "Query・Key・Valueで、文脈を作る", en: "Queries, keys and values build context" }}>
      <Svg>
        {tokens.map((_, i) => <Arrow key={i} x1={300 + i * 250} y1={410} x2={300 + i * 250} y2={570} p={qkv} color={colors.coral} width={4} />)}
        {[0, 1, 2, 3].map((i) => (
          <g key={`score-${i}`}>
            <Arrow x1={300 + i * 250} y1={700} x2={300 + i * 250} y2={718 + i * 13} p={scores} color={i === 1 ? colors.coral : colors.hairlineStrong} width={i === 1 ? 7 : 4} head={false} />
            <Arrow x1={300 + i * 250} y1={718 + i * 13} x2={1160} y2={718 + i * 13} p={scores} color={i === 1 ? colors.coral : colors.hairlineStrong} width={i === 1 ? 7 : 4} />
          </g>
        ))}
        {[0, 1, 2, 3].map((i) => <Packet key={`p-${i}`} x1={1235 + i * 100} y1={720} x2={1510} y2={720} start={cues[2] + 6 + i * 7} dur={30} color={i === 1 ? colors.coral : colors.teal} r={13} label={`V${i + 1}`} />)}
      </Svg>
      {tokens.map((tok, i) => <TokenBox key={tok.en} x={235 + i * 250} y={300} w={130} h={85} label={t(tok)} tone={i === 1 ? "coral" : "muted"} active={1} />)}
      {tokens.map((_, i) => (
        <Abs key={i} x={228 + i * 250} y={555} w={145} h={145} style={{ opacity: qkv }}>
          <Card tone="white" accent={i === 1 ? colors.coral : colors.hairlineStrong} style={{ width: "100%", height: "100%", padding: 12, boxSizing: "border-box" }}>
            {["Q", "K", "V"].map((l, j) => <div key={l} style={{ fontFamily: fonts.mono, fontSize: 24, fontWeight: 800, color: j === 0 && i === 0 ? colors.coralDeep : colors.body, lineHeight: 1.55 }}>{l}<span style={{ color: colors.mutedSoft }}>{i + 1}</span></div>)}
          </Card>
        </Abs>
      ))}
      <BigBox x={1160} y={520} w={520} h={245} tone="soft" accent={colors.coral} style={{ opacity: scores }}>
        <Txt size={27} weight={700}>{t({ ja: "QとKの内積 → softmax", en: "Q·K scores → softmax" })}</Txt>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: 24 }}>
          {[0.18, 0.52, 0.2, 0.1].map((v, i) => <div key={i} style={{ width: 82, height: 125 * v + 30, borderRadius: 10, background: i === 1 ? colors.coral : colors.surfaceCream, border: `3px solid ${i === 1 ? colors.coralDeep : colors.hairlineStrong}` }} />)}
        </div>
      </BigBox>
      <BigBox x={1320} y={795} w={380} h={85} tone="white" accent={colors.teal} style={{ opacity: mix }}>
        <Txt size={28} weight={700} color={colors.tealDeep}>{t({ ja: "文脈化された表現", en: "context-aware vector" })}</Txt>
      </BigBox>
    </SceneShell>
  );
}

export function HeadsMaskScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const headP = progress(frame, cues[0] + 4, 24);
  const maskP = progress(frame, cues[1] + 2, 24);
  const n = 6;
  const cell = 70;
  return (
    <SceneShell kicker={{ ja: "ヘッドとマスク", en: "Heads + mask" }} title={{ ja: "複数の関係を並列に見て、未来は隠す", en: "Parallel relations, future hidden" }}>
      <BigBox x={120} y={250} w={810} h={610} tone="white" accent={colors.coral} style={{ opacity: headP }}>
        <Txt size={32} weight={700}>{t({ ja: "マルチヘッド注意", en: "Multi-head attention" })}</Txt>
        {[
          { ja: "主語 ↔ 動詞", en: "subject ↔ verb" },
          { ja: "修飾語 ↔ 名詞", en: "modifier ↔ noun" },
          { ja: "共参照", en: "coreference" },
          { ja: "語順パターン", en: "word-order pattern" },
        ].map((label, i) => (
          <div key={i}>
            <Abs x={60} y={130 + i * 92} w={185} h={68}><Chip tone={i === 0 ? "coral" : i === 1 ? "teal" : "amber"} size={25}>{t({ ja: `ヘッド ${i + 1}`, en: `Head ${i + 1}` })}</Chip></Abs>
            <Abs x={265} y={120 + i * 92} w={470} h={78}><Card tone="soft" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Txt size={28} weight={650}>{t(label)}</Txt></Card></Abs>
          </div>
        ))}
      </BigBox>
      <BigBox x={980} y={250} w={820} h={610} tone="soft" accent={colors.teal} style={{ opacity: maskP }}>
        <Txt size={32} weight={700}>{t({ ja: "因果マスク", en: "Causal mask" })}</Txt>
      </BigBox>
      <Abs x={1050} y={330} w={520} h={520} style={{ opacity: maskP }}>
        {Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => {
          const future = c > r;
          return (
            <div key={`${r}-${c}`} style={{ position: "absolute", left: c * cell, top: r * cell, width: cell - 6, height: cell - 6, borderRadius: 8, background: future ? colors.errorSoft : colors.tealSoft, border: `3px solid ${future ? colors.error : colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: future ? 25 : 22, fontWeight: 800, color: future ? colors.error : colors.tealDeep, opacity: progress(frame, cues[1] + (r + c) * 1.5, 10) }}>
              {future ? "−∞" : "0"}
            </div>
          );
        }))}
      </Abs>
      <Abs x={1520} y={365} w={220} style={{ opacity: maskP }}><Chip tone="error" size={26}>{t({ ja: "未来 = −∞", en: "future = −∞" })}</Chip></Abs>
      <Abs x={1520} y={455} w={230} style={{ opacity: maskP }}><Chip tone="teal" size={26}>{t({ ja: "過去 = 見える", en: "past = visible" })}</Chip></Abs>
      <Abs x={1040} y={790} w={675} style={{ opacity: maskP, textAlign: "center" }}><Txt size={29} weight={700}>{t({ ja: "softmax後、未来の重みはゼロ", en: "after softmax, future weights are zero" })}</Txt></Abs>
    </SceneShell>
  );
}

export function BlockScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const p0 = progress(frame, cues[0] + 4, 22);
  const p1 = progress(frame, cues[1] + 4, 20);
  const p2 = progress(frame, cues[2] + 4, 20);
  const p3 = progress(frame, cues[3] + 4, 20);
  const boxes = [
    { x: 110, y: 392, w: 200, h: 138, label: { ja: "入力 x", en: "input x" }, tone: "muted" as const },
    { x: 375, y: 392, w: 215, h: 138, label: { ja: "正規化", en: "Norm" }, tone: "amber" as const },
    { x: 655, y: 392, w: 300, h: 138, label: { ja: "自己注意", en: "Self-attn" }, tone: "coral" as const },
    { x: 1110, y: 392, w: 195, h: 138, label: { ja: "正規化", en: "Norm" }, tone: "amber" as const },
    { x: 1365, y: 392, w: 190, h: 138, label: { ja: "FFN", en: "FFN" }, tone: "teal" as const },
    { x: 1680, y: 392, w: 140, h: 138, label: { ja: "出力", en: "output" }, tone: "muted" as const },
  ];
  return (
    <SceneShell kicker={{ ja: "ブロック", en: "Block" }} title={{ ja: "2つのサブ層を、正規化と残差で包む", en: "Two sublayers wrapped by norm and residuals" }}>
      <Svg>
        <Arrow x1={310} y1={461} x2={375} y2={461} p={p0} color={colors.coral} width={7} />
        <Arrow x1={590} y1={461} x2={655} y2={461} p={p0} color={colors.coral} width={7} />
        <Arrow x1={955} y1={461} x2={985} y2={461} p={p1} color={colors.coral} width={7} />
        <Arrow x1={1075} y1={461} x2={1110} y2={461} p={p2} color={colors.hairlineStrong} width={6} />
        <Arrow x1={1305} y1={461} x2={1365} y2={461} p={p2} color={colors.teal} width={7} />
        <Arrow x1={1555} y1={461} x2={1570} y2={461} p={p3} color={colors.teal} width={7} />
        <Arrow x1={1660} y1={461} x2={1680} y2={461} p={p3} color={colors.teal} width={7} />
        <Arrow x1={330} y1={461} x2={330} y2={315} p={p1} color={colors.amber} width={6} head={false} />
        <Arrow x1={330} y1={315} x2={1030} y2={315} p={p1} color={colors.amber} width={6} head={false} />
        <Arrow x1={1030} y1={315} x2={1030} y2={416} p={p1} color={colors.amber} width={6} />
        <Arrow x1={1090} y1={461} x2={1090} y2={585} p={p3} color={colors.amber} width={6} head={false} />
        <Arrow x1={1090} y1={585} x2={1630} y2={585} p={p3} color={colors.amber} width={6} head={false} />
        <Arrow x1={1630} y1={585} x2={1630} y2={506} p={p3} color={colors.amber} width={6} />
        <circle cx={330} cy={461} r={10} fill={colors.amber} opacity={p1} />
        <circle cx={1090} cy={461} r={10} fill={colors.amber} opacity={p3} />
      </Svg>
      {boxes.map((b, i) => (
        <TokenBox key={i} x={b.x} y={b.y} w={b.w} h={b.h} label={t(b.label)} tone={b.tone} active={progress(frame, cues[0] + i * 5, 16)} fontSize={34} />
      ))}
      <Abs x={985} y={416} w={90} h={90} style={{ opacity: p1 }}>
        <div style={{ width: 90, height: 90, borderRadius: 999, background: colors.amberSoft, border: `5px solid ${colors.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 50, fontWeight: 900 }}>+</div>
      </Abs>
      <Abs x={1570} y={416} w={90} h={90} style={{ opacity: p3 }}>
        <div style={{ width: 90, height: 90, borderRadius: 999, background: colors.amberSoft, border: `5px solid ${colors.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 50, fontWeight: 900 }}>+</div>
      </Abs>
      <Abs x={120} y={800} w={1680} style={{ display: "flex", justifyContent: "center", gap: 18 }}>
        <Chip tone="amber" size={28}>{t({ ja: "残差接続 = 勾配のショートカット", en: "residual = gradient shortcut" })}</Chip>
        <Chip tone="coral" size={28}>Pre-LN</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "FFN ≈ パラメータの2/3", en: "FFN ≈ two thirds of parameters" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function GenerationScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const probs = [0.42, 0.24, 0.16, 0.1, 0.08];
  const labels = [
    { ja: "猫", en: "cat" },
    { ja: "犬", en: "dog" },
    { ja: "モデル", en: "model" },
    { ja: "トークン", en: "token" },
    { ja: "木", en: "tree" },
  ];
  const p0 = progress(frame, cues[0] + 4, 20);
  const sample = progress(frame, cues[1] + 4, 22);
  return (
    <SceneShell kicker={{ ja: "生成", en: "Generation" }} title={{ ja: "分布から選び、追加し、繰り返す", en: "Sample, append, repeat" }}>
      <BigBox x={120} y={245} w={760} h={610} tone="white" accent={colors.coral} style={{ opacity: p0 }}>
        <Txt size={32} weight={700}>{t({ ja: "次トークン確率", en: "Next-token probabilities" })}</Txt>
        <div style={{ marginTop: 30 }}>
          {probs.map((v, i) => (
            <div key={labels[i].en} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 21 }}>
              <Mono size={24} style={{ width: 95 }}>{t(labels[i])}</Mono>
              <div style={{ width: 430, height: 42, borderRadius: 12, background: colors.surfaceCream, overflow: "hidden" }}><div style={{ width: `${v * 100 * p0}%`, height: "100%", background: i === 0 ? colors.coral : colors.teal }} /></div>
              <Mono size={24} color={i === 0 ? colors.coralDeep : colors.tealDeep}>{Math.round(v * 100)}%</Mono>
            </div>
          ))}
        </div>
      </BigBox>
      <Svg>
        <Arrow x1={880} y1={550} x2={1050} y2={550} p={sample} color={colors.coral} width={7} />
        <Arrow x1={1330} y1={550} x2={1520} y2={550} p={sample} color={colors.teal} width={7} />
        <Arrow x1={1605} y1={650} x2={1040} y2={650} p={progress(frame, cues[1] + 35, 34)} color={colors.hairlineStrong} width={5} bend={130} dashed />
      </Svg>
      <BigBox x={1050} y={330} w={280} h={420} tone="soft" accent={colors.coral} style={{ opacity: sample }}>
        <Txt size={30} weight={700} style={{ textAlign: "center" }}>{t({ ja: "選ぶ", en: "sample" })}</Txt>
        <div style={{ margin: "55px auto", width: 145, height: 145, borderRadius: 999, background: colors.coral, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: fonts.mono, fontSize: 34, fontWeight: 800, transform: `scale(${0.85 + sample * 0.15})` }}>{t({ ja: "猫", en: "cat" })}</div>
      </BigBox>
      <BigBox x={1460} y={330} w={340} h={420} tone="white" accent={colors.teal} style={{ opacity: sample }}>
        <Txt size={30} weight={700} style={{ textAlign: "center" }}>{t({ ja: "文脈に追加", en: "append" })}</Txt>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 45, justifyContent: "center" }}>
          {[
            { ja: "小さな", en: "The" },
            { ja: "猫", en: "small" },
            { ja: "です", en: "cat" },
          ].map((w, i) => <Chip key={w.en} tone={i === 2 ? "teal" : "muted"} size={28}>{t(w)}</Chip>)}
        </div>
        <Txt size={26} color={colors.tealDeep} weight={700} style={{ textAlign: "center", marginTop: 70 }}>{t({ ja: "同じ処理を繰り返す", en: "repeat the same loop" })}</Txt>
      </BigBox>
      <Abs x={900} y={805} w={900} style={{ display: "flex", justifyContent: "center", gap: 18 }}>
        <Chip tone="amber" size={28}>{t({ ja: "温度 T↓ = 決定的 / T↑ = 多様", en: "temperature T↓ = deterministic / T↑ = diverse" })}</Chip>
        <Chip tone="teal" size={28}>top-k · top-p</Chip>
      </Abs>
    </SceneShell>
  );
}

export function TrainingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const stages = [
    { x: 135, title: { ja: "事前学習", en: "Pre-training" }, body: { ja: "Web・書籍・コード\n数兆トークン", en: "web · books · code\ntrillions of tokens" }, tone: "coral" as const, at: cues[0] },
    { x: 545, title: { ja: "SFT", en: "SFT" }, body: { ja: "約10万件の\n指示・応答ペア", en: "~100K instruction\nresponse pairs" }, tone: "amber" as const, at: cues[1] },
    { x: 955, title: { ja: "報酬モデル", en: "Reward model" }, body: { ja: "人間のランキング\nから学習", en: "learns from\nhuman rankings" }, tone: "teal" as const, at: cues[2] },
    { x: 1365, title: { ja: "PPO + KL", en: "PPO + KL" }, body: { ja: "報酬最大化\n乖離を抑制", en: "maximize reward\nlimit drift" }, tone: "coral" as const, at: cues[3] },
  ];
  return (
    <SceneShell kicker={{ ja: "学習", en: "Training" }} title={{ ja: "次トークン予測器を、対話AIへ", en: "From next-token predictor to chat model" }}>
      <Svg>
        {stages.slice(0, -1).map((s, i) => <Arrow key={i} x1={s.x + 300} y1={520} x2={stages[i + 1].x - 25} y2={520} p={progress(frame, stages[i + 1].at - 10, 24)} color={colors.hairlineStrong} width={6} />)}
        {stages.slice(0, -1).map((s, i) => <Packet key={`packet-${i}`} x1={s.x + 300} y1={520} x2={stages[i + 1].x - 25} y2={520} start={stages[i + 1].at - 4} dur={32} color={i === 0 ? colors.amber : colors.teal} r={13} />)}
      </Svg>
      {stages.map((s) => {
        const on = progress(frame, s.at + 4, 18);
        return (
          <Abs key={t(s.title)} x={s.x} y={330} w={330} h={380} style={{ opacity: on, transform: `translateY(${(1 - on) * 18}px)` }}>
            <Card tone="white" accent={s.tone === "coral" ? colors.coral : s.tone === "teal" ? colors.teal : colors.amber} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
              <Chip tone={s.tone} size={26}>{t(s.title)}</Chip>
              <Txt size={30} weight={700} style={{ marginTop: 35, whiteSpace: "pre-line" }}>{t(s.body)}</Txt>
              <div style={{ marginTop: 44, height: 12, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}><div style={{ width: `${on * 100}%`, height: "100%", background: s.tone === "teal" ? colors.teal : s.tone === "amber" ? colors.amber : colors.coral }} /></div>
            </Card>
          </Abs>
        );
      })}
      <Abs x={145} y={760} w={1580} style={{ display: "flex", justifyContent: "space-between", opacity: progress(frame, cues[1], 20) }}>
        <Chip tone="muted" size={25}>{t({ ja: "続きを書ける", en: "can continue text" })}</Chip>
        <Chip tone="amber" size={25}>{t({ ja: "質問に答える形式を学ぶ", en: "learns answer format" })}</Chip>
        <Chip tone="teal" size={25}>{t({ ja: "人間の選好に合わせる", en: "aligns to human preferences" })}</Chip>
        <Chip tone="coral" size={25}>{t({ ja: "元モデルから離れすぎない", en: "does not drift too far" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const a = progress(frame, 20, 20);
  return (
    <EndCard slug="llm-architecture" headline={{ ja: "流暢さの正体は、次トークン予測を大規模にスケールさせること。", en: "Fluency comes from scaling one simple principle: predict the next token." }}>
      <div style={{ display: "flex", gap: 20, marginTop: 42, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
        <Chip tone="coral" size={28}>{t({ ja: "自己注意デモ", en: "Self-attention demo" })}</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "テキスト生成デモ", en: "Text generation demo" })}</Chip>
        <Chip tone="amber" size={28}>{t({ ja: "Transformerブロックデモ", en: "Transformer block demo" })}</Chip>
      </div>
    </EndCard>
  );
}
