import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, verifyCredentials, isAdminConfigured, SESSION_COOKIE } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    // Fail closed: without configured admin credentials nothing can ever
    // authenticate, so don't even allow the attempt.
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  const ip = getClientIp(request);
  // Tight limit: this is a login endpoint, so a handful of attempts per
  // minute per IP is plenty for a legitimate admin and slows brute-forcing.
  const rl = rateLimit(`login:${ip}`, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createAdminToken(username);

  // The token itself never needs to reach client-side JS: it lives only in
  // the httpOnly cookie, which the browser sends automatically on
  // same-origin requests. Keeping it out of the JSON body and out of
  // localStorage means an XSS on the site can't steal a long-lived
  // (24h) admin credential.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}

export async function DELETE() {
  // Actually invalidate the session server-side, rather than relying on the
  // client to just forget a locally-cached copy of the token.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
