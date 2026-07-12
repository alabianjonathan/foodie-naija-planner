import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, Loader2, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCitiesWithAreas, type CatalogCity } from "@/lib/catalog.functions";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState<string>("Lagos");
  const [area, setArea] = useState<string>("");
  const [initial, setInitial] = useState<{ city: string; area: string }>({ city: "Lagos", area: "" });
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  const fetchCities = useServerFn(listCitiesWithAreas);
  const { data: cityRows = [] } = useQuery({
    queryKey: ["catalog", "cities"],
    queryFn: () => fetchCities() as unknown as Promise<CatalogCity[]>,
  });
  const CITIES = useMemo(() => cityRows.filter((c) => c.active).map((c) => c.name), [cityRows]);
  const cityAreas = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const c of cityRows) map[c.name] = c.areas.filter((a) => a.active).map((a) => a.name);
    return map;
  }, [cityRows]);

  useEffect(() => {
    if (!user || cityRows.length === 0) return;
    supabase.from("profiles").select("city, area").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        const c = data?.city && CITIES.includes(data.city) ? data.city : (CITIES[0] ?? "Lagos");
        const a = data?.area ?? "";
        setCity(c); setArea(a); setInitial({ city: c, area: a }); setReady(true);
      });
  }, [user, cityRows, CITIES]);

  const areas = useMemo(() => cityAreas[city] ?? [], [city, cityAreas]);

  const dirty = city !== initial.city || area !== initial.area;

  const onPickCity = (c: string) => {
    setCity(c);
    if (!(cityAreas[c] ?? []).includes(area)) setArea("");
  };

  const save = async () => {
    if (!user || !dirty) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ city, area: area || null }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Couldn't save location");
    setInitial({ city, area });
    toast.success("Location updated");
    navigate({ to: "/profile" });
  };

  if (loading || !ready) {
    return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;
  }

  return (
    <PhoneShell>
      <TopBar title="Location settings" back="/profile" right={
        <button onClick={save} disabled={!dirty || saving} className="text-sm font-medium text-brand disabled:opacity-40">
          {saving ? "Saving…" : "Save"}
        </button>
      } />
      <div className="px-6 pt-4 pb-8 space-y-6">
        <div className="card-soft !p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3.5 w-3.5 text-brand" />
            <span>Current: <span className="font-semibold text-charcoal">{initial.city}{initial.area ? ` · ${initial.area}` : ""}</span></span>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">City</p>
          <div className="flex flex-wrap gap-2">
            {CITIES.map(c => (
              <button key={c} onClick={() => onPickCity(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${city === c ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {areas.length > 0 && (
          <div className="card-soft !p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Area in {city}</p>
            <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              <button onClick={() => setArea("")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${area === "" ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                All areas {area === "" && <Check className="h-3.5 w-3.5" />}
              </button>
              {areas.map(a => (
                <button key={a} onClick={() => setArea(a)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left ${area === a ? "bg-brand text-brand-foreground" : "bg-secondary text-charcoal"}`}>
                  <span className="truncate">{a}</span> {area === a && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={save} disabled={!dirty || saving}
          className="w-full rounded-full bg-brand text-brand-foreground py-3.5 text-sm font-semibold disabled:opacity-40">
          {saving ? "Saving…" : dirty ? "Save changes" : "No changes"}
        </button>
      </div>
    </PhoneShell>
  );
}
