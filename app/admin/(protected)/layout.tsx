import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, LayoutDashboard, UtensilsCrossed, Images, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Productos", icon: UtensilsCrossed },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarHeart },
  { href: "/admin/galeria", label: "Galeria", icon: Images },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings },
];

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--foreground)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border bg-[var(--admin-sidebar)] p-4">
          <p className="section-title mb-6 text-3xl tracking-[0.2em] text-[var(--admin-accent)]">CAVA</p>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-[var(--admin-card)]">
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action="/auth/signout" method="post" className="mt-8">
            <button className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--admin-card)]">
              Cerrar sesion
            </button>
          </form>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
