import narration from "../../../narration/graph-traversal.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  BfsScene,
  BfsShortestScene,
  DijkstraProofScene,
  DijkstraScene,
  DfsScene,
  GraphModelScene,
  IntroScene,
  OutroScene,
  RepresentationScene,
  StructureScene,
  VisitedScene,
} from "./scenes";

export const graphTraversal: VideoDefinition = {
  slug: "graph-traversal",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    graphmodel: GraphModelScene,
    representation: RepresentationScene,
    visited: VisitedScene,
    bfs: BfsScene,
    bfsshortest: BfsShortestScene,
    dfs: DfsScene,
    structure: StructureScene,
    dijkstra: DijkstraScene,
    dijkstraproof: DijkstraProofScene,
    outro: OutroScene,
  },
  pacing,
};
