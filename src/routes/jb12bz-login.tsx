import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/jb12bz-login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin Login — MealBeta" }, { name: "robots", content: "noindex" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signErr || !data.user) { setLoading(false); setError(signErr?.message ?? "Sign-in failed"); return; }
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const roles = new Set((roleRows ?? []).map((r) => r.role));
    setLoading(false);
    if (!roles.has("admin") && !roles.has("super_admin") && !roles.has("restaurant")) {
      await supabase.auth.signOut();
      setError("This account does not have admin access.");
      return;
    }
    navigate({ to: "/jb12bz" });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-charcoal p-4">
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lift">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-brand grid place-items-center text-brand-foreground font-bold">M</div>
          <div>
            <div className="font-semibold">MealBeta Admin</div>
            <div className="text-xs text-muted-foreground">Staff console</div>
          </div>
        </div>
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">Only accounts with admin, super admin or restaurant roles can access this dashboard.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative mt-1">
              <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background outline-none focus:border-brand" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border bg-background outline-none focus:border-brand" />
            </div>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button disabled={loading} type="submit"
            className="w-full py-2.5 rounded-lg bg-brand text-brand-foreground font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <div className="flex justify-between text-xs text-muted-foreground pt-2">
            <Link to="/forgot-password" className="hover:text-brand">Forgot password?</Link>
            <Link to="/" className="hover:text-brand">Back to app</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
