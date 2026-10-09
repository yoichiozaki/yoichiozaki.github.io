import { Composition } from "remotion";
import { createArticleVideo, type VideoDefinition } from "./ArticleVideo";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./theme";
import type { Lang } from "./timeline";

const LANGS: Lang[] = ["ja", "en"];

/** Remotion root registering `<slug>-ja` and `<slug>-en` compositions for each video. */
export function createRoot(videos: VideoDefinition[]) {
  const compositions = videos.flatMap((def) => {
    const { Component, calculateMetadata } = createArticleVideo(def);
    return LANGS.map((lang) => ({ id: `${def.slug}-${lang}`, lang, Component, calculateMetadata }));
  });

  return function Root() {
    return (
      <>
        {compositions.map(({ id, lang, Component, calculateMetadata }) => (
          <Composition
            key={id}
            id={id}
            component={Component}
            calculateMetadata={calculateMetadata}
            durationInFrames={FPS * 10}
            fps={FPS}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{ lang, timeline: null }}
          />
        ))}
      </>
    );
  };
}
