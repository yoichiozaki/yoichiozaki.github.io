import { locales } from "@/i18n/config";
import { getAllSlugs } from "@/lib/blog";
import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const baseUrl = "https://yoichiozaki.github.io";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // Static pages
    entries.push(
      { url: `${baseUrl}/${locale}`, lastModified: new Date() },
      { url: `${baseUrl}/${locale}/blog`, lastModified: new Date() },
      { url: `${baseUrl}/${locale}/portfolio`, lastModified: new Date() },
      { url: `${baseUrl}/${locale}/about`, lastModified: new Date() }
    );

    // Blog posts
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      entries.push({
        url: `${baseUrl}/${locale}/blog/${slug}`,
        lastModified: new Date(),
      });
    }
  }

  return entries;
}
