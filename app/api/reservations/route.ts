import { NextResponse } from "next/server";
import { sendEmailWithTemplate } from "@/lib/email";
import { MAX_GUESTS_PER_RESERVATION } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const payload = await req.json();
  const guests = Number(payload.guests);
  if (!Number.isFinite(guests) || guests < 1 || guests > MAX_GUESTS_PER_RESERVATION) {
    return NextResponse.json(
      { error: `El numero de personas debe estar entre 1 y ${MAX_GUESTS_PER_RESERVATION}.` },
      { status: 400 },
    );
  }

  const area =
    payload.area === "terraza" || payload.area === "climatizado" ? payload.area : "climatizado";

  const supabase = createClient();

  const rowWithArea = {
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    reservation_date: payload.reservation_date,
    reservation_time: payload.reservation_time,
    guests,
    mesa: null,
    area,
    source: "web",
    notes: payload.notes ?? null,
  };

  let { error } = await supabase.from("reservations").insert(rowWithArea as never);

  // Si aun no migraste la columna `area` en Supabase, reintentar sin ese campo
  if (error && /area|schema cache/i.test(error.message)) {
    const { area: _omit, ...withoutArea } = rowWithArea;
    ({ error } = await supabase.from("reservations").insert(withoutArea as never));
  }

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
    area: area === "terraza" ? "Terraza" : "Climatizado",
    notes: payload.notes ?? "",
    message:
      "Recibimos su solicitud de reservacion y pronto nos pondremos en contacto para confirmarla.",
  });

  return NextResponse.json({ ok: true });
}
