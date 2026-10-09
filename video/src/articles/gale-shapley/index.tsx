import narration from "../../../narration/gale-shapley.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  DeferredScene,
  IncentivesScene,
  IntroScene,
  LargeMarketsScene,
  ManyToOneScene,
  NaiveCycleScene,
  OptimalityScene,
  OutroScene,
  RunExampleScene,
  StabilityScene,
  WhyStabilityScene,
  WhyWorksScene,
} from "./scenes";

export const galeShapley: VideoDefinition = {
  slug: "gale-shapley",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    stability: StabilityScene,
    whystability: WhyStabilityScene,
    naivecycle: NaiveCycleScene,
    deferred: DeferredScene,
    runexample: RunExampleScene,
    whyworks: WhyWorksScene,
    optimality: OptimalityScene,
    incentives: IncentivesScene,
    largemarkets: LargeMarketsScene,
    manytoone: ManyToOneScene,
    outro: OutroScene,
  },
  pacing,
};
