"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Database } from "@/lib/supabase/types";

type CategoryWithItems = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  menu_items: Database["public"]["Tables"]["menu_items"]["Row"][];
};

type Props = {
  categories: CategoryWithItems[];
};

const beverageFamilies = ["Vino", "Ron", "Whisky", "Ginebra", "Tequila", "Cocteles"] as const;

export function BeveragesCatalog({ categories }: Props) {
  const [selected, setSelected] = useState<(typeof beverageFamilies)[number] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const categoriesByName = useMemo(() => {
    const map = new Map<string, CategoryWithItems>();
    categories.forEach((cat) => {
      if (cat.name === "Gineba") {
        map.set("Ginebra", cat);
      } else {
        map.set(cat.name, cat);
      }
    });
    return map;
  }, [categories]);

  const activeCategory = selected ? categoriesByName.get(selected) : null;
  const products =
    activeCategory?.menu_items?.filter(
      (item) =>
        item.is_active &&
        `${item.name} ${item.brand ?? ""}`.toLowerCase().includes(query.toLowerCase()),
    ) ?? [];
  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? products[0] ?? null;

  return (
    <div className="mt-6 space-y-4">
      <h3 className="section-title text-3xl text-[var(--accent-gold)]">Bebidas</h3>

      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-6">
        {beverageFamilies.map((family) => (
          <button
            key={family}
            onClick={() => setSelected((prev) => (prev === family ? null : family))}
            className={`min-w-[96px] shrink-0 rounded-lg border px-2.5 py-2 text-left transition sm:min-w-0 sm:px-3 sm:py-2.5 ${
              selected === family
                ? "border-[var(--accent-gold)] bg-[var(--accent-burgundy)]/20 text-[var(--accent-gold)]"
                : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-burgundy)]"
            }`}
          >
            <p className="section-title text-base leading-tight sm:text-lg">{family}</p>
          </button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden rounded-xl border bg-[var(--surface)] p-4"
          >
            <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h4 className="section-title text-2xl">{selected}</h4>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto o marca..."
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm md:w-72"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
              <div className="max-h-[300px] space-y-2 overflow-auto rounded-lg border border-[var(--border)] p-2 sm:max-h-[420px]">
                {products.length === 0 ? (
                  <p className="p-2 text-sm text-[var(--foreground-muted)]">No hay productos para mostrar.</p>
                ) : (
                  products.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedProductId(item.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        selectedProduct?.id === item.id
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                          : "border-[var(--border)] hover:border-[var(--accent-gold)]/50"
                      }`}
                    >
                      <p className="text-sm leading-snug">{item.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{item.brand ?? "Sin marca"}</p>
                    </button>
                  ))
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-black/20 p-3">
                {selectedProduct ? (
                  <>
                    {selectedProduct.image_url ? (
                      <div className="mb-3 aspect-[4/3] overflow-hidden rounded-md bg-[var(--background-secondary)] sm:aspect-[16/10]">
                        <img
                          src={selectedProduct.image_url}
                          alt={selectedProduct.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg">{selectedProduct.name}</p>
                        <p className="text-sm text-[var(--foreground-muted)]">{selectedProduct.brand ?? "Sin marca"}</p>
                        {selectedProduct.description && (
                          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{selectedProduct.description}</p>
                        )}
                      </div>
                      <p className="text-lg text-white">L. {Number(selectedProduct.price).toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[var(--foreground-muted)]">Selecciona un producto para ver detalles.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
