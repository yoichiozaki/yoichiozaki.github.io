import { useCurrentFrame, useVideoConfig } from "remotion";
import type { ReactNode } from "react";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Tone = "coral" | "teal" | "amber" | "muted" | "error" | "ink";

const T = {
  user: { ja: "ユーザ空間", en: "User space" },
  kernel: { ja: "カーネル", en: "Kernel" },
  app: { ja: "アプリ", en: "App" },
  ready: { ja: "準備完了", en: "ready" },
  syscall: { ja: "syscall", en: "syscall" },
  request: { ja: "依頼票", en: "request slip" },
  completion: { ja: "完了票", en: "completion slip" },
} satisfies Record<string, Bilingual>;

function label(text: Bilingual, tone: Tone = "muted", size = 26) {
  return <Chip tone={tone} size={size}>{useT()(text)}</Chip>;
}

function Panel({
  x,
  y,
  w,
  h,
  title,
  tone = "white",
  accent,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title?: Bilingual | string;
  tone?: "white" | "soft" | "card" | "dark";
  accent?: string;
  children?: ReactNode;
}) {
  const t = useT();
  return (
    <>
      <Abs x={x} y={y} w={w} h={h}>
        <Card tone={tone} accent={accent} style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box", overflow: "hidden" }}>
          {title && (
            <div style={{ fontFamily: fonts.sans, fontSize: 29, fontWeight: 700, color: tone === "dark" ? colors.onDark : colors.ink, marginBottom: 18 }}>
              {typeof title === "string" ? title : t(title)}
            </div>
          )}
        </Card>
      </Abs>
      {children}
    </>
  );
}

function BigBox({
  x,
  y,
  w,
  h,
  children,
  tone = "muted",
  active = 0,
  mono = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
  tone?: Tone;
  active?: number;
  mono?: boolean;
}) {
  const base = {
    coral: [colors.coralSoft, colors.coral],
    teal: [colors.tealSoft, colors.teal],
    amber: [colors.amberSoft, colors.amber],
    muted: ["#fff", colors.hairlineStrong],
    error: [colors.errorSoft, colors.error],
    ink: [colors.dark, colors.darkElevated],
  }[tone];
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          border: `4px solid ${mixColor(base[1], colors.coral, active)}`,
          background: mixColor(base[0], colors.coralSoft, active * 0.25),
          color: tone === "ink" ? colors.onDark : colors.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: mono ? fonts.mono : fonts.sans,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.25,
          boxSizing: "border-box",
          padding: 14,
        }}
      >
        {children}
      </div>
    </Abs>
  );
}

function MiniFd({ x, y, n, active, tone = "muted" }: { x: number; y: number; n: string; active?: number; tone?: Tone }) {
  return (
    <BigBox x={x} y={y} w={140} h={86} tone={tone} active={active ?? 0} mono>
      {n}
    </BigBox>
  );
}

function Ring({
  x,
  y,
  label,
  items,
  fill,
  tone = "coral",
}: {
  x: number;
  y: number;
  label: Bilingual | string;
  items: string[];
  fill: number;
  tone?: "coral" | "teal";
}) {
  const t = useT();
  const c = tone === "coral" ? colors.coral : colors.teal;
  return (
    <Abs x={x} y={y} w={560} h={230}>
      <div style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 700, marginBottom: 14 }}>
        {typeof label === "string" ? label : t(label)}
      </div>
      <div style={{ position: "relative", width: 520, height: 160, borderRadius: 999, border: `18px solid ${colors.surfaceCream}` }}>
        {items.map((it, i) => {
          const ang = (-130 + i * 45) * (Math.PI / 180);
          const show = progress(fill * 100, i * 16, 12);
          return (
            <div
              key={it}
              style={{
                position: "absolute",
                left: 238 + Math.cos(ang) * 215 - 44,
                top: 62 + Math.sin(ang) * 58 - 24,
                width: 88,
                height: 48,
                borderRadius: 9,
                background: mixColor("#fff", tone === "coral" ? colors.coralSoft : colors.tealSoft, show),
                border: `3px solid ${c}`,
                opacity: show,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {it}
            </div>
          );
        })}
      </div>
    </Abs>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const nodePop = (i: number) => pop(frame, 16 + i * 8, fps);
  return (
    <TitleCard
      title={{ ja: "io_uring と epoll\nLinux 非同期 I/O の深層", en: "io_uring and epoll\nLinux Async I/O Deep Dive" }}
      subtitle={{ ja: "select/poll から共有リングまで — 受け渡しを減らす進化の物語", en: "From select/poll to shared rings: the story of fewer hand-offs" }}
      art={
        <>
          <Svg>
            <Arrow x1={1330} y1={344} x2={1640} y2={344} p={progress(frame, 46, 24)} color={colors.coral} width={7} />
            <Arrow x1={1640} y1={560} x2={1330} y2={560} p={progress(frame, 62, 24)} color={colors.teal} width={7} />
          </Svg>
          <BigBox x={1190} y={240} w={250} h={210} tone="coral" active={nodePop(0)}>
            <div>
              <div style={{ fontFamily: fonts.mono, fontSize: 30 }}>{t(T.user)}</div>
              <div style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>{progress(frame, 24, 10) > 0 ? "SQE" : ""}</div>
            </div>
          </BigBox>
          <BigBox x={1580} y={240} w={250} h={210} tone="teal" active={nodePop(1)}>
            <div>
              <div style={{ fontFamily: fonts.mono, fontSize: 30 }}>{t(T.kernel)}</div>
              <div style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.muted }}>{progress(frame, 32, 10) > 0 ? "CQE" : ""}</div>
            </div>
          </BigBox>
          <Abs x={1208} y={528} w={602} h={230} style={{ opacity: progress(frame, 54, 20) }}>
            <Card tone="dark" style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box" }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 27, color: colors.onDark }}>select → poll → epoll → io_uring</div>
              <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
                {["copy", "scan", "syscall"].map((s, i) => (
                  <div key={s} style={{ flex: 1, height: 78, borderRadius: 12, background: mixColor(colors.coral, colors.teal, i / 2), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 700 }}>
                    {t(i === 0 ? { ja: "コピー", en: "copy" } : i === 1 ? { ja: "走査", en: "scan" } : { ja: "syscall", en: "syscall" })} ↓
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

export function BlockingScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const sleep = progress(frame, cues[0] + 15, 22);
  const stack = progress(frame, cues[1] + 10, 24);
  const sw = progress(frame, cues[2] + 8, 24);
  return (
    <SceneShell kicker={{ ja: "出発点", en: "Starting point" }} title={{ ja: "1接続 = 1スレッドは、すぐ限界に来る", en: "One thread per connection hits a wall" }}>
      <Panel x={120} y={235} w={760} h={570} title={{ ja: "ブロッキング I/O", en: "Blocking I/O" }}>
        <BigBox x={190} y={380} w={260} h={150} tone="coral" active={sleep}>{t({ ja: "スレッド", en: "Thread" })}</BigBox>
        <BigBox x={560} y={380} w={230} h={150} tone="amber" active={sleep}>{t({ ja: "眠る", en: "sleep" })}</BigBox>
        <Svg>
          <Arrow x1={452} y1={455} x2={560} y2={455} p={sleep} color={colors.coral} width={6} />
          <Packet x1={220} y1={315} x2={690} y2={315} start={cues[0] + 22} dur={40} color={colors.coral} label="read()" />
        </Svg>
        <Abs x={185} y={625} w={610} style={{ display: "flex", justifyContent: "center", opacity: sleep }}>
          <Chip tone="amber" size={26}>{t({ ja: "データ到着まで停止", en: "blocked until data arrives" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={960} y={235} w={840} h={570} title={{ ja: "コストが積み上がる", en: "Costs pile up" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <Abs key={i} x={1035 + (i % 6) * 108} y={350 + Math.floor(i / 6) * 108} w={86} h={82} style={{ opacity: stack }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 12, border: `3px solid ${colors.coral}`, background: colors.coralSoft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 22, fontWeight: 700 }}>8 MB</div>
          </Abs>
        ))}
        <Abs x={1000} y={590} w={760} style={{ display: "flex", gap: 18, alignItems: "center", opacity: stack }}>
          <span style={{ fontFamily: fonts.serif, fontSize: 66, color: colors.coralDeep, fontWeight: 700 }}>10k → 80 GB</span>
        </Abs>
        <Abs x={1010} y={704} w={740} style={{ opacity: sw, display: "flex", gap: 16, alignItems: "center" }}>
          <Chip tone="error" size={28}>{t({ ja: "1〜3 µs / switch", en: "1–3 µs / switch" })}</Chip>
          <span style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.muted }}>{t({ ja: "毎秒数十万回 → CPUが溶ける", en: "hundreds of thousands/sec → CPU evaporates" })}</span>
        </Abs>
      </Panel>
      <Abs x={120} y={828} w={1680} style={{ textAlign: "center" }}>
        <Appear at={cues[2] + 24}>{label({ ja: "解決策：1スレッドで多数のI/Oを多重化する", en: "Answer: multiplex many I/O operations on one thread" }, "teal", 30)}</Appear>
      </Abs>
    </SceneShell>
  );
}

export function ModelsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const r = progress(frame, cues[1] + 8, 24);
  const c = progress(frame, cues[2] + 8, 24);
  return (
    <SceneShell kicker={{ ja: "モデル", en: "Models" }} title={{ ja: "準備済み通知と完了通知", en: "Readiness vs. completion" }}>
      <Abs x={120} y={828} w={1680} style={{ textAlign: "center" }}>
        <Appear at={cues[0] + 4}>{label({ ja: "カーネルが提供する代表的なモデルは2つ", en: "The kernel offers two major models" }, "ink", 30)}</Appear>
      </Abs>
      <Panel x={120} y={245} w={800} h={520} title={{ ja: "準備済み通知: Reactor", en: "Readiness: reactor" }} accent={colors.coral}>
        <BigBox x={220} y={420} w={190} h={120} tone="coral" active={r}>{t({ ja: "fd", en: "fd" })}</BigBox>
        <BigBox x={515} y={350} w={270} h={110} tone="amber" active={r}>{t(T.ready)}</BigBox>
        <BigBox x={515} y={565} w={270} h={110} tone="muted" active={r}>{t({ ja: "read/write", en: "read/write" })}</BigBox>
        <Svg>
          <Arrow x1={410} y1={480} x2={515} y2={405} p={r} color={colors.coral} width={6} />
          <Arrow x1={650} y1={460} x2={650} y2={565} p={progress(frame, cues[1] + 42, 18)} color={colors.amber} width={6} />
        </Svg>
        <Abs x={180} y={690} w={680} style={{ textAlign: "center" }}>
          <Chip tone="coral" size={25}>{t({ ja: "通知を受けてから、ユーザがI/Oを実行", en: "User performs I/O after readiness notification" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={1000} y={245} w={800} h={520} title={{ ja: "完了通知: Proactor", en: "Completion: proactor" }} accent={colors.teal}>
        <BigBox x={1085} y={382} w={230} h={120} tone="coral" active={c}>{t(T.request)}</BigBox>
        <BigBox x={1460} y={382} w={230} h={120} tone="teal" active={c}>{t(T.completion)}</BigBox>
        <Svg>
          <Packet x1={1320} y1={442} x2={1460} y2={442} start={cues[2] + 20} dur={24} color={colors.teal} label="done" />
          <Arrow x1={1315} y1={442} x2={1460} y2={442} p={c} color={colors.teal} width={6} />
        </Svg>
        <Abs x={1060} y={690} w={680} style={{ textAlign: "center" }}>
          <Chip tone="teal" size={25}>{t({ ja: "カーネルに依頼し、完了だけを受け取る", en: "Submit work, receive completions" })}</Chip>
        </Abs>
      </Panel>
    </SceneShell>
  );
}

export function SelectPollScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const bitmap = progress(frame, cues[0] + 8, 22);
  const scan = progress(frame, cues[1] + 8, 90, (x) => x);
  const poll = progress(frame, cues[2] + 10, 24);
  const fdCount = 24;
  return (
    <SceneShell kicker={{ ja: "select / poll", en: "select / poll" }} title={{ ja: "毎回コピーして、毎回全走査", en: "Copy every time, scan every time" }}>
      <Panel x={120} y={250} w={760} h={560} title="select(2)" accent={colors.coral}>
        <Abs x={175} y={365} w={640} style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12, opacity: bitmap }}>
          {Array.from({ length: 24 }, (_, i) => {
            const active = Math.abs(i / fdCount - scan) < 0.035 ? 1 : 0;
            return (
              <div key={i} style={{ height: 58, borderRadius: 8, background: active ? colors.coral : i < 8 ? colors.coralSoft : "#fff", border: `3px solid ${active ? colors.coralDeep : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24 }}>
                {i < 8 ? "1" : "0"}
              </div>
            );
          })}
        </Abs>
        <Abs x={180} y={670} w={620} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: bitmap }}>
          <Chip tone="error" size={26}>FD_SETSIZE = 1024</Chip>
          <Chip tone="coral" size={26}>O(N)</Chip>
        </Abs>
      </Panel>
      <Panel x={1000} y={250} w={800} h={560} title="poll(2)" accent={colors.amber}>
        <Abs x={1050} y={350} w={700} h={300} style={{ opacity: Math.max(progress(frame, cues[0] + 48, 20) * 0.28, poll) }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 230px 230px", height: 34, marginBottom: 9, gap: 12, fontFamily: fonts.mono, fontSize: 24, alignItems: "center" }}>
              <div style={{ color: colors.muted }}>fd {100 + i}</div>
              <div style={{ background: colors.surfaceSoft, borderRadius: 6, padding: "4px 12px" }}>events</div>
              <div style={{ background: i === 5 ? colors.amberSoft : colors.surfaceSoft, borderRadius: 6, padding: "4px 12px", border: i === 5 ? `2px solid ${colors.amber}` : undefined }}>revents</div>
            </div>
          ))}
        </Abs>
        <Abs x={1060} y={710} w={680} style={{ display: "flex", gap: 18, alignItems: "center", opacity: poll }}>
          <Chip tone="teal" size={25}>{t({ ja: "1024制限は消えた", en: "1024 limit removed" })}</Chip>
          <Chip tone="error" size={25}>{t({ ja: "配列コピー + 全走査は残る", en: "array copy + full scan remains" })}</Chip>
        </Abs>
      </Panel>
    </SceneShell>
  );
}

export function EpollScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const created = progress(frame, cues[0] + 8, 18);
  const ctl = progress(frame, cues[1] + 8, 22);
  const fire = progress(frame, cues[2] + 10, 24);
  const drain = progress(frame, cues[3] + 8, 28);
  const nodes = [
    { n: "fd 12", x: 515, y: 310, red: false },
    { n: "fd 4", x: 285, y: 510, red: false },
    { n: "fd 20", x: 745, y: 510, red: false },
    { n: "fd 8", x: 430, y: 670, red: true },
    { n: "fd 31", x: 860, y: 670, red: true },
  ];
  const nodeW = 190;
  const nodeH = 112;
  const rbNode = (n: (typeof nodes)[number]) => (
    <Abs key={n.n} x={n.x} y={n.y} w={nodeW} h={nodeH}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 20,
          border: `5px solid ${n.n === "fd 12" ? mixColor(colors.dark, colors.coral, fire) : n.red ? colors.coral : colors.dark}`,
          background: n.red ? colors.coralSoft : colors.dark,
          color: n.red ? colors.ink : colors.onDark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: 34,
          fontWeight: 800,
          boxShadow: n.n === "fd 12" && fire > 0.2 ? `0 0 0 ${Math.round(8 * fire)}px rgba(204,120,92,0.18)` : undefined,
        }}
      >
        {n.n}
      </div>
    </Abs>
  );
  const bottom = (n: (typeof nodes)[number]) => ({ x: n.x + nodeW / 2, y: n.y + nodeH });
  const top = (n: (typeof nodes)[number]) => ({ x: n.x + nodeW / 2, y: n.y });
  const byName = Object.fromEntries(nodes.map((n) => [n.n, n])) as Record<string, (typeof nodes)[number]>;
  const readyFds = ["fd 12", "fd 20", "fd 31"];
  return (
    <SceneShell kicker={{ ja: "epoll", en: "epoll" }} title={{ ja: "カーネルに台帳を置き、鳴ったものだけ返す", en: "Keep the watch set in the kernel" }}>
      <Abs x={1258} y={800} style={{ zIndex: 20 }}>
        <Appear at={cues[3] + 4}>{label({ ja: "準備完了 fd ごとに O(1)", en: "O(1) per ready fd" }, "teal", 27)}</Appear>
      </Abs>
      <Panel x={120} y={220} w={960} h={650} title={{ ja: "赤黒木 rbr（全監視 fd）", en: "red-black tree rbr (all watched fds)" }} accent={colors.coral}>
        <Svg>
          {[
            ["fd 12", "fd 4"],
            ["fd 12", "fd 20"],
            ["fd 4", "fd 8"],
            ["fd 20", "fd 31"],
          ].map(([p, c]) => {
            const a = bottom(byName[p]);
            const b = top(byName[c]);
            return <Arrow key={`${p}-${c}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} p={ctl} color={colors.hairlineStrong} width={5} head={false} />;
          })}
        </Svg>
        {nodes.map(rbNode)}
        <Abs x={172} y={795} style={{ opacity: created }}>
          <Chip tone="coral" size={27}>epoll_ctl(ADD/MOD/DEL)</Chip>
        </Abs>
        <Abs x={700} y={795} style={{ opacity: ctl }}>
          <Chip tone="muted" size={25}>
            <span style={{ color: colors.dark }}>■</span> {t({ ja: "黒ノード", en: "black node" })}{"  "}
            <span style={{ color: colors.coral }}>■</span> {t({ ja: "赤ノード", en: "red node" })}
          </Chip>
        </Abs>
      </Panel>
      <Panel x={1120} y={220} w={680} h={650} title={{ ja: "レディーリスト（rdllist）", en: "ready list rdllist" }} accent={colors.teal}>
        <Abs x={1175} y={350} w={570} style={{ display: "flex", gap: 22 }}>
          {readyFds.map((fd, i) => (
            <div
              key={fd}
              style={{
                opacity: i === 0 ? fire : progress(frame, cues[3] + 10 + i * 12, 10),
                width: 166,
                height: 104,
                borderRadius: 18,
                border: `4px solid ${i === 0 ? colors.coral : colors.teal}`,
                background: i === 0 ? colors.coralSoft : colors.tealSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 34,
                fontWeight: 700,
              }}
            >
              {fd}
            </div>
          ))}
        </Abs>
        <Abs x={1290} y={506} w={320} style={{ opacity: drain, textAlign: "center" }}>
          <Chip tone="teal" size={29}>epoll_wait()</Chip>
        </Abs>
        <Svg>
          <Arrow x1={1450} y1={552} x2={1450} y2={645} p={drain} color={colors.teal} width={8} />
        </Svg>
        <Abs x={1195} y={655} w={570} h={120} style={{ opacity: drain }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 18,
              border: `4px solid ${colors.teal}`,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              fontFamily: fonts.mono,
              fontSize: 30,
              fontWeight: 700,
              paddingLeft: 18,
              boxSizing: "border-box",
            }}
          >
            <span style={{ color: colors.tealDeep }}>events[]</span>
            {readyFds.map((fd) => (
              <span key={fd} style={{ padding: "8px 12px", minWidth: 76, borderRadius: 10, background: colors.tealSoft, whiteSpace: "nowrap" }}>
                {fd}
              </span>
            ))}
          </div>
        </Abs>
      </Panel>
      <Svg>
        <Arrow x1={byName["fd 12"].x + nodeW} y1={byName["fd 12"].y + nodeH / 2} x2={1175} y2={402} p={fire} color={colors.coral} width={8} bend={160} />
      </Svg>
    </SceneShell>
  );
}

export function EpollModesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const lt = progress(frame, cues[0] + 8, 22);
  const et = progress(frame, cues[1] + 8, 22);
  const herd = progress(frame, cues[2] + 8, 22);
  const fix = progress(frame, cues[3] + 8, 22);
  return (
    <SceneShell kicker={{ ja: "モード", en: "Modes" }} title={{ ja: "LT と ET、そして群れ", en: "LT, ET, and the herd" }}>
      <Panel x={120} y={235} w={790} h={455} title={{ ja: "レベルトリガー（既定）", en: "Level trigger (default)" }} accent={colors.teal}>
        <MiniFd x={220} y={395} n="fd" active={lt} tone="teal" />
        {[0, 1, 2].map((i) => (
          <Abs key={i} x={440 + i * 140} y={385} style={{ opacity: progress(frame, cues[0] + 30 + i * 18, 10) }}>
            <Chip tone="teal" size={24}>{t({ ja: "まだready", en: "still ready" })}</Chip>
          </Abs>
        ))}
        <Abs x={180} y={610} w={670} style={{ textAlign: "center", opacity: lt }}>
          <Chip tone="teal" size={25}>{t({ ja: "読める・書ける間、何度も通知", en: "keeps notifying while readable/writable" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={1010} y={235} w={790} h={455} title={{ ja: "エッジトリガー", en: "Edge trigger" }} accent={colors.coral}>
        <MiniFd x={1110} y={395} n="fd" active={et} tone="coral" />
        <Svg>
          <Arrow x1={1260} y1={438} x2={1530} y2={438} p={et} color={colors.coral} width={7} />
        </Svg>
        <Abs x={1540} y={385} style={{ opacity: et }}>
          <Chip tone="coral" size={24}>EAGAIN</Chip>
        </Abs>
        <Abs x={1070} y={610} w={670} style={{ textAlign: "center", opacity: et }}>
          <Chip tone="coral" size={25}>{t({ ja: "状態変化の瞬間だけ。EAGAINまで読み切る", en: "only on transition; drain until EAGAIN" })}</Chip>
        </Abs>
      </Panel>
      {herd > 0.02 && <Abs x={120} y={720} w={1680} h={160} style={{ opacity: herd }}>
        <Card tone="soft" accent={colors.amber} style={{ width: "100%", height: "100%", padding: 24, boxSizing: "border-box", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{ transform: `translateY(${Math.sin((frame + i * 8) / 8) * 5 * herd}px)` }}>
              <Chip tone={i === 3 && fix > 0.5 ? "teal" : "amber"} size={26}>{i === 3 && fix > 0.5 ? t({ ja: "1人だけ", en: "one wakes" }) : t({ ja: "ワーカー", en: "worker" })}</Chip>
            </div>
          ))}
          <div style={{ position: "absolute", left: 720, top: 94, opacity: fix }}>
            <Chip tone="teal" size={25}>SO_REUSEPORT / EPOLLEXCLUSIVE</Chip>
          </div>
        </div>
        </Card>
      </Abs>}
    </SceneShell>
  );
}

export function LimitsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const file = progress(frame, cues[0] + 8, 20);
  const sys = progress(frame, cues[1] + 8, 20);
  const kpti = progress(frame, cues[2] + 8, 28);
  return (
    <SceneShell kicker={{ ja: "限界", en: "Limits" }} title={{ ja: "epollでも、まだ削れないもの", en: "What epoll still cannot remove" }}>
      <Panel x={120} y={245} w={520} h={580} title={{ ja: "通常ファイル", en: "Regular files" }} accent={colors.error}>
        <BigBox x={210} y={410} w={340} h={140} tone="error" active={file}>{t({ ja: "常に読み取り可能", en: "always readable" })}</BigBox>
        <Abs x={165} y={630} w={430} style={{ textAlign: "center", opacity: file }}>
          <Chip tone="error" size={25}>{t({ ja: "ディスクI/Oはブロックし得る", en: "disk I/O may block" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={700} y={245} w={520} h={580} title={{ ja: "2 syscalls / I/O", en: "2 syscalls / I/O" }} accent={colors.amber}>
        <Svg>
          <Arrow x1={845} y1={415} x2={1080} y2={415} p={sys} color={colors.amber} width={7} />
          <Arrow x1={1080} y1={565} x2={845} y2={565} p={progress(frame, cues[1] + 38, 18)} color={colors.coral} width={7} />
        </Svg>
        <BigBox x={760} y={360} w={150} h={110} tone="amber" active={sys}>{t({ ja: "待機", en: "wait" })}</BigBox>
        <BigBox x={980} y={510} w={170} h={110} tone="coral" active={sys}>read()</BigBox>
        <Abs x={744} y={700} style={{ opacity: sys }}>
          <Chip tone="amber" size={25}>{t({ ja: "通知 + 実I/O", en: "notify + actual I/O" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={1280} y={245} w={520} h={580} title={{ ja: "KPTI後のコスト", en: "KPTI cost" }} accent={colors.coral}>
        <Abs x={1335} y={410} w={410}>
          <div style={{ height: 58, borderRadius: 999, background: colors.surfaceSoft, overflow: "hidden", border: `2px solid ${colors.hairlineStrong}` }}>
            <div style={{ width: `${28 + 68 * kpti}%`, height: "100%", background: colors.coral }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: fonts.mono, fontSize: 28, color: colors.body }}>
            <span>{t({ ja: "数百ns", en: "few 100 ns" })}</span>
            <span>~1 µs</span>
          </div>
        </Abs>
        <Abs x={1335} y={565} w={410} style={{ opacity: kpti }}>
          <Chip tone="coral" size={25}>{t({ ja: "KPTIで悪化し得る", en: "KPTI can add cost" })}</Chip>
        </Abs>
      </Panel>
    </SceneShell>
  );
}

export function AioGapScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const aio = progress(frame, cues[0] + 8, 22);
  const gaps = progress(frame, cues[1] + 8, 22);
  return (
    <SceneShell kicker={{ ja: "前史", en: "Before io_uring" }} title={{ ja: "既存AIOは、汎用解ではなかった", en: "Existing AIO was not general enough" }}>
      <Panel x={120} y={250} w={740} h={560} title={{ ja: "POSIX AIO / Kernel AIO", en: "POSIX AIO / Kernel AIO" }} accent={colors.amber}>
        <BigBox x={200} y={390} w={220} h={150} tone="amber" active={aio}>POSIX<br />AIO</BigBox>
        <BigBox x={510} y={390} w={250} h={150} tone="amber" active={aio}>Kernel<br />AIO</BigBox>
        <Abs x={180} y={650} w={630} style={{ textAlign: "center", opacity: aio }}>
          <Chip tone="amber" size={27}>{t({ ja: "普及には届かなかった", en: "never became the general answer" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={960} y={250} w={840} h={560} title={{ ja: "Kernel AIOの隙間", en: "Kernel AIO gaps" }} accent={colors.error}>
        {[
          { top: 354, text: { ja: "O_DIRECT前提", en: "assumed O_DIRECT" } },
          { top: 500, text: { ja: "バッファ付きI/O → 実質同期", en: "buffered I/O → sync in practice" } },
          { top: 646, text: { ja: "open / stat は対象外", en: "open / stat not supported" } },
        ].map((row, i) => (
          <Abs key={i} x={1040} y={row.top} w={680} h={105} style={{ opacity: progress(frame, cues[1] + 8 + i * 18, 16) }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 16, background: i === 0 ? colors.amberSoft : colors.errorSoft, border: `3px solid ${i === 0 ? colors.amber : colors.error}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.sans, fontSize: 30, fontWeight: 700 }}>
              {t(row.text)}
            </div>
          </Abs>
        ))}
      </Panel>
      <Abs x={120} y={835} w={1680} style={{ textAlign: "center", opacity: gaps }}>
        <Chip tone="teal" size={29}>{t({ ja: "そこで、汎用的な completion モデルへ", en: "So Linux needed a general completion model" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function UringRingsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const ring = progress(frame, cues[0] + 8, 22);
  const sqe = progress(frame, cues[1] + 8, 44, (x) => x);
  const cqe = progress(frame, cues[1] + 52, 44, (x) => x);
  const mmap = progress(frame, cues[2] + 8, 26);
  return (
    <SceneShell kicker={{ ja: "io_uring", en: "io_uring" }} title={{ ja: "2つの共有リングで依頼と完了を渡す", en: "Two shared rings: requests and completions" }}>
      <Panel x={120} y={230} w={760} h={610} title={{ ja: "提出キュー SQ：アプリ → カーネル", en: "Submission queue: app → kernel" }} accent={colors.coral}>
        <Ring x={195} y={350} label="SQ" items={["SQE", "read", "fsync", "recv"]} fill={sqe} tone="coral" />
        <Abs x={240} y={650} style={{ opacity: sqe }}>
          <Chip tone="coral" size={26}>{t({ ja: "依頼票 SQE を書く", en: "write request slips, SQEs" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={1040} y={230} w={760} h={610} title={{ ja: "完了キュー CQ：カーネル → アプリ", en: "Completion queue: kernel → app" }} accent={colors.teal}>
        <Ring x={1115} y={350} label="CQ" items={["CQE", "res", "id", "done"]} fill={cqe} tone="teal" />
        <Abs x={1165} y={650} style={{ opacity: cqe }}>
          <Chip tone="teal" size={26}>{t({ ja: "完了票 CQE を返す", en: "return completion slips, CQEs" })}</Chip>
        </Abs>
      </Panel>
      <Svg>
        <Arrow x1={860} y1={480} x2={1040} y2={480} p={ring} color={colors.hairlineStrong} width={6} dashed />
        <Arrow x1={1040} y1={600} x2={860} y2={600} p={ring} color={colors.hairlineStrong} width={6} dashed />
      </Svg>
      <Abs x={720} y={864} w={480} style={{ textAlign: "center", opacity: mmap }}>
        <Chip tone="ink" size={29}>mmap · {t({ ja: "共有メモリ", en: "shared memory" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

export function UringBatchScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const batch = progress(frame, cues[0] + 8, 40, (x) => x);
  const submit = progress(frame, cues[0] + 54, 26);
  const sqpoll = progress(frame, cues[1] + 10, 28);
  return (
    <SceneShell kicker={{ ja: "バッチング", en: "Batching" }} title={{ ja: "1回のベルで、まとめて渡す", en: "One bell for a whole batch" }}>
      <Panel x={120} y={235} w={820} h={600} title={{ ja: "通常モード", en: "Normal mode" }} accent={colors.coral}>
        <Abs x={180} y={380} w={700} style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} style={{ height: 34, borderRadius: 6, background: i / 50 < batch ? colors.coralSoft : "#fff", border: `2px solid ${i / 50 < batch ? colors.coral : colors.hairlineStrong}` }} />
          ))}
        </Abs>
        <Abs x={210} y={620} style={{ opacity: batch }}>
          <span style={{ fontFamily: fonts.serif, fontSize: 62, fontWeight: 700, color: colors.coralDeep }}>1000</span>
          <span style={{ fontFamily: fonts.sans, fontSize: 30, marginLeft: 16 }}>{t({ ja: "read をまとめる", en: "reads batched" })}</span>
        </Abs>
        <Abs x={500} y={705} style={{ opacity: submit }}>
          <Chip tone="coral" size={30}>io_uring_enter × 1</Chip>
        </Abs>
      </Panel>
      <Panel x={1020} y={235} w={780} h={600} title="SQPOLL" accent={colors.teal}>
        <BigBox x={1130} y={380} w={240} h={150} tone="teal" active={sqpoll}>{t({ ja: "専用スレッド", en: "kernel poller" })}</BigBox>
        <BigBox x={1480} y={380} w={210} h={150} tone="coral" active={sqpoll}>SQ</BigBox>
        <Svg>
          <Arrow x1={1370} y1={455} x2={1480} y2={455} p={sqpoll} color={colors.teal} width={7} />
          <Packet x1={1490} y1={610} x2={1640} y2={610} start={cues[1] + 24} dur={30} color={colors.coral} label="SQE" />
        </Svg>
        <Abs x={1075} y={650} w={670} style={{ textAlign: "center", opacity: sqpoll }}>
          <Chip tone="teal" size={28}>{t({ ja: "リング稼働中は submit syscall 不要", en: "while the ring stays busy, no submit syscall" })}</Chip>
        </Abs>
      </Panel>
    </SceneShell>
  );
}

export function UringKernelScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const inline = progress(frame, cues[0] + 8, 26);
  const block = progress(frame, cues[1] + 8, 26);
  const done = progress(frame, cues[2] + 8, 28);
  return (
    <SceneShell kicker={{ ja: "カーネル内部", en: "Inside the kernel" }} title={{ ja: "すぐ終わるものはインライン、本当にブロックするものは io-wqへ", en: "Inline the easy work; offload truly blocking work" }}>
      <Panel x={120} y={245} w={1680} h={595} title={{ ja: "SQE → io_kiocb → 実行 → CQE", en: "SQE → io_kiocb → execution → CQE" }} accent={colors.teal}>
        <BigBox x={210} y={430} w={220} h={130} tone="coral" active={1}>SQE</BigBox>
        <BigBox x={555} y={430} w={260} h={130} tone="amber" active={inline}>io_kiocb</BigBox>
        <BigBox x={945} y={332} w={300} h={120} tone="teal" active={inline}>{t({ ja: "インライン実行", en: "inline execution" })}</BigBox>
        <BigBox x={945} y={568} w={300} h={120} tone="amber" active={block}>io-wq</BigBox>
        <BigBox x={1430} y={430} w={230} h={130} tone="teal" active={done}>CQE</BigBox>
        <Svg>
          <Arrow x1={430} y1={495} x2={555} y2={495} p={inline} color={colors.coral} width={7} />
          <Arrow x1={815} y1={495} x2={945} y2={392} p={inline} color={colors.teal} width={7} />
          <Arrow x1={815} y1={520} x2={945} y2={628} p={block} color={colors.amber} width={7} />
          <Arrow x1={1245} y1={392} x2={1430} y2={485} p={done} color={colors.teal} width={7} />
          <Arrow x1={1245} y1={628} x2={1430} y2={530} p={done} color={colors.teal} width={7} dashed />
        </Svg>
        <Abs x={940} y={705} w={310} style={{ textAlign: "center", opacity: block }}>
          <Chip tone="amber" size={24}>{t({ ja: "ページキャッシュミスなど", en: "page-cache miss, etc." })}</Chip>
        </Abs>
        <Abs x={1415} y={600} w={280} style={{ opacity: done }}>
          <Chip tone="teal" size={24}>user_data</Chip>
        </Abs>
      </Panel>
      <Abs x={120} y={830} w={1680} style={{ textAlign: "center" }}>
        <Appear at={cues[1] + 20}>{label({ ja: "本当にブロックする処理だけを io-wq に逃がす", en: "Only truly blocking work goes to io-wq" }, "ink", 28)}</Appear>
      </Abs>
    </SceneShell>
  );
}

export function TradeoffsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const vuln = progress(frame, cues[0] + 8, 22);
  const policy = progress(frame, cues[1] + 8, 22);
  const perf = progress(frame, cues[2] + 8, 30);
  return (
    <SceneShell kicker={{ ja: "運用判断", en: "Operations" }} title={{ ja: "速さだけで選ばない", en: "Do not choose it for speed alone" }}>
      <Panel x={120} y={250} w={500} h={560} title={{ ja: "複雑なAPI", en: "Complex API" }} accent={colors.error}>
        <BigBox x={245} y={405} w={250} h={150} tone="error" active={vuln}>{t({ ja: "権限昇格", en: "privilege escalation" })}</BigBox>
        <Abs x={165} y={640} w={410} style={{ textAlign: "center", opacity: vuln }}>
          <Chip tone="error" size={25}>{t({ ja: "過去に多数の脆弱性", en: "many past vulnerabilities" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={710} y={250} w={500} h={560} title={{ ja: "環境ポリシー", en: "Platform policy" }} accent={colors.amber}>
        <Abs x={760} y={396} style={{ opacity: policy }}>
          <Chip tone="amber" size={30}>Android</Chip>
        </Abs>
        <Abs x={930} y={520} style={{ opacity: policy }}>
          <Chip tone="amber" size={30}>ChromeOS</Chip>
        </Abs>
        <Abs x={758} y={675} w={400} style={{ textAlign: "center", opacity: policy }}>
          <Chip tone="amber" size={25}>{t({ ja: "既定で制限されることも", en: "may be restricted by default" })}</Chip>
        </Abs>
      </Panel>
      <Panel x={1300} y={250} w={500} h={560} title={{ ja: "効く場面", en: "Where it pays" }} accent={colors.teal}>
        <Abs x={1355} y={395} w={390}>
          <div style={{ height: 64, background: colors.surfaceSoft, borderRadius: 999, overflow: "hidden", border: `2px solid ${colors.hairlineStrong}` }}>
            <div style={{ width: `${18 + 78 * perf}%`, height: "100%", background: colors.teal }} />
          </div>
        </Abs>
        <Abs x={1355} y={505} w={390} style={{ display: "grid", gap: 14, opacity: perf }}>
          <Chip tone="teal" size={24}>NVMe</Chip>
          <Chip tone="teal" size={24}>1M IOPS</Chip>
          <Chip tone="teal" size={24}>fsync-heavy I/O</Chip>
        </Abs>
      </Panel>
      <Abs x={120} y={850} w={1680} style={{ textAlign: "center", opacity: perf }}>
        <span style={{ fontFamily: fonts.sans, fontSize: 28, color: colors.muted }}>{t({ ja: "低負荷では epoll と大差なし。高 IOPS・低レイテンシで投資が報われる。", en: "At light load it is close to epoll; high IOPS and low latency are where it pays." })}</span>
      </Abs>
    </SceneShell>
  );
}

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const a = progress(frame, 24, 18);
  return (
    <EndCard slug="io-uring-and-epoll" headline={{ ja: "非同期I/Oの歴史は、受け渡しを減らす歴史。", en: "Async I/O evolves by removing hand-offs." }}>
      <div style={{ display: "flex", gap: 18, marginTop: 44, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
        <Chip tone="coral" size={28}>{t({ ja: "epoll：カーネル内のready list", en: "epoll: ready list in the kernel" })}</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "io_uring：共有リングと完了通知", en: "io_uring: shared rings and completions" })}</Chip>
      </div>
    </EndCard>
  );
}
