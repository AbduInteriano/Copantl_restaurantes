import { AdminUsersManager } from "@/components/admin-users-manager";

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <h1 className="section-title text-4xl">Usuarios del panel</h1>
      <p className="text-sm text-[var(--foreground-muted)]">
        Administradores: acceso completo y gestion de usuarios. Supervisores: solo reservaciones.
      </p>
      <AdminUsersManager />
    </div>
  );
}
