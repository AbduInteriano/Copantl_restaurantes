"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function GalleryUploadForm() {
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatus("Selecciona una imagen.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const supabase = createClient();
      const filePath = `gallery/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cava-assets").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("cava-assets").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("gallery_items").insert({
        title,
        image_url: data.publicUrl,
        sort_order: sortOrder,
      } as never);
      if (insertError) throw insertError;

      setStatus("Imagen subida correctamente.");
      setTitle("");
      setSortOrder(0);
      setFile(null);
      router.refresh();
    } catch {
      setStatus("No se pudo subir la imagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-[var(--admin-card)] p-5">
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-transparent p-3" placeholder="Titulo de imagen" required />
      <input value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} type="number" className="w-full rounded-md border bg-transparent p-3" placeholder="Orden" />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full rounded-md border bg-transparent p-3" required />
      <button disabled={loading} className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-black">
        {loading ? "Subiendo..." : "Subir a Supabase Storage"}
      </button>
      {status && <p className="text-sm text-[var(--foreground-muted)]">{status}</p>}
    </form>
  );
}
