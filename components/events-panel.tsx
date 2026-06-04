"use client";

import { EventsCalendarView, type CalendarEventItem } from "@/components/events-calendar-view";
import { ReservationBookingForm, type ReservationPrefill } from "@/components/reservation-form";
import type { BookableEvent } from "@/lib/events";
import type { RestaurantProfile } from "@/lib/restaurant-profiles";
import { ReservationSuccessActions } from "@/components/reservation-success-actions";
import { CalendarDays, CalendarHeart, ChevronLeft, ChevronRight, X, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  items: CalendarEventItem[];
  bookableEvents?: BookableEvent[];
  restaurantProfiles?: RestaurantProfile[];
  whatsappHref: string;
};

type SheetView = "events" | "reserve" | "success";

export function EventsPanel({
  items,
  bookableEvents = [],
  restaurantProfiles = [],
  whatsappHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sheetView, setSheetView] = useState<SheetView>("events");
  const [reserveKey, setReserveKey] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [reservePrefill, setReservePrefill] = useState<ReservationPrefill | null>(null);

  useEffect(() => {
    if (open) {
      setSheetView("events");
    }
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open || selectedEvent ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, selectedEvent]);

  function closeAll() {
    setOpen(false);
    setSheetView("events");
    setSelectedEvent(null);
    setReservePrefill(null);
  }

  function openReserveForEvent(eventId: string) {
    setReservePrefill({ eventId });
    setReserveKey((k) => k + 1);
    setSelectedEvent(null);
    setOpen(true);
    setSheetView("reserve");
  }

  function showPrev() {
    if (!selectedEvent || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === selectedEvent.id);
    if (idx < 0) return;
    setSelectedEvent(items[(idx - 1 + items.length) % items.length]);
  }

  function showNext() {
    if (!selectedEvent || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === selectedEvent.id);
    if (idx < 0) return;
    setSelectedEvent(items[(idx + 1) % items.length]);
  }

  return (
    <>
      <div className="flex justify-center py-8 sm:py-10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary inline-flex min-h-[48px] items-center gap-2 px-8 py-3.5 text-base sm:min-h-[52px] sm:px-10"
          aria-label="Ver eventos"
        >
          <CalendarHeart size={20} className="shrink-0" />
          Eventos
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 backdrop-blur-[3px] sm:p-6">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/50 ring-1 ring-[var(--accent-gold)]/15 sm:p-1">
            <div className="rounded-xl bg-[var(--background-secondary)]/40 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {sheetView === "reserve" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSheetView("events");
                        setReservePrefill(null);
                      }}
                      className="shrink-0 rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      aria-label="Volver a eventos"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  ) : (
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]">
                      <CalendarDays size={20} />
                    </span>
                  )}
                  <div>
                    <h3 className="section-title truncate text-2xl sm:text-3xl">
                      {sheetView === "events" && "Calendario de eventos"}
                      {sheetView === "reserve" && "Reservar"}
                      {sheetView === "success" && "Listo"}
                    </h3>
                    {sheetView === "events" ? (
                      <p className="text-sm text-[var(--foreground-muted)]">Selecciona un dia para ver los eventos</p>
                    ) : null}
                  </div>
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
                    <p className="text-[var(--foreground-muted)]">Aun no hay eventos cargados.</p>
                  ) : (
                    <EventsCalendarView items={items} onSelectEvent={setSelectedEvent} />
                  )}
                </>
              )}

              {sheetView === "reserve" && (
                <ReservationBookingForm
                  key={reserveKey}
                  compact
                  showTerms
                  bookableEvents={bookableEvents}
                  restaurantProfiles={restaurantProfiles}
                  initialPrefill={reservePrefill}
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

      {selectedEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl ring-1 ring-[var(--accent-gold)]/15">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-3 py-3 sm:px-4">
              <p className="section-title text-xl sm:text-2xl">{selectedEvent.title ?? "Evento"}</p>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-[var(--background-secondary)]/50 p-2 sm:p-3">
              {items.length > 1 ? (
                <button type="button" onClick={showPrev} className="shrink-0 rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface)]">
                  <ChevronLeft size={18} />
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
              <div className="relative flex-1 overflow-auto">
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title ?? "Banner de evento"}
                  className="mx-auto h-auto max-h-[65vh] w-auto rounded-lg object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-5 pt-16">
                  <button
                    type="button"
                    onClick={() => openReserveForEvent(selectedEvent.id)}
                    className="btn-primary min-w-[200px] px-8 py-3 text-center text-sm shadow-lg"
                  >
                    Reservar este evento
                  </button>
                </div>
              </div>
              {items.length > 1 ? (
                <button type="button" onClick={showNext} className="shrink-0 rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface)]">
                  <ChevronRight size={18} />
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
