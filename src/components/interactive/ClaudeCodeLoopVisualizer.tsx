"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type LoopState = {
  highlight: string; // which subsystem is active
  user: string;
  context: string[];
  modelOutput: string;
  permission: string;
  toolResult: string;
  transcript: string[];
  descriptionJa: string;
  descriptionEn: string;
};

type Props = { locale?: string };

const STEPS: LoopState[] = [
  {
    highlight: "user",
    user: "Fix the failing test in auth.test.ts",
    context: [],
    modelOutput: "",
    permission: "",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "ユーザーが Interactive CLI から「auth.test.ts の失敗テストを直して」と入力。すべての入口（CLI / Headless / SDK / IDE）は同一の queryLoop() に流れ込みます。",
    descriptionEn:
      "User submits the prompt via the interactive CLI. Every entry surface (CLI / Headless / SDK / IDE) funnels into the same queryLoop().",
  },
  {
    highlight: "context",
    user: "Fix the failing test in auth.test.ts",
    context: [
      "system prompt",
      "git status (getSystemContext)",
      "CLAUDE.md hierarchy (getUserContext)",
      "tool schemas (54 max)",
      "history (post-compact)",
    ],
    modelOutput: "",
    permission: "",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "Context Assembly: queryLoop() がモデル呼び出し前に context を組み立てます。getSystemContext() と getUserContext() の結果は memoize され、CLAUDE.md は 4 階層（managed / user / project / local）から階層的にロードされます。",
    descriptionEn:
      "Context assembly: queryLoop() builds the context before each model call. getSystemContext() and getUserContext() results are memoized; CLAUDE.md loads from a 4-level hierarchy (managed / user / project / local).",
  },
  {
    highlight: "compaction",
    user: "Fix the failing test in auth.test.ts",
    context: [
      "system prompt",
      "compacted history (auto-compact summary)",
      "tool schemas (deferred load)",
    ],
    modelOutput: "",
    permission: "",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "Compaction Pipeline: モデル呼び出し前に 5 段の shaper が走ります。1) budget reduction → 2) snip → 3) microcompact → 4) context collapse → 5) auto-compact。安いものから順に、必要な分だけ。",
    descriptionEn:
      "Compaction pipeline: 5 shapers run sequentially before the model call. 1) budget reduction → 2) snip → 3) microcompact → 4) context collapse → 5) auto-compact. Cheapest first, escalating only as needed.",
  },
  {
    highlight: "model",
    user: "Fix the failing test in auth.test.ts",
    context: ["(compacted)"],
    modelOutput:
      'tool_use: Bash { command: "npm test auth.test.ts" }',
    permission: "",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "Model Call: モデルは推論を行い、tool_use ブロックで「Bash で npm test を走らせたい」と要求。モデルは直接 FS や shell に触れません。harness が tool_use を解釈・実行する仕組みです（reasoning と enforcement の分離）。",
    descriptionEn:
      "Model call: the model reasons and emits a tool_use block requesting Bash. The model never touches FS or shell directly. The harness parses and executes the tool_use (separation of reasoning vs enforcement).",
  },
  {
    highlight: "permission",
    user: "Fix the failing test in auth.test.ts",
    context: ["(compacted)"],
    modelOutput: 'tool_use: Bash { command: "npm test auth.test.ts" }',
    permission:
      "(1) tool pre-filter → (2) PreToolUse hook → (3) deny-first rule → (4) mode constraint → (5) auto-mode classifier → (6) shell sandbox → [(7) non-restoration: session invariant]\n→ allow",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "Permission Gate: 7 階層の deny-first 評価。handler は 4 パス（coordinator / speculative classifier / swarm worker / interactive）から状況に応じて分岐。deny は always wins、未知のアクションは『拒否』ではなく『ユーザーに確認』にエスカレートします。Anthropic の調査では permission prompt の 93% が approve されるため、ML 分類器（auto-mode）と sandbox を加えて『人間の注意力』に依存しない構造に。",
    descriptionEn:
      "Permission gate: 7-layer deny-first evaluation. The handler branches into 4 paths (coordinator / speculative classifier / swarm worker / interactive) based on runtime context. Deny always wins; unknown actions escalate to 'ask the user' rather than silently allow. Since 93% of permission prompts get approved, the ML classifier and sandbox are added so safety doesn't depend on human attentiveness.",
  },
  {
    highlight: "tool",
    user: "Fix the failing test in auth.test.ts",
    context: ["(compacted)"],
    modelOutput: 'tool_use: Bash { command: "npm test auth.test.ts" }',
    permission: "approved + sandboxed",
    toolResult:
      "FAIL auth.test.ts > should reject expired token\n  Expected: 401\n  Received: 200",
    transcript: [],
    descriptionJa:
      "Tool Execution: StreamingToolExecutor が並列安全な tool は同時実行、Bash のような state-modifying tool は直列化。出力は per-tool-result budget で頭打ちにされ、context window を圧迫しません。",
    descriptionEn:
      "Tool execution: StreamingToolExecutor parallelizes concurrent-safe tools and serializes state-modifying ones (like Bash). Output is capped by per-tool-result budget so it can't blow up the context window.",
  },
  {
    highlight: "subagent",
    user: "Fix the failing test in auth.test.ts",
    context: ["(compacted)"],
    modelOutput:
      'tool_use: Agent { type: "Explore", prompt: "Find token validation logic" }',
    permission: "approved",
    toolResult: "(subagent running in isolated context window)",
    transcript: [],
    descriptionJa:
      "Subagent Delegation: モデルは Explore subagent を spawn。新しい isolated context で動き、write/edit 系ツールは deny-list され、parent には summary だけが戻ります（full transcript は sidechain .jsonl に書き出し）。Worktree モードを選べば git worktree で FS も分離。",
    descriptionEn:
      "Subagent delegation: the model spawns an Explore subagent. It runs in an isolated context window with write/edit tools deny-listed; only a summary returns to the parent (full transcript goes to a sidechain .jsonl). Worktree mode adds filesystem-level isolation via git worktrees.",
  },
  {
    highlight: "loop",
    user: "Fix the failing test in auth.test.ts",
    context: ["(updated with subagent summary + tool result)"],
    modelOutput:
      'tool_use: Edit { file: "src/auth.ts", patch: "..." }',
    permission: "acceptEdits → auto-approved (deny rules still re-checked)",
    toolResult: "edit applied",
    transcript: [],
    descriptionJa:
      "Iterate: queryLoop() は while-true。tool_result を context に足して再度モデルを呼び、Edit を発行。permission mode が acceptEdits なら working directory 内の編集は auto-approve。次は npm test を再実行して検証へ。",
    descriptionEn:
      "Iterate: queryLoop() is a while-true. Tool results feed back, the model is re-invoked, and an Edit is emitted. Under acceptEdits mode, edits in the working dir are auto-approved. Next: re-run npm test to verify.",
  },
  {
    highlight: "stop",
    user: "Fix the failing test in auth.test.ts",
    context: ["(final)"],
    modelOutput: "✓ Fixed. The expired-token check now returns 401.",
    permission: "—",
    toolResult: "—",
    transcript: [
      "user: Fix the failing test...",
      "tool_use: Bash npm test → FAIL",
      "tool_use: Agent Explore → summary",
      "tool_use: Edit src/auth.ts → applied",
      "assistant: Fixed.",
    ],
    descriptionJa:
      "Stop & Persist: モデルが text-only で返したらターン終了。session transcript は append-only JSONL に永続化され、resume / fork で再構築可能。ただし permission は意図的に再生されません（trust は session ごとに establish）。",
    descriptionEn:
      "Stop & persist: when the model returns text-only, the turn ends. The session transcript persists to append-only JSONL, enabling resume/fork. Permissions are intentionally NOT restored — trust must be re-established per session.",
  },
];

const SUBSYSTEMS = [
  { id: "user", labelJa: "ユーザー", labelEn: "User" },
  { id: "context", labelJa: "Context Assembly", labelEn: "Context Assembly" },
  { id: "compaction", labelJa: "Compaction Pipeline", labelEn: "Compaction Pipeline" },
  { id: "model", labelJa: "Model Call", labelEn: "Model Call" },
  { id: "permission", labelJa: "Permission Gate", labelEn: "Permission Gate" },
  { id: "tool", labelJa: "Tool Execution", labelEn: "Tool Execution" },
  { id: "subagent", labelJa: "Subagent", labelEn: "Subagent" },
  { id: "loop", labelJa: "Iterate", labelEn: "Iterate" },
  { id: "stop", labelJa: "Stop & Persist", labelEn: "Stop & Persist" },
];

export function ClaudeCodeLoopVisualizer({ locale = "ja" }: Props) {
  const player = useStepPlayer({ totalSteps: STEPS.length, intervalMs: 1800 });
  const s = STEPS[player.step];
  const ja = locale === "ja";

  return (
    <InteractiveDemo
      title={ja ? "Claude Code エージェントループ ウォークスルー" : "Claude Code Agent Loop Walkthrough"}
      description={
        ja
          ? "running example『auth.test.ts の失敗テストを直して』が、queryLoop() を 1 周する流れをサブシステム単位でトレース。"
          : "Trace the running example 'Fix the failing test in auth.test.ts' through one revolution of queryLoop(), subsystem by subsystem."
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {SUBSYSTEMS.map((sub) => {
          const active = sub.id === s.highlight;
          return (
            <div
              key={sub.id}
              className={`rounded-md border px-3 py-2 text-xs font-mono transition-all ${
                active
                  ? "border-accent bg-accent/15 text-foreground shadow-sm"
                  : "border-border bg-background/40 text-muted-foreground"
              }`}
            >
              {ja ? sub.labelJa : sub.labelEn}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
        <Panel title={ja ? "ユーザー入力" : "User input"} body={s.user} />
        <Panel
          title={ja ? "Context (assembled)" : "Context (assembled)"}
          body={s.context.length ? s.context.map((c) => `• ${c}`).join("\n") : "—"}
        />
        <Panel title={ja ? "モデル出力" : "Model output"} body={s.modelOutput || "—"} />
        <Panel title={ja ? "Permission 判定" : "Permission decision"} body={s.permission || "—"} />
        <Panel
          title={ja ? "ツール実行結果" : "Tool result"}
          body={s.toolResult || "—"}
        />
        <Panel
          title={ja ? "Session transcript (JSONL)" : "Session transcript (JSONL)"}
          body={s.transcript.length ? s.transcript.map((l) => `• ${l}`).join("\n") : "—"}
        />
      </div>

      <div className="rounded-md border border-border bg-background/60 p-3 text-sm leading-relaxed mb-4 min-h-[5rem]">
        {ja ? s.descriptionJa : s.descriptionEn}
      </div>

      <StepPlayerControls
        {...player}
        label={(i) => `${i + 1} / ${STEPS.length}`}
      />
    </InteractiveDemo>
  );
}

function Panel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {title}
      </div>
      <pre className="whitespace-pre-wrap text-[11px] leading-snug font-mono text-foreground">
        {body}
      </pre>
    </div>
  );
}
