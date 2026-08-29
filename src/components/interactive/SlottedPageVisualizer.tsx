"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Slotted page (PostgreSQL heap page) simulator.
 *
 * A real page is 8192 bytes; we use 256 here so the byte
 * offsets stay readable. The layout rules are the real ones:
 *   [ header | line pointers →   free space   ← tuples ]
 * ────────────────────────────────────────────────────────── */

const PAGE_SIZE = 256;
const HEADER_SIZE = 24; // sizeof(PageHeaderData)
const LP_SIZE = 4; // sizeof(ItemIdData)
const MAXALIGN = 8;

const align = (n: number) => Math.ceil(n / MAXALIGN) * MAXALIGN;

type LpFlag = "LP_NORMAL" | "LP_DEAD" | "LP_UNUSED";

type LinePointer = { off: number; len: number; flags: LpFlag };

type TupleBytes = { id: string; off: number; len: number; dead: boolean };

type PageState = {
  lower: number;
  upper: number;
  lps: LinePointer[];
  tuples: TupleBytes[];
};

type Op = {
  title: string;
  titleEn: string;
  code: string;
  note: string;
  noteEn: string;
  touched: string[]; // ids of highlighted regions
};

type Frame = Op & { state: PageState };

class SlottedPage {
  lower = HEADER_SIZE;
  upper = PAGE_SIZE;
  lps: LinePointer[] = [];
  tuples: TupleBytes[] = [];

  snapshot(): PageState {
    return {
      lower: this.lower,
      upper: this.upper,
      lps: this.lps.map((lp) => ({ ...lp })),
      tuples: this.tuples.map((t) => ({ ...t })),
    };
  }

  get freeSpace() {
    return this.upper - this.lower;
  }

  /** Returns the line pointer index used, or -1 when the page is full. */
  insert(id: string, rawLen: number): number {
    const len = align(rawLen);
    const reuse = this.lps.findIndex((lp) => lp.flags === "LP_UNUSED");
    const needed = reuse >= 0 ? len : len + LP_SIZE;
    if (this.freeSpace < needed) return -1;

    this.upper -= len;
    this.tuples.push({ id, off: this.upper, len, dead: false });

    if (reuse >= 0) {
      this.lps[reuse] = { off: this.upper, len, flags: "LP_NORMAL" };
      return reuse;
    }
    this.lps.push({ off: this.upper, len, flags: "LP_NORMAL" });
    this.lower += LP_SIZE;
    return this.lps.length - 1;
  }

  /** Marking a line pointer dead does NOT reclaim the tuple bytes. */
  markDead(lpIndex: number) {
    const lp = this.lps[lpIndex];
    lp.flags = "LP_DEAD";
    const t = this.tuples.find((x) => x.off === lp.off);
    if (t) t.dead = true;
  }

  /** Compaction: repack live tuples against the end of the page. */
  vacuum() {
    const live = this.tuples
      .filter((t) => !t.dead)
      .sort((a, b) => b.off - a.off);
    let cursor = PAGE_SIZE;
    for (const t of live) {
      cursor -= t.len;
      const lp = this.lps.find((l) => l.off === t.off && l.flags === "LP_NORMAL");
      t.off = cursor;
      if (lp) lp.off = cursor;
    }
    this.upper = cursor;
    this.tuples = live;
    for (const lp of this.lps) {
      if (lp.flags === "LP_DEAD") {
        lp.flags = "LP_UNUSED";
        lp.off = 0;
        lp.len = 0;
      }
    }
  }
}

function buildFrames(): Frame[] {
  const page = new SlottedPage();
  const frames: Frame[] = [];

  const record = (op: Op) => frames.push({ ...op, state: page.snapshot() });

  /**
   * `SlottedPage.insert` returns -1 when the tuple no longer fits, and silently
   * leaves the page untouched. The scripted frames below must never hit that
   * case, otherwise a caption would describe an insert that did not happen.
   */
  const insert = (id: string, rawLen: number) => {
    if (page.insert(id, rawLen) < 0) {
      throw new Error(
        `SlottedPageVisualizer: inserting ${id} (${rawLen}B) overflows the page`,
      );
    }
  };

  record({
    title: "空のページ",
    titleEn: "An empty page",
    code: `PageInit(page, 256, 0)
  pd_lower = 24    // ヘッダ直後
  pd_upper = 256   // ページ末尾`,
    note: "ページはヘッダから始まり、ラインポインタ配列が前から、タプル本体が後ろから伸びていきます。pd_lower と pd_upper に挟まれた領域が空き領域です。",
    noteEn:
      "A page starts with its header. The line-pointer array grows forward and tuple bodies grow backward; the region between pd_lower and pd_upper is free space.",
    touched: ["free"],
  });

  insert("t1", 30);
  record({
    title: "1行目を挿入（30 → 32 バイトに整列）",
    titleEn: "Insert row 1 (30 bytes → aligned to 32)",
    code: `pd_upper -= MAXALIGN(30) = 32   → 224
ItemIdData[0] = (off=224, len=32, LP_NORMAL)
pd_lower += 4                   → 28`,
    note: "タプルはページ末尾から下向きに置かれ、その位置を指すラインポインタが前から追加されます。長さは MAXALIGN（8バイト境界）に切り上げられます。",
    noteEn:
      "The tuple is placed downward from the end of the page, and a line pointer pointing at it is appended at the front. Lengths are rounded up to MAXALIGN (an 8-byte boundary).",
    touched: ["lp0", "t1"],
  });

  insert("t2", 40);
  record({
    title: "2行目を挿入（40 バイト）",
    titleEn: "Insert row 2 (40 bytes)",
    code: `pd_upper -= 40                  → 184
ItemIdData[1] = (off=184, len=40, LP_NORMAL)
pd_lower += 4                   → 32`,
    note: "行の物理位置は TID = (ブロック番号, ラインポインタ番号) で表されます。インデックスが指すのはこの TID であって、タプルのバイトオフセットではありません。",
    noteEn:
      "A row's physical location is a TID = (block number, line-pointer number). Indexes point at this TID — not at the tuple's byte offset.",
    touched: ["lp1", "t2"],
  });

  insert("t3", 24);
  record({
    title: "3行目を挿入（24 バイト）",
    titleEn: "Insert row 3 (24 bytes)",
    code: `pd_upper -= 24                  → 160
ItemIdData[2] = (off=160, len=24, LP_NORMAL)
pd_lower += 4                   → 36
free space = 160 - 36 = 124`,
    note: "空き領域は pd_upper − pd_lower で求まります。次の挿入では「タプル長 + ラインポインタ4バイト」がこの空き領域に収まるかを確認します。",
    noteEn:
      "Free space is pd_upper − pd_lower. Before the next insert, the page checks whether the tuple length plus a 4-byte line pointer still fits.",
    touched: ["lp2", "t3", "free"],
  });

  page.markDead(1);
  record({
    title: "2行目を削除（DELETE）",
    titleEn: "Delete row 2 (DELETE)",
    code: `ItemIdData[1].lp_flags = LP_DEAD
// タプルのバイトはまだページ上に残っている`,
    note: "DELETE はバイトを消しません。MVCC のもとでは、まだそのバージョンを見ているトランザクションがいるかもしれないからです。まず t_xmax が書かれ、誰からも見えなくなって初めてラインポインタが LP_DEAD になります。",
    noteEn:
      "DELETE does not erase bytes: under MVCC another transaction may still be looking at that version. First t_xmax is stamped, and only once the version is invisible to everyone does the line pointer become LP_DEAD.",
    touched: ["lp1", "t2"],
  });

  page.vacuum();
  record({
    title: "VACUUM（ページ内の詰め直し）",
    titleEn: "VACUUM (intra-page compaction)",
    code: `PageRepairFragmentation(page)
  生きているタプルをページ末尾へ詰め直す
  t1: 224 → 224   (移動なし)
  t3: 160 → 200
  ItemIdData[2].lp_off = 200
  ItemIdData[1].lp_flags = LP_UNUSED
  pd_upper = 200`,
    note: "詰め直しでタプルは移動しますが、ラインポインタ番号は変わりません。だからインデックスに記録された TID を書き換えずに済みます。これが間接参照を1段挟む最大の理由です。",
    noteEn:
      "Compaction moves tuples, but line-pointer numbers stay the same — which is why TIDs recorded in indexes never have to be rewritten. That is the whole reason for the extra level of indirection.",
    touched: ["t3", "lp1", "lp2", "free"],
  });

  insert("t4", 32);
  record({
    title: "4行目を挿入（空きスロットを再利用）",
    titleEn: "Insert row 4 (reusing a free slot)",
    code: `LP_UNUSED のスロット 1 を再利用
pd_upper -= 32                  → 168
ItemIdData[1] = (off=168, len=32, LP_NORMAL)
pd_lower は 36 のまま（配列は伸びない）
free space = 168 - 36 = 132`,
    note: "空いているラインポインタがあれば配列は伸びません。だから pd_lower は据え置きです。逆に言えば、削除と挿入を繰り返してもラインポインタ番号は再利用されるため、TID は世界で一意な識別子ではありません。",
    noteEn:
      "When a free line pointer exists the array does not grow, so pd_lower stays put. Conversely, because slot numbers are recycled across delete/insert cycles, a TID is not a globally unique row identifier.",
    touched: ["lp1", "t4"],
  });

  return frames;
}

type Segment = {
  id: string;
  kind: "header" | "lp" | "free" | "tuple" | "dead";
  start: number;
  len: number;
  label: string;
};

function segments(state: PageState): Segment[] {
  const segs: Segment[] = [
    { id: "header", kind: "header", start: 0, len: HEADER_SIZE, label: "hdr" },
  ];
  state.lps.forEach((lp, i) => {
    segs.push({
      id: `lp${i}`,
      kind: "lp",
      start: HEADER_SIZE + i * LP_SIZE,
      len: LP_SIZE,
      label: `${i}`,
    });
  });
  segs.push({
    id: "free",
    kind: "free",
    start: state.lower,
    len: state.upper - state.lower,
    label: "free",
  });
  for (const t of [...state.tuples].sort((a, b) => a.off - b.off)) {
    segs.push({
      id: t.id,
      kind: t.dead ? "dead" : "tuple",
      start: t.off,
      len: t.len,
      label: t.id,
    });
  }
  // A zero-length run (a completely full page) would otherwise render as a
  // 1px sliver and produce a nonsensical "36–35" range in the aria label.
  return segs.filter((s) => s.len > 0).sort((a, b) => a.start - b.start);
}

const SEG_STYLE: Record<Segment["kind"], string> = {
  header: "bg-slate-500/25 text-slate-700 dark:text-slate-200 border-slate-500/40",
  lp: "bg-violet-500/25 text-violet-700 dark:text-violet-200 border-violet-500/40",
  free:
    "bg-transparent text-muted-foreground border-dashed border-border",
  tuple:
    "bg-emerald-500/25 text-emerald-700 dark:text-emerald-200 border-emerald-500/40",
  dead: "bg-rose-500/25 text-rose-700 dark:text-rose-200 border-rose-500/40",
};

type Props = { locale?: string };

export function SlottedPageVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const frames = useMemo(() => buildFrames(), []);
  const player = useStepPlayer({ totalSteps: frames.length, intervalMs: 2200 });
  const f = frames[player.step];
  const segs = segments(f.state);
  const stripLabel = `${isJa ? "ページ内のバイト配置" : "Byte layout of the page"}: ${segs
    .map((seg) => `${seg.label} ${seg.start}–${seg.start + seg.len - 1}`)
    .join(", ")}`;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "スロット付きページ — 行がバイトとして置かれる場所"
          : "The Slotted Page — Where a Row Actually Lives as Bytes"
      }
      description={
        isJa
          ? "挿入・削除・VACUUM・スロット再利用を通して、pd_lower / pd_upper とラインポインタ配列がどう動くかを追います（実際は 8192 バイトですが、ここでは 256 バイトに縮めています）。"
          : "Watch pd_lower / pd_upper and the line-pointer array move through insert, delete, VACUUM and slot reuse. (A real page is 8192 bytes; here it is shrunk to 256.)"
      }
    >
      <div className="space-y-4">
        {/* Page strip */}
        <div>
          <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">
              {isJa ? "ページ（256 バイト）" : "Page (256 bytes)"}
            </span>
            <span className="font-mono">
              pd_lower = {f.state.lower} · pd_upper = {f.state.upper} ·{" "}
              {isJa ? "空き" : "free"} = {f.state.upper - f.state.lower} B
            </span>
          </div>
          <div className="overflow-x-auto">
            <div
              role="img"
              aria-label={stripLabel}
              className="flex h-14 w-full min-w-[420px] overflow-hidden rounded-lg border border-border bg-background"
            >
              {segs.map((seg) => (
                <div
                  key={seg.id}
                  style={{ width: `${(seg.len / PAGE_SIZE) * 100}%` }}
                  className={`flex min-w-0 flex-col items-center justify-center border-r text-[10px] font-mono transition-all ${SEG_STYLE[seg.kind]} ${
                    f.touched.includes(seg.id) ? "ring-2 ring-inset ring-accent" : ""
                  }`}
                  title={`${seg.label}: ${seg.start} … ${seg.start + seg.len - 1}`}
                >
                  <span className="truncate px-0.5 font-bold">{seg.label}</span>
                  <span className="truncate px-0.5">{seg.len}B</span>
                </div>
              ))}
            </div>
            <div className="mt-1 flex min-w-[420px] justify-between font-mono text-[10px] text-muted-foreground">
              <span>0</span>
              <span>64</span>
              <span>128</span>
              <span>192</span>
              <span>256</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Line pointer array */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "ラインポインタ配列（ItemIdData）" : "Line-pointer array (ItemIdData)"}
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="px-2 py-1 font-medium">
                      #
                    </th>
                    <th scope="col" className="px-2 py-1 text-right font-medium">
                      lp_off
                    </th>
                    <th scope="col" className="px-2 py-1 text-right font-medium">
                      lp_len
                    </th>
                    <th scope="col" className="px-2 py-1 font-medium">
                      lp_flags
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.state.lps.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-2 text-center italic text-muted-foreground"
                      >
                        {isJa ? "(空)" : "(empty)"}
                      </td>
                    </tr>
                  )}
                  {f.state.lps.map((lp, i) => (
                    <tr
                      key={i}
                      className={`border-b border-border/40 last:border-0 font-mono ${
                        f.touched.includes(`lp${i}`)
                          ? "bg-accent/10 font-bold text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      <td className="px-2 py-1">{i}</td>
                      <td className="px-2 py-1 text-right">
                        {lp.flags === "LP_UNUSED" ? "—" : lp.off}
                      </td>
                      <td className="px-2 py-1 text-right">
                        {lp.flags === "LP_UNUSED" ? "—" : lp.len}
                      </td>
                      <td
                        className={`px-2 py-1 ${
                          lp.flags === "LP_DEAD"
                            ? "text-rose-600 dark:text-rose-400"
                            : ""
                        }`}
                      >
                        {lp.flags}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operation */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? f.title : f.titleEn}
            </div>
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-2.5 font-mono text-[10.5px] leading-relaxed text-foreground">
              {f.code}
            </pre>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {isJa ? f.note : f.noteEn}
        </p>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
