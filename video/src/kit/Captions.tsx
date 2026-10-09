import { useCurrentFrame } from "remotion";
import { progress } from "./anim";
import { CAPTION_BAND, colors, fonts, STAGE_HEIGHT, VIDEO_WIDTH } from "./theme";
import type { Lang, TimedSegment } from "./timeline";

const LINE_HEIGHT = 1.38;
/** Usable height inside the band (minus the hairline and the progress bar). */
const MAX_TEXT_HEIGHT = CAPTION_BAND - 8;

/**
 * Pick the largest font size whose estimated wrapped height fits the caption band.
 * Widths are estimated per glyph class (full-width CJK ≈ 1em, Latin ≈ 0.5–0.56em)
 * with headroom for phrase-based line breaking, so long segments shrink and may
 * use a third line instead of overflowing.
 */
function captionFontSize(text: string, lang: Lang, width: number): number {
  let em = 0;
  for (const ch of text) em += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : lang === "ja" ? 0.56 : 0.5;
  const sizes = lang === "ja" ? [40, 37, 34, 31, 28] : [39, 36, 33, 30, 28];
  for (const size of sizes) {
    const lines = Math.ceil((em * size) / (width * 0.88));
    if (lines * size * LINE_HEIGHT <= MAX_TEXT_HEIGHT) return size;
  }
  return sizes[sizes.length - 1];
}

/**
 * Burned-in captions in the reserved bottom band. The active segment is the one
 * whose audio is playing; between segments the previous caption lingers briefly
 * so the text does not flicker during short pauses.
 */
export function Captions({ segments, lang }: { segments: TimedSegment[]; lang: Lang }) {
  const frame = useCurrentFrame();
  const LINGER = 8;
  const FADE = 5;

  const active = segments.find((s, i) => {
    const next = segments[i + 1];
    const end = s.from + s.durationInFrames + LINGER;
    return frame >= s.from && frame < (next ? Math.min(end, next.from) : end);
  });
  if (!active) return null;

  const end = active.from + active.durationInFrames + LINGER;
  const opacity = Math.min(progress(frame, active.from, FADE), 1 - progress(frame, end - FADE, FADE));
  // Keep "B+ tree"-style tokens from splitting across caption lines.
  const text = active.text.replace(/\+ /g, "+\u00a0");
  const maxWidth = lang === "ja" ? 1520 : 1560;
  const fontSize = captionFontSize(text, lang, maxWidth - 80);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: STAGE_HEIGHT,
        width: VIDEO_WIDTH,
        height: CAPTION_BAND,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth,
          padding: "0 40px",
          textAlign: "center",
          fontFamily: fonts.sans,
          fontSize,
          fontWeight: 500,
          lineHeight: LINE_HEIGHT,
          letterSpacing: lang === "ja" ? 0.5 : 0,
          color: colors.bodyStrong,
          opacity,
          wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal",
          textWrap: "balance" as never,
        }}
      >
        {keepHyphenatedTogether(text)}
      </div>
    </div>
  );
}

/** Hyphenated tokens such as "top-p" must not break at the hyphen. */
function keepHyphenatedTogether(text: string) {
  const parts = text.split(/([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/u);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ whiteSpace: "nowrap" }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}
