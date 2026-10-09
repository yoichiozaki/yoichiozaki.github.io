# Article videos

Narrated explainer videos that are embedded at the top of selected blog posts via
`<ArticleVideo slug="…" />`. Everything here is code: narration scripts, a local
text-to-speech step, and [Remotion](https://www.remotion.dev/) compositions that
render the animations, captions and audio into an MP4.

Each video lives in `src/articles/<slug>/` with its script in `narration/<slug>.json`;
`src/Root.tsx` lists the finished ones.

## Layout

```text
video/
├── narration/<slug>.json      # bilingual script: scenes → caption segments (ja/en, optional *Speech readings)
├── tts/synthesize.py          # Kokoro-82M TTS → public/audio/<slug>/<lang>/*.wav + timings.json (git-ignored)
├── tts/check_asr.py           # Whisper round-trip to catch mispronunciations (optional `asr` extra)
├── src/kit/                   # shared theme, timeline, captions, title/end cards, UI primitives, root
├── src/articles/<slug>/       # per-video scenes, index.tsx (exports a VideoDefinition), pacing.json
└── scripts/
    ├── check-narration.mjs    # lint narration scripts (length, readings, estimated duration)
    ├── scenes.mjs             # print scene/cue frame numbers
    ├── stills.mjs             # render QA stills into out/stills/
    ├── sheet.mjs              # contact sheet: one frame per scene, tiled into out/sheets/ (+ fill/title/caption-band checks)
    ├── lint-scenes.mjs        # flag font sizes that are unreadable in the embedded player
    ├── typecheck.mjs          # type-check the kit + one video
    └── render.mjs             # render + encode + poster + site manifest
```

Each narration segment becomes one audio clip and one burned-in caption. The
timeline (`src/kit/timeline.ts`) lays the clips out back to back with small pauses,
and every scene receives the start frame of its segments (`useScene().cues`) so
animations stay in sync with what is being said — in both languages, even though
Japanese and English clips have different lengths.

`stills.mjs`, `sheet.mjs` and `render.mjs` bundle one video at a time (a generated entry in
`.entries/` plus only that video's audio in `.public/`), so unfinished work on other videos
never breaks them, and they delete their bundle when done. TTS and ASR runs share three
machine-wide slots (`VIDEO_HEAVY_SLOTS`, file locks in `.locks/`), so parallel runs queue
instead of exhausting CPU and memory.

## Regenerating

Prerequisites: Node 22.18+ (for the `.ts` import in `scripts/lib.mjs`), [uv](https://docs.astral.sh/uv/),
ffmpeg on `PATH`, and the Noto Sans JP / Noto Serif JP fonts installed (Japanese text falls back to
them; Latin fonts are loaded from Google Fonts at render time).

```sh
cd video
npm install

# 1. Kokoro model files (~350 MB, git-ignored)
mkdir -p tts/models
curl -L -o tts/models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
curl -L -o tts/models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin

# 2. Narration audio (cached per segment; only changed text is re-synthesized)
npm run lint:narration -- database-indexing
npm run tts -- database-indexing           # or no slug for all videos
npm run asr -- database-indexing           # optional: Whisper check (downloads ~1.6 GB once; --lang ja, --only intro-0,split-2)

# 3. Preview / QA
npx remotion studio                        # interactive preview of the videos in src/Root.tsx
node scripts/scenes.mjs database-indexing ja
node scripts/sheet.mjs database-indexing-ja
node scripts/stills.mjs database-indexing-ja 300 900

# 4. Render and export to the site
npm run render -- database-indexing        # → ../public/videos/<slug>/{ja,en}.{mp4,jpg}
                                           #   + ../src/data/article-videos.json
```

`render.mjs` keeps a high-quality master in `out/` (lossless PNG frames, BT.709), then re-encodes
for the web (x264 `-tune animation`, CRF 27, limited-range BT.709, loudness-normalized mono AAC,
trimmed to the exact composition length, `+faststart`). `--poster-only` refreshes just the posters
and the manifest.

## Adding a video for another article

1. Write `narration/<slug>.json` following the guide below, then `npm run lint:narration -- <slug>`.
2. `npm run tts -- <slug>` and `npm run asr -- <slug>`; fix misreadings with `jaSpeech` / `enSpeech`.
3. Create `src/articles/<slug>/` with scene components, an `index.tsx` that exports a
   `VideoDefinition`, and `pacing.json`. Iterate with `sheet.mjs` / `stills.mjs` and
   `node scripts/typecheck.mjs <slug>`.
4. Add the definition to `src/Root.tsx`, then `npm run render -- <slug>`.
5. Add `<ArticleVideo slug="<slug>" />` after the introduction of both
   `content/blog/ja/<slug>.mdx` and `content/blog/en/<slug>.mdx`.

## Authoring guide

### Narration (`narration/<slug>.json`)

```json
{
  "slug": "<slug>",
  "scenes": [
    { "id": "intro", "segments": [{ "ja": "…", "en": "…" }] },
    { "id": "split", "segments": [{ "ja": "B+木は…", "jaSpeech": "ビープラス木は…", "en": "…", "enSpeech": "…" }] },
    { "id": "outro", "segments": [{ "ja": "…", "en": "…" }] }
  ]
}
```

- Tell the article's core story in 8–13 scenes and about 3½–5 minutes per language. The first
  scene is `intro` (title card), the last is `outro` (end card pointing to the article).
- One segment = one caption: aim for ≤ 60 Japanese characters and ≤ 130 English characters.
- Stay faithful to the article: no claims it doesn't make; dates, numbers and names exactly as written.
  Japanese and English must say the same thing.
- Spoken Japanese: です・ます, no parentheses, arrows, slashes or `〜`. Every Latin-script word needs a
  katakana reading in `jaSpeech` (`B+木` → `ビープラス木`, `LSM-Tree` → `エルエスエム・ツリー`,
  `16KB` → `16キロバイト`). Single letters such as `A` or `n` are read fine.
- Spoken English: spell acronyms that are read letter by letter with spaces in `enSpeech`
  (`L S M tree`, `disk I O`, `B-plus tree`), and avoid symbols such as `→` or `+`.
- Captions keep the written form; `*Speech` only changes what the TTS says.

### Scenes (`src/articles/<slug>/`)

- `index.tsx` exports a `VideoDefinition` mapping every narration scene id to a component;
  `pacing.json` may add `extraTail` seconds after a scene and sets `posterFrame` (a frame in the
  intro where the title and artwork are fully visible).
- Key every animation to `useScene().cues[i]` / `ends[i]` so visuals appear exactly when the narration
  mentions them; never hard-code absolute frame numbers.
- Frame: 1920×1080. Content stays within x ≈ 120–1800, y ≈ 200–890. Captions own y > 912; the scene
  title is top-left (y 76–190) and the brand is top-right (x > 1450, y < 130).
- One main diagram per scene, optionally with a side panel for live state (queues, logs, counters).
  Make things large: nodes ≥ 88 px across, labels ≥ 24 px, body text 26–32 px. Fill the content area;
  avoid tiny diagrams in big empty cards.
- Show processes, not snapshots: build up step by step, move messages as labelled packets that vanish
  on arrival (no accumulating static lines), highlight the current step, and keep a phase banner or
  legend where it can't overlap anything.
- All on-screen text goes through `useT()` with both languages, kept short. Check the English stills:
  English labels are longer.
- Colors follow the blog: coral = active/primary, teal = done/success, amber = waiting/in progress,
  red = failure, ink/muted/hairline for neutral; `fonts.serif` for titles and big numbers,
  `fonts.sans` for labels, `fonts.mono` for code and values.

### QA checklist

- `npm run lint:narration -- <slug>`: no warnings left for the new script.
- `npm run asr -- <slug>`: every flagged line is checked by ear or fixed.
- `node scripts/sheet.mjs <slug>-ja` / `<slug>-en` (`--mid` for mid-scene frames): nothing overlaps, nothing
  is clipped or enters the caption band or brand area, and no scene looks empty. The end-frame sheet also
  prints how far each scene's content reaches and flags scenes that stop early (aim for ≥ 85% down), that
  draw over the scene title, or whose diagrams reach below y 912 into the caption band (checked on a
  caption-free render). Add `--each` for half-size close-ups of every scene — overlaps between small
  elements are invisible at sheet scale. Look at every close-up: chips straddling a panel border,
  connectors that end inside a box or in empty space, and data that doesn't match the narration are not
  caught automatically.
- `node scripts/lint-scenes.mjs <slug>`: no font size below 22 px. The video is usually watched in a
  ~720 px wide column, where 24 px becomes ~9 px.
- `node scripts/typecheck.mjs <slug>` passes.

## Voices and licenses

- Narration: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0) via
  [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT); voices `jf_alpha` (ja) and `af_heart` (en).
  Japanese G2P uses [misaki](https://github.com/hexgrad/misaki) + pyopenjtalk-plus; `synthesize.py`
  patches a few phoneme symbols that the Kokoro v1.0 vocabulary would otherwise silently drop.
- Pronunciation checks: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) with Whisper large-v3-turbo.
- Rendering: Remotion is free for individuals and small teams; see the
  [Remotion license](https://www.remotion.dev/license) before using it in a company context.
