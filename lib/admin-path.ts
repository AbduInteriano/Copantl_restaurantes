const DEFAULT_SLUG = "admin";

/** Slug publico del panel (ej. copantl-gestion-k9m4). No usar "admin" en produccion. */
export function getAdminSlug(): string {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_PANEL_SLUG?.trim() ||
    process.env.ADMIN_PANEL_SLUG?.trim() ||
    DEFAULT_SLUG;
  const slug = raw.replace(/^\/+|\/+$/g, "");
  return slug || DEFAULT_SLUG;
}

/** Ruta base del panel para enlaces y redirecciones. */
export function adminPath(subpath = ""): string {
  const base = `/${getAdminSlug()}`;
  if (!subpath) return base;
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${base}${normalized}`;
}

export function isLegacyAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isAdminPanelPath(pathname: string): boolean {
  const slug = getAdminSlug();
  return pathname === `/${slug}` || pathname.startsWith(`/${slug}/`);
}
