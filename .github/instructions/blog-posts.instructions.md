---
description: "Use when creating or editing MDX blog posts in content/blog/. Covers frontmatter format, bilingual requirements, and MDX component usage."
applyTo: "content/blog/**/*.mdx"
---
# Blog Post Guidelines

## Frontmatter (required)

```yaml
---
title: "Post Title"
date: "YYYY-MM-DD"
description: "Short description for SEO and blog list"
tags: ["Tag1", "Tag2"]
---
```

All four fields are required.

## Bilingual

Every post must exist in both `content/blog/ja/` and `content/blog/en/` with the **same filename** (slug).

## MDX Components

Custom components available in blog posts are registered in `src/app/[locale]/blog/[slug]/page.tsx` via `mdxComponents`. Currently `pre` is overridden by `CopyCodeBlock` for copy-button support.

## Code Blocks

Use fenced code blocks with a language identifier for syntax highlighting:

````md
```typescript
const x = 1;
```
````

rehype-pretty-code (Shiki) handles highlighting at build time.
