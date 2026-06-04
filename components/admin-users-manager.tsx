"use client";

import { useCallback, useEffect, useState } from "react";
import { APP_ROLE_LABELS, ASSIGNABLE_ROLES, type AppRole } from "@/lib/admin-permissions";

type UserRow = {
  id: string;
  email: string;
  role: AppRole;
  protected: boolean;
  loginLocked: boolean;
  failedAttempts: number;
  lockedMinutesLeft: number;
};

export function AdminUsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("reservaciones");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    const res = await fetch("/api/admin/users");
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error || "No se pudieron cargar los usuarios.");
      return;
    }
    setUsers(data.users ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || "No se pudo crear el usuario.");
      return;
    }
    setNewEmail("");
    setNewPassword("");
    setNewRole("reservaciones");
    await load();
    setMsg("Usuario creado correctamente.");
  }

  async function updateRole(id: string, role: AppRole) {
    setSavingId(id);
    setMsg("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setMsg(data.error || "No se pudo actualizar el rol.");
      return;
    }
    await load();
  }

  async function updatePassword(id: string, password: string) {
    if (password.length < 6) {
      setMsg("La contrasena debe tener al menos 6 caracteres.");
      return;
    }
    setSavingId(id);
    setMsg("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setMsg(data.error || "No se pudo cambiar la contrasena.");
      return;
    }
    await load();
    setMsg("Contrasena actualizada correctamente.");
  }

  async function unlockUser(user: UserRow) {
    setSavingId(user.id);
    setMsg("");
    const res = await fetch("/api/admin/users/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingId(null);
    if (!res.ok) {
      setMsg(data.error || "No se pudo desbloquear.");
      return;
    }
    await load();
    setMsg(`Acceso desbloqueado para ${user.email}.`);
  }

  return (
    <div className="space-y-8">
      {msg ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[var(--admin-foreground)]">
          {msg}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[var(--admin-foreground)]">Crear usuario</h2>
        <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded-md border bg-transparent p-3"
            placeholder="Correo electronico"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border bg-transparent p-3"
            placeholder="Contrasena (min. 6 caracteres)"
            autoComplete="new-password"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AppRole)}
            className="rounded-md border bg-transparent p-3 sm:col-span-2"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {APP_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-[var(--admin-accent)] px-4 py-3 font-medium text-white shadow-sm hover:opacity-95 sm:col-span-2"
          >
            Crear usuario
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-[var(--admin-foreground)]">Usuarios registrados</h2>
        <p className="mb-4 text-sm text-[var(--admin-muted)]">
          Puedes cambiar la contrasena de cada usuario de forma individual. Los bloqueos por intentos fallidos
          (5 intentos, 30 min) se pueden quitar desde aqui.
        </p>
        {loading ? (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs text-[var(--admin-muted)]">
                <tr>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Correo</th>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Perfil</th>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Acceso</th>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Contrasena</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserPasswordRow
                    key={u.id}
                    user={u}
                    disabled={savingId === u.id}
                    onRoleChange={(role) => updateRole(u.id, role)}
                    onPasswordSubmit={(pw) => updatePassword(u.id, pw)}
                    onUnlock={() => unlockUser(u)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserPasswordRow({
  user,
  disabled,
  onRoleChange,
  onPasswordSubmit,
  onUnlock,
}: {
  user: UserRow;
  disabled: boolean;
  onRoleChange: (role: AppRole) => void;
  onPasswordSubmit: (password: string) => void;
  onUnlock: () => void;
}) {
  const [pw, setPw] = useState("");
  const locked = user.protected;

  return (
    <tr className="border-b border-slate-100 bg-white">
      <td className="px-3 py-2 font-medium">
        {user.email}
        {locked ? (
          <span className="mt-1 block text-xs font-normal text-[var(--admin-muted)]">Super admin (protegido)</span>
        ) : null}
      </td>
      <td className="px-3 py-2">
        {locked ? (
          <span className="text-sm">{APP_ROLE_LABELS.super_admin}</span>
        ) : (
          <select
            value={user.role}
            disabled={disabled}
            onChange={(e) => onRoleChange(e.target.value as AppRole)}
            className="w-full max-w-[220px] rounded-md border border-[var(--admin-border)] bg-white p-2 text-sm"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {APP_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="px-3 py-2">
        {user.loginLocked ? (
          <div className="space-y-1">
            <span className="inline-block rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-800">
              Bloqueado ({user.lockedMinutesLeft} min)
            </span>
            <p className="text-xs text-[var(--admin-muted)]">{user.failedAttempts} intentos fallidos</p>
            {!locked ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onUnlock}
                className="text-xs font-medium text-[var(--admin-accent)] underline hover:opacity-80"
              >
                Desbloquear
              </button>
            ) : null}
          </div>
        ) : user.failedAttempts > 0 ? (
          <span className="text-xs text-[var(--admin-muted)]">{user.failedAttempts} intento(s) fallido(s)</span>
        ) : (
          <span className="text-xs text-emerald-700">Activo</span>
        )}
      </td>
      <td className="px-3 py-2">
        {locked ? (
          <span className="text-xs text-[var(--admin-muted)]">—</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Nueva contrasena"
              autoComplete="new-password"
              className="min-w-[140px] flex-1 rounded-md border border-[var(--admin-border)] bg-white p-2 text-sm"
            />
            <button
              type="button"
              disabled={disabled || pw.length < 6}
              onClick={() => {
                onPasswordSubmit(pw);
                setPw("");
              }}
              className="rounded-md border border-[var(--admin-border)] bg-slate-50 px-3 py-2 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              Guardar clave
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
