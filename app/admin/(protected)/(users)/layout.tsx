import { redirect } from "next/navigation";
import { canManageUsers, getSessionRole } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-path";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionRole();
  if (!session || !canManageUsers(session.role)) {
    redirect(adminPath());
  }
  return <>{children}</>;
}
