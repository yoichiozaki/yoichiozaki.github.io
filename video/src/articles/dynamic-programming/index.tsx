import narration from "../../../narration/dynamic-programming.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  CostScene,
  DagScene,
  FillScene,
  ForkScene,
  FrogRecursionScene,
  GridScene,
  IntroScene,
  KnapsackScene,
  MemoizationScene,
  OutroScene,
  SpeedupsScene,
  StateScene,
} from "./scenes";

export const dynamicProgramming: VideoDefinition = {
  slug: "dynamic-programming",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    fork: ForkScene,
    frogrecursion: FrogRecursionScene,
    memoization: MemoizationScene,
    state: StateScene,
    cost: CostScene,
    dag: DagScene,
    fill: FillScene,
    knapsack: KnapsackScene,
    grid: GridScene,
    speedups: SpeedupsScene,
    outro: OutroScene,
  },
  pacing,
};
