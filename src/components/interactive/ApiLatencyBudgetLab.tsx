"use client";

import { useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

/* ──────────────────────────────────────────────────────────
 * A deliberately simple first-order latency model.
 *
 *   total = handshake + RTT + backend + transfer + codec
 *
 * The point is not precision — it is to show that serialization
 * format is usually a small slice of the pie, so "gRPC is 10x
 * faster than REST" benchmarks are measuring something narrower
 * than end-to-end request latency.
 * ────────────────────────────────────────────────────────── */

type Props = { locale?: string };

const SEGMENTS = [
  { key: "handshake", color: "bg-violet-500", ja: "接続確立", en: "connection setup" },
  { key: "rtt", color: "bg-sky-500", ja: "RTT", en: "RTT" },
  { key: "backend", color: "bg-slate-500", ja: "バックエンド処理", en: "backend work" },
  { key: "transfer", color: "bg-amber-500", ja: "転送", en: "transfer" },
  { key: "codec", color: "bg-emerald-500", ja: "直列化 + 復元", en: "serialize + parse" },
] as const;

type SegKey = (typeof SEGMENTS)[number]["key"];
type Breakdown = Record<SegKey, number>;

export function ApiLatencyBudgetLab({ locale = "ja" }: Props) {
  const isJa = locale === "ja";
  const [rtt, setRtt] = useState(1.5);
  const [backend, setBackend] = useState(8);
  const [payloadKb, setPayloadKb] = useState(40);
  const [mbps, setMbps] = useState(1000);
  const [protoRatio, setProtoRatio] = useState(45); // % of JSON size
  const [coldConnection, setColdConnection] = useState(false);

  // Codec throughput, MB/s. Order-of-magnitude figures for a
  // typical managed runtime; both are user-visible as assumptions.
  const JSON_MBPS = 250;
  const PROTO_MBPS = 1200;

  const jsonBytes = payloadKb * 1024;
  const protoBytes = jsonBytes * (protoRatio / 100);

  const transferMs = (bytes: number) => (bytes * 8) / (mbps * 1000); // ms
  const codecMs = (bytes: number, mbPerSec: number) =>
    (2 * bytes) / (mbPerSec * 1024 * 1024) * 1000; // encode + decode

  // TCP (1 RTT) + TLS 1.3 (1 RTT) on a cold connection.
  const handshake = coldConnection ? 2 * rtt : 0;

  const rest: Breakdown = {
    handshake,
    rtt,
    backend,
    transfer: transferMs(jsonBytes),
    codec: codecMs(jsonBytes, JSON_MBPS),
  };
  const grpc: Breakdown = {
    handshake,
    rtt,
    backend,
    transfer: transferMs(protoBytes),
    codec: codecMs(protoBytes, PROTO_MBPS),
  };

  const sum = (b: Breakdown) => SEGMENTS.reduce((acc, s) => acc + b[s.key], 0);
  const restTotal = sum(rest);
  const grpcTotal = sum(grpc);
  const max = Math.max(restTotal, grpcTotal);
  const savedPct = restTotal > 0 ? ((restTotal - grpcTotal) / restTotal) * 100 : 0;

  const verdict = (() => {
    if (savedPct < 5) {
      return isJa
        ? "総レイテンシの支配項は RTT とバックエンド処理です。ここでフォーマットを替えても体感は変わりません — まず DB とネットワーク経路を疑ってください。"
        : "RTT and backend work dominate. Swapping the wire format here will not be felt — look at the database and the network path first.";
    }
    if (savedPct < 20) {
      return isJa
        ? "効果はありますが桁は変わりません。可視化・LB・ブラウザ対応など運用コストと天秤にかけて判断すべき領域です。"
        : "There is a real gain, but not an order of magnitude. Weigh it against the operational cost: observability, load balancing, browser support.";
    }
    return isJa
      ? "ペイロードが支配的な領域です。ここでは直列化フォーマットの選択が効きます — ただし先に gzip/brotli を試す価値があります。"
      : "You are in the payload-dominated regime, where the wire format really matters — though gzip/brotli is worth trying first.";
  })();

  return (
    <InteractiveDemo
      title={isJa ? "レイテンシ予算はどこに消えるのか" : "Where does the latency budget actually go?"}
      description={
        isJa
          ? "「gRPC は REST より N 倍速い」というベンチマークが何を測っているのかを分解します。スライダを動かして、直列化コストが全体に占める割合を確かめてください。"
          : "Decompose what \"gRPC is N× faster than REST\" benchmarks actually measure. Move the sliders and watch how small the serialization slice usually is."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Slider label={isJa ? "RTT (ms)" : "RTT (ms)"} min={0.1} max={100} step={0.1} value={rtt} onChange={setRtt} suffix="ms" />
          <Slider label={isJa ? "バックエンド処理 (ms)" : "backend work (ms)"} min={0} max={200} step={0.5} value={backend} onChange={setBackend} suffix="ms" />
          <Slider label={isJa ? "JSON ペイロード (KB)" : "JSON payload (KB)"} min={1} max={2000} step={1} value={payloadKb} onChange={setPayloadKb} suffix="KB" />
          <Slider label={isJa ? "帯域 (Mbps)" : "bandwidth (Mbps)"} min={10} max={10000} step={10} value={mbps} onChange={setMbps} suffix="Mbps" />
          <Slider label={isJa ? "Protobuf のサイズ比" : "protobuf size ratio"} min={15} max={100} step={1} value={protoRatio} onChange={setProtoRatio} suffix="%" />
          <label className="flex cursor-pointer items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={coldConnection}
              onChange={(e) => setColdConnection(e.target.checked)}
            />
            <span className="text-muted-foreground">
              {isJa ? "毎回新規接続 (TCP + TLS1.3 = 2 RTT)" : "cold connection each call (TCP + TLS 1.3 = 2 RTT)"}
            </span>
          </label>
        </div>

        <div className="space-y-3">
          <StackedBar
            title={isJa ? "REST + JSON over HTTP/1.1" : "REST + JSON over HTTP/1.1"}
            breakdown={rest}
            total={restTotal}
            max={max}
            isJa={isJa}
          />
          <StackedBar
            title={isJa ? "gRPC + Protobuf over HTTP/2" : "gRPC + protobuf over HTTP/2"}
            breakdown={grpc}
            total={grpcTotal}
            max={max}
            isJa={isJa}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {SEGMENTS.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1">
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${s.color}`} />
              {isJa ? s.ja : s.en}
            </span>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <p className="font-mono text-sm text-foreground">
            {isJa ? "短縮率" : "reduction"}:{" "}
            <span className="text-accent">{savedPct.toFixed(1)}%</span>
            <span className="ml-2 text-muted-foreground">
              ({restTotal.toFixed(2)} ms → {grpcTotal.toFixed(2)} ms)
            </span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{verdict}</p>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {isJa
            ? `前提: 直列化スループットを JSON ${JSON_MBPS} MB/s、Protobuf ${PROTO_MBPS} MB/s とし、送信側の符号化と受信側の復号の 2 回分を計上しています (いずれも桁感の目安で、ランタイムとスキーマ形状で大きく変わります)。転送は帯域だけの単純モデルで、TCP の輻輳制御・スロースタート・HTTP/2 のフロー制御ウィンドウは無視しています。実測ではこれらが効くため、大きなレスポンスでは転送項がここより大きくなりがちです。`
            : `Assumptions: serialization throughput of ${JSON_MBPS} MB/s for JSON and ${PROTO_MBPS} MB/s for protobuf, counted twice (encode on the server, decode on the client). Both are order-of-magnitude figures that vary a lot by runtime and schema shape. Transfer is a naive bandwidth model that ignores congestion control, slow start, and HTTP/2 flow-control windows — real measurements of large responses will show a bigger transfer slice than this.`}
        </p>
      </div>
    </InteractiveDemo>
  );
}

function StackedBar({
  title,
  breakdown,
  total,
  max,
  isJa,
}: {
  title: string;
  breakdown: Breakdown;
  total: number;
  max: number;
  isJa: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-xs">
        <span className="text-foreground">{title}</span>
        <span className="text-muted-foreground">{total.toFixed(2)} ms</span>
      </div>
      <div className="flex h-6 w-full overflow-hidden rounded bg-muted">
        {SEGMENTS.map((s) => {
          const w = max > 0 ? (breakdown[s.key] / max) * 100 : 0;
          if (w <= 0) return null;
          return (
            <div
              key={s.key}
              className={`h-full ${s.color} transition-all duration-200`}
              style={{ width: `${w}%` }}
              title={`${isJa ? s.ja : s.en}: ${breakdown[s.key].toFixed(2)} ms`}
            />
          );
        })}
      </div>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block text-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-accent">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </span>
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
