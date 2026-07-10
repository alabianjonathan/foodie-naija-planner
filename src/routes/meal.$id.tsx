import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { getMeal, restaurants, meals } from "@/data/meals";
import { Flame, Clock, Wallet, Heart, Share2, ShoppingBasket, CalendarPlus, Store, ArrowRight, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/meal/$id")({
  loader: ({ params }) => {
    const meal = getMeal(params.id);
    if (!meal) throw notFound();
    return { meal };
  },
  notFoundComponent: () => (
    <PhoneShell><TopBar title="Not found" /><div className="p-6">This meal doesn't exist. <Link to="/home" className="text-brand">Go home</Link></div></PhoneShell>
  ),
  errorComponent: () => <PhoneShell><TopBar title="Error" /><div className="p-6">Couldn't load meal.</div></PhoneShell>,
  component: MealPage,
});

function MealPage() {
  const meal = getMeal(Route.useParams().id) ?? meals[0];
  const [servings, setServings] = useState(1);
  const [saved, setSaved] = useState(false);

  const kcal = Math.round(((meal.caloriesMin + meal.caloriesMax) / 2) * servings);
  const cost = Math.round(((meal.cookMin + meal.cookMax) / 2) * servings);
  const orderPrice = Math.round(((meal.orderMin + meal.orderMax) / 2) * servings);

  const nearbyRestaurants = restaurants.filter(r => r.meals.includes(meal.id));

  return (
    <PhoneShell>
      <div className="relative">
        <div className={`h-64 bg-gradient-to-br ${meal.gradient} flex items-center justify-center text-8xl relative`}>
          <span className="drop-shadow-xl">{meal.emoji}</span>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          <TopBar title="" right={
            <div className="flex gap-2">
              <button onClick={() => setSaved(s => !s)} className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
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
          <div className="mt-3 space-y-2 text-sm">
            {[
              ["Protein", meal.protein], ["Carbs", meal.carbs], ["Fat", meal.fat], ["Fibre", meal.fiber],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{val}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-leaf/10 text-leaf text-xs p-3 leading-relaxed">
            💚 {meal.healthNote}
          </p>
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
