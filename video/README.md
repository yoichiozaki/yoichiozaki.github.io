# Article videos

Narrated explainer videos that are embedded at the top of selected blog posts via
`<ArticleVideo slug="…" />`. Everything here is code: narration scripts, a local
text-to-speech step, and [Remotion](https://www.remotion.dev/) compositions that
render the animations, captions and audio into an MP4.

| Video | Article | Scenes |
| --- | --- | --- |
| `database-indexing` | B+ trees vs. LSM-trees | `src/articles/database-indexing/` |
| `consensus-algorithms` | 2PC → Paxos → Raft → PBFT | `src/articles/consensus-algorithms/` |
| `garbage-collection` | RC, tracing, generational and concurrent GC | `src/articles/garbage-collection/` |

## Layout

```text
video/
├── narration/<slug>.json      # bilingual script: scenes → caption segments (ja/en, optional *Speech readings)
├── tts/synthesize.py          # Kokoro-82M TTS → public/audio/<slug>/<lang>/*.wav + timings.json (git-ignored)
├── src/kit/                   # shared theme, timeline, captions, title/end cards, UI primitives
├── src/articles/<slug>/       # per-video scenes, index.tsx (scene id → component), pacing.json
└── scripts/
    ├── scenes.mjs             # print scene/cue frame numbers
    ├── stills.mjs             # render QA stills into out/stills/
    └── render.mjs             # render + encode + poster + site manifest
```

Each narration segment becomes one audio clip and one burned-in caption. The
timeline (`src/kit/timeline.ts`) lays the clips out back to back with small pauses,
and every scene receives the start frame of its segments (`useScene().cues`) so
animations stay in sync with what is being said — in both languages, even though
Japanese and English clips have different lengths.

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
npm run tts -- database-indexing          # or no slug for all videos

# 3. Preview / QA
npx remotion studio                        # interactive preview
node scripts/scenes.mjs database-indexing ja
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

1. Write `narration/<slug>.json` (scene ids are free-form; keep each segment to one or two caption lines).
   Use `jaSpeech` / `enSpeech` to spell out readings the TTS gets wrong (acronyms, `B+木`, …).
2. `npm run tts -- <slug>`, then check timings with `node scripts/scenes.mjs <slug> ja`.
3. Create `src/articles/<slug>/` with scene components, `index.tsx` and `pacing.json`, and add the
   definition to `VIDEOS` in `src/Root.tsx`.
4. Iterate with `scripts/stills.mjs`, then `npm run render -- <slug>`.
5. Add `<ArticleVideo slug="<slug>" />` to both `content/blog/ja/<slug>.mdx` and `content/blog/en/<slug>.mdx`.

## Voices and licenses

- Narration: [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) (Apache-2.0) via
  [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT); voices `jf_alpha` (ja) and `af_heart` (en).
  Japanese G2P uses [misaki](https://github.com/hexgrad/misaki) + pyopenjtalk-plus; `synthesize.py`
  patches a few phoneme symbols that the Kokoro v1.0 vocabulary would otherwise silently drop.
- Rendering: Remotion is free for individuals and small teams; see the
  [Remotion license](https://www.remotion.dev/license) before using it in a company context.
