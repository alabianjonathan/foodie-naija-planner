import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Sparkles, Users } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MealBeta — Nigeria's smart meal planner" },
      { name: "description", content: "MealBeta helps Nigerians plan meals, estimate cost and calories, and eat better every week." },
      { property: "og:title", content: "About MealBeta" },
      { property: "og:description", content: "MealBeta helps Nigerians plan meals, estimate cost and calories, and eat better every week." },
      { property: "og:url", content: "https://mealbeta.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <span className="chip w-fit bg-brand/10 text-brand">About us</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-6xl">
          Meal planning, built for Nigerian kitchens.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          MealBeta is a Nigerian meal planning assistant. We help you decide what to eat, plan the week, estimate cost and calories, generate shopping lists, and find restaurants and chefs near you.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-charcoal">Smart suggestions</h3>
            <p className="mt-2 text-sm text-muted-foreground">Recommendations tuned to your budget, preferences, and Nigerian kitchens.</p>
          </div>
          <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.94_0.04_145/0.6)] text-[oklch(0.4_0.12_145)]">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-charcoal">Better choices</h3>
            <p className="mt-2 text-sm text-muted-foreground">Track calories and cost so you eat and spend well.</p>
          </div>
          <div className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[oklch(0.94_0.04_80/0.6)] text-warm">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-charcoal">Local network</h3>
            <p className="mt-2 text-sm text-muted-foreground">Discover restaurants and book verified private chefs across Nigeria.</p>
          </div>
        </div>

        <div className="mt-14">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-base font-semibold text-brand-foreground shadow-lift hover:opacity-95">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
