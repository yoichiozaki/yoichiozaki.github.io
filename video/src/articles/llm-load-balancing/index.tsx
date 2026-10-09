import narration from "../../../narration/llm-load-balancing.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  AffinityScene,
  AgentsScene,
  EngineScene,
  IntroScene,
  KneeScene,
  MetricsScene,
  OutroScene,
  OverloadScene,
  PoliciesScene,
  PrefixScene,
  StaleScene,
  WhyScene,
} from "./scenes";

export const llmLoadBalancing: VideoDefinition = {
  slug: "llm-load-balancing",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    why: WhyScene,
    knee: KneeScene,
    metrics: MetricsScene,
    policies: PoliciesScene,
    prefix: PrefixScene,
    affinity: AffinityScene,
    stale: StaleScene,
    engine: EngineScene,
    overload: OverloadScene,
    agents: AgentsScene,
    outro: OutroScene,
  },
  pacing,
};
