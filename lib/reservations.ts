import {
  formatReservationRestaurant,
  formatReservationRestaurantLong,
  parseReservationRestaurant,
  type RestaurantKey,
} from "@/lib/restaurants";
import { DEFAULT_TABLE_COUNTS, isValidMesaForRestaurant } from "@/lib/restaurant-profiles";

export const MAX_GUESTS_PER_RESERVATION = 20;

/** Zona horaria del hotel (Honduras) para decidir si una reserva ya pasó. */
export const RESERVATION_BUSINESS_TZ = "America/Tegucigalpa";

/** Fecha local del negocio en formato YYYY-MM-DD. */
export function getBusinessTodayDateKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESERVATION_BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** true si la fecha de la reserva es anterior a hoy (ya terminó ese día). */
export function isReservationDatePast(
  reservationDate: string,
  todayKey = getBusinessTodayDateKey(),
): boolean {
  const key = reservationDate.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return key < todayKey;
}

/** Reservas que deben verse en panel, calendario e impresión (hoy o futuro). */
export function isReservationOperational(r: { reservation_date: string }): boolean {
  return !isReservationDatePast(r.reservation_date);
}

export function filterOperationalReservations<T extends { reservation_date: string }>(
  reservations: T[],
): T[] {
  return reservations.filter(isReservationOperational);
}

/** @deprecated Usar table_count por restaurante desde restaurant_profiles */
export const MESA_COUNT = 10;

export type ReservationAreaPreference = RestaurantKey;

export function formatReservationArea(area: string | null | undefined): string {
  return formatReservationRestaurant(area);
}

export function formatReservationAreaLong(area: string | null | undefined): string {
  return formatReservationRestaurantLong(area);
}

export function getTableCountForArea(
  area: string | null | undefined,
  tableCountByRestaurant?: Partial<Record<RestaurantKey, number>>,
): number {
  const key = parseReservationRestaurant(area);
  const fromMap = tableCountByRestaurant?.[key];
  if (fromMap != null && fromMap >= 1) return Math.floor(fromMap);
  return DEFAULT_TABLE_COUNTS[key];
}

export function normalizeTimeKey(time: string): string {
  if (!time) return "";
  const m = time.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time.slice(0, 5);
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function timesMatch(a: string, b: string): boolean {
  return normalizeTimeKey(a) === normalizeTimeKey(b);
}

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
  reservations: {
    id: string;
    status: string;
    area?: string | null;
    reservation_date: string;
    reservation_time: string;
    mesa: number | null;
  }[],
  area: string | null | undefined,
  date: string,
  time: string,
  excludeReservationId?: string,
): Set<number> {
  const restaurant = parseReservationRestaurant(area);
  const taken = new Set<number>();
  for (const r of reservations) {
    if (r.status !== "confirmada" || r.mesa == null) continue;
    if (parseReservationRestaurant(r.area) !== restaurant) continue;
    if (r.reservation_date !== date) continue;
    if (!timesMatch(r.reservation_time, time)) continue;
    if (excludeReservationId && r.id === excludeReservationId) continue;
    taken.add(r.mesa);
  }
  return taken;
}

export function availableMesaList(
  reservations: Parameters<typeof occupiedMesas>[0],
  area: string | null | undefined,
  tableCount: number,
  date: string,
  time: string,
  excludeReservationId?: string,
): number[] {
  const count = Math.max(1, Math.floor(tableCount));
  const taken = occupiedMesas(reservations, area, date, time, excludeReservationId);
  return Array.from({ length: count }, (_, i) => i + 1).filter((m) => !taken.has(m));
}

export function validateMesaAssignment(
  mesa: number | null,
  area: string | null | undefined,
  tableCountByRestaurant?: Partial<Record<RestaurantKey, number>>,
): { ok: true; mesa: number } | { ok: false; error: string } {
  if (mesa == null || Number.isNaN(mesa)) {
    return { ok: false, error: "Debe asignar un numero de mesa." };
  }
  const tableCount = getTableCountForArea(area, tableCountByRestaurant);
  if (!isValidMesaForRestaurant(mesa, tableCount)) {
    return {
      ok: false,
      error: `La mesa debe estar entre 1 y ${tableCount} para ${formatReservationArea(area)}.`,
    };
  }
  return { ok: true, mesa: Math.floor(mesa) };
}
