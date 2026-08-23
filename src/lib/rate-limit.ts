import type { NextRequest } from "next/server";

/**
 * Fixed-window in-memory rate limiter.
 *
 * This is best-effort protection: on serverless platforms (Vercel) each
 * warm instance keeps its own counters, so limits are per-instance. That is
 * still enough to blunt abusive bursts while staying dependency-free. For
 * strict global limits, back this with Upstash Redis or similar.
 *
 * The key map is bounded so attackers cycling spoofed client IPs cannot
 * grow it without limit (a memory-exhaustion vector).
 */

const requests = new Map<string, { count: number; resetTime: number }>();

// Upper bound on tracked buckets. When exceeded, the soonest-to-expire
// entries are evicted first — active abusers keep their bucket, stale ones
// are dropped.
const MAX_TRACKED_KEYS = 10_000;

export function getClientIp(request: NextRequest): string {
  // Behind Vercel/CDN the platform sets x-forwarded-for from the real
  // connection; the leftmost address is the originating client.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export function rateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();

  if (requests.size >= MAX_TRACKED_KEYS && !requests.has(key)) {
    let oldestKey: string | null = null;
    let oldestReset = Infinity;
    for (const [k, v] of requests) {
      if (v.resetTime < oldestReset) {
        oldestReset = v.resetTime;
        oldestKey = k;
      }
    }
    if (oldestKey !== null) requests.delete(oldestKey);
  }

  const entry = requests.get(key);

  if (!entry || now > entry.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Periodically drop expired entries so idle buckets don't linger.
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requests) {
      if (now > entry.resetTime) requests.delete(key);
    }
  }, 300_000);
  // Don't hold the process open just for cleanup (matters for scripts/tests).
  if (typeof timer === "object" && timer !== null && "unref" in timer) {
    (timer as { unref: () => void }).unref();
  }
}
