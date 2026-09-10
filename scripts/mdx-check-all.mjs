import fs from "node:fs";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
const root = "C:/Users/oaz77/source/repos/yoichiozaki.github.io";
let bad = 0, n = 0;
for (const loc of ["ja", "en"]) {
  const dir = path.join(root, "content/blog", loc);
  for (const name of fs.readdirSync(dir).filter(f => f.endsWith(".mdx"))) {
    n++;
    let raw = fs.readFileSync(path.join(dir, name), "utf8");
    raw = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
    try {
      await compile(raw, { remarkPlugins: [remarkGfm, remarkMath] });
    } catch (e) {
      bad++;
      console.log(`FAIL ${loc}/${name} :: ${e.message}${e.line ? ` (line ~${e.line})` : ""}`);
    }
  }
}
console.log(`\nchecked ${n} files, ${bad} failing`);
