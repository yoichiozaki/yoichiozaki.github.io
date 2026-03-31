---
name: storytelling-map
description: "Create a new Storytelling Map blog post with scroll-driven map animation and photos. Use when: new trip post, travel blog, storytelling map, add trip, create map article, 旅行記事, 新しい旅行記."
argument-hint: "Trip name (e.g., 'tokyo-osaka-2026')"
---

# Storytelling Map — New Trip Article Workflow

Create a scroll-driven storytelling map blog post with photos, bilingual content (ja/en), and Leaflet map animation.

## Overview

A Storytelling Map article consists of:
1. **Trip data file** — Stop locations, descriptions, images for ja/en
2. **Wrapper component** — Lazy-loaded map component for the trip
3. **Blog post MDX files** — ja/ and en/ versions referencing the component
4. **Optimized images** — WebP photos organized by stop ID
5. **Wiring** — Register the component in the MDX component map

## Procedure

Follow these steps in order. After each step, confirm with the user before proceeding.

### Step 1: Gather Trip Information

Ask the user for:
- **Trip name/slug** (e.g., `tokyo-osaka-2026`) — used for filenames and paths
- **List of stops** with:
  - Place name (and emoji icon)
  - GPS coordinates `[lat, lng]`
  - Zoom level (5 = region, 9 = area, 14-16 = city/landmark)
  - Travel mode to this stop: `flight`, `drive`, or `walk`
- **Path color** (default: `#0ea5e9`)

### Step 2: Create Trip Data File

Create `src/data/trips/{slug}.ts` following the template in [references/data-template.md](./references/data-template.md).

Key rules:
- Export `stopsJa` and `stopsEn` arrays of type `StoryStop`
- Import type from `@/components/StorytellingMap`
- Both arrays must have the same stop IDs, coordinates, zoom, and pathType
- Images are shared between locales (language-agnostic)
- Image paths: `/images/trips/{slug}/{stop-id}-{n}.webp`
- First stop has no `pathType` (it's the origin)

### Step 3: Create Wrapper Component

Add the trip's wrapper function to `src/components/StorytellingMapLazy.tsx`:

```tsx
import { stopsJa as {camel}Ja, stopsEn as {camel}En } from "@/data/trips/{slug}";

export function {PascalName}Map({ locale }: { locale?: string }) {
  const stops = locale === "en" ? {camel}En : {camel}Ja;
  return <StorytellingMap stops={stops} pathColor="{color}" />;
}
```

### Step 4: Register in MDX Components

In `src/app/[locale]/blog/[slug]/page.tsx`:

1. Import the new wrapper component
2. Add it to `getMdxComponents()`:
   ```tsx
   {PascalName}Map: () => <{PascalName}Map locale={locale} />,
   ```

### Step 5: Create Blog Post MDX Files

Create both `content/blog/ja/{slug}.mdx` and `content/blog/en/{slug}.mdx`.

Frontmatter template:
```yaml
---
title: "{Title}"
date: "YYYY-MM-DD"
description: "{Short description}"
tags: ["旅行", "Storytelling Map", ...]
---

<{PascalName}Map />
```

### Step 6: Process Images

Ask the user to place photos as JPG/PNG in `public/images/trips/{slug}/`.

Naming convention: `{stop-id}-{n}.jpg` (e.g., `pike-place-1.jpg`, `pike-place-2.jpg`)

Convert to WebP:
```sh
npx sharp-cli -i {src} -o {dst} --format webp --quality 80
```

Then delete the original JPG/PNG files.

### Step 7: Update Data File with Image Paths

Add `images` arrays to each stop in both `stopsJa` and `stopsEn`:
```ts
images: [
  "/images/trips/{slug}/{stop-id}-1.webp",
  "/images/trips/{slug}/{stop-id}-2.webp",
],
```

### Step 8: Write Descriptions

Ask the user for descriptions or draft them based on context. Each stop needs:
- Japanese description (2-4 sentences, narrative style)
- English description (matching content, natural English)

### Step 9: Verify

1. Run `npm run build` to confirm no errors
2. Run `npm run dev` and check the article in browser
3. Verify: map animation, image display, scroll sync, bilingual content

## StoryStop Type Reference

```typescript
type StoryStop = {
  id: string;                        // URL-safe identifier
  title: string;                     // "🏔️ Mount Fuji — Sunrise"
  description: string;               // 2-4 sentences narrative
  coordinates: [number, number];     // [latitude, longitude]
  zoom?: number;                     // Map zoom (default ~12)
  images?: string[];                 // WebP paths in public/
  pathType?: "flight" | "drive" | "walk";  // Travel mode TO this stop
};
```

## Conventions

- **Images**: Always WebP, quality 80, no resize. Named `{stop-id}-{n}.webp`
- **Coordinates**: `[lat, lng]` — note Leaflet uses this order (not `[lng, lat]`)
- **Path types**: First stop has no pathType. Use `flight` for air travel, `drive` for car/bus, `walk` for walking
- **Components**: All map wrappers go in `StorytellingMapLazy.tsx`, dynamically imported
- **Zoom levels**: 5 = continent/country, 9 = region, 14 = city, 16 = building
