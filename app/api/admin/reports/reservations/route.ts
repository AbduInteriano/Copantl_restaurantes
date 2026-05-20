import { NextResponse } from "next/server";
import { canAccessReporting, getSessionRole } from "@/lib/admin-auth";
import { rowsToExcelBuffer } from "@/lib/excel-export";
import { formatReservationRestaurant } from "@/lib/restaurants";
import { formatReservationTimeSlotLabel } from "@/lib/reservation-time-slots";
import { createServiceClient } from "@/lib/supabase/admin";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export async function GET(req: Request) {
  const session = await getSessionRole();
  if (!session || !canAccessReporting(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from")?.trim() || "";
  const to = searchParams.get("to")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const restaurant = searchParams.get("restaurant")?.trim() || "";

  try {
    const svc = createServiceClient();
    let query = svc
      .from("reservations")
      .select(
        "full_name, email, phone, reservation_date, reservation_time, guests, area, status, notes, source, mesa, created_at, event_id, event_banners(title)",
      )
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (from) query = query.gte("reservation_date", from);
    if (to) query = query.lte("reservation_date", to);
    if (status && status !== "all") query = query.eq("status", status);
    if (restaurant && restaurant !== "all") query = query.eq("area", restaurant);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const eventJoin = r.event_banners as { title: string | null } | { title: string | null }[] | null;
      const eventTitle = Array.isArray(eventJoin)
        ? eventJoin[0]?.title
        : eventJoin?.title;
      const timeLabel = formatReservationTimeSlotLabel(
        String(r.reservation_time).slice(0, 5),
      );
      return [
        String(r.full_name),
        String(r.email),
        String(r.phone),
        formatReservationRestaurant(String(r.area)),
        eventTitle?.trim() || "Sin evento",
        Number(r.guests),
        String(r.reservation_date),
        timeLabel,
        STATUS_LABELS[String(r.status)] ?? String(r.status),
        r.mesa != null ? String(r.mesa) : "",
        r.source === "manual" ? "Manual" : "Web",
        r.notes != null ? String(r.notes) : "",
        new Date(String(r.created_at)).toLocaleString("es-HN"),
      ];
    });

    const buffer = rowsToExcelBuffer(
      "Reservaciones",
      [
        "Nombre",
        "Correo",
        "Telefono",
        "Restaurante",
        "Evento",
        "Personas",
        "Fecha",
        "Hora",
        "Estado",
        "Mesa",
        "Origen",
        "Notas",
        "Registrado",
      ],
      rows,
    );

    const suffix = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="reservaciones-${suffix}.xlsx"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al generar reporte";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
