import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { meals } from "@/data/meals";
import { RefreshCw, Share2, ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/planner")({ component: Planner });

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const slots = ["Breakfast", "Lunch", "Dinner"] as const;

function pick(seed: number, filter: (m: typeof meals[number]) => boolean) {
  const pool = meals.filter(filter);
  return pool[seed % pool.length];
}

function Planner() {
  const [seed, setSeed] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  const plan = useMemo(() => days.map((_, di) => ({
    Breakfast: pick(seed + di * 3, m => m.bestTime.includes("Breakfast")),
    Lunch: pick(seed + di * 3 + 1, m => m.bestTime.includes("Lunch")),
    Dinner: pick(seed + di * 3 + 2, m => m.bestTime.includes("Dinner")),
  })), [seed]);

  const dayCost = (i: number) => Object.values(plan[i]).reduce((s, m) => s + m.cookMin, 0);
  const dayCal = (i: number) => Object.values(plan[i]).reduce((s, m) => s + (m.caloriesMin + m.caloriesMax) / 2, 0);
  const weekCost = plan.reduce((s, _, i) => s + dayCost(i), 0);

  return (
    <PhoneShell>
      <TopBar title="Weekly meal planner" back="/home" right={
        <button onClick={() => setSeed(s => s + 1)} className="h-10 w-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
          <RefreshCw className="h-4 w-4" />
        </button>
      } />

      <div className="px-6 pt-4">
        <div className="rounded-3xl bg-gradient-to-br from-charcoal to-[oklch(0.3_0.03_60)] text-background p-5">
          <p className="text-xs opacity-70">This week's plan</p>
          <p className="mt-1 font-display text-3xl">₦{weekCost.toLocaleString()}</p>
          <div className="mt-3 flex gap-4 text-xs opacity-90">
            <span>~{Math.round(weekCost / 7).toLocaleString()}/day</span>
            <span>·</span>
            <span>21 meals</span>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
          {days.map((d, i) => (
            <button key={d} onClick={() => setActiveDay(i)}
              className={`min-w-[64px] rounded-2xl px-3 py-2.5 text-center transition-all ${activeDay === i ? "bg-brand text-brand-foreground" : "bg-secondary"}`}>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{d}</p>
              <p className="text-xs font-medium mt-0.5">₦{Math.round(dayCost(i) / 1000)}k</p>
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {slots.map(slot => {
            const m = plan[activeDay][slot];
            return (
              <Link key={slot} to="/meal/$id" params={{ id: m.id }} className="flex items-center gap-4 card-soft !p-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-2xl`}>{m.emoji}</div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{slot}</p>
                  <h3 className="font-medium text-sm leading-tight">{m.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">₦{m.cookMin.toLocaleString()} · {Math.round((m.caloriesMin+m.caloriesMax)/2)} kcal</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-secondary p-3 flex items-center justify-between text-xs">
          <span className="font-medium">{days[activeDay]} total</span>
          <span>~{Math.round(dayCal(activeDay))} kcal · ₦{dayCost(activeDay).toLocaleString()}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-medium">
            <Share2 className="h-4 w-4" /> WhatsApp
          </button>
          <Link to="/shopping" className="flex items-center justify-center gap-2 rounded-full bg-brand text-brand-foreground py-3.5 text-sm font-medium">
            <ShoppingBasket className="h-4 w-4" /> Shopping list
          </Link>
        </div>
      </div>

      <div className="h-6" />
    </PhoneShell>
  );
}
