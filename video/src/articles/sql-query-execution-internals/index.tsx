import narration from "../../../narration/sql-query-execution-internals.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  BindingLogicalScene,
  CostOptimizationScene,
  FrontendScene,
  IntroScene,
  JoinOrderScene,
  MemoryParallelScene,
  OutroScene,
  PageToDiskScene,
  PhysicalPlanScene,
  RewriteEstimateScene,
  StorageStackScene,
  VolcanoExecutionScene,
} from "./scenes";

export const sqlQueryExecutionInternals: VideoDefinition = {
  slug: "sql-query-execution-internals",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    frontend: FrontendScene,
    bindinglogical: BindingLogicalScene,
    rewriteestimate: RewriteEstimateScene,
    costoptimization: CostOptimizationScene,
    joinorder: JoinOrderScene,
    physicalplan: PhysicalPlanScene,
    volcanoexecution: VolcanoExecutionScene,
    memoryparallel: MemoryParallelScene,
    storagestack: StorageStackScene,
    pagetodisk: PageToDiskScene,
    outro: OutroScene,
  },
  pacing,
};
