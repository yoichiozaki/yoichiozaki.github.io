import narration from "../../../narration/task-scheduling-algorithms.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  CpuScene,
  DeadlinesScene,
  EngineLocalityScene,
  FairQueueingScene,
  IntroScene,
  LlmSpecialScene,
  ObjectivesScene,
  OutroScene,
  RouterSfqScene,
  VirtualTimeScene,
} from "./scenes";

export const taskSchedulingAlgorithms: VideoDefinition = {
  slug: "task-scheduling-algorithms",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    objectives: ObjectivesScene,
    cpu: CpuScene,
    deadlines: DeadlinesScene,
    virtualtime: VirtualTimeScene,
    fairqueueing: FairQueueingScene,
    llmspecial: LlmSpecialScene,
    routersfq: RouterSfqScene,
    enginelocality: EngineLocalityScene,
    outro: OutroScene,
  },
  pacing,
};
