type Dict = {
  footer: { copyright: string };
};

export function Footer({ dict }: { dict: Dict }) {
  const year = new Date().getFullYear();
  const copyright = dict.footer.copyright.replace("{year}", String(year));

  return (
    <footer className="border-t border-border py-8 mt-auto">
      <div className="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{copyright}</p>
        <div className="flex gap-4">
          <a
            href="https://github.com/yoichiozaki"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/ozakiyoichi/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            LinkedIn
          </a>
          <a
            href="https://bsky.app/profile/yoichiozaki.bsky.social"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Bluesky
          </a>
          <a
            href="https://x.com/yoichiozakix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            X
          </a>
          <a
            href="https://www.instagram.com/yoichiozaki.ig/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
