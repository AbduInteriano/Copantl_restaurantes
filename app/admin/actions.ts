"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

async function ensureAdmin() {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    redirect("/admin");
  }
}

export async function createPromotion(formData: FormData) {
  await ensureAdmin();
  const supabase = createClient();
  await supabase.from("promotions").insert({
    title: String(formData.get("title")),
    content: String(formData.get("content")),
    is_active: true,
  } as never);
  revalidatePath("/admin/promociones");
  revalidatePath("/");
}

export async function createGalleryItem(formData: FormData) {
  await ensureAdmin();
  const supabase = createClient();
  await supabase.from("gallery_items").insert({
    title: String(formData.get("title")),
    image_url: String(formData.get("image_url")),
    sort_order: Number(formData.get("sort_order") ?? 0),
  } as never);
  revalidatePath("/admin/galeria");
  revalidatePath("/");
}

export type SettingsFormState = {
  success: boolean;
  error?: string;
};

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await ensureAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_title: String(formData.get("hero_title") ?? "").trim(),
      about_text: String(formData.get("about_text") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      instagram_url: emptyToNull(formData.get("instagram_url")),
      facebook_url: emptyToNull(formData.get("facebook_url")),
      tiktok_url: emptyToNull(formData.get("tiktok_url")),
      whatsapp_url: emptyToNull(formData.get("whatsapp_url")),
    } as never)
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/configuracion");
  revalidatePath("/");
  return { success: true };
}
