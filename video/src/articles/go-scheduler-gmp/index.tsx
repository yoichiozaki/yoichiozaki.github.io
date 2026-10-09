import narration from "../../../narration/go-scheduler-gmp.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  CostsScene,
  FindRunnableScene,
  GoMaxProcsScene,
  IntroScene,
  LifecycleScene,
  ModelScene,
  NetpollerScene,
  OutroScene,
  PreemptionScene,
  QueuesScene,
  ScheduleScene,
  StructsScene,
  SyscallHandoffScene,
} from "./scenes";

export const goSchedulerGmp: VideoDefinition = {
  slug: "go-scheduler-gmp",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    model: ModelScene,
    structs: StructsScene,
    queues: QueuesScene,
    schedule: ScheduleScene,
    findrunnable: FindRunnableScene,
    syscallhandoff: SyscallHandoffScene,
    preemption: PreemptionScene,
    netpoller: NetpollerScene,
    lifecycle: LifecycleScene,
    costs: CostsScene,
    gomaxprocs: GoMaxProcsScene,
    outro: OutroScene,
  },
  pacing,
};
