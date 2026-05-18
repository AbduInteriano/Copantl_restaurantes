"use client";

import { useState } from "react";
import { ReservationModal } from "@/components/reservation-modal";
import { getHeroBannerCandidates } from "@/lib/restaurant-logos";

type Props = {
  subtitle?: string;
  whatsappHref: string;
};

function HeroBannerImage() {
  const candidates = getHeroBannerCandidates();
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src || index >= candidates.length) {
    return (
      <div className="flex h-28 w-full max-w-xl items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--foreground-muted)] sm:h-36">
        Coloca restaurantes.png en public/logos/
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Restaurantes Copantl"
      className="mx-auto block h-auto w-full max-w-xl object-contain sm:max-w-2xl md:max-w-3xl"
      onError={() => {
        if (index < candidates.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}

export function HeroLanding({ subtitle = "By Copantl", whatsappHref }: Props) {
  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-5 text-center sm:gap-6">
      <HeroBannerImage />
      <p className="text-xs font-medium tracking-[0.35em] text-[var(--accent-gold)] sm:text-sm">— {subtitle} —</p>
      <div className="w-full max-w-sm px-1 sm:max-w-md">
        <ReservationModal
          whatsappHref={whatsappHref}
          triggerLabel="Reservar"
          triggerClassName="btn-primary min-h-[48px] w-full px-6 py-3.5 text-center text-base leading-tight sm:min-h-[52px] sm:px-8 sm:text-lg"
        />
      </div>
    </div>
  );
}
