import { createContext, useContext, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { progress } from "./anim";
import { colors, fonts, STAGE_HEIGHT } from "./theme";
import type { Lang } from "./timeline";

export type SceneInfo = {
  lang: Lang;
  /** Start frame of every narration segment, relative to the scene start. */
  cues: number[];
  /** End frame of every narration segment, relative to the scene start. */
  ends: number[];
  duration: number;
  index: number;
  total: number;
};

const SceneContext = createContext<SceneInfo | null>(null);
export const SceneProvider = SceneContext.Provider;

export function useScene(): SceneInfo {
  const info = useContext(SceneContext);
  if (!info) throw new Error("useScene() must be used inside a scene");
  return info;
}

export type Bilingual = { ja: string; en: string };

/** Pick the string for the current scene language. */
export function useT(): (text: Bilingual) => string {
  const { lang } = useScene();
  return (text) => text[lang];
}

type SceneShellProps = {
  kicker?: Bilingual;
  title?: Bilingual;
  children: ReactNode;
};

/**
 * Common chrome for a content scene: chapter kicker + serif title in the top-left,
 * and a short fade at both ends so consecutive scenes cut cleanly through the canvas.
 */
export function SceneShell({ kicker, title, children }: SceneShellProps) {
  const frame = useCurrentFrame();
  const { duration, lang, index } = useScene();
  const enter = progress(frame, 0, 14);
  const exit = 1 - progress(frame, duration - 10, 10);
  const headerIn = progress(frame, 2, 20);

  return (
    <AbsoluteFill style={{ height: STAGE_HEIGHT, opacity: Math.min(enter, exit) }}>
      {(kicker || title) && (
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 76,
            opacity: headerIn,
            transform: `translateY(${(1 - headerIn) * 16}px)`,
          }}
        >
          {kicker && (
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: lang === "en" ? 3 : 2,
                textTransform: "uppercase",
                color: colors.coral,
                marginBottom: 10,
              }}
            >
              {String(index).padStart(2, "0")} — {kicker[lang]}
            </div>
          )}
          {title && (
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: lang === "ja" ? 56 : 60,
                fontWeight: 500,
                letterSpacing: lang === "ja" ? 0 : -1,
                color: colors.ink,
                lineHeight: 1.15,
              }}
            >
              {title[lang]}
            </div>
          )}
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
}
