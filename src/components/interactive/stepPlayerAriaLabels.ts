"use client";

/**
 * Localized ARIA labels for `StepPlayerControls`.
 *
 * `StepPlayerControls` falls back to English labels when none are supplied,
 * which leaves the playback buttons untranslated on the Japanese pages. Every
 * component that renders the controls should pass these.
 */
export function stepPlayerAriaLabels(locale: string) {
  return locale === "ja"
    ? {
        reset: "最初に戻る",
        backward: "1 段階戻る",
        play: "再生",
        pause: "一時停止",
        forward: "1 段階進む",
        goToStep: (step: number) => `${step} 段階目へ移動`,
        progress: "再生進捗",
      }
    : {
        reset: "Reset",
        backward: "Step backward",
        play: "Play",
        pause: "Pause",
        forward: "Step forward",
        goToStep: (step: number) => `Go to step ${step}`,
        progress: "Playback progress",
      };
}
