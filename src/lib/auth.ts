import { NextRequest } from "next/server";
import crypto from "crypto";

// Single source of truth for the session cookie name, used by every route
// and server component that reads or sets it.
export const SESSION_COOKIE = "admin_token";

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const SECRET = process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PASS || "";

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASS);
}

function hmacSign(data: string): string {
  return crypto.createHmac("sha256", SECRET).update(data).digest("hex");
}

export function createAdminToken(username: string): string {
  const expiry = Date.now() + TOKEN_EXPIRY_MS;
  const payload = `${username}:${expiry}`;
  const signature = hmacSign(payload);
  return btoa(`${payload}:${signature}`);
}

function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false;

  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length !== 3) return false;

    const [user, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() > expiry) return false;

    const expectedSig = hmacSign(`${user}:${expiryStr}`);
    // Guard against length mismatch: timingSafeEqual throws instead of
    // returning false when buffers differ in length.
    if (signature.length !== expectedSig.length) return false;
    const sigMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    if (!sigMatch) return false;

    return !!process.env.ADMIN_USER;
  } catch {
    return false;
  }
}

// For Route Handlers, where a NextRequest is available.
export function checkAuth(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const authHeader = request.headers.get("authorization");
  const token = cookieToken || (authHeader?.startsWith("Basic ") ? authHeader.split(" ")[1] : null);
  return isValidToken(token);
}

// For Server Components / layouts, which only have read-only cookies()
// from "next/headers" rather than a NextRequest.
export function checkAuthFromCookie(cookieToken: string | undefined | null): boolean {
  return isValidToken(cookieToken);
}

export function verifyCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  const adminUser = process.env.ADMIN_USER || "";
  const adminPass = process.env.ADMIN_PASS || "";
  if (!adminUser || !adminPass) return false;
  if (username.length !== adminUser.length || password.length !== adminPass.length) return false;
  const userMatch = crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUser));
  const passMatch = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPass));
  return userMatch && passMatch;
}
