"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Volcano / iterator model.
 *
 * The operators below are a real (if tiny) pull-based execution
 * engine. The step list shown in the UI is produced by actually
 * running it, so call counts and result rows are guaranteed to be
 * consistent with the algorithm described in the article.
 * ────────────────────────────────────────────────────────── */

type Row = Record<string, number | string>;

const USERS: Row[] = [
  { "u.id": 1, "u.name": "Ann", "u.age": 34 },
  { "u.id": 2, "u.name": "Bob", "u.age": 28 },
  { "u.id": 3, "u.name": "Cid", "u.age": 41 },
];

const ORDERS: Row[] = [
  { "o.id": 101, "o.user_id": 1, "o.total": 120 },
  { "o.id": 102, "o.user_id": 3, "o.total": 80 },
  { "o.id": 103, "o.user_id": 1, "o.total": 250 },
];

const fmt = (row: Row | null) =>
  row === null ? "NULL" : `(${Object.values(row).join(", ")})`;

type OpStat = { calls: number; rows: number; state: string; stateEn: string };

type Ev = {
  opId: string;
  kind: "open" | "call" | "return" | "eof" | "close";
  text: string;
  textEn: string;
  stack: string[];
  output: Row[];
  stats: Record<string, OpStat>;
};

const OP_IDS = ["proj", "nlj", "filter", "scan_u", "scan_o"] as const;

class Trace {
  events: Ev[] = [];
  stack: string[] = [];
  output: Row[] = [];
  stats: Record<string, OpStat> = {};

  constructor() {
    for (const id of OP_IDS) {
      this.stats[id] = { calls: 0, rows: 0, state: "—", stateEn: "—" };
    }
  }

  private snap(opId: string, kind: Ev["kind"], text: string, textEn: string) {
    const stats: Record<string, OpStat> = {};
    for (const id of OP_IDS) stats[id] = { ...this.stats[id] };
    this.events.push({
      opId,
      kind,
      text,
      textEn,
      stack: [...this.stack],
      output: this.output.map((r) => ({ ...r })),
      stats,
    });
  }

  enter(opId: string, text: string, textEn: string) {
    this.stats[opId].calls += 1;
    this.stack.push(`${opId}.next()`);
    this.snap(opId, "call", text, textEn);
  }

  leave(opId: string, row: Row | null, text: string, textEn: string) {
    if (row !== null) this.stats[opId].rows += 1;
    this.snap(opId, row === null ? "eof" : "return", text, textEn);
    this.stack.pop();
  }

  mark(opId: string, kind: Ev["kind"], text: string, textEn: string) {
    this.snap(opId, kind, text, textEn);
  }

  setState(opId: string, state: string, stateEn: string) {
    this.stats[opId].state = state;
    this.stats[opId].stateEn = stateEn;
  }
}

interface Iter {
  open(): void;
  next(): Row | null;
  close(): void;
}

class SeqScan implements Iter {
  private cursor = 0;
  constructor(
    private id: string,
    private table: string,
    private rows: Row[],
    private t: Trace,
  ) {}

  open() {
    this.cursor = 0;
    this.t.setState(this.id, "cursor = 0", "cursor = 0");
  }

  rescan() {
    this.cursor = 0;
    this.t.setState(this.id, "cursor = 0 (rescan)", "cursor = 0 (rescan)");
  }

  next(): Row | null {
    this.t.enter(
      this.id,
      `SeqScan(${this.table}).next() — カーソル位置 ${this.cursor} のタプルを読む`,
      `SeqScan(${this.table}).next() — read the tuple at cursor ${this.cursor}`,
    );
    if (this.cursor >= this.rows.length) {
      this.t.setState(this.id, "exhausted", "exhausted");
      this.t.leave(
        this.id,
        null,
        `${this.table} を読み切ったので NULL を返す（入力終端）`,
        `${this.table} is exhausted, so NULL is returned (end of input).`,
      );
      return null;
    }
    const row = this.rows[this.cursor];
    this.cursor += 1;
    this.t.setState(this.id, `cursor = ${this.cursor}`, `cursor = ${this.cursor}`);
    this.t.leave(
      this.id,
      row,
      `${fmt(row)} を1タプル返す`,
      `Returns one tuple: ${fmt(row)}`,
    );
    return row;
  }

  close() {
    this.t.setState(this.id, "closed", "closed");
  }
}

class Filter implements Iter {
  constructor(
    private id: string,
    private child: Iter,
    private pred: (r: Row) => boolean,
    private label: string,
    private t: Trace,
  ) {}

  open() {
    this.child.open();
    this.t.setState(this.id, `pred: ${this.label}`, `pred: ${this.label}`);
  }

  next(): Row | null {
    this.t.enter(
      this.id,
      `Filter(${this.label}).next() — 条件を満たすタプルが出るまで子を呼び続ける`,
      `Filter(${this.label}).next() — keep pulling from the child until a tuple passes.`,
    );
    for (;;) {
      const row = this.child.next();
      if (row === null) {
        this.t.leave(
          this.id,
          null,
          "子が尽きたので NULL を返す",
          "The child is exhausted, so NULL is returned.",
        );
        return null;
      }
      if (this.pred(row)) {
        this.t.leave(
          this.id,
          row,
          `${fmt(row)} は ${this.label} を満たすので上へ通す`,
          `${fmt(row)} satisfies ${this.label}, so it is passed upward.`,
        );
        return row;
      }
      this.t.mark(
        this.id,
        "call",
        `${fmt(row)} は ${this.label} を満たさないので破棄し、子をもう一度呼ぶ`,
        `${fmt(row)} fails ${this.label}, so it is discarded and the child is called again.`,
      );
    }
  }

  close() {
    this.child.close();
    this.t.setState(this.id, "closed", "closed");
  }
}

class NestedLoopJoin implements Iter {
  private outerTuple: Row | null = null;

  constructor(
    private id: string,
    private outer: Iter,
    private inner: SeqScan,
    private pred: (o: Row, i: Row) => boolean,
    private label: string,
    private t: Trace,
  ) {}

  open() {
    this.outer.open();
    this.inner.open();
    this.outerTuple = null;
    this.t.setState(this.id, "outer = NULL", "outer = NULL");
  }

  next(): Row | null {
    this.t.enter(
      this.id,
      `NestedLoopJoin(${this.label}).next()`,
      `NestedLoopJoin(${this.label}).next()`,
    );
    for (;;) {
      if (this.outerTuple === null) {
        const o = this.outer.next();
        if (o === null) {
          this.t.leave(
            this.id,
            null,
            "外側が尽きたので結合完了。NULL を返す",
            "The outer side is exhausted — the join is done, so NULL is returned.",
          );
          return null;
        }
        this.outerTuple = o;
        this.t.setState(this.id, `outer = ${fmt(o)}`, `outer = ${fmt(o)}`);
        this.inner.rescan();
        this.t.mark(
          this.id,
          "call",
          `新しい外側タプル ${fmt(o)} を得たので、内側を先頭から読み直す（rescan）`,
          `A new outer tuple ${fmt(o)} arrived, so the inner side is rewound to the start (rescan).`,
        );
      }
      const i = this.inner.next();
      if (i === null) {
        this.t.mark(
          this.id,
          "call",
          "内側を1周し終えたので、次の外側タプルへ進む",
          "One full pass over the inner side is done — move on to the next outer tuple.",
        );
        this.outerTuple = null;
        continue;
      }
      if (this.pred(this.outerTuple, i)) {
        const joined = { ...this.outerTuple, ...i };
        this.t.leave(
          this.id,
          joined,
          `結合条件が成立したので連結タプル ${fmt(joined)} を返す`,
          `The join condition holds, so the concatenated tuple ${fmt(joined)} is returned.`,
        );
        return joined;
      }
      this.t.mark(
        this.id,
        "call",
        `${fmt(this.outerTuple)} × ${fmt(i)} は条件を満たさないので捨て、内側を次へ`,
        `${fmt(this.outerTuple)} × ${fmt(i)} fails the condition — discard it and advance the inner side.`,
      );
    }
  }

  close() {
    this.outer.close();
    this.inner.close();
    this.t.setState(this.id, "closed", "closed");
  }
}

class Projection implements Iter {
  constructor(
    private id: string,
    private child: Iter,
    private cols: string[],
    private t: Trace,
  ) {}

  open() {
    this.child.open();
    this.t.setState(this.id, `cols: ${this.cols.join(", ")}`, `cols: ${this.cols.join(", ")}`);
  }

  next(): Row | null {
    this.t.enter(
      this.id,
      `Projection(${this.cols.join(", ")}).next()`,
      `Projection(${this.cols.join(", ")}).next()`,
    );
    const row = this.child.next();
    if (row === null) {
      this.t.leave(
        this.id,
        null,
        "子が NULL を返したのでクエリ終了",
        "The child returned NULL, so the query is finished.",
      );
      return null;
    }
    const out: Row = {};
    for (const c of this.cols) out[c] = row[c];
    this.t.output.push(out);
    this.t.leave(
      this.id,
      out,
      `不要な列を落として ${fmt(out)} をクライアントへ返す`,
      `Unneeded columns are dropped and ${fmt(out)} is returned to the client.`,
    );
    return out;
  }

  close() {
    this.child.close();
    this.t.setState(this.id, "closed", "closed");
  }
}

function buildTrace(): Ev[] {
  const t = new Trace();
  const scanU = new SeqScan("scan_u", "users", USERS, t);
  const scanO = new SeqScan("scan_o", "orders", ORDERS, t);
  const filter = new Filter(
    "filter",
    scanU,
    (r) => (r["u.age"] as number) > 30,
    "u.age > 30",
    t,
  );
  const join = new NestedLoopJoin(
    "nlj",
    filter,
    scanO,
    (o, i) => o["u.id"] === i["o.user_id"],
    "u.id = o.user_id",
    t,
  );
  const root = new Projection("proj", join, ["u.name", "o.total"], t);

  root.open();
  t.mark(
    "proj",
    "open",
    "open() が根から葉へ伝播し、各演算子が内部状態（カーソル・ハッシュ表など）を初期化する",
    "open() propagates from the root to the leaves; every operator initializes its internal state (cursors, hash tables, …).",
  );

  for (;;) {
    const row = root.next();
    if (row === null) break;
  }

  root.close();
  t.mark(
    "proj",
    "close",
    "close() が伝播し、バッファの unpin や一時ファイルの削除など資源が解放される",
    "close() propagates, releasing resources — unpinning buffers, deleting temp files, and so on.",
  );

  return t.events;
}

const TREE: {
  id: string;
  depth: number;
  label: string;
  detail: string;
}[] = [
  { id: "proj", depth: 0, label: "Projection", detail: "u.name, o.total" },
  { id: "nlj", depth: 1, label: "NestedLoopJoin", detail: "u.id = o.user_id" },
  { id: "filter", depth: 2, label: "Filter", detail: "u.age > 30" },
  { id: "scan_u", depth: 3, label: "SeqScan", detail: "users" },
  { id: "scan_o", depth: 2, label: "SeqScan", detail: "orders  (inner)" },
];

const KIND_CHIP: Record<Ev["kind"], string> = {
  open: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40",
  call: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40",
  return:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40",
  eof: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
  close:
    "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/40",
};

type Props = { locale?: string };

export function VolcanoIteratorVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const events = useMemo(() => buildTrace(), []);
  const player = useStepPlayer({ totalSteps: events.length, intervalMs: 700 });
  const ev = events[player.step];
  const activeFrame = ev.stack[ev.stack.length - 1] ?? null;
  const activeOp = activeFrame ? activeFrame.split(".")[0] : ev.opId;

  return (
    <InteractiveDemo
      title={
        isJa
          ? "Volcano 反復子モデル — next() が下へ、タプルが上へ"
          : "The Volcano Iterator Model — next() Goes Down, Tuples Come Up"
      }
      description={
        isJa
          ? "Projection → NestedLoopJoin → Filter → SeqScan という演算子木を pull 型で実行します。呼び出しスタックと各演算子の next() 呼び出し回数に注目してください。"
          : "A Projection → NestedLoopJoin → Filter → SeqScan tree executed in pull style. Watch the call stack and how many times each operator's next() is invoked."
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Operator tree */}
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "物理演算子木" : "Physical operator tree"}
            </div>
            <div className="space-y-1 rounded-lg border border-border bg-background p-3">
              {TREE.map((node) => {
                const stat = ev.stats[node.id];
                const isActive = node.id === activeOp;
                const inStack = ev.stack.some((f) => f.startsWith(`${node.id}.`));
                return (
                  <div
                    key={node.id}
                    aria-current={isActive ? "true" : undefined}
                    style={{ marginLeft: `${node.depth * 14}px` }}
                    className={`rounded-md border px-2 py-1 transition-colors ${
                      isActive
                        ? "border-accent bg-accent/15"
                        : inStack
                          ? "border-accent/40 bg-accent/5"
                          : "border-transparent"
                    }`}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {node.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {node.detail}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-[10px] text-muted-foreground">
                      <span>
                        next() ×{" "}
                        <span className="font-bold text-foreground">
                          {stat.calls}
                        </span>
                      </span>
                      <span>
                        {isJa ? "出力" : "out"}{" "}
                        <span className="font-bold text-foreground">
                          {stat.rows}
                        </span>
                      </span>
                      <span>
                        {isJa ? stat.state : stat.stateEn}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call stack + result */}
          <div className="space-y-3">
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isJa ? "呼び出しスタック" : "Call stack"}
              </div>
              <div className="min-h-[86px] rounded-lg border border-border bg-background p-2">
                {ev.stack.length === 0 ? (
                  <div className="font-mono text-[11px] italic text-muted-foreground">
                    {isJa ? "(空)" : "(empty)"}
                  </div>
                ) : (
                  <div className="flex flex-col-reverse gap-0.5">
                    {ev.stack.map((frame, i) => (
                      <div
                        key={i}
                        style={{ marginLeft: `${i * 12}px` }}
                        className={`rounded px-2 py-0.5 font-mono text-[11px] ${
                          i === ev.stack.length - 1
                            ? "bg-accent/20 font-bold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {frame}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isJa
                  ? `クライアントへ返した行（${ev.output.length}）`
                  : `Rows returned to the client (${ev.output.length})`}
              </div>
              <div className="min-h-[52px] rounded-lg border border-border bg-background p-2">
                {ev.output.length === 0 ? (
                  <div className="font-mono text-[11px] italic text-muted-foreground">
                    {isJa ? "(まだ無し)" : "(none yet)"}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {ev.output.map((r, i) => (
                      <span
                        key={i}
                        className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300"
                      >
                        {fmt(r)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current event */}
        <div className="rounded-lg border border-accent/40 bg-accent/5 p-3">
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
