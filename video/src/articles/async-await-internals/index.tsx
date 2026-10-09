import narration from "../../../narration/async-await-internals.json";
import pacing from "./pacing.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import {
  AwaitTransformScene,
  ComparisonScene,
  IntroScene,
  JsLoopScene,
  JsOrderScene,
  OutroScene,
  PythonCoroutinesScene,
  PythonLoopScene,
  RustFuturesScene,
  RustWakerScene,
  TaxonomyScene,
  V8PythonScene,
} from "./scenes";

export const asyncAwaitInternals: VideoDefinition = {
  slug: "async-await-internals",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    taxonomy: TaxonomyScene,
    jsloop: JsLoopScene,
    jsorder: JsOrderScene,
    awaittransform: AwaitTransformScene,
    v8python: V8PythonScene,
    pythoncoroutines: PythonCoroutinesScene,
    pythonloop: PythonLoopScene,
    rustfutures: RustFuturesScene,
    rustwaker: RustWakerScene,
    comparison: ComparisonScene,
    outro: OutroScene,
  },
  pacing,
};
