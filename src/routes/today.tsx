import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import {
  Sparkles, Flame, Clock, Wallet, Loader2, Leaf, ArrowRight, X,
  Send, Bookmark, Share2, Utensils, Store, ChefHat, RefreshCw, Info, ThumbsUp, ThumbsDown,
  SlidersHorizontal, Mic, MapPin, Navigation, Phone,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  recommendMeals, findRestaurantsForMeal, findChefsForMeal,
  type RecommendPick, type RecommendResult,
} from "@/lib/eat-today.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { useCatalogMeals, type UiMeal } from "@/hooks/useCatalogMeals";
import { nutritionReason } from "@/lib/nutrition";
import { useToggleSavedMeal, useSavedMealIds } from "@/hooks/useSavedMeals";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export const Route = createFileRoute("/today")({
  component: TodayPage,
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : undefined,
    openFilters: s.openFilters === true || s.openFilters === "1" ? true : undefined,
    auto: s.auto === true || s.auto === "1" ? true : undefined,
  }),
});

const PLACEHOLDERS = [
  "Tell MealBeta what you feel like eating…",
  "I have rice, eggs and chicken at home.",
  "I want a healthy meal under ₦3,000.",
  "Suggest something filling for dinner.",
  "I want Nigerian food that is not spicy.",
  "What can I eat after the gym?",
];

const MEAL_TIMES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const GOALS = ["Healthy eating", "Weight loss", "Weight gain", "Muscle building", "Something filling", "Something light", "Manage blood sugar", "Low-carb", "High-protein", "Budget-friendly", "Surprise me"];
const PREFS = ["Nigerian", "African", "Continental", "Fast food", "Vegetarian", "Vegan", "High-protein", "Low-carb", "Any food"];
const BUDGETS = ["Under ₦2,000", "₦2,000–₦5,000", "₦5,000–₦10,000", "Above ₦10,000"];
const TIMES = ["Under 15 min", "15–30 min", "30–60 min", "Over 1 hour"];
const SPICES = ["Not spicy", "Mild", "Medium", "Very spicy"];
const MODES: { id: "cook" | "order" | "chef"; label: string }[] = [
  { id: "cook", label: "I'll cook" },
  { id: "order", label: "Order it" },
  { id: "chef", label: "Book a chef" },
];

type Filters = {
  mealTime?: string; goals: string[]; preferences: string[]; budget?: string;
  timeAvailable?: string; spice?: string; allergies?: string; dislikes?: string;
  ingredients?: string; people?: number; city?: string; area?: string;
  mode?: "cook" | "order" | "chef";
};

const EMPTY_FILTERS: Filters = { goals: [], preferences: [] };

// Realistic price range for a meal, adjusted for whether the user plans to
// cook or order. Falls back to a sensible Nigerian estimate range when the
// stored value is unrealistically low (< ₦1,500).
function formatPriceRange(meal: UiMeal, mode?: "cook" | "order" | "chef"): string {
  const useOrder = mode === "order" || mode === "chef";
  let lo = useOrder ? meal.orderMin : meal.cookMin;
  let hi = useOrder ? meal.orderMax : meal.cookMax;
  if (!lo || lo < 1500) { lo = 2500; hi = Math.max(hi ?? 0, 5500); }
  if (!hi || hi <= lo) hi = Math.round(lo * 1.8);
  return `est. ₦${lo.toLocaleString()}–₦${hi.toLocaleString()}`;
}

function Chip({ active, onClick, children, size = "sm" }: { active: boolean; onClick: () => void; children: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size === "md" ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"} rounded-full border transition ${active ? "bg-brand text-brand-foreground border-brand shadow-sm" : "bg-white text-charcoal border-border hover:border-brand/40"}`}
    >
      {children}
    </button>
  );
}

// Smart parser — detect obvious signals from the user's free-text prompt.
function detectFromQuery(q: string): Partial<Filters> {
  const t = q.toLowerCase();
  const out: Partial<Filters> = {};
  if (/breakfast|morning/.test(t)) out.mealTime = "Breakfast";
  else if (/lunch|afternoon/.test(t)) out.mealTime = "Lunch";
  else if (/dinner|evening|night/.test(t)) out.mealTime = "Dinner";
  else if (/snack/.test(t)) out.mealTime = "Snack";
  if (/not spicy|no pepper|mild/.test(t)) out.spice = /not spicy|no pepper/.test(t) ? "Not spicy" : "Mild";
  else if (/very spicy|hot pepper/.test(t)) out.spice = "Very spicy";
  const goals: string[] = [];
  if (/healthy/.test(t)) goals.push("Healthy eating");
  if (/weight loss|lose weight/.test(t)) goals.push("Weight loss");
  if (/muscle|gym|protein/.test(t)) goals.push("High-protein");
  if (/filling/.test(t)) goals.push("Something filling");
  if (/light/.test(t)) goals.push("Something light");
  if (/blood sugar|diabet/.test(t)) goals.push("Manage blood sugar");
  if (goals.length) out.goals = goals;
  const prefs: string[] = [];
  if (/nigerian|naija/.test(t)) prefs.push("Nigerian");
  if (/vegetarian/.test(t)) prefs.push("Vegetarian");
  if (/vegan/.test(t)) prefs.push("Vegan");
  if (/continental/.test(t)) prefs.push("Continental");
  if (prefs.length) out.preferences = prefs;
  const budget = t.match(/(?:under|below|less than)\s*[₦n]?\s*([\d,]+)/i)?.[1]?.replace(/,/g, "");
  if (budget) {
    const n = Number(budget);
    if (n <= 2000) out.budget = "Under ₦2,000";
    else if (n <= 5000) out.budget = "₦2,000–₦5,000";
    else if (n <= 10000) out.budget = "₦5,000–₦10,000";
    else out.budget = "Above ₦10,000";
  }
  return out;
}

function TodayPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { getMeal } = useCatalogMeals();
  const generate = useServerFn(recommendMeals);
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q ?? "");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(!!search.openFilters);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [avoidIds, setAvoidIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("mb.today.avoid") || "[]"); } catch { return []; }
  });
  const [phIndex, setPhIndex] = useState(0);
  const [openMeal, setOpenMeal] = useState<{ meal: UiMeal; pick: RecommendPick } | null>(null);
  const [orderFor, setOrderFor] = useState<UiMeal | null>(null);
  const [chefFor, setChefFor] = useState<UiMeal | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "asking" | "denied">("idle");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mb.geo");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { lat: number; lng: number; ts: number };
      if (Date.now() - parsed.ts > 24 * 3600 * 1000) return;
      setGeo({ lat: parsed.lat, lng: parsed.lng });
    } catch { /* ignore */ }
  }, []);

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Your device doesn't support location.");
      return;
    }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const g = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGeo(g); setGeoState("idle");
        try { localStorage.setItem("mb.geo", JSON.stringify({ ...g, ts: Date.now() })); } catch { /* ignore */ }
        toast.success("Location set — restaurants will be ranked by distance.");
      },
      () => { setGeoState("denied"); toast.error("Location permission denied. You can still browse by city/area."); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  };

  useEffect(() => {
    const t = setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const mutation = useMutation({
    mutationFn: (extraFeedback?: string) => {
      // Merge detected signals with explicit filters (explicit wins).
      const detected = query ? detectFromQuery(query) : {};
      const merged: Filters = {
        ...EMPTY_FILTERS,
        ...detected,
        ...filters,
        goals: filters.goals.length ? filters.goals : (detected.goals ?? []),
        preferences: filters.preferences.length ? filters.preferences : (detected.preferences ?? []),
      };
      const payload = {
        query: query || undefined,
        filters: {
          mealTime: merged.mealTime,
          goal: merged.goals.join(", ") || undefined,
          preference: merged.preferences.join(", ") || undefined,
          budget: merged.budget,
          timeAvailable: merged.timeAvailable,
          spice: merged.spice,
          allergies: merged.allergies,
          dislikes: merged.dislikes,
          ingredients: merged.ingredients,
          people: merged.people,
          city: merged.city,
          area: merged.area,
          mode: merged.mode,
        },
        avoidIds,
        feedback: extraFeedback || feedback || undefined,
      };
      return generate({ data: payload }) as unknown as Promise<RecommendResult>;
    },
    onSuccess: (r) => {
      setResult(r);
      const next = Array.from(new Set([...r.picks.map((p) => p.mealId), ...avoidIds])).slice(0, 30);
      setAvoidIds(next);
      try { localStorage.setItem("mb.today.avoid", JSON.stringify(next)); } catch { /* ignore */ }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't get recommendations"),
  });

  const submit = () => mutation.mutate(undefined);

  // Auto-run once when we arrived from another page (e.g. dashboard Suggest Meals)
  // with `?auto=1`. Users landing on /today directly must still tap Suggest Meals.
  const [didAutoRun, setDidAutoRun] = useState(false);
  useEffect(() => {
    if (search.auto && !didAutoRun && !mutation.isPending && !result) {
      setDidAutoRun(true);
      mutation.mutate(undefined);
    }
  }, [search.auto, didAutoRun, mutation, result]);

  const userSeed = useMemo(
    () => [query, filters.goals.join(","), filters.preferences.join(","), filters.mealTime ?? "", filters.budget ?? ""].join("|"),
    [query, filters.goals, filters.preferences, filters.mealTime, filters.budget],
  );
  const picks = useMemo(() => (result?.picks ?? [])
    .map((p, i) => {
      const meal = getMeal(p.mealId);
      if (!meal) return null;
      const cookMid = Math.round((meal.cookMin + meal.cookMax) / 2);
      const reason = nutritionReason(meal.name, meal.nutrition, meal.macros, {
        costText: cookMid ? `a ~₦${cookMid.toLocaleString()} cook budget` : undefined,
        considerMinutes: meal.cookingTimeMin,
        goal: filters.goals[0] ?? null,
        index: i,
        userSeed,
      });
      return { pick: p, meal: { ...meal, nutritionReason: reason } };
    })
    .filter((x): x is { pick: RecommendPick; meal: UiMeal } => !!x), [result, getMeal, filters.goals, userSeed]);

  const ingredientsSplit = useMemo(() => {
    if (!filters.ingredients || !openMeal) return null;
    const have = filters.ingredients.split(/[,\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!have.length) return null;
    const need = openMeal.meal.ingredients.map((i) => i.name);
    const already = need.filter((n) => have.some((h) => n.toLowerCase().includes(h) || h.includes(n.toLowerCase())));
    const missing = need.filter((n) => !already.includes(n));
    return { already, missing };
  }, [filters.ingredients, openMeal]);

  // Voice input (Web Speech API — graceful fallback).
  const startVoice = () => {
    type SR = { start: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; lang: string; interimResults: boolean };
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) { toast.info("Voice input isn't supported on this device."); return; }
    const r = new Rec();
    r.lang = "en-NG";
    r.interimResults = false;
    r.onresult = (e) => { setQuery((q: string) => (q ? q + " " : "") + e.results[0][0].transcript); };
    r.onerror = () => toast.error("Couldn't hear you — try again.");
    r.start();
    toast.info("Listening…");
  };

  // Active filter chips shown below the search box.
  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.mealTime) activeChips.push({ key: "mealTime", label: filters.mealTime, clear: () => setFilters({ ...filters, mealTime: undefined }) });
  filters.goals.forEach((g) => activeChips.push({ key: "g-" + g, label: g, clear: () => setFilters({ ...filters, goals: filters.goals.filter((x) => x !== g) }) }));
  filters.preferences.forEach((p) => activeChips.push({ key: "p-" + p, label: p, clear: () => setFilters({ ...filters, preferences: filters.preferences.filter((x) => x !== p) }) }));
  if (filters.budget) activeChips.push({ key: "budget", label: filters.budget, clear: () => setFilters({ ...filters, budget: undefined }) });
  if (filters.timeAvailable) activeChips.push({ key: "time", label: filters.timeAvailable, clear: () => setFilters({ ...filters, timeAvailable: undefined }) });
  if (filters.spice) activeChips.push({ key: "spice", label: filters.spice, clear: () => setFilters({ ...filters, spice: undefined }) });
  if (filters.mode) activeChips.push({ key: "mode", label: MODES.find((m) => m.id === filters.mode)!.label, clear: () => setFilters({ ...filters, mode: undefined }) });

  const hasActive = activeChips.length > 0;

  return (
    <PhoneShell>
      <TopBar title="What Should I Eat Today?" back="/dashboard" />

      <div className="px-5 pt-4 space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tell us what you feel like eating, your budget, or the ingredients you have. MealBeta will find the best options for you.
        </p>

        {/* AI search box */}
        <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_8px_28px_-16px_rgba(15,60,25,0.25)] focus-within:border-brand/50 transition">
          <div className="flex items-start gap-2">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[phIndex]}
              rows={3}
              className="flex-1 text-[15px] bg-transparent outline-none resize-none placeholder:text-muted-foreground/70 leading-relaxed"
            />
            <button
              type="button"
              onClick={startVoice}
              aria-label="Voice input"
              className="h-9 w-9 rounded-full bg-secondary text-charcoal flex items-center justify-center hover:bg-brand/10 hover:text-brand transition"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-brand font-medium">
              <Sparkles className="h-3.5 w-3.5" /> MealBeta AI
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSheetOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-charcoal hover:border-brand/40"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {hasActive && <span className="ml-0.5 text-[10px] bg-brand text-brand-foreground rounded-full px-1.5 py-0.5 font-semibold">{activeChips.length}</span>}
              </button>
              <button
                onClick={submit}
                disabled={mutation.isPending || authLoading}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Suggest Meals
              </button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActive && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {activeChips.map((c) => (
              <button key={c.key} onClick={c.clear} className="inline-flex items-center gap-1 text-xs bg-brand/10 text-brand rounded-full px-2.5 py-1 font-medium hover:bg-brand/15">
                {c.label} <X className="h-3 w-3" />
              </button>
            ))}
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs text-muted-foreground underline underline-offset-2 ml-1">Clear filters</button>
          </div>
        )}

        {/* Loading */}
        {mutation.isPending && (
          <div className="rounded-2xl border border-border bg-white p-5 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
            <p className="text-sm text-charcoal">MealBeta is finding the best meals for you…</p>
          </div>
        )}

        {/* Result summary */}
        {result && !mutation.isPending && (
          <div className="rounded-2xl bg-leaf/10 border border-leaf/20 p-3">
            <p className="text-xs text-leaf leading-relaxed"><Sparkles className="inline h-3 w-3 mr-1 align-middle" />{result.summary}</p>
          </div>
        )}

        {/* Empty state */}
        {!mutation.isPending && !result && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Type what you feel like eating, then tap <span className="font-semibold text-charcoal">Suggest Meals</span>.
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {picks.map(({ pick, meal }) => (
            <ResultCard
              key={pick.label + meal.id}
              pick={pick}
              meal={meal}
              mode={filters.mode}
              onOpen={() => setOpenMeal({ meal, pick })}
              onOrder={() => setOrderFor(meal)}
              onChef={() => setChefFor(meal)}
              onFeedback={(fb) => { setFeedback(fb); toast.success("Got it — refining…"); mutation.mutate(fb); }}
            />
          ))}
        </div>

        {result && (
          <button onClick={submit} disabled={mutation.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-brand/30 text-brand py-2.5 text-sm font-medium disabled:opacity-60">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Show more options
          </button>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed pt-3 border-t border-border">
          <Info className="inline h-3 w-3 mr-1 align-middle" />
          Nutritional values are estimates and may vary based on ingredients, portion size, and preparation. MealBeta recommendations are for general informational purposes. Users with medical conditions should follow advice from a qualified healthcare professional.
        </p>
      </div>

      <div className="h-6" />

      <FiltersSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        setFilters={setFilters}
        onApply={() => { setSheetOpen(false); if (query || activeChips.length) submit(); }}
      />

      <MealDetailDialog open={openMeal} onClose={() => setOpenMeal(null)} ingredientsSplit={ingredientsSplit} onOrder={() => { if (openMeal) { setOrderFor(openMeal.meal); setOpenMeal(null); } }} onChef={() => { if (openMeal) { setChefFor(openMeal.meal); setOpenMeal(null); } }} />
      <OrderDialog meal={orderFor} city={filters.city} area={filters.area} geo={geo} onEnableLocation={requestLocation} onClose={() => setOrderFor(null)} enabled={!!user} />
      <ChefDialog meal={chefFor} city={filters.city} area={filters.area} onClose={() => setChefFor(null)} enabled={!!user} />
    </PhoneShell>
  );
}

function FiltersSheet({
  open, onOpenChange, filters, setFilters, onApply,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  filters: Filters; setFilters: (f: Filters) => void; onApply: () => void;
}) {
  // Draft state so cancel doesn't apply.
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);

  const single = <K extends keyof Filters>(key: K, options: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip key={o} active={draft[key] === o} onClick={() => setDraft({ ...draft, [key]: draft[key] === o ? undefined : o } as Filters)}>{o}</Chip>
      ))}
    </div>
  );

  const multi = (key: "goals" | "preferences", options: string[]) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = draft[key].includes(o);
        return (
          <Chip key={o} active={active} onClick={() => setDraft({ ...draft, [key]: active ? draft[key].filter((x) => x !== o) : [...draft[key], o] })}>{o}</Chip>
        );
      })}
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</p>
      {children}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[92vh] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <SheetTitle className="font-display text-xl">Personalise Your Meal</SheetTitle>
          <SheetDescription className="text-xs">
            Choose only what matters to you. MealBeta AI can understand the rest from your request.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
          <Section title="Meal time">{single("mealTime", MEAL_TIMES)}</Section>
          <Section title="Goal (choose any)">{multi("goals", GOALS)}</Section>
          <Section title="Preference (choose any)">{multi("preferences", PREFS)}</Section>
          <Section title="Budget">{single("budget", BUDGETS)}</Section>
          <Section title="Time available">{single("timeAvailable", TIMES)}</Section>
          <Section title="Spice">{single("spice", SPICES)}</Section>
          <Section title="Mode">
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <Chip key={m.id} active={draft.mode === m.id} onClick={() => setDraft({ ...draft, mode: draft.mode === m.id ? undefined : m.id })}>{m.label}</Chip>
              ))}
            </div>
          </Section>

          <Section title="Extra details (optional)">
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: "allergies" as const, ph: "Allergies (e.g. peanuts, shellfish)" },
                { key: "dislikes" as const, ph: "Foods to avoid" },
                { key: "ingredients" as const, ph: "Ingredients at home (comma separated)" },
                { key: "city" as const, ph: "City" },
                { key: "area" as const, ph: "Area" },
              ].map((f) => (
                <input
                  key={f.key}
                  value={(draft[f.key] as string) ?? ""}
                  onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="text-sm bg-white rounded-xl border border-border px-3 py-2.5 outline-none focus:border-brand/40"
                />
              ))}
              <input
                type="number" min={1}
                value={draft.people ?? ""}
                onChange={(e) => setDraft({ ...draft, people: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Number of people"
                className="text-sm bg-white rounded-xl border border-border px-3 py-2.5 outline-none focus:border-brand/40"
              />
            </div>
          </Section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-border px-5 py-3 flex items-center gap-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
          <button
            onClick={() => setDraft(EMPTY_FILTERS)}
            className="flex-1 rounded-full border border-border py-3 text-sm font-medium text-charcoal"
          >
            Clear All
          </button>
          <button
            onClick={() => { setFilters(draft); onApply(); }}
            className="flex-[1.4] rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ResultCard({
  pick, meal, mode, onOpen, onOrder, onChef, onFeedback,
}: {
  pick: RecommendPick; meal: UiMeal; mode?: "cook" | "order" | "chef";
  onOpen: () => void; onOrder: () => void; onChef: () => void; onFeedback: (fb: string) => void;
}) {
  const savedIds = useSavedMealIds();
  const toggle = useToggleSavedMeal();
  const isSaved = savedIds.data?.includes(meal.uuid) ?? false;

  const share = async () => {
    const url = `${window.location.origin}/meal/${meal.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: meal.name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* ignore */ }
  };

  // Emphasise action for the selected mode.
  const primary = mode === "order" ? "order" : mode === "cook" ? "cook" : "chef";

  const btn = (kind: "cook" | "order" | "chef") => {
    const isPrimary = kind === primary;
    const cls = isPrimary
      ? "bg-brand text-brand-foreground"
      : kind === "order" ? "bg-brand/10 text-brand"
      : kind === "chef" ? "bg-leaf/10 text-leaf"
      : "bg-warm/20 text-charcoal";
    if (kind === "order") return <button onClick={onOrder} className={`inline-flex items-center justify-center gap-1 rounded-full py-2 text-xs font-medium ${cls}`}><Store className="h-3.5 w-3.5" /> Order It</button>;
    if (kind === "chef") return <button onClick={onChef} className={`inline-flex items-center justify-center gap-1 rounded-full py-2 text-xs font-medium ${cls}`}><ChefHat className="h-3.5 w-3.5" /> Book a Chef</button>;
    return <Link to="/meal/$id" params={{ id: meal.id }} className={`inline-flex items-center justify-center gap-1 rounded-full py-2 text-xs font-medium ${cls}`}><Utensils className="h-3.5 w-3.5" /> Cook It</Link>;
  };

  return (
    <div className="card-soft !p-4">
      <div className="flex items-start gap-3">
        <div className={`h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-3xl`}>{meal.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{pick.label}</p>
          <button onClick={onOpen} className="text-left w-full">
            <h3 className="font-display text-base leading-tight truncate">{meal.name}</h3>
          </button>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />{formatPriceRange(meal, mode)}</span>
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{meal.caloriesMin}–{meal.caloriesMax} kcal</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{meal.cookingTimeMin}m</span>
            {pick.mealTime && <span className="inline-flex items-center gap-1"><Utensils className="h-3 w-3" />{pick.mealTime}</span>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.values(meal.nutrition).map((n) => (
              <span
                key={n.key}
                title={`${n.name}: ~${n.grams}g`}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-xl bg-secondary text-charcoal font-medium"
              >
                <span>{n.emoji}</span>
                <span className="truncate">{n.name}: {n.score}/10</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">• {n.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-secondary/50 p-2.5">
        <p className="text-[11px] font-semibold text-charcoal mb-0.5">Why this was recommended</p>
        <p className="text-xs text-charcoal/80 leading-snug">{meal.nutritionReason}</p>
        {pick.considerations && <p className="text-[11px] text-muted-foreground mt-1">Note: {pick.considerations}</p>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {btn("chef")}
        {btn("order")}
        {btn("cook")}
        <button onClick={() => toggle.mutate({ mealId: meal.uuid, saved: !isSaved })} className="inline-flex items-center justify-center gap-1 rounded-full bg-secondary text-charcoal py-2 text-xs font-medium">
          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {["I like this", "Not for me", "Too expensive", "Too heavy", "Too spicy", "Show cheaper", "Show healthier"].map((fb) => (
            <button key={fb} onClick={() => onFeedback(fb)} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-border hover:border-brand/40 text-charcoal">
              {fb === "I like this" ? <ThumbsUp className="inline h-3 w-3 mr-0.5" /> : fb === "Not for me" ? <ThumbsDown className="inline h-3 w-3 mr-0.5" /> : null}
              {fb}
            </button>
          ))}
        </div>
        <button onClick={share} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Share2 className="h-3 w-3" /> Share
        </button>
      </div>
    </div>
  );
}

function MealDetailDialog({
  open, onClose, ingredientsSplit, onOrder, onChef,
}: {
  open: { meal: UiMeal; pick: RecommendPick } | null;
  onClose: () => void;
  ingredientsSplit: { already: string[]; missing: string[] } | null;
  onOrder: () => void; onChef: () => void;
}) {
  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[85vh] overflow-y-auto">
        {open && (
          <>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${open.meal.gradient} flex items-center justify-center text-2xl`}>{open.meal.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-brand font-semibold">{open.pick.label}</p>
                  <DialogTitle className="font-display text-lg leading-tight">{open.meal.name}</DialogTitle>
                  <DialogDescription className="text-xs">{open.meal.portion} · {open.meal.category}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-brand/5 p-3 text-center">
                <Flame className="h-4 w-4 text-brand mx-auto" />
                <p className="text-[10px] text-muted-foreground mt-1">est. Calories</p>
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

            {open.meal.description && (
              <p className="text-xs text-charcoal/80 leading-relaxed">{open.meal.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {Object.values(open.meal.nutrition).map((n) => (
                <span
                  key={n.key}
                  title={`${n.name}: ~${n.grams}g`}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-xl bg-secondary text-charcoal font-medium"
                >
                  <span>{n.emoji}</span>
                  <span className="truncate">{n.name}: {n.score}/10</span>
                  <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">• {n.label}</span>
                </span>
              ))}
            </div>

            {ingredientsSplit ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-leaf/5 p-3">
                  <p className="text-[11px] font-semibold text-leaf mb-1">You already have</p>
                  {ingredientsSplit.already.length ? ingredientsSplit.already.map((i) => (
                    <p key={i} className="text-xs">✓ {i}</p>
                  )) : <p className="text-[11px] text-muted-foreground">None matched</p>}
                </div>
                <div className="rounded-2xl bg-warm/10 p-3">
                  <p className="text-[11px] font-semibold text-charcoal mb-1">You still need</p>
                  {ingredientsSplit.missing.length ? ingredientsSplit.missing.map((i) => (
                    <p key={i} className="text-xs">• {i}</p>
                  )) : <p className="text-[11px] text-muted-foreground">You have it all!</p>}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Main ingredients</p>
                <div className="flex flex-wrap gap-1">
                  {open.meal.ingredients.slice(0, 8).map((i) => (
                    <span key={i.name} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-charcoal">{i.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-secondary/50 p-3">
              <p className="text-xs font-semibold mb-1">Why this was recommended</p>
              <p className="text-xs text-charcoal/80 leading-relaxed">{open.meal.nutritionReason}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={onOrder} className="inline-flex items-center justify-center gap-1 rounded-full bg-brand/10 text-brand py-2 text-xs font-medium"><Store className="h-3.5 w-3.5" /> Order</button>
              <button onClick={onChef} className="inline-flex items-center justify-center gap-1 rounded-full bg-leaf/10 text-leaf py-2 text-xs font-medium"><ChefHat className="h-3.5 w-3.5" /> Chef</button>
              <Link to="/meal/$id" params={{ id: open.meal.id }} onClick={onClose} className="inline-flex items-center justify-center gap-1 rounded-full bg-brand text-brand-foreground py-2 text-xs font-medium">Recipe <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function OrderDialog({ meal, city, area, geo, onEnableLocation, onClose, enabled }: { meal: UiMeal | null; city?: string; area?: string; geo: { lat: number; lng: number } | null; onEnableLocation: () => void; onClose: () => void; enabled: boolean }) {
  const fetchFn = useServerFn(findRestaurantsForMeal);
  const q = useQuery({
    queryKey: ["today-restaurants", meal?.slug, city, area, geo?.lat, geo?.lng],
    enabled: !!meal && enabled,
    queryFn: () => fetchFn({ data: { mealSlug: meal!.slug, mealName: meal!.name, city, area, lat: geo?.lat, lng: geo?.lng } }) as unknown as ReturnType<typeof findRestaurantsForMeal>,
  });
  const locationText = [area, city].filter(Boolean).join(", ");
  return (
    <Sheet open={!!meal} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="mx-auto flex h-[88vh] max-w-[480px] flex-col overflow-hidden rounded-t-[2rem] border-border bg-background p-0">
        <SheetHeader className="border-b border-border bg-card px-5 pb-4 pt-5 text-left">
          <div className="mb-3 flex h-1.5 w-12 self-center rounded-full bg-muted" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <SheetTitle className="font-display text-xl leading-tight">Order {meal?.name}</SheetTitle>
              <SheetDescription className="mt-1 text-xs leading-relaxed">
                Showing verified restaurant branches{locationText ? ` around ${locationText}` : " near you"}. MealBeta prioritises closer areas, then wider city/state matches.
              </SheetDescription>
            </div>
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand">
              Top {q.data?.length ?? 3}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
        {!geo && (
          <button
            onClick={onEnableLocation}
            className="mb-3 grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-warm/40 bg-warm/10 px-4 py-3 text-left"
          >
            <span className="text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-charcoal">
                <span className="inline-flex items-center gap-1 rounded-full bg-warm/25 px-2 py-0.5 text-[10px]">⚠ Approximate</span>
                Use my precise location
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {geoState === "denied"
                  ? "Location blocked. Tap the 🔒 in your address bar → Location → Allow, then reload."
                  : "Right now we're ranking by city only. Tap to rank by real distance from where you are."}
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
              <MapPin className="h-4 w-4" />
            </span>
          </button>
        )}
        {geo && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-full bg-leaf/10 px-3 py-1.5 text-[11px] font-medium text-leaf">
            <span className="inline-flex items-center gap-1.5 truncate">
              <span className="inline-flex items-center gap-1 rounded-full bg-leaf/20 px-2 py-0.5 text-[10px]">✓ Precise</span>
              <MapPin className="h-3 w-3" /> Ranked by distance from you
            </span>
            <button onClick={onEnableLocation} className="shrink-0 text-[11px] font-semibold text-leaf underline underline-offset-2">Refresh</button>
          </div>
        )}
        {q.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>}
        {q.isError && (
          <p className="text-sm text-muted-foreground text-center py-6">Restaurants could not load right now. Please try again.</p>
        )}
        {q.data && q.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No restaurant listings are available yet. Try another meal or update your location.</p>
        )}
        <div className="space-y-3">
          {q.data?.map((r, index) => (
            <article
              key={r.id}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_14px_32px_-24px_oklch(0.22_0.03_155_/_0.35)]"
            >
              <div className="relative bg-gradient-to-br from-brand/90 via-leaf/75 to-warm/80 px-4 py-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-card/95 px-2 py-1 text-[10px] font-semibold text-brand">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{r.matchLabel}</span>
                  </span>
                  <span className="rounded-full bg-card/95 px-2 py-1 text-[10px] font-semibold text-charcoal">#{index + 1}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-charcoal">{r.chain ?? r.name}</p>
                    <p className="mt-0.5 text-xs font-medium text-brand">{r.branchName || r.area || r.city}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {r.verified && <span className="rounded-full bg-leaf/15 px-2 py-1 text-[10px] font-semibold text-leaf">✓ Verified</span>}
                    {r.rating > 0 && <span className="rounded-full bg-warm/20 px-2 py-1 text-[10px] font-semibold text-charcoal">★ {r.rating.toFixed(1)}</span>}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-secondary/55 p-3">
                  <p className="flex items-start gap-1.5 text-xs leading-relaxed text-charcoal">
                    <Store className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    <span>{r.address || [r.area, r.city].filter(Boolean).join(", ")}</span>
                  </p>
                  {r.tags.length > 0 && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
                      {r.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
                  {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground"><Phone className="h-3 w-3" /> Call</a>}
                  {r.googleMapsUrl && <a href={r.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-charcoal"><Navigation className="h-3 w-3" /> Map</a>}
                  <Link
                    to="/restaurants/$slug"
                    params={{ slug: r.slug }}
                    onClick={onClose}
                    className="inline-flex min-w-0 items-center justify-self-end gap-1 truncate text-[11px] font-medium text-brand"
                  >
                    View profile <ArrowRight className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ChefDialog({ meal, city, area, onClose, enabled }: { meal: UiMeal | null; city?: string; area?: string; onClose: () => void; enabled: boolean }) {
  const fetchFn = useServerFn(findChefsForMeal);
  const q = useQuery({
    queryKey: ["today-chefs", meal?.slug, city, area],
    enabled: !!meal && enabled,
    queryFn: () => fetchFn({ data: { mealName: meal!.name, category: meal!.category, city, area } }) as unknown as ReturnType<typeof findChefsForMeal>,
  });
  const locationText = [area, city].filter(Boolean).join(", ");
  return (
    <Dialog open={!!meal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-lg">Book a chef for {meal?.name}</DialogTitle>
          <DialogDescription className="text-xs">Top 3 chef matches near you{locationText ? ` in ${locationText}` : ""}. Tap a card to view the full profile.</DialogDescription>
        </DialogHeader>
        {q.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>}
        {q.isError && (
          <p className="text-sm text-muted-foreground text-center py-6">Chefs could not load right now. Please try again.</p>
        )}
        {q.data && q.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No chefs near you yet{city ? ` in ${city}` : ""}. Try updating your location.</p>
        )}
        <div className="space-y-2">
          {q.data?.map((c) => (
            <Link key={c.id} to="/chefs/$slug" params={{ slug: c.slug }} onClick={onClose} className="block rounded-2xl border border-border p-3 hover:border-brand/40 transition">
              <div className="flex items-start gap-3">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-warm/20 flex items-center justify-center text-lg">👨‍🍳</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate flex items-center gap-1.5">
                    {c.businessName}
                    {c.verified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] bg-leaf/15 text-leaf rounded-full px-1.5 py-0.5 font-semibold">
                        ✓ Verified
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    <ChefHat className="inline h-3 w-3 mr-0.5" />
                    {[c.area, c.city].filter(Boolean).join(", ")}
                    {c.areasCovered.length ? ` · covers ${c.areasCovered.slice(0, 2).join(", ")}` : ""}
                  </p>
                  {c.phone && <p className="text-[11px] text-brand mt-0.5">{c.phone}</p>}
                  {(c.priceMin || c.priceMax) && (
                    <p className="text-[11px] text-charcoal mt-0.5">from ₦{(c.priceMin ?? 0).toLocaleString()}{c.priceMax ? `–₦${c.priceMax.toLocaleString()}` : ""}</p>
                  )}
                </div>
                {c.rating != null && <span className="text-xs bg-warm/20 rounded-full px-2 py-0.5">★ {c.rating.toFixed(1)}</span>}
              </div>
              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                {c.phone && <a href={`tel:${c.phone}`} className="text-xs px-3 py-1 rounded-full bg-brand text-brand-foreground">Call</a>}
                {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded-full bg-leaf text-leaf-foreground">WhatsApp</a>}
                <span className="ml-auto text-[11px] text-muted-foreground inline-flex items-center gap-1">View profile <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

