import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/data";
import { getSiteUrl } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = getSiteUrl();

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles(true);
  } catch {
    // Graceful degradation: if DB is unreachable (e.g., during build without
    // env vars) still return the static pages rather than crashing.
  }

  const now = new Date();
  const articleEntries: MetadataRoute.Sitemap = articles
    .filter((article) => {
      const d = new Date(article.updatedAt);
      return !isNaN(d.getTime());
    })
    .map((article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(article.cover_image ? { images: [article.cover_image] } : {}),
    }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/journal`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    ...articleEntries,
  ];
}
