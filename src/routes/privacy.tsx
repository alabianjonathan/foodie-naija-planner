import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

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
    <PhoneShell>
      <div className="px-5 pt-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl mb-2">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-6">Last updated: July 2026</p>
        <div className="prose-sm space-y-4 text-sm text-charcoal leading-relaxed">
          <p>This page is maintained by MealBeta to explain what personal data we collect and how we use it.</p>
          <h2 className="font-semibold text-base mt-6">Information we collect</h2>
          <p>Account details you provide — name, email, phone number, and any meal preferences you enter. When you sign in with Google, we receive your basic profile (name, email, avatar).</p>
          <h2 className="font-semibold text-base mt-6">How we use it</h2>
          <p>To power meal recommendations, weekly plans, shopping lists, and to connect you with chefs or restaurants you contact. We never sell your data.</p>
          <h2 className="font-semibold text-base mt-6">Data storage</h2>
          <p>Data is stored securely on our backend infrastructure. Access is scoped per user via row-level security.</p>
          <h2 className="font-semibold text-base mt-6">Your rights</h2>
          <p>You can request deletion of your account and data at any time by emailing <a href="mailto:hello@mealbeta.app" className="text-brand font-medium">hello@mealbeta.app</a>.</p>
          <h2 className="font-semibold text-base mt-6">Contact</h2>
          <p>Questions? Reach us at <a href="mailto:hello@mealbeta.app" className="text-brand font-medium">hello@mealbeta.app</a>.</p>
        </div>
      </div>
    </PhoneShell>
  );
}
