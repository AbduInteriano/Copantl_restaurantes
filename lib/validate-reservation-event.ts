import { getRestaurantProfile, type RestaurantProfile } from "@/lib/restaurant-profiles";
import {
  buildReservationTimeSlots,
  isTimeWithinSlots,
  normalizeTimeToHhMm,
} from "@/lib/reservation-time-slots";
import type { RestaurantKey } from "@/lib/restaurants";
import { createClient } from "@/lib/supabase/server";

export async function validateReservationEvent(
  eventId: string | null | undefined,
  restaurant: RestaurantKey,
  reservationDate: string,
  reservationTime: string,
): Promise<{ ok: true; eventId: string | null } | { ok: false; error: string }> {
  const time = normalizeTimeToHhMm(reservationTime);

  if (!eventId || eventId === "") {
    const supabase = createClient();
    const { data: profile, error: profileError } = await supabase
      .from("restaurant_profiles")
      .select("reservation_start_time, reservation_end_time")
      .eq("restaurant", restaurant)
      .maybeSingle();

    if (profileError) {
      return { ok: false, error: "No se pudo validar el horario del restaurante." };
    }

    const row = profile as { reservation_start_time: string; reservation_end_time: string } | null;
    const slots = row
      ? buildReservationTimeSlots(row.reservation_start_time, row.reservation_end_time)
      : buildReservationTimeSlots("13:00", "22:00");

    if (!isTimeWithinSlots(time, slots)) {
      return { ok: false, error: "La hora elegida no esta dentro del horario de reservas del restaurante." };
    }

    return { ok: true, eventId: null };
  }

  const supabase = createClient();
  const { data: event, error } = await supabase
    .from("event_banners")
    .select(
      "id, event_date, is_active, reservation_start_time, reservation_end_time, event_banner_restaurants(restaurant)",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return { ok: false, error: "El evento seleccionado no es valido." };
  }

  const row = event as {
    id: string;
    event_date: string | null;
    is_active: boolean;
    reservation_start_time: string | null;
    reservation_end_time: string | null;
    event_banner_restaurants?: { restaurant: string }[] | null;
  };

  if (!row.is_active) {
    return { ok: false, error: "El evento seleccionado ya no esta disponible." };
  }

  if (row.event_date !== reservationDate) {
    return { ok: false, error: "El evento no coincide con la fecha de la reserva." };
  }

  const restaurants = (row.event_banner_restaurants ?? []).map((r) => r.restaurant);
  if (!restaurants.includes(restaurant)) {
    return { ok: false, error: "Este evento no esta disponible en el restaurante elegido." };
  }

  let slots: string[];
  if (row.reservation_start_time && row.reservation_end_time) {
    slots = buildReservationTimeSlots(row.reservation_start_time, row.reservation_end_time);
  } else {
    const { data: profile } = await supabase
      .from("restaurant_profiles")
      .select("reservation_start_time, reservation_end_time")
      .eq("restaurant", restaurant)
      .maybeSingle();
    const p = profile as { reservation_start_time: string; reservation_end_time: string } | null;
    slots = p
      ? buildReservationTimeSlots(p.reservation_start_time, p.reservation_end_time)
      : buildReservationTimeSlots("13:00", "22:00");
  }

  const slotsForCheck = slots;
  if (!isTimeWithinSlots(time, slotsForCheck)) {
    return { ok: false, error: "La hora elegida no esta dentro del horario del evento." };
  }

  return { ok: true, eventId };
}

/** Valida horario sin evento usando perfiles ya cargados (cliente). */
export function validateReservationTimeLocal(
  restaurant: RestaurantKey,
  reservationTime: string,
  profiles: RestaurantProfile[],
  event?: { reservation_start_time: string | null; reservation_end_time: string | null } | null,
): boolean {
  const time = normalizeTimeToHhMm(reservationTime);
  if (event?.reservation_start_time && event.reservation_end_time) {
    const slots = buildReservationTimeSlots(event.reservation_start_time, event.reservation_end_time);
    return isTimeWithinSlots(time, slots);
  }
  const profile = getRestaurantProfile(profiles, restaurant);
  const slots = buildReservationTimeSlots(profile.reservation_start_time, profile.reservation_end_time);
  return isTimeWithinSlots(time, slots);
}
