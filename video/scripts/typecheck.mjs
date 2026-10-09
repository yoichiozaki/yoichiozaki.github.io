// Type-check the shared kit plus one video's scenes, isolated from other videos in progress.
// Usage: node scripts/typecheck.mjs <slug>
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VIDEO_DIR } from "./lib.mjs";

const slug = process.argv[2];
if (!slug) throw new Error("Usage: node scripts/typecheck.mjs <slug>");

const config = join(VIDEO_DIR, `.tsconfig.${slug}.json`);
writeFileSync(config, JSON.stringify({ extends: "./tsconfig.json", include: ["src/kit/**/*", `src/articles/${slug}/**/*`] }, null, 2));
try {
  execFileSync(process.execPath, [join(VIDEO_DIR, "node_modules", "typescript", "bin", "tsc"), "--noEmit", "-p", config], {
    cwd: VIDEO_DIR,
    stdio: "inherit",
  });
  console.log(`✓ ${slug} type-checks`);
} catch {
  process.exitCode = 1;
} finally {
  rmSync(config, { force: true });
}
