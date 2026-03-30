---
description: "Use when editing Next.js pages, layouts, or route files. Covers static export constraints, params handling, and App Router patterns for Next.js 16."
applyTo: "src/app/**/*.tsx"
---
# Next.js Page Guidelines

## Next.js 16 Breaking Changes

- `params` and `searchParams` are **Promises** — always `await params` in page/layout components
- Read `node_modules/next/dist/docs/` before using unfamiliar APIs

## Static Export Constraints

This site uses `output: "export"` for GitHub Pages:

- No `getServerSideProps`, no API routes, no middleware, no `revalidate`
- Dynamic routes must use `generateStaticParams`
- Images: `unoptimized: true` (no Next.js Image Optimization)

## i18n

All pages are under `[locale]/`. The locale parameter is `"ja" | "en"`.
Use `getDictionary(locale)` from `@/i18n/dictionaries` for UI strings.

## Components

- Server Components are the default
- Client components require `"use client"` directive
- Prefer Server Components unless interactivity (state, effects, event handlers) is needed
