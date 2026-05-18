import { NextResponse } from "next/server";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const targetId = params.id;
  const body = await req.json();
  const svc = createServiceClient();

  try {
    if (body.password != null && String(body.password).length > 0) {
      const password = String(body.password);
      if (password.length < 6) {
        return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres." }, { status: 400 });
      }
      const { error } = await svc.auth.admin.updateUserById(targetId, { password });
      if (error) throw error;
    }

    if (body.role === "admin" || body.role === "supervisor") {
      if (targetId === session.userId && body.role === "supervisor") {
        return NextResponse.json(
          { error: "No puede cambiar su propio rol a supervisor." },
          { status: 400 },
        );
      }
      const { error } = await svc.from("user_profiles").upsert(
        { user_id: targetId, role: body.role } as never,
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
