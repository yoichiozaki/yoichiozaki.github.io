import narration from "../../../narration/mapreduce.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  ApplicationsScene,
  BeforeScene,
  FaultsScene,
  FrameworkScene,
  IntroScene,
  LegacyScene,
  ModelScene,
  OutroScene,
  PerformanceScene,
  PipelineScene,
  ProblemScene,
  ShuffleScene,
  WordCountScene,
} from "./scenes";

export const mapreduce: VideoDefinition = {
  slug: "mapreduce",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    problem: ProblemScene,
    before: BeforeScene,
    model: ModelScene,
    wordcount: WordCountScene,
    applications: ApplicationsScene,
    pipeline: PipelineScene,
    shuffle: ShuffleScene,
    framework: FrameworkScene,
    faults: FaultsScene,
    performance: PerformanceScene,
    legacy: LegacyScene,
    outro: OutroScene,
  },
  pacing,
};
