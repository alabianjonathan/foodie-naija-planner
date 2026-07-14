import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — MealBeta" },
      { name: "description", content: "The terms governing your use of MealBeta." },
      { property: "og:title", content: "Terms of Service — MealBeta" },
      { property: "og:description", content: "The terms governing your use of MealBeta." },
      { property: "og:url", content: "https://mealbeta.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const sections = [
    { h: "Using the service", p: "MealBeta provides meal planning, cost and calorie estimates, and connects you with independent restaurants and chefs. Estimates are guidance, not guarantees." },
    { h: "Accounts", p: "You are responsible for keeping your account credentials safe. Don't share your password." },
    { h: "Third parties", p: "Chefs and restaurants listed are independent operators. Bookings and orders are directly between you and them; MealBeta is not a party to those transactions." },
    { h: "Acceptable use", p: "Don't use MealBeta to harass others, scrape data, or submit false content." },
    { h: "Changes", p: "We may update these terms. Continued use after changes means you accept the updated terms." },
  ];
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <span className="chip w-fit bg-brand/10 text-brand">Legal</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-6xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed">
          <p className="text-foreground">By using MealBeta you agree to these terms.</p>
          {sections.map((s) => (
            <div key={s.h}>
              <h2 className="font-display text-2xl text-charcoal">{s.h}</h2>
              <p className="mt-2 text-muted-foreground">{s.p}</p>
            </div>
          ))}
          <div>
            <h2 className="font-display text-2xl text-charcoal">Contact</h2>
            <p className="mt-2 text-muted-foreground">Questions? <a href="mailto:hello@mealbeta.app" className="font-medium text-brand">hello@mealbeta.app</a></p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
