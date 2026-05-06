"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)] px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border bg-[var(--admin-card)] p-6">
        <h1 className="section-title text-3xl text-[var(--admin-accent)]">Acceso Administrador</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">Ingresa tus credenciales de Supabase Auth.</p>
        <div className="mt-6 space-y-4">
          <input className="w-full rounded-md border bg-transparent p-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" required />
          <input className="w-full rounded-md border bg-transparent p-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contrasena" required />
          <button disabled={loading} className="w-full rounded-md bg-[var(--admin-accent)] px-3 py-3 font-medium text-black">
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          {error && <p className="text-sm text-[var(--admin-danger)]">{error}</p>}
        </div>
      </form>
    </main>
  );
}
