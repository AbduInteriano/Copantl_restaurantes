import type { RestaurantKey } from "@/lib/restaurants";

export type BookableEvent = {
  id: string;
  title: string | null;
  event_date: string | null;
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
    event_banner_restaurants?: { restaurant: string }[] | null;
  }[],
): BookableEvent[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    event_date: row.event_date,
    restaurants: parseEventRestaurants(row.event_banner_restaurants),
  }));
}
