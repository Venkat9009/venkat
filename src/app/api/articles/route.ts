import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createArticle, updateArticle, deleteArticle, getArticles, getArticlesAdmin, getCategories } from "@/lib/data";
import { checkAuth, verifySameOrigin } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidSlug } from "@/lib/api";

function revalidateBlog() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/journal");
  revalidatePath("/sitemap.xml");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkAdminWriteRate(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-write:${ip}`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  return null;
}

function isSafeHttpUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) return true; // optional
  if (value.length > 2000) return false;
  try {
    const u = new URL(value);
    const isProd = process.env.NODE_ENV === "production";
    if (isProd && u.protocol !== "https:") return false;
    if (!isProd && u.protocol !== "http:" && u.protocol !== "https:") return false;
    // Block local/private hosts in prod to stop SSRF-ish cover fetches.
    if (isProd && /^(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(u.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

// Shared by POST (create, all required) and PUT (update, partial).
// Normal user sees friendly "Invalid X" messages; dev sees server logs.
function validateArticleFields(input: Record<string, unknown>, isUpdate: boolean): string | null {
  const get = (k: string) => input[k];
  if (!isUpdate) {
    if (!get("title") || !get("slug") || !get("content") || !get("category")) return "Missing required fields";
  }
  if (get("title") !== undefined && (typeof get("title") !== "string" || (get("title") as string).trim().length === 0 || (get("title") as string).length > 200)) return "Invalid title (1-200 chars)";
  if (get("content") !== undefined && (typeof get("content") !== "string" || (get("content") as string).length > 200000)) return "Invalid content (max 200k chars)";
  if (get("slug") !== undefined) {
    const slug = get("slug");
    if (!isValidSlug(slug) || !SLUG_RE.test(slug as string)) return "Invalid slug format";
  }
  if (get("category") !== undefined && (typeof get("category") !== "string" || (get("category") as string).trim().length === 0 || (get("category") as string).length > 80)) return "Invalid category (1-80 chars)";
  if (get("excerpt") !== undefined && typeof get("excerpt") !== "string") return "Invalid excerpt";
  if (typeof get("excerpt") === "string" && (get("excerpt") as string).length > 500) return "Invalid excerpt (max 500 chars)";
  if (get("cover_image") !== undefined && get("cover_image") !== null && !isSafeHttpUrl(get("cover_image"))) return "Invalid cover image URL";
  if (get("tags") !== undefined) {
    const tags = get("tags");
    if (!Array.isArray(tags) || tags.length > 20) return "Invalid tags (max 20)";
    for (const t of tags) {
      if (typeof t !== "string" || t.length === 0 || t.length > 50) return "Invalid tag (1-50 chars each)";
    }
  }
  if (get("mood") !== undefined && get("mood") !== null && (typeof get("mood") !== "string" || (get("mood") as string).length > 40)) return "Invalid mood";
  if (get("series") !== undefined && get("series") !== null && (typeof get("series") !== "string" || (get("series") as string).length > 100)) return "Invalid series";
  if (get("published") !== undefined && typeof get("published") !== "boolean") return "Invalid published flag";
  return null;
}

const ALLOWED_UPDATE_KEYS = new Set(["title", "slug", "content", "excerpt", "category", "published", "cover_image", "tags", "mood", "series"]);

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

    const articles = await getArticlesAdmin();
    return NextResponse.json({ articles });
  } catch (e) {
    console.error("[articles GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limited = checkAdminWriteRate(request);
  if (limited) return limited;

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

  const validationError = validateArticleFields(body, false);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
      const article = await createArticle({
        title: title as string,
        slug: slug as string,
        content: content as string,
        excerpt: (excerpt as string) || (content as string).replace(/[#*`>\[\]()!_~-]/g, "").slice(0, 200),
        category: category as string,
        published: (published as boolean) ?? false,
        cover_image: cover_image as string,
        tags: (tags as string[]) || [],
        mood: (mood as string) || undefined,
        series: (series as string) || undefined,
      });
    revalidateBlog();
    return NextResponse.json(article, { status: 201 });
  } catch (e) {
    console.error("[articles POST]", e);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limited = checkAdminWriteRate(request);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, ...rest } = body;

  if (!id || typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Missing or invalid article ID" }, { status: 400 });
  }

  // Whitelist: ignore unknown keys (never pass through to DB).
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (ALLOWED_UPDATE_KEYS.has(k)) data[k] = v;
  }
  const validationError = validateArticleFields(data, true);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const updated = await updateArticle(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    revalidateBlog();
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[articles PUT]", e);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!verifySameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limited = checkAdminWriteRate(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Missing or invalid article ID" }, { status: 400 });
  }

  try {
    const deleted = await deleteArticle(id);
    if (!deleted) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    revalidateBlog();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[articles DELETE]", e);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
