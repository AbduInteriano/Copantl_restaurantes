import { NextResponse } from "next/server";
import { canManageReservations, getSessionRole } from "@/lib/admin-auth";
import {
  describeMissingSmtpEnv,
  isSmtpConfigured,
  sendSmtpEmail,
  verifySmtpConnection,
} from "@/lib/email";
import { buildReservationRejectionEmail } from "@/lib/email-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Prueba SMTP (solo staff). POST body opcional: { "to": "correo@ejemplo.com", "template": "rejection" } */
export async function POST(req: Request) {
  const session = await getSessionRole();
  if (!session || !canManageReservations(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        error: describeMissingSmtpEnv(),
        hint: "Si pruebas en produccion, agrega EMAIL_* en Vercel y redeploy.",
      },
      { status: 503 },
    );
  }

  let to = process.env.EMAIL_USER?.trim() || "";
  let template = "simple";
  try {
    const body = await req.json();
    if (body?.to && typeof body.to === "string") {
      to = body.to.trim();
    }
    if (body?.template === "rejection") {
      template = "rejection";
    }
  } catch {
    /* body vacio: enviar al buzon SMTP */
  }

  const verify = await verifySmtpConnection();
  if (!verify.ok) {
    return NextResponse.json(
      {
        ok: false,
        step: "verify",
        error: verify.error,
        user: process.env.EMAIL_USER,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
      },
      { status: 502 },
    );
  }

  const mail =
    template === "rejection"
      ? buildReservationRejectionEmail({
          full_name: "Cliente Prueba",
          email: to,
          phone: "9999-9999",
          reservation_date: "2026-05-21",
          reservation_time: "7:00 PM",
          restaurant: "La Posada",
          mesa: "—",
          guests: 2,
          notes: "",
          status: "cancelada",
          message: "",
        })
      : {
          subject: "Prueba SMTP — Copantl Reservaciones",
          text: "Si recibes este correo, el envio SMTP desde la app funciona correctamente.",
          html: "<p>Si recibes este correo, el envio <strong>SMTP</strong> desde la app funciona correctamente.</p>",
        };

  const sent = await sendSmtpEmail({
    to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  if (!sent.ok) {
    return NextResponse.json(
      {
        ok: false,
        step: "send",
        error: sent.error,
        to,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    template,
    message: `Correo de prueba (${template}) enviado a ${to}. Revisa entrada y spam.`,
    messageId: sent.messageId,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    host: process.env.EMAIL_HOST,
  });
}
