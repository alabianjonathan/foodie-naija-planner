import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { MealCard } from "@/components/MealCard";
import { meals, type Meal } from "@/data/meals";
import { Sparkles, Search, CalendarDays, ShoppingBasket, Store, Flame, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";


export const Route = createFileRoute("/home")({
  component: Home,
});

function currentSlot(): "Breakfast" | "Lunch" | "Dinner" {
  const h = new Date().getHours();
  if (h < 11) return "Breakfast";
  if (h < 16) return "Lunch";
  return "Dinner";
}

function Home() {
  const { user, loading } = useRequireAuth();
  const [name, setName] = useState<string>("");
  const [profile, setProfile] = useState<{ restriction?: string | null; goal?: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const slot = useMemo(() => currentSlot(), [nonce]);

  const { featured, quick } = useMemo(() => {
    const restriction = (profile?.restriction ?? "").toLowerCase();
    const goal = (profile?.goal ?? "").toLowerCase();
    const matchesPrefs = (m: Meal) => {
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
  }, [nonce, profile, slot]);

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

  return (
    <PhoneShell>
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <img src={logoAsset.url} alt="MealBeta" className="h-9 w-auto" />
          <Link to="/profile" className="h-11 w-11 rounded-full bg-gradient-to-br from-brand to-warm flex items-center justify-center text-white font-display text-lg">{initial}</Link>
        </div>
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Welcome</p>
          <h1 className="font-display text-2xl">{name || "there"} 👋</h1>
        </div>


        <Link to="/today" className="mt-5 block rounded-3xl bg-gradient-to-br from-brand to-[oklch(0.6_0.2_25)] p-5 text-brand-foreground shadow-[var(--shadow-lift)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 rounded-full px-2.5 py-1">
                <Sparkles className="h-3 w-3" /> AI Suggestion
              </div>
              <h2 className="mt-3 font-display text-xl leading-tight">What should I eat today?</h2>
              <p className="mt-1 text-sm text-white/85">Tap for 3 meals tuned to your budget & goal.</p>
            </div>
            <span className="text-3xl">🍲</span>
          </div>
        </Link>
      </header>

      <section className="sticky top-0 z-20 px-6 py-3 bg-background/85 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: "/planner", icon: CalendarDays, label: "Planner", color: "bg-leaf/10 text-leaf" },
            { to: "/popular", icon: Flame, label: "General", color: "bg-brand/10 text-brand" },
            { to: "/shopping", icon: ShoppingBasket, label: "Shop list", color: "bg-warm/20 text-charcoal" },
            { to: "/restaurants", icon: Store, label: "Restaurants", color: "bg-secondary text-charcoal" },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-[var(--shadow-soft)]">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>


      <section className="px-6 mt-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search jollof, egusi, moi moi…" className="w-full rounded-full bg-secondary px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
        </div>
      </section>

      <section className="px-6 mt-8">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="font-display text-xl">Quick picks for you</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{slot} picks · tuned to your preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/popular" className="text-xs text-brand font-medium">Browse all</Link>
            <button onClick={() => setNonce(n => n + 1)} className="text-xs text-brand font-medium">Shuffle</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {featured.map((m: Meal) => <MealCard key={m.id} meal={m} />)}
        </div>
      </section>

      <section className="px-6 mt-8">
        <h2 className="font-display text-xl">Quick meals (under 40 min)</h2>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 snap-x">
          {quick.map((m: Meal) => (
            <Link key={m.id} to="/meal/$id" params={{ id: m.id }} className="min-w-[220px] snap-start card-soft">
              <div className={`aspect-video rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center text-5xl mb-3`}>{m.emoji}</div>
              <h3 className="font-display text-base leading-tight">{m.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.cookingTimeMin} min • {m.caloriesMin}–{m.caloriesMax} kcal</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-6" />
    </PhoneShell>
  );
}
