"use client";

import emailjs from "@emailjs/browser";
import { useState } from "react";
import { useForm } from "react-hook-form";

type ReservationValues = {
  full_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  notes?: string;
};

export function ReservationForm() {
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<ReservationValues>();

  const onSubmit = async (values: ReservationValues) => {
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("No se pudo crear la reserva");

      if (
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID &&
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID &&
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      ) {
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
          values,
          { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY },
        );
      }

      setStatus("Reserva enviada correctamente. Te confirmaremos pronto.");
      reset();
    } catch {
      setStatus("Ocurrio un error al enviar tu reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-md border bg-transparent p-3" placeholder="Nombre completo" {...register("full_name", { required: true })} />
        <input className="rounded-md border bg-transparent p-3" type="email" placeholder="Correo electronico" {...register("email", { required: true })} />
        <input className="rounded-md border bg-transparent p-3" placeholder="Telefono" {...register("phone", { required: true })} />
        <input className="rounded-md border bg-transparent p-3" type="number" min={1} max={20} placeholder="Numero de personas" {...register("guests", { required: true, valueAsNumber: true })} />
        <input className="rounded-md border bg-transparent p-3" type="date" {...register("reservation_date", { required: true })} />
        <input className="rounded-md border bg-transparent p-3" type="time" {...register("reservation_time", { required: true })} />
      </div>
      <textarea className="min-h-28 w-full rounded-md border bg-transparent p-3" placeholder="Notas especiales" {...register("notes")} />
      <button disabled={isSubmitting} className="w-full rounded-md bg-[var(--accent-gold)] px-4 py-3 text-black transition hover:opacity-90 disabled:opacity-60">
        {isSubmitting ? "Enviando..." : "Reservar ahora"}
      </button>
      {status && <p className="text-sm text-[var(--foreground-muted)]">{status}</p>}
    </form>
  );
}
