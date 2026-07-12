import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { sampleIngredients, type AdminIngredient } from "@/data/admin-sample";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/ingredients")({
  head: () => ({ meta: [{ title: "Ingredients — MealBeta Admin" }] }),
  component: IngredientsPage,
});

function IngredientsPage() {
  const [rows, setRows] = useState<AdminIngredient[]>(sampleIngredients);
  const [showForm, setShowForm] = useState(false);
  const remove = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle="Market prices per city, used to estimate meal cooking cost."
        actions={<button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add ingredient</button>}
      />
      {showForm && <IngForm onCancel={() => setShowForm(false)} onSave={(i) => { setRows((r) => [i, ...r]); setShowForm(false); }} />}

      <DataTable<AdminIngredient>
        rows={rows}
        searchKeys={["name", "city", "unit"]}
        columns={[
          { key: "name", header: "Ingredient" },
          { key: "unit", header: "Unit" },
          { key: "avgPrice", header: "Avg price", render: (r) => `₦${r.avgPrice.toLocaleString()}` },
          { key: "city", header: "City" },
          { key: "updated", header: "Last updated" },
        ]}
        actions={(r) => <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>}
      />
    </div>
  );
}

function IngForm({ onSave, onCancel }: { onSave: (i: AdminIngredient) => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<AdminIngredient>>({});
  const set = <K extends keyof AdminIngredient>(k: K, v: AdminIngredient[K]) => setF((p) => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ id: `i${Date.now()}`, name: "", unit: "kg", avgPrice: 0, city: "Lagos", updated: new Date().toISOString().slice(0,10), ...f } as AdminIngredient); }}
      className="mb-6 bg-card border rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
      <input required placeholder="Name" className={input} onChange={(e) => set("name", e.target.value)} />
      <input placeholder="Unit (kg, L, piece)" className={input} onChange={(e) => set("unit", e.target.value)} />
      <input type="number" placeholder="Avg price ₦" className={input} onChange={(e) => set("avgPrice", Number(e.target.value))} />
      <input placeholder="City" className={input} onChange={(e) => set("city", e.target.value)} />
      <div className="md:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm">Save</button>
      </div>
    </form>
  );
}
