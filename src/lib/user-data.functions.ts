import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { CatalogMeal } from "@/lib/catalog.functions";

type Ing = { name: string; qty: string; price: number };

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMeal(m: any): CatalogMeal {
  return {
    id: m.id, slug: m.slug, name: m.name, emoji: m.emoji, gradient: m.gradient, category: m.category,
    bestTime: m.best_time ?? [], cookMin: m.cook_min, cookMax: m.cook_max, orderMin: m.order_min, orderMax: m.order_max,
    cookingTimeMin: m.cooking_time_min, caloriesMin: m.calories_min, caloriesMax: m.calories_max,
    protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber, portion: m.portion,
    healthScore: m.health_score, healthNote: m.health_note, goals: m.goals ?? [],
    ingredients: (m.ingredients as Ing[]) ?? [], description: m.description, popular: m.popular, status: m.status,
  };
}

export const getMealBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<CatalogMeal | null> => {
    const sb = publicClient();
    const { data: m } = await sb.from("meals").select("*").eq("slug", data.slug).eq("status", "active").maybeSingle();
    return m ? mapMeal(m) : null;
  });

// ============ SAVED MEALS ============
export const listSavedMeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CatalogMeal[]> => {
    const { data: rows } = await context.supabase
      .from("saved_meals")
      .select("meal_id, meals(*)")
      .order("created_at", { ascending: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((rows ?? []) as any[]).map((r) => mapMeal(r.meals)).filter(Boolean);
  });

export const listSavedMealIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { data } = await context.supabase.from("saved_meals").select("meal_id");
    return ((data ?? []) as { meal_id: string }[]).map((r) => r.meal_id);
  });

export const toggleSavedMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ mealId: z.string().uuid(), saved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.saved) {
      const { error } = await context.supabase
        .from("saved_meals")
        .insert({ user_id: context.userId, meal_id: data.mealId });
      if (error && !error.message.includes("duplicate")) throw error;
    } else {
      const { error } = await context.supabase
        .from("saved_meals")
        .delete()
        .eq("user_id", context.userId)
        .eq("meal_id", data.mealId);
      if (error) throw error;
    }
    return { ok: true };
  });

// ============ PROFILE ============
export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    display_name: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    budget: z.string().optional().nullable(),
    goal: z.string().optional().nullable(),
    restriction: z.string().optional().nullable(),
    cook_order: z.string().optional().nullable(),
    people: z.number().int().optional().nullable(),
    planning_type: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

// ============ MEAL PLANS ============
export const getCurrentMealPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const upsertMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    plan_type: z.string().default("weekly"),
    city: z.string().optional().nullable(),
    budget: z.string().optional().nullable(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: z.any(),
    total_cost: z.number().optional().nullable(),
    total_calories: z.number().int().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const payload = { ...data, user_id: context.userId };
    if (data.id) {
      const { id, ...rest } = payload;
      const { error } = await sb.from("meal_plans").update(rest).eq("id", id).eq("user_id", context.userId);
      if (error) throw error;
      return { id };
    }
    const { data: row, error } = await sb.from("meal_plans").insert(payload).select("id").single();
    if (error) throw error;
    return { id: row.id };
  });
