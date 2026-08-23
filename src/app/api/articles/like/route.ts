import { NextRequest, NextResponse } from "next/server";
import { supabase, db } from "@/lib/supabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("articles")
      .select("like_count")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return NextResponse.json({ like_count: 0 });
    }

    return NextResponse.json({ like_count: data.like_count || 0 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`like:${ip}`, 30, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { slug?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { slug, action } = body;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const delta = action === "unlike" ? -1 : 1;

  try {
    const { data, error } = await db.rpc("increment_article_counter", {
      p_slug: slug,
      p_column: "like_count",
      p_delta: delta,
    });

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ like_count: (data as number) ?? 0 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
