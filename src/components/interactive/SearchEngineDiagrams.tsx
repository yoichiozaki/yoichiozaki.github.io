"use client";

import { useTheme } from "@/components/ThemeProvider";

type DiagramProps = { locale?: string };

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

/* ── 1. Search Engine Pipeline (architecture overview) ── */

export function SearchEnginePipeline({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const stages =
    locale === "en"
      ? [
          { label: "Collect", desc: "Documents" },
          { label: "Analyze", desc: "Tokenize" },
          { label: "Index", desc: "Build" },
          { label: "Query", desc: "Process" },
          { label: "Rank", desc: "Score" },
          { label: "Return", desc: "Results" },
        ]
      : [
          { label: "収集", desc: "ドキュメント" },
          { label: "解析", desc: "トークン化" },
          { label: "索引構築", desc: "インデックス" },
          { label: "検索処理", desc: "クエリ" },
          { label: "順位付け", desc: "スコア計算" },
          { label: "結果返却", desc: "レスポンス" },
        ];

  const boxW = 95;
  const gap = 28;
  const startX = 15;
  const y = 25;
  const h = 56;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 760 110" className="w-full max-w-3xl">
        <defs>
          <marker id="arrow-se" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={border} />
          </marker>
        </defs>
        {stages.map((stage, i) => {
          const x = startX + i * (boxW + gap);
          const isEndpoint = i === 0 || i === stages.length - 1;
          const fill = isEndpoint ? accent : bg;
          const textFill = isEndpoint ? "#fff" : text;
          const descFill = isEndpoint ? "rgba(255,255,255,0.7)" : muted;

          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={x - gap + 4}
                  y1={y + h / 2}
                  x2={x - 4}
                  y2={y + h / 2}
                  stroke={border}
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-se)"
                />
              )}
              <rect
                x={x}
                y={y}
                width={boxW}
                height={h}
                rx={8}
                fill={fill}
                stroke={border}
                strokeWidth={1.5}
              />
              <text
                x={x + boxW / 2}
                y={y + 22}
                textAnchor="middle"
                fill={textFill}
                fontSize={13}
                fontWeight={600}
              >
                {stage.label}
              </text>
              <text
                x={x + boxW / 2}
                y={y + 40}
                textAnchor="middle"
                fill={descFill}
                fontSize={10}
              >
                {stage.desc}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── 2. Tokenization Pipeline ──────────────────── */

export function TokenizationDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const en = locale === "en";
  const stages = [
    {
      label: en ? "Raw Text" : "生テキスト",
      content: '"The Cats Were Running!"',
      color: border,
    },
    {
      label: en ? "Lowercase" : "小文字化",
      content: '"the cats were running"',
      color: accent,
    },
    {
      label: en ? "Tokenize" : "トークン化",
      content: '["the", "cats", "were", "running"]',
      color: accent,
    },
    {
      label: en ? "Remove Stopwords" : "ストップワード除去",
      content: '["cats", "running"]',
      color: green,
    },
    {
      label: en ? "Stemming" : "ステミング",
      content: '["cat", "run"]',
      color: green,
    },
  ];

  const boxH = 44;
  const gap = 32;
  const boxW = 380;
  const labelW = 160;
  const totalH = stages.length * (boxH + gap) - gap + 20;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox={`0 0 ${labelW + boxW + 30} ${totalH}`} className="w-full max-w-xl">
        <defs>
          <marker id="arrow-tok" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6" fill={border} />
          </marker>
        </defs>
        {stages.map((stage, i) => {
          const y = 10 + i * (boxH + gap);
          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={labelW + boxW / 2}
                  y1={y - gap + 4}
                  x2={labelW + boxW / 2}
                  y2={y - 4}
                  stroke={border}
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-tok)"
                />
              )}
              <text
                x={labelW - 10}
                y={y + boxH / 2 + 4}
                textAnchor="end"
                fill={stage.color}
                fontSize={12}
                fontWeight={600}
              >
                {stage.label}
              </text>
              <rect
                x={labelW}
                y={y}
                width={boxW}
                height={boxH}
                rx={6}
                fill={bg}
                stroke={stage.color}
                strokeWidth={1.5}
              />
              <text
                x={labelW + boxW / 2}
                y={y + boxH / 2 + 5}
                textAnchor="middle"
                fill={text}
                fontSize={13}
                fontFamily="monospace"
              >
                {stage.content}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── 3. TF-IDF Formula Diagram ─────────────────── */

export function TFIDFDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const orange = dark ? "#f59e0b" : "#d97706";
  const green = dark ? "#22c55e" : "#16a34a";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const en = locale === "en";

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 620 280" className="w-full max-w-xl">
        {/* Main formula */}
        <text x={310} y={30} textAnchor="middle" fill={text} fontSize={16} fontWeight={700}>
          TF-IDF(t, d) = TF(t, d) × IDF(t)
        </text>

        {/* TF box */}
        <rect x={40} y={60} width={240} height={90} rx={8} fill={bg} stroke={accent} strokeWidth={2} />
        <text x={160} y={85} textAnchor="middle" fill={accent} fontSize={14} fontWeight={700}>
          TF(t, d)
        </text>
        <text x={160} y={108} textAnchor="middle" fill={text} fontSize={12}>
          {en ? "Term Frequency" : "出現頻度（Term Frequency）"}
        </text>
        <text x={160} y={128} textAnchor="middle" fill={muted} fontSize={11} fontFamily="monospace">
          {en ? "count(t in d)" : "文書 d 中のターム t の出現数"}
        </text>
        <text x={160} y={145} textAnchor="middle" fill={muted} fontSize={10}>
          {en ? "How often does t appear in d?" : "→ この文書でどれだけ出現するか"}
        </text>

        {/* × symbol */}
        <text x={310} y={110} textAnchor="middle" fill={text} fontSize={24} fontWeight={700}>
          ×
        </text>

        {/* IDF box */}
        <rect x={340} y={60} width={240} height={90} rx={8} fill={bg} stroke={orange} strokeWidth={2} />
        <text x={460} y={85} textAnchor="middle" fill={orange} fontSize={14} fontWeight={700}>
          IDF(t)
        </text>
        <text x={460} y={108} textAnchor="middle" fill={text} fontSize={12}>
          {en ? "Inverse Document Frequency" : "逆文書頻度（Inverse Doc Freq）"}
        </text>
        <text x={460} y={128} textAnchor="middle" fill={muted} fontSize={11} fontFamily="monospace">
          log(N / df(t))
        </text>
        <text x={460} y={145} textAnchor="middle" fill={muted} fontSize={10}>
          {en ? "How rare is t across all docs?" : "→ 全文書中でどれだけ珍しいか"}
        </text>

        {/* Insight box */}
        <rect x={80} y={185} width={460} height={80} rx={8} fill={bg} stroke={green} strokeWidth={2} strokeDasharray="6 3" />
        <text x={310} y={210} textAnchor="middle" fill={green} fontSize={13} fontWeight={600}>
          {en ? "Key Insight" : "ポイント"}
        </text>
        <text x={310} y={232} textAnchor="middle" fill={text} fontSize={12}>
          {en
            ? "High TF-IDF = frequent in this document BUT rare overall"
            : "TF-IDF が高い ＝ この文書に多く出現するが、全体では珍しいターム"}
        </text>
        <text x={310} y={252} textAnchor="middle" fill={muted} fontSize={11}>
          {en
            ? '"the" → low IDF (common everywhere) vs "algorithm" → high IDF (rare, specific)'
            : '"the" → IDF低（どこにでもある）  vs  "アルゴリズム" → IDF高（珍しい）'}
        </text>
      </svg>
    </div>
  );
}

/* ── 4. Boolean Query Diagram ──────────────────── */

export function BooleanQueryDiagram({ locale = "ja" }: DiagramProps) {
  const dark = useDark();
  const bg = dark ? "#1a1a1a" : "#fafafa";
  const border = dark ? "#404040" : "#d4d4d4";
  const accent = dark ? "#3b82f6" : "#2563eb";
  const green = dark ? "#22c55e" : "#16a34a";
  const orange = dark ? "#f59e0b" : "#d97706";
  const text = dark ? "#e5e5e5" : "#171717";
  const muted = dark ? "#a3a3a3" : "#737373";

  const en = locale === "en";

  const boxH = 26;
  const resH = 28;

  return (
    <div className="not-prose my-6 flex justify-center">
      <svg viewBox="0 0 640 320" className="w-full max-w-xl">
        {/* AND section */}
        <text x={160} y={24} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={15} fontWeight={700}>
          AND ({en ? "Intersection" : "積集合"})
        </text>
        {/* Posting lists */}
        <text x={30} y={40 + boxH / 2} dominantBaseline="central" fill={accent} fontSize={12} fontWeight={600}>
          cat →
        </text>
        {[1, 2].map((d, i) => (
          <g key={`and-cat-${d}`}>
            <rect x={80 + i * 50} y={40} width={40} height={boxH} rx={4} fill={bg} stroke={accent} strokeWidth={1.5} />
            <text x={100 + i * 50} y={40 + boxH / 2} textAnchor="middle" dominantBaseline="central" fill={accent} fontSize={12} fontWeight={600}>
              D{d}
            </text>
          </g>
        ))}
        <text x={30} y={74 + boxH / 2} dominantBaseline="central" fill={orange} fontSize={12} fontWeight={600}>
          sat →
        </text>
        {[1, 3].map((d, i) => (
          <g key={`and-sat-${d}`}>
            <rect x={80 + i * 50} y={74} width={40} height={boxH} rx={4} fill={bg} stroke={orange} strokeWidth={1.5} />
            <text x={100 + i * 50} y={74 + boxH / 2} textAnchor="middle" dominantBaseline="central" fill={orange} fontSize={12} fontWeight={600}>
              D{d}
            </text>
          </g>
        ))}
        {/* Arrow to result */}
        <line x1={195} y1={70} x2={230} y2={70} stroke={border} strokeWidth={1.5} />
        <text x={245} y={70} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={12}>∩</text>
        <line x1={260} y1={70} x2={280} y2={70} stroke={border} strokeWidth={1.5} />
        {/* Result */}
        <rect x={285} y={56} width={40} height={resH} rx={6} fill={green} fillOpacity={0.15} stroke={green} strokeWidth={2} />
        <text x={305} y={56 + resH / 2} textAnchor="middle" dominantBaseline="central" fill={green} fontSize={13} fontWeight={700}>
          D1
        </text>

        {/* Divider */}
        <line x1={20} y1={130} x2={620} y2={130} stroke={border} strokeWidth={1} strokeDasharray="4 4" />

        {/* OR section */}
        <text x={160} y={164} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={15} fontWeight={700}>
          OR ({en ? "Union" : "和集合"})
        </text>
        <text x={30} y={180 + boxH / 2} dominantBaseline="central" fill={accent} fontSize={12} fontWeight={600}>
          cat →
        </text>
        {[1, 2].map((d, i) => (
          <g key={`or-cat-${d}`}>
            <rect x={80 + i * 50} y={180} width={40} height={boxH} rx={4} fill={bg} stroke={accent} strokeWidth={1.5} />
            <text x={100 + i * 50} y={180 + boxH / 2} textAnchor="middle" dominantBaseline="central" fill={accent} fontSize={12} fontWeight={600}>
              D{d}
            </text>
          </g>
        ))}
        <text x={30} y={214 + boxH / 2} dominantBaseline="central" fill={orange} fontSize={12} fontWeight={600}>
          sat →
        </text>
        {[1, 3].map((d, i) => (
          <g key={`or-sat-${d}`}>
            <rect x={80 + i * 50} y={214} width={40} height={boxH} rx={4} fill={bg} stroke={orange} strokeWidth={1.5} />
            <text x={100 + i * 50} y={214 + boxH / 2} textAnchor="middle" dominantBaseline="central" fill={orange} fontSize={12} fontWeight={600}>
              D{d}
            </text>
          </g>
        ))}
        <line x1={195} y1={210} x2={230} y2={210} stroke={border} strokeWidth={1.5} />
        <text x={245} y={210} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={12}>∪</text>
        <line x1={260} y1={210} x2={280} y2={210} stroke={border} strokeWidth={1.5} />
        {[1, 2, 3].map((d, i) => (
          <g key={`or-res-${d}`}>
            <rect x={285 + i * 50} y={196} width={40} height={resH} rx={6} fill={green} fillOpacity={0.15} stroke={green} strokeWidth={2} />
            <text x={305 + i * 50} y={196 + resH / 2} textAnchor="middle" dominantBaseline="central" fill={green} fontSize={13} fontWeight={700}>
              D{d}
            </text>
          </g>
        ))}

        {/* Complexity note */}
        <rect x={420} y={42} width={200} height={70} rx={8} fill={bg} stroke={border} strokeWidth={1} />
        <text x={520} y={60} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={11} fontWeight={600}>
          {en ? "Sorted-merge algorithm" : "ソート済みマージ"}
        </text>
        <text x={520} y={77} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={11} fontFamily="monospace">
          O(n + m)
        </text>
        <text x={520} y={95} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={10}>
          {en ? "Both lists are sorted by doc ID" : "両リストはDoc ID順にソート済み"}
        </text>

        {/* NOT section hint */}
        <line x1={20} y1={268} x2={620} y2={268} stroke={border} strokeWidth={1} strokeDasharray="4 4" />
        <text x={160} y={295} textAnchor="middle" dominantBaseline="central" fill={text} fontSize={15} fontWeight={700}>
          NOT ({en ? "Complement" : "補集合"})
        </text>
        <text x={380} y={295} textAnchor="middle" dominantBaseline="central" fill={muted} fontSize={12}>
          {en
            ? 'e.g. "cat NOT dog" → {D1,D2} \\ {D2,D3} = {D1}'
            : '例: "cat NOT dog" → {D1,D2} \\ {D2,D3} = {D1}'}
        </text>
      </svg>
    </div>
  );
}
