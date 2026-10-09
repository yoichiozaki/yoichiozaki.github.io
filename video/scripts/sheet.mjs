// Contact sheet: one frame per scene, tiled into a single image for a quick layout review.
//
//   node scripts/sheet.mjs <slug>-<ja|en> [--mid] [--each]
//
// By default each tile is the moment the scene's narration ends (the scene is fully built);
// --mid picks the middle of the scene's narration instead. Writes out/sheets/<id>[-mid].png and
// prints how far down/right each scene's content reaches (warnings only for fully built scenes),
// whether anything later overlaps the scene title, and whether a diagram reaches into the caption
// band. --each additionally keeps a half-size
// close-up of every scene in out/sheets/<id>[-mid]/NN-<scene>.png (overlaps hide at sheet scale).
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { bundleVideo, loadTimeline, splitId, VIDEO_DIR } from "./lib.mjs";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const mid = args.includes("--mid");
const each = args.includes("--each");
const { slug, lang } = splitId(id);
const { timeline } = loadTimeline(slug, lang);

const picks = timeline.scenes.map((scene) => {
  const first = scene.segments[0];
  const last = scene.segments[scene.segments.length - 1];
  const end = last.from + last.durationInFrames;
  const frame = mid ? Math.round((first.from + end) / 2) : Math.min(end + 6, scene.from + scene.durationInFrames - 12);
  // Reference frame with the scene title fully in but little else, to detect later intrusions.
  return { scene: scene.id, frame, titleFrame: scene.from + 26 };
});

const COLUMNS = 4;
const rows = Math.ceil(picks.length / COLUMNS);
const tileDir = join(VIDEO_DIR, "out", "sheets", `${id}${mid ? "-mid" : ""}`);
rmSync(tileDir, { recursive: true, force: true });
mkdirSync(tileDir, { recursive: true });

const { serveUrl, cleanup } = await bundleVideo(slug);
const warnings = [];
const titleWarnings = [];
const bandWarnings = [];
try {
  const composition = await selectComposition({ serveUrl, id, inputProps: { lang } });
  // Caption-free variant of the same frames, to see whether diagrams reach into the caption band.
  const bare = await selectComposition({ serveUrl, id, inputProps: { lang, poster: true } });
  for (const [i, pick] of picks.entries()) {
    const output = join(tileDir, `${String(i).padStart(2, "0")}.png`);
    await renderStill({ serveUrl, composition, frame: pick.frame, output, inputProps: { lang }, scale: 0.25 });
    if (each) {
      const closeUp = join(tileDir, `${String(i + 1).padStart(2, "0")}-${pick.scene}.png`);
      await renderStill({ serveUrl, composition, frame: pick.frame, output: closeUp, inputProps: { lang }, scale: 0.5 });
    }
    const bareFrame = join(tileDir, `bare-${String(i).padStart(2, "0")}.png`);
    await renderStill({ serveUrl, composition: bare, frame: pick.frame, output: bareFrame, inputProps: { lang, poster: true }, scale: 0.25 });
    const bandNote = captionBandIntrusion(bareFrame) > 1 ? "  ← content enters the caption band" : "";
    if (bandNote) bandWarnings.push(pick.scene);
    rmSync(bareFrame, { force: true });
    const extent = contentExtent(output);
    // Only judge fully built scenes; the title and end cards are centred by design.
    const judged = !mid && pick.scene !== "intro" && pick.scene !== "outro";
    const note = judged && (extent.bottom < 0.82 || extent.right < 0.7) ? "  ← uses little of the stage" : "";
    if (note) warnings.push(pick.scene);
    let titleNote = "";
    if (judged) {
      const reference = join(tileDir, `title-${String(i).padStart(2, "0")}.png`);
      await renderStill({ serveUrl, composition, frame: pick.titleFrame, output: reference, inputProps: { lang }, scale: 0.25 });
      if (titleIntrusion(reference, output) > 25) {
        titleNote = "  ← something overlaps the scene title";
        titleWarnings.push(pick.scene);
      }
      rmSync(reference, { force: true });
    }
    console.log(
      `${String(i + 1).padStart(2)}. ${pick.scene.padEnd(16)} frame ${String(pick.frame).padEnd(6)} content to y=${Math.round(
        extent.bottom * 100,
      )}% x=${Math.round(extent.right * 100)}%${note}${titleNote}${bandNote}`,
    );
  }
} finally {
  cleanup();
}
if (warnings.length) {
  console.log(`! ${warnings.join(", ")}: content ends early — scale diagrams up to fill x 120–1800, y 200–890`);
}
if (titleWarnings.length) {
  console.log(`! ${titleWarnings.join(", ")}: elements enter the title area (x 120–1250, y 60–200) — move them below y 210`);
}
if (bandWarnings.length) {
  console.log(`! ${bandWarnings.join(", ")}: content reaches below y 912 into the caption band — keep diagrams above y ≈ 880`);
}

function gray(png) {
  return execFileSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "gray", "-"], { maxBuffer: 1 << 24 });
}

/** Pixels in the title band (x 120–1250, y 60–200 at full size) that changed after the title appeared. */
function titleIntrusion(referencePng, framePng) {
  const W = 480;
  const a = gray(referencePng);
  const b = gray(framePng);
  let changed = 0;
  for (let y = 15; y < 50; y++) {
    for (let x = 30; x < 312; x++) {
      if (Math.abs(a[y * W + x] - b[y * W + x]) > 40) changed++;
    }
  }
  return changed;
}

/** Rows of ink inside the caption band (y ≥ 912 at full size) of a caption-free frame. */
function captionBandIntrusion(png) {
  const W = 480;
  const H = 270;
  const STAGE = Math.round((912 / 1080) * H);
  const raw = gray(png);
  const background = raw[(H - 3) * W + 4];
  let rows = 0;
  for (let y = STAGE + 1; y < H - 1; y++) {
    let count = 0;
    for (let x = 0; x < W; x++) if (Math.abs(raw[y * W + x] - background) > 12) count++;
    if (count >= 3) rows++;
  }
  return rows;
}

/**
 * How far down / right a frame's content reaches, as a fraction of the stage (caption band and
 * the top-right brand excluded). A well-filled scene reaches ~90% down and ~85% across.
 */
function contentExtent(png) {
  const W = 480;
  const H = 270;
  const STAGE = Math.round((912 / 1080) * H);
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "gray", "-"], {
    maxBuffer: 1 << 24,
  });
  const background = raw[Math.round(STAGE * 0.6) * W + 4];
  const ink = (x, y) => Math.abs(raw[y * W + x] - background) > 12;
  let bottom = 0;
  let right = 0;
  for (let y = 0; y < STAGE - 2; y++) {
    let count = 0;
    for (let x = 0; x < W; x++) {
      if (!ink(x, y)) continue;
      count++;
      // Ignore the brand line (top-right) when measuring horizontal extent.
      if (y > 34 && x > right) right = x;
    }
    if (count >= 3) bottom = y;
  }
  return { bottom: bottom / STAGE, right: right / W };
}

// Pad the grid with blank tiles so ffmpeg's tile filter always gets cols × rows frames.
const blank = join(tileDir, "blank.png");
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xe6dfd8:s=480x270", "-frames:v", "1", blank]);
for (let i = picks.length; i < rows * COLUMNS; i++) copyFileSync(blank, join(tileDir, `${String(i).padStart(2, "0")}.png`));

const sheet = join(VIDEO_DIR, "out", "sheets", `${id}${mid ? "-mid" : ""}.png`);
execFileSync("ffmpeg", [
  "-y", "-v", "error", "-framerate", "1", "-i", join(tileDir, "%02d.png"),
  "-vf", `tile=${COLUMNS}x${rows}:padding=6:margin=6:color=0x8e8b82`, "-frames:v", "1", sheet,
]);
console.log(sheet);
