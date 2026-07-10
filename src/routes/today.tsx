import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { meals, type Meal } from "@/data/meals";
import { RefreshCw, Sparkles, Flame, Clock, Wallet, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyRecommendation, type DailyRecommendation } from "@/lib/recommendations.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/today")({ component: Today });

function Today() {
  const { user, loading: authLoading } = useRequireAuth();
  const generate = useServerFn(generateDailyRecommendation);
  const [rec, setRec] = useState<DailyRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await generate();
      setRec(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate today's meals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !rec && !loading) void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const picks = (rec?.picks ?? [])
    .map((p) => ({ slot: p.slot, reason: p.reason, meal: meals.find((m) => m.id === p.mealId) as Meal | undefined }))
    .filter((p) => p.meal);

  const totalCal = picks.reduce((s, p) => s + (p.meal!.caloriesMin + p.meal!.caloriesMax) / 2, 0);
  const totalCost = picks.reduce((s, p) => s + p.meal!.cookMin, 0);

  return (
    <PhoneShell>
      <TopBar title="What should I eat today?" back="/home" />

      <div className="px-6 pt-5">
        <div className="rounded-3xl bg-gradient-to-br from-leaf to-[oklch(0.45_0.15_150)] p-5 text-leaf-foreground">
          <div className="inline-flex items-center gap-1.5 text-xs bg-white/20 rounded-full px-2.5 py-1">
            <Sparkles className="h-3 w-3" /> Powered by MealBeta AI
          </div>
          <p className="mt-3 text-sm leading-relaxed min-h-[2.5rem]">
            {loading || authLoading
              ? "Reading your preferences and picking today's meals…"
              : rec?.summary ?? "Tap Regenerate to get your daily meal plan."}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {loading && picks.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
          )}
          {picks.map(({ slot, meal, reason }) => (
            <Link key={slot + meal!.id} to="/meal/$id" params={{ id: meal!.id }} className="flex items-start gap-4 card-soft !p-4">
              <div className={`h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${meal!.gradient} flex items-center justify-center text-3xl`}>{meal!.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{slot}</p>
                <h3 className="font-display text-base leading-tight truncate">{meal!.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{meal!.caloriesMin}–{meal!.caloriesMax} kcal</span>
                  <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />₦{meal!.cookMin.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{meal!.cookingTimeMin}m</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-leaf/10 text-leaf font-medium">Protein: {meal!.protein}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm/20 text-charcoal font-medium">Carbs: {meal!.carbs}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">Fat: {meal!.fat}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-charcoal font-medium">Fiber: {meal!.fiber}</span>
                </div>
                {reason && <p className="mt-1.5 text-xs text-charcoal/70 leading-snug">{reason}</p>}
              </div>
            </Link>
          ))}
        </div>

        {picks.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-4 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold">Today's total</p>
              <p className="text-muted-foreground text-xs">~{Math.round(totalCal).toLocaleString()} kcal · ~₦{totalCost.toLocaleString()}</p>
            </div>
            <button onClick={run} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="h-6" />
    </PhoneShell>
  );
}
