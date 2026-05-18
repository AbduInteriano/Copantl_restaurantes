"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RESTAURANTS, type RestaurantKey } from "@/lib/restaurants";
import { uploadAdminImage } from "@/lib/upload-admin-image";

export type RestaurantMenuRow = {
  id: string;
  restaurant: RestaurantKey;
  image_url: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  items: RestaurantMenuRow[];
};

export function RestaurantMenusAdminManager({ items }: Props) {
  const [activeRestaurant, setActiveRestaurant] = useState<RestaurantKey>("la_churrasqueria");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const restaurantItems = useMemo(
    () =>
      items
        .filter((item) => item.restaurant === activeRestaurant)
        .sort((a, b) => a.sort_order - b.sort_order),
    [items, activeRestaurant],
  );

  const activeMeta = RESTAURANTS.find((r) => r.key === activeRestaurant)!;

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setStatus("Selecciona una o mas imagenes del menu.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      let nextOrder =
        restaurantItems.length > 0 ? Math.max(...restaurantItems.map((i) => i.sort_order)) + 1 : 1;

      for (const file of files) {
        const { publicUrl } = await uploadAdminImage({
          file,
          folder: `menus/${activeRestaurant}`,
        });

        const { error: insertError } = await supabase.from("restaurant_menu_images").insert({
          restaurant: activeRestaurant,
          image_url: publicUrl,
          sort_order: nextOrder,
          is_active: true,
        } as never);
        if (insertError) throw insertError;
        nextOrder += 1;
      }

      setFiles([]);
      setStatus(`${files.length} imagen(es) agregada(s) a ${activeMeta.menuTitle}.`);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "No se pudieron subir las imagenes.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase.from("restaurant_menu_images").delete().eq("id", id);
    if (error) {
      setStatus(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {RESTAURANTS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => {
              setActiveRestaurant(r.key);
              setFiles([]);
              setStatus("");
            }}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              activeRestaurant === r.key
                ? "border-[var(--admin-accent)] bg-blue-50 text-[var(--admin-accent)]"
                : "border-[var(--admin-border)] bg-white text-[var(--admin-muted)] hover:bg-slate-50"
            }`}
          >
            {r.menuTitle}
          </button>
        ))}
      </div>

      <form onSubmit={onUpload} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">{activeMeta.menuTitle}</h2>
        <p className="text-sm text-[var(--admin-muted)]">
          Sube una o varias imagenes (PNG, JPG). Se mostraran en orden en el sitio publico.
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="w-full text-sm"
        />
        <button
          type="submit"
          disabled={loading || files.length === 0}
          className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Subiendo..." : "Subir imagenes del menu"}
        </button>
        {status ? <p className="text-sm text-[var(--admin-muted)]">{status}</p> : null}
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurantItems.map((item, index) => (
          <div key={item.id} className="relative rounded-xl border border-[var(--admin-border)] bg-white p-2">
            <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              #{index + 1}
            </span>
            <img src={item.image_url} alt={`Menu ${index + 1}`} className="aspect-[3/4] w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => void deleteItem(item.id)}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50 py-2 text-sm text-red-800 hover:bg-red-100"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {restaurantItems.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">Aun no hay imagenes para este restaurante.</p>
      ) : null}
    </div>
  );
}
