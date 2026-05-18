export type RestaurantKey = "la_churrasqueria" | "la_posada" | "cbari";

export const RESTAURANTS: {
  key: RestaurantKey;
  menuTitle: string;
  adminLabel: string;
}[] = [
  { key: "la_churrasqueria", menuTitle: "Menu La Churrasqueria", adminLabel: "La Churrasqueria" },
  { key: "la_posada", menuTitle: "Menu La Posada", adminLabel: "La Posada" },
  { key: "cbari", menuTitle: "Menu Cbari", adminLabel: "Cbari" },
];

export function getRestaurantByKey(key: RestaurantKey) {
  return RESTAURANTS.find((r) => r.key === key)!;
}
