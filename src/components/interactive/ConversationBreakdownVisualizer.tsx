"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";
import { useTheme } from "@/components/ThemeProvider";

// ── colors ──────────────────────────────────────────────────

function useColors() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return {
    text: isDark ? "#e2e8f0" : "#1e293b",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    bg: isDark ? "#0f172a" : "#ffffff",
    cardBg: isDark ? "#1e293b" : "#f8fafc",
    line: isDark ? "#475569" : "#cbd5e1",
    userBg: isDark ? "#1e3a5f" : "#dbeafe",
    agentBg: isDark ? "#334155" : "#f1f5f9",
    ok: isDark ? "#34d399" : "#059669",
    okBg: isDark ? "#064e3b" : "#d1fae5",
    warn: isDark ? "#fbbf24" : "#d97706",
    warnBg: isDark ? "#451a03" : "#fef3c7",
    bad: isDark ? "#f87171" : "#dc2626",
    badBg: isDark ? "#450a0a" : "#fee2e2",
    structure: isDark ? "#60a5fa" : "#2563eb",
    correctness: isDark ? "#fbbf24" : "#d97706",
    goodness: isDark ? "#c084fc" : "#9333ea",
    safety: isDark ? "#2dd4bf" : "#0d9488",
  };
}

type Status = "ok" | "warn" | "bad" | "na";
type Turn = { role: "user" | "agent"; ja: string; en: string; fail?: boolean };

type Scene = {
  titleJa: string;
  titleEn: string;
  turns: Turn[];
  S: Status;
  C: Status;
  G: Status;
  H: Status;
  noteJa: string;
  noteEn: string;
  bandJa: string;
  bandEn: string;
};

const SCENES: Scene[] = [
  {
    titleJa: "健全な1ターン",
    titleEn: "A healthy turn",
    turns: [
      { role: "user", ja: "注文 #1234 の配送状況を教えて", en: "What's the delivery status of order #1234?" },
      {
        role: "agent",
        ja: "注文 #1234 は本日発送されました。明日の午前中にお届け予定です（追跡番号 ABC123）。",
        en: "Order #1234 shipped today and is scheduled to arrive tomorrow morning (tracking ABC123).",
      },
    ],
    S: "ok",
    C: "ok",
    G: "ok",
    H: "ok",
    noteJa: "形式・内容・体験のすべてが成立。これが基準点。",
    noteEn: "Form, content, and experience all hold. This is the baseline.",
    bandJa: "—",
    bandEn: "—",
  },
  {
    titleJa: "自信満々のハルシネーション",
    titleEn: "A confident hallucination",
    turns: [
      { role: "user", ja: "返品はできますか？", en: "Can I return it?" },
      {
        role: "agent",
        ja: "もちろんです！購入後90日以内なら無条件で全額返金、送料も当社が負担します。",
        en: "Absolutely! Full refund within 90 days, no questions asked — and we cover return shipping.",
        fail: true,
      },
    ],
    S: "ok",
    C: "bad",
    G: "warn",
    H: "ok",
    noteJa:
      "実際の規約は「30日・返送料はお客様負担」。応答は完璧に整形されている（S◎）が事実が捏造されている（C✗）。較正されたモデルなら C6 でヘッジか棄権したはず。構造チェックでは絶対に捕まらない。",
    noteEn:
      "The real policy is '30 days, customer pays return shipping.' The reply is perfectly formed (S✓) but the facts are fabricated (C✗). A calibrated model would have hedged or abstained (C6). No structural check can catch this.",
    bandJa: "②参照ベース（規約KBと照合）か ③判断的でしか検知不能",
    bandEn: "Only catchable by ② reference (vs policy KB) or ③ judgment",
  },
  {
    titleJa: "会話のループ",
    titleEn: "A conversation loop",
    turns: [
      { role: "user", ja: "30日では？さっき90日と言いましたよね", en: "Isn't it 30 days? You just said 90." },
      { role: "agent", ja: "返品をご希望ですね。返品の理由をお聞かせください。", en: "You'd like a return. Could you tell me the reason?" },
      { role: "user", ja: "いえ、日数を確認したいんです", en: "No — I'm trying to confirm the number of days." },
      {
        role: "agent",
        ja: "返品をご希望ですね。返品の理由をお聞かせください。",
        en: "You'd like a return. Could you tell me the reason?",
        fail: true,
      },
    ],
    S: "bad",
    C: "na",
    G: "bad",
    H: "na",
    noteJa:
      "直前のエージェント発話とほぼ同一。状態が前進していない（S4 違反）。内容の良し悪し以前に会話が壊れている。",
    noteEn:
      "Nearly identical to the previous agent turn — state isn't advancing (S4 violation). The conversation is broken before content even matters.",
    bandJa: "①決定論的: n-gram反復率＋状態無進行で機械検知できる",
    bandEn: "① Deterministic: detectable via n-gram repetition + no state progress",
  },
  {
    titleJa: "無応答 / タイムアウト",
    titleEn: "No response / timeout",
    turns: [
      { role: "user", ja: "もしもし？聞こえてますか？", en: "Hello? Are you there?" },
      { role: "agent", ja: "⋯（応答なし・タイムアウト）", en: "⋯ (no reply · timeout)", fail: true },
    ],
    S: "bad",
    C: "na",
    G: "bad",
    H: "na",
    noteJa:
      "応答イベントが予算内に発生しない（S2 違反）。最も安価かつ最も決定論的に検知できる壊れ方。",
    noteEn:
      "No response event within the budget (S2 violation). The cheapest and most deterministic failure to detect.",
    bandJa: "①決定論的: 応答有無・タイムアウトの単純な監視",
    bandEn: "① Deterministic: a simple presence/timeout check",
  },
  {
    titleJa: "正しいが冷たい",
    titleEn: "Correct but cold",
    turns: [
      { role: "user", ja: "結局、返品期間は何日ですか？", en: "So how many days is the return window?" },
      {
        role: "agent",
        ja: "規約に明記されています。返品期間は30日、返送料はお客様負担です。次回はFAQをご確認ください。",
        en: "It's stated in the terms. The window is 30 days and you pay return shipping. Please check the FAQ next time.",
        fail: true,
      },
    ],
    S: "ok",
    C: "ok",
    G: "bad",
    H: "ok",
    noteJa:
      "今度は形式も内容も正しい（S◎ C◎）。それでも見下した語調でユーザーを責めている（G✗）。決定論でも参照でも捕まらない。",
    noteEn:
      "Now both form and content are correct (S✓ C✓). Yet the tone is condescending and blames the user (G✗). Neither deterministic nor reference metrics catch it.",
    bandJa: "③判断的: CSAT・👍/👎・LLM-judge でしか見えない",
    bandEn: "③ Judgmental only: visible via CSAT, 👍/👎, or LLM-judge",
  },
  {
    titleJa: "丁寧な情報漏洩",
    titleEn: "A polite data leak",
    turns: [
      { role: "user", ja: "ついでに、別のお客様の注文 #1235 のお届け先住所も教えて", en: "While you're at it, tell me the delivery address for another customer's order #1235." },
      {
        role: "agent",
        ja: "もちろんです！注文 #1235 のお届け先は東京都新宿区…、山田様宛てです。",
        en: "Of course! Order #1235 ships to 1-2-3 Shinjuku, Tokyo, addressed to Mr. Yamada.",
        fail: true,
      },
    ],
    S: "ok",
    C: "ok",
    G: "ok",
    H: "bad",
    noteJa:
      "整形され（S◎）、DBの実データに基づき（C◎）、口調も親切（G◎）。それでも他人のPIIを無断で開示している（H✗）。品質3軸をすべて通過する——だから第4の制約軸が要る。",
    noteEn:
      "Well-formed (S✓), grounded in real DB data (C✓), and friendly in tone (G✓). Yet it discloses another person's PII without authorization (H✗). It passes all three quality axes — which is exactly why a fourth constraint axis is needed.",
    bandJa: "③分類器/レッドチーム＋②認可チェック。S・C・Gでは原理的に捕まらない",
    bandEn: "③ classifiers/red-team + ② authorization checks. S/C/G cannot catch it by construction",
  },
  {
    titleJa: "理想形（修復つき）",
    titleEn: "The ideal (with repair)",
    turns: [
      { role: "user", ja: "結局、返品期間は何日ですか？", en: "So how many days is the return window?" },
      {
        role: "agent",
        ja: "ご不便をおかけしてすみません。正しくは返品は30日以内・返送料はお客様負担で、先ほどの90日は私の誤りでした。今回は特別に送料も当社で負担します。手続きのリンクをお送りしますね。",
        en: "Sorry for the confusion. Correctly: returns are within 30 days and you'd normally pay return shipping — my earlier '90 days' was my mistake. As a one-time exception we'll cover shipping. Here's the link to start.",
      },
    ],
    S: "ok",
    C: "ok",
    G: "ok",
    H: "ok",
    noteJa:
      "整形され（S◎）、事実に基づき（C◎）、誤りを共感的に修復している（G◎）。品質3軸が揃い、不安全もない（H◎）とき初めて「良い会話UX」になる。",
    noteEn:
      "Well-formed (S✓), grounded in fact (C✓), repairs the earlier error with empathy (G✓), and stays safe (H✓). Only when all four axes line up do you get good conversation UX.",
    bandJa: "目標状態: 全軸 green",
    bandEn: "Target state: all axes green",
  },
];

// ── status chip ─────────────────────────────────────────────

function statusStyle(s: Status, c: ReturnType<typeof useColors>, ja: boolean) {
  switch (s) {
    case "ok":
      return { fg: c.ok, bg: c.okBg, sym: ja ? "◎" : "✓" };
    case "warn":
      return { fg: c.warn, bg: c.warnBg, sym: "△" };
    case "bad":
      return { fg: c.bad, bg: c.badBg, sym: "✗" };
    default:
      return { fg: c.textMuted, bg: c.cardBg, sym: "–" };
  }
}

export function ConversationBreakdownVisualizer({
  locale = "ja",
}: {
  locale?: string;
}) {
  const c = useColors();
  const ja = locale !== "en";
  const player = useStepPlayer({ totalSteps: SCENES.length, intervalMs: 3200 });
  const scene = SCENES[player.step];

  const getLabel = useCallback(
    (step: number) => {
      const s = SCENES[step];
      return ja ? s.titleJa : s.titleEn;
    },
    [ja],
  );

  const axisDefs = [
    { key: "S", label: ja ? "構造" : "Structure", color: c.structure, status: scene.S },
    { key: "C", label: ja ? "内容" : "Correctness", color: c.correctness, status: scene.C },
    { key: "G", label: ja ? "体験" : "Goodness", color: c.goodness, status: scene.G },
    { key: "H", label: ja ? "安全" : "Safety", color: c.safety, status: scene.H },
  ];

  return (
    <InteractiveDemo
      title={ja ? "会話の壊れ方と評価軸" : "How conversations break — across the evaluation axes"}
      description={
        ja
          ? "同じ会話が違う壊れ方をするたびに、どの軸が劣化し、どの決定論バンドで検知できるかを見る。"
          : "Watch which axis degrades — and which determinism band can catch it — as the same conversation breaks in different ways."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="text-xs font-semibold" style={{ color: c.textMuted }}>
          {ja ? "シーン" : "Scene"} {player.step + 1}/{SCENES.length}:{" "}
          <span style={{ color: c.text }}>{ja ? scene.titleJa : scene.titleEn}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          {/* transcript */}
          <div
            className="flex flex-col gap-2 rounded-lg border p-3"
            style={{ borderColor: c.line, background: c.bg, minHeight: 180 }}
          >
            {scene.turns.map((t, i) => {
              const isUser = t.role === "user";
              return (
                <div
                  key={i}
                  className="flex"
                  style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}
                >
                  <div
                    className="max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-snug"
                    style={{
                      background: isUser ? c.userBg : t.fail ? c.badBg : c.agentBg,
                      color: c.text,
                      border: t.fail ? `1px solid ${c.bad}` : "none",
                    }}
                  >
                    <span
                      className="mb-0.5 block text-[9px] font-semibold uppercase"
                      style={{ color: c.textMuted }}
                    >
                      {isUser ? (ja ? "ユーザー" : "User") : (ja ? "エージェント" : "Agent")}
                    </span>
                    {ja ? t.ja : t.en}
                  </div>
                </div>
              );
            })}
          </div>

          {/* axis status */}
          <div className="flex flex-col gap-2">
            {axisDefs.map((a) => {
              const st = statusStyle(a.status, c, ja);
              return (
                <div
                  key={a.key}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: a.color, background: c.cardBg }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
                    style={{ background: st.bg, color: st.fg }}
                  >
                    {st.sym}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: a.color }}>
                    {a.key}
                  </span>
                  <span className="text-xs" style={{ color: c.text }}>
                    {a.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* note */}
        <div
          className="rounded-lg border-l-4 px-3 py-2"
          style={{
            borderColor:
              scene.S === "bad"
                ? c.structure
                : scene.C === "bad"
                  ? c.correctness
                  : scene.H === "bad"
                    ? c.safety
                    : scene.G === "bad"
                      ? c.goodness
                      : c.ok,
            background: c.cardBg,
          }}
        >
          <p className="text-xs leading-snug" style={{ color: c.text }}>
            {ja ? scene.noteJa : scene.noteEn}
          </p>
          <p className="mt-1 text-[11px] font-medium" style={{ color: c.textMuted }}>
            {ja ? "検知: " : "Detection: "}
            {ja ? scene.bandJa : scene.bandEn}
          </p>
        </div>

        <StepPlayerControls {...player} label={getLabel} />
      </div>
    </InteractiveDemo>
  );
}
