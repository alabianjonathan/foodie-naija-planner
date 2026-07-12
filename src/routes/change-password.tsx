import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAuth } from "@/hooks/useAuth";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/change-password")({ component: ChangePasswordPage });

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(72);

function ChangePasswordPage() {
  const { user, loading } = useRequireAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // Identity check — does this account already have an email/password identity?
  const identities = useMemo(() => user?.identities ?? [], [user]);
  const hasPassword = identities.some(i => i.provider === "email");
  const socialProviders = identities
    .filter(i => i.provider !== "email")
    .map(i => i.provider);

  useEffect(() => {
    // no-op, but keeps the reactive check tidy
  }, [hasPassword]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return toast.error("No email on this account");

    const parsed = passwordSchema.safeParse(next);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (next !== confirm) return toast.error("Passwords do not match");

    setSaving(true);
    try {
      // If the user already has a password, verify the current one first.
      if (hasPassword) {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: current,
        });
        if (reauthError) throw new Error("Current password is incorrect");
      }

      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) throw error;

      toast.success(hasPassword ? "Password updated" : "Password set — you can now sign in with email");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <PhoneShell><div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-brand" /></div></PhoneShell>;
  }

  return (
    <PhoneShell>
      <TopBar title="Password & security" back="/profile" />
      <div className="px-6 pt-4 pb-8 space-y-5">
        <div className="card-soft !p-4 flex gap-3">
          <div className="h-9 w-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            {hasPassword ? <Lock className="h-4 w-4 text-brand" /> : <ShieldCheck className="h-4 w-4 text-brand" />}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-charcoal">
              {hasPassword ? "Change your password" : "Set a password"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasPassword
                ? "Enter your current password, then choose a new one."
                : socialProviders.length
                  ? `You currently sign in with ${socialProviders.join(", ")}. Setting a password lets you sign in with email too.`
                  : "Choose a password to secure your account."}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {hasPassword && (
            <input
              type="password"
              placeholder="Current password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-brand"
            />
          )}
          <input
            type="password"
            placeholder={hasPassword ? "New password" : "Password"}
            value={next}
            onChange={e => setNext(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl border-2 border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-brand"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl border-2 border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-brand"
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-brand-foreground font-semibold shadow-[var(--shadow-lift)] disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {hasPassword ? "Update password" : "Set password"}
          </button>
        </form>
      </div>
    </PhoneShell>
  );
}
