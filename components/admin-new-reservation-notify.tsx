"use client";

import { Bell, CalendarDays, Users, X } from "lucide-react";
import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playNewReservationChime } from "@/lib/reservation-chime-audio";
import { formatReservationTimeSlotLabel } from "@/lib/reservation-time-slots";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 8_000;

type PendingReservationSummary = {
  id: string;
  full_name: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
};

type PendingAlert = {
  latest: PendingReservationSummary;
  pendingCount: number;
};

type PendingRow = PendingReservationSummary & { created_at: string };

function formatReservationDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return new Date(y, m - 1, d).toLocaleDateString("es-HN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatReservationTime(timeStr: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(timeStr);
  if (!match) return timeStr;
  return formatReservationTimeSlotLabel(`${match[1].padStart(2, "0")}:${match[2]}`);
}

function rowFromPayload(raw: Record<string, unknown>): PendingReservationSummary | null {
  const id = typeof raw.id === "string" ? raw.id : null;
  const full_name = typeof raw.full_name === "string" ? raw.full_name : null;
  if (!id || !full_name) return null;
  return {
    id,
    full_name,
    guests: typeof raw.guests === "number" ? raw.guests : Number(raw.guests) || 1,
    reservation_date: typeof raw.reservation_date === "string" ? raw.reservation_date : "",
    reservation_time: typeof raw.reservation_time === "string" ? raw.reservation_time : "",
  };
}

function notifyNewPending(
  latest: PendingReservationSummary,
  pendingCount: number,
  knownIdsRef: MutableRefObject<Set<string> | null>,
  setAlert: (a: PendingAlert | null) => void,
) {
  if (!knownIdsRef.current) {
    knownIdsRef.current = new Set();
  }
  if (knownIdsRef.current.has(latest.id)) return;
  knownIdsRef.current.add(latest.id);
  setAlert({ latest, pendingCount });
}

export function AdminNewReservationNotify() {
  const router = useRouter();
  const [alert, setAlert] = useState<PendingAlert | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const lastChimedReservationIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  function dismissAlert() {
    setAlert(null);
    router.refresh();
  }

  useEffect(() => {
    if (!alert) return;
    if (lastChimedReservationIdRef.current === alert.latest.id) return;
    lastChimedReservationIdRef.current = alert.latest.id;
    playNewReservationChime();
  }, [alert]);

  useEffect(() => {
    const supabase = createClient();
    mountedRef.current = true;

    async function fetchPendingRows(): Promise<PendingRow[]> {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, full_name, guests, reservation_date, reservation_time, created_at")
        .eq("status", "pendiente")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !data) return [];
      return data as PendingRow[];
    }

    async function syncPendingIds(): Promise<void> {
      const rows = await fetchPendingRows();
      if (!mountedRef.current) return;

      const ids = new Set(rows.map((r) => r.id));
      if (knownIdsRef.current === null) {
        knownIdsRef.current = ids;
        return;
      }

      for (const row of rows) {
        if (!knownIdsRef.current.has(row.id)) {
          notifyNewPending(
            {
              id: row.id,
              full_name: row.full_name,
              guests: row.guests,
              reservation_date: row.reservation_date,
              reservation_time: row.reservation_time,
            },
            rows.length,
            knownIdsRef,
            setAlert,
          );
          break;
        }
      }
    }

    void syncPendingIds();

    const interval = window.setInterval(() => void syncPendingIds(), POLL_MS);

    const channel = supabase
      .channel("admin-pending-reservations")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservations" },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          if (raw.status !== "pendiente") return;
          if (!mountedRef.current) return;

          void (async () => {
            const rows = await fetchPendingRows();
            if (!mountedRef.current) return;

            const fromPayload = rowFromPayload(raw);
            const latest = fromPayload ?? (rows[0] ? {
              id: rows[0].id,
              full_name: rows[0].full_name,
              guests: rows[0].guests,
              reservation_date: rows[0].reservation_date,
              reservation_time: rows[0].reservation_time,
            } : null);

            if (!latest) return;
            notifyNewPending(latest, rows.length, knownIdsRef, setAlert);
          })();
        },
      )
      .subscribe();

    const onFocus = () => void syncPendingIds();
    window.addEventListener("focus", onFocus);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, []);

  if (!alert) return null;

  const { latest, pendingCount } = alert;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="pending-reservation-alert-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[var(--admin-accent)]">
            <Bell size={28} strokeWidth={1.75} aria-hidden />
          </div>
          <button
            type="button"
            onClick={dismissAlert}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-slate-50"
            aria-label="Cerrar aviso"
          >
            <X size={22} />
          </button>
        </div>

        <p
          id="pending-reservation-alert-title"
          className="mt-5 text-center text-2xl font-bold tracking-tight text-[var(--admin-foreground)] sm:text-3xl"
        >
          Nueva reserva pendiente
        </p>

        <p className="mt-2 text-center text-base font-semibold text-[var(--admin-accent)]">
          {pendingCount} {pendingCount === 1 ? "reserva pendiente" : "reservas pendientes"}
        </p>

        <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-slate-50/80 px-5 py-5">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-[var(--admin-muted)]">
            Ultima solicitud
          </p>
          <p className="mt-2 text-center text-xl font-semibold text-[var(--admin-foreground)]">{latest.full_name}</p>
          <ul className="mt-4 space-y-3 text-sm text-[var(--admin-foreground)]">
            <li className="flex items-center justify-center gap-2">
              <Users size={18} className="shrink-0 text-[var(--admin-accent)]" aria-hidden />
              <span>
                <span className="text-[var(--admin-muted)]">Personas:</span> {latest.guests}
              </span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <CalendarDays size={18} className="shrink-0 text-[var(--admin-accent)]" aria-hidden />
              <span>
                <span className="text-[var(--admin-muted)]">Fecha:</span>{" "}
                {latest.reservation_date
                  ? formatReservationDate(latest.reservation_date)
                  : "—"}
                {latest.reservation_time ? (
                  <span className="text-[var(--admin-muted)]">
                    {" "}
                    · {formatReservationTime(latest.reservation_time)}
                  </span>
                ) : null}
              </span>
            </li>
          </ul>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--admin-muted)]">
          Revisa la seccion &quot;Pendientes de confirmar&quot; en el panel.
        </p>

        <button
          type="button"
          onClick={dismissAlert}
          className="mt-6 w-full rounded-xl bg-[var(--admin-accent)] px-4 py-3.5 text-base font-semibold text-white shadow-sm hover:opacity-95"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
