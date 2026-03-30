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
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Lerp between two values
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Ease-in-out cubic for smoother feel
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Interpolate between coordinates at segment-level precision
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

// Interpolate zoom level
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

// Generate polyline points up to a given progress
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

  // All completed segments
  const points: [number, number][] = stops
    .slice(0, idx + 1)
    .map((s) => s.coordinates);

  // Partial next segment
  if (idx < totalSegments && t > 0) {
    const from = stops[idx].coordinates;
    const to = stops[idx + 1].coordinates;
    // Add intermediate points for smoother curve
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

    L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(map);

    if (stops.length > 0) {
      map.setView(stops[0].coordinates, stops[0].zoom ?? 5);
    }

    // Faint guide path for all stops (dotted background trail)
    const allCoords = stops.map((s) => s.coordinates);
    L.polyline(allCoords, {
      color: pathColor,
      weight: 2,
      opacity: 0.12,
      dashArray: "4 8",
    }).addTo(map);

    // Active polyline — drawn progressively
    polylineRef.current = L.polyline([], {
      color: pathColor,
      weight: 3.5,
      opacity: 0.85,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // Current position marker with pulse effect
    markerRef.current = L.circleMarker(stops[0].coordinates, {
      radius: 7,
      color: "#fff",
      fillColor: pathColor,
      fillOpacity: 1,
      weight: 2.5,
    }).addTo(map);

    // Stop markers (small dots)
    stops.forEach((stop, i) => {
      const marker = L.circleMarker(stop.coordinates, {
        radius: 4,
        color: "#fff",
        fillColor: "#94a3b8",
        fillOpacity: 0.6,
        weight: 1.5,
      }).addTo(map);
      marker.bindTooltip(stop.title.replace(/^[^\s]+\s/, ""), {
        permanent: false,
        direction: "top",
        offset: [0, -8],
        className: "storytelling-tooltip",
      });
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

        // Calculate global scroll progress through the storytelling section (0 to 1)
        // rect.top starts positive (below viewport), goes negative (above viewport)
        const scrolled = -rect.top;
        const totalScrollable = wrapperHeight - viewportH;
        const progress = Math.max(
          0,
          Math.min(1, scrolled / totalScrollable)
        );

        // Determine active stop index
        const totalSegments = stops.length - 1;
        const rawIndex = progress * totalSegments;
        const newActiveIndex = Math.min(
          Math.round(rawIndex),
          stops.length - 1
        );
        setActiveIndex(newActiveIndex);

        // Interpolate map position smoothly
        const center = interpolateCoords(stops, progress);
        const zoom = interpolateZoom(stops, progress);
        map.setView(center, zoom, { animate: false });

        // Progressively draw path
        const pathPoints = getPathUpToProgress(stops, progress);
        polylineRef.current?.setLatLngs(pathPoints);

        // Move the marker to the current interpolated position
        markerRef.current?.setLatLng(center);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Initial position
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
      {/* Sticky map — fills viewport */}
      <div className="sticky top-0 h-screen w-full z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Scrolling content layer */}
      <div className="relative z-10" style={{ marginTop: "-100vh" }}>
        {stops.map((stop, i) => {
          // Calculate opacity and transform for each card
          const isActive = activeIndex === i;
          const distance = Math.abs(activeIndex - i);
          const opacity = isActive ? 1 : Math.max(0, 0.35 - distance * 0.15);
          const translateY = isActive ? 0 : distance > 0 ? 8 : 0;

          return (
            <div
              key={stop.id}
              className="min-h-[85vh] flex items-center px-4 lg:px-12"
            >
              <div
                className="max-w-sm lg:max-w-md backdrop-blur-md rounded-2xl p-6 lg:p-8 shadow-xl border transition-all duration-700 ease-out"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  backgroundColor: "color-mix(in srgb, var(--background) 88%, transparent)",
                  borderColor: isActive
                    ? "color-mix(in srgb, var(--border) 60%, transparent)"
                    : "color-mix(in srgb, var(--border) 20%, transparent)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded-full transition-colors duration-500"
                    style={{
                      backgroundColor: isActive
                        ? pathColor + "20"
                        : "transparent",
                      color: isActive ? pathColor : "var(--muted-foreground)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")} /{" "}
                    {String(stops.length).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-bold mb-3 text-foreground leading-tight">
                  {stop.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/75">
                  {stop.description}
                </p>
                {stop.images && stop.images.length > 0 && (
                  <div className="mt-4 grid gap-3">
                    {stop.images.map((src, j) => (
                      <div
                        key={j}
                        className="relative aspect-video overflow-hidden rounded-lg bg-muted/50 flex items-center justify-center"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={`${stop.title} - ${j + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            📷 写真をここに配置
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {/* Extra scroll space so the last card can center in viewport */}
        <div className="h-[50vh]" />
      </div>

      <style>{`
        .storytelling-tooltip {
          background: rgba(15, 23, 42, 0.85) !important;
          color: #f1f5f9 !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          letter-spacing: 0.01em !important;
        }
        .storytelling-tooltip::before {
          border-top-color: rgba(15, 23, 42, 0.85) !important;
        }
        .leaflet-container {
          background: var(--background, #fff) !important;
        }
      `}</style>
    </div>
  );
}
