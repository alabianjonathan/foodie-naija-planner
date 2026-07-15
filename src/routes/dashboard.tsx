import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { MealCard } from "@/components/MealCard";
import { Sparkles, CalendarDays, ShoppingBasket, Store, Flame, Loader2, Clock, ChefHat, Mic, Send, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { useCatalogMeals, type UiMeal } from "@/hooks/useCatalogMeals";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";
import { toast } from "sonner";



export const Route = createFileRoute("/dashboard")({
  component: Home,
});

function currentSlot(): "Breakfast" | "Lunch" | "Dinner" {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  return "Dinner";
}

function mealPeriod(): string {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 16) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function Home() {
  const { user, loading } = useRequireAuth();
  const [name, setName] = useState<string>("");
  const [profile, setProfile] = useState<{ restriction?: string | null; goal?: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [query, setQuery] = useState("");
  const slot = useMemo(() => currentSlot(), [nonce]);
  const { meals, isLoading: mealsLoading } = useCatalogMeals();

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return meals.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.ingredients.some(i => i.name.toLowerCase().includes(q))
    ).slice(0, 12);
  }, [query, meals]);


  const { featured, quick } = useMemo(() => {
    const restriction = (profile?.restriction ?? "").toLowerCase();
    const goal = (profile?.goal ?? "").toLowerCase();
    const matchesPrefs = (m: UiMeal) => {
      if (restriction.includes("vegetarian") && m.protein && /chicken|beef|fish|meat|suya|goat|turkey/i.test(m.protein)) return false;
      if (restriction.includes("no pork") && /pork/i.test(m.name)) return false;
      if (goal.includes("lose") && m.healthScore != null && m.healthScore < 6) return false;
      return true;
    };
    const popular = meals.filter(m => m.popular);
    const forSlot = popular.filter(m => m.bestTime.includes(slot) && matchesPrefs(m));
    const featuredPool = (forSlot.length >= 4 ? forSlot : popular.filter(matchesPrefs)).sort(() => Math.random() - 0.5);
    const quickPool = popular.filter(m => m.cookingTimeMin <= 45 && matchesPrefs(m)).sort(() => Math.random() - 0.5);
    return {
      featured: featuredPool.slice(0, 4),
      quick: (quickPool.length >= 4 ? quickPool : popular.filter(matchesPrefs)).slice(0, 6),
    };
  }, [nonce, profile, slot, meals]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, restriction, goal").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name?.split(" ")[0] ?? "");
        setProfile({ restriction: data?.restriction, goal: data?.goal });
      });
  }, [user]);


  if (loading || !user) return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;

  const initial = (name || user.email || "U").charAt(0).toUpperCase();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <PhoneShell>
      {/* Top bar */}
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <img src={logoAsset.url} alt="MealBeta" className="h-8 w-auto" />
        <Link to="/profile" className="h-10 w-10 rounded-full bg-gradient-to-br from-brand to-warm flex items-center justify-center text-white font-display text-base shadow-[var(--shadow-soft)]">{initial}</Link>
      </header>

      {/* Editorial greeting */}
      <section className="px-5 pt-2 pb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{greeting}</p>
        <h1 className="mt-1 font-display text-[2rem] leading-[1.05] tracking-tight">
          {name || "Welcome"},<br/>
          <span className="italic text-brand">What are you craving today?</span>
        </h1>
      </section>

      {/* Search */}
      <section className="px-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jollof, egusi, moi moi…"
            className="w-full rounded-2xl bg-secondary/60 border border-border/60 pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-background/80 flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </section>

      {query.trim() && (
        <section className="px-5 mt-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            {searchResults.length} result{searchResults.length === 1 ? "" : "s"} for "{query}"
          </p>
          {searchResults.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No meals match. Try "rice", "soup" or "beans".
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {searchResults.map((m) => <MealCard key={m.id} meal={m} />)}
            </div>
          )}
        </section>
      )}

      {!query.trim() && (<>


      {/* Bento grid */}
      <section className="px-5 mt-5 grid grid-cols-6 gap-3">
        {/* Hero AI suggestion — spans full width */}
        <Link to="/today" className="col-span-6 relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-5 text-brand-foreground shadow-[var(--shadow-lift)]">
          <div className="absolute -right-6 -bottom-6 text-[7rem] opacity-25 leading-none select-none">🍲</div>
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/25 backdrop-blur rounded-full px-2.5 py-1">
              <Sparkles className="h-3 w-3" /> Today's AI pick
            </div>
            <h2 className="mt-3 font-display text-[1.5rem] leading-[1.1]">What should you eat this {mealPeriod()}?</h2>
            <p className="mt-1 text-sm text-white/85 max-w-[75%]">3 meals tuned to your budget & goal.</p>
          </div>
        </Link>

        {/* Planner — tall */}
        <Link to="/planner" className="col-span-3 row-span-2 rounded-3xl bg-card p-4 shadow-[var(--shadow-soft)] flex flex-col justify-between min-h-[150px]">
          <div className="h-11 w-11 rounded-2xl bg-leaf/15 text-leaf flex items-center justify-center">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Week</p>
            <h3 className="font-display text-lg leading-tight">Meal planner</h3>
            <p className="text-xs text-muted-foreground mt-1">Plan 7 days ahead</p>
          </div>
        </Link>

        {/* Shopping */}
        <Link to="/shopping" className="col-span-3 rounded-3xl bg-warm/25 p-4 shadow-[var(--shadow-soft)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-warm/60 text-charcoal flex items-center justify-center shrink-0">
            <ShoppingBasket className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm leading-tight truncate">Shop list</h3>
            <p className="text-[11px] text-muted-foreground truncate">Market ready</p>
          </div>
        </Link>

        {/* Restaurants */}
        <Link to="/restaurants" className="col-span-3 rounded-3xl bg-secondary p-4 shadow-[var(--shadow-soft)] flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-background text-charcoal flex items-center justify-center shrink-0">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm leading-tight truncate">Nearby</h3>
              <p className="text-[11px] text-muted-foreground truncate">Restaurants nearby</p>
          </div>
        </Link>

        {/* MealBeta Chefs full width strip */}
        <Link to="/chefs" className="col-span-6 rounded-3xl bg-gradient-to-r from-leaf/15 to-brand/10 p-4 shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-leaf/20 text-leaf flex items-center justify-center">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm leading-tight">MealBeta Chefs</h3>
              <p className="text-[11px] text-muted-foreground">Private chefs, meal prep &amp; event vendors</p>
            </div>
          </div>
          <span className="text-xs text-brand font-medium">Discover →</span>
        </Link>

        {/* Popular full width strip */}
        <Link to="/popular" className="col-span-6 rounded-3xl bg-brand/8 p-4 shadow-[var(--shadow-soft)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-brand/15 text-brand flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-sm leading-tight">Popular in Nigeria</h3>
              <p className="text-[11px] text-muted-foreground">Trending this week</p>
            </div>
          </div>
          <span className="text-xs text-brand font-medium">Browse →</span>
        </Link>

      </section>

      {/* Quick picks — editorial */}
      <section className="px-5 mt-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{slot} · for you</p>
            <h2 className="font-display text-2xl mt-1">Quick picks</h2>
          </div>
          <button onClick={() => setNonce(n => n + 1)} className="text-xs text-brand font-medium underline underline-offset-4">Shuffle</button>
        </div>
        {mealsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-brand" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {featured.map((m) => <MealCard key={m.id} meal={m} />)}
          </div>
        )}
      </section>

      {/* Under 40 min — compact horizontal cards */}
      <section className="mt-8">
        <div className="px-5 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Fast lane</p>
            <h2 className="font-display text-2xl mt-1">Under 40 min</h2>
          </div>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 px-5 snap-x scrollbar-hide">
          {quick.map((m) => (
            <Link
              key={m.id}
              to="/meal/$id"
              params={{ id: m.id }}
              className="min-w-[160px] max-w-[160px] snap-start card-soft !p-3 flex flex-col"
            >
              <div className={`aspect-square rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-5xl relative overflow-hidden`}>
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-medium bg-background/90 text-foreground rounded-full px-1.5 py-0.5">
                  <Clock className="h-2.5 w-2.5" /> {m.cookingTimeMin}m
                </span>
                <span className="drop-shadow-lg">{m.emoji}</span>
              </div>
              <h3 className="font-display text-sm leading-tight mt-3 line-clamp-2 min-h-[2.5rem]">{m.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-1">{m.caloriesMin}–{m.caloriesMax} kcal</p>
            </Link>
          ))}
        </div>
      </section>
      </>)}

      <div className="h-8" />
    </PhoneShell>

  );
}

