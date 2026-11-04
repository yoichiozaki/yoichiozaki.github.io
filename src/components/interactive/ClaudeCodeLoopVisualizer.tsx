"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
  stepPlayerAriaLabels,
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
      "ユーザーが対話型 CLI から「auth.test.ts の失敗テストを直して」と入力します。どのインターフェース（CLI / ヘッドレス / SDK / IDE）も同じ queryLoop() に合流します。",
    descriptionEn:
      "The user enters the prompt in the interactive CLI. Every interface (CLI / headless / SDK / IDE) converges on the same queryLoop().",
  },
  {
    highlight: "context",
    user: "Fix the failing test in auth.test.ts",
    context: [
      "system prompt",
      "git status (getSystemContext)",
      "CLAUDE.md hierarchy (getUserContext)",
      "tool schemas (up to 54 built-in)",
      "history (post-compact)",
    ],
    modelOutput: "",
    permission: "",
    toolResult: "",
    transcript: [],
    descriptionJa:
      "文脈の組み立て：queryLoop() がモデル呼び出しの前に文脈を組み立てます。getSystemContext() と getUserContext() の結果はメモ化され、CLAUDE.md は 4 階層（managed / user / project / local）から読み込まれます。",
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
      "圧縮パイプライン：モデル呼び出しの前に、5 段の圧縮を安いものから順に試します。1) budget reduction → 2) snip → 3) microcompact → 4) context collapse → 5) auto-compact。前の段で足りないときだけ次の段に進みます。",
    descriptionEn:
      "Compaction pipeline: before the model call, five compaction stages are tried in order, cheapest first. 1) budget reduction → 2) snip → 3) microcompact → 4) context collapse → 5) auto-compact. A later stage is used only when the earlier ones are not enough.",
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
      "モデル呼び出し：モデルは推論し、tool_use ブロックで「Bash で npm test を実行したい」と要求します。モデル自身はファイルシステムやシェルに触れず、tool_use を解釈して実行するのはハーネスです（推論と実行の分離）。",
    descriptionEn:
      "Model call: the model reasons and emits a tool_use block requesting Bash. The model never touches the file system or shell directly; the harness parses and executes the tool_use (reasoning is separated from execution).",
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
      "許可ゲート：7 層の「まず拒否」評価です。許可ハンドラーは実行時の状況に応じて 4 つの経路（coordinator / swarm worker / speculative classifier / interactive）に分かれます。deny は常に優先され、未知の操作は黙って許可せずユーザーに確認します。Anthropic の分析ではユーザーが許可プロンプトの 93% を承認するため、ML 分類器（auto-mode）とサンドボックスを加え、安全を人間の注意力に頼らない構造にしています。",
    descriptionEn:
      "Permission gate: a 7-layer deny-first evaluation. The handler branches into 4 paths (coordinator / swarm worker / speculative classifier / interactive) based on runtime context. Deny always wins; unrecognized actions escalate to the user instead of being allowed silently. Because Anthropic found that users approve 93% of permission prompts, the auto-mode ML classifier and a sandbox are added so safety does not depend on human attention.",
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
      "ツール実行：StreamingToolExecutor は読み取り専用のツールを並列に、Bash のように状態を変えるツールを直列に実行します。出力はツール結果ごとのサイズ上限で抑えられ、文脈ウィンドウを圧迫しません。",
    descriptionEn:
      "Tool execution: StreamingToolExecutor runs read-only tools in parallel and state-modifying tools such as Bash serially. A per-tool-result size cap keeps any single output from flooding the context window.",
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
      "サブエージェントへの委任：モデルは Explore サブエージェントを起動します。サブエージェントは独立した新しい文脈で動き、書き込み・編集系のツールは禁止されます。親には要約だけが戻り、全記録はサイドチェーンの .jsonl に書き出されます。isolation を worktree にすると、git worktree で作業ツリーも分かれます。",
    descriptionEn:
      "Subagent delegation: the model spawns an Explore subagent. It runs in an isolated context window with write/edit tools deny-listed; only a summary returns to the parent (the full transcript goes to a sidechain .jsonl). Setting isolation to worktree also gives it a separate working tree via git worktree.",
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
      "ループ続行：queryLoop() は while-true ループです。tool_result を会話に追加してモデルを再び呼ぶと、モデルは Edit を発行します。許可モードが acceptEdits なら、作業ディレクトリー内の編集は自動で承認されます。次は npm test を再実行して修正を確かめます。",
    descriptionEn:
      "Iterate: queryLoop() is a while-true loop. Tool results are appended to the conversation, the model is called again, and it emits an Edit. In acceptEdits mode, edits inside the working directory are approved automatically. Next, npm test runs again to verify the fix.",
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
      "停止と永続化：モデルがテキストだけを返すとターンが終わります。セッション記録は追記専用の JSONL に保存され、resume や fork で会話を再構築できます。ただし、セッション固有の許可は意図的に復元せず、信頼はセッションごとに確立し直します。",
    descriptionEn:
      "Stop & persist: when the model returns text only, the turn ends. The session transcript is saved as append-only JSONL, so resume and fork can rebuild the conversation. Session-scoped permissions are intentionally not restored; trust must be re-established in each session.",
  },
];

const SUBSYSTEMS = [
  { id: "user", labelJa: "ユーザー", labelEn: "User" },
  { id: "context", labelJa: "文脈の組み立て", labelEn: "Context Assembly" },
  { id: "compaction", labelJa: "圧縮パイプライン", labelEn: "Compaction Pipeline" },
  { id: "model", labelJa: "モデル呼び出し", labelEn: "Model Call" },
  { id: "permission", labelJa: "許可ゲート", labelEn: "Permission Gate" },
  { id: "tool", labelJa: "ツール実行", labelEn: "Tool Execution" },
  { id: "subagent", labelJa: "サブエージェント", labelEn: "Subagent" },
  { id: "loop", labelJa: "ループ続行", labelEn: "Iterate" },
  { id: "stop", labelJa: "停止と永続化", labelEn: "Stop & Persist" },
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
          ? "論文と同じ例題「auth.test.ts の失敗テストを直して」で、queryLoop() が 1 周する流れをサブシステムごとにたどります。"
          : "Trace the paper's running example (“Fix the failing test in auth.test.ts”) through one pass of queryLoop(), subsystem by subsystem."
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
          title={ja ? "組み立てた文脈" : "Context (assembled)"}
          body={s.context.length ? s.context.map((c) => `• ${c}`).join("\n") : "—"}
        />
        <Panel title={ja ? "モデル出力" : "Model output"} body={s.modelOutput || "—"} />
        <Panel title={ja ? "許可の判定" : "Permission decision"} body={s.permission || "—"} />
        <Panel
          title={ja ? "ツール実行結果" : "Tool result"}
          body={s.toolResult || "—"}
        />
        <Panel
          title={ja ? "セッション記録（JSONL）" : "Session transcript (JSONL)"}
          body={s.transcript.length ? s.transcript.map((l) => `• ${l}`).join("\n") : "—"}
        />
      </div>

      <div className="rounded-md border border-border bg-background/60 p-3 text-sm leading-relaxed mb-4 min-h-[5rem]">
        {ja ? s.descriptionJa : s.descriptionEn}
      </div>

      <StepPlayerControls
        {...player}
        label={(i) => `${i + 1} / ${STEPS.length}`}
        ariaLabels={stepPlayerAriaLabels(locale)}
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
