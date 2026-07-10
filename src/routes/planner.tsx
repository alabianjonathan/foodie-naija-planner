import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { meals, getMeal, type Meal } from "@/data/meals";
import { Copy, Plus, RefreshCw, ShoppingBasket, Trash2, Utensils, X, Check, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planner")({ component: Planner });

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DEFAULT_SLOTS = ["Breakfast", "Lunch", "Dinner"] as const;
const QUICK_ADD = ["Breakfast", "Snack", "Lunch", "Dinner", "Late night"] as const;

type Slot = { id: string; name: string; mealId: string | null };
type Day = { slots: Slot[]; note: string };
type Plan = Day[];

const PLAN_KEY = "mealbeta:plan:v1";
const SHOPPING_KEY = "mealbeta:shopping:v1";

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function seedPlan(): Plan {
  return DAYS.map((_, di) => ({
    note: "",
    slots: DEFAULT_SLOTS.map((name, si) => {
      const pool = meals.filter(m => m.bestTime.includes(name as Meal["bestTime"][number]));
      const meal = pool[(di * 3 + si) % pool.length];
      return { id: uid(), name, mealId: meal?.id ?? null };
    }),
  }));
}

function loadPlan(): Plan {
  if (typeof window === "undefined") return seedPlan();
  try {
    const raw = window.localStorage.getItem(PLAN_KEY);
    if (!raw) return seedPlan();
    const parsed = JSON.parse(raw) as Plan;
    if (!Array.isArray(parsed) || parsed.length !== 7) return seedPlan();
    return parsed;
  } catch {
    return seedPlan();
  }
}

function Planner() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan>(() => seedPlan());
  const [activeDay, setActiveDay] = useState(0);
  const [picker, setPicker] = useState<{ dayIdx: number; slotId: string } | null>(null);
  const [addingSlot, setAddingSlot] = useState(false);
  const [customSlot, setCustomSlot] = useState("");
  const [query, setQuery] = useState("");

  // hydrate on mount to avoid SSR mismatch
  useEffect(() => { setPlan(loadPlan()); }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
  }, [plan]);

  const slotMeal = (s: Slot) => (s.mealId ? getMeal(s.mealId) : undefined);

  const dayCost = (i: number) => plan[i].slots.reduce((s, sl) => s + (slotMeal(sl)?.cookMin ?? 0), 0);
  const dayCal = (i: number) => plan[i].slots.reduce((s, sl) => {
    const m = slotMeal(sl); return s + (m ? (m.caloriesMin + m.caloriesMax) / 2 : 0);
  }, 0);
  const weekCost = plan.reduce((s, _, i) => s + dayCost(i), 0);
  const totalMeals = plan.reduce((s, d) => s + d.slots.filter(sl => sl.mealId).length, 0);

  const updateDay = (i: number, fn: (d: Day) => Day) => {
    setPlan(p => p.map((d, idx) => idx === i ? fn(d) : d));
  };

  const setSlotMeal = (dayIdx: number, slotId: string, mealId: string | null) => {
    updateDay(dayIdx, d => ({ ...d, slots: d.slots.map(s => s.id === slotId ? { ...s, mealId } : s) }));
  };
  const removeSlot = (dayIdx: number, slotId: string) => {
    updateDay(dayIdx, d => ({ ...d, slots: d.slots.filter(s => s.id !== slotId) }));
  };
  const addSlot = (name: string) => {
    if (!name.trim()) return;
    updateDay(activeDay, d => ({ ...d, slots: [...d.slots, { id: uid(), name: name.trim(), mealId: null }] }));
    setAddingSlot(false); setCustomSlot("");
  };
  const renameSlot = (slotId: string, name: string) => {
    updateDay(activeDay, d => ({ ...d, slots: d.slots.map(s => s.id === slotId ? { ...s, name } : s) }));
  };
  const copyFromPrev = () => {
    if (activeDay === 0) return;
    const prev = plan[activeDay - 1];
    updateDay(activeDay, () => ({ note: prev.note, slots: prev.slots.map(s => ({ ...s, id: uid() })) }));
    toast.success(`Copied from ${DAYS[activeDay - 1]}`);
  };
  const shuffleDay = () => {
    updateDay(activeDay, d => ({
      ...d,
      slots: d.slots.map(s => {
        const pool = meals.filter(m => !s.name || m.bestTime.some(b => b.toLowerCase() === s.name.toLowerCase()));
        const source = pool.length ? pool : meals;
        return { ...s, mealId: source[Math.floor(Math.random() * source.length)].id };
      }),
    }));
  };
  const clearWeek = () => {
    if (!confirm("Reset the entire week?")) return;
    setPlan(seedPlan());
    toast.success("Week reset");
  };

  const generateShoppingList = () => {
    const items = new Map<string, { name: string; qty: string; price: number; count: number; mealIds: Set<string> }>();
    plan.forEach(d => d.slots.forEach(s => {
      const m = slotMeal(s); if (!m) return;
      m.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase();
        const existing = items.get(key);
        if (existing) { existing.count += 1; existing.price += ing.price; existing.mealIds.add(m.id); }
        else items.set(key, { name: ing.name, qty: ing.qty, price: ing.price, count: 1, mealIds: new Set([m.id]) });
      });
    }));
    const shoppingItems = Array.from(items.values()).map(i => ({
      id: uid(), name: i.name, qty: i.count > 1 ? `${i.count} × ${i.qty}` : i.qty,
      price: i.price, mealId: Array.from(i.mealIds)[0] ?? "planner", checked: false,
    }));
    if (typeof window !== "undefined") window.localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingItems));
    toast.success(`Shopping list ready — ${shoppingItems.length} items`);
    navigate({ to: "/shopping" });
  };

  const pickerSlotName = picker ? plan[picker.dayIdx].slots.find(s => s.id === picker.slotId)?.name ?? "" : "";

  const { recommended, other } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (m: Meal) => !q || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
    const slotLower = pickerSlotName.toLowerCase();
    const rec: Meal[] = [];
    const oth: Meal[] = [];
    meals.forEach(m => {
      if (!matchesQuery(m)) return;
      const fits = !slotLower || m.bestTime.some(b => b.toLowerCase() === slotLower);
      if (fits) rec.push(m); else oth.push(m);
    });
    return { recommended: rec, other: oth };
  }, [pickerSlotName, query]);

  const handlePickMeal = (meal: Meal) => {
    if (!picker) return;
    const slotLower = pickerSlotName.toLowerCase();
    const fits = !slotLower || meal.bestTime.some(b => b.toLowerCase() === slotLower);
    setSlotMeal(picker.dayIdx, picker.slotId, meal.id);
    setPicker(null);
    if (!fits) {
      toast.warning(`${meal.name} isn't typically eaten for ${pickerSlotName}`, {
        description: `Best time: ${meal.bestTime.join(", ")}. Added anyway.`,
      });
    }
  };



  const day = plan[activeDay];

  return (
    <PhoneShell>
      <TopBar title="Meal planner" back="/home" right={
        <button onClick={clearWeek} title="Reset week" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <RefreshCw className="h-4 w-4" />
        </button>
      } />

      <div className="px-6 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-warm text-brand-foreground p-5 shadow-[var(--shadow-lift)]">
          <p className="text-xs opacity-80">This week</p>
          <p className="mt-1 font-display text-3xl">₦{weekCost.toLocaleString()}</p>
          <div className="mt-2 flex gap-3 text-xs opacity-90">
            <span>{totalMeals} meals planned</span>
            <span>·</span>
            <span>~₦{Math.round(weekCost / 7).toLocaleString()}/day</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => setActiveDay(i)}
              className={`min-w-[68px] rounded-2xl px-3 py-2.5 text-center transition-all ${activeDay === i ? "bg-brand text-brand-foreground shadow-[var(--shadow-soft)]" : "bg-secondary"}`}>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{d}</p>
              <p className="text-xs font-medium mt-0.5">{plan[i].slots.filter(s => s.mealId).length}/{plan[i].slots.length}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button disabled={activeDay === 0} onClick={copyFromPrev}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-medium disabled:opacity-40">
            <Copy className="h-3.5 w-3.5" /> Copy {activeDay > 0 ? DAYS[activeDay - 1] : "prev"}
          </button>
          <button onClick={shuffleDay}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-medium">
            <RefreshCw className="h-3.5 w-3.5" /> Shuffle day
          </button>
        </div>

        <input value={day.note} onChange={e => updateDay(activeDay, d => ({ ...d, note: e.target.value }))}
          placeholder={`Add a note for ${DAYS[activeDay]}… (guests, workout, fasting)`}
          className="mt-3 w-full rounded-2xl bg-card border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />

        <div className="mt-4 space-y-2.5">
          {day.slots.map(slot => {
            const m = slotMeal(slot);
            return (
              <div key={slot.id} className="card-soft !p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input value={slot.name} onChange={e => renameSlot(slot.id, e.target.value)}
                    className="flex-1 bg-transparent text-[10px] uppercase tracking-wider text-brand font-semibold focus:outline-none" />
                  <button onClick={() => removeSlot(activeDay, slot.id)}
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button onClick={() => { setQuery(""); setPicker({ dayIdx: activeDay, slotId: slot.id }); }}
                  className="w-full flex items-center gap-3 text-left">
                  {m ? (
                    <>
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>{m.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm leading-tight truncate">{m.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">₦{m.cookMin.toLocaleString()} · {Math.round((m.caloriesMin + m.caloriesMax) / 2)} kcal · {m.cookingTimeMin} min</p>
                      </div>
                      <span className="text-xs text-brand font-medium">Swap</span>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-2xl bg-secondary border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Utensils className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Pick a meal</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Tap to browse suggestions</p>
                      </div>
                      <Plus className="h-4 w-4 text-brand" />
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {addingSlot ? (
            <div className="card-soft !p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ADD.map(name => (
                  <button key={name} onClick={() => addSlot(name)} className="chip !bg-brand/10 !text-brand">
                    <Plus className="h-3 w-3" /> {name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input autoFocus value={customSlot} onChange={e => setCustomSlot(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addSlot(customSlot)}
                  placeholder="Or type a custom slot…"
                  className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
                <button onClick={() => setAddingSlot(false)} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingSlot(true)}
              className="w-full rounded-2xl border-2 border-dashed border-border py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand hover:border-brand transition-colors">
              <Plus className="h-4 w-4" /> Add slot
            </button>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-secondary p-3 flex items-center justify-between text-xs">
          <span className="font-medium">{DAYS[activeDay]} total</span>
          <span>~{Math.round(dayCal(activeDay))} kcal · ₦{dayCost(activeDay).toLocaleString()}</span>
        </div>

        <button onClick={generateShoppingList} disabled={totalMeals === 0}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-full bg-brand text-brand-foreground py-3.5 text-sm font-medium disabled:opacity-40 shadow-[var(--shadow-soft)]">
          <ShoppingBasket className="h-4 w-4" /> Generate shopping list
        </button>
      </div>

      <div className="h-6" />

      {picker && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
          onClick={() => setPicker(null)}>
          <div className="w-full max-w-[430px] bg-card rounded-t-3xl md:rounded-3xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">
                  {plan[picker.dayIdx].slots.find(s => s.id === picker.slotId)?.name}
                </p>
                <h3 className="font-display text-lg">Pick a meal</h3>
              </div>
              <button onClick={() => setPicker(null)} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pt-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search meals or category…"
                  className="w-full rounded-full bg-secondary pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <button onClick={() => { setSlotMeal(picker.dayIdx, picker.slotId, null); setPicker(null); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-secondary text-left">
                <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <X className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Clear meal</span>
              </button>

              {recommended.length > 0 && (
                <p className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-brand font-semibold">
                  Recommended for {pickerSlotName || "this slot"}
                </p>
              )}
              {recommended.map(m => {
                const selected = plan[picker.dayIdx].slots.find(s => s.id === picker.slotId)?.mealId === m.id;
                return (
                  <button key={m.id} onClick={() => handlePickMeal(m)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors ${selected ? "bg-brand/10" : "hover:bg-secondary"}`}>
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-xl flex-shrink-0`}>{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.category} · ₦{m.cookMin.toLocaleString()} · {m.cookingTimeMin} min</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-brand" />}
                  </button>
                );
              })}

              {other.length > 0 && (
                <p className="px-2 pt-3 pb-1 text-[10px] uppercase tracking-wider text-warm font-semibold flex items-center gap-1">
                  ⚠︎ Not typical for {pickerSlotName || "this slot"}
                </p>
              )}
              {other.map(m => {
                const selected = plan[picker.dayIdx].slots.find(s => s.id === picker.slotId)?.mealId === m.id;
                return (
                  <button key={m.id} onClick={() => handlePickMeal(m)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors border border-dashed border-warm/30 ${selected ? "bg-warm/10" : "hover:bg-warm/5"}`}>
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-xl flex-shrink-0 opacity-80`}>{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">Best: {m.bestTime.join(", ")}</p>
                    </div>
                    {selected && <Check className="h-4 w-4 text-warm" />}
                  </button>
                );
              })}

              {recommended.length === 0 && other.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No meals match "{query}"</p>
              )}
            </div>

          </div>
        </div>
      )}
    </PhoneShell>
  );
}
