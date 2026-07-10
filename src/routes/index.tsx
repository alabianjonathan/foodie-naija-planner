import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import heroFood from "@/assets/hero-food.jpg";
import { ArrowRight, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.03_75)] to-[oklch(0.94_0.05_60)] py-0 md:py-6">
      <div className="phone-shell overflow-hidden md:rounded-[36px] md:min-h-[900px] md:max-h-[900px] flex flex-col">
        <div className="relative h-[55%] min-h-[420px] overflow-hidden">
          <img src={heroFood} alt="Nigerian jollof rice with chicken" width={1200} height={1200} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
          <div className="absolute top-6 left-6 right-6 flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-brand flex items-center justify-center text-brand-foreground font-display text-lg">M</div>
            <span className="font-display text-lg text-white drop-shadow-md">MealBeta</span>
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-8 flex flex-col justify-between">
          <div>
            <span className="chip !bg-warm/20 !text-charcoal">
              <Sparkles className="h-3.5 w-3.5" /> AI meal assistant for Nigeria
            </span>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-foreground">
              Know wetin to eat<br/>
              <span className="text-brand">before hunger confuse you.</span>
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              MealBeta plans your meals, estimates cost & calories, builds shopping lists and finds restaurants near you — all tuned to Nigerian food.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <Link to="/auth" className="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-brand-foreground font-semibold shadow-[var(--shadow-lift)]">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth" className="w-full flex items-center justify-center gap-2 rounded-full bg-secondary px-6 py-4 text-secondary-foreground font-medium">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
