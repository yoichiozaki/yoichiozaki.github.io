// Lint narration scripts before synthesizing them.
//
//   node scripts/check-narration.mjs <slug> [<slug> ...]      (no slug = all)
//
// Errors (exit code 1): malformed structure. Warnings: caption length, text the TTS is likely to
// misread (Latin letters / symbols in Japanese without `jaSpeech`, acronyms in English without
// `enSpeech`), and an estimate of the spoken length per language.
import { listSlugs, loadNarration } from "./lib.mjs";

const JA_MAX = 62;
const EN_MAX = 135;
// Calibrated on the existing videos (jf_alpha @1.1, af_heart @1.0).
const JA_CHARS_PER_SECOND = 6.2;
const EN_WORDS_PER_SECOND = 2.8;
// Acronyms Kokoro already reads well as words or letters.
const EN_ACRONYM_OK = new Set(["OK", "AI", "API", "APIs", "ID", "IDs", "UI", "URL", "HTTP", "JSON", "SQL", "CPU", "CPUs", "GPU", "GPUs", "RAM"]);

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : listSlugs();
let errors = 0;

for (const slug of slugs) {
  const problems = [];
  const error = (msg) => {
    problems.push(`  ✗ ${msg}`);
    errors++;
  };
  const warn = (msg) => problems.push(`  ! ${msg}`);

  let narration;
  try {
    narration = loadNarration(slug);
  } catch (e) {
    console.log(`${slug}\n  ✗ cannot read narration/${slug}.json: ${e.message}`);
    errors++;
    continue;
  }
  if (narration.slug !== slug) error(`"slug" is "${narration.slug}", expected "${slug}"`);
  const scenes = Array.isArray(narration.scenes) ? narration.scenes : [];
  if (scenes.length === 0) error("no scenes");
  if (scenes[0]?.id !== "intro") warn(`first scene should be "intro" (TitleCard), got "${scenes[0]?.id}"`);
  if (scenes.at(-1)?.id !== "outro") warn(`last scene should be "outro" (EndCard), got "${scenes.at(-1)?.id}"`);

  const ids = new Set();
  let jaSeconds = 0;
  let enSeconds = 0;
  let segments = 0;
  for (const scene of scenes) {
    if (!/^[a-z][a-z0-9]*$/.test(scene.id ?? "")) error(`scene id "${scene.id}" must be lowercase alphanumeric`);
    if (ids.has(scene.id)) error(`duplicate scene id "${scene.id}"`);
    ids.add(scene.id);
    if (!Array.isArray(scene.segments) || scene.segments.length === 0) {
      error(`scene "${scene.id}" has no segments`);
      continue;
    }
    scene.segments.forEach((seg, i) => {
      const where = `${scene.id}-${i}`;
      segments++;
      if (typeof seg.ja !== "string" || typeof seg.en !== "string") {
        error(`${where}: both "ja" and "en" are required`);
        return;
      }
      if (seg.ja.length > JA_MAX) warn(`${where}: ja caption is ${seg.ja.length} chars (max ${JA_MAX}); split or shorten`);
      if (seg.en.length > EN_MAX) warn(`${where}: en caption is ${seg.en.length} chars (max ${EN_MAX}); split or shorten`);

      const jaSpoken = seg.jaSpeech ?? seg.ja;
      if (!seg.jaSpeech && /[A-Za-z]{2,}/.test(seg.ja)) warn(`${where}: Latin word in ja without "jaSpeech" (give a katakana reading)`);
      if (seg.jaSpeech && /[A-Za-z]{2,}/.test(seg.jaSpeech)) warn(`${where}: "jaSpeech" still contains Latin words`);
      if (/[+/=→←<>|~〜*#$%^&_]/.test(jaSpoken)) warn(`${where}: symbol in spoken ja text; spell it out in "jaSpeech"`);

      const enSpoken = seg.enSpeech ?? seg.en;
      const acronyms = (enSpoken.match(/\b[A-Z][A-Z0-9]{1,}s?\b/g) ?? []).filter((a) => !EN_ACRONYM_OK.has(a));
      if (acronyms.length) warn(`${where}: acronym(s) ${[...new Set(acronyms)].join(", ")} in spoken en; spell letters out in "enSpeech" (e.g. "L S M")`);
      if (/[+=→←<>|~*#$%^&_]/.test(enSpoken)) warn(`${where}: symbol in spoken en text; spell it out in "enSpeech"`);

      jaSeconds += jaSpoken.replace(/[\s、。，．・「」（）()!?！？:：—-]/g, "").length / JA_CHARS_PER_SECOND;
      enSeconds += enSpoken.split(/\s+/).filter(Boolean).length / EN_WORDS_PER_SECOND;
    });
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  console.log(`${slug}: ${scenes.length} scenes, ${segments} segments, ~${fmt(jaSeconds)} ja / ~${fmt(enSeconds)} en of speech`);
  if (jaSeconds < 150 || jaSeconds > 330) warn(`spoken length is outside the 2:30–5:30 target`);
  for (const p of problems) console.log(p);
}

process.exitCode = errors ? 1 : 0;
