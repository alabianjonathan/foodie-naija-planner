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

type Option = { label: string; desc?: string };

type Step = {
  key: keyof Answers;
  q: string;
  sub?: string;
  opts?: readonly Option[];
  kind?: "budget" | "area";
};

const buildSteps = (cities: string[]): readonly Step[] => [
  {
    key: "planningType",
    q: "Who are you planning for?",
    sub: "This helps us size portions and suggest the right budget for your household.",
    opts: [
      { label: "Just me", desc: "Single-serve meals and smaller shopping lists." },
      { label: "Me + partner", desc: "Portions and budget scaled for two people." },
      { label: "Family", desc: "Bigger portions, family-style meals, weekly bulk buys." },
      { label: "Roommates", desc: "Shared meals with flexible portions and split costs." },
    ],
  },
  {
    key: "people",
    q: "How many people are eating?",
    sub: "We use this to calculate ingredient quantities and cost per meal accurately.",
    opts: [
      { label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }, { label: "5+" },
    ],
  },
  {
    key: "city",
    q: "Which city are you in?",
    sub: "So we can match you with nearby restaurants and private chefs.",
    opts: [...cities.map((c) => ({ label: c })), { label: "Other", desc: "We'll still plan your meals — provider matching may be limited." }],
  },
  {
    key: "area",
    q: "Which area?",
    sub: "The closer we know your area, the better we can suggest chefs and delivery-ready spots.",
    kind: "area",
  },
  {
    key: "budget",
    q: "What's your daily food budget?",
    sub: "We'll only suggest meals and options you can actually afford in Nigeria today.",
    kind: "budget",
  },
  {
    key: "cookOrder",
    q: "Do you prefer to cook or order?",
    sub: "Tell us how you like to eat so we mix the right balance of home-cooked and ordered meals.",
    opts: [
      { label: "I love to cook", desc: "Recipes first, with a shopping list you can take to the market." },
      { label: "I mostly order", desc: "We'll lean on restaurants and private chefs near you." },
      { label: "Both work for me", desc: "A healthy mix of cook-at-home and order-out." },
    ],
  },
  {
    key: "goal",
    q: "What's your health goal?",
    sub: "We'll tune calories, protein and fibre so your plan supports this goal.",
    opts: [
      { label: "Weight loss", desc: "Lighter calories, more protein and vegetables." },
      { label: "Weight gain", desc: "Bigger, energy-rich meals with healthy carbs and fats." },
      { label: "Healthy eating", desc: "Balanced Nigerian meals — nothing extreme." },
      { label: "Just normal meals", desc: "Everyday Nigerian favourites, no strict rules." },
      { label: "High protein", desc: "More fish, chicken, beans and eggs in your plan." },
    ],
  },
  {
    key: "restriction",
    q: "Any food restrictions?",
    sub: "We'll avoid or reduce these in every meal we suggest for you.",
    opts: [
      { label: "None", desc: "No restrictions — anything goes." },
      { label: "Low oil", desc: "Less palm oil and fried foods." },
      { label: "Low sugar", desc: "Less sugar, soft drinks and sweet snacks." },
      { label: "No pepper", desc: "Mild meals, easy on the pepper." },
      { label: "Vegetarian", desc: "No meat or fish — beans, egg and veggies focus." },
      { label: "Diabetic-friendly", desc: "Slow-release carbs and controlled portions." },
    ],
  },
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
    navigate({ to: "/dashboard" });
  };

  const select = (val: string) => commit({ ...answers, [current.key]: val });

  const submitCustom = () => {
    const raw = customBudget.replace(/[^\d]/g, "");
    if (!raw) return toast.error("Enter an amount");
    const formatted = `₦${Number(raw).toLocaleString()}`;
    commit({ ...answers, budget: formatted });
  };

  return (
    <div className="bg-background py-0 md:py-6" style={{ minHeight: "100dvh" }}>
      <div className="phone-shell overflow-hidden md:rounded-[36px] flex flex-col p-4 sm:p-6" style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)", paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <Link to="/dashboard" className="text-xs text-muted-foreground">Skip</Link>
        </div>

        <div className="mt-4 sm:mt-6 flex-1">
          <span className="chip">{`Step ${step + 1} of ${steps.length}`}</span>
          <h2 className="mt-2 sm:mt-3 font-display text-xl sm:text-2xl md:text-3xl leading-tight">{current.q}</h2>

          {current.kind === "budget" && (
            <p className="mt-2 text-sm text-muted-foreground">
              {isFamily ? "Family-size suggestions" : "Personal-size suggestions"} — tap a quick amount or enter your own.
            </p>
          )}

          {current.kind === "budget" ? (
            <div className="mt-4 sm:mt-6 space-y-3">

              <div className="grid grid-cols-2 gap-3">
                {budgetOpts.map(opt => {
                  const active = answers.budget === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => select(opt)}
                      className={`rounded-2xl border-2 px-4 py-3.5 md:py-4 font-display text-base md:text-lg transition-all ${active ? "border-brand bg-brand/5 text-brand" : "border-border bg-card hover:border-brand/40"}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!showCustom ? (
                <button
                  onClick={() => setShowCustom(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-card px-5 py-3.5 md:py-4 text-left font-medium hover:border-brand/40"
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
            <div className="mt-4 sm:mt-6 space-y-2 md:space-y-2.5">
              {(current.kind === "area" ? (answers.city ? cityAreas[answers.city] ?? [] : []) : (current.opts ?? [])).map(opt => {
                const active = answers[current.key]?.toString() === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => select(opt)}
                    className={`w-full flex items-center justify-between rounded-2xl border-2 px-5 py-3.5 md:py-4 text-left font-medium transition-all ${active ? "border-brand bg-brand/5" : "border-border bg-card hover:border-brand/40"}`}
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
