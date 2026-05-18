/** Variables de Supabase (local y Vercel). */
export function getSupabaseUrl(): string | undefined {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  return (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)?.trim() || undefined;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  )?.trim() || undefined;
}

export function describeMissingSupabaseEnv(): string {
  const missing: string[] = [];
  if (!getSupabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!getSupabaseServiceRoleKey()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length === 0) return "";
  return `Faltan en el servidor: ${missing.join(", ")}. En Vercel: Settings → Environment Variables (Production y Preview) → Redeploy. En local: web/.env.local y reinicia npm run dev.`;
}
