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
  LINK_KIND_LABEL,
  LOOP_BY_ID,
  LOOP_COLOR,
  LOOPS,
  detailOf,
  kindOf,
  labelOf,
  refLabel,
  resolveRef,
  type Category,
  type Detail,
  type Link,
  type Locale,
  type Text,
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
  if (kind === "edge") {
    const e = EDGE_BY_ID.get(id)!;
    if (e.kind === "measure") return isJa ? "成果の測り方" : "Measuring results";
    return e.kicker?.[locale] ?? (isJa ? "効率" : "Efficiency");
  }
  if (kind === "loop") return isJa ? "成果が戻るループ" : "Feedback loop";
  return "";
}

/** "計算量 → 計算を使う段階" for an edge, so the reader sees what it connects. */
function edgeEnds(id: string, locale: Locale): string | undefined {
  const e = EDGE_BY_ID.get(id);
  if (!e) return undefined;
  return `${labelOf(e.from)?.[locale]} → ${labelOf(e.to)?.[locale]}`;
}

/** Elements worth jumping to from a panel: a group's contents, an arrow's ends, a loop's stops. */
function relatedElements(id: string): string[] {
  const edge = EDGE_BY_ID.get(id);
  if (edge) return [edge.from, edge.to];
  const loop = LOOP_BY_ID.get(id);
  if (loop) return loop.cycle.filter((c) => kindOf(c) === "element");
  return ELEMENTS.get(id)?.children ?? [];
}

type RefGroup = { section: string; title: Text; items: { ref: string; quote: Text }[] };

/** Article refs grouped by section, so one section shows once with all its quotes. */
function groupRefs(refs: string[] | undefined): RefGroup[] {
  const out: RefGroup[] = [];
  for (const ref of refs ?? []) {
    const r = resolveRef(ref);
    if (!r) continue;
    const group = out.find((g) => g.section === r.section);
    if (!group) out.push({ section: r.section, title: r.title, items: [{ ref, quote: r.quote }] });
    else if (!group.items.some((i) => i.quote === r.quote)) group.items.push({ ref, quote: r.quote });
  }
  return out;
}

/** Quotes taken from mid-sentence start in lower case (possibly after a quotation mark); mark them as excerpts. */
const excerpt = (s: string) => (/^["“'‘]?[a-z]/.test(s) ? `…${s}` : s);

function SourceLink({ link, locale }: { link: Link; locale: Locale }) {
  const external = Boolean(link.href);
  return (
    <a
      className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
      href={external ? link.href : `/${locale}/blog/${link.slug}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link[locale]}
      {/* The no-break space keeps the arrow on the same line as the last word. */}
      {external && <span aria-hidden>{"\u00a0↗"}</span>}
    </a>
  );
}

function SourceList({ links, locale }: { links: Link[]; locale: Locale }) {
  return (
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.href ?? l.slug} className="flex gap-2 text-[13px] leading-snug">
          <span className="mt-0.5 h-fit shrink-0 rounded border border-border px-1 text-[10px] leading-4 text-muted-foreground">
            {LINK_KIND_LABEL[l.kind][locale]}
          </span>
          <span className="min-w-0 break-words">
            <SourceLink link={l} locale={locale} />
            {l.meta && <span className="mt-0.5 block text-[11px] text-muted-foreground">{l.meta[locale]}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

type JumpProps = { locale: Locale; onJump: (ref: string) => void };

function ArticleRefs({ refs, locale, onJump }: JumpProps & { refs?: string[] }) {
  const isJa = locale === "ja";
  const groups = groupRefs(refs);
  if (groups.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {groups.map((g) => (
        <li key={g.section} className="rounded-md border-l-2 border-accent bg-muted/60 px-3 py-2">
          <p className="text-[11px] leading-snug text-muted-foreground">
            <span className="font-semibold">{refLabel(g.section, locale)}</span>
            {isJa ? "　" : " · "}
            {g.title[locale]}
          </p>
          {g.items.map((it) => (
            <div key={it.ref} className="mt-1.5">
              <p className="text-[13px] leading-relaxed text-foreground">{excerpt(it.quote[locale])}</p>
              <button
                type="button"
                onClick={() => onJump(it.ref)}
                className="mt-0.5 text-xs font-medium text-accent underline-offset-2 hover:underline"
              >
                {isJa ? "本文で読む" : "Read it in the article"}
              </button>
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}

/** Small "read in the article" buttons for the strips and the list view. */
function RefButtons({ refs, locale, onJump }: JumpProps & { refs?: string[] }) {
  const isJa = locale === "ja";
  const groups = groupRefs(refs);
  if (groups.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground">{isJa ? "本文：" : "In the article:"}</span>
      {groups.map((g) => (
        <button
          key={g.section}
          type="button"
          onClick={() => onJump(g.items[0].ref)}
          title={g.title[locale]}
          className="rounded-full border border-accent/60 px-2 py-0.5 text-[11px] text-foreground hover:bg-muted"
        >
          {refLabel(g.section, locale)}
        </button>
      ))}
    </span>
  );
}

export function Legend({ locale }: { locale: Locale }) {
  const isJa = locale === "ja";
  const categories: Category[] = ["resource", "compute", "size", "stage", "material", "harness", "context", "capability", "measure"];
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
        {isJa ? "矢印のラベル" : "Arrow labels"}
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

type StripProps = JumpProps & { selected: string | null; onSelect: (id: string) => void };

export function KeyPointsStrip({ locale, selected, onSelect, onJump }: StripProps) {
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
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[12px] leading-snug text-foreground">
          {point
            ? point.body[locale]
            : isJa
              ? "番号を選ぶと、その要点に関わる部分が強調される。"
              : "Pick a point to highlight the parts of the map it concerns."}
        </p>
        {point && <RefButtons refs={point.refs} locale={locale} onJump={onJump} />}
      </div>
    </div>
  );
}

export function CompanyStrip({ locale, selected, onSelect, onJump }: StripProps) {
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
        <>
          <ul className="mt-1.5 grid gap-x-5 gap-y-1 text-[12px] leading-snug text-foreground md:grid-cols-3">
            {company.points.map((p, i) => (
              <li key={i} className="relative pl-3 before:absolute before:left-0 before:top-[0.5em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent">
                {p[locale]}
              </li>
            ))}
          </ul>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
            <RefButtons refs={company.refs} locale={locale} onJump={onJump} />
            {company.links && company.links.length > 0 && (
              <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-muted-foreground">{isJa ? "出典：" : "Sources:"}</span>
                {company.links.map((l) => (
                  <SourceLink key={l.href ?? l.slug} link={l} locale={locale} />
                ))}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">
          {isJa ? "会社を選ぶと、その会社が力を入れているレバーが強調される。" : "Pick a company to highlight the levers it leans on."}
        </p>
      )}
    </div>
  );
}

function detailCounts(detail: Detail | undefined, locale: Locale): string {
  if (!detail) return "";
  const isJa = locale === "ja";
  const sources = detail.links?.length ?? 0;
  const passages = groupRefs(detail.refs).reduce((n, g) => n + g.items.length, 0);
  const parts = [
    sources > 0 && (isJa ? `資料 ${sources} 件` : `${sources} reference${sources > 1 ? "s" : ""}`),
    passages > 0 && (isJa ? `本文 ${passages} か所` : `${passages} passage${passages > 1 ? "s" : ""} in the article`),
  ].filter(Boolean);
  return parts.join(isJa ? "・" : " · ");
}

export function InfoBar({ id, locale, onOpen, onClear }: { id: string; locale: Locale; onOpen: () => void; onClear: () => void }) {
  const isJa = locale === "ja";
  const detail = detailOf(id);
  const ends = edgeEnds(id, locale);
  const lead = kicker(id, locale);
  const counts = detailCounts(detail, locale);
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
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex gap-1.5">
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
        {counts && <span className="text-[10.5px] text-muted-foreground">{counts}</span>}
      </div>
    </div>
  );
}

type DetailPanelProps = {
  id: string;
  locale: Locale;
  onClose: () => void;
  onShow: (id: string) => void;
  onJump: (ref: string) => void;
};

/** Docked panel with the full explanation, the article's take and the sources. */
export function DetailPanel({ id, locale, onClose, onShow, onJump }: DetailPanelProps) {
  const isJa = locale === "ja";
  const closeRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const detail = detailOf(id);
  const el = ELEMENTS.get(id);
  const ends = edgeEnds(id, locale);
  const lead = kicker(id, locale);
  const related = relatedElements(id);
  const titleId = `capability-map-panel-${id}`;

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [id]);

  if (!detail) return null;
  const sectionHeading = "mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  return (
    <aside
      aria-labelledby={titleId}
      className="pointer-events-auto flex max-h-full w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-background/[0.97] shadow-2xl backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          {(lead || ends) && (
            <p className="text-[11px] text-muted-foreground">
              {lead}
              {ends && <span className={lead ? "ml-2" : undefined}>{ends}</span>}
            </p>
          )}
          <h4 ref={headingRef} id={titleId} tabIndex={-1} className="text-base font-bold leading-snug text-foreground outline-none">
            {labelOf(id)?.[locale]}
          </h4>
          {el?.sublabel && <p className="text-xs text-muted-foreground">{el.sublabel[locale]}</p>}
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={isJa ? "説明を閉じる" : "Close details"}
          className="rounded-md border border-border px-2 py-0.5 text-sm text-muted-foreground hover:bg-muted"
        >
          ×
        </button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-3">
        <p className="text-sm leading-relaxed text-foreground">{detail.summary[locale]}</p>
        {detail.note && <p className="mt-3 rounded-md bg-muted px-3 py-2 text-[13px] leading-relaxed text-foreground">{detail.note[locale]}</p>}

        {detail.refs && detail.refs.length > 0 && (
          <>
            <h5 className={sectionHeading}>{isJa ? "本文の該当箇所" : "In the article"}</h5>
            <ArticleRefs refs={detail.refs} locale={locale} onJump={onJump} />
          </>
        )}

        {detail.links && detail.links.length > 0 && (
          <>
            <h5 className={sectionHeading}>{isJa ? "出典・関連資料" : "Sources and further reading"}</h5>
            <SourceList links={detail.links} locale={locale} />
          </>
        )}

        {related.length > 0 && (
          <>
            <h5 className={sectionHeading}>
              {EDGE_BY_ID.has(id)
                ? isJa
                  ? "矢印の両端"
                  : "Connects"
                : LOOP_BY_ID.has(id)
                  ? isJa
                    ? "ループが通る項目"
                    : "Passes through"
                  : isJa
                    ? "含まれる項目"
                    : "Contains"}
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {related.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    onShow(r);
                    // The chip disappears with the old content; keep focus in the panel, on the new title.
                    headingRef.current?.focus({ preventScroll: true });
                  }}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground hover:bg-muted"
                >
                  {labelOf(r)?.[locale]}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 border-t border-border pt-2 text-[11px] leading-snug text-muted-foreground">
          {isJa
            ? "開いたまま地図の別の項目を選ぶと、説明が切り替わる。Esc で閉じる。"
            : "Select another part of the map to switch the explanation. Esc closes the panel."}
        </p>
      </div>
    </aside>
  );
}

const LIST_ORDER = ["resources", "compute", "size", "stages", "materials", "model", "harness", "context-layer", "system", "uses", "measures"];

function Extras({ detail, locale, onJump }: JumpProps & { detail: Detail }) {
  const isJa = locale === "ja";
  const hasLinks = detail.links && detail.links.length > 0;
  if (!hasLinks && !detail.refs?.length) return null;
  return (
    <div className="mt-1 space-y-1 text-[11px]">
      <RefButtons refs={detail.refs} locale={locale} onJump={onJump} />
      {hasLinks && (
        <p className="leading-relaxed">
          <span className="text-muted-foreground">{isJa ? "出典：" : "Sources: "}</span>
          {detail.links!.map((l, i) => (
            <span key={l.href ?? l.slug}>
              {i > 0 && <span className="text-muted-foreground">{isJa ? "、" : ", "}</span>}
              <SourceLink link={l} locale={locale} />
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function ListEntry({ id, locale, onJump }: JumpProps & { id: string }) {
  const el = ELEMENTS.get(id)!;
  return (
    <li className="py-1.5">
      <p className="text-[13px] font-semibold text-foreground">{el.label[locale]}</p>
      <p className="text-[12px] leading-snug text-muted-foreground">{el.detail.summary[locale]}</p>
      {el.detail.note && <p className="mt-0.5 text-[12px] leading-snug text-foreground/80">{el.detail.note[locale]}</p>}
      <Extras detail={el.detail} locale={locale} onJump={onJump} />
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
export function ListView({ locale, onJump }: JumpProps) {
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
              {el.detail.note && <p className="pt-2 text-[12px] leading-snug text-foreground/80">{el.detail.note[locale]}</p>}
              <div className="pt-1">
                <Extras detail={el.detail} locale={locale} onJump={onJump} />
              </div>
              {el.kind !== "node" && (
                <ul className="divide-y divide-border">
                  {el.children.map((childId) => {
                    const child = ELEMENTS.get(childId)!;
                    if (child.kind !== "sub") return <ListEntry key={childId} id={childId} locale={locale} onJump={onJump} />;
                    return (
                      <li key={childId} className="py-2">
                        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{child.label[locale]}</p>
                        <Extras detail={child.detail} locale={locale} onJump={onJump} />
                        <ul className="ml-3 divide-y divide-border">
                          {child.children.map((itemId) => (
                            <ListEntry key={itemId} id={itemId} locale={locale} onJump={onJump} />
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
          {isJa ? "効率と精度（矢印のラベル）" : "Efficiency and precision (arrow labels)"}
          <Chevron />
        </summary>
        <ul className="divide-y divide-border border-t border-border px-3 pb-2">
          {EDGES.filter((e) => e.kind === "flow" && e.label && e.detail).map((e) => (
            <li key={e.id} className="py-1.5">
              <p className="text-[13px] font-semibold text-foreground">
                {e.label![locale]}
                <span className="font-normal text-muted-foreground"> — {edgeEnds(e.id, locale)}</span>
              </p>
              <p className="text-[12px] leading-snug text-muted-foreground">{e.detail!.summary[locale]}</p>
              {e.detail!.note && <p className="mt-0.5 text-[12px] leading-snug text-foreground/80">{e.detail!.note[locale]}</p>}
              <Extras detail={e.detail!} locale={locale} onJump={onJump} />
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
              <Extras detail={l.detail} locale={locale} onJump={onJump} />
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
