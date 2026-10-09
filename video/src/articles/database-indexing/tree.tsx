import type { CSSProperties } from "react";
import { colors, fonts } from "../../kit/theme";

export const CELL_W = 64;
export const NODE_H = 62;
export const NODE_PAD = 10;

export type NodeState = "normal" | "active" | "found" | "overflow" | "dim" | "visited";

export function nodeWidth(keys: number): number {
  return Math.max(1, keys) * CELL_W + NODE_PAD * 2;
}

/** x coordinate of the i-th child pointer slot (0..keys) along the bottom edge of a node centred at cx. */
export function pointerX(cx: number, keys: number, i: number): number {
  const left = cx - nodeWidth(keys) / 2 + NODE_PAD;
  return left + i * CELL_W;
}

const stateStyle: Record<NodeState, { bg: string; border: string; fg: string }> = {
  normal: { bg: "#ffffff", border: colors.hairlineStrong, fg: colors.ink },
  active: { bg: colors.coralSoft, border: colors.coral, fg: colors.ink },
  found: { bg: colors.tealSoft, border: colors.teal, fg: colors.ink },
  overflow: { bg: colors.errorSoft, border: colors.error, fg: colors.ink },
  dim: { bg: colors.surfaceSoft, border: colors.hairline, fg: colors.mutedSoft },
  visited: { bg: colors.surfaceCard, border: colors.coral, fg: colors.ink },
};

type NodeBoxProps = {
  cx: number;
  y: number;
  keys: (number | string)[];
  state?: NodeState;
  /** Index of a key cell to emphasise. */
  mark?: number;
  markTone?: "coral" | "teal";
  /** Show small row markers under each key (leaf data). 0..1 controls their growth. */
  data?: number;
  opacity?: number;
  scale?: number;
  style?: CSSProperties;
};

export function NodeBox({ cx, y, keys, state = "normal", mark, markTone = "teal", data = 0, opacity = 1, scale = 1, style }: NodeBoxProps) {
  const s = stateStyle[state];
  const w = nodeWidth(keys.length);
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: y,
        width: w,
        height: NODE_H,
        borderRadius: 14,
        background: s.bg,
        border: `3px solid ${s.border}`,
        boxShadow: "0 6px 18px rgba(20,20,19,0.07)",
        display: "flex",
        alignItems: "center",
        padding: `0 ${NODE_PAD - 3}px`,
        boxSizing: "border-box",
        opacity,
        transform: `scale(${scale})`,
        ...style,
      }}
    >
      {keys.map((k, i) => (
        <div
          key={i}
          style={{
            width: CELL_W,
            height: NODE_H - 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: fonts.mono,
            fontSize: 28,
            fontWeight: 600,
            color: mark === i ? "#ffffff" : s.fg,
            borderLeft: i === 0 || mark === i || mark === i - 1 ? "2px solid transparent" : `2px solid ${colors.hairline}`,
            position: "relative",
            borderRadius: 8,
            background: mark === i ? (markTone === "teal" ? colors.teal : colors.coral) : "transparent",
          }}
        >
          {k}
          {data > 0 && (
            <div
              style={{
                position: "absolute",
                top: NODE_H - 8,
                left: "50%",
                transform: `translateX(-50%) scaleY(${data})`,
                transformOrigin: "top",
                width: 16,
                height: 26,
                borderRadius: 4,
                background: colors.amber,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
