import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { MealCard } from "@/components/MealCard";
import { Sparkles, CalendarDays, ShoppingBasket, Store, Flame, Loader2, Clock, ChefHat, Mic, Send, SlidersHorizontal, LineChart, Droplets } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDaySummary, getGoals } from "@/lib/nutrition-tracker.functions";
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


const AI_PLACEHOLDERS = [
  "Tell MealBeta what you feel like eating…",
  "I have rice, eggs and chicken at home.",
  "I want a healthy meal under ₦3,000.",
  "Suggest something filling for dinner.",
  "I want Nigerian food that is not spicy.",
  "What can I eat after the gym?",
];

function Home() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [name, setName] = useState<string>("");
  const [profile, setProfile] = useState<{ restriction?: string | null; goal?: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const [aiQuery, setAiQuery] = useState("");
  const [phIndex, setPhIndex] = useState(0);
  const slot = useMemo(() => currentSlot(), [nonce]);
  const { meals, isLoading: mealsLoading } = useCatalogMeals();

  useEffect(() => {
    const t = setInterval(() => setPhIndex((i) => (i + 1) % AI_PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const goSuggest = () => {
    void navigate({ to: "/today", search: { q: aiQuery || undefined, auto: aiQuery ? true : undefined } });
  };
  const openFilters = () => {
    void navigate({ to: "/today", search: { q: aiQuery || undefined, openFilters: true } });
  };
  const startVoice = () => {
    type SR = { start: () => void; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; lang: string; interimResults: boolean };
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) { toast.info("Voice input isn't supported on this device."); return; }
    const r = new Rec();
    r.lang = "en-NG";
    r.interimResults = false;
    r.onresult = (e) => setAiQuery((q) => (q ? q + " " : "") + e.results[0][0].transcript);
    r.onerror = () => toast.error("Couldn't hear you — try again.");
    r.start();
    toast.info("Listening…");
  };



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

      {/* MealBeta AI search box (replaces search + Today's AI pick banner) */}
      <section className="px-5">
        <div className="rounded-3xl border border-border bg-white p-4 shadow-[0_8px_28px_-16px_rgba(15,60,25,0.25)] focus-within:border-brand/50 transition">
          <div className="flex items-start gap-2">
            <textarea
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); goSuggest(); } }}
              placeholder={AI_PLACEHOLDERS[phIndex]}
              rows={2}
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
                onClick={openFilters}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-2 text-sm font-medium text-charcoal hover:border-brand/40"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <button
                onClick={goSuggest}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground px-4 py-2 text-sm font-semibold"
              >
                <Send className="h-4 w-4" /> Suggest Meals
              </button>
            </div>
          </div>
        </div>
      </section>

      <>


      {/* Bento grid */}
      <section className="px-5 mt-5 grid grid-cols-6 gap-3">

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
      </>

      <div className="h-8" />
    </PhoneShell>

  );
}

