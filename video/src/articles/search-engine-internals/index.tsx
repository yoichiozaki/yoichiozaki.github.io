import narration from "../../../narration/search-engine-internals.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import pacing from "./pacing.json";
import {
  BM25Scene,
  BooleanScene,
  IntroScene,
  InvertedIndexScene,
  NormalizeScene,
  OutroScene,
  PipelineScene,
  PostingsScene,
  QueryOptimizationScene,
  ScaleScene,
  TFIDFScene,
  TokenizationScene,
} from "./scenes";

export const searchEngineInternals: VideoDefinition = {
  slug: "search-engine-internals",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    pipeline: PipelineScene,
    tokenization: TokenizationScene,
    normalize: NormalizeScene,
    invertedindex: InvertedIndexScene,
    postings: PostingsScene,
    boolean: BooleanScene,
    queryoptimization: QueryOptimizationScene,
    tfidf: TFIDFScene,
    bm25: BM25Scene,
    scale: ScaleScene,
    outro: OutroScene,
  },
  pacing,
};
