"use client";

import {
  SandpackProvider,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackLayout,
  SandpackConsole,
} from "@codesandbox/sandpack-react";
import { useTheme } from "./ThemeProvider";

type Template =
  | "vanilla"
  | "vanilla-ts"
  | "react"
  | "react-ts"
  | "static";

export function CodePlayground({
  code,
  template = "vanilla-ts",
  showPreview = true,
}: {
  code: string;
  template?: Template;
  showPreview?: boolean;
}) {
  const { theme } = useTheme();

  const entryFile =
    template === "vanilla-ts"
      ? "/src/index.ts"
      : template === "vanilla"
        ? "/src/index.js"
        : template === "react-ts"
          ? "/App.tsx"
          : template === "react"
            ? "/App.js"
            : "/index.html";

  const files: Record<string, string> = { [entryFile]: code };

  return (
    <div className="not-prose my-6 rounded-lg overflow-hidden border border-border">
      <SandpackProvider
        template={template}
        theme={theme === "dark" ? "dark" : "light"}
        files={files}
      >
        <SandpackLayout>
          <SandpackCodeEditor
            showLineNumbers
            showTabs={false}
            style={{ minHeight: 200 }}
          />
          {showPreview && <SandpackPreview style={{ minHeight: 200 }} />}
        </SandpackLayout>
        <SandpackConsole style={{ maxHeight: 160 }} />
      </SandpackProvider>
    </div>
  );
}
