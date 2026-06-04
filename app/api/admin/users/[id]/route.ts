import { NextResponse } from "next/server";
import {
  ASSIGNABLE_ROLES,
  canManageUsers,
  getSessionRole,
  isProtectedAccount,
  normalizeAppRole,
} from "@/lib/admin-auth";
import type { AppRole } from "@/lib/admin-permissions";
import { createServiceClient } from "@/lib/supabase/admin";

async function getTargetEmail(svc: ReturnType<typeof createServiceClient>, targetId: string) {
  const { data, error } = await svc.auth.admin.getUserById(targetId);
  if (error || !data.user) return null;
  return data.user.email ?? null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionRole();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const targetId = params.id;
  const body = await req.json();
  const svc = createServiceClient();

  try {
    const targetEmail = await getTargetEmail(svc, targetId);
    if (!targetEmail) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
    }

    if (isProtectedAccount(targetEmail)) {
      return NextResponse.json(
        { error: "La cuenta super administrador no puede modificarse desde el panel." },
        { status: 403 },
      );
    }

    if (body.password != null && String(body.password).length > 0) {
      const password = String(body.password);
      if (password.length < 6) {
        return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres." }, { status: 400 });
      }
      const { error } = await svc.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
    }

    if (body.role != null) {
      const role = normalizeAppRole(body.role) as AppRole;
      if (!ASSIGNABLE_ROLES.includes(role)) {
        return NextResponse.json({ error: "Rol no valido." }, { status: 400 });
      }
      if (targetId === session.userId && role !== session.role && session.role !== "super_admin") {
        return NextResponse.json({ error: "No puede cambiar su propio rol." }, { status: 400 });
      }
      const { error } = await svc.from("user_profiles").upsert(
        { user_id: targetId, role } as never,
        { onConflict: "user_id" },
      );
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
