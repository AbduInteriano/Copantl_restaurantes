import { NextResponse } from "next/server";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const svc = createServiceClient();
    const { data: listData, error: listError } = await svc.auth.admin.listUsers({ perPage: 200 });
    if (listError) throw listError;

    const { data: profiles, error: pErr } = await svc.from("user_profiles").select("user_id, role");
    if (pErr) throw pErr;

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id as string, p.role as string]));
    const users = (listData.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      role: (profileMap.get(u.id) as "admin" | "supervisor" | undefined) ?? "admin",
    }));

    return NextResponse.json({ users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al listar usuarios";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = body.role === "admin" ? "admin" : "supervisor";

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
