import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSavedMeals, listSavedMealIds, toggleSavedMeal } from "@/lib/user-data.functions";
import type { CatalogMeal } from "@/lib/catalog.functions";
import { useAuth } from "./useAuth";

export function useSavedMeals() {
  const { user } = useAuth();
  const list = useServerFn(listSavedMeals);
  return useQuery({
    queryKey: ["saved-meals", user?.id],
    enabled: !!user,
    queryFn: () => list() as unknown as Promise<CatalogMeal[]>,
  });
}

export function useSavedMealIds() {
  const { user } = useAuth();
  const list = useServerFn(listSavedMealIds);
  return useQuery({
    queryKey: ["saved-meal-ids", user?.id],
    enabled: !!user,
    queryFn: () => list() as unknown as Promise<string[]>,
  });
}

export function useToggleSavedMeal() {
  const qc = useQueryClient();
  const toggle = useServerFn(toggleSavedMeal);
  return useMutation({
    mutationFn: (v: { mealId: string; saved: boolean }) => toggle({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-meals"] });
      qc.invalidateQueries({ queryKey: ["saved-meal-ids"] });
    },
  });
}
