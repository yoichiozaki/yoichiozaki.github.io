"use client";

import { type ReactNode } from "react";

type InteractiveDemoProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

/**
 * Styled container for embedding interactive demos inside MDX prose.
 * Breaks out of the prose flow with a distinct visual treatment.
 */
export function InteractiveDemo({
  title,
  description,
  children,
}: InteractiveDemoProps) {
  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-muted/50 overflow-hidden">
      {(title || description) && (
        <div className="border-b border-border px-5 py-3">
          {title && (
            <h3 className="text-base font-semibold text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
