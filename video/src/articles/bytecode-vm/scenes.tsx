import { useCurrentFrame, useVideoConfig } from "remotion";
import { mixColor, pop, progress } from "../../kit/anim";
import { EndCard, TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Arrow, Card, Chip, Packet, Svg } from "../../kit/ui";

const CONTENT = { left: 120, top: 208, width: 1680, height: 684 };
const CODE = { ja: "コード", en: "code" };
const BYTECODE = { ja: "バイトコード", en: "bytecode" };
const VM = { ja: "VM", en: "VM" };

function cue(cues: number[], index: number, fallback: number) {
  return cues[index] ?? fallback;
}

function stageCard(props: { children: React.ReactNode; accent?: string; tone?: "card" | "soft" | "dark" | "white" }) {
  return (
    <Card
      tone={props.tone ?? "soft"}
      accent={props.accent}
      style={{ position: "absolute", left: CONTENT.left, top: CONTENT.top, width: CONTENT.width, height: CONTENT.height }}
    >
      {props.children}
    </Card>
  );
}

function Node({
  x,
  y,
  w,
  h = 108,
  label,
  sub,
  tone = "white",
  active = 0,
  done = 0,
  mono = false,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  label: string;
  sub?: string;
  tone?: "white" | "dark" | "soft" | "card";
  active?: number;
  done?: number;
  mono?: boolean;
}) {
  const border = active > 0.05 ? colors.coral : done > 0.05 ? colors.teal : colors.hairlineStrong;
  return (
    <Card
      tone={tone}
      accent={border}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        padding: "18px 22px",
        boxShadow: active > 0.05 ? "0 18px 42px rgba(204,120,92,0.20)" : undefined,
      }}
    >
      <div style={{ fontFamily: mono ? fonts.mono : fonts.sans, fontSize: 30, fontWeight: 700, color: tone === "dark" ? colors.onDark : colors.ink }}>
        {label}
      </div>
      {sub && (
        <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 23, lineHeight: 1.25, color: tone === "dark" ? colors.onDarkSoft : colors.muted }}>
          {sub}
        </div>
      )}
    </Card>
  );
}

function BigArrow({ x1, y1, x2, y2, p, label }: { x1: number; y1: number; x2: number; y2: number; p: number; label?: string }) {
  return (
    <Svg>
      <Arrow x1={x1} y1={y1} x2={x2} y2={y2} p={p} color={colors.coral} width={6} />
      {label && p > 0.55 && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 20} textAnchor="middle" fontFamily={fonts.sans} fontSize={25} fontWeight={700} fill={colors.coralDeep}>
          {label}
        </text>
      )}
    </Svg>
  );
}

function MiniStack({ x, y, values, activeIndex = -1 }: { x: number; y: number; values: string[]; activeIndex?: number }) {
  return (
    <Abs x={x} y={y} w={180} h={280}>
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 180, minHeight: 250, borderLeft: `5px solid ${colors.ink}`, borderRight: `5px solid ${colors.ink}`, borderBottom: `5px solid ${colors.ink}`, borderRadius: "0 0 16px 16px", padding: 10 }}>
        {values.map((v, i) => (
          <div
            key={`${v}-${i}`}
            style={{
              position: "absolute",
              left: 18,
              bottom: 18 + i * 58,
              width: 134,
              height: 48,
              borderRadius: 12,
              background: i === activeIndex ? colors.coral : colors.surfaceCard,
              color: i === activeIndex ? "#fff" : colors.ink,
              border: `2px solid ${i === activeIndex ? colors.coralDeep : colors.hairlineStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: fonts.mono,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {v}
          </div>
        ))}
      </div>
    </Abs>
  );
}

function ChipRow({ x, y, items }: { x: number; y: number; items: { text: string; tone?: "coral" | "teal" | "amber" | "muted" | "ink" }[] }) {
  return (
    <Abs x={x} y={y} w={1600} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {items.map((item, i) => (
        <Chip key={i} tone={item.tone ?? "muted"} size={25}>
          {item.text}
        </Chip>
      ))}
    </Abs>
  );
}

/* -------------------------------------------------------------------------- */
/* 0. Intro                                                                    */
/* -------------------------------------------------------------------------- */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = useT();
  const nodes = [
    { label: t(CODE), sub: "x = 1 + 2 * 3", x: 1090, y: 230, w: 300 },
    { label: "AST", sub: t({ ja: "構造の木", en: "structure tree" }), x: 1090, y: 365, w: 300 },
    { label: t(BYTECODE), sub: "LOAD · STORE", x: 1090, y: 500, w: 300 },
    { label: t({ ja: "インタプリタ", en: "Interpreter" }), sub: t({ ja: "取得 → 分岐", en: "fetch → dispatch" }), x: 1090, y: 635, w: 300 },
    { label: "JIT", sub: t({ ja: "ホット → ネイティブ", en: "hot → native" }), x: 1580, y: 635, w: 270 },
  ];
  return (
    <TitleCard
      title={{ ja: "バイトコードVMの仕組み", en: "Inside Bytecode VMs" }}
      subtitle={{ ja: "ソースからバイトコード、インタプリタ、そしてJITへ", en: "From source code to bytecode, interpreter, and JIT" }}
      art={
        <>
          <Svg>
            <Arrow x1={1240} y1={342} x2={1240} y2={365} p={progress(frame, 18, 18)} color={colors.coral} width={5} />
            <Arrow x1={1240} y1={477} x2={1240} y2={500} p={progress(frame, 30, 18)} color={colors.coral} width={5} />
            <Arrow x1={1240} y1={612} x2={1240} y2={635} p={progress(frame, 42, 18)} color={colors.coral} width={5} />
            <Arrow x1={1390} y1={691} x2={1580} y2={691} p={progress(frame, 54, 18)} color={colors.teal} width={5} />
            {progress(frame, 62, 14) > 0 && (
              <text
                x={1485}
                y={665}
                textAnchor="middle"
                fontFamily={fonts.sans}
                fontSize={24}
                fontWeight={700}
                fill={colors.tealDeep}
                opacity={progress(frame, 62, 14)}
              >
                {t({ ja: "ホットな部分", en: "hot code" })}
              </text>
            )}
          </Svg>
          {nodes.map((n, i) => {
            const s = pop(frame, 8 + i * 8, fps);
            return (
              <Abs key={i} x={n.x} y={n.y} w={n.w} h={112} style={{ opacity: Math.min(1, s), transform: `scale(${0.82 + 0.18 * s})` }}>
                <Node x={0} y={0} w={n.w} h={112} label={n.label} sub={n.sub} active={i === 3 ? progress(frame, 44, 16) : 0} done={i === 4 ? progress(frame, 56, 16) : 0} />
              </Abs>
            );
          })}
          <Abs x={1460} y={764} w={390} style={{ display: "flex", justifyContent: "flex-end", opacity: progress(frame, 66, 18) }}>
            <Chip tone="coral" size={26}>
              {t({ ja: "よく実行される部分だけを速くする", en: "speed up only the hot path" })}
            </Chip>
          </Abs>
        </>
      }
    />
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Execution models                                                         */
/* -------------------------------------------------------------------------- */

export function ModelsScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rows = [
    { y: 272, tone: colors.teal, title: t({ ja: "ネイティブコンパイル", en: "Native compilation" }), left: t(CODE), mid: t({ ja: "コンパイラ", en: "Compiler" }), right: t({ ja: "機械語", en: "Machine code" }), cue: cue(cues, 0, 20) },
    { y: 478, tone: colors.amber, title: t({ ja: "純粋インタプリタ", en: "Pure interpreter" }), left: t(CODE), mid: t({ ja: "毎回解析", en: "Parse each run" }), right: t({ ja: "実行", en: "Run" }), cue: cue(cues, 1, 140) },
    { y: 684, tone: colors.coral, title: t({ ja: "バイトコードVM", en: "Bytecode VM" }), left: t(CODE), mid: t(BYTECODE), right: t(VM), cue: cue(cues, 2, 280) },
  ];
  return (
    <SceneShell kicker={{ ja: "実行方式", en: "Execution model" }} title={{ ja: "二分法の間にVMがある", en: "A VM lives between the two extremes" }}>
      {stageCard({ children: null })}
      {rows.map((r, i) => {
        const a = progress(frame, cue(cues, 0, 0) + i * 10, 18);
        const p = progress(frame, r.cue + 20, 60);
        return (
          <div key={r.title} style={{ opacity: a }}>
            <Abs x={160} y={r.y - 26} w={260}>
              <Chip tone={i === 0 ? "teal" : i === 1 ? "amber" : "coral"} size={27}>
                {r.title}
              </Chip>
            </Abs>
            <Node x={500} y={r.y - 44} w={245} label={r.left} mono />
            <Node x={875} y={r.y - 44} w={300} label={r.mid} active={p > 0 && p < 0.8 ? 1 : 0} />
            <Node x={1325} y={r.y - 44} w={300} label={r.right} done={p > 0.75 ? 1 : 0} />
            <BigArrow x1={745} y1={r.y + 10} x2={875} y2={r.y + 10} p={progress(frame, r.cue + 14, 20)} />
            <BigArrow x1={1175} y1={r.y + 10} x2={1325} y2={r.y + 10} p={progress(frame, r.cue + 36, 20)} />
            <Svg>
              <Packet x1={525} y1={r.y + 88} x2={1600} y2={r.y + 88} start={r.cue + 18} dur={58} color={r.tone} r={12} label={i === 2 ? "IR" : undefined} />
            </Svg>
          </div>
        );
      })}
      <Abs x={1240} y={720} w={520} style={{ opacity: progress(frame, cue(cues, 2, 280) + 62, 16) }}>
        <Card tone="dark" style={{ padding: "18px 26px" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, color: colors.onDark }}>{t({ ja: "解析は一度だけ", en: "parse once" })}</div>
          <div style={{ marginTop: 4, fontFamily: fonts.sans, fontSize: 23, color: colors.onDarkSoft }}>{t({ ja: "移植しやすい中間表現を実行", en: "execute a portable intermediate form" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Pipeline                                                                 */
/* -------------------------------------------------------------------------- */

export function PipelineScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const steps = [
    { label: t({ ja: "字句解析", en: "Lexing" }), sub: "NAME · NUMBER", x: 500 },
    { label: t({ ja: "構文解析", en: "Parsing" }), sub: "AST", x: 810 },
    { label: t({ ja: "意味解析", en: "Semantic" }), sub: t({ ja: "スコープ / 型", en: "scope / types" }), x: 1120 },
    { label: t({ ja: "生成", en: "Codegen" }), sub: "LOAD · STORE", x: 1430 },
  ];
  const ast = progress(frame, cue(cues, 2, 150), 20);
  return (
    <SceneShell kicker={{ ja: "パイプライン", en: "Pipeline" }} title={{ ja: "ソースは段階的に命令列へ変わる", en: "Source code becomes instructions in stages" }}>
      {stageCard({ children: null })}
      <Node x={170} y={284} w={240} h={122} label={t(CODE)} sub={"x = 1 + 2 * 3"} mono active={progress(frame, cue(cues, 0, 0), 20)} />
      {steps.map((s, i) => (
        <div key={s.label} style={{ opacity: progress(frame, cue(cues, 0, 0) + 28 + i * 22, 16) }}>
          <Node x={s.x} y={284} w={245} h={122} label={s.label} sub={s.sub} active={progress(frame, cue(cues, 0, 0) + 28 + i * 22, 12) * (1 - progress(frame, cue(cues, 0, 0) + 56 + i * 22, 12))} done={progress(frame, cue(cues, 0, 0) + 58 + i * 22, 12)} />
          <BigArrow x1={i === 0 ? 410 : steps[i - 1].x + 245} y1={345} x2={s.x} y2={345} p={progress(frame, cue(cues, 0, 0) + 18 + i * 22, 16)} />
        </div>
      ))}
      <ChipRow
        x={185}
        y={484}
        items={[
          { text: 'NAME("x")', tone: "muted" },
          { text: 'EQUAL("=")', tone: "muted" },
          { text: 'NUMBER("1")', tone: "muted" },
          { text: 'PLUS("+")', tone: "muted" },
          { text: 'NUMBER("2")', tone: "muted" },
          { text: 'STAR("*")', tone: "muted" },
          { text: 'NUMBER("3")', tone: "muted" },
        ]}
      />
      <Svg style={{ opacity: ast }}>
        <Arrow x1={960} y1={606} x2={790} y2={690} p={ast} color={colors.hairlineStrong} width={5} head={false} />
        <Arrow x1={960} y1={606} x2={1130} y2={690} p={ast} color={colors.hairlineStrong} width={5} head={false} />
        <Arrow x1={1130} y1={754} x2={1052} y2={794} p={ast} color={colors.hairlineStrong} width={5} head={false} />
        <Arrow x1={1130} y1={754} x2={1212} y2={794} p={ast} color={colors.hairlineStrong} width={5} head={false} />
      </Svg>
      <div style={{ opacity: ast }}>
        <Node x={885} y={560} w={150} h={74} label="+" active={1} mono />
        <Node x={720} y={690} w={140} h={74} label="1" mono />
        <Node x={1055} y={690} w={150} h={74} label="*" active={1} mono />
        <Node x={984} y={790} w={136} h={60} label="2" mono />
        <Node x={1144} y={790} w={136} h={60} label="3" mono />
      </div>
      <Abs x={1345} y={680} w={390} style={{ opacity: progress(frame, cue(cues, 2, 150) + 28, 16) }}>
        <Chip tone="coral" size={26}>{t({ ja: "優先順位は木の形へ", en: "precedence becomes shape" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Bytecode                                                                 */
/* -------------------------------------------------------------------------- */

export function BytecodeScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rows = [
    ["0", "RESUME", "0"],
    ["2", "LOAD_CONST", "1 (7)"],
    ["4", "STORE_FAST", "0 (x)"],
    ["6", "RETURN_CONST", "None"],
  ];
  const active = frame < cue(cues, 1, 100) ? 1 : frame < cue(cues, 2, 190) ? 2 : 3;
  return (
    <SceneShell kicker={{ ja: "バイトコード", en: "Bytecode" }} title={{ ja: "VMが読むのは、命令とメタデータ", en: "The VM reads instructions plus metadata" }}>
      {stageCard({ children: null })}
      <Abs x={170} y={285} w={560} h={520}>
        <Card tone="white" style={{ height: "100%", padding: 28 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 29, color: colors.muted, marginBottom: 20 }}>def example():</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 35, color: colors.ink, marginLeft: 36 }}>x = 1 + 2 * 3</div>
          <div style={{ marginTop: 42, opacity: progress(frame, cue(cues, 0, 0), 20) }}>
            <Chip tone="teal" size={28}>{t({ ja: "定数畳み込み → 7", en: "constant folding → 7" })}</Chip>
          </div>
          <div style={{ marginTop: 120, fontFamily: fonts.sans, fontSize: 28, color: colors.muted }}>
            {t({ ja: "ソース式は、コンパイル時に短くなることがあります。", en: "The source expression may shrink at compile time." })}
          </div>
        </Card>
      </Abs>
      <Abs x={820} y={268} w={520} h={560}>
        <Card tone="dark" style={{ height: "100%", padding: 26 }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.onDarkSoft, marginBottom: 18 }}>{t(BYTECODE)}</div>
          {rows.map((r, i) => (
            <div
              key={r.join(":")}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 210px 1fr",
                alignItems: "center",
                marginBottom: 16,
                padding: "14px 16px",
                borderRadius: 14,
                background: i === active ? colors.coral : colors.darkElevated,
                color: i === active ? "#fff" : colors.onDark,
                fontFamily: fonts.mono,
                fontSize: 25,
                opacity: progress(frame, cue(cues, 1, 100) - 18 + i * 8, 12),
              }}
            >
              <span>{r[0]}</span>
              <span>{r[1]}</span>
              <span>{r[2]}</span>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={1410} y={290} w={330} h={516}>
        <Card tone="white" style={{ height: "100%", padding: 24 }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: colors.ink }}>{t({ ja: "コードオブジェクト", en: "Code object" })}</div>
          {[
            ["co_code", t({ ja: "命令列", en: "instructions" })],
            ["co_consts", "(None, 7)"],
            ["co_varnames", "('x')"],
            ["co_stacksize", "1"],
          ].map((r, i) => (
            <div key={r[0]} style={{ marginTop: 26, opacity: progress(frame, cue(cues, 1, 100) + i * 12, 16) }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.coralDeep }}>{r[0]}</div>
              <div style={{ fontFamily: fonts.sans, fontSize: 25, color: colors.body }}>{r[1]}</div>
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={852} y={768} w={456} style={{ opacity: progress(frame, cue(cues, 2, 190), 20), display: "flex", justifyContent: "center", gap: 14 }}>
        {["opcode", "oparg", "EXTENDED_ARG"].map((label, i) => (
          <Chip key={label} tone={i === 2 ? "amber" : "muted"} size={23}>
            {label}
          </Chip>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Stack versus register                                                    */
/* -------------------------------------------------------------------------- */

export function StackRegisterScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const step = frame < cue(cues, 1, 90) ? 0 : frame < cue(cues, 2, 180) ? 1 : frame < cue(cues, 3, 280) ? 2 : 3;
  const stacks = [
    ["a"],
    ["a", "b", "c"],
    ["a", "b*c"],
    ["a+b*c"],
  ];
  return (
    <SceneShell kicker={{ ja: "VMアーキテクチャ", en: "VM architecture" }} title={{ ja: "スタック型とレジスタ型", en: "Stack machine versus register machine" }}>
      <Abs x={120} y={226} w={800} h={650}>
        <Card tone="white" accent={colors.coral} style={{ height: "100%", padding: 28 }}>
          <Chip tone="coral" size={28}>{t({ ja: "スタックマシン", en: "Stack machine" })}</Chip>
          <div style={{ position: "absolute", left: 38, top: 104, width: 370 }}>
            {["LOAD a", "LOAD b", "LOAD c", "MUL", "ADD"].map((op, i) => (
              <div
                key={op}
                style={{
                  marginBottom: 16,
                  padding: "14px 18px",
                  borderRadius: 14,
                  background: i <= (step === 0 ? 0 : step === 1 ? 2 : step === 2 ? 3 : 4) ? colors.coralSoft : colors.surfaceSoft,
                  border: `2px solid ${i === (step === 0 ? 0 : step === 1 ? 2 : step === 2 ? 3 : 4) ? colors.coral : colors.hairlineStrong}`,
                  fontFamily: fonts.mono,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {op}
              </div>
            ))}
          </div>
          <MiniStack x={520} y={280} values={stacks[step]} activeIndex={stacks[step].length - 1} />
          <Abs x={42} y={554} w={700}>
            <Chip tone="muted" size={26}>{t({ ja: "LOAD / STOREが増えやすい", en: "more LOAD / STORE traffic" })}</Chip>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1000} y={226} w={800} h={650}>
        <Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 28 }}>
          <Chip tone="teal" size={28}>{t({ ja: "レジスタマシン", en: "Register machine" })}</Chip>
          <div style={{ position: "absolute", left: 42, top: 118, width: 714, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
            {[
              ["R_a", "a"],
              ["R_b", "b"],
              ["R_c", "c"],
              ["R1", step >= 2 ? "b*c" : "—"],
              ["R0", step >= 3 ? "a+b*c" : "—"],
            ].map((r, i) => (
              <div
                key={r[0]}
                style={{
                  height: 76,
                  borderRadius: 16,
                  background: i >= 3 && step >= i - 1 ? colors.tealSoft : colors.surfaceSoft,
                  border: `2px solid ${i >= 3 && step >= i - 1 ? colors.teal : colors.hairlineStrong}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  fontFamily: fonts.mono,
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                <span>{r[0]}</span>
                <span>{r[1]}</span>
              </div>
            ))}
          </div>
          <Abs x={64} y={528} w={660} h={120}>
            <div style={{ display: "flex", gap: 18 }}>
              <Chip tone={step >= 2 ? "teal" : "muted"} size={27}>MUL R1</Chip>
              <Chip tone={step >= 3 ? "teal" : "muted"} size={27}>ADD R0</Chip>
            </div>
          </Abs>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. VM loop                                                                  */
/* -------------------------------------------------------------------------- */

export function VmLoopScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const ops = ["LOAD_FAST n", "LOAD_CONST 1", "COMPARE_OP <=", "FOR_ITER", "STORE_FAST i", "JUMP_BACKWARD"];
  const active = Math.min(ops.length - 1, Math.max(0, Math.floor((frame - cue(cues, 1, 90)) / 30)));
  const loopP = progress(frame, cue(cues, 0, 0), 40);
  return (
    <SceneShell kicker={{ ja: "VMループ", en: "VM loop" }} title={{ ja: "フェッチ、デコード、ディスパッチ", en: "Fetch, decode, dispatch" }}>
      {stageCard({ children: null })}
      <Abs x={160} y={258} w={470} h={566}>
        <Card tone="dark" style={{ height: "100%", padding: 28 }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 27, color: colors.onDarkSoft, marginBottom: 18 }}>{t(BYTECODE)}</div>
          {ops.map((op, i) => (
            <div
              key={op}
              style={{
                padding: "13px 16px",
                marginBottom: 13,
                borderRadius: 12,
                background: i === active ? colors.coral : colors.darkElevated,
                color: i === active ? "#fff" : colors.onDark,
                fontFamily: fonts.mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <span style={{ color: i === active ? "#fff" : colors.onDarkSoft, marginRight: 16 }}>{String(i * 2).padStart(2, "0")}</span>
              {op}
            </div>
          ))}
        </Card>
      </Abs>
      <Abs x={748} y={280} w={430} h={430}>
        <Card tone="white" accent={colors.coral} style={{ height: "100%", borderRadius: 215, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 54, color: colors.ink }}>VM</div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              {[t({ ja: "fetch", en: "fetch" }), t({ ja: "decode", en: "decode" }), t({ ja: "dispatch", en: "dispatch" })].map((s, i) => (
                <Chip key={s} tone={i === active % 3 ? "coral" : "muted"} size={26}>{s}</Chip>
              ))}
            </div>
          </div>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={630} y1={538} x2={748} y2={496} p={loopP} color={colors.coral} width={6} />
        <Arrow x1={1178} y1={496} x2={1300} y2={360} p={progress(frame, cue(cues, 1, 90), 24)} color={colors.teal} width={6} />
        <Arrow x1={1178} y1={570} x2={1300} y2={706} p={progress(frame, cue(cues, 1, 90) + 20, 24)} color={colors.amber} width={6} />
        <Packet x1={655} y1={538} x2={1150} y2={538} start={cue(cues, 1, 90) + 8} dur={44} color={colors.coral} label="op" />
      </Svg>
      <Node x={1300} y={286} w={430} h={150} label={t({ ja: "命令ポインタ", en: "Instruction pointer" })} sub={`IP = ${active * 2}`} active={1} />
      <Node x={1300} y={476} w={430} h={150} label={t({ ja: "オペランドスタック", en: "Operand stack" })} sub={active < 2 ? "[n, 1]" : active < 4 ? "[true]" : "[i]"} done={progress(frame, cue(cues, 1, 90), 20)} />
      <Node x={1300} y={666} w={430} h={150} label={t({ ja: "ローカル変数", en: "Locals" })} sub={active < 4 ? "n=10" : "n=10, i=3"} done={progress(frame, cue(cues, 2, 180), 20)} />
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 6. Dispatch                                                                 */
/* -------------------------------------------------------------------------- */

export function DispatchScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const colW = 500;
  const cols = [
    { x: 150, title: t({ ja: "switch", en: "switch" }), tone: "amber" as const, lines: ["case LOAD_CONST", "case ADD", "case RETURN"], at: cue(cues, 0, 0) },
    { x: 710, title: t({ ja: "computed goto", en: "computed goto" }), tone: "teal" as const, lines: ["&&op_load", "&&op_add", "&&op_return"], at: cue(cues, 1, 120) },
    { x: 1270, title: t({ ja: "特殊化", en: "specialize" }), tone: "coral" as const, lines: ["BINARY_OP", "↓", "BINARY_OP_ADD_INT"], at: cue(cues, 2, 230) },
  ];
  return (
    <SceneShell kicker={{ ja: "ディスパッチ", en: "Dispatch" }} title={{ ja: "分岐の書き方だけでも速度は変わる", en: "Even dispatch style changes speed" }}>
      {cols.map((c) => (
        <Abs key={c.title} x={c.x} y={245} w={colW} h={550} style={{ opacity: progress(frame, c.at, 18) }}>
          <Card tone={c.tone === "coral" ? "white" : "soft"} accent={c.tone === "amber" ? colors.amber : c.tone === "teal" ? colors.teal : colors.coral} style={{ height: "100%", padding: 30 }}>
            <Chip tone={c.tone} size={28}>{c.title}</Chip>
            <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 24 }}>
              {c.lines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    minHeight: 78,
                    borderRadius: 16,
                    background: i === 2 && c.tone === "coral" ? colors.coralSoft : "#fff",
                    border: `2px solid ${i === 2 && c.tone === "coral" ? colors.coral : colors.hairlineStrong}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: line === "↓" ? 46 : 25,
                    fontWeight: 700,
                    color: line === "↓" ? colors.coral : colors.ink,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            {c.tone === "teal" && (
              <div style={{ marginTop: 26, fontFamily: fonts.sans, fontSize: 25, color: colors.muted }}>
                {t({ ja: "15〜25%速いという報告", en: "reported 15–25% speedup" })}
              </div>
            )}
          </Card>
        </Abs>
      ))}
      <Abs x={360} y={820} w={1200} style={{ display: "flex", justifyContent: "center", opacity: progress(frame, cue(cues, 3, 330), 20) }}>
        <Chip tone="teal" size={30}>{t({ ja: "特殊化 + 軽いフレームなど → JITなしで平均25%高速", en: "specialization + cheaper frames → 25% faster without JIT" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 7. JIT flow                                                                 */
/* -------------------------------------------------------------------------- */

export function JitFlowScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const path = [
    { x: 150, label: t({ ja: "インタプリタ", en: "Interpreter" }), sub: t(BYTECODE) },
    { x: 490, label: t({ ja: "プロファイル", en: "Profile" }), sub: t({ ja: "型 / 回数", en: "types / counts" }) },
    { x: 830, label: "JIT", sub: "IR → native" },
    { x: 1170, label: t({ ja: "ガード", en: "Guard" }), sub: "int?" },
    { x: 1510, label: t({ ja: "ネイティブ", en: "Native" }), sub: "add rax, rbx" },
  ];
  const deopt = progress(frame, cue(cues, 2, 190), 20);
  const osr = progress(frame, cue(cues, 3, 285), 22);
  return (
    <SceneShell kicker={{ ja: "JIT", en: "JIT" }} title={{ ja: "仮定して速くし、崩れたら戻る", en: "Optimize by assumption, fall back on failure" }}>
      {stageCard({ children: null })}
      {path.map((p, i) => (
        <Node key={p.label} x={p.x} y={360} w={260} h={140} label={p.label} sub={p.sub} active={progress(frame, cue(cues, 0, 0) + i * 26, 16)} done={progress(frame, cue(cues, 0, 0) + 36 + i * 26, 16)} />
      ))}
      {path.slice(0, -1).map((p, i) => (
        <BigArrow key={p.label} x1={p.x + 260} y1={430} x2={path[i + 1].x} y2={430} p={progress(frame, cue(cues, 0, 0) + 24 + i * 26, 18)} />
      ))}
      <Svg>
        <Packet x1={172} y1={548} x2={1638} y2={548} start={cue(cues, 0, 0) + 18} dur={96} color={colors.coral} label="hot" />
      </Svg>
      <Abs x={385} y={626} w={1150} h={110} style={{ opacity: progress(frame, cue(cues, 1, 90), 20) }}>
        <Card tone="dark" style={{ height: "100%", padding: "22px 34px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 27, color: colors.onDark }}>generic __add__</span>
          <span style={{ fontFamily: fonts.sans, fontSize: 38, color: colors.onDarkSoft }}>→</span>
          <span style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.teal }}>int add</span>
        </Card>
      </Abs>
      <Svg>
        <Arrow x1={1300} y1={360} x2={280} y2={360} p={deopt} color={colors.error} width={6} bend={170} dashed />
      </Svg>
      <Abs x={880} y={752} w={450} style={{ opacity: deopt }}>
        <Chip tone="error" size={28}>{t({ ja: "float → 脱最適化", en: "float → deoptimize" })}</Chip>
      </Abs>
      <Abs x={160} y={742} w={590} style={{ opacity: osr }}>
        <Card tone="white" accent={colors.teal} style={{ padding: 24 }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 700, color: colors.tealDeep }}>OSR</div>
          <div style={{ marginTop: 8, fontFamily: fonts.sans, fontSize: 25, color: colors.body }}>{t({ ja: "実行中のループをネイティブコードへ", en: "move a running loop into native code" })}</div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 8. Tiering                                                                  */
/* -------------------------------------------------------------------------- */

export function TieringScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const hotSpot = [
    ["Tier 0", t({ ja: "Interpreter", en: "Interpreter" }), "profile"],
    ["Tier 3", "C1", t({ ja: "full profile", en: "full profile" })],
    ["Tier 4", "C2", t({ ja: "aggressive", en: "aggressive" })],
  ];
  const v8 = ["Ignition", "Sparkplug", "Maglev", "TurboFan"];
  return (
    <SceneShell kicker={{ ja: "多段階JIT", en: "Tiered JIT" }} title={{ ja: "速く始めて、熱い所だけ深く最適化", en: "Start fast, optimize hot code deeply" }}>
      <Abs x={120} y={238} w={780} h={640}>
        <Card tone="white" accent={colors.teal} style={{ height: "100%", padding: 32 }}>
          <Chip tone="teal" size={28}>HotSpot</Chip>
          {hotSpot.map((row, i) => (
            <div key={row[0]} style={{ position: "absolute", left: 86 + i * 210, top: 160 + i * 90, opacity: progress(frame, cue(cues, 0, 0) + 18 + i * 10, 16) }}>
              <Node x={0} y={0} w={190} h={120} label={row[0]} sub={`${row[1]} · ${row[2]}`} done={i === 2 ? progress(frame, cue(cues, 1, 90) + 60, 16) : 0} active={i === 1 ? progress(frame, cue(cues, 1, 90) + 20, 16) : 0} />
              {i < hotSpot.length - 1 && <BigArrow x1={190} y1={60} x2={210} y2={150} p={progress(frame, cue(cues, 1, 90) + 18 + i * 24, 18)} />}
            </div>
          ))}
          <Abs x={70} y={528} w={640}>
            <Chip tone="muted" size={26}>{t({ ja: "0 → 3 → 4 が代表的な経路", en: "0 → 3 → 4 is the common path" })}</Chip>
          </Abs>
        </Card>
      </Abs>
      <Abs x={1020} y={238} w={780} h={640}>
        <Card tone="white" accent={colors.coral} style={{ height: "100%", padding: 32 }}>
          <Chip tone="coral" size={28}>V8</Chip>
          <div style={{ position: "absolute", left: 70, top: 150, width: 640 }}>
            {v8.map((name, i) => {
              const p = progress(frame, cue(cues, 0, 0) + 22 + i * 14, 16);
              return (
                <div key={name} style={{ opacity: p, transform: `translateX(${(1 - p) * 24}px)` }}>
                  <div
                    style={{
                      height: 82,
                      marginBottom: 30,
                      borderRadius: 18,
                      background: mixColor(colors.surfaceSoft, i === v8.length - 1 ? colors.coralSoft : colors.tealSoft, p),
                      border: `3px solid ${i === v8.length - 1 ? colors.coral : colors.teal}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0 30px",
                      fontFamily: fonts.sans,
                      fontSize: 31,
                      fontWeight: 700,
                    }}
                  >
                    <span>{name}</span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 24, color: colors.muted }}>{i === 0 ? "interp" : i === 1 ? "baseline" : i === 2 ? "mid" : "opt"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 9. Evolution                                                                */
/* -------------------------------------------------------------------------- */

export function EvolutionScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const points = [
    { x: 340, y: 428, year: "3.11", label: t({ ja: "特殊化", en: "specialization" }), tone: "teal" as const, at: cue(cues, 2, 160) },
    { x: 720, y: 550, year: "3.13", label: "copy-and-patch JIT", tone: "coral" as const, at: cue(cues, 2, 160) + 28 },
    { x: 1100, y: 428, year: "3.14", label: t({ ja: "末尾呼出し", en: "tail-call interpreter" }), tone: "amber" as const, at: cue(cues, 2, 160) + 56 },
    { x: 1468, y: 550, year: "WASM", label: t({ ja: "ブラウザの外へ", en: "beyond browsers" }), tone: "muted" as const, at: cue(cues, 3, 260) },
  ];
  return (
    <SceneShell kicker={{ ja: "進化", en: "Evolution" }} title={{ ja: "VMはまだ進化している", en: "VM technology is still evolving" }}>
      {stageCard({ children: null })}
      <Svg>
        <Arrow x1={210} y1={680} x2={1710} y2={680} p={progress(frame, cue(cues, 0, 0), 32)} color={colors.hairlineStrong} width={6} head={false} />
        {points.map((p, i) => (
          <Arrow key={p.year} x1={p.x + 70} y1={p.y + 90} x2={p.x + 70} y2={680} p={progress(frame, cue(cues, 0, 0) + 18 + i * 10, 18)} color={i === 3 ? colors.muted : colors.coral} width={4} head={false} dashed={i === 3} />
        ))}
      </Svg>
      <Abs x={150} y={760} w={1620} style={{ display: "flex", justifyContent: "space-between", opacity: progress(frame, cue(cues, 1, 80), 20) }}>
        <Chip tone="ink" size={27}>{t({ ja: "CPython: 安定性を重視", en: "CPython: stability first" })}</Chip>
        <Chip tone="ink" size={27}>{t({ ja: "JVM: 長期稼働サーバー", en: "JVM: long-running servers" })}</Chip>
        <Chip tone="ink" size={27}>{t({ ja: "V8: 起動と最適化", en: "V8: startup and optimization" })}</Chip>
      </Abs>
      {points.map((p, i) => {
        const base = progress(frame, cue(cues, 0, 0) + 22 + i * 10, 18);
        const hot = progress(frame, p.at, 14) * (1 - progress(frame, p.at + 70, 20));
        return (
        <Abs key={p.year} x={p.x} y={p.y} w={300} h={150} style={{ opacity: base }}>
          <Card tone="white" accent={hot > 0 ? colors.coral : p.tone === "teal" ? colors.teal : p.tone === "coral" ? colors.coral : p.tone === "amber" ? colors.amber : colors.hairlineStrong} style={{ height: "100%", padding: 24, transform: `scale(${1 + hot * 0.035})` }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 48, color: colors.ink }}>{p.year}</div>
            <div style={{ marginTop: 6, fontFamily: fonts.sans, fontSize: 24, lineHeight: 1.2, color: colors.body }}>{p.label}</div>
          </Card>
        </Abs>
        );
      })}
      <Abs x={360} y={260} w={1200} style={{ display: "flex", justifyContent: "center", opacity: progress(frame, cue(cues, 3, 260), 18) }}>
        <Chip tone="coral" size={28}>{t({ ja: "ゼロオーバーヘッドには届かなくても、差は縮まり続ける", en: "not zero overhead, but the gap keeps shrinking" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* -------------------------------------------------------------------------- */
/* 10. Outro                                                                   */
/* -------------------------------------------------------------------------- */

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  return (
    <EndCard slug="bytecode-vm" headline={{ ja: "VMの中で何が起きるか、記事で手を動かして確かめよう", en: "Try the VM internals yourself in the article" }}>
      <div style={{ marginTop: 42, display: "flex", justifyContent: "center", gap: 18, opacity: progress(frame, 20, 22) }}>
        <Chip tone="teal" size={28}>{t({ ja: "バイトコード実行", en: "bytecode execution" })}</Chip>
        <Chip tone="amber" size={28}>{t({ ja: "スタック vs レジスタ", en: "stack vs register" })}</Chip>
        <Chip tone="coral" size={28}>{t({ ja: "JIT段階昇格", en: "JIT tiering" })}</Chip>
      </div>
    </EndCard>
  );
}
