---
description: "Use when creating interactive/animated components for MDX blog posts. Covers the InteractiveDemo system, useStepPlayer hook, component registration, and MDX gotchas."
applyTo: "src/components/interactive/**/*.tsx"
---
# Interactive Article Guidelines

## Architecture

Interactive components live in `src/components/interactive/`:

```
src/components/interactive/
  index.ts                 → Public exports
  InteractiveDemo.tsx      → Styled container (breaks out of prose)
  StepPlayerControls.tsx   → Play/pause/step/reset UI
  useStepPlayer.ts         → Reusable step-animation hook
  GoRoutineVisualizer.tsx  → Example: Go scheduler GMP demo
```

All interactive components are **client components** (`"use client"`).

## Creating a New Interactive Component

### 1. Build the component

Create `src/components/interactive/MyVisualizer.tsx`:

```tsx
"use client";

import { InteractiveDemo, StepPlayerControls, useStepPlayer } from "@/components/interactive";

type MyVisualizerProps = { locale?: string };

export function MyVisualizer({ locale = "ja" }: MyVisualizerProps) {
  const steps = [ /* your step data */ ];
  const player = useStepPlayer({ totalSteps: steps.length, intervalMs: 1000 });
  const current = steps[player.step];

  return (
    <InteractiveDemo title="Demo Title" description="Description text">
      {/* Your visualization */}
      <div>{current.label}</div>
      <StepPlayerControls {...player} />
    </InteractiveDemo>
  );
}
```

### 2. Export from index.ts

```ts
export { MyVisualizer } from "./MyVisualizer";
```

### 3. Register in MDX components

In `src/app/[locale]/blog/[slug]/page.tsx`, add to `getMdxComponents()`:

```tsx
import { MyVisualizer } from "@/components/interactive";

function getMdxComponents(locale: string) {
  return {
    // ... existing components
    MyVisualizer: () => <MyVisualizer locale={locale} />,
  };
}
```

### 4. Use in MDX

```mdx
Text before the demo.

<MyVisualizer />

Text after the demo.
```

## Key Building Blocks

### `InteractiveDemo`

Styled container that breaks out of `prose` with `not-prose`. Use for all interactive content.

Props: `title?: string`, `description?: string`, `children: ReactNode`

### `useStepPlayer(options)`

Hook for step-based animations.

Options:
- `totalSteps: number` — total number of steps
- `intervalMs?: number` — auto-play interval (default: 600ms)
- `loop?: boolean` — loop at the end (default: false)

Returns: `{ step, playing, isFirst, isLast, play, pause, reset, stepForward, stepBackward, goTo, totalSteps }`

### `StepPlayerControls`

UI component that renders play/pause, step, reset buttons, a progress bar, and optional step dots (shown when ≤20 steps). Spread `useStepPlayer()` return value as props.

Optional prop: `label?: (step: number) => string` — shows step description text.

## MDX Gotchas

### Always use language tags on code blocks

````md
<!-- BAD: MDX parser interprets {} as JSX -->
```
if x == 0 { ... }
```

<!-- GOOD: language tag prevents JSX parsing -->
```go
if x == 0 { ... }
```

<!-- GOOD: use `text` for non-code blocks -->
```text
State A → State B → State C
```
````

### Component must be self-closing or have matching tags

```mdx
<!-- GOOD -->
<MyVisualizer />

<!-- BAD — don't pass children unless the component accepts them -->
<MyVisualizer>something</MyVisualizer>
```

### Locale handling

Interactive components that display text should accept a `locale` prop. The MDX component registration in `getMdxComponents()` passes locale via a wrapper:

```tsx
MyVisualizer: () => <MyVisualizer locale={locale} />,
```

## Citing Source Code

When quoting source code from external projects (e.g., Go runtime), always link to the upstream repository:

```mdx
Goroutine の実態は [`runtime/runtime2.go`](https://github.com/golang/go/blob/master/src/runtime/runtime2.go) に定義された構造体です。
```

For code block comments, include the URL:

````mdx
```go
// runtime/signal_unix.go — https://github.com/golang/go/blob/master/src/runtime/signal_unix.go
func doSigPreempt(gp *g, ctxt *sigctxt) {
```
````

## Bilingual

As with all blog posts, interactive articles must exist in both `content/blog/ja/` and `content/blog/en/` with the same slug. Use `locale` prop to switch description text inside the component.
