// Render stills of one composition for visual QA (half size, into out/stills/).
// Usage: node scripts/stills.mjs <slug>-<ja|en> <frame> [<frame> ...]
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { bundleVideo, splitId, VIDEO_DIR } from "./lib.mjs";

const [id, ...frames] = process.argv.slice(2);
const { slug, lang } = splitId(id);
if (frames.length === 0) throw new Error("Pass at least one frame number (see `node scripts/scenes.mjs <slug> <lang>`).");

const outDir = join(VIDEO_DIR, "out", "stills");
mkdirSync(outDir, { recursive: true });

const { serveUrl, cleanup } = await bundleVideo(slug);
try {
  const composition = await selectComposition({ serveUrl, id, inputProps: { lang } });
  for (const frame of frames.map(Number)) {
    const output = join(outDir, `${id}-${frame}.png`);
    await renderStill({ serveUrl, composition, frame, output, inputProps: { lang }, scale: 0.5 });
    console.log(output);
  }
} finally {
  cleanup();
}
