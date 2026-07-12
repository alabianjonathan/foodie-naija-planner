import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, StatusPill } from "@/components/admin/DataTable";
import { adminListRestaurants, adminUpsertRestaurant, adminDeleteRestaurant } from "@/lib/admin-catalog.functions";
import { Plus, ShieldCheck, Trash2, Check, X, Pencil } from "lucide-react";

type Row = {
  id: string; slug: string; name: string; city: string; area: string | null;
  rating: number; distance_km: number; delivery: boolean; phone: string | null;
  whatsapp: string | null; email: string | null; opening: string | null;
  tags: string[]; meal_slugs: string[]; verified: boolean; status: string;
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

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div>
      <PageHeader title="Restaurants" subtitle="Approve, verify, and manage restaurant partners. Live from the customer app database."
        actions={<button onClick={() => { setCreating(true); setEditing(null); }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add restaurant</button>}
      />
      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}
      {(creating || editing) && (
        <RestaurantForm
          initial={editing ?? undefined}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={(v) => { save.mutate(v); setEditing(null); setCreating(false); }}
        />
      )}
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Filter status:</span>
        {["all", "active", "pending", "suspended"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-full border ${statusFilter === s ? "bg-brand text-brand-foreground border-brand" : "bg-card"}`}>{s}</button>
        ))}
      </div>
      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <DataTable<Row>
          rows={filtered}
          searchKeys={["name", "city", "area"]}
          columns={[
            { key: "name", header: "Restaurant", render: (r) => <div><div className="font-medium">{r.name} {r.verified && <ShieldCheck className="inline h-3.5 w-3.5 text-brand" />}</div><div className="text-xs text-muted-foreground">{r.tags.join(", ")}</div></div> },
            { key: "location", header: "Location", render: (r) => <span>{r.area}, {r.city}</span> },
            { key: "phone", header: "Phone", render: (r) => r.phone ?? "—" },
            { key: "delivery", header: "Delivery", render: (r) => r.delivery ? "Yes" : "No" },
            { key: "rating", header: "Rating", render: (r) => `⭐ ${r.rating}` },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
          ]}
          actions={(r) => (
            <div className="flex items-center gap-1 justify-end">
              {r.status === "pending" && (
                <>
                  <button title="Approve" onClick={() => save.mutate({ ...r, status: "active" })} className="p-1.5 rounded hover:bg-green-50 text-green-700"><Check className="h-4 w-4" /></button>
                  <button title="Reject" onClick={() => save.mutate({ ...r, status: "suspended" })} className="p-1.5 rounded hover:bg-red-50 text-destructive"><X className="h-4 w-4" /></button>
                </>
              )}
              <button title="Verify" onClick={() => save.mutate({ ...r, verified: !r.verified })} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><ShieldCheck className="h-4 w-4" /></button>
              <button title="Edit" onClick={() => { setEditing(r); setCreating(false); }} className="p-1.5 rounded hover:bg-muted"><Pencil className="h-4 w-4" /></button>
              <button title="Delete" onClick={() => { if (confirm(`Delete ${r.name}?`)) remove.mutate({ id: r.id }); }} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}
        />
      )}
    </div>
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
