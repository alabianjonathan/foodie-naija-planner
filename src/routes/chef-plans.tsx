import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/chef-plans")({
  head: () => ({
    meta: [
      { title: "MealBeta Chef Plans — Basic, Featured, Premium" },
      { name: "description", content: "Grow your food business on MealBeta. Free Basic listing, Featured at ₦15,000/month, Premium at ₦30,000/month." },
    ],
  }),
  component: ChefPlans,
});

type Plan = { key: string; name: string; price: string; per?: string; tagline: string; highlight?: boolean; features: string[]; cta: string };
const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    price: "Free",
    tagline: "Get discovered",
    features: [
      "1 food or service listing",
      "Public profile page",
      "WhatsApp & booking button",
      "Appear in MealBeta Chefs search",
    ],
    cta: "Start free",
  },
  {
    key: "featured",
    name: "Featured",
    price: "₦15,000",
    per: "/month",
    tagline: "Stand out & grow",
    highlight: true,
    features: [
      "Up to 10 listings",
      "Featured badge",
      "Priority placement in search",
      "Profile view analytics",
      "Verified badge (after review)",
    ],
    cta: "Upgrade to Featured",
  },
  {
    key: "premium",
    name: "Premium",
    price: "₦30,000",
    per: "/month",
    tagline: "Scale your business",
    features: [
      "Unlimited listings",
      "Top of search results",
      "Homepage feature rotation",
      "Full analytics & lead insights",
      "Priority WhatsApp support",
    ],
    cta: "Go Premium",
  },
] as const;

function ChefPlans() {
  return (
    <PhoneShell>
      <TopBar title="Chef plans" back="/chefs" />
      <div className="px-5 pt-2">
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-brand/10 text-brand rounded-full px-2.5 py-1">
            <Sparkles className="h-3 w-3" /> For chefs & vendors
          </div>
          <h1 className="mt-3 font-display text-2xl leading-tight">Choose a plan that grows your kitchen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cancel or change anytime. Paid via Paystack.</p>
        </div>

        <div className="space-y-4 mt-2">
          {PLANS.map((p) => (
            <div
              key={p.key}
              className={`rounded-3xl p-5 ${p.highlight ? "bg-gradient-to-br from-brand to-leaf text-brand-foreground shadow-[var(--shadow-lift)]" : "bg-card shadow-[var(--shadow-soft)]"}`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className={`font-display text-xl ${p.highlight ? "" : "text-charcoal"}`}>{p.name}</h3>
                <div className="text-right">
                  <div className={`font-display text-2xl ${p.highlight ? "" : "text-brand"}`}>{p.price}</div>
                  {"per" in p && p.per && (
                    <div className={`text-[10px] ${p.highlight ? "opacity-80" : "text-muted-foreground"}`}>{p.per}</div>
                  )}
                </div>
              </div>
              <p className={`text-xs mt-1 ${p.highlight ? "opacity-90" : "text-muted-foreground"}`}>{p.tagline}</p>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${p.highlight ? "" : "text-brand"}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/become-a-chef"
                className={`mt-5 block text-center rounded-full py-3 text-sm font-semibold ${p.highlight ? "bg-white text-brand" : "bg-brand text-brand-foreground"}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          All plans include a public profile, WhatsApp/booking buttons and appearing on MealBeta.
        </p>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
