import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChefHat,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  CalendarDays,
  Utensils,
  Soup,
  Cake,
  Flame,
  HeartPulse,
  PartyPopper,
  Star,
  Check,
  Leaf,
  Store,
} from "lucide-react";
import logoAsset from "@/assets/mealbeta-logo.png.asset.json";

export const Route = createFileRoute("/private-chefs")({
  head: () => ({
    meta: [
      { title: "Private Chefs on MealBeta — Book chefs, meal prep & event caterers" },
      {
        name: "description",
        content:
          "MealBeta connects you with verified private chefs, home cooks, meal prep vendors and event caterers across Nigeria. Plan your meals, then book someone to cook them.",
      },
      { property: "og:title", content: "Private Chefs on MealBeta" },
      {
        property: "og:description",
        content:
          "Book verified private chefs, meal prep vendors and event caterers near you across Nigeria.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mealbeta.app/private-chefs" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/private-chefs" }],
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
  { n: "01", t: "Plan your meal", d: "Use the MealBeta planner to decide what to eat and see the cost." },
  { n: "02", t: "Pick a chef", d: "Browse verified chefs near you by category, area and budget." },
  { n: "03", t: "Book & enjoy", d: "Message on WhatsApp or send a request. Pay the chef directly." },
];

const CHEF_BENEFITS = [
  "Free Basic listing — start getting leads today",
  "Verified badge builds trust with customers",
  "Featured & Premium plans for more visibility",
  "Direct WhatsApp leads — no middleman commissions",
  "Analytics on profile views and bookings",
];

const USE_CASES = [
  "Weekly meal prep for a busy workweek",
  "A private chef for a birthday dinner at home",
  "Diabetic-friendly meals for a parent",
  "Soup bowls stocked for the whole month",
  "Small chops & jollof for an office event",
  "Post-partum meals for a new mum",
];

function PrivateChefsLanding() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Nav />
      <Hero />
      <WhySection />
      <Categories />
      <HowItWorks />
      <Trust />
      <UseCases />
      <ForChefs />
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
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">Home</Link>
          <a href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground">Categories</a>
          <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground">How it works</a>
          <a href="#for-chefs" className="text-sm font-medium text-muted-foreground hover:text-foreground">For chefs</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/chefs" className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary md:inline-flex">
            Browse chefs
          </Link>
          <Link
            to="/become-a-chef"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-soft hover:opacity-95"
          >
            Join as chef <ArrowRight className="h-3.5 w-3.5" />
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
            New on MealBeta
          </span>

          <h1 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] tracking-tight text-charcoal">
            Don't just decide what to eat. <span className="text-warm">Get someone to cook it.</span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            MealBeta now connects you with <span className="text-foreground">private chefs, home cooks, meal prep vendors and event caterers</span> —
            all in one place, verified and near you.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/chefs"
              className="group inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-base font-semibold text-brand-foreground shadow-lift hover:opacity-95"
            >
              Browse chefs
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-background/25 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              to="/become-a-chef"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              I'm a chef — join
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> Verified profiles</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> WhatsApp direct</li>
            <li className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-brand" /> All Nigeria</li>
          </ul>
        </div>

        {/* Visual card */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand via-[oklch(0.5_0.15_150)] to-[oklch(0.4_0.12_155)] p-8 shadow-lift ring-1 ring-border/50">
            <ChefHat className="absolute -right-10 -bottom-10 h-72 w-72 text-white/15" />
            <div className="relative flex h-full flex-col justify-between text-white">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium backdrop-blur">
                  <Sparkles className="h-3 w-3" /> Featured chef
                </div>
                <h3 className="mt-5 font-display text-3xl leading-tight">Chef Ada's Kitchen</h3>
                <p className="mt-2 text-sm text-white/85">Private chef · Lagos · 8 yrs experience</p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-white/95 p-3 text-charcoal shadow-soft backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.94_0.04_80/0.6)] text-warm">
                      <Star className="h-5 w-5" fill="currentColor" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">4.9 · 127 reviews</div>
                      <div className="text-[11px] text-muted-foreground">Nigerian · Continental · Meal prep</div>
                    </div>
                    <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-bold text-brand">VERIFIED</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/95 p-3 text-charcoal shadow-soft backdrop-blur">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Starts from</div>
                  <div className="text-lg font-bold">₦15,000 <span className="text-xs font-normal text-muted-foreground">/ session</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why ---------------- */
function WhySection() {
  const cards = [
    { icon: Utensils, title: "Cook myself", body: "Plan meals, get shopping lists, cook at home.", tint: "bg-[oklch(0.94_0.04_145/0.5)] text-[oklch(0.4_0.12_145)]" },
    { icon: Store, title: "Order restaurant", body: "Find restaurants nearby serving what you crave.", tint: "bg-[oklch(0.94_0.04_80/0.55)] text-warm" },
    { icon: ChefHat, title: "Contact a chef", body: "Book a chef to prep, cook or cater for you.", tint: "bg-[oklch(0.92_0.06_90/0.6)] text-[oklch(0.4_0.1_60)]", highlight: true },
  ];
  return (
    <section className="border-y border-border/50 bg-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-brand/10 text-brand"><Leaf className="h-3.5 w-3.5" /> Why MealBeta</span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-charcoal md:text-5xl">
            More than a <span className="text-warm">delivery app.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Chowdeck and Glovo bring restaurant food. MealBeta helps you plan meals, then choose how to get them.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 md:gap-5">
          {cards.map(({ icon: Icon, title, body, tint, highlight }) => (
            <div
              key={title}
              className={`rounded-3xl border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift ${
                highlight ? "border-brand/40 ring-2 ring-brand/20" : "border-border/60"
              }`}
            >
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-charcoal">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Categories ---------------- */
function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="chip bg-warm/15 text-warm">Who you can find</span>
        <h2 className="mt-4 font-display text-3xl leading-tight text-charcoal md:text-5xl">
          Chefs for every occasion.
        </h2>
        <p className="mt-4 text-muted-foreground">
          From daily meal prep to a full event — find the right person for the job.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
        {CATEGORIES.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="group rounded-3xl border border-border/60 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-bold text-charcoal">{label}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function HowItWorks() {
  return (
    <section id="how" className="bg-[oklch(0.98_0.02_130)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-brand/10 text-brand">How it works</span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-charcoal md:text-5xl">
            From craving to cooked — in three steps.
          </h2>
        </div>
        <div className="mt-12 grid gap-8 md:mt-16 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="font-display text-4xl text-brand">{s.n}</div>
              <h3 className="mt-3 text-lg font-bold text-charcoal">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Trust ---------------- */
function Trust() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <span className="chip bg-brand/10 text-brand"><ShieldCheck className="h-3.5 w-3.5" /> Verified & reviewed</span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-charcoal md:text-5xl">
            Real chefs. <span className="text-warm">Real reviews.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every chef is reviewed by the MealBeta team before getting a verified badge. Read customer ratings,
            browse listings and message chefs on WhatsApp before you book.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            {[
              { icon: Star, t: "Real customer ratings and reviews" },
              { icon: MessageCircle, t: "Message chefs directly on WhatsApp" },
              { icon: ShieldCheck, t: "Verified profiles you can trust" },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[2rem] bg-gradient-to-br from-[oklch(0.97_0.03_130)] to-[oklch(0.94_0.05_100)] p-8 shadow-lift ring-1 ring-border/50 md:p-10">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-brand to-warm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-charcoal">Verified chef #{i}</div>
                      <span className="shrink-0 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand">✓</span>
                    </div>
                    <div className="text-warm text-xs">★★★★★ <span className="text-muted-foreground">· 40+ bookings</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Use cases ---------------- */
function UseCases() {
  return (
    <section className="bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-warm/15 text-warm">Real scenarios</span>
          <h2 className="mt-4 font-display text-3xl leading-tight text-charcoal md:text-5xl">
            What people use MealBeta chefs for.
          </h2>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u} className="rounded-2xl bg-card px-5 py-4 text-sm text-charcoal shadow-soft ring-1 ring-border/60">
              {u}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- For chefs ---------------- */
function ForChefs() {
  return (
    <section id="for-chefs" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-charcoal px-6 py-14 shadow-lift md:px-16 md:py-20">
        <Sparkles className="absolute -right-8 -top-8 h-40 w-40 text-white/10" />
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="chip bg-white/10 text-white">For chefs & vendors</span>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white md:text-5xl">
              Grow your food business on MealBeta.
            </h2>
            <p className="mt-4 text-white/80">
              Free to join. Get discovered by customers actively planning meals in your area.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/become-a-chef" className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95">
                Join free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/chef-plans" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15">
                See plans
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {CHEF_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 ring-1 ring-white/10">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[oklch(0.55_0.15_145)] via-[oklch(0.5_0.16_150)] to-[oklch(0.45_0.14_155)] px-6 py-16 text-center shadow-lift md:px-16 md:py-24">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-warm/30 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-3xl leading-tight text-white md:text-6xl">
            Ready to eat better?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/85">
            Discover verified chefs near you now — or plan a meal first and we'll match you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/chefs"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-bold text-[oklch(0.4_0.14_145)] shadow-lift hover:bg-white/95"
            >
              Browse MealBeta Chefs
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[oklch(0.4_0.14_145)] text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link to="/" className="text-sm font-medium text-white/85 underline underline-offset-4 hover:text-white">
              Back to home
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
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/chefs" className="hover:text-foreground">Browse chefs</Link>
          <Link to="/become-a-chef" className="hover:text-foreground">Join as chef</Link>
        </div>
      </div>
    </footer>
  );
}
