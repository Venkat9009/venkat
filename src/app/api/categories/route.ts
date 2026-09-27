import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createCategory, deleteCategory, getCategoryList } from "@/lib/data";
import { checkAuth } from "@/lib/auth";

function revalidateBlog() {
  revalidatePath("/");
  revalidatePath("/blog");
}

// Public: list categories for the article editor dropdown + blog filters.
export async function GET() {
  try {
    const categories = await getCategoryList();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Admin: create a category first, then pick it in the article form.
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
  const { name } = body as { name?: string };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }
  try {
    const category = await createCategory(name);
    revalidateBlog();
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create category";
    const status = message.includes("duplicate") || message.includes("unique") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing category ID" }, { status: 400 });
  }
  try {
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    revalidateBlog();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
