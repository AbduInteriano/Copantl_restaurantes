"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/lib/supabase/types";

type Reservation = Database["public"]["Tables"]["reservations"]["Row"];

type Props = {
  reservations: Reservation[];
};

export function AdminReservationsManager({ reservations }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  async function changeStatus(id: string, status: "confirmada" | "cancelada") {
    setLoadingId(id);
    await fetch(`/api/reservations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {reservations.map((r) => (
        <div key={r.id} className="rounded-xl border bg-[var(--admin-card)] p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <p><strong>Cliente:</strong> {r.full_name}</p>
            <p><strong>Correo:</strong> {r.email}</p>
            <p><strong>Telefono:</strong> {r.phone}</p>
            <p><strong>Personas:</strong> {r.guests}</p>
            <p><strong>Fecha:</strong> {r.reservation_date}</p>
            <p><strong>Hora:</strong> {r.reservation_time}</p>
            <p><strong>Estado:</strong> {r.status}</p>
          </div>
          {r.notes && <p className="mt-2 text-sm text-[var(--foreground-muted)]">{r.notes}</p>}
          <div className="mt-4 flex gap-2">
            <button
              disabled={loadingId === r.id}
              onClick={() => changeStatus(r.id, "confirmada")}
              className="rounded-md bg-[var(--admin-success)] px-3 py-2 text-sm font-medium"
            >
              Aceptar
            </button>
            <button
              disabled={loadingId === r.id}
              onClick={() => changeStatus(r.id, "cancelada")}
              className="rounded-md bg-[var(--admin-danger)] px-3 py-2 text-sm font-medium"
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
