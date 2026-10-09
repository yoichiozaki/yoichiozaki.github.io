import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

type Tone = "coral" | "teal" | "amber" | "muted" | "error" | "dark";

const toneStyle = (tone: Tone) => ({
  coral: { bg: colors.coralSoft, border: colors.coral, fg: colors.coralDeep },
  teal: { bg: colors.tealSoft, border: colors.teal, fg: colors.tealDeep },
  amber: { bg: colors.amberSoft, border: colors.amber, fg: "#9a6420" },
  muted: { bg: "#fff", border: colors.hairlineStrong, fg: colors.body },
  error: { bg: colors.errorSoft, border: colors.error, fg: colors.error },
  dark: { bg: colors.dark, border: colors.darkElevated, fg: colors.onDark },
}[tone]);

function Node({ x, y, w = 220, h = 110, label, tone = "muted", opacity = 1 }: { x: number; y: number; w?: number; h?: number; label: string; tone?: Tone; opacity?: number }) {
  const c = toneStyle(tone);
  return (
    <Abs x={x} y={y} w={w} h={h} style={{ opacity, transform: `scale(${0.94 + 0.06 * opacity})` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 18, background: c.bg, border: `3px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color: c.fg, lineHeight: 1.15, whiteSpace: "pre-line", boxShadow: "0 10px 26px rgba(20,20,19,0.06)", padding: 12, boxSizing: "border-box" }}>{label}</div>
    </Abs>
  );
}

function Tile({ x, y, label, tone = "teal", opacity = 1, w = 160 }: { x: number; y: number; label: string; tone?: Tone; opacity?: number; w?: number }) {
  const c = toneStyle(tone);
  return (
    <Abs x={x} y={y} w={w} h={72} style={{ opacity }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 10, background: c.bg, border: `3px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 26, fontWeight: 800, color: c.fg }}>{label}</div>
    </Abs>
  );
}

function Tag({ at, x, y, tone, children }: { at: number; x: number; y: number; tone: Tone; children: ReactNode }) {
  return <Abs x={x} y={y}><Appear at={at} dy={8}><Chip tone={tone === "dark" ? "ink" : tone} size={28}>{children}</Chip></Appear></Abs>;
}

function Stat({ value, label, tone = "coral" }: { value: string; label: string; tone?: "coral" | "teal" | "amber" }) {
  const color = tone === "teal" ? colors.tealDeep : tone === "amber" ? "#9a6420" : colors.coralDeep;
  return <div style={{ textAlign: "center" }}><div style={{ fontFamily: fonts.serif, fontSize: 76, fontWeight: 650, color, lineHeight: 1 }}>{value}</div><div style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 29, fontWeight: 700, color: colors.body }}>{label}</div></div>;
}

function MiniCard({ at, x, y, w, h, title, body, tone = "white" }: { at: number; x: number; y: number; w: number; h: number; title: string; body?: string; tone?: "white" | "soft" | "dark" }) {
  return (
    <Abs x={x} y={y} w={w} h={h}>
      <Appear at={at} style={{ width: "100%", height: "100%" }}>
        <Card tone={tone} style={{ width: "100%", height: "100%", padding: 26, boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 46, fontWeight: 650, lineHeight: 1.15 }}>{title}</div>
          {body && <div style={{ marginTop: 16, fontFamily: fonts.sans, fontSize: 31, lineHeight: 1.38, color: tone === "dark" ? colors.onDarkSoft : colors.body }}>{body}</div>}
        </Card>
      </Appear>
    </Abs>
  );
}

export function IntroScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  return (
    <TitleCard
      title={{ ja: "MapReduce\n完全解説", en: "MapReduce\nDeep Dive" }}
      subtitle={{ ja: "2つの関数で、大規模分散処理をどう変えたのか", en: "How two functions reshaped large-scale distributed processing" }}
      art={<>
        <Svg><Arrow x1={1210} y1={755} x2={1810} y2={755} p={progress(frame, cues[1] + 2, 32)} color={colors.coral} width={7} /></Svg>
        {[0,1,2,3,4,5,6,7,8].map((i) => <Node key={i} x={1210 + (i % 3) * 198} y={205 + Math.floor(i / 3) * 150} w={178} h={128} label={`${i + 1}`} tone={i % 3 === 0 ? "coral" : i % 3 === 1 ? "teal" : "amber"} opacity={progress(frame, 10 + i * 4, 16)} />)}
        <Abs x={1210} y={710}><Appear at={28}><Chip tone="coral" size={48}>map()</Chip></Appear></Abs>
        <Abs x={1585} y={710}><Appear at={44}><Chip tone="teal" size={48}>reduce()</Chip></Appear></Abs>
      </>}
    />
  );
}

export function ProblemScene() {
  const { cues } = useScene();
  const t = useT();
  const problems: Bilingual[] = [{ ja: "データ分割", en: "partition data" }, { ja: "並列実行", en: "parallel control" }, { ja: "障害復旧", en: "fault recovery" }, { ja: "帯域最適化", en: "bandwidth tuning" }];
  return (
    <SceneShell kicker={{ ja: "背景", en: "Background" }} title={{ ja: "計算より、配管が難しかった", en: "The plumbing was harder than the computation" }}>
      <MiniCard at={cues[0]} x={120} y={220} w={540} h={600} title={t({ ja: "ペタバイト級のデータ", en: "Petabyte-scale data" })} body={t({ ja: "クローラが集める巨大なウェブデータを日常的に処理。", en: "Routine processing of huge web data collected by crawlers." })} />
      <Abs x={160} y={480} w={460} style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>{Array.from({ length: 25 }, (_, i) => <div key={i} style={{ height: 56, borderRadius: 8, background: i % 3 === 0 ? colors.coralSoft : i % 3 === 1 ? colors.tealSoft : colors.amberSoft }} />)}</Abs>
      <MiniCard at={cues[1]} x={690} y={220} w={540} h={600} title={t({ ja: "数千台で処理", en: "Thousands of machines" })} body={t({ ja: "インデックス構築、PageRank、ログ分析をクラスタに分散。", en: "Index building, PageRank, and log analysis spread across a cluster." })} tone="soft" />
      {[0,1,2,3,4,5].map((i) => <Node key={i} x={748 + (i % 3) * 150} y={500 + Math.floor(i / 3) * 120} w={128} h={92} label="" tone={i === 4 ? "error" : "teal"} opacity={1} />)}
      <Abs x={1260} y={220} w={540} h={600}><Appear at={cues[0] + 16} style={{ width: "100%", height: "100%" }}><Card tone="white" style={{ width: "100%", height: "100%", padding: 28, boxSizing: "border-box" }}><div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 650 }}>{t({ ja: "本質を隠す複雑さ", en: "Complexity hides the idea" })}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 32 }}>{problems.map((p, i) => <div key={i} style={{ height: 125, borderRadius: 16, background: [colors.coralSoft, colors.amberSoft, colors.errorSoft, colors.tealSoft][i], border: `3px solid ${[colors.coral, colors.amber, colors.error, colors.teal][i]}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: fonts.sans, fontSize: 30, fontWeight: 800, color: colors.body }}>{t(p)}</div>)}</div></Card></Appear></Abs>
    </SceneShell>
  );
}

export function BeforeScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const workers = [0,1,2,3,4].map((i) => ({ x: 590 + i * 245, y: 500 }));
  return (
    <SceneShell kicker={{ ja: "以前", en: "Before" }} title={{ ja: "MPIでは、すべてが手作業", en: "With MPI, everything was manual" }}>
      <MiniCard at={cues[0]} x={120} y={230} w={460} h={620} title="MPI" body={"MPI_Send(chunk)\nMPI_Recv(...)\nMPI_Reduce(...)\n// failure?"} tone="dark" />
      <Node x={830} y={220} w={330} h={130} label={t({ ja: "マスター", en: "Master" })} tone="dark" opacity={progress(frame, cues[0], 18)} />
      {workers.map((w, i) => <Node key={i} x={w.x} y={w.y} w={220} h={125} label={t({ ja: `ワーカー\n${i + 1}`, en: `Worker\n${i + 1}` })} tone={i === 2 && frame > cues[2] ? "error" : "muted"} opacity={progress(frame, cues[0] + i * 3, 18)} />)}
      <Svg>{workers.map((w, i) => <Arrow key={i} x1={995} y1={350} x2={w.x + 118} y2={w.y} p={progress(frame, cues[1] + i * 5, 18)} color={i === 2 && frame > cues[2] ? colors.error : colors.coral} width={4} bend={0} />)}</Svg>
      <Tag at={cues[1]} x={150} y={770} tone="coral">{t({ ja: "通信も集約も手作業", en: "comms + merge by hand" })}</Tag>
      <Tag at={cues[2]} x={1230} y={255} tone="error">{t({ ja: "1台でも落ちれば、最初から", en: "one failure can mean restart" })}</Tag><Abs x={1160} y={675} w={560} h={130} style={{ opacity: progress(frame, cues[1] + 18, 18) }}><Card tone="white" accent={colors.error} style={{ height: "100%", padding: 28, boxSizing: "border-box", textAlign: "center" }}><div style={{ fontFamily: fonts.serif, fontSize: 40, color: colors.error, lineHeight: 1.08 }}>{t({ ja: "ジョブを再実行", en: "Rerun the job" })}</div><div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 26, color: colors.body }}>{t({ ja: "障害対応もプログラマの責任", en: "failure handling is on the programmer" })}</div></Card></Abs>
    </SceneShell>
  );
}

export function ModelScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  return (
    <SceneShell kicker={{ ja: "モデル", en: "Model" }} title={{ ja: "ユーザーは2つの関数だけを書く", en: "Users write only two functions" }}>
      <Abs x={120} y={215} w={1680} h={630}><Appear at={cues[0]} style={{ width: "100%", height: "100%" }}><Card tone="soft" style={{ width: "100%", height: "100%", padding: 44, boxSizing: "border-box" }}><div style={{ fontFamily: fonts.serif, fontSize: 56, textAlign: "center" }}>{t({ ja: "配管はフレームワークの中へ", en: "The plumbing moves into the framework" })}</div><div style={{ position: "absolute", left: 80, right: 80, bottom: 48, display: "flex", justifyContent: "space-between" }}>{[{ja:"分割",en:"split"},{ja:"配置",en:"schedule"},{ja:"転送",en:"shuffle"},{ja:"復旧",en:"recover"}].map((s,i)=><Chip key={i} tone={i===2?"coral":"muted"} size={34}>{t(s)}</Chip>)}</div></Card></Appear></Abs>
      <Abs x={235} y={410} w={560} h={310}><Appear at={cues[1]} style={{ width: "100%", height: "100%" }}><Card tone="white" accent={colors.coral} style={{ width: "100%", height: "100%", padding: 36, boxSizing: "border-box" }}><div style={{ fontFamily: fonts.mono, fontSize: 64, fontWeight: 800, color: colors.coralDeep }}>map()</div><div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 36, color: colors.body }}>{t({ ja: "中間キー・値を出す", en: "emit intermediate pairs" })}</div><div style={{ marginTop: 18, fontFamily: fonts.mono, fontSize: 28, color: colors.muted, opacity: progress(frame, cues[2] + 10, 18) }}>(k1, v1) → list(k2, v2)</div></Card></Appear></Abs>
      <Abs x={1125} y={410} w={560} h={310}><Appear at={cues[1] + 10} style={{ width: "100%", height: "100%" }}><Card tone="white" accent={colors.teal} style={{ width: "100%", height: "100%", padding: 36, boxSizing: "border-box" }}><div style={{ fontFamily: fonts.mono, fontSize: 64, fontWeight: 800, color: colors.tealDeep }}>reduce()</div><div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 36, color: colors.body }}>{t({ ja: "同じキーの値を集約", en: "aggregate values by key" })}</div><div style={{ marginTop: 18, fontFamily: fonts.mono, fontSize: 28, color: colors.muted, opacity: progress(frame, cues[2] + 10, 18) }}>(k2, list(v2)) → list(v2)</div></Card></Appear></Abs>
      <Svg><Arrow x1={795} y1={565} x2={1125} y2={565} p={progress(frame, cues[2], 28)} color={colors.coral} width={8} /><Packet x1={840} y1={565} x2={1090} y2={565} start={cues[2] + 14} dur={40} color={colors.coral} label="k/v" r={16} /></Svg>
    </SceneShell>
  );
}
export function WordCountScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const words = ["cat", "dog", "cat", "map", "dog", "cat"]; const bin: Record<string, number> = { cat: 845, dog: 1000, map: 1155 };
  return (
    <SceneShell kicker={{ ja: "例", en: "Example" }} title={{ ja: "Word Count は、流れが見える", en: "Word Count makes the flow visible" }}>
      <MiniCard at={cues[0]} x={120} y={220} w={500} h={620} title={t({ ja: "入力", en: "Input" })} />
      <Abs x={160} y={430} w={420} style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>{words.map((w,i)=><Chip key={i} tone={w==="cat"?"coral":w==="dog"?"teal":"amber"} size={34}>{w}</Chip>)}</Abs>
      <Node x={585} y={455} w={235} h={155} label="map()" tone="coral" opacity={progress(frame, cues[0]+8,18)} />
      <Abs x={845} y={220} w={455} h={620}><Appear at={cues[1]} style={{ width: "100%", height: "100%" }}><Card tone="soft" style={{ width:"100%",height:"100%",padding:28,boxSizing:"border-box" }}><div style={{ fontFamily:fonts.serif,fontSize:42,textAlign:"center" }}>{t({ja:"Shuffle：同じキーを集める",en:"Shuffle: gather equal keys"})}</div>{["cat","dog","map"].map((w,i)=><div key={w} style={{marginTop:46,display:"flex",alignItems:"center",gap:16}}><Chip tone={w==="cat"?"coral":w==="dog"?"teal":"amber"} size={25}>{w}</Chip>{Array.from({length: words.filter((v,j)=>v===w && frame>cues[1]+20+j*8).length},(_,j)=><span key={j} style={{width:44,height:44,borderRadius:999,background:w==="cat"?colors.coral:w==="dog"?colors.teal:colors.amber,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontFamily:fonts.mono,fontWeight:800}}>1</span>)}</div>)}</Card></Appear></Abs>
      <Node x={1335} y={455} w={210} h={155} label="reduce()" tone="teal" opacity={progress(frame,cues[1]+35,18)} />
      <Abs x={1585} y={260} w={245} h={460} style={{ opacity: progress(frame,cues[1]+70,18) }}><Card tone="white" accent={colors.teal} style={{ width:"100%",height:"100%",padding:22,boxSizing:"border-box" }}><div style={{fontFamily:fonts.serif,fontSize:42}}>{t({ja:"出力",en:"Output"})}</div>{["cat 3","dog 2","map 1"].map(r=><div key={r} style={{marginTop:25,fontFamily:fonts.mono,fontSize:33,fontWeight:800,color:colors.tealDeep}}>{r}</div>)}</Card></Abs>
      <Svg>{words.map((w,i)=><Packet key={i} x1={820} y1={535} x2={bin[w]+60} y2={365+["cat","dog","map"].indexOf(w)*118} start={cues[1]+6+i*6} dur={30} color={w==="cat"?colors.coral:w==="dog"?colors.teal:colors.amber} label={`(${w},1)`} />)}{["cat","dog","map"].map((w,i)=><Packet key={w} x1={1280} y1={365+i*118} x2={1335} y2={535} start={cues[1]+70+i*12} dur={25} color={w==="cat"?colors.coral:w==="dog"?colors.teal:colors.amber} label={`${w}:${words.filter(v=>v===w).length}`} />)}</Svg>
      <Tag at={cues[0] + 24} x={610} y={850} tone="teal">{t({ ja: "2つの関数・6行で、ペタバイト規模へ", en: "two functions, six lines, petabyte scale" })}</Tag>
    </SceneShell>
  );
}

export function ApplicationsScene() {
  const { cues } = useScene(); const t = useT();
  const apps = [
    { name:{ja:"分散grep",en:"Distributed grep"}, map:{ja:"行 → 一致?",en:"line → match?"}, out:{ja:"一致行",en:"matching lines"}, tone:"coral" as Tone },
    { name:{ja:"URL頻度",en:"URL frequency"}, map:{ja:"URL → 1",en:"URL → 1"}, out:{ja:"合計",en:"sum"}, tone:"teal" as Tone },
    { name:{ja:"逆リンク",en:"Reverse links"}, map:{ja:"宛先 → 元URL",en:"target → source"}, out:{ja:"リンク元一覧",en:"source list"}, tone:"amber" as Tone },
    { name:{ja:"転置インデックス",en:"Inverted index"}, map:{ja:"単語 → 文書ID",en:"word → docID"}, out:{ja:"文書ID一覧",en:"doc ID list"}, tone:"coral" as Tone },
  ];
  return <SceneShell kicker={{ja:"応用",en:"Applications"}} title={{ja:"中身を変えるだけで、別の計算になる",en:"Change the contents, change the computation"}}>
    <Abs x={120} y={220} w={1680} h={620}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28}}>{apps.map((a,i)=><Appear key={i} at={(i<3?cues[0]:cues[1])+i*5}><Card tone="white" accent={toneStyle(a.tone).border} style={{height:285,padding:32,boxSizing:"border-box"}}><div style={{fontFamily:fonts.serif,fontSize:44,fontWeight:650}}>{t(a.name)}</div><div style={{display:"flex",alignItems:"center",gap:14,marginTop:30}}><Chip tone={a.tone === "dark" ? "ink" : a.tone} size={24}>map</Chip><span style={{fontFamily:fonts.mono,fontSize:29}}>{t(a.map)}</span><span style={{fontSize:30,color:colors.muted}}>→</span><Chip tone="teal" size={24}>reduce</Chip><span style={{fontFamily:fonts.mono,fontSize:29}}>{t(a.out)}</span></div></Card></Appear>)}</div></Abs>
    <Tag at={cues[2]} x={560} y={852} tone="dark">{t({ja:"フレームワークはそのまま",en:"the framework stays the same"})}</Tag>
  </SceneShell>;
}

export function PipelineScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const splits = [0,1,2,3].map(i=>({x:155,y:355+i*122,w:295,h:72}));
  const maps = [0,1,2,3].map(i=>({x:690,y:347+i*122,w:275,h:88}));
  const reds = [0,1,2].map(i=>({x:1415,y:350+i*150,w:305,h:108}));
  return <SceneShell kicker={{ja:"実行",en:"Execution"}} title={{ja:"スプリットから、タスクへ",en:"From splits to tasks"}}>
    <Abs x={120} y={215} w={400} h={640}><Appear at={cues[0]} style={{ width: "100%", height: "100%" }}><Card tone="soft" style={{ width:"100%", height:"100%", padding:30, boxSizing:"border-box" }}><div style={{fontFamily:fonts.serif,fontSize:48,fontWeight:650,lineHeight:1.15}}>{t({ja:"入力スプリット",en:"Input splits"})}</div><div style={{marginTop:18,fontFamily:fonts.sans,fontSize:30,color:colors.body}}>16–64 MB</div></Card></Appear></Abs>
    {splits.map((s,i)=><Tile key={i} x={s.x} y={s.y} w={s.w} label={t({ja:`スプリット ${i}`,en:`Split ${i}`})} tone="teal" opacity={progress(frame,cues[0]+i*4,16)} />)}
    <Node x={805} y={215} w={330} h={118} label={t({ja:"マスター\nM/Rタスク",en:"Master\nM/R tasks"})} tone="dark" opacity={progress(frame,cues[1],18)} />
    {maps.map((m,i)=><Node key={i} x={m.x} y={m.y} w={m.w} h={m.h} label={t({ja:`Map\nタスク ${i}`,en:`Map\nTask ${i}`})} tone="coral" opacity={progress(frame,cues[1]+16+i*4,18)} />)}
    {reds.map((r,i)=><Node key={i} x={r.x} y={r.y} w={r.w} h={r.h} label={t({ja:`Reduce\nタスク ${i}`,en:`Reduce\nTask ${i}`})} tone="teal" opacity={progress(frame,cues[1]+24+i*5,18)} />)}
    <Svg>
      {splits.map((s,i)=><Arrow key={`sm${i}`} x1={s.x+s.w} y1={s.y+36} x2={maps[i].x} y2={maps[i].y+44} p={progress(frame,cues[2]+6+i*5,18)} color={colors.coral} width={5} bend={0} />)}
      {progress(frame,cues[1]+16,18)>0 && <g opacity={progress(frame,cues[1]+16,18)*0.75}><path d={`M 970 333 H 640 V ${maps[3].y+44}`} fill="none" stroke={colors.coral} strokeWidth={3} strokeDasharray="9 9" /></g>}\n      {maps.map((m,i)=><Arrow key={`am${i}`} x1={640} y1={m.y+m.h/2} x2={m.x} y2={m.y+m.h/2} p={progress(frame,cues[1]+20+i*4,14)} color={colors.coral} width={3} dashed head={false} opacity={0.8} />)}
      {progress(frame,cues[1]+28,18)>0 && <g opacity={progress(frame,cues[1]+28,18)*0.75}><path d={`M 990 333 H 1370 V ${reds[2].y+reds[2].h/2}`} fill="none" stroke={colors.teal} strokeWidth={3} strokeDasharray="9 9" /></g>}\n      {reds.map((r,i)=><Arrow key={`ar${i}`} x1={1370} y1={r.y+r.h/2} x2={r.x} y2={r.y+r.h/2} p={progress(frame,cues[1]+34+i*5,14)} color={colors.teal} width={3} dashed head={false} opacity={0.8} />)}
      {maps.map((m,mi)=>reds.map((r,ri)=><Arrow key={`mr${mi}-${ri}`} x1={m.x+m.w} y1={m.y+m.h/2} x2={r.x} y2={r.y+r.h/2} p={progress(frame,cues[2]+20+mi*3+ri*4,20)} color={colors.hairlineStrong} width={2} head={false} bend={(ri-mi)*18} opacity={0.55} />))}
      {splits.map((s,i)=><Packet key={`pkt${i}`} x1={s.x+s.w} y1={s.y+36} x2={maps[i].x} y2={maps[i].y+44} start={cues[2]+12+i*8} dur={28} color={colors.coral} label={`M${i}`} r={15} />)}
    </Svg>
    <Tag at={cues[1]} x={1050} y={830} tone="dark">{t({ja:"Mはスプリットと同数 / Rは出力数",en:"M = splits / R = output files"})}</Tag>
    <Tag at={cues[2]+12} x={430} y={830} tone="coral">{t({ja:"Mapワーカーが各レコードにmap()を適用",en:"map workers apply map() to records"})}</Tag>
  </SceneShell>;
}
export function ShuffleScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const maps = [0,1,2].map(i=>({x:120,y:250+i*190})); const reducers = [0,1,2].map(i=>({x:1415,y:250+i*190}));
  const colorsBy = [colors.coral, colors.teal, colors.amber];
  return <SceneShell kicker={{ja:"Shuffle & Sort",en:"Shuffle & Sort"}} title={{ja:"Reduceタスクごとに1つのパーティション",en:"One partition per reduce task"}}>
    {maps.map((m,i)=><Card key={i} tone="white" accent={colors.coral} style={{position:"absolute",left:m.x,top:m.y,width:520,height:162,padding:20,boxSizing:"border-box",opacity:progress(frame,cues[0]+i*3,16)}}><div style={{fontFamily:fonts.sans,fontSize:32,fontWeight:800}}>{t({ja:`Mapワーカー ${i}`,en:`Map Worker ${i}`})}</div><div style={{display:"flex",gap:10,marginTop:18}}>{[0,1,2].map(p=><div key={p} style={{flex:1,height:68,borderRadius:12,background:p===0?colors.coralSoft:p===1?colors.tealSoft:colors.amberSoft,border:`3px solid ${colorsBy[p]}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fonts.mono,fontSize:30,fontWeight:800}}>P{p}</div>)}</div></Card>)}
    {reducers.map((r,i)=><Node key={i} x={r.x} y={r.y} w={365} h={162} label={t({ja:`リデュース ${i}\nパーティション ${i}`,en:`Reduce ${i}\nPartition ${i}`})} tone={i===0?"coral":i===1?"teal":"amber"} opacity={progress(frame,cues[1]+i*5,18)} />)}
    <Abs x={732} y={285} w={590} h={390} style={{opacity:progress(frame,cues[1],18)*(1-progress(frame,cues[2],18))}}><Card tone="soft" style={{width:"100%",height:"100%",padding:32,boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><div style={{fontFamily:fonts.serif,fontSize:54,fontWeight:650,color:colors.ink}}>{t({ja:"RPCシャッフル",en:"RPC Shuffle"})}</div><div style={{marginTop:30,display:"grid",gridTemplateColumns:"1fr",gap:18,width:"90%"}}>{[0,1,2].map((p)=><div key={p} style={{height:42,borderRadius:999,background:p===0?colors.coralSoft:p===1?colors.tealSoft:colors.amberSoft,border:`3px solid ${colorsBy[p]}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fonts.mono,fontSize:28,fontWeight:800,color:colors.body}}>P{p}</div>)}</div></Card></Abs>
    <Svg>{maps.flatMap((m,mi)=>reducers.map((r,pi)=><Packet key={`${mi}-${pi}`} x1={m.x+455} y1={m.y+148} x2={r.x} y2={r.y+148} start={cues[1]+12+mi*7+pi*9} dur={42} color={colorsBy[pi]} label={`P${pi}`} r={15} />))}</Svg>
    <Abs x={727} y={285} w={600} h={430} style={{opacity:progress(frame,cues[2],18)}}><Card tone="soft" style={{width:"100%",height:"100%",padding:34,boxSizing:"border-box"}}><div style={{fontFamily:fonts.serif,fontSize:50,textAlign:"center"}}>{t({ja:"キーでソート",en:"Sort by key"})}</div><div style={{fontFamily:fonts.sans,fontSize:28,fontWeight:700,color:colors.body,textAlign:"center",marginTop:6}}>{t({ja:"（パーティションごと）",en:"(within each partition)"})}</div>{[{p:0,keys:"apple, apple"},{p:1,keys:"cat, cat"},{p:2,keys:"banana"}].map(({p,keys})=><div key={p} style={{marginTop:18,height:64,borderRadius:12,background:p===0?colors.coralSoft:p===1?colors.tealSoft:colors.amberSoft,border:`3px solid ${colorsBy[p]}`,fontFamily:fonts.mono,fontSize:30,fontWeight:800,color:colors.body,display:"flex",alignItems:"center",gap:28,paddingLeft:24}}><span>P{p}</span><span>{keys}</span></div>)}</Card></Abs>
    <Tag at={cues[0]} x={520} y={830} tone="coral">{t({ja:"ローカルディスク上の一時データ",en:"temporary data on local disk"})}</Tag>
    <Tag at={cues[2]+10} x={1010} y={830} tone="teal">{t({ja:"同じキーをまとめて reduce() へ",en:"group equal keys for reduce()"})}</Tag>
  </SceneShell>;
}
export function FrameworkScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const steps = [{ja:"バッファ管理",en:"buffer"},{ja:"並べ替え",en:"sort"},{ja:"一時書き出し",en:"spill"},{ja:"マージ",en:"merge"}];
  return <SceneShell kicker={{ja:"抽象化",en:"Abstraction"}} title={{ja:"1行の裏側に、巨大な実装",en:"A lot hides behind one line"}}>
    <Abs x={120} y={280} w={570} h={390}><Appear at={cues[0]} style={{ width: "100%", height: "100%" }}><Card tone="dark" style={{width:"100%",height:"100%",padding:30,boxSizing:"border-box"}}><div style={{fontFamily:fonts.mono,fontSize:34,color:colors.onDark,lineHeight:1.75}}>map(key, value) &#123;<br />&nbsp;&nbsp;context.write(word, 1)<br />&#125;</div></Card></Appear></Abs>
    <Svg><Arrow x1={690} y1={475} x2={760} y2={475} p={progress(frame,cues[0]+16,20)} color={colors.coral} width={6} /></Svg>
    <Abs x={760} y={225} w={640} h={600}><Appear at={cues[1]} style={{ width: "100%", height: "100%" }}><Card tone="white" accent={colors.coral} style={{width:"100%",height:"100%",padding:30,boxSizing:"border-box"}}><div style={{fontFamily:fonts.serif,fontSize:42,fontWeight:650}}>MapTask.java</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:30}}>{steps.map((s,i)=><div key={i} style={{height:170,borderRadius:18,background:i%2?colors.tealSoft:colors.coralSoft,border:`3px solid ${i%2?colors.teal:colors.coral}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:fonts.sans,fontSize:28,fontWeight:800}}>{t(s)}</div>)}</div></Card></Appear></Abs>
    <Abs x={1450} y={245} w={350} h={580} style={{opacity:progress(frame,cues[0] + 18,18)}}><Card tone="soft" style={{width:"100%",height:"100%",padding:28,boxSizing:"border-box"}}><Stat value="2,100+" label={t({ja:"MapTask.java",en:"MapTask.java"})} /><div style={{height:30}} /><Stat value="4,100+" label={t({ja:"関連中核ファイル",en:"related core files"})} tone="teal" /></Card></Abs>
    <Tag at={cues[0]} x={165} y={710} tone="coral">{t({ja:"オープンソースHadoopで見える実態",en:"visible in open-source Hadoop"})}</Tag>
  </SceneShell>;
}

export function FaultsScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const failed = frame > cues[1];
  const workers = [0,1,2,3,4].map(i=>({x:150+i*330,y:470,w:260,h:150}));
  const master = {x:810,y:245,w:300,h:125};
  return <SceneShell kicker={{ja:"耐障害性",en:"Fault tolerance"}} title={{ja:"障害は例外ではなく、日常",en:"Failure is routine"}}>
    <Node x={master.x} y={master.y} w={master.w} h={master.h} label={t({ja:"マスター",en:"Master"})} tone="dark" opacity={1} />
    {workers.map((w,i)=><Node key={i} x={w.x} y={w.y} w={w.w} h={w.h} label={t({ja:`ワーカー\n${i+1}`,en:`Worker\n${i+1}`})} tone={i===2&&failed?"error":"muted"} opacity={1} />)}
    <Svg>{workers.map((w,i)=><Arrow key={i} x1={master.x+master.w/2} y1={master.y+master.h} x2={w.x+w.w/2} y2={w.y} p={progress(frame,cues[2]+i*4,18)} color={i===2&&failed?colors.error:colors.teal} width={5} dashed bend={0} />)}<Packet x1={master.x+master.w/2} y1={master.y+master.h} x2={workers[2].x+workers[2].w/2} y2={workers[2].y} start={cues[2]+20} dur={28} color={colors.error} label="ping" r={15} /></Svg>
    <Tag at={cues[0]} x={1190} y={285} tone="amber">{t({ja:"数千台のコモディティマシン",en:"thousands of commodity machines"})}</Tag>
    <Tag at={cues[1]} x={1190} y={370} tone="error">{t({ja:"1,800台規模では、何かが壊れる",en:"at 1,800 machines, something breaks"})}</Tag>
    <Abs x={120} y={760} w={1680} h={112}><Card tone="soft" accent={colors.coral} style={{ width: "100%", height: "100%", display:"flex", gap:22, alignItems:"center", justifyContent:"center", padding: 18, boxSizing: "border-box" }}>
      <Appear at={cues[2]}><Chip tone="amber" size={30}>{t({ja:"実行中タスク → 待機中へ戻す",en:"running tasks → back to idle"})}</Chip></Appear>
      <Appear at={cues[3]}><Chip tone="coral" size={30}>{t({ja:"完了Mapも再実行：中間出力はローカルディスク",en:"completed maps rerun: output was local"})}</Chip></Appear>
    </Card></Abs>
    <Svg><Packet x1={workers[2].x+workers[2].w/2} y1={workers[2].y+workers[2].h} x2={715} y2={790} start={cues[3]+10} dur={38} color={colors.coral} label="map output lost" r={15} /></Svg>
  </SceneShell>;
}
export function PerformanceScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  return <SceneShell kicker={{ja:"性能",en:"Performance"}} title={{ja:"ネットワークを節約し、最後まで詰める",en:"Save the network, finish the tail"}}>
    <MiniCard at={cues[0]} x={120} y={220} w={530} h={340} title={t({ja:"データローカリティ",en:"Data locality"})} body={t({ja:"計算をデータのある場所へ。",en:"Move computation to the data."})} />
    <Abs x={160} y={465} style={{opacity:progress(frame,cues[1],18)}}><Chip tone="teal" size={25}>{t({ja:"Googleの分散ファイルシステム GFS",en:"Google's distributed file system, GFS"})}</Chip></Abs>
    <Svg><Packet x1={430} y1={470} x2={790} y2={470} start={cues[1]+18} dur={28} color={colors.teal} label="local" /></Svg>
    <MiniCard at={cues[2]} x={695} y={220} w={530} h={340} title={t({ja:"Combiner",en:"Combiner"})} body={t({ja:"Word Countなら、Map側で先に集約。",en:"For Word Count, aggregate on the map side."})} tone="soft" />
    <Abs x={725} y={432} w={470} h={118} style={{display:"flex",flexDirection:"column",gap:12,opacity:progress(frame,cues[2]+16,18),alignItems:"center",justifyContent:"center"}}><div style={{display:"flex",gap:10,justifyContent:"center"}}>{[1,1,1].map((_,i)=><Chip key={i} tone="coral" size={26}>(the,1)</Chip>)}</div><div style={{display:"flex",gap:12,alignItems:"center",justifyContent:"center"}}><span style={{fontSize:30,color:colors.muted}}>→</span><Chip tone="teal" size={28}>(the,3)</Chip></div></Abs>
    <MiniCard at={cues[3]} x={1270} y={220} w={530} h={340} title={t({ja:"バックアップタスク",en:"Backup tasks"})} body={t({ja:"終盤、実行中の全タスクを別マシンでも走らせる。",en:"Near the end, every still-running task gets a copy."})} />
    {[0,1,2,3].map((i)=><Node key={i} x={1310+i*112} y={470} w={100} h={70} label={`T${i}`} tone={i<3?"teal":"amber"} opacity={progress(frame,cues[3]+i*4,18)} />)}
    <Svg><Packet x1={1650} y1={520} x2={1650} y2={640} start={cues[3]+32} dur={32} color={colors.amber} label="copy" /></Svg>
    <Abs x={165} y={645} w={1590} h={185} style={{opacity:progress(frame,cues[0] + 20,18)}}><Card tone="white" style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"space-around"}}><Stat value="1 TB" label={t({ja:"Grep / Sort",en:"Grep / Sort"})} /><Stat value="1,764" label={t({ja:"ワーカー",en:"workers"})} tone="teal" /><Stat value="150s" label={t({ja:"Grep",en:"Grep"})} tone="amber" /><Stat value="891s" label={t({ja:"Sort",en:"Sort"})} /></Card></Abs>
  </SceneShell>;
}

export function LegacyScene() {
  const frame = useCurrentFrame(); const { cues } = useScene(); const t = useT();
  const topY = 265;
  return <SceneShell kicker={{ja:"遺産",en:"Legacy"}} title={{ja:"2004年の論文から、後継技術へ",en:"From the 2004 paper to successors"}}>
    <Node x={120} y={topY} w={315} h={130} label={t({ja:"2004\nGoogle論文",en:"2004\nGoogle paper"})} tone="coral" opacity={progress(frame,2,18)} />
    <Node x={525} y={topY} w={360} h={130} label={t({ja:"2006\nHadoop",en:"2006\nHadoop"})} tone="amber" opacity={progress(frame,cues[0],18)} />
    <Node x={975} y={topY} w={360} h={130} label={t({ja:"HDFS +\nHadoop MapReduce",en:"HDFS +\nHadoop MapReduce"})} tone="teal" opacity={progress(frame,cues[1],18)} />
    <Node x={1425} y={topY} w={355} h={130} label={t({ja:"ペタバイト処理を\nGoogle以外へ",en:"Petabyte processing\nbeyond Google"})} tone="teal" opacity={progress(frame,cues[1]+18,18)} />
    <Svg><Arrow x1={435} y1={330} x2={525} y2={330} p={progress(frame,cues[0],18)} color={colors.coral} width={5}/><Arrow x1={885} y1={330} x2={975} y2={330} p={progress(frame,cues[1],18)} color={colors.teal} width={5}/><Arrow x1={1335} y1={330} x2={1425} y2={330} p={progress(frame,cues[1]+15,18)} color={colors.teal} width={5}/></Svg>
    <Abs x={120} y={500} w={760} h={340} style={{opacity:progress(frame,cues[0] + 24,18)}}><Card tone="white" accent={colors.error} style={{height:"100%",padding:32,boxSizing:"border-box"}}><div style={{fontFamily:fonts.serif,fontSize:46}}>{t({ja:"MapReduceの限界",en:"MapReduce's limits"})}</div><div style={{display:"grid",gridTemplateColumns:"1fr",gap:18,marginTop:26}}>{[{ja:"反復処理：毎回ディスクへ",en:"Iterations: write to disk each time"},{ja:"対話的クエリ：起動が重い",en:"Interactive queries: startup is heavy"},{ja:"複雑なDAG：複数ジョブに分解",en:"Complex DAGs: chained jobs"}].map(s=><Chip key={s.en} tone="error" size={26}>{t(s)}</Chip>)}</div></Card></Abs>
    <Abs x={1000} y={500} w={780} h={340} style={{opacity:progress(frame,cues[0] + 36,18)}}><Card tone="white" accent={colors.teal} style={{height:"100%",padding:32,boxSizing:"border-box"}}><div style={{fontFamily:fonts.serif,fontSize:46}}>{t({ja:"後継技術",en:"Successors"})}</div><div style={{display:"flex",gap:22,marginTop:34}}>{["Spark","Flink","Beam"].map(s=><Chip key={s} tone="teal" size={34}>{s}</Chip>)}</div><div style={{marginTop:28,fontFamily:fonts.sans,fontSize:31,color:colors.body}}>{t({ja:"メモリ、ストリーム、統一モデルへ",en:"toward memory, streams, and unified models"})}</div></Card></Abs>
  </SceneShell>;
}
export function OutroScene() {
  const frame = useCurrentFrame(); const t = useT(); const a = progress(frame, 20, 18);
  return <EndCard slug="mapreduce" headline={{ja:"シンプルな抽象化で、失敗する世界をスケールさせる。",en:"Scale a failing world through simple abstractions."}}>
    <div style={{display:"flex",gap:20,marginTop:44,opacity:a,transform:`translateY(${(1-a)*12}px)`}}>
      <Chip tone="coral" size={27}>{t({ja:"計算とインフラの分離",en:"separate computation from infrastructure"})}</Chip>
      <Chip tone="teal" size={27}>{t({ja:"障害を前提に設計",en:"design for failure"})}</Chip>
      <Chip tone="amber" size={27}>{t({ja:"記事では年表と実行デモも",en:"timeline and execution demo in the article"})}</Chip>
    </div>
  </EndCard>;
}




















































