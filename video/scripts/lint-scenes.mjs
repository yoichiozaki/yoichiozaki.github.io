// Flag font sizes that will be unreadable once the 1920×1080 video is shown in the blog's
// ~720 px wide article column (≈0.375× scale: 24 px → 9 px on screen).
//
//   node scripts/lint-scenes.mjs [<slug> ...]      (no slug = all videos)
//
// Reports every `fontSize` / Chip `size` literal below MIN in src/articles/<slug>/**/*.tsx.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { VIDEO_DIR } from "./lib.mjs";

const MIN = 22;
const ARTICLES = join(VIDEO_DIR, "src", "articles");
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(ARTICLES);

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith(".tsx") ? [path] : [];
  });
}

let total = 0;
for (const slug of slugs) {
  const hits = [];
  for (const file of files(join(ARTICLES, slug))) {
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        // fontSize: 18 · fontSize={18} · fontSize: lang === "ja" ? 20 : 18 · <Chip size={18}>
        for (const match of line.matchAll(/\b(fontSize|size)\s*[:=]\s*\{?([^,}\n;]*)/g)) {
          const small = (match[2].match(/\b\d+(?:\.\d+)?\b/g) ?? []).map(Number).filter((n) => n >= 6 && n < MIN);
          if (small.length) hits.push(`${relative(VIDEO_DIR, file)}:${i + 1}  ${match[1]} ${small.join(", ")}  ${line.trim().slice(0, 90)}`);
        }
      });
  }
  total += hits.length;
  console.log(`${slug}: ${hits.length ? `${hits.length} font size(s) below ${MIN} px` : "ok"}`);
  for (const hit of hits) console.log(`  ${hit}`);
}
process.exitCode = total ? 1 : 0;
