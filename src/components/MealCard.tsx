import { Link } from "@tanstack/react-router";
import { Clock, Flame } from "lucide-react";
import type { Meal } from "@/data/meals";

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <Link
      to="/meal/$id"
      params={{ id: meal.id }}
      className="group block card-soft hover:shadow-[var(--shadow-lift)] transition-shadow"
    >
      <div className={`aspect-[16/10] rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-6xl mb-4`}>
        <span className="drop-shadow-lg">{meal.emoji}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg leading-tight">{meal.name}</h3>
        <span className="chip !bg-leaf/10 !text-leaf">₦{meal.cookMin.toLocaleString()}+</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> {meal.caloriesMin}–{meal.caloriesMax} kcal</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {meal.cookingTimeMin} min</span>
      </div>
    </Link>
  );
}
