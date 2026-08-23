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

const serviceRoleKey = getServiceRoleKey();

// Writes use the service role when available; otherwise they fall back to
// the anon client and will fail against RLS instead of crashing on startup.
export const db = lazyClient(() =>
  serviceRoleKey
    ? createClient(getSupabaseUrl(), serviceRoleKey)
    : createClient(getSupabaseUrl(), getSupabaseAnonKey())
);
