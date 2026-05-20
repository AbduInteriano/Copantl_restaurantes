"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminPath } from "@/lib/admin-path";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "No se pudo iniciar sesion.");
      setLoading(false);
      return;
    }

    router.push(typeof data.redirectTo === "string" ? data.redirectTo : adminPath());
    router.refresh();
  }

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-[var(--admin-bg)] px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 shadow-sm"
      >
        <h1 className="section-title text-3xl text-[var(--admin-foreground)]">Acceso al panel</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Tras 5 intentos fallidos la cuenta se bloquea 30 minutos.
        </p>
        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-md border bg-transparent p-3"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="username"
            required
          />
          <input
            className="w-full rounded-md border bg-transparent p-3"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contrasena"
            autoComplete="current-password"
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-md bg-[var(--admin-accent)] px-3 py-3 font-medium text-white shadow-sm hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          {error ? <p className="text-sm text-[var(--admin-danger)]">{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
