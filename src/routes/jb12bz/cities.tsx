import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/admin/PageHeader";
import { adminListCities, adminAddCity, adminToggleCity, adminDeleteCity, adminAddArea, adminToggleArea, adminDeleteArea } from "@/lib/admin-catalog.functions";
import { Plus, Trash2, Power } from "lucide-react";

export const Route = createFileRoute("/jb12bz/cities")({
  head: () => ({ meta: [{ title: "Cities & Areas — MealBeta Admin" }] }),
  component: CitiesPage,
});

type Row = { id: string; name: string; state: string | null; active: boolean; areas: { id: string; name: string; active: boolean }[] };

function CitiesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminListCities);
  const add = useServerFn(adminAddCity);
  const toggle = useServerFn(adminToggleCity);
  const del = useServerFn(adminDeleteCity);
  const addA = useServerFn(adminAddArea);
  const togA = useServerFn(adminToggleArea);
  const delA = useServerFn(adminDeleteArea);

  const { data: cities = [], isLoading, error } = useQuery({ queryKey: ["admin", "cities"], queryFn: () => list() as unknown as Promise<Row[]> });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "cities"] });

  const addCity = useMutation({ mutationFn: (v: { name: string; state?: string }) => add({ data: v }), onSuccess: invalidate });
  const toggleCity = useMutation({ mutationFn: (v: { id: string; active: boolean }) => toggle({ data: v }), onSuccess: invalidate });
  const removeCity = useMutation({ mutationFn: (v: { id: string }) => del({ data: v }), onSuccess: invalidate });
  const addArea = useMutation({ mutationFn: (v: { cityId: string; name: string }) => addA({ data: v }), onSuccess: invalidate });
  const toggleArea = useMutation({ mutationFn: (v: { id: string; active: boolean }) => togA({ data: v }), onSuccess: invalidate });
  const removeArea = useMutation({ mutationFn: (v: { id: string }) => delA({ data: v }), onSuccess: invalidate });

  const [newCity, setNewCity] = useState({ state: "", name: "" });

  return (
    <div>
      <PageHeader title="Cities & areas" subtitle="Structured as State → City → Area. Shared with the customer app." />

      {error && <div className="mb-4 text-sm p-3 rounded border border-destructive/30 bg-destructive/5 text-destructive">{(error as Error).message}</div>}

      <div className="bg-card border rounded-xl p-5 mb-6 max-w-2xl">
        <div className="text-sm font-medium mb-3">Add a new city</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={newCity.state} onChange={(e) => setNewCity((n) => ({ ...n, state: e.target.value }))} placeholder="State (e.g. Lagos State)" className="px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
          <input value={newCity.name} onChange={(e) => setNewCity((n) => ({ ...n, name: e.target.value }))} placeholder="City (e.g. Lagos)" className="px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
          <button disabled={addCity.isPending} onClick={() => { if (newCity.name.trim()) { addCity.mutate({ name: newCity.name.trim(), state: newCity.state.trim() || undefined }); setNewCity({ state: "", name: "" }); } }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm disabled:opacity-50"><Plus className="h-4 w-4" /> Add city</button>
        </div>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {cities.map((c) => (
            <CityCard key={c.id} city={c}
              onToggle={() => toggleCity.mutate({ id: c.id, active: !c.active })}
              onRemove={() => { if (confirm(`Delete ${c.name}? All areas will be removed.`)) removeCity.mutate({ id: c.id }); }}
              onAddArea={(name) => addArea.mutate({ cityId: c.id, name })}
              onToggleArea={(id, active) => toggleArea.mutate({ id, active: !active })}
              onRemoveArea={(id) => removeArea.mutate({ id })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CityCard({ city, onToggle, onRemove, onAddArea, onToggleArea, onRemoveArea }: {
  city: Row; onToggle: () => void; onRemove: () => void;
  onAddArea: (name: string) => void; onToggleArea: (id: string, active: boolean) => void; onRemoveArea: (id: string) => void;
}) {
  const [newArea, setNewArea] = useState("");
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-muted-foreground">{city.state ?? "—"}</div>
          <div className="font-semibold text-lg">{city.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{city.areas.length} areas · {city.active ? "active" : "inactive"}</div>
        </div>
        <div className="flex gap-1">
          <button title={city.active ? "Deactivate" : "Activate"} onClick={onToggle} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Power className="h-4 w-4" /></button>
          <button title="Delete city" onClick={onRemove} className="p-1.5 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="New area" className="flex-1 px-3 py-1.5 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
        <button onClick={() => { if (newArea.trim()) { onAddArea(newArea.trim()); setNewArea(""); } }} className="px-3 py-1.5 rounded-lg bg-brand text-brand-foreground text-sm">Add</button>
      </div>

      <ul className="space-y-1 max-h-56 overflow-y-auto">
        {city.areas.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
            <span className={`text-sm ${a.active ? "" : "line-through text-muted-foreground"}`}>{a.name}</span>
            <div className="flex gap-1">
              <button onClick={() => onToggleArea(a.id, a.active)} className="p-1 rounded hover:bg-muted"><Power className="h-3.5 w-3.5" /></button>
              <button onClick={() => onRemoveArea(a.id)} className="p-1 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
        {city.areas.length === 0 && <li className="text-xs text-muted-foreground py-3 text-center">No areas yet</li>}
      </ul>
    </div>
  );
}
