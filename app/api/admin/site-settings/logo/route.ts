import { NextResponse } from "next/server";
import { canManageContent, getSessionRole } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/admin";

const SETTINGS_LOGO_FIELDS = new Set(["logo_url", "logo_url_2", "logo_url_3"]);

export async function PATCH(req: Request) {
  const session = await getSessionRole();
  if (!session || !canManageContent(session.role)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  let body: { field?: string; value?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const field = body.field;
  if (!field || !SETTINGS_LOGO_FIELDS.has(field)) {
    return NextResponse.json({ error: "Campo no válido." }, { status: 400 });
  }

  try {
    const svc = createServiceClient();
    const { error } = await svc.from("site_settings").update({ [field]: body.value ?? null }).eq("id", 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al actualizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
