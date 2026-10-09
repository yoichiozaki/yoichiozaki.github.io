import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSourceSerif } from "@remotion/google-fonts/SourceSerif4";

// Latin faces match the blog (Inter / Source Serif 4 / JetBrains Mono). Japanese
// glyphs fall back to the locally installed Noto Sans JP / Noto Serif JP (see
// fonts.* stacks in theme.ts), which keeps renders fast and avoids fetching
// ~120 unicode-range slices per weight from Google Fonts.
loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin", "latin-ext"] });
loadSourceSerif("normal", { weights: ["400", "500", "600"], subsets: ["latin", "latin-ext"] });
loadJetBrainsMono("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
