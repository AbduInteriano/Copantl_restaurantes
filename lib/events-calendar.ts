export const EVENT_MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const EVENT_WEEKDAYS_ES = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export function padEventDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function todayEventDate(): string {
  const n = new Date();
  return padEventDate(n.getFullYear(), n.getMonth(), n.getDate());
}

export function formatEventDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("es-HN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

export function buildCalendarCells(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { key: string | null; day: number | null }[] = [];

  for (let i = 0; i < firstWeekday; i++) cells.push({ key: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: padEventDate(year, month, d), day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null });
  while (cells.length < 42) cells.push({ key: null, day: null });

  return cells;
}

export function groupEventsByDate<T extends { event_date: string | null }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    if (!item.event_date) continue;
    const list = map.get(item.event_date) ?? [];
    list.push(item);
    map.set(item.event_date, list);
  }
  return map;
}
