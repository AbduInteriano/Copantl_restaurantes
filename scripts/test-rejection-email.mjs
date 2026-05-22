import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const { isSmtpConfigured, verifySmtpConnection, sendSmtpEmail } = await import(
  "../lib/email.ts"
);
const { buildReservationRejectionEmail } = await import("../lib/email-templates.ts");

const to = process.argv[2]?.trim() || process.env.EMAIL_USER?.trim();
if (!to) {
  console.error("Uso: node scripts/test-rejection-email.mjs [correo@destino]");
  process.exit(1);
}

console.log("SMTP configurado:", isSmtpConfigured());
const verify = await verifySmtpConnection();
console.log("verify:", verify.ok ? "OK" : verify.error);
if (!verify.ok) process.exit(2);

const params = {
  full_name: "Cliente Prueba",
  email: to,
  phone: "9999-9999",
  reservation_date: "2026-05-21",
  reservation_time: "7:00 PM",
  restaurant: "La Posada",
  mesa: "—",
  guests: 4,
  notes: "",
  status: "cancelada",
  message: "",
};

const { subject, html, text } = buildReservationRejectionEmail(params);
const sent = await sendSmtpEmail({ to, subject, html, text });
console.log("envio rechazo:", sent.ok ? `OK ${sent.messageId ?? ""}` : sent.error);
process.exit(sent.ok ? 0 : 3);
