## Production readiness audit — MealBeta

Scope: replace remaining static/sample data with Supabase-backed reads/writes, harden admin RBAC, make every admin table full CRUD + search/filter, and verify the mobile user flow end-to-end.

### 1. Current state (from a quick pass)

**Mobile app still uses static data**
- `src/data/meals.ts` (757 lines) is imported by `home.tsx`, `today.tsx`, `popular.tsx`, `meal.$id.tsx`, `planner.tsx`, `shopping.tsx`, `saved.tsx`. The DB `meals` table exists and is seeded but the UI doesn't read it.
- `src/data/popularGroups.ts` used by `popular.tsx` — static.
- `src/data/admin-sample.ts` — leftover sample used by some admin pages.
- `saved.tsx` doesn't persist to DB.
- `planner.tsx` / `shopping.tsx` don't sync with `meal_plans` for the logged-in user.
- `restaurants.tsx` calls the server fn (good) but requires the fn is wired end-to-end.
- `profile.tsx` and `onboarding.tsx` — verify they write `profiles`.

**Admin panel gaps**
- `/jb12bz` route gate exists (super_admin / admin / restaurant) — OK.
- Pages like `categories.tsx`, `ingredients.tsx`, `nutrition.tsx`, `settings.tsx`, `users.tsx` are mostly stubs / read-only / sample-backed.
- `cities.tsx`, `restaurants.tsx`, `meals.tsx`, `leads.tsx`, `meal-plans.tsx` have partial CRUD — need consistent search + filter + edit dialogs.
- Meals admin: no create/edit form yet (only delete + status toggle).
- Restaurant admin: has upsert fn but need edit dialog.

### 2. Plan of work

**A. DB / server functions**
1. Add `saved_meals(user_id, meal_id)` table with RLS (own rows only) + GRANTs.
2. Ensure `meal_plans` schema supports per-day slots (already there — verify columns).
3. Add server fns:
   - `listMealsPublic` (already: `listMeals`) — add `getMealBySlug`.
   - `toggleSavedMeal`, `listSavedMeals`.
   - `upsertMealPlan`, `getCurrentMealPlan`.
   - `upsertProfile` for onboarding/profile.
   - Admin: `adminUpsertMeal` (currently missing), plus keep existing admin fns.

**B. Mobile app rewrite (data source swap)**
- Introduce `src/hooks/useMeals.ts` using TanStack Query + `listMeals` server fn.
- Refactor `home`, `today`, `popular`, `meal.$id`, `planner`, `shopping`, `saved` to consume DB meals.
- Keep `Meal` type but map from `CatalogMeal`.
- Persist `saved`, `planner` to DB.
- Verify onboarding writes to `profiles`.

**C. Admin CRUD polish**
- Meals: add create/edit dialog (name, slug, category, times, nutrition, ingredients JSON, status).
- Restaurants: add edit dialog (currently only add). Add search + city/status filter.
- Cities: search.
- Leads: status filter + search.
- Meal plans: view detail, delete.
- Users: promote/demote roles UI (uses existing admin-users fns).
- Categories/Ingredients/Nutrition/Settings: either wire to real config tables or clearly mark placeholder — recommend removing until scoped.

**D. Verification**
- Playwright: onboarding → home → today → meal detail → save → planner add → shopping list → restaurants → profile edit.
- Admin: login as super_admin, CRUD on each entity.

### 3. Scope check for this turn

This is 2–4 turns of work. I propose I execute in this order:

1. **Turn 1 (this):** Add `saved_meals` migration + new server fns (`getMealBySlug`, saved, meal-plan upsert, profile upsert, `adminUpsertMeal`). Wait for migration approval.
2. **Turn 2:** Swap mobile routes to DB-backed queries; wire saved + planner + shopping persistence.
3. **Turn 3:** Admin edit dialogs + search/filter across tables; role management UI.
4. **Turn 4:** Playwright verification and fixes.

### 4. Open decisions for you

- **Categories / Ingredients / Nutrition / Settings admin pages** — should I (a) build real tables + CRUD for these, or (b) remove them from the sidebar until scoped? They aren't in the "sync scope" you set earlier.
- **Saved meals** — do you want per-user favorites persisted server-side (recommended), or keep local-only?
- **Restaurant role** — should the `restaurant` role see a limited dashboard (their own venue only), or is this out of scope for now?

Reply with your picks and I'll start executing.