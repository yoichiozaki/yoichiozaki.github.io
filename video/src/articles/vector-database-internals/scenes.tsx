import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Pt = { x: number; y: number; cluster: 0 | 1 | 2; id: number };
type Tone = "coral" | "teal" | "amber" | "muted" | "ink" | "error";

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function cloud(seed: number, counts: [number, number, number], centers: [number, number][], spread: [number, number]): Pt[] {
  const r = rand(seed);
  const pts: Pt[] = [];
  counts.forEach((count, cluster) => {
    for (let i = 0; i < count; i++) {
      const angle = r() * Math.PI * 2;
      const radius = Math.sqrt(r());
      pts.push({
        x: centers[cluster][0] + Math.cos(angle) * radius * spread[0] + (r() - 0.5) * 20,
        y: centers[cluster][1] + Math.sin(angle) * radius * spread[1] + (r() - 0.5) * 20,
        cluster: cluster as 0 | 1 | 2,
        id: pts.length,
      });
    }
  });
  return pts;
}

const SPACE_POINTS = cloud(
  42,
  [18, 17, 16],
  [
    [520, 510],
    [980, 610],
    [1390, 430],
  ],
  [165, 105],
);

const IVF_POINTS = cloud(
  73,
  [24, 22, 22],
  [
    [470, 550],
    [960, 565],
    [1440, 545],
  ],
  [190, 160],
);

const HNSW_BOTTOM = cloud(
  91,
  [13, 12, 13],
  [
    [660, 710],
    [1040, 760],
    [1395, 705],
  ],
  [150, 62],
);

const pointFill = [colors.coralSoft, colors.tealSoft, colors.amberSoft] as const;
const pointStroke = [colors.coral, colors.teal, colors.amber] as const;

function cue(cues: number[], i: number, fallback = 0) {
  return cues[i] ?? fallback;
}

function fadeAfter(frame: number, start: number, dur = 14) {
  return 1 - progress(frame, start, dur);
}

function Dot({
  x,
  y,
  r = 14,
  fill = "#fff",
  stroke = colors.hairlineStrong,
  opacity = 1,
  label,
  pulse = 0,
}: {
  x: number;
  y: number;
  r?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  label?: string;
  pulse?: number;
}) {
  const rr = r + pulse * 6;
  return (
    <g opacity={opacity}>
      {pulse > 0 && <circle cx={x} cy={y} r={rr + 9} fill={stroke} opacity={0.14 * pulse} />}
      <circle cx={x} cy={y} r={rr} fill={fill} stroke={stroke} strokeWidth={3} />
      {label && (
        <text x={x} y={y + 8} textAnchor="middle" fontFamily={fonts.mono} fontSize={24} fontWeight={800} fill={colors.ink}>
          {label}
        </text>
      )}
    </g>
  );
}

function TextLabel({
  x,
  y,
  text,
  size = 26,
  tone = colors.muted,
  anchor = "middle",
  weight = 700,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  tone?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={fonts.sans} fontSize={size} fontWeight={weight} fill={tone}>
      {text}
    </text>
  );
}

function BigBadge({ children, tone = "muted" }: { children: string; tone?: Tone }) {
  return (
    <Chip tone={tone} size={28} style={{ boxShadow: "0 10px 24px rgba(20,20,19,0.08)" }}>
      {children}
    </Chip>
  );
}

function SectionCard({ x, y, w, h, children, accent }: { x: number; y: number; w: number; h: number; children: React.ReactNode; accent?: string }) {
  return (
    <>
      <Abs x={x} y={y} w={w} h={h}>
        <Card tone="white" accent={accent} style={{ width: "100%", height: "100%" }}>
          {null}
        </Card>
      </Abs>
      {children}
    </>
  );
}

function LocalCard({ x, y, w, h, children, accent }: { x: number; y: number; w: number; h: number; children: React.ReactNode; accent?: string }) {
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <Card tone="white" accent={accent} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
        {children}
      </Card>
    </Abs>
  );
}

/* ------------------------------------------------------------------------ */
/* 0. Title                                                                  */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const p1 = progress(frame, 18, 28);
  const p2 = progress(frame, 38, 28);
  const p3 = progress(frame, 58, 28);
  const qx = 1578;
  const qy = 590;
  const radius = 124;
  const neighbors = [
    { x: 1498, y: 520 },
    { x: 1518, y: 646 },
    { x: 1662, y: 560 },
  ];
  const lineEnds = neighbors.map((n) => {
    const dx = n.x - qx;
    const dy = n.y - qy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    return {
      x1: qx + ux * 33,
      y1: qy + uy * 33,
      x2: n.x - ux * 21,
      y2: n.y - uy * 21,
    };
  });
  return (
    <TitleCard
      title={{ ja: "ベクトルDBの\n内部構造", en: "Vector Database\nInternals" }}
      subtitle={{
        ja: "近似最近傍探索を支える IVF・PQ・HNSW・DiskANN",
        en: "IVF, PQ, HNSW, and DiskANN behind approximate nearest neighbor search",
      }}
      art={
        <>
          <Abs x={1165} y={190} w={620} h={620}>
            <Card tone="soft" style={{ width: "100%", height: "100%", borderRadius: 32 }}>
              {null}
            </Card>
          </Abs>
          <Svg>
            {SPACE_POINTS.slice(0, 38).map((pt, i) => {
              if (pt.cluster === 2) return null;
              const x = 1165 + (pt.x - 250) * 0.42;
              const y = 190 + (pt.y - 250) * 1.05;
              if (Math.hypot(x - qx, y - qy) < radius + 18) return null;
              const s = pop(frame, 16 + i * 1.4, fps);
              return (
                <Dot
                  key={pt.id}
                  x={x}
                  y={y}
                  r={12}
                  fill={pointFill[pt.cluster]}
                  stroke={pointStroke[pt.cluster]}
                  opacity={Math.min(1, s) * 0.8}
                />
              );
            })}
            <circle
              cx={qx}
              cy={qy}
              r={radius}
              fill="none"
              stroke={colors.teal}
              strokeWidth={4}
              strokeDasharray="12 10"
              opacity={progress(frame, 68, 24)}
            />
            {lineEnds.map((line, i) => (
              <Arrow
                key={i}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                p={progress(frame, 72 + i * 8, 24)}
                color={colors.tealDeep}
                width={3}
                dashed
                head={false}
              />
            ))}
            {neighbors.map((n, i) => (
              <Dot
                key={`near-${i}`}
                x={n.x}
                y={n.y}
                r={19}
                fill={colors.teal}
                stroke={colors.tealDeep}
                opacity={progress(frame, 62 + i * 7, 22)}
                pulse={progress(frame, 82 + i * 4, 28)}
              />
            ))}
            <g opacity={p2}>
              <path
                d={`M ${qx} ${qy - 30} l 9 20 l 22 2 l -17 13 l 5 22 l -19 -12 l -19 12 l 5 -22 l -17 -13 l 22 -2 Z`}
                fill={colors.ink}
              />
              <TextLabel x={qx + 36} y={qy - 24} text="q" size={28} tone={colors.ink} />
            </g>
          </Svg>
          <Abs x={1215} y={728} w={520} style={{ display: "flex", justifyContent: "center", gap: 12, opacity: p3 }}>
            <BigBadge tone="coral">{t({ ja: "近い点を探す", en: "Find nearby points" })}</BigBadge>
            <BigBadge tone="teal">ANN</BigBadge>
          </Abs>
          <Abs x={1240} y={236} w={470} style={{ opacity: p1 }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 800, color: colors.muted, letterSpacing: 1 }}>IVF · PQ · HNSW · DiskANN</div>
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Embeddings as geometry                                                 */
/* ------------------------------------------------------------------------ */

export function EmbeddingScene() {
  const frame = useCurrentFrame();
  const { cues, ends } = useScene();
  const t = useT();
  const query = { x: 930, y: 530 };
  const nearest = [19, 22, 24, 25, 29];
  return (
    <SceneShell kicker={{ ja: "埋め込み空間", en: "Embedding space" }} title={{ ja: "意味の近さを、距離に変える", en: "Turn meaning into distance" }}>
      <SectionCard x={120} y={205} w={1680} h={675} accent={colors.hairlineStrong}>
        <Svg>
          <line x1={230} y1={790} x2={1685} y2={790} stroke={colors.hairlineStrong} strokeWidth={3} />
          <line x1={230} y1={790} x2={230} y2={285} stroke={colors.hairlineStrong} strokeWidth={3} />
          <TextLabel x={1648} y={828} text={t({ ja: "意味の軸 A", en: "semantic axis A" })} size={26} anchor="end" />
          <TextLabel x={188} y={306} text={t({ ja: "軸 B", en: "axis B" })} size={26} anchor="start" />
          {SPACE_POINTS.map((pt, i) => {
            const appear = progress(frame, cue(cues, 0) + i * 0.8, 24);
            const isNear = nearest.includes(i);
            const hi = isNear ? progress(frame, cue(cues, 2) + 8, 18) : 0;
            return (
              <Dot
                key={pt.id}
                x={pt.x}
                y={pt.y}
                r={isNear ? 18 : 14}
                fill={mixColor(pointFill[pt.cluster], colors.coralSoft, hi)}
                stroke={hi > 0 ? colors.coral : pointStroke[pt.cluster]}
                opacity={appear}
                pulse={hi}
              />
            );
          })}
          <circle cx={query.x} cy={query.y} r={86 * progress(frame, cue(cues, 2), 28)} fill="none" stroke={colors.coral} strokeWidth={5} strokeDasharray="12 10" />
          <Dot x={query.x} y={query.y} r={24} fill={colors.ink} stroke={colors.ink} opacity={progress(frame, cue(cues, 2) - 8, 20)} label="q" />
        </Svg>
        <Abs x={300} y={254}>
          <Appear at={cue(cues, 0)}>
            <BigBadge tone="muted">{t({ ja: "文書・画像・音声 → ベクトル", en: "text / image / audio → vectors" })}</BigBadge>
          </Appear>
        </Abs>
        <Abs x={1145} y={740}>
          <Appear at={cue(cues, 1)} until={ends[2] + 10}>
            <BigBadge tone="teal">{t({ ja: "近い点 ＝ 意味が近い", en: "nearby points = similar meaning" })}</BigBadge>
          </Appear>
        </Abs>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Curse of dimensionality                                                */
/* ------------------------------------------------------------------------ */

export function CurseScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cards = [
    { name: "text-embedding-3-small", dim: "1536", tone: colors.coral },
    { name: "text-embedding-3-large", dim: "3072", tone: colors.teal },
    { name: "BGE-M3 / Cohere", dim: "1024", tone: colors.amber },
  ];
  const bars = [
    { y: 438, a: 850, b: 1660, near: 940, far: 1510 },
    { y: 526, a: 850, b: 1660, near: 1040, far: 1350 },
    { y: 614, a: 850, b: 1660, near: 1180, far: 1290 },
  ];
  return (
    <SceneShell kicker={{ ja: "高次元の罠", en: "High-dimensional trap" }} title={{ ja: "全部を正確に探すのは重い", en: "Exact search gets expensive fast" }}>
      <Abs x={120} y={205} w={520} h={675}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }} accent={colors.coralSoft}>
          <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 800, color: colors.ink, marginBottom: 28 }}>
            {t({ ja: "代表的な次元数", en: "Typical dimensions" })}
          </div>
          {cards.map((c, i) => {
            const p = progress(frame, cue(cues, 1) + i * 8, 20);
            return (
              <div key={c.name} style={{ opacity: p, transform: `translateX(${(1 - p) * -24}px)`, marginBottom: 42 }}>
                <div style={{ fontFamily: fonts.mono, fontSize: 23, lineHeight: 1.15, color: colors.muted, marginBottom: 4 }}>{c.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: fonts.serif, fontSize: 56, color: c.tone, fontWeight: 700 }}>{c.dim}</span>
                  <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.body }}>{t({ ja: "次元", en: "dims" })}</span>
                </div>
              </div>
            );
          })}
        </Card>
      </Abs>
      <SectionCard x={690} y={205} w={1110} h={675}>
        <Svg>
          <TextLabel x={770} y={288} text={t({ ja: "距離の差が相対的に縮む", en: "Distance gaps shrink relatively" })} size={30} anchor="start" tone={colors.ink} />
          {bars.map((b, i) => {
            const p = progress(frame, cue(cues, 2) + i * 18, 30);
            return (
              <g key={b.y} opacity={p}>
                <line x1={b.a} y1={b.y} x2={b.b} y2={b.y} stroke={colors.hairlineStrong} strokeWidth={12} strokeLinecap="round" />
                <circle cx={b.near} cy={b.y} r={18} fill={colors.teal} />
                <circle cx={b.far} cy={b.y} r={18} fill={colors.amber} />
                <TextLabel x={b.a - 40} y={b.y + 9} text={["2D", "128D", "1000D+"][i]} size={28} anchor="end" tone={colors.muted} />
                <Arrow x1={b.near + 28} y1={b.y - 34} x2={b.far - 28} y2={b.y - 34} p={p} color={i === 2 ? colors.coral : colors.mutedSoft} width={4} head={false} />
              </g>
            );
          })}
          <g opacity={progress(frame, cue(cues, 3), 24)}>
            <rect x={830} y={718} width={700} height={96} rx={24} fill={colors.coralSoft} stroke={colors.coral} strokeWidth={3} />
            <TextLabel x={1180} y={778} text={t({ ja: "ANN: 近似探索で 95%+ 再現率を狙う", en: "ANN: approximate search targeting 95%+ recall" })} size={30} tone={colors.coralDeep} />
          </g>
        </Svg>
        <Abs x={1320} y={310} style={{ opacity: progress(frame, cue(cues, 2), 18) }}>
          <Chip tone="error" size={26}>{t({ ja: "kd-treeも効きにくい", en: "kd-tree pruning fades" })}</Chip>
        </Abs>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Flat baseline                                                          */
/* ------------------------------------------------------------------------ */

export function BaselineScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const scan = progress(frame, cue(cues, 1), 96);
  const cols = 14;
  const rows = 5;
  const cellW = 92;
  const cellH = 70;
  const x0 = 365;
  const y0 = 340;
  return (
    <SceneShell kicker={{ ja: "ベースライン", en: "Baseline" }} title={{ ja: "Flat は、全ベクトルを読む", en: "Flat reads every vector" }}>
      <SectionCard x={120} y={220} w={1680} h={655}>
        <Svg>
          <TextLabel x={238} y={302} text={t({ ja: "クエリ q", en: "query q" })} size={30} anchor="start" tone={colors.ink} />
          <Dot x={280} y={430} r={30} fill={colors.ink} stroke={colors.ink} label="q" />
          <Arrow x1={320} y1={430} x2={x0} y2={430} p={progress(frame, cue(cues, 0), 18)} color={colors.coral} width={5} />
          {Array.from({ length: cols * rows }, (_, i) => {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = x0 + c * (cellW + 15);
            const y = y0 + r * (cellH + 20);
            const order = i / (cols * rows);
            const hot = scan > order;
            return (
              <g key={i} opacity={progress(frame, cue(cues, 0) + i * 0.55, 14)}>
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  rx={14}
                  fill={hot ? colors.coralSoft : "#fff"}
                  stroke={hot ? colors.coral : colors.hairlineStrong}
                  strokeWidth={3}
                />
                <TextLabel x={x + cellW / 2} y={y + 43} text={`v${i}`} size={22} tone={hot ? colors.coralDeep : colors.mutedSoft} />
              </g>
            );
          })}
          <rect x={x0 - 12 + scan * (cols - 1) * (cellW + 15)} y={y0 - 18} width={cellW + 24} height={rows * (cellH + 20) - 20 + 36} rx={18} fill="none" stroke={colors.coral} strokeWidth={6} opacity={progress(frame, cue(cues, 1), 12) * fadeAfter(frame, cue(cues, 2) + 40)} />
        </Svg>
        <Abs x={540} y={800} style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <Appear at={cue(cues, 1)}>
            <BigBadge tone="coral">{t({ ja: "O(Nd)", en: "O(Nd)" })}</BigBadge>
          </Appear>
          <Appear at={cue(cues, 1) + 18}>
            <BigBadge tone="amber">{t({ ja: "10⁶ × 1024 × 4B ≈ 4GB / query", en: "10⁶ × 1024 × 4B ≈ 4GB / query" })}</BigBadge>
          </Appear>
          <Appear at={cue(cues, 2)}>
            <BigBadge tone="teal">{t({ ja: "候補を減らす or 距離を圧縮", en: "fewer candidates or cheaper distances" })}</BigBadge>
          </Appear>
        </Abs>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. IVF                                                                    */
/* ------------------------------------------------------------------------ */

export function IvfScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const centroids = [
    { x: 470, y: 545, label: "c1", tone: colors.coral },
    { x: 960, y: 560, label: "c2", tone: colors.teal },
    { x: 1440, y: 545, label: "c3", tone: colors.amber },
  ];
  const query = { x: 1030, y: 428 };
  const opened = progress(frame, cue(cues, 2), 20);
  const miss = progress(frame, cue(cues, 3), 20);
  return (
    <SceneShell kicker={{ ja: "IVF", en: "IVF" }} title={{ ja: "近いセルだけ開く", en: "Open only nearby cells" }}>
      <SectionCard x={120} y={210} w={1680} h={670}>
        <Svg>
          {centroids.map((c, i) => {
            const train = progress(frame, cue(cues, 0) + i * 8, 18);
            const active = i !== 2 ? opened : 0;
            const danger = i === 2 ? miss : 0;
            return (
              <g key={c.label}>
                <ellipse
                  cx={c.x}
                  cy={c.y}
                  rx={260}
                  ry={220}
                  fill={mixColor(colors.surfaceSoft, i === 0 ? colors.coralSoft : i === 1 ? colors.tealSoft : colors.amberSoft, active * 0.85 + danger * 0.9)}
                  stroke={danger ? colors.error : active ? c.tone : colors.hairlineStrong}
                  strokeWidth={danger || active ? 5 : 3}
                  opacity={train}
                  strokeDasharray={active || danger ? undefined : "14 12"}
                />
                <Dot x={c.x} y={c.y} r={24} fill={c.tone} stroke={c.tone} opacity={train} label={c.label} />
              </g>
            );
          })}
          {IVF_POINTS.map((pt, i) => {
            const p = progress(frame, cue(cues, 1) + i * 0.45, 18);
            const isScanned = pt.cluster !== 2 && opened > 0;
            return (
              <Dot
                key={pt.id}
                x={pt.x}
                y={pt.y}
                r={13}
                fill={isScanned ? colors.coralSoft : pointFill[pt.cluster]}
                stroke={isScanned ? colors.coral : pointStroke[pt.cluster]}
                opacity={p * (pt.cluster === 2 && opened > 0 ? 0.35 : 1)}
              />
            );
          })}
          <Dot x={query.x} y={query.y} r={25} fill={colors.ink} stroke={colors.ink} opacity={progress(frame, cue(cues, 2) - 8, 18)} label="q" />
          {[centroids[0], centroids[1]].map((c, i) => (
            <Arrow key={c.label} x1={query.x} y1={query.y} x2={c.x} y2={c.y} p={opened} color={colors.coral} width={5} dashed bend={i ? 50 : -50} />
          ))}
          <g opacity={miss}>
            <Dot x={1485} y={438} r={23} fill={colors.errorSoft} stroke={colors.error} label="!" pulse={miss} />
            <Arrow x1={query.x} y1={query.y} x2={1485} y2={438} p={miss} color={colors.error} width={5} dashed bend={-80} />
          </g>
        </Svg>
        <Abs x={270} y={808} style={{ display: "flex", gap: 18 }}>
          <Appear at={cue(cues, 1)}>
            <BigBadge tone="muted">{t({ ja: "nlist: セル数", en: "nlist: number of cells" })}</BigBadge>
          </Appear>
          <Appear at={cue(cues, 2)}>
            <BigBadge tone="coral">{t({ ja: "nprobe: 開くセル数", en: "nprobe: cells opened" })}</BigBadge>
          </Appear>
          <Appear at={cue(cues, 3)}>
            <BigBadge tone="error">{t({ ja: "未訪問セルの正解は見逃す", en: "misses answers in unopened cells" })}</BigBadge>
          </Appear>
        </Abs>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. PQ                                                                     */
/* ------------------------------------------------------------------------ */

export function PqScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const chunks = Array.from({ length: 16 }, (_, i) => i);
  const lutRows = [0, 1, 2, 3, 4];
  return (
    <SceneShell kicker={{ ja: "PQ", en: "Product Quantization" }} title={{ ja: "長いベクトルを、短いコードへ", en: "Compress vectors into short codes" }}>
      <SectionCard x={120} y={205} w={1680} h={675}>
        <Svg>
          <TextLabel x={260} y={300} text={t({ ja: "1024次元 float32", en: "1024-dim float32" })} anchor="start" tone={colors.ink} size={30} />
          {chunks.map((i) => {
            const p = progress(frame, cue(cues, 0) + i * 1.8, 16);
            const x = 250 + i * 55;
            const color = i % 3 === 0 ? colors.coral : i % 3 === 1 ? colors.teal : colors.amber;
            return <rect key={i} x={x} y={340} width={45} height={150} rx={10} fill={color} opacity={0.22 + 0.58 * p} stroke={color} strokeWidth={3} />;
          })}
          <Arrow x1={705} y1={530} x2={705} y2={642} p={progress(frame, cue(cues, 1), 18)} color={colors.coral} width={5} />
          <TextLabel x={705} y={616} text={t({ ja: "64分割", en: "split into 64" })} size={28} tone={colors.coralDeep} />
          {["1", "2", "3", "4", "…", "61", "62", "63", "64"].map((label, i) => {
            const p = progress(frame, cue(cues, 1) + i * 3, 20);
            const x = 300 + i * 76;
            return (
              <g key={i} opacity={p}>
                <rect x={x} y={660} width={60} height={76} rx={12} fill="#fff" stroke={colors.hairlineStrong} strokeWidth={3} />
                <TextLabel x={x + 30} y={706} text={label} size={26} tone={colors.muted} />
              </g>
            );
          })}
          <g opacity={progress(frame, cue(cues, 1), 22)}>
            <rect x={1160} y={300} width={520} height={208} rx={22} fill={colors.surfaceSoft} stroke={colors.hairlineStrong} strokeWidth={3} />
            <TextLabel x={1420} y={348} text={t({ ja: "コードブック", en: "codebook" })} size={31} tone={colors.ink} />
            <TextLabel x={1420} y={391} text={t({ ja: "各部分: 代表ベクトル256個", en: "256 codebook sub-vectors" })} size={25} tone={colors.muted} />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={1218 + (i % 6) * 66} y={420 + Math.floor(i / 6) * 42} width={46} height={24} rx={6} fill={i % 2 ? colors.teal : colors.coral} opacity={0.55} />
            ))}
          </g>
          <g opacity={progress(frame, cue(cues, 2), 20)}>
            <rect x={1130} y={585} width={445} height={86} rx={18} fill={colors.coralSoft} stroke={colors.coral} strokeWidth={3} />
            <TextLabel x={1352} y={638} text={t({ ja: "4096B → 64B（64倍）", en: "4096B → 64B (64×)" })} size={34} tone={colors.coralDeep} />
          </g>
          <g opacity={progress(frame, cue(cues, 3), 20)}>
            <rect x={1090} y={714} width={620} height={112} rx={22} fill={colors.tealSoft} stroke={colors.teal} strokeWidth={3} />
            <TextLabel x={1400} y={760} text={t({ ja: "クエリ対コードブック距離表", en: "query-to-codebook distance tables" })} size={27} tone={colors.tealDeep} />
            {lutRows.map((_, i) => (
              <text key={i} x={1152 + i * 98} y={806} fontFamily={fonts.mono} fontSize={26} fontWeight={800} fill={colors.tealDeep}>
                LUT{i + 1}
              </text>
            ))}
            <TextLabel x={1627} y={806} text="Σ" size={38} tone={colors.ink} />
          </g>
        </Svg>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. HNSW                                                                   */
/* ------------------------------------------------------------------------ */

export function HnswScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const xs = { A: 480, C: 760, F: 1040, G: 1320, H: 1580 };
  const topY = 318;
  const midY = 500;
  const bottomY = 720;
  const nodeR = 30;
  const top = [
    { x: xs.A, y: topY, id: "A" },
    { x: xs.F, y: topY, id: "F" },
  ];
  const mid = [
    { x: xs.A, y: midY, id: "A" },
    { x: xs.C, y: midY, id: "C" },
    { x: xs.F, y: midY, id: "F" },
    { x: xs.G, y: midY, id: "G" },
  ];
  const base = [
    { x: xs.A, y: bottomY, id: "A" },
    { x: xs.C, y: bottomY, id: "C" },
    { x: xs.F, y: bottomY, id: "F" },
    { x: xs.G, y: bottomY, id: "G" },
    { x: xs.H, y: bottomY, id: "H" },
  ];
  const path = progress(frame, cue(cues, 2), 60);
  const beam = progress(frame, cue(cues, 2) + 56, 54);
  return (
    <SceneShell kicker={{ ja: "HNSW", en: "HNSW" }} title={{ ja: "世界地図から市街地図へ降りる", en: "Descend from world map to street map" }}>
      <SectionCard x={120} y={205} w={1680} h={675}>
        <Svg>
          <TextLabel x={205} y={320} text={t({ ja: "レイヤー2（疎）", en: "Layer 2 (sparse)" })} anchor="start" size={27} tone={colors.muted} />
          <TextLabel x={205} y={502} text={t({ ja: "レイヤー1", en: "Layer 1" })} anchor="start" size={27} tone={colors.muted} />
          <TextLabel x={205} y={712} text={t({ ja: "レイヤー0（全点）", en: "Layer 0 (all points)" })} anchor="start" size={27} tone={colors.muted} />
          <line x1={120} x2={1800} y1={390} y2={390} stroke={colors.hairlineStrong} strokeWidth={3} strokeDasharray="12 12" />
          <line x1={120} x2={1800} y1={604} y2={604} stroke={colors.hairlineStrong} strokeWidth={3} strokeDasharray="12 12" />
          {Object.entries(xs).map(([id, x]) => (
            <line
              key={id}
              x1={x}
              y1={topY + nodeR + 10}
              x2={x}
              y2={bottomY - nodeR - 10}
              stroke={colors.hairlineStrong}
              strokeWidth={3}
              strokeDasharray="8 12"
              opacity={progress(frame, cue(cues, 0), 22) * 0.55}
            />
          ))}
          <Arrow x1={xs.A + nodeR} y1={topY} x2={xs.F - nodeR} y2={topY} p={progress(frame, cue(cues, 0), 24)} color={colors.hairlineStrong} width={3} head={false} />
          {[
            [xs.A, xs.C],
            [xs.C, xs.F],
            [xs.F, xs.G],
          ].map(([a, b]) => (
            <Arrow key={`${a}-${b}`} x1={a + nodeR} y1={midY} x2={b - nodeR} y2={midY} p={progress(frame, cue(cues, 0), 24)} color={colors.hairlineStrong} width={3} head={false} />
          ))}
          {[
            [xs.A, xs.C],
            [xs.C, xs.F],
            [xs.F, xs.G],
            [xs.G, xs.H],
          ].map(([a, b]) => (
            <Arrow key={`b-${a}-${b}`} x1={a + nodeR} y1={bottomY} x2={b - nodeR} y2={bottomY} p={progress(frame, cue(cues, 1), 24)} color={colors.hairlineStrong} width={3} head={false} />
          ))}
          {top.map((n, i) => (
            <Dot key={`top-${n.id}`} x={n.x} y={n.y} r={nodeR} fill="#fff" stroke={colors.coral} opacity={progress(frame, cue(cues, 0) + i * 5, 18)} label={n.id} />
          ))}
          {mid.map((n, i) => (
            <Dot key={`mid-${n.id}`} x={n.x} y={n.y} r={nodeR} fill="#fff" stroke={colors.teal} opacity={progress(frame, cue(cues, 0) + 12 + i * 4, 18)} label={n.id} />
          ))}
          {HNSW_BOTTOM.map((pt, i) => (
            <Dot key={pt.id} x={pt.x} y={pt.y} r={12} fill={pointFill[pt.cluster]} stroke={pointStroke[pt.cluster]} opacity={progress(frame, cue(cues, 1) + i * 0.8, 16)} />
          ))}
          {base.map((n, i) => (
            <Dot key={`base-${n.id}`} x={n.x} y={n.y} r={nodeR} fill="#fff" stroke={colors.amber} opacity={progress(frame, cue(cues, 1) + 18 + i * 3, 18)} label={n.id} />
          ))}
          <g opacity={progress(frame, cue(cues, 2) - 10, 18)}>
            <path d="M 1175 690 l 11 26 l 28 2 l -22 17 l 7 28 l -24 -15 l -24 15 l 7 -28 l -22 -17 l 28 -2 Z" fill={colors.ink} />
            <TextLabel x={1175} y={676} text="q" size={28} tone={colors.ink} />
          </g>
          <Arrow x1={xs.A + nodeR} y1={topY} x2={xs.F - nodeR} y2={topY} p={Math.min(1, path * 3)} color={colors.coral} width={6} />
          <Arrow x1={xs.F} y1={topY + nodeR} x2={xs.F} y2={midY - nodeR} p={Math.max(0, Math.min(1, path * 3 - 1))} color={colors.coral} width={6} />
          <Arrow x1={xs.F} y1={midY + nodeR} x2={xs.F} y2={bottomY - nodeR} p={Math.max(0, Math.min(1, path * 3 - 2))} color={colors.coral} width={6} />
          {[
            [940, 760],
            [1040, 800],
            [1140, 760],
            [1250, 800],
          ].map(([x, y], i) => (
            <g key={x}>
              <Arrow x1={1040} y1={bottomY + nodeR} x2={x} y2={y - 15} p={beam} color={colors.teal} width={5} dashed bend={(i - 1.5) * 36} />
              <Dot x={x} y={y} r={15} fill={colors.tealSoft} stroke={colors.teal} opacity={beam} />
            </g>
          ))}
        </Svg>
        <Abs x={1085} y={214} style={{ display: "flex", gap: 14 }}>
          <Appear at={cue(cues, 2)}>
            <BigBadge tone="coral">{t({ ja: "上層: ef=1", en: "upper layers: ef=1" })}</BigBadge>
          </Appear>
          <Appear at={cue(cues, 2) + 50}>
            <BigBadge tone="teal">{t({ ja: "レイヤー0: efSearch ビーム", en: "Layer 0: efSearch beam" })}</BigBadge>
          </Appear>
        </Abs>
        <Abs x={1325} y={795}>
          <Appear at={cue(cues, 3)}>
            <BigBadge tone="amber">{t({ ja: "M = 最大リンク数 / 点", en: "M = max links per node" })}</BigBadge>
          </Appear>
        </Abs>
      </SectionCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. DiskANN                                                                */
/* ------------------------------------------------------------------------ */

export function DiskAnnScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const readAt = cue(cues, 3) + 8;
  return (
    <SceneShell kicker={{ ja: "DiskANN / Vamana", en: "DiskANN / Vamana" }} title={{ ja: "RAMに載らない規模は、SSDへ", en: "When RAM is not enough, use SSD" }}>
      <LocalCard x={120} y={205} w={700} h={675} accent={colors.teal}>
        <Abs x={36} y={30}>
          <BigBadge tone="teal">RAM</BigBadge>
        </Abs>
        <Abs x={48} y={120} w={590}>
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color: colors.ink }}>{t({ ja: "PQ圧縮ベクトルだけ", en: "Only PQ-compressed vectors" })}</div>
        </Abs>
        {Array.from({ length: 7 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const i = r * 8 + c;
            const p = progress(frame, cue(cues, 2) + i * 0.8, 16);
            return (
              <Abs key={i} x={58 + c * 72} y={210 + r * 54} w={54} h={34} style={{ opacity: p }}>
                <div style={{ width: "100%", height: "100%", borderRadius: 8, background: i % 3 === 0 ? colors.coralSoft : i % 3 === 1 ? colors.tealSoft : colors.amberSoft, border: `2px solid ${colors.hairlineStrong}`, fontFamily: fonts.mono, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted }}>
                  {String(i % 256).padStart(2, "0")}
                </div>
              </Abs>
            );
          }),
        )}
        <Abs x={70} y={600}>
          <Appear at={cue(cues, 1)}>
            <BigBadge tone="teal">{t({ ja: "10⁹ × 64B ≈ 64GB", en: "10⁹ × 64B ≈ 64GB" })}</BigBadge>
          </Appear>
        </Abs>
      </LocalCard>
      <LocalCard x={870} y={205} w={930} h={675} accent={colors.coral}>
        <Abs x={38} y={30}>
          <BigBadge tone="coral">SSD</BigBadge>
        </Abs>
        <Abs x={160} y={34}>
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color: colors.ink }}>{t({ ja: "Vamanaグラフ + 元ベクトル", en: "Vamana graph + full vectors" })}</div>
        </Abs>
        <Abs x={555} y={585}>
          <Appear at={cue(cues, 1)}>
            <BigBadge tone="coral">{t({ ja: "10⁹ × 1024 × 4B ≈ 4TB", en: "10⁹ × 1024 × 4B ≈ 4TB" })}</BigBadge>
          </Appear>
        </Abs>
        <Svg>
          {[
            [210, 210],
            [420, 130],
            [650, 220],
            [260, 450],
            [515, 390],
            [745, 460],
          ].map(([x, y], i, arr) =>
            arr.slice(i + 1).map(([x2, y2], j) => {
              const near = Math.hypot(x - x2, y - y2) < 360;
              return near ? <Arrow key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} p={progress(frame, cue(cues, 2), 28)} color={colors.hairlineStrong} width={3} head={false} /> : null;
            }),
          )}
          {[
            [210, 210],
            [420, 130],
            [650, 220],
            [260, 450],
            [515, 390],
            [745, 460],
          ].map(([x, y], i) => (
            <g key={i} opacity={progress(frame, cue(cues, 2) + i * 6, 18)}>
              <rect x={x - 70} y={y - 45} width={140} height={90} rx={18} fill="#fff" stroke={colors.coral} strokeWidth={3} />
              <TextLabel x={x} y={y - 6} text={`v${i}`} size={25} tone={colors.ink} />
              <TextLabel x={x} y={y + 28} text="4KB" size={23} tone={colors.muted} />
            </g>
          ))}
          <Packet x1={90} y1={290} x2={210} y2={210} start={readAt} dur={28} color={colors.coral} label="read" />
          <Packet x1={210} y1={210} x2={420} y2={130} start={readAt + 34} dur={26} color={colors.coral} label="4KB" />
          <Packet x1={420} y1={130} x2={650} y2={220} start={readAt + 68} dur={26} color={colors.coral} label="4KB" />
        </Svg>
        <Abs x={70} y={585}>
          <Appear at={cue(cues, 3)}>
            <BigBadge tone="amber">{t({ ja: "1ホップ = 4KBランダムリード", en: "1 hop = 4KB random read" })}</BigBadge>
          </Appear>
        </Abs>
      </LocalCard>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Filters                                                                */
/* ------------------------------------------------------------------------ */

export function FiltersScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const pass = (i: number) => i % 5 === 0 || i === 7;
  const panel = (x: number, title: Bilingual, tone: Tone, active: number, kind: "post" | "pre" | "in") => (
    <Abs x={x} y={270} w={500} h={620}>
      <Card tone="white" accent={tone === "coral" ? colors.coral : tone === "teal" ? colors.teal : colors.amber} style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
        <BigBadge tone={tone}>{t(title)}</BigBadge>
        <Svg>
          {Array.from({ length: 18 }, (_, i) => {
            const cx = 82 + (i % 3) * 145;
            const cy = 145 + Math.floor(i / 3) * 70;
            const p = Math.max(progress(frame, cue(cues, 0) + i * 0.9, 12) * 0.28, progress(frame, active + i * 1.8, 12));
            const ok = pass(i);
            let fill: string = "#fff";
            let stroke: string = colors.hairlineStrong;
            if (kind === "post" && frame > active + 52) {
              fill = ok ? colors.tealSoft : colors.errorSoft;
              stroke = ok ? colors.teal : colors.error;
            } else if (kind === "pre" && frame > active + 26) {
              fill = ok ? colors.tealSoft : colors.surfaceCard;
              stroke = ok ? colors.teal : colors.hairlineStrong;
            } else if (kind === "in" && frame > active + 35) {
              fill = ok ? colors.tealSoft : i % 2 ? colors.amberSoft : "#fff";
              stroke = ok ? colors.teal : colors.amber;
            }
            return <Dot key={i} x={cx} y={cy} r={15} fill={fill} stroke={stroke} opacity={p * (kind === "pre" && !ok && frame > active + 46 ? 0.28 : 1)} />;
          })}
          {kind === "in" && <Arrow x1={92} y1={295} x2={372} y2={425} p={progress(frame, active + 45, 32)} color={colors.teal} width={5} bend={60} />}
        </Svg>
        <div style={{ position: "absolute", left: 28, top: 518, right: 28, fontFamily: fonts.sans, fontSize: 25, lineHeight: 1.25, color: colors.muted, fontWeight: 700 }}>
          {kind === "post" && t({ ja: "ANN後に絞る。空振りあり。", en: "Filter after ANN; may empty out." })}
          {kind === "pre" && t({ ja: "先にID集合。小集合向け。", en: "ID set first; tiny subsets." })}
          {kind === "in" && t({ ja: "探索中も接続を保つ。", en: "Keep traversal connected." })}
        </div>
      </Card>
    </Abs>
  );
  return (
    <SceneShell kicker={{ ja: "フィルタ検索", en: "Filtered search" }} title={{ ja: "フィルタは、探索経路も変える", en: "Filters change the search path" }}>
      {panel(120, { ja: "後フィルタ", en: "Post-filter" }, "error", cue(cues, 1), "post")}
      {panel(710, { ja: "先フィルタ", en: "Pre-filter" }, "amber", cue(cues, 2), "pre")}
      {panel(1300, { ja: "フィルタ可能HNSW", en: "Filterable HNSW" }, "teal", cue(cues, 3), "in")}
      <Abs x={120} y={206}>
        <Appear at={cue(cues, 0)}>
          <BigBadge tone="muted">{t({ ja: "公開済みだけ / テナントだけ", en: "published only / one tenant only" })}</BigBadge>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Operations                                                             */
/* ------------------------------------------------------------------------ */

export function OperationsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const flow = [
    { x: 190, y: 298, w: 270, text: { ja: "小規模 N", en: "small N" }, out: "Flat", tone: "muted" as Tone },
    { x: 500, y: 298, w: 290, text: { ja: "RAMあり", en: "enough RAM" }, out: "HNSW", tone: "teal" as Tone },
    { x: 830, y: 298, w: 330, text: { ja: "メモリ制約", en: "memory pressure" }, out: "IVFPQ", tone: "amber" as Tone },
    { x: 1200, y: 298, w: 340, text: { ja: "10億規模", en: "billion scale" }, out: "DiskANN", tone: "coral" as Tone },
  ];
  return (
    <SceneShell kicker={{ ja: "運用", en: "Operations" }} title={{ ja: "再現率・遅延・メモリの取引", en: "Trade recall, latency, and memory" }}>
      <SectionCard x={120} y={205} w={1680} h={675}>
        <Svg>
          {flow.map((f, i) => {
            const p = progress(frame, cue(cues, 1) + i * 12, 20);
            return (
              <g key={f.out} opacity={p}>
                <rect x={f.x} y={f.y} width={f.w} height={120} rx={22} fill="#fff" stroke={colors.hairlineStrong} strokeWidth={3} />
                <TextLabel x={f.x + f.w / 2} y={f.y + 45} text={t(f.text)} size={26} tone={colors.muted} />
                <TextLabel x={f.x + f.w / 2} y={f.y + 90} text={f.out} size={34} tone={f.tone === "teal" ? colors.tealDeep : f.tone === "amber" ? colors.amber : f.tone === "coral" ? colors.coralDeep : colors.ink} />
                {i < flow.length - 1 && <Arrow x1={f.x + f.w + 20} y1={f.y + 60} x2={flow[i + 1].x - 20} y2={f.y + 60} p={p} color={colors.hairlineStrong} width={4} />}
              </g>
            );
          })}
          <g opacity={progress(frame, cue(cues, 2), 22)}>
            <line x1={260} y1={760} x2={760} y2={760} stroke={colors.hairlineStrong} strokeWidth={4} />
            <line x1={260} y1={760} x2={260} y2={520} stroke={colors.hairlineStrong} strokeWidth={4} />
            <path d="M 270 735 C 410 650, 520 606, 730 590" fill="none" stroke={colors.coral} strokeWidth={6} strokeLinecap="round" />
            <path d="M 270 700 C 440 630, 560 575, 730 545" fill="none" stroke={colors.teal} strokeWidth={6} strokeLinecap="round" />
            <TextLabel x={770} y={766} text="QPS" anchor="start" size={28} />
            <TextLabel x={214} y={528} text={t({ ja: "再現率@k", en: "Recall@k" })} anchor="end" size={26} />
            <TextLabel x={525} y={515} text={t({ ja: "パレート境界", en: "Pareto frontier" })} size={30} tone={colors.ink} />
          </g>
          <g opacity={progress(frame, cue(cues, 3), 22)}>
            <rect x={930} y={535} width={205} height={86} rx={18} fill={colors.coralSoft} stroke={colors.coral} strokeWidth={3} />
            <rect x={930} y={670} width={205} height={86} rx={18} fill={colors.tealSoft} stroke={colors.teal} strokeWidth={3} />
            <rect x={1225} y={600} width={195} height={86} rx={18} fill={colors.amberSoft} stroke={colors.amber} strokeWidth={3} />
            <rect x={1480} y={600} width={175} height={86} rx={18} fill="#fff" stroke={colors.hairlineStrong} strokeWidth={3} />
            <TextLabel x={1032} y={588} text="BM25" size={30} tone={colors.coralDeep} />
            <TextLabel x={1032} y={724} text={t({ ja: "ベクトル", en: "Vector" })} size={30} tone={colors.tealDeep} />
            <TextLabel x={1322} y={654} text="RRF" size={32} tone={colors.amber} />
            <TextLabel x={1568} y={653} text={t({ ja: "再ランク", en: "re-rank" })} size={28} tone={colors.ink} />
            <Arrow x1={1135} y1={578} x2={1225} y2={632} p={progress(frame, cue(cues, 3), 18)} color={colors.amber} width={5} />
            <Arrow x1={1135} y1={713} x2={1225} y2={654} p={progress(frame, cue(cues, 3) + 10, 18)} color={colors.amber} width={5} />
            <Arrow x1={1420} y1={643} x2={1480} y2={643} p={progress(frame, cue(cues, 3) + 28, 18)} color={colors.coral} width={5} />
          </g>
        </Svg>
        <Abs x={1050} y={808}>
          <Appear at={cue(cues, 3)}>
            <BigBadge tone="muted">{t({ ja: "RRFで融合 → クロスエンコーダーで再ランキング", en: "RRF fuses → cross-encoder re-ranks" })}</BigBadge>
          </Appear>
        </Abs>
      </SectionCard>
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
  return (
    <EndCard
      slug="vector-database-internals"
      headline={{
        ja: "ベクトルDBは、索引の設計問題として読める",
        en: "Vector DBs become legible as index design",
      }}
    >
      <div style={{ marginTop: 42, display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
        <Appear at={cue(cues, 0)}>
          <BigBadge tone="coral">IVF</BigBadge>
        </Appear>
        <Appear at={cue(cues, 0) + 8}>
          <BigBadge tone="teal">PQ</BigBadge>
        </Appear>
        <Appear at={cue(cues, 0) + 16}>
          <BigBadge tone="amber">HNSW</BigBadge>
        </Appear>
        <Appear at={cue(cues, 0) + 24}>
          <BigBadge tone="ink">DiskANN</BigBadge>
        </Appear>
      </div>
      <div style={{ marginTop: 32, maxWidth: 1220, textAlign: "center", opacity: progress(frame, cue(cues, 1), 22) }}>
        <div style={{ fontFamily: fonts.sans, fontSize: 30, lineHeight: 1.45, fontWeight: 650, color: colors.muted }}>
          {t({
            ja: "記事では、PQ と HNSW のインタラクティブデモ、実装と運用の落とし穴まで掘り下げています。",
            en: "The article includes interactive PQ and HNSW demos, plus implementation and operations pitfalls.",
          })}
        </div>
      </div>
    </EndCard>
  );
}
