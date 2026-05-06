import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, LayoutDashboard, UtensilsCrossed, Images, Settings, Users } from "lucide-react";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/admin", label: "Reservas", icon: LayoutDashboard, adminOnly: false },
  { href: "/admin/menu", label: "Productos", icon: UtensilsCrossed, adminOnly: true },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarHeart, adminOnly: true },
  { href: "/admin/galeria", label: "Galeria", icon: Images, adminOnly: true },
  { href: "/admin/configuracion", label: "Configuracion", icon: Settings, adminOnly: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
] as const;

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const session = await getSessionRole();
  const showAdminNav = session && isAdminRole(session.role);
  const nav = navItems.filter((item) => !item.adminOnly || showAdminNav);

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-foreground)]">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[260px_1fr]">
        <aside className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-sidebar)] p-4 shadow-sm">
          <p className="section-title mb-2 text-3xl tracking-[0.2em] text-[var(--admin-brand)]">CAVA</p>
          {session && (
            <p className="mb-4 text-xs font-medium text-[var(--admin-muted)]">
              {isAdminRole(session.role) ? "Administrador" : "Supervisor"}
            </p>
          )}
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--admin-foreground)] transition hover:bg-[var(--admin-bg)]"
                >
                  <Icon size={16} className="text-[var(--admin-muted)]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action="/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="w-full rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-sm text-[var(--admin-foreground)] hover:bg-[var(--admin-bg)]"
            >
              Cerrar sesion
            </button>
          </form>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
