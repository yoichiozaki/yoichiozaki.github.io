"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

type Candidate = { name: string; bytes: number; note?: { ja: string; en: string } };

type Dataset = {
  id: string;
  label: { ja: string; en: string };
  physical: string;
  sample: string;
  candidates: Candidate[];
  winner: string;
  why: { ja: string; en: string };
};

const ROWS = 122880; // DEFAULT_ROW_GROUP_SIZE

const DATASETS: Dataset[] = [
  {
    id: "dates",
    label: { ja: "ほぼ単調増加の DATE", en: "Near-monotonic DATE" },
    physical: "INT32",
    sample: "1995-01-02, 1995-01-02, 1995-01-03, 1995-01-05, …",
    candidates: [
      { name: "Uncompressed", bytes: 491520 },
      { name: "RLE", bytes: 368640 },
      { name: "BitPacking (DELTA_FOR)", bytes: 33000 },
      { name: "Constant", bytes: -1 },
    ],
    winner: "BitPacking (DELTA_FOR)",
    why: {
      ja: "差分がほぼ 0〜2 に収まるので、DELTA_FOR モードが基準値からの差を 2 ビットに詰め込める。BitpackingMode は CONSTANT / CONSTANT_DELTA / DELTA_FOR / FOR の 4 モードを 2048 値グループごとに選び直す。",
      en: "Deltas fall in 0–2, so DELTA_FOR packs each value into 2 bits above a frame of reference. BitpackingMode re-picks among CONSTANT / CONSTANT_DELTA / DELTA_FOR / FOR for every group of 2048 values.",
    },
  },
  {
    id: "status",
    label: { ja: "3 値しかない VARCHAR", en: "VARCHAR with 3 distinct values" },
    physical: "VARCHAR",
    sample: "'O', 'F', 'O', 'P', 'F', 'O', …",
    candidates: [
      { name: "Uncompressed", bytes: 614400 },
      { name: "Dictionary", bytes: 30740 },
      { name: "DICT_FSST", bytes: 61440 },
      { name: "FSST (pre-v1.3.0)", bytes: 165000 },
    ],
    winner: "Dictionary",
    why: {
      ja: "辞書は 3 エントリだけ。各行は「辞書の何番目か」を指すインデックスになり、それをさらにビットパックすると 1 行 2 ビット。文字列そのものはもう 1 度も現れない。DICT_FSST の見積もりは `DictFSSTAnalyzeState::FinalAnalyze()` = total_string_length / 2 という一律 2 倍圧縮の仮定なので 61,440 バイト。なお FSST と DICT_FSST が同じ競争に並ぶことはありません（ストレージ v1.3.0 以降は FSST 側の Analyze が nullptr を返して無効化されます）。",
      en: "The dictionary holds just three entries; every row becomes an index into it, bit-packed down to 2 bits. The string bytes themselves never repeat. DICT_FSST's estimate is `DictFSSTAnalyzeState::FinalAnalyze()` = total_string_length / 2 — a flat \"assume 2×\" guess — i.e. 61,440 bytes. Note that FSST and DICT_FSST never appear in the same contest: from storage v1.3.0 onward FSST's Analyze returns nullptr and it is disabled.",
    },
  },
  {
    id: "comment",
    label: { ja: "自由文テキスト（平均 27 文字）", en: "Free-form text (avg. 27 chars)" },
    physical: "VARCHAR",
    sample: "'furiously regular accounts wake', …",
    candidates: [
      { name: "Uncompressed", bytes: 3809280 },
      { name: "Dictionary", bytes: 4100000 },
      { name: "DICT_FSST", bytes: 1658880 },
      { name: "FSST (pre-v1.3.0)", bytes: 2100000 },
    ],
    winner: "DICT_FSST",
    why: {
      ja: "ほぼ全行が異なるので辞書は効きません。FSST は 255 個の「よく出る 1〜8 バイト列」を 1 バイトの記号に置き換える静的シンボルテーブルで、ランダムアクセス可能なまま約半分に縮みます。DICT_FSST は辞書と FSST を 1 つのセグメント形式に統合したもので、見積もりは total_string_length / 2 = 1,658,880 バイト。FSST 単体はストレージ v1.3.0 以降は候補から外れるので、DICT_FSST と直接競うことはありません。",
      en: "Almost every row differs, so a dictionary is useless. FSST replaces up to 255 frequent 1–8 byte substrings with single-byte symbols, roughly halving the payload while staying randomly accessible. DICT_FSST folds dictionary and FSST into a single segment format; its estimate is total_string_length / 2 = 1,658,880 bytes. Plain FSST is not a rival here — it is excluded from the candidate list on storage v1.3.0 and newer.",
    },
  },
  {
    id: "price",
    label: { ja: "小数 2 桁の DOUBLE", en: "DOUBLE with 2 decimal digits" },
    physical: "DOUBLE",
    sample: "938.71, 1204.05, 87.60, 4412.33, …",
    candidates: [
      { name: "Uncompressed", bytes: 983040 },
      { name: "ALP", bytes: 261120 },
      { name: "ALPRD", bytes: 720000 },
      { name: "RLE", bytes: 990000 },
    ],
    winner: "ALP",
    why: {
      ja: "ALP (Adaptive Lossless floating-Point) は「その double は本当は 10 進小数だろう」と賭ける。値 × 10^e を整数に丸めて元に戻せるか検証し、成功すれば整数として FOR + ビットパック。1024 値ごとに exponent/factor を選び直し、外れ値は例外リストに逃がす。",
      en: "ALP (Adaptive Lossless floating-Point) bets that the double is really a decimal. It rounds value × 10^e to an integer, verifies the round trip, and on success stores it as FOR + bit-packed integers. Exponent and factor are re-chosen every 1024 values, with outliers spilled to an exception list.",
    },
  },
  {
    id: "runs",
    label: { ja: "ソート済みで長いラン", en: "Sorted, long runs" },
    physical: "INT32",
    sample: "7, 7, 7, … (×512), 8, 8, 8, … (×512), …",
    candidates: [
      { name: "Uncompressed", bytes: 491520 },
      { name: "RLE", bytes: 1440 },
      { name: "BitPacking", bytes: 123000 },
      { name: "Dictionary", bytes: -1 },
    ],
    winner: "RLE",
    why: {
      ja: "RLE は (値, 実行長) の組を並べるだけ。実行長は uint16_t なので 1 ランは最大 65535 行。240 ランなら 240 × 6 バイト = 1440 バイトで 1 row group 全体が表現できる。",
      en: "RLE stores (value, run length) pairs. The run length is a uint16_t, so a single run covers at most 65,535 rows. With 240 runs, an entire row group fits in 240 × 6 = 1,440 bytes.",
    },
  },
  {
    id: "nulls",
    label: { ja: "90% が NULL、残りは同一値", en: "90% NULL, the rest identical" },
    physical: "INT64",
    sample: "NULL, NULL, 42, NULL, NULL, NULL, 42, …",
    candidates: [
      { name: "Uncompressed", bytes: 998400 },
      { name: "Constant", bytes: 24 },
      { name: "RLE", bytes: 30 },
      { name: "BitPacking", bytes: 17000 },
    ],
    winner: "Constant",
    why: {
      ja: "この列だけは Analyze の勝者ではありません。Constant は `COMPRESSION_CONSTANT = 2, // internal only` で、`EmitCompressionFunction()` が候補一覧から外すため Analyze には参加しません。Analyze を勝つのは RLE です — `RLEState::Update()` は NULL を「直前のランを 1 伸ばすだけ」として扱うので、非 NULL がすべて同じ値ならこの row group はほぼ 1 ラン（1 ランの上限は 65,535 行）に潰れます。そのうえで書き出し時に `BaseStatistics::IsConstant()`（min == max）が成立するため、セグメントは最終的に Constant に差し替えられます。NULL の位置を示す validity は別の列として checkpoint され、そちらでは Roaring が候補に入ります。",
      en: "This column is the one case not decided by Analyze. Constant is `COMPRESSION_CONSTANT = 2, // internal only`, and `EmitCompressionFunction()` keeps it out of the candidate list, so it never runs Analyze at all. The Analyze contest is actually won by RLE: `RLEState::Update()` treats a NULL as merely incrementing the last seen count, so with every non-NULL equal to 42 the whole row group collapses into about two runs (a run caps at 65,535 rows). Then at flush time `BaseStatistics::IsConstant()` (min == max) holds and the segment is swapped to Constant anyway. The validity mask marking the NULL positions is checkpointed as its own column, and that is where Roaring competes.",
    },
  },
];

export function DuckDBCompressionLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [selected, setSelected] = useState(DATASETS[0].id);
  const ds = DATASETS.find((d) => d.id === selected) ?? DATASETS[0];

  const usable = ds.candidates.filter((c) => c.bytes > 0);
  const max = Math.max(...usable.map((c) => c.bytes));
  const uncompressed = ds.candidates.find((c) => c.name === "Uncompressed")?.bytes ?? 1;
  const best = ds.candidates.find((c) => c.name === ds.winner)?.bytes ?? 1;

  const fmt = (b: number) =>
    b >= 1_048_576
      ? `${(b / 1_048_576).toFixed(2)} MB`
      : b >= 1024
        ? `${(b / 1024).toFixed(1)} KB`
        : `${b} B`;

  return (
    <InteractiveDemo
      title={isJa ? "圧縮方式はデータが決める" : "The data picks the compression"}
      description={
        isJa
          ? `1 row group（${ROWS.toLocaleString()} 行）を書き出すとき、DuckDB は候補となる圧縮関数それぞれに Analyze を通し、FinalAnalyze が返す推定バイト数が最小のものを採用します。列を選んで、その競争を覗いてみてください（数値は概算）。`
          : `When flushing one row group (${ROWS.toLocaleString()} rows), DuckDB runs Analyze for every candidate compression function and keeps the one whose FinalAnalyze returns the smallest estimate. Pick a column to watch that contest (figures are ballpark).`
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {DATASETS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={selected === d.id}
              onClick={() => setSelected(d.id)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                selected === d.id
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {isJa ? d.label.ja : d.label.en}
            </button>
          ))}
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2">
          <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            {isJa ? "物理型とサンプル" : "Physical type & sample"}
          </div>
          <div className="mt-1 font-mono text-xs text-foreground">
            <span className="text-accent">{ds.physical}</span> — {ds.sample}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {ds.candidates.map((c) => {
            const skipped = c.bytes <= 0;
            const isWinner = c.name === ds.winner;
            const pct = skipped ? 0 : (c.bytes / max) * 100;
            return (
              <div key={c.name} className="flex items-center gap-2">
                <span
                  className={`w-44 shrink-0 font-mono text-[11px] ${
                    isWinner
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {c.name}
                </span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-sm border border-border bg-background">
                  {!skipped && (
                    <div
                      className={`h-full transition-all duration-500 ${
                        isWinner ? "bg-emerald-500/70" : "bg-accent/30"
                      }`}
                      style={{ width: `${Math.max(pct, 1.5)}%` }}
                    />
                  )}
                  <span className="absolute inset-y-0 left-2 font-mono text-[10px] leading-6 text-foreground">
                    {skipped
                      ? isJa
                        ? "この列のデータには当てはまらない"
                        : "does not apply to this data"
                      : fmt(c.bytes)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2">
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {ds.winner}
          </span>
          <span className="font-mono text-[11px] text-foreground">
            {fmt(uncompressed)} → {fmt(best)} ({(uncompressed / best).toFixed(1)}×)
          </span>
        </div>

        <div className="rounded-md border border-border bg-background px-3 py-2 text-xs leading-relaxed text-foreground">
          {isJa ? ds.why.ja : ds.why.en}
        </div>
      </div>
    </InteractiveDemo>
  );
}
