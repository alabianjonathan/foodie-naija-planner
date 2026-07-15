import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import {
  Sparkles, Flame, Clock, Wallet, Loader2, Leaf, ArrowRight, ChevronDown, ChevronUp,
  Send, Bookmark, Share2, Utensils, Store, ChefHat, RefreshCw, Info, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  recommendMeals, findRestaurantsForMeal, findChefsForMeal,
  type RecommendPick, type RecommendResult,
} from "@/lib/eat-today.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { useCatalogMeals, type UiMeal } from "@/hooks/useCatalogMeals";
import { useToggleSavedMeal, useSavedMealIds } from "@/hooks/useSavedMeals";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/today")({ component: TodayPage });

const PLACEHOLDERS = [
  "I have ₦3,000 and I want something filling…",
  "What can I eat after the gym?",
  "I have rice, eggs and chicken at home.",
  "Suggest a Nigerian meal for weight loss.",
  "I want something light and not spicy.",
  "Quick breakfast before work?",
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
  mealTime?: string; goal?: string; preference?: string; budget?: string;
  timeAvailable?: string; spice?: string; allergies?: string; dislikes?: string;
  ingredients?: string; people?: number; city?: string; area?: string;
  mode?: "cook" | "order" | "chef";
};

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${active ? "bg-brand text-brand-foreground border-brand" : "bg-white text-charcoal border-border hover:border-brand/40"}`}
    >
      {children}
    </button>
  );
}

function ChipGroup({ label, options, value, onChange }: { label: string; options: string[]; value?: string; onChange: (v?: string) => void }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(value === o ? undefined : o)}>{o}</Chip>
        ))}
      </div>
    </div>
  );
}

function TodayPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { getMeal } = useCatalogMeals();
  const generate = useServerFn(recommendMeals);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [advOpen, setAdvOpen] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [avoidIds, setAvoidIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("mb.today.avoid") || "[]"); } catch { return []; }
  });
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);
  const [openMeal, setOpenMeal] = useState<{ meal: UiMeal; pick: RecommendPick } | null>(null);
  const [orderFor, setOrderFor] = useState<UiMeal | null>(null);
  const [chefFor, setChefFor] = useState<UiMeal | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    const t = setInterval(() => setPlaceholder(PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]), 3500);
    return () => clearInterval(t);
  }, []);

  const mutation = useMutation({
    mutationFn: (extraFeedback?: string) => generate({
      data: { query: query || undefined, filters, avoidIds, feedback: extraFeedback || feedback || undefined },
    }) as unknown as Promise<RecommendResult>,
    onSuccess: (r) => {
      setResult(r);
      const next = Array.from(new Set([...r.picks.map((p) => p.mealId), ...avoidIds])).slice(0, 30);
      setAvoidIds(next);
      try { localStorage.setItem("mb.today.avoid", JSON.stringify(next)); } catch { /* ignore */ }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't get recommendations"),
  });

  const submit = () => mutation.mutate(undefined);

  const picks = useMemo(() => {
    return (result?.picks ?? [])
      .map((p) => ({ pick: p, meal: getMeal(p.mealId) }))
      .filter((x): x is { pick: RecommendPick; meal: UiMeal } => !!x.meal);
  }, [result, getMeal]);

  const ingredientsSplit = useMemo(() => {
    if (!filters.ingredients || !openMeal) return null;
    const have = filters.ingredients.split(/[,\n]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!have.length) return null;
    const need = openMeal.meal.ingredients.map((i) => i.name);
    const already = need.filter((n) => have.some((h) => n.toLowerCase().includes(h) || h.includes(n.toLowerCase())));
    const missing = need.filter((n) => !already.includes(n));
    return { already, missing };
  }, [filters.ingredients, openMeal]);

  return (
    <PhoneShell>
      <TopBar title="What Should I Eat Today?" back="/dashboard" />

      <div className="px-5 pt-4 space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tell us what you feel like eating, your budget, or what ingredients you already have — MealBeta will suggest the best options for you.
        </p>

        {/* Prompt input */}
        <div className="rounded-3xl border border-border bg-white p-3 shadow-sm">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full text-sm bg-transparent outline-none resize-none placeholder:text-muted-foreground/70"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-brand"><Sparkles className="h-3 w-3" /> MealBeta AI</span>
            <button
              onClick={submit}
              disabled={mutation.isPending || authLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Suggest
            </button>
          </div>
        </div>

        {/* Quick filters */}
        <div className="space-y-3">
          <ChipGroup label="Meal time" options={MEAL_TIMES} value={filters.mealTime} onChange={(v) => setFilters({ ...filters, mealTime: v })} />
          <ChipGroup label="Goal" options={GOALS} value={filters.goal} onChange={(v) => setFilters({ ...filters, goal: v })} />
          <ChipGroup label="Preference" options={PREFS} value={filters.preference} onChange={(v) => setFilters({ ...filters, preference: v })} />
          <ChipGroup label="Budget" options={BUDGETS} value={filters.budget} onChange={(v) => setFilters({ ...filters, budget: v })} />
          <ChipGroup label="Time available" options={TIMES} value={filters.timeAvailable} onChange={(v) => setFilters({ ...filters, timeAvailable: v })} />
          <ChipGroup label="Spice" options={SPICES} value={filters.spice} onChange={(v) => setFilters({ ...filters, spice: v })} />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">Mode</p>
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((m) => (
                <Chip key={m.id} active={filters.mode === m.id} onClick={() => setFilters({ ...filters, mode: filters.mode === m.id ? undefined : m.id })}>{m.label}</Chip>
              ))}
            </div>
          </div>

          <button onClick={() => setAdvOpen((v) => !v)} className="inline-flex items-center gap-1 text-xs text-brand font-medium">
            {advOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Advanced preferences
          </button>

          {advOpen && (
            <div className="grid grid-cols-1 gap-2 rounded-2xl bg-secondary/40 p-3">
              {[
                { key: "allergies", ph: "Allergies (e.g. peanuts, shellfish)" },
                { key: "dislikes", ph: "Foods to avoid" },
                { key: "ingredients", ph: "Ingredients at home (comma separated)" },
                { key: "city", ph: "City" },
                { key: "area", ph: "Area" },
              ].map((f) => (
                <input
                  key={f.key}
                  value={(filters as Record<string, unknown>)[f.key] as string ?? ""}
                  onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                  placeholder={f.ph}
                  className="text-sm bg-white rounded-xl border border-border px-3 py-2 outline-none focus:border-brand/40"
                />
              ))}
              <input
                type="number" min={1}
                value={filters.people ?? ""}
                onChange={(e) => setFilters({ ...filters, people: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Number of people"
                className="text-sm bg-white rounded-xl border border-border px-3 py-2 outline-none focus:border-brand/40"
              />
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-3xl bg-gradient-to-br from-leaf to-[oklch(0.45_0.15_150)] p-4 text-leaf-foreground">
            <p className="text-sm leading-relaxed">{result.summary}</p>
          </div>
        )}

        {mutation.isPending && picks.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        )}

        {!mutation.isPending && !result && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Type a request or pick a few filters, then tap <span className="font-semibold text-charcoal">Suggest</span>.
          </div>
        )}

        <div className="space-y-3">
          {picks.map(({ pick, meal }) => (
            <ResultCard
              key={pick.label + meal.id}
              pick={pick}
              meal={meal}
              onOpen={() => setOpenMeal({ meal, pick })}
              onOrder={() => setOrderFor(meal)}
              onChef={() => setChefFor(meal)}
              onFeedback={(fb) => { setFeedback(fb); toast.success("Got it — refining…"); mutation.mutate(fb); }}
            />
          ))}
        </div>

        {result && (
          <button onClick={submit} disabled={mutation.isPending} className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-brand/30 text-brand py-2.5 text-sm font-medium disabled:opacity-60">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Show different options
          </button>
        )}

        <p className="text-[11px] text-muted-foreground leading-relaxed pt-3 border-t border-border">
          <Info className="inline h-3 w-3 mr-1 align-middle" />
          Nutritional values are estimates and may vary based on ingredients, portion size, and preparation. MealBeta recommendations are for general informational purposes. Users with medical conditions should follow advice from a qualified healthcare professional.
        </p>
      </div>

      <div className="h-6" />

      <MealDetailDialog open={openMeal} onClose={() => setOpenMeal(null)} ingredientsSplit={ingredientsSplit} onOrder={() => { if (openMeal) { setOrderFor(openMeal.meal); setOpenMeal(null); } }} onChef={() => { if (openMeal) { setChefFor(openMeal.meal); setOpenMeal(null); } }} />
      <OrderDialog meal={orderFor} city={filters.city} onClose={() => setOrderFor(null)} enabled={!!user} />
      <ChefDialog meal={chefFor} city={filters.city} onClose={() => setChefFor(null)} enabled={!!user} />
    </PhoneShell>
  );
}

function ResultCard({
  pick, meal, onOpen, onOrder, onChef, onFeedback,
}: {
  pick: RecommendPick; meal: UiMeal;
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
            <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />est. ₦{meal.cookMin.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" />{meal.caloriesMin}–{meal.caloriesMax} kcal</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{meal.cookingTimeMin}m</span>
            {pick.mealTime && <span className="inline-flex items-center gap-1"><Utensils className="h-3 w-3" />{pick.mealTime}</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-leaf/10 text-leaf font-medium">P: {meal.protein}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm/20 text-charcoal font-medium">C: {meal.carbs}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">F: {meal.fat}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-charcoal font-medium">Fibre: {meal.fiber}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-secondary/50 p-2.5">
        <p className="text-[11px] font-semibold text-charcoal mb-0.5">Why this was recommended</p>
        <p className="text-xs text-charcoal/80 leading-snug">{pick.reason}</p>
        {pick.considerations && <p className="text-[11px] text-muted-foreground mt-1">Consider: {pick.considerations}</p>}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onOrder} className="inline-flex items-center justify-center gap-1 rounded-full bg-brand/10 text-brand py-2 text-xs font-medium">
          <Store className="h-3.5 w-3.5" /> Order this
        </button>
        <button onClick={onChef} className="inline-flex items-center justify-center gap-1 rounded-full bg-leaf/10 text-leaf py-2 text-xs font-medium">
          <ChefHat className="h-3.5 w-3.5" /> Find a chef
        </button>
        <Link to="/meal/$id" params={{ id: meal.id }} className="inline-flex items-center justify-center gap-1 rounded-full bg-warm/20 text-charcoal py-2 text-xs font-medium">
          <Utensils className="h-3.5 w-3.5" /> View recipe
        </Link>
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
              <p className="text-xs text-charcoal/80 leading-relaxed">{open.pick.reason}</p>
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

function OrderDialog({ meal, city, onClose, enabled }: { meal: UiMeal | null; city?: string; onClose: () => void; enabled: boolean }) {
  const fetchFn = useServerFn(findRestaurantsForMeal);
  const q = useQuery({
    queryKey: ["today-restaurants", meal?.slug, city],
    enabled: !!meal && enabled,
    queryFn: () => fetchFn({ data: { mealSlug: meal!.slug, city } }) as unknown as ReturnType<typeof findRestaurantsForMeal>,
  });
  return (
    <Dialog open={!!meal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-lg">Restaurants for {meal?.name}</DialogTitle>
          <DialogDescription className="text-xs">Based on active listings{city ? ` in ${city}` : ""}.</DialogDescription>
        </DialogHeader>
        {q.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>}
        {q.data && q.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No matching restaurants yet{city ? ` in ${city}` : ""}. Try clearing your city filter.</p>
        )}
        <div className="space-y-2">
          {q.data?.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.name} {r.verified && <span className="text-[10px] text-leaf ml-1">✓ verified</span>}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.area ? `${r.area}, ` : ""}{r.city}</p>
                  {r.address && <p className="text-[11px] text-muted-foreground truncate">{r.address}</p>}
                </div>
                <span className="text-xs bg-warm/20 rounded-full px-2 py-0.5 whitespace-nowrap">★ {r.rating.toFixed(1)}</span>
              </div>
              <div className="mt-2 flex gap-2">
                {r.phone && <a href={`tel:${r.phone}`} className="text-xs px-3 py-1 rounded-full bg-brand text-brand-foreground">Call</a>}
                {r.whatsapp && <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded-full bg-leaf text-leaf-foreground">WhatsApp</a>}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChefDialog({ meal, city, onClose, enabled }: { meal: UiMeal | null; city?: string; onClose: () => void; enabled: boolean }) {
  const fetchFn = useServerFn(findChefsForMeal);
  const q = useQuery({
    queryKey: ["today-chefs", meal?.slug, city],
    enabled: !!meal && enabled,
    queryFn: () => fetchFn({ data: { mealName: meal!.name, category: meal!.category, city } }) as unknown as ReturnType<typeof findChefsForMeal>,
  });
  return (
    <Dialog open={!!meal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-lg">Chefs for {meal?.name}</DialogTitle>
          <DialogDescription className="text-xs">Verified & featured chefs first{city ? `, in ${city}` : ""}.</DialogDescription>
        </DialogHeader>
        {q.isLoading && <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>}
        {q.data && q.data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No chefs match yet{city ? ` in ${city}` : ""}. Try broadening your city.</p>
        )}
        <div className="space-y-2">
          {q.data?.map((c) => (
            <Link key={c.id} to="/chefs/$slug" params={{ slug: c.slug }} onClick={onClose} className="block rounded-2xl border border-border p-3 hover:border-brand/40">
              <div className="flex items-start gap-3">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-warm/20 flex items-center justify-center text-lg">👨‍🍳</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">
                    {c.businessName}
                    {c.verified && <span className="text-[10px] text-leaf ml-1">✓</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.area ? `${c.area}, ` : ""}{c.city}</p>
                  {(c.priceMin || c.priceMax) && (
                    <p className="text-[11px] text-brand mt-0.5">from ₦{(c.priceMin ?? 0).toLocaleString()}{c.priceMax ? `–₦${c.priceMax.toLocaleString()}` : ""}</p>
                  )}
                </div>
                {c.rating != null && <span className="text-xs bg-warm/20 rounded-full px-2 py-0.5">★ {c.rating.toFixed(1)}</span>}
              </div>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
