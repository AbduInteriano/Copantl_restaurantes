"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LOGO_FIELDS = ["logo_url", "logo_url_2", "logo_url_3"] as const;
type LogoField = (typeof LOGO_FIELDS)[number];

type Props = {
  logoUrl: string | null;
  logoUrl2: string | null;
  logoUrl3: string | null;
};

const labels = ["Restaurante 1", "Restaurante 2", "Restaurante 3"];

export function SiteLogosSettings({ logoUrl, logoUrl2, logoUrl3 }: Props) {
  const initial = [logoUrl, logoUrl2, logoUrl3];
  const [urls, setUrls] = useState<(string | null)[]>(initial);
  const [status, setStatus] = useState("");
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const supabase = createClient();
  const router = useRouter();

  async function onUpload(index: number, file: File | null) {
    if (!file) return;
    setLoadingIndex(index);
    setStatus("");
    const field = LOGO_FIELDS[index] as LogoField;

    try {
      const filePath = `logos/${field}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("copantl_assets").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("copantl_assets").getPublicUrl(filePath);

      const { error: updateError } = await supabase.from("site_settings").upsert(
        { id: 1, [field]: data.publicUrl } as never,
        { onConflict: "id" },
      );
      if (updateError) throw updateError;

      setUrls((prev) => {
        const next = [...prev];
        next[index] = data.publicUrl;
        return next;
      });
      setStatus(`${labels[index]}: logo actualizado.`);
      router.refresh();
    } catch {
      setStatus(`No se pudo subir el logo de ${labels[index]}.`);
    } finally {
      setLoadingIndex(null);
    }
  }

  async function onRemove(index: number) {
    setLoadingIndex(index);
    setStatus("");
    const field = LOGO_FIELDS[index] as LogoField;

    try {
      const { error } = await supabase.from("site_settings").upsert(
        { id: 1, [field]: null } as never,
        { onConflict: "id" },
      );
      if (error) throw error;

      setUrls((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      setStatus(`${labels[index]}: logo eliminado.`);
      router.refresh();
    } catch {
      setStatus(`No se pudo eliminar el logo de ${labels[index]}.`);
    } finally {
      setLoadingIndex(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">Logos de restaurantes</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Sube los 3 logos que aparecen en la portada del sitio (hero).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {labels.map((label, index) => (
          <div key={label} className="space-y-2 rounded-lg border border-[var(--admin-border)] p-3">
            <p className="text-sm font-medium text-[var(--admin-foreground)]">{label}</p>
            {urls[index] ? (
              <img src={urls[index]!} alt={label} className="mx-auto h-20 w-full object-contain" />
            ) : (
              <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-[var(--admin-muted)]">
                Sin logo
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={loadingIndex !== null}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                void onUpload(index, file);
                e.target.value = "";
              }}
              className="w-full text-sm"
            />
            {urls[index] ? (
              <button
                type="button"
                disabled={loadingIndex !== null}
                onClick={() => void onRemove(index)}
                className="w-full rounded-md border border-[var(--admin-border)] px-2 py-1.5 text-xs text-[var(--admin-muted)] hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingIndex === index ? "Procesando..." : "Quitar logo"}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {status ? <p className="text-sm text-[var(--admin-muted)]">{status}</p> : null}
    </div>
  );
}
