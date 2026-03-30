---
description: "Use when creating or editing React components. Covers client vs server component rules, Tailwind styling, and dark mode patterns."
applyTo: "src/components/**/*.tsx"
---
# Component Guidelines

## Server vs Client Components

- **Server Components** are the default — no directive needed
- Add `"use client"` only when the component uses state, effects, event handlers, or browser APIs
- Keep client components small and leaf-level

## Styling

- Use Tailwind utility classes exclusively
- Dark mode: use `dark:` variant (theme is toggled via `.dark` class on `<html>`)
- For prose/markdown content: `prose prose-neutral dark:prose-invert`

## Theme-Aware Colors

Use CSS custom properties defined in `src/app/globals.css`:
- `bg-background`, `text-foreground` — main background/text
- `bg-muted`, `text-muted-foreground` — secondary surfaces
- `text-accent` — links and highlights
