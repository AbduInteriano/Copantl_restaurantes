export const MESA_COUNT = 10;
export const MAX_GUESTS_PER_RESERVATION = 20;

export type ReservationAreaPreference = "climatizado" | "terraza";

export function formatReservationArea(area: string | null | undefined): string {
  if (area === "terraza") return "Terraza";
  if (area === "climatizado") return "Climatizado";
  return "—";
}

/** Normaliza hora de DB o input (ej. "20:00:00" -> "20:00") */
export function normalizeTimeKey(time: string): string {
  if (!time) return "";
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.slice(0, 5);
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function timesMatch(a: string, b: string): boolean {
  return normalizeTimeKey(a) === normalizeTimeKey(b);
}

/** Reservas activas (no canceladas) en el mismo slot fecha+hora. */
export function hasReservationSlotConflict(
  reservations: {
    id: string;
    reservation_date: string;
    reservation_time: string;
    status: string;
  }[],
  date: string,
  time: string,
  excludeReservationId?: string,
): boolean {
  for (const r of reservations) {
    if (r.status === "cancelada") continue;
    if (excludeReservationId && r.id === excludeReservationId) continue;
    if (r.reservation_date !== date) continue;
    if (!timesMatch(r.reservation_time, time)) continue;
    return true;
  }
  return false;
}

export function occupiedMesas(
  reservations: { id: string; status: string; reservation_date: string; reservation_time: string; mesa: number | null }[],
  date: string,
  time: string,
  excludeReservationId?: string,
): Set<number> {
  const taken = new Set<number>();
  for (const r of reservations) {
    if (r.status !== "confirmada" || r.mesa == null) continue;
    if (r.reservation_date !== date) continue;
    if (!timesMatch(r.reservation_time, time)) continue;
    if (excludeReservationId && r.id === excludeReservationId) continue;
    taken.add(r.mesa);
  }
  return taken;
}

export function availableMesaList(
  reservations: Parameters<typeof occupiedMesas>[0],
  date: string,
  time: string,
  excludeReservationId?: string,
): number[] {
  const taken = occupiedMesas(reservations, date, time, excludeReservationId);
  return Array.from({ length: MESA_COUNT }, (_, i) => i + 1).filter((m) => !taken.has(m));
}
