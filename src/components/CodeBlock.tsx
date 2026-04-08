"use client";

import { type ReactNode } from "react";
import { CopyCodeBlock } from "./CopyCodeBlock";

export function CodeBlock({
  children,
  ...props
}: { children?: ReactNode } & React.ComponentProps<"pre">) {
  return <CopyCodeBlock {...props}>{children}</CopyCodeBlock>;
}
