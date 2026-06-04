import { redirect } from "next/navigation";
import { AdminNewReservationNotify } from "@/components/admin-new-reservation-notify";
import { AdminShell } from "@/components/admin-shell";
import { getDefaultAdminPath, getRoleLabel, getSessionRole } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(adminPath("/login"));

  const session = await getSessionRole();
  if (!session) redirect(adminPath("/login"));

  const roleLabel = getRoleLabel(session.role);

  return (
    <div className="admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-foreground)]">
      <AdminNewReservationNotify />
      <AdminShell session={session} roleLabel={roleLabel} defaultPath={getDefaultAdminPath(session.role)}>
        {children}
      </AdminShell>
    </div>
  );
}
