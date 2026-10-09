# Project Guidelines

## Overview

Personal blog & portfolio site for Yoichi Ozaki (尾崎 耀一), hosted on GitHub Pages.

## Tech Stack

- **Next.js 16** (App Router) — Static export (`output: "export"`)
- **React 19** / **TypeScript 5**
- **Tailwind CSS v4** + `@tailwindcss/typography`
- **MDX** via `next-mdx-remote/rsc` v6 (React Server Components)
- **rehype-pretty-code** (Shiki) — Dual-theme syntax highlighting (github-light / github-dark)
- **Mermaid** — Client-side diagram rendering (dark/light theme aware via ThemeProvider)
- **next-intl** — i18n (ja / en, default: ja)
- **GitHub Pages** — Deploy via GitHub Actions

## Architecture

```
src/app/[locale]/             → Locale-scoped pages (App Router)
src/components/               → Shared React components
src/components/interactive/   → Interactive article components (client-side)
src/lib/blog.ts               → Blog post loader (reads content/blog/{locale}/*.mdx)
src/i18n/                     → Locale config & dictionary loader
src/data/projects.ts          → Portfolio project data
src/data/article-videos.json  → Generated metadata for embedded explainer videos
content/blog/{locale}/        → MDX blog posts (ja/, en/)
messages/{locale}.json        → UI translation strings
video/                        → Remotion sub-project that renders the article videos (own package.json)
```

- Path alias: `@/` → `./src/`
- All pages are statically generated — no server-side features (no API routes, no middleware)
- Images must use `unoptimized: true` (GitHub Pages constraint)

## Build & Deploy

```sh
npm run dev    # Local dev server
npm run build  # next build → out/
npm run lint   # ESLint
```

- Push to `main` triggers `.github/workflows/deploy.yml` → builds & deploys to GitHub Pages
- New blog posts can be created via `node scripts/generate-post.mjs`

## Conventions

### Blog Posts

Frontmatter format (content/blog/{locale}/*.mdx):

```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
description: "Short description"
tags: ["Tag1", "Tag2"]
---
```

- Every post needs both `ja/` and `en/` versions with the same slug
- MDX custom components are wired through `src/app/[locale]/blog/[slug]/page.tsx`
- Code blocks in MDX get automatic syntax highlighting and a copy button via `CodeBlock` (wraps `CopyCodeBlock`)
- Mermaid code blocks (` ```mermaid `) are rendered client-side as SVG diagrams (theme-aware, no build step needed)
- **Code blocks must always have a language tag** (e.g., `go`, `text`) — untagged blocks cause MDX to interpret `{}` as JSX
- Interactive components from `src/components/interactive/` can be used as MDX tags (e.g., `<GoRoutineVisualizer />`)
- When quoting external source code, always link to the upstream repository

### Styling

- Use Tailwind utility classes; avoid custom CSS unless necessary
- Light/dark theme via `.dark` class (ThemeProvider) + CSS custom properties in `globals.css`
- Prose content: use `prose prose-neutral dark:prose-invert` classes
- Shiki themes use CSS variables (`--shiki-light` / `--shiki-dark`) — no JS toggling

### i18n

- All UI strings in `messages/ja.json` and `messages/en.json`
- Locale type: `"ja" | "en"` (defined in `src/i18n/config.ts`)
- URL pattern: `/{locale}/...`

### Components

- Client components must have `"use client"` directive
- Server Components are the default — prefer them unless interactivity is needed

## Important Gotchas

- **Next.js 16 breaking changes**: Read `node_modules/next/dist/docs/` before using unfamiliar APIs. `params` is now a Promise in page/layout components.
- **Static export only**: No `getServerSideProps`, no API routes, no middleware, no `revalidate`. Only `generateStaticParams` for dynamic routes.
- **Tailwind CSS v4**: Uses `@import "tailwindcss"` and `@plugin` syntax, NOT the v3 `@tailwind` directives or `tailwind.config.js`.

## Custom Skills & Agents

### Storytelling Map

- **Skill**: `.github/skills/storytelling-map/SKILL.md` — Step-by-step workflow for creating scroll-driven map travel articles
- **Agent**: `.github/agents/storytelling-map-producer.agent.md` — Interactive guide that walks through the full creation process
- **Component**: `src/components/StorytellingMap.tsx` — Leaflet-based scroll-driven map with image slideshow
- **Lazy wrapper**: `src/components/StorytellingMapLazy.tsx` — Per-trip wrapper components (SSR-safe)
- **Trip data**: `src/data/trips/{slug}.ts` — Bilingual stop data (stopsJa/stopsEn)
- **Images**: `public/images/trips/{slug}/` — WebP photos named `{stop-id}-{n}.webp`

### Interactive Articles

- **Instruction**: `.github/instructions/interactive-articles.instructions.md` — Full guide for creating step-based interactive visualizations in MDX
- **Container**: `src/components/interactive/InteractiveDemo.tsx` — Styled wrapper that breaks out of prose
- **Hook**: `src/components/interactive/useStepPlayer.ts` — Reusable play/pause/step/reset animation logic
- **Controls**: `src/components/interactive/StepPlayerControls.tsx` — Playback UI (progress bar, buttons, step dots)
- **Example**: `src/components/interactive/GoRoutineVisualizer.tsx` — Go scheduler G/M/P demo (14 steps)
- New components are registered in `src/app/[locale]/blog/[slug]/page.tsx` via `getMdxComponents()`

### Content Reviewer

- **Skill**: `.github/skills/content-reviewer/SKILL.md` — Systematic technical accuracy review workflow for blog articles
- **Agent**: `.github/agents/content-reviewer.agent.md` — Automated reviewer that checks algorithms, pseudocode, language-specific claims, diagrams, and bilingual consistency

### Mermaid Diagrams

- **CodeBlock**: `src/components/CodeBlock.tsx` — `pre` override that detects `data-language="mermaid"` and delegates to Mermaid component; otherwise renders CopyCodeBlock
- **Mermaid**: `src/components/Mermaid.tsx` — Client component that dynamically imports mermaid, renders SVG with dark/light theme support via `useTheme()`, `securityLevel: "strict"`
- **Dark mode**: Mermaid re-renders automatically when theme toggles (via `useTheme()` + `useEffect` dependency)
- **Usage in MDX**: Simply use a ` ```mermaid ` fenced code block — no imports or custom components needed

### Article Videos

- **Usage in MDX**: `<ArticleVideo slug="database-indexing" />` (add it to both `ja/` and `en/`; it renders nothing until the video exists)
- **Component**: `src/components/ArticleVideo.tsx` — Server component: `<video>` with poster, duration and a collapsible transcript; UI strings in `messages/*.json` (`articleVideo`)
- **Assets**: `public/videos/{slug}/{ja,en}.mp4` + `.jpg` posters, metadata in `src/data/article-videos.json` — all generated by `node video/scripts/render.mjs`; do not edit by hand
- **Pipeline**: `video/` — narration scripts (`video/narration/{slug}.json`), local Kokoro TTS (`video/tts/`), Remotion scenes (`video/src/articles/{slug}/`); see `video/README.md`
- `video/` is excluded from the site's `tsconfig.json` and ESLint config; it is never built by `npm run build`
