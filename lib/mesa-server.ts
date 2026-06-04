import { getTableCountMap, mapRowsToRestaurantProfiles } from "@/lib/restaurant-profiles";
import { validateMesaAssignment } from "@/lib/reservations";
import type { RestaurantKey } from "@/lib/restaurants";
import { createServiceClient } from "@/lib/supabase/admin";

export async function loadTableCountByRestaurant(): Promise<Record<RestaurantKey, number>> {
  const svc = createServiceClient();
  const { data } = await svc.from("restaurant_profiles").select("*");
  const profiles = mapRowsToRestaurantProfiles(data ?? []);
  return getTableCountMap(profiles);
}

export async function validateMesaForArea(
  mesa: number | null,
  area: string | null | undefined,
): Promise<{ ok: true; mesa: number } | { ok: false; error: string }> {
  const counts = await loadTableCountByRestaurant();
  return validateMesaAssignment(mesa, area, counts);
}
