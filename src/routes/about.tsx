import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Leaf, Sparkles, Users } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

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
    <PhoneShell>
      <div className="px-5 pt-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl mb-3">About MealBeta</h1>
        <p className="text-sm text-charcoal leading-relaxed">
          MealBeta is a Nigerian meal planning assistant. We help you decide what to eat, plan the week, estimate cost and calories, generate shopping lists, and find restaurants and chefs near you.
        </p>
        <div className="mt-8 space-y-4">
          <div className="card-soft flex gap-3">
            <Sparkles className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Smart suggestions</h3>
              <p className="text-xs text-muted-foreground mt-1">Recommendations tuned to your budget, preferences, and Nigerian kitchens.</p>
            </div>
          </div>
          <div className="card-soft flex gap-3">
            <Leaf className="h-5 w-5 text-leaf shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Better choices</h3>
              <p className="text-xs text-muted-foreground mt-1">Track calories and cost so you eat and spend well.</p>
            </div>
          </div>
          <div className="card-soft flex gap-3">
            <Users className="h-5 w-5 text-warm shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Local network</h3>
              <p className="text-xs text-muted-foreground mt-1">Discover restaurants and book verified private chefs across Nigeria.</p>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link to="/auth" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground">
            Get started
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
}
