// Shared helpers for the render/export scripts (Node 22.18+/24 runs .ts imports natively).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTimeline, defaultPacing } from "../src/kit/timeline.ts";

export const VIDEO_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_DIR = join(VIDEO_DIR, "..");
export const FPS = 30;

/** Per-video pacing overrides live next to the scenes: src/articles/<slug>/pacing.json. */
export function loadPacing(slug) {
  const file = join(VIDEO_DIR, "src", "articles", slug, "pacing.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
}

export function loadTimeline(slug, lang) {
  const narration = JSON.parse(readFileSync(join(VIDEO_DIR, "narration", `${slug}.json`), "utf8"));
  const timings = JSON.parse(readFileSync(join(VIDEO_DIR, "public", "audio", slug, lang, "timings.json"), "utf8"));
  const pacing = { ...defaultPacing, ...loadPacing(slug) };
  return { narration, timeline: buildTimeline(narration, timings, lang, FPS, pacing) };
}

/** Every video with a narration script. */
export function listSlugs() {
  return readdirSync(join(VIDEO_DIR, "narration"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}
