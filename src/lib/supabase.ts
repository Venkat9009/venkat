import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey, getServiceRoleKey } from "./config";

/**
 * Lazily-initialized Supabase clients.
 *
 * Clients are created on first use rather than at module load, so:
 * - importing this module can never throw (builds succeed without env vars),
 * - env problems surface as one clear error at the call site that needs them.
 *
 * Both clients are server-side only. The anon key is used for public reads
 * (RLS restricts it to published articles); writes go through the service
 * role client, which bypasses RLS and must never reach the browser. No
 * client component imports this module — keep it that way.
 */

function lazyClient(init: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (!instance) instance = init();
      const value = Reflect.get(instance as object, prop);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const supabase = lazyClient(() =>
  createClient(getSupabaseUrl(), getSupabaseAnonKey())
);

// Writes and admin reads use the service role. Throws at call time (not
// import time) if the key is missing, so `next build` without secrets still
// succeeds but prod fails loudly instead of silently falling back to anon
// and hitting RLS 500s.
export const db = lazyClient(() => {
  const serviceRoleKey = getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }
  return createClient(getSupabaseUrl(), serviceRoleKey);
});
