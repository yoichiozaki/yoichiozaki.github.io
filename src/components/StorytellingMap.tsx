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
};

type Props = {
  stops: StoryStop[];
  tileUrl?: string;
  tileAttribution?: string;
  pathColor?: string;
};

// CartoDB Voyager — clean, modern map tiles
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

// Parse "🛫 成田空港 — 旅の始まり" → { icon, place, subtitle }
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

function interpolateCoords(
  stops: StoryStop[],
  progress: number
): [number, number] {
  if (stops.length === 0) return [0, 0];
  if (progress <= 0) return stops[0].coordinates;
  if (progress >= 1) return stops[stops.length - 1].coordinates;

  const totalSegments = stops.length - 1;
  const rawIndex = progress * totalSegments;
  const idx = Math.floor(rawIndex);
  const t = easeInOutCubic(rawIndex - idx);

  const from = stops[idx].coordinates;
  const to = stops[Math.min(idx + 1, stops.length - 1)].coordinates;
  return [lerp(from[0], to[0], t), lerp(from[1], to[1], t)];
}

function interpolateZoom(stops: StoryStop[], progress: number): number {
  if (stops.length === 0) return 5;
  if (progress <= 0) return stops[0].zoom ?? 5;
  if (progress >= 1) return stops[stops.length - 1].zoom ?? 12;

  const totalSegments = stops.length - 1;
  const rawIndex = progress * totalSegments;
  const idx = Math.floor(rawIndex);
  const t = rawIndex - idx;

  const fromZoom = stops[idx].zoom ?? 12;
  const toZoom = stops[Math.min(idx + 1, stops.length - 1)].zoom ?? 12;
  return lerp(fromZoom, toZoom, t);
}

function getPathUpToProgress(
  stops: StoryStop[],
  progress: number
): [number, number][] {
  if (stops.length === 0) return [];
  if (progress <= 0) return [stops[0].coordinates];

  const totalSegments = stops.length - 1;
  const rawIndex = Math.min(progress * totalSegments, totalSegments);
  const idx = Math.floor(rawIndex);
  const t = rawIndex - idx;

  const points: [number, number][] = stops
    .slice(0, idx + 1)
    .map((s) => s.coordinates);

  if (idx < totalSegments && t > 0) {
    const from = stops[idx].coordinates;
    const to = stops[idx + 1].coordinates;
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      const segT = (t * i) / steps;
      points.push([lerp(from[0], to[0], segT), lerp(from[1], to[1], segT)]);
    }
  }

  return points;
}

export function StorytellingMap({
  stops,
  tileUrl = DEFAULT_TILE,
  tileAttribution = DEFAULT_ATTRIBUTION,
  pathColor = "#2563eb",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

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

    // Faint guide path
    const allCoords = stops.map((s) => s.coordinates);
    L.polyline(allCoords, {
      color: pathColor,
      weight: 2,
      opacity: 0.1,
      dashArray: "4 8",
    }).addTo(map);

    // Active polyline — drawn progressively
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

    // Stop markers (tiny dots, no tooltips — clean like Tympanus)
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-driven animation loop
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onScroll = () => {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(() => {
        const map = mapRef.current;
        if (!map) return;

        const rect = wrapper.getBoundingClientRect();
        const wrapperHeight = wrapper.scrollHeight;
        const viewportH = window.innerHeight;

        const scrolled = -rect.top;
        const totalScrollable = wrapperHeight - viewportH;
        const p = Math.max(0, Math.min(1, scrolled / totalScrollable));
        setProgress(p);

        const totalSegments = stops.length - 1;
        const rawIndex = p * totalSegments;
        const newActiveIndex = Math.min(
          Math.round(rawIndex),
          stops.length - 1
        );
        setActiveIndex(newActiveIndex);

        const center = interpolateCoords(stops, p);
        const zoom = interpolateZoom(stops, p);
        map.setView(center, zoom, { animate: false });

        const pathPoints = getPathUpToProgress(stops, p);
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

  return (
    <div
      ref={wrapperRef}
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
          className="h-full transition-[width] duration-100 ease-linear"
          style={{ width: `${progress * 100}%`, backgroundColor: pathColor }}
        />
      </div>

      {/* Sticky map — fills viewport */}
      <div className="sticky top-0 h-screen w-full z-0">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Left gradient overlay — creates reading panel like Tympanus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, var(--background) 0%, color-mix(in srgb, var(--background) 90%, transparent) 20%, color-mix(in srgb, var(--background) 40%, transparent) 42%, transparent 62%)",
          }}
        />

        {/* Bottom vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, color-mix(in srgb, var(--background) 50%, transparent), transparent)",
          }}
        />
      </div>

      {/* Scrolling content layer — text directly on gradient, no cards */}
      <div className="relative z-10" style={{ marginTop: "-100vh" }}>
        {/* Chapter dots navigation (desktop) */}
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-2">
          {stops.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === activeIndex ? 8 : 5,
                height: i === activeIndex ? 8 : 5,
                backgroundColor:
                  i === activeIndex
                    ? pathColor
                    : i < activeIndex
                      ? pathColor
                      : "var(--muted-foreground)",
                opacity: i === activeIndex ? 1 : i < activeIndex ? 0.5 : 0.25,
              }}
            />
          ))}
        </div>

        {stops.map((stop, i) => {
          const { icon, place, subtitle } = parseTitle(stop.title);
          const isActive = activeIndex === i;
          const isPast = i < activeIndex;
          const distance = Math.abs(activeIndex - i);

          return (
            <div
              key={stop.id}
              className="min-h-[90vh] flex items-center"
            >
              <div
                className="w-full max-w-md lg:max-w-lg px-6 lg:px-14 py-8 transition-all duration-700 ease-out"
                style={{
                  opacity: isActive ? 1 : isPast ? 0.12 : 0.06,
                  transform: `translateX(${isActive ? 0 : -16}px)`,
                  filter: isActive
                    ? "none"
                    : `blur(${Math.min(distance * 0.8, 3)}px)`,
                }}
              >
                {/* Step indicator line + number */}
                <div className="flex items-center gap-3 mb-6">
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
                  <span className="text-3xl lg:text-4xl block mb-3">
                    {icon}
                  </span>
                )}

                {/* Place name — large, bold, Tympanus-style */}
                <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight text-foreground mb-1">
                  {place}
                </h3>

                {/* Subtitle */}
                {subtitle && (
                  <p
                    className="text-sm lg:text-base font-medium tracking-wide mb-5 transition-colors duration-500"
                    style={{
                      color: isActive
                        ? pathColor
                        : "var(--muted-foreground)",
                    }}
                  >
                    {subtitle}
                  </p>
                )}

                {/* Description — longer, more readable */}
                <p className="text-sm lg:text-[15px] leading-[1.9] text-foreground/80">
                  {stop.description}
                </p>

                {/* Images */}
                {stop.images && stop.images.length > 0 && (
                  <div className="mt-6 grid gap-4">
                    {stop.images.map((src, j) => (
                      <div
                        key={j}
                        className="relative aspect-[16/10] overflow-hidden rounded-xl"
                      >
                        {src && (
                          <img
                            src={src}
                            alt={`${place} - ${j + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div className="h-[50vh]" />
      </div>

      <style>{`
        .leaflet-container {
          background: var(--background, #fff) !important;
        }
        .dark .leaflet-tile-pane {
          filter: brightness(0.55) saturate(0.7) contrast(1.1);
        }
        .leaflet-control-attribution {
          font-size: 9px !important;
          background: color-mix(in srgb, var(--background) 60%, transparent) !important;
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
