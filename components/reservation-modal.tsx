"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ReservationBookingForm } from "@/components/reservation-form";
import { ReservationSuccessActions } from "@/components/reservation-success-actions";

type Props = {
  triggerLabel?: string;
  triggerClassName?: string;
  whatsappHref: string;
};

const termsText =
  "Tu reserva esta sujeta a confirmacion por disponibilidad. El horario puede ajustarse segun aforo y eventos privados. Se recomienda llegar 10 minutos antes.";

export function ReservationModal({
  triggerLabel = "Reserva Ahora",
  triggerClassName =
    "inline-flex min-h-[48px] touch-manipulation items-center justify-center rounded-xl bg-[var(--accent-gold)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_6px_28px_rgba(102,14,26,0.55)] ring-2 ring-white/15 transition hover:brightness-110 active:scale-[0.99] sm:min-h-[52px] sm:text-lg",
  whatsappHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"form" | "success">("form");

  useEffect(() => {
    if (open) setPhase("form");
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        {triggerLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-[2px] sm:p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/40 ring-1 ring-[var(--accent-gold)]/20">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/80 px-4 py-4 sm:px-6 sm:py-5">
              <h3 className="section-title text-2xl sm:text-3xl">
                {phase === "form" ? "Reserva ahora" : "Listo"}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
              {phase === "form" ? (
                <ReservationBookingForm showTerms termsText={termsText} onSuccess={() => setPhase("success")} />
              ) : (
                <div className="flex flex-col items-center gap-6 py-6 text-center sm:py-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <CheckCircle2 size={34} strokeWidth={1.75} />
                  </div>
                  <div className="space-y-3">
                    <p className="section-title text-2xl tracking-wide sm:text-3xl">Reserva creada con exito</p>
                    <p className="max-w-md text-[var(--foreground-muted)]">
                      La reserva fue enviada pronto nos pondremos en contacto
                    </p>
                  </div>
                  <ReservationSuccessActions whatsappHref={whatsappHref} onClose={() => setOpen(false)} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
