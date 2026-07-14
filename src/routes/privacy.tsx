import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MealBeta" },
      { name: "description", content: "How MealBeta collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — MealBeta" },
      { property: "og:description", content: "How MealBeta collects, uses, and protects your data." },
      { property: "og:url", content: "https://mealbeta.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <span className="chip w-fit bg-brand/10 text-brand">Legal</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-6xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: July 2026</p>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-foreground">
          <p>This page is maintained by MealBeta to explain what personal data we collect and how we use it.</p>

          <div>
            <h2 className="font-display text-2xl text-charcoal">Information we collect</h2>
            <p className="mt-2 text-muted-foreground">Account details you provide — name, email, phone number, and any meal preferences you enter. When you sign in with Google, we receive your basic profile (name, email, avatar).</p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-charcoal">How we use it</h2>
            <p className="mt-2 text-muted-foreground">To power meal recommendations, weekly plans, shopping lists, and to connect you with chefs or restaurants you contact. We never sell your data.</p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-charcoal">Data storage</h2>
            <p className="mt-2 text-muted-foreground">Data is stored securely on our backend infrastructure. Access is scoped per user via row-level security.</p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-charcoal">Your rights</h2>
            <p className="mt-2 text-muted-foreground">You can request deletion of your account and data at any time by emailing <a href="mailto:hello@mealbeta.app" className="font-medium text-brand">hello@mealbeta.app</a>.</p>
          </div>

          <div>
            <h2 className="font-display text-2xl text-charcoal">Contact</h2>
            <p className="mt-2 text-muted-foreground">Questions? Reach us at <a href="mailto:hello@mealbeta.app" className="font-medium text-brand">hello@mealbeta.app</a>.</p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
