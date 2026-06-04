import { NextResponse } from "next/server";
import { canAccessReporting, getSessionRole } from "@/lib/admin-auth";
import { rowsToExcelBuffer } from "@/lib/excel-export";
import { formatReservationRestaurant } from "@/lib/restaurants";
import { formatReservationTimeSlotLabel } from "@/lib/reservation-time-slots";
import { createServiceClient, hasServiceClientConfig } from "@/lib/supabase/admin";
import { describeMissingSupabaseEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const VALID_STATUS = new Set(["pendiente", "confirmada", "cancelada"]);

export async function GET(req: Request) {
  const session = await getSessionRole();
  if (!session || !canAccessReporting(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!hasServiceClientConfig()) {
    return NextResponse.json(
      { error: describeMissingSupabaseEnv() || "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 },
    );
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
        "full_name, email, phone, reservation_date, reservation_time, guests, area, status, notes, source, mesa, created_at, event_id",
      )
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (from) query = query.gte("reservation_date", from);
    if (to) query = query.lte("reservation_date", to);
    if (status && status !== "all" && VALID_STATUS.has(status)) {
      query = query.eq("status", status as "pendiente" | "confirmada" | "cancelada");
    }
    if (restaurant && restaurant !== "all") query = query.eq("area", restaurant);

    const { data, error } = await query;
    if (error) throw error;

    const eventIds = [
      ...new Set(
        (data ?? [])
          .map((row) => (row as { event_id: string | null }).event_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const eventTitleById = new Map<string, string>();
    if (eventIds.length > 0) {
      const { data: events } = await svc.from("event_banners").select("id, title").in("id", eventIds);
      for (const ev of events ?? []) {
        const e = ev as { id: string; title: string | null };
        eventTitleById.set(e.id, e.title?.trim() || "Evento");
      }
    }

    const rows = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const eventId = r.event_id as string | null;
      const timeLabel = formatReservationTimeSlotLabel(String(r.reservation_time).slice(0, 5));
      return [
        String(r.full_name),
        String(r.email),
        String(r.phone),
        formatReservationRestaurant(String(r.area)),
        eventId ? eventTitleById.get(eventId) ?? "Evento" : "Sin evento",
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
