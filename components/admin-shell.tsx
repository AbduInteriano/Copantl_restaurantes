"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Images,
  LayoutDashboard,
  Settings,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AppRole, SessionRole } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import {
  canAccessReporting,
  canManageContent,
  canManageReservations,
  canManageUsers,
} from "@/lib/admin-permissions";

const STORAGE_KEY = "copantl-admin-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  show: (role: AppRole) => boolean;
};

const navItems: NavItem[] = [
  {
    href: adminPath(),
    label: "Reservas",
    icon: LayoutDashboard,
    show: canManageReservations,
  },
  {
    href: adminPath("/reporteria"),
    label: "Reportería",
    icon: FileSpreadsheet,
    show: canAccessReporting,
  },
  {
    href: adminPath("/menu"),
    label: "Menús",
    icon: UtensilsCrossed,
    show: canManageContent,
  },
  {
    href: adminPath("/eventos"),
    label: "Eventos",
    icon: CalendarHeart,
    show: canManageContent,
  },
  {
    href: adminPath("/galeria"),
    label: "Galeria",
    icon: Images,
    show: canManageContent,
  },
  {
    href: adminPath("/horarios"),
    label: "Horario reservas",
    icon: Clock,
    show: canManageContent,
  },
  {
    href: adminPath("/configuracion"),
    label: "Configuracion",
    icon: Settings,
    show: canManageContent,
  },
  {
    href: adminPath("/usuarios"),
    label: "Usuarios",
    icon: Users,
    show: canManageUsers,
  },
];

type Props = {
  children: React.ReactNode;
  session: SessionRole;
  roleLabel: string;
  defaultPath: string;
};

export function AdminShell({ children, session, roleLabel, defaultPath }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const basePath = adminPath();

  const nav = navItems.filter((item) => item.show(session.role));

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const showSidebar = !collapsed;

  return (
    <div
      className={`mx-auto grid max-w-7xl gap-4 px-4 py-6 transition-[grid-template-columns] duration-200 sm:px-6 sm:py-8 ${
        showSidebar ? "md:grid-cols-[260px_1fr]" : "md:grid-cols-1"
      }`}
    >
      {showSidebar ? (
        <aside className="relative rounded-xl border border-[var(--admin-border)] bg-[var(--admin-sidebar)] p-4 shadow-sm">
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--admin-border)] bg-white text-[var(--admin-muted)] shadow-sm hover:bg-slate-50"
            aria-label="Ocultar menú"
            title="Ocultar menú"
          >
            <ChevronLeft size={16} />
          </button>

          <Link href={defaultPath} className="block">
            <p className="section-title mb-2 text-xl tracking-[0.12em] text-[var(--admin-brand)]">
              Copantl Reservaciones
            </p>
          </Link>
          <p className="mb-4 text-xs font-medium text-[var(--admin-muted)]">{roleLabel}</p>

          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== basePath && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                    active
                      ? "bg-blue-50 font-medium text-[var(--admin-accent)]"
                      : "text-[var(--admin-foreground)] hover:bg-[var(--admin-bg)]"
                  }`}
                >
                  <Icon size={16} className={active ? "text-[var(--admin-accent)]" : "text-[var(--admin-muted)]"} />
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
      ) : (
        <button
          type="button"
          onClick={toggleSidebar}
          className="fixed left-3 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-sidebar)] text-[var(--admin-muted)] shadow-md hover:bg-white md:left-4 md:top-8"
          aria-label="Mostrar menú"
          title="Mostrar menú"
        >
          <ChevronRight size={20} />
        </button>
      )}

      <section className="min-w-0">{children}</section>
    </div>
  );
}
