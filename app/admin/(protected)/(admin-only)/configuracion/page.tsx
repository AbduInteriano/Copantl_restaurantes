import { updateSettings } from "@/app/admin/actions";
import { fallbackSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const settings = data ?? fallbackSettings;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Configuracion del Sitio</h1>

      <form action={updateSettings} className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <label className="block text-sm text-[var(--admin-muted)]">
          Encabezado de la seccion de informacion
          <input
            name="hero_title"
            defaultValue={settings.hero_title}
            className="mt-1 w-full rounded-md border bg-transparent p-3"
            placeholder="Ej. Copantl Reservaciones"
          />
        </label>
        <textarea
          name="about_text"
          defaultValue={settings.about_text}
          className="min-h-32 w-full rounded-md border bg-transparent p-3"
          placeholder="Texto de presentacion"
        />
        <input name="address" defaultValue={settings.address} className="w-full rounded-md border bg-transparent p-3" placeholder="Direccion" />
        <input name="phone" defaultValue={settings.phone} className="w-full rounded-md border bg-transparent p-3" placeholder="Telefono" />
        <input name="email" defaultValue={settings.email} className="w-full rounded-md border bg-transparent p-3" placeholder="Correo" />

        <p className="pt-2 text-sm font-medium text-[var(--admin-foreground)]">Redes sociales</p>
        <input name="instagram_url" defaultValue={settings.instagram_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL Instagram" />
        <input name="facebook_url" defaultValue={settings.facebook_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL Facebook" />
        <input name="tiktok_url" defaultValue={settings.tiktok_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL TikTok" />
        <input name="whatsapp_url" defaultValue={settings.whatsapp_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL WhatsApp (wa.me/...)" />

        <button className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
