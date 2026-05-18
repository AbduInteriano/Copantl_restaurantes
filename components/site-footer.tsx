import { resolveSocialHrefs, type SocialUrlsInput } from "@/lib/social-hrefs";
import { SocialLinkButtons } from "@/components/social-link-buttons";

type Props = SocialUrlsInput;

export function SiteFooter(props: Props) {
  const hrefs = resolveSocialHrefs(props);

  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl border-t border-[var(--border)] px-4 py-5 sm:mt-10 sm:px-6 sm:py-6">
      <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--foreground-muted)] md:flex-row md:gap-6">
        <p className="text-center text-xs sm:text-sm">
          2026 Cava Drinks Experience. Todos los derechos reservados.
        </p>
        <SocialLinkButtons hrefs={hrefs} variant="compact" />
      </div>
    </footer>
  );
}
