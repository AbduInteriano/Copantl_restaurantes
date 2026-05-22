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

const WHATSAPP_URL = "https://wa.me/50431410888";
const WAIT_TIME_NOTICE =
  "Tu mesa estara disponible hasta 20 minutos despues de la hora de tu reservacion.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 14px 8px 0;color:#4b5563;font-weight:600;vertical-align:top;width:38%;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#111827;">${escapeHtml(value)}</td></tr>`;
}

const emailShell = (body: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#f3f4f6;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;" role="presentation">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const confirmationFooterHtml = `
<tr>
  <td style="padding:20px 28px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;">
    <p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#374151;">
      ${escapeHtml(WAIT_TIME_NOTICE)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1e3a5f;">Gracias!</p>
    <p style="margin:0;font-size:14px;line-height:1.5;">
      <a href="${WHATSAPP_URL}" style="color:#1e3a5f;font-weight:600;text-decoration:underline;">Escribenos por WhatsApp</a>
    </p>
  </td>
</tr>`;

const confirmationFooterText = [
  "",
  WAIT_TIME_NOTICE,
  "",
  "Gracias!",
  "",
  `WhatsApp: ${WHATSAPP_URL}`,
].join("\n");

/** Correo al confirmar reserva (panel admin). Edita aqui el diseno y textos. */
export function buildReservationConfirmationEmail(p: ReservationEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Gracias por reservar — Copantl Hotel & Convention Center";

  const text = [
    `Hola ${p.full_name},`,
    "",
    "Gracias por Reservar en Copantl Hotel & Convention Center",
    "",
    "Tu reservacion ha sido confirmada. Estos son los detalles:",
    "",
    `Fecha: ${p.reservation_date}`,
    `Hora: ${p.reservation_time}`,
    `Restaurante: ${p.restaurant}`,
    `Mesa: ${p.mesa}`,
    `Personas: ${p.guests}`,
    p.phone ? `Telefono: ${p.phone}` : "",
    p.notes ? `Notas: ${p.notes}` : "",
    confirmationFooterText,
  ]
    .filter(Boolean)
    .join("\n");

  const body = `
<tr>
  <td style="padding:28px 28px 16px;background:#1e3a5f;text-align:center;">
    <p style="margin:0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:#cbd5e1;">Copantl Hotel &amp; Convention Center</p>
    <h1 style="margin:12px 0 0;font-size:22px;line-height:1.35;font-weight:600;color:#ffffff;">
      Gracias por Reservar en Copantl Hotel &amp; Convention Center
    </h1>
  </td>
</tr>
<tr>
  <td style="padding:24px 28px 8px;">
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#111827;">
      Hola <strong>${escapeHtml(p.full_name)}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
      Tu reservacion ha sido <strong>confirmada</strong>. Te compartimos los detalles:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;" role="presentation">
      <tr><td colspan="2" style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:700;color:#1e3a5f;">Detalles de tu reserva</td></tr>
      <tr><td colspan="2" style="padding:4px 16px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          ${row("Fecha", p.reservation_date)}
          ${row("Hora", p.reservation_time)}
          ${row("Restaurante", p.restaurant)}
          ${row("Mesa", p.mesa)}
          ${row("Personas", String(p.guests))}
          ${p.phone ? row("Telefono", p.phone) : ""}
          ${p.notes ? row("Notas", p.notes) : ""}
        </table>
      </td></tr>
    </table>
  </td>
</tr>
${confirmationFooterHtml}`;

  return { subject, html: emailShell(body), text };
}

/** Correo al recibir solicitud desde la web (pendiente de confirmar). */
export function buildReservationReceivedEmail(p: ReservationEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Solicitud de reservacion recibida — Copantl Hotel & Convention Center";

  const text = [
    `Hola ${p.full_name},`,
    "",
    "Gracias por contactar a Copantl Hotel & Convention Center.",
    "",
    "Recibimos tu solicitud de reservacion. Te enviaremos un correo cuando sea confirmada.",
    "",
    `Fecha solicitada: ${p.reservation_date}`,
    `Hora: ${p.reservation_time}`,
    `Restaurante: ${p.restaurant}`,
    `Personas: ${p.guests}`,
    confirmationFooterText,
  ].join("\n");

  const body = `
<tr>
  <td style="padding:28px 28px 16px;background:#1e3a5f;text-align:center;">
    <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">Solicitud de reservacion recibida</h1>
    <p style="margin:10px 0 0;font-size:14px;color:#cbd5e1;">Copantl Hotel &amp; Convention Center</p>
  </td>
</tr>
<tr>
  <td style="padding:24px 28px 8px;">
    <p style="margin:0 0 16px;font-size:16px;">Hola <strong>${escapeHtml(p.full_name)}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#374151;">
      Recibimos tu solicitud. Te confirmaremos por correo en cuanto sea aprobada.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #e5e7eb;border-radius:8px;" role="presentation">
      ${row("Fecha", p.reservation_date)}
      ${row("Hora", p.reservation_time)}
      ${row("Restaurante", p.restaurant)}
      ${row("Personas", String(p.guests))}
    </table>
  </td>
</tr>
${confirmationFooterHtml}`;

  return { subject, html: emailShell(body), text };
}
