import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";

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
  const channels = [
    { href: "mailto:hello@mealbeta.app", icon: Mail, title: "Email", body: "hello@mealbeta.app", tint: "bg-brand/10 text-brand" },
    { href: "https://wa.me/2348000000000", icon: MessageCircle, title: "WhatsApp", body: "Chat with support", tint: "bg-[oklch(0.94_0.04_145/0.6)] text-[oklch(0.4_0.12_145)]" },
    { href: "https://instagram.com/mealbeta.app", icon: Instagram, title: "Instagram", body: "@mealbeta.app", tint: "bg-[oklch(0.94_0.04_80/0.6)] text-warm" },
  ];
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <span className="chip w-fit bg-brand/10 text-brand">Contact</span>
        <h1 className="mt-4 font-display text-4xl leading-tight text-charcoal md:text-6xl">Get in touch.</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">We'd love to hear from you — questions, feedback, partnerships, anything.</p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {channels.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/60 hover:shadow-lift transition"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.tint}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold text-charcoal">{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
            </a>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
