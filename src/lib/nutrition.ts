export type NutrientKey = "protein" | "carbs" | "fat" | "fiber";

export type NutrientInfo = {
  key: NutrientKey;
  emoji: string;
  name: string;
  raw: string | null;
  score: number;
  label: string;
};

const EMOJI: Record<NutrientKey, string> = {
  protein: "🥩",
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

const BASE_SCORE: Record<string, number> = {
  high: 8.5,
  medium: 6.5,
  low: 3.5,
};

function hashNumber(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num));
}

function round1(num: number) {
  return Math.round(num * 10) / 10;
}

function labelForScore(score: number, key: NutrientKey): string {
  if (score >= 8) return "High";
  if (score >= 6.5) return key === "carbs" ? "Balanced" : "Good";
  if (score >= 4) return "Moderate";
  return "Low";
}

export function nutrientInfo(key: NutrientKey, raw: string | null | undefined, slug: string): NutrientInfo {
  const normalized = (raw ?? "").trim().toLowerCase();
  const base = BASE_SCORE[normalized] ?? 5.0;
  // Add a small deterministic variance so two meals with the same level don't
  // show identical scores, while keeping the score stable across renders.
  const variance = (hashNumber(`${slug}:${key}`) - 0.5) * 0.8;
  const score = round1(clamp(base + variance, 0, 10));
  return {
    key,
    emoji: EMOJI[key],
    name: NAME[key],
    raw: raw ?? null,
    score,
    label: labelForScore(score, key),
  };
}

export function allNutrients(raw: {
  protein: string | null | undefined;
  carbs: string | null | undefined;
  fat: string | null | undefined;
  fiber: string | null | undefined;
}, slug: string): Record<NutrientKey, NutrientInfo> {
  return {
    protein: nutrientInfo("protein", raw.protein, slug),
    carbs: nutrientInfo("carbs", raw.carbs, slug),
    fat: nutrientInfo("fat", raw.fat, slug),
    fiber: nutrientInfo("fiber", raw.fiber, slug),
  };
}
