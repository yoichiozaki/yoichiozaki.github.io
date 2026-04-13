"use client";

import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

type MCPProtocolVisualizerProps = { locale?: string };

type Participant = "host" | "client" | "server";

type StepData = {
  labelJa: string;
  labelEn: string;
  sender: Participant;
  receiver: Participant;
  method: string;
  direction: "right" | "left";
  payload?: string;
  highlightJa: string;
  highlightEn: string;
};

const steps: StepData[] = [
  {
    labelJa: "1. Host が MCP Client を生成",
    labelEn: "1. Host creates MCP Client",
    sender: "host",
    receiver: "client",
    method: "new MCPClient()",
    direction: "right",
    highlightJa:
      "AI アプリケーション(Host)が MCP Server ごとに MCP Client インスタンスを生成します。",
    highlightEn:
      "The AI application (Host) creates an MCP Client instance for each MCP Server.",
  },
  {
    labelJa: "2. Client → Server: initialize リクエスト",
    labelEn: "2. Client → Server: initialize request",
    sender: "client",
    receiver: "server",
    method: "initialize",
    direction: "right",
    payload: JSON.stringify(
      {
        protocolVersion: "2025-06-18",
        capabilities: { elicitation: {} },
        clientInfo: { name: "example-client", version: "1.0.0" },
      },
      null,
      2
    ),
    highlightJa:
      "Client は protocolVersion、capabilities、clientInfo を送信し、Server と capability negotiation を開始します。",
    highlightEn:
      "Client sends protocolVersion, capabilities, and clientInfo to begin capability negotiation with the Server.",
  },
  {
    labelJa: "3. Server → Client: initialize レスポンス",
    labelEn: "3. Server → Client: initialize response",
    sender: "server",
    receiver: "client",
    method: "InitializeResult",
    direction: "left",
    payload: JSON.stringify(
      {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: { listChanged: true },
          resources: {},
        },
        serverInfo: { name: "weather-server", version: "1.0.0" },
      },
      null,
      2
    ),
    highlightJa:
      "Server は自身の capabilities（tools, resources 等）と serverInfo を返します。双方が互いの能力を把握します。",
    highlightEn:
      "Server returns its capabilities (tools, resources, etc.) and serverInfo. Both sides now know each other's abilities.",
  },
  {
    labelJa: "4. Client → Server: initialized 通知",
    labelEn: "4. Client → Server: initialized notification",
    sender: "client",
    receiver: "server",
    method: "notifications/initialized",
    direction: "right",
    highlightJa:
      "Client が初期化完了を通知します。JSON-RPC 通知なので id フィールドがなく、レスポンスは不要です。",
    highlightEn:
      "Client notifies initialization is complete. As a JSON-RPC notification, it has no id field and requires no response.",
  },
  {
    labelJa: "5. Client → Server: tools/list リクエスト",
    labelEn: "5. Client → Server: tools/list request",
    sender: "client",
    receiver: "server",
    method: "tools/list",
    direction: "right",
    highlightJa:
      "Client は Server が公開している Tool を発見するため tools/list を送信します。",
    highlightEn:
      "Client sends tools/list to discover the tools exposed by the Server.",
  },
  {
    labelJa: "6. Server → Client: tools/list レスポンス",
    labelEn: "6. Server → Client: tools/list response",
    sender: "server",
    receiver: "client",
    method: "tools[] response",
    direction: "left",
    payload: JSON.stringify(
      {
        tools: [
          {
            name: "weather_current",
            title: "Current Weather",
            description: "Get current weather for a location",
            inputSchema: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
              required: ["location"],
            },
          },
        ],
      },
      null,
      2
    ),
    highlightJa:
      "Server は利用可能な Tool の一覧を返します。各 Tool は name, description, inputSchema（JSON Schema）を含みます。",
    highlightEn:
      "Server returns the list of available tools. Each tool includes name, description, and inputSchema (JSON Schema).",
  },
  {
    labelJa: "7. Client → Server: tools/call 実行",
    labelEn: "7. Client → Server: tools/call execution",
    sender: "client",
    receiver: "server",
    method: "tools/call",
    direction: "right",
    payload: JSON.stringify(
      {
        name: "weather_current",
        arguments: { location: "Tokyo" },
      },
      null,
      2
    ),
    highlightJa:
      "LLM が Tool 呼び出しを決定すると、Client は tools/call で指定の Tool を実行します。引数は inputSchema に従います。",
    highlightEn:
      "When the LLM decides to call a tool, the Client executes it via tools/call. Arguments follow the inputSchema.",
  },
  {
    labelJa: "8. Server → Client: tools/call 結果",
    labelEn: "8. Server → Client: tools/call result",
    sender: "server",
    receiver: "client",
    method: "CallToolResult",
    direction: "left",
    payload: JSON.stringify(
      {
        content: [
          {
            type: "text",
            text: "Tokyo: 22°C, Partly cloudy",
          },
        ],
        isError: false,
      },
      null,
      2
    ),
    highlightJa:
      "Server は content 配列で結果を返します。text, image, audio, resource_link など複数のコンテンツタイプに対応しています。",
    highlightEn:
      "Server returns results in a content array. Multiple content types are supported: text, image, audio, resource_link, etc.",
  },
  {
    labelJa: "9. Server → Client: tools/list_changed 通知",
    labelEn: "9. Server → Client: tools/list_changed notification",
    sender: "server",
    receiver: "client",
    method: "notifications/tools/list_changed",
    direction: "left",
    highlightJa:
      "Server の Tool リストが変更されると通知を送信します。listChanged: true を capability で宣言していた場合のみ送信されます。",
    highlightEn:
      "Server sends a notification when its tool list changes. Only sent if the server declared listChanged: true in capabilities.",
  },
  {
    labelJa: "10. Client → Server: tools/list 再取得",
    labelEn: "10. Client → Server: tools/list re-fetch",
    sender: "client",
    receiver: "server",
    method: "tools/list",
    direction: "right",
    highlightJa:
      "通知を受けた Client は最新の Tool リストを再取得し、LLM が利用可能な Tool を動的に更新します。",
    highlightEn:
      "Upon receiving the notification, the Client re-fetches the latest tool list, dynamically updating the tools available to the LLM.",
  },
];

const participantColors: Record<Participant, { bg: string; border: string; text: string }> = {
  host: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
  },
  client: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  server: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-800 dark:text-purple-200",
  },
};

function ParticipantBox({
  name,
  type,
  active,
}: {
  name: string;
  type: Participant;
  active: boolean;
}) {
  const c = participantColors[type];
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 px-3 py-2 text-center text-xs font-bold transition-all duration-300 min-w-[80px] ${
        active
          ? `${c.bg} ${c.border} ${c.text} scale-105 shadow-md`
          : "bg-muted/30 border-border text-muted-foreground"
      }`}
    >
      <span>{name}</span>
    </div>
  );
}

function Arrow({
  direction,
  active,
  method,
}: {
  direction: "right" | "left";
  active: boolean;
  method: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-1 min-w-[60px]">
      <span
        className={`text-[10px] font-mono mb-1 transition-colors duration-300 text-center leading-tight ${
          active ? "text-accent font-semibold" : "text-muted-foreground/50"
        }`}
      >
        {method}
      </span>
      <div
        className={`h-0.5 w-full transition-colors duration-300 ${
          active ? "bg-accent" : "bg-border"
        }`}
      />
      <div
        className={`absolute bottom-[3px] ${
          direction === "right" ? "right-0" : "left-0"
        }`}
      >
        <svg
          className={`h-3 w-3 transition-colors duration-300 ${
            active ? "text-accent" : "text-border"
          }`}
          fill="currentColor"
          viewBox="0 0 12 12"
        >
          {direction === "right" ? (
            <path d="M2 6L9 2V10L2 6Z" />
          ) : (
            <path d="M10 6L3 2V10L10 6Z" />
          )}
        </svg>
      </div>
    </div>
  );
}

export function MCPProtocolVisualizer({
  locale = "ja",
}: MCPProtocolVisualizerProps) {
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 2000 });
  const current = steps[player.step];
  const isJa = locale === "ja";

  return (
    <InteractiveDemo
      title={isJa ? "MCP プロトコル ライフサイクル" : "MCP Protocol Lifecycle"}
      description={
        isJa
          ? "ステップごとに MCP の初期化・ツール発見・実行・通知の流れを追跡します"
          : "Follow the MCP initialization, tool discovery, execution, and notification flow step by step"
      }
    >
      {/* Participants */}
      <div className="flex items-center gap-2 mb-4">
        <ParticipantBox
          name={isJa ? "Host (AI App)" : "Host (AI App)"}
          type="host"
          active={current.sender === "host" || current.receiver === "host"}
        />
        <Arrow
          direction={
            current.sender === "host" || current.sender === "client"
              ? current.direction
              : "left"
          }
          active={
            current.sender === "host" ||
            current.receiver === "host" ||
            current.sender === "client" ||
            current.receiver === "client"
          }
          method={
            current.sender === "host" || current.receiver === "host"
              ? current.method
              : ""
          }
        />
        <ParticipantBox
          name={isJa ? "MCP Client" : "MCP Client"}
          type="client"
          active={current.sender === "client" || current.receiver === "client"}
        />
        <Arrow
          direction={current.direction}
          active={true}
          method={
            current.sender !== "host" && current.receiver !== "host"
              ? current.method
              : current.sender === "host"
                ? ""
                : current.method
          }
        />
        <ParticipantBox
          name={isJa ? "MCP Server" : "MCP Server"}
          type="server"
          active={current.sender === "server" || current.receiver === "server"}
        />
      </div>

      {/* Step description */}
      <div className="rounded-lg border border-border bg-background p-4 mb-4">
        <div className="text-sm font-semibold text-foreground mb-2">
          {isJa ? current.labelJa : current.labelEn}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isJa ? current.highlightJa : current.highlightEn}
        </p>
      </div>

      {/* JSON payload */}
      {current.payload && (
        <div className="rounded-lg border border-border bg-neutral-950 dark:bg-neutral-900 p-3 mb-4 overflow-x-auto">
          <pre className="text-xs text-emerald-400 font-mono whitespace-pre leading-relaxed">
            {current.payload}
          </pre>
        </div>
      )}

      <StepPlayerControls
        {...player}
        label={(s) => (isJa ? steps[s].labelJa : steps[s].labelEn)}
      />
    </InteractiveDemo>
  );
}
