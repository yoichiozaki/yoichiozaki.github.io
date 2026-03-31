"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type UseStepPlayerOptions = {
  totalSteps: number;
  intervalMs?: number;
  loop?: boolean;
  onStep?: (step: number) => void;
};

export function useStepPlayer({
  totalSteps,
  intervalMs = 600,
  loop = false,
  onStep,
}: UseStepPlayerOptions) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    setStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) {
        if (loop) return 0;
        setPlaying(false);
        return prev;
      }
      return next;
    });
  }, [totalSteps, loop]);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(advance, intervalMs);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [playing, advance, intervalMs, clearTimer]);

  useEffect(() => {
    onStep?.(step);
  }, [step, onStep]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const reset = useCallback(() => {
    setPlaying(false);
    setStep(0);
  }, []);
  const stepForward = useCallback(() => {
    setPlaying(false);
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);
  const stepBackward = useCallback(() => {
    setPlaying(false);
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);
  const goTo = useCallback(
    (target: number) => {
      setPlaying(false);
      setStep(Math.max(0, Math.min(target, totalSteps - 1)));
    },
    [totalSteps],
  );

  return {
    step,
    playing,
    isFirst: step === 0,
    isLast: step === totalSteps - 1,
    totalSteps,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    goTo,
  };
}
