import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { sampleNutrition, type AdminNutrition } from "@/data/admin-sample";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — MealBeta Admin" }] }),
  component: NutritionPage,
});

function NutritionPage() {
  const [rows, setRows] = useState<AdminNutrition[]>(sampleNutrition);
  return (
    <div>
      <PageHeader title="Nutrition & calories" subtitle="Nutrition profile for each meal, powering health scores and goal filters." />
      <DataTable<AdminNutrition>
        rows={rows}
        searchKeys={["meal"]}
        columns={[
          { key: "meal", header: "Meal", render: (r) => <div className="font-medium">{r.meal}</div> },
          { key: "serving", header: "Serving" },
          { key: "cal", header: "Calories", render: (r) => `${r.caloriesMin}–${r.caloriesMax}` },
          { key: "protein", header: "Protein", render: (r) => `${r.protein}g` },
          { key: "carbs", header: "Carbs", render: (r) => `${r.carbs}g` },
          { key: "fat", header: "Fat", render: (r) => `${r.fat}g` },
          { key: "fiber", header: "Fiber", render: (r) => `${r.fiber}g` },
          { key: "sodium", header: "Sodium", render: (r) => `${r.sodium}mg` },
          { key: "score", header: "Health", render: (r) => <span className="font-medium">{r.healthScore}/10</span> },
          { key: "goals", header: "Goals", render: (r) => <div className="flex gap-1 flex-wrap">{r.goals.map((g) => <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-muted">{g}</span>)}</div> },
        ]}
        actions={(r) => <button onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>}
      />
    </div>
  );
}
