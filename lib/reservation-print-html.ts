import { formatReservationAreaLong } from "@/lib/reservations";
import { formatReservationTimeSlotLabel } from "@/lib/reservation-time-slots";

export type PrintableReservation = {
  id: string;
  status: string;
  full_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  mesa: number | null;
  area: string;
  source: string;
  notes: string | null;
  event_id: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(time: string): string {
  const raw = time.slice(0, 5);
  try {
    return formatReservationTimeSlotLabel(raw);
  } catch {
    return raw;
  }
}

function reservationCard(
  r: PrintableReservation,
  eventTitle: string | undefined,
): string {
  const notes = r.notes?.trim() ? escapeHtml(r.notes) : "—";
  const eventLine =
    r.event_id && eventTitle
      ? `<p><span class="lbl">Evento:</span> ${escapeHtml(eventTitle)}</p>`
      : "";

  return `
    <article class="card">
      <h2 class="name">${escapeHtml(r.full_name)}</h2>
      <div class="grid">
        <p><span class="lbl">Correo:</span> ${escapeHtml(r.email)}</p>
        <p><span class="lbl">Telefono:</span> ${escapeHtml(r.phone)}</p>
        <p><span class="lbl">Fecha:</span> ${escapeHtml(r.reservation_date)}</p>
        <p><span class="lbl">Hora:</span> ${escapeHtml(formatTime(r.reservation_time))}</p>
        <p><span class="lbl">Personas:</span> ${r.guests}</p>
        <p><span class="lbl">Mesa:</span> ${r.mesa ?? "—"}</p>
        <p><span class="lbl">Restaurante:</span> ${escapeHtml(formatReservationAreaLong(r.area))}</p>
        <p><span class="lbl">Origen:</span> ${r.source === "manual" ? "Manual" : "Web"}</p>
        ${eventLine}
        <p class="notes"><span class="lbl">Notas:</span> ${notes}</p>
      </div>
    </article>
  `;
}

export function buildReservationsPrintDocument(
  reservations: PrintableReservation[],
  eventTitles: Record<string, string>,
): string {
  const cards = reservations
    .map((r) => reservationCard(r, r.event_id ? eventTitles[r.event_id] : undefined))
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reservaciones confirmadas — Copantl</title>
  <style>
    @page { size: letter portrait; margin: 0.45in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", system-ui, sans-serif;
      font-size: 10.5pt;
      color: #111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 {
      margin: 0 0 0.15in;
      font-size: 13pt;
      font-weight: 600;
      text-align: center;
      letter-spacing: 0.04em;
    }
    .meta {
      text-align: center;
      font-size: 9pt;
      color: #444;
      margin-bottom: 0.2in;
    }
    .sheet { width: 100%; }
    .card {
      height: 3.05in;
      padding: 0.14in 0.1in 0.1in;
      border-bottom: 1px solid #bbb;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .card:nth-child(3n) {
      page-break-after: always;
      border-bottom: none;
    }
    .card:last-child {
      page-break-after: auto;
    }
    .name {
      margin: 0 0 0.1in;
      font-size: 12pt;
      font-weight: 700;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 0.06in;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.06in 0.2in;
    }
    .grid p { margin: 0; line-height: 1.35; }
    .lbl { color: #555; font-weight: 600; }
    .notes { grid-column: 1 / -1; }
    .no-print.toolbar {
      display: flex;
      gap: 8px;
      justify-content: center;
      padding: 12px;
      margin-bottom: 16px;
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
    }
    .no-print.toolbar button {
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      background: #fff;
    }
    .no-print.toolbar button:first-child {
      background: #1e3a5f;
      color: #fff;
      border-color: #1e3a5f;
    }
    @media print {
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print toolbar">
    <button type="button" onclick="window.print()">Imprimir</button>
  </div>
  <h1>Copantl — Reservaciones confirmadas</h1>
  <p class="meta">Impreso ${escapeHtml(new Date().toLocaleString("es-HN"))} · ${reservations.length} reserva(s)</p>
  <div class="sheet">${cards}</div>
</body>
</html>`;
}
