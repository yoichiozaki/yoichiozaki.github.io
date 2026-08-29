"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Execution model comparison ─────────────── */

export function ExecutionModelComparison({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const rows = isJa
    ? [
        {
          model: "Volcano（1タプルずつ）",
          unit: "1 タプル",
          calls: "行数 × 演算子数",
          pros: "実装が単純。演算子を自由に組み合わせられる",
          cons: "仮想関数呼び出しと分岐予測ミスが支配的",
          used: "PostgreSQL, MySQL, Oracle",
        },
        {
          model: "ベクトル化（バッチ）",
          unit: "1024 タプル程度のバッチ",
          calls: "行数 ÷ バッチ幅 × 演算子数",
          pros: "呼び出し回数が3桁減り、SIMD と列指向レイアウトが活きる",
          cons: "中間バッチのメモリが必要。行指向ストレージとは相性が悪い",
          used: "DuckDB, ClickHouse, Velox, Photon",
        },
        {
          model: "コード生成（JIT）",
          unit: "パイプライン全体",
          calls: "0（融合されて消える）",
          pros: "中間表現が消え、値がレジスタに載ったまま処理できる",
          cons: "コンパイル時間。短いクエリでは元が取れない",
          used: "HyPer, Umbra, Spark（全段コード生成）",
        },
      ]
    : [
        {
          model: "Volcano (tuple at a time)",
          unit: "1 tuple",
          calls: "rows × operators",
          pros: "Simple to implement; operators compose freely",
          cons: "Virtual calls and branch mispredictions dominate",
          used: "PostgreSQL, MySQL, Oracle",
        },
        {
          model: "Vectorized (batch)",
          unit: "batch of ~1024 tuples",
          calls: "rows ÷ batch × operators",
          pros: "Three orders of magnitude fewer calls; SIMD and columnar layouts pay off",
          cons: "Needs memory for intermediate batches; a poor fit for row stores",
          used: "DuckDB, ClickHouse, Velox, Photon",
        },
        {
          model: "Code generation (JIT)",
          unit: "whole pipeline",
          calls: "0 (fused away)",
          pros: "Intermediate representations vanish; values stay in registers",
          cons: "Compilation time; not worth it for short queries",
          used: "HyPer, Umbra, Spark (whole-stage codegen)",
        },
      ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "実行モデル" : "Execution model"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "next() が返す単位" : "Unit returned by next()"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "呼び出し回数" : "Call count"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "利点" : "Strengths"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "欠点" : "Weaknesses"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "採用例" : "Used by"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.model} className="border-b border-border align-top">
              <td className="px-2 py-2 font-semibold text-foreground">{r.model}</td>
              <td className="px-2 py-2 font-mono text-muted-foreground">{r.unit}</td>
              <td className="px-2 py-2 font-mono text-muted-foreground">{r.calls}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.pros}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.cons}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.used}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 2. Access path comparison ─────────────────── */

export function AccessPathComparison({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const rows = isJa
    ? [
        {
          path: "Seq Scan",
          reads: "全ブロックを順番に",
          io: "順次読み（先読みが効く）",
          when: "テーブルの大部分を返すとき、または索引が無いとき",
          gotcha: "選択率が高いほど有利。1行取り出すには最悪",
        },
        {
          path: "Index Scan",
          reads: "索引を辿り、TID ごとにヒープを参照",
          io: "ランダム読み（1行につき最悪1ページ）",
          when: "選択率が十分低いとき",
          gotcha: "行数が増えると同じヒープページを何度も読む",
        },
        {
          path: "Index Only Scan",
          reads: "索引だけを読み、ヒープには触れない",
          io: "索引ページのみ",
          when: "必要な列がすべて索引に含まれるとき",
          gotcha: "PostgreSQL では可視性マップが立っているページに限られる",
        },
        {
          path: "Bitmap Heap Scan",
          reads: "TID をビットマップに集めてから物理順にヒープを読む",
          io: "ランダム読みを順次読みに変換",
          when: "中間的な選択率、複数索引の AND / OR",
          gotcha: "ビットマップが work_mem を超えるとページ単位に劣化する",
        },
      ]
    : [
        {
          path: "Seq Scan",
          reads: "Every block, in order",
          io: "Sequential reads (prefetch friendly)",
          when: "When most of the table is returned, or no index exists",
          gotcha: "The higher the selectivity the better; terrible for a single row",
        },
        {
          path: "Index Scan",
          reads: "Walk the index, then fetch the heap per TID",
          io: "Random reads (up to one page per row)",
          when: "When selectivity is low enough",
          gotcha: "As row counts grow, the same heap page is read again and again",
        },
        {
          path: "Index Only Scan",
          reads: "Reads only the index; never touches the heap",
          io: "Index pages only",
          when: "When every needed column is contained in the index",
          gotcha: "In PostgreSQL, limited to pages marked all-visible in the visibility map",
        },
        {
          path: "Bitmap Heap Scan",
          reads: "Collect TIDs into a bitmap, then read the heap in physical order",
          io: "Turns random reads into sequential ones",
          when: "Moderate selectivity; AND/OR across several indexes",
          gotcha: "Degrades to page granularity once the bitmap exceeds work_mem",
        },
      ];

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "アクセスパス" : "Access path"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "読み方" : "What it reads"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              I/O
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "有利な条件" : "When it wins"}
            </th>
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "落とし穴" : "Gotcha"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.path} className="border-b border-border align-top">
              <td className="px-2 py-2 font-mono font-semibold text-foreground">
                {r.path}
              </td>
              <td className="px-2 py-2 text-muted-foreground">{r.reads}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.io}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.when}</td>
              <td className="px-2 py-2 text-muted-foreground">{r.gotcha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── 3. Search space growth ────────────────────── */

export function PlanSpaceTable({ locale = "ja" }: DiagramProps) {
  const isJa = locale === "ja";
  const fact = (n: number) => {
    let r = 1;
    for (let k = 2; k <= n; k += 1) r *= k;
    return r;
  };
  const rows = [2, 4, 6, 8, 10].map((n) => ({
    n,
    leftDeep: fact(n),
    bushy: fact(2 * n - 2) / fact(n - 1),
    subsets: 2 ** n,
  }));
  const num = (x: number) =>
    x >= 1e15 ? x.toExponential(2) : Math.round(x).toLocaleString("en-US");

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-xs">
        <thead>
          <tr className="border-b-2 border-border text-left">
            <th scope="col" className="px-2 py-2 font-semibold text-foreground">
              {isJa ? "テーブル数 n" : "Relations n"}
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-right font-semibold text-foreground"
            >
              {isJa ? "左深優先木 n!" : "Left-deep trees n!"}
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-right font-semibold text-foreground"
            >
              {isJa ? "ブッシー木 (2n−2)!/(n−1)!" : "Bushy trees (2n−2)!/(n−1)!"}
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-right font-semibold text-foreground"
            >
              {isJa ? "DP 表の項目数 2ⁿ" : "DP table entries 2ⁿ"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.n} className="border-b border-border">
              <td className="px-2 py-1.5 font-mono font-semibold text-foreground">
                {r.n}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                {num(r.leftDeep)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                {num(r.bushy)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                {num(r.subsets)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        {isJa
          ? "列挙する木の数は階乗的に増えますが、動的計画法が管理するのは部分集合の数 2ⁿ です。それでも n = 12 前後で現実的な限界に達し、多くの実装はそこから遺伝的アルゴリズムなどのヒューリスティック探索に切り替えます。"
          : "The number of trees to enumerate grows factorially, but dynamic programming only tracks 2ⁿ subsets. Even so, the practical limit arrives around n = 12, and most implementations switch to heuristic search (for example a genetic algorithm) beyond it."}
      </p>
    </div>
  );
}

/* ── 4. Cardinality error propagation ──────────── */

export function CardinalityErrorDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const isJa = locale === "ja";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const red = dark ? "#f87171" : "#dc2626";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const levels = [
    { label: isJa ? "基底テーブル" : "Base table", est: "×1", err: 1 },
    { label: isJa ? "1回目の結合" : "1st join", est: "×4", err: 4 },
    { label: isJa ? "2回目の結合" : "2nd join", est: "×16", err: 16 },
    { label: isJa ? "3回目の結合" : "3rd join", est: "×64", err: 64 },
  ];

  const caption = isJa
    ? "推定誤差は結合を1段登るごとに掛け算で増える"
    : "Estimation error multiplies with every join level";

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 620 250"
        role="img"
        aria-label={`${caption}. ${levels.map((lv) => `${lv.label} ${lv.est}`).join(", ")}.`}
        className="mx-auto w-full min-w-[520px] max-w-2xl"
      >
        <title>{caption}</title>
        <text x={310} y={18} textAnchor="middle" fill={text} fontSize={13} fontWeight={700}>
          {caption}
        </text>

        {levels.map((lv, i) => {
          const x = 40 + i * 145;
          const h = Math.min(120, 14 * Math.log2(lv.err + 1) + 14);
          const y = 200 - h;
          return (
            <g key={lv.label}>
              <rect
                x={x}
                y={y}
                width={90}
                height={h}
                rx={4}
                fill={i === 0 ? accent : red}
                opacity={i === 0 ? 0.55 : 0.25 + i * 0.2}
                stroke={i === 0 ? accent : red}
              />
              <text
                x={x + 45}
                y={y - 7}
                textAnchor="middle"
                fill={i === 0 ? accent : red}
                fontSize={13}
                fontWeight={700}
              >
                {lv.est}
              </text>
              <text x={x + 45} y={218} textAnchor="middle" fill={text} fontSize={11}>
                {lv.label}
              </text>
              {i < levels.length - 1 && (
                <line
                  x1={x + 95}
                  y1={185}
                  x2={x + 138}
                  y2={185}
                  stroke={border}
                  strokeWidth={1.5}
                  markerEnd="url(#cardArrow)"
                />
              )}
            </g>
          );
        })}

        <defs>
          <marker id="cardArrow" markerWidth={8} markerHeight={8} refX={7} refY={4} orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={border} />
          </marker>
        </defs>

        <line x1={30} y1={200} x2={590} y2={200} stroke={border} strokeWidth={1} />
        <text x={310} y={243} textAnchor="middle" fill={muted} fontSize={10}>
          {isJa
            ? "各段で 4 倍ずれると仮定した場合。誤差は打ち消し合わず、片側に積み上がる"
            : "Assuming a 4× error at each level. Errors do not cancel — they accumulate in one direction."}
        </text>
      </svg>
    </div>
  );
}

/* ── 5. Heap tuple byte anatomy ────────────────── */

export function HeapTupleAnatomy({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const isJa = locale === "ja";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const violet = dark ? "#a78bfa" : "#7c3aed";
  const amber = dark ? "#fbbf24" : "#d97706";
  const green = dark ? "#4ade80" : "#16a34a";

  const fields = [
    { name: "t_xmin", size: 4, color: violet, desc: isJa ? "作成トランザクション ID" : "creating xact id" },
    { name: "t_xmax", size: 4, color: violet, desc: isJa ? "削除トランザクション ID" : "deleting xact id" },
    { name: "t_cid", size: 4, color: violet, desc: isJa ? "コマンド ID / t_xvac と共用" : "command id (shared with t_xvac)" },
    { name: "t_ctid", size: 6, color: amber, desc: isJa ? "この行の次バージョンの TID" : "TID of the next version" },
    { name: "t_infomask2", size: 2, color: amber, desc: isJa ? "属性数と各種フラグ" : "attribute count + flags" },
    { name: "t_infomask", size: 2, color: amber, desc: isJa ? "NULL の有無・可視性ヒント" : "has-nulls / visibility hints" },
    { name: "t_hoff", size: 1, color: amber, desc: isJa ? "ヘッダ長（= データ開始位置）" : "header length (= data offset)" },
  ];

  const scale = 13;
  let cursor = 0;

  const caption = isJa
    ? "HeapTupleHeaderData のバイト配置（固定部 23 バイト）"
    : "Byte layout of HeapTupleHeaderData (fixed part: 23 bytes)";

  return (
    <div className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 620 276"
        role="img"
        aria-label={`${caption}. ${fields.map((f) => `${f.name} ${f.size}B — ${f.desc}`).join("; ")}.`}
        className="mx-auto w-full min-w-[520px] max-w-2xl"
      >
        <title>{caption}</title>
        <text x={10} y={16} fill={text} fontSize={12} fontWeight={700}>
          HeapTupleHeaderData
          <tspan fill={muted} fontWeight={400}>
            {isJa ? "（固定部 23 バイト）" : " (fixed part: 23 bytes)"}
          </tspan>
        </text>

        {fields.map((f) => {
          const x = 10 + cursor * scale;
          const w = f.size * scale;
          cursor += f.size;
          return (
            <g key={f.name}>
              <rect x={x} y={26} width={w} height={30} rx={3} fill={f.color} opacity={0.3} stroke={f.color} />
              <text x={x + w / 2} y={45} textAnchor="middle" fill={text} fontSize={9} fontWeight={600}>
                {f.size}B
              </text>
            </g>
          );
        })}

        {/* null bitmap + padding + data */}
        <rect x={10 + 23 * scale} y={26} width={scale} height={30} rx={3} fill={green} opacity={0.25} stroke={green} strokeDasharray="3 2" />
        <text x={10 + 23.5 * scale} y={45} textAnchor="middle" fill={text} fontSize={8}>
          bits
        </text>
        <rect x={10 + 24 * scale} y={26} width={scale * 12} height={30} rx={3} fill={green} opacity={0.45} stroke={green} />
        <text x={10 + 30 * scale} y={45} textAnchor="middle" fill={text} fontSize={10} fontWeight={600}>
          {isJa ? "列データ" : "column data"}
        </text>

        {/* offsets */}
        <text x={10} y={70} fill={muted} fontSize={9}>0</text>
        <text x={10 + 23 * scale - 6} y={70} fill={muted} fontSize={9}>23</text>
        <text x={10 + 24 * scale - 6} y={70} fill={muted} fontSize={9}>
          t_hoff
        </text>

        {/* legend */}
        {fields.map((f, i) => (
          <g key={f.name}>
            <rect x={12} y={86 + i * 20} width={9} height={9} rx={2} fill={f.color} opacity={0.5} stroke={f.color} />
            <text x={28} y={95 + i * 20} fill={text} fontSize={10} fontFamily="monospace">
              {f.name}
            </text>
            <text x={128} y={95 + i * 20} fill={muted} fontSize={10}>
              {f.desc}
            </text>
          </g>
        ))}
        <rect x={12} y={86 + fields.length * 20} width={9} height={9} rx={2} fill={green} opacity={0.5} stroke={green} strokeDasharray="3 2" />
        <text x={28} y={95 + fields.length * 20} fill={text} fontSize={10} fontFamily="monospace">
          t_bits
        </text>
        <text x={128} y={95 + fields.length * 20} fill={muted} fontSize={10}>
          {isJa
            ? "NULL ビットマップ。NULL が1つも無ければ省略される"
            : "NULL bitmap — omitted entirely when no column is NULL"}
        </text>
        <text x={12} y={95 + (fields.length + 1) * 20 + 4} fill={muted} fontSize={10}>
          {isJa
            ? "t_hoff は MAXALIGN 済みなので、NULL が無い場合の実効ヘッダ長は 24 バイトになる"
            : "t_hoff is MAXALIGN'd, so with no NULLs the effective header length is 24 bytes."}
        </text>
      </svg>
    </div>
  );
}
