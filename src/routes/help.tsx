import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ — MealBeta" },
      { name: "description", content: "Common questions about using MealBeta." },
      { property: "og:title", content: "Help & FAQ — MealBeta" },
      { property: "og:description", content: "Common questions about using MealBeta." },
      { property: "og:url", content: "https://mealbeta.app/help" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/help" }],
  }),
  component: HelpPage,
});

const faqs = [
  { q: "Is MealBeta free?", a: "Yes — meal planning, shopping lists, and restaurant discovery are free." },
  { q: "Are the cost estimates accurate?", a: "They're guidance based on average Nigerian market prices and update as we get better data. Actual prices vary by market and season." },
  { q: "How do I contact a chef?", a: "Open the Chefs tab, view a profile, and tap WhatsApp or Request Booking." },
  { q: "How do I generate a shopping list?", a: "In Planner, select your meals for the week and tap Generate shopping list." },
  { q: "How do I delete my account?", a: "Email hello@mealbeta.app and we'll delete your account and data within 7 days." },
];

function HelpPage() {
  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl mb-6">Help & FAQ</h1>
        <div className="space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card-soft group">
              <summary className="cursor-pointer text-sm font-semibold list-none flex justify-between items-center">
                {f.q}
                <span className="text-brand text-lg group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-xs text-charcoal leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Still stuck? <Link to="/contact" className="text-brand font-semibold">Contact us</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
