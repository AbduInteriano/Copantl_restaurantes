"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type Category = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  menu_items: Database["public"]["Tables"]["menu_items"]["Row"][];
};

type Props = {
  categories: Category[];
};

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
        brand,
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

  return (
    <div className="space-y-3 rounded-lg border border-[var(--admin-border)] bg-slate-50/40 p-4">
      <p className="text-xl font-semibold text-[var(--admin-foreground)]">{category.name}</p>
      <form onSubmit={addProduct} className="grid gap-2 md:grid-cols-6">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Producto" required />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Marca" required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Descripcion" />
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="rounded-md border bg-transparent p-2" placeholder="Precio" required />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border bg-transparent p-2" />
        <button
          disabled={saving}
          className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar"}
        </button>
      </form>
      {message && <p className="text-xs text-[var(--foreground-muted)]">{message}</p>}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-md border bg-transparent p-2 text-sm"
        placeholder="Buscar producto por nombre o marca..."
      />

      <div className="max-h-[55vh] space-y-2 overflow-auto pr-1">
        {category.menu_items
          .filter((item) =>
            `${item.name} ${item.brand ?? ""}`.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => (
          <EditableProductRow key={item.id} item={item} />
          ))}
      </div>
    </div>
  );
}

function EditableProductRow({
  item,
}: {
  item: Database["public"]["Tables"]["menu_items"]["Row"];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [brand, setBrand] = useState(item.brand ?? "");
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState<number>(Number(item.price));
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          brand,
          description,
          price,
          image_url: imageUrl,
        } as never)
        .eq("id", item.id);
      if (error) {
        setErrorMessage("No se pudo actualizar el producto.");
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function getStoragePathFromPublicUrl(url: string | null): string | null {
    if (!url) return null;
    const marker = "/storage/v1/object/public/cava-assets/";
    const index = url.indexOf(marker);
    if (index === -1) return null;
    const path = url.slice(index + marker.length);
    return path ? decodeURIComponent(path) : null;
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
        // Intento de limpieza de archivo. Si falla, no se revierte la eliminacion del producto.
        await supabase.storage.from("cava-assets").remove([storagePath]);
      }

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-[var(--admin-border)] bg-white p-3 shadow-sm">
      <div className="grid gap-2 md:grid-cols-5">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="rounded-md border bg-transparent p-2" />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border bg-transparent p-2" />
      </div>
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-xs text-[var(--foreground-muted)]">Moneda: L. {Number(price).toFixed(2)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={saveChanges}
            disabled={saving || deleting}
            className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Aplicar cambios"}
          </button>
          <button
            onClick={deleteProduct}
            disabled={saving || deleting}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar producto"}
          </button>
        </div>
      </div>
      {errorMessage ? <p className="text-xs text-red-600">{errorMessage}</p> : null}
    </div>
  );
}
