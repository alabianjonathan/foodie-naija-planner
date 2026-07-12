import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { sampleCategories } from "@/data/admin-sample";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export const Route = createFileRoute("/jb12bz/categories")({
  head: () => ({ meta: [{ title: "Categories — MealBeta Admin" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [items, setItems] = useState<string[]>(sampleCategories);
  const [adding, setAdding] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <div>
      <PageHeader title="Meal categories" subtitle="Broad groupings shown in the meals catalog." />
      <div className="bg-card border rounded-xl p-5 max-w-2xl">
        <div className="flex gap-2 mb-4">
          <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="New category name" className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
          <button onClick={() => { if (adding.trim()) { setItems((i) => [...i, adding.trim()]); setAdding(""); } }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add</button>
        </div>
        <ul className="divide-y">
          {items.map((c, idx) => (
            <li key={idx} className="py-3 flex items-center justify-between">
              {editingIdx === idx ? (
                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 mr-2 px-3 py-1.5 rounded border bg-background text-sm" />
              ) : (
                <span>{c}</span>
              )}
              <div className="flex items-center gap-1">
                {editingIdx === idx ? (
                  <>
                    <button onClick={() => { setItems((it) => it.map((x, i) => i === idx ? editValue : x)); setEditingIdx(null); }} className="p-1.5 rounded hover:bg-green-50 text-green-700"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingIdx(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <button onClick={() => { setEditingIdx(idx); setEditValue(c); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                )}
                <button onClick={() => setItems((it) => it.filter((_, i) => i !== idx))} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
