export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export function missingConfigKeys(): string[] {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("VITE_SUPABASE_ANON_KEY");
  return missing;
}

/** Where the magic link lands. Must be in the Supabase redirect allowlist. */
export function authCallbackUrl(): string {
  return `${window.location.origin}/builder/auth/`;
}
