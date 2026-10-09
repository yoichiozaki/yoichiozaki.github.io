import narration from "../../../narration/io-uring-and-epoll.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  AioGapScene,
  BlockingScene,
  EpollModesScene,
  EpollScene,
  IntroScene,
  LimitsScene,
  ModelsScene,
  OutroScene,
  SelectPollScene,
  TradeoffsScene,
  UringBatchScene,
  UringKernelScene,
  UringRingsScene,
} from "./scenes";

export const ioUringAndEpoll: VideoDefinition = {
  slug: "io-uring-and-epoll",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    blocking: BlockingScene,
    models: ModelsScene,
    selectpoll: SelectPollScene,
    epoll: EpollScene,
    epollmodes: EpollModesScene,
    limits: LimitsScene,
    aiogap: AioGapScene,
    uringrings: UringRingsScene,
    uringbatch: UringBatchScene,
    uringkernel: UringKernelScene,
    tradeoffs: TradeoffsScene,
    outro: OutroScene,
  },
  pacing,
};
