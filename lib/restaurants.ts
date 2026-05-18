export type RestaurantKey = "la_churrasqueria" | "la_posada" | "cbari";

/** Orden en escritorio: Cbari | La Posada | La Churrasqueria */
export const RESTAURANTS: {
  key: RestaurantKey;
  menuTitle: string;
  adminLabel: string;
  shortLabel: string;
}[] = [
  { key: "cbari", menuTitle: "Menu Cbari", adminLabel: "Cbari", shortLabel: "Cbari" },
  { key: "la_posada", menuTitle: "Menu La Posada", adminLabel: "La Posada", shortLabel: "La Posada" },
  {
    key: "la_churrasqueria",
    menuTitle: "Menu La Churrasqueria",
    adminLabel: "La Churrasqueria",
    shortLabel: "La Churrasqueria",
  },
];

export function getRestaurantByKey(key: RestaurantKey) {
  return RESTAURANTS.find((r) => r.key === key)!;
}

const RESTAURANT_KEYS = new Set(RESTAURANTS.map((r) => r.key));

export function isRestaurantKey(value: string): value is RestaurantKey {
  return RESTAURANT_KEYS.has(value as RestaurantKey);
}

/** Valor guardado en reservations.area (restaurante elegido). */
export function parseReservationRestaurant(area: string | null | undefined): RestaurantKey {
  if (area && isRestaurantKey(area)) return area;
  return "cbari";
}

export function formatReservationRestaurant(area: string | null | undefined): string {
  return getRestaurantByKey(parseReservationRestaurant(area)).shortLabel;
}

export function formatReservationRestaurantLong(area: string | null | undefined): string {
  return getRestaurantByKey(parseReservationRestaurant(area)).adminLabel;
}
