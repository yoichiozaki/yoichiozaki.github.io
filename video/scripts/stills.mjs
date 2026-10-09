// Render several stills of one composition in a single browser session (for visual QA).
// Usage: node scripts/stills.mjs <compositionId> <frame> [<frame> ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { VIDEO_DIR } from "./lib.mjs";

const [id, ...frames] = process.argv.slice(2);
const outDir = join(VIDEO_DIR, "out", "stills");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(VIDEO_DIR, "src", "index.ts"), publicDir: join(VIDEO_DIR, "public") });
const composition = await selectComposition({ serveUrl, id, inputProps: {} });
for (const f of frames) {
  const output = join(outDir, `${id}-${f}.png`);
  await renderStill({ serveUrl, composition, frame: Number(f), output, inputProps: {}, scale: 0.5 });
  console.log(output);
}
