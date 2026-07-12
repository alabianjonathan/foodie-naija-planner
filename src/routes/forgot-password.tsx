import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPasswordPage });

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Check your inbox for the reset link.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background py-0 md:py-6">
      <div className="phone-shell overflow-hidden md:rounded-[36px] flex flex-col p-6">
        <div className="flex items-center gap-3">
          <Link to="/auth" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8">
          <h1 className="font-display text-3xl leading-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the email tied to your MealBeta account and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 rounded-2xl border-2 border-border bg-card p-5 text-sm">
            We sent a reset link to <span className="font-semibold">{email}</span>. Follow it to set a new password.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border-2 border-border bg-card px-5 py-3.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-4 text-brand-foreground font-semibold shadow-[var(--shadow-lift)] disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset link
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/auth" className="text-brand font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
