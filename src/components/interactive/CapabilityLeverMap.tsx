"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { COMPANIES, DEFAULT_COLLAPSED, KEY_POINTS, SUB_IDS, detailOf, kindOf, layoutMap, relatedIds, type Locale } from "@/lib/capability-map";
import { CapabilityMapCanvas } from "./CapabilityMapCanvas";
import { CompanyStrip, DetailDialog, InfoBar, KeyPointsStrip, Legend, ListView } from "./CapabilityMapPanels";
import { usePanZoom } from "./usePanZoom";

type Props = { locale?: string };
type Mode = "map" | "companies" | "list";

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
  const [detailId, setDetailId] = useState<string | null>(null);

  const layout = useMemo(() => layoutMap(collapsed), [collapsed]);
  const related = useMemo(() => (selected ? relatedIds(selected) : null), [selected]);
  const { viewportRef, view, dragging, fit, zoomIn, zoomOut, handlers } = usePanZoom({
    width: layout.width,
    height: layout.height,
    wheelZoom: fullscreen,
  });

  const allCollapsed = SUB_IDS.every((id) => collapsed.has(id));
  const selectedKind = selected ? kindOf(selected) : undefined;
  const showInfo = selected !== null && (selectedKind === "element" || selectedKind === "edge" || selectedKind === "loop");

  const select = useCallback((id: string) => setSelected((cur) => (cur === id ? null : id)), []);
  const open = useCallback((id: string) => {
    setSelected(id);
    if (detailOf(id)) setDetailId(id);
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
  };

  const toggleKeyPoints = () => {
    if (showKeyPoints) {
      if (selectedKind === "keypoint") setSelected(mode === "companies" ? COMPANIES[0].id : null);
    } else {
      setSelected(KEY_POINTS[0].id);
    }
    setShowKeyPoints(!showKeyPoints);
  };

  // Esc closes the dialog first, then clears the selection, then leaves full screen.
  useEffect(() => {
    if (!fullscreen && !selected && !detailId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (detailId) setDetailId(null);
      else if (selected) setSelected(null);
      else setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, selected, detailId]);

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
        ? "項目を開くと、説明が表示される。"
        : "Open an entry to read about it."
      : fullscreen
        ? isJa
          ? "クリックで関係を強調、ダブルクリックで詳しい説明。ドラッグで移動、ホイールで拡大・縮小。Esc で戻る。"
          : "Click to highlight connections; double-click for details. Drag to pan, scroll to zoom, Esc to exit."
        : isJa
          ? "クリックで関係を強調、ダブルクリックで詳しい説明。ドラッグで移動、Ctrl（⌘）+ ホイールかピンチで拡大・縮小。"
          : "Click to highlight connections; double-click for details. Drag to pan; Ctrl (⌘) + scroll or pinch to zoom.";
  const modes: [Mode, string][] = [
    ["map", isJa ? "マップ" : "Map"],
    ["companies", isJa ? "各社" : "Companies"],
    ["list", isJa ? "一覧" : "List"],
  ];
  const gridSize = 24 * view.k;

  return (
    <figure className="not-prose my-10" style={fullscreen ? undefined : BREAKOUT} aria-label={title}>
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

        {mode !== "list" && showKeyPoints && <KeyPointsStrip locale={loc} selected={selected} onSelect={setSelected} />}
        {mode === "companies" && <CompanyStrip locale={loc} selected={selected} onSelect={setSelected} />}

        {mode === "list" ? (
          <div className={fullscreen ? "flex-1 overflow-y-auto" : "max-h-[min(78vh,760px)] overflow-y-auto"}>
            <ListView locale={loc} />
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
              }}
              {...handlers}
              onClick={() => setSelected(null)}
            >
              <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>
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
                  <InfoBar id={selected} locale={loc} onOpen={() => setDetailId(selected)} onClear={() => setSelected(null)} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border px-3 py-2 sm:px-4">
          <Legend locale={loc} />
        </div>
      </div>
      {detailId && <DetailDialog id={detailId} locale={loc} onClose={() => setDetailId(null)} />}
    </figure>
  );
}
