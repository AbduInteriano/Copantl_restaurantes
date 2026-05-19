"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, UtensilsCrossed, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FadeIn } from "@/components/fade-in";
import { RESTAURANTS, type RestaurantKey } from "@/lib/restaurants";

export type RestaurantMenuImage = {
  id: string;
  restaurant: RestaurantKey;
  image_url: string;
  sort_order: number;
};

type Props = {
  items: RestaurantMenuImage[];
};

export function RestaurantMenusDisplay({ items }: Props) {
  const [openRestaurant, setOpenRestaurant] = useState<RestaurantKey | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const modalImages = openRestaurant
    ? items.filter((i) => i.restaurant === openRestaurant).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const openMeta = openRestaurant ? RESTAURANTS.find((r) => r.key === openRestaurant) : null;

  const closeModal = useCallback(() => {
    setOpenRestaurant(null);
    setPageIndex(0);
  }, []);

  const showPrev = useCallback(() => {
    if (modalImages.length === 0) return;
    setPageIndex((i) => (i - 1 + modalImages.length) % modalImages.length);
  }, [modalImages.length]);

  const showNext = useCallback(() => {
    if (modalImages.length === 0) return;
    setPageIndex((i) => (i + 1) % modalImages.length);
  }, [modalImages.length]);

  useEffect(() => {
    if (!openRestaurant) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openRestaurant, closeModal, showPrev, showNext]);

  useEffect(() => {
    document.body.style.overflow = openRestaurant ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openRestaurant]);

  return (
    <>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
        {RESTAURANTS.map((restaurant, sectionIndex) => {
          const count = items.filter((i) => i.restaurant === restaurant.key).length;
          const hasMenu = count > 0;

          return (
            <FadeIn key={restaurant.key} delay={sectionIndex * 0.06}>
              <button
                type="button"
                disabled={!hasMenu}
                onClick={() => {
                  setOpenRestaurant(restaurant.key);
                  setPageIndex(0);
                }}
                className="group flex h-full w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-sm transition hover:border-[var(--accent-gold)] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[var(--border)] disabled:hover:shadow-sm sm:p-7"
              >
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] transition group-hover:bg-[var(--accent-gold)]/20">
                  <UtensilsCrossed size={22} strokeWidth={1.75} />
                </span>
                <h3 className="section-title text-xl text-[var(--accent-gold-dark)] sm:text-2xl">{restaurant.shortLabel}</h3>
                {hasMenu ? (
                  <span className="mt-5 inline-flex items-center text-sm font-semibold text-[var(--accent-gold)]">
                    Ver menu
                    <ChevronRight size={16} className="ml-1 transition group-hover:translate-x-0.5" />
                  </span>
                ) : null}
              </button>
            </FadeIn>
          );
        })}
      </div>

      <AnimatePresence>
        {openRestaurant && openMeta ? (
          <motion.div
            key="menu-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4"
            onClick={closeModal}
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
                  <h3 className="section-title text-xl sm:text-2xl">{openMeta.menuTitle}</h3>
                  {modalImages.length > 0 ? (
                    <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                      {pageIndex + 1} de {modalImages.length}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col bg-[var(--background-secondary)] p-3 sm:p-4">
                {modalImages.length === 0 ? (
                  <p className="py-16 text-center text-sm text-[var(--foreground-muted)]">Sin imagenes de menu.</p>
                ) : (
                  <div className="flex min-h-0 flex-1 items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={showPrev}
                      disabled={modalImages.length <= 1}
                      className="shrink-0 rounded-xl border border-[var(--border)] bg-white p-2.5 shadow-sm transition hover:border-[var(--accent-gold)] disabled:opacity-40 sm:p-3"
                      aria-label="Pagina anterior"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-white p-2 sm:p-3">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.img
                          key={modalImages[pageIndex]?.id}
                          src={modalImages[pageIndex]?.image_url}
                          alt={`${openMeta.menuTitle} pagina ${pageIndex + 1}`}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.22 }}
                          className="mx-auto block h-auto max-h-[calc(98vh-140px)] w-auto max-w-full object-contain"
                        />
                      </AnimatePresence>
                    </div>

                    <button
                      type="button"
                      onClick={showNext}
                      disabled={modalImages.length <= 1}
                      className="shrink-0 rounded-xl border border-[var(--border)] bg-white p-2.5 shadow-sm transition hover:border-[var(--accent-gold)] disabled:opacity-40 sm:p-3"
                      aria-label="Pagina siguiente"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </div>
                )}

                {modalImages.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-1.5">
                    {modalImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPageIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === pageIndex ? "w-6 bg-[var(--accent-gold)]" : "w-2 bg-[var(--border)]"
                        }`}
                        aria-label={`Ir a pagina ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
