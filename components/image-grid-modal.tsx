"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

type ImageItem = {
  id: string;
  title: string | null;
  image_url: string;
};

type Props = {
  title: string;
  items: ImageItem[];
};

export function ImageGridModal({ title, items }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  function showPrev() {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex((selectedIndex - 1 + items.length) % items.length);
  }

  function showNext() {
    if (selectedIndex === null || items.length === 0) return;
    setSelectedIndex((selectedIndex + 1) % items.length);
  }

  return (
    <>
      <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className="rounded-xl border bg-[var(--surface)] p-3 text-left transition hover:border-[var(--accent-gold)]"
          >
            <div className="aspect-[4/3] overflow-hidden rounded-md bg-[var(--background-secondary)]">
              <img src={item.image_url} alt={item.title ?? "Imagen"} className="h-full w-full object-cover" />
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4">
          <div className="w-full max-w-5xl rounded-xl border bg-[var(--surface)] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title text-2xl">{title}</p>
              <button
                onClick={() => setSelectedIndex(null)}
                className="rounded-md border p-2 hover:bg-black/20"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[78vh] rounded-md bg-black/20 p-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={showPrev} className="rounded-md border p-2 hover:bg-black/20" aria-label="Imagen anterior">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 overflow-auto">
                  <img src={selected.image_url} alt={selected.title ?? "Imagen"} className="mx-auto h-auto max-h-[72vh] w-auto rounded-md object-contain" />
                </div>
                <button onClick={showNext} className="rounded-md border p-2 hover:bg-black/20" aria-label="Imagen siguiente">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
