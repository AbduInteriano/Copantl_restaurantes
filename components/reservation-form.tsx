"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type BookableEvent,
  eventsForSelector,
  findBookableEvent,
  formatEventOptionLabel,
} from "@/lib/events";
import { getRestaurantProfile, type RestaurantProfile } from "@/lib/restaurant-profiles";
import {
  buildReservationTimeSlots,
  formatReservationTimeSlotLabel,
  RESERVATION_TIME_SLOT_VALUES,
} from "@/lib/reservation-time-slots";
import { RESTAURANTS, type RestaurantKey } from "@/lib/restaurants";

export type ReservationValues = {
  full_name: string;
  email: string;
  phone: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  area: RestaurantKey;
  event_id?: string;
  notes?: string;
};

export type ReservationPrefill = {
  eventId?: string;
};

export type ReservationBookingFormProps = {
  className?: string;
  compact?: boolean;
  showTerms?: boolean;
  termsText?: string;
  bookableEvents?: BookableEvent[];
  restaurantProfiles?: RestaurantProfile[];
  initialPrefill?: ReservationPrefill | null;
  onSuccess?: () => void;
};

const defaultTerms =
  "Tu reserva esta sujeta a confirmacion por disponibilidad. El horario puede ajustarse segun aforo y eventos privados. Se recomienda llegar 10 minutos antes.";

export function ReservationBookingForm({
  className = "",
  compact,
  showTerms,
  termsText = defaultTerms,
  bookableEvents = [],
  restaurantProfiles = [],
  initialPrefill,
  onSuccess,
}: ReservationBookingFormProps) {
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateInputType, setDateInputType] = useState<"text" | "date">("text");
  const { register, handleSubmit, reset, watch, setValue } = useForm<ReservationValues>({
    defaultValues: {
      area: "cbari",
      reservation_time: "",
      event_id: "",
    },
  });

  const area = watch("area");
  const reservationDate = watch("reservation_date");
  const eventId = watch("event_id");
  const reservationTime = watch("reservation_time");

  const selectedEvent = useMemo(
    () => (eventId ? findBookableEvent(bookableEvents, eventId) : undefined),
    [bookableEvents, eventId],
  );

  const restaurantOptions = useMemo(() => {
    if (selectedEvent?.restaurants.length) {
      return RESTAURANTS.filter((r) => selectedEvent.restaurants.includes(r.key));
    }
    return RESTAURANTS;
  }, [selectedEvent]);

  const eventOptions = useMemo(() => {
    const list = eventsForSelector(bookableEvents, area, reservationDate);
    if (selectedEvent && !list.some((e) => e.id === selectedEvent.id)) {
      return [selectedEvent, ...list];
    }
    return list;
  }, [bookableEvents, area, reservationDate, selectedEvent]);

  const timeSlots = useMemo(() => {
    if (selectedEvent?.reservation_start_time && selectedEvent.reservation_end_time) {
      return buildReservationTimeSlots(
        selectedEvent.reservation_start_time,
        selectedEvent.reservation_end_time,
      );
    }
    if (area) {
      const profile = getRestaurantProfile(restaurantProfiles, area);
      return buildReservationTimeSlots(profile.reservation_start_time, profile.reservation_end_time);
    }
    return RESERVATION_TIME_SLOT_VALUES;
  }, [selectedEvent, area, restaurantProfiles]);

  const timeOptions = useMemo(
    () => timeSlots.map((v) => ({ value: v, label: formatReservationTimeSlotLabel(v) })),
    [timeSlots],
  );

  const dateLockedByEvent = Boolean(selectedEvent?.event_date);

  useEffect(() => {
    if (!initialPrefill?.eventId) return;
    const ev = findBookableEvent(bookableEvents, initialPrefill.eventId);
    if (!ev) return;
    setValue("event_id", ev.id);
    if (ev.event_date) {
      setValue("reservation_date", ev.event_date);
      setDateInputType("date");
    }
    if (ev.restaurants.length && !ev.restaurants.includes(area)) {
      setValue("area", ev.restaurants[0]);
    }
    setValue("reservation_time", "");
  }, [initialPrefill?.eventId, bookableEvents, setValue, area]);

  useEffect(() => {
    if (!selectedEvent) return;
    if (selectedEvent.event_date && reservationDate !== selectedEvent.event_date) {
      setValue("reservation_date", selectedEvent.event_date);
      setDateInputType("date");
    }
    if (selectedEvent.restaurants.length && !selectedEvent.restaurants.includes(area)) {
      setValue("area", selectedEvent.restaurants[0]);
    }
  }, [selectedEvent, reservationDate, area, setValue]);

  useEffect(() => {
    if (reservationTime && !timeSlots.includes(reservationTime)) {
      setValue("reservation_time", "");
    }
  }, [timeSlots, reservationTime, setValue]);

  useEffect(() => {
    if (eventId && !eventOptions.some((e) => e.id === eventId) && !selectedEvent) {
      setValue("event_id", "");
    }
  }, [eventOptions, eventId, selectedEvent, setValue]);

  const gridGap = compact ? "gap-2 sm:gap-3" : "gap-3 sm:gap-4";
  const inputPad = compact ? "p-2.5 sm:p-3" : "p-3";

  const onSubmit = async (values: ReservationValues) => {
    setIsSubmitting(true);
    setStatus("");
    try {
      const payload = {
        ...values,
        event_id: values.event_id?.trim() ? values.event_id : undefined,
      };
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      reset({ area: "cbari", reservation_time: "", event_id: "" });
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

  function onEventChange(nextId: string) {
    setValue("event_id", nextId);
    if (!nextId) return;
    const ev = findBookableEvent(bookableEvents, nextId);
    if (!ev) return;
    if (ev.event_date) {
      setValue("reservation_date", ev.event_date);
      setDateInputType("date");
    }
    if (ev.restaurants.length && !ev.restaurants.includes(area)) {
      setValue("area", ev.restaurants[0]);
    }
    setValue("reservation_time", "");
  }

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
          placeholder="Numero de personas"
          {...register("guests", { required: true, valueAsNumber: true })}
        />

        <label className={`flex flex-col gap-1.5 md:col-span-2 ${compact ? "text-xs" : "text-sm"} text-[var(--foreground-muted)]`}>
          <span className="font-medium text-[var(--foreground)]">Evento (opcional)</span>
          <select
            className={inputClass}
            value={eventId ?? ""}
            onChange={(e) => onEventChange(e.target.value)}
          >
            <option value="">Sin evento</option>
            {eventOptions.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {formatEventOptionLabel(ev)}
              </option>
            ))}
          </select>
          {selectedEvent ? (
            <span className="text-xs text-[var(--foreground-muted)]">
              Fecha y horario del evento aplicados. Elige el restaurante donde deseas reservar.
            </span>
          ) : null}
        </label>

        <label className={`flex flex-col gap-1.5 md:col-span-2 ${compact ? "text-xs" : "text-sm"} text-[var(--foreground-muted)]`}>
          <span className="font-medium text-[var(--foreground)]">Restaurante</span>
          <select className={inputClass} {...register("area", { required: true })}>
            {restaurantOptions.map((r) => (
              <option key={r.key} value={r.key}>
                {r.shortLabel}
              </option>
            ))}
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
              disabled={dateLockedByEvent}
              {...dateField}
              onFocus={() => {
                if (!dateLockedByEvent) setDateInputType("date");
              }}
              onBlur={(event) => {
                dateField.onBlur(event);
                if (!event.currentTarget.value && !dateLockedByEvent) setDateInputType("text");
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
        disabled={isSubmitting || timeSlots.length === 0}
        className="btn-primary w-full px-4 py-3 disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Reservar"}
      </button>
      {status && !onSuccess ? <p className="text-sm text-[var(--foreground-muted)]">{status}</p> : null}
      {status && onSuccess ? <p className="text-sm text-red-700">{status}</p> : null}
    </form>
  );
}

export function ReservationForm() {
  return (
    <ReservationBookingForm className="rounded-xl border border-[var(--border)] p-6" />
  );
}
