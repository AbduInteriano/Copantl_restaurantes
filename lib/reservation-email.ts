import {
  buildReservationConfirmationEmail,
  buildReservationReceivedEmail,
  type ReservationEmailTemplateParams,
} from "@/lib/email-templates";
import { sendSmtpEmail, type EmailSendResult } from "@/lib/email";
import { formatReservationRestaurant } from "@/lib/restaurants";
import { formatReservationTimeSlotLabel } from "@/lib/reservation-time-slots";

export type ReservationEmailPayload = {
  full_name: string;
  email: string;
  phone?: string | null;
  reservation_date: string;
  reservation_time: string;
  guests?: number;
  mesa: number | null;
  area?: string | null;
  notes?: string | null;
};

function formatTimeLabel(reservation_time: string): string {
  const timeRaw = String(reservation_time).slice(0, 5);
  try {
    return formatReservationTimeSlotLabel(timeRaw);
  } catch {
    return timeRaw;
  }
}

function toTemplateParams(
  reservation: ReservationEmailPayload,
  overrides: Partial<ReservationEmailTemplateParams> = {},
): ReservationEmailTemplateParams {
  const restaurant = formatReservationRestaurant(reservation.area);
  const mesaLabel = reservation.mesa != null ? String(reservation.mesa) : "—";
  const recipient = reservation.email.trim();

  return {
    full_name: reservation.full_name.trim(),
    email: recipient,
    phone: reservation.phone?.trim() ?? "",
    reservation_date: reservation.reservation_date,
    reservation_time: formatTimeLabel(reservation.reservation_time),
    restaurant,
    mesa: mesaLabel,
    guests: reservation.guests ?? "",
    notes: reservation.notes?.trim() ?? "",
    status: "confirmada",
    message: "",
    ...overrides,
  };
}

/** Correo al confirmar reserva y asignar mesa desde el panel admin. */
export async function sendReservationConfirmationEmail(
  reservation: ReservationEmailPayload,
): Promise<EmailSendResult> {
  const timeLabel = formatTimeLabel(reservation.reservation_time);
  const restaurant = formatReservationRestaurant(reservation.area);
  const mesaLabel = reservation.mesa != null ? String(reservation.mesa) : "—";

  const params = toTemplateParams(reservation, {
    status: "confirmada",
    message: `Tu reservacion en Copantl ha sido confirmada. Mesa: ${mesaLabel}. Fecha: ${reservation.reservation_date}, hora: ${timeLabel}. Restaurante: ${restaurant}. Te esperamos.`,
  });

  const { subject, html, text } = buildReservationConfirmationEmail(params);
  return sendSmtpEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}

/** Correo opcional al recibir solicitud desde la web (pendiente de confirmar). */
export async function sendReservationReceivedEmail(
  reservation: ReservationEmailPayload,
): Promise<EmailSendResult> {
  const restaurant = formatReservationRestaurant(reservation.area);
  const params = toTemplateParams(reservation, {
    status: "pendiente",
    mesa: "—",
    message:
      "Recibimos su solicitud de reservacion. Nos pondremos en contacto para confirmarla.",
    restaurant,
  });

  const { subject, html, text } = buildReservationReceivedEmail(params);
  return sendSmtpEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}
