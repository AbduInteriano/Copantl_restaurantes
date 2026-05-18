import { NextResponse } from "next/server";
import { sendEmailWithTemplate } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const payload = await req.json();
  const supabase = createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", params.id)
    .single();
  const reservationData = reservation as
    | Database["public"]["Tables"]["reservations"]["Row"]
    | null;

  if (!reservationData) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const status = payload.status as Database["public"]["Tables"]["reservations"]["Row"]["status"];
  const updates: Record<string, unknown> = { status };

  if (status === "confirmada") {
    const mesa = payload.mesa != null ? Number(payload.mesa) : NaN;
    if (!Number.isFinite(mesa) || mesa < 1 || mesa > 10) {
      return NextResponse.json(
        { error: "Debe asignar una mesa del 1 al 10 para confirmar." },
        { status: 400 },
      );
    }
    updates.mesa = mesa;
  } else if (status === "cancelada" || status === "pendiente") {
    updates.mesa = null;
  }

  const { error } = await supabase
    .from("reservations")
    .update(updates as never)
    .eq("id", params.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Esa mesa ya esta ocupada en esa fecha y hora." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const isConfirmed = status === "confirmada";
  const mesaLabel =
    isConfirmed && typeof updates.mesa === "number" ? String(updates.mesa) : "";
  await sendEmailWithTemplate(process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_STATUS, {
    full_name: reservationData.full_name,
    email: reservationData.email,
    status,
    reservation_date: reservationData.reservation_date,
    reservation_time: reservationData.reservation_time,
    mesa: mesaLabel,
    message: isConfirmed
      ? `Tu reservacion ha sido confirmada. Mesa asignada: ${mesaLabel}. Te esperamos en Copantl Reservaciones.`
      : "Tu reservacion no pudo ser confirmada en esta ocasion. Puedes escribirnos para nuevas opciones.",
  });

  return NextResponse.json({ ok: true });
}
