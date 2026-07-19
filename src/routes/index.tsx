import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ChefHat, UtensilsCrossed, Flame, Beef, Leaf, Wheat } from "lucide-react";

import heroFood from "@/assets/hero-food.jpg.asset.json";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MealBeta — Plan Better. Eat Better. Spend Better." },
      {
        name: "description",
        content:
          "Nigeria's AI meal planning assistant. Decide what to eat, plan the week, estimate cost and calories, and find chefs and restaurants near you.",
      },
      { name: "theme-color", content: "#2e9d3a" },
      { property: "og:title", content: "MealBeta — Plan meals, track cost, eat better" },
      {
        property: "og:description",
        content:
          "AI meal planning for Nigerian kitchens. Weekly plans, calorie & cost estimates, chefs and restaurants near you.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mealbeta.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/" }],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        setChecking(false);
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.session.user.id)
        .maybeSingle();
      navigate({ to: p?.onboarded ? "/dashboard" : "/onboarding" });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Hero image — full-bleed with floating nutrition badges */}
      <div className="relative h-[45dvh] min-h-0 w-full shrink-0 overflow-hidden">
        <img
          src={heroFood.url}
          alt="A warm plate of Nigerian fried rice with chicken, plantain and nutrition labels"
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-background" />

        {/* Top bar with logo */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
          <div className="rounded-full bg-white/95 p-2 shadow-sm backdrop-blur">
            <img src={logoAsset.url} alt="MealBeta" className="h-6 w-auto" />
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-charcoal shadow-sm backdrop-blur active:scale-95"
          >
            Sign in
          </Link>
        </div>

        {/* Floating nutrition badges */}
        <div className="pointer-events-none absolute inset-0">
          {/* Calories */}
          <div className="absolute left-[8%] top-[18%] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-warm/15 text-warm">
              <Flame className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Calories</div>
              <div className="text-xs font-bold text-charcoal">650–850 kcal</div>
            </div>
          </div>

          {/* Protein */}
          <div className="absolute left-[6%] top-[44%] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand/15 text-brand">
              <Beef className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Protein</div>
              <div className="text-xs font-bold text-charcoal">30–40g</div>
            </div>
          </div>

          {/* Fibre */}
          <div className="absolute left-[8%] top-[68%] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-leaf/15 text-leaf">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Fibre</div>
              <div className="text-xs font-bold text-charcoal">4–6g</div>
            </div>
          </div>

          {/* Carbs */}
          <div className="absolute right-[8%] top-[58%] flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/80 text-accent-foreground">
              <Wheat className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Carbs</div>
              <div className="text-xs font-bold text-charcoal">80–100g</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content — distributed so nothing overlaps */}
      <div className="flex min-h-0 flex-1 flex-col justify-between px-6 pb-6 pt-5">
        <div className="shrink-0 space-y-3">
          {/* AI badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-warm/10 px-3 py-1.5 text-[11px] font-semibold text-warm">
            <Sparkles className="h-3.5 w-3.5" fill="currentColor" />
            AI meal planner for Nigeria
          </div>

          <p className="font-display text-[clamp(1.5rem,5.5vw,2rem)] leading-[1.15] tracking-tight text-charcoal">
            Weekly meal plans for everyone, honest calorie & cost estimates, and book a chef or order from a restaurant near you.
          </p>
        </div>

        {/* Quick feature chips */}
        <div className="shrink-0 grid grid-cols-2 gap-3 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-charcoal">150+ meals</div>
              <div className="truncate text-[11px] text-muted-foreground">Naija dishes</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-soft">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-charcoal">Private chefs</div>
              <div className="truncate text-[11px] text-muted-foreground">Book nearby</div>
            </div>
          </div>
        </div>

        {/* Actions pinned to bottom */}
        <div className="shrink-0 space-y-3 pt-4">
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-base font-semibold text-brand-foreground shadow-lift active:scale-[0.99]"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </Link>

          {!checking && (
            <p className="text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="font-semibold text-brand">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
