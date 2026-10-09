import narration from "../../../narration/bytecode-vm.json";
import type { VideoDefinition } from "../../kit/ArticleVideo";
import type { Narration } from "../../kit/timeline";
import pacing from "./pacing.json";
import {
  BytecodeScene,
  DispatchScene,
  EvolutionScene,
  IntroScene,
  JitFlowScene,
  ModelsScene,
  OutroScene,
  PipelineScene,
  StackRegisterScene,
  TieringScene,
  VmLoopScene,
} from "./scenes";

export const bytecodeVm: VideoDefinition = {
  slug: "bytecode-vm",
  narration: narration as Narration,
  scenes: {
    intro: IntroScene,
    models: ModelsScene,
    pipeline: PipelineScene,
    bytecode: BytecodeScene,
    stackregister: StackRegisterScene,
    vmloop: VmLoopScene,
    dispatch: DispatchScene,
    jitflow: JitFlowScene,
    tiering: TieringScene,
    evolution: EvolutionScene,
    outro: OutroScene,
  },
  pacing,
};
