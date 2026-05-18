type BrandLogoProps = {
  logoUrl?: string | null;
};

/**
 * Brillo/glow solo en el titulo "CAVA" (sin forma ni sombra detras del logo).
 * Pon `false` para titulo plano. Opcional: borra el bloque en `app/globals.css`.
 */
export const BRAND_HERO_SHINE_ENABLED = true;

const logoBaseClass =
  "block mx-auto mb-2 h-16 w-16 origin-center scale-[2.2] object-contain sm:h-20 sm:w-20 sm:scale-[2.4] md:h-24 md:w-24 md:scale-[2.76]";

export function BrandLogo({ logoUrl }: BrandLogoProps) {
  const shine = BRAND_HERO_SHINE_ENABLED;

  return (
    <div className={`text-center ${shine ? "brand-hero-shine-wrap" : ""}`}>
      {logoUrl ? <img src={logoUrl} alt="Logo CAVA" className={logoBaseClass} /> : null}
      <h1
        className={`section-title text-5xl tracking-[0.3em] md:text-7xl ${shine ? "brand-hero-title-shine" : "text-[var(--accent-gold)]"}`}
      >
        CAVA
      </h1>
      <p className="mt-2 text-xs tracking-[0.35em] text-white md:text-sm">
        — DRINKS EXPERIENCE —
      </p>
    </div>
  );
}
