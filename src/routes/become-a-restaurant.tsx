import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { applyAsRestaurant } from "@/lib/restaurant-apply.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { Loader2, Store, Check } from "lucide-react";

export const Route = createFileRoute("/become-a-restaurant")({
  head: () => ({
    meta: [
      { title: "Become a MealBeta Restaurant Partner — Apply now" },
      { name: "description", content: "List your restaurant on MealBeta. Get discovered by customers near you. Submit your branch for review and go live once approved." },
    ],
  }),
  component: BecomeARestaurant,
});

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

const TAG_OPTIONS = [
  "Nigerian","Fast Food","Continental","Chinese","Grill/BBQ","Pastry","Seafood",
  "Vegetarian","Healthy","Breakfast","Suya","Rice Bowls","Soups","Small Chops",
];

function BecomeARestaurant() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const apply = useServerFn(applyAsRestaurant);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [chain, setChain] = useState("");
  const [branchName, setBranchName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [opening, setOpening] = useState("");
  const [delivery, setDelivery] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  if (loading || !user) {
    return (
      <PhoneShell>
        <TopBar title="Restaurant partner" back="/restaurants" />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </PhoneShell>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !state.trim() || !city.trim()) {
      toast.error("Please fill restaurant name, phone, email, state and city.");
      return;
    }
    setSaving(true);
    try {
      await apply({
        data: {
          name, branchName, chain, state, city, area, address,
          phone, whatsapp, email, opening, delivery, tags,
          googleMapsUrl, sourceUrl, notes,
        },
      });
      toast.success("Application received! We'll review your restaurant and set it live once approved.");
      navigate({ to: "/restaurants" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not submit application.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <PhoneShell>
      <TopBar title="Restaurant partner" back="/restaurants" />
      <div className="px-5 pt-2">
        <div className="rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-5 text-brand-foreground shadow-[var(--shadow-lift)] relative overflow-hidden">
          <Store className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20" />
          <h1 className="font-display text-2xl leading-tight">Become a Restaurant Partner</h1>
          <p className="mt-1 text-sm text-white/90">
            List your restaurant, get discovered by nearby customers, and receive orders through MealBeta.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs text-white/95">
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Free listing during launch</li>
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Reviewed by our team before going live</li>
            <li className="flex items-start gap-1.5"><Check className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Show up in "Where to eat near me" AI results</li>
          </ul>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant name *" maxLength={120} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={chain} onChange={(e) => setChain(e.target.value)} placeholder="Chain (optional)" maxLength={120} />
            <input className={inputCls} value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch (e.g. Ikeja)" maxLength={120} />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">State *</label>
            <select className={`${inputCls} mt-1`} value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City *" maxLength={60} />
            <input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / neighborhood" maxLength={120} />
          </div>
          <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" maxLength={300} />

          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone *" maxLength={30} />
            <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" maxLength={30} />
          </div>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" maxLength={200} required />
          <input className={inputCls} value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="Opening hours (e.g. Mon–Sun, 8am–10pm)" maxLength={200} />

          <label className="flex items-center gap-2 text-sm px-1">
            <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
            Offers delivery
          </label>

          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Cuisine / tags</p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => {
                const active = tags.includes(t);
                return (
                  <button type="button" key={t} onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <input className={inputCls} value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="Google Maps link (optional)" maxLength={500} />
          <input className={inputCls} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Website / Instagram (optional)" maxLength={500} />
          <textarea className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else our team should know?" maxLength={1000} rows={3} />

          <button type="submit" disabled={saving} className="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold disabled:opacity-60">
            {saving ? "Submitting…" : "Submit for review"}
          </button>
          <p className="text-[11px] text-center text-muted-foreground">
            Our team reviews every submission. You'll be notified once your restaurant is live on{" "}
            <Link to="/restaurants" className="underline">MealBeta</Link>.
          </p>
        </form>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
