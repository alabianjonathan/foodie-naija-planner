// Nutrition estimation and scoring.
// Meals in the DB only store categorical macros (High/Medium/Low) plus a
// calorie range and an ingredient list. We estimate real grams-per-nutrient
// from the ingredient list (with a categorical fallback), then convert those
// grams into a 0-10 score using thresholds defined by the product spec.

export type NutrientKey = "protein" | "carbs" | "fat" | "fiber";

export type NutrientInfo = {
  key: NutrientKey;
  emoji: string;
  name: string;
  grams: number;
  score: number;
  label: string;
};

export type MacroEstimate = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  fatQuality: number; // 0 (bad) .. 1 (excellent)
  carbQuality: number; // 0 refined .. 1 complex
};

type Ingredient = { name: string; qty?: string; price?: number };

const EMOJI: Record<NutrientKey, string> = {
  protein: "💪",
  carbs: "🌾",
  fat: "🥑",
  fiber: "🌿",
};

const NAME: Record<NutrientKey, string> = {
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  fiber: "Fibre",
};

/** Per-portion nutrition for the qty typically listed in our ingredient rows.
 *  Values are rough Nigerian-diet averages — good enough to differentiate meals. */
type IngRow = {
  match: RegExp;
  p: number; c: number; f: number; fib: number;
  fatQ?: number; // 0 poor .. 1 excellent
  carbQ?: number; // 0 refined .. 1 complex
  perUnit?: "qty-number" | "cup" | "tbsp" | "piece" | "flat";
};

const ING: IngRow[] = [
  // Proteins
  { match: /\bchicken\b/i, p: 55, c: 0, f: 18, fib: 0, fatQ: 0.5 },
  { match: /\b(beef|assorted meat|goat|meat)\b/i, p: 60, c: 0, f: 30, fib: 0, fatQ: 0.2 },
  { match: /\b(fish|tilapia|croaker|mackerel|titus)\b/i, p: 45, c: 0, f: 10, fib: 0, fatQ: 0.95 },
  { match: /\bstockfish\b/i, p: 25, c: 0, f: 3, fib: 0, fatQ: 0.9 },
  { match: /\bcrayfish\b/i, p: 8, c: 1, f: 1, fib: 0, fatQ: 0.9 },
  { match: /\bshrimp|prawn\b/i, p: 20, c: 0, f: 2, fib: 0, fatQ: 0.9 },
  { match: /\begg/i, p: 6, c: 0.5, f: 5, fib: 0, fatQ: 0.7, perUnit: "qty-number" },
  { match: /\bturkey\b/i, p: 50, c: 0, f: 20, fib: 0, fatQ: 0.5 },
  { match: /\bsuya\b/i, p: 40, c: 2, f: 25, fib: 1, fatQ: 0.3 },
  // Legumes
  { match: /\b(honey )?beans\b/i, p: 30, c: 80, f: 2, fib: 30, carbQ: 0.9, fatQ: 0.7, perUnit: "cup" },
  { match: /\bbeans flour|moi moi/i, p: 20, c: 45, f: 1.5, fib: 18, carbQ: 0.9, fatQ: 0.7 },
  { match: /\blocust beans|iru/i, p: 5, c: 4, f: 3, fib: 3, fatQ: 0.6 },
  { match: /\bgroundnut\b/i, p: 12, c: 8, f: 22, fib: 5, fatQ: 0.85 },
  // Grains / starches
  { match: /\brice\b/i, p: 8, c: 90, f: 1, fib: 1.5, carbQ: 0.4, perUnit: "cup" },
  { match: /\bbrown rice|ofada/i, p: 8, c: 85, f: 1.5, fib: 6, carbQ: 0.85, perUnit: "cup" },
  { match: /\bspaghetti|pasta|noodle/i, p: 30, c: 150, f: 3, fib: 6, carbQ: 0.35 },
  { match: /\bbread\b/i, p: 8, c: 45, f: 2, fib: 2, carbQ: 0.35 },
  { match: /\bwheat/i, p: 6, c: 60, f: 1, fib: 8, carbQ: 0.85 },
  { match: /\bgarri|eba\b/i, p: 3, c: 150, f: 0.8, fib: 8, carbQ: 0.5, perUnit: "cup" },
  { match: /\bfufu|akpu|semo|semolina\b/i, p: 2, c: 160, f: 0.5, fib: 4, carbQ: 0.4, perUnit: "cup" },
  { match: /\byam flour|amala\b/i, p: 4, c: 150, f: 0.6, fib: 12, carbQ: 0.75, perUnit: "cup" },
  { match: /\bpounded yam\b/i, p: 3, c: 140, f: 0.5, fib: 8, carbQ: 0.65 },
  { match: /\bpap|ogi|oatmeal|oats\b/i, p: 5, c: 55, f: 2, fib: 4, carbQ: 0.7 },
  { match: /\byam\b/i, p: 4, c: 70, f: 0.5, fib: 10, carbQ: 0.7 },
  { match: /\bpotato\b/i, p: 4, c: 40, f: 0.2, fib: 5, carbQ: 0.6 },
  { match: /\bplantain\b/i, p: 2, c: 60, f: 0.7, fib: 5, carbQ: 0.6, perUnit: "qty-number" },
  // Soup thickeners / seeds
  { match: /\begusi\b/i, p: 30, c: 15, f: 45, fib: 8, fatQ: 0.85, perUnit: "cup" },
  { match: /\bogbono\b/i, p: 15, c: 20, f: 40, fib: 12, fatQ: 0.85 },
  // Vegetables
  { match: /\b(ugu|ewedu|bitterleaf|spinach|efo|vegetable|kale|cabbage|lettuce)\b/i, p: 4, c: 8, f: 0.5, fib: 6, fatQ: 0.9, carbQ: 0.95 },
  { match: /\btomato/i, p: 1, c: 5, f: 0.2, fib: 2, carbQ: 0.9 },
  { match: /\b(pepper|onion|ginger|garlic|lemon|seasoning|salt)\b/i, p: 0.3, c: 2, f: 0.1, fib: 0.5, carbQ: 0.9 },
  { match: /\bavocado\b/i, p: 4, c: 17, f: 30, fib: 13, fatQ: 1 },
  { match: /\bcarrot\b/i, p: 1, c: 10, f: 0.2, fib: 3 },
  // Oils / fats
  { match: /\bolive oil\b/i, p: 0, c: 0, f: 40, fib: 0, fatQ: 1, perUnit: "tbsp" },
  { match: /\bpalm oil\b/i, p: 0, c: 0, f: 45, fib: 0, fatQ: 0.15, perUnit: "tbsp" },
  { match: /\b(groundnut oil|vegetable oil|oil for frying|frying oil|oil)\b/i, p: 0, c: 0, f: 45, fib: 0, fatQ: 0.35, perUnit: "tbsp" },
  { match: /\bbutter|margarine\b/i, p: 1, c: 0, f: 30, fib: 0, fatQ: 0.2 },
  { match: /\bcoconut\b/i, p: 3, c: 8, f: 25, fib: 6, fatQ: 0.5 },
  // Dairy / misc
  { match: /\bmilk|yogurt\b/i, p: 8, c: 12, f: 5, fib: 0, fatQ: 0.6 },
  { match: /\bcheese\b/i, p: 20, c: 2, f: 20, fib: 0, fatQ: 0.4 },
  { match: /\bhoney|sugar|syrup\b/i, p: 0, c: 40, f: 0, fib: 0, carbQ: 0.1 },
  { match: /\bfruit|banana|apple|orange|mango|pineapple/i, p: 1, c: 25, f: 0.3, fib: 4, carbQ: 0.8 },
];

function parseQty(qty: string | undefined): { number: number; unit: string } {
  if (!qty) return { number: 1, unit: "" };
  const q = qty.toLowerCase();
  // Handle fractions like "1/2 cup"
  let number = 1;
  const frac = q.match(/(\d+)\s*\/\s*(\d+)/);
  const whole = q.match(/^\s*(\d+(?:\.\d+)?)/);
  if (frac) number = Number(frac[1]) / Number(frac[2]);
  else if (whole) number = Number(whole[1]);
  return { number, unit: q };
}

function qtyMultiplier(row: IngRow, qty: string | undefined): number {
  const { number, unit } = parseQty(qty);
  if (row.perUnit === "qty-number") return number || 1;
  if (row.perUnit === "cup") {
    if (unit.includes("cup")) return number || 1;
    if (unit.includes("tbsp")) return (number || 1) / 16;
    return 1;
  }
  if (row.perUnit === "tbsp") {
    if (unit.includes("tbsp")) return number || 1;
    if (unit.includes("cup")) return (number || 1) * 16;
    if (unit.includes("tsp")) return (number || 1) / 3;
    return number || 1;
  }
  if (row.perUnit === "piece") return number || 1;
  return 1;
}

function findRow(name: string): IngRow | undefined {
  return ING.find((r) => r.match.test(name));
}

export function estimateMacros(input: {
  ingredients?: Ingredient[] | null;
  caloriesMin?: number;
  caloriesMax?: number;
  category?: string | null;
  protein?: string | null;
  carbs?: string | null;
  fat?: string | null;
  fiber?: string | null;
}): MacroEstimate {
  const calMid = Math.round(((input.caloriesMin ?? 400) + (input.caloriesMax ?? 600)) / 2);
  let p = 0, c = 0, f = 0, fib = 0;
  let fatQNum = 0, fatQDen = 0;
  let carbQNum = 0, carbQDen = 0;
  const ings = input.ingredients ?? [];
  for (const ing of ings) {
    const row = findRow(ing.name || "");
    if (!row) continue;
    const m = qtyMultiplier(row, ing.qty);
    p += row.p * m;
    c += row.c * m;
    f += row.f * m;
    fib += row.fib * m;
    if (row.fatQ != null && row.f > 0) { fatQNum += row.fatQ * row.f * m; fatQDen += row.f * m; }
    if (row.carbQ != null && row.c > 0) { carbQNum += row.carbQ * row.c * m; carbQDen += row.c * m; }
  }

  // If almost nothing matched, fall back to categorical + calorie split.
  const totalMacroCals = p * 4 + c * 4 + f * 9;
  if (totalMacroCals < calMid * 0.4) {
    const level = (v: string | null | undefined) => {
      const s = (v ?? "medium").toLowerCase();
      return s === "high" ? 1.3 : s === "low" ? 0.6 : 1;
    };
    const pShare = 0.18 * level(input.protein);
    const cShare = 0.5 * level(input.carbs);
    const fShare = 0.28 * level(input.fat);
    const norm = pShare + cShare + fShare;
    p = Math.max(p, (calMid * (pShare / norm)) / 4);
    c = Math.max(c, (calMid * (cShare / norm)) / 4);
    f = Math.max(f, (calMid * (fShare / norm)) / 9);
    const fibLevel = (input.fiber ?? "medium").toLowerCase();
    fib = Math.max(fib, fibLevel === "high" ? 9 : fibLevel === "low" ? 2 : 5);
  }

  // Scale so macro calories roughly match calorie midpoint (but don't over-shrink fibre-only bumps).
  const macroCals = p * 4 + c * 4 + f * 9;
  if (macroCals > 0) {
    const scale = calMid / macroCals;
    // Clamp scale to avoid absurd numbers when ingredient list is very sparse.
    const s = Math.max(0.6, Math.min(1.6, scale));
    p *= s; c *= s; f *= s; fib *= s;
  }

  const fatQuality = fatQDen > 0 ? fatQNum / fatQDen : 0.5;
  const carbQuality = carbQDen > 0 ? carbQNum / carbQDen : 0.55;

  return {
    calories: calMid,
    proteinG: Math.round(p * 10) / 10,
    carbsG: Math.round(c * 10) / 10,
    fatG: Math.round(f * 10) / 10,
    fiberG: Math.round(fib * 10) / 10,
    fatQuality,
    carbQuality,
  };
}

function clamp(n: number, min = 0, max = 10) { return Math.max(min, Math.min(max, n)); }
function round1(n: number) { return Math.round(n * 10) / 10; }

/** Protein: purely gram-based per spec. */
function scoreProtein(grams: number): { score: number; label: string } {
  let score: number;
  if (grams <= 5) score = 1 + grams * 0.2;               // 0-5 → 1..2
  else if (grams <= 10) score = 2 + (grams - 5) * 0.4;   // 5-10 → 2..4
  else if (grams <= 20) score = 4 + (grams - 10) * 0.2;  // 10-20 → 4..6
  else if (grams <= 30) score = 6 + (grams - 20) * 0.2;  // 20-30 → 6..8
  else score = 8 + Math.min(2, (grams - 30) * 0.06);     // 30+ → 8..10
  score = clamp(score);
  const label = grams >= 31 ? "Excellent" : grams >= 21 ? "High" : grams >= 11 ? "Moderate" : "Low";
  return { score: round1(score), label };
}

/** Carbs: quality-adjusted around a healthy energy density. */
function scoreCarbs(grams: number, quality: number, calories: number): { score: number; label: string } {
  // Target carb grams ~ 45-55% of calories from carbs → grams = cal * 0.5 / 4.
  const target = Math.max(30, (calories * 0.5) / 4);
  const ratio = grams / target; // 1 == right on target
  // Base peaks near ratio 1, drops off either side.
  const proximity = 1 - Math.min(1, Math.abs(ratio - 1));
  // Score = quality (0..1) weighted heavily + proximity contribution.
  const raw = 3 + quality * 5 + proximity * 2; // 3..10
  const score = clamp(raw);
  let label: string;
  if (quality >= 0.75 && ratio >= 0.7 && ratio <= 1.3) label = "Balanced";
  else if (score >= 8) label = "High";
  else if (score >= 6.5) label = "Balanced";
  else if (score >= 4) label = "Moderate";
  else label = "Low";
  return { score: round1(score), label };
}

/** Fat: quality drives the score more than quantity. */
function scoreFat(grams: number, quality: number, calories: number): { score: number; label: string } {
  const target = Math.max(15, (calories * 0.3) / 9);
  const ratio = grams / target;
  // Penalise very low fat and very high fat.
  const quantityScore = ratio < 0.4 ? 3 : ratio < 0.7 ? 5.5 : ratio <= 1.3 ? 8 : ratio <= 1.7 ? 6 : 4;
  const raw = quantityScore * 0.4 + quality * 10 * 0.6;
  const score = clamp(raw);
  let label: string;
  if (quality >= 0.8 && score >= 7) label = "Healthy";
  else if (score >= 8) label = "High";
  else if (score >= 6) label = "Moderate";
  else if (grams < 8) label = "Low";
  else label = "Moderate";
  return { score: round1(score), label };
}

/** Fibre: gram-based per spec. */
function scoreFiber(grams: number): { score: number; label: string } {
  let score: number;
  if (grams <= 2) score = 1 + grams * 0.75;               // 0-2 → 1..2.5
  else if (grams <= 5) score = 2.5 + (grams - 2) * 0.8;   // 2-5 → 2.5..5
  else if (grams <= 8) score = 5 + (grams - 5) * 0.8;     // 5-8 → 5..7.4
  else score = 7.4 + Math.min(2.6, (grams - 8) * 0.35);   // 9+ → 7.75..10
  score = clamp(score);
  const label = grams >= 9 ? "Excellent" : grams >= 6 ? "Good" : grams >= 3 ? "Moderate" : "Low";
  return { score: round1(score), label };
}

export function computeNutrition(input: Parameters<typeof estimateMacros>[0]): {
  macros: MacroEstimate;
  nutrients: Record<NutrientKey, NutrientInfo>;
} {
  const macros = estimateMacros(input);
  const p = scoreProtein(macros.proteinG);
  const c = scoreCarbs(macros.carbsG, macros.carbQuality, macros.calories);
  const f = scoreFat(macros.fatG, macros.fatQuality, macros.calories);
  const fib = scoreFiber(macros.fiberG);
  return {
    macros,
    nutrients: {
      protein: { key: "protein", emoji: EMOJI.protein, name: NAME.protein, grams: macros.proteinG, score: p.score, label: p.label },
      carbs: { key: "carbs", emoji: EMOJI.carbs, name: NAME.carbs, grams: macros.carbsG, score: c.score, label: c.label },
      fat: { key: "fat", emoji: EMOJI.fat, name: NAME.fat, grams: macros.fatG, score: f.score, label: f.label },
      fiber: { key: "fiber", emoji: EMOJI.fiber, name: NAME.fiber, grams: macros.fiberG, score: fib.score, label: fib.label },
    },
  };
}

/** Personalised, nutrition-driven "why this was recommended" line — Nigerian-friendly wording. */
export function nutritionReason(
  mealName: string,
  n: Record<NutrientKey, NutrientInfo>,
  macros: MacroEstimate,
  ctx?: { costText?: string; goal?: string | null; considerMinutes?: number | null },
): string {
  // Build friendly, everyday strengths — the kind of thing a Nigerian friend would tell you.
  const strengths: string[] = [];
  if (n.protein.score >= 7) strengths.push(`packed with protein (${Math.round(n.protein.grams)}g) — good for muscle and staying full`);
  if (n.fiber.score >= 7) strengths.push(`high in fibre (${Math.round(n.fiber.grams)}g) to help digestion and keep belly settled`);
  if (n.fat.label === "Healthy") strengths.push("uses good fats (like fish, groundnut or avocado oil) — better for the heart");
  if (n.carbs.label === "Balanced") strengths.push("gives steady energy without the heavy sleepy feeling after eating");
  if (strengths.length === 0) {
    if (n.protein.score >= 5) strengths.push(`a fair protein serving (~${Math.round(n.protein.grams)}g)`);
    if (n.carbs.score >= 5) strengths.push(`enough carbs (~${Math.round(n.carbs.grams)}g) to carry you through work or school`);
    if (strengths.length === 0) strengths.push(`about ${macros.calories} kcal — a normal Nigerian plate size`);
  }

  const parts: string[] = [];
  parts.push(`${mealName} is ${strengths.slice(0, 2).join(", and ")}`);

  const goal = (ctx?.goal ?? "").toLowerCase();
  if (goal.includes("protein") && n.protein.score >= 7) parts.push("which matches your goal to add more protein");
  else if ((goal.includes("weight loss") || goal.includes("lose")) && macros.calories <= 500) parts.push("and it keeps calories light for your weight-loss plan");
  else if (goal.includes("gain") && macros.calories >= 700) parts.push("and the calories are enough to help you gain healthily");
  else if (goal.includes("energy") && n.carbs.score >= 6) parts.push("and it gives long-lasting energy from its carb base");
  else if (goal.includes("diabet") && n.carbs.label === "Balanced") parts.push("and the carbs are the slow-release type — friendlier for blood sugar");

  if (ctx?.costText) parts.push(`and it fits ${ctx.costText} — no need to break the bank`);

  let sentence = parts.join(", ") + ".";

  // Considerations — friendly heads-up written like a market advice.
  const cons: string[] = [];
  if (n.fat.label === "High" && n.fat.score < 6) cons.push(`oil is on the high side (~${Math.round(macros.fatG)}g) — try to reduce palm oil or fried plantain`);
  if (n.fiber.score < 4) cons.push("fibre is low — add vegetables like ugu, ewedu, or a small salad on the side");
  if (n.protein.score < 4) cons.push("protein is small — add boiled egg, fish, or beans to balance it");
  if (macros.calories >= 900) cons.push("it's a heavy plate — share, or take a smaller portion if you're watching weight");
  if (ctx?.considerMinutes && ctx.considerMinutes >= 60) cons.push(`cooking takes about ${ctx.considerMinutes} minutes, so plan ahead`);
  else if (ctx?.considerMinutes && ctx.considerMinutes <= 30) sentence += ` Bonus: ready in ~${ctx.considerMinutes} minutes, so it's great for busy days.`;

  if (cons.length) sentence += ` Heads up: ${cons.slice(0, 2).join("; ")}.`;
  return sentence;
}
