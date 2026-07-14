import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { applyAsChef } from "@/lib/chefs.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { Loader2, ChefHat } from "lucide-react";

export const Route = createFileRoute("/become-a-chef")({
  head: () => ({
    meta: [
      { title: "Become a MealBeta Chef — Apply now" },
      { name: "description", content: "Join MealBeta as a private chef, home cook, meal prep vendor, or event caterer. Get discovered by customers near you." },
    ],
  }),
  component: BecomeAChef,
});

const CATEGORY_OPTIONS = [
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

function BecomeAChef() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const apply = useServerFn(applyAsChef);

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [areasCoveredRaw, setAreasCoveredRaw] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [availability, setAvailability] = useState("");

  const toggleCategory = (k: string) => {
    setCategories((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  if (loading || !user) {
    return (
      <PhoneShell>
        <TopBar title="Become a chef" back="/chefs" />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      </PhoneShell>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !businessName.trim() || !phone.trim() || !city.trim() || categories.length === 0) {
      toast.error("Fill your name, business, phone, city and at least one category.");
      return;
    }
    setSaving(true);
    try {
      const res = await apply({
        data: {
          fullName, businessName, bio, phone, whatsapp, email, city, area,
          areasCovered: areasCoveredRaw.split(",").map((s) => s.trim()).filter(Boolean),
          categories,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          availability,
        },
      });
      toast.success("Application received! We'll review and activate your profile.");
      navigate({ to: "/chefs/$slug", params: { slug: res.slug } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit application.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-2xl bg-secondary/60 border border-border/60 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <PhoneShell>
      <TopBar title="Become a chef" back="/chefs" />
      <div className="px-5 pt-2">
        <div className="rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-5 text-brand-foreground shadow-[var(--shadow-lift)] relative overflow-hidden">
          <ChefHat className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20" />
          <h1 className="font-display text-2xl leading-tight">Join MealBeta Chefs</h1>
          <p className="mt-1 text-sm text-white/90">Start free. Upgrade later for more listings &amp; visibility. <Link to="/chef-plans" className="underline">See plans</Link></p>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
          <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business or kitchen name" maxLength={120} />
          <textarea className={inputCls} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (what you cook, your style)" maxLength={1000} rows={3} />

          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" maxLength={30} />
            <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" maxLength={30} />
          </div>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" maxLength={200} />

          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Lagos)" maxLength={60} />
            <input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Base area (e.g. Lekki)" maxLength={60} />
          </div>
          <input className={inputCls} value={areasCoveredRaw} onChange={(e) => setAreasCoveredRaw(e.target.value)} placeholder="Areas you cover (comma separated)" />

          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">What do you offer?</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const active = categories.includes(c.key);
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => toggleCategory(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${active ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <input className={inputCls} type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="Years exp." />
            <input className={inputCls} type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min price ₦" />
            <input className={inputCls} type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max price ₦" />
          </div>
          <input className={inputCls} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Availability (e.g. Mon–Sat, 8am–6pm)" maxLength={200} />

          <button type="submit" disabled={saving} className="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold disabled:opacity-60">
            {saving ? "Submitting…" : "Submit application"}
          </button>
          <p className="text-[11px] text-center text-muted-foreground">
            We'll review your profile and activate it. You can upload photos &amp; add listings from your chef dashboard once approved.
          </p>
        </form>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
