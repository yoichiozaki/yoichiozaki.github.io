"use client";

import { useState, useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type ExecutorNode = {
  id: string;
  label: string;
  labelEn: string;
  color: string;
  x: number;
  y: number;
  icon: string;
};

type Message = {
  id: number;
  from: string;
  to: string;
  label: string;
  labelEn: string;
  color: string;
};

type WorkflowStep = {
  activeNodes: string[];
  activeEdges: [string, string][];
  messages: Message[];
  description: string;
  descriptionEn: string;
  highlight?: string;
};

// ── Scenario: Writer-Critic Workflow ────────────────────────

const NODES: ExecutorNode[] = [
  { id: "input", label: "ユーザー入力", labelEn: "User Input", color: "#6366f1", x: 50, y: 160, icon: "📝" },
  { id: "writer", label: "Writer", labelEn: "Writer", color: "#3b82f6", x: 200, y: 80, icon: "✏️" },
  { id: "critic", label: "Critic", labelEn: "Critic", color: "#f59e0b", x: 400, y: 80, icon: "🔍" },
  { id: "summary", label: "Summary", labelEn: "Summary", color: "#10b981", x: 550, y: 160, icon: "📄" },
  { id: "output", label: "最終出力", labelEn: "Final Output", color: "#8b5cf6", x: 550, y: 280, icon: "✅" },
];

const EDGES: [string, string, string][] = [
  ["input", "writer", ""],
  ["writer", "critic", ""],
  ["critic", "writer", "❌ reject"],
  ["critic", "summary", "✅ approve"],
  ["summary", "output", ""],
];

function buildWriterCriticScenario(): WorkflowStep[] {
  return [
    {
      activeNodes: ["input"],
      activeEdges: [],
      messages: [],
      description:
        "ワークフロー開始: ユーザーが「AI倫理に関する200語のブログ記事を書いて」と入力します。WorkflowBuilder が構築したグラフに従い、最初の Executor（Writer）にメッセージが送られます。",
      descriptionEn:
        "Workflow start: The user inputs 'Write a 200-word blog post about AI ethics.' The message is routed to the first Executor (Writer) following the graph built by WorkflowBuilder.",
    },
    {
      activeNodes: ["input", "writer"],
      activeEdges: [["input", "writer"]],
      messages: [
        { id: 1, from: "input", to: "writer", label: "タスク", labelEn: "Task", color: "#6366f1" },
      ],
      description:
        "Edge がメッセージを Writer Executor に配送します。WriterExecutor の [MessageHandler] が string 型のメッセージを受け取り、ChatClientAgent.RunStreamingAsync() で LLM にストリーミングリクエストを送信します。",
      descriptionEn:
        "The Edge delivers the message to the Writer Executor. WriterExecutor's [MessageHandler] receives the string message and sends a streaming request to the LLM via ChatClientAgent.RunStreamingAsync().",
    },
    {
      activeNodes: ["writer"],
      activeEdges: [],
      messages: [],
      description:
        "Writer（イテレーション1）: ChatClientAgent が LLM からストリーミングレスポンスを受け取り、記事を生成中。FlowState の共有ステートに会話履歴を保存します。IWorkflowContext.ReadStateAsync / QueueStateUpdateAsync で Executor 間のステート共有が実現されています。",
      descriptionEn:
        "Writer (Iteration 1): ChatClientAgent receives a streaming response from the LLM and generates the article. Conversation history is saved to FlowState shared state via IWorkflowContext.ReadStateAsync / QueueStateUpdateAsync for cross-executor state sharing.",
    },
    {
      activeNodes: ["writer", "critic"],
      activeEdges: [["writer", "critic"]],
      messages: [
        { id: 2, from: "writer", to: "critic", label: "記事v1", labelEn: "Article v1", color: "#3b82f6" },
      ],
      description:
        "Writer が記事 v1 を出力。AddEdge(writer, critic) で定義された Direct Edge に沿って、ChatMessage が Critic Executor に配送されます。",
      descriptionEn:
        "Writer outputs Article v1. The ChatMessage is delivered to the Critic Executor along the Direct Edge defined by AddEdge(writer, critic).",
    },
    {
      activeNodes: ["critic"],
      activeEdges: [],
      messages: [],
      description:
        "Critic（イテレーション1）: CriticExecutor が記事を受け取り、ChatClientAgent に Structured Output（ChatResponseFormat.ForJsonSchema<CriticDecision>()）でレビューを依頼。LLM は { approved: false, feedback: \"具体例を追加してください\" } を返します。",
      descriptionEn:
        "Critic (Iteration 1): CriticExecutor receives the article and requests a review from ChatClientAgent with Structured Output (ChatResponseFormat.ForJsonSchema<CriticDecision>()). The LLM returns { approved: false, feedback: 'Add specific examples' }.",
    },
    {
      activeNodes: ["critic", "writer"],
      activeEdges: [["critic", "writer"]],
      messages: [
        { id: 3, from: "critic", to: "writer", label: "❌ 修正要求", labelEn: "❌ Revise", color: "#ef4444" },
      ],
      description:
        "Critic が拒否判定。AddSwitch で定義された条件分岐 cd.Approved == false により、CriticDecision が Writer に戻されます。Writer の HandleRevisionRequestAsync（CriticDecision 型のメッセージハンドラ）がフィードバック付きで再実行されます。",
      descriptionEn:
        "Critic rejects. The conditional branch defined by AddSwitch (cd.Approved == false) routes the CriticDecision back to Writer. Writer's HandleRevisionRequestAsync (a [MessageHandler] for CriticDecision type) re-executes with feedback.",
    },
    {
      activeNodes: ["writer"],
      activeEdges: [],
      messages: [],
      description:
        "Writer（イテレーション2）: フィードバック「具体例を追加してください」を受けて、修正プロンプトを生成し LLM に再送信します。FlowState.Iteration がインクリメントされ、安全弁として MaxIterations（3回）チェックが行われます。",
      descriptionEn:
        "Writer (Iteration 2): Receives the feedback 'Add specific examples', generates a revision prompt, and re-sends to the LLM. FlowState.Iteration is incremented, with a MaxIterations (3) safety check.",
    },
    {
      activeNodes: ["writer", "critic"],
      activeEdges: [["writer", "critic"]],
      messages: [
        { id: 4, from: "writer", to: "critic", label: "記事v2", labelEn: "Article v2", color: "#3b82f6" },
      ],
      description:
        "Writer が改善された記事 v2 を出力。再び Direct Edge 経由で Critic に配送されます。",
      descriptionEn:
        "Writer outputs the improved Article v2. It is delivered to the Critic again via the Direct Edge.",
    },
    {
      activeNodes: ["critic"],
      activeEdges: [],
      messages: [],
      description:
        "Critic（イテレーション2）: 再度 Structured Output でレビュー。今回は具体例が追加されており、{ approved: true, feedback: \"\" } を返します。",
      descriptionEn:
        "Critic (Iteration 2): Reviews again with Structured Output. This time specific examples are added, and it returns { approved: true, feedback: '' }.",
    },
    {
      activeNodes: ["critic", "summary"],
      activeEdges: [["critic", "summary"]],
      messages: [
        { id: 5, from: "critic", to: "summary", label: "✅ 承認", labelEn: "✅ Approved", color: "#10b981" },
      ],
      description:
        "Critic が承認。AddSwitch の cd.Approved == true 条件により、CriticDecision が Summary Executor にルーティングされます。条件分岐はラムダ式 (cd => cd?.Approved == true) で表現され、型安全にメッセージの内容で分岐できます。",
      descriptionEn:
        "Critic approves. The AddSwitch condition cd.Approved == true routes the CriticDecision to the Summary Executor. Conditional branching is expressed as a lambda (cd => cd?.Approved == true), enabling type-safe routing based on message content.",
    },
    {
      activeNodes: ["summary"],
      activeEdges: [],
      messages: [],
      description:
        "Summary Executor: 最終承認されたコンテンツを整形して出力します。context.YieldOutputAsync() でワークフローの最終出力としてマークします。WithOutputFrom(summary) の設定により、この Executor の出力がワークフロー全体の出力となります。",
      descriptionEn:
        "Summary Executor: Formats and outputs the final approved content. context.YieldOutputAsync() marks it as the workflow's final output. The WithOutputFrom(summary) configuration makes this executor's output the workflow's overall output.",
    },
    {
      activeNodes: ["summary", "output"],
      activeEdges: [["summary", "output"]],
      messages: [
        { id: 6, from: "summary", to: "output", label: "完成記事", labelEn: "Final Article", color: "#10b981" },
      ],
      description:
        "ワークフロー完了: WorkflowOutputEvent が発火し、ストリーミングモードで最終コンテンツがクライアントに配信されます。InProcessExecution.RunStreamingAsync() が StreamingRun を返し、WatchStreamAsync() でリアルタイムにイベントを購読できます。",
      descriptionEn:
        "Workflow complete: WorkflowOutputEvent fires, and the final content is delivered to the client in streaming mode. InProcessExecution.RunStreamingAsync() returns a StreamingRun, and WatchStreamAsync() subscribes to events in real-time.",
    },
  ];
}

// ── Rendering ───────────────────────────────────────────────

function NodeBox({
  node,
  active,
  highlight,
}: {
  node: ExecutorNode;
  active: boolean;
  highlight: boolean;
}) {
  return (
    <g>
      <rect
        x={node.x - 45}
        y={node.y - 25}
        width={90}
        height={50}
        rx={8}
        fill={active ? node.color : "var(--color-muted)"}
        fillOpacity={active ? 0.2 : 0.5}
        stroke={active ? node.color : "var(--color-border)"}
        strokeWidth={highlight ? 3 : active ? 2 : 1}
        className="transition-all duration-300"
      />
      <text
        x={node.x}
        y={node.y - 5}
        textAnchor="middle"
        fill={active ? node.color : "var(--color-muted-foreground)"}
        fontSize={16}
        className="transition-colors duration-300"
      >
        {node.icon}
      </text>
      <text
        x={node.x}
        y={node.y + 15}
        textAnchor="middle"
        fill={active ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
        fontSize={10}
        fontWeight={active ? 600 : 400}
        className="transition-colors duration-300"
      >
        {node.label}
      </text>
    </g>
  );
}

function EdgeLine({
  from,
  to,
  label,
  active,
  nodes,
}: {
  from: string;
  to: string;
  label: string;
  active: boolean;
  nodes: ExecutorNode[];
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const isLoop = from === "critic" && to === "writer";

  let path: string;
  let labelX: number;
  let labelY: number;

  if (isLoop) {
    // curved path going above
    path = `M ${fromNode.x - 20} ${fromNode.y - 25} C ${fromNode.x - 20} ${fromNode.y - 70}, ${toNode.x + 20} ${toNode.y - 70}, ${toNode.x + 20} ${toNode.y - 25}`;
    labelX = (fromNode.x + toNode.x) / 2;
    labelY = fromNode.y - 65;
  } else {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / dist;
    const ny = dy / dist;
    const startX = fromNode.x + nx * 50;
    const startY = fromNode.y + ny * 28;
    const endX = toNode.x - nx * 50;
    const endY = toNode.y - ny * 28;
    path = `M ${startX} ${startY} L ${endX} ${endY}`;
    labelX = (startX + endX) / 2;
    labelY = (startY + endY) / 2 - 8;
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={active ? "#3b82f6" : "var(--color-border)"}
        strokeWidth={active ? 2.5 : 1.5}
        strokeDasharray={isLoop ? "6 3" : undefined}
        markerEnd={active ? "url(#arrowActive)" : "url(#arrow)"}
        className="transition-all duration-300"
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fill={active ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
          fontSize={9}
          className="transition-colors duration-300"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function MessageBubble({ msg, nodes }: { msg: Message; nodes: ExecutorNode[] }) {
  const toNode = nodes.find((n) => n.id === msg.to);
  if (!toNode) return null;

  return (
    <g>
      <rect
        x={toNode.x - 30}
        y={toNode.y + 28}
        width={60}
        height={20}
        rx={10}
        fill={msg.color}
        fillOpacity={0.15}
        stroke={msg.color}
        strokeWidth={1}
      />
      <text
        x={toNode.x}
        y={toNode.y + 42}
        textAnchor="middle"
        fill={msg.color}
        fontSize={8}
        fontWeight={600}
      >
        {msg.label}
      </text>
    </g>
  );
}

// ── Scenario 2: Sequential Translation Pipeline ─────────────

const SEQ_NODES: ExecutorNode[] = [
  { id: "input", label: "入力", labelEn: "Input", color: "#6366f1", x: 50, y: 120, icon: "💬" },
  { id: "fr", label: "French翻訳", labelEn: "French", color: "#3b82f6", x: 190, y: 120, icon: "🇫🇷" },
  { id: "es", label: "Spanish翻訳", labelEn: "Spanish", color: "#f59e0b", x: 350, y: 120, icon: "🇪🇸" },
  { id: "en", label: "English翻訳", labelEn: "English", color: "#10b981", x: 510, y: 120, icon: "🇬🇧" },
  { id: "output", label: "出力", labelEn: "Output", color: "#8b5cf6", x: 640, y: 120, icon: "📤" },
];

const SEQ_EDGES: [string, string, string][] = [
  ["input", "fr", ""],
  ["fr", "es", ""],
  ["es", "en", ""],
  ["en", "output", ""],
];

function buildSequentialScenario(): WorkflowStep[] {
  return [
    {
      activeNodes: ["input"],
      activeEdges: [],
      messages: [],
      description: "Sequential パターン: AgentWorkflowBuilder.BuildSequential() で 3 つの翻訳エージェントを直列接続します。各エージェントは前のエージェントの出力を入力として受け取ります。",
      descriptionEn: "Sequential pattern: AgentWorkflowBuilder.BuildSequential() chains 3 translation agents in series. Each agent receives the previous agent's output as input.",
    },
    {
      activeNodes: ["input", "fr"],
      activeEdges: [["input", "fr"]],
      messages: [{ id: 1, from: "input", to: "fr", label: "Hello!", labelEn: "Hello!", color: "#6366f1" }],
      description: "入力 'Hello, world!' がフランス語翻訳エージェントに送信されます。",
      descriptionEn: "Input 'Hello, world!' is sent to the French translation agent.",
    },
    {
      activeNodes: ["fr"],
      activeEdges: [],
      messages: [],
      description: "French Agent: ChatClientAgent が 'Bonjour, le monde !' を生成。Sequential では出力が自動的に次の Executor に Edge で接続されます。",
      descriptionEn: "French Agent: ChatClientAgent generates 'Bonjour, le monde !'. In Sequential mode, output is automatically connected to the next Executor via Edges.",
    },
    {
      activeNodes: ["fr", "es"],
      activeEdges: [["fr", "es"]],
      messages: [{ id: 2, from: "fr", to: "es", label: "Bonjour!", labelEn: "Bonjour!", color: "#3b82f6" }],
      description: "フランス語の出力がスペイン語翻訳エージェントに渡されます。",
      descriptionEn: "The French output is passed to the Spanish translation agent.",
    },
    {
      activeNodes: ["es", "en"],
      activeEdges: [["es", "en"]],
      messages: [{ id: 3, from: "es", to: "en", label: "¡Hola!", labelEn: "¡Hola!", color: "#f59e0b" }],
      description: "スペイン語の出力が英語翻訳エージェントに渡されます。",
      descriptionEn: "The Spanish output is passed to the English translation agent.",
    },
    {
      activeNodes: ["en", "output"],
      activeEdges: [["en", "output"]],
      messages: [{ id: 4, from: "en", to: "output", label: "Hello!", labelEn: "Hello!", color: "#10b981" }],
      description: "全 3 エージェントが順次実行完了。最終結果が WorkflowOutputEvent として返されます。BuildSequential は内部でチェーン状の Edge を自動生成しています。",
      descriptionEn: "All 3 agents complete sequentially. The final result is returned as a WorkflowOutputEvent. BuildSequential internally auto-generates chained Edges.",
    },
  ];
}

// ── Scenario 3: Concurrent (Fan-out) Pattern ────────────────

const CONC_NODES: ExecutorNode[] = [
  { id: "input", label: "入力", labelEn: "Input", color: "#6366f1", x: 80, y: 160, icon: "💬" },
  { id: "fr", label: "French", labelEn: "French", color: "#3b82f6", x: 310, y: 50, icon: "🇫🇷" },
  { id: "es", label: "Spanish", labelEn: "Spanish", color: "#f59e0b", x: 310, y: 160, icon: "🇪🇸" },
  { id: "en", label: "English", labelEn: "English", color: "#10b981", x: 310, y: 270, icon: "🇬🇧" },
  { id: "output", label: "集約出力", labelEn: "Aggregated", color: "#8b5cf6", x: 540, y: 160, icon: "📤" },
];

const CONC_EDGES: [string, string, string][] = [
  ["input", "fr", ""],
  ["input", "es", ""],
  ["input", "en", ""],
  ["fr", "output", ""],
  ["es", "output", ""],
  ["en", "output", ""],
];

function buildConcurrentScenario(): WorkflowStep[] {
  return [
    {
      activeNodes: ["input"],
      activeEdges: [],
      messages: [],
      description: "Concurrent パターン: AgentWorkflowBuilder.BuildConcurrent() で 3 エージェントを並列実行します。入力は同時に全エージェントに配信されます。",
      descriptionEn: "Concurrent pattern: AgentWorkflowBuilder.BuildConcurrent() runs 3 agents in parallel. Input is delivered to all agents simultaneously.",
    },
    {
      activeNodes: ["input", "fr", "es", "en"],
      activeEdges: [["input", "fr"], ["input", "es"], ["input", "en"]],
      messages: [
        { id: 1, from: "input", to: "fr", label: "Hello!", labelEn: "Hello!", color: "#6366f1" },
        { id: 2, from: "input", to: "es", label: "Hello!", labelEn: "Hello!", color: "#6366f1" },
        { id: 3, from: "input", to: "en", label: "Hello!", labelEn: "Hello!", color: "#6366f1" },
      ],
      description: "Fan-out: 同じ入力が全エージェントに同時に送信されます。スーパーステップ方式により、同一ステップ内の Executor は並行実行されます。",
      descriptionEn: "Fan-out: The same input is sent to all agents simultaneously. The superstep execution model runs Executors within the same step concurrently.",
    },
    {
      activeNodes: ["fr", "es", "en"],
      activeEdges: [],
      messages: [],
      description: "3 つの翻訳エージェントが並行して LLM を呼び出し中。Sequential と違い、待ち時間が重なるため全体のレイテンシが大幅に削減されます。",
      descriptionEn: "Three translation agents call the LLM concurrently. Unlike Sequential, latencies overlap, significantly reducing total wall-clock time.",
    },
    {
      activeNodes: ["fr", "es", "en", "output"],
      activeEdges: [["fr", "output"], ["es", "output"], ["en", "output"]],
      messages: [
        { id: 4, from: "fr", to: "output", label: "Bonjour!", labelEn: "Bonjour!", color: "#3b82f6" },
        { id: 5, from: "es", to: "output", label: "¡Hola!", labelEn: "¡Hola!", color: "#f59e0b" },
        { id: 6, from: "en", to: "output", label: "Hello!", labelEn: "Hello!", color: "#10b981" },
      ],
      description: "Fan-in: 全エージェントの出力が集約ノードに収集されます。BuildConcurrent は内部で Fan-out Edge と Fan-in Barrier Edge を自動生成しています。",
      descriptionEn: "Fan-in: All agents' outputs are collected at the aggregation node. BuildConcurrent internally auto-generates Fan-out and Fan-in Barrier Edges.",
    },
  ];
}

// ── Scenario 4: Handoff Pattern ─────────────────────────────

const HANDOFF_NODES: ExecutorNode[] = [
  { id: "triage", label: "トリアージ", labelEn: "Triage", color: "#6366f1", x: 130, y: 160, icon: "🎯" },
  { id: "math", label: "数学チューター", labelEn: "Math Tutor", color: "#3b82f6", x: 370, y: 80, icon: "🔢" },
  { id: "history", label: "歴史チューター", labelEn: "History Tutor", color: "#f59e0b", x: 370, y: 240, icon: "📚" },
  { id: "output", label: "回答", labelEn: "Answer", color: "#10b981", x: 560, y: 160, icon: "💡" },
];

const HANDOFF_EDGES: [string, string, string][] = [
  ["triage", "math", "数学"],
  ["triage", "history", "歴史"],
  ["math", "triage", "戻る"],
  ["history", "triage", "戻る"],
  ["math", "output", ""],
  ["history", "output", ""],
];

function buildHandoffScenario(): WorkflowStep[] {
  return [
    {
      activeNodes: ["triage"],
      activeEdges: [],
      messages: [],
      description: "Handoff パターン: AgentWorkflowBuilder.CreateHandoffBuilderWith(triageAgent) でトリアージエージェントを起点にワークフローを構築。WithHandoffs() で双方向のハンドオフルートを定義します。",
      descriptionEn: "Handoff pattern: AgentWorkflowBuilder.CreateHandoffBuilderWith(triageAgent) builds a workflow starting from the triage agent. WithHandoffs() defines bidirectional handoff routes.",
    },
    {
      activeNodes: ["triage"],
      activeEdges: [],
      messages: [],
      description: "ユーザーが「二次方程式の解き方を教えて」と質問。トリアージエージェントが内容を分析し、数学チューターにハンドオフすることを決定します。",
      descriptionEn: "User asks 'How do I solve quadratic equations?'. The triage agent analyzes the content and decides to hand off to the Math Tutor.",
    },
    {
      activeNodes: ["triage", "math"],
      activeEdges: [["triage", "math"]],
      messages: [{ id: 1, from: "triage", to: "math", label: "Handoff", labelEn: "Handoff", color: "#3b82f6" }],
      description: "トリアージ → 数学チューターへのハンドオフが実行されます。LLM の応答に handoff ツール呼び出しが含まれており、ワークフローが自動的にルーティングを行います。",
      descriptionEn: "Handoff from Triage → Math Tutor is executed. The LLM response includes a handoff tool call, and the workflow automatically performs the routing.",
    },
    {
      activeNodes: ["math"],
      activeEdges: [],
      messages: [],
      description: "数学チューターが二次方程式の解法を詳しく説明します。専門エージェントはその領域に特化した instructions を持っているため、高品質な回答を生成できます。",
      descriptionEn: "The Math Tutor explains quadratic equation solutions in detail. The specialist agent has domain-specific instructions, enabling high-quality responses.",
    },
    {
      activeNodes: ["math", "output"],
      activeEdges: [["math", "output"]],
      messages: [{ id: 2, from: "math", to: "output", label: "回答", labelEn: "Answer", color: "#10b981" }],
      description: "数学チューターが回答を完了。ワークフロー出力として結果を返します。ハンドオフパターンは「適切な専門家に仕事を委任する」人間のチームワークを AI に再現します。",
      descriptionEn: "Math Tutor completes the answer. The result is returned as workflow output. The Handoff pattern replicates 'delegating to the right expert' — mirroring human teamwork in AI.",
    },
  ];
}

type ScenarioKey = "writer-critic" | "sequential" | "concurrent" | "handoff";

const SCENARIOS: Record<ScenarioKey, {
  label: string;
  labelEn: string;
  nodes: ExecutorNode[];
  edges: [string, string, string][];
  steps: WorkflowStep[];
  svgWidth: number;
  svgHeight: number;
}> = {
  "writer-critic": {
    label: "Writer-Critic ループ",
    labelEn: "Writer-Critic Loop",
    nodes: NODES,
    edges: EDGES,
    steps: buildWriterCriticScenario(),
    svgWidth: 650,
    svgHeight: 320,
  },
  "sequential": {
    label: "Sequential パイプライン",
    labelEn: "Sequential Pipeline",
    nodes: SEQ_NODES,
    edges: SEQ_EDGES,
    steps: buildSequentialScenario(),
    svgWidth: 700,
    svgHeight: 240,
  },
  "concurrent": {
    label: "Concurrent (Fan-out/in)",
    labelEn: "Concurrent (Fan-out/in)",
    nodes: CONC_NODES,
    edges: CONC_EDGES,
    steps: buildConcurrentScenario(),
    svgWidth: 630,
    svgHeight: 320,
  },
  "handoff": {
    label: "Handoff ルーティング",
    labelEn: "Handoff Routing",
    nodes: HANDOFF_NODES,
    edges: HANDOFF_EDGES,
    steps: buildHandoffScenario(),
    svgWidth: 650,
    svgHeight: 320,
  },
};

type AgenticWorkflowVisualizerProps = { locale?: string };

export function AgenticWorkflowVisualizer({
  locale = "ja",
}: AgenticWorkflowVisualizerProps) {
  const isJa = locale === "ja";
  const [scenario, setScenario] = useState<ScenarioKey>("writer-critic");
  const sc = SCENARIOS[scenario];

  const onScenarioChange = useCallback((key: ScenarioKey) => {
    setScenario(key);
  }, []);

  const player = useStepPlayer({
    totalSteps: sc.steps.length,
    intervalMs: 2000,
  });
  const current = sc.steps[player.step];

  return (
    <InteractiveDemo
      title={isJa ? "Agentic Workflow パターン シミュレーター" : "Agentic Workflow Pattern Simulator"}
      description={
        isJa
          ? "Microsoft Agent Framework のワークフローパターンをステップ実行で視覚化します"
          : "Visualize Microsoft Agent Framework workflow patterns step by step"
      }
    >
      {/* Scenario selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => (
          <button
            key={key}
            onClick={() => {
              onScenarioChange(key);
              player.reset();
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              scenario === key
                ? "bg-accent text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {isJa ? SCENARIOS[key].label : SCENARIOS[key].labelEn}
          </button>
        ))}
      </div>

      {/* SVG graph */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${sc.svgWidth} ${sc.svgHeight}`}
          className="mx-auto w-full max-w-2xl"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth={8}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-border)" />
            </marker>
            <marker
              id="arrowActive"
              viewBox="0 0 10 7"
              refX="10"
              refY="3.5"
              markerWidth={8}
              markerHeight={6}
              orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
          </defs>

          {/* Edges */}
          {sc.edges.map(([from, to, label]) => (
            <EdgeLine
              key={`${from}-${to}`}
              from={from}
              to={to}
              label={label}
              active={current.activeEdges.some(
                ([a, b]) => a === from && b === to
              )}
              nodes={sc.nodes}
            />
          ))}

          {/* Nodes */}
          {sc.nodes.map((node) => (
            <NodeBox
              key={node.id}
              node={node}
              active={current.activeNodes.includes(node.id)}
              highlight={node.id === current.highlight}
            />
          ))}

          {/* Messages */}
          {current.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={{ ...msg, label: isJa ? msg.label : msg.labelEn }}
              nodes={sc.nodes}
            />
          ))}
        </svg>
      </div>

      {/* Description */}
      <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm text-foreground min-h-[4.5rem]">
        {isJa ? current.description : current.descriptionEn}
      </div>

      <StepPlayerControls
        {...player}
        label={(step) =>
          isJa
            ? `ステップ ${step + 1} / ${sc.steps.length}`
            : `Step ${step + 1} / ${sc.steps.length}`
        }
      />
    </InteractiveDemo>
  );
}
