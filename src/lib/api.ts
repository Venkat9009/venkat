import { NextRequest, NextResponse } from "next/server";

export function badRequest(message = "Bad request") {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Server error") {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function tooMany(message = "Too many requests") {
  return NextResponse.json({ error: message }, { status: 429 });
}

export async function parseJson<T>(req: NextRequest): Promise<{ ok: true; body: T } | { ok: false; res: NextResponse }> {
  try {
    const body = (await req.json()) as T;
    return { ok: true, body };
  } catch {
    return { ok: false, res: badRequest("Invalid JSON") };
  }
}

export function getSlugParam(url: string): string | null {
  try {
    const { searchParams } = new URL(url);
    return searchParams.get("slug");
  } catch {
    return null;
  }
}

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === "string" && slug.length > 0 && slug.length <= 200;
}
