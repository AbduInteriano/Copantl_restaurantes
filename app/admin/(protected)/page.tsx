import { createClient } from "@/lib/supabase/server";
import { AdminReservationsDashboard } from "@/components/admin-reservations-dashboard";
import type { Database } from "@/lib/supabase/types";

export default async function AdminDashboard() {
  const supabase = createClient();
  const [{ data }, { data: events }] = await Promise.all([
    supabase
      .from("reservations")
      .select("*")
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("event_banners").select("id, title"),
  ]);
  const reservations = (data ?? []) as Database["public"]["Tables"]["reservations"]["Row"][];
  const eventTitles = Object.fromEntries(
    ((events ?? []) as { id: string; title: string | null }[]).map((e) => [
      e.id,
      e.title?.trim() || "Evento",
    ]),
  );

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Dashboard de Reservas</h1>
      <AdminReservationsDashboard reservations={reservations} eventTitles={eventTitles} />
    </div>
  );
}
