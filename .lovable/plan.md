## 1. Restaurant address update (no new code)

Your admin importer at `/jb12bz/import-restaurants` already accepts this exact Excel format and calls `importRestaurantsFromRows`, which matches on slug/chain+branch and updates address, phone, coordinates, and food categories in place (no duplicates, no blank overwrites).

**Action for you:** open `/jb12bz/import-restaurants`, upload `mealbeta_restaurant_chains_complete_update_v2-2.xlsx`, and run it. Dry-run first if you want a preview.

I confirmed the 94 branches parse cleanly and Ikeja/Gbagada/Ikoyi/etc. all resolve to correct addresses.

## 2. Nutrition Tracker & Progress (new feature)

### New tables (migration)
- `nutrition_logs` — one row per food/water/weight/activity entry
  - `user_id, logged_at (date), meal_slot (breakfast|lunch|dinner|snack|water|weight|activity), meal_id (nullable fk), food_name, servings, calories, protein_g, carbs_g, fat_g, fiber_g, water_ml, weight_kg, activity_type, activity_minutes, notes`
- `nutrition_goals` — one active row per user
  - `user_id, daily_calories, protein_g, carbs_g, fat_g, fiber_g, water_ml, weight_target_kg, goal_type (lose|maintain|gain), activity_target_min`
- `nutrition_streaks` — derived counters
  - `user_id, current_streak, longest_streak, last_logged_on, achievements jsonb`

All three: RLS `auth.uid() = user_id`, GRANT to `authenticated` + `service_role`, updated_at trigger.

### Server functions (`src/lib/nutrition-tracker.functions.ts`)
- `logEntry` — insert/update a log row; auto-fills macros from meal or ingredient DB (reuses `computeNutrition` in `src/lib/nutrition.ts`)
- `logWater(ml)`, `logWeight(kg)`, `logActivity(type, minutes)` — thin wrappers
- `getGoals` / `updateGoals` — with sensible defaults from profile (goal + weight)
- `getDaySummary(date)` — totals + % of goal per macro, water, activity
- `getRangeSummary(range: 'week'|'month')` — per-day series for charts
- `getStreakAndAchievements` — computes streak from log dates + rule-based achievements (7-day streak, hit protein 5×, water goal 3 days, first weight-in, etc.)
- `getAIInsights(range)` — Lovable AI Gateway call summarizing the last 7 days: what's working, one culturally-grounded Nigerian tip, one gentle nudge (no medical claims)

### New route `/tracker` (auth)
- Today card: calorie ring + macro bars, water glasses, activity minutes, current weight
- Quick-add row: **Log meal**, **Log water**, **Log weight**, **Log activity** (bottom sheets)
- "Log from today's plan" — pulls today's meal plan and one-taps a meal into the log
- Range toggle: Day / Week / Month with recharts area/bar charts
- Streak + achievements strip
- "Personalised AI insights" card (7-day summary, refresh button)
- Goals: edit sheet, pulled from `nutrition_goals`; defaults computed from onboarding data if empty

### Integration touch points (minimal)
- **Meal detail (`/meal/$id`)**: add a "Log this meal" button → calls `logEntry` with mealId + slot picker
- **Today (`/today`)**: each result card gets a small "Log after eating" action → same fn
- **Dashboard**: add a compact "Today's nutrition" card (calories + water ring) linking to `/tracker`
- **BottomNav**: add Tracker tab (swap with least-used current tab, or as 5th)

### Design
Reuse existing tokens/PhoneShell/card-soft. No new colors. Charts use `--brand` + `--warm` from styles.css. All copy in the same Nigerian-friendly voice as `nutrition.ts` (e.g., "You're doing well on protein today — jollof + fish is pulling its weight").

### Files touched
- 1 migration (3 tables + policies + grants + trigger)
- `src/lib/nutrition-tracker.functions.ts` (new)
- `src/routes/tracker.tsx` (new, under `_authenticated`)
- `src/components/BottomNav.tsx` (add tab)
- `src/routes/dashboard.tsx` (add small summary card)
- `src/routes/today.tsx` (add "Log after eating" on result card)
- `src/routes/meal.$id.tsx` (add "Log this meal" button)

### Out of scope
- No barcode scanning, no wearables sync, no photo food recognition — say the word if you want any of those later.
- No changes to auth, admin, or unrelated routes.