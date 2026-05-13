"use client";

import { Bell, X } from "lucide-react";
import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 8_000;

function playSoftAlertTone() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(740, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
    void ctx.resume();
  } catch {
    /* ignore */
  }
}

function notifyNewPending(
  id: string,
  fullName: string,
  knownIdsRef: MutableRefObject<Set<string> | null>,
  setToast: (t: { id: string; name: string } | null) => void,
) {
  if (!knownIdsRef.current) {
    knownIdsRef.current = new Set();
  }
  if (knownIdsRef.current.has(id)) return;
  knownIdsRef.current.add(id);
  setToast({ id, name: fullName });
  playSoftAlertTone();
}

export function AdminNewReservationNotify() {
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const supabase = createClient();
    mountedRef.current = true;

    async function syncPendingIds(): Promise<void> {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, full_name, created_at")
        .eq("status", "pendiente")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !data || !mountedRef.current) return;

      const rows = data as { id: string; full_name: string; created_at: string }[];
      const ids = new Set(rows.map((r) => r.id));
      if (knownIdsRef.current === null) {
        knownIdsRef.current = ids;
        return;
      }
      for (const row of rows) {
        if (!knownIdsRef.current.has(row.id)) {
          notifyNewPending(row.id, row.full_name, knownIdsRef, setToast);
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
          const row = payload.new as { id?: string; full_name?: string; status?: string };
          if (!row.id || !row.full_name) return;
          if (row.status !== "pendiente") return;
          if (!mountedRef.current) return;
          notifyNewPending(row.id, row.full_name, knownIdsRef, setToast);
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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 12_000);
    return () => window.clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[100] w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[var(--admin-accent)]">
          <Bell size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--admin-foreground)]">Nueva reserva pendiente</p>
          <p className="mt-0.5 truncate text-sm text-[var(--admin-muted)]">{toast.name}</p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">Revisa la seccion Pendientes de confirmar.</p>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          className="shrink-0 rounded-md p-1 text-[var(--admin-muted)] hover:bg-slate-100"
          aria-label="Cerrar aviso"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
