import { supabase, db } from "./supabase";
import type { Article, ArticleListItem, Category } from "@/types";
import { countWords, calcReadingTime } from "./text";

// Re-exported so existing server-side importers keep working. Client
// components must import from "@/lib/text" directly instead.
export { countWords, calcReadingTime };
export { JOURNAL_CATEGORY } from "./text";
import { JOURNAL_CATEGORY } from "./text";

function mapArticle(a: Record<string, unknown>): Article {
  return {
    id: a.id as string,
    title: a.title as string,
    slug: a.slug as string,
    content: a.content as string,
    excerpt: a.excerpt as string,
    category: a.category as string,
    published: a.published as boolean,
    cover_image: (a.cover_image as string) || undefined,
    tags: (a.tags as string[]) || [],
    mood: (a.mood as string) || undefined,
    series: (a.series as string) || undefined,
    word_count: (a.word_count as number) || undefined,
    reading_time: (a.reading_time as number) || undefined,
    view_count: (a.view_count as number) || 0,
    like_count: (a.like_count as number) || 0,
    createdAt: a.created_at as string,
    updatedAt: a.updated_at as string,
  };
}

export async function getArticles(publishedOnly = false, category?: string): Promise<Article[]> {
  // Public path uses the anon client (RLS enforces published=true).
  // Admin callers needing drafts must use getArticlesAdmin() below, which
  // uses the service-role client that bypasses RLS.
  let query = supabase.from("articles").select("*").order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);
  if (category) {
    query = query.eq("category", category);
  } else if (publishedOnly) {
    // Journal lives on its own page (/journal) — never mix it into blog
    // listings, RSS, sitemap, or the public articles API.
    query = query.neq("category", JOURNAL_CATEGORY);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((a) => mapArticle(a));
}

// Admin-only: sees drafts + journal via service role. Callers must check
// auth before calling — this function itself does not check cookies.
export async function getArticlesAdmin(): Promise<Article[]> {
  const { data, error } = await db
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((a) => mapArticle(a));
}

// Lightweight COUNT for stats/headers — no row data transferred.
// Scales past getArticleList(1000) once the blog grows.
export async function getPublishedArticleCount(): Promise<number> {
  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .neq("category", JOURNAL_CATEGORY);
  if (error) throw error;
  return count ?? 0;
}

export async function getArticleList(limit = 6): Promise<ArticleListItem[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, category, published, cover_image, tags, mood, series, view_count, like_count, created_at")
    .eq("published", true)
    .neq("category", JOURNAL_CATEGORY)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    slug: a.slug as string,
    excerpt: a.excerpt as string,
    category: a.category as string,
    published: a.published as boolean,
    cover_image: (a.cover_image as string) || undefined,
    tags: (a.tags as string[]) || [],
    mood: (a.mood as string) || undefined,
    series: (a.series as string) || undefined,
    view_count: (a.view_count as number) || 0,
    like_count: (a.like_count as number) || 0,
    createdAt: a.created_at as string,
  }));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return mapArticle(data);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapArticle(data);
}

// Admin variants bypass RLS via service role so drafts are visible to
// authenticated callers (page + API preview). Must be gated by checkAuth.
export async function getArticleBySlugAdmin(slug: string): Promise<Article | null> {
  const { data, error } = await db.from("articles").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return mapArticle(data);
}

export async function getArticleByIdAdmin(id: string): Promise<Article | null> {
  const { data, error } = await db.from("articles").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapArticle(data);
}

export async function getSeriesArticles(series: string, excludeSlug?: string): Promise<Article[]> {
  let query = supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("series", series)
    .order("created_at", { ascending: false });
  if (excludeSlug) query = query.neq("slug", excludeSlug);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((a) => mapArticle(a));
}

export async function createArticle(data: {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  published: boolean;
  cover_image?: string;
  tags?: string[];
  mood?: string;
  series?: string;
}): Promise<Article> {
  const now = new Date().toISOString();
  const wordCount = countWords(data.content);
  const readingTime = calcReadingTime(wordCount);

  const { data: article, error } = await db
    .from("articles")
    .insert({
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt || data.content.replace(/[#*`>\[\]()!_~-]/g, "").slice(0, 200),
      category: data.category,
      published: data.published,
      cover_image: data.cover_image || null,
      tags: data.tags || [],
      mood: data.mood || null,
      series: data.series || null,
      word_count: wordCount,
      reading_time: readingTime,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapArticle(article);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.content !== undefined) {
    update.content = data.content;
    const wc = countWords(data.content);
    update.word_count = wc;
    update.reading_time = calcReadingTime(wc);
  }
  if (data.excerpt !== undefined) update.excerpt = data.excerpt;
  if (data.category !== undefined) update.category = data.category;
  if (data.published !== undefined) update.published = data.published;
  if (data.cover_image !== undefined) update.cover_image = data.cover_image;
  if (data.tags !== undefined) update.tags = data.tags;
  if (data.mood !== undefined) update.mood = data.mood;
  if (data.series !== undefined) update.series = data.series;

  const { data: article, error } = await db
    .from("articles")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error || !article) return null;
  return mapArticle(article);
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { data, error } = await db.from("articles").delete().eq("id", id).select("id");
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function getCategories(): Promise<string[]> {
  // Preferred source: the categories table (create-first, select-later).
  // Falls back to distinct article categories so the blog keeps working
  // before the migration is run or when the table is still empty.
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("name")
      .order("name", { ascending: true });
    if (!error && data && data.length > 0) {
      return data
        .map((c: { name: string }) => c.name)
        .filter((name) => name !== JOURNAL_CATEGORY);
    }
  } catch {
    // Table may not exist yet — fall through to the legacy derivation.
  }
  const { data } = await supabase.from("articles").select("category").eq("published", true).neq("category", JOURNAL_CATEGORY);
  const cats = new Set((data || []).map((a: { category: string }) => a.category));
  return Array.from(cats).sort((a, b) => a.localeCompare(b));
}

function mapCategory(c: Record<string, unknown>): Category {
  return {
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string,
    createdAt: c.created_at as string,
  };
}

export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function getCategoryList(): Promise<Category[]> {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map((c) => mapCategory(c));
}

export async function createCategory(name: string): Promise<Category> {
  const clean = name.trim();
  if (!clean) throw new Error("Category name is required");
  const slug = slugifyCategory(clean);
  if (!slug) throw new Error("Category name must contain letters or numbers");
  const { data, error } = await db
    .from("categories")
    .insert({ name: clean, slug })
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { data, error } = await db.from("categories").delete().eq("id", id).select("id");
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function getRelatedArticles(slug: string, category: string, limit = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .eq("category", category)
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  const primary = (data || []).map((a) => mapArticle(a));
  if (primary.length >= limit) return primary;
  // Fallback: fill with most recent articles outside this category so the
  // section never renders empty when a category has few posts.
  // Filter in JS instead of building a raw `not("slug","in",(...))` string,
  // which breaks on slugs containing quotes/parens and risks injection.
  const exclude = new Set([slug, ...primary.map((a) => a.slug)]);
  const { data: more } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .neq("category", JOURNAL_CATEGORY)
    .order("created_at", { ascending: false })
    .limit(limit * 3);
  const extra = ((more || []) as Record<string, unknown>[])
    .map((a) => mapArticle(a))
    .filter((a) => !exclude.has(a.slug))
    .slice(0, limit - primary.length);
  return [...primary, ...extra];
}
