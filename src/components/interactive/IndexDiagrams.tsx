"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

/* ── Helper ────────────────────────────────────── */

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Index taxonomy: B-Tree family ──────────── */

export function IndexTaxonomy({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 600 280" className="w-full max-w-xl">
        {/* Root */}
        <rect x={220} y={10} width={160} height={36} rx={8} fill={accent} stroke={accent} />
        <text x={300} y={32} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={600}>
          {locale === "en" ? "Tree-Based Index" : "木構造インデックス"}
        </text>

        {/* Level 2 */}
        {[
          { x: 60, label: locale === "en" ? "B-Tree" : "B木", desc: locale === "en" ? "Keys + data in all nodes" : "全ノードにデータ" },
          { x: 250, label: locale === "en" ? "B+ Tree" : "B+木", desc: locale === "en" ? "Data only in leaves" : "リーフのみにデータ" },
          { x: 440, label: "LSM-Tree", desc: locale === "en" ? "Log-structured merge" : "ログ構造マージ" },
        ].map((item, i) => (
          <g key={i}>
            <line x1={300} y1={46} x2={item.x + 60} y2={80} stroke={border} strokeWidth={1.5} />
            <rect x={item.x} y={80} width={120} height={36} rx={6} fill={bg} stroke={border} strokeWidth={1.5} />
            <text x={item.x + 60} y={100} textAnchor="middle" fill={text} fontSize={13} fontWeight={600}>
              {item.label}
            </text>
            <text x={item.x + 60} y={130} textAnchor="middle" fill={muted} fontSize={10}>
              {item.desc}
            </text>
          </g>
        ))}

        {/* B+Tree children */}
        {[
          { x: 140, label: locale === "en" ? "Clustered" : "クラスタード", desc: locale === "en" ? "Row data in leaf" : "行データ=リーフ順" },
          { x: 310, label: locale === "en" ? "Non-clustered" : "非クラスタード", desc: locale === "en" ? "Pointer in leaf" : "リーフにポインタ" },
        ].map((item, i) => (
          <g key={i}>
            <line x1={310} y1={116} x2={item.x + 70} y2={170} stroke={border} strokeWidth={1.5} />
            <rect x={item.x} y={170} width={140} height={36} rx={6} fill={bg} stroke={border} strokeWidth={1.5} />
            <text x={item.x + 70} y={190} textAnchor="middle" fill={text} fontSize={12} fontWeight={500}>
              {item.label}
            </text>
            <text x={item.x + 70} y={218} textAnchor="middle" fill={muted} fontSize={10}>
              {item.desc}
            </text>
          </g>
        ))}

        {/* LSM-Tree children */}
        {[
          { x: 420, label: "Memtable", desc: locale === "en" ? "In-memory write buffer" : "メモリ上の書込バッファ" },
          { x: 420, yOff: 60, label: "SSTable", desc: locale === "en" ? "Sorted on-disk files" : "ディスク上のソート済ファイル" },
        ].map((item, i) => (
          <g key={i}>
            <line x1={500} y1={116} x2={item.x + 70} y2={170 + (item.yOff ?? 0)} stroke={border} strokeWidth={1.5} />
            <rect x={item.x} y={170 + (item.yOff ?? 0)} width={140} height={32} rx={6} fill={bg} stroke={border} strokeWidth={1.5} />
            <text x={item.x + 70} y={190 + (item.yOff ?? 0)} textAnchor="middle" fill={text} fontSize={12} fontWeight={500}>
              {item.label}
            </text>
            <text x={item.x + 70} y={214 + (item.yOff ?? 0)} textAnchor="middle" fill={muted} fontSize={10}>
              {item.desc}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── 2. B-Tree vs B+Tree comparison ────────────── */

export function BTreeComparison({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 640 260" className="w-full max-w-xl">
        {/* B-Tree side */}
        <text x={160} y={22} textAnchor="middle" fill={text} fontSize={14} fontWeight={700}>
          {locale === "en" ? "B-Tree" : "B木"}
        </text>
        {/* Root with data */}
        <rect x={110} y={35} width={100} height={30} rx={5} fill={bg} stroke={border} strokeWidth={1.5} />
        <text x={135} y={54} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>10</text>
        <rect x={144} y={40} width={18} height={20} rx={2} fill={accent} opacity={0.3} />
        <text x={153} y={54} textAnchor="middle" fill={accent} fontSize={8}>data</text>
        <text x={185} y={54} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>20</text>
        <rect x={194} y={40} width={18} height={20} rx={2} fill={accent} opacity={0.3} />
        <text x={203} y={54} textAnchor="middle" fill={accent} fontSize={8}>data</text>

        {/* B-Tree children */}
        <line x1={130} y1={65} x2={60} y2={95} stroke={border} strokeWidth={1} />
        <line x1={160} y1={65} x2={160} y2={95} stroke={border} strokeWidth={1} />
        <line x1={190} y1={65} x2={260} y2={95} stroke={border} strokeWidth={1} />
        {[{ x: 10, keys: "5" }, { x: 120, keys: "15" }, { x: 220, keys: "25" }].map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={95} width={90} height={26} rx={4} fill={bg} stroke={border} strokeWidth={1} />
            <text x={n.x + 30} y={112} textAnchor="middle" fill={text} fontSize={10} fontWeight={600}>{n.keys}</text>
            <rect x={n.x + 40} y={99} width={18} height={18} rx={2} fill={accent} opacity={0.3} />
            <text x={n.x + 49} y={112} textAnchor="middle" fill={accent} fontSize={7}>data</text>
          </g>
        ))}
        <text x={160} y={145} textAnchor="middle" fill={muted} fontSize={10}>
          {locale === "en" ? "Data stored in all nodes" : "全ノードにデータを格納"}
        </text>

        {/* Divider */}
        <line x1={320} y1={10} x2={320} y2={250} stroke={border} strokeWidth={1} strokeDasharray="4 4" />

        {/* B+Tree side */}
        <text x={480} y={22} textAnchor="middle" fill={text} fontSize={14} fontWeight={700}>
          {locale === "en" ? "B+ Tree" : "B+木"}
        </text>
        {/* Root keys only */}
        <rect x={440} y={35} width={80} height={30} rx={5} fill={bg} stroke={border} strokeWidth={1.5} />
        <text x={465} y={54} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>10</text>
        <text x={495} y={54} textAnchor="middle" fill={text} fontSize={11} fontWeight={600}>20</text>

        {/* B+Tree leaves */}
        <line x1={455} y1={65} x2={380} y2={95} stroke={border} strokeWidth={1} />
        <line x1={480} y1={65} x2={480} y2={95} stroke={border} strokeWidth={1} />
        <line x1={505} y1={65} x2={575} y2={95} stroke={border} strokeWidth={1} />
        {[
          { x: 340, keys: "5", hasData: true },
          { x: 440, keys: "10,15", hasData: true },
          { x: 545, keys: "20,25", hasData: true },
        ].map((n, i) => (
          <g key={i}>
            <rect x={n.x} y={95} width={90} height={26} rx={4} fill={bg} stroke={green} strokeWidth={1.5} />
            <text x={n.x + 30} y={112} textAnchor="middle" fill={text} fontSize={10} fontWeight={600}>{n.keys}</text>
            <rect x={n.x + 60} y={99} width={22} height={18} rx={2} fill={green} opacity={0.2} />
            <text x={n.x + 71} y={111} textAnchor="middle" fill={green} fontSize={7}>data</text>
          </g>
        ))}
        {/* Leaf arrows */}
        <line x1={432} y1={108} x2={438} y2={108} stroke={green} strokeWidth={1.5} markerEnd="url(#bpArrow)" />
        <line x1={532} y1={108} x2={543} y2={108} stroke={green} strokeWidth={1.5} markerEnd="url(#bpArrow)" />
        <defs>
          <marker id="bpArrow" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill={green} />
          </marker>
        </defs>
        <text x={480} y={145} textAnchor="middle" fill={muted} fontSize={10}>
          {locale === "en" ? "Data only in leaves (linked)" : "データはリーフのみ（連結リスト）"}
        </text>

        {/* Summary comparison */}
        <line x1={30} y1={165} x2={610} y2={165} stroke={border} strokeWidth={0.5} />
        {[
          { label: locale === "en" ? "Range scan" : "範囲検索", btree: locale === "en" ? "In-order traversal (slow)" : "中間順走査（遅い）", bplus: locale === "en" ? "Leaf linked list (fast)" : "リーフ連結リスト（高速）" },
          { label: locale === "en" ? "Point lookup" : "一点検索", btree: locale === "en" ? "Can stop early" : "途中で見つかる場合も", bplus: locale === "en" ? "Always to leaf" : "常にリーフまで" },
          { label: locale === "en" ? "Fan-out" : "分岐数", btree: locale === "en" ? "Lower (data in nodes)" : "小さい（ノードにデータ）", bplus: locale === "en" ? "Higher (keys only)" : "大きい（キーのみ）" },
        ].map((row, i) => (
          <g key={i}>
            <text x={30} y={190 + i * 24} fill={text} fontSize={11} fontWeight={600}>{row.label}</text>
            <text x={180} y={190 + i * 24} fill={muted} fontSize={10}>{row.btree}</text>
            <text x={420} y={190 + i * 24} fill={green} fontSize={10} fontWeight={500}>{row.bplus}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── 3. LSM-Tree write path ────────────────────── */

export function LSMWritePath({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const orange = dark ? "#f59e0b" : "#d97706";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 560 220" className="w-full max-w-lg">
        {/* WAL */}
        <rect x={10} y={30} width={80} height={36} rx={6} fill={orange} opacity={0.15} stroke={orange} strokeWidth={1.5} />
        <text x={50} y={52} textAnchor="middle" fill={orange} fontSize={12} fontWeight={600}>WAL</text>
        <text x={50} y={82} textAnchor="middle" fill={muted} fontSize={9}>
          {locale === "en" ? "Write-Ahead Log" : "先行書込ログ"}
        </text>

        {/* Arrow */}
        <line x1={92} y1={48} x2={130} y2={48} stroke={border} strokeWidth={1.5} markerEnd="url(#lsmArr)" />
        <text x={111} y={40} textAnchor="middle" fill={muted} fontSize={8}>①</text>

        {/* Memtable */}
        <rect x={132} y={30} width={100} height={36} rx={6} fill={accent} opacity={0.15} stroke={accent} strokeWidth={1.5} />
        <text x={182} y={52} textAnchor="middle" fill={accent} fontSize={12} fontWeight={600}>Memtable</text>
        <text x={182} y={82} textAnchor="middle" fill={muted} fontSize={9}>
          {locale === "en" ? "In-memory sorted" : "メモリ上ソート済み"}
        </text>

        {/* Arrow flush */}
        <line x1={234} y1={48} x2={270} y2={48} stroke={border} strokeWidth={1.5} markerEnd="url(#lsmArr)" />
        <text x={252} y={40} textAnchor="middle" fill={muted} fontSize={8}>② flush</text>

        {/* SSTable levels */}
        {[
          { x: 272, y: 20, w: 90, label: "L0", desc: locale === "en" ? "Unsorted SSTables" : "未ソートSSTable" },
          { x: 272, y: 70, w: 130, label: "L1", desc: locale === "en" ? "Sorted, 10× larger" : "ソート済、10倍" },
          { x: 272, y: 120, w: 190, label: "L2", desc: locale === "en" ? "Sorted, 100× larger" : "ソート済、100倍" },
          { x: 272, y: 170, w: 250, label: "L3", desc: locale === "en" ? "Sorted, 1000× larger" : "ソート済、1000倍" },
        ].map((level, i) => (
          <g key={i}>
            <rect x={level.x} y={level.y} width={level.w} height={30} rx={4} fill={bg} stroke={border} strokeWidth={1} />
            <text x={level.x + 8} y={level.y + 19} fill={text} fontSize={11} fontWeight={600}>{level.label}</text>
            <text x={level.x + level.w - 4} y={level.y + 19} textAnchor="end" fill={muted} fontSize={9}>{level.desc}</text>
            {i < 3 && (
              <>
                <line
                  x1={level.x + level.w / 2}
                  y1={level.y + 30}
                  x2={272 + [130, 190, 250, 250][i] / 2}
                  y2={level.y + 40}
                  stroke={border}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text
                  x={level.x + level.w / 2 + 30}
                  y={level.y + 38}
                  fill={orange}
                  fontSize={8}
                  fontWeight={500}
                >
                  compaction
                </text>
              </>
            )}
          </g>
        ))}

        <defs>
          <marker id="lsmArr" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill={border} />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

/* ── 4. Disk I/O pattern comparison ────────────── */

export function DiskIOComparison({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const data = [
    {
      label: locale === "en" ? "B+ Tree" : "B+木",
      read: 90,
      write: 40,
      range: 95,
      color: accent,
    },
    {
      label: "LSM-Tree",
      read: 60,
      write: 95,
      range: 50,
      color: orange,
    },
  ];

  const metrics = [
    { key: "read" as const, label: locale === "en" ? "Point Read" : "一点読取" },
    { key: "write" as const, label: locale === "en" ? "Write" : "書込" },
    { key: "range" as const, label: locale === "en" ? "Range Scan" : "範囲検索" },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 480 200" className="w-full max-w-md">
        <text x={240} y={18} textAnchor="middle" fill={text} fontSize={13} fontWeight={700}>
          {locale === "en" ? "Performance Characteristics" : "パフォーマンス特性"}
        </text>
        {metrics.map((m, mi) => {
          const baseY = 38 + mi * 56;
          return (
            <g key={m.key}>
              <text x={10} y={baseY + 10} fill={text} fontSize={11} fontWeight={500}>{m.label}</text>
              {data.map((d, di) => (
                <g key={di}>
                  <rect
                    x={100}
                    y={baseY + di * 22}
                    width={(d[m.key] / 100) * 300}
                    height={16}
                    rx={3}
                    fill={d.color}
                    opacity={0.7}
                  />
                  <text x={100 + (d[m.key] / 100) * 300 + 6} y={baseY + di * 22 + 12} fill={muted} fontSize={9}>
                    {d.label}
                  </text>
                </g>
              ))}
            </g>
          );
        })}
        {/* Legend */}
        <rect x={140} y={182} width={12} height={12} rx={2} fill={accent} opacity={0.7} />
        <text x={156} y={193} fill={muted} fontSize={10}>{locale === "en" ? "B+ Tree" : "B+木"}</text>
        <rect x={240} y={182} width={12} height={12} rx={2} fill={orange} opacity={0.7} />
        <text x={256} y={193} fill={muted} fontSize={10}>LSM-Tree</text>
      </svg>
    </div>
  );
}

/* ── 5. Database index strategy comparison ─────── */

export function DBIndexStrategies({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";
  const accent = dark ? "#3b82f6" : "#2563eb";

  const dbs = [
    { name: "MySQL (InnoDB)", index: "B+Tree", note: locale === "en" ? "Clustered on PK" : "PKでクラスタード" },
    { name: "PostgreSQL", index: "B+Tree", note: locale === "en" ? "Heap table + index" : "ヒープ+インデックス" },
    { name: "SQLite", index: "B+Tree", note: locale === "en" ? "Table = B-Tree" : "テーブル=B木" },
    { name: "RocksDB", index: "LSM-Tree", note: locale === "en" ? "Write-optimized" : "書込最適化" },
    { name: "Cassandra", index: "LSM-Tree", note: locale === "en" ? "SSTable-based" : "SSTableベース" },
    { name: "MongoDB (WiredTiger)", index: locale === "en" ? "Both" : "両方", note: locale === "en" ? "B-Tree + LSM option" : "B木 + LSM選択可" },
  ];

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 520 240" className="w-full max-w-lg">
        <text x={260} y={20} textAnchor="middle" fill={text} fontSize={13} fontWeight={700}>
          {locale === "en" ? "Database Index Strategies" : "データベースごとのインデックス戦略"}
        </text>
        {/* Header */}
        <text x={20} y={48} fill={muted} fontSize={10} fontWeight={600}>Database</text>
        <text x={200} y={48} fill={muted} fontSize={10} fontWeight={600}>Index</text>
        <text x={320} y={48} fill={muted} fontSize={10} fontWeight={600}>{locale === "en" ? "Note" : "備考"}</text>
        <line x1={10} y1={54} x2={510} y2={54} stroke={border} strokeWidth={0.5} />

        {dbs.map((db, i) => {
          const y = 72 + i * 28;
          return (
            <g key={i}>
              <text x={20} y={y} fill={text} fontSize={11} fontWeight={500}>{db.name}</text>
              <rect x={196} y={y - 13} width={90} height={18} rx={4} fill={accent} opacity={0.15} stroke={accent} strokeWidth={0.5} />
              <text x={241} y={y} textAnchor="middle" fill={accent} fontSize={10} fontWeight={600}>{db.index}</text>
              <text x={320} y={y} fill={muted} fontSize={10}>{db.note}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
