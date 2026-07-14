import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { Loader2, HeartOff } from "lucide-react";
import { useRequireAuth } from "@/hooks/useAuth";
import { useSavedMeals, useToggleSavedMeal } from "@/hooks/useSavedMeals";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentMealPlan } from "@/lib/user-data.functions";

export const Route = createFileRoute("/saved")({ component: Saved });

function Saved() {
  const { user, loading } = useRequireAuth();
  const [tab, setTab] = useState<"meals" | "plans">("meals");
  const { data: saved = [], isLoading } = useSavedMeals();
  const toggle = useToggleSavedMeal();

  const getPlan = useServerFn(getCurrentMealPlan);
  const { data: plan } = useQuery({
    queryKey: ["current-plan", user?.id],
    enabled: !!user && tab === "plans",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryFn: () => getPlan() as unknown as Promise<any>,
  });

  if (loading || !user) return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;

  return (
    <PhoneShell>
      <TopBar title="Saved" back="/dashboard" />
      <div className="px-6 pt-4">
        <div className="flex gap-2 rounded-full bg-secondary p-1">
          {(["meals", "plans"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-sm font-medium capitalize transition-all ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
              {t === "meals" ? "Meals" : "Meal plans"}
            </button>
          ))}
        </div>

        {tab === "meals" ? (
          isLoading ? <div className="mt-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div> :
          saved.length === 0 ? (
            <div className="mt-10 text-center text-sm text-muted-foreground">
              <p>No saved meals yet.</p>
              <Link to="/popular" className="mt-3 inline-block text-brand font-medium">Browse meals →</Link>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-4">
              {saved.map(m => (
                <div key={m.id} className="relative">
                  <Link to="/meal/$id" params={{ id: m.slug }} className="card-soft block">
                    <div className={`aspect-square rounded-2xl bg-gradient-to-br ${m.gradient ?? "from-warm to-brand"} flex items-center justify-center text-5xl mb-3`}>{m.emoji}</div>
                    <h3 className="font-display text-base leading-tight">{m.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{m.cookingTimeMin} min · {m.caloriesMin}–{m.caloriesMax} kcal</p>
                  </Link>
                  <button
                    aria-label="Remove from saved"
                    onClick={() => toggle.mutate({ mealId: m.id, saved: false })}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow"
                  ><HeartOff className="h-4 w-4 text-brand" /></button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="mt-5 space-y-3">
            {!plan ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                <p>No meal plan yet.</p>
                <Link to="/planner" className="mt-3 inline-block text-brand font-medium">Create one →</Link>
              </div>
            ) : (
              <div className="card-soft !p-4">
                <h3 className="font-display text-base">{plan.plan_type ?? "Meal plan"}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.city ?? "—"} · Budget {plan.budget ?? "—"} · {plan.total_calories ?? 0} kcal
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
