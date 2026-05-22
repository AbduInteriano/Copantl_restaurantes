import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type EmailSendResult =
  | { ok: true }
  | { ok: false; skipped?: boolean; error: string };

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_HOST?.trim() &&
      process.env.EMAIL_USER?.trim() &&
      process.env.EMAIL_PASS?.trim(),
  );
}

export function describeMissingSmtpEnv(): string {
  const missing: string[] = [];
  if (!process.env.EMAIL_HOST?.trim()) missing.push("EMAIL_HOST");
  if (!process.env.EMAIL_USER?.trim()) missing.push("EMAIL_USER");
  if (!process.env.EMAIL_PASS?.trim()) missing.push("EMAIL_PASS");
  if (missing.length === 0) return "";
  return `Faltan variables SMTP: ${missing.join(", ")}. Configuralas en .env.local o en el hosting.`;
}

function getSmtpPort(): number {
  const port = Number(process.env.EMAIL_PORT ?? 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function createTransport() {
  const options: SMTPTransport.Options = {
    host: process.env.EMAIL_HOST!.trim(),
    port: getSmtpPort(),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER!.trim(),
      pass: process.env.EMAIL_PASS!.trim(),
    },
  };
  return nodemailer.createTransport(options);
}

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim();
  return from ? `Copantl Reservaciones <${from}>` : "Copantl Reservaciones";
}

export async function sendSmtpEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailSendResult> {
  if (!isSmtpConfigured()) {
    return {
      ok: false,
      skipped: true,
      error: describeMissingSmtpEnv() || "SMTP no configurado.",
    };
  }

  const to = options.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Correo del destinatario invalido o vacio." };
  }

  try {
    const transport = createTransport();
    await transport.sendMail({
      from: getFromAddress(),
      to,
      replyTo: process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim(),
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al enviar correo por SMTP.";
    return { ok: false, error: msg };
  }
}
