import { redirect } from "next/navigation";
import { AdminReservationsDashboard } from "@/components/admin-reservations-dashboard";
import {
  canAccessReporting,
  canManageContent,
  canManageReservations,
  getSessionRole,
} from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
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
  const { data: reservations } = await supabase
    .from("reservations")
    .select("*, event_banners(title)")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });

  const { data: events } = await supabase
    .from("event_banners")
    .select("id, title")
    .eq("is_active", true);

  const eventTitles = Object.fromEntries(
    (events ?? []).map((e) => {
      const row = e as { id: string; title: string | null };
      return [row.id, row.title?.trim() || "Evento"];
    }),
  );

  return (
    <AdminReservationsDashboard reservations={reservations ?? []} eventTitles={eventTitles} />
  );
}
