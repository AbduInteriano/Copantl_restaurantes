"use client";

import { FLOATING_FAB_BUTTON_CLASS } from "@/components/floating-fab-classes";
import { SocialLinkButtons } from "@/components/social-link-buttons";
import type { ResolvedSocialHrefs } from "@/lib/social-hrefs";
import { Share2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  hrefs: ResolvedSocialHrefs;
};

export function FloatingSocialButton({ hrefs }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={FLOATING_FAB_BUTTON_CLASS}
        aria-label="Redes sociales"
        aria-expanded={open}
      >
        <Share2 size={20} className="shrink-0" aria-hidden />
        <span className="hidden pr-0.5 sm:inline">Redes</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-[3px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="floating-social-title"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[var(--border)] border-b-0 bg-[var(--surface)] shadow-2xl ring-1 ring-[var(--accent-gold)]/15 sm:rounded-2xl sm:border-b"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-5">
              <h2 id="floating-social-title" className="section-title text-xl sm:text-2xl">
                Redes sociales
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] transition hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-4 pb-8 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
              <SocialLinkButtons hrefs={hrefs} variant="touch" showLabels />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
