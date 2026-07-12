import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type Ing = { name: string; qty: string; price: number };

export type CatalogCity = {
  id: string;
  name: string;
  state: string | null;
  active: boolean;
  areas: { id: string; name: string; active: boolean }[];
};

export type CatalogMeal = {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  gradient: string | null;
  category: string;
  bestTime: string[];
  cookMin: number;
  cookMax: number;
  orderMin: number;
  orderMax: number;
  cookingTimeMin: number;
  caloriesMin: number;
  caloriesMax: number;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  fiber: string | null;
  portion: string | null;
  healthScore: number | null;
  healthNote: string | null;
  goals: string[];
  ingredients: Ing[];
  description: string | null;
  popular: boolean;
  status: string;
};

export type CatalogRestaurant = {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string | null;
  rating: number;
  distanceKm: number;
  delivery: boolean;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening: string | null;
  tags: string[];
  mealSlugs: string[];
  verified: boolean;
  status: string;
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listCitiesWithAreas = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogCity[]> => {
  const sb = publicClient();
  const [{ data: cities }, { data: areas }] = await Promise.all([
    sb.from("cities").select("id,name,state,active").order("name"),
    sb.from("areas").select("id,city_id,name,active").order("name"),
  ]);
  return (cities ?? []).map((c) => ({
    id: c.id, name: c.name, state: c.state, active: c.active,
    areas: (areas ?? []).filter((a) => a.city_id === c.id).map((a) => ({ id: a.id, name: a.name, active: a.active })),
  }));
});

export const listMeals = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogMeal[]> => {
  const sb = publicClient();
  const { data } = await sb.from("meals").select("*").eq("status", "active").order("name");
  return (data ?? []).map((m) => ({
    id: m.id, slug: m.slug, name: m.name, emoji: m.emoji, gradient: m.gradient, category: m.category,
    bestTime: m.best_time ?? [], cookMin: m.cook_min, cookMax: m.cook_max, orderMin: m.order_min, orderMax: m.order_max,
    cookingTimeMin: m.cooking_time_min, caloriesMin: m.calories_min, caloriesMax: m.calories_max,
    protein: m.protein, carbs: m.carbs, fat: m.fat, fiber: m.fiber, portion: m.portion,
    healthScore: m.health_score, healthNote: m.health_note, goals: m.goals ?? [],
    ingredients: (m.ingredients as Ing[]) ?? [], description: m.description, popular: m.popular, status: m.status,
  }));
});

export const listRestaurants = createServerFn({ method: "GET" }).handler(async (): Promise<CatalogRestaurant[]> => {
  const sb = publicClient();
  const { data } = await sb.from("restaurants").select("*").eq("status", "active").order("rating", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id, slug: r.slug, name: r.name, city: r.city, area: r.area,
    rating: Number(r.rating), distanceKm: Number(r.distance_km), delivery: r.delivery,
    phone: r.phone, whatsapp: r.whatsapp, email: r.email, opening: r.opening,
    tags: r.tags ?? [], mealSlugs: r.meal_slugs ?? [], verified: r.verified, status: r.status,
  }));
});
