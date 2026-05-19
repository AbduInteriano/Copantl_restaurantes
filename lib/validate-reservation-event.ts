import type { RestaurantKey } from "@/lib/restaurants";
import { createClient } from "@/lib/supabase/server";

export async function validateReservationEvent(
  eventId: string | null | undefined,
  restaurant: RestaurantKey,
  reservationDate: string,
): Promise<{ ok: true; eventId: string | null } | { ok: false; error: string }> {
  if (!eventId || eventId === "") {
    return { ok: true, eventId: null };
  }

  const supabase = createClient();
  const { data: event, error } = await supabase
    .from("event_banners")
    .select("id, event_date, is_active, event_banner_restaurants(restaurant)")
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return { ok: false, error: "El evento seleccionado no es valido." };
  }

  const row = event as {
    id: string;
    event_date: string | null;
    is_active: boolean;
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

  return { ok: true, eventId };
}
