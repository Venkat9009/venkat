import { NextRequest, NextResponse } from "next/server";
import { supabase, db } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { tooMany } from "@/lib/api";

export function withRateLimit(
  req: NextRequest,
  bucket: string,
  max: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(req);
  const rl = rateLimit(`${bucket}:${ip}`, max, windowMs);
  if (!rl.allowed) return tooMany(bucket === "login" ? "Too many attempts. Try again in a minute." : "Too many requests. Try again later.");
  return null;
}

export async function getCounter(slug: string, column: "like_count" | "view_count"): Promise<number> {
  const { data } = await supabase.from("articles").select(column).eq("slug", slug).single();
  const row = data as Record<string, number | null> | null;
  return row?.[column] || 0;
}

export async function getPublishedArticleId(slug: string): Promise<boolean> {
  const { data } = await supabase.from("articles").select("id,published").eq("slug", slug).single();
  const row = data as { published?: boolean } | null;
  return !!row?.published;
}

export async function incrementCounter(
  slug: string,
  column: "like_count" | "view_count",
  delta: number
): Promise<{ ok: true; value: number } | { ok: false }> {
  const { data, error } = await db.rpc("increment_article_counter", {
    p_slug: slug,
    p_column: column,
    p_delta: delta,
  });
  if (error) return { ok: false };
  return { ok: true, value: (data as number) ?? 0 };
}
