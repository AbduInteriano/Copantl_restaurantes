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
        } as never,
        { onConflict: "restaurant" },
      );
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Horarios guardados.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--admin-muted)]">
        Define el rango de horas en que los clientes pueden reservar en cada restaurante cuando no eligen un evento.
        Intervalos de 30 minutos.
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
