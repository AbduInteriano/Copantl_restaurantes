import { redirect } from "next/navigation";
import { getSessionRole, isAdminRole } from "@/lib/admin-auth";

export default async function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionRole();
  if (!session || !isAdminRole(session.role)) {
    redirect("/admin");
  }
  return <>{children}</>;
}
