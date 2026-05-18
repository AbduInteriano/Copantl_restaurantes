import { NextResponse } from "next/server";
import { MAX_GUESTS_PER_RESERVATION } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Row = Database["public"]["Tables"]["reservations"]["Row"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = await req.json();
  const { data: existing } = await supabase.from("reservations").select("*").eq("id", params.id).single();
  const row = existing as Row | null;
  if (!row) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (payload.full_name != null) updates.full_name = String(payload.full_name).trim();
  if (payload.email != null) updates.email = String(payload.email).trim();
  if (payload.phone != null) updates.phone = String(payload.phone).trim();
  if (payload.reservation_date != null) updates.reservation_date = payload.reservation_date;
  if (payload.reservation_time != null) updates.reservation_time = payload.reservation_time;
  if (payload.notes !== undefined) updates.notes = payload.notes ? String(payload.notes) : null;

  if (payload.guests != null) {
    const g = Number(payload.guests);
    if (!Number.isFinite(g) || g < 1 || g > MAX_GUESTS_PER_RESERVATION) {
      return NextResponse.json(
        { error: `Personas debe ser entre 1 y ${MAX_GUESTS_PER_RESERVATION}.` },
        { status: 400 },
      );
    }
    updates.guests = g;
  }

  if (payload.status != null) {
    const s = payload.status as Row["status"];
    if (!["pendiente", "confirmada", "cancelada"].includes(s)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }
    updates.status = s;
    if (s === "cancelada" || s === "pendiente") {
      updates.mesa = null;
    }
  }

  if (payload.mesa !== undefined) {
    const targetStatus = (updates.status as Row["status"] | undefined) ?? row.status;
    if (targetStatus === "confirmada") {
      const m = payload.mesa == null || payload.mesa === "" ? null : Number(payload.mesa);
      if (m == null || Number.isNaN(m) || m < 1 || m > 10) {
        return NextResponse.json({ error: "Mesa debe ser del 1 al 10 si la reserva esta confirmada." }, { status: 400 });
      }
      updates.mesa = m;
    } else if (payload.mesa === null || payload.mesa === "") {
      updates.mesa = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
  }

  const nextStatus = (updates.status as Row["status"] | undefined) ?? row.status;
  const nextMesa =
    updates.mesa !== undefined ? (updates.mesa as number | null) : row.mesa;
  if (nextStatus === "confirmada" && (nextMesa == null || nextMesa < 1 || nextMesa > 10)) {
    return NextResponse.json(
      { error: "Las reservas confirmadas requieren una mesa del 1 al 10." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("reservations").update(updates as never).eq("id", params.id);

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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { error } = await supabase.from("reservations").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
