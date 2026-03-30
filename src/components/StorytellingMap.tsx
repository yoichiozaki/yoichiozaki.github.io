"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(map);

    if (stops.length > 0) {
      map.setView(stops[0].coordinates, stops[0].zoom ?? 5);
    }

    // Faint guide path for all stops
    const allCoords = stops.map((s) => s.coordinates);
    L.polyline(allCoords, {
      color: pathColor,
      weight: 2,
      opacity: 0.15,
      dashArray: "6 8",
    }).addTo(map);

    // Active (animated) polyline — starts empty
    polylineRef.current = L.polyline([], {
      color: pathColor,
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // Current position marker
    markerRef.current = L.circleMarker(stops[0].coordinates, {
      radius: 8,
      color: "#fff",
      fillColor: pathColor,
      fillOpacity: 1,
      weight: 3,
    }).addTo(map);

    // Stop markers
    stops.forEach((stop) => {
      const marker = L.circleMarker(stop.coordinates, {
        radius: 5,
        color: "#fff",
        fillColor: "#6b7280",
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(map);
      marker.bindTooltip(stop.title, {
        permanent: false,
        direction: "top",
        offset: [0, -8],
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection Observer for scroll tracking
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((el, index) => {
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [stops.length]);

  // Animate map when active index changes
  const animateMap = useCallback(
    (index: number) => {
      const map = mapRef.current;
      if (!map) return;

      const stop = stops[index];
      map.flyTo(stop.coordinates, stop.zoom ?? 12, {
        duration: 1.5,
        easeLinearity: 0.25,
      });

      const pathCoords = stops.slice(0, index + 1).map((s) => s.coordinates);
      polylineRef.current?.setLatLngs(pathCoords);
      markerRef.current?.setLatLng(stop.coordinates);
    },
    [stops]
  );

  useEffect(() => {
    animateMap(activeIndex);
  }, [activeIndex, animateMap]);

  return (
    <div
      className="storytelling-map not-prose relative"
      style={{
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        width: "100vw",
      }}
    >
      {/* Sticky map layer — fills viewport, stays in place while content scrolls */}
      <div className="sticky top-0 h-screen w-full z-0">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>

      {/* Content layer — scrolls over the map */}
      <div className="relative z-10" style={{ marginTop: "-100vh" }}>
        {stops.map((stop, i) => (
          <div
            key={stop.id}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            className={`min-h-[80vh] flex items-center px-4 lg:px-12 transition-opacity duration-500 ${
              activeIndex === i ? "opacity-100" : "opacity-20"
            }`}
          >
            <div className="max-w-sm lg:max-w-md bg-background/90 dark:bg-background/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-border/50">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {String(i + 1).padStart(2, "0")} /{" "}
                {String(stops.length).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-bold mt-2 mb-3 text-foreground">
                {stop.title}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {stop.description}
              </p>
              {stop.images && stop.images.length > 0 && (
                <div className="mt-4 grid gap-3">
                  {stop.images.map((src, j) => (
                    <div
                      key={j}
                      className="relative aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center"
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={`${stop.title} - ${j + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          📷 写真をここに配置
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {/* Spacer so the last card can scroll fully past the map */}
        <div className="h-[40vh]" />
      </div>

      <style>{`
        .leaflet-container {
          background: var(--background, #fff) !important;
        }
      `}</style>
    </div>
  );
}
