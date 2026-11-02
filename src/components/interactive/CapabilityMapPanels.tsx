"use client";

import { useEffect, useRef } from "react";
import {
  CATEGORY_LABEL,
  COMPANIES,
  EDGE_BY_ID,
  EDGES,
  EFFICIENCY_COLOR,
  ELEMENTS,
  KEY_POINTS,
  LOOP_COLOR,
  LOOPS,
  detailOf,
  kindOf,
  labelOf,
  refLabel,
  type Category,
  type Detail,
  type Locale,
} from "@/lib/capability-map";
import { MEASURE_COLOR, categoryColor, tint } from "./CapabilityMapCanvas";

const panel = "rounded-lg border border-border bg-background/95 shadow-lg backdrop-blur-sm";

function kicker(id: string, locale: Locale): string {
  const isJa = locale === "ja";
  const kind = kindOf(id);
  if (kind === "element") {
    const category = CATEGORY_LABEL[ELEMENTS.get(id)!.category][locale];
    return category === labelOf(id)?.[locale] ? "" : category;
  }
  if (kind === "edge") return EDGE_BY_ID.get(id)!.kind === "measure" ? (isJa ? "測る" : "Measurement") : isJa ? "効率" : "Efficiency";
  if (kind === "loop") return isJa ? "成果が戻るループ" : "Feedback loop";
  return "";
}

/** "計算量 → 計算を使う段階" for an edge, so the reader sees what it connects. */
function edgeEnds(id: string, locale: Locale): string | undefined {
  const e = EDGE_BY_ID.get(id);
  if (!e) return undefined;
  return `${labelOf(e.from)?.[locale]} → ${labelOf(e.to)?.[locale]}`;
}

export function Legend({ locale }: { locale: Locale }) {
  const isJa = locale === "ja";
  const categories: Category[] = ["resource", "compute", "size", "stage", "material", "harness", "capability", "measure"];
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
      {categories.map((c) => (
        <li key={c} className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2" style={{ borderColor: categoryColor(c), background: tint(categoryColor(c), 12) }} />
          {CATEGORY_LABEL[c][locale]}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="rounded-full border px-1.5 text-[10px] text-foreground" style={{ borderColor: EFFICIENCY_COLOR, background: tint(EFFICIENCY_COLOR, 16) }}>
          {isJa ? "効率" : "Efficiency"}
        </span>
        {isJa ? "矢印のラベル" : "arrow labels"}
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="28" height="8" aria-hidden>
          <line x1="1" y1="4" x2="27" y2="4" stroke={LOOP_COLOR} strokeWidth="2" strokeDasharray="6 4" />
        </svg>
        {isJa ? "成果が戻るループ" : "Feedback loops"}
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="28" height="8" aria-hidden>
          <line x1="1" y1="4" x2="27" y2="4" stroke={MEASURE_COLOR} strokeWidth="2" strokeDasharray="2 3" strokeLinecap="round" />
        </svg>
        {isJa ? "測る" : "Measurement"}
      </li>
    </ul>
  );
}

const strip = "border-b border-border px-3 py-2 sm:px-4";
const chip = (on: boolean) =>
  `rounded-full border px-2.5 py-0.5 text-xs text-foreground transition-colors ${
    on ? "border-accent bg-accent/15 font-semibold" : "border-border hover:bg-muted"
  }`;

export function KeyPointsStrip({ locale, selected, onSelect }: { locale: Locale; selected: string | null; onSelect: (id: string) => void }) {
  const isJa = locale === "ja";
  const point = KEY_POINTS.find((k) => k.id === selected);
  return (
    <div className={strip}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">{isJa ? "要点" : "Key points"}</span>
        {KEY_POINTS.map((k, i) => (
          <button key={k.id} type="button" onClick={() => onSelect(k.id)} aria-pressed={selected === k.id} className={chip(selected === k.id)}>
            {i + 1}. {k.title[locale]}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-foreground">
        {point
          ? point.body[locale]
          : isJa
            ? "番号を選ぶと、その要点に関わる部分が強調される。"
            : "Pick a point to highlight the parts of the map it concerns."}
      </p>
    </div>
  );
}

export function CompanyStrip({ locale, selected, onSelect }: { locale: Locale; selected: string | null; onSelect: (id: string) => void }) {
  const isJa = locale === "ja";
  const company = COMPANIES.find((c) => c.id === selected);
  return (
    <div className={strip}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">{isJa ? "各社" : "Companies"}</span>
        {COMPANIES.map((c) => (
          <button key={c.id} type="button" onClick={() => onSelect(c.id)} aria-pressed={selected === c.id} className={chip(selected === c.id)}>
            {c.name[locale]}
          </button>
        ))}
      </div>
      {company ? (
        <ul className="mt-1.5 grid gap-x-5 gap-y-1 text-[12px] leading-snug text-foreground md:grid-cols-3">
          {company.points.map((p, i) => (
            <li key={i} className="relative pl-3 before:absolute before:left-0 before:top-[0.5em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent">
              {p[locale]}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
          {isJa ? "会社を選ぶと、その会社が力を入れているレバーが強調される。" : "Pick a company to highlight the levers it leans on."}
        </p>
      )}
    </div>
  );
}

export function InfoBar({ id, locale, onOpen, onClear }: { id: string; locale: Locale; onOpen: () => void; onClear: () => void }) {
  const isJa = locale === "ja";
  const detail = detailOf(id);
  const ends = edgeEnds(id, locale);
  const lead = kicker(id, locale);
  return (
    <div className={`${panel} pointer-events-auto flex items-start gap-3 p-3`} role="status">
      <div className="min-w-0 flex-1">
        {(lead || ends) && (
          <p className="text-[11px] text-muted-foreground">
            {lead}
            {ends && <span className={lead ? "ml-2" : undefined}>{ends}</span>}
          </p>
        )}
        <p className="text-sm font-semibold text-foreground">{labelOf(id)?.[locale]}</p>
        {detail && <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-muted-foreground">{detail.summary[locale]}</p>}
      </div>
      <div className="flex shrink-0 gap-1.5">
        {detail && (
          <button type="button" onClick={onOpen} className="rounded-md border border-accent px-2.5 py-1 text-xs text-foreground hover:bg-muted">
            {isJa ? "詳しく" : "Details"}
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          aria-label={isJa ? "選択を解除" : "Clear selection"}
          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function DetailBody({ detail, locale }: { detail: Detail; locale: Locale }) {
  const isJa = locale === "ja";
  return (
    <>
      <p className="text-sm leading-relaxed text-foreground">{detail.summary[locale]}</p>
      {detail.note && <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[13px] leading-relaxed text-foreground">{detail.note[locale]}</p>}
      {detail.refs && detail.refs.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {isJa ? "本文の該当箇所: " : "In the article: "}
          {detail.refs.map((r) => refLabel(r, locale)).join(isJa ? "、" : ", ")}
        </p>
      )}
      {detail.links && detail.links.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {detail.links.map((l) => (
            <li key={l.href ?? l.slug}>
              {l.slug ? (
                <a className="text-accent underline underline-offset-2" href={`/${locale}/blog/${l.slug}`}>
                  {l[locale]}
                </a>
              ) : (
                <a className="text-accent underline underline-offset-2" href={l.href} target="_blank" rel="noopener noreferrer">
                  {l[locale]} ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function DetailDialog({ id, locale, onClose }: { id: string; locale: Locale; onClose: () => void }) {
  const isJa = locale === "ja";
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = `capability-map-detail-${id}`;
  const detail = detailOf(id);
  const el = ELEMENTS.get(id);
  const ends = edgeEnds(id, locale);
  const lead = kicker(id, locale);

  useEffect(() => {
    closeRef.current?.focus();
  }, [id]);

  if (!detail) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {(lead || ends) && (
              <p className="text-xs text-muted-foreground">
                {lead}
                {ends && <span className={lead ? "ml-2" : undefined}>{ends}</span>}
              </p>
            )}
            <h4 id={titleId} className="mt-0.5 text-lg font-bold text-foreground">
              {labelOf(id)?.[locale]}
            </h4>
            {el?.sublabel && <p className="text-sm text-muted-foreground">{el.sublabel[locale]}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {isJa ? "閉じる" : "Close"}
          </button>
        </div>
        <div className="mt-3">
          <DetailBody detail={detail} locale={locale} />
        </div>
      </div>
    </div>
  );
}

const LIST_ORDER = ["resources", "compute", "size", "stages", "materials", "model", "harness", "system", "uses", "measures"];

function ListEntry({ id, locale }: { id: string; locale: Locale }) {
  const el = ELEMENTS.get(id)!;
  return (
    <li className="py-1.5">
      <p className="text-[13px] font-semibold text-foreground">{el.label[locale]}</p>
      <p className="text-[12px] leading-snug text-muted-foreground">{el.detail.summary[locale]}</p>
      {el.detail.note && <p className="mt-0.5 text-[12px] leading-snug text-foreground/80">{el.detail.note[locale]}</p>}
    </li>
  );
}

function Chevron() {
  return (
    <span aria-hidden className="ml-auto shrink-0 text-xs text-muted-foreground transition-transform group-open:rotate-90">
      ▸
    </span>
  );
}

/** Text version of the map, for small screens and screen readers. */
export function ListView({ locale }: { locale: Locale }) {
  const isJa = locale === "ja";
  return (
    <div className="space-y-2 p-3 text-left sm:p-4">
      {LIST_ORDER.map((id) => {
        const el = ELEMENTS.get(id)!;
        const color = categoryColor(el.category);
        return (
          <details key={id} className="group rounded-lg border bg-background" style={{ borderColor: tint(color, 50) }}>
            <summary className="cursor-pointer list-none px-3 py-2 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                {el.label[locale]}
                {el.sublabel && <span className="font-normal text-muted-foreground">— {el.sublabel[locale]}</span>}
                <Chevron />
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">{el.detail.summary[locale]}</span>
            </summary>
            <div className="border-t border-border px-3 pb-2">
              {el.kind === "node" ? (
                el.detail.note && <p className="py-2 text-[12px] leading-snug text-foreground/80">{el.detail.note[locale]}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {el.children.map((childId) => {
                    const child = ELEMENTS.get(childId)!;
                    if (child.kind !== "sub") return <ListEntry key={childId} id={childId} locale={locale} />;
                    return (
                      <li key={childId} className="py-2">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{child.label[locale]}</p>
                        <ul className="ml-3 divide-y divide-border">
                          {child.children.map((itemId) => (
                            <ListEntry key={itemId} id={itemId} locale={locale} />
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </details>
        );
      })}

      <details className="group rounded-lg border bg-background" style={{ borderColor: tint(EFFICIENCY_COLOR, 50) }}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          {isJa ? "効率（矢印のラベル）" : "Efficiencies (arrow labels)"}
          <Chevron />
        </summary>
        <ul className="divide-y divide-border border-t border-border px-3 pb-2">
          {EDGES.filter((e) => e.kind === "flow" && e.label && e.detail).map((e) => (
            <li key={e.id} className="py-1.5">
              <p className="text-[13px] font-semibold text-foreground">
                {e.label![locale]}
                {isJa ? "" : " "}
                <span className="font-normal text-muted-foreground">{isJa ? `（${edgeEnds(e.id, locale)}）` : `(${edgeEnds(e.id, locale)})`}</span>
              </p>
              <p className="text-[12px] leading-snug text-muted-foreground">{e.detail!.summary[locale]}</p>
              {e.detail!.note && <p className="mt-0.5 text-[12px] leading-snug text-foreground/80">{e.detail!.note[locale]}</p>}
            </li>
          ))}
        </ul>
      </details>

      <details className="group rounded-lg border bg-background" style={{ borderColor: tint(LOOP_COLOR, 50) }}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
          {isJa ? "成果が戻るループ" : "Feedback loops"}
          <Chevron />
        </summary>
        <ul className="divide-y divide-border border-t border-border px-3 pb-2">
          {LOOPS.map((l) => (
            <li key={l.id} className="py-1.5">
              <p className="text-[13px] font-semibold text-foreground">↺ {l.label[locale]}</p>
              <p className="text-[12px] leading-snug text-muted-foreground">{l.detail.summary[locale]}</p>
              {l.detail.note && <p className="mt-0.5 text-[12px] leading-snug text-foreground/80">{l.detail.note[locale]}</p>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
