// Render the article videos and export web-ready assets into the site's public/ folder.
//
//   node scripts/render.mjs [slug ...] [--lang ja|en] [--poster-only]
//
// For every slug × language this:
//   1. renders the Remotion composition to out/<slug>-<lang>.mp4 (high quality master),
//   2. re-encodes it for the web with ffmpeg (x264 tuned for flat graphics, loudness-normalized mono AAC,
//      faststart) into ../public/videos/<slug>/<lang>.mp4,
//   3. renders a caption-free poster frame to ../public/videos/<slug>/<lang>.jpg,
//   4. writes duration + transcript into ../src/data/article-videos.json for the <ArticleVideo> component.
// --poster-only skips steps 1–2 (the existing MP4 must still match the current timeline).
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bundleVideo, FPS, listSlugs, loadPacing, loadTimeline, REPO_DIR, VIDEO_DIR } from "./lib.mjs";

const args = process.argv.slice(2);
const langArg = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
const posterOnly = args.includes("--poster-only");
const slugs = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--lang");
const targets = slugs.length ? slugs : listSlugs();
const langs = langArg ? [langArg] : ["ja", "en"];

const DEFAULT_POSTER_FRAME = 75;
const OUT_DIR = join(VIDEO_DIR, "out");
const MANIFEST = join(REPO_DIR, "src", "data", "article-videos.json");
mkdirSync(OUT_DIR, { recursive: true });

/** Merge one entry into the manifest (re-read each time so parallel render runs don't clobber each other). */
function updateManifest(slug, lang, entry) {
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  manifest[slug] = { ...manifest[slug], [lang]: entry };
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((key) => [key, manifest[key]]));
  const tmp = `${MANIFEST}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
  renameSync(tmp, MANIFEST);
}

async function renderVideo(serveUrl, id, lang, siteDir) {
  const master = join(OUT_DIR, `${id}.mp4`);
  const composition = await selectComposition({ serveUrl, id, inputProps: { lang } });
  console.log(`▶ ${id}: ${composition.durationInFrames} frames`);
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    codec: "h264",
    crf: 16,
    x264Preset: "medium",
    // remotion.config.ts does not apply to the SSR APIs: set the frame format explicitly.
    // Lossless PNG frames keep text edges clean and avoid full-range JPEG (yuvj420p) output.
    imageFormat: "png",
    pixelFormat: "yuv420p",
    colorSpace: "bt709",
    concurrency: 8,
    audioCodec: "aac",
    audioBitrate: "256k",
    outputLocation: master,
    inputProps: { lang },
    onProgress: ({ progress }) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(` ${pct}%`);
      }
    },
  });
  console.log("");

  const web = join(siteDir, `${lang}.mp4`);
  // Encode next to the master and move it into place, so an interrupted run never leaves a broken file in public/.
  const partial = join(OUT_DIR, `${id}.web.mp4`);
  const seconds = (composition.durationInFrames / composition.fps).toFixed(3);
  execFileSync(
    "ffmpeg",
    [
      "-y", "-v", "error", "-i", master,
      "-c:v", "libx264", "-preset", "veryslow", "-tune", "animation", "-crf", "27",
      "-vf", "scale=out_color_matrix=bt709:out_range=tv",
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", "150",
      "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "1", "-c:a", "aac", "-b:a", "80k",
      // loudnorm/AAC padding would otherwise make the audio (and the container) outlast the video.
      "-t", seconds,
      "-movflags", "+faststart", partial,
    ],
    { stdio: "inherit" },
  );
  renameSync(partial, web);
  console.log(`✓ ${web} (${(statSync(web).size / 1024 / 1024).toFixed(1)} MB)`);
}

async function renderPoster(serveUrl, slug, lang, siteDir) {
  const id = `${slug}-${lang}`;
  const posterPng = join(OUT_DIR, `${id}-poster.png`);
  const composition = await selectComposition({ serveUrl, id, inputProps: { lang, poster: true } });
  const frame = loadPacing(slug).posterFrame ?? DEFAULT_POSTER_FRAME;
  await renderStill({ serveUrl, composition, frame, output: posterPng, inputProps: { lang, poster: true } });
  const jpg = join(siteDir, `${lang}.jpg`);
  const partial = join(OUT_DIR, `${id}-poster.jpg`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", posterPng, "-vf", "scale=1280:-2", "-q:v", "4", partial], { stdio: "inherit" });
  renameSync(partial, jpg);
  console.log(`✓ ${jpg}`);
}

for (const slug of targets) {
  const { serveUrl, cleanup } = await bundleVideo(slug);
  try {
    for (const lang of langs) {
      const id = `${slug}-${lang}`;
      const siteDir = join(REPO_DIR, "public", "videos", slug);
      mkdirSync(siteDir, { recursive: true });

      if (!posterOnly) await renderVideo(serveUrl, id, lang, siteDir);
      await renderPoster(serveUrl, slug, lang, siteDir);

      const { narration, timeline } = loadTimeline(slug, lang);
      const joiner = lang === "ja" ? "" : " ";
      // Same value the poster badge shows; the web encode is trimmed to exactly this length.
      const seconds = timeline.durationInFrames / FPS;
      updateManifest(slug, lang, {
        src: `/videos/${slug}/${lang}.mp4`,
        poster: `/videos/${slug}/${lang}.jpg`,
        duration: Math.floor(seconds * 10) / 10,
        transcript: narration.scenes.map((scene) => scene.segments.map((s) => s[lang]).join(joiner)),
      });
    }
  } finally {
    cleanup();
  }
}

console.log(`✓ ${MANIFEST}`);
