import { redirect } from "next/navigation";
import { AdminReservationsDashboard } from "@/components/admin-reservations-dashboard";
import {
  canAccessReporting,
  canManageContent,
  canManageReservations,
  getSessionRole,
} from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { mapRowsToRestaurantProfiles } from "@/lib/restaurant-profiles";
import { getBusinessTodayDateKey } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReservationsPage() {
  const session = await getSessionRole();
  if (!session) redirect(adminPath("/login"));

  if (!canManageReservations(session.role)) {
    if (canManageContent(session.role)) {
      redirect(adminPath("/menu"));
    }
    if (canAccessReporting(session.role)) {
      redirect(adminPath("/reporteria"));
    }
    redirect(adminPath("/login"));
  }

  const supabase = createClient();
  const today = getBusinessTodayDateKey();
  const [{ data: reservations }, { data: events }, { data: profileRows }] = await Promise.all([
    supabase
      .from("reservations")
      .select("*, event_banners(title)")
      .gte("reservation_date", today)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true }),
    supabase.from("event_banners").select("id, title").eq("is_active", true),
    supabase.from("restaurant_profiles").select("*"),
  ]);

  const eventTitles = Object.fromEntries(
    (events ?? []).map((e) => {
      const row = e as { id: string; title: string | null };
      return [row.id, row.title?.trim() || "Evento"];
    }),
  );

  const restaurantProfiles = mapRowsToRestaurantProfiles(profileRows ?? []);

  return (
    <AdminReservationsDashboard
      reservations={reservations ?? []}
      eventTitles={eventTitles}
      restaurantProfiles={restaurantProfiles}
    />
  );
}
