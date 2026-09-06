import { isAdminAuthed } from "@/app/admin/actions";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthed();

  if (!authed) {
    return <AdminLoginForm />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
