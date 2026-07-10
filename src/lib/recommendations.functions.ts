import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { meals } from "@/data/meals";

const PickSchema = z.object({
  slot: z.enum(["Breakfast", "Lunch", "Dinner"]),
  mealId: z.string(),
  reason: z.string(),
});

const ResultSchema = z.object({
  summary: z.string(),
  picks: z.array(PickSchema),
});

export type DailyRecommendation = z.infer<typeof ResultSchema>;

const InputSchema = z.object({
  avoidIds: z.array(z.string()).optional(),
}).optional();

export const generateDailyRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const avoidIds = data?.avoidIds ?? [];

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("planning_type, people, city, budget, cook_order, goal, restriction, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const mealCatalog = meals.map((m) => ({
      id: m.id,
      name: m.name,
      category: m.category,
      bestTime: m.bestTime,
      cookCost: m.cookMin,
      calories: Math.round((m.caloriesMin + m.caloriesMax) / 2),
      healthScore: m.healthScore,
      goals: m.goals,
      protein: m.protein,
      description: m.description,
    }));

    // Shuffle catalog so the model doesn't anchor on the first items every call.
    for (let i = mealCatalog.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mealCatalog[i], mealCatalog[j]] = [mealCatalog[j], mealCatalog[i]];
    }
    const seed = Math.random().toString(36).slice(2, 8);

    const profileText = profile
      ? `Planning for: ${profile.planning_type ?? "n/a"}
People: ${profile.people ?? "n/a"}
City: ${profile.city ?? "n/a"}
Daily budget: ${profile.budget ?? "n/a"}
Preference: ${profile.cook_order ?? "n/a"}
Health goal: ${profile.goal ?? "n/a"}
Restriction: ${profile.restriction ?? "None"}`
      : "No profile data — assume a typical Nigerian household.";

    const prompt = `You are MealBeta AI, a Nigerian meal planning assistant.

USER PROFILE:
${profileText}

MEAL CATALOG (choose meal IDs strictly from this list):
${JSON.stringify(mealCatalog)}

Task: Pick exactly 3 DIFFERENT meals for TODAY — one Breakfast, one Lunch, one Dinner — that fit the user's budget, goal, restriction and household size. Prefer meals whose bestTime matches the slot. Give a warm one-sentence summary and a one-line reason per pick. Never invent meal IDs.

Variety rules (IMPORTANT — vary picks each call, don't default to the same meals):
- Session seed: ${seed} — use it to pick a fresh combination.
- ${avoidIds.length ? `AVOID these recently-shown meal IDs unless nothing else fits: ${avoidIds.join(", ")}.` : "Rotate across the catalog — don't always pick the healthiest-looking or first meal."}
- If several meals fit the slot equally, pick a less-obvious one to keep the plan interesting.
- The three picks must have different meal IDs.

Respond ONLY with JSON in this exact shape (no extra keys, no markdown):
{
  "summary": "string",
  "picks": [
    { "slot": "Breakfast", "mealId": "<id from catalog>", "reason": "string" },
    { "slot": "Lunch", "mealId": "<id from catalog>", "reason": "string" },
    { "slot": "Dinner", "mealId": "<id from catalog>", "reason": "string" }
  ]
}`;

    const normalize = (raw: unknown): DailyRecommendation | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const validIds = new Set(meals.map((m) => m.id));
      let picks: { slot: "Breakfast" | "Lunch" | "Dinner"; mealId: string; reason: string }[] = [];

      if (Array.isArray(r.picks)) {
        picks = (r.picks as Record<string, unknown>[])
          .map((p) => ({
            slot: String(p.slot ?? "") as "Breakfast" | "Lunch" | "Dinner",
            mealId: String(p.mealId ?? p.id ?? ""),
            reason: String(p.reason ?? ""),
          }));
      } else if (r.plan && typeof r.plan === "object") {
        const plan = r.plan as Record<string, { id?: string; mealId?: string; reason?: string }>;
        picks = (["Breakfast", "Lunch", "Dinner"] as const)
          .filter((s) => plan[s])
          .map((s) => ({
            slot: s,
            mealId: String(plan[s].mealId ?? plan[s].id ?? ""),
            reason: String(plan[s].reason ?? ""),
          }));
      }

      picks = picks.filter((p) => validIds.has(p.mealId) && ["Breakfast", "Lunch", "Dinner"].includes(p.slot));
      if (picks.length === 0) return null;
      return { summary: String(r.summary ?? "Here's your meal plan for today."), picks };
    };

    try {
      const { output } = await generateText({
        model: createLovableAiGatewayProvider(key)("google/gemini-2.5-flash"),
        output: Output.object({ schema: ResultSchema }),
        temperature: 1.1,
        prompt,
      });
      const result = normalize(output);
      if (result) return result;
      throw new Error("empty");
    } catch (err) {
      const rawText = NoObjectGeneratedError.isInstance(err) ? err.text : undefined;
      if (rawText) {
        try {
          const parsed = normalize(JSON.parse(rawText));
          if (parsed) return parsed;
        } catch {
          // fall through
        }
      }
      throw new Error("AI response was not valid. Please try again.");
    }
  });

