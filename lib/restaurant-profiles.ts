import type { RestaurantKey } from "@/lib/restaurants";
import { normalizeTimeToHhMm } from "@/lib/reservation-time-slots";

export type RestaurantProfile = {
  restaurant: RestaurantKey;
  reservation_start_time: string;
  reservation_end_time: string;
  display_hours_text: string;
  table_count: number;
};

export const DEFAULT_TABLE_COUNTS: Record<RestaurantKey, number> = {
  la_posada: 20,
  cbari: 10,
  la_churrasqueria: 10,
};

export const DEFAULT_RESTAURANT_PROFILES: RestaurantProfile[] = [
  {
    restaurant: "cbari",
    reservation_start_time: "13:00",
    reservation_end_time: "22:00",
    display_hours_text: "",
    table_count: DEFAULT_TABLE_COUNTS.cbari,
  },
  {
    restaurant: "la_posada",
    reservation_start_time: "13:00",
    reservation_end_time: "22:00",
    display_hours_text: "",
    table_count: DEFAULT_TABLE_COUNTS.la_posada,
  },
  {
    restaurant: "la_churrasqueria",
    reservation_start_time: "13:00",
    reservation_end_time: "22:00",
    display_hours_text: "",
    table_count: DEFAULT_TABLE_COUNTS.la_churrasqueria,
  },
];

export function mapRowsToRestaurantProfiles(
  rows: {
    restaurant: string;
    reservation_start_time: string;
    reservation_end_time: string;
    display_hours_text: string;
    table_count?: number | null;
  }[] | null | undefined,
): RestaurantProfile[] {
  const byKey = new Map<RestaurantKey, RestaurantProfile>();
  for (const fallback of DEFAULT_RESTAURANT_PROFILES) {
    byKey.set(fallback.restaurant, { ...fallback });
  }
  for (const row of rows ?? []) {
    const key = row.restaurant as RestaurantKey;
    if (!byKey.has(key)) continue;
    const count = Number(row.table_count);
    byKey.set(key, {
      restaurant: key,
      reservation_start_time: normalizeTimeToHhMm(row.reservation_start_time),
      reservation_end_time: normalizeTimeToHhMm(row.reservation_end_time),
      display_hours_text: row.display_hours_text ?? "",
      table_count:
        Number.isFinite(count) && count >= 1 ? Math.floor(count) : DEFAULT_TABLE_COUNTS[key],
    });
  }
  return DEFAULT_RESTAURANT_PROFILES.map((d) => byKey.get(d.restaurant)!);
}

export function getRestaurantProfile(
  profiles: RestaurantProfile[],
  restaurant: RestaurantKey,
): RestaurantProfile {
  return (
    profiles.find((p) => p.restaurant === restaurant) ??
    DEFAULT_RESTAURANT_PROFILES.find((p) => p.restaurant === restaurant)!
  );
}

export function getTableCountMap(profiles: RestaurantProfile[]): Record<RestaurantKey, number> {
  return Object.fromEntries(profiles.map((p) => [p.restaurant, p.table_count])) as Record<
    RestaurantKey,
    number
  >;
}

export function isValidMesaForRestaurant(mesa: number, tableCount: number): boolean {
  return Number.isInteger(mesa) && mesa >= 1 && mesa <= tableCount;
}
