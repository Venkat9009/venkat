import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug, getArticleById } from "@/lib/data";
import { checkAuth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let article = await getArticleBySlug(slug);
    if (!article) {
      article = await getArticleById(slug);
    }

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (!article.published && !checkAuth(request)) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
