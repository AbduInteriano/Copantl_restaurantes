import { NextResponse } from "next/server";
import { canManageReservations, getSessionRole } from "@/lib/admin-auth";
import { parseReservationRestaurant } from "@/lib/restaurants";
import { MAX_GUESTS_PER_RESERVATION } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !canManageReservations(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const supabase = createClient();

  const payload = await req.json();
  const guests = Number(payload.guests);
  if (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS_PER_RESERVATION) {
    return NextResponse.json(
      { error: `Personas debe ser entre 1 y ${MAX_GUESTS_PER_RESERVATION}.` },
      { status: 400 },
    );
  }

  const status = payload.status === "pendiente" ? "pendiente" : "confirmada";
  const area = parseReservationRestaurant(payload.area);
  let mesa: number | null = payload.mesa != null && payload.mesa !== "" ? Number(payload.mesa) : null;

  if (status === "confirmada") {
    if (mesa == null || Number.isNaN(mesa) || mesa < 1 || mesa > 10) {
      return NextResponse.json(
        { error: "Para confirmar debe elegir una mesa del 1 al 10." },
        { status: 400 },
      );
    }
  } else {
    mesa = null;
  }

  const { error } = await supabase.from("reservations").insert({
    full_name: String(payload.full_name ?? "").trim(),
    email: String(payload.email ?? "").trim(),
    phone: String(payload.phone ?? "").trim(),
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    guests,
    mesa,
    area,
    source: "manual",
    notes: payload.notes ? String(payload.notes) : null,
    status,
  } as never);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Esa mesa ya esta ocupada en esa fecha y hora." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
