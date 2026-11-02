"use client";

import { Fragment, memo, useId, type CSSProperties, type MouseEvent } from "react";
import {
  CATEGORY_COLOR,
  EDGE_BY_ID,
  EFFICIENCY_COLOR,
  ELEMENTS,
  LOOP_BY_ID,
  LOOP_COLOR,
  type Category,
  type Locale,
  type MapLayout,
} from "@/lib/capability-map";

export const MEASURE_COLOR = "#9d8ac7";
const DIM = 0.25;

export const categoryColor = (c: Category) => (CATEGORY_COLOR[c] === "currentColor" ? "var(--foreground)" : CATEGORY_COLOR[c]);
export const tint = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, var(--background))`;

type Props = {
  layout: MapLayout;
  locale: Locale;
  related: Set<string> | null;
  selected: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onToggle: (subId: string) => void;
};

/** The map itself, drawn at canvas coordinates; the parent applies pan and zoom. */
export const CapabilityMapCanvas = memo(function CapabilityMapCanvas({ layout, locale, related, selected, onSelect, onOpen, onToggle }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isJa = locale === "ja";
  const lit = (id: string) => related === null || related.has(id);
  const handlers = (id: string) => ({
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
    },
    onDoubleClick: (e: MouseEvent) => {
      e.stopPropagation();
      onOpen(id);
    },
  });
  const ring = (id: string): CSSProperties =>
    selected === id ? { outline: "2px solid var(--accent)", outlineOffset: 2 } : {};

  return (
    <div className="relative" style={{ width: layout.width, height: layout.height }}>
      {layout.order.map((id) => {
        const b = layout.boxes.get(id)!;
        const el = ELEMENTS.get(id)!;
        const color = categoryColor(el.category);
        const label = el.label[locale];
        const base: CSSProperties = {
          left: b.x,
          top: b.y,
          width: b.w,
          height: b.h,
          opacity: lit(id) ? 1 : DIM,
          ...ring(id),
        };
        const common = {
          type: "button" as const,
          "aria-pressed": selected === id,
          title: label,
          ...handlers(id),
        };

        if (b.kind === "group") {
          return (
            <button
              key={id}
              {...common}
              className="absolute flex flex-col items-start justify-start rounded-xl border-2 px-3 pt-1.5 text-left transition-opacity"
              style={{ ...base, borderColor: color, background: tint(color, 5) }}
            >
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
                {label}
              </span>
            </button>
          );
        }

        if (b.kind === "sub") {
          return (
            <Fragment key={id}>
              <button
                {...common}
                className="absolute flex flex-col items-start justify-start rounded-lg border px-2 pt-1 pr-7 text-left transition-opacity"
                style={{ ...base, borderColor: tint(color, 45), background: tint(color, 11) }}
              >
                <span className="block w-full truncate text-[12px] font-medium text-foreground">{label}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(id);
                }}
                aria-expanded={!b.collapsed}
                aria-label={`${label}${isJa ? (b.collapsed ? "を展開" : "を折りたたむ") : b.collapsed ? ": expand" : ": collapse"}`}
                className="absolute flex items-center justify-center rounded text-[11px] text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground"
                style={{ left: b.x + b.w - 24, top: b.y + 3, width: 20, height: 20, opacity: lit(id) ? 1 : DIM }}
              >
                <span aria-hidden>{b.collapsed ? "▸" : "▾"}</span>
              </button>
            </Fragment>
          );
        }

        if (b.kind === "item") {
          const row = b.h > 30;
          return (
            <button
              key={id}
              {...common}
              className={`absolute flex items-center rounded-md border bg-background px-2 text-left text-[12px] leading-tight text-foreground transition-opacity hover:border-foreground/40 ${row ? "justify-center text-center" : ""}`}
              style={{ ...base, borderColor: tint(color, 40), borderLeftWidth: 3, borderLeftColor: color }}
            >
              <span className={row ? "line-clamp-2 [text-wrap:balance] [word-break:auto-phrase]" : "block truncate"}>{label}</span>
            </button>
          );
        }

        return (
          <button
            key={id}
            {...common}
            className="absolute flex flex-col items-center justify-center rounded-xl border-2 px-3 text-center transition-opacity"
            style={{
              ...base,
              borderColor: color,
              background: tint(color, el.emphasis ? 12 : 6),
              boxShadow: el.emphasis ? `0 0 0 4px ${tint(color, 10)}` : undefined,
            }}
          >
            <span className="block text-[15px] font-bold leading-tight text-foreground">{label}</span>
            {el.sublabel && (
              <span className="mt-1 block text-[11px] leading-snug text-muted-foreground [text-wrap:balance] [word-break:auto-phrase]">
                {el.sublabel[locale]}
              </span>
            )}
          </button>
        );
      })}

      <svg
        className="pointer-events-none absolute left-0 top-0 overflow-visible"
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        aria-hidden
      >
        <defs>
          {(
            [
              ["flow", "var(--muted-foreground)"],
              ["measure", MEASURE_COLOR],
              ["loop", LOOP_COLOR],
            ] as const
          ).map(([kind, fill]) => (
            <marker
              key={kind}
              id={`${uid}-${kind}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,1 L10,5 L0,9 z" style={{ fill }} />
            </marker>
          ))}
        </defs>
        {layout.edges.map((e) => {
          const on = related !== null && related.has(e.id);
          const measure = e.kind === "measure";
          return (
            <path
              key={e.id}
              d={e.path}
              fill="none"
              strokeWidth={on ? 2.6 : 1.6}
              strokeLinecap="round"
              strokeDasharray={measure ? "2 4" : undefined}
              markerEnd={`url(#${uid}-${measure ? "measure" : "flow"})`}
              style={{
                stroke: measure ? MEASURE_COLOR : on ? "var(--foreground)" : "var(--muted-foreground)",
                opacity: lit(e.id) ? 1 : DIM,
                transition: "opacity 150ms",
              }}
            />
          );
        })}
        {layout.loops.map((l) => (
          <path
            key={l.id}
            d={l.path}
            fill="none"
            stroke={LOOP_COLOR}
            strokeWidth={related?.has(l.id) ? 2.6 : 1.7}
            strokeDasharray="7 5"
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#${uid}-loop)`}
            style={{ opacity: lit(l.id) ? 0.95 : DIM, transition: "opacity 150ms" }}
          />
        ))}
      </svg>

      {layout.edges.map((e) => {
        const def = EDGE_BY_ID.get(e.id)!;
        if (!def.label) return null;
        const measure = def.kind === "measure";
        const color = measure ? MEASURE_COLOR : EFFICIENCY_COLOR;
        return (
          <button
            key={e.id}
            type="button"
            {...handlers(e.id)}
            aria-pressed={selected === e.id}
            className="absolute w-max -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 text-center text-[10.5px] leading-tight text-foreground transition-opacity [text-wrap:balance] [word-break:auto-phrase]"
            style={{
              left: e.labelX,
              top: e.labelY,
              maxWidth: e.labelMaxW,
              borderColor: color,
              borderStyle: measure ? "dotted" : "solid",
              background: tint(color, measure ? 10 : 16),
              opacity: lit(e.id) ? 1 : DIM,
              ...ring(e.id),
            }}
          >
            {def.label[locale]}
          </button>
        );
      })}

      {layout.loops.map((l) => {
        const def = LOOP_BY_ID.get(l.id)!;
        return (
          <button
            key={l.id}
            type="button"
            {...handlers(l.id)}
            aria-pressed={selected === l.id}
            className="absolute w-max -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed px-2 py-0.5 text-[10.5px] leading-tight text-foreground transition-opacity"
            style={{
              left: l.labelX,
              top: l.labelY,
              borderColor: LOOP_COLOR,
              background: tint(LOOP_COLOR, 14),
              opacity: lit(l.id) ? 1 : DIM,
              ...ring(l.id),
            }}
          >
            ↺ {def.label[locale]}
          </button>
        );
      })}
    </div>
  );
});
