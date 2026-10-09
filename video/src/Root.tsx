import { createRoot } from "./kit/root";
import { asyncAwaitInternals } from "./articles/async-await-internals";
import { bytecodeVm } from "./articles/bytecode-vm";
import { communityDetection } from "./articles/community-detection";
import { consensusAlgorithms } from "./articles/consensus-algorithms";
import { databaseIndexing } from "./articles/database-indexing";
import { dynamicProgramming } from "./articles/dynamic-programming";
import { galeShapley } from "./articles/gale-shapley";
import { garbageCollection } from "./articles/garbage-collection";
import { goSchedulerGmp } from "./articles/go-scheduler-gmp";
import { graphTraversal } from "./articles/graph-traversal";
import { ioUringAndEpoll } from "./articles/io-uring-and-epoll";
import { llmArchitecture } from "./articles/llm-architecture";
import { llmLoadBalancing } from "./articles/llm-load-balancing";
import { mapreduce } from "./articles/mapreduce";
import { randomWalk } from "./articles/random-walk";
import { searchEngineInternals } from "./articles/search-engine-internals";
import { sqlQueryExecutionInternals } from "./articles/sql-query-execution-internals";
import { taskSchedulingAlgorithms } from "./articles/task-scheduling-algorithms";
import { vectorDatabaseInternals } from "./articles/vector-database-internals";

// Every finished video. Scripts (stills, sheet, render) bundle one video at a time
// through a generated entry point instead, so work in progress never breaks them.
export const RemotionRoot = createRoot([
  asyncAwaitInternals,
  bytecodeVm,
  communityDetection,
  consensusAlgorithms,
  databaseIndexing,
  dynamicProgramming,
  galeShapley,
  garbageCollection,
  goSchedulerGmp,
  graphTraversal,
  ioUringAndEpoll,
  llmArchitecture,
  llmLoadBalancing,
  mapreduce,
  randomWalk,
  searchEngineInternals,
  sqlQueryExecutionInternals,
  taskSchedulingAlgorithms,
  vectorDatabaseInternals,
]);
