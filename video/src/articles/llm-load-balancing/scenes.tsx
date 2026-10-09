import { useCurrentFrame } from "remotion";
import { progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Svg } from "../../kit/ui";

function label(text: Bilingual) {
  return text;
}

function BigPacket({
  x1,
  y1,
  x2,
  y2,
  start,
  dur = 20,
  color = colors.coral,
  r = 15,
  label: packetLabel,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start: number;
  dur?: number;
  color?: string;
  r?: number;
  label?: string;
}) {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + dur + 4) return null;
  const p = progress(frame, start, dur);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  const fade = 1 - progress(frame, start + dur, 4);
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={r} fill={color} />
      {packetLabel && (
        <text x={x} y={y - r - 10} textAnchor="middle" fontFamily={fonts.mono} fontSize={26} fontWeight={800} fill={color}>
          {packetLabel}
        </text>
      )}
    </g>
  );
}

function Replica({
  x,
  y,
  label,
  load = 0,
  cache = false,
  active = false,
  dim = false,
}: {
  x: number;
  y: number;
  label: string;
  load?: number;
  cache?: boolean;
  active?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 210,
        height: 150,
        borderRadius: 18,
        border: `4px solid ${active ? colors.coral : cache ? colors.teal : colors.hairlineStrong}`,
        background: dim ? colors.surfaceSoft : cache ? colors.tealSoft : "#fff",
        boxShadow: active ? "0 16px 34px rgba(204,120,92,0.22)" : "0 8px 22px rgba(20,20,19,0.07)",
        boxSizing: "border-box",
        padding: 18,
        opacity: dim ? 0.5 : 1,
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: colors.ink }}>{label}</div>
      <div style={{ marginTop: 14, height: 18, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(1, load) * 100}%`, height: "100%", background: active ? colors.coral : colors.amber }} />
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 7,
              background: cache && i < 3 ? colors.teal : colors.surfaceCream,
              opacity: cache && i < 3 ? 0.92 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 0. Intro                                                                 */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const nodeIn = progress(frame, 30, 24);
  const trade = progress(frame, cues[2] + 4, 22);
  return (
    <TitleCard
      title={{ ja: "LLM 呼び出しの\n負荷分散", en: "Load Balancing\nLLM Calls" }}
      subtitle={{
        ja: "ラウンドロビンが効かない理由から、KV キャッシュ考慮ルーティングまで",
        en: "From why round robin fails to KV-cache-aware routing",
      }}
      art={
        <>
          <Svg>
            <Arrow x1={1245} y1={456} x2={1460} y2={330} p={progress(frame, 44, 18)} color={colors.hairlineStrong} width={4} head={false} />
            <Arrow x1={1245} y1={456} x2={1460} y2={510} p={progress(frame, 50, 18)} color={colors.hairlineStrong} width={4} head={false} />
            <Arrow x1={1245} y1={456} x2={1460} y2={690} p={progress(frame, 56, 18)} color={colors.hairlineStrong} width={4} head={false} />
            <BigPacket x1={1080} y1={456} x2={1460} y2={330} start={cues[0] + 14} dur={34} color={colors.coral} label="L" />
            <BigPacket x1={1080} y1={456} x2={1460} y2={510} start={cues[1] + 4} dur={34} color={colors.amber} label="KV" />
            <BigPacket x1={1080} y1={456} x2={1460} y2={690} start={cues[1] + 24} dur={34} color={colors.teal} label="S" />
          </Svg>
          <Abs x={1040} y={386} w={205} h={140} style={{ opacity: nodeIn, transform: `scale(${0.9 + nodeIn * 0.1})` }}>
            <Card tone="dark" style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
              <div style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.onDark }}>{t({ ja: "ルーター", en: "router" })}</div>
            </Card>
          </Abs>
          <div style={{ opacity: nodeIn }}>
            <Replica x={1460} y={250} label="GPU A" load={0.85} active />
            <Replica x={1460} y={430} label="GPU B" load={0.45} cache />
            <Replica x={1460} y={610} label="GPU C" load={0.18} />
          </div>
          <Abs x={1190} y={770} w={610} style={{ opacity: trade, display: "flex", justifyContent: "center", gap: 14 }}>
            <Chip tone="teal" size={30}>{t({ ja: "局所性", en: "locality" })}</Chip>
            <Chip tone="muted" size={30}>{t({ ja: "古いシグナル", en: "stale signal" })}</Chip>
            <Chip tone="coral" size={30}>{t({ ja: "均衡", en: "balance" })}</Chip>
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Why LLM traffic is different                                          */
/* ------------------------------------------------------------------------ */

export function WhyScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rr = progress(frame, cues[0] + 8, 22);
  const heavy = progress(frame, cues[1] + 10, 22);
  const stream = progress(frame, cues[2] + 8, 24);
  const servers = [
    { y: 302, label: "A", load: 0.25 },
    { y: 502, label: "B", load: 0.9 },
    { y: 702, label: "C", load: 0.35 },
  ];
  return (
    <SceneShell kicker={label({ ja: "前提の崩壊", en: "Broken assumptions" })} title={label({ ja: "件数を揃えても、負荷は揃わない", en: "Equal counts are not equal load" })}>
      <Abs x={150} y={270} w={430} h={480}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 42, fontWeight: 600 }}>{t({ ja: "普通の API", en: "Ordinary API" })}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 48 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ height: 54, borderRadius: 12, background: colors.tealSoft, border: `3px solid ${colors.teal}`, opacity: rr }} />
            ))}
          </div>
          <Chip tone="teal" size={24} style={{ marginTop: 42 }}>{t({ ja: "件数 ≒ 資源", en: "count ≈ resource" })}</Chip>
        </Card>
      </Abs>

      <Abs x={700} y={270} w={1080} h={560}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 42, fontWeight: 600 }}>{t({ ja: "LLM 推論", en: "LLM inference" })}</div>
          {servers.map((s, i) => (
            <div key={s.label} style={{ position: "absolute", left: 650, top: s.y - 270, width: 310 }}>
              <Replica x={0} y={0} label={`GPU ${s.label}`} load={heavy ? s.load : 0.25} active={i === 1 && heavy > 0.2} />
            </div>
          ))}
          <svg width={1080} height={560} viewBox="0 0 1080 560" style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", pointerEvents: "none" }}>
            {[0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M 175 184 L 650 ${servers[i].y - 200}`}
                stroke={colors.hairlineStrong}
                strokeWidth={4}
                opacity={rr}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </svg>
          <Abs x={50} y={144} w={430}>
            <Chip tone="coral" size={26}>{t({ ja: "プロンプト × 出力長", en: "prompt × output length" })}</Chip>
          </Abs>
          <Abs x={50} y={210} w={480} style={{ opacity: stream }}>
            <Card tone="soft" style={{ padding: "24px 26px" }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 600 }}>{t({ ja: "投入時点では出力長が未知", en: "output length unknown at dispatch" })}</div>
              <div style={{ marginTop: 22, height: 16, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}>
                <div style={{ width: `${40 + 48 * progress(frame, cues[2] + 18, 60, (x) => x)}%`, height: "100%", background: colors.coral }} />
              </div>
              <div style={{ marginTop: 18, fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>{t({ ja: "秒〜分のストリーミング", en: "streams for seconds to minutes" })}</div>
            </Card>
          </Abs>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. Queueing knee                                                         */
/* ------------------------------------------------------------------------ */

export function KneeScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const axis = progress(frame, cues[0] + 4, 20);
  const curves = [progress(frame, cues[1] + 8, 30), progress(frame, cues[2] + 4, 30), progress(frame, cues[4] + 4, 30)];
  const points = [
    { x: 0.86, y: 3, label: "0.86", color: colors.teal, text: { ja: "決定的", en: "deterministic" } },
    { x: 0.75, y: 3, label: "0.75", color: colors.amber, text: { ja: "指数分布", en: "exponential" } },
    { x: 0.55, y: 3, label: "0.55", color: colors.coral, text: { ja: "長い裾", en: "long tail" } },
  ];
  const gx = (u: number) => 220 + u * 1120;
  const gy = (w: number) => 600 - Math.min(w, 7) * 46;
  const curvePath = (factor: number, p: number) => {
    const pts: string[] = [];
    const steps = Math.max(2, Math.floor(80 * p));
    for (let i = 0; i <= steps; i++) {
      const u = 0.08 + (0.88 * i) / 80;
      const w = (u / (1 - u)) * factor;
      pts.push(`${i === 0 ? "M" : "L"} ${gx(u)} ${gy(w)}`);
    }
    return pts.join(" ");
  };
  return (
    <SceneShell kicker={label({ ja: "待ち行列", en: "Queueing" })} title={label({ ja: "ばらつきは、使える稼働率を削る", en: "Variability eats usable utilization" })}>
      <Abs x={120} y={226} w={1460} h={628}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <Svg>
            <g opacity={axis}>
              <line x1={220} y1={600} x2={1360} y2={600} stroke={colors.ink} strokeWidth={3} />
              <line x1={220} y1={245} x2={220} y2={600} stroke={colors.ink} strokeWidth={3} />
              <line x1={220} y1={gy(3)} x2={1360} y2={gy(3)} stroke={colors.hairlineStrong} strokeWidth={4} strokeDasharray="12 12" />
              <text x={230} y={gy(3) - 18} fontFamily={fonts.sans} fontSize={24} fill={colors.muted}>{t({ ja: "待ち時間 = サービス時間 × 3", en: "wait = 3 × service time" })}</text>
              <text x={1360} y={636} textAnchor="end" fontFamily={fonts.sans} fontSize={28} fill={colors.muted}>{t({ ja: "稼働率 ρ", en: "utilization ρ" })}</text>
              <text x={128} y={430} textAnchor="middle" fontFamily={fonts.sans} fontSize={25} fill={colors.muted} transform="rotate(-90 128 430)">{t({ ja: "待ち時間", en: "waiting time" })}</text>
            </g>
            <path d={curvePath(0.5, curves[0])} fill="none" stroke={colors.teal} strokeWidth={7} strokeLinecap="round" />
            <path d={curvePath(1.0, curves[1])} fill="none" stroke={colors.amber} strokeWidth={7} strokeLinecap="round" />
            <path d={curvePath(2.5, curves[2])} fill="none" stroke={colors.coral} strokeWidth={7} strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={p.label} opacity={progress(frame, cues[4] + 20 + i * 9, 12)}>
                <line x1={gx(p.x)} y1={gy(3)} x2={gx(p.x)} y2={600} stroke={p.color} strokeWidth={4} strokeDasharray="10 8" />
                <circle cx={gx(p.x)} cy={gy(p.y)} r={13} fill={p.color} />
              </g>
            ))}
          </Svg>
        </Card>
      </Abs>
      <Abs x={1540} y={312} w={320}>
        <Appear at={cues[1] + 8}>
          <Chip tone="teal" size={28}>{t({ ja: "0.86 決定的", en: "0.86 deterministic" })}</Chip>
        </Appear>
        <Appear at={cues[2] + 4} style={{ marginTop: 22 }}>
          <Chip tone="amber" size={28}>{t({ ja: "0.75 指数分布", en: "0.75 exponential" })}</Chip>
        </Appear>
        <Appear at={cues[4] + 4} style={{ marginTop: 22 }}>
          <Chip tone="coral" size={28}>{t({ ja: "0.55 長い裾", en: "0.55 long tail" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Metrics and layers                                                    */
/* ------------------------------------------------------------------------ */

export function MetricsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const metricIn = progress(frame, cues[1] + 4, 22);
  const layersIn = progress(frame, cues[2] + 6, 24);
  const blocked = progress(frame, cues[3] + 10, 18);
  const layers = [
    { name: { ja: "L1 クライアント", en: "L1 client" }, y: 590, tone: colors.surfaceSoft },
    { name: { ja: "L2 ゲートウェイ", en: "L2 gateway" }, y: 510, tone: colors.surfaceSoft },
    { name: { ja: "L3 エンドポイント選択", en: "L3 endpoint pick" }, y: 430, tone: colors.coralSoft },
    { name: { ja: "L4 エンジン内", en: "L4 engine" }, y: 350, tone: colors.amberSoft },
    { name: { ja: "L5 アクセラレータ", en: "L5 accelerator" }, y: 270, tone: colors.tealSoft },
  ];
  return (
    <SceneShell kicker={label({ ja: "指標と層", en: "Metrics and layers" })} title={label({ ja: "どこで、何を見ているか", en: "What each layer can see" })}>
      <Abs x={120} y={245} w={760} h={520} style={{ opacity: metricIn }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 44, fontWeight: 600 }}>{t({ ja: "同じ「遅い」でも原因が違う", en: "Same word, different causes" })}</div>
          {[
            { k: "TTFT", body: { ja: "最初のトークンまで", en: "time to first token" }, tone: "coral" as const },
            { k: "ITL", body: { ja: "トークン間の遅延", en: "inter-token latency" }, tone: "amber" as const },
            { k: "E2E", body: { ja: "全体の完了時間", en: "end-to-end latency" }, tone: "teal" as const },
          ].map((m, i) => (
            <div key={m.k} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: i === 0 ? 42 : 30 }}>
              <Chip tone={m.tone} size={30}><span style={{ fontFamily: fonts.mono }}>{m.k}</span></Chip>
              <span style={{ fontFamily: fonts.sans, fontSize: 31, color: colors.body }}>{t(m.body)}</span>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={1010} y={238} w={690} h={520} style={{ opacity: layersIn }}>
        {layers.map((l, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * 34,
              top: l.y - 238,
              width: 560,
              height: 62,
              borderRadius: 14,
              background: l.tone,
              border: `2px solid ${i === 2 || i === 3 ? colors.coral : colors.hairlineStrong}`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 28,
              fontFamily: fonts.sans,
              fontSize: 25,
              fontWeight: 700,
              color: colors.ink,
            }}
          >
            {t(l.name)}
          </div>
        ))}
        <Svg>
          <BigPacket x1={1125} y1={676} x2={1292} y2={460} start={cues[2] + 18} dur={50} color={colors.coral} label="req" />
        </Svg>
      </Abs>
      <Abs x={1010} y={790} w={790} style={{ opacity: blocked }}>
        <div style={{ borderRadius: 18, padding: "14px 22px", background: colors.errorSoft, color: colors.error, fontFamily: fonts.sans, fontSize: 25, fontWeight: 800, textAlign: "center", lineHeight: 1.25 }}>
          {t({ ja: "L3 が選んでも、L4 のバッチが詰まると TTFT は伸びる", en: "A good L3 pick still waits if the L4 batch is saturated" })}
        </div>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Selection policies                                                    */
/* ------------------------------------------------------------------------ */

export function PoliciesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rrP = progress(frame, cues[0] + 10, 28);
  const p2cP = progress(frame, cues[1] + 8, 28);
  const queueP = progress(frame, cues[2] + 10, 22);
  const nodes = [
    { x: 1180, y: 285, label: "A", load: 0.35 },
    { x: 1180, y: 500, label: "B", load: 0.82 },
    { x: 1180, y: 715, label: "C", load: 0.48 },
  ];
  return (
    <SceneShell kicker={label({ ja: "選択規則", en: "Selection rules" })} title={label({ ja: "見る信号で、裾が変わる", en: "The tail changes with the signal" })}>
      <Abs x={120} y={245} w={850} h={580}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{t({ ja: "同じ到着列", en: "Same arrival trace" })}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, marginTop: 42, height: 220 }}>
            {[
              { h: 62, c: colors.teal, l: "S" },
              { h: 190, c: colors.coral, l: "L" },
              { h: 74, c: colors.teal, l: "S" },
              { h: 166, c: colors.coral, l: "L" },
              { h: 58, c: colors.teal, l: "S" },
              { h: 86, c: colors.amber, l: "?" },
            ].map((b, i) => (
              <div key={i} style={{ width: 82, height: b.h, borderRadius: 12, background: b.c, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 800, opacity: progress(frame, cues[0] + i * 5, 12) }}>
                {b.l}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Card tone="soft" style={{ padding: 18, borderColor: colors.coral }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 700 }}>{t({ ja: "ラウンドロビン", en: "Round robin" })}</div>
              <div style={{ marginTop: 12, fontFamily: fonts.sans, fontSize: 25, color: colors.muted }}>{t({ ja: "件数は揃う", en: "counts equalize" })}</div>
            </Card>
            <Card tone="soft" style={{ padding: 18, borderColor: colors.teal }}>
              <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 700 }}>{t({ ja: "最小未完了数", en: "Least outstanding" })}</div>
              <div style={{ marginTop: 12, fontFamily: fonts.sans, fontSize: 25, color: colors.muted }}>{t({ ja: "裾を見に行く", en: "chases the tail" })}</div>
            </Card>
          </div>
        </Card>
      </Abs>
      <Abs x={822} y={492} w={206} h={96}>
        <Card tone="dark" style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 34, color: colors.onDark }}>{t({ ja: "ルーター", en: "router" })}</div>
        </Card>
      </Abs>
      <Svg>
        {nodes.map((n, i) => (
          <Arrow key={`rr-${i}`} x1={925} y1={540} x2={n.x} y2={n.y + 75} p={rrP} color={colors.hairlineStrong} width={4} head={false} />
        ))}
        <Arrow x1={925} y1={540} x2={nodes[0].x} y2={nodes[0].y + 75} p={p2cP} color={colors.teal} width={7} bend={-70} />
        <Arrow x1={925} y1={540} x2={nodes[2].x} y2={nodes[2].y + 75} p={p2cP} color={colors.teal} width={7} bend={70} />
        <BigPacket x1={925} y1={540} x2={nodes[0].x} y2={nodes[0].y + 75} start={cues[1] + 24} dur={34} color={colors.teal} label="pick" />
      </Svg>
      {nodes.map((n, i) => (
        <Replica key={n.label} x={n.x} y={n.y} label={`GPU ${n.label}`} load={n.load + (i === 1 && rrP > 0.6 ? 0.1 : 0)} active={i === 0 && p2cP > 0.4} />
      ))}
      <Abs x={1430} y={156} style={{ opacity: p2cP }}>
        <Chip tone="teal" size={28}>{t({ ja: "ランダムな2台の軽い方", en: "lighter of 2 random replicas" })}</Chip>
      </Abs>
      <Abs x={1030} y={214} w={760} style={{ opacity: queueP }}>
        <div style={{ borderRadius: 999, padding: "10px 22px", background: colors.coralSoft, color: colors.coralDeep, fontFamily: fonts.sans, fontSize: 24, fontWeight: 800, textAlign: "center" }}>
          {t({ ja: "受付済みで未完了 = 実行中 + キュー待ち", en: "accepted unfinished = running + queued" })}
        </div>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Prefix cache                                                          */
/* ------------------------------------------------------------------------ */

export function PrefixScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const build = progress(frame, cues[0] + 8, 22);
  const replay = progress(frame, cues[1] + 8, 22);
  const overload = progress(frame, cues[2] + 12, 24);
  const promptBlocks = [
    { label: { ja: "システム", en: "system" }, w: 230, c: colors.coralSoft },
    { label: { ja: "ツール", en: "tools" }, w: 190, c: colors.amberSoft },
    { label: { ja: "履歴", en: "history" }, w: 330, c: colors.tealSoft },
    { label: { ja: "新規", en: "new" }, w: 150, c: "#fff" },
  ];
  return (
    <SceneShell kicker={label({ ja: "KV キャッシュ", en: "KV cache" })} title={label({ ja: "同じ先頭を、もう一度計算しない", en: "Do not recompute the same prefix" })}>
      <Abs x={120} y={258} w={930} h={220}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{t({ ja: "エージェントの次の呼び出し", en: "Next agent call" })}</div>
          <div style={{ marginTop: 34, display: "flex", gap: 12 }}>
            {promptBlocks.map((b, i) => (
              <div key={i} style={{ width: b.w, height: 74, borderRadius: 12, background: b.c, border: `3px solid ${i < 3 ? colors.teal : colors.hairlineStrong}`, display: "grid", placeItems: "center", fontFamily: fonts.sans, fontSize: 25, fontWeight: 700, opacity: progress(frame, cues[1] + i * 5, 12) }}>
                {t(b.label)}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={560} y1={478} x2={1350} y2={445} p={replay} color={colors.teal} width={7} />
        <BigPacket x1={560} y1={478} x2={1350} y2={445} start={cues[1] + 28} dur={38} color={colors.teal} label="95%" />
        {["P1", "P1", "P1"].map((_, i) => (
          <BigPacket key={i} x1={1020} y1={360 + i * 44} x2={1350} y2={445} start={cues[2] + i * 10} dur={30} color={colors.coral} label="P1" />
        ))}
      </Svg>
      <Replica x={1310} y={330} label="GPU A" load={overload ? 0.95 : 0.42} cache active={overload > 0.5} />
      <Replica x={1310} y={550} label="GPU B" load={0.22} />
      <Abs x={1530} y={366} w={250} style={{ opacity: build }}>
        <div
          style={{
            borderRadius: 999,
            background: colors.tealSoft,
            color: colors.tealDeep,
            fontFamily: fonts.sans,
            fontSize: 24,
            fontWeight: 800,
            lineHeight: 1.15,
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          {t({ ja: "プレフィックスがキャッシュ済み", en: "prefix cached" })}
        </div>
      </Abs>
      <Abs x={120} y={620} w={850} h={210}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 700 }}>{t({ ja: "局所性の利点", en: "Locality benefit" })}</div>
          <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ flex: 1, height: 26, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}>
              <div style={{ width: `${80 * replay}%`, height: "100%", background: colors.teal }} />
            </div>
            <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, color: colors.tealDeep }}>{t({ ja: "プレフィル削減", en: "less prefill" })}</span>
          </div>
          <div style={{ marginTop: 28, fontFamily: fonts.sans, fontSize: 25, color: colors.muted }}>{t({ ja: "でも人気プレフィックスを追いすぎると、1台に寄る", en: "But a popular prefix can overload one replica" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. Affinity / balance                                                    */
/* ------------------------------------------------------------------------ */

export function AffinityScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const threshold = progress(frame, cues[0] + 8, 22);
  const cost = progress(frame, cues[1] + 8, 24);
  const dial = progress(frame, cues[2] + 4, 24);
  return (
    <SceneShell kicker={label({ ja: "親和性と均衡", en: "Affinity and balance" })} title={label({ ja: "逃げ道を持つキャッシュ親和性", en: "Cache affinity with an escape hatch" })}>
      <Abs x={120} y={252} w={760} h={520}>
        <Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 46, fontWeight: 600 }}>SGLang</div>
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div>
              <div style={{ fontFamily: fonts.sans, fontSize: 25, fontWeight: 700 }}>{t({ ja: "負荷差", en: "load gap" })}</div>
              <div style={{ height: 210, marginTop: 20, borderLeft: `3px solid ${colors.hairlineStrong}`, borderBottom: `3px solid ${colors.hairlineStrong}`, position: "relative" }}>
                <div style={{ position: "absolute", left: 0, bottom: 45, width: "100%", borderTop: `4px dashed ${colors.coral}`, opacity: threshold }} />
                <div style={{ position: "absolute", left: 90, bottom: 0, width: 62, height: 160 * threshold, borderRadius: "12px 12px 0 0", background: colors.coral }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
              <Chip tone="coral" size={26}>{t({ ja: "絶対値", en: "absolute" })}</Chip>
              <Chip tone="coral" size={26}>{t({ ja: "比率", en: "relative" })}</Chip>
              <ArrowLabel show={threshold} text={label({ ja: "超えたら最小負荷へ", en: "then choose least-loaded" })} />
            </div>
          </div>
        </Card>
      </Abs>
      <Abs x={1000} y={252} w={800} h={520}>
        <Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 46, fontWeight: 600 }}>NVIDIA Dynamo</div>
          <div style={{ marginTop: 46, display: "flex", alignItems: "center", justifyContent: "center", gap: 18, opacity: cost }}>
            {[
              { text: { ja: "プレフィル", en: "prefill" }, tone: "coral" as const },
              { text: { ja: "デコード", en: "decode" }, tone: "amber" as const },
              { text: { ja: "重なり", en: "overlap" }, tone: "teal" as const },
            ].map((x, i) => (
              <Chip key={i} tone={x.tone} size={27}>{t(x.text)}</Chip>
            ))}
            <span style={{ fontFamily: fonts.mono, fontSize: 38, fontWeight: 800 }}>= {t({ ja: "コスト", en: "cost" })}</span>
          </div>
          <div style={{ marginTop: 74, opacity: dial }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, color: colors.muted }}>
              <span>{t({ ja: "TTFT", en: "TTFT" })}</span>
              <span>{t({ ja: "ITL", en: "ITL" })}</span>
            </div>
            <div style={{ position: "relative", height: 20, marginTop: 22, borderRadius: 999, background: `linear-gradient(90deg, ${colors.teal}, ${colors.amber}, ${colors.coral})` }}>
              <div style={{ position: "absolute", left: `${42 + 10 * Math.sin(frame / 15)}%`, top: -18, width: 56, height: 56, borderRadius: 999, background: colors.ink, border: `6px solid ${colors.canvas}` }} />
            </div>
            <div style={{ marginTop: 58, textAlign: "center" }}>
              <Chip tone="muted" size={26}>{t({ ja: "キャッシュヒットか、負荷均衡かを動かすつまみ", en: "a dial between cache hits and balanced load" })}</Chip>
            </div>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

function ArrowLabel({ show, text }: { show: number; text: Bilingual }) {
  const t = useT();
  return (
    <div style={{ opacity: show, fontFamily: fonts.sans, fontSize: 25, fontWeight: 700, color: colors.coralDeep, lineHeight: 1.3 }}>
      {t(text)}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 7. Stale signals                                                         */
/* ------------------------------------------------------------------------ */

export function StaleScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const snapshot = progress(frame, cues[0] + 6, 20);
  const herd = progress(frame, cues[1] + 6, 26);
  const fixes = progress(frame, cues[2] + 2, 20);
  const spread = progress(frame, cues[3] + 8, 22);
  const fixItems = [
    { ja: "取得タイミングをずらす", en: "stagger scrapes" },
    { ja: "ランダムな2択", en: "two random choices" },
    { ja: "自分の投入を足す", en: "add own dispatches" },
    { ja: "新レプリカはゆっくり", en: "slow-start new replicas" },
  ];
  return (
    <SceneShell kicker={label({ ja: "古い信号", en: "Stale signals" })} title={label({ ja: "全員が同じ古い値を見ると、振動する", en: "One stale view can make the pool oscillate" })}>
      <Abs x={120} y={245} w={560} h={560}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "同じスナップショット", en: "same snapshot" })}</div>
          <div style={{ marginTop: 34, display: "grid", gap: 24 }}>
            {["GPU A", "GPU B", "GPU C", "GPU D"].map((r, i) => (
              <div key={r} style={{ display: "flex", alignItems: "center", gap: 18, opacity: progress(frame, cues[0] + i * 5, 12) }}>
                <div style={{ width: 116, height: 56, borderRadius: 12, background: colors.dark, color: colors.onDark, display: "grid", placeItems: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 800 }}>{r}</div>
                <div style={{ flex: 1, height: 16, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}>
                  <div style={{ width: `${(i === 0 ? 20 : 70) * snapshot}%`, height: "100%", background: i === 0 ? colors.teal : colors.amber }} />
                </div>
              </div>
            ))}
          </div>
          <Chip tone="teal" size={28} style={{ marginTop: 36 }}>{t({ ja: "GPU A が一番空いて見える", en: "GPU A looks emptiest" })}</Chip>
        </Card>
      </Abs>
      <Svg>
        {[0, 1, 2, 3, 4].map((i) => (
          <BigPacket key={`herd-${i}`} x1={760} y1={314 + i * 44} x2={1280} y2={292} start={cues[1] + i * 6} dur={34} color={colors.coral} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <BigPacket
            key={`spread-${i}`}
            x1={760}
            y1={430 + i * 42}
            x2={1280}
            y2={292 + i * 160}
            start={cues[3] + 12 + i * 5}
            dur={34}
            color={colors.teal}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <g key={`spread-rest-${i}`} opacity={spread}>
            <circle cx={1526} cy={292 + i * 160} r={15} fill={colors.teal} />
          </g>
        ))}
      </Svg>
      <Replica x={1280} y={220} label="GPU A" load={spread > 0.5 ? 0.55 : 0.95} active={herd > 0.4 && spread < 0.5} />
      <Replica x={1280} y={380} label="GPU B" load={spread > 0.5 ? 0.42 : 0.15} />
      <Replica x={1280} y={540} label="GPU C" load={spread > 0.5 ? 0.48 : 0.22} />
      <Replica x={1280} y={700} label="GPU D" load={spread > 0.5 ? 0.38 : 0.18} />
      <Abs x={1518} y={250} style={{ opacity: herd * (1 - spread) }}>
        <Chip tone="error" size={26}>{t({ ja: "殺到", en: "stampede" })}</Chip>
      </Abs>
      <Abs x={720} y={560} w={520} style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, opacity: fixes }}>
        {fixItems.map((f, i) => (
          <Card key={i} tone="white" accent={i === 1 ? colors.teal : colors.coral} style={{ padding: "18px 14px", textAlign: "center", minHeight: 94 }}>
            <div style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 800, color: i === 1 ? colors.tealDeep : colors.coralDeep }}>{i + 1}</div>
            <div style={{ marginTop: 6, fontFamily: fonts.sans, fontSize: 24, fontWeight: 700, lineHeight: 1.12 }}>{t(f)}</div>
          </Card>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. Engine scheduler                                                      */
/* ------------------------------------------------------------------------ */

export function EngineScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cont = progress(frame, cues[0] + 8, 26);
  const stall = progress(frame, cues[1] + 4, 18);
  const chunked = progress(frame, cues[2] + 4, 28);
  const split = progress(frame, cues[3] + 4, 24);
  const rows = [
    { y: 326, label: { ja: "静的", en: "static" }, color: colors.surfaceCream },
    { y: 500, label: { ja: "連続バッチ", en: "continuous" }, color: colors.amberSoft },
    { y: 674, label: { ja: "チャンク化", en: "chunked" }, color: colors.tealSoft },
  ];
  return (
    <SceneShell kicker={label({ ja: "エンジン内", en: "Inside the engine" })} title={label({ ja: "バッチは、反復ごとに組み替える", en: "The batch changes every iteration" })}>
      <Abs x={120} y={252} w={1130} h={580}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          {rows.map((r, row) => (
            <div key={row}>
              <div style={{ position: "absolute", left: 50, top: r.y - 252 + 35, fontFamily: fonts.sans, fontSize: 24, fontWeight: 800, color: colors.body }}>{t(r.label)}</div>
              <div style={{ position: "absolute", left: 230, top: r.y - 252, width: 800, height: 98, borderRadius: 16, background: colors.surfaceSoft, border: `2px solid ${colors.hairlineStrong}`, overflow: "hidden" }}>
                {Array.from({ length: 8 }, (_, i) => {
                  const x = 16 + i * 96;
                  const isPrefill = (row === 1 && i === 2 && stall > 0) || (row === 2 && i >= 2 && i <= 4 && chunked > 0);
                  const filled = row === 0 ? i < 5 : row === 1 ? i < 7 * cont : i < 7;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: x,
                        top: 17,
                        width: 86,
                        height: 68,
                        borderRadius: 12,
                        background: filled ? (isPrefill ? colors.coral : r.color) : "#fff",
                        border: `3px solid ${filled ? (isPrefill ? colors.coralDeep : colors.hairlineStrong) : colors.hairline}`,
                        display: "grid",
                        placeItems: "center",
                        fontFamily: fonts.mono,
                        fontSize: 25,
                        fontWeight: 800,
                        color: isPrefill ? "#fff" : colors.body,
                        opacity: row === 2 && i >= 2 && i <= 4 ? chunked : 1,
                      }}
                    >
                      {isPrefill ? "P" : filled ? "D" : ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <Abs x={270} y={378} style={{ opacity: stall }}>
            <Chip tone="error" size={27}>{t({ ja: "長い P が D を止める", en: "long P stalls D" })}</Chip>
          </Abs>
          <Abs x={270} y={552} style={{ opacity: chunked }}>
            <Chip tone="teal" size={27}>{t({ ja: "同じ反復で P と D が同居", en: "P rides with D in one iteration" })}</Chip>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1330} y={290} w={470} h={490} style={{ opacity: split }}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{t({ ja: "フェーズ分離", en: "phase split" })}</div>
          <div style={{ marginTop: 44, display: "grid", gap: 34 }}>
            <Chip tone="coral" size={28}>{t({ ja: "プレフィル: 演算律速", en: "prefill: compute-bound" })}</Chip>
            <Chip tone="teal" size={28}>{t({ ja: "デコード: 帯域律速", en: "decode: bandwidth-bound" })}</Chip>
            <div style={{ height: 4, background: colors.hairlineStrong, borderRadius: 2 }} />
            <Chip tone="muted" size={27}>Splitwise · DistServe</Chip>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Overload and first-token window                                       */
/* ------------------------------------------------------------------------ */

export function OverloadScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const multiply = progress(frame, cues[1] + 4, 26);
  const windowP = progress(frame, cues[2] + 4, 24);
  const guard = progress(frame, cues[3] + 4, 22);
  const nums = [3, 4, 4, 3];
  return (
    <SceneShell kicker={label({ ja: "過負荷制御", en: "Overload control" })} title={label({ ja: "失敗を、上流へ増幅させない", en: "Do not amplify failure upstream" })}>
      <Abs x={120} y={252} w={770} h={530}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 34, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 42, fontWeight: 600 }}>{t({ ja: "リトライは掛け算", en: "Retries multiply" })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 70, opacity: multiply }}>
            {nums.map((n, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Chip tone="coral" size={38}><span style={{ fontFamily: fonts.mono }}>{n}</span></Chip>
                {i < nums.length - 1 && <span style={{ fontFamily: fonts.mono, fontSize: 42, fontWeight: 800, color: colors.muted }}>×</span>}
              </div>
            ))}
            <span style={{ fontFamily: fonts.mono, fontSize: 42, fontWeight: 800, color: colors.muted }}>=</span>
          </div>
          <div style={{ marginTop: 46, opacity: multiply, display: "flex", alignItems: "baseline", gap: 22 }}>
            <span style={{ fontFamily: fonts.serif, fontSize: 86, fontWeight: 700, color: colors.coralDeep }}>144</span>
            <span style={{ fontFamily: fonts.sans, fontSize: 28, color: colors.body }}>{t({ ja: "最大の上流呼び出し", en: "possible upstream calls" })}</span>
          </div>
          <div style={{ marginTop: 16, opacity: multiply }}>
            <Chip tone="muted" size={24}>{t({ ja: "14 回ではない", en: "not 14" })}</Chip>
          </div>
        </Card>
      </Abs>
      <Abs x={1010} y={252} w={790} h={248}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "最初のトークンまでの窓", en: "window before first token" })}</div>
          <div style={{ position: "relative", marginTop: 54, height: 30, borderRadius: 999, background: colors.surfaceCream, overflow: "hidden" }}>
            <div style={{ width: `${72 * windowP}%`, height: "100%", background: colors.teal }} />
            <div style={{ position: "absolute", left: "72%", top: -8, width: 6, height: 46, background: colors.coral }} />
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>
            <span>{t({ ja: "リトライ / ヘッジ / フェイルオーバー", en: "retry / hedge / failover" })}</span>
            <span style={{ color: colors.coralDeep, fontWeight: 700 }}>{t({ ja: "最初のトークン", en: "first token" })}</span>
          </div>
        </Card>
      </Abs>
      <Abs x={1010} y={545} w={790} h={238} style={{ opacity: guard }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { ja: "キュー上限", en: "queue caps" },
              { ja: "デッドライン", en: "deadlines" },
              { ja: "ブレーカー", en: "breakers" },
              { ja: "Retry-After", en: "Retry-After" },
            ].map((x, i) => (
              <div key={i} style={{ height: 126, borderRadius: 16, background: i === 3 ? colors.tealSoft : colors.coralSoft, display: "grid", placeItems: "center", textAlign: "center", padding: 14, boxSizing: "border-box", fontFamily: fonts.sans, fontSize: 25, fontWeight: 800, color: i === 3 ? colors.tealDeep : colors.coralDeep }}>
                {t(x)}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 10. Agents                                                               */
/* ------------------------------------------------------------------------ */

export function AgentsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const session = progress(frame, cues[0] + 6, 22);
  const affinity = progress(frame, cues[1] + 6, 20);
  const fanout = progress(frame, cues[2] + 6, 28);
  const cap = progress(frame, cues[3] + 6, 20);
  const children = Array.from({ length: 10 }, (_, i) => ({ x: 800 + (i % 5) * 160, y: 470 + Math.floor(i / 5) * 96 }));
  return (
    <SceneShell kicker={label({ ja: "エージェント", en: "Agents" })} title={label({ ja: "単位は、リクエストからセッションへ", en: "The unit becomes a session" })}>
      <Abs x={120} y={272} w={520} h={470}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{t({ ja: "1 セッション", en: "one session" })}</div>
          <div style={{ marginTop: 42, height: 270, position: "relative" }}>
            {Array.from({ length: 12 }, (_, i) => {
              const p = progress(frame, cues[0] + i * 4, 10);
              return (
                <div key={i} style={{ position: "absolute", left: 20 + (i % 4) * 108, top: Math.floor(i / 4) * 78, width: 94, height: 62, borderRadius: 12, background: i % 3 === 0 ? colors.coralSoft : colors.tealSoft, border: `3px solid ${colors.hairlineStrong}`, opacity: p, display: "grid", placeItems: "center", fontFamily: fonts.mono, fontSize: 25, fontWeight: 800 }}>
                  {t({ ja: "呼び出し", en: "call" })}
                </div>
              );
            })}
          </div>
          <Chip tone="muted" size={27} style={{ opacity: session }}>{t({ ja: "数十〜数百回の呼び出し", en: "tens to hundreds of calls" })}</Chip>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={640} y1={486} x2={1270} y2={320} p={affinity} color={colors.teal} width={7} />
        {children.map((c, i) => (
          <BigPacket key={i} x1={610} y1={520} x2={c.x} y2={c.y} start={cues[2] + i * 3} dur={28} color={colors.coral} label="P" />
        ))}
      </Svg>
      <Replica x={1270} y={250} label="GPU A" load={fanout ? 0.95 : 0.36} cache active={affinity > 0.2} />
      <Abs x={1492} y={288} w={286} style={{ opacity: affinity }}>
        <div
          style={{
            borderRadius: 999,
            background: colors.tealSoft,
            color: colors.tealDeep,
            fontFamily: fonts.sans,
            fontSize: 25,
            fontWeight: 800,
            lineHeight: 1.15,
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          {t({ ja: "正しさではなく性能", en: "performance, not correctness" })}
        </div>
      </Abs>
      <Abs x={780} y={440} w={850} h={230} style={{ opacity: fanout }}>
        {children.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: c.x - 780, top: c.y - 440, width: 124, height: 64, borderRadius: 14, background: colors.coralSoft, border: `3px solid ${colors.coral}`, display: "grid", placeItems: "center", fontFamily: fonts.mono, fontSize: 25, fontWeight: 800 }}>
            {t({ ja: "子", en: "child" })}
          </div>
        ))}
      </Abs>
      <Abs x={815} y={750} w={820} style={{ opacity: cap, textAlign: "center" }}>
        <Chip tone="coral" size={28}>{t({ ja: "セッション単位の同時実行上限で、1操作の独占を防ぐ", en: "per-session caps keep one action from monopolizing the pool" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 11. Outro                                                                */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const a = progress(frame, 24, 20);
  const demos = [
    { ja: "選択規則の比較", en: "policy comparison" },
    { ja: "信号の古さ", en: "stale signals" },
    { ja: "プレフィックスルーティング", en: "prefix routing" },
    { ja: "連続バッチ処理", en: "continuous batching" },
  ];
  return (
    <EndCard slug="llm-load-balancing" headline={{ ja: "局所性と均衡を、古い信号の上で決める。", en: "Choose locality or balance on stale signals." }}>
      <div style={{ marginTop: 44, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 22, justifyContent: "center", width: 1180, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>
        {demos.map((d, i) => (
          <div
            key={i}
            style={{
              height: 82,
              borderRadius: 18,
              background: i % 2 === 0 ? colors.tealSoft : colors.coralSoft,
              border: `3px solid ${i % 2 === 0 ? colors.teal : colors.coral}`,
              display: "grid",
              placeItems: "center",
              fontFamily: fonts.sans,
              fontSize: 28,
              fontWeight: 800,
              color: i % 2 === 0 ? colors.tealDeep : colors.coralDeep,
            }}
          >
            {t(d)}
          </div>
        ))}
      </div>
    </EndCard>
  );
}
