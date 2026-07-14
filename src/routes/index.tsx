import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { countCities } from "@/lib/catalog.functions";
import { useEffect } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Flame,
  Store,
  Sparkles,
  ShoppingBasket,
  Bookmark,
  Wallet,
  Check,
  Leaf,
} from "lucide-react";
import heroFood from "@/assets/hero-food.jpg";
import spread from "@/assets/landing-spread.jpg";
import userShot from "@/assets/landing-user.jpg";
import restaurant from "@/assets/landing-restaurant.jpg";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MealBeta — Plan Better. Eat Better. Spend Better." },
      {
        name: "description",
        content:
          "Nigeria's AI meal planning assistant. Decide what to eat, plan the week, estimate cost and calories, generate shopping lists, and find restaurants near you.",
      },
      { property: "og:title", content: "MealBeta — Plan meals, track cost, eat better" },
      {
        property: "og:description",
        content:
          "AI meal planning for Nigerian kitchens. Weekly plans, calorie & cost estimates, smart shopping lists, and nearby restaurants.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mealbeta.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/" }],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const fetchCityCount = useServerFn(countCities);
  const { data: cityCount = 0 } = useQuery({
    queryKey: ["catalog", "city-count"],
    queryFn: () => fetchCityCount(),
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", data.session.user.id)
        .maybeSingle();
      navigate({ to: p?.onboarded ? "/dashboard" : "/onboarding" });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustStrip cityCount={cityCount} />
      <Features />
      <HowItWorks />
      <Showcase />
      <Restaurants />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ---------------- Nav ---------------- */
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="MealBeta" className="h-8 w-auto" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#restaurants" className="text-sm font-medium text-muted-foreground hover:text-foreground">Restaurants</a>
          <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground">Reviews</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary md:inline-flex">
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:opacity-95"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-brand/10 blur-3xl" aria-hidden />
      <div className="absolute -left-24 bottom-0 h-[380px] w-[380px] rounded-full bg-warm/10 blur-3xl" aria-hidden />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-14 md:pb-24 md:pt-16">
        <div className="flex flex-col justify-center">
          <span className="chip w-fit bg-[oklch(0.94_0.04_145/0.5)] text-[oklch(0.35_0.1_145)]">
            <Sparkles className="h-3.5 w-3.5 text-warm" fill="currentColor" />
            AI meal planner for Nigeria
          </span>

          <h1 className="mt-5 font-display text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.02] tracking-tight text-charcoal">
            Plan better. <br />
            Eat better. <span className="text-warm">Spend</span> better.
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            MealBeta turns "what should I eat?" into a plan. Weekly meal plans built around
            <span className="text-foreground"> Nigerian food</span>, honest calorie & cost estimates,
            shopping lists that match your market, and nearby restaurants when you don't feel like cooking.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-base font-semibold text-brand-foreground shadow-lift hover:opacity-95"
            >
              Start planning free
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/25 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary">
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> Free to start</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> Built for Naira budgets</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> Local Nigerian meals</li>
          </ul>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] shadow-lift ring-1 ring-border/50">
            <img
              src={heroFood}
              alt="Jollof rice with chicken and plantain"
              width={1200}
              height={1500}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Floating cards */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-soft backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[oklch(0.94_0.04_80/0.6)] text-warm">
                <Flame className="h-4 w-4" fill="currentColor" />
              </div>
              <div className="pr-1">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Today</div>
                <div className="text-sm font-bold text-charcoal">1,840 kcal</div>
              </div>
            </div>

            <div className="absolute bottom-5 left-4 right-4 rounded-2xl bg-white/95 p-3 shadow-soft backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.94_0.04_145/0.6)] text-[oklch(0.4_0.12_145)]">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-charcoal">This week's plan is ready</div>
                  <div className="text-[11px] text-muted-foreground">21 meals · ₦18,400 est · 7 days</div>
                </div>
                <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-bold text-brand">NEW</span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden rotate-[-6deg] rounded-2xl bg-card px-4 py-3 shadow-lift ring-1 ring-border md:block">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cheapest swap</div>
            <div className="mt-1 text-sm font-bold text-charcoal">Save ₦1,240 this week</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust strip ---------------- */
function TrustStrip() {
  const stats = [
    { k: "20,000+", v: "meals planned" },
    { k: "150+", v: "Nigerian dishes" },
    { k: "Many", v: "neighborhoods" },
    { k: "4.8★", v: "user rating" },
  ];
  return (
    <section className="border-y border-border/50 bg-secondary/40">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.v} className="text-center">
            <div className="font-display text-2xl text-charcoal md:text-3xl">{s.k}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features() {
  const items = [
    {
      icon: CalendarCheck,
      title: "Smart weekly plans",
      body: "Tell us your goals, household size, and taste. Get a 7-day plan that respects Nigerian palate and market reality.",
      tint: "bg-[oklch(0.94_0.04_145/0.5)] text-[oklch(0.4_0.12_145)]",
    },
    {
      icon: Flame,
      title: "Calories that make sense",
      body: "Every meal is broken down by kcal, protein, carbs, and fat — so 'eating better' stops being a guess.",
      tint: "bg-[oklch(0.94_0.04_80/0.55)] text-warm",
    },
    {
      icon: Wallet,
      title: "Real Naira cost",
      body: "See what the plan will actually cost this week. Swap expensive ingredients with one tap.",
      tint: "bg-[oklch(0.92_0.06_90/0.6)] text-[oklch(0.4_0.1_60)]",
    },
    {
      icon: ShoppingBasket,
      title: "Auto shopping list",
      body: "Consolidated by ingredient, grouped by market aisle. Tick as you shop, no more forgotten crayfish.",
      tint: "bg-[oklch(0.94_0.04_145/0.5)] text-[oklch(0.4_0.12_145)]",
    },
    {
      icon: Store,
      title: "Restaurants near you",
      body: "Craving efo riro but out of yam? Find spots nearby with the exact dish you're planning.",
      tint: "bg-[oklch(0.94_0.04_80/0.55)] text-warm",
    },
    {
      icon: Bookmark,
      title: "Save your favourites",
      body: "Bookmark meals you love. They cycle back into future plans automatically.",
      tint: "bg-[oklch(0.92_0.06_90/0.6)] text-[oklch(0.4_0.1_60)]",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="chip bg-brand/10 text-brand"><Leaf className="h-3.5 w-3.5" /> Everything you need</span>
        <h2 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-5xl">
          A kitchen assistant that <span className="text-warm">actually</span> gets Naija food.
        </h2>
        <p className="mt-4 text-muted-foreground">
          No generic keto templates. No "quinoa bowls". Just the meals you eat, planned well.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, body, tint }) => (
          <div key={title} className="group rounded-3xl border border-border/60 bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-bold text-charcoal">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Tell us about you", d: "Household size, budget range, dietary style, favourite dishes. Takes 60 seconds." },
    { n: "02", t: "Get your weekly plan", d: "Breakfast, lunch, dinner — with kcal and cost per meal, ready to tweak." },
    { n: "03", t: "Shop, cook, or order", d: "Use the smart list at the market, or find a nearby restaurant serving what you planned." },
  ];
  return (
    <section id="how" className="bg-[oklch(0.98_0.02_130)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-border/50">
              <img src={userShot} alt="Woman using MealBeta on her phone" width={1200} height={1400} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -right-5 hidden rounded-2xl bg-card p-4 shadow-lift ring-1 ring-border md:block">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Plan generated</div>
                  <div className="text-sm font-bold text-charcoal">in 4 seconds</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <span className="chip bg-warm/15 text-warm">How it works</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-5xl">
              From "I don't know" to dinner — in three steps.
            </h2>
            <div className="mt-8 space-y-6">
              {steps.map((s) => (
                <div key={s.n} className="flex gap-5">
                  <div className="font-display text-3xl text-brand">{s.n}</div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal">{s.t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Showcase (spread image) ---------------- */
function Showcase() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <span className="chip bg-brand/10 text-brand">Built for Naija plates</span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-5xl">
            Jollof, egusi, moi moi, suya — <span className="text-warm">not almond flour.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Our meal library is 150+ Nigerian dishes deep, with regional variations, swap suggestions, and cost estimates that
            reflect what things actually go for at Mile 12 — not a Whole Foods aisle.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            {[
              "Meals ranked by prep time so busy weeks stay realistic",
              "Vegetarian, low-carb, and high-protein presets that still taste Nigerian",
              "Smart swaps: ‘yam is expensive this week, try plantain’",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-border/50">
          <img src={spread} alt="Overhead spread of Nigerian dishes" width={1600} height={1200} loading="lazy" className="h-full w-full object-cover" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Restaurants ---------------- */
function Restaurants() {
  return (
    <section id="restaurants" className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-[1.15fr_1fr] md:items-center">
          <div className="order-2 overflow-hidden rounded-[2rem] shadow-lift ring-1 ring-border/50 md:order-1">
            <img src={restaurant} alt="Busy restaurant interior" width={1400} height={1000} loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="order-1 md:order-2">
            <span className="chip bg-warm/15 text-warm"><Store className="h-3.5 w-3.5" /> Not cooking tonight?</span>
            <h2 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-5xl">
              Find the exact dish, near you.
            </h2>
            <p className="mt-4 text-muted-foreground">
              We map real Nigerian restaurants by the meals they actually serve. Search by dish, filter by distance and price,
              and get there without scrolling ten delivery apps.
            </p>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-background hover:opacity-90">
              Explore restaurants
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Testimonials ---------------- */
function Testimonials() {
  const items = [
    {
      q: "I stopped eating the same three things every week. My grocery bill went down 22%.",
      a: "Amaka O.",
      r: "Lagos",
    },
    {
      q: "Finally an app that knows what egusi is. The calorie counts are genuinely useful.",
      a: "Tunde B.",
      r: "Abuja",
    },
    {
      q: "The shopping list alone is worth it. I don't forget anything at the market anymore.",
      a: "Chiamaka N.",
      r: "Port Harcourt",
    },
  ];
  return (
    <section id="faq" className="bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-brand/10 text-brand">Loved by home cooks</span>
          <h2 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-5xl">
            What people are saying.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it) => (
            <figure key={it.a} className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
              <div className="text-warm">★★★★★</div>
              <blockquote className="mt-4 text-[15px] leading-relaxed text-foreground">"{it.q}"</blockquote>
              <figcaption className="mt-5 text-sm">
                <div className="font-semibold text-charcoal">{it.a}</div>
                <div className="text-muted-foreground">{it.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[oklch(0.55_0.15_145)] via-[oklch(0.5_0.16_150)] to-[oklch(0.45_0.14_155)] px-6 py-16 text-center shadow-lift md:px-16 md:py-24">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-warm/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-4xl leading-tight text-white md:text-6xl">
            Your next meal, sorted.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Join thousands eating better, spending smarter, and reclaiming the "what's for dinner?" hour.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-[oklch(0.4_0.14_145)] shadow-lift hover:bg-white/95"
            >
              Start planning free
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[oklch(0.4_0.14_145)] text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/auth" className="text-sm font-medium text-white/85 underline underline-offset-4 hover:text-white">
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <img src={logoAsset.url} alt="MealBeta" className="h-6 w-auto" />
          <span>© {new Date().getFullYear()} MealBeta. Made in Nigeria.</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
