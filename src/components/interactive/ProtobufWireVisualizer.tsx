"use client";

import { useMemo } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  stepPlayerAriaLabels,
  useStepPlayer,
} from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Encodes  User{ id: 42, name: "Ada", active: true }  with
 *
 *   message User {
 *     int32  id     = 1;   // wire type 0 (VARINT)
 *     string name   = 2;   // wire type 2 (LEN)
 *     bool   active = 3;   // wire type 0 (VARINT)
 *   }
 *
 * The byte table below is hand-derived from the protobuf encoding
 * spec (https://protobuf.dev/programming-guides/encoding/) and then
 * cross-checked by the assertions in `deriveBytes()`.
 * ────────────────────────────────────────────────────────── */

type ByteCell = {
  hex: string;
  /** which conceptual group the byte belongs to */
  group: "frame" | "f1" | "f2" | "f3";
  /** first step index at which this byte becomes visible */
  revealAt: number;
};

const GROUP_STYLE: Record<ByteCell["group"], string> = {
  frame: "border-slate-400/60 bg-[#8e8b82]/15 text-slate-600 dark:text-slate-300",
  f1: "border-sky-500/60 bg-[#5db8a6]/15 text-sky-700 dark:text-sky-300",
  f2: "border-emerald-500/60 bg-[#5db872]/15 text-emerald-700 dark:text-emerald-300",
  f3: "border-amber-500/60 bg-[#e8a55a]/15 text-amber-700 dark:text-amber-300",
};

const BYTES: ByteCell[] = [
  // 5-byte gRPC length-prefixed message framing, prepended at the very end.
  { hex: "00", group: "frame", revealAt: 10 },
  { hex: "00", group: "frame", revealAt: 10 },
  { hex: "00", group: "frame", revealAt: 10 },
  { hex: "00", group: "frame", revealAt: 10 },
  { hex: "09", group: "frame", revealAt: 10 },
  // field 1: id = 42
  { hex: "08", group: "f1", revealAt: 1 },
  { hex: "2A", group: "f1", revealAt: 2 },
  // field 2: name = "Ada"
  { hex: "12", group: "f2", revealAt: 3 },
  { hex: "03", group: "f2", revealAt: 4 },
  { hex: "41", group: "f2", revealAt: 5 },
  { hex: "64", group: "f2", revealAt: 6 },
  { hex: "61", group: "f2", revealAt: 7 },
  // field 3: active = true
  { hex: "18", group: "f3", revealAt: 8 },
  { hex: "01", group: "f3", revealAt: 9 },
];

const JSON_TEXT = '{"id":42,"name":"Ada","active":true}';

type StepInfo = {
  titleJa: string;
  titleEn: string;
  bodyJa: string;
  bodyEn: string;
  formula?: string;
};

const STEPS: StepInfo[] = [
  {
    titleJa: "エンコード開始",
    titleEn: "Start encoding",
    bodyJa:
      "Protobuf にはフィールド名も型名も入りません。入るのは「フィールド番号 + ワイヤ型 + 値」の三つ組だけです。スキーマ (.proto) を両端が持っている前提でメタ情報を削り落とすのが、JSON との最大の違いです。",
    bodyEn:
      "Protobuf carries no field names and no type names on the wire. Each field is just (field number, wire type, value). Stripping metadata is only possible because both ends already share the schema (.proto) — that is the core difference from JSON.",
  },
  {
    titleJa: "field 1 のタグバイト",
    titleEn: "Tag byte for field 1",
    bodyJa:
      "タグは「フィールド番号 << 3 | ワイヤ型」を varint で書いたもの。id はフィールド番号 1、int32 なのでワイヤ型 0 (VARINT)。(1 << 3) | 0 = 8 = 0x08。",
    bodyEn:
      "A tag is (field number << 3 | wire type) written as a varint. `id` is field 1 and an int32, so wire type 0 (VARINT): (1 << 3) | 0 = 8 = 0x08.",
    formula: "(1 << 3) | 0 = 0x08",
  },
  {
    titleJa: "id の値 42",
    titleEn: "Value 42 for id",
    bodyJa:
      "varint は 7 ビットずつ little-endian に詰め、続きがある間だけ最上位ビット (MSB) を 1 にします。42 は 7 ビットに収まるので 1 バイト: 0x2A。",
    bodyEn:
      "A varint packs 7 bits per byte, little-endian, setting the MSB while more bytes follow. 42 fits in 7 bits, so it is a single byte: 0x2A.",
    formula: "42 = 0b0101010 → 0x2A",
  },
  {
    titleJa: "field 2 のタグバイト",
    titleEn: "Tag byte for field 2",
    bodyJa:
      "name はフィールド番号 2、string なのでワイヤ型 2 (LEN = 長さ前置き)。(2 << 3) | 2 = 18 = 0x12。",
    bodyEn:
      "`name` is field 2 and a string, so wire type 2 (LEN — length-delimited): (2 << 3) | 2 = 18 = 0x12.",
    formula: "(2 << 3) | 2 = 0x12",
  },
  {
    titleJa: "文字列長 3",
    titleEn: "Length prefix 3",
    bodyJa:
      "LEN 型は「長さ (varint) + 生バイト列」。\"Ada\" は UTF-8 で 3 バイトなので 0x03。デリミタも引用符もエスケープも不要です。",
    bodyEn:
      "LEN fields are `length (varint) + raw bytes`. \"Ada\" is 3 bytes in UTF-8, so 0x03. No delimiters, no quotes, no escaping.",
    formula: 'len("Ada") = 3 → 0x03',
  },
  {
    titleJa: "'A' = 0x41",
    titleEn: "'A' = 0x41",
    bodyJa:
      "ここから UTF-8 の生バイト。JSON と違い、文字列中の \" や \\ をエスケープ解除する必要はありません。ただし `string` フィールドでは、実装によって UTF-8 妥当性検証や言語レベルの文字列オブジェクト生成のコストが残ります。",
    bodyEn:
      "Raw UTF-8 bytes follow. Unlike JSON there is no unescaping of `\"` or `\\` — though a protobuf `string` parser may still validate UTF-8 and allocate a language-level string.",
  },
  {
    titleJa: "'d' = 0x64",
    titleEn: "'d' = 0x64",
    bodyJa: "2 バイト目。長さが既知なので、パーサは終端を探すスキャンをしません。",
    bodyEn:
      "Second byte. Because the length is known up front, the parser never scans for a terminator.",
  },
  {
    titleJa: "'a' = 0x61",
    titleEn: "'a' = 0x61",
    bodyJa: "3 バイト目。これで name フィールドは完了。",
    bodyEn: "Third byte — the `name` field is complete.",
  },
  {
    titleJa: "field 3 のタグバイト",
    titleEn: "Tag byte for field 3",
    bodyJa:
      "active はフィールド番号 3、bool なのでワイヤ型 0。(3 << 3) | 0 = 24 = 0x18。フィールド番号 1〜15 はタグが 1 バイトに収まるので、頻出フィールドには小さい番号を割り当てるのが定石です。",
    bodyEn:
      "`active` is field 3 and a bool, so wire type 0: (3 << 3) | 0 = 24 = 0x18. Field numbers 1–15 fit their tag in a single byte, which is why hot fields should get low numbers.",
    formula: "(3 << 3) | 0 = 0x18",
  },
  {
    titleJa: "true = 0x01",
    titleEn: "true = 0x01",
    bodyJa:
      "bool は varint の 0 / 1。なお proto3 の「暗黙的プレゼンス」フィールドでは、値がゼロ値 (false, 0, \"\") のときそのフィールドは一切出力されません。ここが false なら 0x18 0x00 ではなく 2 バイトまるごと消えます。",
    bodyEn:
      "A bool is a varint 0/1. Note that under proto3 implicit presence a field whose value equals the zero value (false, 0, \"\") is omitted entirely — if `active` were false, both bytes would simply vanish rather than being encoded as 0x18 0x00.",
  },
  {
    titleJa: "gRPC のフレーミングを前置き",
    titleEn: "Prepend the gRPC framing",
    bodyJa:
      "gRPC は Protobuf の 9 バイトの前に 5 バイトを足します: 1 バイトの圧縮フラグ (0 = 非圧縮) と、4 バイトのビッグエンディアン長 (= 9)。この 5 バイト前置きが「Length-Prefixed-Message」で、1 本の HTTP/2 ストリーム上に複数メッセージを並べられる理由です。",
    bodyEn:
      "gRPC prepends 5 bytes to the 9 protobuf bytes: a 1-byte compressed flag (0 = uncompressed) and a 4-byte big-endian length (= 9). This `Length-Prefixed-Message` framing is what lets many messages ride a single HTTP/2 stream.",
    formula: "0x00 | 0x00000009 | <9 bytes>",
  },
  {
    titleJa: "完成 — 14 バイト vs JSON 36 バイト",
    titleEn: "Done — 14 bytes vs 36 bytes of JSON",
    bodyJa:
      "同じ意味の JSON は 36 バイト。フィールド名・引用符・コロン・カンマがすべて消え、型情報はスキーマ側に移りました。代償は「スキーマなしでは読めない」こと — curl で叩いて目視デバッグ、ができなくなります。",
    bodyEn:
      "The equivalent JSON is 36 bytes. Field names, quotes, colons, and commas are gone; type information moved into the schema. The price: the payload is unreadable without the schema — you can no longer eyeball it with curl.",
  },
];

/** Sanity-check the hand-written byte table against the encoding rules. */
function deriveBytes(): string[] {
  const out: number[] = [];
  const varint = (n: number) => {
    const bytes: number[] = [];
    let v = n;
    do {
      let b = v & 0x7f;
      v >>>= 7;
      if (v > 0) b |= 0x80;
      bytes.push(b);
    } while (v > 0);
    return bytes;
  };
  // field 1, wire type 0, value 42
  out.push(...varint((1 << 3) | 0), ...varint(42));
  // field 2, wire type 2, "Ada" (ASCII, so 1 byte per char in UTF-8)
  const name = [..."Ada"].map((c) => c.charCodeAt(0));
  out.push(...varint((2 << 3) | 2), ...varint(name.length), ...name);
  // field 3, wire type 0, true
  out.push(...varint((3 << 3) | 0), ...varint(1));
  return out.map((b) => b.toString(16).toUpperCase().padStart(2, "0"));
}

type Props = { locale?: string };

export function ProtobufWireVisualizer({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 1400 });
  const info = STEPS[player.step];

  // Keeps the illustration honest: if the table ever drifts from the spec,
  // the mismatch surfaces immediately instead of silently misleading readers.
  const derived = useMemo(() => deriveBytes(), []);
  const tableMessage = BYTES.filter((b) => b.group !== "frame").map((b) => b.hex);
  const consistent =
    derived.length === tableMessage.length &&
    derived.every((h, i) => h === tableMessage[i]);

  const visible = BYTES.filter((b) => b.revealAt <= player.step);
  const revealedThisStep = BYTES.filter((b) => b.revealAt === player.step);
  const messageBytes = visible.filter((b) => b.group !== "frame").length;
  const totalBytes = visible.length;

  return (
    <InteractiveDemo
      title={isJa ? "Protobuf を 1 バイトずつ組み立てる" : "Build a protobuf message byte by byte"}
      description={
        isJa
          ? "User{ id: 42, name: \"Ada\", active: true } を Protobuf でエンコードし、最後に gRPC のフレーミングを被せるまでを追います。右の JSON と比べてみてください。"
          : "Encode User{ id: 42, name: \"Ada\", active: true } as protobuf, then wrap it in gRPC framing. Compare it with the JSON on the right."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          {/* Byte grid */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <Legend className={GROUP_STYLE.frame} label={isJa ? "gRPC フレーム" : "gRPC frame"} />
              <Legend className={GROUP_STYLE.f1} label="field 1: id" />
              <Legend className={GROUP_STYLE.f2} label="field 2: name" />
              <Legend className={GROUP_STYLE.f3} label="field 3: active" />
            </div>
            <div className="flex min-h-24 flex-wrap gap-1.5">
              {BYTES.map((b, i) => {
                const shown = b.revealAt <= player.step;
                const isNew = b.revealAt === player.step;
                return (
                  <div
                    key={i}
                    className={`flex h-9 w-9 items-center justify-center rounded border font-mono text-xs transition-all duration-300 ${
                      shown
                        ? `${GROUP_STYLE[b.group]} ${isNew ? "scale-110 ring-2 ring-accent" : ""}`
                        : "border-dashed border-border/60 bg-transparent text-transparent"
                    }`}
                  >
                    {shown ? b.hex : "··"}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              {isJa
                ? `メッセージ ${messageBytes} B / 合計 ${totalBytes} B`
                : `message ${messageBytes} B / total ${totalBytes} B`}
            </p>
          </div>

          {/* JSON comparison */}
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "同じ意味の JSON" : "The same value as JSON"}
            </p>
            <code className="block break-all rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground">
              {JSON_TEXT}
            </code>
            <div className="mt-3 space-y-1.5">
              <SizeBar
                label="JSON"
                bytes={JSON_TEXT.length}
                max={JSON_TEXT.length}
                color="bg-[#c64545]"
              />
              <SizeBar
                label={isJa ? "Protobuf (本体)" : "Protobuf (body)"}
                bytes={messageBytes}
                max={JSON_TEXT.length}
                color="bg-[#5db872]"
              />
              <SizeBar
                label={isJa ? "gRPC フレーム込み" : "with gRPC framing"}
                bytes={totalBytes}
                max={JSON_TEXT.length}
                color="bg-[#5db8a6]"
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {isJa
                ? "ただし HTTP/2 のフレームヘッダ (9 B/フレーム) と HPACK 圧縮後のヘッダは別途乗ります。"
                : "HTTP/2 frame headers (9 B each) and HPACK-compressed headers sit on top of this."}
            </p>
          </div>
        </div>

        {/* Narration */}
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[11px] text-accent">
              {String(player.step).padStart(2, "0")}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {isJa ? info.titleJa : info.titleEn}
            </span>
            {revealedThisStep.length > 0 && (
              <span className="font-mono text-[11px] text-muted-foreground">
                +{revealedThisStep.map((b) => `0x${b.hex}`).join(" ")}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {isJa ? info.bodyJa : info.bodyEn}
          </p>
          {info.formula && (
            <code className="mt-2 inline-block rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
              {info.formula}
            </code>
          )}
        </div>

        {!consistent && (
          <p className="rounded border border-red-500/50 bg-[#c64545]/10 p-2 text-xs text-red-600 dark:text-red-400">
            {isJa
              ? "内部整合性チェックに失敗しました (バイト表とエンコーダの導出結果が一致しません)。"
              : "Internal consistency check failed: the byte table disagrees with the derived encoding."}
          </p>
        )}

        <StepPlayerControls
          {...player}
          ariaLabels={stepPlayerAriaLabels(locale)}
          label={(s) => (isJa ? STEPS[s].titleJa : STEPS[s].titleEn)}
        />
      </div>
    </InteractiveDemo>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm border ${className}`} />
      {label}
    </span>
  );
}

function SizeBar({
  label,
  bytes,
  max,
  color,
}: {
  label: string;
  bytes: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (bytes / max) * 100 : 0;
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between font-mono text-[11px]">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{bytes} B</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded bg-muted">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
