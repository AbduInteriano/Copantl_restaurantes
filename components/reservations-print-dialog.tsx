"use client";

import { Printer, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildReservationsPrintDocument,
  type PrintableReservation,
} from "@/lib/reservation-print-html";
import { formatReservationArea, normalizeTimeKey } from "@/lib/reservations";
import type { Database } from "@/lib/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

type Props = {
  reservations: Reservation[];
  eventTitles: Record<string, string>;
};

function toPrintable(r: Reservation): PrintableReservation {
  return {
    id: r.id,
    status: r.status,
    full_name: r.full_name,
    email: r.email,
    phone: r.phone,
    reservation_date: r.reservation_date,
    reservation_time: r.reservation_time,
    guests: r.guests,
    mesa: r.mesa,
    area: r.area ?? "cbari",
    source: r.source ?? "web",
    notes: r.notes ?? null,
    event_id: r.event_id ?? null,
  };
}

export function ReservationsPrintDialog({ reservations, eventTitles }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterDate, setFilterDate] = useState("");
  const [msg, setMsg] = useState("");

  const confirmed = useMemo(
    () =>
      [...reservations]
        .filter((r) => r.status === "confirmada")
        .map(toPrintable)
        .sort((a, b) => {
          const d = a.reservation_date.localeCompare(b.reservation_date);
          if (d !== 0) return d;
          return normalizeTimeKey(a.reservation_time).localeCompare(
            normalizeTimeKey(b.reservation_time),
          );
        }),
    [reservations],
  );

  const list = useMemo(() => {
    if (!filterDate) return confirmed;
    return confirmed.filter((r) => r.reservation_date === filterDate);
  }, [confirmed, filterDate]);

  function openDialog() {
    setMsg("");
    setSelected(new Set(confirmed.map((r) => r.id)));
    setOpen(true);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(checked: boolean) {
    setSelected(checked ? new Set(list.map((r) => r.id)) : new Set());
  }

  function runPrint() {
    const picked = confirmed.filter((r) => selected.has(r.id));
    if (picked.length === 0) {
      setMsg("Selecciona al menos una reservacion confirmada.");
      return;
    }

    const html = buildReservationsPrintDocument(picked, eventTitles);
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!win) {
      setMsg("Permite ventanas emergentes para imprimir.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setOpen(false);
    setMsg("");
  }

  if (confirmed.length === 0) {
    return (
      <button
        type="button"
        disabled
        title="No hay reservas confirmadas"
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
      >
        <Printer size={18} />
        Imprimir reservaciones
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--admin-foreground)] shadow-sm hover:bg-slate-50"
      >
        <Printer size={18} />
        Imprimir reservaciones
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--admin-foreground)]">
                  Imprimir reservaciones
                </h3>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Solo confirmadas. Formato carta, 3 reservas por pagina. Marca las que deseas imprimir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[var(--admin-muted)] hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 border-b border-[var(--admin-border)] px-5 py-3">
              <label className="block text-sm text-[var(--admin-muted)]">
                Filtrar por fecha (opcional)
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white p-2"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--admin-foreground)]">
                <input
                  type="checkbox"
                  checked={list.length > 0 && list.every((r) => selected.has(r.id))}
                  onChange={(e) => selectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--admin-border)]"
                />
                Seleccionar todas ({list.length})
              </label>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
              {list.length === 0 ? (
                <li className="py-6 text-center text-sm text-[var(--foreground-muted)]">
                  No hay confirmadas en esa fecha.
                </li>
              ) : (
                list.map((r) => (
                  <li
                    key={r.id}
                    className="mb-2 rounded-lg border border-[var(--admin-border)] bg-slate-50/80 px-3 py-2"
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--admin-border)]"
                      />
                      <span className="text-sm">
                        <strong>{r.full_name}</strong>
                        <span className="block text-[var(--foreground-muted)]">
                          {r.reservation_date} · {normalizeTimeKey(r.reservation_time)} · Mesa{" "}
                          {r.mesa ?? "—"} · {formatReservationArea(r.area)}
                        </span>
                      </span>
                    </label>
                  </li>
                ))
              )}
            </ul>

            {msg ? (
              <p className="px-5 text-sm text-amber-900">{msg}</p>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-[var(--admin-border)] px-5 py-4">
              <button
                type="button"
                onClick={runPrint}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95"
              >
                <Printer size={16} />
                Imprimir seleccionadas ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm text-[var(--admin-foreground)] hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
