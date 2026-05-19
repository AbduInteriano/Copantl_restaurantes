import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ResolvedSocialHrefs } from "@/lib/social-hrefs";

type Props = {
  hrefs: ResolvedSocialHrefs;
  /** compact = footer; touch = panel flotante / mayor área táctil */
  variant?: "compact" | "touch";
  /** etiquetas visibles solo en variant touch */
  showLabels?: boolean;
};

const instagramPath =
  "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5ZM17.75 6a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z";
const facebookPath =
  "M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5h1.7V5.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.6v8h3.4Z";
const tiktokPath =
  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z";

type SocialItem = {
  key: string;
  href: string | null;
  label: string;
  icon: ReactNode;
};

export function SocialLinkButtons({ hrefs, variant = "compact", showLabels = false }: Props) {
  const isTouch = variant === "touch";

  const linkBase = isTouch
    ? "flex min-h-[48px] w-full min-w-0 items-center justify-center gap-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--foreground)] shadow-sm outline-none transition hover:border-[var(--accent-gold)] hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] active:scale-[0.99] sm:min-h-[52px] sm:py-3.5"
    : "rounded-md border border-[var(--border)] p-2 text-[var(--foreground-muted)] outline-none transition hover:border-[var(--accent-gold)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

  const iconWrap = isTouch ? "h-6 w-6 shrink-0 sm:h-7 sm:w-7" : "h-4 w-4";
  const labelClass = "truncate text-sm font-medium tracking-wide sm:text-base";

  const items: SocialItem[] = [
    {
      key: "instagram",
      href: hrefs.instagramHref,
      label: "Instagram",
      icon: (
        <svg viewBox="0 0 24 24" className={`${iconWrap} fill-current`} aria-hidden="true">
          <path d={instagramPath} />
        </svg>
      ),
    },
    {
      key: "facebook",
      href: hrefs.facebookHref,
      label: "Facebook",
      icon: (
        <svg viewBox="0 0 24 24" className={`${iconWrap} fill-current`} aria-hidden="true">
          <path d={facebookPath} />
        </svg>
      ),
    },
    {
      key: "tiktok",
      href: hrefs.tiktokHref,
      label: "TikTok",
      icon: (
        <svg viewBox="0 0 24 24" className={`${iconWrap} fill-current`} aria-hidden="true">
          <path d={tiktokPath} />
        </svg>
      ),
    },
    {
      key: "whatsapp",
      href: hrefs.whatsappHref,
      label: "WhatsApp",
      icon: (
        <MessageCircle
          className={isTouch ? "shrink-0 sm:scale-110" : ""}
          size={isTouch ? 24 : 16}
          strokeWidth={2}
          aria-hidden="true"
        />
      ),
    },
  ];

  const visible = items.filter((item) => item.href);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div
      className={
        isTouch
          ? "grid w-full grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-2 sm:gap-4 md:mx-auto"
          : "flex flex-wrap items-center justify-center gap-3 sm:gap-4"
      }
    >
      {visible.map((item) => (
        <a
          key={item.key}
          href={item.href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className={`${linkBase} ${isTouch && showLabels ? "justify-start sm:justify-center" : ""}`}
        >
          {showLabels && isTouch ? (
            <>
              {item.icon}
              <span className={labelClass}>{item.label}</span>
            </>
          ) : (
            item.icon
          )}
        </a>
      ))}
    </div>
  );
}
