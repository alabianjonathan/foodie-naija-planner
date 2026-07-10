import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { restaurants, getMeal } from "@/data/meals";
import { Phone, MessageCircle, Navigation, Star, Truck } from "lucide-react";

export const Route = createFileRoute("/restaurants")({ component: Restaurants });

function Restaurants() {
  return (
    <PhoneShell>
      <TopBar title="Restaurants near you" back="/home" />
      <div className="px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto -mx-6 px-6 pb-1">
          {["All", "Delivery", "Buka", "Grill", "Continental"].map(t => (
            <button key={t} className="px-4 py-2 rounded-full bg-secondary text-xs font-medium whitespace-nowrap first:bg-brand first:text-brand-foreground">{t}</button>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {restaurants.map(r => {
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
                      <p className="text-xs text-muted-foreground mt-0.5">{r.area} · {r.distanceKm} km · {r.opening}</p>
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
                    <button className="flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground py-2 text-xs font-medium">
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </button>
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
