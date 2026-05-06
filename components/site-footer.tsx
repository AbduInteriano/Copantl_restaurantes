import { MessageCircle } from "lucide-react";

type Props = {
  phone: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappUrl?: string | null;
};

export function SiteFooter({ phone, instagramUrl, facebookUrl, tiktokUrl, whatsappUrl }: Props) {
  const whatsappNumber = phone.replace(/[^\d]/g, "");
  const whatsappHref = whatsappUrl || `https://wa.me/${whatsappNumber}`;
  const instagramHref = instagramUrl || "https://www.instagram.com/cava.honduras/";
  const facebookHref = facebookUrl || "https://www.facebook.com/Cavahonduras";
  const tiktokHref = tiktokUrl || "https://www.tiktok.com/@cavadrinks";

  return (
    <footer className="mx-auto mt-8 w-full max-w-6xl border-t border-[var(--border)] px-4 py-5 sm:mt-10 sm:px-6 sm:py-6">
      <div className="flex flex-col items-center justify-between gap-4 text-sm text-[var(--foreground-muted)] md:flex-row">
        <p className="text-center text-xs sm:text-sm">
          2026 Cava Drinks Experience. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-3">
          <a
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="rounded-md border p-2 hover:border-[var(--accent-gold)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5ZM17.75 6a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
            </svg>
          </a>
          <a
            href={facebookHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="rounded-md border p-2 hover:border-[var(--accent-gold)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5h1.7V5.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.6v8h3.4Z" />
            </svg>
          </a>
          <a
            href={tiktokHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="rounded-md border p-2 hover:border-[var(--accent-gold)]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="rounded-md border p-2 hover:border-[var(--accent-gold)]"
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
