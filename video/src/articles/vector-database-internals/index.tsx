import narration from "../../../narration/vector-database-internals.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  BaselineScene,
  CurseScene,
  DiskAnnScene,
  EmbeddingScene,
  FiltersScene,
  HnswScene,
  IntroScene,
  IvfScene,
  OperationsScene,
  OutroScene,
  PqScene,
} from "./scenes";

export const vectorDatabaseInternals: VideoDefinition = {
  slug: "vector-database-internals",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    embedding: EmbeddingScene,
    curse: CurseScene,
    baseline: BaselineScene,
    ivf: IvfScene,
    pq: PqScene,
    hnsw: HnswScene,
    diskann: DiskAnnScene,
    filters: FiltersScene,
    operations: OperationsScene,
    outro: OutroScene,
  },
  pacing,
};
