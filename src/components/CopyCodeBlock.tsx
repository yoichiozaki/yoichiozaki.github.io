"use client";

import { useRef, useState, type ReactNode } from "react";

export function CopyCodeBlock({
  children,
  ...props
}: { children?: ReactNode } & React.ComponentProps<"pre">) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy code"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity
          px-2 py-1 rounded text-xs
          bg-neutral-700/80 text-neutral-200 hover:bg-neutral-600
          dark:bg-neutral-600/80 dark:hover:bg-neutral-500"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
