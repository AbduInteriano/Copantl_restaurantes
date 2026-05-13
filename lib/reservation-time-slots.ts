/**
 * Horarios de reserva en intervalos de 30 minutos (solo :00 y :30).
 * Valores en HH:MM 24h para enviar a la API / Postgres `time`.
 */
export const RESERVATION_TIME_SLOT_VALUES: string[] = (() => {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
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

/** Ajusta una hora cualquiera al slot :00 o :30 mas cercano (misma logica que el selector). */
export function snapReservationTimeToHalfHour(time: string): string {
  const t = time.trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!match) return "12:00";
  let h = Number(match[1]);
  let m = Number(match[2]);
  if (m < 15) m = 0;
  else if (m < 45) m = 30;
  else {
    m = 0;
    h = (h + 1) % 24;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
