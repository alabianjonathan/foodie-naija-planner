import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

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
  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl mb-2">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-6">Last updated: July 2026</p>
        <div className="space-y-4 text-sm text-charcoal leading-relaxed">
          <p>By using MealBeta you agree to these terms.</p>
          <h2 className="font-semibold text-base mt-6">Using the service</h2>
          <p>MealBeta provides meal planning, cost and calorie estimates, and connects you with independent restaurants and chefs. Estimates are guidance, not guarantees.</p>
          <h2 className="font-semibold text-base mt-6">Accounts</h2>
          <p>You are responsible for keeping your account credentials safe. Don't share your password.</p>
          <h2 className="font-semibold text-base mt-6">Third parties</h2>
          <p>Chefs and restaurants listed are independent operators. Bookings and orders are directly between you and them; MealBeta is not a party to those transactions.</p>
          <h2 className="font-semibold text-base mt-6">Acceptable use</h2>
          <p>Don't use MealBeta to harass others, scrape data, or submit false content.</p>
          <h2 className="font-semibold text-base mt-6">Changes</h2>
          <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>
          <h2 className="font-semibold text-base mt-6">Contact</h2>
          <p>Questions? <a href="mailto:hello@mealbeta.app" className="text-brand font-medium">hello@mealbeta.app</a></p>
        </div>
      </div>
    </PhoneShell>
  );
}
