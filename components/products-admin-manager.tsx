"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  menu_items: Database["public"]["Tables"]["menu_items"]["Row"][];
};

type Props = {
  categories: Category[];
};

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

const PRODUCTS_LIST_INITIAL_LIMIT = 20;

export function ProductsAdminManager({ categories }: Props) {
  const beverageFamilies = ["Vino", "Ron", "Whisky", "Ginebra", "Tequila", "Cocteles"];
  const [selectedFamily, setSelectedFamily] = useState<string>("Vino");
  const selectedCategory = categories.find(
    (cat) => cat.name === selectedFamily || (selectedFamily === "Ginebra" && cat.name === "Gineba"),
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <h2 className="section-title text-3xl text-[var(--admin-foreground)]">Bebidas</h2>
        <div className="flex flex-wrap gap-2">
          {beverageFamilies.map((family) => (
            <button
              key={family}
              type="button"
              onClick={() => setSelectedFamily(family)}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${
                selectedFamily === family
                  ? "border-[var(--admin-accent)] bg-blue-50 text-[var(--admin-accent)]"
                  : "border-[var(--admin-border)] bg-white text-[var(--admin-foreground)] hover:bg-slate-50"
              }`}
            >
              {family}
            </button>
          ))}
        </div>
        {selectedCategory ? <CategoryCard category={selectedCategory} /> : null}
      </section>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const isCocteles = category.name === "Cocteles";

  useEffect(() => {
    setShowAllProducts(false);
  }, [category.id, search]);

  async function deleteProductRow(item: MenuItem) {
    const confirmed = window.confirm(`¿Eliminar "${item.name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;
    const storagePath = (() => {
      const url = item.image_url;
      if (!url) return null;
      const marker = "/storage/v1/object/public/cava-assets/";
      const index = url.indexOf(marker);
      if (index === -1) return null;
      const path = url.slice(index + marker.length);
      return path ? decodeURIComponent(path) : null;
    })();
    const { error } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (error) {
      setMessage("No se pudo eliminar el producto.");
      return;
    }
    if (storagePath) {
      await supabase.storage.from("cava-assets").remove([storagePath]);
    }
    router.refresh();
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    try {
      let imageUrl: string | null = null;
      if (file) {
        const filePath = `products/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("cava-assets").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("cava-assets").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { error: insertError } = await supabase.from("menu_items").insert({
        category_id: category.id,
        name,
        brand: isCocteles ? null : brand.trim() || null,
        description,
        price,
        image_url: imageUrl,
      } as never);
      if (insertError) throw insertError;

      setName("");
      setBrand("");
      setDescription("");
      setPrice(0);
      setFile(null);
      setMessage("Producto agregado.");
      router.refresh();
    } catch {
      setMessage("No se pudo agregar el producto.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = category.menu_items.filter((item) =>
    `${item.name} ${item.brand ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  const searchActive = search.trim().length > 0;
  const visibleItems =
    searchActive || showAllProducts ? filtered : filtered.slice(0, PRODUCTS_LIST_INITIAL_LIMIT);
  const hiddenCount = filtered.length - PRODUCTS_LIST_INITIAL_LIMIT;
  const showVerMas = !searchActive && !showAllProducts && hiddenCount > 0;

  return (
    <div className="space-y-3 rounded-lg border border-[var(--admin-border)] bg-slate-50/40 p-4">
      <p className="text-xl font-semibold text-[var(--admin-foreground)]">{category.name}</p>
      <form onSubmit={addProduct} className={`grid gap-2 ${isCocteles ? "md:grid-cols-4" : "md:grid-cols-6"}`}>
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-white p-2" placeholder="Producto" required />
        {!isCocteles ? (
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-white p-2" placeholder="Marca" required />
        ) : null}
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-white p-2" placeholder="Descripcion" />
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="rounded-md border bg-white p-2" placeholder="Precio" required />
        {!isCocteles ? (
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border bg-white p-2" />
        ) : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </form>
      {message ? <p className="text-xs text-[var(--foreground-muted)]">{message}</p> : null}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border bg-white p-2 text-sm"
        placeholder="Buscar por nombre o marca..."
      />

      <div className="max-h-[min(65vh,720px)] overflow-auto rounded-lg border border-[var(--admin-border)] bg-white">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-xs sm:text-sm">
          <thead className="sticky top-0 z-[1] border-b border-[var(--admin-border)] bg-slate-100 text-[var(--admin-muted)]">
            <tr>
              <th className="w-12 px-2 py-2 font-semibold sm:px-3">Img</th>
              <th className="w-[22%] px-2 py-2 font-semibold sm:px-3">Producto</th>
              <th className="w-[16%] px-2 py-2 font-semibold sm:px-3">Marca</th>
              <th className="w-[30%] px-2 py-2 font-semibold sm:px-3">Descripcion</th>
              <th className="w-24 px-2 py-2 font-semibold sm:px-3">Precio</th>
              <th className="w-32 px-2 py-2 text-right font-semibold sm:px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-[var(--foreground-muted)]">
                  Sin productos en esta categoria.
                </td>
              </tr>
            ) : (
              visibleItems.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-2 py-1.5 align-middle sm:px-3">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-9 w-9 rounded object-cover" />
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded border border-dashed border-slate-200 text-[10px] text-slate-400">
                        —
                      </span>
                    )}
                  </td>
                  <td className="truncate px-2 py-1.5 font-medium text-[var(--admin-foreground)] sm:px-3" title={item.name}>
                    {item.name}
                  </td>
                  <td className="truncate px-2 py-1.5 text-[var(--admin-muted)] sm:px-3" title={item.brand ?? ""}>
                    {item.brand ?? "—"}
                  </td>
                  <td className="truncate px-2 py-1.5 text-[var(--admin-muted)] sm:px-3" title={item.description ?? ""}>
                    {item.description?.trim() ? item.description : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 tabular-nums sm:px-3">L. {Number(item.price).toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right sm:px-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditItem(item)}
                        className="inline-flex items-center gap-0.5 rounded border border-[var(--admin-border)] bg-white px-2 py-1 text-[11px] font-medium hover:bg-slate-100 sm:text-xs"
                      >
                        <Pencil size={12} className="shrink-0" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProductRow(item)}
                        className="inline-flex items-center gap-0.5 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800 hover:bg-red-100 sm:text-xs"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showVerMas ? (
        <button
          type="button"
          onClick={() => setShowAllProducts(true)}
          className="w-full rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--admin-accent)] hover:bg-blue-50"
        >
          Ver más ({hiddenCount} {hiddenCount === 1 ? "producto" : "productos"})
        </button>
      ) : null}

      {editItem ? (
        <ProductEditModal
          item={editItem}
          isCocteles={isCocteles}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function ProductEditModal({
  item,
  isCocteles,
  onClose,
  onSaved,
}: {
  item: MenuItem;
  isCocteles: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState<number>(Number(item.price));
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function getStoragePathFromPublicUrl(url: string | null): string | null {
    if (!url) return null;
    const marker = "/storage/v1/object/public/cava-assets/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    const path = url.slice(index + marker.length);
    return path ? decodeURIComponent(path) : null;
  }

  async function saveChanges() {
    setSaving(true);
    setErrorMessage("");
    try {
      let imageUrl = item.image_url;
      if (file) {
        const filePath = `products/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from("cava-assets").upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("cava-assets").getPublicUrl(filePath);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from("menu_items")
        .update({
          name,
          brand: isCocteles ? null : brand.trim() || null,
          description,
          price,
          image_url: imageUrl,
        } as never)
        .eq("id", item.id);
      if (error) {
        setErrorMessage("No se pudo actualizar el producto.");
      } else {
        onSaved();
      }
    } catch {
      setErrorMessage("No se pudo actualizar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    const confirmed = window.confirm(`¿Eliminar "${name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");
    try {
      const storagePath = getStoragePathFromPublicUrl(item.image_url);
      const { error: deleteError } = await supabase.from("menu_items").delete().eq("id", item.id);
      if (deleteError) {
        setErrorMessage("No se pudo eliminar el producto.");
        return;
      }
      if (storagePath) {
        await supabase.storage.from("cava-assets").remove([storagePath]);
      }
      onSaved();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-edit-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="product-edit-title" className="text-lg font-semibold text-[var(--admin-foreground)]">
            Editar producto
          </h3>
          <button type="button" onClick={onClose} className="rounded-md border border-[var(--admin-border)] bg-white px-2 py-1 text-sm hover:bg-slate-50">
            Cerrar
          </button>
        </div>
        <div className="grid gap-3">
          <label className="text-xs text-[var(--admin-muted)]">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
          </label>
          {!isCocteles ? (
            <label className="text-xs text-[var(--admin-muted)]">
              Marca
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
            </label>
          ) : null}
          <label className="text-xs text-[var(--admin-muted)]">
            Descripcion
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-20 w-full rounded-md border bg-white p-2 text-sm" />
          </label>
          <label className="text-xs text-[var(--admin-muted)]">
            Precio (L.)
            <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
          </label>
          {!isCocteles ? (
            <label className="text-xs text-[var(--admin-muted)]">
              Nueva imagen (opcional)
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
            </label>
          ) : null}
        </div>
        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || deleting}
            onClick={saveChanges}
            className="rounded-md bg-[var(--admin-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            disabled={saving || deleting}
            onClick={deleteProduct}
            className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
