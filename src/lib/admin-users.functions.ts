import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdminRoles(context: any): Promise<Set<string>> {
  const { data: roleRows } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const roles = new Set(((roleRows ?? []) as { role: string }[]).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return roles;
}


export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: "user" | "restaurant" | "admin" | "super_admin";
  status: "active" | "pending" | "banned";
  joined: string;
};

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Require admin or super_admin
    const { data: roleRows } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const callerRoles = new Set((roleRows ?? []).map((r) => r.role));
    if (!callerRoles.has("admin") && !callerRoles.has("super_admin")) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (authErr) throw authErr;

    const ids = authList.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, display_name, phone, city, created_at").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const roleMap = new Map<string, AdminUserRow["role"]>();
    for (const r of roles ?? []) {
      const current = roleMap.get(r.user_id);
      const rank: Record<string, number> = { user: 0, restaurant: 1, admin: 2, super_admin: 3 };
      if (!current || rank[r.role] > rank[current]) {
        roleMap.set(r.user_id, r.role as AdminUserRow["role"]);
      }
    }

    const rows: AdminUserRow[] = authList.users.map((u) => {
      const p = profileMap.get(u.id);
      const banned = (u as { banned_until?: string | null }).banned_until;
      const status: AdminUserRow["status"] = banned && new Date(banned) > new Date()
        ? "banned"
        : u.email_confirmed_at || u.confirmed_at
          ? "active"
          : "pending";
      return {
        id: u.id,
        name: p?.display_name ?? (u.email?.split("@")[0] ?? "—"),
        email: u.email ?? "—",
        phone: p?.phone ?? u.phone ?? "—",
        city: p?.city ?? "—",
        role: roleMap.get(u.id) ?? "user",
        status,
        joined: (p?.created_at ?? u.created_at ?? "").slice(0, 10),
      };
    });

    rows.sort((a, b) => (a.joined < b.joined ? 1 : -1));
    return rows;
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["user", "restaurant", "admin", "super_admin"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await requireAdminRoles(context);
    // Only super_admin can grant admin or super_admin
    if ((data.role === "admin" || data.role === "super_admin") && !roles.has("super_admin")) {
      throw new Response("Forbidden", { status: 403 });
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    return { ok: true };
  });

export const adminBanUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid(), ban: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminRoles(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin.auth.admin as any).updateUserById(data.userId, {
      ban_duration: data.ban ? "8760h" : "none",
    });
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const roles = await requireAdminRoles(context);
    if (!roles.has("super_admin")) throw new Response("Forbidden", { status: 403 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });
