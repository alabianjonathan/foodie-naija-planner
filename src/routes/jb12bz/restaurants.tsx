import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { adminListRestaurants, adminUpsertRestaurant, adminDeleteRestaurant } from "@/lib/admin-catalog.functions";
import { Plus, ShieldCheck, Trash2, Check, X, Pencil, Search, Star } from "lucide-react";

type Row = {
  id: string; slug: string; name: string; city: string; area: string | null;
  state: string | null; neighborhood: string | null;
  rating: number; reviews_count: number; mealbeta_score: number;
  distance_km: number; delivery: boolean; phone: string | null;
  whatsapp: string | null; email: string | null; opening: string | null;
  tags: string[]; cuisines: string[]; meal_slugs: string[];
  verified: boolean; status: string; needs_review: boolean;
  image_url: string | null;
};

export const Route = createFileRoute("/jb12bz/restaurants")({
  head: () => ({ meta: [{ title: "Restaurants — MealBeta Admin" }] }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListRestaurants);
  const upsert = useServerFn(adminUpsertRestaurant);
  const del = useServerFn(adminDeleteRestaurant);
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin", "restaurants"], queryFn: () => list() as unknown as Promise<Row[]> });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "restaurants"] });
  type SaveInput = {
    id?: string; slug: string; name: string; city: string; area?: string | null;
    phone?: string | null; whatsapp?: string | null; email?: string | null; opening?: string | null;
    rating?: number; distance_km?: number; delivery?: boolean;
    tags?: string[]; meal_slugs?: string[]; verified?: boolean; status?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const save = useMutation({ mutationFn: (v: SaveInput) => (upsert as any)({ data: v }), onSuccess: invalidate });
  const remove = useMutation({ mutationFn: (v: { id: string }) => del({ data: v }), onSuccess: invalidate });
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [search, setSearch] = useState("");

  const cuisines = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) for (const c of r.cuisines ?? []) s.add(c);
    return Array.from(s).sort();
  }, [rows]);
  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.city))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cuisineFilter !== "all" && !(r.cuisines ?? []).includes(cuisineFilter)) return false;
      if (cityFilter !== "all" && r.city !== cityFilter) return false;
      if (verificationFilter === "verified" && !r.verified) return false;
      if (verificationFilter === "unverified" && r.verified) return false;
      if (verificationFilter === "needs_review" && !r.needs_review) return false;
      if ((r.mealbeta_score ?? 0) < minScore) return false;
      if (q) {
        const hay = `${r.name} ${r.city} ${r.area ?? ""} ${r.neighborhood ?? ""} ${r.state ?? ""} ${(r.cuisines ?? []).join(" ")} ${(r.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, cuisineFilter, cityFilter, verificationFilter, minScore, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter((r) => r.verified).length;
    const needsReview = rows.filter((r) => r.needs_review).length;
    const avg = total ? Math.round(rows.reduce((a, r) => a + (r.mealbeta_score ?? 0), 0) / total * 10) / 10 : 0;
    return { total, verified, needsReview, avg };
  }, [rows]);

  return (
    <div>
      <PageHeader title="Restaurants" subtitle="Approve, verify, score, and manage restaurant partners."
        actions={<button onClick={() => { setCreating(true); setEditing(null); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add restaurant</button>}
      />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total" value={stats.total} />
        <SummaryCard label="Verified" value={stats.verified} tone="good" />
        <SummaryCard label="Needs review" value={stats.needsReview} tone={stats.needsReview > 0 ? "warn" : undefined} />
        <SummaryCard label="Avg MealBeta Score" value={stats.avg} />
      </div>

      {(creating || editing) && (
        <RestaurantForm
          initial={editing ?? undefined}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={(v) => { save.mutate(v); setEditing(null); setCreating(false); }}
        />
      )}

      {/* Filters */}
      <div className="mb-3 bg-card border rounded-xl p-3 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-2 py-1 rounded-lg border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input placeholder="Search name, area, cuisine, tag…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent outline-none text-sm" />
        </div>
        <Select label="Status" value={statusFilter} onChange={setStatusFilter}
          options={[["all", "All"], ["active", "Active"], ["pending", "Pending"], ["suspended", "Suspended"]]} />
        <Select label="City" value={cityFilter} onChange={setCityFilter}
          options={[["all", "All cities"], ...cities.map((c) => [c, c] as [string, string])]} />
        <Select label="Cuisine" value={cuisineFilter} onChange={setCuisineFilter}
          options={[["all", "All cuisines"], ...cuisines.map((c) => [c, c] as [string, string])]} />
        <Select label="Verification" value={verificationFilter} onChange={setVerificationFilter}
          options={[["all", "All"], ["verified", "Verified"], ["unverified", "Unverified"], ["needs_review", "Needs review"]]} />
        <label className="flex items-center gap-2">
          Min score
          <input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(Number(e.target.value) || 0)} className="w-16 px-2 py-1 rounded border bg-background" />
        </label>
        <div className="text-xs text-muted-foreground ml-auto">{filtered.length} of {rows.length}</div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <DataTable<Row>
          rows={filtered}
          searchKeys={["name", "city", "area"]}
          columns={[
            { key: "name", header: "Restaurant", render: (r) => (
              <div className="flex items-start gap-2">
                {r.image_url && <img src={r.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.name} {r.verified && <ShieldCheck className="inline h-3.5 w-3.5 text-brand" />}</div>
                  <div className="text-xs text-muted-foreground truncate">{(r.cuisines ?? []).slice(0, 3).join(" • ") || (r.tags ?? []).slice(0, 3).join(" • ")}</div>
                </div>
              </div>
            ) },
            { key: "location", header: "Location", render: (r) => <div className="text-sm"><div>{r.neighborhood ?? r.area ?? "—"}</div><div className="text-xs text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""}</div></div> },
            { key: "score", header: "MealBeta", render: (r) => (
              <div>
                <div className={`font-semibold ${(r.mealbeta_score ?? 0) >= 70 ? "text-leaf" : (r.mealbeta_score ?? 0) >= 40 ? "text-warm" : "text-muted-foreground"}`}>{r.mealbeta_score ?? 0}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" />{r.rating} · {r.reviews_count}</div>
              </div>
            ) },
            { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
            { key: "status", header: "Status", render: (r) => (
              <div className="flex flex-col gap-1"><StatusPill status={r.status} />{r.needs_review && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm/20 text-warm">review</span>}</div>
            ) },
          ]}
          actions={(r) => (
            <div className="flex items-center gap-1 justify-end">
              {r.status === "pending" && (
                <>
                  <button title="Approve" onClick={() => save.mutate({ ...r, status: "active" })} className="p-1.5 rounded hover:bg-green-50 text-green-700"><Check className="h-4 w-4" /></button>
                  <button title="Reject" onClick={() => save.mutate({ ...r, status: "suspended" })} className="p-1.5 rounded hover:bg-red-50 text-destructive"><X className="h-4 w-4" /></button>
                </>
              )}
              <button title={r.verified ? "Unverify" : "Verify"} onClick={() => save.mutate({ ...r, verified: !r.verified })} className={`p-1.5 rounded hover:bg-muted ${r.verified ? "text-brand" : "text-muted-foreground"}`}><ShieldCheck className="h-4 w-4" /></button>
              <button title="Edit" onClick={() => { setEditing(r); setCreating(false); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <button title="Delete" onClick={() => { if (confirm(`Delete ${r.name}?`)) remove.mutate({ id: r.id }); }} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-leaf" : tone === "warn" ? "text-warm" : "text-charcoal";
  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-2 py-1 rounded border bg-background text-sm">
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

type FormOut = {
  id?: string; slug: string; name: string; city: string; area?: string; phone?: string;
  whatsapp?: string; email?: string; opening?: string; delivery: boolean; status: string;
  verified: boolean; rating: number; distance_km: number; tags: string[]; meal_slugs: string[];
};

function RestaurantForm({ initial, onSave, onCancel }: { initial?: Row; onSave: (v: FormOut) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    id: initial?.id,
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    area: initial?.area ?? "",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    opening: initial?.opening ?? "",
    delivery: initial?.delivery ?? true,
    verified: initial?.verified ?? false,
    status: initial?.status ?? "pending",
    rating: initial?.rating ?? 0,
    distance_km: initial?.distance_km ?? 0,
    tags: (initial?.tags ?? []).join(","),
    meal_slugs: (initial?.meal_slugs ?? []).join(","),
  });
  const input = "w-full px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand";
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.slug || !f.name || !f.city) return;
    onSave({
      id: f.id, slug: f.slug, name: f.name, city: f.city,
      area: f.area || undefined, phone: f.phone || undefined,
      whatsapp: f.whatsapp || undefined, email: f.email || undefined,
      opening: f.opening || undefined, delivery: f.delivery,
      status: f.status, verified: f.verified,
      rating: Number(f.rating), distance_km: Number(f.distance_km),
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      meal_slugs: f.meal_slugs.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };
  return (
    <form onSubmit={submit} className="mb-6 bg-card border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input required placeholder="Slug (unique)" className={input} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
      <input required placeholder="Restaurant name" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input required placeholder="City" className={input} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
      <input placeholder="Area" className={input} value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
      <input placeholder="Phone" className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input placeholder="WhatsApp" className={input} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} />
      <input placeholder="Email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input placeholder="Opening hours" className={input} value={f.opening} onChange={(e) => setF({ ...f, opening: e.target.value })} />
      <input type="number" step="0.1" placeholder="Rating" className={input} value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })} />
      <input type="number" step="0.1" placeholder="Distance km" className={input} value={f.distance_km} onChange={(e) => setF({ ...f, distance_km: Number(e.target.value) })} />
      <input placeholder="Tags (comma-separated)" className={input} value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
      <input placeholder="Meal slugs (comma-separated)" className={input} value={f.meal_slugs} onChange={(e) => setF({ ...f, meal_slugs: e.target.value })} />
      <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>
      <label className="flex items-center gap-2 text-sm px-3"><input type="checkbox" checked={f.delivery} onChange={(e) => setF({ ...f, delivery: e.target.checked })} /> Delivery available</label>
      <label className="flex items-center gap-2 text-sm px-3"><input type="checkbox" checked={f.verified} onChange={(e) => setF({ ...f, verified: e.target.checked })} /> Verified</label>
      <div className="md:col-span-3 flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border text-sm">Cancel</button>
        <button type="submit" className="px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm">{initial ? "Update restaurant" : "Create restaurant"}</button>
      </div>
    </form>
  );
}
