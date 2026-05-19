import { EventsPanel } from "@/components/events-panel";
import { GalleryCarousel } from "@/components/gallery-carousel";
import { HeroLanding } from "@/components/hero-landing";
import { RestaurantMenusDisplay, type RestaurantMenuImage } from "@/components/restaurant-menus-display";
import { SiteFooter } from "@/components/site-footer";
import { SiteInfoSection } from "@/components/site-info-section";
import { FadeIn } from "@/components/fade-in";
import { fallbackSettings } from "@/lib/data";
import { mapRowsToBookableEvents } from "@/lib/events";
import { resolveSocialHrefs } from "@/lib/social-hrefs";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { RestaurantKey } from "@/lib/restaurants";

const GALLERY_MAX = 10;

export default async function Home() {
  const supabase = createClient();
  const [{ data: settings }, { data: menuImages }, { data: gallery }, { data: events }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("restaurant_menu_images")
      .select("id, restaurant, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("gallery_items")
      .select("id, image_url, title")
      .eq("is_active", true)
      .limit(GALLERY_MAX)
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_banners")
      .select("id, title, image_url, event_date, sort_order, event_banner_restaurants(restaurant)")
      .eq("is_active", true)
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true }),
  ]);

  const site = settings ?? fallbackSettings;
  const menus = ((menuImages ?? []) as Database["public"]["Tables"]["restaurant_menu_images"]["Row"][]).map(
    (row) => ({
      id: row.id,
      restaurant: row.restaurant as RestaurantKey,
      image_url: row.image_url,
      sort_order: row.sort_order,
    }),
  ) satisfies RestaurantMenuImage[];
  const galleryItems = ((gallery ?? []) as Pick<
    Database["public"]["Tables"]["gallery_items"]["Row"],
    "id" | "image_url" | "title"
  >[]).map((g) => ({
    id: g.id,
    image_url: g.image_url,
    title: g.title,
  }));

  const bookableEvents = mapRowsToBookableEvents(events ?? []);
  const calendarEvents = (events ?? []).map((e) => {
    const row = e as {
      id: string;
      title: string | null;
      image_url: string;
      event_date: string | null;
      event_banner_restaurants?: { restaurant: string }[] | null;
    };
    return {
      id: row.id,
      title: row.title,
      image_url: row.image_url,
      event_date: row.event_date,
      restaurants: mapRowsToBookableEvents([row])[0]?.restaurants ?? [],
    };
  });

  const socialHrefs = resolveSocialHrefs({
    phone: site.phone,
    instagramUrl: site.instagram_url,
    facebookUrl: site.facebook_url,
    tiktokUrl: site.tiktok_url,
    whatsappUrl: site.whatsapp_url,
  });

  const openingHours = Array.isArray(site.opening_hours)
    ? (site.opening_hours as { day: string; hours: string }[])
    : fallbackSettings.opening_hours;

  return (
    <main className="overflow-x-hidden">
      <section
        className="mobile-landing-hero relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[78vh] sm:px-8 sm:py-12 lg:px-6"
        aria-label="Inicio"
      >
        <FadeIn>
          <HeroLanding subtitle="By Copantl" whatsappHref={socialHrefs.whatsappHref} bookableEvents={bookableEvents} />
        </FadeIn>
      </section>

      <div className="grain-overlay relative">
        <SiteInfoSection
          aboutText={site.about_text}
          address={site.address}
          phone={site.phone}
          email={site.email}
          openingHours={openingHours}
        />

        <EventsPanel items={calendarEvents} bookableEvents={bookableEvents} whatsappHref={socialHrefs.whatsappHref} />

        <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16 lg:px-6">
          <FadeIn>
            <h2 className="section-title text-4xl">Nuestros menus</h2>
            <p className="mt-3 max-w-2xl text-[var(--foreground-muted)]">
              Elige un restaurante para ver su menu completo.
            </p>
          </FadeIn>
          <RestaurantMenusDisplay items={menus} />
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-12 sm:px-8 sm:pb-16 lg:px-6">
          <FadeIn>
            <GalleryCarousel items={galleryItems} />
          </FadeIn>
        </section>

        <SiteFooter
          phone={site.phone}
          instagramUrl={site.instagram_url}
          facebookUrl={site.facebook_url}
          tiktokUrl={site.tiktok_url}
          whatsappUrl={site.whatsapp_url}
        />
      </div>
    </main>
  );
}
