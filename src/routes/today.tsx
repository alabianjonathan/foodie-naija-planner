import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { meals } from "@/data/meals";
import { RefreshCw, Sparkles, Flame, Clock, Wallet } from "lucide-react";

export const Route = createFileRoute("/today")({
  component: Today,
});

const budgets = ["₦2,000", "₦5,000", "₦10,000"];
const goals = ["Weight loss", "Family meal", "Quick meal", "Healthy"];

function Today() {
  const [budget, setBudget] = useState("₦5,000");
  const [goal, setGoal] = useState("Family meal");
  const [seed, setSeed] = useState(0);

  const picks = useMemo(() => {
    const budgetMax = budget === "₦2,000" ? 2500 : budget === "₦5,000" ? 6000 : 15000;
    const pool = meals.filter(m => m.cookMin <= budgetMax);
    const shuffled = [...pool].sort(() => Math.sin(seed + pool.indexOf(pool[0])) - 0.5);
    const bf = shuffled.find(m => m.bestTime.includes("Breakfast")) ?? meals[3];
    const lu = shuffled.find(m => m.bestTime.includes("Lunch") && m.id !== bf.id) ?? meals[0];
    const di = shuffled.find(m => m.bestTime.includes("Dinner") && m.id !== bf.id && m.id !== lu.id) ?? meals[2];
    return [
      { slot: "Breakfast", meal: bf },
      { slot: "Lunch", meal: lu },
      { slot: "Dinner", meal: di },
    ];
  }, [budget, goal, seed]);

  const totalCal = picks.reduce((s, p) => s + (p.meal.caloriesMin + p.meal.caloriesMax) / 2, 0);
  const totalCost = picks.reduce((s, p) => s + p.meal.cookMin, 0);

  return (
    <PhoneShell>
      <TopBar title="What should I eat today?" back="/home" />

      <div className="px-6 pt-5">
        <div className="rounded-3xl bg-gradient-to-br from-leaf to-[oklch(0.45_0.15_150)] p-5 text-leaf-foreground">
          <div className="inline-flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-2.5 py-1">
            <Sparkles className="h-3 w-3" /> Powered by MealBeta AI
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            Based on your <b>{budget}</b> daily budget and <b>{goal}</b> goal, MealBeta suggests these 3 meals for today.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Budget</p>
          <div className="flex gap-2">
            {budgets.map(b => (
              <button key={b} onClick={() => setBudget(b)} className={`px-4 py-2 rounded-full text-sm font-medium ${budget === b ? "bg-brand text-brand-foreground" : "bg-secondary"}`}>{b}</button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Goal</p>
          <div className="flex gap-2 flex-wrap">
            {goals.map(g => (
              <button key={g} onClick={() => setGoal(g)} className={`px-4 py-2 rounded-full text-sm font-medium ${goal === g ? "bg-charcoal text-background" : "bg-secondary"}`}>{g}</button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {picks.map(({ slot, meal }) => (
            <Link key={slot} to="/meal/$id" params={{ id: meal.id }} className="flex items-center gap-4 card-soft !p-4">
              <div className={`h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-3xl`}>{meal.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{slot}</p>
                <h3 className="font-display text-base leading-tight truncate">{meal.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{meal.caloriesMin}–{meal.caloriesMax}</span>
                  <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />₦{meal.cookMin.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{meal.cookingTimeMin}m</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-border p-4 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold">Today's total</p>
            <p className="text-muted-foreground text-xs">~{Math.round(totalCal).toLocaleString()} kcal · ~₦{totalCost.toLocaleString()}</p>
          </div>
          <button onClick={() => setSeed(s => s + 1)} className="inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-medium">
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      </div>

      <div className="h-6" />
    </PhoneShell>
  );
}
