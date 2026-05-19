"use client";

import { updateSettings } from "@/app/admin/actions";
import { useFormState, useFormStatus } from "react-dom";

type Settings = {
  hero_title: string;
  about_text: string;
  address: string;
  phone: string;
  email: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  whatsapp_url: string | null;
};

type FormState = {
  success: boolean;
  error?: string;
};

const initialState: FormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

export function SiteSettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction] = useFormState(updateSettings, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
      {state.success ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900"
        >
          Cambios guardados correctamente. Los enlaces del pie de pagina se actualizaron.
        </p>
      ) : null}

      {state.error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900">
          {state.error}
        </p>
      ) : null}

      <label className="block text-sm text-[var(--admin-muted)]">
        Encabezado de la seccion de informacion
        <input
          name="hero_title"
          defaultValue={settings.hero_title}
          className="mt-1 w-full rounded-md border bg-transparent p-3"
          placeholder="Ej. Copantl Reservaciones"
          required
        />
      </label>
      <textarea
        name="about_text"
        defaultValue={settings.about_text}
        className="min-h-32 w-full rounded-md border bg-transparent p-3"
        placeholder="Texto de presentacion"
        required
      />
      <input name="address" defaultValue={settings.address} className="w-full rounded-md border bg-transparent p-3" placeholder="Direccion" required />
      <input name="phone" defaultValue={settings.phone} className="w-full rounded-md border bg-transparent p-3" placeholder="Telefono" required />
      <input name="email" defaultValue={settings.email} className="w-full rounded-md border bg-transparent p-3" placeholder="Correo" required />

      <div className="space-y-3 border-t border-[var(--admin-border)] pt-4">
        <div>
          <p className="text-sm font-medium text-[var(--admin-foreground)]">Redes sociales</p>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            Estas URL alimentan los botones de Instagram, Facebook, TikTok y WhatsApp en el pie de pagina del sitio.
          </p>
        </div>
        <input
          name="instagram_url"
          type="url"
          defaultValue={settings.instagram_url ?? ""}
          className="w-full rounded-md border bg-transparent p-3"
          placeholder="https://instagram.com/..."
        />
        <input
          name="facebook_url"
          type="url"
          defaultValue={settings.facebook_url ?? ""}
          className="w-full rounded-md border bg-transparent p-3"
          placeholder="https://facebook.com/..."
        />
        <input
          name="tiktok_url"
          type="url"
          defaultValue={settings.tiktok_url ?? ""}
          className="w-full rounded-md border bg-transparent p-3"
          placeholder="https://tiktok.com/@..."
        />
        <input
          name="whatsapp_url"
          type="url"
          defaultValue={settings.whatsapp_url ?? ""}
          className="w-full rounded-md border bg-transparent p-3"
          placeholder="https://wa.me/504..."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
