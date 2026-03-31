"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
      // Mobile: sync at map bottom (40vh). Desktop: header bottom (64px).
      const syncY = window.innerWidth >= 1024 ? 64 : window.innerHeight * 0.4;
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
      <div className="mt-5 min-h-0 flex-1 flex flex-col overflow-hidden">
        <div className="relative overflow-hidden rounded-lg min-h-0 flex-1">
          <img
            src={images[0]}
            alt={`${alt} - 1`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mt-5 min-h-0 flex-1 flex flex-col overflow-hidden">
      <div className="relative overflow-hidden rounded-lg min-h-0 flex-1">
        {images.map((src, i) => (
          <img
            key={i}
            ref={(el) => { imgRefsRef.current[i] = el; }}
            src={src}
            alt={`${alt} - ${i + 1}`}
            className={`w-full h-full object-contain transition-opacity duration-700 ease-in-out ${
              i === 0 ? "relative" : "absolute top-0 left-0"
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function parseTitle(title: string) {
  const emojiMatch = title.match(
    /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u
  );
  const icon = emojiMatch ? emojiMatch[1] : "";
  const rest = emojiMatch ? title.slice(emojiMatch[0].length) : title;
  const dashIdx = rest.indexOf(" — ");
  if (dashIdx >= 0) {
    return {
      icon,
      place: rest.slice(0, dashIdx),
      subtitle: rest.slice(dashIdx + 3),
    };
  }
  return { icon, place: rest, subtitle: "" };
}

// ── Geo helpers ──────────────────────────────────────────────

const SEG_PTS = 48; // points per segment for smooth curves

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const sl = Math.sin(dLat / 2);
  const sn = Math.sin(dLng / 2);
  const h =
    sl * sl +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      sn *
      sn;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Great-circle arc (for flights) */
function greatCircleArc(
  from: [number, number],
  to: [number, number],
  n: number
): [number, number][] {
  const toR = (d: number) => (d * Math.PI) / 180;
  const toD = (r: number) => (r * 180) / Math.PI;
  const [lat1, lng1] = [toR(from[0]), toR(from[1])];
  const [lat2, lng2] = [toR(to[0]), toR(to[1])];
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat1 - lat2) / 2) ** 2 +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin((lng1 - lng2) / 2) ** 2
      )
    );
  if (d < 1e-10) return [from, to];
  const pts: [number, number][] = [];
  let prevLng = from[1];
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    const x =
      a * Math.cos(lat1) * Math.cos(lng1) +
      b * Math.cos(lat2) * Math.cos(lng2);
    const y =
      a * Math.cos(lat1) * Math.sin(lng1) +
      b * Math.cos(lat2) * Math.sin(lng2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    const lat = toD(Math.atan2(z, Math.sqrt(x * x + y * y)));
    let lng = toD(Math.atan2(y, x));
    // Unwrap longitude to avoid antimeridian jump
    while (lng - prevLng > 180) lng -= 360;
    while (lng - prevLng < -180) lng += 360;
    prevLng = lng;
    pts.push([lat, lng]);
  }
  return pts;
}

/** Quadratic Bézier curve (for drives / buses) */
function bezierCurve(
  from: [number, number],
  to: [number, number],
  n: number,
  curvature = 0.15
): [number, number][] {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const cp: [number, number] = [mx + dx * curvature, my - dy * curvature];
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * cp[0] + t ** 2 * to[0],
      (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * cp[1] + t ** 2 * to[1],
    ]);
  }
  return pts;
}

function straightLine(
  from: [number, number],
  to: [number, number],
  n: number
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([lerp(from[0], to[0], t), lerp(from[1], to[1], t)]);
  }
  return pts;
}

// ── Catmull-Rom spline for smooth segment joints ─────────────

/**
 * Centripetal Catmull-Rom interpolation between p1 and p2,
 * using p0 and p3 as surrounding control points.
 * Returns `n+1` points from p1 to p2 (inclusive).
 */
function catmullRomSegment(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  n: number,
  alpha = 0.5 // 0.5 = centripetal
): [number, number][] {
  const tj = (ti: number, a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return ti + Math.pow(dx * dx + dy * dy, alpha / 2);
  };
  const t0 = 0;
  const t1 = tj(t0, p0, p1);
  const t2 = tj(t1, p1, p2);
  const t3 = tj(t2, p2, p3);
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = t1 + (i / n) * (t2 - t1);
    const a1L = ((t1 - t) / (t1 - t0)) * p0[0] + ((t - t0) / (t1 - t0)) * p1[0];
    const a1N = ((t1 - t) / (t1 - t0)) * p0[1] + ((t - t0) / (t1 - t0)) * p1[1];
    const a2L = ((t2 - t) / (t2 - t1)) * p1[0] + ((t - t1) / (t2 - t1)) * p2[0];
    const a2N = ((t2 - t) / (t2 - t1)) * p1[1] + ((t - t1) / (t2 - t1)) * p2[1];
    const a3L = ((t3 - t) / (t3 - t2)) * p2[0] + ((t - t2) / (t3 - t2)) * p3[0];
    const a3N = ((t3 - t) / (t3 - t2)) * p2[1] + ((t - t2) / (t3 - t2)) * p3[1];
    const b1L = ((t2 - t) / (t2 - t0)) * a1L + ((t - t0) / (t2 - t0)) * a2L;
    const b1N = ((t2 - t) / (t2 - t0)) * a1N + ((t - t0) / (t2 - t0)) * a2N;
    const b2L = ((t3 - t) / (t3 - t1)) * a2L + ((t - t1) / (t3 - t1)) * a3L;
    const b2N = ((t3 - t) / (t3 - t1)) * a2N + ((t - t1) / (t3 - t1)) * a3N;
    const cL = ((t2 - t) / (t2 - t1)) * b1L + ((t - t1) / (t2 - t1)) * b2L;
    const cN = ((t2 - t) / (t2 - t1)) * b1N + ((t - t1) / (t2 - t1)) * b2N;
    pts.push([cL, cN]);
  }
  return pts;
}

// ── Pre-compute curved segment paths ─────────────────────────

function buildSegmentPaths(stops: StoryStop[]): [number, number][][] {
  const n = stops.length;
  if (n < 2) return [];

  const segments: [number, number][][] = [];

  for (let i = 0; i < n - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const type = to.pathType ?? "walk";

    // Flights always use great-circle arcs (no smoothing needed)
    if (type === "flight") {
      segments.push(greatCircleArc(from.coordinates, to.coordinates, SEG_PTS));
      continue;
    }

    // Ground segments: use Catmull-Rom for smooth joints.
    // p0 = previous stop (or reflected phantom), p3 = next-next stop (or reflected phantom)
    const p1 = from.coordinates;
    const p2 = to.coordinates;

    // Look back: if the previous segment was also ground, use that stop.
    // If it was a flight or doesn't exist, create a phantom point by reflecting p2 through p1.
    let p0: [number, number];
    if (i > 0 && (stops[i].pathType ?? "walk") !== "flight") {
      p0 = stops[i - 1].coordinates;
    } else {
      p0 = [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
    }

    // Look ahead: if the next segment is also ground, use that stop.
    // If it's a flight or doesn't exist, create a phantom point by reflecting p1 through p2.
    let p3: [number, number];
    if (i + 2 < n && (stops[i + 2].pathType ?? "walk") !== "flight") {
      p3 = stops[i + 2].coordinates;
    } else {
      p3 = [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    }

    segments.push(catmullRomSegment(p0, p1, p2, p3, SEG_PTS));
  }

  return segments;
}

/** Unwrap longitudes globally across all segments so polylines never jump 360° */
function unwrapSegPaths(
  segPaths: [number, number][][]
): [number, number][][] {
  if (segPaths.length === 0) return segPaths;
  let prevLng = segPaths[0][0]?.[1] ?? 0;
  return segPaths.map((seg) =>
    seg.map(([lat, lng]) => {
      while (lng - prevLng > 180) lng -= 360;
      while (lng - prevLng < -180) lng += 360;
      prevLng = lng;
      return [lat, lng] as [number, number];
    })
  );
}

function fullGuidePath(
  segPaths: [number, number][][]
): [number, number][] {
  const pts: [number, number][] = [];
  segPaths.forEach((seg, i) => {
    for (let j = i === 0 ? 0 : 1; j < seg.length; j++) pts.push(seg[j]);
  });
  return pts;
}

// ── Interpolation on pre-computed curved paths ───────────────

function interpolateCoordsOnPath(
  segPaths: [number, number][][],
  stops: StoryStop[],
  progress: number
): [number, number] {
  if (stops.length === 0) return [0, 0];
  if (progress <= 0) return stops[0].coordinates;
  if (progress >= 1) return stops[stops.length - 1].coordinates;

  const total = stops.length - 1;
  const raw = progress * total;
  const idx = Math.floor(raw);
  const t = easeInOutCubic(raw - idx);

  const seg = segPaths[idx];
  if (!seg) return stops[stops.length - 1].coordinates;
  const pos = t * (seg.length - 1);
  const si = Math.floor(pos);
  const st = pos - si;
  if (si >= seg.length - 1) return seg[seg.length - 1];
  return [
    lerp(seg[si][0], seg[si + 1][0], st),
    lerp(seg[si][1], seg[si + 1][1], st),
  ];
}

/** Zoom-valley: zooms out for long-distance segments, stays tight for short ones */
function interpolateZoomSmooth(
  stops: StoryStop[],
  progress: number
): number {
  if (stops.length === 0) return 5;
  if (progress <= 0) return stops[0].zoom ?? 5;
  if (progress >= 1) return stops[stops.length - 1].zoom ?? 12;

  const total = stops.length - 1;
  const raw = progress * total;
  const idx = Math.floor(raw);
  const t = raw - idx;

  const fromZ = stops[idx].zoom ?? 12;
  const toZ = stops[Math.min(idx + 1, stops.length - 1)].zoom ?? 12;
  const dist = haversineKm(
    stops[idx].coordinates,
    stops[Math.min(idx + 1, stops.length - 1)].coordinates
  );

  // Short distances → linear zoom
  if (dist < 5) return lerp(fromZ, toZ, t);

  // Zoom-valley: overview zoom that fits both endpoints
  const overviewZ = Math.max(1, 17 - Math.log2(Math.max(1, dist)));

  // Ultra-long flights (>3000km): sigmoid zoom-valley with dwell zones
  //   0 → dwell:       stay at departure zoom (no change)
  //   dwell → 1-dwell:  sigmoid S-curve transition
  //   1-dwell → 1:      stay at arrival zoom (no change)
  if (dist > 3000) {
    const lowZ = Math.max(3, Math.min(fromZ, overviewZ));
    // Dwell zones: departure side 15%, arrival side 25%.
    // The arrival dwell is longer so tiles at the destination zoom
    // have more time to load before the user reaches the next card.
    const dwellOut = 0.15;
    const dwellIn = 0.25;
    if (t <= dwellOut) return fromZ;
    if (t >= 1 - dwellIn) return toZ;
    // Remap t into the active sigmoid range [0, 1]
    const u = (t - dwellOut) / (1 - dwellOut - dwellIn);
    // Steepness — higher = sharper transition in the middle
    const k = 40;
    const sig = (x: number) => 1 / (1 + Math.exp(-k * (x - 0.5)));
    const s0 = sig(0);
    const s1 = sig(1);
    const s = (sig(u) - s0) / (s1 - s0);
    // Zoom path: fromZ → lowZ → toZ via two-segment lerp
    if (u < 0.5) {
      return lerp(fromZ, lowZ, s * 2);
    } else {
      return lerp(lowZ, toZ, (s - 0.5) * 2);
    }
  }

  const midZ = Math.min(Math.min(fromZ, toZ), overviewZ);

  // Quadratic Bézier zoom curve: dips to midZ around t≈0.5
  return (1 - t) ** 2 * fromZ + 2 * (1 - t) * t * midZ + t ** 2 * toZ;
}

/**
 * Remap raw scroll progress so the map "dwells" at each stop.
 *
 * Within each segment i→i+1, instead of moving linearly:
 *   - First portion → map stays at stop i (dwell zone)
 *   - Remaining portion → map transitions from stop i to stop i+1
 *
 * Dwell time scales with:
 *   - Number of images (multi-image stops get proportionally longer dwell)
 *   - Distance to next stop (long-distance segments get extra pre-transition dwell)
 *   - A minimum base dwell so even 0/1-image stops pause briefly
 *
 * Card highlighting and progress bar use raw progress (unchanged).
 * Only map camera, path, marker, and tile loading use the remapped value.
 */
function remapProgressForMap(
  rawP: number,
  stops: StoryStop[]
): number {
  const n = stops.length;
  if (n < 2 || rawP <= 0) return 0;
  if (rawP >= 1) return 1;

  const segments = n - 1;
  const raw = rawP * segments;
  const segIdx = Math.min(Math.floor(raw), segments - 1);
  const segT = raw - segIdx;

  const imgCount = stops[segIdx].images?.length ?? 0;

  // Base dwell for multi-image stops: image cycling + 1 linger slot
  let dwellFraction: number;
  if (imgCount > 1) {
    dwellFraction = (imgCount + 1) / (imgCount + 2);
  } else {
    // Minimum base dwell for all stops (even 0/1 image)
    dwellFraction = 0.15;
  }

  // Boost dwell before long-distance segments so the map lingers longer
  // at the departure point before a big geographic jump.
  const nextStop = stops[Math.min(segIdx + 1, n - 1)];
  const dist = haversineKm(stops[segIdx].coordinates, nextStop.coordinates);
  if (dist > 500) {
    // Long distance: add extra dwell (up to 0.15 more), capped at 0.92
    const boost = Math.min(0.15, dist / 20000);
    dwellFraction = Math.min(0.92, dwellFraction + boost);
  }

  let mapT: number;
  if (segT <= dwellFraction) {
    mapT = 0;
  } else {
    mapT = (segT - dwellFraction) / (1 - dwellFraction);
  }

  return (segIdx + mapT) / segments;
}

// ── Precomputed cumulative path for O(1) slicing ────────────

/** Flat cumulative array of all segment points + per-segment start indices */
type CumulativePath = {
  points: [number, number][];
  /** segStarts[i] = index into `points` where segment i begins */
  segStarts: number[];
};

function buildCumulativePath(segPaths: [number, number][][]): CumulativePath {
  const points: [number, number][] = [];
  const segStarts: number[] = [];
  for (let i = 0; i < segPaths.length; i++) {
    segStarts.push(points.length);
    const seg = segPaths[i];
    for (let j = i === 0 ? 0 : 1; j < seg.length; j++) points.push(seg[j]);
  }
  return { points, segStarts };
}

/**
 * Return the index into `cumPath.points` up to which the polyline should
 * be drawn, plus an interpolated fractional tip point.
 * Avoids per-frame array allocation — callers can use cumPath.points.slice(0, endIndex).
 */
function pathEndIndex(
  cumPath: CumulativePath,
  segPaths: [number, number][][],
  stops: StoryStop[],
  progress: number
): { endIndex: number; tip: [number, number] | null } {
  if (stops.length === 0) return { endIndex: 0, tip: null };
  if (progress <= 0) return { endIndex: 0, tip: stops[0].coordinates };
  if (progress >= 1) return { endIndex: cumPath.points.length, tip: null };

  const total = stops.length - 1;
  const raw = Math.min(progress * total, total);
  const segIdx = Math.floor(raw);
  const segT = easeInOutCubic(raw - segIdx);

  // Base: all completed segments
  let endIndex = segIdx < segPaths.length
    ? cumPath.segStarts[segIdx] + (segIdx === 0 ? 0 : 0)
    : cumPath.points.length;

  // For segment boundaries: segStarts[segIdx] is where this segment's
  // first NEW point lives. All earlier points are already before it.
  if (segIdx < total && segIdx < segPaths.length) {
    const seg = segPaths[segIdx];
    const segStart = cumPath.segStarts[segIdx];
    // Points contributed by this segment = seg.length - (segIdx===0?0:1)
    const offset = segIdx === 0 ? 0 : 1;
    const exactPos = segT * (seg.length - 1);
    const pi = Math.floor(exactPos);
    const pt = exactPos - pi;
    endIndex = segStart + Math.max(0, pi - offset) + 1;

    if (pt > 0.001 && pi < seg.length - 1) {
      return {
        endIndex,
        tip: [
          lerp(seg[pi][0], seg[pi + 1][0], pt),
          lerp(seg[pi][1], seg[pi + 1][1], pt),
        ],
      };
    }
  } else {
    endIndex = cumPath.points.length;
  }

  return { endIndex, tip: null };
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
      // Mobile: sync when card top reaches map bottom (40vh).
      // Desktop (lg:): map is beside cards, sync at header bottom (64px).
      const syncY = window.innerWidth >= 1024 ? 64 : window.innerHeight * 0.4;
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
        className="sticky top-0 h-[40vh] z-10
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
                    ? "sticky top-[40vh] lg:top-16 max-h-[calc(60dvh-16px)] lg:max-h-[calc(100dvh-64px-16px)] flex flex-col"
                    : ""
                }`}
                style={{
                  opacity: i === 0 ? 1 : 0.1,
                }}
              >
                {/* Text content — won't shrink in flex layout */}
                <div className={imgCount > 0 ? "shrink-0" : ""}>
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
                  <div className="mt-5 min-h-0 flex-1" />
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
