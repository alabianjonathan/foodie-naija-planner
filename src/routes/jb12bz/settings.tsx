import { createFileRoute, useRouteContext, Navigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";

export const Route = createFileRoute("/jb12bz/settings")({
  head: () => ({ meta: [{ title: "Settings — MealBeta Admin" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { adminRole } = useRouteContext({ from: "/jb12bz" });
  if (adminRole !== "super_admin") return <Navigate to="/jb12bz" />;

  return (
    <div>
      <PageHeader title="Platform settings" subtitle="Super admin only. Global configuration for MealBeta." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        <SettingCard title="Branding" desc="Logo, primary colors, app name shown to customers." />
        <SettingCard title="Feature flags" desc="Turn planner, restaurant discovery, or leads on/off globally." />
        <SettingCard title="Support" desc="Support email and WhatsApp shown across the app." />
        <SettingCard title="Data retention" desc="How long meal plans and lead history are kept." />
      </div>
    </div>
  );
}

function SettingCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
      <button className="mt-3 text-sm text-brand hover:underline">Configure →</button>
    </div>
  );
}
