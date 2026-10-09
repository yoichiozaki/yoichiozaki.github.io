import narration from "../../../narration/community-detection.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  GirvanScene,
  HardnessScene,
  HistoryScene,
  IntroScene,
  LeidenLabelScene,
  LimitsScene,
  LouvainScene,
  ModularityScene,
  OtherMethodsScene,
  OutroScene,
  PracticeScene,
  WhatScene,
} from "./scenes";

export const communityDetection: VideoDefinition = {
  slug: "community-detection",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    what: WhatScene,
    history: HistoryScene,
    girvan: GirvanScene,
    modularity: ModularityScene,
    louvain: LouvainScene,
    leidenlabel: LeidenLabelScene,
    othermethods: OtherMethodsScene,
    hardness: HardnessScene,
    limits: LimitsScene,
    practice: PracticeScene,
    outro: OutroScene,
  },
  pacing,
};
