import { NextResponse } from "next/server";
import { canManageReservations, getSessionRole } from "@/lib/admin-auth";
import type { EmailSendResult } from "@/lib/email";
import {
  sendReservationConfirmationEmail,
  sendReservationRejectionEmail,
} from "@/lib/reservation-email";
import { validateMesaForArea } from "@/lib/mesa-server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

function buildEmailFeedback(
  action: "confirmada" | "rechazada",
  result: EmailSendResult,
): { emailSent: boolean; emailWarning?: string } {
  if (result.ok) {
    return {
      emailSent: true,
      emailWarning: undefined,
    };
  }
  if (result.skipped) {
    return {
      emailSent: false,
      emailWarning:
        action === "confirmada"
          ? `Reserva confirmada. ${result.error}`
          : `Reserva rechazada. ${result.error}`,
    };
  }
  return {
    emailSent: false,
    emailWarning:
      action === "confirmada"
        ? `Reserva confirmada, pero no se envio el correo: ${result.error}`
        : `Reserva rechazada, pero no se envio el correo al cliente: ${result.error}`,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionRole();
  if (!session || !canManageReservations(session.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const payload = await req.json();
  const supabase = createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", params.id)
    .single();
  const reservationData = reservation as
    | Database["public"]["Tables"]["reservations"]["Row"]
    | null;

  if (!reservationData) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  const previousStatus = reservationData.status;
  const status = payload.status as Database["public"]["Tables"]["reservations"]["Row"]["status"];
  const updates: Record<string, unknown> = { status };

  if (status === "confirmada") {
    const mesa = payload.mesa != null ? Number(payload.mesa) : NaN;
    const check = await validateMesaForArea(mesa, reservationData.area);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }
    updates.mesa = check.mesa;
  } else if (status === "cancelada" || status === "pendiente") {
    updates.mesa = null;
  }

  const { error } = await supabase
    .from("reservations")
    .update(updates as never)
    .eq("id", params.id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Esa mesa ya esta ocupada en esa fecha y hora para este restaurante." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const emailPayload = {
    full_name: reservationData.full_name,
    email: reservationData.email,
    phone: reservationData.phone,
    reservation_date: reservationData.reservation_date,
    reservation_time: reservationData.reservation_time,
    guests: reservationData.guests,
    mesa: null as number | null,
    area: reservationData.area,
    notes: reservationData.notes,
  };

  let emailSent = false;
  let emailWarning: string | undefined;

  if (status === "confirmada") {
    emailPayload.mesa =
      typeof updates.mesa === "number" ? updates.mesa : reservationData.mesa;
    const feedback = buildEmailFeedback(
      "confirmada",
      await sendReservationConfirmationEmail(emailPayload),
    );
    emailSent = feedback.emailSent;
    emailWarning = feedback.emailWarning;
  } else if (status === "cancelada" && previousStatus === "pendiente") {
    const feedback = buildEmailFeedback(
      "rechazada",
      await sendReservationRejectionEmail(emailPayload),
    );
    emailSent = feedback.emailSent;
    emailWarning = feedback.emailWarning;
  }

  return NextResponse.json({
    ok: true,
    emailSent,
    emailWarning,
  });
}
