"""Transcribe synthesized narration with Whisper to catch mispronunciations.

Usage (from ``video/``)::

    uv run --project tts --extra asr python tts/check_asr.py <slug> [--lang ja|en] [--all]

Every clip is transcribed and compared with its caption and speech text. Segments whose
transcript differs most are printed first; by default only those below ``--threshold``.
Japanese transcripts legitimately differ in script (kanji / kana / Latin letters, 一 vs 1),
so read the flagged lines instead of trusting the score blindly. Typical fixes: add or adjust
``jaSpeech`` / ``enSpeech`` and re-run ``npm run tts -- <slug>``.

The first run downloads the Whisper model (~1.6 GB) into the Hugging Face cache.
"""

from __future__ import annotations

import argparse
import difflib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

from slots import cpu_threads, heavy_slot

VIDEO_DIR = Path(__file__).resolve().parent.parent


def load_16k(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"[\W_]+", "", text)


def similarity(a: str, b: str) -> float:
    return difflib.SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slug")
    parser.add_argument("--lang", choices=["ja", "en"], help="only check one language")
    parser.add_argument("--all", action="store_true", help="print every segment, not just flagged ones")
    parser.add_argument("--threshold", type=float, default=0.8, help="flag segments below this similarity")
    parser.add_argument("--only", help="comma-separated segment ids to check (e.g. intro-0,split-2)")
    parser.add_argument("--model", default="large-v3-turbo")
    parser.add_argument("--threads", type=int, default=0, help="CPU threads (default: share the CPU between slots)")
    args = parser.parse_args()

    narration = json.loads((VIDEO_DIR / "narration" / f"{args.slug}.json").read_text(encoding="utf-8"))
    with heavy_slot("asr"):
        model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=args.threads or cpu_threads())
        check(model, narration, args)


def check(model: WhisperModel, narration: dict, args: argparse.Namespace) -> None:
    only = set(args.only.split(",")) if args.only else None
    for lang in [args.lang] if args.lang else ["ja", "en"]:
        timings_path = VIDEO_DIR / "public" / "audio" / args.slug / lang / "timings.json"
        timings = json.loads(timings_path.read_text(encoding="utf-8"))["segments"]
        rows = []
        for scene in narration["scenes"]:
            for index, segment in enumerate(scene["segments"]):
                seg_id = f"{scene['id']}-{index}"
                if only is not None and seg_id not in only:
                    continue
                audio = load_16k(VIDEO_DIR / "public" / timings[seg_id]["file"])
                parts, _ = model.transcribe(audio, language=lang, beam_size=5, vad_filter=False)
                heard = "".join(p.text for p in parts).strip()
                caption = segment[lang]
                speech = segment.get(f"{lang}Speech") or caption
                score = max(similarity(heard, caption), similarity(heard, speech))
                rows.append((score, seg_id, caption, speech, heard))

        rows.sort()
        flagged = [r for r in rows if r[0] < args.threshold]
        print(f"=== {args.slug} [{lang}]: {len(flagged)} of {len(rows)} segments below {args.threshold}")
        for score, seg_id, caption, speech, heard in rows if args.all else flagged:
            print(f"## {seg_id}  similarity {score:.2f}")
            print(f"   caption: {caption}")
            if speech != caption:
                print(f"   speech : {speech}")
            print(f"   heard  : {heard}")


if __name__ == "__main__":
    main()
