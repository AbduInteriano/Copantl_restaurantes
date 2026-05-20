import { redirect } from "next/navigation";
import { canAccessReporting, getSessionRole } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export default async function ReporteriaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionRole();
  if (!session || !canAccessReporting(session.role)) {
    redirect(adminPath());
  }
  return <>{children}</>;
}
