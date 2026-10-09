import narration from "../../../narration/consensus-algorithms.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import { AdoptionScene, FaultsScene, FlpScene, IntroScene, LessonsScene, OutroScene, PaxosScene, PbftScene, RaftScene, TwoPcScene } from "./scenes";

export const consensusAlgorithms: VideoDefinition = {
  slug: "consensus-algorithms",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    faults: FaultsScene,
    flp: FlpScene,
    twopc: TwoPcScene,
    paxos: PaxosScene,
    raft: RaftScene,
    pbft: PbftScene,
    adoption: AdoptionScene,
    lessons: LessonsScene,
    outro: OutroScene,
  },
  pacing,
};
