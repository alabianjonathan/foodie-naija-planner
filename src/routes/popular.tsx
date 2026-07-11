import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { popularGroups } from "@/data/popularGroups";
import { getMeal } from "@/data/meals";
import { useMemo, useState } from "react";
import { ChevronRight, Search, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/popular")({ component: Popular });

function Popular() {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const group = useMemo(() => popularGroups.find(g => g.key === active) ?? null, [active]);

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return popularGroups;
    const q = query.toLowerCase();
    return popularGroups
      .map(g => ({ ...g, items: g.items.filter(i => i.name.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [query]);

  if (group) {
    return (
      <PhoneShell>
        <div className="px-6 pt-6 pb-2 flex items-center gap-3">
          <button onClick={() => setActive(null)} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Popular in Nigeria</p>
            <h1 className="font-display text-xl">{group.emoji} {group.title}</h1>
          </div>
        </div>
        <div className="px-6 mt-4 space-y-2 pb-8">
          {group.items.map((item, i) => {
            const meal = item.mealId ? getMeal(item.mealId) : null;
            const inner = (
              <div className="flex items-center justify-between card-soft !py-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${meal ? `bg-gradient-to-br ${meal.gradient}` : "bg-secondary"}`}>
                    {meal?.emoji ?? group.emoji}
                  </div>
                  <div>
                    <p className="font-display text-sm">{item.name}</p>
                    {meal ? (
                      <p className="text-[11px] text-muted-foreground">₦{meal.cookMin.toLocaleString()}+ · {meal.cookingTimeMin}m</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Tap to add — recipe coming soon</p>
                    )}
                  </div>
                </div>
                {meal && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            );
            return meal ? (
              <Link key={i} to="/meal/$id" params={{ id: meal.id }}>{inner}</Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TopBar title="Popular in Nigeria" back="/home" />
      <div className="px-6 pt-2">
        <p className="text-xs text-muted-foreground">Browse the most-loved Nigerian meals by category.</p>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search meals…"
            className="w-full rounded-full bg-secondary px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        <div className="mt-5 space-y-3 pb-8">
          {filteredGroups.map(g => (
            <button
              key={g.key}
              onClick={() => { setActive(g.key); setQuery(""); }}
              className="w-full text-left card-soft flex items-center justify-between hover:shadow-[var(--shadow-lift)] transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand/15 to-warm/25 flex items-center justify-center text-2xl">
                  {g.emoji}
                </div>
                <div>
                  <h3 className="font-display text-base leading-tight">{g.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{g.items.length} meals</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No meals match "{query}"</p>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
