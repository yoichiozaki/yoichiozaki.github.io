"use client";

import dynamic from "next/dynamic";
import type { StoryStop } from "./StorytellingMap";
import { stopsJa, stopsEn } from "@/data/trips/seattle-vancouver-2025";

const StorytellingMap = dynamic(
  () => import("./StorytellingMap").then((mod) => mod.StorytellingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <span className="text-muted-foreground text-sm">
          🗺️ 地図を読み込み中...
        </span>
      </div>
    ),
  }
);

export function SeattleVancouverMap({ locale }: { locale?: string }) {
  const stops = locale === "en" ? stopsEn : stopsJa;
  const introTitle =
    locale === "en" ? "Seattle & Vancouver" : "シアトル & バンクーバー";
  const introSubtitle =
    locale === "en"
      ? "A Pacific Northwest Adventure"
      : "太平洋岸北西部の旅 — 2025";
  return (
    <StorytellingMap
      stops={stops}
      pathColor="#0ea5e9"
      introTitle={introTitle}
      introSubtitle={introSubtitle}
    />
  );
}

export { StorytellingMap as StorytellingMapLazy };
export type { StoryStop };
