// Print the scene/segment timeline of a video — handy for picking frames to render as stills.
// Usage: node scripts/scenes.mjs <slug> <lang>
import { loadTimeline } from "./lib.mjs";

const [slug, lang = "ja"] = process.argv.slice(2);
const { timeline } = loadTimeline(slug, lang);
const fmt = (f) => `${Math.floor(f / 30 / 60)}:${String(Math.floor(f / 30) % 60).padStart(2, "0")}`;
for (const scene of timeline.scenes) {
  const cues = scene.segments.map((s) => s.from).join(", ");
  console.log(`${scene.id.padEnd(14)} from ${String(scene.from).padStart(5)} (${fmt(scene.from)})  len ${String(scene.durationInFrames).padStart(4)}  cues [${cues}]`);
}
console.log(`total ${timeline.durationInFrames} frames (${fmt(timeline.durationInFrames)})`);
