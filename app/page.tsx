import { BrandLogo } from "@/components/brand-logo";
import { BeveragesCatalog } from "@/components/beverages-catalog";
import { FadeIn } from "@/components/fade-in";
import { FloatingCornerActions } from "@/components/floating-corner-actions";
import { ImageGridModal } from "@/components/image-grid-modal";
import { ReservationModal } from "@/components/reservation-modal";
import { SiteFooter } from "@/components/site-footer";
import { fallbackSettings } from "@/lib/data";
import { resolveSocialHrefs } from "@/lib/social-hrefs";
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
  const socialHrefs = resolveSocialHrefs({
    phone: site.phone,
    instagramUrl: site.instagram_url,
    facebookUrl: site.facebook_url,
    tiktokUrl: site.tiktok_url,
    whatsappUrl: site.whatsapp_url,
  });

  return (
    <main className="overflow-x-hidden">
      <section
        className="mobile-landing-hero relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-5 text-center sm:min-h-[78vh] sm:px-8 lg:px-6"
        aria-label="Inicio"
      >
        <FadeIn>
          <BrandLogo
            logoUrls={[site.logo_url, site.logo_url_2, site.logo_url_3]}
            subtitle="By Copantl"
          />
          <div className="mt-8 w-full max-w-sm px-1 sm:mt-10 sm:max-w-md">
            <ReservationModal
              whatsappHref={socialHrefs.whatsappHref}
              triggerLabel="Reservar"
              triggerClassName="btn-primary min-h-[48px] w-full px-6 py-3.5 text-center text-base leading-tight sm:min-h-[52px] sm:px-8 sm:text-lg"
            />
          </div>
        </FadeIn>
      </section>

      <div className="grain-overlay relative">
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-10 sm:px-8 sm:py-14 md:grid-cols-2 lg:px-6">
        <FadeIn>
          <h2 className="section-title text-4xl">Copantl Reservaciones</h2>
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
      </div>

      <FloatingCornerActions items={eventItems} socialHrefs={socialHrefs} />
    </main>
  );
}
