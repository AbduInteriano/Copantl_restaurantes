"use client";

import { FadeIn } from "@/components/fade-in";
import { Mail, MapPin, Phone } from "lucide-react";

type Props = {
  title?: string;
  aboutText: string;
  address: string;
  phone: string;
  email: string;
};

export function SiteInfoSection({
  title = "Copantl Reservaciones",
  aboutText,
  address,
  phone,
  email,
}: Props) {
  const contactItems = [
    {
      key: "address",
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      external: true,
      icon: MapPin,
      label: "Ubicacion",
      value: address,
    },
    {
      key: "phone",
      href: `tel:${phone.replace(/\s/g, "")}`,
      external: false,
      icon: Phone,
      label: "Telefono",
      value: phone,
    },
    {
      key: "email",
      href: `mailto:${email}`,
      external: false,
      icon: Mail,
      label: "Correo",
      value: email,
    },
  ] as const;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-6">
      <FadeIn>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent-gold)]/8 via-transparent to-transparent px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-gold)]">Hotel Copantl</p>
            <h2 className="section-title mt-3 text-3xl sm:text-4xl">{title}</h2>
            <div className="gold-divider mx-auto my-5 max-w-[120px]" />
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--foreground-muted)] sm:text-lg">
              {aboutText}
            </p>
          </div>

          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-3">
            {contactItems.map(({ key, href, external, icon: Icon, label, value }) => (
              <a
                key={key}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex flex-col items-center bg-white p-5 text-center transition hover:bg-[var(--accent-gold)]/5 sm:p-6"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] transition group-hover:bg-[var(--accent-gold)]/20">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">{label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
