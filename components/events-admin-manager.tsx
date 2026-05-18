"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadAdminImage } from "@/lib/upload-admin-image";
import type { Database } from "@/lib/supabase/types";

type EventBanner = Database["public"]["Tables"]["event_banners"]["Row"];

type Props = {
  items: EventBanner[];
};

export function EventsAdminManager({ items }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (items.length >= 5) {
      setStatus("Limite alcanzado: maximo 5 banners de eventos.");
      return;
    }
    if (!file) return;
    if (!eventDate) {
      setStatus("Indica la fecha del evento para mostrarlo en el calendario.");
      return;
    }

    setLoading(true);
    setStatus("");
    try {
      const { publicUrl } = await uploadAdminImage({ file, folder: "events" });

      const { error: insertError } = await supabase.from("event_banners").insert({
        title: title.trim() || null,
        image_url: publicUrl,
        event_date: eventDate,
        sort_order: items.length + 1,
      } as never);
      if (insertError) throw insertError;

      setFile(null);
      setEventDate("");
      setTitle("");
      setStatus("Evento agregado al calendario.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "No se pudo subir el banner.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("event_banners").delete().eq("id", id);
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
          <div key={item.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm">
            <div className="aspect-[4/3] overflow-hidden rounded-md">
              <img src={item.image_url} alt={item.title ?? "Banner de evento"} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 space-y-2">
              <input
                type="text"
                defaultValue={item.title ?? ""}
                placeholder="Titulo"
                className="w-full rounded-md border bg-transparent p-2 text-sm"
                onBlur={(e) => {
                  if ((item.title ?? "") !== e.target.value.trim()) {
                    void updateTitle(item.id, e.target.value);
                  }
                }}
              />
              <label className="block text-xs text-[var(--foreground-muted)]">
                Fecha en calendario
                <input
                  type="date"
                  defaultValue={item.event_date ?? ""}
                  className="mt-1 w-full rounded-md border bg-transparent p-2 text-sm"
                  onChange={(e) => void updateEventDate(item.id, e.target.value)}
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => deleteItem(item.id)}
                className="rounded-md border border-[var(--admin-border)] bg-white p-2 text-amber-800 hover:bg-amber-50"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
