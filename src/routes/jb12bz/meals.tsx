import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { adminListMeals, adminDeleteMeal, adminToggleMealStatus } from "@/lib/admin-catalog.functions";
import { Trash2 } from "lucide-react";

type Row = {
  id: string; slug: string; name: string; category: string; description: string | null;
  cook_min: number; cook_max: number; order_min: number; order_max: number; cooking_time_min: number;
  calories_min: number; calories_max: number; best_time: string[]; goals: string[]; status: string;
};

export const Route = createFileRoute("/jb12bz/meals")({
  head: () => ({ meta: [{ title: "Meals — MealBeta Admin" }] }),
  component: MealsPage,
});

function MealsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListMeals);
  const del = useServerFn(adminDeleteMeal);
  const toggle = useServerFn(adminToggleMealStatus);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin", "meals"], queryFn: () => list() as unknown as Promise<Row[]> });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "meals"] });
  const remove = useMutation({ mutationFn: (v: { id: string }) => del({ data: v }), onSuccess: invalidate });
  const setStatus = useMutation({ mutationFn: (v: { id: string; status: string }) => toggle({ data: v }), onSuccess: invalidate });

  return (
    <div>
      <PageHeader title="Meals" subtitle="Meal catalog shared with the customer app. Edits appear instantly." />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <DataTable<Row>
          rows={rows}
          searchKeys={["name", "category"]}
          columns={[
            { key: "name", header: "Meal", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground truncate max-w-xs">{r.description}</div></div> },
            { key: "category", header: "Category" },
            { key: "cook", header: "Cook cost", render: (r) => `₦${r.cook_min.toLocaleString()}–₦${r.cook_max.toLocaleString()}` },
            { key: "order", header: "Order cost", render: (r) => `₦${r.order_min.toLocaleString()}–₦${r.order_max.toLocaleString()}` },
            { key: "cal", header: "Calories", render: (r) => `${r.calories_min}–${r.calories_max}` },
            { key: "time", header: "Time", render: (r) => `${r.cooking_time_min}m` },
            { key: "best", header: "Best time", render: (r) => r.best_time.join(", ") },
            { key: "status", header: "Status", render: (r) => <button onClick={() => setStatus.mutate({ id: r.id, status: r.status === "active" ? "inactive" : "active" })}><StatusPill status={r.status} /></button> },
          ]}
          actions={(r) => (
            <button title="Delete" onClick={() => { if (confirm(`Delete ${r.name}?`)) remove.mutate({ id: r.id }); }} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
          )}
        />
      )}
    </div>
  );
}
