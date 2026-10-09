import narration from "../../../narration/llm-architecture.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  AttentionScene,
  BlockScene,
  FamiliesScene,
  GenerationScene,
  HeadsMaskScene,
  IntroScene,
  LineageScene,
  OutroScene,
  PositionsScene,
  ScalingScene,
  TokenizationScene,
  TrainingScene,
} from "./scenes";

export const llmArchitecture: VideoDefinition = {
  slug: "llm-architecture",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    lineage: LineageScene,
    families: FamiliesScene,
    scaling: ScalingScene,
    tokenization: TokenizationScene,
    positions: PositionsScene,
    attention: AttentionScene,
    headsmask: HeadsMaskScene,
    block: BlockScene,
    generation: GenerationScene,
    training: TrainingScene,
    outro: OutroScene,
  },
  pacing,
};
