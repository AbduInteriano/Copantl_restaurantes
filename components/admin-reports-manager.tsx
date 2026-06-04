"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { RESTAURANTS } from "@/lib/restaurants";

function downloadFromApi(url: string, fallbackName: string) {
  return async () => {
    const res = await fetch(url, { method: "GET", credentials: "include" });
    if (!res.ok) {
      const contentType = res.headers.get("Content-Type") ?? "";
      if (contentType.includes("application/json")) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "No se pudo descargar el archivo.");
      }
      throw new Error(`Error ${res.status}: no se pudo descargar el archivo.`);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? fallbackName;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };
}

export function AdminReportsManager() {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState<"contacts" | "reservations" | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [restaurant, setRestaurant] = useState("all");

  async function run(kind: "contacts" | "reservations") {
    setMsg("");
    setLoading(kind);
    try {
      if (kind === "contacts") {
        await downloadFromApi("/api/admin/reports/contacts", "reservantes.xlsx")();
      } else {
        if (from && to && from > to) {
          throw new Error("La fecha inicial no puede ser posterior a la final.");
        }
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (status !== "all") params.set("status", status);
        if (restaurant !== "all") params.set("restaurant", restaurant);
        const qs = params.toString();
        await downloadFromApi(
          `/api/admin/reports/reservations${qs ? `?${qs}` : ""}`,
          "reservaciones.xlsx",
        )();
      }
      setMsg("Descarga completada.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error en la descarga.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {msg ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[var(--admin-foreground)]">
          {msg}
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--admin-accent)]">
            <FileSpreadsheet size={20} />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">Base de reservantes</h2>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">
              Excel con nombre, correo y telefono unicos de quienes han reservado.
            </p>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void run("contacts")}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-[var(--admin-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              <Download size={16} />
              {loading === "contacts" ? "Generando..." : "Descargar Excel"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[var(--admin-accent)]">
            <FileSpreadsheet size={20} />
          </span>
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--admin-foreground)]">Reservaciones por periodo</h2>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">
                Historial completo (incluye fechas pasadas): contacto, restaurante, evento, personas, fecha, hora, estado y mas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block text-sm text-[var(--admin-muted)]">
                Desde
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white p-2.5"
                />
              </label>
              <label className="block text-sm text-[var(--admin-muted)]">
                Hasta
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white p-2.5"
                />
              </label>
              <label className="block text-sm text-[var(--admin-muted)]">
                Estado
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white p-2.5"
                >
                  <option value="all">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
              <label className="block text-sm text-[var(--admin-muted)]">
                Restaurante
                <select
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  className="mt-1 w-full rounded-md border bg-white p-2.5"
                >
                  <option value="all">Todos</option>
                  {RESTAURANTS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.shortLabel}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              disabled={loading !== null}
              onClick={() => void run("reservations")}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--admin-accent)] px-4 py-3 text-sm font-medium text-white hover:opacity-95 disabled:opacity-60"
            >
              <Download size={16} />
              {loading === "reservations" ? "Generando..." : "Descargar Excel filtrado"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
