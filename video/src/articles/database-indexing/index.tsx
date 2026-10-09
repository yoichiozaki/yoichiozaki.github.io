import narration from "../../../narration/database-indexing.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import { BPlusScene, FanoutScene, IntroScene, RangeScene, ScanScene, SearchScene, SplitScene } from "./scenes-btree";
import { CompactionScene, LsmReadScene, LsmWriteScene, OutroScene, TradeoffScene, WriteCostScene } from "./scenes-lsm";

export const databaseIndexing: VideoDefinition = {
  slug: "database-indexing",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    scan: ScanScene,
    bplus: BPlusScene,
    fanout: FanoutScene,
    search: SearchScene,
    split: SplitScene,
    range: RangeScene,
    writecost: WriteCostScene,
    lsmwrite: LsmWriteScene,
    compaction: CompactionScene,
    lsmread: LsmReadScene,
    tradeoff: TradeoffScene,
    outro: OutroScene,
  },
  pacing,
};
