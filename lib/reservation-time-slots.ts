/**
 * Horarios de reserva en intervalos de 30 minutos (solo :00 y :30).
 * Valores en HH:MM 24h para enviar a la API / Postgres `time`.
 */
export const RESERVATION_TIME_SLOT_START_HOUR = 13; // 1:00 p. m.
export const RESERVATION_TIME_SLOT_END_HOUR = 22; // 10:00 p. m.

export const RESERVATION_TIME_SLOT_VALUES: string[] = (() => {
  const slots: string[] = [];
  for (let h = RESERVATION_TIME_SLOT_START_HOUR; h <= RESERVATION_TIME_SLOT_END_HOUR; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
})();

/** Etiqueta local es-HN (ej. 7:00 p. m., 7:30 p. m.) */
export function formatReservationTimeSlotLabel(hhmm: string): string {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return hhmm;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const d = new Date(2000, 0, 1, h, min, 0, 0);
  return d.toLocaleTimeString("es-HN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function timeToMinutes(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Ajusta una hora al slot :00 o :30 mas cercano dentro del rango permitido. */
export function snapReservationTimeToHalfHour(time: string): string {
  const t = time.trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!match) return RESERVATION_TIME_SLOT_VALUES[0] ?? "13:00";

  let h = Number(match[1]);
  let m = Number(match[2]);
  if (m < 15) m = 0;
  else if (m < 45) m = 30;
  else {
    m = 0;
    h = (h + 1) % 24;
  }

  const snapped = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const minutes = timeToMinutes(snapped);
  const minAllowed = timeToMinutes(RESERVATION_TIME_SLOT_VALUES[0] ?? "13:00");
  const maxAllowed = timeToMinutes(
    RESERVATION_TIME_SLOT_VALUES[RESERVATION_TIME_SLOT_VALUES.length - 1] ?? "22:00",
  );

  if (minutes <= minAllowed) return RESERVATION_TIME_SLOT_VALUES[0] ?? "13:00";
  if (minutes >= maxAllowed) {
    return RESERVATION_TIME_SLOT_VALUES[RESERVATION_TIME_SLOT_VALUES.length - 1] ?? "22:00";
  }

  if (RESERVATION_TIME_SLOT_VALUES.includes(snapped)) return snapped;

  let closest = RESERVATION_TIME_SLOT_VALUES[0] ?? "13:00";
  let bestDiff = Math.abs(timeToMinutes(closest) - minutes);
  for (const slot of RESERVATION_TIME_SLOT_VALUES) {
    const diff = Math.abs(timeToMinutes(slot) - minutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = slot;
    }
  }
  return closest;
}
