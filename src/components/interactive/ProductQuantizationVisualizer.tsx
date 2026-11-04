"use client";

import { useMemo, useState } from "react";
import { InteractiveDemo } from "@/components/interactive";

type Props = { locale?: string };

// Simulate Product Quantization:
// - A D=8 vector is split into M=4 sub-vectors of dim 2.
// - Each sub-space has a codebook of k=4 centroids.
// - The vector is encoded as 4 code indices (each 2 bits), total 8 bits = 1 byte.
// User can edit the query vector, watch which codebook entries it maps to,
// and see the approximate distance vs. the true distance.

type Centroid = { id: number; pos: [number, number] };

const CODEBOOKS: Centroid[][] = [
  // sub-space 1 (dims 0..1)
  [
    { id: 0, pos: [0.2, 0.3] },
    { id: 1, pos: [0.8, 0.2] },
    { id: 2, pos: [0.3, 0.8] },
    { id: 3, pos: [0.7, 0.7] },
  ],
  // sub-space 2 (dims 2..3)
  [
    { id: 0, pos: [0.1, 0.5] },
    { id: 1, pos: [0.9, 0.4] },
    { id: 2, pos: [0.5, 0.1] },
    { id: 3, pos: [0.5, 0.9] },
  ],
  // sub-space 3 (dims 4..5)
  [
    { id: 0, pos: [0.25, 0.25] },
    { id: 1, pos: [0.75, 0.25] },
    { id: 2, pos: [0.25, 0.75] },
    { id: 3, pos: [0.75, 0.75] },
  ],
  // sub-space 4 (dims 6..7)
  [
    { id: 0, pos: [0.15, 0.15] },
    { id: 1, pos: [0.5, 0.5] },
    { id: 2, pos: [0.85, 0.15] },
    { id: 3, pos: [0.5, 0.9] },
  ],
];

// Database entry (8-dim)
const DB_VECTOR: number[] = [0.7, 0.68, 0.88, 0.45, 0.26, 0.78, 0.48, 0.52];

// Pre-encode DB vector (nearest centroid per sub-space)
function encode(vec: number[]): number[] {
  const codes: number[] = [];
  for (let m = 0; m < CODEBOOKS.length; m++) {
    const sub: [number, number] = [vec[m * 2], vec[m * 2 + 1]];
    let best = 0;
    let bestD = Infinity;
    for (const c of CODEBOOKS[m]) {
      const d = (c.pos[0] - sub[0]) ** 2 + (c.pos[1] - sub[1]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c.id;
      }
    }
    codes.push(best);
  }
  return codes;
}

function trueDistance(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

function pqApproxDistance(q: number[], codes: number[]) {
  // For each sub-space, add squared distance between query sub-vector and the
  // database centroid (looked up via the code). This is ADC (asymmetric).
  let s = 0;
  for (let m = 0; m < codes.length; m++) {
    const qsub: [number, number] = [q[m * 2], q[m * 2 + 1]];
    const c = CODEBOOKS[m][codes[m]];
    s += (c.pos[0] - qsub[0]) ** 2 + (c.pos[1] - qsub[1]) ** 2;
  }
  return s;
}

export function ProductQuantizationVisualizer({ locale = "ja" }: Props) {
  const [query, setQuery] = useState<number[]>([
    0.6, 0.6, 0.8, 0.4, 0.3, 0.7, 0.5, 0.5,
  ]);
  const isJa = locale === "ja";

  const dbCodes = useMemo(() => encode(DB_VECTOR), []);
  const trueD = trueDistance(query, DB_VECTOR);
  const approxD = pqApproxDistance(query, dbCodes);
  // Each sub-space uses k*=4 centroids => 2 bits per code => total = m * 2 bits.
  const totalBits = CODEBOOKS.length * 2;
  const rawBytes = DB_VECTOR.length * 4; // float32

  return (
    <InteractiveDemo
      title={isJa ? "Product Quantization: 部分空間ごとのコードで距離を近似する" : "Product Quantization: approximating distance from subspace codes"}
      description={
        isJa
          ? "PQ は部分空間ごとに、最も近いセントロイドの ID（コード）だけを保存します。部分空間ごとの図は、セントロイド（灰色の点）、DB ベクトルの部分ベクトル（青い点）、コードに選ばれたセントロイド（大きい点）を示します。このデモは、8 次元を 4 つの部分空間に分け、それぞれ 4 個のセントロイドを使う縮小版です。本文の例（d=1024）では m=64、k*=256 です。"
          : "PQ stores only the ID (code) of the nearest centroid in each subspace. Each subspace panel shows the centroids (gray dots), the DB vector's subvector (blue dot), and the centroid chosen as the code (large dot). This scaled-down demo splits 8 dimensions into 4 subspaces with 4 centroids each; the article's example (d=1024) uses m=64, k*=256."
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 text-sm font-semibold text-foreground">
            {isJa ? `クエリーベクトル (8 次元の float32 = ${rawBytes} バイト)` : `Query vector (8-dim float32 = ${rawBytes} B)`}
          </div>
          <div className="space-y-1.5">
            {query.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-mono">
                <span className="w-12 text-muted-foreground">q[{i}]</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={v}
                  onChange={(e) => {
                    const nq = [...query];
                    nq[i] = Number(e.target.value);
                    setQuery(nq);
                  }}
                  className="flex-1"
                />
                <span className="w-10 text-right">{v.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold text-foreground">
            {isJa ? `DB ベクトル (PQ で ${totalBits} ビットに圧縮)` : `DB vector (PQ-compressed to ${totalBits} bits)`}
          </div>
          <div className="space-y-2">
            {CODEBOOKS.map((cb, m) => {
              const code = dbCodes[m];
              const sub: [number, number] = [DB_VECTOR[m * 2], DB_VECTOR[m * 2 + 1]];
              return (
                <div
                  key={m}
                  className="rounded-md border border-border bg-background p-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">subspace i={m}</span>
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-accent">
                      code={code}
                    </span>
                  </div>
                  <svg viewBox="0 0 100 100" className="mt-1 w-full h-20 border border-border/50 rounded-sm bg-muted/30">
                    {cb.map((c) => (
                      <g key={c.id}>
                        <circle
                          cx={c.pos[0] * 100}
                          cy={c.pos[1] * 100}
                          r={c.id === code ? 5 : 3}
                          className={
                            c.id === code ? "fill-accent" : "fill-muted-foreground/50"
                          }
                        />
                        <text
                          x={c.pos[0] * 100 + 6}
                          y={c.pos[1] * 100 + 3}
                          fontSize={6}
                          className="fill-foreground font-mono"
                        >
                          {c.id}
                        </text>
                      </g>
                    ))}
                    <circle
                      cx={sub[0] * 100}
                      cy={sub[1] * 100}
                      r={2.5}
                      className="fill-blue-500"
                    />
                    <text
                      x={sub[0] * 100 + 4}
                      y={sub[1] * 100 - 3}
                      fontSize={5}
                      className="fill-blue-500 font-mono"
                    >
                      db
                    </text>
                  </svg>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs font-mono text-muted-foreground">
            {isJa ? "コード列" : "codes"}: [{dbCodes.join(", ")}] · {totalBits} bits ·{" "}
            {((rawBytes * 8) / totalBits).toFixed(0)}× {isJa ? "圧縮" : "compression"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-sm">
        <div className="rounded-md border border-border bg-background p-3">
          <div className="text-xs text-muted-foreground">
            {isJa ? `真の距離の二乗 (${rawBytes} バイトで比較)` : `True squared distance (${rawBytes} B vectors)`}
          </div>
          <div className="font-mono text-lg text-foreground">
            {trueD.toFixed(4)}
          </div>
        </div>
        <div className="rounded-md border border-accent bg-accent/10 p-3">
          <div className="text-xs text-muted-foreground">
            {isJa ? `PQ 近似距離の二乗 (${totalBits} ビットのコードで比較)` : `PQ approx. squared distance (${totalBits}-bit code)`}
          </div>
          <div className="font-mono text-lg text-accent">
            {approxD.toFixed(4)}{" "}
            <span className="text-xs">
              (rel. err {((approxD - trueD) / Math.max(trueD, 1e-6)).toFixed(2)})
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {isJa
          ? "スライダーでクエリーを動かすと、PQ の近似値が真の値をどこまでなぞるかが分かります。DB ベクトルのコードは固定で、クエリーは圧縮しません（ADC）。"
          : "Move the sliders to change the query and see how closely the PQ approximation tracks the true value. The DB vector's codes stay fixed, and the query is never compressed (ADC)."}
      </p>
    </InteractiveDemo>
  );
}
