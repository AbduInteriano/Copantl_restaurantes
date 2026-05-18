"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";
import {
  MAX_GUESTS_PER_RESERVATION,
  MESA_COUNT,
  availableMesaList,
  formatReservationArea,
  formatReservationAreaLong,
  hasReservationSlotConflict,
  normalizeTimeKey,
} from "@/lib/reservations";
import { RESTAURANTS, parseReservationRestaurant } from "@/lib/restaurants";
import { formatReservationTimeSlotLabel, RESERVATION_TIME_SLOT_VALUES, snapReservationTimeToHalfHour } from "@/lib/reservation-time-slots";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

type Props = {
  reservations: Reservation[];
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function padDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function mesaColor(mesa: number): string {
  const hue = 8 + ((mesa - 1) * 36) % 360;
  return `hsl(${hue} 62% 42%)`;
}

export function AdminReservationsDashboard({ reservations }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(() => padDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  ));

  const [manualMsg, setManualMsg] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [activeListOpen, setActiveListOpen] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");
  const [includeCancelledInList, setIncludeCancelledInList] = useState(false);
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualStatus, setManualStatus] = useState<"confirmada" | "pendiente">("confirmada");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    reservation_date: "",
    reservation_time: "",
    mesa: "",
  });

  const editingReservation = useMemo(
    () => (editId ? reservations.find((r) => r.id === editId) ?? null : null),
    [editId, reservations],
  );

  const manualFreeMesas = useMemo(() => {
    if (manualStatus !== "confirmada" || !manualDate || !manualTime) return [];
    return availableMesaList(reservations, manualDate, manualTime);
  }, [reservations, manualDate, manualTime, manualStatus]);

  const confirmed = useMemo(
    () => reservations.filter((r) => r.status === "confirmada"),
    [reservations],
  );
  const pending = useMemo(
    () => reservations.filter((r) => r.status === "pendiente"),
    [reservations],
  );

  const activeReservations = useMemo(() => {
    const act = includeCancelledInList
      ? reservations
      : reservations.filter((r) => r.status !== "cancelada");
    return [...act].sort((a, b) => {
      const st = (x: Reservation) => (x.status === "cancelada" ? 1 : 0);
      const sc = st(a) - st(b);
      if (sc !== 0) return sc;
      const d = a.reservation_date.localeCompare(b.reservation_date);
      if (d !== 0) return d;
      return normalizeTimeKey(a.reservation_time).localeCompare(normalizeTimeKey(b.reservation_time));
    });
  }, [reservations, includeCancelledInList]);

  const filteredActive = useMemo(() => {
    const q = activeSearch.trim().toLowerCase();
    if (!q) return activeReservations;
    return activeReservations.filter((r) =>
      `${r.full_name} ${r.email} ${r.phone} ${r.reservation_date}`.toLowerCase().includes(q),
    );
  }, [activeReservations, activeSearch]);

  const activeOnlyCount = useMemo(
    () => reservations.filter((r) => r.status !== "cancelada").length,
    [reservations],
  );

  const confirmedByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of confirmed) {
      const k = r.reservation_date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    for (const [, list] of map) {
      list.sort((a, b) => normalizeTimeKey(a.reservation_time).localeCompare(normalizeTimeKey(b.reservation_time)));
    }
    return map;
  }, [confirmed]);

  const y = calendarMonth.getFullYear();
  const m = calendarMonth.getMonth();
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells: { key: string | null; n: number | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ key: null, n: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ key: padDate(y, m, d), n: d });
    }
    while (cells.length % 7 !== 0) cells.push({ key: null, n: null });
    while (cells.length < 42) cells.push({ key: null, n: null });
    return cells;
  }, [y, m, firstWeekday, daysInMonth]);

  const selectedDayReservations = useMemo(() => {
    if (!selectedDate) return [];
    return confirmed.filter((r) => r.reservation_date === selectedDate);
  }, [confirmed, selectedDate]);

  async function changeStatus(id: string, status: "confirmada" | "cancelada", mesa?: number) {
    setLoadingId(id);
    setManualMsg("");
    const body =
      status === "confirmada" && mesa != null
        ? { status, mesa }
        : { status };
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoadingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManualMsg(j.error || "No se pudo actualizar el estado.");
      return;
    }
    router.refresh();
  }

  async function deleteReservation(id: string, label?: string) {
    const ok = window.confirm(
      label
        ? `Eliminar la reserva de ${label}? Esta accion no se puede deshacer.`
        : "Eliminar esta reserva? Esta accion no se puede deshacer.",
    );
    if (!ok) return;
    setLoadingId(id);
    setManualMsg("");
    const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    setLoadingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManualMsg(j.error || "No se pudo eliminar.");
      return;
    }
    if (editId === id) setEditId(null);
    router.refresh();
  }

  async function submitManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setManualMsg("");
    const fd = new FormData(e.currentTarget);
    const status = manualStatus;
    const mesaVal = fd.get("mesa");
    const area = parseReservationRestaurant(String(fd.get("area") || "cbari"));
    const payload = {
      full_name: String(fd.get("full_name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      guests: Number(fd.get("guests") || 1),
      reservation_date: String(fd.get("reservation_date") || ""),
      reservation_time: String(fd.get("reservation_time") || ""),
      mesa: mesaVal === "" || mesaVal == null ? null : Number(mesaVal),
      status,
      area,
      notes: String(fd.get("notes") || ""),
    };
    if (status === "confirmada" && (payload.mesa == null || Number.isNaN(payload.mesa))) {
      setManualMsg("Elija una mesa libre para una reserva confirmada.");
      return;
    }
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManualMsg(j.error || "Error al crear la reserva.");
      return;
    }
    e.currentTarget.reset();
    setManualDate("");
    setManualTime("");
    setManualStatus("confirmada");
    setManualOpen(false);
    router.refresh();
  }

  async function saveEdit(id: string) {
    if (
      hasReservationSlotConflict(
        reservations,
        editForm.reservation_date,
        editForm.reservation_time,
        id,
      )
    ) {
      const ok = window.confirm(
        "Atencion: ya hay otra reserva activa en la misma fecha y hora. Â¿Deseas guardar de todas formas?",
      );
      if (!ok) return;
    }
    setLoadingId(id);
    setManualMsg("");
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservation_date: editForm.reservation_date,
        reservation_time: editForm.reservation_time,
        mesa: editForm.mesa === "" ? null : Number(editForm.mesa),
      }),
    });
    setLoadingId(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setManualMsg(j.error || "No se pudo guardar.");
      return;
    }
    setEditId(null);
    router.refresh();
  }

  function openEdit(r: Reservation) {
    setEditId(r.id);
    setEditForm({
      reservation_date: r.reservation_date,
      reservation_time: snapReservationTimeToHalfHour(normalizeTimeKey(r.reservation_time)),
      mesa: r.mesa != null ? String(r.mesa) : "",
    });
  }

  return (
    <div className="space-y-10">
      {manualMsg && (
        <p className="rounded-md border border-amber-200 bg-[var(--admin-danger-bg)] px-3 py-2 text-sm text-amber-950">
          {manualMsg}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setManualOpen((o) => !o)}
          aria-expanded={manualOpen}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
            manualOpen
              ? "border border-[var(--admin-border)] bg-white text-[var(--admin-foreground)] hover:bg-slate-50"
              : "bg-[var(--admin-accent)] text-white hover:opacity-95"
          }`}
        >
          Nueva reserva +
        </button>
        {manualOpen && (
          <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm sm:p-6">
            <form onSubmit={submitManual} className="grid gap-3 sm:grid-cols-2">
              <input name="full_name" required className="rounded-md border bg-transparent p-3" placeholder="Nombre completo" />
              <input name="email" type="email" required className="rounded-md border bg-transparent p-3" placeholder="Correo" />
              <input name="phone" required className="rounded-md border bg-transparent p-3" placeholder="Telefono" />
              <input name="guests" type="number" min={1} max={MAX_GUESTS_PER_RESERVATION} defaultValue={2} required className="rounded-md border bg-transparent p-3" placeholder="Personas" />
              <select name="area" className="rounded-md border bg-transparent p-3" defaultValue="cbari">
                {RESTAURANTS.map((r) => (
                  <option key={r.key} value={r.key}>
                    Restaurante: {r.shortLabel}
                  </option>
                ))}
              </select>
              <input
                name="reservation_date"
                type="date"
                required
                className="rounded-md border bg-transparent p-3"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
              <label className="block text-xs text-[var(--foreground-muted)] sm:col-span-2">
                Hora (cada 30 min)
                <select
                  name="reservation_time"
                  required
                  className="mt-1 w-full rounded-md border bg-transparent p-3"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                >
                  <option value="">Elija hora…</option>
                  {RESERVATION_TIME_SLOT_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {formatReservationTimeSlotLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
              <select
                className="rounded-md border bg-transparent p-3 sm:col-span-2"
                value={manualStatus}
                onChange={(e) => setManualStatus(e.target.value as "confirmada" | "pendiente")}
              >
                <option value="confirmada">Confirmada (asigna mesa)</option>
                <option value="pendiente">Pendiente (sin mesa)</option>
              </select>
              {manualStatus === "confirmada" && (
                <label className="text-sm sm:col-span-2">
                  <span className="text-[var(--foreground-muted)]">Mesa libre en este horario</span>
                  <select name="mesa" required className="mt-1 w-full rounded-md border bg-transparent p-3">
                    <option value="">Elija mesa…</option>
                    {manualFreeMesas.map((n) => (
                      <option key={n} value={n}>
                        Mesa {n}
                      </option>
                    ))}
                  </select>
                  {manualFreeMesas.length === 0 && manualDate && manualTime && (
                    <span className="mt-1 block text-xs font-medium text-amber-800">
                      No hay mesas libres en ese horario.
                    </span>
                  )}
                </label>
              )}
              <textarea name="notes" className="min-h-20 rounded-md border bg-transparent p-3 sm:col-span-2" placeholder="Notas internas" />
              <button
                type="submit"
                className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 sm:col-span-2"
              >
                Crear reserva
              </button>
            </form>
          </section>
        )}
      </div>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-wide text-[var(--admin-foreground)]">
          Calendario — reservas confirmadas
        </h2>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          10 mesas disponibles; cada reserva admite de 1 a {MAX_GUESTS_PER_RESERVATION} personas. Las celdas muestran cuantas reservas confirmadas hay ese dia.
        </p>
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-foreground)] hover:bg-[var(--admin-bg)]"
            onClick={() => setCalendarMonth(new Date(y, m - 1, 1))}
          >
            <ChevronLeft className="inline" size={18} />
          </button>
          <span className="text-center font-semibold text-[var(--admin-foreground)]">
            {MONTHS_ES[m]} {y}
          </span>
          <button
            type="button"
            className="rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-foreground)] hover:bg-[var(--admin-bg)]"
            onClick={() => setCalendarMonth(new Date(y, m + 1, 1))}
          >
            <ChevronRight className="inline" size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--foreground-muted)] sm:gap-2 sm:text-sm">
          {WEEKDAYS_ES.map((d) => (
            <div key={d} className="py-2 font-medium">
              {d}
            </div>
          ))}
          {calendarCells.map((cell, idx) => {
            if (!cell.key) {
              return <div key={`e-${idx}`} className="min-h-[52px] rounded-md bg-slate-100/80 sm:min-h-[60px]" />;
            }
            const list = confirmedByDate.get(cell.key) ?? [];
            const isSel = selectedDate === cell.key;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedDate(cell.key)}
                className={`min-h-[52px] rounded-md border p-1 text-left transition sm:min-h-[60px] ${
                  isSel
                    ? "border-[var(--admin-accent)] bg-blue-50 shadow-sm"
                    : "border-[var(--admin-border)] bg-white hover:bg-slate-50"
                }`}
              >
                <div className="text-sm font-medium text-[var(--admin-foreground)]">{cell.n}</div>
                {list.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {list.slice(0, 6).map((r) => (
                      <span
                        key={r.id}
                        title={`Mesa ${r.mesa} Â· ${normalizeTimeKey(r.reservation_time)}`}
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: mesaColor(r.mesa ?? 1) }}
                      />
                    ))}
                    {list.length > 6 && (
                      <span className="text-[10px] text-[var(--foreground-muted)]">+{list.length - 6}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="text-[var(--foreground-muted)]">Mesas:</span>
          {Array.from({ length: MESA_COUNT }, (_, i) => i + 1).map((n) => (
            <span key={n} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: mesaColor(n) }} />
              {n}
            </span>
          ))}
        </div>
      </section>

      {selectedDate && (
        <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm sm:p-6">
          <h3 className="mb-3 text-lg font-semibold text-[var(--admin-foreground)]">
            Confirmadas el {selectedDate}
          </h3>
          {selectedDayReservations.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)]">Sin reservas confirmadas este dia.</p>
          ) : (
            <ul className="space-y-4">
              {selectedDayReservations.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-[var(--admin-border)] bg-slate-50/50 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid flex-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <p className="sm:col-span-2">
                        <span
                          className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                          style={{ backgroundColor: mesaColor(r.mesa ?? 1) }}
                        />
                        <strong className="text-[var(--admin-foreground)]">{r.full_name}</strong>
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Correo:</span>{" "}
                        <a className="text-[var(--admin-accent)] underline" href={`mailto:${r.email}`}>
                          {r.email}
                        </a>
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Telefono:</span>{" "}
                        <a className="text-[var(--admin-accent)] underline" href={`tel:${r.phone}`}>
                          {r.phone}
                        </a>
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Fecha:</span> {r.reservation_date}
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Hora:</span> {normalizeTimeKey(r.reservation_time)}
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Personas:</span> {r.guests}
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Mesa:</span> {r.mesa ?? "—"}
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Restaurante:</span> {formatReservationAreaLong(r.area)}
                      </p>
                      <p>
                        <span className="text-[var(--foreground-muted)]">Origen:</span>{" "}
                        {r.source === "manual" ? "Manual" : "Web"}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] sm:col-span-2">
                        Creada: {new Date(r.created_at).toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      {r.notes?.trim() ? (
                        <p className="sm:col-span-2">
                          <span className="text-[var(--foreground-muted)]">Notas:</span> {r.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-[var(--admin-border)] bg-white px-3 py-1.5 text-xs text-[var(--admin-foreground)] hover:bg-slate-100"
                        onClick={() => openEdit(r)}
                      >
                        Editar fecha / hora / mesa
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                        disabled={loadingId === r.id}
                        onClick={() => deleteReservation(r.id, r.full_name)}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-lg">
            <h4 className="mb-3 font-semibold text-[var(--admin-foreground)]">Reserva confirmada</h4>
            {editingReservation ? (
              <div className="mb-4 space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-[var(--admin-foreground)]">
                <p>
                  <strong>Cliente:</strong> {editingReservation.full_name}
                </p>
                <p>
                  <strong>Correo:</strong> {editingReservation.email}
                </p>
                <p>
                  <strong>Telefono:</strong> {editingReservation.phone}
                </p>
                <p>
                  <strong>Personas:</strong> {editingReservation.guests}
                </p>
                <p>
                  <strong>Restaurante:</strong> {formatReservationAreaLong(editingReservation.area)}
                </p>
                <p>
                  <strong>Origen:</strong> {editingReservation.source === "manual" ? "Manual" : "Web"}
                </p>
                <p>
                  <strong>Notas:</strong> {editingReservation.notes?.trim() ? editingReservation.notes : "—"}
                </p>
              </div>
            ) : null}
            <p className="mb-3 text-xs font-medium text-[var(--admin-muted)]">
              Solo puedes modificar fecha, hora y mesa.
            </p>
            <div className="space-y-3">
              <label className="block text-xs text-[var(--foreground-muted)]">
                Fecha
                <input
                  type="date"
                  className="mt-1 w-full rounded-md border bg-transparent p-2"
                  value={editForm.reservation_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, reservation_date: e.target.value }))}
                />
              </label>
              <label className="block text-xs text-[var(--foreground-muted)]">
                Hora (cada 30 min)
                <select
                  className="mt-1 w-full rounded-md border bg-transparent p-2"
                  value={editForm.reservation_time}
                  onChange={(e) => setEditForm((f) => ({ ...f, reservation_time: e.target.value }))}
                >
                  <option value="">Elija…</option>
                  {RESERVATION_TIME_SLOT_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {formatReservationTimeSlotLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-[var(--foreground-muted)]">
                Mesa
                <select
                  className="mt-1 w-full rounded-md border bg-transparent p-2"
                  value={editForm.mesa}
                  onChange={(e) => setEditForm((f) => ({ ...f, mesa: e.target.value }))}
                >
                  {(() => {
                    const free = availableMesaList(
                      reservations,
                      editForm.reservation_date,
                      editForm.reservation_time,
                      editId ?? undefined,
                    );
                    const cur = editForm.mesa ? Number(editForm.mesa) : null;
                    const opts = new Set(free);
                    if (cur != null && cur >= 1 && cur <= MESA_COUNT) opts.add(cur);
                    return [...opts].sort((a, b) => a - b).map((n) => (
                      <option key={n} value={n}>
                        Mesa {n}
                      </option>
                    ));
                  })()}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-[var(--admin-success)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
                disabled={loadingId === editId}
                onClick={() => saveEdit(editId)}
              >
                Guardar
              </button>
              <button
                type="button"
                className="rounded-md border border-[var(--admin-border)] bg-white px-4 py-2 text-sm text-[var(--admin-foreground)] hover:bg-slate-50"
                onClick={() => setEditId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-white px-4 py-2 text-sm text-amber-900 hover:bg-amber-50 disabled:opacity-50"
                disabled={loadingId === editId}
                onClick={() => {
                  const r = reservations.find((x) => x.id === editId);
                  deleteReservation(editId, r?.full_name);
                }}
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}


      <section>
        <h2 className="mb-3 text-lg font-semibold text-[var(--admin-foreground)]">
          Pendientes de confirmar ({pending.length})
        </h2>
        <div className="space-y-4">
          {pending.length === 0 && (
            <p className="text-sm text-[var(--foreground-muted)]">No hay solicitudes pendientes.</p>
          )}
          {pending.map((r) => (
            <PendingCard
              key={r.id}
              r={r}
              reservations={reservations}
              loadingId={loadingId}
              onConfirm={(mesa) => changeStatus(r.id, "confirmada", mesa)}
              onReject={() => changeStatus(r.id, "cancelada")}
              onDelete={() => deleteReservation(r.id, r.full_name)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-sm">
        <button
          type="button"
          onClick={() => setActiveListOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">
              Reservas activas ({activeOnlyCount})
              {includeCancelledInList && (
                <span className="ml-2 text-base font-normal text-[var(--foreground-muted)]">
                  Â· mostrando {activeReservations.length} filas
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              Pendientes y confirmadas en orden por fecha. Tabla compacta y busqueda.
            </p>
          </div>
          {activeListOpen ? (
            <ChevronUp className="shrink-0 text-[var(--admin-muted)]" size={22} />
          ) : (
            <ChevronDown className="shrink-0 text-[var(--admin-muted)]" size={22} />
          )}
        </button>
        {activeListOpen && (
          <div className="border-t border-[var(--admin-border)] px-2 pb-4 pt-3 sm:px-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
                placeholder="Buscar por nombre, correo, telefono o fecha…"
                className="w-full rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm sm:max-w-xl"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-[var(--admin-foreground)] sm:text-sm">
                <input
                  type="checkbox"
                  checked={includeCancelledInList}
                  onChange={(e) => setIncludeCancelledInList(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--admin-border)]"
                />
                Incluir canceladas
              </label>
            </div>
            <div className="max-h-[min(420px,55vh)] overflow-auto rounded-lg border border-[var(--admin-border)]">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-[1] bg-slate-100 text-[var(--admin-muted)]">
                  <tr>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Fecha</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Hora</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Cliente</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Pers.</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Restaurante</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Mesa</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Estado</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Origen</th>
                    <th className="border-b border-[var(--admin-border)] px-2 py-2 font-semibold sm:px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActive.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-[var(--foreground-muted)]">
                        {activeOnlyCount === 0 && !includeCancelledInList
                          ? "No hay reservas activas."
                          : activeReservations.length === 0
                            ? "Ningun registro que mostrar."
                            : "Ninguna coincide con la busqueda."}
                      </td>
                    </tr>
                  ) : (
                    filteredActive.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 bg-white hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">{r.reservation_date}</td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">{normalizeTimeKey(r.reservation_time)}</td>
                        <td className="max-w-[140px] truncate px-2 py-2 sm:max-w-[200px] sm:px-3" title={r.full_name}>
                          {r.full_name}
                        </td>
                        <td className="px-2 py-2 sm:px-3">{r.guests}</td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">{formatReservationArea(r.area)}</td>
                        <td className="px-2 py-2 sm:px-3">{r.mesa ?? "—"}</td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">
                          {r.status === "pendiente"
                            ? "Pendiente"
                            : r.status === "confirmada"
                              ? "Confirmada"
                              : "Cancelada"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">
                          {r.source === "manual" ? "Manual" : "Web"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">
                          <div className="flex flex-wrap gap-1">
                            {r.status === "confirmada" ? (
                              <button
                                type="button"
                                className="rounded border border-[var(--admin-border)] bg-white px-2 py-1 text-[11px] hover:bg-slate-100 sm:text-xs"
                                onClick={() => openEdit(r)}
                              >
                                Editar
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="inline-flex items-center gap-0.5 rounded border border-amber-200 bg-white px-2 py-1 text-[11px] text-amber-900 hover:bg-amber-50 disabled:opacity-50 sm:text-xs"
                              disabled={loadingId === r.id}
                              onClick={() => deleteReservation(r.id, r.full_name)}
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Por defecto solo se listan pendientes y confirmadas. Active &quot;Incluir canceladas&quot; para ver o eliminar registros cancelados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function PendingCard({
  r,
  reservations,
  loadingId,
  onConfirm,
  onReject,
  onDelete,
}: {
  r: Reservation;
  reservations: Reservation[];
  loadingId: string | null;
  onConfirm: (mesa: number) => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [mesa, setMesa] = useState<string>("");
  const free = useMemo(
    () => availableMesaList(reservations, r.reservation_date, r.reservation_time, r.id),
    [reservations, r.reservation_date, r.reservation_time, r.id],
  );

  return (
    <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm">
      <div className="grid gap-2 md:grid-cols-2">
        <p><strong>Cliente:</strong> {r.full_name}</p>
        <p><strong>Correo:</strong> {r.email}</p>
        <p><strong>Telefono:</strong> {r.phone}</p>
        <p><strong>Personas:</strong> {r.guests}</p>
        <p><strong>Restaurante:</strong> {formatReservationAreaLong(r.area)}</p>
        <p><strong>Fecha:</strong> {r.reservation_date}</p>
        <p><strong>Hora:</strong> {normalizeTimeKey(r.reservation_time)}</p>
        <p><strong>Origen:</strong> {r.source === "manual" ? "Manual" : "Web"}</p>
      </div>
      {r.notes && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{r.notes}</p>}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="text-[var(--foreground-muted)]">Mesa para confirmar</span>
          <select
            className="mt-1 w-full rounded-md border bg-transparent p-2"
            value={mesa}
            onChange={(e) => setMesa(e.target.value)}
          >
            <option value="">Elegir…</option>
            {free.map((n) => (
              <option key={n} value={n}>
                Mesa {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={loadingId === r.id || !mesa}
          className="rounded-md bg-[var(--admin-success)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          onClick={() => onConfirm(Number(mesa))}
        >
          Confirmar con mesa
        </button>
        <button
          type="button"
          disabled={loadingId === r.id}
          className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          onClick={onReject}
        >
          Rechazar
        </button>
        <button
          type="button"
          disabled={loadingId === r.id}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-200 bg-white px-4 py-2 text-sm text-amber-900 hover:bg-amber-50 disabled:opacity-50"
          onClick={onDelete}
        >
          <Trash2 size={16} />
          Eliminar
        </button>
      </div>
    </div>
  );
}
