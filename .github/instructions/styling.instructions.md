---
description: "Use when editing Tailwind CSS styles, globals.css, or theme configuration. Covers Tailwind v4 syntax, dark mode, and Shiki code highlighting styles."
applyTo: "src/app/globals.css"
---
# Styling Guidelines

## Tailwind CSS v4

This project uses Tailwind v4 — **not v3**:
- Import: `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Plugins: `@plugin "@tailwindcss/typography"` (not `tailwind.config.js`)
- No `tailwind.config.js` file exists

## Theme System

- Light/dark toggle via `.dark` class on `<html>` element (ThemeProvider)
- CSS custom properties in `:root` (light) and `.dark` (dark) selectors
- `@theme inline` block maps CSS vars to Tailwind theme tokens

## Code Block Highlighting

Shiki (rehype-pretty-code) uses CSS variable approach for dual themes:
- `--shiki-light` / `--shiki-light-bg` — light mode colors
- `--shiki-dark` / `--shiki-dark-bg` — dark mode colors
- Switching is done via CSS selectors on `html.dark`, not JavaScript
