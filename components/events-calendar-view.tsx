"use client";

import {
  EVENT_MONTHS_ES,
  EVENT_WEEKDAYS_ES,
  buildCalendarCells,
  formatEventDateLabel,
  groupEventsByDate,
  todayEventDate,
} from "@/lib/events-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

export type CalendarEventItem = {
  id: string;
  title: string | null;
  image_url: string;
  event_date: string | null;
};

type Props = {
  items: CalendarEventItem[];
  onSelectEvent: (item: CalendarEventItem) => void;
};

export function EventsCalendarView({ items, onSelectEvent }: Props) {
  const today = todayEventDate();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const scheduled = useMemo(() => items.filter((i) => i.event_date), [items]);
  const unscheduled = useMemo(() => items.filter((i) => !i.event_date), [items]);
  const byDate = useMemo(() => groupEventsByDate(scheduled), [scheduled]);

  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();
  const cells = useMemo(() => buildCalendarCells(y, m), [y, m]);

  const selectedEvents = selectedDate ? (byDate.get(selectedDate) ?? []) : [];

  function shiftMonth(delta: number) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--background-secondary)]/60 px-3 py-3 sm:px-4">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-[var(--border)] bg-white p-2 transition hover:border-[var(--accent-gold)]"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <p className="section-title text-lg sm:text-xl">
            {EVENT_MONTHS_ES[m]} {y}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-[var(--border)] bg-white p-2 transition hover:border-[var(--accent-gold)]"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--background-secondary)]/30">
          {EVENT_WEEKDAYS_ES.map((wd) => (
            <div
              key={wd}
              className="py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--foreground-muted)] sm:text-xs"
            >
              {wd}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-[var(--border)] p-px">
          {cells.map((cell, idx) => {
            if (!cell.key || cell.day == null) {
              return <div key={`empty-${idx}`} className="min-h-[44px] bg-[var(--background-secondary)]/25 sm:min-h-[52px]" />;
            }

            const count = byDate.get(cell.key)?.length ?? 0;
            const isToday = cell.key === today;
            const isSelected = cell.key === selectedDate;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 bg-white transition sm:min-h-[52px] ${
                  isSelected
                    ? "z-[1] ring-2 ring-inset ring-[var(--accent-gold)]"
                    : "hover:bg-[var(--accent-gold)]/5"
                }`}
                aria-label={`${cell.day} de ${EVENT_MONTHS_ES[m]}${count ? `, ${count} evento(s)` : ""}`}
                aria-pressed={isSelected}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium sm:h-8 sm:w-8 ${
                    isToday
                      ? "bg-[var(--accent-gold)] text-white"
                      : isSelected
                        ? "text-[var(--accent-gold-dark)]"
                        : "text-[var(--foreground)]"
                  }`}
                >
                  {cell.day}
                </span>
                {count > 0 ? (
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--accent-gold)]" />
                    ))}
                    {count > 3 ? (
                      <span className="text-[9px] font-semibold text-[var(--accent-gold)]">+{count - 3}</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="h-1.5" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-gold)]">
          {selectedDate ? formatEventDateLabel(selectedDate) : "Selecciona un dia"}
        </h4>

        {selectedEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            No hay eventos programados para este dia.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-2 text-left transition hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/5"
                >
                  <img
                    src={ev.image_url}
                    alt={ev.title ?? "Evento"}
                    className="h-14 w-20 shrink-0 rounded-md object-cover"
                  />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {ev.title ?? "Ver evento"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {unscheduled.length > 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
            Sin fecha asignada
          </p>
          <ul className="mt-2 space-y-2">
            {unscheduled.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="text-sm text-[var(--accent-gold-dark)] underline-offset-2 hover:underline"
                >
                  {ev.title ?? "Ver evento"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
