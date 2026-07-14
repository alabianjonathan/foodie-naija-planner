import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listChefs, type PublicChef } from "@/lib/chefs.functions";
import { Star, MapPin, MessageCircle, ShieldCheck, Sparkles, ChefHat } from "lucide-react";

export const Route = createFileRoute("/chefs")({
  head: () => ({
    meta: [
      { title: "MealBeta Chefs — Private chefs, meal prep & event vendors" },
      { name: "description", content: "Discover verified private chefs, home cooks, meal prep vendors, soup bowls and event caterers near you on MealBeta." },
      { property: "og:title", content: "MealBeta Chefs — Private chefs & meal prep vendors" },
      { property: "og:description", content: "Book verified private chefs, home cooks, and meal prep vendors near you." },
    ],
  }),
  component: ChefsIndex,
});

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "private_chef", label: "Private chef" },
  { key: "home_cook", label: "Home cook" },
  { key: "meal_prep", label: "Meal prep" },
  { key: "soup_bowl", label: "Soup bowls" },
  { key: "small_chops", label: "Small chops" },
  { key: "grill_bbq", label: "Grill / BBQ" },
  { key: "pastry_baker", label: "Pastry / Baker" },
  { key: "event_catering", label: "Event catering" },
  { key: "healthy_meals", label: "Healthy meals" },
  { key: "diet_specialist", label: "Diet specialist" },
];

function planBadge(plan: PublicChef["plan"]) {
  if (plan === "premium") return { label: "Premium", cls: "bg-gradient-to-r from-brand to-warm text-white" };
  if (plan === "featured") return { label: "Featured", cls: "bg-warm/30 text-charcoal" };
  return null;
}

function money(n: number | null) {
  if (n == null) return null;
  return `₦${n.toLocaleString()}`;
}

function ChefsIndex() {
  const fetchChefs = useServerFn(listChefs);
  const { data: chefs = [], isLoading } = useQuery({
    queryKey: ["chefs", "list"],
    queryFn: () => fetchChefs(),
  });
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState<string>("all");

  const availableStates = useMemo(() => {
    return Array.from(new Set(chefs.map((c) => c.city).filter(Boolean))).sort();
  }, [chefs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chefs.filter((c) => {
      if (category !== "all" && !c.categories.includes(category)) return false;
      if (verifiedOnly && !c.verified) return false;
      if (stateFilter !== "all" && c.city !== stateFilter) return false;
      if (q) {
        const hay = `${c.fullName} ${c.businessName} ${c.city} ${c.area ?? ""} ${(c.areasCovered ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [chefs, category, query, verifiedOnly, stateFilter]);


  return (
    <PhoneShell>
      <TopBar title="MealBeta Chefs" back="/dashboard" />
      <div className="px-5 pt-2">
        <div className="rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-5 text-brand-foreground shadow-[var(--shadow-lift)] relative overflow-hidden">
          <ChefHat className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20" />
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white/25 backdrop-blur rounded-full px-2.5 py-1">
            <Sparkles className="h-3 w-3" /> New on MealBeta
          </div>
          <h2 className="mt-3 font-display text-2xl leading-tight">Private chefs, meal prep &amp; event vendors near you</h2>
          <p className="mt-1 text-sm text-white/85">Book a chef, order weekly meal prep, or hire an event caterer.</p>
          <Link to="/become-a-chef" className="inline-block mt-3 rounded-full bg-white text-brand text-xs font-semibold px-3 py-1.5">
            Are you a chef? Join →
          </Link>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chef, business, area…"
            className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-full bg-secondary/60 border border-border/60 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="all">All states</option>
            {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs text-charcoal">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only
          </label>
          <span className="text-[11px] text-muted-foreground">{filtered.length} chef{filtered.length === 1 ? "" : "s"}</span>
        </div>


        <div className="mt-4 space-y-4">
          {isLoading && (
            <div className="card-soft text-center py-10 text-sm text-muted-foreground">Loading chefs…</div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="card-soft text-center py-10">
              <p className="text-sm text-muted-foreground">No chefs match this filter yet.</p>
              <Link to="/become-a-chef" className="mt-3 inline-block text-xs font-semibold text-brand">
                Know one? Invite them →
              </Link>
            </div>
          )}
          {filtered.map((c) => {
            const badge = planBadge(c.plan);
            const startingAt = c.priceMin != null ? money(c.priceMin) : null;
            const waLink = c.whatsapp ? `https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}` : null;
            return (
              <Link
                key={c.id}
                to="/chefs/$slug"
                params={{ slug: c.slug }}
                className="block card-soft !p-0 overflow-hidden"
              >
                <div className="h-24 bg-gradient-to-br from-brand via-warm to-leaf relative">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={c.businessName} className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {badge && (
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                    )}
                    {c.verified && (
                      <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-white/95 text-leaf inline-flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg leading-tight truncate">{c.businessName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        <span className="font-medium text-charcoal">{c.fullName}</span>
                        {" · "}{c.categories.slice(0, 2).map((k) => CATEGORIES.find((x) => x.key === k)?.label ?? k).join(", ")}
                      </p>
                    </div>
                    {c.rating != null && (
                      <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
                        <Star className="h-4 w-4 fill-warm text-warm" /> {c.rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 text-brand shrink-0" />
                    <span className="truncate">{c.area ? `${c.area}, ` : ""}{c.city}{c.areasCovered.length > 0 ? ` · covers ${c.areasCovered.slice(0, 3).join(", ")}${c.areasCovered.length > 3 ? "…" : ""}` : ""}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs">
                      {startingAt ? <>from <span className="font-semibold text-charcoal">{startingAt}</span></> : <span className="text-muted-foreground">Contact for pricing</span>}
                    </span>
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 rounded-full bg-leaf text-white text-xs font-medium px-3 py-1.5"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs font-semibold text-brand">View →</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 card-soft text-center">
          <p className="text-sm text-charcoal">Are you a chef, home cook or meal prep vendor?</p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/become-a-chef" className="rounded-full bg-brand text-brand-foreground text-xs font-semibold px-4 py-2">Join MealBeta Chefs</Link>
            <Link to="/chef-plans" className="rounded-full bg-secondary text-charcoal text-xs font-semibold px-4 py-2">See plans</Link>
          </div>
        </div>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
