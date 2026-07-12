import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { sampleRestaurants, type AdminRestaurant } from "@/data/admin-sample";
import { Plus, Check, X, ShieldCheck, Trash2 } from "lucide-react";

export const Route = createFileRoute("/jb12bz/restaurants")({
  head: () => ({ meta: [{ title: "Restaurants — MealBeta Admin" }] }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const [rows, setRows] = useState<AdminRestaurant[]>(sampleRestaurants);
  const [showForm, setShowForm] = useState(false);

  const setStatus = (id: string, status: AdminRestaurant["status"]) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  const verify = (id: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, verified: !r.verified } : r)));
  const remove = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  return (
    <div>
      <PageHeader
        title="Restaurants"
        subtitle="Approve, verify, and manage all restaurant partners."
        actions={<button onClick={() => setShowForm((s) => !s)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add restaurant</button>}
      />
      {showForm && <RestaurantForm onCancel={() => setShowForm(false)} onSave={(r) => { setRows((rs) => [r, ...rs]); setShowForm(false); }} />}

      <DataTable<AdminRestaurant>
        rows={rows}
        searchKeys={["name", "city", "area", "cuisine", "owner"]}
        columns={[
          { key: "name", header: "Restaurant", render: (r) => <div><div className="font-medium">{r.name} {r.verified && <ShieldCheck className="inline h-3.5 w-3.5 text-brand" />}</div><div className="text-xs text-muted-foreground">{r.owner}</div></div> },
          { key: "location", header: "Location", render: (r) => <span>{r.area}, {r.city}</span> },
          { key: "cuisine", header: "Cuisine" },
          { key: "price", header: "Price", render: (r) => r.priceRange },
          { key: "delivery", header: "Delivery", render: (r) => r.delivery ? "Yes" : "No" },
          { key: "rating", header: "Rating", render: (r) => `⭐ ${r.rating}` },
          { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
        ]}
        actions={(r) => (
          <div className="flex items-center gap-1 justify-end">
            {r.status === "pending" && (
              <>
                <button title="Approve" onClick={() => setStatus(r.id, "active")} className="p-1.5 rounded hover:bg-green-50 text-green-700"><Check className="h-4 w-4" /></button>
                <button title="Reject" onClick={() => setStatus(r.id, "suspended")} className="p-1.5 rounded hover:bg-red-50 text-destructive"><X className="h-4 w-4" /></button>
              </>
            )}
            <button title="Verify" onClick={() => verify(r.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ShieldCheck className="h-4 w-4" /></button>
            <button title="Delete" onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      />
    </div>
  );
}

function RestaurantForm({ onSave, onCancel }: { onSave: (r: AdminRestaurant) => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<AdminRestaurant>>({ delivery: true, status: "pending", verified: false, rating: 0 });
  const set = <K extends keyof AdminRestaurant>(k: K, v: AdminRestaurant[K]) => setF((p) => ({ ...p, [k]: v }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: `r${Date.now()}`, name: "", owner: "", phone: "", whatsapp: "", email: "",
      city: "", area: "", address: "", cuisine: "", delivery: true, hours: "", priceRange: "",
      rating: 0, verified: false, status: "pending", ...f,
    } as AdminRestaurant);
  };
  const input = "w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand";
  return (
    <form onSubmit={submit} className="mb-6 bg-card border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input required placeholder="Restaurant name" className={input} onChange={(e) => set("name", e.target.value)} />
      <input placeholder="Owner name" className={input} onChange={(e) => set("owner", e.target.value)} />
      <input placeholder="Cuisine type" className={input} onChange={(e) => set("cuisine", e.target.value)} />
      <input placeholder="Phone" className={input} onChange={(e) => set("phone", e.target.value)} />
      <input placeholder="WhatsApp" className={input} onChange={(e) => set("whatsapp", e.target.value)} />
      <input placeholder="Email" type="email" className={input} onChange={(e) => set("email", e.target.value)} />
      <input placeholder="City" className={input} onChange={(e) => set("city", e.target.value)} />
      <input placeholder="Area" className={input} onChange={(e) => set("area", e.target.value)} />
      <input placeholder="Full address" className={input} onChange={(e) => set("address", e.target.value)} />
      <input placeholder="Opening hours (e.g. 8am–10pm)" className={input} onChange={(e) => set("hours", e.target.value)} />
      <input placeholder="Price range (₦1,500–₦4,000)" className={input} onChange={(e) => set("priceRange", e.target.value)} />
      <label className="flex items-center gap-2 text-sm px-3"><input type="checkbox" defaultChecked onChange={(e) => set("delivery", e.target.checked)} /> Delivery available</label>
      <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm">Save restaurant</button>
      </div>
    </form>
  );
}
