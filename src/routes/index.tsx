import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import heroFood from "@/assets/hero-food.jpg";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";
import { ArrowRight, CalendarCheck, Flame, Sparkles, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: p } = await supabase.from("profiles").select("onboarded").eq("id", data.session.user.id).maybeSingle();
      navigate({ to: p?.onboarded ? "/home" : "/onboarding" });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh w-full bg-background">
      <div className="mx-auto w-full max-w-[480px] min-h-dvh bg-background overflow-hidden flex flex-col relative">
        {/* Decorative leaf accents */}
        <div className="absolute top-[18%] -right-6 text-brand/10 pointer-events-none">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,13.37,11,10,17,8Z" />
          </svg>
        </div>
        <div className="absolute bottom-[22%] -left-8 text-leaf/10 pointer-events-none rotate-[-15deg]">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,13.37,11,10,17,8Z" />
          </svg>
        </div>

        {/* Hero image banner */}
        <div className="relative h-[44dvh] min-h-[280px] overflow-hidden rounded-b-[3rem]">
          <img
            src={heroFood}
            alt="Nigerian jollof rice with chicken and plantain"
            width={1200}
            height={1200}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-background" />
          <div className="absolute top-4 left-4 pt-[env(safe-area-inset-top)]">
            <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg p-2 pr-3 flex items-center gap-2">
              <img src={logoAsset.url} alt="MealBeta" className="h-8 w-auto" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col relative z-10">
          <div className="flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.94_0.04_145/0.35)] px-3 py-1.5 text-xs font-semibold text-[oklch(0.45_0.12_145)]">
              <Sparkles className="h-3.5 w-3.5 text-warm" fill="currentColor" /> AI meal planner for Nigeria
            </span>

            <h1 className="mt-4 font-display text-[clamp(2rem,9.5vw,2.85rem)] leading-[1.05] tracking-tight">
              <span className="text-[oklch(0.35_0.08_145)]">Plan your</span><br />
              <span className="text-warm">NEXT</span>
              <span className="text-[oklch(0.35_0.08_145)]"> meals</span>
            </h1>

            <p className="mt-3 text-muted-foreground text-[15px] leading-relaxed max-w-[340px]">
              Plan meals, compare prices, track calories, and find nearby food spots.
            </p>

            {/* Feature cards */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-card p-3.5 shadow-[0_6px_20px_-8px_oklch(0.35_0.05_40/0.18)] flex flex-col items-center gap-2.5 border border-border/50">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-[oklch(0.94_0.04_145/0.5)] flex items-center justify-center text-[oklch(0.45_0.12_145)]">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-warm flex items-center justify-center text-white">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground">Meal Plans</span>
                <div className="h-1 w-6 rounded-full bg-brand/30" />
              </div>

              <div className="rounded-2xl bg-card p-3.5 shadow-[0_6px_20px_-8px_oklch(0.35_0.05_40/0.18)] flex flex-col items-center gap-2.5 border border-border/50">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-[oklch(0.94_0.04_80/0.5)] flex items-center justify-center text-warm">
                    <Flame className="h-5 w-5" fill="currentColor" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-md bg-warm px-1 py-0.5 text-[8px] font-bold text-white leading-none">
                    kcal
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground">Calories</span>
                <div className="h-1 w-6 rounded-full bg-brand/30" />
              </div>

              <div className="rounded-2xl bg-card p-3.5 shadow-[0_6px_20px_-8px_oklch(0.35_0.05_40/0.18)] flex flex-col items-center gap-2.5 border border-border/50">
                <div className="relative">
                  <div className="h-10 w-10 rounded-xl bg-[oklch(0.94_0.04_145/0.5)] flex items-center justify-center text-[oklch(0.45_0.12_145)]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-warm flex items-center justify-center text-white">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground">Restaurants</span>
                <div className="h-1 w-6 rounded-full bg-brand/30" />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 space-y-3">
            <Link
              to="/auth"
              className="group relative w-full flex items-center justify-between rounded-full bg-[oklch(0.55_0.15_145)] px-6 py-4 text-white font-bold shadow-[0_12px_28px_-10px_oklch(0.45_0.14_145/0.55)] hover:bg-[oklch(0.5_0.15_145)] transition-colors"
            >
              <span className="flex-1 text-center">Get Started</span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[oklch(0.55_0.15_145)] group-hover:scale-105 transition-transform">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link
              to="/auth"
              className="w-full flex items-center justify-center py-2.5 text-sm font-medium text-[oklch(0.45_0.12_145)] hover:text-warm transition-colors"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
