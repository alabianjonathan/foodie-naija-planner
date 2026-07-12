import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminDashboardStats } from "@/lib/admin-catalog.functions";
import {
  Users, Store, UtensilsCrossed, MapPin, CalendarRange, Inbox, ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/jb12bz/")({
  head: () => ({ meta: [{ title: "Dashboard — MealBeta Admin" }] }),
  component: DashboardPage,
});

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: React.ElementType; tone?: string }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`h-8 w-8 rounded-lg grid place-items-center ${tone ?? "bg-brand/10 text-brand"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

function DashboardPage() {
  const fetchStats = useServerFn(adminDashboardStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform snapshot across users, restaurants, meals and leads." />
      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm p-3 mb-4">
          Failed to load stats: {(error as Error).message}
        </div>
      ) : null}
      {isLoading || !data ? (
        <div className="text-sm text-muted-foreground p-4">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total users" value={data.totalUsers} icon={Users} />
            <StatCard label="Restaurants" value={data.totalRestaurants} icon={Store} />
            <StatCard label="Meals" value={data.totalMeals} icon={UtensilsCrossed} />
            <StatCard label="Cities" value={data.totalCities} icon={MapPin} />
            <StatCard label="Areas" value={data.totalAreas} icon={MapPin} tone="bg-warm/10 text-warm" />
            <StatCard label="Meal plans" value={data.totalMealPlans} icon={CalendarRange} tone="bg-warm/10 text-warm" />
            <StatCard label="Leads" value={data.totalLeads} icon={Inbox} tone="bg-warm/10 text-warm" />
            <StatCard label="Pending approvals" value={data.pendingRestaurants} icon={ShieldAlert} tone="bg-amber-100 text-amber-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recently added restaurants</h2>
                <span className="text-xs text-muted-foreground">{data.totalRestaurants} total</span>
              </div>
              <ul className="divide-y">
                {data.recentRestaurants.map((r) => (
                  <li key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.area ?? "—"}, {r.city}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
                  </li>
                ))}
                {data.recentRestaurants.length === 0 && <li className="py-3 text-xs text-muted-foreground">No restaurants yet.</li>}
              </ul>
            </div>

            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Meals</h2>
                <span className="text-xs text-muted-foreground">Top 5</span>
              </div>
              <ul className="divide-y">
                {data.popularMeals.map((m) => (
                  <li key={m.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.category} · ₦{m.cook_min}–₦{m.cook_max}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">{m.cooking_time} min</span>
                  </li>
                ))}
                {data.popularMeals.length === 0 && <li className="py-3 text-xs text-muted-foreground">No meals yet.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
