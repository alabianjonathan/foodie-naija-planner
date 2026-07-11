import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { restaurants, getMeal } from "@/data/meals";
import { Phone, MessageCircle, Navigation, Star, Truck, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/restaurants")({ component: Restaurants });

const FILTERS = ["All", "Delivery", "Buka", "Grill", "Continental", "Fast food", "Seafood", "Snacks"] as const;
type Filter = typeof FILTERS[number];

const NEARBY_KM = 8;
const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"] as const;

function Restaurants() {
  const { user } = useRequireAuth();
  const [city, setCity] = useState<string>("Lagos");
  const [filter, setFilter] = useState<Filter>("All");
  const [pickingCity, setPickingCity] = useState(false);
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("city").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.city && CITIES.includes(data.city as never)) setCity(data.city); });
  }, [user]);

  const changeCity = async (next: string) => {
    setCity(next);
    setPickingCity(false);
    if (!user) return;
    setSavingCity(true);
    await supabase.from("profiles").update({ city: next }).eq("id", user.id);
    setSavingCity(false);
  };

  const nearby = useMemo(() => {
    return restaurants
      .filter(r => r.city === city && r.distanceKm <= NEARBY_KM)
      .filter(r => {
        if (filter === "All") return true;
        if (filter === "Delivery") return r.delivery;
        return r.tags.includes(filter as never);
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [city, filter]);

  return (
    <PhoneShell>
      <TopBar title="Restaurants near you" back="/home" />
      <div className="px-6 pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-brand" />
            Within {NEARBY_KM} km of <span className="font-semibold text-charcoal">{city}</span>
          </div>
          <button
            onClick={() => setPickingCity(v => !v)}
            className="text-xs font-semibold text-brand"
            disabled={savingCity}
          >
            {savingCity ? "Saving…" : "Change city"}
          </button>
        </div>

        {pickingCity && (
          <div className="mb-4 card-soft !p-3">
            <p className="text-[11px] text-muted-foreground mb-2">Choose your city</p>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => changeCity(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${city === c ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}
                >
                  {c}
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
              <p className="text-sm text-muted-foreground">No restaurants match this filter near {city}.</p>
              <button onClick={() => setFilter("All")} className="mt-3 text-xs font-semibold text-brand">Show all nearby</button>
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
                      <p className="text-xs text-muted-foreground mt-0.5">{r.area}, {r.city} · {r.distanceKm} km · {r.opening}</p>
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
