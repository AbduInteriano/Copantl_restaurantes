"use client";

import { FLOATING_FAB_BUTTON_CLASS } from "@/components/floating-fab-classes";
import { ReservationBookingForm } from "@/components/reservation-form";
import { ReservationSuccessActions } from "@/components/reservation-success-actions";
import { CalendarHeart, ChevronLeft, ChevronRight, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  title: string | null;
  image_url: string;
};

type Props = {
  items: EventItem[];
  whatsappHref: string;
  /** Sin posición fixed; para usar dentro de FloatingCornerActions */
  embedded?: boolean;
};

type SheetView = "events" | "reserve" | "success";

export function FloatingEventsButton({ items, whatsappHref, embedded }: Props) {
  const [open, setOpen] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>("events");
  const [reserveKey, setReserveKey] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? items[selectedIndex] : null;
  const isTwoOrLess = items.length <= 2;
  const containerWidthClass = items.length <= 1 ? "max-w-md" : items.length === 2 ? "max-w-3xl" : "max-w-5xl";

  useEffect(() => {
    if (open) {
      setSheetView("events");
    }
  }, [open]);

  function closeAll() {
    setOpen(false);
    setSheetView("events");
    setSelectedIndex(null);
  }

  function openReserveFromEvents() {
    setReserveKey((k) => k + 1);
    setSheetView("reserve");
  }

  function showPrev() {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
  }

  function showNext() {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex((selectedIndex + 1) % items.length);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${FLOATING_FAB_BUTTON_CLASS} ${embedded ? "" : "fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7"}`}
        aria-label="Ver eventos"
      >
        <CalendarHeart size={20} className="shrink-0" />
        <span className="hidden pr-0.5 sm:inline">Eventos</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-[3px] sm:p-6">
          <div
            className={`mx-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/50 ring-1 ring-[var(--accent-gold)]/15 sm:p-1 ${containerWidthClass}`}
          >
            <div className="rounded-xl bg-[var(--background-secondary)]/40 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {sheetView === "reserve" && (
                    <button
                      type="button"
                      onClick={() => setSheetView("events")}
                      className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      aria-label="Volver a eventos"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <h3 className="section-title truncate text-2xl sm:text-3xl">
                    {sheetView === "events" && "Eventos"}
                    {sheetView === "reserve" && "Reserva ahora"}
                    {sheetView === "success" && "Listo"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={closeAll}
                  className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {sheetView === "events" && (
                <>
                  {items.length === 0 ? (
                    <p className="text-[var(--foreground-muted)]">Aun no hay banners de eventos cargados.</p>
                  ) : (
                    <div
                      className={`grid gap-3 sm:gap-4 ${isTwoOrLess ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}
                    >
                      {items.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedIndex(index)}
                          className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] text-left shadow-sm ring-1 ring-transparent transition hover:border-[var(--accent-gold)]/40 hover:ring-[var(--accent-gold)]/20"
                        >
                          <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--background-secondary)]">
                            <img
                              src={item.image_url}
                              alt={item.title ?? "Banner de evento"}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          </div>
                          {item.title ? (
                            <p className="border-t border-[var(--border)]/60 px-3 py-2 text-sm text-[var(--foreground-muted)]">{item.title}</p>
                          ) : (
                            <div className="h-px border-t border-[var(--border)]/60" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)]/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[var(--foreground-muted)]">¿Quieres reservar en Copantl?</p>
                    <button
                      type="button"
                      onClick={openReserveFromEvents}
                      className="btn-primary w-full px-6 py-3 text-center text-sm sm:w-auto sm:min-w-[200px]"
                    >
                      Reservar
                    </button>
                  </div>
                </>
              )}

              {sheetView === "reserve" && (
                <ReservationBookingForm
                  key={reserveKey}
                  compact
                  showTerms
                  onSuccess={() => setSheetView("success")}
                />
              )}

              {sheetView === "success" && (
                <div className="flex flex-col items-center gap-6 py-8 text-center sm:py-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent-gold)]/35 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <CheckCircle2 size={30} strokeWidth={1.75} />
                  </div>
                  <div className="space-y-3">
                    <p className="section-title text-xl tracking-wide sm:text-2xl">Reserva creada con exito</p>
                    <p className="text-[var(--foreground-muted)]">La reserva fue enviada pronto nos pondremos en contacto</p>
                  </div>
                  <ReservationSuccessActions whatsappHref={whatsappHref} onClose={closeAll} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl ring-1 ring-[var(--accent-gold)]/15">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-3 sm:px-4">
              <p className="section-title text-xl sm:text-2xl">Eventos</p>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-[var(--background-secondary)]/50 p-2 sm:p-3">
              <button type="button" onClick={showPrev} className="shrink-0 rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface)]">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 overflow-auto">
                <img
                  src={selected.image_url}
                  alt={selected.title ?? "Banner de evento"}
                  className="mx-auto h-auto max-h-[65vh] w-auto rounded-lg object-contain"
                />
              </div>
              <button type="button" onClick={showNext} className="shrink-0 rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface)]">
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedIndex(null);
                  openReserveFromEvents();
                }}
                className="btn-primary w-full px-6 py-3 text-center text-sm sm:w-auto"
              >
                Reservar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
