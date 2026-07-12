import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCitiesWithAreas, type CatalogCity } from "@/lib/catalog.functions";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});


type Answers = {
  planningType?: string;
  people?: string;
  city?: string;
  area?: string;
  budget?: string;
  cookOrder?: string;
  goal?: string;
  restriction?: string;
};

type Step = {
  key: keyof Answers;
  q: string;
  opts?: readonly string[];
  kind?: "budget" | "area";
};

const buildSteps = (cities: string[]): readonly Step[] => [
  { key: "planningType", q: "Who are you planning for?", opts: ["Just me", "Me + partner", "Family", "Roommates"] },
  { key: "people", q: "How many people are eating?", opts: ["1", "2", "3", "4", "5+"] },
  { key: "city", q: "Which city are you in?", opts: [...cities, "Other"] },
  { key: "area", q: "Which area?", kind: "area" },
  { key: "budget", q: "What's your daily food budget?", kind: "budget" },
  { key: "cookOrder", q: "Do you prefer to cook or order?", opts: ["I love to cook", "I mostly order", "Both work for me"] },
  { key: "goal", q: "What's your health goal?", opts: ["Weight loss", "Weight gain", "Healthy eating", "Just normal meals", "High protein"] },
  { key: "restriction", q: "Any food restrictions?", opts: ["None", "Low oil", "Low sugar", "No pepper", "Vegetarian", "Diabetic-friendly"] },
];

const SOLO_BUDGETS = ["₦2,000", "₦5,000", "₦10,000", "₦20,000"];
const FAMILY_BUDGETS = ["₦10,000", "₦20,000", "₦30,000", "₦50,000"];

function Onboarding() {
  const { user } = useRequireAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [customBudget, setCustomBudget] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const navigate = useNavigate();

  const fetchCities = useServerFn(listCitiesWithAreas);
  const { data: cityRows = [] } = useQuery({
    queryKey: ["catalog", "cities"],
    queryFn: () => fetchCities() as unknown as Promise<CatalogCity[]>,
  });
  const CITIES = useMemo(() => cityRows.filter((c) => c.active).map((c) => c.name), [cityRows]);
  const cityAreas = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of cityRows) map[c.name] = c.areas.filter((a) => a.active).map((a) => a.name);
    return map;
  }, [cityRows]);

  const steps = useMemo(() => {
    const base = buildSteps(CITIES);
    const city = answers.city;
    const areas = city ? cityAreas[city] : undefined;
    return base.filter(s => s.key !== "area" || (areas && areas.length > 0));
  }, [answers.city, CITIES, cityAreas]);


  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const isFamily = useMemo(() => {
    const t = answers.planningType;
    const n = answers.people;
    return t === "Family" || t === "Roommates" || (n ? Number(n.replace("+", "")) >= 3 : false);
  }, [answers.planningType, answers.people]);
  const budgetOpts = isFamily ? FAMILY_BUDGETS : SOLO_BUDGETS;

  const commit = (next: Answers) => {
    setAnswers(next);
    setShowCustom(false);
    setCustomBudget("");
    setTimeout(() => {
      if (step < steps.length - 1) setStep(step + 1);
      else void save(next);
    }, 200);
  };

  const save = async (final: Answers) => {
    if (!user) return;
    const peopleNum = final.people === "5+" ? 5 : final.people ? Number(final.people) : null;
    const { error } = await supabase.from("profiles").update({
      planning_type: final.planningType ?? null,
      people: peopleNum,
      city: final.city ?? null,
      area: final.area ?? null,
      budget: final.budget ?? null,
      cook_order: final.cookOrder ?? null,
      goal: final.goal ?? null,
      restriction: final.restriction ?? null,
      onboarded: true,
    }).eq("id", user.id);
    if (error) toast.error("Couldn't save preferences");
    navigate({ to: "/home" });
  };

  const select = (val: string) => commit({ ...answers, [current.key]: val });

  const submitCustom = () => {
    const raw = customBudget.replace(/[^\d]/g, "");
    if (!raw) return toast.error("Enter an amount");
    const formatted = `₦${Number(raw).toLocaleString()}`;
    commit({ ...answers, budget: formatted });
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
          {current.kind === "budget" && (
            <p className="mt-2 text-sm text-muted-foreground">
              {isFamily ? "Family-size suggestions" : "Personal-size suggestions"} — tap a quick amount or enter your own.
            </p>
          )}

          {current.kind === "budget" ? (
            <div className="mt-8 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {budgetOpts.map(opt => {
                  const active = answers.budget === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => select(opt)}
                      className={`rounded-2xl border-2 px-4 py-4 font-display text-lg transition-all ${active ? "border-brand bg-brand/5 text-brand" : "border-border bg-card hover:border-brand/40"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-card px-5 py-4 text-left font-medium hover:border-brand/40"
                >
                  ✏️  Custom amount
                </button>
              ) : (
                <div className="rounded-2xl border-2 border-brand bg-brand/5 p-4">
                  <label className="text-xs font-medium text-muted-foreground">Your daily budget (₦)</label>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center flex-1 rounded-xl bg-white border border-border px-3">
                      <span className="text-lg font-display text-muted-foreground">₦</span>
                      <input
                        autoFocus
                        inputMode="numeric"
                        placeholder="e.g. 7,500"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value.replace(/[^\d,]/g, ""))}
                        onKeyDown={(e) => { if (e.key === "Enter") submitCustom(); }}
                        className="flex-1 bg-transparent py-3 pl-1 text-lg font-display focus:outline-none"
                      />
                    </div>
                    <button onClick={submitCustom} className="rounded-xl bg-brand text-brand-foreground px-4 py-3 text-sm font-semibold">
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-3">
              {(current.kind === "area" ? (answers.city ? cityAreas[answers.city] ?? [] : []) : (current.opts ?? [])).map(opt => {
                const active = answers[current.key]?.toString() === opt;
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
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">Your answers stay on this device.</p>
      </div>
    </div>
  );
}
