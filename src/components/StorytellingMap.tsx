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
  pathColor = "#0ea5e9",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
        setProgress(p);

        const totalSegments = stops.length - 1;
        const rawIndex = p * totalSegments;
        setActiveIndex(
          Math.min(Math.round(rawIndex), stops.length - 1)
        );

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

      {/* Single map container — sticky on mobile, absolute-positioned on desktop */}
      <div
        className="sticky top-0 h-[40vh] z-10
                   lg:absolute lg:right-0 lg:top-0 lg:w-[55%] xl:w-[58%] lg:h-full lg:z-0"
      >
        <div className="h-full lg:sticky lg:top-0 lg:h-screen">
          <div ref={mapContainerRef} className="h-full w-full" />
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
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === activeIndex ? 7 : 4,
                  height: i === activeIndex ? 7 : 4,
                  backgroundColor:
                    i <= activeIndex ? pathColor : "rgba(148,163,184,0.4)",
                  opacity:
                    i === activeIndex ? 1 : i < activeIndex ? 0.5 : 0.3,
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
          const isActive = activeIndex === i;
          const isPast = i < activeIndex;

          return (
            <div
              key={stop.id}
              className="min-h-[60vh] lg:min-h-[85vh] flex items-center"
            >
              <div
                className="w-full px-5 sm:px-8 lg:px-10 xl:px-14 py-8 transition-all duration-500 ease-out"
                style={{
                  opacity: isActive ? 1 : isPast ? 0.25 : 0.1,
                }}
              >
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

                {/* Images */}
                {stop.images && stop.images.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {stop.images.map((src, j) => (
                      <div
                        key={j}
                        className="relative aspect-[16/10] overflow-hidden rounded-lg"
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
