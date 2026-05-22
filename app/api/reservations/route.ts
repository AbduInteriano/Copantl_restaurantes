import { NextResponse } from "next/server";
import { sendReservationReceivedEmail } from "@/lib/reservation-email";
import { parseReservationRestaurant } from "@/lib/restaurants";
import { MAX_GUESTS_PER_RESERVATION } from "@/lib/reservations";
import { validateReservationEvent } from "@/lib/validate-reservation-event";
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

  const area = parseReservationRestaurant(payload.area);
  const reservationDate = String(payload.reservation_date ?? "");

  const reservationTime = String(payload.reservation_time ?? "");
  const eventCheck = await validateReservationEvent(
    payload.event_id,
    area,
    reservationDate,
    reservationTime,
  );
  if (!eventCheck.ok) {
    return NextResponse.json({ error: eventCheck.error }, { status: 400 });
  }

  const supabase = createClient();

  const rowWithArea = {
    full_name: payload.full_name,
    email: payload.email,
    phone: payload.phone,
    reservation_date: reservationDate,
    reservation_time: payload.reservation_time,
    guests,
    mesa: null,
    area,
    event_id: eventCheck.eventId,
    source: "web",
    notes: payload.notes ?? null,
  };

  let { error } = await supabase.from("reservations").insert(rowWithArea as never);

  if (error && /area|event_id|schema cache/i.test(error.message)) {
    const { area: _a, event_id: _e, ...withoutOptional } = rowWithArea;
    ({ error } = await supabase.from("reservations").insert(withoutOptional as never));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await sendReservationReceivedEmail({
    full_name: String(payload.full_name),
    email: String(payload.email),
    phone: payload.phone,
    guests,
    reservation_date: reservationDate,
    reservation_time: reservationTime,
    mesa: null,
    area,
    notes: payload.notes ?? null,
  });

  return NextResponse.json({ ok: true });
}
