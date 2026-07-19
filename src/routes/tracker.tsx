import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  getDaySummary,
  getRangeSummary,
  getGoals,
  updateGoals,
  logWater,
  logWeight,
  logActivity,
  logMeal,
  deleteLog,
  getStreakAndAchievements,
  getAIInsights,
  type NutritionGoals,
} from "@/lib/nutrition-tracker.functions";
import { useCatalogMeals } from "@/hooks/useCatalogMeals";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRequireAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Droplets, Scale, Activity, Utensils, Flame, Trash2, Sparkles, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/tracker")({
  component: TrackerPage,
});

function pct(value: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

function TrackerPage() {
  const { user, loading } = useRequireAuth();
  const qc = useQueryClient();
  const [range, setRange] = useState<"day" | "week" | "month">("day");

  const fetchDay = useServerFn(getDaySummary);
  const fetchRange = useServerFn(getRangeSummary);
  const fetchGoals = useServerFn(getGoals);
  const fetchStreak = useServerFn(getStreakAndAchievements);
  const fetchInsights = useServerFn(getAIInsights);

  const day = useQuery({ queryKey: ["tracker", "day"], queryFn: () => fetchDay({ data: {} }) });
  const week = useQuery({ queryKey: ["tracker", "range", "week"], queryFn: () => fetchRange({ data: { range: "week" } }) });
  const month = useQuery({ queryKey: ["tracker", "range", "month"], queryFn: () => fetchRange({ data: { range: "month" } }), enabled: range === "month" });
  const goals = useQuery({ queryKey: ["tracker", "goals"], queryFn: () => fetchGoals() });
  const streak = useQuery({ queryKey: ["tracker", "streak"], queryFn: () => fetchStreak() });
  const insights = useQuery({ queryKey: ["tracker", "insights"], queryFn: () => fetchInsights(), staleTime: 30 * 60 * 1000 });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tracker"] });
  };

  const waterMut = useMutation({ mutationFn: useServerFn(logWater), onSuccess: () => { invalidate(); toast.success("Water logged"); } });
  const weightMut = useMutation({ mutationFn: useServerFn(logWeight), onSuccess: () => { invalidate(); toast.success("Weight logged"); } });
  const activityMut = useMutation({ mutationFn: useServerFn(logActivity), onSuccess: () => { invalidate(); toast.success("Activity logged"); } });
  const mealMut = useMutation({ mutationFn: useServerFn(logMeal), onSuccess: () => { invalidate(); toast.success("Meal logged"); } });
  const delMut = useMutation({ mutationFn: useServerFn(deleteLog), onSuccess: () => { invalidate(); toast.success("Removed"); } });

  const g = goals.data;
  const d = day.data;

  return (
    <PhoneShell>
      <header className="px-5 pt-6 pb-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Nutrition tracker</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Your progress</h1>
        <p className="text-sm text-muted-foreground mt-1">Log what you eat, drink, and do — see honest weekly trends.</p>
      </header>

      {/* Streak */}
      <section className="px-5 mt-2 flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <div className="rounded-full bg-warm/30 px-3 py-1.5 text-xs font-medium text-charcoal whitespace-nowrap">
          🔥 {streak.data?.current_streak ?? 0}-day streak
        </div>
        <div className="rounded-full bg-secondary px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">
          Best {streak.data?.longest_streak ?? 0}
        </div>
        {(streak.data?.achievements ?? []).map((a) => (
          <div key={a.id} className="rounded-full bg-brand/10 text-brand px-3 py-1.5 text-xs font-medium whitespace-nowrap">
            {a.emoji} {a.label}
          </div>
        ))}
      </section>

      {/* Today card */}
      {day.isLoading || !d || !g ? (
        <div className="px-5 mt-4"><div className="rounded-3xl bg-card p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div></div>
      ) : (
        <section className="px-5 mt-4">
          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Today</p>
                <h2 className="font-display text-2xl mt-1">{d.calories.toLocaleString()} <span className="text-sm text-muted-foreground font-sans">/ {g.daily_calories.toLocaleString()} kcal</span></h2>
              </div>
              <div className="h-14 w-14 rounded-full grid place-items-center bg-brand/10 text-brand">
                <Flame className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <MacroBar label="Protein" value={d.protein_g} goal={g.protein_g} unit="g" color="bg-brand" />
              <MacroBar label="Carbs" value={d.carbs_g} goal={g.carbs_g} unit="g" color="bg-warm" />
              <MacroBar label="Fat" value={d.fat_g} goal={g.fat_g} unit="g" color="bg-leaf" />
              <MacroBar label="Fibre" value={d.fiber_g} goal={g.fiber_g} unit="g" color="bg-[oklch(0.7_0.15_140)]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-secondary p-3">
                <Droplets className="h-4 w-4 mx-auto text-brand" />
                <p className="text-lg font-display mt-1">{Math.round(d.water_ml / 250)}</p>
                <p className="text-[10px] text-muted-foreground">glasses / {Math.round(g.water_ml / 250)}</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <Activity className="h-4 w-4 mx-auto text-brand" />
                <p className="text-lg font-display mt-1">{d.activity_minutes}</p>
                <p className="text-[10px] text-muted-foreground">min / {g.activity_target_min}</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <Scale className="h-4 w-4 mx-auto text-brand" />
                <p className="text-lg font-display mt-1">{d.weight_kg ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">kg today</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick add */}
      <section className="px-5 mt-4 grid grid-cols-4 gap-2">
        <LogMealSheet onSubmit={(v) => mealMut.mutate({ data: v })} />
        <QuickBtn icon={<Droplets className="h-4 w-4" />} label="Water" onClick={() => waterMut.mutate({ data: { water_ml: 250 } })} />
        <LogWeightSheet onSubmit={(v) => weightMut.mutate({ data: v })} />
        <LogActivitySheet onSubmit={(v) => activityMut.mutate({ data: v })} />
      </section>

      {/* Charts */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl">Progress</h2>
          <div className="inline-flex rounded-full bg-secondary p-1 text-xs">
            {(["day", "week", "month"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full ${range === r ? "bg-white text-brand shadow-sm" : "text-muted-foreground"}`}>
                {r === "day" ? "Day" : r === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-soft)] h-[220px]">
          {range === "day" && d ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Cal", value: pct(d.calories, g?.daily_calories ?? 2000) },
                { name: "Protein", value: pct(d.protein_g, g?.protein_g ?? 90) },
                { name: "Carbs", value: pct(d.carbs_g, g?.carbs_g ?? 250) },
                { name: "Fat", value: pct(d.fat_g, g?.fat_g ?? 65) },
                { name: "Fibre", value: pct(d.fiber_g, g?.fiber_g ?? 25) },
                { name: "Water", value: pct(d.water_ml, g?.water_ml ?? 2500) },
              ]}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Bar dataKey="value" fill="oklch(0.55 0.16 145)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(range === "week" ? week.data : month.data) ?? []}>
                <defs>
                  <linearGradient id="cal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.16 145)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.55 0.16 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="calories" stroke="oklch(0.55 0.16 145)" fill="url(#cal)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* AI Insights */}
      <section className="px-5 mt-6">
        <div className="rounded-3xl bg-gradient-to-br from-brand/10 to-warm/20 p-5">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-widest font-medium">Personalised AI insight</p>
          </div>
          {insights.isLoading ? (
            <div className="mt-3 flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
          ) : (
            <>
              <h3 className="font-display text-lg mt-2">{insights.data?.headline}</h3>
              <p className="text-sm text-charcoal/80 mt-2">💡 {insights.data?.tip}</p>
              <p className="text-sm text-charcoal/80 mt-1">👉 {insights.data?.nudge}</p>
              <button
                onClick={() => qc.invalidateQueries({ queryKey: ["tracker", "insights"] })}
                className="mt-3 text-xs text-brand font-medium underline underline-offset-4"
              >
                Refresh insight
              </button>
            </>
          )}
        </div>
      </section>

      {/* Today's log entries */}
      {d && d.logs.length > 0 && (
        <section className="px-5 mt-6">
          <h2 className="font-display text-xl mb-3">Today's log</h2>
          <ul className="space-y-2">
            {d.logs.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)]">
                <div className="h-9 w-9 rounded-xl bg-secondary grid place-items-center">
                  {l.entry_type === "meal" ? <Utensils className="h-4 w-4 text-brand" /> :
                   l.entry_type === "water" ? <Droplets className="h-4 w-4 text-brand" /> :
                   l.entry_type === "weight" ? <Scale className="h-4 w-4 text-brand" /> :
                   <Activity className="h-4 w-4 text-brand" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {l.entry_type === "meal" ? `${l.food_name ?? "Meal"} · ${l.meal_slot}` :
                     l.entry_type === "water" ? `${l.water_ml}ml water` :
                     l.entry_type === "weight" ? `${l.weight_kg}kg` :
                     `${l.activity_type} · ${l.activity_minutes}m`}
                  </p>
                  {l.entry_type === "meal" && l.calories != null && (
                    <p className="text-[11px] text-muted-foreground">{l.calories} kcal · P{l.protein_g ?? 0} C{l.carbs_g ?? 0} F{l.fat_g ?? 0}</p>
                  )}
                </div>
                <button onClick={() => delMut.mutate({ data: { id: l.id } })} aria-label="Delete" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Goals */}
      <section className="px-5 mt-6">
        {g && <GoalsSheet goals={g} onSave={(v) => updateGoalsClient(v, qc)} />}
      </section>

      <div className="h-8" />
    </PhoneShell>
  );
}

function MacroBar({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const p = pct(value, goal);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{value}{unit} / {goal}{unit}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)] flex flex-col items-center gap-1 text-xs font-medium text-charcoal hover:bg-brand/5 transition">
      <span className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center">{icon}</span>
      {label}
    </button>
  );
}

function LogMealSheet({ onSubmit }: { onSubmit: (v: { meal_id?: string; meal_slot: "breakfast" | "lunch" | "dinner" | "snack"; food_name?: string; servings: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");
  const [mealId, setMealId] = useState<string>("");
  const [servings, setServings] = useState(1);
  const [search, setSearch] = useState("");
  const { meals } = useCatalogMeals();
  const filtered = meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 12);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)] flex flex-col items-center gap-1 text-xs font-medium text-charcoal">
          <span className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center"><Utensils className="h-4 w-4" /></span>
          Meal
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>Log a meal</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Meal slot</Label>
            <div className="mt-1 grid grid-cols-4 gap-1">
              {(["breakfast", "lunch", "dinner", "snack"] as const).map((s) => (
                <button key={s} onClick={() => setSlot(s)} className={`rounded-full text-xs py-2 capitalize ${slot === s ? "bg-brand text-brand-foreground" : "bg-secondary"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Search meals</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Jollof rice, egusi…" />
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border">
              {filtered.map((m) => (
                <button key={m.id} onClick={() => { setMealId(m.uuid); setSearch(m.name); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${mealId === m.uuid ? "bg-brand/10" : ""}`}>
                  {m.emoji} {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Servings</Label>
            <Input type="number" min={0.25} step={0.25} value={servings} onChange={(e) => setServings(Number(e.target.value))} />
          </div>
          <Button className="w-full" disabled={!mealId} onClick={() => { onSubmit({ meal_id: mealId, meal_slot: slot, servings }); setOpen(false); setMealId(""); setSearch(""); }}>
            Log meal
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LogWeightSheet({ onSubmit }: { onSubmit: (v: { weight_kg: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState(70);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)] flex flex-col items-center gap-1 text-xs font-medium text-charcoal">
          <span className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center"><Scale className="h-4 w-4" /></span>
          Weight
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>Log weight</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <Label className="text-xs">Weight (kg)</Label>
          <Input type="number" step={0.1} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
          <Button className="w-full" onClick={() => { onSubmit({ weight_kg: kg }); setOpen(false); }}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LogActivitySheet({ onSubmit }: { onSubmit: (v: { activity_type: string; activity_minutes: number }) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("Walk");
  const [min, setMin] = useState(30);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)] flex flex-col items-center gap-1 text-xs font-medium text-charcoal">
          <span className="h-9 w-9 rounded-xl bg-brand/10 text-brand grid place-items-center"><Activity className="h-4 w-4" /></span>
          Activity
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>Log activity</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs">Activity</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {["Walk", "Run", "Gym", "Cycling", "Football", "Yoga"].map((t) => (
                <button key={t} onClick={() => setType(t)} className={`rounded-full px-3 py-1.5 text-xs ${type === t ? "bg-brand text-brand-foreground" : "bg-secondary"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Minutes</Label>
            <Input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
          </div>
          <Button className="w-full" onClick={() => { onSubmit({ activity_type: type, activity_minutes: min }); setOpen(false); }}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GoalsSheet({ goals, onSave }: { goals: NutritionGoals; onSave: (v: NutritionGoals) => void }) {
  const [open, setOpen] = useState(false);
  const [g, setG] = useState<NutritionGoals>(goals);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-full rounded-2xl bg-secondary p-4 flex items-center gap-3 text-left">
          <TrendingUp className="h-5 w-5 text-brand" />
          <div className="flex-1">
            <p className="text-sm font-medium">Edit goals</p>
            <p className="text-[11px] text-muted-foreground">{goals.daily_calories} kcal · {goals.protein_g}g protein · {Math.round(goals.water_ml / 250)} glasses · {goals.goal_type}</p>
          </div>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader><SheetTitle>Your nutrition goals</SheetTitle></SheetHeader>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumField label="Calories" value={g.daily_calories} onChange={(v) => setG({ ...g, daily_calories: v })} />
          <NumField label="Protein (g)" value={g.protein_g} onChange={(v) => setG({ ...g, protein_g: v })} />
          <NumField label="Carbs (g)" value={g.carbs_g} onChange={(v) => setG({ ...g, carbs_g: v })} />
          <NumField label="Fat (g)" value={g.fat_g} onChange={(v) => setG({ ...g, fat_g: v })} />
          <NumField label="Fibre (g)" value={g.fiber_g} onChange={(v) => setG({ ...g, fiber_g: v })} />
          <NumField label="Water (ml)" value={g.water_ml} onChange={(v) => setG({ ...g, water_ml: v })} />
          <NumField label="Activity (min)" value={g.activity_target_min} onChange={(v) => setG({ ...g, activity_target_min: v })} />
          <NumField label="Target weight (kg)" value={g.weight_target_kg ?? 0} onChange={(v) => setG({ ...g, weight_target_kg: v || null })} />
        </div>
        <div className="mt-3">
          <Label className="text-xs">Goal</Label>
          <div className="mt-1 flex gap-2">
            {(["lose", "maintain", "gain"] as const).map((t) => (
              <button key={t} onClick={() => setG({ ...g, goal_type: t })} className={`flex-1 rounded-full py-2 text-xs capitalize ${g.goal_type === t ? "bg-brand text-brand-foreground" : "bg-secondary"}`}>{t}</button>
            ))}
          </div>
        </div>
        <Button className="w-full mt-4" onClick={() => { onSave(g); setOpen(false); }}>Save goals</Button>
      </SheetContent>
    </Sheet>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </div>
  );
}

// Small wrapper to call updateGoals from a plain fn context
function updateGoalsClient(v: NutritionGoals, qc: ReturnType<typeof useQueryClient>) {
  import("@/lib/nutrition-tracker.functions").then(({ updateGoals }) => {
    void updateGoals({ data: v }).then(() => {
      qc.invalidateQueries({ queryKey: ["tracker"] });
      toast.success("Goals updated");
    });
  });
}
