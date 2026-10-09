import type {CSSProperties, ReactNode} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {pop, progress, window as visibleWindow} from "../../kit/anim";
import {EndCard, TitleCard} from "../../kit/cards";
import {SceneShell, useScene, useT, type Bilingual} from "../../kit/scene";
import {colors, fonts} from "../../kit/theme";
import {Abs, Arrow, Card, Chip, Packet, Svg} from "../../kit/ui";

type Tone = "coral" | "teal" | "amber" | "muted" | "error" | "ink";

const toneColor = (tone: Tone) =>
  tone === "teal" ? colors.teal : tone === "amber" ? colors.amber : tone === "error" ? colors.error : tone === "ink" ? colors.ink : colors.coral;

function Txt({children, size = 26, muted = false, style}: {children: Bilingual; size?: number; muted?: boolean; style?: CSSProperties}) {
  const t = useT();
  return (
    <div style={{fontFamily: fonts.sans, fontSize: size, lineHeight: 1.35, color: muted ? colors.muted : colors.body, ...style}}>
      {t(children)}
    </div>
  );
}

function Mono({children, size = 25, style}: {children: ReactNode; size?: number; style?: CSSProperties}) {
  return <div style={{fontFamily: fonts.mono, fontSize: size, fontWeight: 800, color: colors.ink, ...style}}>{children}</div>;
}

function G({label, x, y, tone = "coral", opacity = 1, scale = 1}: {label: string; x: number; y: number; tone?: Tone; opacity?: number; scale?: number}) {
  const bg = tone === "muted" ? colors.surfaceCream : toneColor(tone);
  return (
    <Abs x={x - 32} y={y - 32} w={64} h={64} style={{opacity, transform: `scale(${scale})`}}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          background: bg,
          color: tone === "muted" ? colors.body : "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: 24,
          fontWeight: 900,
          boxShadow: "0 8px 22px rgba(20,20,19,0.12)",
        }}
      >
        {label}
      </div>
    </Abs>
  );
}

function InlineG({label, tone = "coral"}: {label: string; tone?: Tone}) {
  const bg = toneColor(tone);
  return (
    <div style={{width: 78, height: 78, borderRadius: 39, background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 27, fontWeight: 900, boxShadow: "0 8px 22px rgba(20,20,19,0.12)"}}>
      {label}
    </div>
  );
}

function M({x, y, id, active = true, stuck = false}: {x: number; y: number; id: string; active?: boolean; stuck?: boolean}) {
  const t = useT();
  return (
    <Abs x={x} y={y} w={230} h={155}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          background: active ? colors.dark : colors.surfaceCard,
          border: `3px solid ${stuck ? colors.error : active ? colors.coral : colors.hairlineStrong}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={{fontFamily: fonts.mono, fontSize: 44, fontWeight: 900, color: active ? colors.onDark : colors.body}}>{id}</div>
        <div style={{fontFamily: fonts.sans, fontSize: 26, fontWeight: 800, color: stuck ? colors.error : active ? colors.onDarkSoft : colors.muted}}>{t({ja: "OSスレッド", en: "OS thread"})}</div>
      </div>
    </Abs>
  );
}

function Queue({count = 5, active = 4, head = false, start = 1}: {count?: number; active?: number; head?: boolean; start?: number}) {
  return (
    <div style={{display: "flex", gap: 16, marginTop: 34, alignItems: "center"}}>
      {Array.from({length: count}, (_, i) => {
        const on = i < active;
        const bg = on ? (head && i === 0 ? colors.teal : colors.coral) : colors.surfaceSoft;
        return (
          <div key={i} style={{width: 68, height: 68, borderRadius: 34, border: `3px solid ${on ? bg : colors.hairlineStrong}`, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 800, color: on ? "#fff" : colors.muted}}>
            {on ? `G${start + i}` : ""}
          </div>
        );
      })}
    </div>
  );
}

function P({x, y, id, children, w = 430, h = 260, accent = colors.coral}: {x: number; y: number; id: string; children?: ReactNode; w?: number; h?: number; accent?: string}) {
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <Card tone="white" accent={accent} style={{width: "100%", height: "100%", padding: 30, boxSizing: "border-box"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <Mono size={36}>{id}</Mono>
          <Chip tone={accent === colors.teal ? "teal" : accent === colors.error ? "error" : "coral"} size={24}>
            {accent === colors.error ? "_Psyscall" : "_Prunning"}
          </Chip>
        </div>
        {children}
      </Card>
    </Abs>
  );
}

function BigPanel({x, y, w, h, title, accent, children, at = 0}: {x: number; y: number; w: number; h: number; title: ReactNode; accent: string; children?: ReactNode; at?: number}) {
  const frame = useCurrentFrame();
  const a = progress(frame, at, 16);
  return (
    <Abs x={x} y={y} w={w} h={h} style={{opacity: 0.22 + a * 0.78, transform: `translateY(${(1 - a) * 18}px)`}}>
      <Card tone="white" accent={accent} style={{width: "100%", height: "100%", padding: 28, boxSizing: "border-box"}}>
        <Mono size={38}>{title}</Mono>
        {children}
      </Card>
    </Abs>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <TitleCard
      title={{ja: "Go スケジューラの仕組み\nG・M・Pモデル", en: "How Go's Scheduler Works\nThe G, M, P Model"}}
      subtitle={{ja: "goroutine、OSスレッド、実行権の連携を動く図で追う", en: "A visual tour of goroutines, OS threads, and execution tokens"}}
      art={
        <>
          <Abs x={1110} y={180} w={745} h={680}>
            <Card tone="soft" style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}>
              <div style={{fontFamily: fonts.serif, fontSize: 46, fontWeight: 600}}>runtime dashboard</div>
              {[0, 1, 2].map((i) => {
                const s = Math.min(1, pop(frame, 24 + i * 8, fps));
                return (
                  <div key={i} style={{opacity: s, transform: `translateX(${(1 - s) * 24}px)`, height: 155, borderRadius: 18, background: "#fff", border: `3px solid ${i === 0 ? colors.coral : colors.hairlineStrong}`, marginTop: 24, padding: 20, boxSizing: "border-box"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                      <Mono>{`P${i}`}</Mono>
                      <Chip tone={i === 0 ? "coral" : "teal"} size={24}>{`M${i}`}</Chip>
                    </div>
                    <div style={{display: "flex", gap: 16, marginTop: 22}}>
                      {[0, 1, 2, 3].map((j) => (
                        <div key={j} style={{width: 66, height: 48, borderRadius: 10, background: j === 0 ? colors.coral : colors.surfaceCream, color: j === 0 ? "#fff" : colors.body, fontFamily: fonts.mono, fontSize: 24, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center"}}>{`G${i * 4 + j + 1}`}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </Card>
          </Abs>
          <Svg>
            <Packet x1={1045} y1={300} x2={1320} y2={425} start={46} dur={38} r={15} label="G" />
            <Packet x1={1810} y1={520} x2={1610} y2={690} start={72} dur={42} color={colors.teal} r={15} label="P" />
          </Svg>
        </>
      }
    />
  );
}

export function ModelScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const bind = progress(frame, cues[1] + 4, 22);
  const mux = progress(frame, cues[2] + 8, 28);
  return (
    <SceneShell kicker={{ja: "基本モデル", en: "Core model"}} title={{ja: "G・M・Pの3つの役割", en: "Three roles: G, M, and P"}}>
      <BigPanel x={120} y={214} w={500} h={624} title="G" accent={colors.coral} at={cues[0]}>
        <Txt size={31} style={{marginTop: 24}}>{ {ja: "実行したい goroutine", en: "goroutine that wants to run"} }</Txt>
        <div style={{display: "flex", gap: 42, marginTop: 150}}>{["G1", "G2", "G3"].map((g, i) => <InlineG key={g} label={g} tone={i === 0 ? "coral" : "amber"} />)}</div>
      </BigPanel>
      <BigPanel x={710} y={214} w={500} h={624} title="M" accent={colors.dark} at={cues[0] + 16}>
        <Txt size={31} style={{marginTop: 24}}>{ {ja: "OSスレッド", en: "OS thread"} }</Txt>
        <M x={105} y={330} id="M0" />
      </BigPanel>
      <BigPanel x={1300} y={214} w={500} h={624} title="P" accent={colors.teal} at={cues[0] + 34}>
        <Txt size={30} style={{marginTop: 24}}>{ {ja: "ユーザーGoコードを実行する権利", en: "right to run user Go code"} }</Txt>
        <div style={{marginTop: 158}}><Chip tone="teal" size={34}>_Prunning</Chip></div>
      </BigPanel>
      <Svg>
        <Arrow x1={620} y1={520} x2={710} y2={520} p={bind} color={colors.coral} width={6} />
        <Arrow x1={1210} y1={520} x2={1300} y2={520} p={bind} color={colors.teal} width={6} />
        {[0, 1, 2, 3, 4].map((i) => <Packet key={i} x1={240 + i * 68} y1={760} x2={840 + (i % 2) * 150} y2={760} start={cues[2] + i * 8} dur={32} label={`G${i + 1}`} color={i % 2 ? colors.amber : colors.coral} />)}
      </Svg>
      <Abs x={580} y={850} w={760} style={{opacity: mux, textAlign: "center"}}><Chip tone="ink" size={30}>{t({ja: "M:N — 多数のGを少数のMへ", en: "M:N — many Gs onto fewer Ms"})}</Chip></Abs>
    </SceneShell>
  );
}

export function StructsScene() {
  const {cues} = useScene();
  const cards = [
    {name: "runtime.g", accent: colors.coral, rows: ["stack: 2 KB → grow", "sched: gobuf", "stackguard0", "atomicstatus"], x: 120, at: cues[0]},
    {name: "runtime.m", accent: colors.amber, rows: ["g0: scheduler stack", "curg: current G", "p: attached P", "spinning"], x: 700, at: cues[1]},
    {name: "runtime.p", accent: colors.teal, rows: ["runq [256]", "runnext: 1 slot", "status", "gFree"], x: 1280, at: cues[2]},
  ];
  return (
    <SceneShell kicker={{ja: "内部構造", en: "Internals"}} title={{ja: "構造体が持つ、実行の状態", en: "Structs that carry runtime state"}}>
      {cards.map((c) => (
        <BigPanel key={c.name} x={c.x} y={220} w={520} h={620} title={c.name} accent={c.accent} at={c.at}>
          <div style={{marginTop: 34, display: "grid", gap: 22}}>
            {c.rows.map((r, i) => <div key={r} style={{borderRadius: 14, background: i === 0 ? colors.surfaceCard : colors.surfaceSoft, border: `2px solid ${i === 0 ? c.accent : colors.hairline}`, padding: "22px 20px", fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: colors.body}}>{r}</div>)}
          </div>
        </BigPanel>
      ))}
    </SceneShell>
  );
}

export function QueuesScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const ring = progress(frame, cues[0] + 8, 28);
  const rn = progress(frame, cues[1] + 6, 18);
  const glob = progress(frame, cues[2] + 6, 18);
  const slotW = 76;
  const slotGap = 10;
  const stripX = 150;
  const stripY = 350;
  const slotCenterX = (index: number) => stripX + index * (slotW + slotGap) + slotW / 2;
  const slotCenterY = stripY + 43;
  return (
    <SceneShell kicker={{ja: "実行キュー", en: "Run queues"}} title={{ja: "ローカルキューとグローバルキュー", en: "Local queues and the global queue"}}>
      <P x={120} y={220} id="P0" w={930} h={600}>
        <div style={{position: "relative", height: 424, marginTop: 26}}>
          <div style={{position: "absolute", left: 0, top: 0, display: "flex", gap: slotGap}}>
          {Array.from({length: 10}, (_, i) => {
            const queued = i >= 2 && i <= 6;
            const isTail = i === 7;
            const visible = ring > 0.2;
            const bg = queued ? colors.coralSoft : colors.surfaceSoft;
            const border = queued ? colors.coral : isTail ? colors.amber : colors.hairlineStrong;
            const label = queued ? `G${i - 1}` : i === 9 ? "…" : "";
            return <div key={i} style={{width: slotW, height: 86, opacity: visible ? 1 : 0.35, borderRadius: 14, background: bg, border: `3px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 900, color: queued ? colors.coralDeep : colors.muted}}>{label}</div>;
          })}
          </div>
          <div style={{position: "absolute", left: 2 * (slotW + slotGap) + 6, top: -46, color: colors.tealDeep, fontFamily: fonts.mono, fontSize: 26, fontWeight: 900}}>↓ head</div>
          <div style={{position: "absolute", left: 7 * (slotW + slotGap) + 8, top: -46, color: colors.coralDeep, fontFamily: fonts.mono, fontSize: 26, fontWeight: 900}}>↓ tail</div>
          <div style={{position: "absolute", left: 0, top: 124, display: "flex", gap: 18}}>
            <Chip tone="muted" size={26}>runq [256]</Chip>
            <Chip tone="teal" size={26}>{t({ja: "headからpop / steal", en: "pop / steal from head"})}</Chip>
            <Chip tone="coral" size={26}>{t({ja: "tailへowner push", en: "owner pushes at tail"})}</Chip>
          </div>
          <div style={{position: "absolute", left: 0, top: 230, width: 830, height: 150, borderRadius: 18, background: colors.surfaceSoft, border: `2px dashed ${colors.hairlineStrong}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 22, boxSizing: "border-box"}}>
            <div>
              <Mono size={28}>pop / steal</Mono>
              <Txt size={26} style={{marginTop: 10}}>{ {ja: "先頭のG1を取り出す", en: "take G1 at the head"} }</Txt>
            </div>
            <div>
              <Mono size={28}>owner push</Mono>
              <Txt size={26} style={{marginTop: 10}}>{ {ja: "次の空きslotへG6を入れる", en: "put G6 into the next free slot"} }</Txt>
            </div>
          </div>
        </div>
      </P>
      <Abs x={1130} y={220} w={520} h={220} style={{opacity: 0.24 + rn * 0.76}}>
        <Card tone="white" accent={colors.amber} style={{width: "100%", height: "100%", padding: 30, boxSizing: "border-box"}}>
          <Mono size={36}>runnext</Mono>
          <G label="G9" x={255} y={130} tone="amber" scale={1.2} />
        </Card>
      </Abs>
      <Abs x={1130} y={510} w={670} h={310} style={{opacity: 0.24 + glob * 0.76}}>
        <Card tone="soft" accent={colors.teal} style={{width: "100%", height: "100%", padding: 30, boxSizing: "border-box"}}>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}><Mono size={34}>global run queue</Mono><Chip tone="teal" size={26}>{t({ja: "全Pで共有", en: "shared by all Ps"})}</Chip></div>
          <div style={{display: "flex", gap: 18, marginTop: 48}}>{["G20", "G21", "G22", "G23"].map((g) => <div key={g} style={{width: 130, height: 88, borderRadius: 16, background: colors.tealSoft, border: `3px solid ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 28, fontWeight: 900}}>{g}</div>)}</div>
        </Card>
      </Abs>
      <Svg>
        <Packet x1={slotCenterX(7)} y1={572} x2={slotCenterX(7)} y2={slotCenterY} start={cues[0] + 36} dur={32} color={colors.coral} r={15} label="push" />
        <Packet x1={slotCenterX(2)} y1={slotCenterY} x2={slotCenterX(2)} y2={572} start={cues[0] + 78} dur={32} color={colors.teal} r={15} label="pop" />
        <Packet x1={1260} y1={462} x2={925} y2={440} start={cues[1] + 16} dur={30} color={colors.amber} r={15} label="next" />
      </Svg>
    </SceneShell>
  );
}

export function ScheduleScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const steps = [
    {label: "global", at: cues[1], tone: "teal" as Tone},
    {label: "runnext", at: cues[1] + 48, tone: "amber" as Tone},
    {label: "local runq", at: cues[1] + 94, tone: "coral" as Tone},
    {label: "widen", at: cues[2], tone: "ink" as Tone},
  ];
  return (
    <SceneShell kicker={{ja: "schedule()", en: "schedule()"}} title={{ja: "次に走るGを探す", en: "Find the next G to run"}}>
      <Abs x={120} y={218} w={640} h={620}>
        <Card tone="dark" style={{width: "100%", height: "100%", padding: 30, boxSizing: "border-box"}}>
          <Mono size={42} style={{color: colors.onDark}}>M0.g0</Mono>
          <Txt size={32} muted style={{marginTop: 34, color: colors.onDarkSoft}}>{ {ja: "schedule関数はg0スタック上で実行", en: "schedule function runs on the g0 stack"} }</Txt>
          <div style={{marginTop: 84, display: "flex", gap: 24, alignItems: "center"}}><Chip tone="coral" size={34}>M0</Chip><span style={{color: colors.onDarkSoft, fontSize: 44}}>+</span><Chip tone="teal" size={34}>P0</Chip></div>
        </Card>
      </Abs>
      <Abs x={800} y={202} w={1000} h={655}>
        <Card tone="white" style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}>
          {steps.map((s, i) => {
            const active = visibleWindow(frame, s.at, (steps[i + 1]?.at ?? s.at + 80) + 28, 10);
            return (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  marginBottom: 24,
                  minHeight: 118,
                  borderRadius: 18,
                  padding: "0 26px",
                  background: active > 0.3 ? colors.surfaceSoft : "transparent",
                  border: `2px solid ${active > 0.3 ? toneColor(s.tone) : colors.hairline}`,
                }}
              >
                <Chip tone={active > 0.3 ? s.tone : "muted"} size={30}>{String(i + 1).padStart(2, "0")}</Chip>
                <Mono size={40} style={{color: active > 0.3 ? colors.ink : colors.muted}}>{s.label}</Mono>
                {i === 0 && <Chip tone="teal" size={24}>schedtick % 61</Chip>}
              </div>
            );
          })}
        </Card>
      </Abs>
      <Svg>{steps.slice(0, 3).map((s, i) => <Packet key={s.label} x1={760} y1={338 + i * 142} x2={1035} y2={338 + i * 142} start={s.at + 12} dur={26} color={i === 0 ? colors.teal : i === 1 ? colors.amber : colors.coral} r={15} label="G?" />)}</Svg>
    </SceneShell>
  );
}

export function FindRunnableScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const nodes = [
    {id: "GC", x: 120, y: 255, at: cues[0] + 8, tone: colors.teal},
    {id: "finalizer", x: 510, y: 255, at: cues[0] + 42, tone: colors.teal},
    {id: "global", x: 900, y: 255, at: cues[0] + 76, tone: colors.amber},
    {id: "netpoll", x: 1290, y: 255, at: cues[0] + 110, tone: colors.coral},
    {id: "steal", x: 510, y: 620, at: cues[1] + 6, tone: colors.coral},
    {id: "timer / wait", x: 1050, y: 620, at: cues[2] + 8, tone: colors.hairlineStrong},
  ];
  return (
    <SceneShell kicker={{ja: "findRunnable()", en: "findRunnable()"}} title={{ja: "広い探索と、work stealing", en: "Widen the search, then steal"}}>
      <Svg>
        {nodes.slice(1, 4).map((n, i) => <Arrow key={n.id} x1={nodes[i].x + 340} y1={355} x2={n.x} y2={355} p={progress(frame, n.at - 14, 14)} color={colors.hairlineStrong} width={5} />)}
        <Arrow x1={1460} y1={355} x2={690} y2={620} p={progress(frame, cues[1] - 8, 20)} color={colors.coral} width={6} bend={130} />
        <Arrow x1={850} y1={720} x2={1050} y2={720} p={progress(frame, cues[2] - 8, 18)} color={colors.muted} width={5} dashed />
        <Packet x1={1500} y1={610} x2={660} y2={720} start={cues[1] + 18} dur={42} color={colors.teal} r={15} label="G" />
      </Svg>
      <Abs x={1450} y={550} w={350} h={180} style={{opacity: progress(frame, cues[1] - 12, 18)}}>
        <Card tone="soft" accent={colors.teal} style={{width: "100%", height: "100%", padding: 22, boxSizing: "border-box"}}>
          <Mono size={28}>other P</Mono>
          <Queue count={3} active={3} head />
        </Card>
      </Abs>
      {nodes.map((n) => {
        const on = progress(frame, n.at, 14);
        return (
          <Abs key={n.id} x={n.x} y={n.y} w={340} h={190} style={{opacity: 0.38 + on * 0.62, transform: `scale(${0.96 + on * 0.04})`}}>
            <Card tone="white" accent={on > 0.5 ? n.tone : colors.hairlineStrong} style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10}}>
              <Mono size={36}>{n.id}</Mono>
              {n.id === "steal" && <Chip tone={on > 0.5 ? "coral" : "muted"} size={24}>{t({ja: "別Pのheadから", en: "from another P's head"})}</Chip>}
            </Card>
          </Abs>
        );
      })}
      <Abs x={1340} y={802} style={{opacity: progress(frame, cues[2] + 12, 16)}}><Chip tone="muted" size={28}>{t({ja: "空ならブロックして待つ", en: "if empty, block and wait"})}</Chip></Abs>
    </SceneShell>
  );
}

export function SyscallHandoffScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const stuck = progress(frame, cues[0] + 8, 16);
  const retake = progress(frame, cues[1] + 10, 28);
  const attach = progress(frame, cues[2] + 8, 28);
  return (
    <SceneShell kicker={{ja: "syscall", en: "syscall"}} title={{ja: "Mが止まっても、Pを取り戻す", en: "When an M blocks, reclaim the P"}}>
      <P x={120} y={230} id="P0" w={575} h={390} accent={stuck > 0.5 && retake < 0.6 ? colors.error : colors.coral}><Queue active={4} /><div style={{marginTop: 38}}><Chip tone={stuck > 0.5 && retake < 0.6 ? "error" : "teal"} size={26}>{stuck > 0.5 && retake < 0.6 ? t({ja: "このPのGが待つ", en: "Gs on this P wait"}) : t({ja: "M2 で再開", en: "resumes on M2"})}</Chip></div></P>
      <P x={745} y={230} id="P1" w={520} h={390} accent={colors.teal}><Queue count={4} active={3} start={5} /><Chip tone="teal" size={26} style={{marginTop: 38}}>{t({ja: "他のPは動き続ける", en: "other Ps keep running"})}</Chip></P>
      <M x={260} y={710} id="M0" stuck={stuck > 0.4} />
      <M x={890} y={710} id="M1" />
      <M x={1410} y={710} id="M2" active={attach > 0.2} />
      <Svg>
        <Arrow x1={405} y1={620} x2={375} y2={710} p={1} color={stuck > 0.4 ? colors.error : colors.coral} width={6} opacity={1 - retake} />
        <Arrow x1={1005} y1={620} x2={1005} y2={710} p={1} color={colors.teal} width={6} />
        <Arrow x1={1560} y1={530} x2={1530} y2={710} p={attach} color={colors.teal} width={6} bend={-70} />
        <Packet x1={1560} y1={530} x2={1530} y2={695} start={cues[1] + 18} dur={48} color={colors.teal} r={15} label="P0" />
      </Svg>
      <Abs x={502} y={765} style={{opacity: stuck}}><Chip tone="error" size={26}>{t({ja: "syscall でブロック中", en: "blocked in syscall"})}</Chip></Abs>
      <Abs x={1320} y={230} w={480} h={300} style={{opacity: retake}}><Card tone="white" accent={colors.teal} style={{width: "100%", height: "100%", padding: 30, boxSizing: "border-box"}}><Mono size={38}>sysmon</Mono><div style={{marginTop: 24}}><Chip tone="teal" size={30}>retake()</Chip></div><Txt size={28} style={{marginTop: 28}}>{ {ja: "Pを取り戻して別のMへ渡す", en: "reclaim P and attach it elsewhere"} }</Txt></Card></Abs>
      <Abs x={1390} y={628} style={{opacity: attach}}><Chip tone="teal" size={30}>P0 (handoffp)</Chip></Abs>
    </SceneShell>
  );
}

export function PreemptionScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const pulse = (Math.sin(frame / 5) + 1) / 2;
  const coop = progress(frame, cues[1] + 6, 18);
  const guard = progress(frame, cues[2] + 6, 20);
  const async = progress(frame, cues[3] + 6, 20);
  return (
    <SceneShell kicker={{ja: "preemption", en: "preemption"}} title={{ja: "長く走るGを止める", en: "Interrupt a G that runs too long"}}>
      <Abs x={120} y={230} w={760} h={585}><Card tone="white" accent={colors.coral} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><div style={{display: "flex", justifyContent: "space-between"}}><Mono size={38}>cooperative</Mono><Chip tone="amber" size={26}>sysmon &gt; 10 ms</Chip></div><div style={{marginTop: 54, display: "grid", gap: 18}}>{["func prologue", "stackguard0", "special value", "_Grunnable"].map((r, i) => <div key={r} style={{opacity: i === 0 ? 1 : guard, borderRadius: 14, background: i === 2 ? colors.amberSoft : colors.surfaceSoft, border: `2px solid ${i === 2 ? colors.amber : colors.hairline}`, padding: 22, fontFamily: fonts.mono, fontSize: 30, fontWeight: i === 2 ? 900 : 700}}>{r}</div>)}</div></Card></Abs>
      <G label="G" x={960} y={490} tone="amber" opacity={coop} scale={1.35 + pulse * 0.12} />
      <Abs x={1040} y={230} w={760} h={585}><Card tone="dark" accent={colors.darkElevated} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><div style={{display: "flex", justifyContent: "space-between"}}><Mono size={38} style={{color: colors.onDark}}>asynchronous</Mono><Chip tone="coral" size={26}>Go 1.14+</Chip></div><div style={{marginTop: 60, height: 180, borderRadius: 18, background: colors.darkElevated, border: `3px solid ${colors.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 34, color: colors.onDark}}>for &#123; &#125;<span style={{marginLeft: 22, color: colors.onDarkSoft, fontSize: 30}}>{t({ja: "関数呼び出しなし", en: "no function calls"})}</span></div><div style={{marginTop: 48, display: "flex", alignItems: "center", gap: 18, opacity: async}}><Chip tone="coral" size={28}>signal</Chip><span style={{color: colors.onDarkSoft, fontSize: 38}}>→</span><Chip tone="coral" size={28}>asyncPreempt</Chip><span style={{color: colors.onDarkSoft, fontSize: 38}}>→</span><Chip tone="teal" size={28}>schedule()</Chip></div></Card></Abs>
      <Svg><Packet x1={1405} y1={740} x2={1405} y2={450} start={cues[3] + 20} dur={32} color={colors.coral} r={15} label="signal" /></Svg>
    </SceneShell>
  );
}

export function NetpollerScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const park = progress(frame, cues[1] + 8, 22);
  const complete = progress(frame, cues[2] + 8, 24);
  return (
    <SceneShell kicker={{ja: "netpoller", en: "netpoller"}} title={{ja: "ネットワークI/OでMを塞がない", en: "Network I/O without blocking the M"}}>
      <Abs x={120} y={285} w={470} h={360}><Card tone="white" accent={colors.coral} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><Mono size={36}>conn.Read</Mono><G label="G" x={235} y={145} tone={park > 0.5 ? "amber" : "coral"} scale={1.25} /><Chip tone={park > 0.5 ? "amber" : "coral"} size={28} style={{marginTop: 210}}>{park > 0.5 ? "_Gwaiting" : "_Grunning"}</Chip></Card></Abs>
      <Abs x={710} y={230} w={500} h={490}><Card tone="dark" style={{width: "100%", height: "100%", padding: 36, boxSizing: "border-box"}}><Mono size={38} style={{color: colors.onDark}}>OS facility</Mono><div style={{marginTop: 34, display: "grid", gap: 22}}>{["epoll", "kqueue", "IOCP"].map((s, i) => <div key={s} style={{borderRadius: 14, padding: 24, background: i === 0 ? colors.coral : colors.darkElevated, color: i === 0 ? "#fff" : colors.onDarkSoft, fontFamily: fonts.mono, fontSize: 32, fontWeight: 900}}>{s}</div>)}</div></Card></Abs>
      <Abs x={1330} y={285} w={470} h={360}><Card tone="white" accent={colors.teal} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><Mono size={36}>run queue</Mono><G label="G" x={235} y={145} tone="teal" opacity={complete} scale={1.25} /><Chip tone="teal" size={28} style={{marginTop: 210, opacity: complete}}>{t({ja: "実行可能", en: "runnable"})}</Chip></Card></Abs>
      <Svg><Packet x1={590} y1={465} x2={710} y2={465} start={cues[1] + 15} dur={36} color={colors.amber} r={15} label="fd" /><Packet x1={1210} y1={465} x2={1330} y2={465} start={cues[2] + 15} dur={36} color={colors.teal} r={15} label="G" /><Arrow x1={960} y1={720} x2={1565} y2={645} p={complete} color={colors.teal} width={5} dashed bend={40} /></Svg>
      <Abs x={770} y={752} w={420} style={{textAlign: "center", opacity: complete}}><Chip tone="teal" size={28}>{t({ja: "epoll: 準備完了", en: "epoll: ready"})}</Chip></Abs>
      <Abs x={610} y={810} w={700} style={{textAlign: "center", opacity: park}}><Chip tone="muted" size={28}>{t({ja: "fdはOSの仕組みで監視される", en: "the fd is watched by the OS facility"})}</Chip></Abs>
    </SceneShell>
  );
}

export function LifecycleScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const states = ["_Grunnable", "_Grunning", "_Gwaiting", "_Gsyscall", "_Gdead"];
  const pts = states.map((_, i) => ({x: 280 + i * 340, y: i % 2 ? 565 : 280}));
  return (
    <SceneShell kicker={{ja: "状態遷移", en: "Lifecycle"}} title={{ja: "Gの状態は、キューと実行を行き来する", en: "A G moves between queues and execution"}}>
      <Abs x={120} y={220} w={1680} h={650}>
        <Card tone="soft" style={{width: "100%", height: "100%", opacity: 0.72}}>{null}</Card>
      </Abs>
      <Svg>
        <Arrow x1={pts[0].x + 90} y1={pts[0].y + 55} x2={pts[1].x - 90} y2={pts[1].y + 55} p={progress(frame, cues[0] + 12, 18)} color={colors.coral} width={5} />
        <Arrow x1={pts[1].x + 85} y1={pts[1].y + 45} x2={pts[2].x - 80} y2={pts[2].y + 55} p={progress(frame, cues[1] + 8, 18)} color={colors.amber} width={5} bend={-80} />
        <Arrow x1={pts[2].x + 85} y1={pts[2].y + 55} x2={pts[0].x - 70} y2={pts[0].y + 75} p={progress(frame, cues[1] + 60, 26)} color={colors.teal} width={4} bend={180} dashed />
        <Arrow x1={pts[1].x + 95} y1={pts[1].y + 70} x2={pts[3].x - 90} y2={pts[3].y + 55} p={progress(frame, cues[1] + 42, 18)} color={colors.error} width={5} bend={80} />
        <Arrow x1={pts[3].x + 95} y1={pts[3].y + 55} x2={pts[4].x - 90} y2={pts[4].y + 55} p={progress(frame, cues[2] + 8, 20)} color={colors.muted} width={5} />
      </Svg>
      {states.map((s, i) => {
        const at = i < 2 ? cues[0] + i * 24 : i < 4 ? cues[1] + (i - 2) * 34 : cues[2] + 8;
        const a = progress(frame, at, 16);
        const accent = i === 1 ? colors.coral : i === 2 ? colors.amber : i === 3 ? colors.error : i === 4 ? colors.muted : colors.teal;
        return <Abs key={s} x={pts[i].x - 150} y={pts[i].y} w={300} h={140} style={{opacity: 0.24 + a * 0.76, transform: `scale(${0.92 + a * 0.08})`}}><Card tone="white" accent={a > 0.5 ? accent : colors.hairlineStrong} style={{width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 32, fontWeight: 900}}>{s}</Card></Abs>;
      })}
      <Abs x={675} y={802} style={{opacity: 0.35 + progress(frame, cues[2] + 24, 18) * 0.65}}><Chip tone="muted" size={32}>gFree list → reuse</Chip></Abs>
    </SceneShell>
  );
}

export function CostsScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const go = progress(frame, cues[1] + 4, 20);
  const os = progress(frame, cues[2] + 4, 20);
  return (
    <SceneShell kicker={{ja: "切り替えコスト", en: "Switch cost"}} title={{ja: "goroutineは、OSスレッドより軽い", en: "Goroutine switches are much lighter"}}>
      <Abs x={120} y={230} w={1680} h={600}><Card tone="white" accent={colors.hairlineStrong} style={{width: "100%", height: "100%", padding: 42, boxSizing: "border-box"}}><div style={{display: "grid", gridTemplateColumns: "360px 1fr 220px", rowGap: 42, columnGap: 28, alignItems: "center"}}>
        <Mono size={40}>goroutine</Mono><div style={{height: 76, borderRadius: 14, background: colors.surfaceSoft, overflow: "hidden"}}><div style={{width: `${go * 18}%`, height: "100%", borderRadius: 14, background: colors.teal}} /></div><Chip tone="teal" size={32}>100–200 ns</Chip>
        <Mono size={40}>OS thread</Mono><div style={{height: 76, borderRadius: 14, background: colors.surfaceSoft, overflow: "hidden"}}><div style={{width: `${os * 92}%`, height: "100%", borderRadius: 14, background: colors.coral}} /></div><Chip tone="coral" size={32}>1–10 µs</Chip>
      </div><div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 34, marginTop: 66}}><Card tone="soft" style={{padding: 30}}><Mono size={32}>gobuf &#123; pc, sp, bp, ... &#125;</Mono><Txt size={30} style={{marginTop: 18}}>{ {ja: "数個のレジスタだけ", en: "just a few registers"} }</Txt></Card><Card tone="soft" style={{padding: 30}}><Mono size={32}>kernel scheduler + cache</Mono><Txt size={30} style={{marginTop: 18}}>{ {ja: "スタック 1〜8 MB", en: "1–8 MB stack"} }</Txt></Card></div></Card></Abs>
      <Svg><Packet x1={360} y1={795} x2={650} y2={795} start={cues[0] + 18} dur={26} color={colors.teal} r={15} label="pc/sp" /><Packet x1={1180} y1={795} x2={1540} y2={795} start={cues[2] + 18} dur={36} color={colors.coral} r={15} label="state" /></Svg>
    </SceneShell>
  );
}

export function GoMaxProcsScene() {
  const frame = useCurrentFrame();
  const {cues} = useScene();
  const t = useT();
  const ms = progress(frame, cues[1] + 8, 28);
  const container = progress(frame, cues[2] + 6, 22);
  const manual = progress(frame, cues[3] + 6, 18);
  return (
    <SceneShell kicker={{ja: "GOMAXPROCS", en: "GOMAXPROCS"}} title={{ja: "Pの数と、実際のMの数", en: "Number of Ps, number of Ms"}}>
      <Abs x={120} y={220} w={980} h={620}><Card tone="white" accent={colors.coral} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><div style={{display: "flex", justifyContent: "space-between"}}><Mono size={40}>GOMAXPROCS = 4</Mono><Chip tone="coral" size={30}>P = 4</Chip></div><div style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22, marginTop: 42}}>{[0,1,2,3].map(i => <div key={i} style={{height: 145, borderRadius: 18, background: colors.coralSoft, border: `3px solid ${colors.coral}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 40, fontWeight: 900}}>P{i}</div>)}</div><div style={{marginTop: 38, display: "flex", gap: 14, flexWrap: "wrap"}}>{Array.from({length: 14}, (_, i) => <Chip key={i} tone={i < 4 ? "teal" : "amber"} size={29}>M{i}</Chip>)}</div><div style={{marginTop: 24, opacity: ms}}><Chip tone="amber" size={28}>{t({ja: "4つのP + syscall中の10本のM = 14本のM", en: "4 Ps + 10 more syscall-blocked Ms = 14 Ms"})}</Chip></div></Card></Abs>
      <Abs x={1180} y={220} w={620} h={620}><Card tone="soft" accent={colors.teal} style={{width: "100%", height: "100%", padding: 34, boxSizing: "border-box"}}><div style={{display: "flex", justifyContent: "space-between"}}><Mono size={38}>Go 1.25+</Mono><Chip tone="teal" size={26}>Linux cgroup</Chip></div><div style={{marginTop: 60, height: 170, borderRadius: 20, border: `3px solid ${colors.hairlineStrong}`, background: "#fff", position: "relative", overflow: "hidden"}}><div style={{width: `${100 * container}%`, height: "100%", background: colors.tealSoft}} /><div style={{position: "absolute", left: 28, top: 52, fontFamily: fonts.sans, fontSize: 34, fontWeight: 800}}>{t({ja: "CPU limit → 既定値", en: "CPU limit → default"})}</div></div><div style={{marginTop: 60, opacity: manual}}><Chip tone="muted" size={28}>{t({ja: "手動設定すると自動調整は停止", en: "manual setting disables auto adjustment"})}</Chip></div></Card></Abs>
      <Svg><Packet x1={1490} y1={760} x2={1490} y2={455} start={cues[2] + 18} dur={34} color={colors.teal} r={15} label="quota" /></Svg>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const a = progress(frame, 22, 18);
  return (
    <EndCard slug="go-scheduler-gmp" headline={{ja: "G・M・Pを追えば、Goの並行処理が見えてくる。", en: "Follow G, M, and P to see Go concurrency at work."}}>
      <div style={{opacity: a, transform: `translateY(${(1 - a) * 12}px)`}}>
        <div style={{display: "flex", gap: 18, marginTop: 44, flexWrap: "wrap", justifyContent: "center", maxWidth: 1450}}>
          {["local runq", "work stealing", "handoffp", "netpoller", "preemption"].map((label) => <Chip key={label} tone="coral" size={26}>{label}</Chip>)}
          <Chip tone="teal" size={26}>{t({ja: "記事のインタラクティブデモへ", en: "try the interactive demo in the article"})}</Chip>
        </div>
        <div style={{marginTop: 48, width: 1540, height: 390, borderRadius: 30, border: `2px solid ${colors.hairlineStrong}`, background: colors.surfaceSoft, display: "flex", alignItems: "center", justifyContent: "center", gap: 56}}>
          {[
            {label: "G", sub: {ja: "goroutine", en: "goroutine"}},
            {label: "M", sub: {ja: "OSスレッド", en: "OS thread"}},
            {label: "P", sub: {ja: "実行権", en: "processor"}},
          ].map((item, i) => (
            <div key={item.label} style={{width: 380, height: 260, borderRadius: 24, background: i === 1 ? colors.dark : "#fff", border: `4px solid ${i === 0 ? colors.coral : i === 1 ? colors.darkElevated : colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 22}}>
              <div style={{fontFamily: fonts.serif, fontSize: 92, fontWeight: 700, color: i === 1 ? colors.onDark : colors.ink}}>{item.label}</div>
              <div style={{fontFamily: fonts.mono, fontSize: 30, fontWeight: 800, color: i === 1 ? colors.onDarkSoft : colors.muted}}>{t(item.sub)}</div>
            </div>
          ))}
        </div>
      </div>
    </EndCard>
  );
}
