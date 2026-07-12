import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { sampleCities, type AdminCity } from "@/data/admin-sample";
import { Plus, Trash2, Power } from "lucide-react";

export const Route = createFileRoute("/admin/cities")({
  head: () => ({ meta: [{ title: "Cities & Areas — MealBeta Admin" }] }),
  component: CitiesPage,
});

function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>(sampleCities);
  const [newCity, setNewCity] = useState({ state: "", city: "" });

  const addCity = () => {
    if (!newCity.city.trim() || !newCity.state.trim()) return;
    setCities((c) => [...c, { id: `c${Date.now()}`, state: newCity.state, city: newCity.city, active: true, areas: [] }]);
    setNewCity({ state: "", city: "" });
  };
  const toggleCity = (id: string) => setCities((cs) => cs.map((c) => c.id === id ? { ...c, active: !c.active } : c));
  const removeCity = (id: string) => setCities((cs) => cs.filter((c) => c.id !== id));
  const addArea = (cityId: string, name: string) =>
    setCities((cs) => cs.map((c) => c.id === cityId ? { ...c, areas: [...c.areas, { id: `a${Date.now()}`, name, active: true }] } : c));
  const toggleArea = (cityId: string, areaId: string) =>
    setCities((cs) => cs.map((c) => c.id === cityId ? { ...c, areas: c.areas.map((a) => a.id === areaId ? { ...a, active: !a.active } : a) } : c));
  const removeArea = (cityId: string, areaId: string) =>
    setCities((cs) => cs.map((c) => c.id === cityId ? { ...c, areas: c.areas.filter((a) => a.id !== areaId) } : c));

  return (
    <div>
      <PageHeader title="Cities & areas" subtitle="Structured as State → City → Area for restaurant coverage." />

      <div className="bg-card border rounded-xl p-5 mb-6 max-w-2xl">
        <div className="text-sm font-medium mb-3">Add a new city</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={newCity.state} onChange={(e) => setNewCity((n) => ({ ...n, state: e.target.value }))} placeholder="State (e.g. Lagos State)" className="px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
          <input value={newCity.city} onChange={(e) => setNewCity((n) => ({ ...n, city: e.target.value }))} placeholder="City (e.g. Lagos)" className="px-3 py-2 rounded-lg border bg-background text-sm outline-none focus:border-brand" />
          <button onClick={addCity} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-brand-foreground text-sm"><Plus className="h-4 w-4" /> Add city</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cities.map((c) => (
          <CityCard key={c.id} city={c} onToggle={() => toggleCity(c.id)} onRemove={() => removeCity(c.id)}
            onAddArea={(name) => addArea(c.id, name)}
            onToggleArea={(id) => toggleArea(c.id, id)}
            onRemoveArea={(id) => removeArea(c.id, id)}
          />
        ))}
      </div>
    </div>
  );
}

function CityCard({ city, onToggle, onRemove, onAddArea, onToggleArea, onRemoveArea }: {
  city: AdminCity; onToggle: () => void; onRemove: () => void;
  onAddArea: (name: string) => void; onToggleArea: (id: string) => void; onRemoveArea: (id: string) => void;
}) {
  const [newArea, setNewArea] = useState("");
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-muted-foreground">{city.state}</div>
          <div className="font-semibold text-lg">{city.city}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{city.areas.length} areas · {city.active ? "active" : "inactive"}</div>
        </div>
        <div className="flex gap-1">
          <button title={city.active ? "Deactivate" : "Activate"} onClick={onToggle} className={`p-1.5 rounded ${city.active ? "hover:bg-muted text-muted-foreground" : "hover:bg-green-50 text-green-700"}`}><Power className="h-4 w-4" /></button>
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
              <button onClick={() => onToggleArea(a.id)} className="p-1 rounded hover:bg-muted"><Power className="h-3.5 w-3.5" /></button>
              <button onClick={() => onRemoveArea(a.id)} className="p-1 rounded hover:bg-red-50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
        {city.areas.length === 0 && <li className="text-xs text-muted-foreground py-3 text-center">No areas yet</li>}
      </ul>
    </div>
  );
}
