---
name: content-reviewer
description: "Review MDX blog post content for technical accuracy, correctness, and consistency. Use when: review article, accuracy check, 記事レビュー, 正確性チェック, fact check blog post."
argument-hint: "Path to the MDX file to review (e.g., 'content/blog/ja/garbage-collection.mdx')"
---

# Content Reviewer — Technical Accuracy Review Workflow

Systematically review a blog article's technical claims, code examples, pseudocode, diagrams, and language-specific details for accuracy.

## Overview

A content review produces:
1. **Issue list** — Each inaccuracy with severity, location, and correction
2. **Fixes applied** — Corrected content in the MDX file(s)
3. **Build verification** — Confirm the article still builds after edits

Severity levels:
- **Critical** — Factually wrong (incorrect algorithm, wrong output, misleading claim)
- **Major** — Partially wrong or missing important nuance that could mislead readers
- **Minor** — Imprecise wording, suboptimal example, or stylistic inaccuracy

## Procedure

### Step 1: Identify Scope

1. Read the target MDX file(s) — both ja/ and en/ versions if they exist
2. Identify the article's **domain topics** (e.g., GC algorithms, concurrency, data structures)
3. Note all technical claims that need verification:
   - Algorithm descriptions and step sequences
   - Pseudocode and code examples
   - Performance characteristics (Big-O, latency claims)
   - Historical facts (who invented what, when)
   - Language/runtime-specific implementation details
   - Numeric values (thresholds, sizes, ratios)
   - Diagram accuracy (taxonomy relationships, timelines)

### Step 2: Verify Algorithms & Pseudocode

For each algorithm or pseudocode block:
1. Check the **step ordering** — are operations in the correct sequence?
2. Verify **invariants** — does the pseudocode maintain stated properties?
3. Check **edge cases** — are boundary conditions handled correctly?
4. Compare against known canonical descriptions (textbooks, language specs, source code)

Common pitfalls:
- Write barrier ordering (e.g., Dijkstra: shade THEN store, not store then shade)
- Off-by-one in generation/threshold descriptions
- Confusing "mark" and "sweep" phase responsibilities
- Incorrect complexity claims

### Step 3: Verify Language/Runtime-Specific Claims

For each language or runtime discussed:
1. Check **GC strategy descriptions** against official documentation
2. Verify **configuration parameters** (names, default values, semantics)
3. Confirm **version-specific behavior** — note if behavior changed across versions
4. Check **terminology** matches official usage (e.g., "scavenge" vs "minor GC" vs "young generation collection")

Common pitfalls:
- Python: `gc.get_threshold()` returns collection frequency ratios, not object survival counts
- Go: GC trigger is based on heap growth ratio (`GOGC`), not fixed thresholds
- Java: G1 region sizes, ZGC colored pointers bit layout
- V8: Orinoco GC naming and phasing

### Step 4: Verify Diagrams & Visualizations

For each diagram or visualization component:
1. Check **taxonomy correctness** — are parent-child relationships accurate?
2. Verify **timeline ordering** — are events in the correct sequence?
3. Check **labels and annotations** — do they match the text description?
4. Identify **oversimplifications** — flag where a diagram might mislead
5. **Validate Mermaid rendering** — for each ` ```mermaid ` block, run it through `npx @mermaid-js/mermaid-cli@latest` or equivalent validation to confirm it parses without errors. Common Mermaid pitfalls:
   - `opt` is a reserved keyword in sequenceDiagram (used for optional blocks) — do NOT use it as a participant ID
   - Other reserved sequenceDiagram keywords to avoid as IDs: `loop`, `alt`, `else`, `end`, `par`, `critical`, `break`, `rect`, `note`
   - Angle brackets `<T>` in message text or labels are interpreted as HTML — remove or escape them
   - `style` fill colors with low contrast (e.g., `#e2e8f0`, `#bbf7d0`) are unreadable in dark mode — use medium-tone fills with explicit `color:` for text

Key rule: If a taxonomy shows X as a child of Y, confirm X is truly a subtype/variant of Y, not an orthogonal concept.

### Step 5: Verify Code Examples

For each code snippet:
1. Check **syntax correctness** — will the code compile/run?
2. Verify **output claims** — if "this prints X", confirm it actually does
3. Check **API usage** — are function signatures and return types correct?
4. Confirm **version compatibility** — note if APIs are deprecated or version-specific

### Step 6: Cross-Check Bilingual Consistency

If both ja/ and en/ versions exist:
1. Verify **technical content matches** — same algorithms, same numbers, same code
2. Check that **corrections are applied to both** versions
3. Note any **translation inaccuracies** in technical terms

### Step 7: Compile Findings

Present findings as a structured list:

```
## Review Findings

### Critical
1. [Location: line/section] — Description of issue → Correction

### Major
1. [Location: line/section] — Description of issue → Correction

### Minor
1. [Location: line/section] — Description of issue → Correction

### Verified OK
- [Topic] — Checked against [source], accurate
```

### Step 8: Apply Fixes

1. Fix all Critical and Major issues in both ja/ and en/ files
2. Discuss Minor issues with the user — fix if agreed
3. Use `<strong>` instead of `**` for bold text in MDX (CJK compatibility)

### Step 9: Verify Build

Run `npm run build` to confirm no regressions after edits.

## Key Rules

- NEVER guess — if unsure about a claim, flag it as "needs verification" and use web search
- ALWAYS check both ja/ and en/ versions
- ALWAYS preserve the article's overall structure and style when making corrections
- PREFER specific corrections with references over vague "this might be wrong"
- DO NOT rewrite sections unnecessarily — make minimal, targeted fixes
