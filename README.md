This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Storytelling Map

The Seattle/Vancouver travel diary uses [StorytellingMap](src/components/StorytellingMap.tsx) in both languages.
Scroll timing comes from the unpinned stop wrappers, with a reading line below the header (and below the map on mobile).
Photos advance while the camera stays at their stop; the final 70% of a viewport, capped at half the stop's height, is reserved for travel to the next stop.
Each additional photo adds half a viewport of reading space. The active card changes halfway through travel, and the progress bar reaches completion at the final destination.
Tile updates are throttled against the actual camera position, including a trailing update when scrolling stops, so large zoom changes cannot leave the map blank.

Timing and flight-zoom regression tests live alongside the shared [map utilities](src/lib/storytelling-map-utils.ts):

```bash
npm run test -- src/lib/storytelling-map-utils.test.ts
```

## Algebraic data types article

The practical ADT article is available in [Japanese](content/blog/ja/algebraic-data-types-in-practice.mdx)
and [English](content/blog/en/algebraic-data-types-in-practice.mdx).
Its four [interactive experiments](src/components/interactive/ADTLabs.tsx) share a
[pure TypeScript model](src/lib/algebraic-data-types.ts).
UI text lives in the `adt` section of the locale message files.

```bash
npm run test -- src/lib/algebraic-data-types.test.ts src/lib/algebraic-data-types-article.test.ts
```

These tests cover all eight request-presence combinations, input validation, and all six
order/event combinations. They also type-check the compiler experiment with the installed
TypeScript compiler, verify the article's intentional type errors, and compare the article's
model declarations with the code used by the demos. The browser displays these tested
compiler scenarios; it does not download or execute the TypeScript compiler.
The order demo records example outcomes only: it makes no payments or network requests.
The article's tables use keyboard-focusable horizontal scroll regions. Their MDX attributes
are literals (`tabIndex="0"`), so they survive the serializer's default JavaScript-expression
filter. A regression test checks this using the actual MDX serializer without disabling that filter.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
