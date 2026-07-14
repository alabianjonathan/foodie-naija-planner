import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { ChefHat, Sparkles, ShieldCheck, MessageCircle, CalendarDays, Utensils, Soup, Cake, Flame, HeartPulse, PartyPopper, Star, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/private-chefs")({
  head: () => ({
    meta: [
      { title: "Private Chefs on MealBeta — Book chefs, meal prep & event caterers" },
      { name: "description", content: "MealBeta connects you with verified private chefs, home cooks, meal prep vendors and event caterers. Plan your meals, then book someone to cook them." },
      { property: "og:title", content: "Private Chefs on MealBeta" },
      { property: "og:description", content: "Book verified private chefs, meal prep vendors and event caterers near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivateChefsLanding,
});

const CATEGORIES = [
  { icon: ChefHat, label: "Private chefs", desc: "Cook in your home for dinners & dates" },
  { icon: Utensils, label: "Home cooks", desc: "Traditional meals cooked with love" },
  { icon: CalendarDays, label: "Meal prep", desc: "Weekly plans delivered ready-to-eat" },
  { icon: Soup, label: "Soup bowls", desc: "Egusi, afang, ogbono & more in bowls" },
  { icon: Flame, label: "Grill & BBQ", desc: "Suya, asun, grilled fish on demand" },
  { icon: Cake, label: "Pastry & bakers", desc: "Cakes, pastries and small chops" },
  { icon: HeartPulse, label: "Healthy & diet", desc: "Diabetic, keto, weight-loss friendly" },
  { icon: PartyPopper, label: "Event catering", desc: "Birthdays, weddings, office lunches" },
];

const STEPS = [
  { n: "1", title: "Plan your meal", desc: "Use the MealBeta planner to decide what to eat and see the cost." },
  { n: "2", title: "Pick a chef", desc: "Browse verified chefs near you by category, area and budget." },
  { n: "3", title: "Book & enjoy", desc: "Message on WhatsApp or send a request. Pay the chef directly." },
];

const CHEF_BENEFITS = [
  "Free Basic listing — start getting leads today",
  "Verified badge builds trust with customers",
  "Featured & Premium plans for more visibility",
  "Direct WhatsApp leads — no middleman commissions",
  "Analytics on profile views and bookings",
];

function PrivateChefsLanding() {
  return (
    <PhoneShell>
      <TopBar title="Private Chefs" back="/" />
      <div className="px-5 pt-2 pb-8 space-y-8">
        {/* Hero */}
        <section className="rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-6 text-brand-foreground shadow-[var(--shadow-lift)] relative overflow-hidden">
          <ChefHat className="absolute -right-4 -bottom-4 h-32 w-32 opacity-20" />
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/25 backdrop-blur rounded-full px-2.5 py-1">
            <Sparkles className="h-3 w-3" /> New on MealBeta
          </div>
          <h1 className="mt-3 font-display text-3xl leading-tight">
            Don't just decide what to eat.<br />Get someone to cook it.
          </h1>
          <p className="mt-2 text-sm text-white/90 max-w-md">
            MealBeta now connects you with private chefs, home cooks, meal prep vendors and event caterers — all in one place.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/chefs" className="inline-flex items-center gap-1.5 rounded-full bg-white text-brand text-sm font-semibold px-4 py-2.5">
              Browse chefs <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/become-a-chef" className="inline-flex items-center rounded-full bg-white/15 backdrop-blur border border-white/30 text-white text-sm font-semibold px-4 py-2.5">
              I'm a chef — join
            </Link>
          </div>
        </section>

        {/* Why MealBeta chefs */}
        <section>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Why MealBeta</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">More than a delivery app</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chowdeck and Glovo bring restaurant food. MealBeta helps you <span className="text-charcoal font-medium">plan meals</span>, then choose how to get them — cook yourself, order from a restaurant, or contact a chef.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="card-soft !p-3">
              <Utensils className="h-5 w-5 mx-auto text-brand" />
              <p className="mt-1.5 text-[11px] font-semibold text-charcoal leading-tight">Cook myself</p>
            </div>
            <div className="card-soft !p-3">
              <Flame className="h-5 w-5 mx-auto text-warm" />
              <p className="mt-1.5 text-[11px] font-semibold text-charcoal leading-tight">Order restaurant</p>
            </div>
            <div className="card-soft !p-3 ring-2 ring-brand/40">
              <ChefHat className="h-5 w-5 mx-auto text-leaf" />
              <p className="mt-1.5 text-[11px] font-semibold text-charcoal leading-tight">Contact a chef</p>
            </div>
          </div>
        </section>

        {/* Who you can find */}
        <section>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Who you can find</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">Chefs for every occasion</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <div key={c.label} className="card-soft !p-4">
                <c.icon className="h-5 w-5 text-brand" />
                <p className="mt-2 text-sm font-semibold text-charcoal">{c.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">From craving to cooked in 3 steps</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((s) => (
              <li key={s.n} className="card-soft flex gap-3 items-start">
                <span className="shrink-0 h-8 w-8 rounded-full bg-brand text-brand-foreground flex items-center justify-center font-display text-sm">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-semibold text-charcoal">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Trust */}
        <section className="card-soft">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-leaf" />
            <p className="text-sm font-semibold text-charcoal">Verified &amp; reviewed</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Every chef is reviewed by the MealBeta team before getting a verified badge. Read customer ratings, browse listings and message chefs on WhatsApp before you book.
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-warm text-warm" /> Real reviews</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3 text-leaf" /> WhatsApp direct</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-brand" /> Verified profiles</span>
          </div>
        </section>

        {/* Sample use cases */}
        <section>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Real scenarios</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">What people use MealBeta chefs for</h2>
          <div className="mt-4 space-y-2">
            {[
              "Weekly meal prep for a busy workweek",
              "A private chef for a birthday dinner at home",
              "Diabetic-friendly meals for a parent",
              "Soup bowls stocked for the whole month",
              "Small chops & jollof for an office event",
              "Post-partum meals for a new mum",
            ].map((u) => (
              <div key={u} className="rounded-2xl bg-secondary/60 px-4 py-3 text-sm text-charcoal">
                {u}
              </div>
            ))}
          </div>
        </section>

        {/* For chefs */}
        <section className="rounded-3xl bg-charcoal text-white p-6 relative overflow-hidden">
          <Sparkles className="absolute -right-2 -top-2 h-24 w-24 opacity-10" />
          <p className="text-[11px] uppercase tracking-widest text-white/60">For chefs &amp; vendors</p>
          <h2 className="mt-1 font-display text-2xl leading-tight">Grow your food business on MealBeta</h2>
          <ul className="mt-4 space-y-2">
            {CHEF_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-white/90">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/become-a-chef" className="rounded-full bg-brand text-brand-foreground text-sm font-semibold px-4 py-2.5">
              Join free
            </Link>
            <Link to="/chef-plans" className="rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2.5">
              See plans
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <h2 className="font-display text-2xl leading-tight text-charcoal">Ready to eat better?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Discover chefs near you now.</p>
          <Link to="/chefs" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand text-brand-foreground text-sm font-semibold px-5 py-3">
            Browse MealBeta Chefs <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </PhoneShell>
  );
}
