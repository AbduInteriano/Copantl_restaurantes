import { SiteSettingsForm } from "@/components/site-settings-form";
import { fallbackSettings } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function ConfiguracionPage() {
  const supabase = createClient();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const settings = data ?? fallbackSettings;

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Configuracion del Sitio</h1>
      <SiteSettingsForm settings={settings} />
    </div>
  );
}
