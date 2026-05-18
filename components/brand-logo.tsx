type BrandLogoProps = {
  logoUrls: [string | null | undefined, string | null | undefined, string | null | undefined];
  subtitle?: string;
};

const logoClass =
  "h-16 w-auto max-w-[7.5rem] object-contain sm:h-20 sm:max-w-[9rem] md:h-24 md:max-w-[10.5rem]";

export function BrandLogo({ logoUrls, subtitle = "By Copantl" }: BrandLogoProps) {
  const hasLogos = logoUrls.some(Boolean);

  return (
    <div className="text-center">
      {hasLogos ? (
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10">
          {logoUrls.map((url, index) =>
            url ? (
              <img
                key={index}
                src={url}
                alt={`Logo restaurante ${index + 1}`}
                className={logoClass}
              />
            ) : null,
          )}
        </div>
      ) : null}
      <p
        className={`text-xs font-medium tracking-[0.35em] text-[var(--accent-gold)] md:text-sm ${hasLogos ? "mt-4 md:mt-5" : ""}`}
      >
        — {subtitle} —
      </p>
    </div>
  );
}
