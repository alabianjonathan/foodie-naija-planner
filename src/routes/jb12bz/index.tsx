import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  sampleUsers, sampleRestaurants, sampleMeals, sampleCities,
  samplePlans, sampleLeads,
} from "@/data/admin-sample";
import {
  Users, Store, UtensilsCrossed, MapPin, CalendarRange, Inbox, ShieldAlert, UserX,
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
  const totalAreas = sampleCities.reduce((n, c) => n + c.areas.length, 0);
  const pendingRestaurants = sampleRestaurants.filter((r) => r.status === "pending").length;
  const bannedUsers = sampleUsers.filter((u) => u.status === "banned").length;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform snapshot across users, restaurants, meals and leads." />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total users" value={sampleUsers.length} icon={Users} />
        <StatCard label="Restaurants" value={sampleRestaurants.length} icon={Store} />
        <StatCard label="Meals" value={sampleMeals.length} icon={UtensilsCrossed} />
        <StatCard label="Cities" value={sampleCities.length} icon={MapPin} />
        <StatCard label="Areas" value={totalAreas} icon={MapPin} tone="bg-warm/10 text-warm" />
        <StatCard label="Meal plans" value={samplePlans.length} icon={CalendarRange} tone="bg-warm/10 text-warm" />
        <StatCard label="Leads" value={sampleLeads.length} icon={Inbox} tone="bg-warm/10 text-warm" />
        <StatCard label="Pending approvals" value={pendingRestaurants} icon={ShieldAlert} tone="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recently added restaurants</h2>
            <span className="text-xs text-muted-foreground">{sampleRestaurants.length} total</span>
          </div>
          <ul className="divide-y">
            {sampleRestaurants.slice(0, 5).map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.area}, {r.city} · {r.cuisine}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Popular meals</h2>
            <span className="text-xs text-muted-foreground">Top 5</span>
          </div>
          <ul className="divide-y">
            {sampleMeals.slice(0, 5).map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.category} · ₦{m.cookMin}–₦{m.cookMax}</div>
                </div>
                <span className="text-xs text-muted-foreground">{m.cookingTime} min</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <UserX className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold">Attention</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="text-amber-800 font-medium">{pendingRestaurants} restaurants awaiting approval</div>
              <div className="text-xs text-amber-700 mt-1">Review and approve in Restaurants →</div>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="text-red-800 font-medium">{bannedUsers} banned users</div>
              <div className="text-xs text-red-700 mt-1">Manage in Users →</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-blue-800 font-medium">{sampleLeads.filter(l=>l.status==='pending').length} pending leads</div>
              <div className="text-xs text-blue-700 mt-1">Route in Leads →</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
