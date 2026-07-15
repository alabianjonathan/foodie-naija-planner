import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const FiltersSchema = z.object({
  mealTime: z.string().optional(),
  goal: z.string().optional(),
  preference: z.string().optional(),
  budget: z.string().optional(),
  timeAvailable: z.string().optional(),
  spice: z.string().optional(),
  allergies: z.string().optional(),
  dislikes: z.string().optional(),
  ingredients: z.string().optional(),
  people: z.number().int().positive().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  mode: z.enum(["cook", "order", "chef"]).optional(),
});

const InputSchema = z.object({
  query: z.string().optional(),
  filters: FiltersSchema.optional(),
  avoidIds: z.array(z.string()).optional(),
  feedback: z.string().optional(),
});

const PickSchema = z.object({
  label: z.string(),
  mealId: z.string(),
  reason: z.string(),
  considerations: z.string().nullable(),
  mealTime: z.string().nullable(),
});

const ResultSchema = z.object({
  summary: z.string(),
  picks: z.array(PickSchema),
});

export type RecommendPick = {
  label: string;
  mealId: string;
  reason: string;
  considerations: string | null;
  mealTime: string | null;
};

export type RecommendResult = {
  summary: string;
  picks: RecommendPick[];
};

export const recommendMeals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<RecommendResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("planning_type, people, city, budget, cook_order, goal, restriction, display_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { data: dbMeals } = await context.supabase
      .from("meals")
      .select(
        "slug, name, category, best_time, cook_min, cook_max, cooking_time_min, calories_min, calories_max, health_score, goals, protein, carbs, fat, fiber, portion, description, ingredients, popular, status",
      )
      .eq("status", "active");

    const catalog = (dbMeals ?? []).map((m) => ({
      id: m.slug,
      name: m.name,
      category: m.category,
      bestTime: m.best_time ?? [],
      cookMin: m.cook_min,
      cookMax: m.cook_max,
      cookingTimeMin: m.cooking_time_min,
      caloriesMin: m.calories_min,
      caloriesMax: m.calories_max,
      healthScore: m.health_score,
      goals: m.goals ?? [],
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      fiber: m.fiber,
      portion: m.portion,
      description: m.description,
      ingredients: ((m.ingredients as { name: string }[] | null) ?? []).map((i) => i.name),
    }));

    // Shuffle
    for (let i = catalog.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [catalog[i], catalog[j]] = [catalog[j], catalog[i]];
    }

    const f = data.filters ?? {};
    const seed = Math.random().toString(36).slice(2, 8);
    const avoidIds = data.avoidIds ?? [];

    const context_lines = [
      profile ? `Profile: goal=${profile.goal ?? "?"}, budget=${profile.budget ?? "?"}, people=${profile.people ?? "?"}, city=${profile.city ?? "?"}, restriction=${profile.restriction ?? "none"}, prefers=${profile.cook_order ?? "?"}` : "Profile: none",
      f.mealTime ? `Meal time: ${f.mealTime}` : "",
      f.goal ? `Goal: ${f.goal}` : "",
      f.preference ? `Cuisine preference: ${f.preference}` : "",
      f.budget ? `Budget: ${f.budget}` : "",
      f.timeAvailable ? `Time available: ${f.timeAvailable}` : "",
      f.spice ? `Spice: ${f.spice}` : "",
      f.allergies ? `ALLERGIES (never include): ${f.allergies}` : "",
      f.dislikes ? `Dislikes (avoid): ${f.dislikes}` : "",
      f.ingredients ? `Ingredients at home: ${f.ingredients}` : "",
      f.people ? `People: ${f.people}` : "",
      f.city ? `City: ${f.city}` : "",
      f.area ? `Area: ${f.area}` : "",
      f.mode ? `Preferred mode: ${f.mode}` : "",
      data.feedback ? `Recent feedback: ${data.feedback}` : "",
      avoidIds.length ? `Avoid these meal IDs unless nothing else fits: ${avoidIds.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are MealBeta AI — a Nigerian meal recommender. Seed: ${seed}.

USER REQUEST: ${data.query ? JSON.stringify(data.query) : "(none — use filters and profile)"}

CONTEXT:
${context_lines}

MEAL CATALOG (pick meal IDs strictly from this list — never invent):
${JSON.stringify(catalog)}

Task: Pick EXACTLY 4 different meals labeled:
- "Best Match" — best overall fit to the user's request
- "Healthier Option" — better nutrition profile (higher fibre/protein, moderate calories) still relevant
- "Budget Option" — cheapest that still fits the request
- "Quick Option" — shortest cookingTimeMin that still fits

Rules:
- NEVER include any meal containing an allergen the user listed.
- Respect dislikes and dietary preference.
- If ingredients-at-home are provided, prefer meals that reuse them.
- Match mealTime to the user's slot when specified.
- Weight-loss: moderate calories + protein + fibre. Muscle: high protein. Weight-gain: nutrient-dense larger portions. Blood-sugar: veg + protein + fibre, controlled refined carbs.
- Give ONE plain-language reason per pick that references specific facts (budget, protein, prep time, no [allergen], etc.). Also a short "considerations" note (or null).
- Set mealTime to Breakfast/Lunch/Dinner/Snack.

Respond ONLY with JSON:
{
  "summary": "short warm one-sentence intro",
  "picks": [
    { "label": "Best Match", "mealId": "<id>", "reason": "...", "considerations": "...", "mealTime": "Lunch" },
    { "label": "Healthier Option", "mealId": "<id>", "reason": "...", "considerations": "...", "mealTime": "..." },
    { "label": "Budget Option", "mealId": "<id>", "reason": "...", "considerations": "...", "mealTime": "..." },
    { "label": "Quick Option", "mealId": "<id>", "reason": "...", "considerations": "...", "mealTime": "..." }
  ]
}`;

    const validIds = new Set(catalog.map((c) => c.id));

    const normalize = (raw: unknown): RecommendResult | null => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      if (!Array.isArray(r.picks)) return null;
      const picks: RecommendPick[] = (r.picks as Record<string, unknown>[])
        .map((p) => ({
          label: String(p.label ?? "Best Match"),
          mealId: String(p.mealId ?? p.id ?? ""),
          reason: String(p.reason ?? ""),
          considerations: p.considerations == null ? null : String(p.considerations),
          mealTime: p.mealTime == null ? null : String(p.mealTime),
        }))
        .filter((p) => validIds.has(p.mealId));
      // Dedupe by mealId
      const seen = new Set<string>();
      const unique = picks.filter((p) => (seen.has(p.mealId) ? false : (seen.add(p.mealId), true)));
      if (unique.length === 0) return null;
      return { summary: String(r.summary ?? "Here are meals that fit your request."), picks: unique };
    };

    const fallback = (): RecommendResult => {
      const pool = catalog.filter((c) => !avoidIds.includes(c.id));
      if (pool.length === 0) return { summary: "No meals available.", picks: [] };
      const byHealth = [...pool].sort((a, b) => (b.healthScore ?? 0) - (a.healthScore ?? 0));
      const byBudget = [...pool].sort((a, b) => (a.cookMin ?? 0) - (b.cookMin ?? 0));
      const byQuick = [...pool].sort((a, b) => (a.cookingTimeMin ?? 999) - (b.cookingTimeMin ?? 999));
      const pick = (m: typeof pool[number], label: string, reason: string): RecommendPick => ({
        label, mealId: m.id, reason, considerations: null, mealTime: m.bestTime[0] ?? null,
      });
      const seen = new Set<string>();
      const take = (arr: typeof pool, label: string, reason: string) => {
        const m = arr.find((x) => !seen.has(x.id));
        if (!m) return null;
        seen.add(m.id);
        return pick(m, label, reason);
      };
      const picks = [
        take(pool, "Best Match", "Fits your general preferences."),
        take(byHealth, "Healthier Option", "Highest health score available."),
        take(byBudget, "Budget Option", "Most affordable in the catalog."),
        take(byQuick, "Quick Option", "Fastest to prepare."),
      ].filter((p): p is RecommendPick => p !== null);
      return { summary: "Here are suggestions based on your preferences.", picks };
    };

    try {
      const { output } = await generateText({
        model: createLovableAiGatewayProvider(key)("google/gemini-2.5-flash"),
        output: Output.object({ schema: ResultSchema }),
        temperature: 1.0,
        prompt,
      });
      return normalize(output) ?? fallback();
    } catch (err) {
      const rawText = NoObjectGeneratedError.isInstance(err) ? err.text : undefined;
      if (rawText) {
        try {
          const parsed = normalize(JSON.parse(rawText));
          if (parsed) return parsed;
        } catch { /* fall through */ }
      }
      return fallback();
    }
  });

// -------------------- Restaurant lookup --------------------

export type MatchedRestaurant = {
  id: string; slug: string; name: string; city: string; area: string | null;
  address: string | null; phone: string | null; whatsapp: string | null;
  rating: number; verified: boolean; tags: string[]; matchLabel: string;
};

export const findRestaurantsForMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    mealSlug: z.string(), city: z.string().optional(), area: z.string().optional(),
  }).parse(input))
  .handler(async ({ data, context }): Promise<MatchedRestaurant[]> => {
    let city = data.city;
    let area = data.area;
    if (!city || !area) {
      const { data: profile } = await context.supabase
        .from("profiles").select("city, area").eq("id", context.userId).maybeSingle();
      city = city ?? profile?.city ?? undefined;
      area = area ?? profile?.area ?? undefined;
    }

    const cols = "id, slug, name, city, area, address, rating, phone, whatsapp, verified, tags, meal_slugs, status";

    // Lookup same-state city list for fallback. Some imported restaurants use
    // satellite cities (Epe, Ikorodu, Badagry) that are not in the cities table,
    // so also match the state name/token against restaurant addresses.
    let stateCities: string[] = [];
    let stateName: string | undefined;
    let stateToken: string | undefined;
    if (city) {
      const { data: cityRow } = await context.supabase
        .from("cities").select("state").eq("name", city).maybeSingle();
      if (cityRow?.state) {
        stateName = cityRow.state;
        stateToken = cityRow.state.replace(/\s+State$/i, "").trim();
        const { data: sameState } = await context.supabase
          .from("cities").select("name").eq("state", cityRow.state);
        stateCities = Array.from(new Set([city, ...(sameState ?? []).map((c) => c.name)].filter(Boolean)));
      }
    }

    const runQuery = async (scope: "city" | "state" | "any", mealFilter: boolean, verifiedOnly: boolean) => {
      let q = context.supabase.from("restaurants").select(cols).eq("status", "active");
      if (scope === "city" && city) q = q.eq("city", city);
      else if (scope === "state" && stateCities.length) q = q.in("city", stateCities);
      if (verifiedOnly) q = q.eq("verified", true);
      if (mealFilter) q = q.contains("meal_slugs", [data.mealSlug]);
      const { data: rows, error } = await q
        .order("verified", { ascending: false })
        .order("rating", { ascending: false })
        .limit(scope === "any" ? 80 : 20);
      if (error) throw error;
      return rows ?? [];
    };

    const stateMatches = (r: { city: string | null; address: string | null }) => {
      if (!stateName && !stateToken) return false;
      const haystack = `${r.city ?? ""} ${r.address ?? ""}`.toLowerCase();
      return [stateName, stateToken].filter(Boolean).some((s) => haystack.includes(String(s).toLowerCase()));
    };

    const withAddressState = async (mealFilter: boolean, verifiedOnly: boolean) => {
      const rows = await runQuery("any", mealFilter, verifiedOnly);
      return rows.filter(stateMatches);
    };

    const scopes: Array<() => Promise<any[]>> = [
      () => runQuery("city", true, true),
      () => runQuery("city", false, true),
      () => runQuery("state", true, true),
      () => runQuery("state", false, true),
      () => withAddressState(true, true),
      () => withAddressState(false, true),
      () => runQuery("city", true, false),
      () => runQuery("city", false, false),
      () => runQuery("state", true, false),
      () => runQuery("state", false, false),
      () => withAddressState(true, false),
      () => withAddressState(false, false),
      () => runQuery("any", true, true),
      () => runQuery("any", false, true),
      () => runQuery("any", true, false),
      () => runQuery("any", false, false),
    ];

    let rows: any[] = [];
    for (const load of scopes) {
      rows = await load();
      if (rows.length > 0) break;
    }

    const scored = rows.sort((a, b) => {
      const areaScore = (r: any) => area && r.area === area ? 1 : 0;
      const cityScore = (r: any) => city && r.city === city ? 1 : 0;
      const stateScore = (r: any) => stateMatches(r) ? 1 : 0;
      const aScore = areaScore(a) * 40 + cityScore(a) * 20 + stateScore(a) * 10 + (a.verified ? 5 : 0) + Number(a.rating ?? 0);
      const bScore = areaScore(b) * 40 + cityScore(b) * 20 + stateScore(b) * 10 + (b.verified ? 5 : 0) + Number(b.rating ?? 0);
      return bScore - aScore;
    }).slice(0, 3);

    const labelFor = (r: any) => {
      if (area && r.area === area) return `In ${area}`;
      if (city && r.city === city) return `In ${city}`;
      if (stateMatches(r)) return stateToken ? `Same state (${stateToken})` : "Same state";
      return "Available restaurant";
    };

    return scored.map((r) => ({
      id: r.id, slug: r.slug, name: r.name, city: r.city, area: r.area,
      address: r.address ?? null, phone: r.phone ?? null, whatsapp: r.whatsapp ?? null,
      rating: Number(r.rating ?? 0), verified: !!r.verified, tags: r.tags ?? [], matchLabel: labelFor(r),
    }));
  });

// -------------------- Chef lookup --------------------

export type MatchedChef = {
  id: string; slug: string; businessName: string; city: string; area: string | null;
  areasCovered: string[]; categories: string[]; rating: number | null; verified: boolean;
  photoUrl: string | null; phone: string | null; whatsapp: string | null;
  priceMin: number | null; priceMax: number | null;
};

export const findChefsForMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    mealName: z.string().optional(), category: z.string().optional(),
    city: z.string().optional(), area: z.string().optional(),
  }).parse(input))
  .handler(async ({ data, context }): Promise<MatchedChef[]> => {
    let city = data.city;
    let area = data.area;
    if (!city || !area) {
      const { data: profile } = await context.supabase
        .from("profiles").select("city, area").eq("id", context.userId).maybeSingle();
      city = city ?? profile?.city ?? undefined;
      area = area ?? profile?.area ?? undefined;
    }

    const cols = "id, slug, business_name, city, area, areas_covered, categories, rating, verified, featured, photo_url, phone, whatsapp, price_min, price_max, status";

    let stateCities: string[] = [];
    if (city) {
      const { data: cityRow } = await context.supabase
        .from("cities").select("state").eq("name", city).maybeSingle();
      if (cityRow?.state) {
        const { data: sameState } = await context.supabase
          .from("cities").select("name").eq("state", cityRow.state);
        stateCities = (sameState ?? []).map((c) => c.name);
      }
    }

    const runQuery = async (scope: "city" | "state" | "any") => {
      let q = context.supabase.from("chefs").select(cols).eq("status", "active")
        .order("featured", { ascending: false })
        .order("verified", { ascending: false })
        .order("rating", { ascending: false, nullsFirst: false })
        .limit(15);
      if (scope === "city" && city) q = q.eq("city", city);
      else if (scope === "state" && stateCities.length) q = q.in("city", stateCities);
      const { data: rows } = await q;
      return rows ?? [];
    };

    let rows = await runQuery("city");
    if (rows.length === 0 && stateCities.length) rows = await runQuery("state");
    if (rows.length === 0) rows = await runQuery("any");

    const scored = rows.sort((a, b) => {
      const aArea = area && (a.area === area || (a.areas_covered ?? []).includes(area)) ? 1 : 0;
      const bArea = area && (b.area === area || (b.areas_covered ?? []).includes(area)) ? 1 : 0;
      if (aArea !== bArea) return bArea - aArea;
      const aCity = city && a.city === city ? 1 : 0;
      const bCity = city && b.city === city ? 1 : 0;
      if (aCity !== bCity) return bCity - aCity;
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return Number(b.rating ?? 0) - Number(a.rating ?? 0);
    }).slice(0, 3);

    return scored.map((c) => ({
      id: c.id, slug: c.slug, businessName: c.business_name, city: c.city, area: c.area,
      areasCovered: c.areas_covered ?? [], categories: c.categories ?? [],
      rating: c.rating == null ? null : Number(c.rating), verified: !!c.verified,
      photoUrl: c.photo_url ?? null, phone: c.phone ?? null, whatsapp: c.whatsapp ?? null,
      priceMin: c.price_min == null ? null : Number(c.price_min),
      priceMax: c.price_max == null ? null : Number(c.price_max),
    }));
  });

