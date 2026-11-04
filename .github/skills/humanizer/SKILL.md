---
name: humanizer
description: "Revise MDX blog posts so they follow the imoz.jp humanizer writing guides (humanizer.ja.txt / humanizer.en.txt): remove AI-like padding, repeated explanations, defensive caveats, vague praise and mechanical structure while preserving facts and the author's voice. Use when: humanize article, 推敲, 文章を自然に, AIっぽい文章を直す, humanizer, rewrite for readability, polish prose, 長音表記を揃える."
argument-hint: "Path(s) to the MDX file(s) to revise (e.g., 'content/blog/ja/garbage-collection.mdx'), or 'all'"
---

# Humanizer — Article Revision Workflow

Revise blog articles so they read as clear, first-pass-understandable prose,
following the two guides by imoz.jp:

- Japanese: <https://imoz.jp/humanizer.ja.txt>
- English: <https://imoz.jp/humanizer.en.txt>

The guides are the source of truth. Full copies are bundled in `references/`
(`humanizer.ja.txt`, `humanizer.en.txt`) so the skill works offline; the
canonical versions are published by the author at the URLs above.
The short checklists in `references/` are paraphrased indexes for locating
problems — they do not replace a full reading of the guide.

## Step 0: Load the guides

Read the bundled guide for each language you edit:

- [references/humanizer.ja.txt](references/humanizer.ja.txt)
- [references/humanizer.en.txt](references/humanizer.en.txt)

**Read the whole guide** before diagnosing anything; the guides say so
explicitly. To pick up upstream changes, refresh the copies and commit the diff:

```powershell
node .github/skills/humanizer/scripts/fetch-guides.mjs
```

If Node or network access is unavailable, fetch the URLs above with a
web-fetch tool instead.

## Step 1–5: The guide's workflow

Both guides prescribe the same loop. Follow it per article:

1. **Organize** — reader, purpose, the article's central question and answer,
   what the reader should be able to explain/decide afterwards. For revisions,
   respect the current draft's intent and the requested scope.
2. **Diagnose** — scan the whole scope against the guide and its final
   checklist ("執筆後の確認事項" / "Editing and review"). List each candidate
   with location, problem, and fix. Do not edit yet.
   `scripts/scan-patterns.mjs` helps locate candidates, but every hit must be
   judged in context — never auto-replace by search hits.
3. **Revise** — accept or reject each candidate, then edit.
4. **Compare** — diff against the draft you received. Subject, conditions,
   quantities, comparison direction, causality, attribution and claim strength
   must be unchanged unless you are correcting a verified error. Revert edits
   that do not clearly improve accuracy, naturalness, or ease of reading.
5. **Read through** — read the result as a standalone article.

If stage 4 or 5 finds a problem, go back to stage 2 for that passage and
repeat. Finish only when a fresh pass finds nothing new. Report progress and
unresolved items in the chat response, **never inside the article or HTML
comments**.

## Repository-specific constraints

- **Bilingual pairs**: every post exists in `content/blog/ja/` and
  `content/blog/en/` with the same slug. Each version may be organized for its
  own readers, but facts, definitions, the author's position, and claim
  strength/conditions must match. If you correct a fact in one language, apply
  the same correction to the other.
- **Structure parity**: `node scripts/audit-blog.mjs` compares h2/h3 headings,
  code fences, mermaid blocks and tables between ja and en. Do not add or
  remove headings, fences, or tables in only one language.
- **Do not touch**: code inside fenced blocks (except prose inside mermaid
  labels), inline code, identifiers, URLs, slugs, frontmatter `date`/`tags`,
  JSX component names and non-text props, explicit heading `id` anchors, and
  quoted material/proper nouns.
- **MDX safety**: every fence keeps a language tag; `{`/`}` and `<` in prose
  must stay escaped as they were; keep `<strong>` for CJK bold.
- **No invented content**: do not add experiences, measurements, sources, or
  verification work that the author did not do.
- **Tests that pin article text**: `src/lib/*-article.test.ts` assert exact
  strings in several posts. Run them after editing; if a revision must change
  a pinned string, update the test only when the new wording is clearly
  better and the meaning is unchanged.
- **Quoted sentences outside the article**: `src/lib/capability-map-sections.ts`
  quotes headings and sentences of `ai-industry-capital-to-fcf` verbatim
  (checked by `capability-map.test.ts`). When you reword a quoted sentence or
  heading, update the quote in the same change.
- **Long vowels (ja)**: follow the guide's 長音 rule (サーバー, ユーザー,
  メモリー, ライブラリー, パラメーター, セキュリティー …; but データ, キー,
  エネルギー, アーキテクチャ). Keep product names, quotations, and code as is.
  Japanese UI strings in `src/components/interactive/` and
  `src/lib/capability-map*.ts` use the same notation, so an article and its
  figures agree.
- Out of scope unless asked: the logic and layout of interactive components,
  and generated video transcripts (`video/narration/`,
  `src/data/article-videos.json`), which must match the rendered audio.
  Trip-article prose lives in `src/data/trips/{slug}.ts` and **is** in scope
  when revising that trip post.

## Validation

```powershell
node scripts/mdx-check-all.mjs                 # every MDX file compiles
node scripts/audit-blog.mjs                    # fences, links, ja/en parity
node node_modules/vitest/vitest.mjs run src/lib # article-pinning tests
npm run build                                  # full static export
```

## Helper scripts

| Script | Purpose |
| --- | --- |
| `scripts/fetch-guides.mjs` | Refresh the bundled guide copies in `references/` from imoz.jp |
| `scripts/scan-patterns.mjs` | Read-only locator for common patterns (ja/en) and missing long vowels. Usage: `node .github/skills/humanizer/scripts/scan-patterns.mjs [--lang ja\|en] [--summary] [files...]` |

## References

- [references/checklist-ja.md](references/checklist-ja.md) — condensed Japanese checklist
- [references/checklist-en.md](references/checklist-en.md) — condensed English checklist
- [references/humanizer.ja.txt](references/humanizer.ja.txt) — full Japanese guide (copy of <https://imoz.jp/humanizer.ja.txt>)
- [references/humanizer.en.txt](references/humanizer.en.txt) — full English guide (copy of <https://imoz.jp/humanizer.en.txt>)
