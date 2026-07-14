import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

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
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <span className="chip w-fit bg-brand/10 text-brand">Help centre</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-6xl">Frequently asked questions.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about using MealBeta.</p>

        <div className="mt-12 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border/60">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-charcoal">
                {f.q}
                <span className="text-brand text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-secondary/60 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Still stuck? <Link to="/contact" className="font-semibold text-brand">Contact us</Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
