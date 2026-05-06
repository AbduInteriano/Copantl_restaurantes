"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

type ReservationValues = {
  full_name: string;
  email: string;
  phone: string;
  guests: number;
  reservation_date: string;
  reservation_time: string;
  notes?: string;
};

type Props = {
  triggerLabel?: string;
  triggerClassName?: string;
};

export function ReservationModal({
  triggerLabel = "Reserva Ahora",
  triggerClassName = "rounded-md border border-[var(--accent-gold)] px-6 py-3 text-[var(--accent-gold)] transition hover:bg-[var(--accent-gold)] hover:text-black",
}: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<ReservationValues>();

  const termsText =
    "Tu reserva esta sujeta a confirmacion por disponibilidad. El horario puede ajustarse segun aforo y eventos privados. Se recomienda llegar 10 minutos antes.";

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

      setStatus("Reserva enviada. Pronto nos pondremos en contacto.");
      reset();
    } catch {
      setStatus("Ocurrio un error al enviar la reserva.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-auto rounded-xl border bg-[var(--surface)] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title text-2xl sm:text-3xl">Reserva Ahora</h3>
              <button onClick={() => setOpen(false)} className="rounded-md border p-2">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <input className="rounded-md border bg-transparent p-3" placeholder="Nombre completo" {...register("full_name", { required: true })} />
                <input className="rounded-md border bg-transparent p-3" type="email" placeholder="Correo electronico" {...register("email", { required: true })} />
                <input className="rounded-md border bg-transparent p-3" placeholder="Telefono" {...register("phone", { required: true })} />
                <input className="rounded-md border bg-transparent p-3" type="number" min={1} max={20} placeholder="Numero de personas" {...register("guests", { required: true, valueAsNumber: true })} />
                <input className="rounded-md border bg-transparent p-3" type="date" {...register("reservation_date", { required: true })} />
                <input className="rounded-md border bg-transparent p-3" type="time" {...register("reservation_time", { required: true })} />
              </div>

              <textarea className="min-h-24 w-full rounded-md border bg-transparent p-3" placeholder="Notas especiales" {...register("notes")} />

              <p className="text-xs text-[var(--foreground-muted)]">{termsText}</p>

              <button disabled={isSubmitting} className="w-full rounded-md bg-[var(--accent-gold)] px-4 py-3 text-black disabled:opacity-60">
                {isSubmitting ? "Enviando..." : "Reservar ahora"}
              </button>
              {status && <p className="text-sm text-[var(--foreground-muted)]">{status}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
