"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

const SIZE = 8; // ring capacity

type SQE = { id: number; op: string; completed?: boolean };
type CQE = { id: number; op: string; res: string };

export function IoUringRingVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [sqTail, setSqTail] = useState(0);
  const [sqHead, setSqHead] = useState(0);
  const [cqTail, setCqTail] = useState(0);
  const [cqHead, setCqHead] = useState(0);
  const [sqe, setSqe] = useState<(SQE | null)[]>(Array(SIZE).fill(null));
  const [cqe, setCqe] = useState<(CQE | null)[]>(Array(SIZE).fill(null));
  const [log, setLog] = useState<string[]>([]);
  const [nextId, setNextId] = useState(1);

  const sqFull = sqTail - sqHead >= SIZE;
  const cqFull = cqTail - cqHead >= SIZE;

  const append = (msg: string) => setLog((prev) => [msg, ...prev].slice(0, 8));

  const submitSQE = (op: string) => {
    if (sqFull) {
      append(isJa ? "SQ が満杯 (backpressure)" : "SQ is full (backpressure)");
      return;
    }
    const id = nextId;
    setNextId(id + 1);
    const slot = sqTail % SIZE;
    const ns = [...sqe];
    ns[slot] = { id, op };
    setSqe(ns);
    setSqTail(sqTail + 1);
    append(
      isJa
        ? `ユーザー空間が tail++ で ${op}#${id} を slot ${slot} に投入 (syscall なし)`
        : `User space placed ${op}#${id} in slot ${slot} with tail++ (no syscall)`,
    );
  };

  const kernelPick = () => {
    if (sqHead === sqTail) {
      append(isJa ? "SQ は空" : "SQ is empty");
      return;
    }
    const slot = sqHead % SIZE;
    const item = sqe[slot];
    if (!item) return;
    // Kernel consumed slot: advancing sq_head frees it for reuse.
    const ns = [...sqe];
    ns[slot] = null;
    setSqe(ns);
    setSqHead(sqHead + 1);
    append(
      isJa
        ? `カーネルが head++ で ${item.op}#${item.id} を取り出して処理開始`
        : `Kernel picked up ${item.op}#${item.id} with head++ and started work`,
    );
    // Immediately complete for this toy demo (user still needs to "reap" CQE)
    setTimeout(() => {
      setCqe((cqPrev) => {
        if (cqFull) {
          append(isJa ? "CQ オーバーフロー！" : "CQ overflow!");
          return cqPrev;
        }
        const cslot = cqTail % SIZE;
        const nc = [...cqPrev];
        nc[cslot] = {
          id: item.id,
          op: item.op,
          res: item.op === "read" ? "128" : "0",
        };
        setCqTail((t) => t + 1);
        append(
          isJa
            ? `カーネルが CQE をリングに書き込み (#${item.id})`
            : `Kernel wrote CQE for #${item.id}`,
        );
        return nc;
      });
    }, 300);
  };

  const reapCQE = () => {
    if (cqHead === cqTail) {
      append(isJa ? "CQ は空" : "CQ is empty");
      return;
    }
    const slot = cqHead % SIZE;
    const item = cqe[slot];
    if (!item) return;
    const nc = [...cqe];
    nc[slot] = null;
    setCqe(nc);
    setCqHead(cqHead + 1);
    append(
      isJa
        ? `ユーザー空間が CQE#${item.id} を読み取り、head++ (syscall なし)`
        : `User space read CQE#${item.id} and did head++ (no syscall)`,
    );
  };

  const reset = () => {
    setSqTail(0);
    setSqHead(0);
    setCqTail(0);
    setCqHead(0);
    setSqe(Array(SIZE).fill(null));
    setCqe(Array(SIZE).fill(null));
    setLog([]);
    setNextId(1);
  };

  return (
    <InteractiveDemo
      title={isJa ? "SQ/CQ リングを動かしてみる" : "Drive the SQ/CQ rings by hand"}
      description={
        isJa
          ? "レストランの注文伝票に似ています。ウェイター (ユーザー空間) は伝票を『注文リング (SQ)』に並べるだけです。キッチン (カーネル) は伝票を取って調理し、『料理リング (CQ)』に完成品を並べます。ウェイターが呼び鈴 (syscall) を鳴らすのは、たまった伝票をまとめて渡すときだけです。"
          : "It's like a restaurant's order slips. The waiter (user space) just pins slips on the 'order ring' (SQ). The kitchen (kernel) pulls slips, cooks, and pushes dishes onto the 'dish ring' (CQ). The waiter rings the bell (syscall) only to hand over a batch of slips."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => submitSQE("read")}
            disabled={sqFull}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isJa ? "① read を投入" : "① Submit read"}
          </button>
          <button
            onClick={() => submitSQE("write")}
            disabled={sqFull}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isJa ? "① write を投入" : "① Submit write"}
          </button>
          <button
            onClick={kernelPick}
            disabled={sqHead === sqTail}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {isJa ? "② カーネルが処理 (sq_head++)" : "② Kernel processes (sq_head++)"}
          </button>
          <button
            onClick={reapCQE}
            disabled={cqHead === cqTail}
            className="rounded-md border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 disabled:opacity-40"
          >
            {isJa ? "③ CQE を回収" : "③ Reap CQE"}
          </button>
          <button
            onClick={reset}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {isJa ? "リセット" : "Reset"}
          </button>
        </div>

        <RingRow
          label="SQ"
          entries={sqe.map((e) => (e ? `${e.op}#${e.id}` : ""))}
          head={sqHead % SIZE}
          tail={sqTail % SIZE}
          absHead={sqHead}
          absTail={sqTail}
          color="accent"
        />
        <RingRow
          label="CQ"
          entries={cqe.map((e) => (e ? `#${e.id}→${e.res}` : ""))}
          head={cqHead % SIZE}
          tail={cqTail % SIZE}
          absHead={cqHead}
          absTail={cqTail}
          color="blue"
        />

        <div className="rounded-md border border-border bg-background p-2 text-xs font-mono h-32 overflow-y-auto">
          {log.length === 0 ? (
            <span className="text-muted-foreground">
              {isJa ? "操作ログはここに出ます" : "Operation log appears here"}
            </span>
          ) : (
            log.map((l, i) => (
              <div key={i} className="text-foreground">
                {l}
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {isJa
            ? "①と③はユーザー空間のメモリー操作だけで、カーネルに入りません。②には通常 syscall (io_uring_enter) が必要ですが、SQPOLL ではカーネルスレッドが起きているあいだ SQE を自分で取り出すので、呼び鈴も要りません。このデモの SQ と CQ はどちらも 8 スロットです (実際の CQ は既定で SQ の 2 倍)。"
            : "① and ③ are plain user-space memory reads and writes, with no kernel entry. ② normally needs a syscall (io_uring_enter), but with SQPOLL the kernel thread fetches SQEs on its own while it is awake, so no bell is needed. Both rings here have 8 slots; by default, a real CQ is twice the size of the SQ."}
        </p>
      </div>
    </InteractiveDemo>
  );
}

function RingRow({
  label,
  entries,
  head,
  tail,
  absHead,
  absTail,
  color,
}: {
  label: string;
  entries: string[];
  head: number;
  tail: number;
  absHead: number;
  absTail: number;
  color: "accent" | "blue";
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>{label} ring</span>
        <span>
          head={absHead} (slot {head}) · tail={absTail} (slot {tail}) · used={" "}
          {absTail - absHead}/{SIZE}
        </span>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {entries.map((e, i) => {
          const isHead = i === head && absHead !== absTail;
          const isTail = i === tail && absHead !== absTail;
          const filled = e !== "";
          return (
            <div
              key={i}
              className={
                "relative h-12 rounded border text-[10px] font-mono flex items-center justify-center " +
                (filled
                  ? color === "accent"
                    ? "border-accent bg-accent/20 text-foreground"
                    : "border-blue-600 bg-blue-600/20 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground")
              }
            >
              <span>{e || i}</span>
              {isHead && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
                  head
                </span>
              )}
              {isTail && (
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">
                  tail
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
