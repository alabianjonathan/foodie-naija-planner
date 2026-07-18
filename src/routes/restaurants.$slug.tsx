import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Phone, MessageCircle, Navigation, Clock, Truck, ShieldCheck, Loader2 } from "lucide-react";
import coverAsset from "@/assets/restaurant-cover.jpg.asset.json";

export const Route = createFileRoute("/restaurants/$slug")({
  component: RestaurantProfile,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — MealBeta` },
      { name: "description", content: `Verified restaurant profile on MealBeta — contact, address, opening hours and menu.` },
    ],
  }),
});

function RestaurantProfile() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, slug, name, city, area, address, rating, distance_km, delivery, phone, whatsapp, email, opening, tags, meal_slugs, verified, status")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <PhoneShell>
      <TopBar title="Restaurant" back="/restaurants" />
      <div className="px-5 pt-2 pb-8">
        {isLoading && (
          <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div>
        )}
        {!isLoading && !data && (
          <div className="card-soft text-center py-10">
            <p className="text-sm text-muted-foreground">Restaurant not found.</p>
            <Link to="/restaurants" className="mt-3 inline-block text-xs font-semibold text-brand">Browse restaurants</Link>
          </div>
        )}
        {data && (
          <div className="space-y-4">
            <div className="rounded-3xl overflow-hidden card-soft !p-0">
              <div
                className="relative h-40 bg-cover bg-center flex items-end justify-between p-4"
                style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), url(${(data as { cover_url?: string | null }).cover_url || coverAsset.url})` }}
              >
                <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center font-display text-3xl text-brand shadow-lg">
                  {data.name[0]}
                </div>
                {data.delivery && (
                  <span className="chip !bg-white/95 !text-charcoal"><Truck className="h-3 w-3" /> Delivery</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h1 className="font-display text-xl leading-tight flex items-center gap-2">
                      {data.name}
                      {data.verified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-leaf/15 text-leaf rounded-full px-2 py-0.5 font-semibold">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand" />
                      {[data.area, data.city].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  {Number(data.rating) > 0 && (
                    <span className="text-sm font-semibold inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warm text-warm" /> {Number(data.rating).toFixed(1)}
                    </span>
                  )}
                </div>

                {data.tags && data.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {data.tags.map((t: string) => (
                      <span key={t} className="text-[10px] bg-secondary text-charcoal rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card-soft space-y-3">
              <h2 className="font-display text-base">Contact & location</h2>
              {data.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                  <span>{data.address}</span>
                </div>
              )}
              {data.opening && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                  <span>{data.opening}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                  <a href={`tel:${data.phone}`} className="text-brand font-medium">{data.phone}</a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {data.phone && (
                  <a href={`tel:${data.phone}`} className="flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground py-2.5 text-sm font-medium">
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                {data.whatsapp && (
                  <a href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-full bg-leaf text-leaf-foreground py-2.5 text-sm font-medium">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${data.name} ${data.area ?? ""} ${data.city}`)}`}
                  target="_blank" rel="noreferrer"
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded-full bg-secondary text-charcoal py-2.5 text-sm font-medium"
                >
                  <Navigation className="h-4 w-4" /> Get directions
                </a>
              </div>
            </div>

            {data.meal_slugs && data.meal_slugs.length > 0 && (
              <div className="card-soft">
                <h2 className="font-display text-base mb-2">Menu highlights</h2>
                <div className="flex flex-wrap gap-1.5">
                  {data.meal_slugs.slice(0, 12).map((s: string) => (
                    <Link
                      key={s}
                      to="/meal/$id"
                      params={{ id: s }}
                      className="text-xs px-3 py-1.5 rounded-full bg-secondary text-charcoal hover:bg-brand/10 hover:text-brand transition"
                    >
                      {s.replace(/-/g, " ")}
                    </Link>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">
                  Exact prices vary by portion, protein, packaging and delivery. Call the restaurant to confirm.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
