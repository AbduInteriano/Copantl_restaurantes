import type { RestaurantKey } from "@/lib/restaurants";
import { normalizeTimeToHhMm } from "@/lib/reservation-time-slots";

export type BookableEvent = {
  id: string;
  title: string | null;
  event_date: string | null;
  reservation_start_time: string | null;
  reservation_end_time: string | null;
  restaurants: RestaurantKey[];
};

export type CalendarEventItem = {
  id: string;
  title: string | null;
  image_url: string;
  event_date: string | null;
  restaurants?: RestaurantKey[];
};

export function formatEventOptionLabel(event: Pick<BookableEvent, "title" | "event_date">): string {
  const name = event.title?.trim() || "Evento";
  if (!event.event_date) return name;
  const [y, m, d] = event.event_date.split("-").map(Number);
  if (!y || !m || !d) return name;
  const dateLabel = new Intl.DateTimeFormat("es-HN", { day: "numeric", month: "short" }).format(
    new Date(y, m - 1, d),
  );
  return `${name} (${dateLabel})`;
}

export function eventsForReservation(
  events: BookableEvent[],
  restaurant: RestaurantKey,
  reservationDate: string,
): BookableEvent[] {
  if (!reservationDate) return [];
  return events.filter(
    (e) => e.event_date === reservationDate && e.restaurants.includes(restaurant),
  );
}

/** Eventos disponibles en el selector segun restaurante y/o fecha actuales. */
export function eventsForSelector(
  events: BookableEvent[],
  restaurant: RestaurantKey | "",
  reservationDate: string,
): BookableEvent[] {
  return events
    .filter((e) => {
      if (!e.event_date) return false;
      if (restaurant && !e.restaurants.includes(restaurant)) return false;
      if (reservationDate && e.event_date !== reservationDate) return false;
      return true;
    })
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
}

export function findBookableEvent(events: BookableEvent[], eventId: string): BookableEvent | undefined {
  return events.find((e) => e.id === eventId);
}

export function parseEventRestaurants(
  rows: { restaurant: string }[] | null | undefined,
): RestaurantKey[] {
  if (!rows?.length) return [];
  const valid = new Set<RestaurantKey>(["cbari", "la_posada", "la_churrasqueria"]);
  return rows.map((r) => r.restaurant).filter((r): r is RestaurantKey => valid.has(r as RestaurantKey));
}

export function mapRowsToBookableEvents(
  rows: {
    id: string;
    title: string | null;
    event_date: string | null;
    reservation_start_time?: string | null;
    reservation_end_time?: string | null;
    event_banner_restaurants?: { restaurant: string }[] | null;
  }[],
): BookableEvent[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    event_date: row.event_date,
    reservation_start_time: row.reservation_start_time
      ? normalizeTimeToHhMm(row.reservation_start_time)
      : null,
    reservation_end_time: row.reservation_end_time ? normalizeTimeToHhMm(row.reservation_end_time) : null,
    restaurants: parseEventRestaurants(row.event_banner_restaurants),
  }));
}
