import { BrandLogo } from "@/components/brand-logo";
import { BeveragesCatalog } from "@/components/beverages-catalog";
import { FadeIn } from "@/components/fade-in";
import { FloatingEventsButton } from "@/components/floating-events-button";
import { ImageGridModal } from "@/components/image-grid-modal";
import { ReservationModal } from "@/components/reservation-modal";
import { SiteFooter } from "@/components/site-footer";
import { fallbackSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { CalendarDays, MapPin, Wine } from "lucide-react";

type CategoryWithItems = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  menu_items: Database["public"]["Tables"]["menu_items"]["Row"][];
};

export default async function Home() {
  const supabase = createClient();
  const [{ data: settings }, { data: categories }, { data: gallery }, { data: events }] =
    await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("menu_categories")
        .select("id,name,product_type,menu_items(id,name,brand,description,image_url,price,is_active)")
        .eq("is_active", true)
        .eq("product_type", "bebidas")
        .order("sort_order", { ascending: true }),
      supabase
        .from("gallery_items")
        .select("*")
        .eq("is_active", true)
        .limit(8)
        .order("sort_order", { ascending: true }),
      supabase
        .from("event_banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  const site = settings ?? fallbackSettings;
  const menuCategories = (categories ?? []) as CategoryWithItems[];
  const galleryItems = (gallery ?? []) as Database["public"]["Tables"]["gallery_items"]["Row"][];
  const eventItems = (events ?? []) as Database["public"]["Tables"]["event_banners"]["Row"][];
  return (
    <main className="grain-overlay overflow-x-hidden">
      <section className="mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col items-center justify-center px-5 text-center sm:min-h-[78vh] sm:px-8 lg:px-6">
        <FadeIn>
          <BrandLogo logoUrl={site.logo_url} />
          <div className="mt-10 inline-block">
            <ReservationModal
              triggerLabel="Reservar experiencia"
              triggerClassName="rounded-md border border-[var(--accent-gold)] px-6 py-3 text-[var(--accent-gold)] transition hover:bg-[var(--accent-gold)] hover:text-black"
            />
          </div>
        </FadeIn>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-2 lg:px-6">
        <FadeIn>
          <h2 className="section-title text-4xl">La experiencia CAVA</h2>
          <div className="gold-divider my-5" />
          <p className="leading-8 text-[var(--foreground-muted)]">{site.about_text}</p>
        </FadeIn>
        <FadeIn delay={0.1} className="space-y-4 rounded-xl border bg-[var(--surface)] p-6">
          <p className="flex items-center gap-3">
            <MapPin size={18} className="text-[var(--accent-gold)]" />
            {site.address}
          </p>
          <p className="flex items-center gap-3">
            <Wine size={18} className="text-[var(--accent-gold)]" />
            {site.phone}
          </p>
          <p className="flex items-center gap-3">
            <CalendarDays size={18} className="text-[var(--accent-gold)]" />
            {site.email}
          </p>
        </FadeIn>
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-6">
        <FadeIn>
          <h2 className="section-title text-4xl">Productos</h2>
        </FadeIn>
        <BeveragesCatalog categories={menuCategories} />
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-6">
        <FadeIn>
          <h2 className="section-title text-4xl">Galeria</h2>
        </FadeIn>
        <ImageGridModal title="Galeria" items={galleryItems} />
      </section>
      <SiteFooter
        phone={site.phone}
        instagramUrl={site.instagram_url}
        facebookUrl={site.facebook_url}
        tiktokUrl={site.tiktok_url}
        whatsappUrl={site.whatsapp_url}
      />
      <FloatingEventsButton items={eventItems} />
    </main>
  );
}
