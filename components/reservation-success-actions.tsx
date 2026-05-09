"use client";

import { MessageCircle } from "lucide-react";

type Props = {
  whatsappHref: string;
  onClose: () => void;
};

export function ReservationSuccessActions({ whatsappHref, onClose }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-105"
      >
        <MessageCircle size={22} className="shrink-0" aria-hidden />
        Comunicate con nosotros
      </a>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md border border-[var(--accent-gold)] px-8 py-3 text-sm font-medium text-[var(--accent-gold)] transition hover:bg-[var(--accent-gold)] hover:text-[var(--foreground)]"
      >
        Cerrar
      </button>
    </div>
  );
}
