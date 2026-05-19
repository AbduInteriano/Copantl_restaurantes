"use client";

import { FadeIn } from "@/components/fade-in";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

type OpeningHour = { day: string; hours: string };

type Props = {
  title?: string;
  aboutText: string;
  address: string;
  phone: string;
  email: string;
  openingHours?: OpeningHour[];
};

export function SiteInfoSection({
  title = "Copantl Reservaciones",
  aboutText,
  address,
  phone,
  email,
  openingHours = [],
}: Props) {
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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-3 bg-white p-5 transition hover:bg-[var(--accent-gold)]/5 sm:p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] transition group-hover:bg-[var(--accent-gold)]/20">
                <MapPin size={20} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">Ubicacion</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]">{address}</p>
              </div>
            </a>

            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="group flex flex-col gap-3 bg-white p-5 transition hover:bg-[var(--accent-gold)]/5 sm:p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] transition group-hover:bg-[var(--accent-gold)]/20">
                <Phone size={20} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">Telefono</p>
                <p className="mt-1 text-sm text-[var(--foreground)]">{phone}</p>
              </div>
            </a>

            <a
              href={`mailto:${email}`}
              className="group flex flex-col gap-3 bg-white p-5 transition hover:bg-[var(--accent-gold)]/5 sm:p-6"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] transition group-hover:bg-[var(--accent-gold)]/20">
                <Mail size={20} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">Correo</p>
                <p className="mt-1 break-all text-sm text-[var(--foreground)]">{email}</p>
              </div>
            </a>
          </div>

          {openingHours.length > 0 ? (
            <div className="border-t border-[var(--border)] bg-[var(--background-secondary)]/50 px-6 py-5 sm:px-8">
              <p className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--accent-gold)]">
                <Clock size={14} />
                Horarios
              </p>
              <ul className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6">
                {openingHours.map((row) => (
                  <li key={row.day} className="flex justify-between gap-4 text-sm sm:flex-col sm:gap-0 sm:text-center">
                    <span className="font-medium text-[var(--foreground)]">{row.day}</span>
                    <span className="text-[var(--foreground-muted)]">{row.hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </FadeIn>
    </section>
  );
}
