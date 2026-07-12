import { createFileRoute, Outlet, redirect, useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export type AdminRole = "super_admin" | "admin" | "restaurant";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin-login" });

    const [{ data: isSuper }, { data: isAdmin }, { data: isRest }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "super_admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "restaurant" }),
    ]);

    const role: AdminRole | null = isSuper ? "super_admin" : isAdmin ? "admin" : isRest ? "restaurant" : null;
    if (!role) throw redirect({ to: "/" });
    return { adminRole: role, adminEmail: user.email ?? "" };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminRole, adminEmail } = useRouteContext({ from: "/admin" });
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar role={adminRole} email={adminEmail} />
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
