import { NextRequest } from "next/server";
import crypto from "crypto";

// Single source of truth for the session cookie name, used by every route
// and server component that reads or sets it.
export const SESSION_COOKIE = "admin_token";

const TOKEN_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours — shorter window limits stolen-token blast radius
const MIN_SECRET_LENGTH = 32;

function getSecret(): string {
  // Read lazily (not at import time) so late-injected env vars in tests
  // and build-without-secrets both work. Never fall back to ADMIN_PASS:
  // a password is low-entropy and reusing it as HMAC key weakens tokens.
  return process.env.ADMIN_TOKEN_SECRET || "";
}

function isPlaceholderSecret(secret: string): boolean {
  const lower = secret.toLowerCase();
  return lower.includes("change-me") || lower.includes("changeme") || lower.includes("example") || lower.includes("your-secret");
}

export function isSecretConfigured(): boolean {
  const secret = getSecret();
  if (secret.length < MIN_SECRET_LENGTH) return false;
  if (isPlaceholderSecret(secret)) return false;
  return true;
}

export function isAdminConfigured(): boolean {
  const user = process.env.ADMIN_USER || "";
  if (!user || user.includes(":")) return false;
  if (!process.env.ADMIN_PASS) return false;
  return isSecretConfigured();
}

function hmacSign(data: string): string {
  const secret = getSecret();
  if (secret.length < MIN_SECRET_LENGTH || isPlaceholderSecret(secret)) {
    throw new Error(
      `ADMIN_TOKEN_SECRET must be at least ${MIN_SECRET_LENGTH} random characters (not a placeholder)`
    );
  }
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// Binds tokens to the current password so changing ADMIN_PASS instantly
// revokes all issued sessions. Normal user view: "changed password, logged
// out everywhere" — expected. Dev view: no DB/deny-list needed.
function getPassFingerprint(): string {
  const pass = process.env.ADMIN_PASS || "";
  return crypto.createHash("sha256").update(pass).digest("hex").slice(0, 16);
}

export function createAdminToken(username: string): string {
  // Throws if ADMIN_TOKEN_SECRET is missing/too short/placeholder — fail
  // closed instead of signing with an empty/low-entropy key.
  // Forbid ":" in username: token format is colon-delimited.
  if (username.includes(":")) throw new Error("Username must not contain ':'");
  const expiry = Date.now() + TOKEN_EXPIRY_MS;
  const fingerprint = getPassFingerprint();
  const payload = `${username}:${expiry}`;
  const signature = hmacSign(`${payload}:${fingerprint}`);
  // Buffer handles unicode usernames (btoa crashes on non-Latin1).
  return Buffer.from(`${payload}:${signature}`, "utf8").toString("base64");
}

function decodeToken(token: string): string {
  // Accept both legacy btoa tokens and new Buffer base64 tokens.
  // Buffer handles both standard base64 and base64url.
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function isValidToken(token: string | null | undefined): boolean {
  if (!token) return false;
  if (!isSecretConfigured()) return false;

  try {
    const decoded = decodeToken(token);
    // Robust split from the right: username may itself contain ":".
    // Format is user:expiry:signature where signature is 64 hex chars.
    const parts = decoded.split(":");
    if (parts.length < 3) return false;
    const signature = parts.pop() as string;
    const expiryStr = parts.pop() as string;
    const user = parts.join(":");
    const expiry = parseInt(expiryStr, 10);

    if (isNaN(expiry) || Date.now() > expiry) return false;

    const fingerprint = getPassFingerprint();
    const expectedSig = hmacSign(`${user}:${expiryStr}:${fingerprint}`);
    // Guard against length mismatch: timingSafeEqual throws instead of
    // returning false when buffers differ in length.
    if (signature.length !== expectedSig.length) return false;
    const sigMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    if (!sigMatch) return false;

    const adminUser = process.env.ADMIN_USER || "";
    if (!adminUser || user.length !== adminUser.length) return false;
    return crypto.timingSafeEqual(Buffer.from(user), Buffer.from(adminUser));
  } catch {
    return false;
  }
}

// For Route Handlers, where a NextRequest is available.
export function checkAuth(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(SESSION_COOKIE)?.value;
  const authHeader = request.headers.get("authorization");
  let headerToken: string | null = null;
  if (authHeader) {
    // Accept "Basic <token>" (legacy) and "Bearer <token>".
    const [scheme, value] = authHeader.split(" ");
    if ((scheme === "Basic" || scheme === "Bearer") && value) headerToken = value;
  }
  const token = cookieToken || headerToken;
  return isValidToken(token);
}

// For Server Components / layouts, which only have read-only cookies()
// from "next/headers" rather than a NextRequest.
export function checkAuthFromCookie(cookieToken: string | undefined | null): boolean {
  return isValidToken(cookieToken);
}

export function verifyCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  if (username.includes(":")) return false;
  const adminUser = process.env.ADMIN_USER || "";
  const adminPass = process.env.ADMIN_PASS || "";
  if (!adminUser || !adminPass) return false;
  if (username.length !== adminUser.length || password.length !== adminPass.length) return false;
  const userMatch = crypto.timingSafeEqual(Buffer.from(username), Buffer.from(adminUser));
  const passMatch = crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPass));
  return userMatch && passMatch;
}

// CSRF guard for cookie-authenticated mutations. SameSite=lax alone does
// not stop all cross-site flows, so state-changing admin routes must also
// verify Origin/Referer + Sec-Fetch-Site.
// Rules (senior-dev hardened):
// - Bearer (no cookie, Authorization header) flows like curl/mobile may omit
//   Origin — allowed.
// - Cookie flows MUST send Origin/Referer or Sec-Fetch-Site same-origin —
//   modern browsers always do on POST/PUT/DELETE. Missing = reject.
// - Sec-Fetch-Site: cross-site on cookie auth = reject outright.
export function verifySameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  const hasCookie = !!request.cookies.get(SESSION_COOKIE)?.value;
  const authHeader = request.headers.get("authorization");
  const hasBearer = !!authHeader && /^(Basic|Bearer)\s+/i.test(authHeader);

  // Explicit cross-site fetch with cookies = CSRF. Block first.
  if (hasCookie && fetchSite === "cross-site") return false;

  if (origin || referer) {
    try {
      const requestHost = new URL(request.url).host;
      if (origin && new URL(origin).host !== requestHost) return false;
      if (referer && new URL(referer).host !== requestHost) return false;
      return true;
    } catch {
      return false;
    }
  }

  // No Origin/Referer: allow Bearer/curl, block cookie mutations.
  // Same-origin navigations without Origin are GETs, never admin POSTs.
  if (hasCookie && !hasBearer) {
    // Allow only if browser explicitly says same-origin via Fetch Metadata.
    if (fetchSite === "same-origin" || fetchSite === "same-site") return true;
    return false;
  }
  return true;
}
