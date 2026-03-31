"use client";

type StepPlayerControlsProps = {
  step: number;
  totalSteps: number;
  playing: boolean;
  isFirst: boolean;
  isLast: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  goTo: (step: number) => void;
  label?: (step: number) => string;
};

export function StepPlayerControls({
  step,
  totalSteps,
  playing,
  isFirst,
  isLast,
  play,
  pause,
  reset,
  stepForward,
  stepBackward,
  goTo,
  label,
}: StepPlayerControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Progress bar */}
      <div className="relative h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Reset"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.4-5.4M20 15a9 9 0 01-15.4 5.4"
              />
            </svg>
          </button>

          <button
            onClick={stepBackward}
            disabled={isFirst}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Step backward"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={playing ? pause : play}
            disabled={isLast && !playing}
            className="rounded-md p-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-30"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={stepForward}
            disabled={isLast}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30"
            aria-label="Step forward"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {label && (
            <span className="hidden sm:inline truncate max-w-48">
              {label(step)}
            </span>
          )}
          <span className="tabular-nums whitespace-nowrap">
            {step + 1} / {totalSteps}
          </span>
        </div>
      </div>

      {/* Clickable step indicator dots for small step counts */}
      {totalSteps <= 20 && (
        <div className="flex justify-center gap-1 py-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full transition-all ${
                i === step
                  ? "bg-accent scale-125"
                  : i < step
                    ? "bg-accent/40"
                    : "bg-border"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
