"use client";

import type { ReactNode } from "react";
import type { Side } from "@/lib/stable-matching";

/* ──────────────────────────────────────────────────────────
 * Small presentational pieces shared by the stable-matching demos.
 * Left side (A, B, …) is coral, right side (…, Y, Z) is teal.
 * ────────────────────────────────────────────────────────── */

export const SIDE_HEX: Record<Side, string> = {
  left: "#cc785c",
  right: "#5db8a6",
};
export const PROPOSAL_HEX = "#e8a55a";
export const REJECT_HEX = "#c64545";
export const STABLE_HEX = "#5db872";

export const sideText: Record<Side, string> = {
  left: "text-[#a9583e] dark:text-[#e0906f]",
  right: "text-[#2f7f70] dark:text-[#7fd1c0]",
};

export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function AgentBadge({
  side,
  name,
  dim = false,
  size = "md",
}: {
  side: Side;
  name: string;
  dim?: boolean;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";
  return (
    <span
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full font-mono font-semibold text-white transition-opacity ${
        dim ? "opacity-40" : ""
      }`}
      style={{ backgroundColor: SIDE_HEX[side] }}
    >
      {name}
    </span>
  );
}

export type ChipState =
  | "idle"
  | "next"
  | "proposing"
  | "held"
  | "final"
  | "rejected"
  | "unacceptable";

const chipClass: Record<ChipState, string> = {
  idle: "border-border text-foreground/80",
  next: "border-dashed border-[#e8a55a] text-foreground",
  proposing: "border-[#e8a55a] bg-[#e8a55a]/25 text-foreground font-semibold",
  held: "border-foreground/40 bg-foreground/10 text-foreground font-semibold",
  final: "border-[#5db872] bg-[#5db872]/20 text-foreground font-semibold",
  rejected: "border-border text-muted-foreground/60 line-through",
  unacceptable: "border-border text-muted-foreground/40 line-through decoration-dotted",
};

export function PrefChip({
  name,
  state = "idle",
  onClick,
  title,
}: {
  name: string;
  state?: ChipState;
  onClick?: () => void;
  title?: string;
}) {
  const cls = `inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 font-mono text-[11px] transition-colors ${chipClass[state]}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className={`${cls} hover:border-accent focus-visible:outline-2 focus-visible:outline-accent`}
      >
        {name}
      </button>
    );
  }
  return (
    <span className={cls} title={title}>
      {name}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-0.5 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-24 shrink-0 text-[11px] font-semibold text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-background p-3 ${className}`}>
      {title && (
        <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Node of the bipartite graph drawn between the two preference tables.
 * Below md the graph sits above the tables, so it needs its own labels;
 * from md up the tables flank the graph and a small dot at the line end is
 * enough (the table badge on the same row names it).
 */
export function GraphNode({
  x,
  y,
  dotX,
  side,
  name,
}: {
  x: number;
  y: number;
  dotX: number;
  side: Side;
  name: string;
}) {
  return (
    <g>
      <g className="md:hidden">
        <circle cx={x} cy={y} r={11} fill={SIDE_HEX[side]} />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#fff"
          fontFamily="ui-monospace, monospace"
        >
          {name}
        </text>
      </g>
      <circle className="hidden md:inline" cx={dotX} cy={y} r={4.5} fill={SIDE_HEX[side]} />
    </g>
  );
}

/** "AX BW CY DZ" style code for a perfect one-to-one matching. */
export function matchingCode(
  match: (number | null)[],
  leftName: (i: number) => string,
  rightName: (j: number) => string,
): string {
  return match
    .map((j, i) => `${leftName(i)}${j === null ? "–" : rightName(j)}`)
    .join(" ");
}
