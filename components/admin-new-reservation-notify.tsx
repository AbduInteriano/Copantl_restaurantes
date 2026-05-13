"use client";

import { Bell, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 28_000;

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
    ctx.resume().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function AdminNewReservationNotify() {
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("reservations")
      .select("id, full_name, created_at")
      .eq("status", "pendiente")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !data || !mountedRef.current) return;

    const rows = data as { id: string; full_name: string; created_at: string }[];
    const ids = new Set(rows.map((r) => r.id));
    if (knownIdsRef.current === null) {
      knownIdsRef.current = ids;
      return;
    }

    for (const row of rows) {
      if (!knownIdsRef.current.has(row.id)) {
        knownIdsRef.current.add(row.id);
        setToast({ id: row.id, name: row.full_name });
        playSoftAlertTone();
        break;
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void poll();
    const t = window.setInterval(() => void poll(), POLL_MS);
    return () => {
      mountedRef.current = false;
      window.clearInterval(t);
    };
  }, [poll]);

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
