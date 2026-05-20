import { NextResponse } from "next/server";
import { canAccessReporting, getSessionRole } from "@/lib/admin-auth";
import { rowsToExcelBuffer } from "@/lib/excel-export";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getSessionRole();
  if (!session || !canAccessReporting(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const svc = createServiceClient();
    const { data, error } = await svc
      .from("reservations")
      .select("full_name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const seen = new Set<string>();
    const unique: { full_name: string; email: string; phone: string }[] = [];

    for (const row of data ?? []) {
      const r = row as { full_name: string; email: string; phone: string };
      const key = `${r.email.trim().toLowerCase()}|${r.phone.trim()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(r);
    }

    const buffer = rowsToExcelBuffer(
      "Reservantes",
      ["Nombre", "Correo", "Telefono"],
      unique.map((r) => [r.full_name, r.email, r.phone]),
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reservantes-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar reporte";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
