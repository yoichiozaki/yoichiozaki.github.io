"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

type VType = "FLAT" | "CONSTANT" | "DICTIONARY" | "SEQUENCE";

const ROWS = 8;

/** Logical values rendered for each vector type. */
const LOGICAL: Record<VType, string[]> = {
  FLAT: ["ap", "banana", "ap", "cherry", "ap", "banana", "cherry", "ap"],
  CONSTANT: Array(ROWS).fill("ap"),
  DICTIONARY: ["ap", "banana", "ap", "cherry", "ap", "banana", "cherry", "ap"],
  SEQUENCE: ["100", "101", "102", "103", "104", "105", "106", "107"],
};

const DICT_ENTRIES = ["ap", "banana", "cherry"];
const DICT_SEL = [0, 1, 0, 2, 0, 1, 2, 0];

export function DuckDBVectorPlayground({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [vtype, setVtype] = useState<VType>("FLAT");
  const [filtered, setFiltered] = useState(false);

  // The predicate used by the "filter" button: value === "ap".
  const matches = LOGICAL[vtype]
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => (vtype === "SEQUENCE" ? Number(v) % 2 === 0 : v === "ap"))
    .map(({ i }) => i);

  const visibleRows = filtered ? matches : [...Array(ROWS).keys()];

  /** Physical entries actually materialised in the vector's buffer. */
  const physical: { label: string; note: string }[] = (() => {
    switch (vtype) {
      case "FLAT":
        return LOGICAL.FLAT.map((v) => ({ label: v, note: "string_t" }));
      case "CONSTANT":
        return [{ label: "ap", note: "string_t" }];
      case "DICTIONARY":
        return DICT_ENTRIES.map((v) => ({ label: v, note: "string_t" }));
      case "SEQUENCE":
        return [
          { label: "start = 100", note: "int64_t" },
          { label: "increment = 1", note: "int64_t" },
          { label: "count = 8", note: "count_t" },
        ];
    }
  })();

  /** UnifiedVectorFormat.sel — how logical row i maps into the data array. */
  const unifiedSel = (i: number): number => {
    switch (vtype) {
      case "CONSTANT":
        return 0;
      case "DICTIONARY":
        return DICT_SEL[i];
      default:
        return i;
    }
  };

  const bytes = (() => {
    switch (vtype) {
      case "FLAT":
        return ROWS * 16;
      case "CONSTANT":
        return 16;
      case "DICTIONARY":
        return DICT_ENTRIES.length * 16 + ROWS * 4;
      case "SEQUENCE":
        return 24;
    }
  })();

  const explanation: Record<VType, { ja: string; en: string }> = {
    FLAT: {
      ja: "1 論理行 = 1 物理エントリ。もっとも素直な表現で、書き込み可能な唯一の型です。`Flatten()` はどの型もこの形に落とします。",
      en: "One logical row = one physical entry. The plainest layout, and the only writable one. `Flatten()` lowers every other type into this shape.",
    },
    CONSTANT: {
      ja: "全行が同じ値。`WHERE x = 'ap'` の 'ap' 側や、`SELECT 1` の定数、NULL 埋めのカラムがこれになります。演算子は「1 要素だけ計算して全行に配る」最適化ができます。",
      en: "Every row shares one value. Literals like the 'ap' in `WHERE x = 'ap'`, `SELECT 1`, or an all-NULL column. Operators can compute once and broadcast.",
    },
    DICTIONARY: {
      ja: "辞書 + 選択ベクトル。低カーディナリティ列のスキャンや、フィルタ後の行の絞り込みで現れます。データをコピーせず「見え方」だけ変えるのがポイント。",
      en: "Dictionary + selection vector. Produced by low-cardinality column scans and by filters. The key property: it changes the view without copying data.",
    },
    SEQUENCE: {
      ja: "start と increment の 2 つの数値だけ。`range(0, 1000000)` や rowid 列がこれ。`ToUnifiedFormat()` は SEQUENCE を扱えないため、事前に `Flatten()` されます。",
      en: "Just start and increment. Used by `range(0, 1000000)` and rowid columns. `ToUnifiedFormat()` cannot handle SEQUENCE, so it is flattened first.",
    },
  };

  const tabs: VType[] = ["FLAT", "CONSTANT", "DICTIONARY", "SEQUENCE"];

  return (
    <InteractiveDemo
      title={isJa ? "Vector の 4 つの姿を触ってみる" : "Play with the four faces of a Vector"}
      description={
        isJa
          ? "DuckDB の Vector は「2048 行ぶんの配列」ではなく、同じ論理データを表す複数の物理表現を持ちます。タブを切り替えて、論理ビュー・物理バッファ・UnifiedVectorFormat の対応を見比べてください。"
          : "A DuckDB Vector is not simply an array of 2048 values — it is one of several physical encodings of the same logical data. Switch tabs to compare the logical view, the physical buffer, and the UnifiedVectorFormat mapping."
      }
    >
      <div className="flex flex-col gap-4">
        {/* Type tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={vtype === t}
              onClick={() => {
                setVtype(t);
                setFiltered(false);
              }}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                vtype === t
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFiltered((f) => !f)}
            className="ml-auto rounded-md border border-accent px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10"
          >
            {filtered
              ? isJa
                ? "フィルタ解除"
                : "Clear filter"
              : isJa
                ? vtype === "SEQUENCE"
                  ? "WHERE i % 2 = 0 を適用"
                  : "WHERE v = 'ap' を適用"
                : vtype === "SEQUENCE"
                  ? "Apply WHERE i % 2 = 0"
                  : "Apply WHERE v = 'ap'"}
          </button>
        </div>

        {/* Logical view */}
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {isJa ? "論理ビュー（オペレータから見える 8 行）" : "Logical view (8 rows as operators see them)"}
          </div>
          <div className="flex flex-wrap gap-1">
            {[...Array(ROWS).keys()].map((i) => {
              const active = visibleRows.includes(i);
              return (
                <div
                  key={i}
                  className={`flex min-w-[72px] flex-col items-center rounded-md border px-2 py-1 transition-opacity ${
                    active
                      ? "border-accent bg-accent/10 opacity-100"
                      : "border-border bg-background opacity-25"
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground">{i}</span>
                  <span className="font-mono text-xs text-foreground">{LOGICAL[vtype][i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Physical buffer */}
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {isJa
              ? `物理バッファ（実際に確保される ${physical.length} エントリ / 約 ${bytes} バイト）`
              : `Physical buffer (${physical.length} entries actually allocated / ~${bytes} bytes)`}
          </div>
          <div className="flex flex-wrap gap-1">
            {physical.map((p, i) => (
              <div
                key={i}
                className="flex min-w-[92px] flex-col items-center rounded-md border border-blue-500/60 bg-blue-500/10 px-2 py-1"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {vtype === "SEQUENCE" ? "" : `[${i}]`}
                </span>
                <span className="font-mono text-xs text-foreground">{p.label}</span>
                <span className="font-mono text-[9px] text-muted-foreground">{p.note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unified format mapping */}
        <div>
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            {isJa
              ? "UnifiedVectorFormat.sel（論理行 → data 添字）"
              : "UnifiedVectorFormat.sel (logical row → index into data)"}
          </div>
          {vtype === "SEQUENCE" ? (
            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
              {isJa
                ? "SEQUENCE は ToUnifiedFormat() が直接扱えません。Vector::ToUnifiedFormat() は FLAT / CONSTANT / DICTIONARY 以外を検出すると、まず Flatten() してベクタ内の全値を実体化します。"
                : "ToUnifiedFormat() cannot read a SEQUENCE directly. Vector::ToUnifiedFormat() detects anything other than FLAT / CONSTANT / DICTIONARY and calls Flatten() first, materialising every value in the vector."}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {[...Array(ROWS).keys()].map((i) => (
                <div
                  key={i}
                  className="flex min-w-[72px] items-center justify-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                >
                  <span className="text-muted-foreground">{i}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-accent">{unifiedSel(i)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {filtered && (
          <div className="rounded-md border border-accent/50 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-foreground">
            {isJa
              ? `フィルタは値をコピーしません。合致した ${matches.length} 行の添字を SelectionVector に書き、DataChunk::Slice() でその選択を被せるだけです。${
                  vtype === "FLAT"
                    ? "FLAT はここで DICTIONARY になります。"
                    : vtype === "DICTIONARY"
                      ? "DICTIONARY は選択ベクトル同士が合成され、DICTIONARY のままです（辞書を積み重ねません）。"
                      : vtype === "CONSTANT"
                        ? "ただし CONSTANT は Slice しても CONSTANT のまま — VectorBuffer::Slice() が ConstantSlice() に短絡し、count だけ更新します。"
                        : "ただし SEQUENCE には SliceInternal の実装がないため FlattenSlice に落ち、結果は DICTIONARY ではなく FLAT になります。"
                }`
              : `The filter copies no values. It writes the ${matches.length} matching indices into a SelectionVector and DataChunk::Slice() layers that selection on top. ${
                  vtype === "FLAT"
                    ? "A FLAT vector becomes a DICTIONARY here."
                    : vtype === "DICTIONARY"
                      ? "A DICTIONARY stays a DICTIONARY: the two selection vectors are composed rather than stacked."
                      : vtype === "CONSTANT"
                        ? "But a CONSTANT stays CONSTANT — VectorBuffer::Slice() short-circuits to ConstantSlice() and only updates the count."
                        : "But SEQUENCE has no SliceInternal override, so it falls through to FlattenSlice — the result is FLAT, not DICTIONARY."
                }`}
          </div>
        )}

        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
          <span className="font-mono font-semibold text-accent">{vtype}</span> —{" "}
          {isJa ? explanation[vtype].ja : explanation[vtype].en}
        </div>
      </div>
    </InteractiveDemo>
  );
}
