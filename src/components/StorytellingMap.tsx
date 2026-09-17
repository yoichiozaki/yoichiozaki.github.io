"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  parseTitle,
  buildSegmentPaths,
  unwrapSegPaths,
  fullGuidePath,
  buildCumulativePath,
  pathEndIndex,
  getStoryScrollState,
  interpolateCoordsOnPath,
  interpolateZoomSmooth,
  type CumulativePath,
} from "@/lib/storytelling-map-utils";

export type StoryStop = {
  id: string;
  title: string;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  zoom?: number;
  images?: string[];
  /** How to draw the path TO this stop from the previous one */
  pathType?: "flight" | "drive" | "walk";
};

// ── Scroll-driven image slideshow ────────────────────────────

function ImageSlideshow({
  images,
  alt,
  index,
  visible,
}: {
  images: string[];
  alt: string;
  index: number;
  visible: boolean;
}) {
  if (images.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="relative aspect-square max-h-[55svh] overflow-hidden rounded-lg bg-muted">
        {visible && images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${alt} - ${i + 1}`}
            aria-hidden={i !== index}
            className="absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ease-in-out motion-reduce:transition-none"
            style={{ opacity: i === index ? 1 : 0 }}
            loading={i === index ? "eager" : "lazy"}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="flex h-2 items-center justify-center gap-1.5 mt-2.5" aria-hidden="true">
          {images.map((src, i) => (
            <div
              key={src}
              className="rounded-full bg-foreground transition-all duration-300 motion-reduce:transition-none"
              style={{
                width: i === index ? 8 : 6,
                height: i === index ? 8 : 6,
                opacity: i === index ? 0.6 : 0.2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  stops: StoryStop[];
  tileUrl?: string;
  tileAttribution?: string;
  pathColor?: string;
};

const DEFAULT_TILE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const TILE_SUBDOMAINS = ["a", "b", "c", "d"];

// ── Tile pre-caching ─────────────────────────────────────────

/** Convert lat/lng + integer zoom to tile x,y coordinates */
function latlngToTile(
  lat: number,
  lng: number,
  z: number
): { x: number; y: number } {
  const n = 1 << z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      n
  );
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

/** Build a concrete tile URL from the template */
function tileUrl(template: string, z: number, x: number, y: number): string {
  const s = TILE_SUBDOMAINS[(x + y) % TILE_SUBDOMAINS.length];
  return template
    .replace("{s}", s)
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y))
    .replace("{r}", L.Browser.retina ? "@2x" : "");
}

/**
 * Pre-fetch tiles along the entire scroll path into the browser HTTP cache.
 *
 * Uses requestIdleCallback (with setTimeout fallback) to avoid competing
 * with the main-thread animation loop and initial render.
 */
function precacheTiles(
  template: string,
  stops: StoryStop[],
  segPaths: [number, number][][],
  numKeyframes = 30,
  gridRadius = 3,
  batchSize = 6,
): (() => void) {
  const queued = new Set<string>();
  const urls: string[] = [];

  function collectTiles(
    lat: number, lng: number, z: number, radius: number
  ) {
    if (z < 1 || z > 18) return;
    const { x: cx, y: cy } = latlngToTile(lat, lng, z);
    const maxTile = (1 << z) - 1;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tx = cx + dx;
        const ty = cy + dy;
        if (tx < 0 || tx > maxTile || ty < 0 || ty > maxTile) continue;
        const key = `${z}/${tx}/${ty}`;
        if (queued.has(key)) continue;
        queued.add(key);
        urls.push(tileUrl(template, z, tx, ty));
      }
    }
  }

  // Priority 1: stop destination tiles (loaded first in the queue)
  for (const stop of stops) {
    const z = stop.zoom ?? 12;
    collectTiles(stop.coordinates[0], stop.coordinates[1], z, gridRadius);
  }

  // Priority 2: intermediate path keyframes
  for (let k = 0; k <= numKeyframes; k++) {
    const p = k / numKeyframes;
    const center = interpolateCoordsOnPath(segPaths, stops, p);
    const rawZoom = interpolateZoomSmooth(stops, p);
    const zoomLevels = [Math.floor(rawZoom), Math.ceil(rawZoom)];
    for (const z of zoomLevels) {
      collectTiles(center[0], center[1], z, gridRadius);
    }
  }

  let cancelled = false;
  let idx = 0;
  const rIC = typeof requestIdleCallback === "function"
    ? requestIdleCallback
    : (cb: () => void) => setTimeout(cb, 200);
  const cIC = typeof cancelIdleCallback === "function"
    ? cancelIdleCallback
    : clearTimeout;
  let handle: number | ReturnType<typeof setTimeout> = 0;

  function loadBatch(deadline?: IdleDeadline) {
    if (cancelled || idx >= urls.length) return;
    // Load tiles while we have idle time (or up to batchSize)
    let count = 0;
    while (idx < urls.length && count < batchSize) {
      if (deadline && deadline.timeRemaining() < 2) break;
      const img = new Image();
      img.src = urls[idx++];
      count++;
    }
    if (idx < urls.length) handle = rIC(loadBatch);
  }

  // Start after initial render settles
  const startTimer = setTimeout(() => { handle = rIC(loadBatch); }, 500);

  return () => {
    cancelled = true;
    clearTimeout(startTimer);
    cIC(handle as number);
  };
}

export function StorytellingMap({
  stops,
  tileUrl: tileUrl_ = DEFAULT_TILE,
  tileAttribution = DEFAULT_ATTRIBUTION,
  pathColor = "#0ea5e9",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const segPathsRef = useRef<[number, number][][]>([]);
  const cumPathRef = useRef<CumulativePath | null>(null);
  const targetPRef = useRef(0);
  const currentPRef = useRef(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const wrapperRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const requestTileUpdateRef = useRef<(() => void) | null>(null);
  // Scroll-dirty flag: set true on scroll, consumed in rAF tick
  const scrollDirtyRef = useRef(true);
  // Previous frame values for skipping redundant updates
  const prevCenterRef = useRef<[number, number]>([0, 0]);
  const prevZoomRef = useRef(0);
  const prevEndIdxRef = useRef(-1);
  const [activeStep, setActiveStep] = useState({ index: 0, imageIndex: 0 });
  const activeStepRef = useRef(activeStep);
  const { index: activeIndex, imageIndex } = activeStep;

  // Pre-compute curved segment paths (globally unwrapped for antimeridian)
  if (segPathsRef.current.length === 0 && stops.length > 1) {
    segPathsRef.current = unwrapSegPaths(buildSegmentPaths(stops));
    cumPathRef.current = buildCumulativePath(segPathsRef.current);
  }

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || stops.length === 0) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      zoomSnap: 0,
      zoomAnimation: false,
    });

    const tileLayer = L.tileLayer(tileUrl_, {
      attribution: tileAttribution,
      maxZoom: 19,
      keepBuffer: 10,
    }).addTo(map);

    // Animate transforms every frame, but refresh tiles at most every 100ms.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tl = tileLayer as any;
    const origSetView = tl._setView.bind(tl);
    const origAbortLoading = tl._abortLoading.bind(tl);

    // Track the zoom of the last successful tile load
    let lastLoadedZoom = stops[0]?.zoom ?? 5;
    let tileLoadTimer: ReturnType<typeof setTimeout> | null = null;

    // 1. _setView → pure CSS transforms. No tile loading.
    //    This runs ~60fps from map.setView() in the animation loop.
    tl._setView = function (center: L.LatLng, zoom: number) {
      if (this._setZoomTransforms) {
        this._setZoomTransforms(center, zoom);
      }
    };

    // 2. _invalidateAll → no-op from events. We call it manually.
    const origInvalidateAll = tl._invalidateAll.bind(tl);
    tl._invalidateAll = function () {};

    // 3. _abortLoading → no-op from Leaflet events that fire every frame.
    //    We call origAbortLoading manually before big zoom jumps.
    tl._abortLoading = function () {};

    // 4. _onMoveEnd → no-op. We handle tile loading ourselves.
    tl._onMoveEnd = function () {};

    // 5. _pruneTiles → remove tiles >2 zoom levels from target.
    tl._pruneTiles = function () {
      if (!this._map) return;
      const targetZoom = Math.round(lastLoadedZoom);
      for (const key in this._tiles) {
        const tile = this._tiles[key];
        if (tile && tile.coords && Math.abs(tile.coords.z - targetZoom) > 2) {
          this._removeTile(key);
        }
      }
    };

    function loadTilesForView() {
      if (!tl._map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();

      const zoomJump = Math.abs(zoom - lastLoadedZoom);

      if (zoomJump > 2) {
        // Big zoom jump: abort in-flight tiles (they're for the wrong zoom)
        // and invalidate the tile grid so it rebuilds at the new zoom.
        origAbortLoading();
        origInvalidateAll();
      }

      lastLoadedZoom = zoom;

      // GridLayer rejects tile loads more than one zoom level from map.getZoom().
      // Read the actual camera when the timer fires, not its future scroll target.
      origSetView(center, zoom, false, false);
    }

    requestTileUpdateRef.current = () => {
      if (tileLoadTimer) return;
      tileLoadTimer = setTimeout(() => {
        tileLoadTimer = null;
        loadTilesForView();
      }, 100);
    };

    if (stops.length > 0) {
      // For the initial load, call the ORIGINAL _setView so tiles actually
      // load on first render.
      map.setView(stops[0].coordinates, stops[0].zoom ?? 5);
      // Force-run origSetView to ensure initial tiles load immediately
      origSetView(
        L.latLng(stops[0].coordinates),
        stops[0].zoom ?? 5,
        false,
        false,
      );
    }

    // Faint guide path (curved)
    const guide = fullGuidePath(segPathsRef.current);
    L.polyline(guide, {
      color: pathColor,
      weight: 2,
      opacity: 0.1,
      dashArray: "4 8",
    }).addTo(map);

    // Active polyline
    polylineRef.current = L.polyline([], {
      color: pathColor,
      weight: 3,
      opacity: 0.8,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Current position marker
    markerRef.current = L.circleMarker(stops[0].coordinates, {
      radius: 6,
      color: "#fff",
      fillColor: pathColor,
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);

    // Stop markers
    stops.forEach((stop) => {
      L.circleMarker(stop.coordinates, {
        radius: 3,
        color: "#fff",
        fillColor: "#94a3b8",
        fillOpacity: 0.5,
        weight: 1,
      }).addTo(map);
    });

    mapRef.current = map;
    scrollDirtyRef.current = true;

    // Pre-cache tiles along the entire scroll path
    const cancelPrecache = precacheTiles(
      tileUrl_,
      stops,
      segPathsRef.current
    );

    return () => {
      cancelPrecache();
      if (tileLoadTimer) clearTimeout(tileLoadTimer);
      requestTileUpdateRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One scroll timeline drives the camera, active card, and slideshow.
  // Clean up before React detaches the DOM refs during navigation.
  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || stops.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let running = true;
    let viewportHeight = window.innerHeight;
    let readingTop = 0;
    let snapToTarget = true;
    let lastTime = performance.now();
    let renderedP = -1;

    const onScroll = () => { scrollDirtyRef.current = true; };

    const updateLayout = () => {
      viewportHeight = window.innerHeight;
      readingTop = Number.parseFloat(window.getComputedStyle(scrollEl).scrollMarginTop);
      for (const card of cardRefsRef.current) {
        if (!card) continue;
        // Tall cards scroll their text before pinning the photo at the bottom.
        const top = Math.min(readingTop, viewportHeight - card.offsetHeight - 16);
        card.style.setProperty("--story-card-top", `${top}px`);
      }
      mapRef.current?.invalidateSize({ pan: false });
      snapToTarget = true;
      scrollDirtyRef.current = true;
    };

    const readScrollPosition = () => {
      const layouts = wrapperRefsRef.current.flatMap(wrapper => (
        wrapper ? [wrapper.getBoundingClientRect()] : []
      ));
      const state = getStoryScrollState(stops, layouts, readingTop, viewportHeight);
      targetPRef.current = reducedMotion.matches
        ? state.activeIndex / Math.max(1, stops.length - 1)
        : state.mapProgress;

      const previousStep = activeStepRef.current;
      if (previousStep.index !== state.activeIndex || previousStep.imageIndex !== state.imageIndex) {
        const nextStep = { index: state.activeIndex, imageIndex: state.imageIndex };
        activeStepRef.current = nextStep;
        setActiveStep(nextStep);
      }
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${state.progress * 100}%`;
      }
    };

    const tick = (time: number) => {
      if (!running) return;
      const elapsed = Math.max(0, time - lastTime);
      lastTime = time;

      if (scrollDirtyRef.current) {
        scrollDirtyRef.current = false;
        readScrollPosition();
      }

      const map = mapRef.current;
      if (map) {
        const prev = currentPRef.current;
        const target = targetPRef.current;
        const diff = target - prev;
        const skipAnimation = snapToTarget || reducedMotion.matches || Math.abs(diff) * (stops.length - 1) > 1;
        const p = skipAnimation || Math.abs(diff) < 0.00001
          ? target
          : prev + diff * (1 - Math.exp(-elapsed / 70));
        currentPRef.current = p;

        if (p !== renderedP || snapToTarget) {
          renderedP = p;
          const sp = segPathsRef.current;
          const cumPath = cumPathRef.current;
          const center = interpolateCoordsOnPath(sp, stops, p);
          const zoom = interpolateZoomSmooth(stops, p);

          const dLat = Math.abs(center[0] - prevCenterRef.current[0]);
          const dLng = Math.abs(center[1] - prevCenterRef.current[1]);
          const dZoom = Math.abs(zoom - prevZoomRef.current);
          if (snapToTarget || dLat > 0.00001 || dLng > 0.00001 || dZoom > 0.001) {
            map.setView(center, zoom, { animate: false });
            requestTileUpdateRef.current?.();
            prevCenterRef.current = center;
            prevZoomRef.current = zoom;
          }

          if (cumPath) {
            const { endIndex, tip } = pathEndIndex(cumPath, sp, stops, p);
            if (endIndex !== prevEndIdxRef.current || tip) {
              prevEndIdxRef.current = endIndex;
              const pts = cumPath.points.slice(0, endIndex);
              if (tip) pts.push(tip);
              polylineRef.current?.setLatLngs(pts);
              const markerPos = tip ?? pts[pts.length - 1] ?? stops[0].coordinates;
              markerRef.current?.setLatLng(markerPos);
            }
          }
        }
        snapToTarget = false;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateLayout);
    reducedMotion.addEventListener("change", updateLayout);
    const resizeObserver = new ResizeObserver(updateLayout);
    resizeObserver.observe(scrollEl);
    if (mapContainerRef.current) resizeObserver.observe(mapContainerRef.current);
    for (const card of cardRefsRef.current) {
      if (card) resizeObserver.observe(card);
    }
    updateLayout();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateLayout);
      reducedMotion.removeEventListener("change", updateLayout);
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [stops]);

  return (
    <div
      className="storytelling-map not-prose relative [--story-map-height:28svh] [--story-reading-top:calc(4rem+var(--story-map-height))] lg:[--story-reading-top:4rem]"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]">
        <div
          ref={progressBarRef}
          className="h-full"
          style={{ width: '0%', backgroundColor: pathColor }}
        />
      </div>

      {/* Single map container — sticky on mobile, absolute-positioned on desktop */}
      <div
        className="sticky top-16 h-[var(--story-map-height)] z-20
                   lg:absolute lg:right-0 lg:top-0 lg:w-[55%] xl:w-[58%] lg:h-full lg:z-0"
      >
        <div className="h-full lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)]">
          <div ref={mapContainerRef} className="h-full w-full" style={{ willChange: 'transform' }} />
          {/* Soft edge between content and map (desktop) */}
          <div
            className="hidden lg:block absolute inset-y-0 left-0 w-16 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, var(--background), transparent)",
            }}
          />
          {/* Bottom fade (mobile) */}
          <div
            className="lg:hidden absolute inset-x-0 bottom-0 h-8 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, var(--background), transparent)",
            }}
          />
          {/* Chapter dots (desktop) */}
          <div className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 flex-col gap-2">
            {stops.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-500 motion-reduce:transition-none"
                style={{
                  width: i === activeIndex ? 7 : 4,
                  height: i === activeIndex ? 7 : 4,
                  backgroundColor:
                    i <= activeIndex ? pathColor : "rgba(148,163,184,0.4)",
                  opacity: i === activeIndex ? 1 : i < activeIndex ? 0.5 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling content — full width on mobile, left column on desktop */}
      <div
        ref={scrollRef}
        className="relative scroll-mt-[var(--story-reading-top)] lg:z-10 lg:w-[45%] xl:w-[42%] lg:bg-[var(--background)]"
      >
        {stops.map((stop, i) => {
          const { icon, place, subtitle } = parseTitle(stop.title);
          const imgCount = stop.images?.length ?? 0;
          const extraVh = Math.max(0, imgCount - 1) * 50;
          const isActive = i === activeIndex;
          const showImages = Math.abs(i - activeIndex) <= 1;

          return (
            <div
              key={stop.id}
              ref={el => { wrapperRefsRef.current[i] = el; }}
              data-stop-wrapper={stop.id}
              className="min-h-[100svh]"
              style={{ minHeight: `calc(100svh + ${extraVh}svh)` }}
            >
              <div
                ref={el => { cardRefsRef.current[i] = el; }}
                aria-current={isActive ? "step" : undefined}
                className="sticky top-[var(--story-card-top,var(--story-reading-top))] w-full px-5 sm:px-8 lg:px-10 xl:px-14 py-8 transition-opacity duration-300 ease-out motion-reduce:transition-none"
                style={{ opacity: isActive ? 1 : i < activeIndex ? 0.25 : 0.15 }}
              >
                {/* Text content */}
                <div>
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-px transition-all duration-500"
                    style={{
                      width: isActive ? 32 : 16,
                      backgroundColor: isActive
                        ? pathColor
                        : "var(--muted-foreground)",
                      opacity: isActive ? 0.7 : 0.2,
                    }}
                  />
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-500"
                    style={{
                      color: isActive
                        ? pathColor
                        : "var(--muted-foreground)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(stops.length).padStart(2, "0")}
                  </span>
                </div>

                {/* Icon */}
                {icon && (
                  <span className="text-3xl lg:text-4xl block mb-2">
                    {icon}
                  </span>
                )}

                {/* Place name */}
                <h3 className="text-2xl lg:text-[28px] font-extrabold tracking-tight leading-tight text-foreground mb-1">
                  {place}
                </h3>

                {/* Subtitle */}
                {subtitle && (
                  <p
                    className="text-sm font-medium tracking-wide mb-4 transition-colors duration-500"
                    style={{
                      color: isActive
                        ? pathColor
                        : "var(--muted-foreground)",
                    }}
                  >
                    {subtitle}
                  </p>
                )}

                {/* Description */}
                <p className="text-sm lg:text-[15px] leading-[1.85] text-foreground/75">
                  {stop.description}
                </p>
                </div>

                {stop.images && stop.images.length > 0 && (
                  <ImageSlideshow
                    images={stop.images}
                    alt={place}
                    index={i < activeIndex ? imgCount - 1 : isActive ? imageIndex : 0}
                    visible={showImages}
                  />
                )}
              </div>
            </div>
          );
        })}
        <div className="h-[40vh]" />
      </div>

      <style>{`
        .leaflet-container {
          background: var(--background, #fff) !important;
        }
        .leaflet-tile-pane {
          will-change: transform;
        }
        .dark .leaflet-tile-pane {
          filter: brightness(0.6) saturate(0.7) contrast(1.1);
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: color-mix(in srgb, var(--background) 70%, transparent) !important;
          color: var(--muted-foreground) !important;
          backdrop-filter: blur(4px);
        }
        .leaflet-control-attribution a {
          color: var(--muted-foreground) !important;
        }
        /* Keep ALL zoom-level tile containers visible so scrolling back
           never shows white gaps while new tiles load. */
        .leaflet-tile-container {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
    </div>
  );
}
