"use client";

import dynamic from "next/dynamic";

const CodePlaygroundInner = dynamic(
  () =>
    import("./CodePlayground").then((mod) => mod.CodePlayground),
  {
    ssr: false,
    loading: () => (
      <div className="my-6 h-48 bg-muted rounded-lg animate-pulse" />
    ),
  }
);

export function CodePlaygroundLazy(props: {
  code: string;
  template?: "vanilla" | "vanilla-ts" | "react" | "react-ts" | "static";
  showPreview?: boolean;
}) {
  return <CodePlaygroundInner {...props} />;
}
