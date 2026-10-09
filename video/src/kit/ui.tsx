import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { progress } from "./anim";
import { colors, fonts, STAGE_HEIGHT, VIDEO_WIDTH } from "./theme";

type AppearProps = {
  at: number;
  dur?: number;
  dx?: number;
  dy?: number;
  from?: number;
  /** Optional frame at which the element fades back out. */
  until?: number;
  children: ReactNode;
  style?: CSSProperties;
};

/** Fade + slide an element in at frame `at` (relative to the current Sequence). */
export function Appear({ at, dur = 16, dx = 0, dy = 18, from = 0.96, until, children, style }: AppearProps) {
  const frame = useCurrentFrame();
  const p = progress(frame, at, dur);
  const out = until === undefined ? 1 : 1 - progress(frame, until, 10);
  const scale = from + (1 - from) * p;
  return (
    <div
      style={{
        opacity: p * out,
        transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px) scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type AbsProps = { x: number; y: number; w?: number; h?: number; children?: ReactNode; style?: CSSProperties };

/** Absolutely positioned container (top-left anchored) inside the stage. */
export function Abs({ x, y, w, h, children, style }: AbsProps) {
  return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, ...style }}>{children}</div>;
}

/** Full-stage SVG overlay for lines and arrows. */
export function Svg({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <svg
      width={VIDEO_WIDTH}
      height={STAGE_HEIGHT}
      viewBox={`0 0 ${VIDEO_WIDTH} ${STAGE_HEIGHT}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}
    >
      {children}
    </svg>
  );
}

type ArrowProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** 0..1 portion of the arrow drawn. */
  p?: number;
  color?: string;
  width?: number;
  head?: boolean;
  dashed?: boolean;
  /** Perpendicular offset of the quadratic control point (0 = straight). */
  bend?: number;
  opacity?: number;
};

/** Progressive arrow (draw-on) for use inside <Svg>. */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  p = 1,
  color = colors.muted,
  width = 3,
  head = true,
  dashed = false,
  bend = 0,
  opacity = 1,
}: ArrowProps) {
  if (p <= 0) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  const cx = mx + nx * bend;
  const cy = my + ny * bend;
  // Point and tangent at parameter p on the quadratic curve.
  const t = Math.min(1, p);
  const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
  const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
  const tx = 2 * (1 - t) * (cx - x1) + 2 * t * (x2 - cx);
  const ty = 2 * (1 - t) * (cy - y1) + 2 * t * (y2 - cy);
  const angle = Math.atan2(ty, tx);
  // Sub-curve from 0..t via de Casteljau.
  const qx = (1 - t) * x1 + t * cx;
  const qy = (1 - t) * y1 + t * cy;
  const d = `M ${x1} ${y1} Q ${qx} ${qy} ${px} ${py}`;
  const hs = 10 + width * 1.6;
  return (
    <g opacity={opacity}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${width * 3} ${width * 3}` : undefined}
      />
      {head && t > 0.05 && (
        <path
          d={`M ${px} ${py} L ${px - hs * Math.cos(angle - 0.45)} ${py - hs * Math.sin(angle - 0.45)} L ${
            px - hs * Math.cos(angle + 0.45)
          } ${py - hs * Math.sin(angle + 0.45)} Z`}
          fill={color}
        />
      )}
    </g>
  );
}

type ChipProps = { children: ReactNode; tone?: "coral" | "teal" | "amber" | "ink" | "muted" | "error"; size?: number; style?: CSSProperties };

const chipTones = {
  coral: { bg: colors.coralSoft, fg: colors.coralDeep },
  teal: { bg: colors.tealSoft, fg: colors.tealDeep },
  amber: { bg: colors.amberSoft, fg: "#9a6420" },
  ink: { bg: colors.ink, fg: colors.onDark },
  muted: { bg: colors.surfaceCard, fg: colors.body },
  error: { bg: colors.errorSoft, fg: colors.error },
} as const;

/** Small rounded label. */
export function Chip({ children, tone = "muted", size = 24, style }: ChipProps) {
  const t = chipTones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: `${size * 0.25}px ${size * 0.6}px`,
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontFamily: fonts.sans,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type CardProps = {
  children: ReactNode;
  style?: CSSProperties;
  tone?: "card" | "soft" | "dark" | "white";
  accent?: string;
};

/** Rounded panel in the blog's surface colors. */
export function Card({ children, style, tone = "card", accent }: CardProps) {
  const bg =
    tone === "dark" ? colors.dark : tone === "soft" ? colors.surfaceSoft : tone === "white" ? "#ffffff" : colors.surfaceCard;
  return (
    <div
      style={{
        background: bg,
        color: tone === "dark" ? colors.onDark : colors.ink,
        borderRadius: 20,
        border: `2px solid ${accent ?? (tone === "dark" ? colors.darkElevated : colors.hairline)}`,
        boxShadow: tone === "dark" ? "0 18px 40px rgba(20,20,19,0.18)" : "0 10px 30px rgba(20,20,19,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A dot travelling from (x1,y1) to (x2,y2) between frames [start, start+dur]. */
export function Packet({
  x1,
  y1,
  x2,
  y2,
  start,
  dur = 20,
  color = colors.coral,
  r = 11,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start: number;
  dur?: number;
  color?: string;
  r?: number;
  label?: string;
}) {
  const frame = useCurrentFrame();
  if (frame < start || frame > start + dur + 4) return null;
  const p = progress(frame, start, dur);
  const x = x1 + (x2 - x1) * p;
  const y = y1 + (y2 - y1) * p;
  const fade = 1 - progress(frame, start + dur, 4);
  return (
    <g opacity={fade}>
      <circle cx={x} cy={y} r={r} fill={color} />
      {label && (
        <text
          x={x}
          y={y - r - 8}
          textAnchor="middle"
          fontFamily={fonts.mono}
          fontSize={20}
          fontWeight={600}
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  );
}
