"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "@/components/ThemeProvider";

export default function Mermaid({ code }: { code: string }) {
  const { theme } = useTheme();
  const id = useId().replace(/:/g, "-");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setError(null);
      setSvg("");
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
        });
        const diagramId = `mermaid-${id}`;
        const { svg: rendered } = await mermaid.render(diagramId, code);
        if (!cancelled) {
          setSvg(rendered);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to render diagram");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [code, theme, id]);

  if (error) {
    return (
      <pre className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-950 rounded">
        {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        Loading diagram…
      </div>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      className="overflow-x-auto flex justify-center my-4"
    />
  );
}
