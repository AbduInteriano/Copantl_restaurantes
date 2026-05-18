"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadAdminImage } from "@/lib/upload-admin-image";
import type { Database } from "@/lib/supabase/types";

const GALLERY_MAX = 10;

type GalleryItem = Database["public"]["Tables"]["gallery_items"]["Row"];

type Props = {
  items: GalleryItem[];
};

export function GalleryAdminManager({ items }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const remaining = GALLERY_MAX - items.length;

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setStatus("Selecciona una o mas fotografias.");
      return;
    }
    if (remaining <= 0) {
      setStatus(`Limite alcanzado: maximo ${GALLERY_MAX} fotografias en el carrusel.`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    setLoading(true);
    setStatus("");

    try {
      let nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 1;

      for (const file of toUpload) {
        const { publicUrl } = await uploadAdminImage({ file, folder: "gallery" });
        const { error: insertError } = await supabase.from("gallery_items").insert({
          title: null,
          image_url: publicUrl,
          sort_order: nextOrder,
        } as never);
        if (insertError) throw insertError;
        nextOrder += 1;
      }

      setFiles([]);
      setStatus(`${toUpload.length} fotografia(s) agregada(s) al carrusel.`);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudieron subir las imagenes.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    await supabase.from("gallery_items").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onUpload} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <p className="text-sm text-[var(--admin-muted)]">
          Carrusel del sitio publico (sin titulo). Maximo {GALLERY_MAX} fotos · {items.length}/{GALLERY_MAX} en uso.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full rounded-md border bg-transparent p-3"
        />
        <button
          disabled={loading || remaining <= 0 || files.length === 0}
          className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {loading ? "Subiendo..." : "Subir al carrusel"}
        </button>
        {status && <p className="text-sm text-[var(--admin-muted)]">{status}</p>}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-card)] p-3 shadow-sm">
            <span className="text-xs font-medium text-[var(--admin-muted)]">#{index + 1}</span>
            <div className="mt-1 aspect-[4/3] overflow-hidden rounded-md">
              <img src={item.image_url} alt={item.title ?? "Foto"} className="h-full w-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => void deleteItem(item.id)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
