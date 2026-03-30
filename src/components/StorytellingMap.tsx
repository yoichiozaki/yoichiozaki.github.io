"use client";

import { useEffect, useRef } from "react";
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

type Props = {
  stops: StoryStop[];
  tileUrl?: string;
  tileAttribution?: string;
  pathColor?: string;
  introTitle?: string;
  introSubtitle?: string;
};

const DEFAULT_TILE =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

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
    pts.push([
      toD(Math.atan2(z, Math.sqrt(x * x + y * y))),
      toD(Math.atan2(y, x)),
    ]);
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

// ── Pre-compute curved segment paths ─────────────────────────

function buildSegmentPaths(stops: StoryStop[]): [number, number][][] {
  return stops.slice(0, -1).map((from, i) => {
    const to = stops[i + 1];
    const type = to.pathType ?? "walk";
    if (type === "flight")
      return greatCircleArc(
        from.coordinates,
        to.coordinates,
        SEG_PTS
      );
    if (type === "drive")
      return bezierCurve(
        from.coordinates,
        to.coordinates,
        SEG_PTS
      );
    const dist = haversineKm(from.coordinates, to.coordinates);
    return dist > 3
      ? bezierCurve(from.coordinates, to.coordinates, SEG_PTS, 0.08)
      : straightLine(from.coordinates, to.coordinates, SEG_PTS);
  });
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
  const overviewZ = Math.max(2, 17 - Math.log2(Math.max(1, dist)));
  const midZ = Math.min(Math.min(fromZ, toZ), overviewZ);

  // Quadratic Bézier zoom curve: dips to midZ around t≈0.5
  return (1 - t) ** 2 * fromZ + 2 * (1 - t) * t * midZ + t ** 2 * toZ;
}

function pathUpToProgress(
  segPaths: [number, number][][],
  stops: StoryStop[],
  progress: number
): [number, number][] {
  if (stops.length === 0) return [];
  if (progress <= 0) return [stops[0].coordinates];

  const total = stops.length - 1;
  const raw = Math.min(progress * total, total);
  const segIdx = Math.floor(raw);
  const segT = raw - segIdx;

  const pts: [number, number][] = [];

  // Completed segments
  for (let i = 0; i < segIdx; i++) {
    const seg = segPaths[i];
    for (let j = i === 0 ? 0 : 1; j < seg.length; j++) pts.push(seg[j]);
  }

  // Current partial segment
  if (segIdx < total) {
    const seg = segPaths[segIdx];
    const exactPos = segT * (seg.length - 1);
    const pi = Math.floor(exactPos);
    const pt = exactPos - pi;
    const s = segIdx === 0 && pts.length === 0 ? 0 : 1;
    for (let j = s; j <= pi; j++) pts.push(seg[j]);
    if (pt > 0.001 && pi < seg.length - 1) {
      pts.push([
        lerp(seg[pi][0], seg[pi + 1][0], pt),
        lerp(seg[pi][1], seg[pi + 1][1], pt),
      ]);
    }
  }

  if (pts.length === 0) pts.push(stops[0].coordinates);
  return pts;
}

export function StorytellingMap({
  stops,
  tileUrl = DEFAULT_TILE,
  tileAttribution = DEFAULT_ATTRIBUTION,
  pathColor = "#0ea5e9",
  introTitle,
  introSubtitle,
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const segPathsRef = useRef<[number, number][][]>([]);

  // Pre-compute curved segment paths
  if (segPathsRef.current.length === 0 && stops.length > 1) {
    segPathsRef.current = buildSegmentPaths(stops);
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
    });

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(map);

    if (stops.length > 0) {
      map.setView(stops[0].coordinates, stops[0].zoom ?? 5);
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-driven animation
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const onScroll = () => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const map = mapRef.current;
        if (!map) return;

        const rect = scrollEl.getBoundingClientRect();
        const scrollH = scrollEl.scrollHeight;
        const viewH = window.innerHeight;

        const scrolled = -rect.top;
        const total = scrollH - viewH;
        const p = Math.max(0, Math.min(1, scrolled / total));

        const sp = segPathsRef.current;
        const center = interpolateCoordsOnPath(sp, stops, p);
        const zoom = interpolateZoomSmooth(stops, p);
        map.setView(center, zoom, { animate: false });

        const pathPoints = pathUpToProgress(sp, stops, p);
        polylineRef.current?.setLatLngs(pathPoints);
        markerRef.current?.setLatLng(center);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [stops]);

  const serifFont =
    "Georgia, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif";

  return (
    <div
      className="storytelling-map not-prose relative"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Map container — sticky on mobile, absolute-positioned on desktop */}
      <div
        className="sticky top-0 h-[40vh] z-10
                   lg:absolute lg:right-0 lg:top-0 lg:w-[55%] xl:w-[58%] lg:h-full lg:z-0"
      >
        <div className="h-full lg:sticky lg:top-0 lg:h-screen">
          <div ref={mapContainerRef} className="h-full w-full" />
          {/* Soft edge between content and map (desktop) */}
          <div
            className="hidden lg:block absolute inset-y-0 left-0 w-24 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, var(--background), transparent)",
            }}
          />
          {/* Bottom fade (mobile) */}
          <div
            className="lg:hidden absolute inset-x-0 bottom-0 h-12 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, var(--background), transparent)",
            }}
          />
        </div>
      </div>

      {/* Scrolling content — full width on mobile, left column on desktop */}
      <div
        ref={scrollRef}
        className="relative lg:z-10 lg:w-[45%] xl:w-[42%] lg:bg-[var(--background)]"
      >
        {/* Intro section — dark cinematic header */}
        {introTitle && (
          <div
            className="relative min-h-screen flex flex-col items-center justify-center text-center px-8"
            style={{ background: "#181922" }}
          >
            <h2
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-normal leading-tight text-white"
              style={{ fontFamily: serifFont }}
            >
              {introTitle}
            </h2>
            {introSubtitle && (
              <p
                className="mt-5 text-xs sm:text-sm uppercase tracking-[4px] leading-relaxed"
                style={{ color: "#9D9C95" }}
              >
                — {introSubtitle} —
              </p>
            )}
          </div>
        )}

        {/* Story sections */}
        {stops.map((stop, i) => {
          const { place, subtitle } = parseTitle(stop.title);

          return (
            <section
              key={stop.id}
              className="py-16 lg:py-24 min-h-[50vh] lg:min-h-[75vh]"
              style={{ fontSize: "1.15em", lineHeight: 1.7 }}
            >
              <div className="px-8 sm:px-12 lg:px-14 xl:px-16">
                {/* Heading — Tympanus style: uppercase label + serif title */}
                <h3 className="mb-6">
                  {subtitle ? (
                    <>
                      <span
                        className="block text-[0.7rem] font-bold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500"
                      >
                        {place}
                      </span>
                      <span
                        className="block text-[1.55em] lg:text-[1.8em] font-normal mt-1"
                        style={{
                          fontFamily: serifFont,
                          lineHeight: 0.95,
                          padding: "0.15em 0 0.35em",
                          color: "var(--color-foreground)",
                          opacity: 0.6,
                        }}
                      >
                        {subtitle}
                      </span>
                    </>
                  ) : (
                    <span
                      className="block text-[1.55em] lg:text-[1.8em] font-normal"
                      style={{
                        fontFamily: serifFont,
                        lineHeight: 0.95,
                        padding: "0.15em 0 0.35em",
                        color: "var(--color-foreground)",
                        opacity: 0.6,
                      }}
                    >
                      {place}
                    </span>
                  )}
                </h3>

                {/* First paragraph — editorial intro style */}
                {i === 0 && (
                  <p
                    className="text-[1.1em] italic leading-relaxed mb-4"
                    style={{ color: "var(--color-foreground)", opacity: 0.45 }}
                  >
                    {stop.description}
                  </p>
                )}

                {/* Regular description */}
                {i !== 0 && (
                  <p
                    className="text-[0.92em] leading-[1.7]"
                    style={{ color: "var(--color-foreground)", opacity: 0.65 }}
                  >
                    {stop.description}
                  </p>
                )}

                {/* Images with figcaption style */}
                {stop.images && stop.images.length > 0 && (
                  <div className="mt-8">
                    {stop.images.map((src, j) => (
                      <figure key={j} className="my-6">
                        <img
                          src={src}
                          alt={`${place} - ${j + 1}`}
                          className="w-full"
                          loading="lazy"
                        />
                      </figure>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
        <div className="h-[40vh]" />
      </div>

      <style>{`
        .leaflet-container {
          background: var(--background, #fff) !important;
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
      `}</style>
    </div>
  );
}
