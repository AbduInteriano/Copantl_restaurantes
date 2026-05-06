"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type EventBanner = Database["public"]["Tables"]["event_banners"]["Row"];

type Props = {
  items: EventBanner[];
};

export function EventsAdminManager({ items }: Props) {
  const [file, setFile] = useState<File | null>(null);
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

    setLoading(true);
    setStatus("");
    try {
      const filePath = `events/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cava-assets").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("cava-assets").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("event_banners").insert({
        title: null,
        image_url: data.publicUrl,
        sort_order: items.length + 1,
      } as never);
      if (insertError) throw insertError;

      setFile(null);
      setStatus("Banner agregado.");
      router.refresh();
    } catch {
      setStatus("No se pudo subir el banner.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("event_banners").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onUpload} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <p className="text-sm text-[var(--foreground-muted)]">{items.length}/5 banners</p>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border bg-transparent p-3" required />
        <button
          disabled={loading || items.length >= 5}
          className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Subiendo..." : "Subir banner"}
        </button>
        {status && <p className="text-sm text-[var(--foreground-muted)]">{status}</p>}
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 shadow-sm">
            <div className="aspect-[4/3] overflow-hidden rounded-md">
              <img src={item.image_url} alt={item.title ?? "Banner de evento"} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm">{item.title ?? "Banner de evento"}</p>
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
