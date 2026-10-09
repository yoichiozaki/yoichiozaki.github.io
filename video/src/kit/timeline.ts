export type Lang = "ja" | "en";

export type NarrationSegment = {
  ja: string;
  en: string;
  /** Optional TTS-only text (readings for acronyms etc.). Captions always use `ja`/`en`. */
  jaSpeech?: string;
  enSpeech?: string;
};

export type NarrationScene = { id: string; segments: NarrationSegment[] };
export type Narration = { slug: string; scenes: NarrationScene[] };

export type Timings = {
  slug: string;
  lang: Lang;
  voice: string;
  segments: Record<string, { file: string; seconds: number }>;
};

export type TimedSegment = {
  id: string;
  text: string;
  file: string;
  /** Absolute start frame within the composition. */
  from: number;
  durationInFrames: number;
};

export type TimedScene = {
  id: string;
  index: number;
  from: number;
  durationInFrames: number;
  segments: TimedSegment[];
};

export type Timeline = {
  scenes: TimedScene[];
  durationInFrames: number;
};

export type Pacing = {
  /** Silence before the first narration segment of the video. */
  openingLeadIn: number;
  /** Silence at the start of every other scene (lets the visuals settle). */
  sceneLeadIn: number;
  /** Pause between consecutive segments inside a scene. */
  segmentGap: number;
  /** Hold after the last segment of a scene before cutting to the next. */
  sceneTail: number;
  /** Hold on the final frame after the narration ends. */
  closingTail: number;
  /** Extra seconds appended to specific scenes whose animation needs more room. */
  extraTail?: Record<string, number>;
  /** Frame of the intro rendered as the poster image by scripts/render.mjs (default 75). */
  posterFrame?: number;
};

export const defaultPacing: Pacing = {
  openingLeadIn: 1.0,
  sceneLeadIn: 0.5,
  segmentGap: 0.32,
  sceneTail: 0.7,
  closingTail: 2.2,
};

export function buildTimeline(
  narration: Narration,
  timings: Timings,
  lang: Lang,
  fps: number,
  pacing: Pacing = defaultPacing,
): Timeline {
  const toFrames = (seconds: number) => Math.round(seconds * fps);
  const scenes: TimedScene[] = [];
  let cursor = 0;

  narration.scenes.forEach((scene, index) => {
    const isFirst = index === 0;
    const isLast = index === narration.scenes.length - 1;
    const sceneFrom = cursor;
    let t = cursor + toFrames(isFirst ? pacing.openingLeadIn : pacing.sceneLeadIn);

    const segments = scene.segments.map((segment, i) => {
      const id = `${scene.id}-${i}`;
      const timing = timings.segments[id];
      if (!timing) {
        throw new Error(`Missing narration audio for ${narration.slug}/${lang}/${id}. Run \`npm run tts\`.`);
      }
      if (i > 0) t += toFrames(pacing.segmentGap);
      const timed: TimedSegment = {
        id,
        text: segment[lang],
        file: timing.file,
        from: t,
        durationInFrames: Math.max(1, Math.ceil(timing.seconds * fps)),
      };
      t += timed.durationInFrames;
      return timed;
    });

    t += toFrames(isLast ? pacing.closingTail : pacing.sceneTail);
    t += toFrames(pacing.extraTail?.[scene.id] ?? 0);
    scenes.push({ id: scene.id, index, from: sceneFrom, durationInFrames: t - sceneFrom, segments });
    cursor = t;
  });

  return { scenes, durationInFrames: cursor };
}
