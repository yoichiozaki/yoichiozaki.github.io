import { useCurrentFrame } from "remotion";
import { lerp, mixColor, progress } from "../../kit/anim";
import { EndCard } from "../../kit/cards";
import { SceneShell, useScene, useT, type Bilingual } from "../../kit/scene";
import { colors, fonts } from "../../kit/theme";
import { Abs, Appear, Arrow, Card, Chip, Svg } from "../../kit/ui";

/* ------------------------------------------------------------------------ */
/* 7. The B+ tree's write cost                                               */
/* ------------------------------------------------------------------------ */

const DISK_COLS = 8;
const DISK_ROWS = 4;
const PAGE_W = 140;
const PAGE_H = 78;
const PAGE_GAP = 18;
const DISK_X = 336;
const DISK_Y = 318;

function pageXY(i: number) {
  const c = i % DISK_COLS;
  const r = Math.floor(i / DISK_COLS);
  return { x: DISK_X + c * (PAGE_W + PAGE_GAP), y: DISK_Y + r * (PAGE_H + PAGE_GAP) };
}

export function WriteCostScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const events = [9, 22, 4].map((page, i) => ({ page, at: cues[1] + 10 + i * 46 }));
  const splitAt = cues[2] + 8;
  const splitPages = [13, 14, 27];
  const amp = progress(frame, cues[2] + 70, 24);

  const phaseOf = (start: number) => {
    const d = frame - start;
    if (d < 0) return -1;
    if (d < 13) return 0;
    if (d < 26) return 1;
    if (d < 39) return 2;
    return 3;
  };
  const phaseColor = ["#d4ece6", colors.amberSoft, colors.coral, colors.coralSoft];
  const phaseBorder = [colors.teal, colors.amber, colors.coralDeep, colors.coral];
  const phaseLabel: Bilingual[] = [
    { ja: "読む", en: "read" },
    { ja: "書き換える", en: "modify" },
    { ja: "書き戻す", en: "write" },
  ];
  const current = [...events].reverse().find((e) => frame >= e.at);
  const currentPhase = current ? phaseOf(current.at) : -1;

  return (
    <SceneShell kicker={{ ja: "書き込みコスト", en: "Write cost" }} title={{ ja: "B+木は、書き込みが苦手", en: "Writes are the B+ tree's weak spot" }}>
      <Abs x={DISK_X - 36} y={DISK_Y - 76} w={DISK_COLS * (PAGE_W + PAGE_GAP) - PAGE_GAP + 72} h={DISK_ROWS * (PAGE_H + PAGE_GAP) - PAGE_GAP + 112}>
        <Card tone="soft" style={{ width: "100%", height: "100%" }}>
          <div style={{ position: "absolute", left: 36, top: 22, fontFamily: fonts.sans, fontSize: 26, fontWeight: 600, color: colors.muted }}>
            {t({ ja: "ディスク上のページ", en: "Pages on disk" })}
          </div>
        </Card>
      </Abs>
      {Array.from({ length: DISK_COLS * DISK_ROWS }, (_, i) => {
        const { x, y } = pageXY(i);
        const ev = events.find((e) => e.page === i);
        let bg: string = "#ffffff";
        let border: string = colors.hairlineStrong;
        if (ev) {
          const ph = phaseOf(ev.at);
          if (ph >= 0) {
            bg = phaseColor[ph];
            border = phaseBorder[ph];
          }
        }
        if (splitPages.includes(i) && frame >= splitAt) {
          const flash = progress(frame, splitAt, 10) * (1 - progress(frame, splitAt + 30, 20));
          bg = mixColor(colors.coralSoft, colors.coral, flash);
          border = colors.coralDeep;
        }
        return (
          <Abs key={i} x={x} y={y} w={PAGE_W} h={PAGE_H}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 10,
                background: bg,
                border: `3px solid ${border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.mono,
                fontSize: 20,
                color: colors.mutedSoft,
              }}
            >
              16 KB
            </div>
          </Abs>
        );
      })}
      <Svg>
        {events.slice(1).map((e, i) => {
          const a = pageXY(events[i].page);
          const b = pageXY(e.page);
          return (
            <Arrow
              key={i}
              x1={a.x + PAGE_W / 2}
              y1={a.y + PAGE_H / 2}
              x2={b.x + PAGE_W / 2}
              y2={b.y + PAGE_H / 2}
              p={progress(frame, e.at - 8, 10)}
              bend={-120}
              color={colors.coral}
              width={4}
              dashed
              opacity={1 - progress(frame, e.at + 30, 12)}
            />
          );
        })}
      </Svg>
      {current && currentPhase >= 0 && currentPhase < 3 && frame < splitAt && (
        <Abs x={pageXY(current.page).x - 10} y={pageXY(current.page).y - 52}>
          <Chip tone={currentPhase === 0 ? "teal" : currentPhase === 1 ? "amber" : "coral"} size={24}>
            {t(phaseLabel[currentPhase])}
          </Chip>
        </Abs>
      )}
      <Abs x={120} y={760} w={1680} style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        <Appear at={cues[1] + 4} until={cues[2] + 58}>
          <Chip tone="muted" size={26}>{t({ ja: "1回の挿入 ＝ ランダムな位置への Read → Modify → Write", en: "One insert = read → modify → write at a random spot" })}</Chip>
        </Appear>
      </Abs>
      <Abs x={120} y={760} w={1680} style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 26, opacity: amp, background: colors.canvas }}>
        <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>{t({ ja: "変更", en: "change" })}</span>
        <div style={{ width: 14, height: 30, background: colors.amber, borderRadius: 4 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 26 }}>100 B</span>
        <span style={{ fontFamily: fonts.sans, fontSize: 30, color: colors.muted, margin: "0 6px" }}>→</span>
        <span style={{ fontFamily: fonts.sans, fontSize: 26, color: colors.muted }}>{t({ ja: "書き込み", en: "written" })}</span>
        <div style={{ width: 360 * amp, height: 30, background: colors.coral, borderRadius: 4 }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 26 }}>16 KB</span>
        <Chip tone="coral" size={26}>{t({ ja: "書き込み増幅", en: "write amplification" })}</Chip>
      </Abs>
      <Abs x={DISK_X + 2 * (PAGE_W + PAGE_GAP)} y={DISK_Y - 64} style={{ opacity: progress(frame, splitAt, 10) * (1 - progress(frame, cues[2] + 66, 10)) }}>
        <Chip tone="error" size={24}>{t({ ja: "分割 → 複数ページを同時に更新", en: "split → several pages rewritten" })}</Chip>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 8. LSM-tree write path                                                    */
/* ------------------------------------------------------------------------ */

const WRITES = [42, 7, 88, 19, 63];
const DIVIDER_Y = 566;

export function LsmWriteScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const at = (i: number) => cues[1] + 14 + i * 30;
  const arrived = WRITES.filter((_, i) => frame >= at(i) + 18);
  const flushAt = cues[2] + 24;
  const flush = progress(frame, flushAt, 34);
  const memKeys = frame < flushAt ? [...arrived].sort((a, b) => a - b) : [];
  const sstable = progress(frame, flushAt + 20, 20);
  const full = arrived.length === WRITES.length;

  return (
    <SceneShell kicker={{ ja: "LSM-Tree", en: "LSM-tree" }} title={{ ja: "書き込みを、シーケンシャルに変える", en: "Turn every write sequential" }}>
      <Abs x={1180} y={136} w={620} style={{ textAlign: "right" }}>
        <Appear at={cues[0] + 30}>
          <Chip tone="coral" size={26}>{t({ ja: "ランダム書き込み → 追記だけ", en: "random writes → append-only" })}</Chip>
        </Appear>
      </Abs>
      <Svg>
        <line x1={120} x2={1800} y1={DIVIDER_Y} y2={DIVIDER_Y} stroke={colors.hairlineStrong} strokeWidth={3} strokeDasharray="12 12" />
      </Svg>
      <Abs x={120} y={DIVIDER_Y - 50} style={{ fontFamily: fonts.sans, fontSize: 24, fontWeight: 700, color: colors.coralDeep, letterSpacing: 2 }}>
        {t({ ja: "メモリ", en: "MEMORY" })}
      </Abs>
      <Abs x={120} y={DIVIDER_Y + 18} style={{ fontFamily: fonts.sans, fontSize: 24, fontWeight: 700, color: colors.tealDeep, letterSpacing: 2 }}>
        {t({ ja: "ディスク", en: "DISK" })}
      </Abs>

      {/* incoming writes */}
      {WRITES.map((k, i) => {
        const p = progress(frame, at(i), 24);
        if (frame < at(i) - 10) return null;
        const appear = progress(frame, at(i) - 10, 10);
        return (
          <Abs key={k} x={lerp(140, 560, p)} y={lerp(300 + i * 46, 400, p)} style={{ opacity: appear * (1 - progress(frame, at(i) + 20, 6)) }}>
            <Chip tone="ink" size={24}><span style={{ fontFamily: fonts.mono }}>put {k}</span></Chip>
          </Abs>
        );
      })}

      {/* memtable */}
      <Abs x={700} y={250} w={560} h={270}>
        <Card tone="white" accent={full && frame < flushAt ? colors.error : colors.coral} style={{ width: "100%", height: "100%", padding: "22px 28px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 26, fontWeight: 600 }}>
            <span>Memtable</span>
            <span style={{ color: colors.muted, fontWeight: 500 }}>{t({ ja: "ソート済み", en: "sorted" })}</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 40, flexWrap: "wrap" }}>
            {memKeys.map((k) => {
              const idx = WRITES.indexOf(k);
              const fresh = progress(frame, at(idx) + 18, 10);
              return (
                <div
                  key={k}
                  style={{
                    width: 82,
                    height: 70,
                    borderRadius: 10,
                    background: mixColor(colors.coral, colors.coralSoft, fresh),
                    border: `3px solid ${colors.coral}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {k}
                </div>
              );
            })}
          </div>
          {full && frame < flushAt && (
            <div style={{ marginTop: 22, fontFamily: fonts.sans, fontSize: 22, fontWeight: 700, color: colors.error }}>
              {t({ ja: "満杯 → フラッシュ", en: "full → flush" })}
            </div>
          )}
        </Card>
      </Abs>

      {/* WAL */}
      <Abs x={300} y={640} w={860} h={190}>
        <Card tone="soft" style={{ width: "100%", height: "100%", padding: "20px 26px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.sans, fontSize: 26, fontWeight: 600 }}>
            WAL <span style={{ color: colors.muted, fontWeight: 500 }}>{t({ ja: "（追記のみ）", en: "(append-only)" })}</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
            {WRITES.map((k, i) => {
              const p = progress(frame, at(i) + 14, 10);
              return (
                <div
                  key={k}
                  style={{
                    width: 120,
                    height: 62,
                    borderRadius: 8,
                    background: colors.tealSoft,
                    border: `3px solid ${colors.teal}`,
                    opacity: p,
                    transform: `translateX(${(1 - p) * -30}px)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: fonts.mono,
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  {k}
                </div>
              );
            })}
            <div style={{ fontFamily: fonts.sans, fontSize: 34, color: colors.tealDeep, alignSelf: "center", opacity: progress(frame, at(0) + 14, 10) }}>→</div>
          </div>
        </Card>
      </Abs>

      {/* flush: memtable contents fall into an immutable SSTable */}
      {frame >= flushAt && (
        <Abs x={lerp(730, 1310, flush)} y={lerp(330, 680, flush)} style={{ opacity: 1 - sstable }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[7, 19, 42, 63, 88].map((k) => (
              <div key={k} style={{ width: 70, height: 58, borderRadius: 8, background: colors.coral, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 700 }}>
                {k}
              </div>
            ))}
          </div>
        </Abs>
      )}
      <Abs x={1240} y={640} w={560} h={190} style={{ opacity: sstable, transform: `translateY(${(1 - sstable) * 12}px)` }}>
        <Card tone="white" accent={colors.tealDeep} style={{ width: "100%", height: "100%", padding: "20px 26px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.sans, fontSize: 26, fontWeight: 600 }}>
            <span>SSTable · L0</span>
            <span style={{ color: colors.tealDeep }}>{t({ ja: "ソート済み・不変", en: "sorted · immutable" })}</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 26 }}>
            {[7, 19, 42, 63, 88].map((k) => (
              <div key={k} style={{ width: 86, height: 58, borderRadius: 8, background: colors.tealSoft, border: `3px solid ${colors.teal}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.mono, fontSize: 24, fontWeight: 700 }}>
                {k}
              </div>
            ))}
          </div>
        </Card>
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 9. Compaction                                                             */
/* ------------------------------------------------------------------------ */

const AXIS_X = 260;
const AXIS_W = 820;
const kx = (k: number) => AXIS_X + (k / 100) * AXIS_W;

function RangeBar({ from, to, y, tone, label, opacity = 1, dy = 0 }: { from: number; to: number; y: number; tone: string; label?: string; opacity?: number; dy?: number }) {
  return (
    <Abs x={kx(from)} y={y + dy} w={kx(to) - kx(from) - 6} h={44} style={{ opacity }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          background: tone,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.mono,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </Abs>
  );
}

export function CompactionScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const merge = progress(frame, cues[0] + 40, 40);
  const refreshed = progress(frame, cues[0] + 80, 16);
  const cards = [progress(frame, cues[1] + 6, 18), progress(frame, cues[1] + 80, 18)];
  const travel = (i: number) => progress(frame, cues[2] + 20 + i * 40, 26);
  const L0 = [
    { from: 4, to: 58, y: 262 },
    { from: 22, to: 76, y: 316 },
    { from: 38, to: 96, y: 370 },
  ];
  const L1 = [0, 25, 50, 75];
  const L2 = Array.from({ length: 10 }, (_, i) => i * 10);
  const rowLabel = (text: string, y: number) => (
    <Abs x={120} y={y} w={120} style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: colors.body }}>
      {text}
    </Abs>
  );
  const rewrite = travel(0) > 0 ? 1 + (travel(1) >= 1 ? 1 : 0) + (travel(2) >= 1 ? 1 : 0) : 0;
  const tokenY = travel(2) > 0 ? lerp(560, 700, travel(2)) : travel(1) > 0 ? lerp(330, 560, travel(1)) : lerp(250, 330, travel(0));

  return (
    <SceneShell kicker={{ ja: "コンパクション", en: "Compaction" }} title={{ ja: "マージソートで、まとめ直す", en: "Merge-sort files into the next level" }}>
      {rowLabel("L0", 318)}
      {rowLabel("L1", 562)}
      {rowLabel("L2", 712)}
      <Abs x={120} y={754} w={140} style={{ fontFamily: fonts.sans, fontSize: 20, color: colors.muted }}>{t({ ja: "≈ L1 の10倍", en: "≈ 10 × L1" })}</Abs>
      {L0.map((f, i) => (
        <RangeBar key={i} from={f.from} to={f.to} y={f.y} tone={colors.amber} label={`${f.from}–${f.to}`} opacity={1 - merge} dy={merge * (556 - f.y)} />
      ))}
      <RangeBar from={10} to={46} y={262} tone={colors.amber} label="10–46" opacity={progress(frame, cues[1] - 10, 16)} />
      {L1.map((k, i) => (
        <RangeBar key={k} from={k} to={k + 25} y={556} tone={mixColor(colors.teal, colors.coral, (1 - refreshed) * Math.min(1, merge * 2))} label={`${k}–${k + 24}`} />
      ))}
      {L2.map((k) => (
        <RangeBar key={k} from={k} to={k + 10} y={706} tone={colors.tealDeep} />
      ))}
      <Abs x={AXIS_X} y={470} w={AXIS_W} style={{ textAlign: "center", opacity: progress(frame, cues[0] + 46, 12) * (1 - progress(frame, cues[1] - 6, 10)) }}>
        <Chip tone="coral" size={24}>{t({ ja: "重なる範囲をマージソート → 重ならないファイルへ", en: "overlapping ranges → merge-sorted, non-overlapping files" })}</Chip>
      </Abs>

      {/* rewrite counter for a single key */}
      {travel(0) > 0 && (
        <>
          <Abs x={kx(42) - 34} y={tokenY} style={{ zIndex: 5 }}>
            <Chip tone="ink" size={24}><span style={{ fontFamily: fonts.mono }}>k42</span></Chip>
          </Abs>
          <Abs x={AXIS_X} y={830} w={AXIS_W} style={{ textAlign: "center" }}>
            <Chip tone="coral" size={26}>
              {t({ ja: `ディスクへの書き込み ×${rewrite} — コンパクションの書き込み増幅`, en: `written to disk ×${rewrite} — compaction write amplification` })}
            </Chip>
          </Abs>
        </>
      )}

      {/* strategies */}
      {[
        {
          name: "Size-Tiered",
          body: { ja: "似たサイズのファイルをまとめる", en: "merges files of similar size" },
          good: { ja: "書き込みに強い", en: "favors writes" },
          who: { ja: "Cassandra（既定）", en: "Cassandra (default)" },
        },
        {
          name: "Leveled",
          body: { ja: "各レベルを約10倍ずつに保つ", en: "each level ≈ 10× the previous" },
          good: { ja: "読み取りに強い", en: "favors reads" },
          who: { ja: "RocksDB・LevelDB", en: "RocksDB · LevelDB" },
        },
      ].map((s, i) => (
        <Abs key={s.name} x={1210} y={250 + i * 290} w={590} h={250} style={{ opacity: cards[i], transform: `translateX(${(1 - cards[i]) * 30}px)` }}>
          <Card tone="white" style={{ width: "100%", height: "100%", padding: "26px 30px", boxSizing: "border-box" }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 40, fontWeight: 600 }}>{s.name}</div>
            <div style={{ marginTop: 10, fontFamily: fonts.sans, fontSize: 26, color: colors.body }}>{t(s.body)}</div>
            <div style={{ marginTop: 22, display: "flex", gap: 12 }}>
              <Chip tone="teal" size={24}>{t(s.good)}</Chip>
              <Chip tone="muted" size={24}>{t(s.who)}</Chip>
            </div>
          </Card>
        </Abs>
      ))}
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 10. LSM-tree read path                                                    */
/* ------------------------------------------------------------------------ */

type FileBox = { id: string; from: number; to: number; x: number; y: number };

export function LsmReadScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rows: { label: string; y: number; files: [number, number][] }[] = [
    { label: "L0", y: 400, files: [[30, 70], [12, 58], [5, 49]] },
    { label: "L1", y: 540, files: [[0, 24], [25, 49], [50, 74], [75, 99]] },
    { label: "L2", y: 680, files: [[0, 19], [20, 39], [40, 55], [56, 69], [70, 84], [85, 99]] },
  ];
  const files: FileBox[] = rows.flatMap((r) =>
    r.files.map(([from, to], i) => ({ id: `${r.label}-${i}`, from, to, x: 330 + i * 166, y: r.y })),
  );
  // Probe order: memtable, all three L0 files (ranges overlap), then the one file per level covering 42.
  const probes = ["mem", "L0-0", "L0-1", "L0-2", "L1-1", "L2-2"];
  const s0 = cues[0] + 24;
  const step = 26;
  const probeIndex = Math.floor((frame - s0) / step);
  const verdict = (id: string): "miss" | "skip" | "found" | null => {
    const i = probes.indexOf(id);
    if (i < 0 || probeIndex < i) return null;
    if (id === "mem") return "miss";
    if (id === "L2-2") return "found";
    return "skip";
  };
  const coversKey = (f: FileBox) => f.from <= 42 && 42 <= f.to;
  const legend = progress(frame, cues[1] + 4, 18);

  const memV = verdict("mem");
  return (
    <SceneShell kicker={{ ja: "読み取り", en: "Read path" }} title={{ ja: "新しいものから順に探す", en: "Newest first, level by level" }}>
      <Abs x={120} y={262}>
        <Chip tone="ink" size={28}><span style={{ fontFamily: fonts.mono }}>get(42)</span></Chip>
      </Abs>
      <Abs x={330} y={250} w={480} h={96}>
        <Card tone="white" accent={memV ? colors.hairlineStrong : colors.coral} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", boxSizing: "border-box" }}>
          <span style={{ fontFamily: fonts.sans, fontSize: 28, fontWeight: 600 }}>Memtable</span>
          {memV && <Chip tone="muted" size={22}>{t({ ja: "なし", en: "miss" })}</Chip>}
        </Card>
      </Abs>
      {rows.map((r) => (
        <Abs key={r.label} x={170} y={r.y + 22} style={{ fontFamily: fonts.mono, fontSize: 28, fontWeight: 700, color: colors.body }}>
          {r.label}
        </Abs>
      ))}
      <Abs x={830} y={404} style={{ fontFamily: fonts.sans, fontSize: 22, color: colors.muted }}>
        {t({ ja: "← 新しい順", en: "← newest first" })}
      </Abs>
      {files.map((f) => {
        const v = verdict(f.id);
        const isL0 = f.id.startsWith("L0");
        const relevant = isL0 || coversKey(f);
        const dimmed = !relevant && probeIndex >= 4;
        const bg = v === "found" ? colors.tealSoft : v === "skip" ? colors.surfaceSoft : "#fff";
        const border = v === "found" ? colors.teal : v === "skip" ? colors.hairlineStrong : colors.hairlineStrong;
        return (
          <Abs key={f.id} x={f.x} y={f.y} w={150} h={84} style={{ opacity: dimmed ? 0.35 : 1 }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 10, background: bg, border: `3px solid ${border}`, boxSizing: "border-box", padding: "8px 10px" }}>
              <div style={{ display: "flex", gap: 3 }}>
                {Array.from({ length: 8 }, (_, b) => (
                  <div key={b} style={{ flex: 1, height: 10, borderRadius: 2, background: (b * 7 + f.from) % 3 === 0 ? colors.amber : colors.surfaceCream }} />
                ))}
              </div>
              <div style={{ marginTop: 10, fontFamily: fonts.mono, fontSize: 22, fontWeight: 600, textAlign: "center", color: colors.body }}>
                {f.from}–{f.to}
              </div>
            </div>
            {v && v !== "found" && (
              <div style={{ position: "absolute", right: -10, top: -14 }}>
                <Chip tone="muted" size={18}>{t({ ja: "読み飛ばし", en: "skip" })}</Chip>
              </div>
            )}
            {v === "found" && (
              <div style={{ position: "absolute", right: -18, top: -16 }}>
                <Chip tone="teal" size={20}>{t({ ja: "発見 ✓", en: "found ✓" })}</Chip>
              </div>
            )}
          </Abs>
        );
      })}
      <Abs x={1360} y={250} w={440} h={400} style={{ opacity: legend, transform: `translateX(${(1 - legend) * 24}px)` }}>
        <Card tone="white" style={{ width: "100%", height: "100%", padding: "28px 30px", boxSizing: "border-box" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 38, fontWeight: 600 }}>{t({ ja: "ブルームフィルタ", en: "Bloom filter" })}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 22 }}>
            {Array.from({ length: 12 }, (_, b) => (
              <div key={b} style={{ flex: 1, height: 22, borderRadius: 3, background: [1, 4, 5, 9].includes(b) ? colors.amber : colors.surfaceCream }} />
            ))}
          </div>
          <div style={{ marginTop: 30, fontFamily: fonts.sans, fontSize: 25, lineHeight: 1.5, color: colors.body }}>
            <div>
              <b style={{ color: colors.ink }}>{t({ ja: "「ない」", en: "\u201Cno\u201D" })}</b> {t({ ja: "→ 確実にない。読み飛ばす", en: "→ definitely absent: skip the file" })}
            </div>
            <div style={{ marginTop: 16 }}>
              <b style={{ color: colors.ink }}>{t({ ja: "「あるかも」", en: "\u201Cmaybe\u201D" })}</b> {t({ ja: "→ 読んで確かめる（偽陽性は通常1%以下）", en: "→ read to confirm (false positives usually ≤ 1%)" })}
            </div>
          </div>
        </Card>
      </Abs>
      <Svg>
        {probeIndex >= 0 && probeIndex < probes.length && (
          <circle
            cx={probes[probeIndex] === "mem" ? 330 + 480 - 20 : (files.find((f) => f.id === probes[probeIndex])?.x ?? 0) + 75}
            cy={probes[probeIndex] === "mem" ? 298 : (files.find((f) => f.id === probes[probeIndex])?.y ?? 0) + 42}
            r={56}
            fill="none"
            stroke={colors.coral}
            strokeWidth={4}
            opacity={0.85}
          />
        )}
      </Svg>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 11. Trade-offs                                                            */
/* ------------------------------------------------------------------------ */

export function TradeoffScene() {
  const frame = useCurrentFrame();
  const { cues } = useScene();
  const t = useT();
  const rows: { label: Bilingual; bp: Bilingual; lsm: Bilingual; win: "bp" | "lsm" | "both" }[] = [
    { label: { ja: "一点読み取り", en: "Point read" }, bp: { ja: "O(log n)・高速", en: "O(log n), fast" }, lsm: { ja: "複数レベルを探す", en: "checks several levels" }, win: "bp" },
    { label: { ja: "範囲検索", en: "Range scan" }, bp: { ja: "リーフ連結で極めて高速", en: "linked leaves, very fast" }, lsm: { ja: "マージ読み取りが必要", en: "needs merged reads" }, win: "bp" },
    { label: { ja: "書き込み", en: "Writes" }, bp: { ja: "ランダムI/O・分割コスト", en: "random I/O, split cost" }, lsm: { ja: "シーケンシャルI/Oで高速", en: "sequential I/O, fast" }, win: "lsm" },
    { label: { ja: "向く用途", en: "Best for" }, bp: { ja: "OLTP・読み取り中心", en: "OLTP, read-heavy" }, lsm: { ja: "ログ・時系列・書き込み中心", en: "logs, time series, write-heavy" }, win: "both" },
  ];
  const x0 = 120;
  const colW = [380, 650, 650];
  const rowH = 104;
  const y0 = 250;
  const bpOn = progress(frame, cues[0] + 4, 16);
  const lsmOn = progress(frame, cues[1] + 4, 16);
  const dbs = progress(frame, cues[2] + 4, 18);

  return (
    <SceneShell kicker={{ ja: "使い分け", en: "Trade-offs" }} title={{ ja: "どちらを選ぶか", en: "Which one, when?" }}>
      <Abs x={x0 + colW[0]} y={y0} w={colW[1]} h={70} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 40, fontWeight: 600, color: colors.coralDeep }}>
        {t({ ja: "B+木", en: "B+ tree" })}
      </Abs>
      <Abs x={x0 + colW[0] + colW[1]} y={y0} w={colW[2]} h={70} style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.serif, fontSize: 40, fontWeight: 600, color: colors.tealDeep }}>
        LSM-Tree
      </Abs>
      {rows.map((r, i) => {
        const y = y0 + 80 + i * rowH;
        const appear = progress(frame, cues[0] + i * 6, 14);
        const cell = (text: Bilingual, col: 1 | 2, on: number, good: boolean) => (
          <Abs x={x0 + colW[0] + (col === 2 ? colW[1] : 0) + 10} y={y + 8} w={colW[col] - 20} h={rowH - 16}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.sans,
                fontSize: 28,
                fontWeight: good ? 600 : 400,
                color: good ? colors.ink : colors.muted,
                background: good ? mixColor(colors.canvas, col === 1 ? colors.coralSoft : colors.tealSoft, on) : colors.canvas,
                border: `2px solid ${good && on > 0.5 ? (col === 1 ? colors.coral : colors.teal) : colors.hairline}`,
              }}
            >
              {t(text)}
            </div>
          </Abs>
        );
        return (
          <div key={i} style={{ opacity: appear }}>
            <Abs x={x0} y={y + 8} w={colW[0] - 20} h={rowH - 16} style={{ display: "flex", alignItems: "center", fontFamily: fonts.sans, fontSize: 28, fontWeight: 600, color: colors.body }}>
              {t(r.label)}
            </Abs>
            {cell(r.bp, 1, bpOn, r.win === "bp" || r.win === "both")}
            {cell(r.lsm, 2, lsmOn, r.win === "lsm" || r.win === "both")}
          </div>
        );
      })}
      <Abs x={x0 + colW[0]} y={y0 + 80 + 4 * rowH + 18} w={colW[1]} style={{ display: "flex", justifyContent: "center", gap: 10, opacity: dbs }}>
        {["InnoDB", "PostgreSQL", "SQLite"].map((d) => (
          <Chip key={d} tone="coral" size={24}>{d}</Chip>
        ))}
      </Abs>
      <Abs x={x0 + colW[0] + colW[1]} y={y0 + 80 + 4 * rowH + 18} w={colW[2]} style={{ display: "flex", justifyContent: "center", gap: 10, opacity: dbs }}>
        {["RocksDB", "LevelDB", "Cassandra"].map((d) => (
          <Chip key={d} tone="teal" size={24}>{d}</Chip>
        ))}
      </Abs>
    </SceneShell>
  );
}

/* ------------------------------------------------------------------------ */
/* 12. Closing                                                               */
/* ------------------------------------------------------------------------ */

export function OutroScene() {
  const frame = useCurrentFrame();
  const t = useT();
  const a = progress(frame, 24, 18);
  return (
    <EndCard slug="database-indexing" headline={{ ja: "データ構造を、ディスクI/Oの特性に合わせる。", en: "Shape the data structure around disk I/O." }}>
      <div style={{ display: "flex", gap: 22, marginTop: 44, opacity: a, transform: `translateY(${(1 - a) * 12}px)` }}>
        <Chip tone="coral" size={28}>{t({ ja: "B+木：ランダムリードを最小化", en: "B+ tree: minimize random reads" })}</Chip>
        <Chip tone="teal" size={28}>{t({ ja: "LSM-Tree：書き込みをシーケンシャルに", en: "LSM-tree: make writes sequential" })}</Chip>
      </div>
    </EndCard>
  );
}
