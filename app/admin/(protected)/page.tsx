import { createClient } from "@/lib/supabase/server";
import { AdminReservationsManager } from "@/components/admin-reservations-manager";
import type { Database } from "@/lib/supabase/types";

export default async function AdminDashboard() {
  const supabase = createClient();
  const { data } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });
  const reservations = (data ?? []) as Database["public"]["Tables"]["reservations"]["Row"][];

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Dashboard de Reservas</h1>
      <AdminReservationsManager reservations={reservations} />
    </div>
  );
}
