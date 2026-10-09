"""Synthesize narration audio for the article videos with Kokoro-82M (local, Apache-2.0).

Reads ``video/narration/<slug>.json`` and writes, per language:

* ``video/public/audio/<slug>/<lang>/<scene>-<n>.wav`` — one clip per caption segment
* ``video/public/audio/<slug>/<lang>/timings.json`` — clip durations read by the Remotion timeline

Clips are cached by a hash of (speech text, voice, speed), so re-running only
re-synthesizes segments whose text changed.

Usage (from ``video/``)::

    uv run --project tts python tts/synthesize.py database-indexing [--lang ja|en]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro
from misaki import ja

VIDEO_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = Path(__file__).resolve().parent / "models"
NARRATION_DIR = VIDEO_DIR / "narration"
AUDIO_DIR = VIDEO_DIR / "public" / "audio"

DEFAULT_VOICES = {
    "ja": {"voice": "jf_alpha", "speed": 1.1},
    "en": {"voice": "af_heart", "speed": 1.0},
}

# misaki's pyopenjtalk path emits symbols that are absent from the Kokoro v1.0
# vocabulary (ASCII "g" and the palatalized/labialized consonants). Kokoro
# silently drops unknown symbols, which turns "ぎょう" into "おう", so map them
# onto sequences the model knows.
JA_PHONEME_FIXES = {
    "g": "ɡ",
    "ᶄ": "kj",
    "ᶃ": "ɡj",
    "K": "kw",
    "G": "ɡw",
    "ƫ": "tj",
    "ᶁ": "dj",
    "ᶀ": "bj",
    "ᶈ": "pj",
    "ᶆ": "mj",
    "ᶉ": "rj",
}

# Kokoro tends to fuse a moraic nasal with a following vowel (範囲 haɴi → "hani"),
# so keep a short boundary between them.
JA_NASAL_BEFORE_VOWEL = re.compile(r"ɴ(?=[aiueo])")

# Bump when the text → audio processing changes, to invalidate cached clips.
PIPELINE_VERSION = 2

SILENCE_THRESHOLD = 0.012
EDGE_PADDING_SECONDS = 0.04
PEAK_TARGET = 0.89


class Synthesizer:
    def __init__(self) -> None:
        self.kokoro = Kokoro(
            str(MODELS_DIR / "kokoro-v1.0.onnx"), str(MODELS_DIR / "voices-v1.0.bin")
        )
        _patch_openjtalk_mora_sizes()
        self.ja_g2p = ja.JAG2P(version="pyopenjtalk")

    def ja_phonemes(self, text: str) -> str:
        combined, _ = self.ja_g2p(text)
        # The pyopenjtalk G2P returns phonemes followed by an equally long pitch string.
        phonemes = combined[: len(combined) // 2]
        phonemes = "".join(JA_PHONEME_FIXES.get(ch, ch) for ch in phonemes)
        return JA_NASAL_BEFORE_VOWEL.sub("ɴ ", phonemes)

    def synthesize(self, text: str, lang: str, voice: str, speed: float) -> tuple[np.ndarray, int]:
        if lang == "ja":
            phonemes = self.ja_phonemes(text)
            samples, sample_rate = self.kokoro.create(
                phonemes, voice=voice, speed=speed, is_phonemes=True
            )
        else:
            samples, sample_rate = self.kokoro.create(text, voice=voice, speed=speed, lang="en-us")
        return trim_and_normalize(np.asarray(samples, dtype=np.float32), sample_rate), sample_rate


def _patch_openjtalk_mora_sizes() -> None:
    """Fix dictionary entries whose mora_size disagrees with their pronunciation.

    pyopenjtalk-plus reports e.g. 値 → アタイ with mora_size 1, which trips an
    assertion inside misaki. Recompute the size from the katakana instead.
    """
    frontend = ja.pyopenjtalk.run_frontend
    if getattr(frontend, "_mora_patched", False):
        return

    def run_frontend(text: str):
        words = frontend(text)
        for word in words:
            if word["mora_size"] > 0:
                moras = ja.JAG2P.pron2moras(word["pron"])
                if moras and moras[0] != "ー" and len(moras) != word["mora_size"]:
                    word["mora_size"] = len(moras)
        return words

    run_frontend._mora_patched = True  # type: ignore[attr-defined]
    ja.pyopenjtalk.run_frontend = run_frontend


def trim_and_normalize(samples: np.ndarray, sample_rate: int) -> np.ndarray:
    loud = np.flatnonzero(np.abs(samples) > SILENCE_THRESHOLD)
    if loud.size:
        pad = int(EDGE_PADDING_SECONDS * sample_rate)
        samples = samples[max(loud[0] - pad, 0) : min(loud[-1] + pad, samples.size)]
    peak = float(np.max(np.abs(samples))) if samples.size else 0.0
    if peak > 0:
        samples = samples * (PEAK_TARGET / peak)
    return samples


def segment_hash(text: str, voice: str, speed: float) -> str:
    return hashlib.sha256(f"{PIPELINE_VERSION}|{voice}|{speed}|{text}".encode("utf-8")).hexdigest()[:16]


def write_timings(path: Path, slug: str, lang: str, voice: str, segments: dict[str, dict]) -> None:
    payload = {"slug": slug, "lang": lang, "voice": voice, "segments": segments}
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def run(slug: str, langs: list[str], synth: Synthesizer | None) -> Synthesizer | None:
    narration = json.loads((NARRATION_DIR / f"{slug}.json").read_text(encoding="utf-8"))

    for lang in langs:
        cfg = {**DEFAULT_VOICES[lang], **narration.get("voices", {}).get(lang, {})}
        timings_path = AUDIO_DIR / slug / lang / "timings.json"
        previous: dict[str, dict] = {}
        if timings_path.exists():
            previous = json.loads(timings_path.read_text(encoding="utf-8")).get("segments", {})

        out_dir = AUDIO_DIR / slug / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        segments: dict[str, dict] = {}
        synthesized = 0

        for scene in narration["scenes"]:
            for index, segment in enumerate(scene["segments"]):
                seg_id = f"{scene['id']}-{index}"
                speech = segment.get(f"{lang}Speech") or segment[lang]
                digest = segment_hash(speech, cfg["voice"], cfg["speed"])
                wav_path = out_dir / f"{seg_id}.wav"
                cached = previous.get(seg_id)
                if cached and cached.get("hash") == digest and wav_path.exists():
                    segments[seg_id] = cached
                    continue

                if synth is None:
                    synth = Synthesizer()
                samples, sample_rate = synth.synthesize(speech, lang, cfg["voice"], cfg["speed"])
                tmp_wav = wav_path.with_suffix(".tmp.wav")
                sf.write(tmp_wav, samples, sample_rate, subtype="PCM_16")
                tmp_wav.replace(wav_path)
                segments[seg_id] = {
                    "file": f"audio/{slug}/{lang}/{seg_id}.wav",
                    "seconds": round(samples.size / sample_rate, 3),
                    "hash": digest,
                }
                # Record the new hash right away so an interrupted run never leaves a WAV
                # on disk whose recorded hash describes different text.
                previous[seg_id] = segments[seg_id]
                write_timings(timings_path, slug, lang, cfg["voice"], previous)
                synthesized += 1
                print(f"  [{lang}] {seg_id}: {segments[seg_id]['seconds']}s  {speech}", flush=True)

        valid = {f"{seg_id}.wav" for seg_id in segments}
        for stale in out_dir.glob("*.wav"):
            if stale.name not in valid:
                stale.unlink()

        total = sum(s["seconds"] for s in segments.values())
        write_timings(timings_path, slug, lang, cfg["voice"], segments)
        print(f"{slug} [{lang}]: {len(segments)} segments ({synthesized} new), {total:.1f}s of speech")
    return synth


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slugs", nargs="*", help="narration file names (default: all)")
    parser.add_argument("--lang", choices=["ja", "en"], help="only synthesize one language")
    args = parser.parse_args()

    slugs = args.slugs or sorted(p.stem for p in NARRATION_DIR.glob("*.json"))
    langs = [args.lang] if args.lang else ["ja", "en"]
    synth: Synthesizer | None = None
    for slug in slugs:
        synth = run(slug, langs, synth)


if __name__ == "__main__":
    main()
