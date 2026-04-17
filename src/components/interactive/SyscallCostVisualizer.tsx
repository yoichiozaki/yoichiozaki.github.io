"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

type Mode = "epoll" | "iouring" | "sqpoll";

export function SyscallCostVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [n, setN] = useState(1000);
  const [batch, setBatch] = useState(32);

  // very rough model:
  // - epoll: n accept/read/write syscalls + ~ceil(n/waitBatch) epoll_wait syscalls.
  //   Here we approximate epoll_wait as n/256 (typical maxevents) so the bar is
  //   dominated by the per-op read/write syscalls, which matches real profiles.
  // - io_uring: ceil(n/batch) io_uring_enter syscalls (SQE/CQE mmap'd)
  // - SQPOLL: 0 syscalls (kernel thread)
  // syscall cost: ~200 ns baseline + KPTI mitigation tax (~300 ns extra)
  const SYSCALL_NS = 500; // ns
  const USER_WORK_NS = 50; // bookkeeping per request
  const EPOLL_WAIT_BATCH = 256;

  const counts: Record<Mode, number> = {
    epoll: n + Math.max(1, Math.ceil(n / EPOLL_WAIT_BATCH)),
    iouring: Math.ceil(n / batch),
    sqpoll: 0,
  };
  const totals: Record<Mode, number> = {
    epoll: counts.epoll * SYSCALL_NS + n * USER_WORK_NS,
    iouring: counts.iouring * SYSCALL_NS + n * USER_WORK_NS,
    sqpoll: n * USER_WORK_NS,
  };
  const max = Math.max(...Object.values(totals));

  return (
    <InteractiveDemo
      title={isJa ? "syscall コストを数えてみる" : "Count the syscalls"}
      description={
        isJa
          ? "空港のイミグレに例えると分かりやすいです。epoll は旅行者 1 人ずつ審査官に声をかける方式、io_uring は団体ツアーの代表が 1 枚の名簿で一括審査してもらう方式、SQPOLL は常駐の顔パス担当がいて窓口すら通らない方式です。"
          : "Think of passport control. With epoll, every traveller queues individually. With io_uring, a tour guide hands a single list for batch approval. With SQPOLL, there's a dedicated officer who recognises your group on sight — no counter at all."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider
            label={isJa ? "同時 I/O 件数" : "# concurrent I/Os"}
            min={10}
            max={10000}
            step={10}
            value={n}
            onChange={setN}
          />
          <Slider
            label={isJa ? "io_uring バッチサイズ" : "io_uring batch size"}
            min={1}
            max={512}
            step={1}
            value={batch}
            onChange={setBatch}
          />
        </div>

        <div className="space-y-2">
          <Bar
            name="epoll"
            detail={
              isJa
                ? `${counts.epoll} syscalls (n 個の read/write + epoll_wait 数回)`
                : `${counts.epoll} syscalls (n read/write + a few epoll_wait)`
            }
            ns={totals.epoll}
            max={max}
            color="bg-red-500"
          />
          <Bar
            name="io_uring (default)"
            detail={
              isJa
                ? `${counts.iouring} syscalls (⌈n/batch⌉)`
                : `${counts.iouring} syscalls (⌈n/batch⌉)`
            }
            ns={totals.iouring}
            max={max}
            color="bg-amber-500"
          />
          <Bar
            name="io_uring + SQPOLL"
            detail={isJa ? "0 syscalls (kernel poller)" : "0 syscalls (kernel poller)"}
            ns={totals.sqpoll}
            max={max}
            color="bg-emerald-500"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {isJa
            ? "前提: syscall 1 回 ≈ 500 ns (KPTI 有り、Intel 旧世代の典型値)、リクエスト当たりの user-side 処理 ≈ 50 ns。epoll は read/write が毎回 syscall になるため syscall コストが n に比例します。"
            : "Assumes ~500 ns per syscall (KPTI on, conservative on older Intel) and ~50 ns user-side work per request. epoll\u2019s cost scales with n because each read/write is its own syscall."}
          {" "}
          {isJa
            ? "n=10,000 のワークロードでは、epoll は数ミリ秒を syscall だけで溶かすのに対し、io_uring はバッチサイズ次第で二桁減り、SQPOLL だと syscall コストが消えます。"
            : "At n=10,000, epoll burns several milliseconds on syscalls; io_uring cuts that by 1\u20132 orders of magnitude; SQPOLL erases the syscall column entirely."}
        </p>
      </div>
    </InteractiveDemo>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-accent">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

function Bar({
  name,
  detail,
  ns,
  max,
  color,
}: {
  name: string;
  detail: string;
  ns: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (ns / max) * 100 : 0;
  const us = ns / 1000;
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs font-mono">
        <span className="text-foreground">{name}</span>
        <span className="text-muted-foreground">
          {detail} · {us < 10 ? us.toFixed(2) : us.toFixed(0)} µs
        </span>
      </div>
      <div className="h-5 w-full rounded bg-muted overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
