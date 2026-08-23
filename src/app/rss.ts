import { getArticles } from "@/lib/data";
import { getSiteUrl } from "@/lib/config";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function rss() {
  const SITE_URL = getSiteUrl();

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles(true);
  } catch {
    // Graceful degradation: return an empty feed if DB is unreachable.
  }

  const items = articles.map((article) => `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <description><![CDATA[${article.excerpt}]]></description>
      <link>${SITE_URL}/blog/${article.slug}</link>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      <category>${escapeXml(article.category)}</category>
      <guid>${SITE_URL}/blog/${article.slug}</guid>
    </item>
  `).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Venkat — Developer &amp; Writer</title>
    <description>Personal blog about web development, React, CSS, and data science.</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
