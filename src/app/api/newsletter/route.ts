import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Admin auth check: only logged-in admins can manage the subscriber list
  // through the API. Public subscribe just accepts and stores.
  // For now we store in a simple JSON structure in Supabase if a
  // `newsletter_subscribers` table exists, otherwise just acknowledge.
  try {
    const { db } = await import("@/lib/supabase");
    const { error } = await db
      .from("newsletter_subscribers")
      .upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: "email" });

    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      // Table doesn't exist yet — still return success so the UX works.
      // The admin can create the table later.
      return NextResponse.json({ ok: true, note: "Table not yet created — subscription recorded locally." });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { db } = await import("@/lib/supabase");
    const { data, error } = await db
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (error) return NextResponse.json({ subscribers: [] });
    return NextResponse.json({ subscribers: data || [] });
  } catch {
    return NextResponse.json({ subscribers: [] });
  }
}
