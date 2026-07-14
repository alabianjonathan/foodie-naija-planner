import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { Share2, Plus, Trash2, Check, ChefHat } from "lucide-react";

export const Route = createFileRoute("/shopping")({ component: Shopping });

const SHOPPING_KEY = "mealbeta:shopping:v1";

type Item = { id: string; name: string; qty: string; price: number; mealId: string; checked: boolean };


function Shopping() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SHOPPING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Item[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(SHOPPING_KEY, JSON.stringify(items));
  }, [items]);

  const toggle = (id: string) => setItems(items => items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id: string) => setItems(items => items.filter(i => i.id !== id));
  const clearDone = () => setItems(items => items.filter(i => !i.checked));
  const add = () => {
    if (!newItem.trim()) return;
    setItems([{ id: crypto.randomUUID(), name: newItem, qty: "1", price: 0, mealId: "custom", checked: false }, ...items]);
    setNewItem("");
  };

  const total = items.filter(i => !i.checked).reduce((s, i) => s + i.price, 0);
  const done = items.filter(i => i.checked).length;


  return (
    <PhoneShell>
      <TopBar title="Shopping list" back="/planner" right={
        <button className="h-10 w-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
          <Share2 className="h-4 w-4" />
        </button>
      } />

      <div className="px-6 pt-4">
        <div className="rounded-3xl bg-leaf text-leaf-foreground p-5">
          <p className="text-xs opacity-80">Estimated total</p>
          <p className="mt-1 font-display text-3xl">₦{total.toLocaleString()}</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs opacity-80">{done}/{items.length} items picked up</p>
            {done > 0 && (
              <button onClick={clearDone} className="text-xs underline opacity-90">Clear done</button>
            )}
          </div>
        </div>


        <div className="mt-5 flex gap-2">
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder="Add item…" className="flex-1 rounded-full bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <button onClick={add} className="h-11 w-11 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <ul className="mt-5 space-y-2">
          {items.map(item => (
            <li key={item.id} className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${item.checked ? "bg-secondary/50" : "bg-card shadow-[var(--shadow-soft)]"}`}>
              <button onClick={() => toggle(item.id)}
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.checked ? "bg-leaf border-leaf" : "border-border"}`}>
                {item.checked && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.qty}</p>
              </div>
              <span className="text-xs text-muted-foreground">₦{item.price.toLocaleString()}</span>
              <button onClick={() => remove(item.id)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="h-6" />
    </PhoneShell>
  );
}
