import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, ChefHat, UtensilsCrossed } from "lucide-react";

import heroFood from "@/assets/hero-food.jpg";
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
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-[oklch(0.98_0.02_130)] text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Hero image — capped so it never steals space from content on short screens */}
      <div className="relative h-[35dvh] max-h-[300px] min-h-0 w-full shrink-0 overflow-hidden">
        <img
          src={heroFood}
          alt="A warm plate of Nigerian jollof rice with chicken and plantain"
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[oklch(0.98_0.02_130)]" />

        {/* Top bar with logo */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-4">
          <img src={logoAsset.url} alt="MealBeta" className="h-8 w-auto drop-shadow" />
          <Link
            to="/auth"
            className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-charcoal shadow-sm backdrop-blur active:scale-95"
          >
            Sign in
          </Link>
        </div>

        {/* Floating badge */}
        <div className="absolute bottom-4 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-charcoal shadow-soft backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-warm" fill="currentColor" />
          AI meal planner for Nigeria
        </div>
      </div>

      {/* Content — distributed so nothing overlaps */}
      <div className="flex min-h-0 flex-1 flex-col justify-between px-6 pb-5 pt-5">
        <div className="shrink-0 space-y-2">
          <h1 className="font-display text-[clamp(1.625rem,6.5vw,2.25rem)] leading-[1.08] tracking-tight text-charcoal">
            Plan better.
            <br />
            Eat better.
            <br />
            <span className="text-warm">Spend</span> better.
          </h1>

          <p className="line-clamp-2 text-[14px] leading-snug text-muted-foreground">
            Weekly Nigerian meal plans, honest calorie & cost estimates, and chefs or restaurants near you.
          </p>
        </div>

        {/* Quick feature chips */}
        <div className="shrink-0 grid grid-cols-2 gap-2.5 pt-3">
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-charcoal">150+ meals</div>
              <div className="truncate text-[11px] text-muted-foreground">Naija dishes</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-warm/15 text-warm">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-charcoal">Private chefs</div>
              <div className="truncate text-[11px] text-muted-foreground">Book nearby</div>
            </div>
          </div>
        </div>

        {/* Actions pinned to bottom */}
        <div className="shrink-0 space-y-2.5 pt-4">
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-base font-semibold text-brand-foreground shadow-lift active:scale-[0.99]"
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
