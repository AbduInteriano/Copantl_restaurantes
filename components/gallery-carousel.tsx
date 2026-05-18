"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type GalleryItem = {
  id: string;
  image_url: string;
  title?: string | null;
};

type Props = {
  items: GalleryItem[];
};

const AUTO_MS = 5000;

/** Altura visible del carrusel (px). Exportar fotos ~2400×1000 (2.4:1) para encajar sin recorte. */
const CAROUSEL_HEIGHT = { base: 280, sm: 360, md: 420 } as const;

export function GalleryCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) {
    return (
      <div className="mt-6 flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground-muted)]">
        Proximamente fotografias del hotel.
      </div>
    );
  }

  const current = items[index];

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carrusel"
      aria-label="Fotografias"
    >
      <div className="relative h-[280px] w-full bg-[var(--background-secondary)] sm:h-[360px] md:h-[420px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current.id}
            src={current.image_url}
            alt={current.title ?? `Fotografia ${index + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="absolute inset-0 m-auto h-full w-full object-contain p-1 sm:p-2"
            draggable={false}
          />
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`overflow-hidden rounded-md border-2 transition-all ${
                i === index
                  ? "border-[var(--accent-gold)] opacity-100 ring-2 ring-[var(--accent-gold)]/30"
                  : "border-transparent opacity-55 hover:opacity-90"
              }`}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
            >
              <img src={item.image_url} alt="" className="h-12 w-16 object-cover sm:h-14 sm:w-20" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
