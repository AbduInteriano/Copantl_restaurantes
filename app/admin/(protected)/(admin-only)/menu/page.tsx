import {
  RestaurantMenusAdminManager,
  type RestaurantMenuRow,
} from "@/components/restaurant-menus-admin-manager";
import { DEFAULT_RESTAURANT_PROFILES, mapRowsToRestaurantProfiles } from "@/lib/restaurant-profiles";
import { createClient } from "@/lib/supabase/server";

export default async function MenusAdminPage() {
  const supabase = createClient();
  const [{ data }, { data: profiles }] = await Promise.all([
    supabase
      .from("restaurant_menu_images")
      .select("id, restaurant, image_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("restaurant_profiles").select("*"),
  ]);

  const items = (data ?? []) as RestaurantMenuRow[];
  const restaurantProfiles = profiles?.length
    ? mapRowsToRestaurantProfiles(profiles)
    : DEFAULT_RESTAURANT_PROFILES;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-4xl">Menus por restaurante</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Sube las paginas del menu en imagen para La Churrasqueria, La Posada y Cbari.
        </p>
      </div>
      <RestaurantMenusAdminManager items={items} profiles={restaurantProfiles} />
    </div>
  );
}
