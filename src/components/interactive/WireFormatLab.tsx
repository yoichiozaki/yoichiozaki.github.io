"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * Byte-exact comparison of the same payload encoded as
 * JSON vs protobuf.
 *
 *   message User {
 *     int32  id     = 1;
 *     string name   = 2;
 *     string email  = 3;
 *     bool   active = 4;
 *     int32  score  = 5;
 *   }
 *   message ListUsersResponse { repeated User users = 1; }
 *
 * JSON sizes come from actually building the string.
 * Protobuf sizes come from applying the encoding rules
 * (https://protobuf.dev/programming-guides/encoding/).
 * Nothing here is a guess.
 * ────────────────────────────────────────────────────────── */

function varintLen(n: number): number {
  if (n < 0) return 10; // negative int32 is sign-extended to 64 bits
  let len = 1;
  let v = Math.floor(n);
  while (v >= 128) {
    v = Math.floor(v / 128);
    len++;
  }
  return len;
}

function utf8Len(s: string): number {
  let n = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    n += cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4;
  }
  return n;
}

type User = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  score: number;
};

function buildUsers(count: number, nameLen: number, zeroHeavy: boolean): User[] {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const base = `u${id}`;
    const name =
      base.length >= nameLen ? base.slice(0, nameLen) : base.padEnd(nameLen, "a");
    const sparse = zeroHeavy && i % 2 === 0;
    return {
      id,
      name,
      email: `${name}@example.com`,
      active: !sparse,
      score: sparse ? 0 : 100 + i,
    };
  });
}

/** Exact protobuf byte count for the ListUsersResponse above. */
function protobufBytes(users: User[]): number {
  let total = 0;
  for (const u of users) {
    let body = 0;
    // field 1 (int32 id) — omitted when 0 under proto3 implicit presence
    if (u.id !== 0) body += 1 + varintLen(u.id);
    // field 2 (string name)
    const nameBytes = utf8Len(u.name);
    if (nameBytes > 0) body += 1 + varintLen(nameBytes) + nameBytes;
    // field 3 (string email)
    const emailBytes = utf8Len(u.email);
    if (emailBytes > 0) body += 1 + varintLen(emailBytes) + emailBytes;
    // field 4 (bool active) — omitted when false
    if (u.active) body += 1 + 1;
    // field 5 (int32 score) — omitted when 0
    if (u.score !== 0) body += 1 + varintLen(u.score);
    // wrapped in repeated field 1 of the response message
    total += 1 + varintLen(body) + body;
  }
  return total;
}

type Props = { locale?: string };

export function WireFormatLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [count, setCount] = useState(25);
  const [nameLen, setNameLen] = useState(8);
  const [zeroHeavy, setZeroHeavy] = useState(false);

  const stats = useMemo(() => {
    const users = buildUsers(count, nameLen, zeroHeavy);
    const payload = { users };
    const compact = utf8Len(JSON.stringify(payload));
    const pretty = utf8Len(JSON.stringify(payload, null, 2));
    const proto = protobufBytes(users);
    return { compact, pretty, proto, sample: users[0] };
  }, [count, nameLen, zeroHeavy]);

  const max = Math.max(stats.pretty, stats.compact, stats.proto);
  const ratio = stats.compact > 0 ? stats.proto / stats.compact : 0;

  return (
    <InteractiveDemo
      title={isJa ? "同じデータ、違うワイヤ表現" : "Same data, different wire formats"}
      description={
        isJa
          ? "ユーザ一覧レスポンスを JSON と Protobuf で符号化したときのバイト数を、実際に符号化規則を適用して数えています (推定値ではありません)。"
          : "Byte counts for a user-list response encoded as JSON and as protobuf, computed by actually applying the encoding rules — not estimates."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider
            label={isJa ? "レコード件数" : "records"}
            min={1}
            max={200}
            step={1}
            value={count}
            onChange={setCount}
          />
          <Slider
            label={isJa ? "name の文字数" : "name length (chars)"}
            min={2}
            max={40}
            step={1}
            value={nameLen}
            onChange={setNameLen}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={zeroHeavy}
            onChange={(e) => setZeroHeavy(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            {isJa
              ? "半数のレコードで一部フィールドをゼロ値にする (active=false, score=0) — proto3 の暗黙的プレゼンスでは、そのフィールドが出力されなくなります"
              : "Set some fields to their zero value in half the records (active=false, score=0) — proto3 implicit presence drops those fields from the wire"}
          </span>
        </label>

        <div className="space-y-2">
          <Bar
            label={isJa ? "JSON (整形あり・2 スペース)" : "JSON (pretty, 2-space)"}
            bytes={stats.pretty}
            max={max}
            color="bg-[#c64545]"
          />
          <Bar
            label={isJa ? "JSON (最小化)" : "JSON (minified)"}
            bytes={stats.compact}
            max={max}
            color="bg-[#e8a55a]"
          />
          <Bar
            label="Protobuf"
            bytes={stats.proto}
            max={max}
            color="bg-[#5db872]"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label={isJa ? "Protobuf / JSON" : "protobuf / JSON"}
            value={`${(ratio * 100).toFixed(0)}%`}
          />
          <Stat
            label={isJa ? "1 レコードあたり (JSON)" : "per record (JSON)"}
            value={`${(stats.compact / count).toFixed(1)} B`}
          />
          <Stat
            label={isJa ? "1 レコードあたり (Protobuf)" : "per record (protobuf)"}
            value={`${(stats.proto / count).toFixed(1)} B`}
          />
        </div>

        {stats.sample && (
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {isJa ? "先頭レコード" : "first record"}
            </p>
            <code className="block break-all font-mono text-xs text-foreground">
              {JSON.stringify(stats.sample)}
            </code>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          {isJa
            ? "注意: この比較は「本体のバイト数」だけです。実運用では gzip / brotli が効くため差は大きく縮みます — JSON の繰り返しキー名は圧縮率が非常に高いからです。ネットワーク帯域だけが理由なら、Protobuf に移る前にまず圧縮を有効にしてください。逆に圧縮しても消えないのは CPU コスト (パース時間) と、スキーマがもたらす型安全性です。"
            : "Caveat: this compares body bytes only. In production gzip/brotli narrows the gap sharply, because JSON's repeated key names compress extremely well. If bandwidth is your only concern, turn on compression before reaching for protobuf. What compression does not remove is CPU cost (parse time) and the type safety a schema gives you."}
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
      <div className="mb-0.5 flex items-center justify-between font-mono text-xs">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {bytes.toLocaleString()} B
        </span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded bg-muted">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-lg text-foreground">{value}</p>
    </div>
  );
}
