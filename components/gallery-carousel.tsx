"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

export function GalleryCarousel({ items }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const count = items.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const goLightbox = useCallback(
    (next: number) => {
      if (count === 0) return;
      setLightboxIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const lightboxNext = useCallback(() => goLightbox(lightboxIndex + 1), [goLightbox, lightboxIndex]);
  const lightboxPrev = useCallback(() => goLightbox(lightboxIndex - 1), [goLightbox, lightboxIndex]);

  function openLightbox(at: number) {
    setLightboxIndex(at);
    setLightboxOpen(true);
    setPaused(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setPaused(false);
  }

  useEffect(() => {
    if (count <= 1 || paused || lightboxOpen) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, paused, lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxOpen, lightboxPrev, lightboxNext]);

  if (count === 0) {
    return (
      <div className="mt-6 flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground-muted)]">
        Proximamente fotografias del hotel.
      </div>
    );
  }

  const current = items[index];
  const lightboxItem = items[lightboxIndex];

  return (
    <>
      <section
        className="relative mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => !lightboxOpen && setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => !lightboxOpen && setPaused(false)}
        aria-roledescription="carrusel"
        aria-label="Fotografias"
      >
        <button
          type="button"
          onClick={() => openLightbox(index)}
          className="relative block aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9] md:aspect-[2.4/1]"
          aria-label="Ver fotografia en grande"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={current.id}
              src={current.image_url}
              alt={current.title ?? `Fotografia ${index + 1}`}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full object-cover object-center"
              draggable={false}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent" />
        </button>

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:p-3"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/35 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/50 sm:right-4 sm:p-3"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        ) : null}

        {count > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--background-secondary)] px-4 py-3">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIndex(i);
                  openLightbox(i);
                }}
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

      <AnimatePresence>
        {lightboxOpen && lightboxItem ? (
          <motion.div
            key="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="flex max-h-[98vh] w-full max-w-[min(98vw,1400px)] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-6 sm:py-4">
                <div>
                  <h3 className="section-title text-lg sm:text-xl">
                    {lightboxItem.title ?? "Galeria"}
                  </h3>
                  {count > 1 ? (
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      {lightboxIndex + 1} de {count}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 items-center gap-2 bg-[var(--background-secondary)] p-3 sm:gap-3 sm:p-4">
                {count > 1 ? (
                  <button
                    type="button"
                    onClick={lightboxPrev}
                    className="shrink-0 rounded-xl border border-[var(--border)] bg-white p-2.5 shadow-sm transition hover:border-[var(--accent-gold)] sm:p-3"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft size={22} />
                  </button>
                ) : null}

                <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-xl border border-[var(--border)] bg-white p-2 sm:p-3">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.img
                      key={lightboxItem.id}
                      src={lightboxItem.image_url}
                      alt={lightboxItem.title ?? `Fotografia ${lightboxIndex + 1}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22 }}
                      className="mx-auto block h-auto max-h-[calc(98vh-140px)] w-auto max-w-full object-contain"
                    />
                  </AnimatePresence>
                </div>

                {count > 1 ? (
                  <button
                    type="button"
                    onClick={lightboxNext}
                    className="shrink-0 rounded-xl border border-[var(--border)] bg-white p-2.5 shadow-sm transition hover:border-[var(--accent-gold)] sm:p-3"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight size={22} />
                  </button>
                ) : null}
              </div>

              {count > 1 ? (
                <div className="flex justify-center gap-1.5 border-t border-[var(--border)] px-4 py-3">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === lightboxIndex ? "w-6 bg-[var(--accent-gold)]" : "w-2 bg-[var(--border)]"
                      }`}
                      aria-label={`Ir a foto ${i + 1}`}
                    />
                  ))}
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
