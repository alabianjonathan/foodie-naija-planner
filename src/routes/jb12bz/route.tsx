import { createFileRoute, Outlet, redirect, useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export type AdminRole = "super_admin" | "admin" | "restaurant";

export const Route = createFileRoute("/jb12bz")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/jb12bz-login" });

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = new Set((roleRows ?? []).map((r) => r.role));
    const role: AdminRole | null = roles.has("super_admin")
      ? "super_admin"
      : roles.has("admin")
        ? "admin"
        : roles.has("restaurant")
          ? "restaurant"
          : null;
    if (!role) throw redirect({ to: "/" });
    return { adminRole: role, adminEmail: user.email ?? "" };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminRole, adminEmail } = useRouteContext({ from: "/jb12bz" });
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar role={adminRole} email={adminEmail} />
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
