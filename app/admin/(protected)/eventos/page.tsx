import { EventsAdminManager } from "@/components/events-admin-manager";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export default async function EventosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("event_banners")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const items = (data ?? []) as Database["public"]["Tables"]["event_banners"]["Row"][];

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Eventos</h1>
      <EventsAdminManager items={items} />
    </div>
  );
}
