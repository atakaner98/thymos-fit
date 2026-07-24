import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, missingConfigKeys } from "../config";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (missingConfigKeys().length > 0) {
    throw new Error(
      `Supabase config missing: ${missingConfigKeys().join(", ")}`,
    );
  }
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // Magic links verify server-side and return tokens in the URL fragment.
      // Implicit flow keeps the link usable regardless of which browser
      // profile opens it (PKCE would require the same browser that requested
      // it). This matches how the mobile deep-link flow works today.
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return client;
}
