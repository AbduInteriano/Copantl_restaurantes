import { NextResponse } from "next/server";
import { sendEmailWithTemplate } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const payload = await req.json();
  const supabase = createClient();

  const { error } = await supabase.from("reservations").insert({
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    guests: payload.guests,
    notes: payload.notes ?? null,
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await sendEmailWithTemplate(process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_RECEIVED, {
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    guests: payload.guests,
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    notes: payload.notes ?? "",
    message:
      "Recibimos su solicitud de reservacion y pronto nos pondremos en contacto para confirmarla.",
  });

  return NextResponse.json({ ok: true });
}
