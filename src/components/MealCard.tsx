import { Link } from "@tanstack/react-router";
import { Clock, Flame } from "lucide-react";
import type { UiMeal } from "@/hooks/useCatalogMeals";

export function MealCard({ meal }: { meal: UiMeal }) {

  return (
    <Link
      to="/meal/$id"
      params={{ id: meal.id }}
      className="group block card-soft hover:shadow-[var(--shadow-lift)] transition-shadow"
    >
      <div className={`aspect-[16/10] rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-6xl mb-4`}>
        <span className="drop-shadow-lg">{meal.emoji}</span>
      </div>
      <h3 className="font-display text-base leading-tight line-clamp-2 min-h-[2.5rem]">{meal.name}</h3>
      <div className="mt-2">
        <span className="inline-flex chip !bg-leaf/10 !text-leaf !px-2 !py-0.5 text-xs whitespace-nowrap">₦{meal.cookMin.toLocaleString()}+</span>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" /> {meal.caloriesMin}–{meal.caloriesMax}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {meal.cookingTimeMin}m</span>
      </div>
    </Link>
  );
}
