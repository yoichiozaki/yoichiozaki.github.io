const links = [
  {
    href: "https://github.com/yoichiozaki",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.58l-.01-2.04c-3.34.73-4.04-1.61-4.04-1.61a3.18 3.18 0 0 0-1.33-1.76c-1.09-.74.08-.73.08-.73a2.52 2.52 0 0 1 1.84 1.24 2.56 2.56 0 0 0 3.5 1 2.56 2.56 0 0 1 .76-1.6c-2.67-.3-5.47-1.33-5.47-5.93a4.64 4.64 0 0 1 1.24-3.22 4.3 4.3 0 0 1 .12-3.18s1-.32 3.3 1.23a11.38 11.38 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23a4.3 4.3 0 0 1 .12 3.18 4.64 4.64 0 0 1 1.24 3.22c0 4.61-2.81 5.63-5.48 5.92a2.87 2.87 0 0 1 .81 2.22l-.01 3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/in/ozakiyoichi/",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54A1.75 1.75 0 0 0 1.77 24h20.45A1.75 1.75 0 0 0 24 22.27V1.73A1.75 1.75 0 0 0 22.22 0Z" />
      </svg>
    ),
  },
  {
    href: "https://bsky.app/profile/yoichiozaki.bsky.social",
    label: "Bluesky",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 10.8c-1.87-2.37-5.12-5.87-6.72-7.15C4.1 2.7 2 1.5 2 4.1c0 .52.3 4.36.47 4.98.6 2.15 2.8 2.7 4.77 2.36-3.48.6-4.36 2.57-2.45 4.54 3.63 3.75 5.23-.94 5.63-2.14.08-.23.13-.34.13-.25 0-.09.05.02.13.25.4 1.2 2 5.89 5.63 2.14 1.91-1.97 1.03-3.94-2.45-4.54 1.97.34 4.17-.21 4.77-2.36.18-.62.47-4.46.47-4.98 0-2.6-2.1-1.4-3.28-.45-1.6 1.28-4.85 4.78-6.72 7.15Z" />
      </svg>
    ),
  },
  {
    href: "https://x.com/yoichiozakix",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.59l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.48 3.24H4.3l13.31 17.41Z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/yoichiozaki.ig/",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M7.03 0C3.15 0 0 3.15 0 7.03v9.94C0 20.85 3.15 24 7.03 24h9.94C20.85 24 24 20.85 24 16.97V7.03C24 3.15 20.85 0 16.97 0H7.03Zm0 2h9.94A5.05 5.05 0 0 1 22 7.03v9.94A5.05 5.05 0 0 1 16.97 22H7.03A5.05 5.05 0 0 1 2 16.97V7.03A5.05 5.05 0 0 1 7.03 2Zm11.22 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
      </svg>
    ),
  },
];

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={className}>
      {links.map(({ href, label, icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-accent transition-colors"
          aria-label={label}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
