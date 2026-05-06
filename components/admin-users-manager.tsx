"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  role: "admin" | "supervisor";
};

export function AdminUsersManager() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "supervisor">("supervisor");
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
    setNewRole("supervisor");
    await load();
    setMsg("Usuario creado correctamente.");
  }

  async function updateRole(id: string, role: "admin" | "supervisor") {
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
    setMsg("Contrasena actualizada.");
  }

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[var(--admin-foreground)]">
          {msg}
        </p>
      )}

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
            onChange={(e) => setNewRole(e.target.value as "admin" | "supervisor")}
            className="rounded-md border bg-transparent p-3 sm:col-span-2"
          >
            <option value="supervisor">Supervisor (solo reservaciones)</option>
            <option value="admin">Administrador (acceso completo)</option>
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
        {loading ? (
          <p className="text-sm text-[var(--foreground-muted)]">Cargando…</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--admin-border)]">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs text-[var(--admin-muted)]">
                <tr>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Correo</th>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Rol</th>
                  <th className="border-b border-[var(--admin-border)] px-3 py-2">Nueva contrasena</th>
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
}: {
  user: UserRow;
  disabled: boolean;
  onRoleChange: (role: "admin" | "supervisor") => void;
  onPasswordSubmit: (password: string) => void;
}) {
  const [pw, setPw] = useState("");

  return (
    <tr className="border-b border-slate-100 bg-white">
      <td className="px-3 py-2 font-medium">{user.email}</td>
      <td className="px-3 py-2">
        <select
          value={user.role}
          disabled={disabled}
          onChange={(e) => onRoleChange(e.target.value as "admin" | "supervisor")}
          className="w-full max-w-[200px] rounded-md border border-[var(--admin-border)] bg-white p-2 text-sm"
        >
          <option value="supervisor">Supervisor</option>
          <option value="admin">Administrador</option>
        </select>
      </td>
      <td className="px-3 py-2">
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
            Guardar
          </button>
        </div>
      </td>
    </tr>
  );
}
