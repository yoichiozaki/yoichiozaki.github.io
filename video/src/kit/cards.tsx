import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "./anim";
import { useScene, type Bilingual } from "./scene";
import { colors, fonts, STAGE_HEIGHT } from "./theme";

type TitleCardProps = {
  title: Bilingual;
  subtitle: Bilingual;
  /** Article-specific illustration on the right-hand side. */
  art?: ReactNode;
};

/** Opening card: series label, serif article title and a one-line promise. */
export function TitleCard({ title, subtitle, art }: TitleCardProps) {
  const frame = useCurrentFrame();
  const { lang, duration } = useScene();
  const exit = 1 - progress(frame, duration - 10, 10);
  const a = progress(frame, 4, 22);
  const b = progress(frame, 12, 24);
  const c = progress(frame, 22, 24);
  const line = progress(frame, 18, 30);

  return (
    <AbsoluteFill style={{ height: STAGE_HEIGHT, opacity: exit }}>
      <div style={{ position: "absolute", left: 140, top: 0, height: STAGE_HEIGHT, width: art ? 980 : 1640, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: lang === "en" ? 4 : 3,
            textTransform: "uppercase",
            color: colors.coral,
            opacity: a,
            transform: `translateY(${(1 - a) * 14}px)`,
          }}
        >
          {lang === "ja" ? "動画で読む" : "Video explainer"}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: fonts.serif,
            fontSize: lang === "ja" ? 78 : 84,
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: lang === "ja" ? 0 : -1.5,
            color: colors.ink,
            opacity: b,
            transform: `translateY(${(1 - b) * 18}px)`,
            wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal",
            textWrap: "balance" as never,
            whiteSpace: "pre-line",
          }}
        >
          {title[lang]}
        </div>
        <div style={{ marginTop: 34, width: 120 * line, height: 4, background: colors.coral, borderRadius: 2 }} />
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.sans,
            fontSize: lang === "ja" ? 34 : 36,
            lineHeight: 1.5,
            color: colors.muted,
            opacity: c,
            transform: `translateY(${(1 - c) * 14}px)`,
            wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal",
            textWrap: "balance" as never,
          }}
        >
          {subtitle[lang]}
        </div>
        <div style={{ marginTop: 56, fontFamily: fonts.serif, fontSize: 28, color: colors.mutedSoft, opacity: c }}>
          Notes from Yoichi Ozaki
        </div>
      </div>
      {art}
    </AbsoluteFill>
  );
}

type EndCardProps = {
  slug: string;
  headline: Bilingual;
  children?: ReactNode;
};

/** Closing card pointing back to the full article. */
export function EndCard({ slug, headline, children }: EndCardProps) {
  const frame = useCurrentFrame();
  const { lang } = useScene();
  const a = progress(frame, 4, 22);
  const b = progress(frame, 16, 22);
  const url = `yoichiozaki.github.io/${lang}/blog/${slug}`;
  return (
    <AbsoluteFill style={{ height: STAGE_HEIGHT, alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div
        style={{
          fontFamily: fonts.serif,
          fontSize: lang === "ja" ? 64 : 70,
          fontWeight: 500,
          letterSpacing: lang === "ja" ? 0 : -1,
          color: colors.ink,
          textAlign: "center",
          maxWidth: 1500,
          lineHeight: 1.2,
          opacity: a,
          transform: `translateY(${(1 - a) * 16}px)`,
          wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal",
          textWrap: "balance" as never,
        }}
      >
        {headline[lang]}
      </div>
      {children}
      <div
        style={{
          marginTop: 56,
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: b,
          transform: `translateY(${(1 - b) * 12}px)`,
        }}
      >
        <span style={{ fontFamily: fonts.sans, fontSize: 30, fontWeight: 600, color: colors.coral }}>
          {lang === "ja" ? "記事を読む →" : "Read the article →"}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 28, color: colors.body }}>{url}</span>
      </div>
    </AbsoluteFill>
  );
}
