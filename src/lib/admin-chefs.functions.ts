import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  const { data: sup } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "super_admin" });
  if (!data && !sup) throw new Error("Forbidden");
}

export const adminListChefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("chefs")
      .select("id,slug,full_name,business_name,city,area,phone,email,status,plan,verified,featured,rating,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  });

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  plan: z.enum(["basic", "featured", "premium"]).optional(),
});

export const adminUpdateChef = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("chefs").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true as const };
  });
