"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANTS } from "@/lib/restaurants";
import type { RestaurantProfile } from "@/lib/restaurant-profiles";

type Props = {
  profiles: RestaurantProfile[];
};

export function RestaurantReservationHoursAdmin({ profiles }: Props) {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      profiles.map((p) => [
        p.restaurant,
        {
          reservation_start_time: p.reservation_start_time,
          reservation_end_time: p.reservation_end_time,
          table_count: String(p.table_count),
        },
      ]),
    ),
  );
  const supabase = createClient();
  const router = useRouter();

  async function saveProfile(restaurant: RestaurantProfile["restaurant"]) {
    const draft = drafts[restaurant];
    if (!draft.reservation_start_time || !draft.reservation_end_time) {
      setStatus("Indica hora de inicio y fin.");
      return;
    }
    if (draft.reservation_start_time >= draft.reservation_end_time) {
      setStatus("La hora de fin debe ser posterior a la de inicio.");
      return;
    }
    const tableCount = Number(draft.table_count);
    if (!Number.isFinite(tableCount) || tableCount < 1 || tableCount > 99) {
      setStatus("El numero de mesas debe estar entre 1 y 99.");
      return;
    }

    setLoading(true);
    setStatus("");
    const existing = profiles.find((p) => p.restaurant === restaurant);
    const { error } = await supabase
      .from("restaurant_profiles")
      .upsert(
        {
          restaurant,
          reservation_start_time: draft.reservation_start_time,
          reservation_end_time: draft.reservation_end_time,
          display_hours_text: existing?.display_hours_text ?? "",
          table_count: Math.floor(tableCount),
        } as never,
        { onConflict: "restaurant" },
      );
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Horarios y mesas guardados.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--admin-muted)]">
        Define el rango de horas en que los clientes pueden reservar en cada restaurante cuando no eligen un evento,
        y cuantas mesas estan disponibles para asignar en el panel de reservas (intervalos de 30 minutos).
      </p>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        {profiles.map((profile) => {
          const meta = RESTAURANTS.find((r) => r.key === profile.restaurant)!;
          const draft = drafts[profile.restaurant];
          return (
            <div
              key={profile.restaurant}
              className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">{meta.shortLabel}</h2>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                Mesas configuradas actualmente: {profile.table_count}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm text-[var(--admin-muted)]">
                  Hora inicio reservas
                  <input
                    type="time"
                    value={draft.reservation_start_time}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [profile.restaurant]: { ...prev[profile.restaurant], reservation_start_time: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-md border bg-transparent p-3"
                    required
                  />
                </label>
                <label className="block text-sm text-[var(--admin-muted)]">
                  Hora fin reservas
                  <input
                    type="time"
                    value={draft.reservation_end_time}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [profile.restaurant]: { ...prev[profile.restaurant], reservation_end_time: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-md border bg-transparent p-3"
                    required
                  />
                </label>
                <label className="block text-sm text-[var(--admin-muted)] sm:col-span-2 lg:col-span-1">
                  Mesas disponibles para reservar
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={draft.table_count}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [profile.restaurant]: { ...prev[profile.restaurant], table_count: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-md border bg-transparent p-3"
                    required
                  />
                </label>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => void saveProfile(profile.restaurant)}
                className="mt-4 rounded-md bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
              >
                Guardar {meta.shortLabel}
              </button>
            </div>
          );
        })}
      </div>

      {status ? <p className="text-sm text-[var(--admin-muted)]">{status}</p> : null}
    </div>
  );
}
