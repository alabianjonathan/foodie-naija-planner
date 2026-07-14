
# MealBeta Chefs — Plan

A new pillar of MealBeta so users don't only see restaurants. After planning a meal, users choose: **Cook Myself · Order from Restaurant · Contact a Chef**. Restaurants and meal planner stay untouched.

Payments: **Paystack subscriptions** (chefs only — no per-booking commission).

## 1. Database (Lovable Cloud)

New tables (all with RLS + GRANTs):

- `chefs` — profile: user_id, full_name, business_name, slug, bio, phone, whatsapp, email, city, area, areas_covered[], categories[] (from the 10 chef categories), years_experience, photo_url, id_document_url, price_min, price_max, availability, rating, verified, featured, status (pending/active/suspended), plan (basic/featured/premium), plan_expires_at.
- `chef_listings` — chef_id, name, type (food|service), description, price_min, price_max, photos[], available_days[], service_area, status.
- `chef_leads` — chef_id, user_id (nullable), name, phone, whatsapp, message, requested_date, status (new/contacted/closed).
- `chef_reviews` — chef_id, user_id, rating, comment.
- `chef_profile_views` — chef_id, viewer_id (nullable), viewed_at (for analytics counts).
- `chef_subscriptions` — chef_id, plan, status (active/expired/canceled), paystack_customer_code, paystack_subscription_code, current_period_end.
- Extend `user_roles` app_role enum with `chef`.

RLS highlights:
- Anyone (anon+auth): SELECT active chefs & their active listings & aggregated reviews.
- Chef: manage own row, own listings, view own leads / views.
- Authenticated users: INSERT leads, reviews for a chef.
- Admin (`has_role admin/super_admin`): full manage.

Listing-limit enforcement via a `BEFORE INSERT` trigger on `chef_listings`: basic=1, featured=10, premium=unlimited.

Storage bucket `chef-uploads` (private) for photos & ID docs; signed URLs served to public where needed (photos are public via a policy on a `chef-photos` public bucket; IDs stay private).

## 2. Customer-facing routes

- `/chefs` — MealBeta Chefs discovery. Filters: city, area, category, plan, verified. Chef cards (name, business, location, areas, specialty, starting price, plan badge, rating, verified, WhatsApp, Request booking).
- `/chefs/$slug` — Chef details: photo, bio, areas covered, listings grid, price range, availability, reviews, verification badge, WhatsApp & Request booking buttons (booking = modal → inserts `chef_leads`).
- `/chef-plans` — pricing table (Basic Free / Featured ₦15k / Premium ₦30k) with the exact rows listed in the brief.
- `/become-a-chef` — public chef registration form (creates auth account if needed, inserts `chefs` with status=pending, grants `chef` role on approval).

Wire into existing flow:
- On `/dashboard` and after `/planner` cost/calorie result → add a **"Contact a Chef"** card next to Cook Myself / Order from Restaurant.
- Add "MealBeta Chefs" entry in `BottomNav`.

## 3. Chef dashboard (`/chef/*`, gated by `chef` role)

- `/chef` — overview: current plan, listing usage (used/limit), profile views (last 30d), leads count, upgrade CTA.
- `/chef/listings` — CRUD for listings; blocks add when limit hit with the exact upgrade prompt text.
- `/chef/leads` — inbox of `chef_leads`, mark contacted/closed, WhatsApp deep-link.
- `/chef/profile` — edit profile, photos, areas covered.
- `/chef/billing` — plan status, upgrade/downgrade → Paystack.

## 4. Payments (Paystack subscriptions)

- Secret `PAYSTACK_SECRET_KEY` (add_secret).
- Create Paystack Plans (Featured ₦15,000/mo, Premium ₦30,000/mo) — one-time script/migration.
- Server fn `initializeChefSubscription({ plan })` → returns Paystack authorization URL.
- Public server route `/api/public/webhooks/paystack` verifying `x-paystack-signature` (HMAC-SHA512 with secret) → updates `chef_subscriptions` and `chefs.plan` / `plan_expires_at` on `subscription.create`, `charge.success`, `subscription.disable`, `invoice.payment_failed`.
- Downgrade to Basic automatically when subscription expires.

## 5. Admin (`/jb12bz/chefs`)

Table with actions: approve, reject, verify toggle, suspend, feature toggle, assign/upgrade/downgrade plan manually, view active/expired subscriptions, listing count per chef, view chef leads, edit profile.

Add sidebar item "Chefs" in `AdminSidebar`.

## 6. Technical notes

- Server fns in `src/lib/chefs.functions.ts` (public listing) and `src/lib/chef-owner.functions.ts` (chef-auth) and `src/lib/admin-chefs.functions.ts` (admin).
- Paystack webhook in `src/routes/api/public/webhooks/paystack.ts`.
- Reuse existing `PhoneShell`, `TopBar`, `card-soft`, `chip`, brand tokens — no new design language.
- Landing page (`/`) gets one extra section "Meet MealBeta Chefs" linking to `/chefs` and `/become-a-chef`.

## 7. Rollout order

1. Migration (tables, enum, RLS, GRANTs, trigger, buckets).
2. Server fns + Paystack secret + webhook route.
3. Customer routes (`/chefs`, `/chefs/$slug`, `/chef-plans`, `/become-a-chef`).
4. Chef dashboard.
5. Admin chef management.
6. Wire into `/dashboard` and `/planner` result screens + BottomNav + landing section.

## Out of scope (explicit)

- No changes to restaurants, meal planner logic, or existing meal recommendations.
- No per-booking commission or in-app checkout for chef bookings — leads go via WhatsApp/booking request only.
