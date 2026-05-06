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
      <form action={updateSettings} className="space-y-4 rounded-xl border bg-[var(--admin-card)] p-5">
        <input name="hero_title" defaultValue={settings.hero_title} className="w-full rounded-md border bg-transparent p-3" placeholder="Titulo Hero" />
        <input name="hero_subtitle" defaultValue={settings.hero_subtitle} className="w-full rounded-md border bg-transparent p-3" placeholder="Subtitulo Hero" />
        <input name="logo_url" defaultValue={settings.logo_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL del logo (aparece encima de CAVA)" />
        <input name="instagram_url" defaultValue={settings.instagram_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL Instagram" />
        <input name="facebook_url" defaultValue={settings.facebook_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL Facebook" />
        <input name="tiktok_url" defaultValue={settings.tiktok_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL TikTok" />
        <input name="whatsapp_url" defaultValue={settings.whatsapp_url ?? ""} className="w-full rounded-md border bg-transparent p-3" placeholder="URL WhatsApp (wa.me/...)" />
        <textarea name="about_text" defaultValue={settings.about_text} className="min-h-32 w-full rounded-md border bg-transparent p-3" placeholder="Texto Sobre Nosotros" />
        <input name="address" defaultValue={settings.address} className="w-full rounded-md border bg-transparent p-3" placeholder="Direccion" />
        <input name="phone" defaultValue={settings.phone} className="w-full rounded-md border bg-transparent p-3" placeholder="Telefono" />
        <input name="email" defaultValue={settings.email} className="w-full rounded-md border bg-transparent p-3" placeholder="Correo" />
        <button className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-black">Guardar cambios</button>
      </form>
    </div>
  );
}
