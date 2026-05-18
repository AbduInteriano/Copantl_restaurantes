import { redirect } from "next/navigation";
import { AdminNewReservationNotify } from "@/components/admin-new-reservation-notify";
import { AdminShell } from "@/components/admin-shell";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");

  const session = await getSessionRole();
  const showAdminNav = Boolean(session && isAdminRole(session.role));
  const roleLabel = session && isAdminRole(session.role) ? "Administrador" : "Supervisor";

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-foreground)]">
      <AdminNewReservationNotify />
      <AdminShell showAdminNav={showAdminNav} roleLabel={roleLabel}>
        {children}
      </AdminShell>
    </div>
  );
}
