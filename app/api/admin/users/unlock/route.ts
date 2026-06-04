import { NextResponse } from "next/server";
import { canManageUsers, getSessionRole, isProtectedAccount } from "@/lib/admin-auth";
import { adminUnlockLogin, normalizeLoginEmail } from "@/lib/login-lockout";
import { createServiceClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    let email = String(body.email ?? "").trim();

    if (!email && body.userId) {
      const svc = createServiceClient();
      const { data, error } = await svc.auth.admin.getUserById(String(body.userId));
      if (error || !data.user?.email) {
        return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
      }
      email = data.user.email;
    }

    const normalized = normalizeLoginEmail(email);
    if (!normalized) {
      return NextResponse.json({ error: "Correo invalido." }, { status: 400 });
    }

    if (isProtectedAccount(normalized) && !isProtectedAccount(session.email)) {
      return NextResponse.json({ error: "No autorizado para desbloquear esta cuenta." }, { status: 403 });
    }

    await adminUnlockLogin(normalized);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo desbloquear";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
