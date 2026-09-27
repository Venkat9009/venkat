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

function safeCdata(str: string): string {
  return str.replace(/]]>/g, "]]&gt;");
}

export async function GET() {
  const SITE_URL = getSiteUrl();

  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  try {
    articles = await getArticles(true);
  } catch {
    // Graceful degradation: return an empty feed if DB is unreachable.
  }

  const items = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${safeCdata(article.title)}]]></title>
      <description><![CDATA[${safeCdata(article.excerpt)}]]></description>
      <link>${SITE_URL}/blog/${escapeXml(article.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${escapeXml(article.slug)}</guid>
      <pubDate>${new Date(article.createdAt).toUTCString()}</pubDate>
      <category>${escapeXml(article.category)}</category>
      ${(article.tags || []).map((t) => `<category>${escapeXml(t)}</category>`).join("")}
      <author>nvnreddy9009@gmail.com (Venkat)</author>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Venkat — Developer &amp; Writer</title>
    <description>Personal blog about web development, React, CSS, and data science.</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
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
