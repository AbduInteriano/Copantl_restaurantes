type BrandLogoProps = {
  logoUrl?: string | null;
};

export function BrandLogo({ logoUrl }: BrandLogoProps) {
  return (
    <div className="text-center">
      {logoUrl && (
        <img
          src={logoUrl}
          alt="Logo CAVA"
          className="block mx-auto mb-2 h-16 w-16 origin-center scale-[2.2] rounded-full object-contain sm:h-20 sm:w-20 sm:scale-[2.4] md:h-24 md:w-24 md:scale-[2.76]"
        />
      )}
      <h1 className="section-title text-5xl tracking-[0.3em] text-[var(--accent-gold)] md:text-7xl">
        CAVA
      </h1>
      <p className="mt-2 text-xs tracking-[0.35em] text-[var(--foreground-muted)] md:text-sm">
        — DRINKS EXPERIENCE —
      </p>
    </div>
  );
}
