import { redirect } from "next/navigation";
import { canManageContent, getSessionRole } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export default async function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionRole();
  if (!session || !canManageContent(session.role)) {
    redirect(adminPath());
  }
  return <>{children}</>;
}
