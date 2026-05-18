"use client";

import { useState } from "react";
import { getRestaurantLogoPaths } from "@/lib/restaurant-logos";

type BrandLogoProps = {
  subtitle?: string;
};

const logoClass =
  "h-16 w-auto max-w-[7.5rem] object-contain sm:h-20 sm:max-w-[9rem] md:h-24 md:max-w-[10.5rem]";

function LogoImage({ candidates, alt }: { candidates: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  if (!src || index >= candidates.length) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={logoClass}
      onError={() => {
        if (index < candidates.length - 1) setIndex((i) => i + 1);
      }}
    />
  );
}

export function BrandLogo({ subtitle = "By Copantl" }: BrandLogoProps) {
  const logos = getRestaurantLogoPaths();

  return (
    <div className="text-center">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
        {logos.map((logo) => (
          <LogoImage key={logo.alt} candidates={logo.candidates} alt={logo.alt} />
        ))}
      </div>
      <p className="mt-4 text-xs font-medium tracking-[0.35em] text-[var(--accent-gold)] md:mt-5 md:text-sm">
        — {subtitle} —
      </p>
    </div>
  );
}
