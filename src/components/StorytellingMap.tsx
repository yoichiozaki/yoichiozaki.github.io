"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  lerp,
  easeInOutCubic,
  parseTitle,
  haversineKm,
  greatCircleArc,
  catmullRomSegment,
  buildSegmentPaths,
  unwrapSegPaths,
  fullGuidePath,
  buildCumulativePath,
  pathEndIndex,
  remapProgressForMap,
  interpolateCoordsOnPath,
  interpolateZoomSmooth,
  SEG_PTS,
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

function ImageSlideshow({ images, alt }: { images: string[]; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRefsRef = useRef<(HTMLImageElement | null)[]>([]);
  const dotRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastIdxRef = useRef(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const el = containerRef.current;
    if (!el) return;

    // Find the outer scroll wrapper (the div with extra height for multi-image stops)
    const wrapper = el.closest<HTMLElement>("[data-stop-wrapper]");
    if (!wrapper) return;

    const update = () => {
      const rect = wrapper.getBoundingClientRect();
      // Mobile: sync at card sticky position (top-12 = 48px). Desktop: header bottom (64px).
      const syncY = window.innerWidth >= 1024 ? 64 : 48;
      // 0 when wrapper top hits syncY, 1 when wrapper bottom hits it
      const progress = (syncY - rect.top) / rect.height;
      const clamped = Math.max(0, Math.min(0.999, progress));
      // Give the last image a full dwell slot: cycle through images in
      // the first imgCount/(imgCount+1) of the scroll, then hold the
      // last image for the remaining 1/(imgCount+1).
      const idx = Math.min(
        Math.floor(clamped * (images.length + 1)),
        images.length - 1
      );

      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx;
        imgRefsRef.current.forEach((img, i) => {
          if (img) img.style.opacity = i === idx ? "1" : "0";
        });
        dotRefsRef.current.forEach((dot, i) => {
          if (!dot) return;
          const active = i === idx;
          dot.style.width = active ? "8px" : "6px";
          dot.style.height = active ? "8px" : "6px";
          dot.style.opacity = active ? "0.6" : "0.2";
        });
      }
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [images.length]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-3">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={images[0]}
            alt={`${alt} - 1`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mt-3">
      <div className="relative overflow-hidden rounded-lg">
        {images.map((src, i) => (
          <img
            key={i}
            ref={(el) => { imgRefsRef.current[i] = el; }}
            src={src}
            alt={`${alt} - ${i + 1}`}
            className={`w-full transition-opacity duration-700 ease-in-out ${
              i === 0 ? "relative h-auto" : "absolute top-0 left-0 h-full object-cover"
            }`}
            style={{ opacity: i === 0 ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-2.5">
        {images.map((_, i) => (
          <div
            key={i}
            ref={(el) => { dotRefsRef.current[i] = el; }}
            className="rounded-full bg-foreground transition-all duration-300"
            style={{
              width: i === 0 ? 8 : 6,
              height: i === 0 ? 8 : 6,
              opacity: i === 0 ? 0.6 : 0.2,
            }}
          />
        ))}
      </div>
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
    .replace("{r}", "");
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
  const activeIndexRef = useRef(0);
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for triggering tile loads at the TARGET position (not lerped)
  const loadTilesAtTargetRef = useRef<((p: number) => void) | null>(null);
  const dotRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  // Scroll-dirty flag: set true on scroll, consumed in rAF tick
  const scrollDirtyRef = useRef(true);
  // Previous frame values for skipping redundant updates
  const prevCenterRef = useRef<[number, number]>([0, 0]);
  const prevZoomRef = useRef(0);
  const prevEndIdxRef = useRef(-1);
  // Active stop index state for lazy image loading
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, Math.min(2, stops.length - 1)]);

  // Pre-compute curved segment paths (globally unwrapped for antimeridian)
  if (segPathsRef.current.length === 0 && stops.length > 1) {
    segPathsRef.current = unwrapSegPaths(buildSegmentPaths(stops));
    cumPathRef.current = buildCumulativePath(segPathsRef.current);
  }

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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

    // ── Target-aware tile loading ─────────────────────────────
    //
    // Core idea: the animation loop (tick) drives the camera via CSS
    // transforms only. Tile loading is completely decoupled and driven
    // by the scroll TARGET — i.e. where the user is scrolling TO, not
    // where the lerped camera currently is.
    //
    // This avoids flooding the network with intermediate zoom tiles
    // during big transitions (e.g. zoom 5→15 Pacific flight).
    //
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

    // -- The single tile-load function --
    // Called from onScroll (debounced) with the TARGET progress value.
    // Computes the target center+zoom and loads tiles there.
    const sp = segPathsRef.current;
    function loadTilesAtTarget(targetP: number) {
      if (!tl._map) return;
      const center = interpolateCoordsOnPath(sp, stops, targetP);
      const rawZoom = interpolateZoomSmooth(stops, targetP);
      const nearestInt = Math.round(rawZoom);
      const zoom = Math.abs(rawZoom - nearestInt) < 0.15 ? nearestInt : rawZoom;

      const zoomJump = Math.abs(zoom - lastLoadedZoom);

      if (zoomJump > 2) {
        // Big zoom jump: abort in-flight tiles (they're for the wrong zoom)
        // and invalidate the tile grid so it rebuilds at the new zoom.
        origAbortLoading();
        origInvalidateAll();
      }

      lastLoadedZoom = zoom;

      // origSetView uses the center/zoom params directly to calculate
      // which tiles to create — it doesn't read from map._zoom.
      // We pass the TARGET center/zoom so only destination tiles load.
      origSetView(L.latLng(center), zoom, false, false);
    }

    // Expose via ref so onScroll can call it
    loadTilesAtTargetRef.current = (targetP: number) => {
      if (tileLoadTimer) clearTimeout(tileLoadTimer);
      // Debounce: 150ms. During rapid scrolling, only the final
      // target gets tiles loaded. Short enough to feel responsive.
      tileLoadTimer = setTimeout(() => {
        tileLoadTimer = null;
        loadTilesAtTarget(targetP);
      }, 150);
    };

    tileLayerRef.current = tileLayer;

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
    setTimeout(() => map.invalidateSize(), 200);

    // Pre-cache tiles along the entire scroll path
    const cancelPrecache = precacheTiles(
      tileUrl_,
      stops,
      segPathsRef.current
    );

    return () => {
      cancelPrecache();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-driven animation with inertia smoothing
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const LERP_FACTOR = 0.12;
    let running = true;

    // Lightweight scroll listener: just flag dirty — no DOM reads here.
    // All getBoundingClientRect calls happen once per rAF tick instead.
    const onScroll = () => { scrollDirtyRef.current = true; };

    // ── Read scroll position (called once per rAF when dirty) ──
    const readScrollPosition = () => {
      const cards = cardRefsRef.current;
      // Mobile: sync at card sticky position (top-12 = 48px).
      // Desktop (lg:): map is beside cards, sync at header bottom (64px).
      const syncY = window.innerWidth >= 1024 ? 64 : 48;
      const n = stops.length;
      if (n < 2) return;

      // Narrow scan: only check cards near the current active index (±2)
      // instead of all N cards. Falls back to full scan on first call.
      const scanLo = Math.max(0, activeIndexRef.current - 2);
      const scanHi = Math.min(n - 1, activeIndexRef.current + 2);

      let bestIdx = scanLo;
      let bestDist = Infinity;
      const tops: number[] = [];
      for (let i = scanLo; i <= scanHi; i++) {
        const el = cards[i];
        if (!el) { tops.push(0); continue; }
        const top = el.getBoundingClientRect().top;
        tops.push(top);
        const d = Math.abs(top - syncY);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }

      let lo: number, hi: number;
      const localIdx = bestIdx - scanLo;
      if (tops[localIdx] <= syncY) {
        lo = bestIdx;
        hi = Math.min(bestIdx + 1, n - 1);
      } else {
        lo = Math.max(bestIdx - 1, 0);
        hi = bestIdx;
      }

      let p: number;
      if (lo === hi) {
        p = lo / (n - 1);
      } else {
        const loLocal = lo - scanLo;
        const hiLocal = hi - scanLo;
        const loY = loLocal >= 0 && loLocal < tops.length ? tops[loLocal] : 0;
        const hiY = hiLocal >= 0 && hiLocal < tops.length ? tops[hiLocal] : 0;
        const t = hiY === loY ? 0 : (syncY - loY) / (hiY - loY);
        p = (lo + Math.max(0, Math.min(1, t))) / (n - 1);
      }

      targetPRef.current = Math.max(0, Math.min(1, p));

      loadTilesAtTargetRef.current?.(remapProgressForMap(targetPRef.current, stops));
    };

    const tick = () => {
      if (!running) return;

      // Read scroll position only when dirty (avoids unnecessary layout)
      if (scrollDirtyRef.current) {
        scrollDirtyRef.current = false;
        readScrollPosition();
      }

      const map = mapRef.current;
      if (map) {
        const prev = currentPRef.current;
        const target = targetPRef.current;
        const diff = target - prev;
        const p = Math.abs(diff) < 0.0005 ? target : prev + diff * LERP_FACTOR;
        currentPRef.current = p;
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${target * 100}%`;
        }

        // Active card highlighting (based on raw target, not lerped)
        const totalSegments = stops.length - 1;
        const rawTargetIndex = target * totalSegments;
        const newIndex = Math.min(Math.round(rawTargetIndex), stops.length - 1);
        if (newIndex !== activeIndexRef.current) {
          activeIndexRef.current = newIndex;
          // Update visible range for lazy image loading (current ± 1)
          const lo = Math.max(0, newIndex - 1);
          const hi = Math.min(stops.length - 1, newIndex + 1);
          setVisibleRange([lo, hi]);

          for (let i = 0; i < stops.length; i++) {
            const card = cardRefsRef.current[i];
            if (card) {
              card.style.opacity = i === newIndex ? '1' : i < newIndex ? '0.25' : '0.1';
            }
            const dot = dotRefsRef.current[i];
            if (dot) {
              const isActive = i === newIndex;
              const sz = isActive ? '7px' : '4px';
              dot.style.width = sz;
              dot.style.height = sz;
              dot.style.backgroundColor = i <= newIndex ? pathColor : 'rgba(148,163,184,0.4)';
              dot.style.opacity = isActive ? '1' : i < newIndex ? '0.5' : '0.3';
            }
          }
        }

        // Map camera, path, and marker use the lerped value — remapped
        const sp = segPathsRef.current;
        const cumPath = cumPathRef.current;
        const mapP = remapProgressForMap(p, stops);
        const center = interpolateCoordsOnPath(sp, stops, mapP);
        const rawZoom = interpolateZoomSmooth(stops, mapP);
        const nearestInt = Math.round(rawZoom);
        const zoom = Math.abs(rawZoom - nearestInt) < 0.15 ? nearestInt : rawZoom;

        // Skip setView when camera hasn't moved meaningfully
        const dLat = Math.abs(center[0] - prevCenterRef.current[0]);
        const dLng = Math.abs(center[1] - prevCenterRef.current[1]);
        const dZoom = Math.abs(zoom - prevZoomRef.current);
        if (dLat > 0.00001 || dLng > 0.00001 || dZoom > 0.001) {
          map.setView(center, zoom, { animate: false });
          prevCenterRef.current = center;
          prevZoomRef.current = zoom;
        }

        // Update polyline — use precomputed cumulative path
        if (cumPath) {
          const { endIndex, tip } = pathEndIndex(cumPath, sp, stops, mapP);
          // Only rebuild polyline when endpoint changes
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
      animFrameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial read
    readScrollPosition();
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [stops]);

  return (
    <div
      className="storytelling-map not-prose relative"
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
          className="h-full transition-[width] duration-100 ease-linear"
          style={{ width: '0%', backgroundColor: pathColor }}
        />
      </div>

      {/* Single map container — sticky on mobile, absolute-positioned on desktop */}
      <div
        className="sticky top-0 h-[30vh] z-10
                   lg:absolute lg:right-0 lg:top-0 lg:w-[55%] xl:w-[58%] lg:h-full lg:z-0"
      >
        <div className="h-full lg:sticky lg:top-0 lg:h-screen">
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
                ref={el => { dotRefsRef.current[i] = el; }}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === 0 ? 7 : 4,
                  height: i === 0 ? 7 : 4,
                  backgroundColor:
                    i === 0 ? pathColor : "rgba(148,163,184,0.4)",
                  opacity: i === 0 ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling content — full width on mobile, left column on desktop */}
      <div
        ref={scrollRef}
        className="relative lg:z-10 lg:w-[45%] xl:w-[42%] lg:bg-[var(--background)]"
      >
        {stops.map((stop, i) => {
          const { icon, place, subtitle } = parseTitle(stop.title);
          const imgCount = stop.images?.length ?? 0;
          // Extra scroll height for multi-image stops so content stays pinned
          // while images cycle. Each image gets one slot of 60vh, plus one
          // extra slot so the last image dwells before transitioning.
          const extraVh = imgCount > 1 ? imgCount * 60 : 0;
          const minH = imgCount > 1
            ? `calc(80vh + ${extraVh}vh)`
            : undefined;
          // Lazy image loading: only mount slideshow for stops near active
          const showImages = i >= visibleRange[0] && i <= visibleRange[1];

          return (
            <div
              key={stop.id}
              data-stop-wrapper
              className="min-h-[80vh] lg:min-h-screen"
              style={{
                ...(minH ? { minHeight: minH } : {}),
                // Let browser skip layout/paint for far-away stops
                contentVisibility: Math.abs(i - activeIndexRef.current) > 3 ? 'auto' : 'visible',
                containIntrinsicSize: 'auto 80vh',
              } as React.CSSProperties}
            >
              <div
                ref={el => { cardRefsRef.current[i] = el; }}
                className={`w-full px-5 sm:px-8 lg:px-10 xl:px-14 py-8 transition-all duration-500 ease-out ${
                  imgCount > 0
                    ? "sticky top-12 bottom-4 lg:top-16 lg:bottom-auto lg:max-h-[calc(100dvh-64px-16px)]"
                    : ""
                }`}
                style={{
                  opacity: i === 0 ? 1 : 0.1,
                }}
              >
                {/* Text content */}
                <div>
                  {/* Step indicator */}
                  <div className="flex items-center gap-3 mb-5">
                  <div
                    className="h-px transition-all duration-500"
                    style={{
                      width: i === 0 ? 32 : 16,
                      backgroundColor: i === 0
                        ? pathColor
                        : "var(--muted-foreground)",
                      opacity: i === 0 ? 0.7 : 0.2,
                    }}
                  />
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em] transition-colors duration-500"
                    style={{
                      color: i === 0
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
                      color: i === 0
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

                {/* Images — lazy mounted for stops near active */}
                {stop.images && stop.images.length > 0 && showImages && (
                  <ImageSlideshow images={stop.images} alt={place} />
                )}
                {/* Placeholder to maintain layout when images are unmounted */}
                {stop.images && stop.images.length > 0 && !showImages && (
                  <div className="mt-3" />
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
