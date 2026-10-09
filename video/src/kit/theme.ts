// Visual tokens mirror the blog's design system (DESIGN.md / src/app/globals.css):
// warm cream canvas, ink text, a scarce coral accent and dark "product" surfaces.
export const colors = {
  canvas: "#faf9f5",
  surfaceSoft: "#f5f0e8",
  surfaceCard: "#efe9de",
  surfaceCream: "#e8e0d2",
  hairline: "#e6dfd8",
  hairlineStrong: "#d6ccbf",
  ink: "#141413",
  body: "#3d3d3a",
  bodyStrong: "#252523",
  muted: "#6c6a64",
  mutedSoft: "#8e8b82",
  coral: "#cc785c",
  coralDeep: "#a9583e",
  coralSoft: "#f3d9cd",
  teal: "#5db8a6",
  tealDeep: "#3f8f80",
  tealSoft: "#d4ece6",
  amber: "#e8a55a",
  amberSoft: "#f8e3c6",
  success: "#5db872",
  error: "#c64545",
  errorSoft: "#f2d2d2",
  dark: "#181715",
  darkElevated: "#252320",
  onDark: "#faf9f5",
  onDarkSoft: "#a09d96",
} as const;

export const fonts = {
  sans: '"Inter", "Noto Sans JP", "Hiragino Sans", "Yu Gothic UI", sans-serif',
  serif: '"Source Serif 4", "Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", serif',
  mono: '"JetBrains Mono", "Noto Sans JP", ui-monospace, monospace',
} as const;

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const FPS = 30;

/** Height reserved at the bottom of the frame for burned-in captions. */
export const CAPTION_BAND = 168;
/** Drawable area for scene content. */
export const STAGE_HEIGHT = VIDEO_HEIGHT - CAPTION_BAND;
