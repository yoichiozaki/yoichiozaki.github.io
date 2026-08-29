"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Buffer pool with clock-sweep (second chance) replacement,
 * pin counts, dirty bits and the WAL "flush before write" rule.
 * The event list is produced by actually running the simulator.
 * ────────────────────────────────────────────────────────── */

const POOL_SIZE = 4;
const MAX_USAGE = 5;

type Frame = { page: string | null; usage: number; pin: number; dirty: boolean };

type Stats = { hits: number; misses: number; evictions: number; writes: number };

type Ev = {
  kind: "hit" | "miss" | "sweep" | "flush" | "load" | "unpin";
  request: string | null;
  frames: Frame[];
  hand: number;
  highlight: number | null;
  stats: Stats;
  text: string;
  textEn: string;
  why: string;
  whyEn: string;
};

type Access = {
  page: string;
  mode: "read" | "write" | "pin" | "unpin";
  why: string;
  whyEn: string;
};

const SCRIPT: Access[] = [
  {
    page: "IDX:0",
    mode: "pin",
    why: "インデックスのルートページ。走査中はずっと pin したままにする",
    whyEn: "The index root page — kept pinned for the whole scan.",
  },
  {
    page: "IDX:7",
    mode: "read",
    why: "リーフページを読み、該当する TID の一覧を得る",
    whyEn: "Read the leaf page to obtain the list of matching TIDs.",
  },
  {
    page: "HEAP:12",
    mode: "read",
    why: "TID (12, 3) の行本体を取りに行く",
    whyEn: "Fetch the row body for TID (12, 3).",
  },
  {
    page: "HEAP:85",
    mode: "read",
    why: "TID (85, 41) の行本体を取りに行く",
    whyEn: "Fetch the row body for TID (85, 41).",
  },
  {
    page: "HEAP:12",
    mode: "read",
    why: "同じページに別の行がある。今度はキャッシュに載っている",
    whyEn: "Another matching row lives on the same page — this time it is cached.",
  },
  {
    page: "HEAP:85",
    mode: "write",
    why: "この行を UPDATE した。ページが dirty になる",
    whyEn: "This row is UPDATEd, which makes the page dirty.",
  },
  {
    page: "HEAP:301",
    mode: "read",
    why: "空きフレームが無いので置換アルゴリズムが動く",
    whyEn: "No free frame is left, so the replacement algorithm kicks in.",
  },
  {
    page: "HEAP:999",
    mode: "read",
    why: "もう一度置換。時計の針は前回の続きから回る",
    whyEn: "Another replacement — the clock hand resumes where it stopped.",
  },
  {
    page: "HEAP:12",
    mode: "read",
    why: "さっき追い出したページをまた要求してしまった（スラッシング）",
    whyEn: "The page we just evicted is requested again — thrashing.",
  },
  {
    page: "IDX:0",
    mode: "unpin",
    why: "走査が終わったのでルートページを unpin する",
    whyEn: "The scan is over, so the root page is unpinned.",
  },
];

function simulate(): Ev[] {
  const frames: Frame[] = Array.from({ length: POOL_SIZE }, () => ({
    page: null,
    usage: 0,
    pin: 0,
    dirty: false,
  }));
  let hand = 0;
  const stats: Stats = { hits: 0, misses: 0, evictions: 0, writes: 0 };
  const evs: Ev[] = [];
  let why = "";
  let whyEn = "";

  const snap = (
    kind: Ev["kind"],
    request: string | null,
    highlight: number | null,
    text: string,
    textEn: string,
  ) => {
    evs.push({
      kind,
      request,
      frames: frames.map((f) => ({ ...f })),
      hand,
      highlight,
      stats: { ...stats },
      text,
      textEn,
      why,
      whyEn,
    });
  };

  for (const a of SCRIPT) {
    why = a.why;
    whyEn = a.whyEn;
    if (a.mode === "unpin") {
      const idx = frames.findIndex((f) => f.page === a.page);
      if (idx < 0) {
        // The page was evicted while it was unpinned, so there is nothing
        // left to release. Narrate that rather than claiming a pin dropped.
        snap(
          "unpin",
          a.page,
          null,
          `ReleaseBuffer(${a.page}) — このページはすでにプールに無いので、解放する pin も無い`,
          `ReleaseBuffer(${a.page}) — the page is no longer resident, so there is no pin to release.`,
        );
        continue;
      }
      const pin = Math.max(0, frames[idx].pin - 1);
      frames[idx].pin = pin;
      snap(
        "unpin",
        a.page,
        idx,
        `ReleaseBuffer(${a.page}) — pin_count が ${pin} になり、${pin === 0 ? "このフレームは置換の対象に戻る" : "まだ他の利用者が pin しているので追い出せない"}`,
        `ReleaseBuffer(${a.page}) — pin_count drops to ${pin}${pin === 0 ? ", so the frame becomes replaceable again." : "; another holder still has it pinned, so it stays unevictable."}`,
      );
      continue;
    }

    const hit = frames.findIndex((f) => f.page === a.page);
    if (hit >= 0) {
      stats.hits += 1;
      frames[hit].usage = Math.min(frames[hit].usage + 1, MAX_USAGE);
      if (a.mode === "write") frames[hit].dirty = true;
      if (a.mode === "pin") frames[hit].pin += 1;
      const extraJa =
        a.mode === "write"
          ? "。書き込みなので dirty を立てる"
          : a.mode === "pin"
            ? `。pin 要求なので pin_count を ${frames[hit].pin} に引き上げる`
            : "";
      const extraEn =
        a.mode === "write"
          ? ", and the dirty bit is set because this is a write"
          : a.mode === "pin"
            ? `, and pin_count is raised to ${frames[hit].pin} because this is a pin request`
            : "";
      snap(
        "hit",
        a.page,
        hit,
        `ハッシュ表に ${a.page} が見つかった（frame ${hit}）。ディスク I/O は発生せず、usage_count を ${frames[hit].usage} に引き上げる${extraJa}`,
        `${a.page} was found in the hash table (frame ${hit}). No disk I/O; usage_count is raised to ${frames[hit].usage}${extraEn}.`,
      );
      continue;
    }

    stats.misses += 1;
    snap(
      "miss",
      a.page,
      null,
      `BufTableLookup(${a.page}) がミス。置換対象のフレームを探す必要がある`,
      `BufTableLookup(${a.page}) missed — a frame must be found to hold it.`,
    );

    let victim = frames.findIndex((f) => f.page === null);
    if (victim >= 0) {
      snap(
        "sweep",
        a.page,
        victim,
        `frame ${victim} はまだ空なのでフリーリストから取得。時計の針は動かさない`,
        `frame ${victim} is still empty, so it is taken from the free list — the clock hand does not move.`,
      );
    } else {
      let guard = 0;
      for (;;) {
        guard += 1;
        if (guard > POOL_SIZE * (MAX_USAGE + 2)) {
          throw new Error("clock sweep: every frame is pinned");
        }
        const cur = hand;
        const f = frames[cur];
        hand = (hand + 1) % POOL_SIZE;
        if (f.pin > 0) {
          snap(
            "sweep",
            a.page,
            cur,
            `frame ${cur} (${f.page}) は pin_count = ${f.pin} なので追い出せない。針を進める`,
            `frame ${cur} (${f.page}) has pin_count = ${f.pin}, so it cannot be evicted — advance the hand.`,
          );
          continue;
        }
        if (f.usage > 0) {
          f.usage -= 1;
          snap(
            "sweep",
            a.page,
            cur,
            `frame ${cur} (${f.page}) の usage_count を ${f.usage + 1} → ${f.usage} に下げ、猶予を与えて針を進める`,
            `frame ${cur} (${f.page}): usage_count drops ${f.usage + 1} → ${f.usage}. It gets a second chance; advance the hand.`,
          );
          continue;
        }
        snap(
          "sweep",
          a.page,
          cur,
          `frame ${cur} (${f.page}) は usage_count = 0 かつ未 pin。犠牲フレームに決定`,
          `frame ${cur} (${f.page}) has usage_count = 0 and is unpinned — it becomes the victim.`,
        );
        victim = cur;
        break;
      }
    }

    const f = frames[victim];
    if (f.dirty) {
      stats.writes += 1;
      snap(
        "flush",
        a.page,
        victim,
        `犠牲の ${f.page} は dirty。WAL 先行書き込み規則により、まずこのページの LSN まで WAL を fsync し、その後でデータページを書き出す`,
        `The victim ${f.page} is dirty. Per the write-ahead-logging rule, WAL is fsync'd up to this page's LSN first, and only then is the data page written out.`,
      );
      f.dirty = false;
    }
    if (f.page !== null) stats.evictions += 1;

    const evicted = f.page;
    f.page = a.page;
    f.usage = 1;
    f.pin = a.mode === "pin" ? 1 : 0;
    f.dirty = a.mode === "write";
    snap(
      "load",
      a.page,
      victim,
      `${evicted ? `${evicted} を追い出し、` : ""}smgrread() で ${a.page} を frame ${victim} に読み込む。usage_count = 1${a.mode === "pin" ? "、pin したまま返す" : ""}`,
      `${evicted ? `${evicted} is evicted and ` : ""}smgrread() loads ${a.page} into frame ${victim}. usage_count = 1${a.mode === "pin" ? "; it is returned still pinned" : ""}.`,
    );
  }

  return evs;
}

const KIND_CHIP: Record<Ev["kind"], string> = {
  hit: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  miss: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
  sweep: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  flush:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40",
  load: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40",
  unpin:
    "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/40",
};

type Props = { locale?: string };

export function BufferPoolVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const events = useMemo(() => simulate(), []);
  const player = useStepPlayer({ totalSteps: events.length, intervalMs: 1300 });
  const ev = events[player.step];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "バッファプールと clock-sweep 置換"
          : "The Buffer Pool and Clock-Sweep Replacement"
      }
      description={
        isJa
          ? "4フレームのバッファプールに対する実行エンジンからのページ要求を1イベントずつ追います。pin されたページが追い出されないこと、dirty なページの追い出しが WAL の flush を伴うことに注目してください。"
          : "Page requests from the execution engine against a four-frame buffer pool, one event at a time. Note that pinned pages are never evicted, and that evicting a dirty page forces a WAL flush first."
      }
    >
      <div className="space-y-4">
        {/* Frames */}
        <div>
          <div className="mb-1 flex items-baseline justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold uppercase tracking-wide">
              {isJa ? "バッファフレーム" : "Buffer frames"}
            </span>
            <span className="font-mono">
              {isJa ? "要求中" : "request"}:{" "}
              <span className="font-bold text-foreground">
                {ev.request ?? "—"}
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ev.frames.map((f, i) => {
              const isHand = i === ev.hand;
              const isHi = i === ev.highlight;
              return (
                <div
                  key={i}
                  aria-current={isHi ? "true" : undefined}
                  className={`rounded-lg border p-2 transition-colors ${
                    isHi
                      ? "border-accent bg-accent/10"
                      : f.page === null
                        ? "border-dashed border-border"
                        : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      frame {i}
                    </span>
                    {isHand && (
                      <span
                        role="img"
                        aria-label={isJa ? "時計の針" : "clock hand"}
                        className="font-mono text-[10px] font-bold text-accent"
                        title={isJa ? "時計の針" : "clock hand"}
                      >
                        ▼
                      </span>
                    )}
                  </div>
                  <div
                    className={`mt-0.5 truncate font-mono text-xs font-bold ${
                      f.page === null ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {f.page ?? (isJa ? "(空)" : "(empty)")}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                      usage {f.usage}
                    </span>
                    <span
                      className={`rounded px-1 font-mono text-[10px] ${
                        f.pin > 0
                          ? "bg-sky-500/20 font-bold text-sky-700 dark:text-sky-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      pin {f.pin}
                    </span>
                    {f.dirty && (
                      <span className="rounded bg-amber-500/20 px-1 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        dirty
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          {[
            { k: isJa ? "ヒット" : "hits", v: ev.stats.hits },
            { k: isJa ? "ミス" : "misses", v: ev.stats.misses },
            { k: isJa ? "追い出し" : "evictions", v: ev.stats.evictions },
            { k: isJa ? "書き戻し" : "writebacks", v: ev.stats.writes },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-lg border border-border bg-background px-2 py-1"
            >
              <div className="font-mono text-sm font-bold text-foreground">
                {s.v}
              </div>
              <div className="text-[10px] text-muted-foreground">{s.k}</div>
            </div>
          ))}
        </div>

        {/* Current event */}
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
          <div className="mb-1 text-[11px] italic text-muted-foreground">
            {isJa ? ev.why : ev.whyEn}
          </div>
          <span
            className={`mr-2 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${KIND_CHIP[ev.kind]}`}
          >
            {ev.kind}
          </span>
          <span className="text-xs leading-relaxed text-foreground">
            {isJa ? ev.text : ev.textEn}
          </span>
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
