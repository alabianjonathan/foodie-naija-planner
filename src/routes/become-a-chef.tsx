import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { applyAsChef } from "@/lib/chefs.functions";
import { listCitiesWithAreas } from "@/lib/catalog.functions";
import { useRequireAuth } from "@/hooks/useAuth";
import { Loader2, ChefHat, Check } from "lucide-react";

export const Route = createFileRoute("/become-a-chef")({
  head: () => ({
    meta: [
      { title: "Become a MealBeta Chef — Apply now" },
      { name: "description", content: "Join MealBeta as a private chef, home cook, meal prep vendor, or event caterer. Get discovered by customers near you." },
    ],
  }),
  component: BecomeAChef,
});

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

// Fallback city lists for states where catalog isn't populated yet
const FALLBACK_CITIES: Record<string, string[]> = {
  "Lagos": ["Ikeja","Lekki Phase 1","Yaba","Surulere","Victoria Island","Ikoyi","Ajah","Gbagada","Maryland","Ogba","Magodo","Ikorodu","Festac","Opebi","Allen Avenue","Alausa","Oniru","Chevron","Sangotedo","Epe"],
  "FCT Abuja": ["Wuse","Wuse 2","Garki","Maitama","Asokoro","Jabi","Utako","Gwarinpa","Apo","Lokogoma","Lugbe","Kubwa","Gudu","Wuye","Jahi","Life Camp","Mabushi","Kado"],
  "Rivers": ["Port Harcourt","GRA","Peter Odili Road","Trans Amadi","D-Line","Rumuola","Rumuokoro","Woji","Eliozu","Choba","Ada George","Stadium Road","Waterlines"],
  "Imo": ["Owerri","Ikenegbu","World Bank","New Owerri","Wetheral Road","Douglas Road","Aladinma","Orji","Amakohia","Nekede","Ihiagwa","Control Post"],
  "Oyo": ["Ibadan","Bodija","Ring Road","Dugbe","Mokola","Challenge","Iwo Road","Agodi","Jericho","Samonda","UI","Akobo"],
};

const CATEGORY_OPTIONS = [
  { key: "home_cooking", label: "Home Cooking" },
  { key: "meal_prep", label: "Weekly Meal Prep" },
  { key: "family_cooking", label: "Family Cooking" },
  { key: "event_cooking", label: "Event Cooking" },
  { key: "office_lunch", label: "Office Lunch" },
  { key: "fitness_meal_prep", label: "Fitness Meal Prep" },
  { key: "soup_bowl", label: "Soup Bowl Delivery" },
  { key: "bulk_cooking", label: "Bulk Cooking" },
  { key: "private_dinner", label: "Private Dinner" },
  { key: "child_friendly", label: "Child-Friendly Meals" },
  { key: "private_chef", label: "Private Chef" },
  { key: "home_cook", label: "Home Cook" },
  { key: "small_chops", label: "Small Chops" },
  { key: "grill_bbq", label: "Grill / BBQ" },
  { key: "pastry_baker", label: "Pastry / Baker" },
  { key: "healthy_meals", label: "Healthy Meals" },
  { key: "diet_specialist", label: "Diet Specialist" },
  { key: "event_catering", label: "Event Catering" },
];

type PlanKey = "basic" | "featured" | "premium";
const PLANS: { key: PlanKey; label: string; price: string; perks: string[] }[] = [
  { key: "basic", label: "Basic Chef Listing — Free", price: "Free",
    perks: ["1 food/service listing","1 profile photo","1 service area","Low search visibility","Limited customer leads"] },
  { key: "featured", label: "Featured Chef — ₦15,000/month", price: "₦15,000/mo",
    perks: ["Up to 10 foods/services","Up to 10 profile photos","Up to 5 service areas","Featured badge","Higher search visibility","More customer leads","Can add special offers"] },
  { key: "premium", label: "Premium Chef — ₦30,000/month", price: "₦30,000/mo",
    perks: ["Unlimited foods/services","Unlimited profile photos","Unlimited service areas","Premium badge","Highest search visibility","Priority customer leads","Homepage/category feature eligibility","Advanced analytics","Can add special offers"] },
];

function BecomeAChef() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const apply = useServerFn(applyAsChef);
  const fetchCities = useServerFn(listCitiesWithAreas);
  const { data: catalog = [] } = useQuery({
    queryKey: ["catalog", "cities-with-areas"],
    queryFn: () => fetchCities(),
  });

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [citiesCovered, setCitiesCovered] = useState<string[]>([]);
  const [areasCovered, setAreasCovered] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [availability, setAvailability] = useState("");
  const [plan, setPlan] = useState<PlanKey>("basic");

  // Cities from catalog for the chosen state, falling back to a curated list.
  const cityOptions = useMemo<string[]>(() => {
    if (!state) return [];
    const stateLc = state.toLowerCase();
    const fromCatalog = catalog
      .filter((c) => (c.state ?? "").toLowerCase().includes(stateLc.replace(" abuja", "").replace("fct", "fct")))
      .flatMap((c) => c.areas.map((a) => a.name));
    if (fromCatalog.length > 0) return Array.from(new Set(fromCatalog)).sort();
    return FALLBACK_CITIES[state] ?? [];
  }, [state, catalog]);

  const toggleCategory = (k: string) =>
    setCategories((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  const toggleCity = (c: string) =>
    setCitiesCovered((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

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
    if (!fullName.trim() || !businessName.trim() || !phone.trim() || !email.trim() || !state.trim()) {
      toast.error("Please fill your name, business, phone, email and state.");
      return;
    }
    if (citiesCovered.length === 0) {
      toast.error("Select at least one city you cover.");
      return;
    }
    if (categories.length === 0) {
      toast.error("Pick at least one service you offer.");
      return;
    }
    setSaving(true);
    try {
      const res = await apply({
        data: {
          fullName, businessName, bio, phone, whatsapp, email,
          city: state,
          area: areasCovered,
          areasCovered: citiesCovered,
          categories,
          yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          availability,
          plan,
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
  const selectedPlan = PLANS.find((p) => p.key === plan)!;
  const needsPayment = plan !== "basic";

  return (
    <PhoneShell>
      <TopBar title="Become a chef" back="/chefs" />
      <div className="px-5 pt-2">
        <div className="rounded-3xl bg-gradient-to-br from-brand via-leaf to-[oklch(0.5_0.15_150)] p-5 text-brand-foreground shadow-[var(--shadow-lift)] relative overflow-hidden">
          <ChefHat className="absolute -right-2 -bottom-2 h-24 w-24 opacity-20" />
          <h1 className="font-display text-2xl leading-tight">Join MealBeta Chefs</h1>
          <p className="mt-1 text-sm text-white/90">
            Start free. Upgrade for more listings &amp; visibility.{" "}
            <Link to="/chef-plans" className="underline">Compare plans</Link>
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name *" maxLength={100} />
          <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business or kitchen name *" maxLength={120} />
          <textarea className={inputCls} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio (what you cook, your style)" maxLength={1000} rows={3} />

          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone *" maxLength={30} />
            <input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" maxLength={30} />
          </div>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address *" maxLength={200} required />

          {/* State */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">State *</label>
            <select
              className={`${inputCls} mt-1`}
              value={state}
              onChange={(e) => { setState(e.target.value); setCitiesCovered([]); }}
            >
              <option value="">Select your state</option>
              {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Cities covered */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Cities covered *</label>
            {!state ? (
              <p className="text-xs text-muted-foreground mt-1">Pick a state to see cities.</p>
            ) : cityOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                No cities listed for {state} yet. Add specific areas in the field below and we'll set you up manually.
              </p>
            ) : (
              <div className="mt-1 flex flex-wrap gap-2 max-h-56 overflow-auto rounded-2xl bg-secondary/40 p-2">
                {cityOptions.map((c) => {
                  const active = citiesCovered.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleCity(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${active ? "bg-brand text-brand-foreground border-brand" : "bg-white text-charcoal border-border/60"}`}
                    >
                      {active && <Check className="inline h-3 w-3 mr-1" />}
                      {c}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <input
            className={inputCls}
            value={areasCovered}
            onChange={(e) => setAreasCovered(e.target.value)}
            placeholder="Areas covered (streets, estates — optional)"
            maxLength={200}
          />

          {/* Services */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Services offered *</p>
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
            <input className={inputCls} type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Min ₦" />
            <input className={inputCls} type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Max ₦" />
          </div>
          <input className={inputCls} value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Availability (e.g. Mon–Sat, 8am–6pm)" maxLength={200} />

          {/* Plan */}
          <div>
            <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Choose your chef plan *</label>
            <select
              className={`${inputCls} mt-1`}
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanKey)}
            >
              {PLANS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <div className="mt-2 rounded-2xl bg-secondary/50 p-3">
              <p className="text-xs font-semibold text-charcoal">{selectedPlan.label}</p>
              <ul className="mt-1.5 space-y-1">
                {selectedPlan.perks.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3 mt-0.5 shrink-0 text-brand" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              {needsPayment && (
                <p className="mt-2 text-[11px] text-warm-foreground bg-warm/20 rounded-lg px-2 py-1.5">
                  Payment will be required after your profile is reviewed and approved.
                </p>
              )}
            </div>
          </div>

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
