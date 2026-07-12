import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(context: any): Promise<void> {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!isAdmin && !isSuper) throw new Response("Forbidden", { status: 403 });
}

// ============ CITIES ============
export const adminListCities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [{ data: cities }, { data: areas }] = await Promise.all([
      context.supabase.from("cities").select("*").order("name"),
      context.supabase.from("areas").select("*").order("name"),
    ]);
    return (cities ?? []).map((c) => ({
      ...c,
      areas: (areas ?? []).filter((a) => a.city_id === c.id),
    }));
  });

export const adminAddCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(1), state: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase.from("cities").insert({ name: data.name, state: data.state ?? null }).select().single();
    if (error) throw error;
    return row;
  });

export const adminToggleCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("cities").update({ active: data.active }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("cities").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminAddArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cityId: z.string().uuid(), name: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase.from("areas").insert({ city_id: data.cityId, name: data.name }).select().single();
    if (error) throw error;
    return row;
  });

export const adminToggleArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("areas").update({ active: data.active }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("areas").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ RESTAURANTS ============
export const adminListRestaurants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase.from("restaurants").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  });

export const adminUpsertRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1),
    name: z.string().min(1),
    city: z.string().min(1),
    area: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    opening: z.string().optional().nullable(),
    rating: z.number().default(0),
    distance_km: z.number().default(0),
    delivery: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    meal_slugs: z.array(z.string()).default([]),
    verified: z.boolean().default(false),
    status: z.string().default("active"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("restaurants").update(rest).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("restaurants").insert(data);
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteRestaurant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("restaurants").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ MEALS ============
export const adminListMeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase.from("meals").select("*").order("name");
    if (error) throw error;
    return data;
  });

export const adminDeleteMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("meals").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminToggleMealStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("meals").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ LEADS ============
export const adminListLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("leads")
      .select("*, restaurants(name, city), profiles:user_id(display_name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data;
  });

export const adminUpdateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("leads").update({ status: data.status }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

// ============ MEAL PLANS ============
export const adminListMealPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("meal_plans")
      .select("*, profiles:user_id(display_name)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data;
  });

// ============ DASHBOARD ============
export const adminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const count = (t: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (supabaseAdmin.from(t as any) as any).select("*", { count: "exact", head: true });
    };
    const [
      users,
      restaurants,
      meals,
      cities,
      areas,
      mealPlans,
      leads,
      pendingRestaurants,
      pendingLeads,
      recentRestaurants,
      popularMeals,
    ] = await Promise.all([
      count("profiles"),
      count("restaurants"),
      count("meals"),
      count("cities"),
      count("areas"),
      count("meal_plans"),
      count("leads"),
      supabaseAdmin.from("restaurants").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("leads").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("restaurants").select("id,name,city,area,status,created_at").order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("meals").select("id,name,category,cooking_time_min,cook_min,cook_max").order("name").limit(5),
    ]);
    return {
      totalUsers: users.count ?? 0,

      totalRestaurants: restaurants.count ?? 0,
      totalMeals: meals.count ?? 0,
      totalCities: cities.count ?? 0,
      totalAreas: areas.count ?? 0,
      totalMealPlans: mealPlans.count ?? 0,
      totalLeads: leads.count ?? 0,
      pendingRestaurants: pendingRestaurants.count ?? 0,
      pendingLeads: pendingLeads.count ?? 0,
      recentRestaurants: recentRestaurants.data ?? [],
      popularMeals: popularMeals.data ?? [],
    };
  });

