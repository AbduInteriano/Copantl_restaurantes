"use client";

import { useState } from "react";
import { TipTapEditor } from "@/components/tiptap-editor";

type Props = {
  action: (formData: FormData) => void;
};

export function PromotionForm({ action }: Props) {
  const [content, setContent] = useState("<p>Nueva promocion</p>");

  return (
    <form action={action} className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
      <input name="title" className="w-full rounded-md border bg-transparent p-3" placeholder="Titulo de promocion" required />
      <input type="hidden" name="content" value={content} />
      <TipTapEditor value={content} onChange={setContent} />
      <button className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95">
        Publicar promocion
      </button>
    </form>
  );
}
