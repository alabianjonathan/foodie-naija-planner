# MealBeta Admin Dashboard — Build Plan

A separate desktop-first web admin, mounted under `/admin/*`, completely visually distinct from the mobile customer app. Uses the same Lovable Cloud project but gated by a `user_roles` table so normal users can't access it.

## Scope for this build

Phase 1 (this plan): full UI + routing + role gate + sample data.
Phase 2 (later, on request): wire each section to real Cloud tables + CRUD mutations.

Sample data lets you click through every screen immediately; each page is structured so swapping to real queries is a localized change.

## Architecture

- **Route group**: `src/routes/admin/*` — separate from the mobile shell. No `PhoneShell`, no `BottomNav`.
- **Layout**: `src/routes/admin/route.tsx` — sidebar + top bar + `<Outlet />`. Dark sidebar, white content, MealBeta green/orange accents.
- **Auth gate**: checks Supabase session + `has_role(uid, 'admin' | 'super_admin' | 'restaurant')` via a server function. Non-admins → redirect to `/`. Unauthenticated → `/admin/login`.
- **Login**: `src/routes/admin/login.tsx` — email/password only (no Google), forgot-password link reuses existing `/forgot-password`.
- **Design tokens**: extend `src/styles.css` with `--admin-sidebar`, `--admin-sidebar-fg`, `--admin-accent` so the admin theme is scoped and doesn't touch the mobile app.

## Database (one migration)

Enum + roles table + helper function (standard secure pattern):

- `app_role` enum: `super_admin | admin | restaurant | user`
- `public.user_roles (user_id, role)` with RLS + `has_role(uid, role)` SECURITY DEFINER
- Grants: `authenticated` select, `service_role` all
- Seed: no auto-seed — you promote your own account to `super_admin` after the migration runs (I'll give you the one-line SQL)

No other tables in phase 1; management pages use in-memory sample data so you can approve incrementally.

## Sidebar sections (all built with sample data)

1. Dashboard — 10 summary cards + "recent restaurants" + "popular meals" lists
2. Users — searchable table, role change, ban/unban/delete (super_admin only for delete), detail drawer
3. Restaurants — table + add/edit form with all fields you listed, approve/reject/verify/suspend
4. Meals — table + add/edit form, tags multi-select, image upload placeholder
5. Categories — simple CRUD list
6. Ingredients — table with city-scoped prices
7. Nutrition — per-meal nutrition editor (linked from Meals detail)
8. Cities & Areas — State → City → Area nested management, activate/deactivate
9. Meal Plans — read-only table of generated plans + delete
10. Leads — table with status pipeline (pending/contacted/completed/cancelled) + CSV export button
11. Settings — placeholder for platform settings (super_admin only)

Every table shares one reusable `<DataTable>` with search, filter, pagination, and row actions.

## Role behavior in UI

- `super_admin`: sees all sections including Settings + destructive actions
- `admin`: all sections except Settings; no permanent delete
- `restaurant`: only sees "My Restaurant" + "My Meals" + "My Leads" (scoped views of Restaurants/Meals/Leads)
- `user`: bounced from `/admin` entirely

## Files to create

```
src/routes/admin/
  route.tsx                 # layout + auth gate
  login.tsx
  index.tsx                 # dashboard
  users.tsx
  restaurants.tsx
  restaurants.$id.tsx       # add/edit
  meals.tsx
  meals.$id.tsx
  categories.tsx
  ingredients.tsx
  nutrition.tsx
  cities.tsx
  meal-plans.tsx
  leads.tsx
  settings.tsx
src/components/admin/
  AdminSidebar.tsx
  AdminTopbar.tsx
  DataTable.tsx
  StatCard.tsx
  RoleGate.tsx
src/data/admin-sample.ts    # sample users, restaurants, meals, leads, etc.
src/lib/admin-auth.functions.ts   # requireAdmin server fn
```

Plus: one migration for `app_role` + `user_roles` + `has_role`, and a small `styles.css` addition for admin theme tokens.

## What I won't do in phase 1 (confirm if you want any of these included)

- Real CRUD wired to Supabase tables for restaurants/meals/cities/ingredients/nutrition/leads (big surface — better as phase 2, one section at a time)
- Image uploads to Storage (UI placeholder only)
- CSV export actually generating a file (button present, wired later)
- Email notifications to restaurants on lead assignment

## After you approve

1. I run the `user_roles` migration
2. I give you the SQL to promote yourself to `super_admin`
3. I build all the routes + components + sample data in one pass
4. You click through `/admin/login` → dashboard and tell me which section to wire to real data first
