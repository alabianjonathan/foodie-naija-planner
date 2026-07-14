import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getChefBySlug, submitChefLead } from "@/lib/chefs.functions";
import { Star, MapPin, MessageCircle, ShieldCheck, Phone, ChefHat, X, Calendar } from "lucide-react";

export const Route = createFileRoute("/chefs/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — MealBeta Chef` },
      { name: "description", content: "Book this MealBeta chef for private cooking, meal prep, or event catering." },
    ],
  }),
  component: ChefDetail,
});

function money(n: number | null) {
  if (n == null) return null;
  return `₦${n.toLocaleString()}`;
}

function ChefDetail() {
  const { slug } = Route.useParams();
  const fetchChef = useServerFn(getChefBySlug);
  const { data, isLoading } = useQuery({
    queryKey: ["chefs", "slug", slug],
    queryFn: () => fetchChef({ data: { slug } }),
  });
  const [showBooking, setShowBooking] = useState(false);

  if (isLoading) {
    return (
      <PhoneShell>
        <TopBar title="Chef" back="/chefs" />
        <div className="px-5 pt-6 text-sm text-muted-foreground">Loading…</div>
      </PhoneShell>
    );
  }

  if (!data) {
    return (
      <PhoneShell>
        <TopBar title="Chef" back="/chefs" />
        <div className="px-5 pt-10 text-center">
          <ChefHat className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">This chef isn't available.</p>
          <Link to="/chefs" className="mt-3 inline-block text-brand font-semibold text-sm">Browse chefs →</Link>
        </div>
      </PhoneShell>
    );
  }

  const { chef, listings, reviews } = data;
  const waLink = chef.whatsapp ? `https://wa.me/${chef.whatsapp.replace(/[^0-9]/g, "")}` : null;
  const telLink = chef.phone ? `tel:${chef.phone}` : null;
  const avgRating = reviews.length > 0
    ? reviews.reduce((a, b) => a + b.rating, 0) / reviews.length
    : chef.rating;

  return (
    <PhoneShell>
      <TopBar title="Chef profile" back="/chefs" />
      <div className="px-5 pt-2">
        <div className="rounded-3xl overflow-hidden shadow-[var(--shadow-soft)]">
          <div className="h-40 bg-gradient-to-br from-brand via-warm to-leaf relative">
            {chef.photoUrl && (
              <img src={chef.photoUrl} alt={chef.businessName} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute top-3 right-3 flex gap-1">
              {chef.plan !== "basic" && (
                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-white/95 text-brand">
                  {chef.plan === "premium" ? "Premium" : "Featured"}
                </span>
              )}
              {chef.verified && (
                <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-white/95 text-leaf inline-flex items-center gap-0.5">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </div>
          <div className="bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-2xl leading-tight">{chef.businessName}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">by {chef.fullName}
                  {chef.yearsExperience != null && <> · {chef.yearsExperience}y experience</>}
                </p>
              </div>
              {avgRating != null && (
                <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
                  <Star className="h-4 w-4 fill-warm text-warm" /> {avgRating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              <span>{chef.area ? `${chef.area}, ` : ""}{chef.city}</span>
            </div>
            {chef.areasCovered.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chef.areasCovered.map((a) => (
                  <span key={a} className="text-[10px] bg-secondary rounded-full px-2 py-0.5">{a}</span>
                ))}
              </div>
            )}
            {chef.bio && <p className="mt-3 text-sm text-charcoal leading-relaxed">{chef.bio}</p>}
            {(chef.priceMin != null || chef.priceMax != null) && (
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Price range: </span>
                <span className="font-semibold text-charcoal">
                  {money(chef.priceMin) ?? "—"}{chef.priceMax != null ? ` – ${money(chef.priceMax)}` : "+"}
                </span>
              </p>
            )}
            {chef.availability && (
              <p className="mt-1 text-xs text-muted-foreground">Availability: {chef.availability}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-full bg-leaf text-white py-2.5 text-xs font-semibold">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              <button
                onClick={() => setShowBooking(true)}
                className={`flex items-center justify-center gap-1.5 rounded-full bg-brand text-brand-foreground py-2.5 text-xs font-semibold ${!waLink ? "col-span-2" : ""}`}
              >
                <Calendar className="h-4 w-4" /> Request booking
              </button>
            </div>
            {telLink && (
              <a href={telLink} className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-secondary py-2.5 text-xs font-semibold text-charcoal">
                <Phone className="h-4 w-4" /> Call chef
              </a>
            )}
          </div>
        </div>

        {listings.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-lg mb-3">Menu &amp; services</h2>
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l.id} className="card-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm">{l.name}</h3>
                      <p className="text-[11px] text-muted-foreground capitalize">{l.type}
                        {l.serviceArea && <> · {l.serviceArea}</>}
                      </p>
                    </div>
                    {(l.priceMin != null || l.priceMax != null) && (
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {money(l.priceMin) ?? ""}{l.priceMax != null && l.priceMax !== l.priceMin ? ` – ${money(l.priceMax)}` : ""}
                      </span>
                    )}
                  </div>
                  {l.description && <p className="mt-2 text-xs text-charcoal">{l.description}</p>}
                  {l.availableDays.length > 0 && (
                    <p className="mt-2 text-[10px] text-muted-foreground">Available: {l.availableDays.join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="mt-6">
            <h2 className="font-display text-lg mb-3">Reviews</h2>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.id} className="card-soft">
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="h-4 w-4 fill-warm text-warm" /> {r.rating}
                  </div>
                  {r.comment && <p className="mt-1 text-xs text-charcoal">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
      <div className="h-6" />

      {showBooking && (
        <BookingModal chefId={chef.id} chefName={chef.businessName} onClose={() => setShowBooking(false)} />
      )}
    </PhoneShell>
  );
}

function BookingModal({ chefId, chefName, onClose }: { chefId: string; chefName: string; onClose: () => void }) {
  const submit = useServerFn(submitChefLead);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [requestedDate, setRequestedDate] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || (!phone.trim() && !whatsapp.trim())) {
      toast.error("Add your name and at least a phone or WhatsApp number.");
      return;
    }
    setSaving(true);
    try {
      await submit({ data: { chefId, name, phone, whatsapp, message, requestedDate } });
      toast.success("Booking request sent. The chef will contact you.");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg">Request booking</h3>
            <p className="text-xs text-muted-foreground">to {chefName}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={100}
            className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <div className="grid grid-cols-2 gap-2">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" maxLength={30}
              className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" maxLength={30}
              className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          </div>
          <input type="date" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)}
            className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you need? (menu, guests, budget)"
            maxLength={1000} rows={3}
            className="w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          <button type="submit" disabled={saving}
            className="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold disabled:opacity-60">
            {saving ? "Sending…" : "Send request"}
          </button>
        </form>
      </div>
    </div>
  );
}
