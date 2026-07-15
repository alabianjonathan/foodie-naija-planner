# Upgrade "What Should I Eat Today?" (`/today`)

Scope: rebuild only `src/routes/today.tsx` and its supporting server function `src/lib/recommendations.functions.ts`. No changes to other routes, nav, or unrelated features. Keep MealBeta's current mobile-first look (PhoneShell, existing tokens, chips, card-soft).

## User experience

Single mobile screen with:

1. **Header** — "What Should I Eat Today?" + subtitle: *"Tell us what you feel like eating, your budget, or what ingredients you already have, and MealBeta will suggest the best options for you."*
2. **Conversational input** — textarea + Send. Placeholder rotates through example prompts (e.g. "I have ₦3,000 and want something filling").
3. **Quick filters** (chips, collapsible "More options" for advanced) —
   - Meal Time, Goal, Food Preference, Budget, Time Available, Spice Level
   - Advanced (expand): Allergies (text), Foods to avoid (text), Ingredients at home (text), People (number), City/Area (prefilled from profile)
4. **Results** — four labeled cards: **Best Match**, **Healthier Option**, **Budget Option**, **Quick Option**. Each card shows meal image/emoji, name, short description, "Why this matches" reason, price/kcal/protein/carbs/fat/fibre estimates, prep time, main ingredients, portion, meal-time suitability, considerations.
   - Actions: Order This Meal, Find a Chef, Cook This Meal, View Recipe (→ `/meal/$id`), Save, Share, Show Another
   - Feedback row: I like this / Not for me / Too expensive / Too heavy / Too spicy / Ate recently / Healthier / Cheaper
5. **Ingredients mode** — when user provides ingredients, split into *You Already Have* / *You Still Need* with substitutions & estimated extra cost.
6. **Why this was recommended** — plain-language paragraph per card.
7. **Disclaimer** at the bottom (nutrition estimates + medical note).

Order/Chef actions open a Dialog listing matched restaurants/chefs from DB, filtered by user's city/area, rating, verified status, and (for chefs) matching service type / speciality.

## Backend / logic

Extend `src/lib/recommendations.functions.ts`:

- New `recommendMeals` server fn (auth required):
  - Input: `{ query?: string; filters?: {...}; feedback?: {...}; avoidIds?: string[] }`
  - Loads: profile (goal, budget, city, restriction, people, cook_order), all active meals, user's saved meals (to boost/avoid duplicates), recent recommendations stored in `profiles.recent_recommendations` (add col if missing — otherwise pass avoidIds from client localStorage).
  - Calls Lovable AI Gateway (`google/gemini-2.5-flash`) using AI SDK `Output.object` with a small schema:
    ```
    { summary, picks: [{ label: "Best Match"|"Healthier Option"|"Budget Option"|"Quick Option", mealId, reason, priceEstimate, prepMinutes, considerations, mealTime }] }
    ```
  - Prompt encodes user profile, budget, allergies, dislikes, ingredients at home, time constraint, spice, cuisine, goal, people count, and instructs the model to pick 4 different meal IDs from the catalog with rationale. Rules: never include allergens, respect dislikes, weight-loss → moderate cal + protein + fibre, budget → cheapest matching, quick → lowest cookingTimeMin, healthier → highest healthScore. Fall back to filtered heuristic sort if the AI call fails (use `NoObjectGeneratedError.text` guard per gateway rules).
  - Returns `{ summary, picks }`.
- Keep the existing `generateDailyRecommendation` untouched (used elsewhere? — check; only `today.tsx` uses it, so replace usage there).

- Add `findRestaurantsForMeal({ mealId, city, area })` server fn — queries `restaurants` where `status = 'active'`, address present, city matches, ordered by rating desc, limit 6. Returns name, address, phone, rating, verified.
- Add `findChefsForMeal({ mealId, serviceType, city, area })` server fn — queries `chefs` joined with `chef_listings` (speciality match by meal name/category), filter `verified` desc, active plan, rating desc, city match, limit 6.

All three server fns use `requireSupabaseAuth` for authed reads and RLS-respecting client (`context.supabase`).

## Frontend components (in `today.tsx` only)

- Local `QuickFilters` component (chips groups).
- `MealResultCard` with all fields, feedback row, action buttons.
- `RestaurantDialog` and `ChefDialog` — reuse shadcn Dialog + fetch via `useQuery`.
- Ingredients breakdown block appears only when ingredients present.
- Persist feedback + last picks in `localStorage` (`avoidIds` sent on next call, feedback influences next prompt).

## Data assumptions & guardrails

- Use existing tables only (`meals`, `restaurants`, `chefs`, `chef_listings`, `chef_reviews`, `saved_meals`, `profiles`). No schema migrations.
- Nutrition/price shown as estimates (label "est.").
- Empty/loading/error states styled with existing tokens.
- Do not fabricate restaurants/chefs — if query returns none, show empty state ("No matching restaurants in your area yet — try broadening the city.").
- Keep responses under limits by not enum-constraining schema (label is a plain string, validated client-side).

## Out of scope

- No changes to nav, other routes, homepage, admin, or DB schema.
- No new legal pages / SEO changes.
- No new tables — reuse existing.

## Files touched

- `src/routes/today.tsx` (rewrite in place)
- `src/lib/recommendations.functions.ts` (add new fns, keep existing exports)
- Possibly `src/lib/chefs.functions.ts` / new `src/lib/restaurants.functions.ts` for the two lookup fns (or add to recommendations file — will add a small `src/lib/eat-today.functions.ts` to keep concerns separate).
