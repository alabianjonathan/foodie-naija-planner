import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { Flame, Clock, Wallet, Heart, Share2, ShoppingBasket, CalendarPlus, Store, ArrowRight, Minus, Plus, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMealBySlug } from "@/lib/user-data.functions";
import { listRestaurants } from "@/lib/catalog.functions";
import { useSavedMealIds, useToggleSavedMeal } from "@/hooks/useSavedMeals";
import { toUiMeal } from "@/hooks/useCatalogMeals";
import type { CatalogMeal, CatalogRestaurant } from "@/lib/catalog.functions";

export const Route = createFileRoute("/meal/$id")({
  notFoundComponent: () => (
    <PhoneShell><TopBar title="Not found" /><div className="p-6">This meal doesn't exist. <Link to="/dashboard" className="text-brand">Go home</Link></div></PhoneShell>
  ),
  errorComponent: () => <PhoneShell><TopBar title="Error" /><div className="p-6">Couldn't load meal.</div></PhoneShell>,
  component: MealPage,
});

function MealPage() {
  const slug = Route.useParams().id;
  const [servings, setServings] = useState(1);
  const getBySlug = useServerFn(getMealBySlug);
  const fetchRests = useServerFn(listRestaurants);
  const { data: dbMeal, isLoading } = useQuery({
    queryKey: ["meal-by-slug", slug],
    queryFn: () => getBySlug({ data: { slug } }) as unknown as Promise<CatalogMeal | null>,
  });
  const { data: rests = [] } = useQuery({
    queryKey: ["catalog", "restaurants"],
    queryFn: () => fetchRests() as unknown as Promise<CatalogRestaurant[]>,
    enabled: !!dbMeal,
  });
  const { data: savedIds = [] } = useSavedMealIds();
  const toggle = useToggleSavedMeal();

  if (isLoading) return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;
  if (!dbMeal) throw notFound();

  const meal = toUiMeal(dbMeal);
  const saved = savedIds.includes(dbMeal.id);
  const kcal = Math.round(((meal.caloriesMin + meal.caloriesMax) / 2) * servings);
  const cost = Math.round(((meal.cookMin + meal.cookMax) / 2) * servings);
  const orderPrice = Math.round(((meal.orderMin + meal.orderMax) / 2) * servings);
  const nearbyRestaurants = rests.filter((r) => r.mealSlugs.includes(meal.slug));

  return (
    <PhoneShell>
      <div className="relative">
        <div className={`h-64 bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-8xl relative`}>
          <span className="drop-shadow-xl">{meal.emoji}</span>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          <TopBar title="" right={
            <div className="flex gap-2">
              <button disabled={toggle.isPending} onClick={() => toggle.mutate({ mealId: dbMeal.id, saved: !saved })} className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-60">
                <Heart className={`h-4 w-4 ${saved ? "fill-brand text-brand" : "text-charcoal"}`} />
              </button>
              <button className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-charcoal" />
              </button>
            </div>
          } />
        </div>
      </div>

      <div className="px-6 pt-5 -mt-6 relative">
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-lift)]">
          <div className="flex flex-wrap gap-2 mb-3">
            {meal.bestTime.map(t => <span key={t} className="chip !bg-warm/20 !text-charcoal">{t}</span>)}
            <span className="chip !bg-leaf/10 !text-leaf">Health {meal.healthScore}/10</span>
          </div>
          <h1 className="font-display text-2xl leading-tight">{meal.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{meal.description}</p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary p-2.5">
              <Flame className="h-4 w-4 mx-auto text-brand" />
              <p className="text-[10px] text-muted-foreground mt-1">Calories</p>
              <p className="text-sm font-semibold">{kcal}</p>
            </div>
            <div className="rounded-xl bg-secondary p-2.5">
              <Clock className="h-4 w-4 mx-auto text-brand" />
              <p className="text-[10px] text-muted-foreground mt-1">Cook time</p>
              <p className="text-sm font-semibold">{meal.cookingTimeMin} min</p>
            </div>
            <div className="rounded-xl bg-secondary p-2.5">
              <Wallet className="h-4 w-4 mx-auto text-brand" />
              <p className="text-[10px] text-muted-foreground mt-1">Cook cost</p>
              <p className="text-sm font-semibold">₦{cost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 card-soft">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servings</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setServings(Math.max(1, servings - 1))} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"><Minus className="h-4 w-4" /></button>
              <span className="font-display text-2xl w-8 text-center">{servings}</span>
              <button onClick={() => setServings(servings + 1)} className="h-9 w-9 rounded-full bg-brand text-brand-foreground flex items-center justify-center"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Per serving</p>
              <p className="font-semibold">{meal.portion}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 card-soft">
          <h3 className="font-display text-lg">Nutrition</h3>
          <div className="mt-3 space-y-3">
            {Object.values(meal.nutrition).map((n) => (
              <div key={n.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span>{n.emoji}</span> {n.name}
                  </span>
                  <span className="font-medium">
                    {n.score}/10 <span className="text-muted-foreground">• {n.label}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, Math.max(0, n.score * 10))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {meal.healthNote && (
            <p className="mt-4 rounded-xl bg-leaf/10 text-leaf text-xs p-3 leading-relaxed">💚 {meal.healthNote}</p>
          )}
        </div>

        <div className="mt-5 card-soft">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Ingredients</h3>
            <span className="text-xs text-muted-foreground">Est. ₦{cost.toLocaleString()}</span>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {meal.ingredients.map(i => (
              <li key={i.name} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.qty}</p>
                </div>
                <span className="text-muted-foreground">₦{(i.price * servings).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 rounded-3xl border-2 border-dashed border-brand/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Order instead?</p>
            <p className="font-display text-lg">~₦{orderPrice.toLocaleString()} from restaurants</p>
          </div>
          <Store className="h-8 w-8 text-brand" />
        </div>

        {nearbyRestaurants.length > 0 && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg">Where to order</h3>
              <Link to="/restaurants" className="text-xs text-brand">All</Link>
            </div>
            <div className="mt-3 space-y-3">
              {nearbyRestaurants.slice(0, 3).map(r => (
                <div key={r.id} className="card-soft !p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-warm to-brand flex items-center justify-center text-white font-display">{r.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.area} · ★ {r.rating} · {r.distanceKm}km</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link to="/planner" className="flex items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-medium">
            <CalendarPlus className="h-4 w-4" /> Add to plan
          </Link>
          <Link to="/shopping" className="flex items-center justify-center gap-2 rounded-full bg-brand text-brand-foreground py-3.5 text-sm font-medium">
            <ShoppingBasket className="h-4 w-4" /> Shopping list
          </Link>
        </div>
      </div>

      <div className="h-6" />
    </PhoneShell>
  );
}
