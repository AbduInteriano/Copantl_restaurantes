"use client";

import { FloatingEventsButton } from "@/components/floating-events-button";
import { FloatingSocialButton } from "@/components/floating-social-button";
import type { ResolvedSocialHrefs } from "@/lib/social-hrefs";

type EventItem = {
  id: string;
  title: string | null;
  image_url: string;
};

type Props = {
  items: EventItem[];
  socialHrefs: ResolvedSocialHrefs;
};

/**
 * FABs apilados: arriba Eventos, abajo Redes (mas cercano al borde inferior).
 * Incluye margenes de zona segura en moviles/tablets.
 */
export function FloatingCornerActions({ items, socialHrefs }: Props) {
  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col-reverse gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[max(0.25rem,env(safe-area-inset-right))] sm:bottom-7 sm:right-7 sm:gap-4"
    >
      <div className="pointer-events-auto">
        <FloatingSocialButton hrefs={socialHrefs} />
      </div>
      <div className="pointer-events-auto">
        <FloatingEventsButton items={items} whatsappHref={socialHrefs.whatsappHref} embedded />
      </div>
    </div>
  );
}
