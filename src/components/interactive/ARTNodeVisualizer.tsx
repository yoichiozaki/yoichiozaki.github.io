"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

/** Deterministic, non-sequential byte stream so the sorted arrays actually shuffle. */
const BYTES = Array.from({ length: 256 }, (_, i) => (i * 97 + 41) % 256);

type NodeKind = {
  name: string;
  capacity: number;
  /** sizeof(Node*) including padding: NodePtr is 8 bytes and 8-byte aligned. */
  bytes: number;
  layout: { ja: string; en: string };
  lookup: { ja: string; en: string };
};

const KINDS: NodeKind[] = [
  {
    name: "Node4",
    capacity: 4,
    bytes: 40, // count(1) + key[4] + 3 pad + children[4]*8
    layout: {
      ja: "uint8_t count; uint8_t key[4]; NodePtr children[4];",
      en: "uint8_t count; uint8_t key[4]; NodePtr children[4];",
    },
    lookup: { ja: "key[] を線形走査（最大 4 回）", en: "linear scan over key[] (≤ 4 probes)" },
  },
  {
    name: "Node16",
    capacity: 16,
    bytes: 152, // count(1) + key[16] + 7 pad + children[16]*8
    layout: {
      ja: "uint8_t count; uint8_t key[16]; NodePtr children[16];",
      en: "uint8_t count; uint8_t key[16]; NodePtr children[16];",
    },
    lookup: {
      ja: "ソート済み key[16] を線形走査。16 バイトが 1 レジスタに収まる形なので SIMD 化の余地はあるが、DuckDB の実装は素直なループ",
      en: "linear scan over the sorted key[16]; 16 bytes fit one register, though DuckDB's implementation is a plain loop",
    },
  },
  {
    name: "Node48",
    capacity: 48,
    bytes: 648, // count(1) + child_index[256] + 7 pad + children[48]*8
    layout: {
      ja: "uint8_t count; uint8_t child_index[256]; NodePtr children[48];",
      en: "uint8_t count; uint8_t child_index[256]; NodePtr children[48];",
    },
    lookup: {
      ja: "child_index[byte] を 1 回引いて children[] の位置を得る（48 = EMPTY_MARKER なら不在）",
      en: "one indirection through child_index[byte] into children[] (48 = EMPTY_MARKER means absent)",
    },
  },
  {
    name: "Node256",
    capacity: 256,
    bytes: 2056, // count(2) + 6 pad + children[256]*8
    layout: {
      ja: "uint16_t count; NodePtr children[256];",
      en: "uint16_t count; NodePtr children[256];",
    },
    lookup: { ja: "children[byte] を直接参照", en: "direct index: children[byte]" },
  },
];

function kindFor(count: number): NodeKind {
  if (count <= 4) return KINDS[0];
  if (count <= 16) return KINDS[1];
  if (count <= 48) return KINDS[2];
  return KINDS[3];
}

export function ARTNodeVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [count, setCount] = useState(1);

  const kind = kindFor(count);
  const kindIndex = KINDS.indexOf(kind);
  const children = BYTES.slice(0, count).sort((a, b) => a - b);
  const bytesPerChild = kind.bytes / count;

  const add = (n: number) => setCount((c) => Math.min(c + n, 256));

  return (
    <InteractiveDemo
      title={isJa ? "ART の内部ノードが育つところ" : "Watch an ART inner node grow"}
      description={
        isJa
          ? "ART (Adaptive Radix Tree) は、1 ノードが持つ子の数に応じてノードの物理表現そのものを差し替えます。子バイトを足していって、Node4 → Node16 → Node48 → Node256 の切り替わりと、1 子あたりのメモリコストの推移を見てください。"
          : "An ART (Adaptive Radix Tree) swaps the physical representation of a node according to how many children it holds. Add child bytes and watch it flip Node4 → Node16 → Node48 → Node256, and how the per-child memory cost moves."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => add(1)}
            disabled={count >= 256}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            {isJa ? "子を 1 つ追加" : "Add 1 child"}
          </button>
          <button
            type="button"
            onClick={() => add(5)}
            disabled={count >= 256}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => add(40)}
            disabled={count >= 256}
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 disabled:opacity-40"
          >
            +40
          </button>
          <button
            type="button"
            onClick={() => setCount(1)}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {isJa ? "リセット" : "Reset"}
          </button>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            count = {count}
          </span>
        </div>

        {/* Node type ladder */}
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k, i) => (
            <div
              key={k.name}
              className={`flex-1 rounded-md border px-2.5 py-2 transition-colors ${
                i === kindIndex
                  ? "border-accent bg-accent/10"
                  : i < kindIndex
                    ? "border-border bg-muted/40 opacity-55"
                    : "border-border bg-background opacity-45"
              }`}
            >
              <div
                className={`font-mono text-xs font-semibold ${
                  i === kindIndex ? "text-accent" : "text-foreground"
                }`}
              >
                {k.name}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                ≤ {k.capacity} / {k.bytes} B
              </div>
            </div>
          ))}
        </div>

        {/* Physical layout */}
        <div className="rounded-md border border-border bg-background p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {isJa ? "物理レイアウト" : "Physical layout"}
          </div>
          <code className="block font-mono text-[11px] text-foreground">
            {isJa ? kind.layout.ja : kind.layout.en}
          </code>

          {kindIndex <= 1 && (
            <div className="mt-3">
              <div className="mb-1 font-mono text-[10px] text-muted-foreground">
                key[] {isJa ? "（昇順、count 個だけ有効）" : "(sorted, only count entries valid)"}
              </div>
              <div className="flex flex-wrap gap-0.5">
                {Array.from({ length: kind.capacity }, (_, i) => (
                  <div
                    key={i}
                    className={`h-6 w-8 rounded-sm border text-center font-mono text-[10px] leading-6 ${
                      i < count
                        ? "border-accent bg-accent/20 text-foreground"
                        : "border-dashed border-border text-muted-foreground"
                    }`}
                  >
                    {i < count ? children[i] : "·"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {kindIndex === 2 && (
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 font-mono text-[10px] text-muted-foreground">
                  child_index[256] {isJa ? "（バイト値で直接引く。48 = 空）" : "(indexed by key byte; 48 = empty)"}
                </div>
                <div
                  className="flex flex-wrap gap-[1px]"
                  role="img"
                  aria-label={`child_index: ${count} of 256 byte slots occupied`}
                >
                  {Array.from({ length: 256 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-[1px] ${
                        children.includes(i) ? "bg-accent" : "bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                children[48]: {count} / 48 {isJa ? "使用中" : "in use"}
              </div>
            </div>
          )}

          {kindIndex === 3 && (
            <div className="mt-3">
              <div className="mb-1 font-mono text-[10px] text-muted-foreground">
                children[256] {isJa ? "（間接参照なし）" : "(no indirection)"}
              </div>
              <div
                className="flex flex-wrap gap-[1px]"
                role="img"
                aria-label={`children: ${count} of 256 slots occupied`}
              >
                {Array.from({ length: 256 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-[1px] ${
                      children.includes(i) ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {isJa ? "子 1 つあたりのメモリ" : "Memory per child"}
            </div>
            <div className="font-mono text-sm text-foreground">
              {bytesPerChild.toFixed(1)} B
            </div>
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {isJa ? "1 バイト分の探索" : "Lookup for one byte"}
            </div>
            <div className="text-[11px] leading-snug text-foreground">
              {isJa ? kind.lookup.ja : kind.lookup.en}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
          {isJa
            ? "縮小は膨張と対称ではありません。Node256 は 36 以下（Node256::SHRINK_THRESHOLD）で Node48 へ、Node48 は 12 未満（Node48::SHRINK_THRESHOLD）で Node16 へ落ちます。ヒステリシスを入れて、境界での型振動を防いでいます。DuckDB はさらに、子ポインタを持たず「存在するバイト」だけを保持する Node7Leaf / Node15Leaf / Node256Leaf を追加していて、これは row ID を格納する入れ子 ART（gate の内側）専用です。"
            : "Shrinking is not the mirror image of growth: a Node256 collapses to Node48 at 36 or fewer children (Node256::SHRINK_THRESHOLD) and a Node48 to Node16 below 12 (Node48::SHRINK_THRESHOLD). The hysteresis prevents type thrashing at the boundary. DuckDB also adds Node7Leaf / Node15Leaf / Node256Leaf, which hold only the present bytes and no child pointers — used exclusively by the nested row-ID ART behind a gate."}
        </div>
      </div>
    </InteractiveDemo>
  );
}
