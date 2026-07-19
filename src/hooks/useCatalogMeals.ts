import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { listMeals, type CatalogMeal } from "@/lib/catalog.functions";
import { type NutrientInfo, type MacroEstimate, computeNutrition, nutritionReason } from "@/lib/nutrition";

/** DB meal adapted to the shape used across the mobile UI (previously src/data/meals.ts). */
export type UiMeal = {
  id: string; // slug (stable across UI)
  uuid: string;
  name: string;
  emoji: string;
  gradient: string;
  category: string;
  bestTime: string[];
  cookMin: number;
  cookMax: number;
  orderMin: number;
  orderMax: number;
  cookingTimeMin: number;
  caloriesMin: number;
  caloriesMax: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  nutrition: {
    protein: NutrientInfo;
    carbs: NutrientInfo;
    fat: NutrientInfo;
    fiber: NutrientInfo;
  };
  portion: string;
  healthScore: number;
  healthNote: string;
  goals: string[];
  ingredients: { name: string; qty: string; price: number }[];
  description: string;
  popular: boolean;
  slug: string;
};

export function toUiMeal(m: CatalogMeal): UiMeal {
  return {
    id: m.slug,
    slug: m.slug,
    uuid: m.id,
    name: m.name,
    emoji: m.emoji ?? "🍽️",
    gradient: m.gradient ?? "from-brand to-warm",
    category: m.category,
    bestTime: m.bestTime,
    cookMin: m.cookMin,
    cookMax: m.cookMax,
    orderMin: m.orderMin,
    orderMax: m.orderMax,
    cookingTimeMin: m.cookingTimeMin,
    caloriesMin: m.caloriesMin,
    caloriesMax: m.caloriesMax,
    protein: m.protein ?? "Medium",
    carbs: m.carbs ?? "Medium",
    fat: m.fat ?? "Medium",
    fiber: m.fiber ?? "Medium",
    nutrition: allNutrients(
      { protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber },
      m.slug
    ),
    portion: m.portion ?? "1 plate",
    healthScore: m.healthScore ?? 6,
    healthNote: m.healthNote ?? "",
    goals: m.goals,
    ingredients: m.ingredients,
    description: m.description ?? "",
    popular: m.popular,
  };
}

export function useCatalogMeals() {
  const fetchMeals = useServerFn(listMeals);
  const query = useQuery({
    queryKey: ["catalog", "meals"],
    queryFn: () => fetchMeals() as unknown as Promise<CatalogMeal[]>,
    staleTime: 5 * 60 * 1000,
  });
  const meals = useMemo(() => (query.data ?? []).map(toUiMeal), [query.data]);
  const bySlug = useMemo(() => new Map(meals.map((m) => [m.slug, m])), [meals]);
  const getMeal = (slug: string | undefined | null) => (slug ? bySlug.get(slug) : undefined);
  return { meals, getMeal, isLoading: query.isLoading, error: query.error };
}
