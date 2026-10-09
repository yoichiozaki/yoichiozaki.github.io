import narration from "../../../narration/garbage-collection.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  BarrierScene,
  CompactScene,
  GenerationalScene,
  IntroScene,
  LanguagesScene,
  OutroScene,
  RcScene,
  TracingScene,
  TricolorScene,
  WhyScene,
} from "./scenes";

export const garbageCollection: VideoDefinition = {
  slug: "garbage-collection",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    why: WhyScene,
    rc: RcScene,
    tracing: TracingScene,
    tricolor: TricolorScene,
    compact: CompactScene,
    generational: GenerationalScene,
    barrier: BarrierScene,
    languages: LanguagesScene,
    outro: OutroScene,
  },
  pacing,
};
