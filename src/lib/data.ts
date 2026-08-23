import { supabase, db } from "./supabase";
import type { Article } from "@/types";

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

function mapArticleRow(a: Record<string, unknown>): Article {
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

export async function getArticles(publishedOnly = false): Promise<Article[]> {
  let query = supabase.from("articles").select("*").order("created_at", { ascending: false });
  if (publishedOnly) query = query.eq("published", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((a) => mapArticle(a));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return mapArticleRow(data);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapArticleRow(data);
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
  return data.map((a) => mapArticleRow(a));
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
  const wordCount = data.content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

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
  return mapArticleRow(article);
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.title !== undefined) update.title = data.title;
  if (data.slug !== undefined) update.slug = data.slug;
  if (data.content !== undefined) {
    update.content = data.content;
    update.word_count = data.content.split(/\s+/).filter(Boolean).length;
    update.reading_time = Math.max(1, Math.ceil(update.word_count as number / 200));
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
  return mapArticleRow(article);
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await db.from("articles").delete().eq("id", id);
  return !error;
}

export async function getCategories(): Promise<string[]> {
  const { data } = await supabase.from("articles").select("category").eq("published", true);
  const cats = new Set((data || []).map((a: { category: string }) => a.category));
  return Array.from(cats);
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
  if (error || !data) return [];
  return data.map((a) => mapArticleRow(a));
}
