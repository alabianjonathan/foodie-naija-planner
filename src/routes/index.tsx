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
    <div className="min-h-dvh w-full bg-background">
      <div className="mx-auto w-full max-w-[480px] min-h-dvh bg-background overflow-hidden flex flex-col">
        <div className="relative h-[38dvh] min-h-[220px] overflow-hidden">
          <img src={heroFood} alt="Nigerian jollof rice with chicken" width={1200} height={1200} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-background" />
          <div className="absolute top-4 left-4 right-4 flex items-center gap-2 pt-[env(safe-area-inset-top)]">
            <div className="h-8 w-8 rounded-xl bg-brand flex items-center justify-center text-brand-foreground font-display text-base">M</div>
            <span className="font-display text-base text-white drop-shadow-md">MealBeta</span>
          </div>
        </div>

        <div className="flex-1 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col justify-between gap-4">
          <div>
            <span className="chip !bg-warm/20 !text-charcoal !py-1 !text-xs">
              <Sparkles className="h-3 w-3" /> AI meals for Nigeria
            </span>
            <h1 className="mt-2 font-display text-[clamp(1.625rem,8vw,2.25rem)] leading-[1.05] text-foreground">
              Know wetin<br/>
              <span className="text-brand">to chop.</span>
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm leading-snug">
              Plans, prices, shopping lists & nearby spots — tuned to Naija food.
            </p>
          </div>

          <div className="space-y-2">
            <Link to="/auth" className="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-brand-foreground font-semibold shadow-[var(--shadow-lift)]">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/auth" className="w-full flex items-center justify-center rounded-full px-6 py-2.5 text-sm text-muted-foreground font-medium">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

