// Refresh the bundled copies of the humanizer guides from their canonical
// location at imoz.jp. The copies live in ../references/ and are committed so
// the skill works offline; run this script only to pick up upstream changes,
// then review and commit the diff.
//
// Usage: node .github/skills/humanizer/scripts/fetch-guides.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GUIDES = {
  ja: "https://imoz.jp/humanizer.ja.txt",
  en: "https://imoz.jp/humanizer.en.txt",
};

const here = path.dirname(fileURLToPath(import.meta.url));
const refDir = path.resolve(here, "..", "references");

fs.mkdirSync(refDir, { recursive: true });

for (const [locale, url] of Object.entries(GUIDES)) {
  const dest = path.join(refDir, `humanizer.${locale}.txt`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const before = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : null;
    if (before === text) {
      console.log(`unchanged ${dest}`);
      continue;
    }
    fs.writeFileSync(dest, text, "utf8");
    console.log(`updated   ${dest} (${text.length} chars)`);
  } catch (err) {
    console.error(`error: ${url} failed (${err.message}); keeping ${dest}`);
    process.exitCode = 1;
  }
}
