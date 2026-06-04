import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type EmailSendResult =
  | { ok: true; messageId?: string }
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
  return `Faltan variables SMTP en el servidor (${missing.join(", ")}). En Vercel/hosting debes agregarlas y redeploy. En local: web/.env.local y reinicia npm run dev.`;
}

function getSmtpPort(): number {
  const port = Number(process.env.EMAIL_PORT ?? 587);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function getMailboxAddress(): string {
  return (process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER?.trim() || "").trim();
}

/** Transporte alineado con Microsoft 365 (STARTTLS puerto 587). */
function createTransport() {
  const user = process.env.EMAIL_USER!.trim();
  const options: SMTPTransport.Options = {
    host: process.env.EMAIL_HOST!.trim(),
    port: getSmtpPort(),
    secure: false,
    requireTLS: true,
    auth: {
      user,
      pass: process.env.EMAIL_PASS!.trim(),
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  };
  return nodemailer.createTransport(options);
}

function formatSmtpError(e: unknown): string {
  if (e && typeof e === "object") {
    const err = e as { message?: string; response?: string; responseCode?: number };
    const parts = [err.message, err.responseCode ? `codigo ${err.responseCode}` : "", err.response]
      .filter(Boolean)
      .join(" — ");
    if (parts) return parts;
  }
  return e instanceof Error ? e.message : "Error al enviar correo por SMTP.";
}

export async function verifySmtpConnection(): Promise<EmailSendResult> {
  if (!isSmtpConfigured()) {
    return { ok: false, skipped: true, error: describeMissingSmtpEnv() };
  }
  try {
    const transport = createTransport();
    await transport.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatSmtpError(e) };
  }
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

  const mailbox = getMailboxAddress();
  if (!mailbox || !mailbox.includes("@")) {
    return { ok: false, error: "EMAIL_FROM o EMAIL_USER invalido." };
  }

  const to = options.to.trim().toLowerCase();
  if (!to || !to.includes("@")) {
    return { ok: false, error: "Correo del destinatario invalido o vacio." };
  }

  try {
    const transport = createTransport();
    const info = await transport.sendMail({
      from: {
        name: "Copantl Hotel & Convention Center",
        address: mailbox,
      },
      to,
      replyTo: mailbox,
      subject: options.subject,
      html: options.html,
      text: options.text,
      envelope: {
        from: mailbox,
        to,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.info("[smtp] enviado a", to, info.messageId);
    }

    return { ok: true, messageId: info.messageId };
  } catch (e) {
    const error = formatSmtpError(e);
    console.error("[smtp] error:", error);
    return { ok: false, error };
  }
}
