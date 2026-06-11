"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { type Locale } from "@/i18n/config";
import { useState } from "react";

type Dict = {
  nav: { home: string; blog: string; portfolio: string; about: string };
  common: { language: string; darkMode: string; lightMode: string };
};

export function Header({ locale, dict }: { locale: Locale; dict: Dict }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const otherLocale = locale === "ja" ? "en" : "ja";
  const localeSwitchPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  const navItems = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/portfolio`, label: dict.nav.portfolio },
    { href: `/${locale}/about`, label: dict.nav.about },
  ];

  return (
    <header className="border-b border-border bg-background/70 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="group flex items-center gap-2.5"
        >
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-white shadow-sm shadow-accent/30 transition-transform group-hover:scale-105">
            Y
          </span>
          <span className="text-lg font-bold tracking-tight transition-colors group-hover:text-accent">
            Yoichi Ozaki
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative text-sm transition-colors hover:text-accent ${
                pathname === item.href
                  ? "text-accent font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
              {pathname === item.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-px rounded-full bg-gradient-to-r from-accent to-accent-2" />
              )}
            </Link>
          ))}
          <Link
            href={localeSwitchPath}
            className="text-xs font-medium text-muted-foreground hover:text-accent hover:border-accent/50 transition-colors border border-border rounded-full px-2.5 py-1"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <button
            onClick={toggleTheme}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-accent hover:bg-muted transition-colors"
            aria-label={
              theme === "dark" ? dict.common.lightMode : dict.common.darkMode
            }
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-muted-foreground"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-border px-6 py-4 bg-background space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`block text-sm transition-colors hover:text-accent ${
                pathname === item.href
                  ? "text-accent font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 pt-2 border-t border-border">
            <Link
              href={localeSwitchPath}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-muted-foreground hover:text-accent transition-colors border border-border rounded px-2 py-1"
            >
              {otherLocale.toUpperCase()}
            </Link>
            <button
              onClick={toggleTheme}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
