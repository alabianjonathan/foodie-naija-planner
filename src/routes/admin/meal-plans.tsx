import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { samplePlans, type AdminPlan } from "@/data/admin-sample";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/meal-plans")({
  head: () => ({ meta: [{ title: "Meal Plans — MealBeta Admin" }] }),
  component: PlansPage,
});

function PlansPage() {
  const [rows, setRows] = useState<AdminPlan[]>(samplePlans);
  return (
    <div>
      <PageHeader title="Meal plans" subtitle="AI-generated plans across users, filterable by city and budget." />
      <DataTable<AdminPlan>
        rows={rows}
        searchKeys={["user", "city", "planType"]}
        columns={[
          { key: "user", header: "User" },
          { key: "planType", header: "Plan type" },
          { key: "city", header: "City" },
          { key: "budget", header: "Daily budget" },
          { key: "cost", header: "Est. cost", render: (r) => `₦${r.totalCost.toLocaleString()}` },
          { key: "cal", header: "Est. calories", render: (r) => r.totalCalories.toLocaleString() },
          { key: "date", header: "Created" },
        ]}
        actions={(r) => <button onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>}
      />
    </div>
  );
}
