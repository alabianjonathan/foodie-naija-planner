import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ----- Types -----
export type EntryType = "meal" | "water" | "weight" | "activity";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export type NutritionLog = {
  id: string;
  logged_on: string;
  logged_at: string;
  entry_type: EntryType;
  meal_slot: MealSlot | null;
  meal_id: string | null;
  food_name: string | null;
  servings: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  water_ml: number | null;
  weight_kg: number | null;
  activity_type: string | null;
  activity_minutes: number | null;
  notes: string | null;
};

export type NutritionGoals = {
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml: number;
  weight_target_kg: number | null;
  goal_type: "lose" | "maintain" | "gain";
  activity_target_min: number;
};

const DEFAULT_GOALS: NutritionGoals = {
  daily_calories: 2000,
  protein_g: 90,
  carbs_g: 250,
  fat_g: 65,
  fiber_g: 25,
  water_ml: 2500,
  weight_target_kg: null,
  goal_type: "maintain",
  activity_target_min: 30,
};

// ----- Log a meal (auto-fills macros from meals table if meal_id provided) -----
const LogMealInput = z.object({
  meal_id: z.string().uuid().optional(),
  meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  food_name: z.string().optional(),
  servings: z.number().min(0.1).max(20).default(1),
  logged_on: z.string().optional(), // YYYY-MM-DD
  notes: z.string().max(500).optional(),
  // Manual macros (used when no meal_id)
  calories: z.number().optional(),
  protein_g: z.number().optional(),
  carbs_g: z.number().optional(),
  fat_g: z.number().optional(),
  fiber_g: z.number().optional(),
});

export const logMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => LogMealInput.parse(d))
  .handler(async ({ data, context }) => {
    let calories = data.calories ?? null;
    let protein = data.protein_g ?? null;
    let carbs = data.carbs_g ?? null;
    let fat = data.fat_g ?? null;
    let fiber = data.fiber_g ?? null;
    let foodName = data.food_name ?? null;

    if (data.meal_id) {
      const { data: meal } = await context.supabase
        .from("meals")
        .select("name, calories_min, calories_max, protein, carbs, fat, fiber, ingredients")
        .eq("id", data.meal_id)
        .maybeSingle();
      if (meal) {
        foodName = foodName ?? meal.name;
        const { computeNutrition } = await import("@/lib/nutrition");
        const { macros } = computeNutrition({
          ingredients: (meal.ingredients as Array<{ name: string; qty?: string; price?: number }>) ?? [],
          caloriesMin: meal.calories_min ?? 0,
          caloriesMax: meal.calories_max ?? 0,
          category: "",
          protein: meal.protein,
          carbs: meal.carbs,
          fat: meal.fat,
          fiber: meal.fiber,
        });
        calories = calories ?? macros.calories;
        protein = protein ?? macros.proteinG;
        carbs = carbs ?? macros.carbsG;
        fat = fat ?? macros.fatG;
        fiber = fiber ?? macros.fiberG;
      }
    }

    const mul = data.servings ?? 1;
    const { error } = await context.supabase.from("nutrition_logs").insert({
      user_id: context.userId,
      entry_type: "meal",
      meal_slot: data.meal_slot,
      meal_id: data.meal_id ?? null,
      food_name: foodName,
      servings: data.servings,
      logged_on: data.logged_on ?? new Date().toISOString().slice(0, 10),
      calories: calories != null ? Math.round(calories * mul) : null,
      protein_g: protein != null ? Math.round(protein * mul) : null,
      carbs_g: carbs != null ? Math.round(carbs * mul) : null,
      fat_g: fat != null ? Math.round(fat * mul) : null,
      fiber_g: fiber != null ? Math.round(fiber * mul) : null,
      notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    await updateStreak(context.supabase, context.userId);
    return { ok: true };
  });

// ----- Quick log helpers -----
export const logWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ water_ml: z.number().int().min(50).max(5000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").insert({
      user_id: context.userId,
      entry_type: "water",
      water_ml: data.water_ml,
      logged_on: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    await updateStreak(context.supabase, context.userId);
    return { ok: true };
  });

export const logWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ weight_kg: z.number().min(20).max(400) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").insert({
      user_id: context.userId,
      entry_type: "weight",
      weight_kg: data.weight_kg,
      logged_on: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    activity_type: z.string().min(1).max(60),
    activity_minutes: z.number().int().min(1).max(600),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").insert({
      user_id: context.userId,
      entry_type: "activity",
      activity_type: data.activity_type,
      activity_minutes: data.activity_minutes,
      logged_on: new Date().toISOString().slice(0, 10),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_logs").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Goals -----
export const getGoals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NutritionGoals> => {
    const { data } = await context.supabase.from("nutrition_goals").select("*").eq("user_id", context.userId).maybeSingle();
    if (data) return data as NutritionGoals;
    // seed from profile goal if present
    const { data: prof } = await context.supabase.from("profiles").select("goal").eq("id", context.userId).maybeSingle();
    const g = { ...DEFAULT_GOALS };
    const goalStr = (prof?.goal ?? "").toLowerCase();
    if (goalStr.includes("lose")) { g.goal_type = "lose"; g.daily_calories = 1700; g.carbs_g = 180; }
    else if (goalStr.includes("gain") || goalStr.includes("build")) { g.goal_type = "gain"; g.daily_calories = 2500; g.protein_g = 130; }
    return g;
  });

const GoalsInput = z.object({
  daily_calories: z.number().int().min(800).max(6000),
  protein_g: z.number().int().min(20).max(400),
  carbs_g: z.number().int().min(20).max(800),
  fat_g: z.number().int().min(10).max(300),
  fiber_g: z.number().int().min(5).max(100),
  water_ml: z.number().int().min(500).max(8000),
  weight_target_kg: z.number().min(20).max(400).nullable(),
  goal_type: z.enum(["lose", "maintain", "gain"]),
  activity_target_min: z.number().int().min(0).max(300),
});

export const updateGoals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GoalsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("nutrition_goals").upsert({ user_id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Summaries -----
export type DaySummary = {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  water_ml: number;
  activity_minutes: number;
  weight_kg: number | null;
  logs: NutritionLog[];
};

export const getDaySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ date: z.string().optional() }).parse(d))
  .handler(async ({ data, context }): Promise<DaySummary> => {
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    const { data: rows } = await context.supabase
      .from("nutrition_logs").select("*").eq("user_id", context.userId).eq("logged_on", date).order("logged_at");
    const logs = (rows ?? []) as NutritionLog[];
    const sum = { date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, water_ml: 0, activity_minutes: 0, weight_kg: null as number | null, logs };
    for (const l of logs) {
      sum.calories += l.calories ?? 0;
      sum.protein_g += l.protein_g ?? 0;
      sum.carbs_g += l.carbs_g ?? 0;
      sum.fat_g += l.fat_g ?? 0;
      sum.fiber_g += l.fiber_g ?? 0;
      sum.water_ml += l.water_ml ?? 0;
      sum.activity_minutes += l.activity_minutes ?? 0;
      if (l.weight_kg != null) sum.weight_kg = l.weight_kg;
    }
    return sum;
  });

export type RangePoint = { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; fiber_g: number; water_ml: number; activity_minutes: number; weight_kg: number | null };

export const getRangeSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ range: z.enum(["week", "month"]) }).parse(d))
  .handler(async ({ data, context }): Promise<RangePoint[]> => {
    const days = data.range === "week" ? 7 : 30;
    const start = new Date(); start.setDate(start.getDate() - (days - 1));
    const startStr = start.toISOString().slice(0, 10);
    const { data: rows } = await context.supabase
      .from("nutrition_logs").select("*").eq("user_id", context.userId).gte("logged_on", startStr);
    const byDay = new Map<string, RangePoint>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      byDay.set(k, { date: k, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, water_ml: 0, activity_minutes: 0, weight_kg: null });
    }
    for (const l of (rows ?? []) as NutritionLog[]) {
      const p = byDay.get(l.logged_on);
      if (!p) continue;
      p.calories += l.calories ?? 0;
      p.protein_g += l.protein_g ?? 0;
      p.carbs_g += l.carbs_g ?? 0;
      p.fat_g += l.fat_g ?? 0;
      p.fiber_g += l.fiber_g ?? 0;
      p.water_ml += l.water_ml ?? 0;
      p.activity_minutes += l.activity_minutes ?? 0;
      if (l.weight_kg != null) p.weight_kg = l.weight_kg;
    }
    return Array.from(byDay.values());
  });

// ----- Streaks & achievements -----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateStreak(sb: any, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: cur } = await sb.from("nutrition_streaks").select("*").eq("user_id", userId).maybeSingle();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  let current = 1, longest = 1;
  if (cur) {
    if (cur.last_logged_on === today) return;
    if (cur.last_logged_on === yStr) current = (cur.current_streak ?? 0) + 1;
    longest = Math.max(cur.longest_streak ?? 0, current);
  }
  await sb.from("nutrition_streaks").upsert({ user_id: userId, current_streak: current, longest_streak: longest, last_logged_on: today });
}

export type StreakInfo = { current_streak: number; longest_streak: number; last_logged_on: string | null; achievements: Array<{ id: string; label: string; emoji: string; date: string }> };

export const getStreakAndAchievements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StreakInfo> => {
    const { data: s } = await context.supabase.from("nutrition_streaks").select("*").eq("user_id", context.userId).maybeSingle();
    const streak = { current_streak: s?.current_streak ?? 0, longest_streak: s?.longest_streak ?? 0, last_logged_on: s?.last_logged_on ?? null };
    // Compute rule-based achievements from last 30 days
    const start = new Date(); start.setDate(start.getDate() - 29);
    const { data: rows } = await context.supabase
      .from("nutrition_logs").select("entry_type,logged_on,protein_g,water_ml,weight_kg")
      .eq("user_id", context.userId).gte("logged_on", start.toISOString().slice(0, 10));
    const list = (rows ?? []) as Array<{ entry_type: string; logged_on: string; protein_g: number | null; water_ml: number | null; weight_kg: number | null }>;
    const { data: goals } = await context.supabase.from("nutrition_goals").select("protein_g,water_ml").eq("user_id", context.userId).maybeSingle();
    const proteinGoal = goals?.protein_g ?? 90;
    const waterGoal = goals?.water_ml ?? 2500;
    const byDay = new Map<string, { protein: number; water: number }>();
    let hasWeigh = false;
    for (const r of list) {
      const day = byDay.get(r.logged_on) ?? { protein: 0, water: 0 };
      day.protein += r.protein_g ?? 0;
      day.water += r.water_ml ?? 0;
      byDay.set(r.logged_on, day);
      if (r.weight_kg != null) hasWeigh = true;
    }
    const proteinDays = Array.from(byDay.values()).filter((d) => d.protein >= proteinGoal).length;
    const waterDays = Array.from(byDay.values()).filter((d) => d.water >= waterGoal).length;
    const ach: StreakInfo["achievements"] = [];
    if (streak.current_streak >= 3) ach.push({ id: "streak3", label: "3-day streak", emoji: "🔥", date: streak.last_logged_on ?? "" });
    if (streak.current_streak >= 7) ach.push({ id: "streak7", label: "7-day streak", emoji: "🏆", date: streak.last_logged_on ?? "" });
    if (proteinDays >= 5) ach.push({ id: "prot5", label: "Hit protein 5×", emoji: "💪", date: "" });
    if (waterDays >= 3) ach.push({ id: "water3", label: "Water goal 3×", emoji: "💧", date: "" });
    if (hasWeigh) ach.push({ id: "weighin", label: "Logged weight", emoji: "⚖️", date: "" });
    return { ...streak, achievements: ach };
  });

// ----- AI insights -----
export const getAIInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ headline: string; tip: string; nudge: string }> => {
    const start = new Date(); start.setDate(start.getDate() - 6);
    const { data: rows } = await context.supabase
      .from("nutrition_logs").select("logged_on,calories,protein_g,carbs_g,fat_g,fiber_g,water_ml,activity_minutes")
      .eq("user_id", context.userId).gte("logged_on", start.toISOString().slice(0, 10));
    const { data: goals } = await context.supabase.from("nutrition_goals").select("*").eq("user_id", context.userId).maybeSingle();
    const summary = { cal: 0, protein: 0, water: 0, activity: 0, days: 0 };
    const dates = new Set<string>();
    for (const r of (rows ?? []) as Array<{ logged_on: string; calories: number | null; protein_g: number | null; water_ml: number | null; activity_minutes: number | null }>) {
      summary.cal += r.calories ?? 0;
      summary.protein += r.protein_g ?? 0;
      summary.water += r.water_ml ?? 0;
      summary.activity += r.activity_minutes ?? 0;
      dates.add(r.logged_on);
    }
    summary.days = Math.max(1, dates.size);
    const avg = { cal: Math.round(summary.cal / summary.days), protein: Math.round(summary.protein / summary.days), water: Math.round(summary.water / summary.days), activity: Math.round(summary.activity / summary.days) };
    const target = goals ?? DEFAULT_GOALS;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return {
        headline: `You logged ${summary.days} day(s) this week.`,
        tip: `Average ${avg.cal} kcal, ${avg.protein}g protein, ${Math.round(avg.water / 250)} glasses of water — steady work.`,
        nudge: `Try one more day of logging to see clearer trends.`,
      };
    }
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a warm Nigerian nutrition coach. Return strict JSON: {headline, tip, nudge}. Each field <=140 chars. Use Nigerian foods when relevant. No medical claims." },
            { role: "user", content: `Weekly averages: ${JSON.stringify(avg)}. Goals: cal ${target.daily_calories}, protein ${target.protein_g}g, water ${target.water_ml}ml, activity ${target.activity_target_min}min. Days logged: ${summary.days}/7. Give one insight, one Nigerian-friendly tip, one gentle nudge.` },
          ],
          response_format: { type: "json_object" },
        }),
      });
      const j = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = j.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text) as { headline?: string; tip?: string; nudge?: string };
      return {
        headline: parsed.headline ?? `${summary.days} days logged this week.`,
        tip: parsed.tip ?? `Averaging ${avg.protein}g protein daily.`,
        nudge: parsed.nudge ?? `Keep the streak going tomorrow.`,
      };
    } catch {
      return {
        headline: `You logged ${summary.days} day(s) this week.`,
        tip: `Averaging ${avg.cal} kcal and ${avg.protein}g protein — a solid Nigerian plate covers this easily.`,
        nudge: `Add one glass of water after every meal to hit your ${Math.round(target.water_ml / 250)}-glass goal.`,
      };
    }
  });
