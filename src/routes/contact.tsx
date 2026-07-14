import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MessageCircle, Instagram } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact MealBeta" },
      { name: "description", content: "Get in touch with the MealBeta team." },
      { property: "og:title", content: "Contact MealBeta" },
      { property: "og:description", content: "Get in touch with the MealBeta team." },
      { property: "og:url", content: "https://mealbeta.app/contact" },
    ],
    links: [{ rel: "canonical", href: "https://mealbeta.app/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display text-3xl mb-2">Contact us</h1>
        <p className="text-sm text-muted-foreground mb-6">We'd love to hear from you.</p>
        <div className="space-y-3">
          <a href="mailto:hello@mealbeta.app" className="card-soft flex items-center gap-3">
            <Mail className="h-5 w-5 text-brand" />
            <div>
              <div className="text-sm font-semibold">Email</div>
              <div className="text-xs text-muted-foreground">hello@mealbeta.app</div>
            </div>
          </a>
          <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer" className="card-soft flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-leaf" />
            <div>
              <div className="text-sm font-semibold">WhatsApp</div>
              <div className="text-xs text-muted-foreground">Chat with support</div>
            </div>
          </a>
          <a href="https://instagram.com/mealbeta.app" target="_blank" rel="noreferrer" className="card-soft flex items-center gap-3">
            <Instagram className="h-5 w-5 text-warm" />
            <div>
              <div className="text-sm font-semibold">Instagram</div>
              <div className="text-xs text-muted-foreground">@mealbeta.app</div>
            </div>
          </a>
        </div>
      </div>
    </PhoneShell>
  );
}
