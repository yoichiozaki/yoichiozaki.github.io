import { useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, mixColor, pop, progress } from "../../kit/anim";
import { TitleCard } from "../../kit/cards";
import { SceneShell, useScene, useT } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Svg } from "../../kit/ui";
import { NODE_H, NodeBox, nodeWidth, pointerX, type NodeState } from "./tree";

/* ------------------------------------------------------------------------ */
/* Shared B+ tree used by the structure / search / range scenes              */
/* ------------------------------------------------------------------------ */

type TreeNode = { id: string; keys: number[]; cx: number; y: number; children?: string[] };

const ROOT_Y = 296;
const MID_Y = 466;
const LEAF_Y = 636;

const TREE: Record<string, TreeNode> = {
  root: { id: "root", keys: [40, 70], cx: 960, y: ROOT_Y, children: ["a", "b", "c"] },
  a: { id: "a", keys: [15, 28], cx: 400, y: MID_Y, children: ["l0", "l1", "l2"] },
  b: { id: "b", keys: [52, 60], cx: 960, y: MID_Y, children: ["l3", "l4", "l5"] },
  c: { id: "c", keys: [82, 91], cx: 1520, y: MID_Y, children: ["l6", "l7", "l8"] },
  l0: { id: "l0", keys: [5, 10], cx: 210, y: LEAF_Y },
  l1: { id: "l1", keys: [15, 21], cx: 400, y: LEAF_Y },
  l2: { id: "l2", keys: [28, 33], cx: 590, y: LEAF_Y },
  l3: { id: "l3", keys: [40, 47], cx: 770, y: LEAF_Y },
  l4: { id: "l4", keys: [52, 57], cx: 960, y: LEAF_Y },
  l5: { id: "l5", keys: [60, 66], cx: 1150, y: LEAF_Y },
  l6: { id: "l6", keys: [70, 77], cx: 1330, y: LEAF_Y },
  l7: { id: "l7", keys: [82, 88], cx: 1520, y: LEAF_Y },
  l8: { id: "l8", keys: [91, 97], cx: 1710, y: LEAF_Y },
};
const LEAVES = ["l0", "l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8"];
const INTERNAL = ["root", "a", "b", "c"];

type TreeView = {
  /** Per-node entrance progress (0..1). Missing → fully visible. */
  appear?: (id: string) => number;
  state?: (id: string) => NodeState;
  mark?: (id: string) => number | undefined;
  markTone?: "coral" | "teal";
  /** Edge highlight: returns draw progress for highlighted edges (parent→child). */
  hot?: (parent: string, child: string) => number;
  edgeOpacity?: number;
  data?: number;
  links?: number;
  hotLink?: (i: number) => number;
};

function BPlusTree({ appear, state, mark, markTone, hot, edgeOpacity = 1, data = 0, links = 0, hotLink }: TreeView) {
  const vis = (id: string) => (appear ? appear(id) : 1);
  const edges: { p: TreeNode; c: TreeNode; i: number }[] = [];
  for (const id of INTERNAL) {
    const p = TREE[id];
    p.children?.forEach((cid, i) => edges.push({ p, c: TREE[cid], i }));
  }
  return (
    <>
      <Svg>
        {edges.map(({ p, c, i }) => {
          const x1 = pointerX(p.cx, p.keys.length, i);
          const y1 = p.y + NODE_H - 4;
          const v = Math.min(vis(p.id), vis(c.id));
          const h = hot ? hot(p.id, c.id) : 0;
          return (
            <g key={`${p.id}-${c.id}`}>
              <Arrow x1={x1} y1={y1} x2={c.cx} y2={c.y - 2} p={v} color={colors.hairlineStrong} width={3} head={false} opacity={edgeOpacity} />
              {h > 0 && <Arrow x1={x1} y1={y1} x2={c.cx} y2={c.y - 2} p={h} color={colors.coral} width={6} head={false} />}
            </g>
          );
        })}
        {LEAVES.slice(0, -1).map((id, i) => {
          const a = TREE[id];
          const b = TREE[LEAVES[i + 1]];
          const y = a.y + NODE_H / 2;
          const x1 = a.cx + nodeWidth(a.keys.length) / 2 + 2;
          const x2 = b.cx - nodeWidth(b.keys.length) / 2 - 4;
          const hl = hotLink ? hotLink(i) : 0;
          return (
            <g key={id}>
              <Arrow x1={x1} y1={y} x2={x2} y2={y} p={Math.min(1, Math.max(0, links * 9 - i))} color={colors.amber} width={4} />
              {hl > 0 && <Arrow x1={x1} y1={y} x2={x2} y2={y} p={hl} color={colors.coral} width={6} />}
            </g>
          );
        })}
      </Svg>
      {Object.values(TREE).map((n) => {
        const v = vis(n.id);
        if (v <= 0) return null;
        const isLeaf = !n.children;
        return (
          <NodeBox
            key={n.id}
            cx={n.cx}
            y={n.y + (1 - v) * 16}
            keys={n.keys}
            opacity={v}
            state={state ? state(n.id) : "normal"}
            mark={mark ? mark(n.id) : undefined}
            markTone={markTone}
            data={isLeaf ? data : 0}
          />
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 0. Title                                                                  */
/* ------------------------------------------------------------------------ */

export function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = [
    { x: 1500, y: 250, w: 170, label: "40 · 70" },
    { x: 1330, y: 400, w: 130, label: "15 · 28" },
    { x: 1500, y: 400, w: 130, label: "52 · 60" },
    { x: 1670, y: 400, w: 130, label: "82 · 91" },
  ];
  const levels = [
    { label: "Memtable", w: 210, tone: colors.coral },
    { label: "L0", w: 300, tone: colors.amber },
    { label: "L1", w: 400, tone: colors.teal },
    { label: "L2", w: 500, tone: colors.tealDeep },
  ];
  return (
    <TitleCard
      title={{ ja: "データベース\nインデックスの仕組み", en: "How Database Indexes Work" }}
      subtitle={{ ja: "B+木とLSM-Tree — 2つのデータ構造を、ディスクI/Oから読み解く", en: "B+ trees and LSM-trees, read through the lens of disk I/O" }}
      art={
        <>
          <Svg>
            {nodes.slice(1).map((n, i) => (
              <Arrow key={i} x1={1500 - 40 + i * 40} y1={300} x2={n.x} y2={n.y} p={progress(frame, 20 + i * 4, 16)} color={colors.hairlineStrong} width={3} head={false} />
            ))}
          </Svg>
          {nodes.map((n, i) => {
            const s = pop(frame, 10 + i * 5, fps);
            return (
              <Abs key={i} x={n.x - n.w / 2} y={n.y} w={n.w} h={52} style={{ opacity: Math.min(1, s), transform: `scale(${0.8 + 0.2 * s})` }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    border: `3px solid ${i === 0 ? colors.coral : colors.hairlineStrong}`,
                    background: i === 0 ? colors.coralSoft : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  {n.label}
                </div>
              </Abs>
            );
          })}
          {levels.map((l, i) => {
            const s = progress(frame, 30 + i * 6, 20);
            return (
              <Abs key={l.label} x={1500 - l.w / 2} y={560 + i * 66} w={l.w} h={48} style={{ opacity: s, transform: `translateX(${(1 - s) * 30}px)` }}>
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    background: l.tone,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 22,
                    fontWeight: 700,
                    opacity: 0.92,
                  }}
                >
                  {l.label}
                </div>
              </Abs>
            );
          })}
          <Abs x={1240} y={480} w={520} style={{ textAlign: "center", fontFamily: fonts.sans, fontSize: 22, fontWeight: 600, color: colors.mutedSoft, letterSpacing: 2, opacity: progress(frame, 40, 20) }}>
            B+ TREE · LSM-TREE
          </Abs>
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------------ */
/* 1. Full scan vs. index                                                    */
/* ------------------------------------------------------------------------ */

export function ScanScene() {
  const frame = useCurrentFrame();
  const { cues, ends } = useScene();
  const t = useT();
  const COLS = 12;
  const ROWS = 7;
  const total = COLS * ROWS;
  const sweep = progress(frame, cues[0] + 12, ends[1] - cues[0] - 12, (x) => x);
  const read = Math.floor(sweep * total);
  const right = progress(frame, cues[2] - 4, 16);
  const path = (i: number) => progress(frame, cues[2] + 18 + i * 16, 14);

  return (
    <SceneShell kicker={{ ja: "なぜインデックスか", en: "Why indexes" }} title={{ ja: "フルスキャンと、インデックス", en: "Full scan vs. index" }}>
      <Abs x={120} y={280} w={820} h={500}>
        <Card style={{ width: "100%", height: "100%", padding: "34px 40px", boxSizing: "border-box" }} tone="soft">
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 600, color: colors.ink }}>
            {t({ ja: "インデックスなし：テーブル全体を走査", en: "No index: scan the whole table" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 50px)`, gap: 9, marginTop: 30 }}>
            {Array.from({ length: total }, (_, i) => {
              const done = i < read;
              const head = i === read;
              return (
                <div
                  key={i}
                  style={{
                    width: 50,
                    height: 36,
                    borderRadius: 6,
                    background: done ? colors.coralSoft : head ? colors.coral : "#fff",
                    border: `2px solid ${done || head ? colors.coral : colors.hairlineStrong}`,
                  }}
                />
              );
            })}
          </div>
          <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>
              {t({ ja: "100万行 → 数千ページになり得る", en: "1M rows → potentially thousands of pages" })}
            </span>
            <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, color: colors.coralDeep }}>O(n)</span>
          </div>
        </Card>
      </Abs>

      <Abs x={1000} y={280} w={800} h={500} style={{ opacity: right, transform: `translateY(${(1 - right) * 20}px)` }}>
        <Card style={{ width: "100%", height: "100%", padding: "34px 40px", boxSizing: "border-box" }} tone="white">
          <div style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 600, color: colors.ink }}>
            {t({ ja: "B+木インデックス：根から葉へ", en: "B+ tree index: root to leaf" })}
          </div>
          {[0, 1, 2].map((lvl) => {
            const widths = [1, 3, 9];
            const active = path(lvl);
            return (
              <div key={lvl} style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: lvl === 0 ? 40 : 34 }}>
                {Array.from({ length: widths[lvl] }, (_, i) => {
                  const on = i === [0, 1, 4][lvl];
                  return (
                    <div
                      key={i}
                      style={{
                        width: lvl === 2 ? 58 : 120,
                        height: 44,
                        borderRadius: 8,
                        border: `3px solid ${on && active > 0 ? colors.coral : colors.hairlineStrong}`,
                        background: on ? mixColor("#ffffff", lvl === 2 ? colors.tealSoft : colors.coralSoft, active) : "#fff",
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
          <div style={{ marginTop: 46, display: "flex", alignItems: "baseline", gap: 18, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: fonts.serif, fontSize: 64, fontWeight: 600, color: colors.tealDeep }}>{t({ ja: "3〜4", en: "3–4" })}</span>
            <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>
              {t({ ja: "回のページ読み取り", en: "page reads per lookup" })}
            </span>
            <span style={{ marginLeft: "auto", fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, color: colors.tealDeep }}>O(log n)</span>
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 2. B-tree → B+ tree                                                       */
/* ------------------------------------------------------------------------ */

export function BPlusScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const order: Record<string, number> = { root: 0, a: 1, b: 1, c: 1 };
  const appear = (id: string) => progress(frame, cues[0] + 6 + (order[id] ?? 2) * 12 + (id.startsWith("l") ? Number(id.slice(1)) * 2 : 0), 14);
  const data = progress(frame, cues[1] + 10, 22);
  const links = progress(frame, cues[1] + 40, 40, (x) => x);
  const internalHi = progress(frame, cues[2], 14);

  return (
    <SceneShell kicker={{ ja: "構造", en: "Structure" }} title={{ ja: "B木から、B+木へ", en: "From the B-tree to the B+ tree" }}>
      <Abs x={1240} y={136} w={560} style={{ textAlign: "right" }}>
        <Appear at={cues[0] + 10}>
          <Chip tone="muted" size={24}>1972 · Bayer &amp; McCreight</Chip>
        </Appear>
      </Abs>
      <BPlusTree
        appear={appear}
        data={data}
        links={links}
        state={(id) => (INTERNAL.includes(id) && internalHi > 0 ? "active" : "normal")}
      />
      <Abs x={120} y={770} w={1680} style={{ display: "flex", gap: 24, justifyContent: "center" }}>
        <Appear at={cues[1] + 14}>
          <Chip tone="amber" size={26}>{t({ ja: "データはリーフだけに置く", en: "Data lives only in the leaves" })}</Chip>
        </Appear>
        <Appear at={cues[1] + 46}>
          <Chip tone="amber" size={26}>{t({ ja: "リーフ同士を連結リストでつなぐ", en: "Leaves form a linked list" })}</Chip>
        </Appear>
        <Appear at={cues[2] + 4}>
          <Chip tone="coral" size={26}>{t({ ja: "内部ノードはキーと子へのポインタだけ", en: "Internal nodes: keys + child pointers only" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 3. Fan-out: one node = one page                                           */
/* ------------------------------------------------------------------------ */

export function FanoutScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const page = progress(frame, cues[0] + 4, 18);
  const fill = progress(frame, cues[0] + 20, 50, (x) => x);
  const formula = progress(frame, cues[1] + 8, 18);
  const result = progress(frame, cues[1] + 60, 18);
  const rows = [0, 1, 2].map((i) => progress(frame, cues[2] + 6 + i * 22, 18));
  const keys = progress(frame, cues[2] + 80, 18);
  const pool = progress(frame, cues[3] + 10, 22);
  const CELLS = 72;

  const levelRows = [
    { w: 140, count: "1", label: { ja: "ルート", en: "root" } },
    { w: 470, count: "1,000", label: { ja: "内部ノード", en: "internal" } },
    { w: 800, count: "1,000,000", label: { ja: "リーフ", en: "leaves" } },
  ];

  return (
    <SceneShell kicker={{ ja: "分岐数", en: "Fan-out" }} title={{ ja: "1ノード = 1ディスクページ", en: "One node = one disk page" }}>
      <Abs x={120} y={250} w={660} h={420} style={{ opacity: page, transform: `translateY(${(1 - page) * 18}px)` }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: 30, boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 600 }}>{t({ ja: "ページ（ノード）", en: "Page (node)" })}</span>
            <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 700, color: colors.coralDeep }}>16 KB</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 6, marginTop: 24 }}>
            {Array.from({ length: CELLS }, (_, i) => {
              const on = i < fill * CELLS;
              const isKey = i % 2 === 0;
              return (
                <div
                  key={i}
                  style={{
                    height: 36,
                    borderRadius: 5,
                    background: on ? (isKey ? colors.ink : colors.coral) : colors.surfaceSoft,
                    opacity: on ? (isKey ? 0.85 : 0.9) : 1,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 22, fontFamily: fonts.sans, fontSize: 22, color: colors.muted }}>
            <span><span style={{ display: "inline-block", width: 16, height: 16, background: colors.ink, borderRadius: 3, marginRight: 8 }} />{t({ ja: "キー 8 B", en: "key 8 B" })}</span>
            <span><span style={{ display: "inline-block", width: 16, height: 16, background: colors.coral, borderRadius: 3, marginRight: 8 }} />{t({ ja: "ポインタ 8 B", en: "pointer 8 B" })}</span>
            <span style={{ marginLeft: "auto" }}>… × 1,000</span>
          </div>
        </Card>
      </Abs>
      <Abs x={120} y={700} w={660} style={{ opacity: formula }}>
        <div style={{ fontFamily: fonts.mono, fontSize: 32, color: colors.body }}>16,384 B ÷ (8 B + 8 B)</div>
        <div style={{ marginTop: 8, fontFamily: fonts.mono, fontSize: 32, color: colors.body, opacity: result }}>
          ≈ <span style={{ fontSize: 52, fontWeight: 700, color: colors.coralDeep }}>1,000</span>
          <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted, marginLeft: 14 }}>{t({ ja: "の分岐数", en: "children per node" })}</span>
        </div>
      </Abs>

      {/* Pyramid of levels */}
      {levelRows.map((r, i) => {
        const y = 270 + i * 150;
        const cx = 1300;
        const inPool = i < 2;
        return (
          <div key={i}>
            <Abs x={cx - r.w / 2} y={y} w={r.w} h={96} style={{ opacity: rows[i], transform: `translateY(${(1 - rows[i]) * 16}px)` }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 14,
                  border: `3px solid ${i === 2 ? colors.teal : colors.coral}`,
                  background: i === 2 ? colors.tealSoft : colors.coralSoft,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                }}
              >
                <span style={{ fontFamily: fonts.mono, fontSize: 34, fontWeight: 700 }}>{r.count}</span>
                <span style={{ fontFamily: fonts.sans, fontSize: 24, color: colors.body }}>{t(r.label)}</span>
              </div>
            </Abs>
            <Abs x={1730} y={y + 26} w={110} style={{ opacity: rows[i], fontFamily: fonts.sans, fontSize: 24, fontWeight: 600, color: inPool && pool > 0.5 ? colors.tealDeep : colors.coralDeep }}>
              {t({ ja: `${i + 1}回目`, en: `read ${i + 1}` })}
            </Abs>
          </div>
        );
      })}
      <Abs x={900} y={690} w={800} style={{ textAlign: "center", opacity: keys }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 30, color: colors.body }}>1,000³ = </span>
        <span style={{ fontFamily: fonts.serif, fontSize: 56, fontWeight: 600, color: colors.tealDeep }}>
          {t({ ja: "10億キー", en: "1 billion keys" })}
        </span>
      </Abs>
      {/* Buffer pool overlay */}
      <Abs x={1000} y={252} w={740} h={286} style={{ opacity: pool }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 20,
            border: `3px dashed ${colors.teal}`,
            background: "rgba(93,184,166,0.10)",
          }}
        />
      </Abs>
      <Abs x={1000} y={210} w={740} style={{ opacity: pool, fontFamily: fonts.sans, fontSize: 24, fontWeight: 700, color: colors.tealDeep }}>
        {t({ ja: "バッファプール（メモリ）にほぼ常駐", en: "Nearly always cached in the buffer pool (memory)" })}
      </Abs>
      <Abs x={900} y={806} w={800} style={{ textAlign: "center", opacity: pool }}>
        <Chip tone="teal" size={26}>{t({ ja: "実際のディスク読み取りは 1〜2 回で済むことが多い", en: "Often just 1–2 actual disk reads" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 4. Search                                                                 */
/* ------------------------------------------------------------------------ */

export function SearchScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const s0 = cues[0] + 20;
  const step = 34;
  const visit = (i: number) => progress(frame, s0 + i * step, 12);
  const state = (id: string): NodeState => {
    if (id === "root" && visit(0) > 0) return "active";
    if (id === "b" && visit(1) > 0) return "active";
    if (id === "l4" && visit(2) > 0) return "found";
    return "normal";
  };
  const hot = (p: string, c: string) => {
    if (p === "root" && c === "b") return progress(frame, s0 + 10, 22);
    if (p === "b" && c === "l4") return progress(frame, s0 + step + 10, 22);
    return 0;
  };
  const depth = progress(frame, cues[1] + 6, 20);
  const notes = [
    { x: 960 + 160, y: ROOT_Y + 8, text: "40 ≤ 57 < 70", at: s0 + 2 },
    { x: 960 + 160, y: MID_Y + 8, text: "52 ≤ 57 < 60", at: s0 + step + 2 },
  ];

  return (
    <SceneShell kicker={{ ja: "検索", en: "Search" }} title={{ ja: "ルートから、葉まで下る", en: "Descend from root to leaf" }}>
      <Abs x={1440} y={136} w={360} style={{ textAlign: "right" }}>
        <Appear at={cues[0] + 4}>
          <Chip tone="coral" size={28}>
            <span style={{ fontFamily: fonts.mono }}>key = 57</span>
          </Chip>
        </Appear>
      </Abs>
      <BPlusTree state={state} hot={hot} mark={(id) => (id === "l4" && visit(2) > 0.5 ? 1 : undefined)} data={1} links={1} />
      {notes.map((n) => (
        <Abs key={n.text} x={n.x} y={n.y} style={{ opacity: progress(frame, n.at, 12) }}>
          <Chip tone="coral" size={24}><span style={{ fontFamily: fonts.mono }}>{n.text}</span></Chip>
        </Abs>
      ))}
      <Abs x={1020} y={LEAF_Y + 104} style={{ opacity: visit(2) }}>
        <Chip tone="teal" size={24}>{t({ ja: "見つかった！", en: "found!" })}</Chip>
      </Abs>
      <Svg>
        <line x1={110} x2={1810} y1={LEAF_Y - 18} y2={LEAF_Y - 18} stroke={colors.teal} strokeWidth={3} strokeDasharray="10 10" opacity={depth} />
      </Svg>
      <Abs x={120} y={806} w={1680} style={{ textAlign: "center", opacity: depth }}>
        <Chip tone="teal" size={26}>{t({ ja: "すべてのリーフは同じ深さ ＝ どのキーでも、たどるノード数は同じ", en: "Every leaf at the same depth = same number of nodes per lookup" })}</Chip>
      </Abs>
      <Abs x={52} y={ROOT_Y} h={LEAF_Y - ROOT_Y + NODE_H} style={{ opacity: depth, display: "flex", flexDirection: "column", justifyContent: "space-between", fontFamily: fonts.mono, fontSize: 24, color: colors.tealDeep }}>
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 5. Insert & split                                                         */
/* ------------------------------------------------------------------------ */

type SplitNode = { keys: number[]; cx: number; y: number; state?: NodeState };
type SplitPhase = Record<string, SplitNode>;

// Order-4 tree (max 3 keys per node). Insert 35 → leaf split → root split.
const P0: SplitPhase = {
  root: { keys: [20, 30, 40], cx: 960, y: 300 },
  L0: { keys: [5, 12], cx: 420, y: 520 },
  L1: { keys: [20, 25], cx: 780, y: 520 },
  L2: { keys: [30, 33, 36], cx: 1140, y: 520 },
  L3: { keys: [40, 48], cx: 1500, y: 520 },
};
const P1: SplitPhase = {
  ...P0,
  L2: { keys: [30, 33, 35, 36], cx: 1140, y: 520, state: "overflow" },
};
const P2: SplitPhase = {
  root: { keys: [20, 30, 35, 40], cx: 960, y: 300, state: "overflow" },
  L0: { keys: [5, 12], cx: 330, y: 520 },
  L1: { keys: [20, 25], cx: 650, y: 520 },
  L2: { keys: [30, 33], cx: 970, y: 520 },
  L2b: { keys: [35, 36], cx: 1290, y: 520, state: "found" },
  L3: { keys: [40, 48], cx: 1610, y: 520 },
};
const P3: SplitPhase = {
  top: { keys: [35], cx: 960, y: 250, state: "found" },
  root: { keys: [20, 30], cx: 560, y: 420 },
  rootB: { keys: [40], cx: 1450, y: 420 },
  L0: { keys: [5, 12], cx: 330, y: 610 },
  L1: { keys: [20, 25], cx: 650, y: 610 },
  L2: { keys: [30, 33], cx: 970, y: 610 },
  L2b: { keys: [35, 36], cx: 1290, y: 610 },
  L3: { keys: [40, 48], cx: 1610, y: 610 },
};
const EDGES: Record<string, [string, number, string][]> = {
  P0: [["root", 0, "L0"], ["root", 1, "L1"], ["root", 2, "L2"], ["root", 3, "L3"]],
  P2: [["root", 0, "L0"], ["root", 1, "L1"], ["root", 2, "L2"], ["root", 3, "L2b"], ["root", 4, "L3"]],
  P3: [["top", 0, "root"], ["top", 1, "rootB"], ["root", 0, "L0"], ["root", 1, "L1"], ["root", 2, "L2"], ["rootB", 0, "L2b"], ["rootB", 1, "L3"]],
};

export function SplitScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const drop = progress(frame, cues[0] + 20, 26);
  const toP1 = cues[0] + 46;
  const toP2 = cues[1] + 26;
  const toP3 = cues[2] + 30;
  const m2 = progress(frame, toP2, 26);
  const m3 = progress(frame, toP3, 30);

  let a: SplitPhase = P0;
  let b: SplitPhase = P0;
  let m = 0;
  let edgeSet = EDGES.P0;
  if (frame >= toP3) {
    a = P2;
    b = P3;
    m = m3;
    edgeSet = m3 > 0.5 ? EDGES.P3 : EDGES.P2;
  } else if (frame >= toP2) {
    a = P1;
    b = P2;
    m = m2;
    edgeSet = m2 > 0.5 ? EDGES.P2 : EDGES.P0;
  } else if (frame >= toP1) {
    a = P1;
    b = P1;
  }

  const ids = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  const pos = (id: string) => {
    const na = a[id];
    const nb = b[id];
    if (na && nb) {
      return {
        keys: m < 0.5 ? na.keys : nb.keys,
        cx: lerp(na.cx, nb.cx, m),
        y: lerp(na.y, nb.y, m),
        state: (m < 0.5 ? na.state : nb.state) ?? "normal",
        op: 1,
      };
    }
    if (nb) {
      // New node: grows out of the node it was split from.
      const src = (id === "L2b" ? a.L2 : a.root) ?? nb;
      return { keys: nb.keys, cx: lerp(src.cx, nb.cx, m), y: lerp(src.y, nb.y, m), state: nb.state ?? "normal", op: m };
    }
    return { keys: na!.keys, cx: na!.cx, y: na!.y, state: na!.state ?? "normal", op: 1 - m };
  };
  const nodes = ids.map((id) => ({ id, ...pos(id) }));
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const promoteFly = frame >= toP2 && frame < toP2 + 30;
  const rootFly = frame >= toP3 && frame < toP3 + 34;

  return (
    <SceneShell kicker={{ ja: "挿入", en: "Insert" }} title={{ ja: "溢れたら、分割する", en: "Overflow? Split." }}>
      <Abs x={1400} y={136} w={400} style={{ textAlign: "right" }}>
        <Chip tone="coral" size={24}>{t({ ja: "1ノード最大 3 キー", en: "max 3 keys per node" })}</Chip>
      </Abs>
      <Svg>
        {edgeSet.map(([p, i, c]) => {
          const pn = byId[p];
          const cn = byId[c];
          if (!pn || !cn) return null;
          return (
            <Arrow
              key={`${p}-${c}`}
              x1={pointerX(pn.cx, pn.keys.length, i)}
              y1={pn.y + NODE_H - 4}
              x2={cn.cx}
              y2={cn.y - 2}
              color={colors.hairlineStrong}
              width={3}
              head={false}
              opacity={Math.min(pn.op, cn.op)}
            />
          );
        })}
      </Svg>
      {nodes.map((n) => (
        <NodeBox key={n.id} cx={n.cx} y={n.y} keys={n.keys} state={n.state as NodeState} opacity={n.op} />
      ))}
      {/* Key 35 dropping into the target leaf */}
      {frame < toP1 + 2 && (
        <Abs x={1140 - 34} y={lerp(170, 520, drop)} style={{ opacity: progress(frame, cues[0] + 8, 10) }}>
          <Chip tone="coral" size={30}><span style={{ fontFamily: fonts.mono }}>35</span></Chip>
        </Abs>
      )}
      {/* Separator key copied up to the parent */}
      {promoteFly && (
        <Abs x={lerp(1290, 1030, progress(frame, toP2, 30)) - 30} y={lerp(520, 300, progress(frame, toP2, 30))}>
          <Chip tone="teal" size={28}><span style={{ fontFamily: fonts.mono }}>35</span></Chip>
        </Abs>
      )}
      {rootFly && (
        <Abs x={960 - 30} y={lerp(300, 250, progress(frame, toP3, 34))}>
          <Chip tone="teal" size={28}><span style={{ fontFamily: fonts.mono }}>35</span></Chip>
        </Abs>
      )}
      <Abs x={120} y={760} w={1680} style={{ display: "flex", justifyContent: "center", gap: 22 }}>
        <Appear at={toP1}>
          <Chip tone="error" size={26}>{t({ ja: "リーフが溢れた（4キー）", en: "Leaf overflows (4 keys)" })}</Chip>
        </Appear>
        <Appear at={toP2 + 10}>
          <Chip tone="teal" size={26}>{t({ ja: "分割し、右リーフの先頭キーを親へコピー", en: "Split; copy the right leaf's first key up" })}</Chip>
        </Appear>
        <Appear at={toP3 + 20}>
          <Chip tone="coral" size={26}>{t({ ja: "ルート分割 → 高さ +1", en: "Root split → height + 1" })}</Chip>
        </Appear>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 6. Range scan                                                             */
/* ------------------------------------------------------------------------ */

export function RangeScene() {
  const frame = useCurrentFrame();
  const { cues, ends } = useScene();
  const t = useT();
  const s0 = cues[0] + 16;
  const descend = (i: number) => progress(frame, s0 + i * 22, 12);
  const walkStart = s0 + 60;
  const walkSpan = Math.max(60, ends[0] - walkStart - 40);
  const walk = progress(frame, walkStart, walkSpan, (x) => x);
  const leafOrder = ["l1", "l2", "l3", "l4", "l5"];
  // Five steps: hop to l2..l5, then peek at l6 (70 > 66) and stop.
  const steps = walk * 5;
  const reached = Math.min(4, Math.floor(steps + 1e-4));
  const results = [21, 28, 33, 40, 47, 52, 57, 60, 66];
  const shown = (descend(2) > 0 ? 1 : 0) + reached * 2;

  const state = (id: string): NodeState => {
    if (id === "root" && descend(0) > 0) return "visited";
    if (id === "a" && descend(1) > 0) return "visited";
    const idx = leafOrder.indexOf(id);
    if (idx === 0 && descend(2) > 0) return "found";
    if (idx > 0 && idx <= reached) return "found";
    if (id === "l6" && walk >= 1) return "dim";
    return "normal";
  };
  const hot = (p: string, c: string) => {
    if (p === "root" && c === "a") return progress(frame, s0 + 6, 18);
    if (p === "a" && c === "l1") return progress(frame, s0 + 28, 18);
    return 0;
  };
  const hotLink = (i: number) => (i >= 1 && i <= 5 ? Math.min(1, Math.max(0, steps - (i - 1))) : 0);

  return (
    <SceneShell kicker={{ ja: "範囲検索", en: "Range scan" }} title={{ ja: "見つけたら、横にたどる", en: "Find the start, then walk sideways" }}>
      <Abs x={1300} y={136} w={500} style={{ textAlign: "right" }}>
        <Appear at={cues[0] + 2}>
          <Chip tone="ink" size={24}>
            <span style={{ fontFamily: fonts.mono }}>WHERE key BETWEEN 21 AND 66</span>
          </Chip>
        </Appear>
      </Abs>
      <BPlusTree state={state} hot={hot} hotLink={hotLink} links={1} data={1} mark={(id) => (id === "l1" && descend(2) > 0 ? 1 : undefined)} />
      <Abs x={1240} y={LEAF_Y + 100} style={{ opacity: walk >= 1 ? 1 : 0 }}>
        <Chip tone="muted" size={22}><span style={{ fontFamily: fonts.mono }}>70 &gt; 66 → stop</span></Chip>
      </Abs>
      <Abs x={120} y={806} w={1680} style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
        <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted, marginRight: 10, opacity: descend(2) }}>
          {t({ ja: "結果", en: "Result" })}
        </span>
        {results.map((r, i) => (
          <span
            key={r}
            style={{
              opacity: i < shown ? 1 : 0.18,
              fontFamily: fonts.mono,
              fontSize: 30,
              fontWeight: 700,
              color: i < shown ? colors.tealDeep : colors.mutedSoft,
              padding: "6px 14px",
              borderRadius: 10,
              background: i < shown ? colors.tealSoft : "transparent",
            }}
          >
            {r}
          </span>
        ))}
      </Abs>
    </SceneShell>
  );
}
