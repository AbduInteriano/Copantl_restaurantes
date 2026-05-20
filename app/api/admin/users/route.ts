import { NextResponse } from "next/server";
import {
  ASSIGNABLE_ROLES,
  canManageUsers,
  getSessionRole,
  isProtectedAccount,
  normalizeAppRole,
} from "@/lib/admin-auth";
import type { AppRole } from "@/lib/admin-permissions";
import { getLockoutsByEmails, isCurrentlyLocked, normalizeLoginEmail } from "@/lib/login-lockout";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSessionRole();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const svc = createServiceClient();
    const { data: listData, error: listError } = await svc.auth.admin.listUsers({ perPage: 200 });
    if (listError) throw listError;

    const { data: profiles, error: pErr } = await svc.from("user_profiles").select("user_id, role");
    if (pErr) throw pErr;

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id as string, normalizeAppRole(p.role as string)]),
    );

    const emails = (listData.users ?? []).map((u) => normalizeLoginEmail(u.email ?? ""));
    const lockoutMap = await getLockoutsByEmails(emails);

    const users = (listData.users ?? []).map((u) => {
      const email = u.email ?? "";
      const normalized = normalizeLoginEmail(email);
      const lockRow = lockoutMap.get(normalized) ?? null;
      const lockStatus = isCurrentlyLocked(lockRow);
      const role: AppRole = isProtectedAccount(email)
        ? "super_admin"
        : profileMap.get(u.id) ?? "admin";
      return {
        id: u.id,
        email,
        role,
        protected: isProtectedAccount(email),
        loginLocked: lockStatus.locked,
        failedAttempts: lockRow?.failed_attempts ?? 0,
        lockedMinutesLeft: lockStatus.minutesLeft,
      };
    });

    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al listar usuarios";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = normalizeAppRole(body.role);

    if (isProtectedAccount(email)) {
      return NextResponse.json({ error: "No se puede crear otro super administrador." }, { status: 400 });
    }

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: "Rol no valido." }, { status: 400 });
    }

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Correo valido y contrasena de al menos 6 caracteres." },
        { status: 400 },
      );
    }

    const svc = createServiceClient();
    const { data: created, error: createError } = await svc.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    if (!created.user) throw new Error("Usuario no creado");

    const { error: insErr } = await svc.from("user_profiles").insert({
      user_id: created.user.id,
      role,
    } as never);
    if (insErr) {
      await svc.auth.admin.deleteUser(created.user.id);
      throw insErr;
    }

    return NextResponse.json({ ok: true, id: created.user.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear usuario";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
