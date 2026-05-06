import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "supervisor";

/**
 * Rol efectivo del usuario en el panel.
 * Sin fila en user_profiles: se trata como administrador (compatibilidad con cuentas anteriores).
 */
export async function getSessionRole(): Promise<{ userId: string; role: AppRole; email: string | null } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const r = profile as { role: string } | null;
  const role: AppRole =
    r?.role === "supervisor" ? "supervisor" : r?.role === "admin" ? "admin" : "admin";

  return { userId: user.id, role, email: user.email ?? null };
}

export function isAdminRole(role: AppRole): boolean {
  return role === "admin";
}
