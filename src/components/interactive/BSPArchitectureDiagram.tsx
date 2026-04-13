"use client";

import { useCallback } from "react";
import {
  InteractiveDemo,
  StepPlayerControls,
  useStepPlayer,
} from "@/components/interactive";

// ── Types ───────────────────────────────────────────────────

type MsgItem = { color: string; label: string };

type StepContextSlot = {
  executorId: string;
  messages: MsgItem[];
};

type ExecutorBox = {
  id: string;
  processing: boolean;
  label: string;
};

type EventItem = { color: string };

type PhaseState = {
  title: string;
  titleEn: string;
  currentStep: StepContextSlot[];
  nextStep: StepContextSlot[];
  executors: ExecutorBox[];
  eventQueue: EventItem[];
  description: string;
  descriptionEn: string;
  highlight: "current" | "next" | "swap" | "executors" | "barrier" | null;
};

// ── Colors ──────────────────────────────────────────────────

const C = {
  green: "#22c55e",
  orange: "#f97316",
  red: "#ef4444",
  pink: "#ec4899",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

// ── Scenario ────────────────────────────────────────────────

function buildPhases(): PhaseState[] {
  return [
    // 0: End of previous superstep
    {
      title: "Super Step #N-1 終了時点",
      titleEn: "End of Super Step #N-1",
      currentStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      nextStep: [
        { executorId: "A", messages: [{ color: C.green, label: "m1" }, { color: C.orange, label: "m2" }] },
        { executorId: "B", messages: [{ color: C.red, label: "m3" }, { color: C.pink, label: "m4" }] },
        { executorId: "C", messages: [{ color: C.blue, label: "m5" }] },
      ],
      executors: [
        { id: "A", processing: false, label: "Writer" },
        { id: "B", processing: false, label: "Critic" },
        { id: "C", processing: false, label: "Summary" },
      ],
      eventQueue: [{ color: C.green }, { color: C.green }],
      description: "前のスーパーステップの処理結果として、Edge 経由で _nextStep の各スロット（Executor ID をキーとする ConcurrentQueue）にメッセージが蓄積されている。currentStep は処理済みで空。",
      descriptionEn: "As a result of the previous superstep's processing, messages have accumulated in _nextStep's slots (ConcurrentQueue keyed by Executor ID) via Edges. currentStep is empty after processing.",
      highlight: "next",
    },
    // 1: AdvanceAsync — atomic swap
    {
      title: "AdvanceAsync() — アトミックスワップ",
      titleEn: "AdvanceAsync() — Atomic Swap",
      currentStep: [
        { executorId: "A", messages: [{ color: C.green, label: "m1" }, { color: C.orange, label: "m2" }] },
        { executorId: "B", messages: [{ color: C.red, label: "m3" }, { color: C.pink, label: "m4" }] },
        { executorId: "C", messages: [{ color: C.blue, label: "m5" }] },
      ],
      nextStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      executors: [
        { id: "A", processing: false, label: "Writer" },
        { id: "B", processing: false, label: "Critic" },
        { id: "C", processing: false, label: "Summary" },
      ],
      eventQueue: [{ color: C.green }, { color: C.green }],
      description: "Interlocked.Exchange(ref _nextStep, new StepContext()) で _nextStep が currentStep にスワップ。旧 _nextStep のメッセージが currentStep に移り、新しい空の StepContext が _nextStep になる。",
      descriptionEn: "Interlocked.Exchange(ref _nextStep, new StepContext()) swaps _nextStep into currentStep. Messages from old _nextStep move to currentStep, and a fresh empty StepContext becomes _nextStep.",
      highlight: "swap",
    },
    // 2: Compute
    {
      title: "フェーズ 1: ローカル計算（Task.WhenAll）",
      titleEn: "Phase 1: Local Computation (Task.WhenAll)",
      currentStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      nextStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      executors: [
        { id: "A", processing: true, label: "Writer" },
        { id: "B", processing: true, label: "Critic" },
        { id: "C", processing: true, label: "Summary" },
      ],
      eventQueue: [{ color: C.green }, { color: C.green }],
      description: "currentStep.QueuedMessages.Keys を走査し、Executor ID ごとに currentStep.MessagesFor(id) でキューを取得。DeliverMessagesAsync() を Task.WhenAll で並行呼び出し。各 Executor の [MessageHandler] がメッセージを処理中。",
      descriptionEn: "Iterates currentStep.QueuedMessages.Keys, retrieves queues via currentStep.MessagesFor(id) for each Executor ID. Calls DeliverMessagesAsync() in parallel via Task.WhenAll. Each Executor's [MessageHandler] processes messages.",
      highlight: "executors",
    },
    // 3: Send
    {
      title: "フェーズ 2: メッセージ送信（Edge → _nextStep）",
      titleEn: "Phase 2: Message Sending (Edge → _nextStep)",
      currentStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      nextStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [{ color: C.purple, label: "m6" }] },
        { executorId: "C", messages: [{ color: C.orange, label: "m7" }, { color: C.red, label: "m8" }] },
      ],
      executors: [
        { id: "A", processing: false, label: "Writer" },
        { id: "B", processing: false, label: "Critic" },
        { id: "C", processing: false, label: "Summary" },
      ],
      eventQueue: [{ color: C.green }, { color: C.green }, { color: C.blue }],
      description: "Executor が context.SendMessageAsync() を呼ぶと、InProcessRunnerContext が全 Edge を foreach で走査し、条件にマッチした Edge の宛先 Executor ID で _nextStep.MessagesFor(targetId).Enqueue(envelope) にエンキュー。現在の currentStep には影響しない。",
      descriptionEn: "When Executors call context.SendMessageAsync(), InProcessRunnerContext iterates all Edges via foreach. Matching Edge targets are enqueued via _nextStep.MessagesFor(targetId).Enqueue(envelope). The current currentStep is unaffected.",
      highlight: "next",
    },
    // 4: Barrier
    {
      title: "フェーズ 3: バリア同期",
      titleEn: "Phase 3: Barrier Synchronization",
      currentStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [] },
        { executorId: "C", messages: [] },
      ],
      nextStep: [
        { executorId: "A", messages: [] },
        { executorId: "B", messages: [{ color: C.purple, label: "m6" }] },
        { executorId: "C", messages: [{ color: C.orange, label: "m7" }, { color: C.red, label: "m8" }] },
      ],
      executors: [
        { id: "A", processing: false, label: "Writer" },
        { id: "B", processing: false, label: "Critic" },
        { id: "C", processing: false, label: "Summary" },
      ],
      eventQueue: [{ color: C.green }, { color: C.green }, { color: C.blue }, { color: C.green }],
      description: "StateManager.PublishUpdatesAsync() でキューされたステート更新をバッチ適用。CheckpointAsync() で _nextStep・ステート・Edge ステートを永続化。SuperStepCompletedEvent が Event Queue に投入される。次のステップでは再び AdvanceAsync() で _nextStep → currentStep スワップ。",
      descriptionEn: "StateManager.PublishUpdatesAsync() batch-applies queued state updates. CheckpointAsync() persists _nextStep, state, and Edge state. SuperStepCompletedEvent pushed to Event Queue. Next step starts again with AdvanceAsync() swapping _nextStep → currentStep.",
      highlight: "barrier",
    },
  ];
}

// ── SVG Sub-components ──────────────────────────────────────

function MsgDot({ color, x, y }: { color: string; x: number; y: number }) {
  return <circle cx={x} cy={y} r={5} fill={color} className="transition-all duration-300" />;
}

function StepContextBox({
  label, typeLabel, slots, x, y, w, h, highlighted, swapping, isJa,
}: {
  label: string;
  typeLabel: string;
  slots: StepContextSlot[];
  x: number; y: number; w: number; h: number;
  highlighted: boolean;
  swapping: boolean;
  isJa: boolean;
}) {
  const borderColor = highlighted ? "#3b82f6" : swapping ? "#f59e0b" : "var(--color-border)";
  const bgColor = highlighted ? "#3b82f610" : swapping ? "#f59e0b10" : "var(--color-muted)";
  const headerH = 18;
  const slotH = 24;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
        fill={bgColor} stroke={borderColor}
        strokeWidth={highlighted || swapping ? 2 : 1}
        strokeDasharray={swapping ? "6 3" : undefined}
        className="transition-all duration-300" />
      <text x={x + 6} y={y + 13} fill={highlighted ? "#3b82f6" : swapping ? "#f59e0b" : "var(--color-foreground)"}
        fontSize={9} fontWeight={700} fontFamily="monospace">{label}</text>
      <text x={x + w - 6} y={y + 13} textAnchor="end"
        fill="var(--color-muted-foreground)" fontSize={6} fontFamily="monospace">{typeLabel}</text>
      {slots.map((slot, i) => {
        const sy = y + headerH + 2 + i * (slotH + 2);
        const qW = w - 44;
        return (
          <g key={slot.executorId}>
            <text x={x + 6} y={sy + 14} fill="var(--color-muted-foreground)"
              fontSize={8} fontFamily="monospace" fontWeight={600}>
              [{slot.executorId}]
            </text>
            <rect x={x + 36} y={sy + 2} width={qW} height={18} rx={3}
              fill="var(--color-background)" stroke="var(--color-border)" strokeWidth={0.6} />
            {slot.messages.map((msg, j) => (
              <MsgDot key={j} color={msg.color} x={x + 48 + j * 16} y={sy + 11} />
            ))}
            {slot.messages.length === 0 && (
              <text x={x + 48} y={sy + 14} fill="var(--color-muted-foreground)" fontSize={7} opacity={0.3}>
                {isJa ? "空" : "empty"}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function ExecutorSVGCard({ ex, x, y, w = 80, h = 34 }: { ex: ExecutorBox; x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={ex.processing ? "#dbeafe" : "var(--color-muted)"}
        stroke={ex.processing ? "#3b82f6" : "var(--color-border)"}
        strokeWidth={ex.processing ? 2 : 1}
        className="transition-all duration-300" />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle"
        fill={ex.processing ? "#1e40af" : "var(--color-foreground)"} fontSize={10} fontWeight={700}>
        {ex.label}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 8} textAnchor="middle"
        fill={ex.processing ? "#60a5fa" : "var(--color-muted-foreground)"} fontSize={7} fontFamily="monospace">
        ID: {ex.id}
      </text>
      {ex.processing && (
        <text x={x + w - 8} y={y + 12} fontSize={9}>⚙️</text>
      )}
    </g>
  );
}

function EventQueueBox({ x, y, items }: { x: number; y: number; items: EventItem[] }) {
  const slotCount = Math.max(6, items.length + 1);
  const h = slotCount * 15 + 8;
  return (
    <g>
      <text x={x} y={y - 6} fill="#16a34a" fontSize={8} fontWeight={700}>Event Queue</text>
      <text x={x} y={y + h + 10} fill="#16a34a" fontSize={5.5} fontFamily="monospace">ConcurrentEventSink</text>
      <rect x={x} y={y} width={20} height={h} rx={4}
        fill="#f0fdf4" stroke="#16a34a" strokeWidth={1} />
      {Array.from({ length: slotCount }).map((_, i) => (
        <g key={i}>
          <rect x={x + 3} y={y + 4 + i * 15} width={14} height={12} rx={2}
            fill={items[i] ? "#dcfce7" : "#f0fdf4"} stroke="#86efac" strokeWidth={0.5} />
          {items[i] && (
            <rect x={x + 5} y={y + 6 + i * 15} width={10} height={8} rx={1}
              fill={items[i].color} fillOpacity={0.4} />
          )}
        </g>
      ))}
    </g>
  );
}

// ── Main Component ──────────────────────────────────────────

type BSPArchitectureDiagramProps = { locale?: string };

export function BSPArchitectureDiagram({ locale = "ja" }: BSPArchitectureDiagramProps) {
  const isJa = locale === "ja";
  const phases = buildPhases();

  const player = useStepPlayer({
    totalSteps: phases.length,
    intervalMs: 3000,
  });
  const data = phases[player.step];

  const getLabel = useCallback(
    (s: number) => isJa ? phases[s].title : phases[s].titleEn,
    [isJa, phases]
  );

  // Executor layout
  const exX = 270;
  const exY0 = 58;
  const exGap = 46;
  const exW = 90;
  const exH = 36;

  return (
    <InteractiveDemo
      title={isJa ? "BSP スーパーステップ 構造図" : "BSP Superstep Architecture Diagram"}
      description={
        isJa
          ? "StepContext（ConcurrentDictionary<executorId, Queue>）の currentStep / _nextStep スワップと Event Queue の関係を示す"
          : "Shows the currentStep / _nextStep swap in StepContext (ConcurrentDictionary<executorId, Queue>) and its relationship with Event Queue"
      }
    >
      {/* SVG */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 580 290" className="w-full max-w-2xl mx-auto">
          <defs>
            <marker id="adArrow" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth={6} markerHeight={4} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-muted-foreground)" />
            </marker>
            <marker id="adArrowBlue" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth={6} markerHeight={4} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
            </marker>
            <marker id="adArrowOrange" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth={6} markerHeight={4} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
            </marker>
            <marker id="adArrowGreen" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth={6} markerHeight={4} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill="#16a34a" />
            </marker>
            <marker id="adArrowEdge" viewBox="0 0 10 7" refX="9" refY="3.5"
              markerWidth={7} markerHeight={5} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill="#e879f9" />
            </marker>
          </defs>

          {/* ── InProcessRunnerContext container ── */}
          <rect x={5} y={5} width={440} height={280} rx={12}
            fill="var(--color-muted)" fillOpacity={0.15}
            stroke="var(--color-border)" strokeWidth={1} strokeDasharray="8 4" />
          <text x={15} y={20} fill="var(--color-muted-foreground)" fontSize={7} fontFamily="monospace" fontWeight={600}>
            InProcessRunnerContext
          </text>

          {/* ── currentStep ── */}
          <StepContextBox
            label="currentStep" typeLabel="StepContext"
            slots={data.currentStep}
            x={15} y={30} w={190} h={108}
            highlighted={data.highlight === "current" || data.highlight === "executors"}
            swapping={data.highlight === "swap"}
            isJa={isJa}
          />

          {/* ── _nextStep ── */}
          <StepContextBox
            label="_nextStep" typeLabel="StepContext"
            slots={data.nextStep}
            x={15} y={162} w={190} h={108}
            highlighted={data.highlight === "next"}
            swapping={data.highlight === "swap"}
            isJa={isJa}
          />

          {/* ── Swap arrows ── */}
          {data.highlight === "swap" && (
            <g>
              <path d="M 210 127 C 228 127 228 158 210 158" fill="none" stroke="#f59e0b" strokeWidth={2}
                markerEnd="url(#adArrowOrange)" />
              <path d="M 205 158 C 187 158 187 127 205 127" fill="none" stroke="#f59e0b" strokeWidth={2}
                markerEnd="url(#adArrowOrange)" />
              <text x={232} y={145} fill="#f59e0b" fontSize={6.5} fontFamily="monospace" fontWeight={600}>
                Interlocked.Exchange
              </text>
            </g>
          )}

          {/* ── Executors ── */}
          <text x={exX} y={42} fill="var(--color-muted-foreground)" fontSize={7.5} fontWeight={600}>
            Executors
          </text>
          <text x={exX} y={51} fill="var(--color-muted-foreground)" fontSize={6} fontFamily="monospace">
            Task.WhenAll(DeliverMessagesAsync...)
          </text>
          {data.executors.map((ex, i) => (
            <ExecutorSVGCard key={ex.id} ex={ex} x={exX} y={exY0 + i * exGap} w={exW} h={exH} />
          ))}

          {/* ── Edge connections between Executors ── */}
          {/* A → B */}
          <path
            d={`M ${exX + exW + 4} ${exY0 + exH / 2} Q ${exX + exW + 30} ${exY0 + exGap / 2 + exH / 2} ${exX + exW + 4} ${exY0 + exGap + exH / 2}`}
            fill="none" stroke="#e879f9" strokeWidth={2} markerEnd="url(#adArrowEdge)" />
          <rect x={exX + exW + 18} y={exY0 + exGap / 2 + exH / 2 - 8} width={30} height={13} rx={3}
            fill="#e879f920" stroke="#e879f9" strokeWidth={0.8} />
          <text x={exX + exW + 33} y={exY0 + exGap / 2 + exH / 2 + 1} textAnchor="middle"
            fill="#d946ef" fontSize={7} fontWeight={600}>
            Edge
          </text>

          {/* A → C */}
          <path
            d={`M ${exX + exW + 4} ${exY0 + exH / 2 + 4} Q ${exX + exW + 50} ${exY0 + exGap + exH / 2} ${exX + exW + 4} ${exY0 + exGap * 2 + exH / 2}`}
            fill="none" stroke="#e879f9" strokeWidth={2} markerEnd="url(#adArrowEdge)" />
          <rect x={exX + exW + 35} y={exY0 + exGap + exH / 2 - 1} width={30} height={13} rx={3}
            fill="#e879f920" stroke="#e879f9" strokeWidth={0.8} />
          <text x={exX + exW + 50} y={exY0 + exGap + exH / 2 + 8} textAnchor="middle"
            fill="#d946ef" fontSize={7} fontWeight={600}>
            Edge
          </text>

          {/* B → A (feedback loop) */}
          <path
            d={`M ${exX - 4} ${exY0 + exGap + exH / 2} Q ${exX - 22} ${exY0 + exGap / 2 + exH / 2} ${exX - 4} ${exY0 + exH / 2}`}
            fill="none" stroke="#e879f9" strokeWidth={2} strokeDasharray="4 3"
            markerEnd="url(#adArrowEdge)" />
          <rect x={exX - 42} y={exY0 + exGap / 2 + exH / 2 - 8} width={30} height={13} rx={3}
            fill="#e879f920" stroke="#e879f9" strokeWidth={0.8} />
          <text x={exX - 27} y={exY0 + exGap / 2 + exH / 2 + 1} textAnchor="middle"
            fill="#d946ef" fontSize={7} fontWeight={600}>
            Edge
          </text>

          {/* Arrows: currentStep → Executors */}
          {(data.highlight === "executors") && data.executors.map((_, i) => (
            <path key={`cs-${i}`}
              d={`M 205 ${60 + i * 28} L ${exX - 2} ${exY0 + 18 + i * exGap}`}
              fill="none" stroke="#3b82f6" strokeWidth={1.5}
              markerEnd="url(#adArrowBlue)" />
          ))}
          {data.highlight !== "executors" && data.highlight !== "swap" && (
            <path d="M 205 70 L 268 75" fill="none" stroke="var(--color-border)" strokeWidth={0.8}
              strokeDasharray="3 3" markerEnd="url(#adArrow)" />
          )}

          {/* Arrows: Executors → _nextStep via Edge */}
          {data.highlight === "next" && player.step >= 3 && (
            <g>
              <path d={`M ${exX} ${exY0 + exH + 4} Q 240 155 205 188`} fill="none" stroke="#f59e0b" strokeWidth={1.3}
                strokeDasharray="4 2" markerEnd="url(#adArrowOrange)" />
              <path d={`M ${exX} ${exY0 + exGap * 2 + exH + 4} Q 240 230 205 230`} fill="none" stroke="#f59e0b" strokeWidth={1.3}
                strokeDasharray="4 2" markerEnd="url(#adArrowOrange)" />
              <text x={222} y={172} fill="#f59e0b" fontSize={6.5} fontFamily="monospace" fontWeight={500}>
                Edge → _nextStep
              </text>
            </g>
          )}

          {/* ── Event Queue ── */}
          <EventQueueBox x={460} y={40} items={data.eventQueue} />

          {/* Arrows: → Event Queue */}
          <path d={`M ${exX + exW} ${exY0 + 12} L 458 55`} fill="none" stroke="#16a34a" strokeWidth={0.8}
            strokeDasharray="3 2" markerEnd="url(#adArrowGreen)" />
          <text x={400} y={46} fill="#16a34a" fontSize={5} fontFamily="monospace">AddEventAsync</text>

          <path d={`M ${exX + exW} ${exY0 + exGap * 2 + exH - 4} Q 420 195 458 130`} fill="none" stroke="#16a34a" strokeWidth={0.8}
            strokeDasharray="3 2" markerEnd="url(#adArrowGreen)" />
          <text x={400} y={182} fill="#16a34a" fontSize={5} fontFamily="monospace">YieldOutputAsync</text>

          {/* ── API legend ── */}
          <g>
            <text x={460} y={185} fill="var(--color-muted-foreground)" fontSize={7} fontWeight={600}>
              {isJa ? "API" : "APIs"}
            </text>
            {[
              { label: "SendMessageAsync", desc: "→ _nextStep[targetId]", color: "#f59e0b" },
              { label: "AddEventAsync", desc: "→ Event Queue", color: "#16a34a" },
              { label: "YieldOutputAsync", desc: "→ Event Queue", color: "#16a34a" },
              { label: "QueueStateUpdateAsync", desc: isJa ? "→ バリア時適用" : "→ applied at barrier", color: "#8b5cf6" },
            ].map((api, i) => (
              <g key={i}>
                <circle cx={465} cy={200 + i * 18} r={3} fill={api.color} />
                <text x={472} y={198 + i * 18} fill="var(--color-foreground)" fontSize={6} fontFamily="monospace">{api.label}</text>
                <text x={472} y={207 + i * 18} fill="var(--color-muted-foreground)" fontSize={5.5}>{api.desc}</text>
              </g>
            ))}
            {/* Edge legend */}
            <g>
              <circle cx={465} cy={200 + 4 * 18} r={3} fill="#e879f9" />
              <text x={472} y={198 + 4 * 18} fill="var(--color-foreground)" fontSize={6} fontFamily="monospace">Edge</text>
              <text x={472} y={207 + 4 * 18} fill="var(--color-muted-foreground)" fontSize={5.5}>
                {isJa ? "Executor 間のルーティング" : "Routing between Executors"}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Description */}
      <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground min-h-[3rem]">
        {isJa ? data.description : data.descriptionEn}
      </div>

      <StepPlayerControls {...player} label={getLabel} />
    </InteractiveDemo>
  );
}
