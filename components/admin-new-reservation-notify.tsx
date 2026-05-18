"use client";

import { Bell, X } from "lucide-react";
import type { MutableRefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const POLL_MS = 8_000;

/** Cuatro "tin" ascendentes, ~4 s en total. */
const CHIME_NOTES_HZ = [784, 988, 1175, 1568];
const CHIME_NOTE_DURATION_S = 0.6;
const CHIME_GAP_S = 1.05;
const CHIME_PEAK_GAIN = 0.28;

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new Ctx();
  }
  return sharedAudioCtx;
}

async function ensureAudioReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

function playReservationChime() {
  void (async () => {
    const ctx = await ensureAudioReady();
    if (!ctx) return;

    const start = ctx.currentTime + 0.02;

    CHIME_NOTES_HZ.forEach((freq, index) => {
      const t0 = start + index * CHIME_GAP_S;
      const tEnd = t0 + CHIME_NOTE_DURATION_S;

      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();
      const mix = ctx.createGain();

      osc.type = "sine";
      harmonic.type = "triangle";
      osc.frequency.setValueAtTime(freq, t0);
      harmonic.frequency.setValueAtTime(freq * 2, t0);

      mix.gain.setValueAtTime(1, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(CHIME_PEAK_GAIN, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      osc.connect(mix);
      harmonic.connect(mix);
      mix.gain.value = 0.65;
      mix.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t0);
      harmonic.start(t0);
      osc.stop(tEnd + 0.05);
      harmonic.stop(tEnd + 0.05);
    });
  })();
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
  playReservationChime();
}

export function AdminNewReservationNotify() {
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const unlock = () => {
      void ensureAudioReady();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

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
