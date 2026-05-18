import { GalleryAdminManager } from "@/components/gallery-admin-manager";
import type { Database } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/server";

export default async function GaleriaPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("gallery_items")
    .select("*")
    .order("sort_order", { ascending: true });
  const galleryItems = (items ?? []) as Database["public"]["Tables"]["gallery_items"]["Row"][];

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Galeria</h1>
      <GalleryAdminManager items={galleryItems} />
    </div>
  );
}
