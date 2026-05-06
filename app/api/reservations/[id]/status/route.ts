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

  const { error } = await supabase
    .from("reservations")
    .update({ status: payload.status } as never)
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const isConfirmed = payload.status === "confirmada";
  await sendEmailWithTemplate(process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_STATUS, {
    full_name: reservationData.full_name,
    email: reservationData.email,
    status: payload.status,
    reservation_date: reservationData.reservation_date,
    reservation_time: reservationData.reservation_time,
    message: isConfirmed
      ? "Tu reservacion ha sido confirmada. Te esperamos en CAVA."
      : "Tu reservacion no pudo ser confirmada en esta ocasion. Puedes escribirnos para nuevas opciones.",
  });

  return NextResponse.json({ ok: true });
}
