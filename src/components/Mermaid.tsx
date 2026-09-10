"use client";

import { useEffect, useRef, useState, useId } from "react";
import { useTheme } from "@/components/ThemeProvider";

// Serialize mermaid operations to avoid concurrent initialize/render conflicts
let renderQueue: Promise<void> = Promise.resolve();

function enqueueRender(fn: () => Promise<void>): Promise<void> {
  renderQueue = renderQueue.then(fn, fn);
  return renderQueue;
}

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const uniqueId = useId().replace(/:/g, "-");

  useEffect(() => {
    let cancelled = false;

    enqueueRender(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "base" : "default",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          securityLevel: "strict",
          ...(theme === "dark" && {
            themeVariables: {
              background: "transparent",
              primaryColor: "#252320",
              primaryBorderColor: "#cc785c",
              primaryTextColor: "#faf9f5",
              secondaryColor: "#2b2724",
              secondaryBorderColor: "#e8a55a",
              secondaryTextColor: "#faf9f5",
              tertiaryColor: "#1f1e1b",
              tertiaryBorderColor: "#5db8a6",
              tertiaryTextColor: "#faf9f5",
              lineColor: "#8e8b82",
              textColor: "#faf9f5",
              mainBkg: "#252320",
              nodeBorder: "#cc785c",
              nodeTextColor: "#faf9f5",
              clusterBkg: "#141312",
              clusterBorder: "#3a352f",
              titleColor: "#faf9f5",
              edgeLabelBackground: "#252320",
              // Sequence diagram
              actorBkg: "#252320",
              actorBorder: "#cc785c",
              actorTextColor: "#faf9f5",
              signalColor: "#a09d96",
              signalTextColor: "#faf9f5",
              labelBoxBkgColor: "#252320",
              labelBoxBorderColor: "#cc785c",
              labelTextColor: "#faf9f5",
              loopTextColor: "#faf9f5",
              activationBorderColor: "#cc785c",
              activationBkgColor: "#3a2a22",
              sequenceNumberColor: "#faf9f5",
              // State diagram
              labelColor: "#faf9f5",
              altBackground: "#1f1e1b",
              // Git graph
              git0: "#cc785c",
              git1: "#5db872",
              git2: "#e8a55a",
              git3: "#c64545",
              gitBranchLabel0: "#faf9f5",
              gitBranchLabel1: "#faf9f5",
              gitBranchLabel2: "#faf9f5",
              gitBranchLabel3: "#faf9f5",
              commitLabelColor: "#faf9f5",
              commitLabelBackground: "#252320",
            },
          }),
        });
        // Normalize line endings to avoid parser issues
        const normalizedChart = chart.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const { svg: rendered } = await mermaid.render(
          `mermaid-${uniqueId}`,
          normalizedChart,
        );
        if (!cancelled) {
          // Strip any background paint mermaid bakes into the SVG so the
          // container's cream / dark surface shows through in both modes.
          const cleaned = rendered.replace(
            /background-color:\s*[^;"]+/g,
            "background-color: transparent",
          );
          setSvg(cleaned);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
          setSvg("");
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart, theme, uniqueId]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        <p className="font-semibold">Mermaid rendering error</p>
        <pre className="mt-2 whitespace-pre-wrap text-xs">{error}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-diagram not-prose my-6 flex justify-center overflow-x-auto rounded-xl border border-border bg-surface-card p-5"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
