"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANTS, type RestaurantKey } from "@/lib/restaurants";
import { uploadAdminImage } from "@/lib/upload-admin-image";
import type { Database } from "@/lib/supabase/types";

type EventBanner = Database["public"]["Tables"]["event_banners"]["Row"];

export type EventBannerAdmin = EventBanner & {
  restaurants: RestaurantKey[];
};

type Props = {
  items: EventBannerAdmin[];
};

export function EventsAdminManager({ items }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("22:00");
  const [title, setTitle] = useState("");
  const [selectedRestaurants, setSelectedRestaurants] = useState<RestaurantKey[]>(["cbari"]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  function toggleRestaurant(key: RestaurantKey) {
    setSelectedRestaurants((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key],
    );
  }

  async function syncRestaurants(eventId: string, restaurants: RestaurantKey[]) {
    await supabase.from("event_banner_restaurants").delete().eq("event_id", eventId);
    if (restaurants.length === 0) return;
    const { error } = await supabase.from("event_banner_restaurants").insert(
      restaurants.map((restaurant) => ({ event_id: eventId, restaurant })) as never,
    );
    if (error) throw error;
  }

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (items.length >= 5) {
      setStatus("Limite alcanzado: maximo 5 eventos.");
      return;
    }
    if (!file) return;
    if (!eventDate) {
      setStatus("Indica la fecha del evento.");
      return;
    }
    if (selectedRestaurants.length === 0) {
      setStatus("Selecciona al menos un restaurante para el evento.");
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      setStatus("Indica un horario de reservas valido (inicio antes que fin).");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const { publicUrl } = await uploadAdminImage({ file, folder: "events" });

      const { data: inserted, error: insertError } = await supabase
        .from("event_banners")
        .insert({
          title: title.trim() || null,
          image_url: publicUrl,
          event_date: eventDate,
          reservation_start_time: startTime,
          reservation_end_time: endTime,
          sort_order: items.length + 1,
        } as never)
        .select("id")
        .single();
      if (insertError || !inserted) throw insertError ?? new Error("No se creo el evento.");

      const eventId = (inserted as { id: string }).id;
      await syncRestaurants(eventId, selectedRestaurants);

      setFile(null);
      setEventDate("");
      setStartTime("18:00");
      setEndTime("22:00");
      setTitle("");
      setSelectedRestaurants(["cbari"]);
      setStatus("Evento agregado.");
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudo subir el evento.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("event_banners").delete().eq("id", id);
    router.refresh();
  }

  async function updateEventTimes(id: string, start: string, end: string) {
    if (!start || !end || start >= end) {
      setStatus("Horario de reservas invalido.");
      return;
    }
    const { error } = await supabase
      .from("event_banners")
      .update({ reservation_start_time: start, reservation_end_time: end } as never)
      .eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.refresh();
  }

  async function updateEventDate(id: string, date: string) {
    if (!date) return;
    const { error } = await supabase.from("event_banners").update({ event_date: date } as never).eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.refresh();
  }

  async function updateTitle(id: string, newTitle: string) {
    const { error } = await supabase
      .from("event_banners")
      .update({ title: newTitle.trim() || null } as never)
      .eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.refresh();
  }

  async function updateItemRestaurants(id: string, restaurants: RestaurantKey[]) {
    if (restaurants.length === 0) {
      setStatus("El evento debe tener al menos un restaurante.");
      return;
    }
    try {
      await syncRestaurants(id, restaurants);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se actualizaron los restaurantes.");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onUpload} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <p className="text-sm text-[var(--foreground-muted)]">{items.length}/5 eventos</p>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titulo del evento (opcional)"
          className="w-full rounded-md border bg-transparent p-3"
        />
        <label className="block text-sm text-[var(--foreground-muted)]">
          Fecha del evento
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border bg-transparent p-3"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-[var(--foreground-muted)]">
            Hora inicio reservas
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="mt-1 w-full rounded-md border bg-transparent p-3"
            />
          </label>
          <label className="block text-sm text-[var(--foreground-muted)]">
            Hora fin reservas
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="mt-1 w-full rounded-md border bg-transparent p-3"
            />
          </label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[var(--foreground-muted)]">Restaurantes del evento</legend>
          <div className="flex flex-wrap gap-3">
            {RESTAURANTS.map((r) => (
              <label key={r.key} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedRestaurants.includes(r.key)}
                  onChange={() => toggleRestaurant(r.key)}
                />
                {r.shortLabel}
              </label>
            ))}
          </div>
        </fieldset>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border bg-transparent p-3" required />
        <button
          disabled={loading || items.length >= 5}
          className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Subiendo..." : "Subir evento"}
        </button>
        {status && <p className="text-sm text-[var(--foreground-muted)]">{status}</p>}
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <EventAdminCard
            key={item.id}
            item={item}
            onDelete={() => void deleteItem(item.id)}
            onDateChange={(date) => void updateEventDate(item.id, date)}
            onTimesChange={(start, end) => void updateEventTimes(item.id, start, end)}
            onTitleBlur={(t) => {
              if ((item.title ?? "") !== t.trim()) void updateTitle(item.id, t);
            }}
            onRestaurantsChange={(restaurants) => void updateItemRestaurants(item.id, restaurants)}
          />
        ))}
      </div>
    </div>
  );
}

function EventAdminCard({
  item,
  onDelete,
  onDateChange,
  onTimesChange,
  onTitleBlur,
  onRestaurantsChange,
}: {
  item: EventBannerAdmin;
  onDelete: () => void;
  onDateChange: (date: string) => void;
  onTimesChange: (start: string, end: string) => void;
  onTitleBlur: (title: string) => void;
  onRestaurantsChange: (restaurants: RestaurantKey[]) => void;
}) {
  const [startTime, setStartTime] = useState(item.reservation_start_time?.slice(0, 5) ?? "18:00");
  const [endTime, setEndTime] = useState(item.reservation_end_time?.slice(0, 5) ?? "22:00");
  const [localRestaurants, setLocalRestaurants] = useState<RestaurantKey[]>(item.restaurants);

  function toggle(key: RestaurantKey) {
    const next = localRestaurants.includes(key)
      ? localRestaurants.filter((r) => r !== key)
      : [...localRestaurants, key];
    setLocalRestaurants(next);
    onRestaurantsChange(next);
  }

  return (
    <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm">
      <div className="aspect-[4/3] overflow-hidden rounded-md">
        <img src={item.image_url} alt={item.title ?? "Evento"} className="h-full w-full object-cover" />
      </div>
      <div className="mt-3 space-y-2">
        <input
          type="text"
          defaultValue={item.title ?? ""}
          placeholder="Titulo"
          className="w-full rounded-md border bg-transparent p-2 text-sm"
          onBlur={(e) => onTitleBlur(e.target.value)}
        />
        <label className="block text-xs text-[var(--foreground-muted)]">
          Fecha
          <input
            type="date"
            defaultValue={item.event_date ?? ""}
            className="mt-1 w-full rounded-md border bg-transparent p-2 text-sm"
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-[var(--foreground-muted)]">
            Inicio reservas
            <input
              type="time"
              value={startTime}
              className="mt-1 w-full rounded-md border bg-transparent p-2 text-sm"
              onChange={(e) => {
                setStartTime(e.target.value);
                onTimesChange(e.target.value, endTime);
              }}
            />
          </label>
          <label className="block text-xs text-[var(--foreground-muted)]">
            Fin reservas
            <input
              type="time"
              value={endTime}
              className="mt-1 w-full rounded-md border bg-transparent p-2 text-sm"
              onChange={(e) => {
                setEndTime(e.target.value);
                onTimesChange(startTime, e.target.value);
              }}
            />
          </label>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--foreground-muted)]">Restaurantes</p>
          <div className="flex flex-wrap gap-2">
            {RESTAURANTS.map((r) => (
              <label key={r.key} className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={localRestaurants.includes(r.key)} onChange={() => toggle(r.key)} />
                {r.shortLabel}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md border border-[var(--admin-border)] bg-white p-2 text-amber-800 hover:bg-amber-50"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
