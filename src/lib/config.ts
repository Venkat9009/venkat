/**
 * Central site configuration.
 *
 * Every env var is read here exactly once so the rest of the app never
 * touches `process.env` directly. Nothing throws at import time — missing
 * configuration surfaces as a clear error only when a feature that needs
 * it actually runs, which keeps `next build` working in CI/preview
 * environments without secrets.
 */

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://venkat.dev";
  return raw.replace(/\/+$/, "");
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  return url.replace(/\/+$/, "");
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
  return key;
}

export function getServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}
