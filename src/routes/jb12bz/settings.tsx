import { createFileRoute, useRouteContext, Navigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/PageHeader";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/jb12bz/settings")({
  head: () => ({ meta: [{ title: "Settings — MealBeta Admin" }] }),
  component: SettingsPage,
});

type SettingsMap = Record<string, Record<string, unknown>>;

function SettingsPage() {
  const { adminRole } = useRouteContext({ from: "/jb12bz" });
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("platform_settings").select("key, value");
      if (error) toast.error(error.message);
      const map: SettingsMap = {};
      (data ?? []).forEach((r) => { map[r.key] = (r.value ?? {}) as Record<string, unknown>; });
      setSettings(map);
      setLoading(false);
    })();
  }, []);

  if (adminRole !== "super_admin") return <Navigate to="/jb12bz" />;

  const save = async (key: string, value: Record<string, unknown>) => {
    const { error } = await supabase.from("platform_settings").upsert({ key, value }).eq("key", key);
    if (error) return toast.error(error.message);
    setSettings((s) => ({ ...s, [key]: value }));
    toast.success("Saved");
    setOpenKey(null);
  };

  const cards: Array<{ key: string; title: string; desc: string; fields: FieldDef[] }> = [
    { key: "branding", title: "Branding", desc: "Logo, primary color, app name shown to customers.",
      fields: [
        { name: "appName", label: "App name", type: "text" },
        { name: "primaryColor", label: "Primary color (hex)", type: "text", placeholder: "#16a34a" },
        { name: "logoUrl", label: "Logo URL", type: "text" },
      ] },
    { key: "feature_flags", title: "Feature flags", desc: "Turn planner, restaurant discovery, or leads on/off globally.",
      fields: [
        { name: "planner", label: "Planner enabled", type: "bool" },
        { name: "restaurants", label: "Restaurants enabled", type: "bool" },
        { name: "leads", label: "Leads enabled", type: "bool" },
      ] },
    { key: "support", title: "Support", desc: "Support email and WhatsApp shown across the app.",
      fields: [
        { name: "email", label: "Support email", type: "text" },
        { name: "whatsapp", label: "WhatsApp number", type: "text" },
      ] },
    { key: "data_retention", title: "Data retention", desc: "How long meal plans and lead history are kept.",
      fields: [
        { name: "mealPlansDays", label: "Keep meal plans (days)", type: "number" },
        { name: "leadsDays", label: "Keep leads (days)", type: "number" },
      ] },
  ];

  if (loading) return <div className="p-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Platform settings" subtitle="Super admin only. Global configuration for MealBeta." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
        {cards.map((c) => (
          <div key={c.key} className="bg-card border rounded-xl p-5">
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
            <button onClick={() => setOpenKey(c.key)} className="mt-3 text-sm text-brand hover:underline">
              Configure →
            </button>
            {openKey === c.key && (
              <Editor
                fields={c.fields}
                value={settings[c.key] ?? {}}
                onCancel={() => setOpenKey(null)}
                onSave={(v) => save(c.key, v)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type FieldDef = { name: string; label: string; type: "text" | "number" | "bool"; placeholder?: string };

function Editor({ fields, value, onCancel, onSave }: {
  fields: FieldDef[];
  value: Record<string, unknown>;
  onCancel: () => void;
  onSave: (v: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>(value);
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {fields.map((f) => (
        <div key={f.name}>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
          {f.type === "bool" ? (
            <input type="checkbox" checked={!!form[f.name]}
              onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
          ) : (
            <input
              type={f.type === "number" ? "number" : "text"}
              placeholder={f.placeholder}
              value={String(form[f.name] ?? "")}
              onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button
          onClick={async () => { setSaving(true); await onSave(form); setSaving(false); }}
          disabled={saving}
          className="rounded-md bg-brand text-brand-foreground px-3 py-1.5 text-sm disabled:opacity-60">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={onCancel} className="rounded-md bg-secondary px-3 py-1.5 text-sm">Cancel</button>
      </div>
    </div>
  );
}
