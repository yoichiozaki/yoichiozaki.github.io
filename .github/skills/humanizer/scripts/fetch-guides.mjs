// Download the canonical humanizer guides into a git-ignored cache so the
// workflow can read them in full. The guides are published by their author at
// imoz.jp and are not redistributed in this repository.
//
// Usage: node .github/skills/humanizer/scripts/fetch-guides.mjs [--force]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GUIDES = {
  ja: "https://imoz.jp/humanizer.ja.txt",
  en: "https://imoz.jp/humanizer.en.txt",
};
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

const here = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.resolve(here, "..", ".cache");
const force = process.argv.includes("--force");

fs.mkdirSync(cacheDir, { recursive: true });

for (const [locale, url] of Object.entries(GUIDES)) {
  const dest = path.join(cacheDir, `humanizer.${locale}.txt`);
  const fresh =
    fs.existsSync(dest) && Date.now() - fs.statSync(dest).mtimeMs < MAX_AGE_MS;
  if (fresh && !force) {
    console.log(`cached  ${dest}`);
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    fs.writeFileSync(dest, text, "utf8");
    console.log(`fetched ${url} -> ${dest} (${text.length} chars)`);
  } catch (err) {
    if (fs.existsSync(dest)) {
      console.warn(`warning: ${url} failed (${err.message}); using stale ${dest}`);
    } else {
      console.error(`error: ${url} failed (${err.message}) and no cached copy exists`);
      process.exitCode = 1;
    }
  }
}
