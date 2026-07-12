import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { ChevronRight, Heart, Wallet, Target, Users, Store, Bell, LogOut, Flame, Camera, Loader2, MapPin, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: Profile });

type ProfileRow = {
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  budget: string | null;
  goal: string | null;
  people: number | null;
};

function Profile() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, phone, avatar_url, city, budget, goal, people")
      .eq("id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        setProfile(data);
        setName(data.display_name ?? "");
        setPhone(data.phone ?? "");
        if (data.avatar_url) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.avatar_url, 3600);
          setAvatarUrl(signed?.signedUrl ?? null);
        }
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: name.trim() || null, phone: phone.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error("Couldn't save");
    setProfile(p => p ? { ...p, display_name: name.trim() || null, phone: phone.trim() || null } : p);
    setEditing(false);
    toast.success("Profile updated");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error("Upload failed"); }
    await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
    setAvatarUrl(signed?.signedUrl ?? null);
    setUploading(false);
    toast.success("Avatar updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading || !user) {
    return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;
  }

  const initial = (profile?.display_name || user.email || "U").charAt(0).toUpperCase();
  const budgetLabel = profile?.budget ?? "Not set";
  const goalLabel = profile?.goal ?? "Not set";
  const peopleLabel = profile?.people ? `${profile.people} people` : "Not set";
  const cityLabel = profile?.city ?? "Nigeria";

  const items = [
    { icon: Target, label: "Health goal", value: goalLabel, color: "bg-leaf/10 text-leaf" },
    { icon: Flame, label: "Daily calories", value: "2,200 kcal", color: "bg-brand/10 text-brand" },
    { icon: Wallet, label: "Daily budget", value: budgetLabel, color: "bg-warm/20 text-charcoal" },
    { icon: Users, label: "Family size", value: peopleLabel, color: "bg-secondary text-charcoal" },
  ];

  const links = [
    { icon: MapPin, label: `Location · ${cityLabel}`, to: "/settings" as const },
    { icon: Heart, label: "Saved meals & plans", to: "/saved" as const },
    { icon: Store, label: "Become a restaurant partner", to: "/home" as const },
    { icon: Bell, label: "Notifications", to: "/home" as const },
  ];

  return (
    <PhoneShell>
      <TopBar title="Profile" back="/home" right={
        <button onClick={() => editing ? save() : setEditing(true)} disabled={saving} className="text-sm font-medium text-brand">
          {editing ? (saving ? "Saving…" : "Save") : "Edit"}
        </button>
      } />
      <div className="px-6 pt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className="relative h-16 w-16 rounded-full bg-gradient-to-br from-brand to-warm flex items-center justify-center text-white font-display text-2xl overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : initial}
            <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-charcoal text-white flex items-center justify-center border-2 border-background">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Display name" maxLength={80} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone (WhatsApp)" maxLength={20} className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand" />
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl">{profile?.display_name ?? user.email}</h2>
                <p className="text-xs text-muted-foreground">{profile?.phone ? `${profile.phone} · ${cityLabel}` : cityLabel}</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card-soft !p-4">
              <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center`}><Icon className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground mt-3">{label}</p>
              <p className="font-semibold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <Link to="/onboarding" className="mt-4 block text-center text-xs text-brand font-medium">Update preferences</Link>

        <div className="mt-6 card-soft !p-0 overflow-hidden">
          {links.map(({ icon: Icon, label, to }, i) => (
            <Link key={label} to={to} className={`flex items-center gap-3 p-4 ${i < links.length - 1 ? "border-b border-border" : ""}`}>
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <button onClick={signOut} className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-medium text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
