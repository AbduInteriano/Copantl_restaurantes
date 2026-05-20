import { AdminReportsManager } from "@/components/admin-reports-manager";

export default function ReporteriaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title text-4xl">Reportería</h1>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Descarga reportes en Excel de reservantes y reservaciones con filtros por periodo.
        </p>
      </div>
      <AdminReportsManager />
    </div>
  );
}
