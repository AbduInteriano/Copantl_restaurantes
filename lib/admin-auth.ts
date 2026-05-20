import {
  type AppRole,
  canManageUsers,
  isProtectedAccount,
  isSuperAdminEmail,
  normalizeAppRole,
} from "@/lib/admin-permissions";
import { createClient } from "@/lib/supabase/server";

export type { AppRole } from "@/lib/admin-permissions";
export {
  APP_ROLE_LABELS,
  ASSIGNABLE_ROLES,
  SUPER_ADMIN_EMAIL,
  canAccessReporting,
  canManageContent,
  canManageReservations,
  canManageUsers,
  getDefaultAdminPath,
  getRoleLabel,
  isProtectedAccount,
  isSuperAdminEmail,
  normalizeAppRole,
} from "@/lib/admin-permissions";

export type SessionRole = {
  userId: string;
  role: AppRole;
  email: string | null;
};

/**
 * Rol efectivo del usuario en el panel.
 * Sin fila en user_profiles: compatibilidad con cuentas anteriores (admin).
 * Correo super admin siempre se trata como super_admin.
 */
export async function getSessionRole(): Promise<SessionRole | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const email = user.email ?? null;
  if (isSuperAdminEmail(email)) {
    return { userId: user.id, role: "super_admin", email };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const r = profile as { role: string } | null;
  const role = normalizeAppRole(r?.role);

  return { userId: user.id, role, email };
}

/** @deprecated Use canManageContent / canManageUsers from admin-permissions */
export function isAdminRole(role: AppRole): boolean {
  return canManageUsers(role) || role === "super_admin";
}

export async function requireSession(): Promise<SessionRole> {
  const session = await getSessionRole();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
