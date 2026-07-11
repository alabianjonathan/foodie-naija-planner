import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { restaurants, getMeal, cityAreas, CITIES } from "@/data/meals";
import { Phone, MessageCircle, Navigation, Star, Truck, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/restaurants")({ component: Restaurants });

const FILTERS = ["All", "Delivery", "Buka", "Grill", "Continental", "Fast food", "Seafood", "Snacks"] as const;
type Filter = typeof FILTERS[number];

function Restaurants() {
  const { user } = useRequireAuth();
  const [city, setCity] = useState<string>("Lagos");
  const [area, setArea] = useState<string>("All");
  const [filter, setFilter] = useState<Filter>("All");
  const [picking, setPicking] = useState<"city" | "area" | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("city, area").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.city && (CITIES as readonly string[]).includes(data.city)) setCity(data.city);
        if (data?.area) setArea(data.area);
      });
  }, [user]);

  const areas = useMemo(() => cityAreas[city] ?? [], [city]);

  const changeCity = async (next: string) => {
    setCity(next);
    setArea("All");
    setPicking(null);
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ city: next, area: null }).eq("id", user.id);
    setSaving(false);
  };

  const changeArea = async (next: string) => {
    setArea(next);
    setPicking(null);
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ area: next === "All" ? null : next }).eq("id", user.id);
    setSaving(false);
  };

  const nearby = useMemo(() => {
    return restaurants
      .filter(r => r.city === city)
      .filter(r => area === "All" || r.area === area)
      .filter(r => {
        if (filter === "All") return true;
        if (filter === "Delivery") return r.delivery;
        return r.tags.includes(filter as never);
      })
      .sort((a, b) => b.rating - a.rating);
  }, [city, area, filter]);

  return (
    <PhoneShell>
      <TopBar title="Restaurants near you" back="/home" />
      <div className="px-6 pt-2">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <MapPin className="h-3.5 w-3.5 text-brand shrink-0" />
            <span className="truncate">
              <span className="font-semibold text-charcoal">{city}</span>
              {area !== "All" && <> · <span className="font-semibold text-charcoal">{area}</span></>}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setPicking(p => p === "city" ? null : "city")} className="text-xs font-semibold text-brand" disabled={saving}>
              {saving ? "Saving…" : "City"}
            </button>
            {areas.length > 0 && (
              <button onClick={() => setPicking(p => p === "area" ? null : "area")} className="text-xs font-semibold text-brand" disabled={saving}>
                Area
              </button>
            )}
          </div>
        </div>

        {picking === "city" && (
          <div className="mb-4 card-soft !p-3">
            <p className="text-[11px] text-muted-foreground mb-2">Choose your city</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <button key={c} onClick={() => changeCity(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${city === c ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {picking === "area" && areas.length > 0 && (
          <div className="mb-4 card-soft !p-3">
            <p className="text-[11px] text-muted-foreground mb-2">Choose an area in {city}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => changeArea("All")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${area === "All" ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                All areas
              </button>
              {areas.map(a => (
                <button key={a} onClick={() => changeArea(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${area === a ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
          {FILTERS.map(t => {
            const active = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {nearby.length === 0 && (
            <div className="card-soft text-center py-10">
              <p className="text-sm text-muted-foreground">
                No restaurants match this filter{area !== "All" ? ` in ${area}` : ""}.
              </p>
              <button onClick={() => { setFilter("All"); setArea("All"); }} className="mt-3 text-xs font-semibold text-brand">
                Show all in {city}
              </button>
            </div>
          )}
          {nearby.map(r => {
            const featured = r.meals.slice(0, 3).map(id => getMeal(id)?.name).filter(Boolean);
            return (
              <div key={r.id} className="card-soft !p-0 overflow-hidden">
                <div className="h-24 bg-gradient-to-br from-brand via-warm to-leaf flex items-end justify-between p-3">
                  <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center font-display text-2xl text-brand shadow-lg">{r.name[0]}</div>
                  {r.delivery && (
                    <span className="chip !bg-white/95 !text-charcoal"><Truck className="h-3 w-3" /> Delivery</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg leading-tight">{r.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.area}, {r.city} · {r.opening}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Star className="h-4 w-4 fill-warm text-warm" /> {r.rating}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">Offers: {featured.join(" · ")}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <a href={`tel:${r.phone}`} className="flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2 text-xs font-medium">
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                    <a href={`https://wa.me/${r.phone.replace(/\D/g,"")}`} className="flex items-center justify-center gap-1.5 rounded-full bg-leaf text-leaf-foreground py-2 text-xs font-medium">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.area} ${r.city}`)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground py-2 text-xs font-medium"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
