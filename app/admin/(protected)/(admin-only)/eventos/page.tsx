import { EventsAdminManager, type EventBannerAdmin } from "@/components/events-admin-manager";
import { parseEventRestaurants } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export default async function EventosPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("event_banners")
    .select("*, event_banner_restaurants(restaurant)")
    .eq("is_active", true)
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true });

  const items: EventBannerAdmin[] = ((data ?? []) as (Database["public"]["Tables"]["event_banners"]["Row"] & {
    event_banner_restaurants?: { restaurant: string }[] | null;
  })[]).map((row) => ({
    ...row,
    restaurants: parseEventRestaurants(row.event_banner_restaurants),
  }));

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Eventos</h1>
      <p className="text-sm text-[var(--foreground-muted)]">
        Asigna fecha y uno o mas restaurantes. Los clientes podran reservar para ese evento en el restaurante elegido.
      </p>
      <EventsAdminManager items={items} />
    </div>
  );
}
