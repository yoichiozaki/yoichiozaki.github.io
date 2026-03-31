"use client";

import { type ReactNode } from "react";
import { CopyCodeBlock } from "./CopyCodeBlock";
import { Mermaid } from "./Mermaid";

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    const el = node as { props: { children?: ReactNode } };
    return extractText(el.props.children);
  }
  return "";
}

export function CodeBlock({
  children,
  ...props
}: { children?: ReactNode } & React.ComponentProps<"pre">) {
  if ((props as Record<string, unknown>)["data-language"] === "mermaid") {
    return <Mermaid chart={extractText(children).trim()} />;
  }
  return <CopyCodeBlock {...props}>{children}</CopyCodeBlock>;
}
