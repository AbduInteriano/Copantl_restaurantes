import { RestaurantReservationHoursAdmin } from "@/components/restaurant-reservation-hours-admin";
import { DEFAULT_RESTAURANT_PROFILES, mapRowsToRestaurantProfiles } from "@/lib/restaurant-profiles";
import { createClient } from "@/lib/supabase/server";

export default async function HorariosAdminPage() {
  const supabase = createClient();
  const { data } = await supabase.from("restaurant_profiles").select("*");

  const profiles = data?.length ? mapRowsToRestaurantProfiles(data) : DEFAULT_RESTAURANT_PROFILES;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-4xl">Horario de reservaciones</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Horarios en que los clientes pueden reservar mesa en cada restaurante (sin evento seleccionado).
        </p>
      </div>
      <RestaurantReservationHoursAdmin profiles={profiles} />
    </div>
  );
}
