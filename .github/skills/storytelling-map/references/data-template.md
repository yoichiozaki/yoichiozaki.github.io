# Trip Data File Template

```typescript
import type { StoryStop } from "@/components/StorytellingMap";

// ── Japanese ─────────────────────────────────────────────────

export const stopsJa: StoryStop[] = [
  {
    id: "stop-id-here",
    title: "🛫 場所名 — サブタイトル",
    description:
      "日本語の説明文。2〜4文で、ナラティブなスタイルで書く。",
    coordinates: [35.6762, 139.6503],
    zoom: 12,
    // First stop: no pathType (this is the origin)
    images: ["/images/trips/{slug}/stop-id-here-1.webp"],
  },
  {
    id: "second-stop",
    title: "🏔️ 2番目の場所",
    description:
      "説明文。",
    coordinates: [35.3606, 138.7274],
    zoom: 14,
    pathType: "drive", // or "flight" or "walk"
    images: [
      "/images/trips/{slug}/second-stop-1.webp",
      "/images/trips/{slug}/second-stop-2.webp",
    ],
  },
  // ... more stops
];

// ── English ──────────────────────────────────────────────────

export const stopsEn: StoryStop[] = [
  {
    id: "stop-id-here", // Same IDs as Japanese
    title: "🛫 Place Name — Subtitle",
    description:
      "English description. 2-4 sentences, narrative style.",
    coordinates: [35.6762, 139.6503], // Same coordinates
    zoom: 12, // Same zoom
    images: ["/images/trips/{slug}/stop-id-here-1.webp"], // Same images
  },
  {
    id: "second-stop",
    title: "🏔️ Second Place",
    description:
      "Description.",
    coordinates: [35.3606, 138.7274],
    zoom: 14,
    pathType: "drive", // Same pathType
    images: [
      "/images/trips/{slug}/second-stop-1.webp",
      "/images/trips/{slug}/second-stop-2.webp",
    ],
  },
  // ... more stops
];
```

## Rules

- `id`: URL-safe, lowercase, hyphens only (e.g., `pike-place`, `space-needle`)
- `title`: Format is `"emoji PlaceName — Subtitle"` (subtitle after em-dash is optional, rendered smaller)
- `coordinates`: `[latitude, longitude]` — Leaflet order
- `zoom`: 5 = continent, 9 = region, 12 = city, 14 = neighborhood, 16 = building
- `pathType`: How to travel **TO** this stop. First stop has none.
  - `flight`: Great-circle arc (long-distance air travel)
  - `drive`: Catmull-Rom spline (car, bus, train)
  - `walk`: Catmull-Rom spline (short distances)
- `images`: Array of `/images/trips/{slug}/{stop-id}-{n}.webp` paths. Shared across locales.
- Both `stopsJa` and `stopsEn` must have identical `id`, `coordinates`, `zoom`, `pathType`, and `images`. Only `title` and `description` differ.
