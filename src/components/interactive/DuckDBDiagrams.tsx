"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function usePalette() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return {
    dark,
    bg: dark ? "#1a1a1a" : "#fafafa",
    border: dark ? "#404040" : "#d4d4d4",
    accent: dark ? "#3b82f6" : "#2563eb",
    green: dark ? "#22c55e" : "#16a34a",
    amber: dark ? "#f59e0b" : "#d97706",
    purple: dark ? "#a855f7" : "#9333ea",
    text: dark ? "#e5e5e5" : "#171717",
    muted: dark ? "#a3a3a3" : "#737373",
  };
}

/* ── 1. Overall architecture ─────────────────────── */

export function DuckDBArchitecture({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";

  const layers = [
    {
      title: en ? "Client API (in-process)" : "クライアント API（同一プロセス）",
      items: ["C / C++", "Python", "Node.js", "Java / JDBC", "Rust", "WASM"],
      color: p.muted,
    },
    {
      title: en ? "Parser (vendored libpg_query — PostgreSQL's grammar)" : "パーサ（libpg_query を同梱 — PostgreSQL の文法）",
      items: [en ? "SQL text → parse tree" : "SQL テキスト → 構文木"],
      color: p.accent,
    },
    {
      title: en ? "Binder → Logical planner" : "バインダ → 論理プランナ",
      items: [en ? "name resolution, types" : "名前解決・型付け", "LogicalOperator"],
      color: p.accent,
    },
    {
      title: en ? "Optimizer" : "オプティマイザ",
      items: [
        en ? "filter pushdown" : "フィルタ押し下げ",
        en ? "join order (DP)" : "結合順序（DP）",
        en ? "statistics propagation" : "統計伝播",
        en ? "expression rewriting" : "式書き換え",
      ],
      color: p.purple,
    },
    {
      title: en ? "Physical planner → Executor" : "物理プランナ → Executor",
      items: [
        "PhysicalOperator",
        "Pipeline / MetaPipeline",
        "TaskScheduler",
        en ? "vectorized, push-based" : "ベクトル化・push ベース",
      ],
      color: p.green,
    },
    {
      title: en ? "Storage & transactions" : "ストレージとトランザクション",
      items: [
        "BufferManager",
        "RowGroup / ColumnSegment",
        "MVCC (UndoBuffer)",
        "WAL / Checkpoint",
        "ART index",
      ],
      color: p.amber,
    },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 660 400" className="w-full max-w-2xl">
        {layers.map((l, i) => {
          const y = 10 + i * 64;
          return (
            <g key={i}>
              <rect
                x={20}
                y={y}
                width={620}
                height={54}
                rx={8}
                fill={p.bg}
                stroke={l.color}
                strokeWidth={1.5}
              />
              <text x={36} y={y + 21} fill={l.color} fontSize={12} fontWeight={700}>
                {l.title}
              </text>
              {l.items.map((it, j) => (
                <g key={j}>
                  <rect
                    x={36 + j * 100}
                    y={y + 29}
                    width={94}
                    height={17}
                    rx={4}
                    fill={l.color}
                    opacity={0.14}
                  />
                  <text
                    x={83 + j * 100}
                    y={y + 41}
                    textAnchor="middle"
                    fill={p.text}
                    fontSize={9}
                  >
                    {it}
                  </text>
                </g>
              ))}
              {i < layers.length - 1 && (
                <path
                  d={`M330 ${y + 54} L330 ${y + 64}`}
                  stroke={p.border}
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
        <text x={330} y={394} textAnchor="middle" fill={p.muted} fontSize={10}>
          {en
            ? "All layers live in the host process — no server, no socket, no serialization boundary"
            : "全レイヤがホストプロセス内に同居 — サーバもソケットもシリアライズ境界もない"}
        </text>
      </svg>
    </div>
  );
}

/* ── 2. string_t memory layout ───────────────────── */

export function StringTLayout({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";

  const cell = (
    x: number,
    y: number,
    w: number,
    label: string,
    sub: string,
    color: string,
  ) => (
    <g key={`${x}-${y}-${label}`}>
      <rect x={x} y={y} width={w} height={38} rx={4} fill={color} opacity={0.18} stroke={color} strokeWidth={1.2} />
      <text x={x + w / 2} y={y + 17} textAnchor="middle" fill={p.text} fontSize={11} fontWeight={600}>
        {label}
      </text>
      <text x={x + w / 2} y={y + 31} textAnchor="middle" fill={p.muted} fontSize={9}>
        {sub}
      </text>
    </g>
  );

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 620 250" className="w-full max-w-xl">
        <text x={20} y={18} fill={p.text} fontSize={12} fontWeight={700}>
          {en ? "Short string (≤ 12 bytes) — fully inlined" : "短い文字列（12 バイト以下）— 完全にインライン"}
        </text>
        {cell(20, 28, 130, "uint32_t length", "4 B", p.accent)}
        {cell(154, 28, 446, 'char inlined[12] = "duckdb"', "12 B", p.green)}
        <text x={20} y={84} fill={p.muted} fontSize={10}>
          {en
            ? "No heap access at all: the whole value fits in one 16-byte struct."
            : "ヒープアクセスがゼロ。値そのものが 16 バイト構造体に収まる。"}
        </text>

        <text x={20} y={124} fill={p.text} fontSize={12} fontWeight={700}>
          {en ? "Long string (> 12 bytes) — prefix + pointer" : "長い文字列（13 バイト以上）— プレフィックス + ポインタ"}
        </text>
        {cell(20, 134, 130, "uint32_t length", "4 B", p.accent)}
        {cell(154, 134, 130, 'char prefix[4] = "furi"', "4 B", p.amber)}
        {cell(288, 134, 312, "char *ptr", "8 B", p.purple)}

        <path d="M444 172 L444 196 L300 196" stroke={p.border} strokeWidth={1.5} fill="none" />
        <circle cx={300} cy={196} r={3} fill={p.border} />
        <rect x={120} y={200} width={180} height={26} rx={4} fill={p.bg} stroke={p.border} strokeWidth={1.2} />
        <text x={210} y={217} textAnchor="middle" fill={p.text} fontSize={10} fontFamily="monospace">
          &quot;furiously regular …&quot;
        </text>
        <text x={318} y={218} fill={p.muted} fontSize={10}>
          {en ? "heap (StringHeap / block)" : "ヒープ（StringHeap / ブロック）"}
        </text>

        <text x={20} y={244} fill={p.muted} fontSize={10}>
          {en
            ? "Equality first compares the leading 8 bytes (length + prefix) as one uint64 — most mismatches die here."
            : "等値比較はまず先頭 8 バイト（length + prefix）を 1 つの uint64 として比べる。不一致の大半はここで決着する。"}
        </text>
      </svg>
    </div>
  );
}

/* ── 3. Row group / column segment layout ────────── */

export function RowGroupLayout({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";
  const cols = [
    { name: "l_orderkey", segs: 3, comp: "BitPacking" },
    { name: "l_quantity", segs: 2, comp: "BitPacking" },
    { name: "l_shipdate", segs: 2, comp: "RLE" },
    { name: "l_comment", segs: 6, comp: "FSST" },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 660 330" className="w-full max-w-2xl">
        <rect x={16} y={10} width={628} height={44} rx={8} fill={p.bg} stroke={p.accent} strokeWidth={1.5} />
        <text x={30} y={30} fill={p.accent} fontSize={12} fontWeight={700}>
          {en ? "Table = RowGroupCollection" : "テーブル = RowGroupCollection"}
        </text>
        <text x={30} y={45} fill={p.muted} fontSize={10}>
          {en
            ? "an ordered segment tree of row groups, each holding up to DEFAULT_ROW_GROUP_SIZE = 122,880 rows"
            : "row group を並べたセグメント木。1 つあたり最大 DEFAULT_ROW_GROUP_SIZE = 122,880 行"}
        </text>

        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect
              x={16 + i * 212}
              y={66}
              width={200}
              height={22}
              rx={4}
              fill={i === 1 ? p.accent : p.bg}
              opacity={i === 1 ? 0.2 : 1}
              stroke={p.border}
              strokeWidth={1.2}
            />
            <text x={116 + i * 212} y={81} textAnchor="middle" fill={p.text} fontSize={10}>
              RowGroup #{i} — rows {(i * 122880).toLocaleString()}…{((i + 1) * 122880 - 1).toLocaleString()}
            </text>
          </g>
        ))}
        <path d="M228 88 L228 104" stroke={p.border} strokeWidth={1.2} />

        <rect x={16} y={104} width={628} height={166} rx={8} fill={p.bg} stroke={p.green} strokeWidth={1.5} />
        <text x={30} y={122} fill={p.green} fontSize={11} fontWeight={700}>
          {en ? "Inside RowGroup #1: one ColumnData per column" : "RowGroup #1 の中身：列ごとに 1 つの ColumnData"}
        </text>

        {cols.map((c, ci) => {
          const y = 132 + ci * 33;
          return (
            <g key={c.name}>
              <text x={30} y={y + 16} fill={p.text} fontSize={10} fontFamily="monospace">
                {c.name}
              </text>
              {Array.from({ length: c.segs }, (_, si) => (
                <g key={si}>
                  <rect
                    x={140 + si * 66}
                    y={y}
                    width={60}
                    height={24}
                    rx={3}
                    fill={p.amber}
                    opacity={0.16}
                    stroke={p.amber}
                    strokeWidth={1}
                  />
                  <text x={170 + si * 66} y={y + 15} textAnchor="middle" fill={p.text} fontSize={8}>
                    seg {si}
                  </text>
                </g>
              ))}
              <text x={556} y={y + 16} textAnchor="end" fill={p.muted} fontSize={9} fontFamily="monospace">
                {c.comp}
              </text>
            </g>
          );
        })}
        <text x={30} y={264} fill={p.muted} fontSize={9}>
          {en
            ? "Each ColumnSegment lives in a ~256 KB block (DEFAULT_BLOCK_ALLOC_SIZE) and carries its own min/max statistics."
            : "各 ColumnSegment は約 256 KB のブロック（DEFAULT_BLOCK_ALLOC_SIZE）に載り、自前の min/max 統計を持つ。"}
        </text>

        <rect x={16} y={282} width={628} height={40} rx={8} fill={p.bg} stroke={p.purple} strokeWidth={1.5} />
        <text x={30} y={299} fill={p.purple} fontSize={11} fontWeight={700}>
          {en ? "Zone-map pruning" : "ゾーンマップによる枝刈り"}
        </text>
        <text x={30} y={314} fill={p.muted} fontSize={9}>
          {en
            ? "WHERE l_shipdate > '1998-01-01' → segments whose max < the constant are skipped without ever being read."
            : "WHERE l_shipdate > '1998-01-01' → max がその定数未満のセグメントは、1 バイトも読まずに丸ごと飛ばせる。"}
        </text>
      </svg>
    </div>
  );
}

/* ── 4. MVCC version visibility ──────────────────── */

export function MVCCVersionDiagram({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";

  const rows = [
    {
      id: 0,
      ins: "108",
      del: "NOT_DELETED_ID",
      vis: true,
      ja: "108 < 110 で挿入は可視、削除は無し",
      en: "insert 108 < 110, never deleted",
    },
    {
      id: 1,
      ins: "108",
      del: "105",
      vis: false,
      ja: "削除 105 も 110 より前 → 消えている",
      en: "delete 105 also precedes 110 → gone",
    },
    {
      id: 2,
      ins: "108",
      del: "112",
      vis: true,
      ja: "削除は自分の開始後にコミット → まだ見える",
      en: "delete committed after our start → still here",
    },
    {
      id: 3,
      ins: "TX#7001",
      del: "NOT_DELETED_ID",
      vis: true,
      ja: "自分の未コミット挿入 → 自分にだけ見える",
      en: "our own uncommitted insert → visible to us only",
    },
    {
      id: 4,
      ins: "TX#7002",
      del: "NOT_DELETED_ID",
      vis: false,
      ja: "他トランザクションの未コミット挿入",
      en: "another transaction's uncommitted insert",
    },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 660 340" className="w-full max-w-2xl">
        <text x={20} y={18} fill={p.text} fontSize={12} fontWeight={700}>
          {en
            ? "ChunkVectorInfo — one per 2048 rows inside a RowGroup"
            : "ChunkVectorInfo — RowGroup の中で 2048 行ごとに 1 つ"}
        </text>

        {rows.map((r, i) => {
          const y = 30 + i * 44;
          return (
            <g key={r.id}>
              <rect x={20} y={y} width={54} height={36} rx={4} fill={p.bg} stroke={p.border} strokeWidth={1.2} />
              <text x={47} y={y + 22} textAnchor="middle" fill={p.text} fontSize={11} fontFamily="monospace">
                row {r.id}
              </text>

              <rect x={86} y={y} width={140} height={36} rx={4} fill={p.accent} opacity={0.15} stroke={p.accent} strokeWidth={1} />
              <text x={156} y={y + 15} textAnchor="middle" fill={p.muted} fontSize={8}>
                {en ? "insert id" : "挿入 id"}
              </text>
              <text x={156} y={y + 29} textAnchor="middle" fill={p.text} fontSize={10} fontFamily="monospace">
                {r.ins}
              </text>

              <rect x={238} y={y} width={140} height={36} rx={4} fill={p.amber} opacity={0.15} stroke={p.amber} strokeWidth={1} />
              <text x={308} y={y + 15} textAnchor="middle" fill={p.muted} fontSize={8}>
                {en ? "delete id" : "削除 id"}
              </text>
              <text x={308} y={y + 29} textAnchor="middle" fill={p.text} fontSize={10} fontFamily="monospace">
                {r.del}
              </text>

              <rect
                x={392}
                y={y}
                width={248}
                height={36}
                rx={4}
                fill={r.vis ? p.green : p.border}
                opacity={r.vis ? 0.18 : 0.25}
                stroke={r.vis ? p.green : p.border}
                strokeWidth={1}
              />
              <text
                x={516}
                y={y + 15}
                textAnchor="middle"
                fill={r.vis ? p.green : p.muted}
                fontSize={10}
                fontWeight={600}
              >
                {r.vis ? (en ? "visible" : "見える") : en ? "hidden" : "見えない"}
              </text>
              <text x={516} y={y + 29} textAnchor="middle" fill={p.muted} fontSize={8}>
                {en ? r.en : r.ja}
              </text>
            </g>
          );
        })}

        <text x={20} y={272} fill={p.muted} fontSize={10}>
          {en
            ? "Reader: start_time = 110, transaction_id = TX#7001"
            : "読み手のトランザクション: start_time = 110, transaction_id = TX#7001"}
        </text>
        <text x={20} y={290} fill={p.muted} fontSize={10} fontFamily="monospace">
          {en
            ? "UseVersion(id) = (id < start_time) || (id == transaction_id)"
            : "UseVersion(id) = (id < start_time) || (id == transaction_id)"}
        </text>
        <text x={20} y={308} fill={p.muted} fontSize={10} fontFamily="monospace">
          {en
            ? "visible = UseVersion(insert id) && !UseVersion(delete id)"
            : "visible = UseVersion(挿入 id) && !UseVersion(削除 id)"}
        </text>
        <text x={20} y={326} fill={p.muted} fontSize={10}>
          {en
            ? "Uncommitted writers store their transaction_id (≥ TRANSACTION_ID_START); commit rewrites it with the commit timestamp."
            : "未コミットの書き手は自分の transaction_id（TRANSACTION_ID_START 以上の値）を置き、コミット時にコミットタイムスタンプで上書きする。"}
        </text>
      </svg>
    </div>
  );
}

/* ── 5. Radix-partitioned hash aggregation ───────── */

export function RadixPartitionDiagram({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 660 330" className="w-full max-w-2xl">
        <text x={20} y={16} fill={p.text} fontSize={12} fontWeight={700}>
          {en ? "Sink phase — every thread stays lock-free" : "Sink フェーズ — 各スレッドはロックを取らない"}
        </text>

        {[0, 1, 2, 3].map((t) => {
          const x = 20 + t * 158;
          return (
            <g key={t}>
              <rect x={x} y={28} width={144} height={26} rx={4} fill={p.bg} stroke={p.border} strokeWidth={1.2} />
              <text x={x + 72} y={45} textAnchor="middle" fill={p.text} fontSize={10}>
                thread {t}
              </text>
              <path d={`M${x + 72} 54 L${x + 72} 68`} stroke={p.border} strokeWidth={1.2} />
              <rect x={x} y={68} width={144} height={30} rx={4} fill={p.accent} opacity={0.16} stroke={p.accent} strokeWidth={1.2} />
              <text x={x + 72} y={82} textAnchor="middle" fill={p.text} fontSize={9}>
                {en ? "thread-local HT" : "スレッドローカル HT"}
              </text>
              <text x={x + 72} y={93} textAnchor="middle" fill={p.muted} fontSize={8} fontFamily="monospace">
                ht_entry_t[capacity]
              </text>

              {[0, 1, 2, 3].map((q) => (
                <g key={q}>
                  <rect
                    x={x + 4 + q * 35}
                    y={110}
                    width={31}
                    height={22}
                    rx={3}
                    fill={[p.green, p.amber, p.purple, p.accent][q]}
                    opacity={0.22}
                    stroke={[p.green, p.amber, p.purple, p.accent][q]}
                    strokeWidth={1}
                  />
                  <text x={x + 19 + q * 35} y={125} textAnchor="middle" fill={p.text} fontSize={8}>
                    P{q}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        <text x={20} y={146} fill={p.muted} fontSize={9}>
          {en
            ? "Partition index = the radix_bits just below the hash's top 16 bits: hash >> (48 - radix_bits)."
            : "パーティション番号 = ハッシュの上位 16 ビットのすぐ下から radix_bits ビット。つまり hash >> (48 - radix_bits)。"}
        </text>
        <text x={20} y={158} fill={p.muted} fontSize={9}>
          {en
            ? "The top 16 bits are reserved as the hash-table salt. Each thread writes only into its own partitions."
            : "上位 16 ビットはハッシュテーブルのソルト用に予約されている。各スレッドは自分のパーティションだけに書く。"}
        </text>

        <text x={20} y={178} fill={p.text} fontSize={12} fontWeight={700}>
          {en ? "Finalize phase — partition-parallel, never cross-partition" : "Finalize フェーズ — パーティション単位で並列。跨がることはない"}
        </text>

        {[0, 1, 2, 3].map((q) => {
          const x = 20 + q * 158;
          const color = [p.green, p.amber, p.purple, p.accent][q];
          return (
            <g key={q}>
              <rect x={x} y={192} width={144} height={54} rx={5} fill={color} opacity={0.14} stroke={color} strokeWidth={1.3} />
              <text x={x + 72} y={210} textAnchor="middle" fill={p.text} fontSize={10} fontWeight={600}>
                {en ? `Partition ${q}` : `パーティション ${q}`}
              </text>
              <text x={x + 72} y={225} textAnchor="middle" fill={p.muted} fontSize={8}>
                {en ? "4 threads' slices merged" : "4 スレッド分をまとめて"}
              </text>
              <text x={x + 72} y={238} textAnchor="middle" fill={p.muted} fontSize={8}>
                {en ? "→ one AggregatePartition" : "→ 1 つの AggregatePartition"}
              </text>
              <path d={`M${x + 72} 246 L${x + 72} 262`} stroke={p.border} strokeWidth={1.2} />
              <rect x={x + 22} y={262} width={100} height={22} rx={3} fill={p.bg} stroke={p.border} strokeWidth={1.2} />
              <text x={x + 72} y={277} textAnchor="middle" fill={p.text} fontSize={9}>
                {en ? "scan → output" : "スキャン → 出力"}
              </text>
            </g>
          );
        })}

        <text x={20} y={304} fill={p.muted} fontSize={9}>
          {en
            ? "A group key can only land in one partition, so partitions are independent — the finalize step needs no synchronisation between them."
            : "同じグループキーは必ず同じパーティションに落ちるので、パーティション同士は独立。Finalize でパーティション間の同期は要らない。"}
        </text>
        <text x={20} y={320} fill={p.muted} fontSize={9}>
          {en
            ? "If memory runs short, the same partitioning becomes the spilling unit: one partition at a time is pinned, the rest go to disk."
            : "メモリが足りなくなったら、この分割がそのまま溢れ出しの単位になる。1 度に 1 パーティションだけをメモリに載せ、残りはディスクへ。"}
        </text>
      </svg>
    </div>
  );
}

/* ── 6. Why 2048? ────────────────────────────────── */

export function VectorSizeTradeoff({ locale = "ja" }: DiagramProps) {
  const p = usePalette();
  const en = locale === "en";

  const points = [
    { n: "1", x: 60, interp: 96, cache: 8, label: en ? "tuple-at-a-time" : "1 行ずつ" },
    { n: "64", x: 160, interp: 42, cache: 10 },
    { n: "512", x: 260, interp: 18, cache: 14 },
    { n: "2048", x: 360, interp: 9, cache: 20, label: "STANDARD_VECTOR_SIZE" },
    { n: "16K", x: 460, interp: 6, cache: 48 },
    { n: "1M+", x: 560, interp: 4, cache: 92, label: en ? "column-at-a-time" : "列まるごと" },
  ];

  const toY = (v: number) => 210 - v * 1.7;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 660 290" className="w-full max-w-2xl">
        <line x1={40} y1={214} x2={624} y2={214} stroke={p.border} strokeWidth={1.2} />
        <line x1={40} y1={30} x2={40} y2={214} stroke={p.border} strokeWidth={1.2} />
        <text x={40} y={24} fill={p.muted} fontSize={10}>
          {en ? "relative cost" : "相対コスト"}
        </text>
        <text x={624} y={232} textAnchor="end" fill={p.muted} fontSize={10}>
          {en ? "rows processed per operator call →" : "1 回の演算子呼び出しで処理する行数 →"}
        </text>

        {/* interpretation overhead curve */}
        <polyline
          points={points.map((pt) => `${pt.x},${toY(pt.interp)}`).join(" ")}
          fill="none"
          stroke={p.accent}
          strokeWidth={2}
        />
        {/* memory / cache pressure curve */}
        <polyline
          points={points.map((pt) => `${pt.x},${toY(pt.cache)}`).join(" ")}
          fill="none"
          stroke={p.amber}
          strokeWidth={2}
        />

        {points.map((pt) => (
          <g key={pt.n}>
            <circle cx={pt.x} cy={toY(pt.interp)} r={3.5} fill={p.accent} />
            <circle cx={pt.x} cy={toY(pt.cache)} r={3.5} fill={p.amber} />
            <text x={pt.x} y={228} textAnchor="middle" fill={p.text} fontSize={10} fontFamily="monospace">
              {pt.n}
            </text>
            {pt.label && (
              <text x={pt.x} y={244} textAnchor="middle" fill={p.muted} fontSize={8}>
                {pt.label}
              </text>
            )}
          </g>
        ))}

        <rect x={352} y={30} width={16} height={184} fill={p.green} opacity={0.12} />
        <text x={360} y={44} textAnchor="middle" fill={p.green} fontSize={9} fontWeight={700}>
          2048
        </text>

        <rect x={430} y={40} width={12} height={12} rx={2} fill={p.accent} />
        <text x={448} y={50} fill={p.text} fontSize={10}>
          {en ? "per-tuple interpretation overhead" : "1 行あたりの解釈オーバーヘッド"}
        </text>
        <rect x={430} y={58} width={12} height={12} rx={2} fill={p.amber} />
        <text x={448} y={68} fill={p.text} fontSize={10}>
          {en ? "intermediate-result cache pressure" : "中間結果のキャッシュ圧迫"}
        </text>

        <text x={40} y={266} fill={p.muted} fontSize={10}>
          {en
            ? "2048 × 8 bytes = 16 KB per column — a handful of columns still fits in L1/L2, so intermediates never touch DRAM."
            : "2048 × 8 バイト = 1 列あたり 16 KB。数列ぶんなら L1/L2 に収まり、中間結果が DRAM に落ちない。"}
        </text>
        <text x={40} y={282} fill={p.muted} fontSize={10}>
          {en
            ? "Compile-time constant: STANDARD_VECTOR_SIZE must be a power of two and DEFAULT_ROW_GROUP_SIZE a multiple of it."
            : "コンパイル時定数。STANDARD_VECTOR_SIZE は 2 冪でなければならず、DEFAULT_ROW_GROUP_SIZE はその倍数でなければならない。"}
        </text>
      </svg>
    </div>
  );
}
