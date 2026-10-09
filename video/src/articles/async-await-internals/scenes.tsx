import { useCurrentFrame } from "remotion";
import { progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

function Text({ children, size = 28, color = colors.body, weight = 600, mono = false, style = {} }: { children: React.ReactNode; size?: number; color?: string; weight?: number; mono?: boolean; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: size, color, fontWeight: weight, lineHeight: 1.35, ...style }}>{children}</div>;
}

function MiniCard({ x, y, w, h, title, body, tone = "white", active = false, chip }: { x: number; y: number; w: number; h: number; title: string; body?: string; tone?: "white" | "card" | "soft" | "dark"; active?: boolean; chip?: string }) {
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <Card tone={tone} accent={active ? colors.coral : undefined} style={{ width: "100%", height: "100%", padding: 26, boxShadow: active ? "0 18px 38px rgba(204,120,92,0.16)" : undefined }}>
        {chip && <Chip tone={active ? "coral" : "muted"} size={24} style={{ marginBottom: 14 }}>{chip}</Chip>}
        <Text size={32} color={tone === "dark" ? colors.onDark : colors.ink} weight={800}>{title}</Text>
        {body && <Text size={24} color={tone === "dark" ? colors.onDarkSoft : colors.muted} weight={500} style={{ marginTop: 14 }}>{body}</Text>}
      </Card>
    </Abs>
  );
}

function QueueBox({ x, y, title, items, hot = -1, w = 330 }: { x: number; y: number; title: string; items: string[]; hot?: number; w?: number }) {
  return (
    <Abs x={x} y={y} w={w} h={250}>
      <Card tone="white" style={{ padding: 22, height: "100%" }}>
        <Text size={24} color={colors.muted} weight={700}>{title}</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
          {items.map((it, i) => (
            <div key={it} style={{ padding: "15px 18px", borderRadius: 14, background: i === hot ? colors.coralSoft : colors.surfaceSoft, border: `2px solid ${i === hot ? colors.coral : colors.hairline}`, fontFamily: fonts.mono, fontSize: 22, fontWeight: 700, color: i === hot ? colors.coralDeep : colors.body }}>
              {it}
            </div>
          ))}
        </div>
      </Card>
    </Abs>
  );
}

function TimelineDots({ x, y, labels, active }: { x: number; y: number; labels: string[]; active: number }) {
  return (
    <Abs x={x} y={y} w={1280} h={96}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ width: 58, height: 58, borderRadius: 999, background: i <= active ? colors.coral : colors.surfaceCard, border: `3px solid ${i === active ? colors.coralDeep : colors.hairlineStrong}`, color: i <= active ? "#fff" : colors.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 800 }}>{l}</div>
            {i < labels.length - 1 && <div style={{ width: 210, height: 5, borderRadius: 4, background: i < active ? colors.coral : colors.hairlineStrong }} />}
          </div>
        ))}
      </div>
    </Abs>
  );
}

/* 0. Intro */
export function IntroScene() {
  const frame = useCurrentFrame();  const t = useT();
  const p = progress(frame, 18, 26);
  const q = progress(frame, 48, 28);
  const r = progress(frame, 78, 28);
  const labels = [
    t({ ja: "イベント\nループ", en: "Event\nloop" }),
    t({ ja: "コルーチン", en: "Coroutines" }),
    t({ ja: "Future\npoll", en: "Future\npoll" }),
  ];
  return (
    <TitleCard
      title={{ ja: "async/await\nの裏側", en: "Inside\nasync/await" }}
      subtitle={{ ja: "イベントループ、コルーチン、Futureをアニメーションで追う", en: "Event loops, coroutines, and Futures, animated" }}
      art={
        <>
          <Svg>
            <Arrow x1={1470} y1={390} x2={1320} y2={575} p={p} color={colors.coral} width={5} />
            <Arrow x1={1470} y1={390} x2={1515} y2={575} p={q} color={colors.amber} width={5} bend={-40} />
            <Arrow x1={1470} y1={390} x2={1710} y2={575} p={r} color={colors.teal} width={5} />
          </Svg>
          <Abs x={1288} y={270} w={360} h={150} style={{ transform: `scale(${0.9 + 0.1 * progress(frame, 10, 20)})`, opacity: progress(frame, 10, 20) }}>
            <Card tone="dark" style={{ height: "100%", padding: 28, textAlign: "center" }}>
              <Text size={44} mono color={colors.onDark} weight={800}>async</Text>
              <Text size={34} mono color={colors.coral} weight={800}>await</Text>
            </Card>
          </Abs>
          {labels.map((label, i) => {
            const x = [1205, 1395, 1600][i];
            const a = progress(frame, 34 + i * 18, 20);
            return (
              <Abs key={label} x={x} y={575} w={185} h={150} style={{ opacity: a, transform: `translateY(${(1 - a) * 24}px)` }}>
                <Card tone="white" accent={[colors.coral, colors.amber, colors.teal][i]} style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                  <Text size={26} color={colors.ink} weight={800}>{label}</Text>
                </Card>
              </Abs>
            );
          })}
          <Abs x={1190} y={780} w={600} h={42} style={{ opacity: progress(frame, 82, 24) }}>
            <Text size={24} color={colors.muted} weight={700} style={{ textAlign: "center", letterSpacing: 2 }}>{t({ ja: "同じ構文、違うランタイム", en: "Same syntax, different runtimes" })}</Text>
          </Abs>
        </>
      }
    />
  );
}

/* 1. Taxonomy */
export function TaxonomyScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const active = frame >= cues[3] ? 3 : frame >= cues[2] ? 2 : frame >= cues[1] ? 1 : 0;
  const cards = [
    { title: t({ ja: "同期", en: "Synchronous" }), body: t({ ja: "終わるまで待つ", en: "Waits until done" }), chip: t({ ja: "待つ", en: "wait" }) },
    { title: t({ ja: "非同期", en: "Asynchronous" }), body: t({ ja: "開始して先に進む", en: "Starts, then moves on" }), chip: t({ ja: "通知", en: "notify" }) },
    { title: t({ ja: "並行", en: "Concurrent" }), body: t({ ja: "期間が重なる", en: "Overlapping periods" }), chip: t({ ja: "1コアOK", en: "single core OK" }) },
    { title: t({ ja: "並列", en: "Parallel" }), body: t({ ja: "物理的に同時", en: "Physically simultaneous" }), chip: t({ ja: "マルチコア", en: "multi-core" }) },
  ];
  return (
    <SceneShell kicker={{ ja: "前提", en: "Prerequisites" }} title={{ ja: "並行と並列を分ける", en: "Concurrency is not parallelism" }}>
      <TimelineDots x={335} y={220} labels={["1", "2", "3", "4"]} active={active} />
      {cards.map((c, i) => (
        <Appear key={c.title} at={cues[Math.min(i, cues.length - 1)] - 12}>
          <MiniCard x={150 + (i % 2) * 835} y={330 + Math.floor(i / 2) * 255} w={760} h={210} {...c} active={active === i} />
        </Appear>
      ))}
      <Abs x={520} y={820} w={880} h={58}>
        <Chip tone="coral" size={28}>{t({ ja: "async/await → 主に並行性", en: "async/await → mainly concurrency" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* 2. JavaScript loop */
export function JsLoopScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "JavaScript", en: "JavaScript" }} title={{ ja: "イベントループの部品", en: "The event-loop parts" }}>
      <MiniCard x={130} y={280} w={420} h={430} title={t({ ja: "コールスタック", en: "Call stack" })} body={t({ ja: "今のJavaScriptを実行", en: "Runs current JavaScript" })} active={frame >= cues[0] && frame < cues[1]} />
      <MiniCard x={725} y={280} w={470} h={430} title={t({ ja: "Web / Node API", en: "Web / Node APIs" })} body={t({ ja: "タイマー・ネットワーク・ファイルI/O", en: "Timers, network, file I/O" })} active={frame >= cues[1] && frame < cues[2]} />
      <Abs x={188} y={470} w={305} h={180}>
        {["fetchData()", "main()", "script"].map((label, i) => (
          <div key={label} style={{ marginTop: i === 0 ? 0 : 10, padding: "12px 16px", borderRadius: 12, background: i === 0 ? colors.coralSoft : "#fff", border: `2px solid ${i === 0 ? colors.coral : colors.hairlineStrong}`, fontFamily: fonts.mono, fontSize: 22, fontWeight: 800, color: colors.ink }}>
            {label}
          </div>
        ))}
      </Abs>
      <Abs x={790} y={470} w={340} h={155}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[t({ ja: "タイマー", en: "timer" }), t({ ja: "ネットワーク", en: "network" }), t({ ja: "ファイルI/O", en: "file I/O" }), t({ ja: "UI", en: "UI" })].map((label) => (
            <div key={label} style={{ padding: "18px 10px", borderRadius: 14, background: colors.surfaceSoft, border: `2px solid ${colors.hairline}`, textAlign: "center", fontFamily: fonts.sans, fontSize: 22, fontWeight: 800, color: colors.body }}>
              {label}
            </div>
          ))}
        </div>
      </Abs>
      <QueueBox x={1370} y={252} w={380} title={t({ ja: "マイクロタスク", en: "Microtasks" })} items={["Promise.then", "queueMicrotask"]} hot={frame >= cues[2] ? 0 : -1} />
      <QueueBox x={1370} y={552} w={380} title={t({ ja: "タスクキュー", en: "Task queue" })} items={["setTimeout", "I/O callback"]} hot={frame >= cues[2] ? 0 : -1} />
      <Svg>
        <Arrow x1={550} y1={495} x2={725} y2={495} p={progress(frame, cues[1], 20)} color={colors.coral} width={5} />
        <Arrow x1={1195} y1={430} x2={1370} y2={360} p={progress(frame, cues[2], 18)} color={colors.teal} width={5} />
        <Arrow x1={1195} y1={570} x2={1370} y2={665} p={progress(frame, cues[2] + 8, 18)} color={colors.amber} width={5} />
        <Packet x1={560} y1={495} x2={710} y2={495} start={cues[1] + 4} color={colors.coral} label="I/O" />
        <Packet x1={1200} y1={430} x2={1360} y2={360} start={cues[2] + 4} color={colors.teal} label="then" />
        <Packet x1={1200} y1={570} x2={1360} y2={665} start={cues[2] + 14} color={colors.amber} label="timer" />
      </Svg>
    </SceneShell>
  );
}

/* 3. Ordering */
export function JsOrderScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const showMicro = frame >= cues[1];
  const showTimer = frame >= cues[2];
  return (
    <SceneShell kicker={{ ja: "実行順序", en: "Execution order" }} title={{ ja: "1, 2, 3, 4になる理由", en: "Why the order is 1, 2, 3, 4" }}>
      <Abs x={130} y={250} w={560} h={565}>
        <Card tone="dark" style={{ padding: 26, height: "100%" }}>
          {["console.log('1')", "setTimeout(...'4')", "Promise.then(...'3')", "console.log('2')"].map((line, i) => (
            <div key={line} style={{ fontFamily: fonts.mono, fontSize: 25, color: i === 2 && showMicro ? colors.teal : i === 1 && showTimer ? colors.amber : colors.onDark, padding: "18px 16px", borderRadius: 12, background: frame >= cues[Math.min(i, 2)] ? colors.darkElevated : "transparent", marginBottom: 12 }}>{line}</div>
          ))}
        </Card>
      </Abs>
      <QueueBox x={790} y={280} title={t({ ja: "マイクロタスク", en: "Microtask" })} items={showMicro ? ["Promise → 3"] : []} hot={0} w={360} />
      <QueueBox x={790} y={580} title={t({ ja: "タスク", en: "Task" })} items={showTimer ? ["setTimeout → 4"] : []} hot={0} w={360} />
      <Abs x={1260} y={285} w={500} h={500}>
        <Card tone="white" style={{ height: "100%", padding: 30 }}>
          <Text size={30} color={colors.muted} weight={800}>{t({ ja: "出力", en: "Output" })}</Text>
          <div style={{ display: "flex", gap: 22, marginTop: 80, justifyContent: "center" }}>
            {["1", "2", "3", "4"].map((n, i) => {
              const starts = [cues[0] + 8, cues[0] + 28, cues[1] + 12, cues[2] + 12];
              const a = progress(frame, starts[i], 12);
              return <div key={n} style={{ width: 78, height: 78, borderRadius: 18, background: i < 2 ? colors.surfaceCard : i === 2 ? colors.tealSoft : colors.amberSoft, border: `3px solid ${i === 2 ? colors.teal : i === 3 ? colors.amber : colors.hairlineStrong}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 38, fontWeight: 900, opacity: a, transform: `translateY(${(1 - a) * 20}px)` }}>{n}</div>;
            })}
          </div>
          <Text size={24} color={colors.muted} weight={600} style={{ marginTop: 82, textAlign: "center" }}>{t({ ja: "現在のタスク → マイクロタスク処理 → 次のタスク", en: "current task → drain microtasks → next task" })}</Text>
        </Card>
      </Abs>
      <Svg>
        <Packet x1={690} y1={465} x2={790} y2={385} start={cues[1]} color={colors.teal} label="3" />
        <Packet x1={690} y1={430} x2={790} y2={685} start={cues[2]} color={colors.amber} label="4" />
        <Arrow x1={1150} y1={390} x2={1260} y2={460} p={progress(frame, cues[1], 18)} color={colors.teal} width={5} />
        <Arrow x1={1150} y1={690} x2={1260} y2={550} p={progress(frame, cues[2], 18)} color={colors.amber} width={5} />
      </Svg>
    </SceneShell>
  );
}

/* 4. Await transform */
export function AwaitTransformScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "await", en: "await" }} title={{ ja: "Promiseの継続へ変わる", en: "It becomes a Promise continuation" }}>
      <Abs x={130} y={255} w={700} h={520}>
        <Card tone="dark" style={{ padding: 26, height: "100%" }}>
          {[
            "async function example() {",
            "  console.log('A')",
            "  const r = await fetchData()",
            "  console.log('B')",
            "  return r",
            "}",
          ].map((line, i) => <div key={line} style={{ fontFamily: fonts.mono, fontSize: 25, color: i === 2 ? colors.coral : colors.onDark, marginBottom: 16 }}>{line}</div>)}
        </Card>
      </Abs>
      <Abs x={1080} y={255} w={650} h={520}>
        <Card tone="white" accent={frame >= cues[1] ? colors.coral : undefined} style={{ padding: 28, height: "100%" }}>
          <Text size={30} color={colors.ink} weight={800}>{t({ ja: "概念的な変換", en: "Conceptual transform" })}</Text>
          <div style={{ fontFamily: fonts.mono, fontSize: 25, lineHeight: 1.55, color: colors.body, marginTop: 28 }}>
            <div>fetchData()</div>
            <div style={{ color: colors.coral }}>.then((r) =&gt; &#123;</div>
            <div>&nbsp;&nbsp;console.log('B')</div>
            <div>&nbsp;&nbsp;return r</div>
            <div style={{ color: colors.coral }}>&#125;)</div>
          </div>
          <div style={{ marginTop: 32 }}><Chip tone="teal" size={24}>{t({ ja: "解決後 → microtask", en: "after resolve → microtask" })}</Chip></div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={830} y1={515} x2={1080} y2={515} p={progress(frame, cues[1], 24)} color={colors.coral} width={6} />
        <Packet x1={850} y1={515} x2={1060} y2={515} start={cues[1] + 4} color={colors.coral} label="then" />
      </Svg>
      <Abs x={650} y={810} w={620} h={66} style={{ opacity: progress(frame, cues[3], 16) }}>
        <Chip tone="amber" size={28}>{t({ ja: "I/O待ち中もイベントループは動く", en: "the event loop keeps running during I/O" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* 5. V8 and Python entry */
export function V8PythonScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "最適化と次のモデル", en: "Optimization and handoff" }} title={{ ja: "V8からPythonへ", en: "From V8 to Python" }}>
      <Abs x={140} y={270} w={760} h={500}>
        <Card tone="white" style={{ padding: 32, height: "100%" }}>
          <Text size={34} color={colors.ink} weight={900}>V8 v7.2+</Text>
          <Text size={26} color={colors.muted} weight={600} style={{ marginTop: 18 }}>{t({ ja: "既にPromiseなら余分なラッパーを省く", en: "Already a Promise: skip the extra wrapper" })}</Text>
          <div style={{ display: "flex", alignItems: "center", gap: 34, marginTop: 74 }}>
            {[0, 1, 2].map((i) => <div key={i} style={{ width: 86, height: 86, borderRadius: 999, background: frame >= cues[1] ? colors.surfaceCard : colors.amberSoft, border: `4px solid ${colors.amber}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 32, fontWeight: 900, opacity: frame >= cues[1] && i > 0 ? 0.22 : 1 }}>tick</div>)}
            <Text size={44} color={colors.coral} weight={900}>→</Text>
            <div style={{ width: 106, height: 106, borderRadius: 999, background: colors.tealSoft, border: `5px solid ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 42, fontWeight: 900 }}>1</div>
          </div>
          <Text size={28} color={colors.coralDeep} weight={800} style={{ marginTop: 46 }}>{t({ ja: "3 ticks → 1 tick", en: "3 ticks → 1 tick" })}</Text>
        </Card>
      </Abs>
      <Abs x={1030} y={270} w={720} h={500}>
        <Card tone="soft" accent={frame >= cues[2] ? colors.coral : undefined} style={{ padding: 32, height: "100%" }}>
          <Text size={34} color={colors.ink} weight={900}>Python 3.5</Text>
          <Text size={28} color={colors.body} weight={700} style={{ marginTop: 25 }}>{t({ ja: "async / await", en: "async / await" })}</Text>
          <div style={{ marginTop: 48, display: "flex", gap: 28, alignItems: "center" }}>
            <Chip tone="coral" size={30}>{t({ ja: "構文", en: "syntax" })}</Chip>
            <Text size={44} color={colors.coral} weight={900}>→</Text>
            <Chip tone="teal" size={30}>{t({ ja: "コルーチン", en: "coroutines" })}</Chip>
          </div>
          <Text size={25} color={colors.muted} weight={600} style={{ marginTop: 70 }}>{t({ ja: "次は、呼んだだけでは走らない関数へ", en: "Next: a function call that does not run yet" })}</Text>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* 6. Python coroutines */
export function PythonCoroutinesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const stage = frame >= cues[3] ? 3 : frame >= cues[2] ? 2 : frame >= cues[1] ? 1 : 0;
  return (
    <SceneShell kicker={{ ja: "Python", en: "Python" }} title={{ ja: "コルーチンは中断できるフレーム", en: "A coroutine is a suspendable frame" }}>
      <MiniCard x={130} y={300} w={440} h={220} title="async def" body={t({ ja: "呼んでも本体はまだ動かない", en: "Calling it does not run the body" })} active={stage === 0} />
      <MiniCard x={735} y={300} w={440} h={220} title={t({ ja: "coroutine object", en: "coroutine object" })} body={t({ ja: "イベントループが必要", en: "needs an event loop" })} active={stage === 1} />
      <MiniCard x={1340} y={300} w={440} h={220} title="asyncio.run" body={t({ ja: "ループがsendで進める", en: "loop advances with send" })} active={stage === 2} />
      <Abs x={410} y={610} w={1100} h={230}>
        <Card tone="white" accent={stage === 3 ? colors.coral : undefined} style={{ padding: 26, height: "100%" }}>
          <Text size={28} color={colors.muted} weight={800}>{t({ ja: "ヒープ上のコルーチンフレーム", en: "Coroutine frame on the heap" })}</Text>
          <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
            {[t({ ja: "ローカル変数", en: "locals" }), t({ ja: "実行位置", en: "instruction pointer" }), t({ ja: "待ち先", en: "awaited object" })].map((label, i) => (
              <div key={label} style={{ flex: 1, padding: 22, borderRadius: 18, background: i === stage - 1 ? colors.coralSoft : colors.surfaceSoft, border: `2px solid ${i === stage - 1 ? colors.coral : colors.hairline}`, textAlign: "center", fontFamily: fonts.sans, fontSize: 26, fontWeight: 800, color: colors.ink }}>{label}</div>
            ))}
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={570} y1={410} x2={735} y2={410} p={progress(frame, cues[0] + 8, 20)} color={colors.coral} width={6} />
        <Arrow x1={1175} y1={410} x2={1340} y2={410} p={progress(frame, cues[1], 20)} color={colors.coral} width={6} />
        <Arrow x1={1560} y1={520} x2={1060} y2={610} p={progress(frame, cues[2], 24)} color={colors.teal} width={6} bend={80} />
        <Packet x1={1380} y1={520} x2={1160} y2={610} start={cues[2] + 8} color={colors.teal} label="send" />
      </Svg>
    </SceneShell>
  );
}

/* 7. Python loop */
export function PythonLoopScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "asyncio", en: "asyncio" }} title={{ ja: "1スレッドのI/O並行性", en: "I/O concurrency on one thread" }}>
      <Abs x={130} y={265} w={520} h={540}>
        <Card tone="dark" style={{ padding: 28, height: "100%" }}>
          <Text size={32} color={colors.onDark} weight={900}>{t({ ja: "asyncioループ", en: "asyncio loop" })}</Text>
          {[t({ ja: "タスクキュー", en: "Task queue" }), t({ ja: "スケジューラ", en: "scheduler" }), t({ ja: "シングルスレッド", en: "single thread" })].map((label, i) => <div key={label} style={{ marginTop: 30, padding: 22, borderRadius: 16, background: frame >= cues[Math.min(i, 2)] ? colors.darkElevated : "rgba(255,255,255,0.05)", border: `2px solid ${frame >= cues[Math.min(i, 2)] ? colors.coral : colors.darkElevated}`, fontFamily: fonts.sans, color: colors.onDark, fontSize: 26, fontWeight: 800 }}>{label}</div>)}
        </Card>
      </Abs>
      <Abs x={790} y={265} w={430} h={245}>
        <Card tone="white" accent={frame >= cues[1] ? colors.teal : undefined} style={{ padding: 26, height: "100%" }}>
          <Text size={30} color={colors.ink} weight={900}>{t({ ja: "I/O多重化", en: "I/O multiplexing" })}</Text>
          <Text size={24} color={colors.muted} weight={700} style={{ marginTop: 20 }}>{t({ ja: "epoll / kqueue / IOCP", en: "epoll / kqueue / IOCP" })}</Text>
        </Card>
      </Abs>
      <Abs x={790} y={560} w={430} h={245}>
        <Card tone="white" accent={frame >= cues[2] ? colors.amber : undefined} style={{ padding: 26, height: "100%" }}>
          <Text size={30} color={colors.ink} weight={900}>{t({ ja: "GILの影響は小さい", en: "GIL matters little" })}</Text>
          <Text size={24} color={colors.muted} weight={700} style={{ marginTop: 20 }}>{t({ ja: "得意: I/O-bound", en: "Best for I/O-bound work" })}</Text>
        </Card>
      </Abs>
      <Abs x={1355} y={340} w={420} h={390}>
        <Card tone="white" accent={frame >= cues[3] ? colors.error : undefined} style={{ padding: 26, height: "100%" }}>
          <Chip tone={frame >= cues[3] ? "error" : "muted"} size={24}>{t({ ja: "避ける", en: "avoid" })}</Chip>
          <Text size={31} color={colors.ink} weight={900} style={{ marginTop: 30 }}>requests.get()</Text>
          <Text size={24} color={colors.muted} weight={700} style={{ marginTop: 25 }}>{t({ ja: "同期I/Oはループを塞ぐ", en: "sync I/O blocks the loop" })}</Text>
          <Text size={25} color={colors.tealDeep} weight={800} style={{ marginTop: 42 }}>{t({ ja: "aiohttpなどへ", en: "use aiohttp etc." })}</Text>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={650} y1={390} x2={790} y2={390} p={progress(frame, cues[1], 20)} color={colors.teal} width={6} />
        <Arrow x1={650} y1={650} x2={790} y2={650} p={progress(frame, cues[2], 20)} color={colors.amber} width={6} />
        <Arrow x1={1220} y1={620} x2={1355} y2={560} p={progress(frame, cues[3], 20)} color={colors.error} width={6} />
      </Svg>
    </SceneShell>
  );
}

/* 8. Rust futures */
export function RustFuturesScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "Rust", en: "Rust" }} title={{ ja: "Futureをpollする", en: "Polling Futures" }}>
      <MiniCard x={130} y={285} w={410} h={430} title={t({ ja: "ランタイム", en: "runtime" })} body={t({ ja: "tokioなどを選ぶ", en: "choose tokio, etc." })} active={frame >= cues[0] && frame < cues[1]} tone="dark" />
      <Abs x={185} y={470} w={300} h={175}>
        {[t({ ja: "スケジューラ", en: "scheduler" }), t({ ja: "I/Oドライバ", en: "I/O driver" }), t({ ja: "タイマー", en: "timer" })].map((label) => (
          <div key={label} style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 12, background: colors.darkElevated, border: `2px solid ${colors.coralDeep}`, fontFamily: fonts.sans, fontSize: 24, fontWeight: 800, color: colors.onDark }}>
            {label}
          </div>
        ))}
      </Abs>
      <Abs x={720} y={250} w={520} h={530}>
        <Card tone="white" accent={frame >= cues[1] ? colors.coral : undefined} style={{ padding: 30, height: "100%" }}>
          <Text size={32} color={colors.ink} weight={900}>Future::poll(cx)</Text>
          <div style={{ display: "flex", gap: 24, marginTop: 70, justifyContent: "center" }}>
            <Chip tone="teal" size={32}>Ready(T)</Chip>
            <Chip tone="amber" size={32}>Pending</Chip>
          </div>
          <Text size={25} color={colors.muted} weight={700} style={{ marginTop: 70, textAlign: "center" }}>{t({ ja: "ランタイムが完了を問い合わせる", en: "runtime asks whether it is done" })}</Text>
        </Card>
      </Abs>
      <Abs x={1400} y={250} w={360} h={530}>
        <Card tone="soft" accent={frame >= cues[3] ? colors.teal : undefined} style={{ padding: 25, height: "100%" }}>
          <Text size={30} color={colors.ink} weight={900}>{t({ ja: "状態機械", en: "state machine" })}</Text>
          {["Start", "WaitingA", "WaitingB", "Done"].map((s, i) => <div key={s} style={{ marginTop: 22, padding: 17, borderRadius: 14, background: frame >= cues[3] && i <= Math.min(3, Math.floor((frame - cues[3]) / 18)) ? colors.tealSoft : "#fff", border: `2px solid ${colors.hairlineStrong}`, fontFamily: fonts.mono, fontSize: 23, fontWeight: 800, color: colors.ink }}>{s}</div>)}
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={540} y1={500} x2={720} y2={500} p={progress(frame, cues[1], 20)} color={colors.coral} width={6} />
        <Arrow x1={1240} y1={500} x2={1400} y2={500} p={progress(frame, cues[3], 20)} color={colors.teal} width={6} />
        <Packet x1={560} y1={500} x2={710} y2={500} start={cues[1] + 3} color={colors.coral} label="poll" />
      </Svg>
      <Abs x={600} y={820} w={720} h={58} style={{ opacity: progress(frame, cues[2], 16) }}>
        <Chip tone="coral" size={28}>{t({ ja: "JS/Python = プッシュ · Rust = プル", en: "JS/Python = push · Rust = pull" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* 9. Rust waker */
export function RustWakerScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  return (
    <SceneShell kicker={{ ja: "Waker", en: "Waker" }} title={{ ja: "いつ再pollするかを伝える", en: "Telling the runtime when to poll again" }}>
      <MiniCard x={135} y={320} w={370} h={250} title="Future" body={t({ ja: "Pending前にWakerを保存", en: "stores Waker before Pending" })} active={frame >= cues[0] && frame < cues[1]} />
      <MiniCard x={765} y={260} w={390} h={245} title={t({ ja: "ドライバ", en: "driver" })} body={t({ ja: "OS readiness登録", en: "registers OS readiness" })} active={frame >= cues[1] && frame < cues[2]} />
      <MiniCard x={765} y={600} w={390} h={220} title={t({ ja: "ランタイム", en: "runtime" })} body={t({ ja: "起こされたFutureをpoll", en: "polls the woken Future" })} active={frame >= cues[2]} />
      <MiniCard x={1420} y={320} w={350} h={250} title={t({ ja: "OS", en: "OS" })} body="epoll · kqueue · IOCP" active={frame >= cues[1] && frame < cues[2]} />
      <Svg>
        <Arrow x1={505} y1={440} x2={765} y2={385} p={progress(frame, cues[0], 20)} color={colors.coral} width={6} />
        <Packet x1={520} y1={440} x2={750} y2={390} start={cues[0] + 4} color={colors.coral} label="Waker" />
        <Arrow x1={1155} y1={385} x2={1420} y2={440} p={progress(frame, cues[1], 22)} color={colors.amber} width={6} />
        <Arrow x1={1420} y1={500} x2={1155} y2={705} p={progress(frame, cues[2], 24)} color={colors.teal} width={6} bend={-70} />
        <Packet x1={1410} y1={500} x2={1170} y2={700} start={cues[2] + 4} color={colors.teal} label="wake" />
        <Arrow x1={765} y1={705} x2={505} y2={500} p={progress(frame, cues[2] + 14, 24)} color={colors.teal} width={6} bend={-60} />
      </Svg>
      <Abs x={430} y={820} w={1060} h={62} style={{ opacity: progress(frame, cues[3], 18) }}>
        <Chip tone="teal" size={28}>{t({ ja: "Futureは状態機械の値 — awaitごとのヒープ割り当ては必須ではない", en: "Future = state-machine value — no mandatory per-await heap allocation" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* 10. Comparison */
export function ComparisonScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const cols = [
    { name: "JavaScript", tone: colors.coral, lines: [t({ ja: "V8ヒープのクロージャ", en: "V8 heap closures" }), t({ ja: "プッシュ", en: "push" }), "Promise" ] },
    { name: "Python", tone: colors.amber, lines: [t({ ja: "ヒープ上のコルーチンフレーム", en: "heap coroutine frame" }), t({ ja: "プッシュ", en: "push" }), "asyncio Task" ] },
    { name: "Rust", tone: colors.teal, lines: [t({ ja: "状態機械の値", en: "state-machine value" }), t({ ja: "プル", en: "pull" }), t({ ja: "dropでキャンセル", en: "drop = cancel" }) ] },
  ];
  return (
    <SceneShell kicker={{ ja: "比較", en: "Comparison" }} title={{ ja: "同じ構文、違う保存場所", en: "Same syntax, different storage" }}>
      {cols.map((c, i) => (
        <Abs key={c.name} x={130 + i * 595} y={265} w={500} h={490}>
          <Card tone="white" accent={c.tone} style={{ height: "100%", padding: 28 }}>
            <Text size={34} color={colors.ink} weight={900}>{c.name}</Text>
            {c.lines.map((line, j) => <div key={line} style={{ marginTop: 32, padding: 22, borderRadius: 16, background: frame >= cues[Math.min(j, 2)] ? (j === 1 ? colors.coralSoft : colors.surfaceSoft) : "#fff", border: `2px solid ${frame >= cues[Math.min(j, 2)] ? c.tone : colors.hairline}`, fontFamily: fonts.sans, fontSize: 25, fontWeight: 800, color: colors.body }}>{line}</div>)}
          </Card>
        </Abs>
      ))}
      <Abs x={310} y={802} w={1300} h={72} style={{ opacity: progress(frame, cues[3], 16) }}>
        <Card tone="soft" accent={colors.error} style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Text size={28} color={colors.error} weight={900}>{t({ ja: "落とし穴: async内のブロッキング処理はランタイムスレッドを塞ぐ", en: "Pitfall: blocking work inside async blocks the runtime thread" })}</Text>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* 11. Outro */
export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const cards = [
    { tone: colors.coral, label: t({ ja: "イベントループ", en: "Event loop" }), sub: t({ ja: "順序をステップ実行", en: "step through order" }) },
    { tone: colors.amber, label: t({ ja: "コルーチン", en: "Coroutine" }), sub: t({ ja: "状態遷移を確認", en: "inspect state" }) },
    { tone: colors.teal, label: t({ ja: "言語比較", en: "Comparison" }), sub: t({ ja: "3モデルを並べる", en: "compare 3 models" }) },
  ];
  return (
    <EndCard slug="async-await-internals" headline={{ ja: "待っている間、\nスレッドを遊ばせない", en: "Do not leave threads idle\nwhile waiting" }}>
      <div style={{ marginTop: 48, display: "flex", gap: 26, opacity: progress(frame, 18, 20) }}>
        {cards.map((card) => (
          <div key={card.label} style={{ width: 390, height: 128, borderRadius: 22, border: `3px solid ${card.tone}`, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxShadow: "0 12px 30px rgba(20,20,19,0.08)" }}>
            <div style={{ width: 44, height: 8, borderRadius: 8, background: card.tone, marginBottom: 16 }} />
            <Text size={28} color={colors.ink} weight={900}>{card.label}</Text>
            <Text size={24} color={colors.muted} weight={700} style={{ marginTop: 8 }}>{card.sub}</Text>
          </div>
        ))}
      </div>
    </EndCard>
  );
}
