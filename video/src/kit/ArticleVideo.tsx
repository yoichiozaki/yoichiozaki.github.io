import type React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, type CalculateMetadataFunction } from "remotion";
import "./fonts";
import { Captions } from "./Captions";
import { SceneProvider } from "./scene";
import { colors, FPS, fonts, STAGE_HEIGHT, VIDEO_WIDTH } from "./theme";
import { buildTimeline, defaultPacing, type Lang, type Narration, type Pacing, type Timeline, type Timings } from "./timeline";

export type VideoDefinition = {
  slug: string;
  narration: Narration;
  scenes: Record<string, React.FC>;
  pacing?: Partial<Pacing>;
};

export type ArticleVideoProps = {
  lang: Lang;
  timeline: Timeline | null;
  /** Render without captions and progress bar (used for the poster image). */
  poster?: boolean;
};

function Background() {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(48% 40% at 50% -8%, rgba(204,120,92,0.10), transparent 70%),
          radial-gradient(40% 32% at 100% 0%, rgba(232,165,90,0.08), transparent 70%),
          ${colors.canvas}`,
      }}
    />
  );
}

function Chrome({ timeline, lang }: { timeline: Timeline; lang: Lang }) {
  const frame = useCurrentFrame();
  const total = timeline.durationInFrames;
  const introEnd = timeline.scenes[0]?.durationInFrames ?? 0;
  const brandOpacity = frame < introEnd ? 0 : Math.min(1, (frame - introEnd) / 15);
  return (
    <>
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 82,
          fontFamily: fonts.serif,
          fontSize: 24,
          color: colors.mutedSoft,
          opacity: brandOpacity,
          letterSpacing: lang === "en" ? 0 : 1,
        }}
      >
        Notes from Yoichi Ozaki
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          width: VIDEO_WIDTH - 240,
          top: STAGE_HEIGHT,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${colors.hairline} 12%, ${colors.hairline} 88%, transparent)`,
        }}
      />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: VIDEO_WIDTH, height: 6, background: colors.surfaceCard }}>
        <div style={{ width: `${(frame / total) * 100}%`, height: "100%", background: colors.coral }} />
        {timeline.scenes.slice(1).map((scene) => (
          <div
            key={scene.id}
            style={{
              position: "absolute",
              left: `${(scene.from / total) * 100}%`,
              top: 0,
              width: 3,
              height: 6,
              background: colors.canvas,
            }}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Duration pill baked into the poster image (top-right, clear of the browser's
 * native control bar that overlays the bottom of the poster).
 */
function PosterBadge({ seconds }: { seconds: number }) {
  const total = Math.floor(seconds);
  const duration = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  return (
    <div
      style={{
        position: "absolute",
        right: 120,
        top: 72,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 26px 14px 22px",
        borderRadius: 999,
        background: colors.coral,
        boxShadow: "0 10px 26px rgba(204,120,92,0.30)",
      }}
    >
      <div style={{ width: 0, height: 0, borderTop: "13px solid transparent", borderBottom: "13px solid transparent", borderLeft: "21px solid #ffffff" }} />
      <span style={{ fontFamily: fonts.mono, fontSize: 30, fontWeight: 600, color: "#ffffff" }}>{duration}</span>
    </div>
  );
}

export function createArticleVideo(def: VideoDefinition) {
  const pacing: Pacing = { ...defaultPacing, ...def.pacing };

  const Component: React.FC<ArticleVideoProps> = ({ lang, timeline, poster = false }) => {
    if (!timeline) return <Background />;
    const segments = timeline.scenes.flatMap((s) => s.segments);
    return (
      <AbsoluteFill
        lang={lang}
        style={{ fontFamily: fonts.sans, color: colors.ink, wordBreak: lang === "ja" ? ("auto-phrase" as never) : "normal" }}
      >
        <Background />
        {timeline.scenes.map((scene) => {
          const Scene = def.scenes[scene.id];
          if (!Scene) throw new Error(`No scene component registered for "${scene.id}" in ${def.slug}`);
          return (
            <Sequence key={scene.id} name={scene.id} from={scene.from} durationInFrames={scene.durationInFrames}>
              <SceneProvider
                value={{
                  lang,
                  cues: scene.segments.map((s) => s.from - scene.from),
                  ends: scene.segments.map((s) => s.from - scene.from + s.durationInFrames),
                  duration: scene.durationInFrames,
                  index: scene.index,
                  total: timeline.scenes.length,
                }}
              >
                <Scene />
              </SceneProvider>
            </Sequence>
          );
        })}
        {segments.map((segment) => (
          <Sequence key={segment.id} name={`audio ${segment.id}`} from={segment.from} durationInFrames={segment.durationInFrames}>
            <Html5Audio src={staticFile(segment.file)} />
          </Sequence>
        ))}
        {!poster && <Captions segments={segments} lang={lang} />}
        {!poster && <Chrome timeline={timeline} lang={lang} />}
        {poster && <PosterBadge seconds={timeline.durationInFrames / FPS} />}
      </AbsoluteFill>
    );
  };

  const calculateMetadata: CalculateMetadataFunction<ArticleVideoProps> = async ({ props }) => {
    const response = await fetch(staticFile(`audio/${def.slug}/${props.lang}/timings.json`));
    if (!response.ok) {
      throw new Error(`Missing timings for ${def.slug}/${props.lang}. Run \`npm run tts -- ${def.slug}\` first.`);
    }
    const timings = (await response.json()) as Timings;
    const timeline = buildTimeline(def.narration, timings, props.lang, FPS, pacing);
    return { durationInFrames: timeline.durationInFrames, props: { ...props, timeline } };
  };

  return { Component, calculateMetadata };
}
