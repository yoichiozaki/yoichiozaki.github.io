"""Machine-wide cap on concurrent TTS/ASR jobs.

Several videos are often produced in parallel; each Kokoro or Whisper process wants
all CPU cores and ~1 GB of RAM, so running many at once thrashes the machine. Jobs
take one of ``VIDEO_HEAVY_SLOTS`` (default 3) slots, implemented as OS file locks in
``video/.locks/`` that are released automatically even if a process dies.
"""

from __future__ import annotations

import contextlib
import os
import time
from collections.abc import Iterator
from pathlib import Path
from typing import IO

LOCK_DIR = Path(__file__).resolve().parent.parent / ".locks"

if os.name == "nt":
    import msvcrt

    def _try_lock(handle: IO[bytes]) -> bool:
        try:
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            return True
        except OSError:
            return False

    def _unlock(handle: IO[bytes]) -> None:
        handle.seek(0)
        msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)

else:
    import fcntl

    def _try_lock(handle: IO[bytes]) -> bool:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return True
        except OSError:
            return False

    def _unlock(handle: IO[bytes]) -> None:
        fcntl.flock(handle, fcntl.LOCK_UN)


@contextlib.contextmanager
def heavy_slot(label: str) -> Iterator[None]:
    """Block until one of the machine-wide slots is free, and hold it for the ``with`` body."""
    slots = max(1, int(os.environ.get("VIDEO_HEAVY_SLOTS", "3")))
    LOCK_DIR.mkdir(exist_ok=True)
    announced = False
    while True:
        for index in range(slots):
            handle = open(LOCK_DIR / f"slot-{index}.lock", "a+b")
            if _try_lock(handle):
                try:
                    yield
                finally:
                    _unlock(handle)
                    handle.close()
                return
            handle.close()
        if not announced:
            print(f"[{label}] waiting for a free TTS/ASR slot ({slots} in use)...", flush=True)
            announced = True
        time.sleep(3)


def cpu_threads() -> int:
    """Threads per heavy job, so that all slots together roughly fill the CPU."""
    slots = max(1, int(os.environ.get("VIDEO_HEAVY_SLOTS", "3")))
    return max(2, (os.cpu_count() or 8) // slots)
