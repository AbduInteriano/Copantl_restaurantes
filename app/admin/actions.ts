"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const supabase = createClient();
  await supabase.from("menu_categories").insert({
    name: String(formData.get("name")),
    sort_order: Number(formData.get("sort_order") ?? 0),
  } as never);
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function createPromotion(formData: FormData) {
  const supabase = createClient();
  await supabase.from("promotions").insert({
    title: String(formData.get("title")),
    content: String(formData.get("content")),
    is_active: true,
  } as never);
  revalidatePath("/admin/promociones");
  revalidatePath("/");
}

export async function createMenuItem(formData: FormData) {
  const supabase = createClient();
  await supabase.from("menu_items").insert({
    category_id: String(formData.get("category_id")),
    name: String(formData.get("name")),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price") ?? 0),
    is_active: true,
  } as never);
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function createGalleryItem(formData: FormData) {
  const supabase = createClient();
  await supabase.from("gallery_items").insert({
    title: String(formData.get("title")),
    image_url: String(formData.get("image_url")),
    sort_order: Number(formData.get("sort_order") ?? 0),
  } as never);
  revalidatePath("/admin/galeria");
  revalidatePath("/");
}

export async function updateSettings(formData: FormData) {
  const supabase = createClient();
  await supabase.from("site_settings").upsert(
    {
      id: 1,
      hero_title: String(formData.get("hero_title")),
      hero_subtitle: String(formData.get("hero_subtitle")),
      logo_url: String(formData.get("logo_url") || "") || null,
      instagram_url: String(formData.get("instagram_url") || "") || null,
      facebook_url: String(formData.get("facebook_url") || "") || null,
      tiktok_url: String(formData.get("tiktok_url") || "") || null,
      whatsapp_url: String(formData.get("whatsapp_url") || "") || null,
      about_text: String(formData.get("about_text")),
      address: String(formData.get("address")),
      phone: String(formData.get("phone")),
      email: String(formData.get("email")),
    } as never,
    { onConflict: "id" },
  );
  revalidatePath("/admin/configuracion");
  revalidatePath("/");
}
