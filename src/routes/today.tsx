import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { RefreshCw, Sparkles, Flame, Clock, Wallet, Loader2, Leaf, ArrowRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateDailyRecommendation, type DailyRecommendation } from "@/lib/recommendations.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { useCatalogMeals, type UiMeal } from "@/hooks/useCatalogMeals";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/today")({ component: Today });

function Today() {
  const { user, loading: authLoading } = useRequireAuth();
  const { getMeal } = useCatalogMeals();
  const generate = useServerFn(generateDailyRecommendation);
  const [rec, setRec] = useState<DailyRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<{ meal: UiMeal; slot: string; reason: string } | null>(null);

  const run = async (avoidCurrent = false) => {
    setLoading(true);
    try {
      const avoidIds = avoidCurrent && rec ? rec.picks.map((p) => p.mealId) : [];
      const r = await generate({ data: { avoidIds } });
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
    .map((p) => {
      const meal = getMeal(p.mealId);
      return meal ? { slot: p.slot as string, reason: p.reason, meal } : null;
    })
    .filter((p): p is { slot: string; reason: string; meal: UiMeal } => p !== null);


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
            <button
              key={slot + meal.id}
              onClick={() => setOpen({ meal, slot, reason })}
              className="w-full text-left flex items-start gap-4 card-soft !p-4 hover:border-brand/40 transition-colors"
            >
              <div className={`h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-3xl`}>{meal.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{slot}</p>
                <h3 className="font-display text-base leading-tight truncate">{meal.name}</h3>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{meal.caloriesMin}–{meal.caloriesMax} kcal</span>
                  <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />₦{meal.cookMin.toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{meal.cookingTimeMin}m</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-leaf/10 text-leaf font-medium">Protein: {meal.protein}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm/20 text-charcoal font-medium">Carbs: {meal.carbs}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">Fat: {meal.fat}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-charcoal font-medium">Fiber: {meal.fiber}</span>
                </div>
                {reason && <p className="mt-1.5 text-xs text-charcoal/70 leading-snug">{reason}</p>}
                <p className="mt-1.5 text-[11px] text-brand font-medium">Tap for full nutrition →</p>
              </div>
            </button>
          ))}
        </div>

        {picks.length > 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-4 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-semibold">Today's total</p>
              <p className="text-muted-foreground text-xs">~{Math.round(totalCal).toLocaleString()} kcal · ~₦{totalCost.toLocaleString()}</p>
            </div>
            <button onClick={() => run(true)} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-medium disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate
            </button>
          </div>
        )}
      </div>

      <div className="h-6" />

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          {open && (
            <>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${open.meal.gradient} flex items-center justify-center text-2xl`}>{open.meal.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{open.slot}</p>
                    <DialogTitle className="font-display text-lg leading-tight">{open.meal.name}</DialogTitle>
                    <DialogDescription className="text-xs">{open.meal.portion} · {open.meal.category}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-brand/5 p-3 text-center">
                  <Flame className="h-4 w-4 text-brand mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Calories</p>
                  <p className="text-sm font-semibold">{open.meal.caloriesMin}–{open.meal.caloriesMax}</p>
                </div>
                <div className="rounded-2xl bg-leaf/5 p-3 text-center">
                  <Leaf className="h-4 w-4 text-leaf mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Health</p>
                  <p className="text-sm font-semibold">{open.meal.healthScore}/10</p>
                </div>
                <div className="rounded-2xl bg-warm/10 p-3 text-center">
                  <Clock className="h-4 w-4 text-charcoal mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Cook time</p>
                  <p className="text-sm font-semibold">{open.meal.cookingTimeMin}m</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Nutrition breakdown</p>
                <div className="space-y-2">
                  {[
                    { label: "Protein", val: open.meal.protein },
                    { label: "Carbs", val: open.meal.carbs },
                    { label: "Fat", val: open.meal.fat },
                    { label: "Fiber", val: open.meal.fiber },
                  ].map((n) => {
                    const w = n.val === "High" ? "w-full" : n.val === "Medium" ? "w-2/3" : "w-1/3";
                    return (
                      <div key={n.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{n.label}</span>
                          <span className="text-muted-foreground">{n.val}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full bg-brand ${w}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-secondary/50 p-3">
                <p className="text-xs font-semibold mb-1">Why this pick</p>
                <p className="text-xs text-charcoal/80 leading-relaxed">{open.reason || open.meal.healthNote}</p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="text-muted-foreground">Cook cost</p>
                  <p className="font-semibold text-sm">₦{open.meal.cookMin.toLocaleString()}–{open.meal.cookMax.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Order</p>
                  <p className="font-semibold text-sm">₦{open.meal.orderMin.toLocaleString()}–{open.meal.orderMax.toLocaleString()}</p>
                </div>
              </div>

              <Link
                to="/meal/$id"
                params={{ id: open.meal.id }}
                className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground py-3 text-sm font-medium"
              >
                View full meal <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PhoneShell>
  );
}
