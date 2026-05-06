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
  const beverageFamilies = ["Vino", "Ron", "Whisky", "Ginebra", "Tequila"];
  const [selectedFamily, setSelectedFamily] = useState<string>("Vino");
  const selectedCategory = categories.find(
    (cat) => cat.name === selectedFamily || (selectedFamily === "Ginebra" && cat.name === "Gineba"),
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border bg-[var(--admin-card)] p-5">
        <h2 className="section-title text-3xl">Bebidas</h2>
        <div className="flex flex-wrap gap-2">
          {beverageFamilies.map((family) => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`rounded-md border px-3 py-2 text-sm ${
                selectedFamily === family
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/20"
                  : "border-[var(--border)]"
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
    if (!file) {
      setMessage("Debes seleccionar una foto.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const filePath = `products/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cava-assets").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("cava-assets").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("menu_items").insert({
        category_id: category.id,
        name,
        brand,
        description,
        price,
        image_url: data.publicUrl,
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
    <div className="space-y-3 rounded-lg border p-4">
      <p className="text-xl text-[var(--admin-accent)]">{category.name}</p>
      <form onSubmit={addProduct} className="grid gap-2 md:grid-cols-6">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Producto" required />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Marca" required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-transparent p-2" placeholder="Descripcion" />
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="rounded-md border bg-transparent p-2" placeholder="Precio" required />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border bg-transparent p-2" required />
        <button disabled={saving} className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black">
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

  async function saveChanges() {
    setSaving(true);
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
      if (!error) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-2 md:grid-cols-5">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={brand} onChange={(e) => setBrand(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-md border bg-transparent p-2" />
        <input value={price} onChange={(e) => setPrice(Number(e.target.value))} type="number" step="0.01" className="rounded-md border bg-transparent p-2" />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="rounded-md border bg-transparent p-2" />
      </div>
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-xs text-[var(--foreground-muted)]">Moneda: L. {Number(price).toFixed(2)}</p>
        <button onClick={saveChanges} disabled={saving} className="rounded-md bg-[var(--admin-accent)] px-3 py-2 text-sm font-medium text-black">
          {saving ? "Guardando..." : "Aplicar cambios"}
        </button>
      </div>
    </div>
  );
}
