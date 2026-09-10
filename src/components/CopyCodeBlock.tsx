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
        className="absolute top-2.5 right-2.5 rounded-md px-2 py-1 text-xs
          transition-colors
          bg-[#252320]/85 text-[#a09d96] hover:bg-[#252320] hover:text-[#faf9f5]"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
