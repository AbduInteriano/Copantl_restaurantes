"use client";

import { CalendarHeart, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

type EventItem = {
  id: string;
  title: string | null;
  image_url: string;
};

type Props = {
  items: EventItem[];
};

export function FloatingEventsButton({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex !== null ? items[selectedIndex] : null;
  const isTwoOrLess = items.length <= 2;
  const containerWidthClass = items.length <= 1 ? "max-w-md" : items.length === 2 ? "max-w-3xl" : "max-w-5xl";

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
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full border border-[var(--accent-gold)] bg-[var(--surface)] p-3 text-[var(--accent-gold)] shadow-lg transition hover:scale-105 sm:bottom-6 sm:right-6 sm:p-4"
        aria-label="Ver eventos"
      >
        <CalendarHeart size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 sm:p-6">
          <div className={`mx-auto rounded-xl border bg-[var(--background)] p-4 sm:p-5 ${containerWidthClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="section-title text-3xl">Eventos</h3>
              <button onClick={() => setOpen(false)} className="rounded-md border p-2 hover:bg-black/20">
                <X size={18} />
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-[var(--foreground-muted)]">Aun no hay banners de eventos cargados.</p>
            ) : (
              <div className={`grid gap-3 sm:gap-4 ${isTwoOrLess ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIndex(index)}
                    className="rounded-xl border bg-[var(--surface)] p-3 text-left transition hover:border-[var(--accent-gold)]"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-md bg-[var(--background-secondary)]">
                      <img src={item.image_url} alt={item.title ?? "Banner de evento"} className="h-full w-full object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-2 sm:p-4">
          <div className="w-full max-w-5xl rounded-xl border bg-[var(--surface)] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="section-title text-2xl">Eventos</p>
              <button onClick={() => setSelectedIndex(null)} className="rounded-md border p-2 hover:bg-black/20">
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-black/20 p-2">
              <button onClick={showPrev} className="rounded-md border p-2 hover:bg-black/20">
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 overflow-auto">
                <img src={selected.image_url} alt={selected.title ?? "Banner de evento"} className="mx-auto h-auto max-h-[70vh] w-auto rounded-md object-contain" />
              </div>
              <button onClick={showNext} className="rounded-md border p-2 hover:bg-black/20">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
