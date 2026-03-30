# Project Guidelines

## Overview

Personal blog & portfolio site for Yoichi Ozaki (尾崎 耀一), hosted on GitHub Pages.

## Tech Stack

- **Next.js 16** (App Router) — Static export (`output: "export"`)
- **React 19** / **TypeScript 5**
- **Tailwind CSS v4** + `@tailwindcss/typography`
- **MDX** via `next-mdx-remote/rsc` v6 (React Server Components)
- **rehype-pretty-code** (Shiki) — Dual-theme syntax highlighting (github-light / github-dark)
- **next-intl** — i18n (ja / en, default: ja)
- **GitHub Pages** — Deploy via GitHub Actions

## Architecture

```
src/app/[locale]/       → Locale-scoped pages (App Router)
src/components/         → Shared React components
src/lib/blog.ts         → Blog post loader (reads content/blog/{locale}/*.mdx)
src/i18n/               → Locale config & dictionary loader
src/data/projects.ts    → Portfolio project data
content/blog/{locale}/  → MDX blog posts (ja/, en/)
messages/{locale}.json  → UI translation strings
```

- Path alias: `@/` → `./src/`
- All pages are statically generated — no server-side features (no API routes, no middleware)
- Images must use `unoptimized: true` (GitHub Pages constraint)

## Build & Deploy

```sh
npm run dev    # Local dev server
npm run build  # Static export to out/
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
- Code blocks in MDX get automatic syntax highlighting and a copy button via `CopyCodeBlock`

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
