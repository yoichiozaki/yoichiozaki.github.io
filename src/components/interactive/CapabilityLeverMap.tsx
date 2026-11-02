"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  COMPANIES,
  DEFAULT_COLLAPSED,
  KEY_POINTS,
  SUB_IDS,
  ancestors,
  detailOf,
  kindOf,
  layoutMap,
  parseRef,
  relatedIds,
  resolveRef,
  type Locale,
  type MapLayout,
  type Rect,
} from "@/lib/capability-map";
import { CapabilityMapCanvas } from "./CapabilityMapCanvas";
import { CompanyStrip, DetailPanel, InfoBar, KeyPointsStrip, Legend, ListView } from "./CapabilityMapPanels";
import { usePanZoom } from "./usePanZoom";

type Props = { locale?: string };
type Mode = "map" | "companies" | "list";

/** Room the side panel takes on the right of the map: its width plus the gap around it. */
const PANEL_INSET = 424;
/** Clearance for the sticky site header when scrolling the page. */
const HEADER_OFFSET = 80;
const GLIDE = "280ms cubic-bezier(0.22, 1, 0.36, 1)";

const smoothOrInstant = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Where an id sits on the canvas; items hidden in a collapsed group fall back to the nearest visible ancestor. */
function anchorOf(layout: MapLayout, id: string): Rect | undefined {
  for (const a of [id, ...ancestors(id)]) {
    const box = layout.boxes.get(a);
    if (box) return box;
  }
  const label = layout.edges.find((e) => e.id === id) ?? layout.loops.find((l) => l.id === id);
  return label && { x: label.labelX - 60, y: label.labelY - 14, w: 120, h: 28 };
}

/** The article heading for a section number such as "4.4" (the headings carry no ids). */
function findHeading(section: string): HTMLElement | undefined {
  const headings = document.querySelectorAll<HTMLElement>("article .prose h2, article .prose h3");
  return [...headings].find((h) => {
    const text = h.textContent?.trim() ?? "";
    return text.startsWith(`${section} `) || text.startsWith(`${section}. `);
  });
}

const squash = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

/** The quoted sentence inside the section that starts at `heading`: the bold sentence itself when it is one, else its paragraph. */
function findQuote(heading: HTMLElement, quote: string): HTMLElement | undefined {
  const q = squash(quote);
  const level = Number(heading.tagName[1]);
  for (let el = heading.nextElementSibling; el; el = el.nextElementSibling) {
    if (/^H[1-6]$/.test(el.tagName) && Number(el.tagName[1]) <= level) return undefined;
    if (!squash(el.textContent).includes(q)) continue;
    const inner = [...el.querySelectorAll<HTMLElement>("strong, p, li, td")].filter((c) => squash(c.textContent).includes(q));
    return inner.find((c) => c.tagName === "STRONG") ?? inner.at(-1) ?? (el as HTMLElement);
  }
  return undefined;
}

/** The DOM range of `quote` inside `root`, which may span links and other inline elements. */
function quoteRange(root: HTMLElement, quote: string): Range | undefined {
  const nodes: Text[] = [];
  const starts: number[] = [];
  let text = "";
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    starts.push(text.length);
    nodes.push(n);
    text += n.data;
  }
  const pattern = squash(quote)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/ /g, "\\s+");
  const match = new RegExp(pattern).exec(text);
  if (!match) return undefined;
  const locate = (offset: number, isEnd: boolean): [Text, number] => {
    let i = nodes.length - 1;
    while (i > 0 && (isEnd ? starts[i] >= offset : starts[i] > offset)) i--;
    return [nodes[i], offset - starts[i]];
  };
  const range = document.createRange();
  range.setStart(...locate(match.index, false));
  range.setEnd(...locate(match.index + match[0].length, true));
  return range;
}

const HIGHLIGHT = "capability-map-quote";
// Kept out of globals.css because the CSS optimizer does not know ::highlight() yet.
const HIGHLIGHT_CSS = `::highlight(${HIGHLIGHT}){background-color:rgb(204 120 92/.28)}.dark ::highlight(${HIGHLIGHT}){background-color:rgb(224 144 111/.32)}`;
const canHighlight = () => typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";
const clearHighlight = () => {
  if (canHighlight()) CSS.highlights.delete(HIGHLIGHT);
};

const NARROW_QUERY = "(max-width: 639px)";
const subscribeNarrow = (onChange: () => void) => {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const getNarrow = () => window.matchMedia(NARROW_QUERY).matches;

/** Wider than the prose column, centred on the page, never wider than the window. */
const BREAKOUT: CSSProperties = {
  width: "min(1240px, calc(100vw - 2rem))",
  marginLeft: "calc(50% - min(620px, calc(50vw - 1rem)))",
};

function ToolButton({ pressed, onClick, label, children }: { pressed?: boolean; onClick: () => void; label?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
        pressed ? "border-accent bg-muted text-foreground" : "border-border text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function CapabilityLeverMap({ locale = "ja" }: Props) {
  const loc: Locale = locale === "en" ? "en" : "ja";
  const isJa = loc === "ja";
  const narrow = useSyncExternalStore(subscribeNarrow, getNarrow, () => false);
  const [modeChoice, setModeChoice] = useState<Mode | null>(null);
  const mode: Mode = modeChoice ?? (narrow ? "list" : "map");
  const [fullscreen, setFullscreen] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set(DEFAULT_COLLAPSED));
  const [selected, setSelected] = useState<string | null>(null);
  // What the side panel shows. While it is open, selecting anything else on the map shows that instead.
  const [panelId, setPanelId] = useState<string | null>(null);
  const [showReturn, setShowReturn] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  // The control that sent the reader into the article, so "back to the map" can return focus to it.
  const jumpedFromRef = useRef<HTMLElement | null>(null);

  const layout = useMemo(() => layoutMap(collapsed), [collapsed]);
  const related = useMemo(() => (selected ? relatedIds(selected) : null), [selected]);
  const { viewportRef, viewport, view, dragging, gliding, endGlide, ensureVisible, fit, zoomIn, zoomOut, handlers } = usePanZoom({
    width: layout.width,
    height: layout.height,
    wheelZoom: fullscreen,
  });

  const allCollapsed = SUB_IDS.every((id) => collapsed.has(id));
  const selectedKind = selected ? kindOf(selected) : undefined;
  const showInfo = selected !== null && panelId === null && (selectedKind === "element" || selectedKind === "edge" || selectedKind === "loop");

  const select = useCallback(
    (id: string) => {
      if (panelId === null) {
        setSelected((cur) => (cur === id ? null : id));
        return;
      }
      setSelected(id);
      if (detailOf(id)) setPanelId(id);
    },
    [panelId],
  );
  const open = useCallback(
    (id: string) => {
      setSelected(id);
      if (!detailOf(id)) return;
      setPanelId(id);
      const rect = anchorOf(layout, id);
      if (rect) ensureVisible(rect, PANEL_INSET);
    },
    [layout, ensureVisible],
  );
  const clear = useCallback(() => {
    setSelected(null);
    setPanelId(null);
  }, []);
  const closePanel = useCallback(() => {
    setPanelId(null);
    viewport?.focus({ preventScroll: true });
  }, [viewport]);
  /** Choosing a key point or a company replaces the selection and closes the panel. */
  const pick = useCallback((id: string) => {
    setSelected(id);
    setPanelId(null);
  }, []);
  const toggle = useCallback(
    (id: string) =>
      setCollapsed((cur) => {
        const next = new Set(cur);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );

  const changeMode = (m: Mode) => {
    setModeChoice(m);
    setSelected(m === "companies" ? COMPANIES[0].id : null);
    setPanelId(null);
  };

  const toggleKeyPoints = () => {
    if (showKeyPoints) {
      if (selectedKind === "keypoint") setSelected(mode === "companies" ? COMPANIES[0].id : null);
    } else {
      pick(KEY_POINTS[0].id);
    }
    setShowKeyPoints(!showKeyPoints);
  };

  /**
   * Scroll the article to the passage a ref quotes and highlight it, leaving the map (and its panel)
   * as it is so the reader can come back. Falls back to the section heading.
   */
  const jumpTo = useCallback(
    (ref: string) => {
      const resolved = resolveRef(ref);
      const heading = findHeading(resolved?.section ?? parseRef(ref).section);
      if (!heading) return;
      const target = (resolved && findQuote(heading, resolved.quote[loc])) ?? heading;
      const range = resolved && target !== heading ? quoteRange(target, resolved.quote[loc]) : undefined;
      if (document.activeElement instanceof HTMLElement && figureRef.current?.contains(document.activeElement)) {
        jumpedFromRef.current = document.activeElement;
      }
      const go = () => {
        // Leave some of the preceding text in view when landing mid-section.
        const offset = target === heading ? HEADER_OFFSET : Math.max(HEADER_OFFSET + 24, window.innerHeight * 0.3);
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: smoothOrInstant() });
        // Mark the quoted sentence until the reader goes back to the map; flash the block where that is unsupported.
        if (range && canHighlight()) {
          CSS.highlights.set(HIGHLIGHT, new Highlight(range));
        } else {
          clearHighlight();
          target.animate([{ backgroundColor: "rgba(204, 120, 92, 0.35)" }, { backgroundColor: "rgba(204, 120, 92, 0)" }], {
            duration: 2400,
            delay: 300,
            easing: "ease-out",
          });
        }
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        setShowReturn(true);
      };
      if (fullscreen) {
        setFullscreen(false);
        // Wait for the page to get its scrollbar back before measuring.
        requestAnimationFrame(() => requestAnimationFrame(go));
      } else {
        go();
      }
    },
    [fullscreen, loc],
  );

  const backToMap = () => {
    setShowReturn(false);
    clearHighlight();
    const fig = figureRef.current;
    if (!fig) return;
    window.scrollTo({ top: fig.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: smoothOrInstant() });
    const from = jumpedFromRef.current;
    (from?.isConnected ? from : viewport)?.focus({ preventScroll: true });
  };

  useEffect(() => clearHighlight, []);

  // The "back to the map" button (and the highlight) go away once the reader scrolls back to the map by themselves.
  useEffect(() => {
    const fig = figureRef.current;
    if (!showReturn || !fig) return;
    let left = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio === 0) left = true;
        else if (left && entry.intersectionRatio >= 0.3) {
          setShowReturn(false);
          clearHighlight();
        }
      },
      { threshold: [0, 0.3] },
    );
    io.observe(fig);
    return () => io.disconnect();
  }, [showReturn]);

  // Esc closes the panel first, then clears the selection, then leaves full screen.
  useEffect(() => {
    if (!fullscreen && !selected && !panelId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelId) closePanel();
      else if (selected) setSelected(null);
      else setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, selected, panelId, closePanel]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  const title = isJa ? "AI の能力を伸ばすレバーの地図" : "Map: the levers on AI capability";
  const hint =
    mode === "list"
      ? isJa
        ? "項目を開くと、説明と出典、本文の該当箇所が表示される。"
        : "Open an entry to read about it, with its sources and the sections of the article that discuss it."
      : fullscreen
        ? isJa
          ? "クリックで関係を強調し、ダブルクリックで説明と出典を開く。ドラッグで移動、ホイールで拡大・縮小。Esc で戻る。"
          : "Click to highlight connections; double-click to open the explanation and sources. Drag to pan, scroll to zoom, Esc to exit."
        : isJa
          ? "クリックで関係を強調し、ダブルクリックで説明と出典を開く。ドラッグで移動、Ctrl（⌘）+ ホイールかピンチで拡大・縮小。"
          : "Click to highlight connections; double-click to open the explanation and sources. Drag to pan; Ctrl (⌘) + scroll or pinch to zoom.";
  const modes: [Mode, string][] = [
    ["map", isJa ? "マップ" : "Map"],
    ["companies", isJa ? "各社" : "Companies"],
    ["list", isJa ? "一覧" : "List"],
  ];
  const gridSize = 24 * view.k;

  return (
    <figure ref={figureRef} className="not-prose my-10" style={fullscreen ? undefined : BREAKOUT} aria-label={title}>
      <div
        className={
          fullscreen
            ? "fixed inset-0 z-[60] flex flex-col bg-background"
            : "flex flex-col overflow-hidden rounded-xl border border-border bg-background"
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-3 py-2 sm:px-4">
          <div className="min-w-0 flex-1 basis-64">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {mode !== "list" && (
              <>
                <ToolButton pressed={showKeyPoints} onClick={toggleKeyPoints}>
                  {isJa ? "要点" : "Key points"}
                </ToolButton>
                <ToolButton onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(SUB_IDS))}>
                  {allCollapsed ? (isJa ? "すべて展開" : "Expand all") : isJa ? "すべて折りたたむ" : "Collapse all"}
                </ToolButton>
              </>
            )}
            <div role="group" aria-label={isJa ? "表示" : "View"} className="flex rounded-md border border-border p-0.5">
              {modes.map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => changeMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode !== "list" && (
              <div className="flex items-center overflow-hidden rounded-md border border-border text-xs">
                <button type="button" onClick={zoomOut} aria-label={isJa ? "縮小" : "Zoom out"} className="px-2 py-1 text-foreground hover:bg-muted">
                  −
                </button>
                <button type="button" onClick={fit} className="border-x border-border px-2 py-1 text-foreground hover:bg-muted">
                  {isJa ? "全体" : "Fit"}
                </button>
                <button type="button" onClick={zoomIn} aria-label={isJa ? "拡大" : "Zoom in"} className="px-2 py-1 text-foreground hover:bg-muted">
                  +
                </button>
              </div>
            )}
            <ToolButton pressed={fullscreen} onClick={() => setFullscreen(!fullscreen)}>
              {fullscreen ? (isJa ? "全画面を閉じる" : "Exit full screen") : isJa ? "全画面" : "Full screen"}
            </ToolButton>
          </div>
        </div>

        {mode !== "list" && showKeyPoints && <KeyPointsStrip locale={loc} selected={selected} onSelect={pick} onJump={jumpTo} />}
        {mode === "companies" && <CompanyStrip locale={loc} selected={selected} onSelect={pick} onJump={jumpTo} />}

        {mode === "list" ? (
          <div className={fullscreen ? "flex-1 overflow-y-auto" : "max-h-[min(78vh,760px)] overflow-y-auto"}>
            <ListView locale={loc} onJump={jumpTo} />
          </div>
        ) : (
          <div className={`relative ${fullscreen ? "min-h-0 flex-1" : "h-[min(60vh,560px)] sm:h-[min(78vh,760px)]"}`}>
            <div
              ref={viewportRef}
              tabIndex={0}
              role="region"
              aria-label={isJa ? "マップ（矢印キーで移動、+ と − で拡大・縮小、0 で全体を表示）" : "Map (arrow keys to pan, + and − to zoom, 0 to fit)"}
              className={`absolute inset-0 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                dragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{
                touchAction: fullscreen ? "none" : "pan-y",
                backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1.2px)",
                backgroundSize: `${gridSize}px ${gridSize}px`,
                backgroundPosition: `${view.x}px ${view.y}px`,
                transition: gliding ? `background-position ${GLIDE}` : undefined,
              }}
              {...handlers}
              onClick={clear}
            >
              <div
                className="absolute left-0 top-0 origin-top-left"
                style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`, transition: gliding ? `transform ${GLIDE}` : undefined }}
                onTransitionEnd={(e) => {
                  if (e.target === e.currentTarget) endGlide();
                }}
              >
                <CapabilityMapCanvas
                  layout={layout}
                  locale={loc}
                  related={related}
                  selected={selected}
                  onSelect={select}
                  onOpen={open}
                  onToggle={toggle}
                />
              </div>
            </div>

            {showInfo && selected && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                <div className="w-full max-w-2xl">
                  <InfoBar id={selected} locale={loc} onOpen={() => open(selected)} onClear={clear} />
                </div>
              </div>
            )}

            {panelId && (
              <div className="pointer-events-none absolute inset-3 flex items-start justify-end">
                <DetailPanel id={panelId} locale={loc} onClose={closePanel} onShow={open} onJump={jumpTo} />
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border px-3 py-2 sm:px-4">
          <Legend locale={loc} />
        </div>
      </div>
      {showReturn && !fullscreen && (
        <button
          type="button"
          onClick={backToMap}
          className="fixed bottom-5 right-5 z-[55] rounded-full border border-accent bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm hover:bg-muted"
        >
          {isJa ? "↑ 地図に戻る" : "↑ Back to the map"}
        </button>
      )}
      <style href="capability-map-highlight" precedence="default">
        {HIGHLIGHT_CSS}
      </style>
    </figure>
  );
}
