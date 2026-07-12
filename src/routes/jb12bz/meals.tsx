import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { adminListMeals, adminDeleteMeal, adminToggleMealStatus, adminUpsertMeal } from "@/lib/admin-catalog.functions";
import { Trash2, Pencil, Plus } from "lucide-react";

type Row = {
  id: string; slug: string; name: string; category: string; emoji: string | null; gradient: string | null;
  description: string | null;
  cook_min: number; cook_max: number; order_min: number; order_max: number; cooking_time_min: number;
  calories_min: number; calories_max: number; best_time: string[]; goals: string[]; status: string;
  protein: string | null; carbs: string | null; fat: string | null; fiber: string | null; portion: string | null;
  health_score: number | null; health_note: string | null; popular: boolean;
  ingredients: { name: string; qty: string; price: number }[];
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
  const upsert = useServerFn(adminUpsertMeal);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin", "meals"], queryFn: () => list() as unknown as Promise<Row[]> });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "meals"] });
  const remove = useMutation({ mutationFn: (v: { id: string }) => del({ data: v }), onSuccess: invalidate });
  const setStatus = useMutation({ mutationFn: (v: { id: string; status: string }) => toggle({ data: v }), onSuccess: invalidate });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = useMutation({ mutationFn: (v: any) => (upsert as any)({ data: v }), onSuccess: invalidate });
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader title="Meals" subtitle="Meal catalog shared with the customer app. Edits appear instantly."
        actions={<button onClick={() => setCreating(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add meal</button>}
      />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}
      {(creating || editing) && (
        <MealForm
          initial={editing ?? undefined}
          onCancel={() => { setEditing(null); setCreating(false); }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSave={(v: any) => { save.mutate(v); setEditing(null); setCreating(false); }}
        />
      )}
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <DataTable<Row>
          rows={rows}
          searchKeys={["name", "category", "slug"]}
          columns={[
            { key: "name", header: "Meal", render: (r) => <div><div className="font-medium">{r.emoji} {r.name}</div><div className="text-xs text-muted-foreground truncate max-w-xs">{r.slug}</div></div> },
            { key: "category", header: "Category" },
            { key: "cook", header: "Cook cost", render: (r) => `₦${r.cook_min.toLocaleString()}–₦${r.cook_max.toLocaleString()}` },
            { key: "cal", header: "Calories", render: (r) => `${r.calories_min}–${r.calories_max}` },
            { key: "time", header: "Time", render: (r) => `${r.cooking_time_min}m` },
            { key: "best", header: "Best time", render: (r) => r.best_time.join(", ") },
            { key: "status", header: "Status", render: (r) => <button onClick={() => setStatus.mutate({ id: r.id, status: r.status === "active" ? "inactive" : "active" })}><StatusPill status={r.status} /></button> },
          ]}
          actions={(r) => (
            <div className="flex items-center gap-1 justify-end">
              <button title="Edit" onClick={() => setEditing(r)} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <button title="Delete" onClick={() => { if (confirm(`Delete ${r.name}?`)) remove.mutate({ id: r.id }); }} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MealForm({ initial, onSave, onCancel }: { initial?: Row; onSave: (v: any) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    id: initial?.id,
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    category: initial?.category ?? "Rice",
    emoji: initial?.emoji ?? "🍽️",
    gradient: initial?.gradient ?? "from-orange-400 to-red-500",
    description: initial?.description ?? "",
    best_time: (initial?.best_time ?? ["Lunch"]).join(","),
    cook_min: initial?.cook_min ?? 0,
    cook_max: initial?.cook_max ?? 0,
    order_min: initial?.order_min ?? 0,
    order_max: initial?.order_max ?? 0,
    cooking_time_min: initial?.cooking_time_min ?? 30,
    calories_min: initial?.calories_min ?? 0,
    calories_max: initial?.calories_max ?? 0,
    protein: initial?.protein ?? "Medium",
    carbs: initial?.carbs ?? "Medium",
    fat: initial?.fat ?? "Medium",
    fiber: initial?.fiber ?? "Medium",
    portion: initial?.portion ?? "1 plate",
    health_score: initial?.health_score ?? 6,
    health_note: initial?.health_note ?? "",
    goals: (initial?.goals ?? []).join(","),
    ingredients: JSON.stringify(initial?.ingredients ?? [], null, 2),
    popular: initial?.popular ?? false,
    status: initial?.status ?? "active",
  });
  const input = "w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let ings: unknown = [];
    try { ings = JSON.parse(f.ingredients); } catch { alert("Invalid ingredients JSON"); return; }
    onSave({
      id: f.id, slug: f.slug, name: f.name, category: f.category,
      emoji: f.emoji, gradient: f.gradient, description: f.description,
      best_time: f.best_time.split(",").map((s) => s.trim()).filter(Boolean),
      cook_min: Number(f.cook_min), cook_max: Number(f.cook_max),
      order_min: Number(f.order_min), order_max: Number(f.order_max),
      cooking_time_min: Number(f.cooking_time_min),
      calories_min: Number(f.calories_min), calories_max: Number(f.calories_max),
      protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber, portion: f.portion,
      health_score: Number(f.health_score), health_note: f.health_note,
      goals: f.goals.split(",").map((s) => s.trim()).filter(Boolean),
      ingredients: ings, popular: f.popular, status: f.status,
    });
  };
  return (
    <form onSubmit={submit} className="mb-6 bg-card border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input required placeholder="Slug" className={input} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
      <input required placeholder="Name" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input required placeholder="Category" className={input} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
      <input placeholder="Emoji" className={input} value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} />
      <input placeholder="Gradient (from-x to-y)" className={input} value={f.gradient} onChange={(e) => setF({ ...f, gradient: e.target.value })} />
      <input placeholder="Best time (Breakfast,Lunch,Dinner)" className={input} value={f.best_time} onChange={(e) => setF({ ...f, best_time: e.target.value })} />
      <input type="number" placeholder="Cook cost min" className={input} value={f.cook_min} onChange={(e) => setF({ ...f, cook_min: Number(e.target.value) })} />
      <input type="number" placeholder="Cook cost max" className={input} value={f.cook_max} onChange={(e) => setF({ ...f, cook_max: Number(e.target.value) })} />
      <input type="number" placeholder="Order cost min" className={input} value={f.order_min} onChange={(e) => setF({ ...f, order_min: Number(e.target.value) })} />
      <input type="number" placeholder="Order cost max" className={input} value={f.order_max} onChange={(e) => setF({ ...f, order_max: Number(e.target.value) })} />
      <input type="number" placeholder="Cooking time (min)" className={input} value={f.cooking_time_min} onChange={(e) => setF({ ...f, cooking_time_min: Number(e.target.value) })} />
      <input type="number" placeholder="Calories min" className={input} value={f.calories_min} onChange={(e) => setF({ ...f, calories_min: Number(e.target.value) })} />
      <input type="number" placeholder="Calories max" className={input} value={f.calories_max} onChange={(e) => setF({ ...f, calories_max: Number(e.target.value) })} />
      <select className={input} value={f.protein} onChange={(e) => setF({ ...f, protein: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
      <select className={input} value={f.carbs} onChange={(e) => setF({ ...f, carbs: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
      <select className={input} value={f.fat} onChange={(e) => setF({ ...f, fat: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
      <select className={input} value={f.fiber} onChange={(e) => setF({ ...f, fiber: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
      <input placeholder="Portion (e.g. 1 plate)" className={input} value={f.portion} onChange={(e) => setF({ ...f, portion: e.target.value })} />
      <input type="number" placeholder="Health score 1-10" className={input} value={f.health_score} onChange={(e) => setF({ ...f, health_score: Number(e.target.value) })} />
      <input placeholder="Goals (comma-separated)" className={input} value={f.goals} onChange={(e) => setF({ ...f, goals: e.target.value })} />
      <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select>
      <label className="flex items-center gap-2 text-sm px-3"><input type="checkbox" checked={f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} /> Popular</label>
      <textarea placeholder="Description" className={`${input} md:col-span-3`} rows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      <textarea placeholder="Health note" className={`${input} md:col-span-3`} rows={2} value={f.health_note} onChange={(e) => setF({ ...f, health_note: e.target.value })} />
      <textarea placeholder='Ingredients JSON: [{"name":"Rice","qty":"1 cup","price":800}]' className={`${input} font-mono text-xs md:col-span-3`} rows={5} value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} />
      <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm">{initial ? "Update meal" : "Create meal"}</button>
      </div>
    </form>
  );
}
