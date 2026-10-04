import { getArticles } from "@/lib/data";
import { getSiteUrl } from "@/lib/config";

export const revalidate = 3600;

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
  } catch (e) {
    console.error("[rss]", e);
    // Graceful degradation: return an empty feed if DB is unreachable.
  }

  const safeDate = (value: string): string => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
  };

  const items = articles
    .map(
      (article) => `
    <item>
      <title><![CDATA[${safeCdata(article.title)}]]></title>
      <description><![CDATA[${safeCdata(article.excerpt)}]]></description>
      <content:encoded><![CDATA[${safeCdata(article.content)}]]></content:encoded>
      <link>${SITE_URL}/blog/${escapeXml(article.slug)}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${escapeXml(article.slug)}</guid>
      <pubDate>${safeDate(article.createdAt)}</pubDate>
      <category>${escapeXml(article.category)}</category>
      ${(article.tags || []).map((t) => `<category>${escapeXml(t)}</category>`).join("")}
      ${article.cover_image ? `<enclosure url="${escapeXml(article.cover_image)}" type="image/jpeg" />` : ""}
      <author>nvnreddy9009@gmail.com (Venkat)</author>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
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
