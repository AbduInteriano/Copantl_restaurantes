import { ProductsAdminManager } from "@/components/products-admin-manager";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type CategoryWithItems = Database["public"]["Tables"]["menu_categories"]["Row"] & {
  menu_items: Database["public"]["Tables"]["menu_items"]["Row"][];
};

export default async function AdminMenuPage() {
  const supabase = createClient();
  const beverageFamilies = [
    { name: "Vino", sort_order: 1 },
    { name: "Ron", sort_order: 2 },
    { name: "Whisky", sort_order: 3 },
    { name: "Ginebra", sort_order: 4 },
    { name: "Tequila", sort_order: 5 },
  ];

  await supabase.from("menu_categories").upsert(
    beverageFamilies.map((family) => ({
      ...family,
      product_type: "bebidas",
      is_active: true,
    })) as never,
    { onConflict: "name,product_type" },
  );

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("product_type", "bebidas")
    .order("sort_order", { ascending: true });
  const menuCategories = (categories ?? []) as CategoryWithItems[];

  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Gestion de Productos</h1>
      <ProductsAdminManager categories={menuCategories} />
    </div>
  );
}
