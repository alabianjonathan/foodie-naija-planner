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

export const generateDailyRecommendation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

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

Task: Pick exactly 3 meals for TODAY — one Breakfast, one Lunch, one Dinner — that best fit the user's budget, goal, restriction and household size. Prefer meals whose bestTime matches the slot. Give a short warm one-sentence summary and a one-line reason per pick (mention cost or fit to their goal). Never invent meal IDs.`;

    try {
      const { output } = await generateText({
        model: createLovableAiGatewayProvider(key)("google/gemini-2.5-flash"),
        output: Output.object({ schema: ResultSchema }),
        prompt,
      });
      const validIds = new Set(meals.map((m) => m.id));
      const filtered: DailyRecommendation = {
        summary: output.summary,
        picks: output.picks.filter((p) => validIds.has(p.mealId)),
      };
      return filtered;
    } catch (err) {
      if (NoObjectGeneratedError.isInstance(err)) {
        try {
          return ResultSchema.parse(JSON.parse(err.text ?? "{}"));
        } catch {
          throw new Error("AI response was not valid. Please try again.");
        }
      }
      throw err;
    }
  });
