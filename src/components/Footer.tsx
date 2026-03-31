import { SocialLinks } from "./SocialLinks";

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
        <SocialLinks className="flex gap-4" />
      </div>
    </footer>
  );
}
