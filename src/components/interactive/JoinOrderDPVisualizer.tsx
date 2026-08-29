"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * System R style bottom-up dynamic programming over join sets.
 *
 * cardinality(S) = Π |Ri|  ×  Π sel(e)   for edges e inside S
 * cost(S)        = cardinality(S) + cost(S1) + cost(S2)   (C_out)
 * cost(base)     = 0
 *
 * Everything shown in the UI is computed by the code below.
 * ────────────────────────────────────────────────────────── */

type Rel = { key: string; name: string; rows: number; note: string; noteEn: string };

const RELS: Rel[] = [
  {
    key: "u",
    name: "users",
    rows: 10_000,
    note: "id は一意（NDV = 10,000）",
    noteEn: "id is unique (NDV = 10,000)",
  },
  {
    key: "o",
    name: "orders",
    rows: 100_000,
    note: "user_id の NDV = 10,000",
    noteEn: "NDV(user_id) = 10,000",
  },
  {
    key: "i",
    name: "order_items",
    rows: 500_000,
    note: "order_id NDV = 100,000 / product_id NDV = 1,000",
    noteEn: "NDV(order_id) = 100,000 / NDV(product_id) = 1,000",
  },
  {
    key: "p",
    name: "products",
    rows: 10,
    note: "category = 'Book' で絞った後の行数",
    noteEn: "row count after the category = 'Book' filter",
  },
];

type Edge = { a: number; b: number; sel: number; label: string };

const EDGES: Edge[] = [
  { a: 0, b: 1, sel: 1 / 10_000, label: "u.id = o.user_id" },
  { a: 1, b: 2, sel: 1 / 100_000, label: "o.id = i.order_id" },
  { a: 2, b: 3, sel: 1 / 1_000, label: "i.product_id = p.id" },
];

const N = RELS.length;
const ALL = (1 << N) - 1;

const bits = (mask: number) => {
  const out: number[] = [];
  for (let k = 0; k < N; k += 1) if (mask & (1 << k)) out.push(k);
  return out;
};

const popcount = (mask: number) => bits(mask).length;

const maskLabel = (mask: number) =>
  bits(mask)
    .map((k) => RELS[k].key)
    .join("");

function cardinality(mask: number): number {
  let c = 1;
  for (const k of bits(mask)) c *= RELS[k].rows;
  for (const e of EDGES) {
    if (mask & (1 << e.a) && mask & (1 << e.b)) c *= e.sel;
  }
  return Math.round(c);
}

function isConnected(mask: number): boolean {
  const members = bits(mask);
  if (members.length <= 1) return true;
  const seen = new Set<number>([members[0]]);
  const queue = [members[0]];
  while (queue.length > 0) {
    const cur = queue.pop()!;
    for (const e of EDGES) {
      const other = e.a === cur ? e.b : e.b === cur ? e.a : -1;
      if (other < 0) continue;
      if (!(mask & (1 << other)) || seen.has(other)) continue;
      seen.add(other);
      queue.push(other);
    }
  }
  return seen.size === members.length;
}

function hasEdgeBetween(m1: number, m2: number): boolean {
  return EDGES.some(
    (e) =>
      (m1 & (1 << e.a) && m2 & (1 << e.b)) ||
      (m1 & (1 << e.b) && m2 & (1 << e.a)),
  );
}

type Entry = { mask: number; card: number; cost: number; plan: string };

type Candidate = {
  left: number;
  right: number;
  plan: string;
  cost: number | null;
  reason: string;
  reasonEn: string;
  shape: "left-deep" | "bushy";
  chosen: boolean;
};

type DPStep = {
  mask: number;
  size: number;
  skipped: boolean;
  candidates: Candidate[];
  table: Entry[];
  note: string;
  noteEn: string;
  final?: Entry;
};

function runDP(): DPStep[] {
  const dp = new Map<number, Entry>();
  const steps: DPStep[] = [];

  for (let k = 0; k < N; k += 1) {
    const mask = 1 << k;
    dp.set(mask, { mask, card: RELS[k].rows, cost: 0, plan: RELS[k].key });
  }

  const snapshotTable = () =>
    [...dp.values()].sort(
      (a, b) => popcount(a.mask) - popcount(b.mask) || a.mask - b.mask,
    );

  steps.push({
    mask: 0,
    size: 1,
    skipped: false,
    candidates: [],
    table: snapshotTable(),
    note: "初期化：単一テーブルのアクセスパスを DP 表に登録します。ここでは走査コストを 0 とみなし、結合で生じる中間結果の行数だけを積み上げる C_out コストモデルを使います。",
    noteEn:
      "Initialization: single-table access paths are entered into the DP table. Scan cost is treated as 0 here — we use the C_out cost model, which accumulates only the sizes of intermediate results.",
  });

  for (let size = 2; size <= N; size += 1) {
    for (let mask = 1; mask <= ALL; mask += 1) {
      if (popcount(mask) !== size) continue;

      if (!isConnected(mask)) {
        steps.push({
          mask,
          size,
          skipped: true,
          candidates: [],
          table: snapshotTable(),
          note: `{${maskLabel(mask)}} は結合述語で繋がっていません。この部分集合を作るには直積が必要なので、探索空間から除外します。`,
          noteEn: `{${maskLabel(mask)}} is not connected by any join predicate. Building it would require a Cartesian product, so it is pruned from the search space.`,
        });
        continue;
      }

      const card = cardinality(mask);
      const candidates: Candidate[] = [];

      for (let right = (mask - 1) & mask; right > 0; right = (right - 1) & mask) {
        const left = mask ^ right;
        if (left === 0) continue;
        const pl = popcount(left);
        const pr = popcount(right);
        // canonical enumeration: keep the larger half on the left
        if (pr > pl) continue;
        if (pr === pl && left > right) continue;

        const le = dp.get(left);
        const re = dp.get(right);
        const shape: Candidate["shape"] = pr === 1 ? "left-deep" : "bushy";

        if (!le || !re) {
          candidates.push({
            left,
            right,
            plan: `(${maskLabel(left)} ⋈ ${maskLabel(right)})`,
            cost: null,
            reason: `{${maskLabel(!le ? left : right)}} は直積になるため DP 表に存在せず、この分割は使えません。`,
            reasonEn: `{${maskLabel(!le ? left : right)}} is absent from the DP table (it would be a Cartesian product), so this split is unusable.`,
            shape,
            chosen: false,
          });
          continue;
        }

        if (!hasEdgeBetween(left, right)) {
          candidates.push({
            left,
            right,
            plan: `(${le.plan} ⋈ ${re.plan})`,
            cost: null,
            reason: "左右をつなぐ結合述語が無いので直積。除外します。",
            reasonEn:
              "There is no join predicate connecting the two halves, so this is a Cartesian product — excluded.",
            shape,
            chosen: false,
          });
          continue;
        }

        const cost = card + le.cost + re.cost;
        candidates.push({
          left,
          right,
          plan: `(${le.plan} ⋈ ${re.plan})`,
          cost,
          reason: `${card.toLocaleString("en-US")} + ${le.cost.toLocaleString("en-US")} + ${re.cost.toLocaleString("en-US")}`,
          reasonEn: `${card.toLocaleString("en-US")} + ${le.cost.toLocaleString("en-US")} + ${re.cost.toLocaleString("en-US")}`,
          shape,
          chosen: false,
        });
      }

      let best: Candidate | null = null;
      for (const c of candidates) {
        if (c.cost === null) continue;
        if (best === null || c.cost < best.cost!) best = c;
      }
      if (best) {
        best.chosen = true;
        dp.set(mask, { mask, card, cost: best.cost!, plan: best.plan });
      }

      steps.push({
        mask,
        size,
        skipped: false,
        candidates,
        table: snapshotTable(),
        note: best
          ? `{${maskLabel(mask)}} の推定行数は ${card.toLocaleString("en-US")}。分割の仕方をすべて試し、最小コスト ${best.cost!.toLocaleString("en-US")} の ${best.plan} だけを DP 表に残します。ほかの分割は二度と検討されません。`
          : `{${maskLabel(mask)}} には有効な分割がありませんでした。`,
        noteEn: best
          ? `{${maskLabel(mask)}} is estimated at ${card.toLocaleString("en-US")} rows. Every way of splitting it is tried, and only the cheapest — ${best.plan} at ${best.cost!.toLocaleString("en-US")} — is kept in the DP table. The other splits are never revisited.`
          : `No valid split was found for {${maskLabel(mask)}}.`,
      });
    }
  }

  const final = dp.get(ALL)!;
  steps.push({
    mask: ALL,
    size: N,
    skipped: false,
    candidates: [],
    table: snapshotTable(),
    final,
    note: `最適プランは ${final.plan}、推定コスト ${final.cost.toLocaleString("en-US")}。SQL に書かれた順どおりの ((u ⋈ o) ⋈ i) ⋈ p は 605,000 なので、およそ 40 倍の差になります。最も選択的な products から結合を始めるのが正解でした。`,
    noteEn: `The optimal plan is ${final.plan} at an estimated cost of ${final.cost.toLocaleString("en-US")}. The textual order ((u ⋈ o) ⋈ i) ⋈ p costs 605,000 — roughly 40× more. Starting from the most selective relation, products, was the right move.`,
  });

  return steps;
}

const num = (n: number) => n.toLocaleString("en-US");

type Props = { locale?: string };

export function JoinOrderDPVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const steps = useMemo(() => runDP(), []);
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2400 });
  const s = steps[player.step];

  return (
    <InteractiveDemo
      title={
        isJa
          ? "結合順序を動的計画法で決める"
          : "Choosing a Join Order With Dynamic Programming"
      }
      description={
        isJa
          ? "4テーブルの結合について、部分集合の小さい順に最適な部分プランを確定していきます。直積になる部分集合は探索空間から刈り取られます。"
          : "For a four-table join, the optimal sub-plan for every subset is fixed in increasing order of size. Subsets that would require a Cartesian product are pruned from the search space."
      }
    >
      <div className="space-y-4">
        {/* Schema / edges */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "テーブルと推定行数" : "Relations & estimated rows"}
            </div>
            <div className="space-y-1">
              {RELS.map((r, k) => (
                <div key={r.key} className="flex items-baseline gap-2 text-[11px]">
                  <span className="rounded bg-muted px-1 font-mono font-bold text-foreground">
                    {r.key}
                  </span>
                  <span
                    className={`font-mono ${s.mask & (1 << k) && !s.skipped ? "font-bold text-accent" : "text-foreground"}`}
                  >
                    {r.name}
                  </span>
                  <span className="ml-auto font-mono text-muted-foreground">
                    {num(r.rows)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "結合述語と選択率" : "Join predicates & selectivity"}
            </div>
            <div className="space-y-1">
              {EDGES.map((e) => (
                <div key={e.label} className="flex items-baseline gap-2 text-[11px]">
                  <span className="font-mono text-foreground">{e.label}</span>
                  <span className="ml-auto font-mono text-muted-foreground">
                    1 / {num(Math.round(1 / e.sel))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current subset */}
        <div
          className={`rounded-lg border p-3 ${
            s.skipped
              ? "border-rose-500/40 bg-rose-500/5"
              : "border-accent/40 bg-accent/5"
          }`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {s.final
                ? isJa
                  ? "最終結果"
                  : "Final result"
                : isJa
                  ? `サイズ ${s.size} の部分集合`
                  : `Subset of size ${s.size}`}
            </span>
            {s.mask > 0 && (
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-bold text-foreground">
                {"{"}
                {maskLabel(s.mask)}
                {"}"}
              </span>
            )}
            {s.skipped && (
              <span className="rounded border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                {isJa ? "直積のため除外" : "pruned: cross product"}
              </span>
            )}
          </div>

          {s.candidates.length > 0 && (
            <div className="mb-2 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th scope="col" className="py-1 pr-2 font-medium">
                      {isJa ? "分割候補" : "Candidate split"}
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      {isJa ? "形" : "Shape"}
                    </th>
                    <th scope="col" className="py-1 pr-2 text-right font-medium">
                      {isJa ? "コスト" : "Cost"}
                    </th>
                    <th scope="col" className="py-1 font-medium">
                      {isJa ? "内訳 / 理由" : "Breakdown / reason"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {s.candidates.map((c, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border/50 ${
                        c.chosen
                          ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                          : c.cost === null
                            ? "text-muted-foreground"
                            : "text-foreground"
                      }`}
                    >
                      <td className="py-1 pr-2 font-mono">
                        {c.chosen && "★ "}
                        {c.plan}
                      </td>
                      <td className="py-1 pr-2 font-mono text-[10px]">
                        {c.cost === null ? "—" : c.shape}
                      </td>
                      <td className="py-1 pr-2 text-right font-mono">
                        {c.cost === null ? "—" : num(c.cost)}
                      </td>
                      <td className="py-1 font-mono text-[10px]">
                        {isJa ? c.reason : c.reasonEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {isJa ? s.note : s.noteEn}
          </p>
        </div>

        {/* DP table */}
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {isJa ? "DP 表（確定済みの最適部分プラン）" : "DP table (fixed optimal sub-plans)"}
          </div>
          <div className="overflow-x-auto rounded-lg border border-border bg-background">
            <table className="w-full min-w-[420px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th scope="col" className="px-2 py-1 font-medium">
                    {isJa ? "部分集合" : "Subset"}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-medium">
                    {isJa ? "推定行数" : "Est. rows"}
                  </th>
                  <th scope="col" className="px-2 py-1 text-right font-medium">
                    {isJa ? "コスト" : "Cost"}
                  </th>
                  <th scope="col" className="px-2 py-1 font-medium">
                    {isJa ? "最適部分プラン" : "Best sub-plan"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {s.table.map((e) => (
                  <tr
                    key={e.mask}
                    className={`border-b border-border/40 last:border-0 ${
                      e.mask === s.mask && !s.skipped
                        ? "bg-accent/10 font-semibold text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <td className="px-2 py-1 font-mono">
                      {"{"}
                      {maskLabel(e.mask)}
                      {"}"}
                    </td>
                    <td className="px-2 py-1 text-right font-mono">{num(e.card)}</td>
                    <td className="px-2 py-1 text-right font-mono">{num(e.cost)}</td>
                    <td className="px-2 py-1 font-mono">{e.plan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
        />
      </div>
    </InteractiveDemo>
  );
}
