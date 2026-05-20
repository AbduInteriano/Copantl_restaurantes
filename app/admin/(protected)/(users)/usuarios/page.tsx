import { AdminUsersManager } from "@/components/admin-users-manager";

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-4xl">Usuarios del panel</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Crea cuentas, asigna perfiles, cambia contraseñas por usuario y desbloquea accesos tras intentos
          fallidos. La cuenta super administrador no puede modificarse desde aqui.
        </p>
      </div>
      <AdminUsersManager />
    </div>
  );
}
