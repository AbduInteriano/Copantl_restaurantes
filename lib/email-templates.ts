/** Variables de plantilla usadas en correos de reservas (HTML y texto). */
export type ReservationEmailTemplateParams = {
  full_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  restaurant: string;
  mesa: string;
  guests: string | number;
  message: string;
  notes: string;
  status: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:6px 12px 6px 0;color:#555;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`;
}

export function buildReservationConfirmationEmail(p: ReservationEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reservacion confirmada — Copantl Reservaciones";
  const text = [
    `Hola ${p.full_name},`,
    "",
    p.message,
    "",
    `Fecha: ${p.reservation_date}`,
    `Hora: ${p.reservation_time}`,
    `Restaurante: ${p.restaurant}`,
    `Mesa: ${p.mesa}`,
    `Personas: ${p.guests}`,
    p.notes ? `Notas: ${p.notes}` : "",
    "",
    "Te esperamos en Copantl Reservaciones.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#f4f4f5;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e4e4e7;border-radius:8px;">
    <tr><td style="padding:24px 24px 8px;border-bottom:3px solid #1e3a5f;">
      <h1 style="margin:0;font-size:20px;color:#1e3a5f;">Reservacion confirmada</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#555;">Copantl Reservaciones</p>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 16px;font-size:15px;">Hola <strong>${escapeHtml(p.full_name)}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.5;">${escapeHtml(p.message)}</p>
      <table style="font-size:14px;line-height:1.4;">
        ${row("Fecha", p.reservation_date)}
        ${row("Hora", p.reservation_time)}
        ${row("Restaurante", p.restaurant)}
        ${row("Mesa", p.mesa)}
        ${row("Personas", String(p.guests))}
        ${row("Estado", p.status)}
        ${p.notes ? row("Notas", p.notes) : ""}
      </table>
    </td></tr>
    <tr><td style="padding:16px 24px;background:#f8fafc;font-size:12px;color:#64748b;border-top:1px solid #e4e4e7;">
      Este correo fue enviado a ${escapeHtml(p.email)}. Si no realizaste esta reserva, contactanos.
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

export function buildReservationReceivedEmail(p: ReservationEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Solicitud de reservacion recibida — Copantl";
  const text = [
    `Hola ${p.full_name},`,
    "",
    p.message,
    "",
    `Fecha solicitada: ${p.reservation_date}`,
    `Hora: ${p.reservation_time}`,
    `Restaurante: ${p.restaurant}`,
    `Personas: ${p.guests}`,
    "",
    "Te confirmaremos por correo cuando la reserva sea aprobada.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#f4f4f5;color:#111;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e4e4e7;border-radius:8px;">
    <tr><td style="padding:24px 24px 8px;border-bottom:3px solid #1e3a5f;">
      <h1 style="margin:0;font-size:20px;color:#1e3a5f;">Solicitud recibida</h1>
    </td></tr>
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 16px;font-size:15px;">Hola <strong>${escapeHtml(p.full_name)}</strong>,</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.5;">${escapeHtml(p.message)}</p>
      <table style="font-size:14px;">
        ${row("Fecha", p.reservation_date)}
        ${row("Hora", p.reservation_time)}
        ${row("Restaurante", p.restaurant)}
        ${row("Personas", String(p.guests))}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#555;">Te enviaremos otro correo cuando confirmemos tu mesa.</p>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
