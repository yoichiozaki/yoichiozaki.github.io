import narration from "../../../narration/random-walk.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import pacing from "./pacing.json";
import {
  DimensionsScene,
  FirstReturnScene,
  GraphWalkScene,
  IntroScene,
  MixingScene,
  OriginScene,
  OutroScene,
  PageRankIdeaScene,
  PowerIterationScene,
  RandomSurferScene,
  RecurrenceScene,
  StationaryScene,
} from "./scenes";

export const randomWalk: VideoDefinition = {
  slug: "random-walk",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    origin: OriginScene,
    recurrence: RecurrenceScene,
    firstreturn: FirstReturnScene,
    dimensions: DimensionsScene,
    graphwalk: GraphWalkScene,
    stationary: StationaryScene,
    mixing: MixingScene,
    pagerankidea: PageRankIdeaScene,
    randomsurfer: RandomSurferScene,
    poweriteration: PowerIterationScene,
    outro: OutroScene,
  },
  pacing,
};
