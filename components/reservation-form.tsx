"use client";

import emailjs from "@emailjs/browser";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { formatReservationTimeSlotLabel, RESERVATION_TIME_SLOT_VALUES } from "@/lib/reservation-time-slots";

export type ReservationValues = {
  full_name: string;
  email: string;
  phone: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  area: "climatizado" | "terraza";
  notes?: string;
};

export type ReservationBookingFormProps = {
  className?: string;
  compact?: boolean;
  showTerms?: boolean;
  termsText?: string;
  /** Si se define, el padre controla la vista de éxito (p. ej. modal). */
  onSuccess?: () => void;
};

const defaultTerms =
  "Tu reserva esta sujeta a confirmacion por disponibilidad. El horario puede ajustarse segun aforo y eventos privados. Se recomienda llegar 10 minutos antes.";

export function ReservationBookingForm({
  className = "",
  compact,
  showTerms,
  termsText = defaultTerms,
  onSuccess,
}: ReservationBookingFormProps) {
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateInputType, setDateInputType] = useState<"text" | "date">("text");
  const { register, handleSubmit, reset } = useForm<ReservationValues>({
    defaultValues: {
      area: "climatizado",
      reservation_time: "",
    },
  });

  const timeOptions = useMemo(
    () =>
      RESERVATION_TIME_SLOT_VALUES.map((v) => ({
        value: v,
        label: formatReservationTimeSlotLabel(v),
      })),
    [],
  );

  const gridGap = compact ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4";
  const inputPad = compact ? "p-2.5 sm:p-3" : "p-3";

  const onSubmit = async (values: ReservationValues) => {
    setIsSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof (data as { error: string }).error === "string"
            ? (data as { error: string }).error
            : "No se pudo crear la reserva.";
        setStatus(msg);
        return;
      }

      if (
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      ) {
        try {
          await emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
            values,
            { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY },
          );
        } catch {
          // No bloquear exito si solo falla el envio del correo
        }
      }

      reset({ area: "climatizado", reservation_time: "" });
      setDateInputType("text");
      if (onSuccess) {
        onSuccess();
      } else {
        setStatus("Reserva enviada correctamente. Te confirmaremos pronto.");
      }
    } catch {
      setStatus("Ocurrio un error de red. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = `rounded-md border border-[var(--border)] bg-[var(--background)]/80 ${inputPad} text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]/70 outline-none transition focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]/35`;

  const dateTimeInputClass = `reservation-datetime-input rounded-md border-2 border-[var(--foreground-muted)]/45 bg-[var(--surface)] ${inputPad} min-h-[48px] w-full text-[var(--foreground)] outline-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition [color-scheme:dark] focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold)]/30 sm:min-h-[52px]`;
  const dateField = register("reservation_date", { required: true });
  const timeRegister = register("reservation_time", { required: true });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      <div className={`grid ${gridGap} md:grid-cols-2`}>
        <input className={inputClass} placeholder="Nombre completo" {...register("full_name", { required: true })} />
        <input className={inputClass} type="email" placeholder="Correo electronico" {...register("email", { required: true })} />
        <input className={inputClass} placeholder="Telefono" {...register("phone", { required: true })} />
        <input
          className={inputClass}
          type="number"
          min={1}
          max={20}
          placeholder="Numero de personas (max. 20)"
          {...register("guests", { required: true, valueAsNumber: true })}
        />
        <label className={`flex flex-col gap-1.5 md:col-span-2 ${compact ? "text-xs" : "text-sm"} text-[var(--foreground-muted)]`}>
          <span className="font-medium text-[var(--foreground)]">Area</span>
          <select className={inputClass} {...register("area", { required: true })}>
            <option value="climatizado">Climatizado</option>
            <option value="terraza">Terraza</option>
          </select>
        </label>
        <div className={`grid min-w-0 ${gridGap} md:col-span-2 md:grid-cols-2`}>
          <label
            className={`flex min-w-0 flex-col gap-1.5 ${compact ? "text-xs" : "text-sm"} text-[var(--foreground-muted)]`}
          >
            <span className="font-medium text-[var(--foreground)]">Fecha</span>
            <input
              className={dateTimeInputClass}
              type={dateInputType}
              placeholder="Selecciona fecha"
              inputMode="none"
              {...dateField}
              onFocus={() => setDateInputType("date")}
              onBlur={(event) => {
                dateField.onBlur(event);
                if (!event.currentTarget.value) setDateInputType("text");
              }}
            />
          </label>
          <label
            className={`flex min-w-0 flex-col gap-1.5 ${compact ? "text-xs" : "text-sm"} text-[var(--foreground-muted)]`}
          >
            <span className="font-medium text-[var(--foreground)]">Hora</span>
            <select className={dateTimeInputClass} {...timeRegister}>
              <option value="">Selecciona hora</option>
              {timeOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <textarea
        className={`min-h-24 w-full ${inputClass}`}
        placeholder="Notas especiales"
        {...register("notes")}
      />

      {showTerms ? <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">{termsText}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--accent-gold)] px-4 py-3 font-medium text-[var(--foreground)] transition hover:opacity-95 disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Reservar ahora"}
      </button>
      {status && !onSuccess ? <p className="text-sm text-[var(--foreground-muted)]">{status}</p> : null}
      {status && onSuccess ? <p className="text-sm text-red-300/90">{status}</p> : null}
    </form>
  );
}

export function ReservationForm() {
  return (
    <ReservationBookingForm className="rounded-xl border border-[var(--border)] p-6" />
  );
}
