import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { adminListMealPlans } from "@/lib/admin-catalog.functions";

type Row = {
  id: string; user_id: string; plan_type: string | null; city: string | null;
  budget: string | null; total_cost: number; total_calories: number; created_at: string;
  profiles?: { display_name: string | null } | null;
};

export const Route = createFileRoute("/jb12bz/meal-plans")({
  head: () => ({ meta: [{ title: "Meal Plans — MealBeta Admin" }] }),
  component: MealPlansPage,
});

function MealPlansPage() {
  const list = useServerFn(adminListMealPlans);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin", "meal-plans"], queryFn: () => list() as unknown as Promise<Row[]> });

  return (
    <div>
      <PageHeader title="Meal plans" subtitle="All plans users have generated in the app." />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : rows.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-sm text-muted-foreground">No meal plans saved yet.</div>
      ) : (
        <DataTable<Row>
          rows={rows}
          searchKeys={["plan_type", "city", "budget"]}
          columns={[
            { key: "user", header: "Customer", render: (r) => r.profiles?.display_name ?? "—" },
            { key: "plan", header: "Plan type", render: (r) => r.plan_type ?? "—" },
            { key: "city", header: "City", render: (r) => r.city ?? "—" },
            { key: "budget", header: "Budget", render: (r) => r.budget ?? "—" },
            { key: "cost", header: "Total cost", render: (r) => `₦${Number(r.total_cost).toLocaleString()}` },
            { key: "cal", header: "Total calories", render: (r) => r.total_calories.toLocaleString() },
            { key: "date", header: "Created", render: (r) => new Date(r.created_at).toLocaleDateString() },
          ]}
        />
      )}
    </div>
  );
}
