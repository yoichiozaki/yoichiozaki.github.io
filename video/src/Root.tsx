import { Composition } from "remotion";
import { createArticleVideo, type VideoDefinition } from "./kit/ArticleVideo";
import { FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "./kit/theme";
import type { Lang } from "./kit/timeline";
import { databaseIndexing } from "./articles/database-indexing";
import { consensusAlgorithms } from "./articles/consensus-algorithms";
import { garbageCollection } from "./articles/garbage-collection";

const VIDEOS: VideoDefinition[] = [databaseIndexing, consensusAlgorithms, garbageCollection];
const LANGS: Lang[] = ["ja", "en"];

export function RemotionRoot() {
  return (
    <>
      {VIDEOS.flatMap((def) => {
        const { Component, calculateMetadata } = createArticleVideo(def);
        return LANGS.map((lang) => (
          <Composition
            key={`${def.slug}-${lang}`}
            id={`${def.slug}-${lang}`}
            component={Component}
            calculateMetadata={calculateMetadata}
            durationInFrames={FPS * 10}
            fps={FPS}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
            defaultProps={{ lang, timeline: null }}
          />
        ));
      })}
    </>
  );
}
