export const SUPER_ADMIN_EMAIL = "abdu.interiano@copantl.com";

import { adminPath } from "@/lib/admin-path";

export type AppRole = "super_admin" | "admin" | "supervisor" | "reservaciones" | "reporteria";

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super administrador",
  admin: "Administrador",
  supervisor: "Supervisor",
  reservaciones: "Reservaciones",
  reporteria: "Reportería",
};

export const ASSIGNABLE_ROLES: AppRole[] = [
  "admin",
  "supervisor",
  "reservaciones",
  "reporteria",
];

export function normalizeAppRole(value: string | null | undefined): AppRole {
  if (value === "super_admin") return "super_admin";
  if (value === "admin") return "admin";
  if (value === "supervisor") return "supervisor";
  if (value === "reservaciones") return "reservaciones";
  if (value === "reporteria") return "reporteria";
  return "admin";
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function isProtectedAccount(email: string | null | undefined): boolean {
  return isSuperAdminEmail(email);
}

export function canManageUsers(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function canManageContent(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "supervisor";
}

export function canManageReservations(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "reservaciones";
}

export function canAccessReporting(role: AppRole): boolean {
  return (
    role === "super_admin" ||
    role === "admin" ||
    role === "supervisor" ||
    role === "reporteria"
  );
}

export function getDefaultAdminPath(role: AppRole): string {
  if (role === "reporteria") return adminPath("/reporteria");
  if (role === "supervisor") return adminPath("/reporteria");
  if (role === "reservaciones") return adminPath();
  return adminPath();
}

export function getRoleLabel(role: AppRole): string {
  return APP_ROLE_LABELS[role];
}
