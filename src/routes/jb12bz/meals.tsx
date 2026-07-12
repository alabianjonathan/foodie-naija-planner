import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { sampleMeals, sampleCategories, type AdminMeal } from "@/data/admin-sample";
import { Plus, Trash2, ImagePlus } from "lucide-react";

export const Route = createFileRoute("/admin/meals")({
  head: () => ({ meta: [{ title: "Meals — MealBeta Admin" }] }),
  component: MealsPage,
});

function MealsPage() {
  const [rows, setRows] = useState<AdminMeal[]>(sampleMeals);
  const [showForm, setShowForm] = useState(false);
  const toggle = (id: string) => setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r));
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  return (
    <div>
      <PageHeader
        title="Meals"
        subtitle="Manage the meal catalog: names, prices, cooking time, and tags."
        actions={<button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add meal</button>}
      />
      {showForm && <MealForm onCancel={() => setShowForm(false)} onSave={(m) => { setRows((r) => [m, ...r]); setShowForm(false); }} />}
      <DataTable<AdminMeal>
        rows={rows}
        searchKeys={["name", "category", "bestTime"]}
        columns={[
          { key: "name", header: "Meal", render: (r) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground truncate max-w-xs">{r.description}</div></div> },
          { key: "category", header: "Category" },
          { key: "cook", header: "Cook cost", render: (r) => `₦${r.cookMin.toLocaleString()}–₦${r.cookMax.toLocaleString()}` },
          { key: "rest", header: "Restaurant price", render: (r) => `₦${r.restaurantMin.toLocaleString()}–₦${r.restaurantMax.toLocaleString()}` },
          { key: "time", header: "Time", render: (r) => `${r.cookingTime}m` },
          { key: "best", header: "Best time", render: (r) => r.bestTime },
          { key: "tags", header: "Tags", render: (r) => <div className="flex gap-1 flex-wrap">{r.tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-muted">{t}</span>)}</div> },
          { key: "status", header: "Status", render: (r) => <button onClick={() => toggle(r.id)}><StatusPill status={r.status} /></button> },
        ]}
        actions={(r) => (
          <button title="Delete" onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
        )}
      />
    </div>
  );
}

function MealForm({ onSave, onCancel }: { onSave: (m: AdminMeal) => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<AdminMeal>>({ bestTime: "Lunch", tags: [], status: "active", cookingTime: 30 });
  const set = <K extends keyof AdminMeal>(k: K, v: AdminMeal[K]) => setF((p) => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand";
  const submit = (e: React.FormEvent) => { e.preventDefault(); onSave({
    id: `m${Date.now()}`, name: "", category: "", description: "", cookingTime: 30,
    cookMin: 0, cookMax: 0, restaurantMin: 0, restaurantMax: 0, bestTime: "Lunch", tags: [], status: "active", ...f,
  } as AdminMeal); };
  return (
    <form onSubmit={submit} className="mb-6 bg-card border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input required placeholder="Meal name" className={input} onChange={(e) => set("name", e.target.value)} />
      <select className={input} defaultValue="" onChange={(e) => set("category", e.target.value)}>
        <option value="" disabled>Choose category</option>
        {sampleCategories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select className={input} defaultValue="Lunch" onChange={(e) => set("bestTime", e.target.value)}>
        {["Breakfast", "Lunch", "Dinner", "Snack"].map((t) => <option key={t}>{t}</option>)}
      </select>
      <textarea placeholder="Description" className={`${input} md:col-span-3`} rows={2} onChange={(e) => set("description", e.target.value)} />
      <input type="number" placeholder="Cooking time (min)" className={input} onChange={(e) => set("cookingTime", Number(e.target.value))} />
      <input type="number" placeholder="Cook cost min ₦" className={input} onChange={(e) => set("cookMin", Number(e.target.value))} />
      <input type="number" placeholder="Cook cost max ₦" className={input} onChange={(e) => set("cookMax", Number(e.target.value))} />
      <input type="number" placeholder="Restaurant price min ₦" className={input} onChange={(e) => set("restaurantMin", Number(e.target.value))} />
      <input type="number" placeholder="Restaurant price max ₦" className={input} onChange={(e) => set("restaurantMax", Number(e.target.value))} />
      <input placeholder="Tags (comma separated)" className={input} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
      <div className="md:col-span-3 flex items-center justify-between pt-2">
        <button type="button" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ImagePlus className="h-4 w-4" /> Upload image (coming soon)</button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
          <button type="submit" className="px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm">Save meal</button>
        </div>
      </div>
    </form>
  );
}
