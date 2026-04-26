import type { MetadataRoute } from "next";
import { CATEGORIES, THEMES } from "@/data/coloring-pages";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromaaura.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,                lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/studio`,          lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/pricing`,         lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/gallery`,         lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE_URL}/coloring-pages`,  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map(c => ({
    url: `${SITE_URL}/coloring-pages/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const themeRoutes: MetadataRoute.Sitemap = THEMES.map(t => ({
    url: `${SITE_URL}/coloring-pages/${t.category}/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...themeRoutes];
}
