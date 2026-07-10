import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

type Answers = {
  planningType?: string;
  people?: number;
  city?: string;
  budget?: string;
  cookOrder?: string;
  goal?: string;
  restriction?: string;
};

const steps = [
  { key: "planningType", q: "Who are you planning for?", opts: ["Just me", "Me + partner", "Family", "Roommates"] },
  { key: "people", q: "How many people are eating?", opts: ["1", "2", "3", "4", "5+"] },
  { key: "city", q: "Which city are you in?", opts: ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano", "Other"] },
  { key: "budget", q: "What's your daily food budget?", opts: ["Under ₦2,000", "₦2,000 – ₦5,000", "₦5,000 – ₦10,000", "₦10,000+"] },
  { key: "cookOrder", q: "Do you prefer to cook or order?", opts: ["I love to cook", "I mostly order", "Both work for me"] },
  { key: "goal", q: "What's your health goal?", opts: ["Weight loss", "Weight gain", "Healthy eating", "Just normal meals", "High protein"] },
  { key: "restriction", q: "Any food restrictions?", opts: ["None", "Low oil", "Low sugar", "No pepper", "Vegetarian", "Diabetic-friendly"] },
] as const;

function Onboarding() {
  const { user } = useRequireAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const navigate = useNavigate();
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const save = async (final: Answers) => {
    if (!user) return;
    const peopleNum = final.people === "5+" ? 5 : final.people ? Number(final.people) : null;
    const { error } = await supabase.from("profiles").update({
      planning_type: final.planningType ?? null,
      people: peopleNum,
      city: final.city ?? null,
      budget: final.budget ?? null,
      cook_order: final.cookOrder ?? null,
      goal: final.goal ?? null,
      restriction: final.restriction ?? null,
      onboarded: true,
    }).eq("id", user.id);
    if (error) toast.error("Couldn't save preferences");
    navigate({ to: "/home" });
  };

  const select = (val: string) => {
    const next = { ...answers, [current.key]: val };
    setAnswers(next);
    setTimeout(() => {
      if (step < steps.length - 1) setStep(step + 1);
      else void save(next);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background py-0 md:py-6">
      <div className="phone-shell overflow-hidden md:rounded-[36px] md:min-h-[900px] flex flex-col p-6">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <Link to="/home" className="text-xs text-muted-foreground">Skip</Link>
        </div>

        <div className="mt-10 flex-1">
          <span className="chip">{`Step ${step + 1} of ${steps.length}`}</span>
          <h2 className="mt-4 font-display text-3xl leading-tight">{current.q}</h2>

          <div className="mt-8 space-y-3">
            {current.opts.map(opt => {
              const active = answers[current.key as keyof Answers]?.toString() === opt;
              return (
                <button
                  key={opt}
                  onClick={() => select(opt)}
                  className={`w-full flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left font-medium transition-all ${active ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/40"}`}
                >
                  <span>{opt}</span>
                  {active ? <Check className="h-5 w-5 text-brand" /> : <span className="text-muted-foreground text-sm">→</span>}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">Your answers stay on this device.</p>
      </div>
    </div>
  );
}
