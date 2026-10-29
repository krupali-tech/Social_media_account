import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// The database schema is maintained in supabase/schema.sql. Until generated
// Supabase Database types are checked into the app, use the SDK's generic
// client type so table inserts/updates aren't incorrectly inferred as "never".
let client: any;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the deployment environment.");
  }
  if (!client) {
    client = createSupabaseClient<any>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
