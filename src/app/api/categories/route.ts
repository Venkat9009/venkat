import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createCategory, deleteCategory, getCategoryList } from "@/lib/data";
import { checkAuth, verifySameOrigin } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function revalidateBlog() {
  revalidatePath("/");
  revalidatePath("/blog");
}

function checkAdminWriteRate(request: NextRequest): NextResponse | null {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-write:${ip}`, 60, 60000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public: list categories for the article editor dropdown + blog filters.
export async function GET() {
  try {
    const categories = await getCategoryList();
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("[categories GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Admin: create a category first, then pick it in the article form.
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
  const { name } = body as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  if (name.trim().length > 80) {
    return NextResponse.json({ error: "Category name too long (max 80)" }, { status: 400 });
  }
  try {
    const category = await createCategory(name);
    revalidateBlog();
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    console.error("[categories POST]", err);
    const raw = err instanceof Error ? err.message : "";
    const isDuplicate = /duplicate|unique|already exists/i.test(raw);
    // Never echo raw DB messages (e.g. key values) to the client.
    return NextResponse.json(
      { error: isDuplicate ? "Category already exists" : "Failed to create category" },
      { status: isDuplicate ? 409 : 500 }
    );
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
    return NextResponse.json({ error: "Missing or invalid category ID" }, { status: 400 });
  }
  try {
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    revalidateBlog();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[categories DELETE]", e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
