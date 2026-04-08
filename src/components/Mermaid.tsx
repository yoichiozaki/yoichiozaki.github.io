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
              primaryColor: "#1e293b",
              primaryBorderColor: "#3b82f6",
              primaryTextColor: "#e2e8f0",
              secondaryColor: "#1a1a2e",
              secondaryBorderColor: "#6366f1",
              secondaryTextColor: "#e2e8f0",
              tertiaryColor: "#162032",
              tertiaryBorderColor: "#22d3ee",
              tertiaryTextColor: "#e2e8f0",
              lineColor: "#64748b",
              textColor: "#e2e8f0",
              mainBkg: "#1e293b",
              nodeBorder: "#3b82f6",
              nodeTextColor: "#e2e8f0",
              clusterBkg: "#0f172a",
              clusterBorder: "#334155",
              titleColor: "#f1f5f9",
              edgeLabelBackground: "#1e293b",
              // Sequence diagram
              actorBkg: "#1e293b",
              actorBorder: "#3b82f6",
              actorTextColor: "#e2e8f0",
              signalColor: "#94a3b8",
              signalTextColor: "#e2e8f0",
              labelBoxBkgColor: "#1e293b",
              labelBoxBorderColor: "#3b82f6",
              labelTextColor: "#e2e8f0",
              loopTextColor: "#e2e8f0",
              activationBorderColor: "#3b82f6",
              activationBkgColor: "#1e3a5f",
              sequenceNumberColor: "#e2e8f0",
              // State diagram
              labelColor: "#e2e8f0",
              altBackground: "#162032",
              // Git graph
              git0: "#3b82f6",
              git1: "#22c55e",
              git2: "#f59e0b",
              git3: "#ef4444",
              gitBranchLabel0: "#e2e8f0",
              gitBranchLabel1: "#e2e8f0",
              gitBranchLabel2: "#e2e8f0",
              gitBranchLabel3: "#e2e8f0",
              commitLabelColor: "#e2e8f0",
              commitLabelBackground: "#1e293b",
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
          // Strip any background paint mermaid bakes into the SVG
          const cleaned =
            theme === "dark"
              ? rendered.replace(
                  /background-color:\s*[^;"]+/g,
                  "background-color: transparent",
                )
              : rendered;
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
      className="mermaid-diagram not-prose my-6 flex justify-center overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
