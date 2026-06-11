"use client";

import { useTheme } from "@/components/ThemeProvider";

// ── Shared color scheme ─────────────────────────────────────

function useColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    isDark,
    text: isDark ? "#e2e8f0" : "#1e293b",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    // axis colors
    structure: isDark ? "#60a5fa" : "#2563eb", // blue
    structureBg: isDark ? "#172554" : "#dbeafe",
    correctness: isDark ? "#fbbf24" : "#d97706", // amber
    correctnessBg: isDark ? "#451a03" : "#fef3c7",
    goodness: isDark ? "#c084fc" : "#9333ea", // purple
    goodnessBg: isDark ? "#3b0764" : "#f3e8ff",
    safety: isDark ? "#2dd4bf" : "#0d9488", // teal
    safetyBg: isDark ? "#042f2e" : "#ccfbf1",
    // determinism / status
    det: isDark ? "#34d399" : "#059669", // green = deterministic / good
    detBg: isDark ? "#064e3b" : "#d1fae5",
    ref: isDark ? "#38bdf8" : "#0284c7", // cyan = reference-based
    refBg: isDark ? "#083344" : "#cffafe",
    judge: isDark ? "#f472b6" : "#db2777", // pink = judgmental
    judgeBg: isDark ? "#500724" : "#fce7f3",
    warn: isDark ? "#fbbf24" : "#d97706",
    bad: isDark ? "#f87171" : "#dc2626",
    badBg: isDark ? "#450a0a" : "#fee2e2",
    line: isDark ? "#475569" : "#cbd5e1",
    bg: isDark ? "#0f172a" : "#ffffff",
    cardBg: isDark ? "#1e293b" : "#f8fafc",
  };
}

type Props = { locale?: string };

// ════════════════════════════════════════════════════════════
// 1. ConversationAxesTaxonomy — the 4-axis MECE ruleset
// ════════════════════════════════════════════════════════════

export function ConversationAxesTaxonomy({ locale = "ja" }: Props) {
  const c = useColors();
  const ja = locale !== "en";

  const axes = [
    {
      key: "S",
      color: c.structure,
      bg: c.structureBg,
      name: ja ? "構造的正しさ" : "Structure",
      en: "Structure",
      question: ja
        ? "会話として成立しているか？"
        : "Did the conversation even happen as a conversation?",
      determinism: ja ? "ほぼ決定論的" : "Mostly deterministic",
      detColor: c.det,
      rules: [
        ja
          ? ["S1 ターン整合性", "1ユーザー発話に1応答。脱落・二重送信なし"]
          : ["S1 Turn integrity", "One reply per user turn; no drops or duplicates"],
        ja
          ? ["S2 応答性", "空応答・無応答・タイムアウト・クラッシュがない"]
          : ["S2 Responsiveness", "No empty/absent reply, timeout, or crash"],
        ja
          ? ["S3 形式適合", "要求形式に従う（有効なJSON・必須項目・言語・長さ）"]
          : ["S3 Format conformance", "Conforms to required schema/format/length/language"],
        ja
          ? ["S4 フロー進行", "状態が前進する。ループ・同一発話の反復がない"]
          : ["S4 Flow progression", "State advances; no loops or repeated turns"],
        ja
          ? ["S5 役割整合", "話者役割が一貫。ユーザー発話の捏造・役割崩壊なし"]
          : ["S5 Role integrity", "Speaker roles stay consistent; no fabricated user turns"],
      ],
    },
    {
      key: "C",
      color: c.correctness,
      bg: c.correctnessBg,
      name: ja ? "内容的正しさ" : "Correctness",
      en: "Correctness",
      question: ja
        ? "言っていることは正しいか？"
        : "Is what was said true, relevant, and valid?",
      determinism: ja ? "決定論〜判断的が混在" : "Deterministic → judgmental mix",
      detColor: c.ref,
      rules: [
        ja
          ? ["C1 事実正確性", "主張が真。出典に根拠づけ（hallucinationなし）"]
          : ["C1 Factual accuracy", "Claims are true & grounded; no hallucination"],
        ja
          ? ["C2 関連性", "ユーザーの実際の意図・質問に答えている"]
          : ["C2 Relevance", "Addresses the user's actual intent/question"],
        ja
          ? ["C3 論理整合性", "内部矛盾なし。ターンをまたいで一貫"]
          : ["C3 Logical consistency", "No contradictions within or across turns"],
        ja
          ? ["C4 タスク達成", "目標を達成（スロット充足・正しい行動/答え）"]
          : ["C4 Task success", "Goal accomplished (slots filled, correct action)"],
        ja
          ? ["C5 指示・制約遵守", "明示的な指示・制約・ポリシーに従う"]
          : ["C5 Constraint adherence", "Follows explicit instructions, constraints, policy"],
        ja
          ? ["C6 較正・棄権", "確信度が正確さと一致。不確かなら「分からない」と言える"]
          : ["C6 Calibration & abstention", "Confidence tracks accuracy; can say 'I don't know' when unsure"],
      ],
    },
    {
      key: "G",
      color: c.goodness,
      bg: c.goodnessBg,
      name: ja ? "主観的良し悪し" : "Goodness",
      en: "Goodness",
      question: ja
        ? "その体験は良かったか？"
        : "Was the experience actually good?",
      determinism: ja ? "ほぼ判断的" : "Mostly judgmental",
      detColor: c.judge,
      rules: [
        ja
          ? ["G1 有用性", "実際に役立ったか（知覚される有用性）"]
          : ["G1 Helpfulness", "Did it actually help (perceived usefulness)"],
        ja
          ? ["G2 トーン・共感", "場にふさわしい語調・丁寧さ・共感"]
          : ["G2 Tone & empathy", "Appropriate register, politeness, warmth"],
        ja
          ? ["G3 明瞭さ", "理解しやすい。構成・冗長さが適切"]
          : ["G3 Clarity", "Easy to follow; right structure and verbosity"],
        ja
          ? ["G4 自然さ", "機械的でなく自然。会話として心地よい"]
          : ["G4 Naturalness", "Feels natural, not robotic; engaging"],
        ja
          ? ["G5 信頼・満足", "総合的な満足・信頼・継続意向"]
          : ["G5 Trust & satisfaction", "Overall satisfaction, trust, willingness to return"],
      ],
    },
    {
      key: "H",
      color: c.safety,
      bg: c.safetyBg,
      name: ja ? "安全性・無害性" : "Safety",
      en: "Safety / Harmlessness",
      question: ja
        ? "その応答は無害で、許容できるか？"
        : "Is the response harmless and acceptable at all?",
      determinism: ja ? "分類器・レッドチーム" : "Classifiers · red-team",
      detColor: c.judge,
      rules: [
        ja
          ? ["H1 無害性", "有害・違法・危険な内容を生成しない（自傷・憎悪等）"]
          : ["H1 Harm avoidance", "No toxic, illegal, or dangerous content (self-harm, hate…)"],
        ja
          ? ["H2 公平性", "集団間で差別的・不公平なバイアスがない"]
          : ["H2 Fairness", "No discriminatory bias across groups"],
        ja
          ? ["H3 プライバシー", "PIIを漏らさない。権限のない情報を開示しない"]
          : ["H3 Privacy", "No PII leakage; no unauthorized disclosure"],
        ja
          ? ["H4 インジェクション耐性", "prompt injection・脱獄で役割/方針が破られない"]
          : ["H4 Injection resistance", "Role/policy survives prompt injection & jailbreaks"],
        ja
          ? ["H5 行動安全", "不可逆/高リスク行動に慎重。過剰拒否もしない"]
          : ["H5 Action safety", "Cautious on irreversible/high-stakes acts; no over-refusal"],
      ],
    },
  ];

  return (
    <div className="not-prose my-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {axes.map((axis) => (
          <div
            key={axis.key}
            className="rounded-xl border p-4"
            style={{ borderColor: axis.color, background: c.cardBg }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                style={{ background: axis.bg, color: axis.color }}
              >
                {axis.key}
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: axis.bg, color: axis.detColor }}
              >
                {axis.determinism}
              </span>
            </div>
            <h4
              className="mt-2 text-base font-bold"
              style={{ color: axis.color }}
            >
              {axis.name}
            </h4>
            {ja && (
              <div className="text-xs font-medium" style={{ color: c.textMuted }}>
                {axis.en}
              </div>
            )}
            <p
              className="mt-1 text-xs italic"
              style={{ color: c.textMuted }}
            >
              “{axis.question}”
            </p>
            <ul className="mt-3 space-y-2">
              {axis.rules.map(([id, desc]) => (
                <li key={id} className="text-xs leading-snug">
                  <span className="font-semibold" style={{ color: axis.color }}>
                    {id}
                  </span>
                  <span style={{ color: c.text }}> — {desc}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p
        className="mt-3 text-center text-xs"
        style={{ color: c.textMuted }}
      >
        {ja
          ? "S・C・Gは「会話の質」を測る3つの分離可能な問い。ユーザー影響には順序がある: Structure（土台）→ Correctness（価値）→ Goodness（体験）。Hは品質に直交する制約（拒否権）軸: S・C・Gが満点でも、不安全なら不可。"
          : "S, C, G are three separable questions about conversation quality, causally ordered: Structure (substrate) → Correctness (value) → Goodness (felt quality). H is a constraint (veto) axis orthogonal to quality: perfect S·C·G is still unacceptable if unsafe."}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 2. DeterminismSpectrum — the 3 determinism bands
// ════════════════════════════════════════════════════════════

export function DeterminismSpectrum({ locale = "ja" }: Props) {
  const c = useColors();
  const ja = locale !== "en";

  const bands = [
    {
      color: c.det,
      bg: c.detBg,
      title: ja ? "① 決定論的" : "① Deterministic",
      sub: ja ? "ルールで判定・再現可能" : "Rule-checkable, reproducible",
      desc: ja
        ? "ログとタイムスタンプから固定ルールで計算。モデル不要、同じ入力で常に同じ結果。"
        : "Computed from logs/timestamps with a fixed rule. No model, bit-for-bit reproducible.",
      examples: ja
        ? [
            "応答が存在するか / 空でないか",
            "有効なJSON・スキーマ適合",
            "n-gram反復率（ループ検知）",
            "応答レイテンシ < 閾値",
            "ツール引数の完全一致",
          ]
        : [
            "Reply present / non-empty",
            "Valid JSON / schema match",
            "n-gram repetition (loop detect)",
            "Response latency < threshold",
            "Exact tool-arg match",
          ],
      axes: "S · 一部のC",
      axesEn: "S · part of C",
    },
    {
      color: c.ref,
      bg: c.refBg,
      title: ja ? "② 参照ベース" : "② Reference-based",
      sub: ja ? "正解/参照との比較" : "Compare to ground truth",
      desc: ja
        ? "正解データや参照応答が必要。計算は自動だが、指標の選択が結果を左右する。"
        : "Needs gold data or a reference answer. Automatic, but the metric choice matters.",
      examples: ja
        ? [
            "タスク成功率（正解との照合）",
            "スロット充足 F1",
            "WER（参照書き起こしとの比較）",
            "検索の precision / recall",
            "BLEU / ROUGE / BERTScore",
          ]
        : [
            "Task success vs gold",
            "Slot-filling F1",
            "WER vs reference transcript",
            "Retrieval precision / recall",
            "BLEU / ROUGE / BERTScore",
          ],
      axes: "C 中心",
      axesEn: "Mostly C",
    },
    {
      color: c.judge,
      bg: c.judgeBg,
      title: ja ? "③ 判断的" : "③ Judgmental",
      sub: ja ? "人間/LLMの判断" : "Human or LLM judgment",
      desc: ja
        ? "人間評価かLLM-as-judgeが必要。ビット単位では再現せず、相関と一致率で品質を担保する。"
        : "Needs human raters or LLM-as-judge. Not bit-reproducible; quality is held by correlation and agreement.",
      examples: ja
        ? [
            "CSAT / 5段階満足度",
            "👍/👎 ・明示フィードバック",
            "LLM-as-judge（G-Eval等）",
            "自然さ MOS（音声）",
            "離脱率・エスカレーション率（代理指標）",
          ]
        : [
            "CSAT / 5-point satisfaction",
            "👍/👎 · explicit feedback",
            "LLM-as-judge (G-Eval etc.)",
            "Naturalness MOS (voice)",
            "Drop-off / escalation rate (proxies)",
          ],
      axes: "G 中心 · 開放的なC",
      axesEn: "Mostly G · open-ended C",
    },
  ];

  return (
    <div className="not-prose my-8">
      {/* gradient bar */}
      <div
        className="mb-3 h-2 w-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${c.det}, ${c.ref}, ${c.judge})`,
        }}
      />
      <div className="mb-3 flex justify-between text-[10px] font-medium" style={{ color: c.textMuted }}>
        <span>{ja ? "← 客観的・自動・安価" : "← Objective · automatic · cheap"}</span>
        <span>{ja ? "主観的・人手・高価 →" : "Subjective · human · expensive →"}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {bands.map((b) => (
          <div
            key={b.title}
            className="rounded-xl border p-4"
            style={{ borderColor: b.color, background: c.cardBg }}
          >
            <h4 className="text-sm font-bold" style={{ color: b.color }}>
              {b.title}
            </h4>
            <div className="text-xs font-medium" style={{ color: c.text }}>
              {b.sub}
            </div>
            <p className="mt-2 text-xs leading-snug" style={{ color: c.textMuted }}>
              {b.desc}
            </p>
            <ul className="mt-3 space-y-1">
              {b.examples.map((ex) => (
                <li
                  key={ex}
                  className="text-[11px] leading-snug"
                  style={{ color: c.text }}
                >
                  <span style={{ color: b.color }}>▪</span> {ex}
                </li>
              ))}
            </ul>
            <div
              className="mt-3 rounded-md px-2 py-1 text-center text-[10px] font-semibold"
              style={{ background: b.bg, color: b.color }}
            >
              {ja ? `主たる軸: ${b.axes}` : `Primary axis: ${b.axesEn}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 3. TurnTakingLatencyDiagram — voice: human gap vs pipeline
// ════════════════════════════════════════════════════════════

export function TurnTakingLatencyDiagram({ locale = "ja" }: Props) {
  const c = useColors();
  const ja = locale !== "en";

  const SCALE = 2200; // ms full width
  const pct = (ms: number) => `${(ms / SCALE) * 100}%`;

  type Seg = { label: string; labelEn: string; ms: number; color: string };

  const rows: {
    title: string;
    titleEn: string;
    total: number;
    segs: Seg[];
  }[] = [
    {
      title: "人間どうし",
      titleEn: "Human ↔ Human",
      total: 200,
      segs: [
        {
          label: "ギャップ（予測で先回り）",
          labelEn: "Gap (response pre-planned by prediction)",
          ms: 200,
          color: c.det,
        },
      ],
    },
    {
      title: "素朴な音声パイプライン",
      titleEn: "Naïve voice pipeline",
      total: 1900,
      segs: [
        { label: "無音待ち / エンドポイント", labelEn: "Silence wait / endpoint", ms: 800, color: c.bad },
        { label: "ASR 確定", labelEn: "ASR finalize", ms: 200, color: c.warn },
        { label: "LLM 最初のトークンまで", labelEn: "LLM time-to-first-token", ms: 600, color: c.structure },
        { label: "TTS 最初の音声まで", labelEn: "TTS time-to-first-audio", ms: 300, color: c.goodness },
      ],
    },
    {
      title: "ストリーミング最適化",
      titleEn: "Streaming-optimized",
      total: 1050,
      segs: [
        { label: "スマートな終話検出", labelEn: "Smart endpointing", ms: 450, color: c.warn },
        { label: "逐次ASR（重なる）", labelEn: "Streaming ASR (overlapped)", ms: 100, color: c.ref },
        { label: "LLM TTFT", labelEn: "LLM TTFT", ms: 350, color: c.structure },
        { label: "TTS 先頭", labelEn: "TTS head", ms: 150, color: c.goodness },
      ],
    },
  ];

  const thresholds = [
    { ms: 200, label: ja ? "人間の標準 ~200ms" : "Human norm ~200ms", color: c.det },
    { ms: 700, label: ja ? "~700ms超は「何か変」" : ">700ms reads as 'a problem'", color: c.bad },
  ];

  return (
    <div className="not-prose my-8 rounded-xl border p-4" style={{ borderColor: c.line, background: c.cardBg }}>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.title}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-xs font-semibold" style={{ color: c.text }}>
                {ja ? row.title : row.titleEn}
              </span>
              <span className="font-mono text-xs" style={{ color: c.textMuted }}>
                ≈ {row.total} ms
              </span>
            </div>
            <div
              className="relative flex h-7 w-full overflow-hidden rounded-md"
              style={{ background: c.bg, outline: `1px solid ${c.line}` }}
            >
              {row.segs.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center overflow-hidden text-[9px] font-medium text-white"
                  style={{ width: pct(s.ms), background: s.color }}
                  title={`${ja ? s.label : s.labelEn} — ${s.ms}ms`}
                >
                  <span className="truncate px-1">{s.ms}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* threshold scale */}
        <div className="relative h-10">
          {thresholds.map((t) => (
            <div
              key={t.ms}
              className="absolute top-0 flex h-full flex-col items-center"
              style={{ left: pct(t.ms) }}
            >
              <div className="h-5 w-px" style={{ background: t.color }} />
              <span
                className="mt-0.5 whitespace-nowrap text-[9px] font-semibold"
                style={{ color: t.color }}
              >
                {t.label}
              </span>
            </div>
          ))}
          <div
            className="absolute bottom-0 right-0 font-mono text-[9px]"
            style={{ color: c.textMuted }}
          >
            {SCALE} ms
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs leading-snug" style={{ color: c.textMuted }}>
        {ja
          ? "人間は相手の発話終わりを予測して応答を先に組み立てるため、産出に600ms以上かかるのに~200msで返せる。古典的パイプラインは「無音を待ってから」直列処理するので、構造軸の応答レイテンシが人間規範を大きく超えやすい（数値は例示）。"
          : "Humans predict the end of a turn and pre-plan their reply, so they answer in ~200ms even though production takes 600ms+. A classic pipeline waits for silence and then runs serially, so its Structure-axis response latency easily blows past the human norm (numbers illustrative)."}
      </p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 4. EvalMetricMatrix — axis × determinism band example metrics
// ════════════════════════════════════════════════════════════

export function EvalMetricMatrix({ locale = "ja" }: Props) {
  const c = useColors();
  const ja = locale !== "en";

  const headers = ja
    ? ["軸", "① 決定論的", "② 参照ベース", "③ 判断的"]
    : ["Axis", "① Deterministic", "② Reference-based", "③ Judgmental"];

  const rows = [
    {
      axis: "Structure",
      color: c.structure,
      cells: ja
        ? [
            "応答有無・スキーマ適合・ループ検知・レイテンシ・(音声)終話/バージイン/無音",
            "—（参照不要なことが多い）",
            "「流れが自然か」の人手確認（稀）",
          ]
        : [
            "Reply presence · schema · loop detect · latency · (voice) endpoint/barge-in/dead-air",
            "— (rarely needs a reference)",
            "Human spot-check of 'flow feel' (rare)",
          ],
    },
    {
      axis: "Correctness",
      color: c.correctness,
      cells: ja
        ? [
            "ツール引数照合・制約の機械チェック・(音声)WER↔参照",
            "タスク成功率・スロットF1・groundedness↔KB・較正(ECE)",
            "事実性/関連性のLLM-judge・専門家レビュー",
          ]
        : [
            "Tool-arg match · machine-checked constraints · (voice) WER vs ref",
            "Task success · slot F1 · groundedness vs KB · calibration (ECE)",
            "LLM-judge of factuality/relevance · expert review",
          ],
    },
    {
      axis: "Goodness",
      color: c.goodness,
      cells: ja
        ? [
            "代理指標: 離脱率・再質問率・エスカレーション・(音声)レイテンシ分布",
            "—（参照しづらい）",
            "CSAT・👍/👎・LLM-judge・(音声)自然さMOS",
          ]
        : [
            "Proxies: drop-off · re-ask rate · escalation · (voice) latency dist.",
            "— (hard to reference)",
            "CSAT · 👍/👎 · LLM-judge · (voice) naturalness MOS",
          ],
    },
    {
      axis: "Safety",
      color: c.safety,
      cells: ja
        ? [
            "PII正規表現・禁止語ブロックリスト・(音声)既知の有害語",
            "レッドチーム集合での攻撃成功率・既知ジェイルブレイクの回帰",
            "毒性/バイアス分類器・人手レッドチーム・過剰拒否の判定",
          ]
        : [
            "PII regex · banned-word blocklist · (voice) known harmful terms",
            "Attack success rate on red-team sets · known-jailbreak regression",
            "Toxicity/bias classifiers · human red-team · over-refusal judgment",
          ],
    },
  ];

  return (
    <div className="not-prose my-8 overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr style={{ borderBottom: `1px solid ${c.line}` }}>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left font-semibold"
                style={{ color: c.text }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.axis} style={{ borderBottom: `1px solid ${c.line}55` }}>
              <td
                className="px-3 py-2 align-top font-bold"
                style={{ color: row.color }}
              >
                {row.axis}
              </td>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className="px-3 py-2 align-top leading-snug"
                  style={{ color: cell.startsWith("—") ? c.textMuted : c.text }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
