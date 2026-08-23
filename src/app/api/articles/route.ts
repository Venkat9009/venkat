import { NextRequest, NextResponse } from "next/server";
import { createArticle, updateArticle, deleteArticle, getArticles, getCategories } from "@/lib/data";
import { checkAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");
    const category = searchParams.get("category");

    if (published === "true") {
      let articles = await getArticles(true);
      if (category) {
        articles = articles.filter((a) => a.category === category);
      }
      const categories = await getCategories();
      return NextResponse.json({ articles, categories });
    }

    if (!checkAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await getArticles(false);
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, slug, content, excerpt, category, published, cover_image, tags, mood, series } = body as {
    title?: string; slug?: string; content?: string; excerpt?: string;
    category?: string; published?: boolean; cover_image?: string;
    tags?: string[]; mood?: string; series?: string;
  };

  if (!title || !slug || !content || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
      const article = await createArticle({
        title,
        slug,
        content,
        excerpt: excerpt || content.replace(/[#*`>\[\]()!_~-]/g, "").slice(0, 200),
        category,
        published: published ?? false,
        cover_image,
        tags: tags || [],
        mood: mood || undefined,
        series: series || undefined,
      });
    return NextResponse.json(article, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...data } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
  }

  try {
    const updated = await updateArticle(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing article ID" }, { status: 400 });
  }

  try {
    const deleted = await deleteArticle(id);
    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
