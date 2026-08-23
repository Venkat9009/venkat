import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/data";
import { checkAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await getArticles(false);
    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
