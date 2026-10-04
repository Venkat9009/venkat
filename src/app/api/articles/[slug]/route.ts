import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug, getArticleById, getArticleBySlugAdmin, getArticleByIdAdmin } from "@/lib/data";
import { checkAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const isAdmin = checkAuth(request);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    // Admins must see drafts: try service-role reads first when authed,
    // otherwise public (RLS-filtered) reads so drafts stay 404.
    // Only hit getById when slug looks like a UUID — avoids wasted DB
    // queries and slug-vs-ID confusion for normal slugs.
    let article = isAdmin ? await getArticleBySlugAdmin(slug) : await getArticleBySlug(slug);
    if (!article && isUuid) {
      article = isAdmin ? await getArticleByIdAdmin(slug) : await getArticleById(slug);
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.published && !isAdmin) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
