
-- 1) Allow owners to delete their own leads
CREATE POLICY "leads owner delete"
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) Public browse policy for active restaurants, with contact fields hidden via column privileges
CREATE POLICY "restaurants public read active"
  ON public.restaurants
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Remove blanket table SELECT and re-grant only non-contact columns to anon/authenticated.
-- service_role is unaffected, so admin server functions keep full column access.
REVOKE SELECT ON public.restaurants FROM anon;
REVOKE SELECT ON public.restaurants FROM authenticated;

GRANT SELECT (
  id, slug, name, city, area, address, rating, distance_km, delivery,
  opening, tags, meal_slugs, verified, status, owner_id, created_at, updated_at
) ON public.restaurants TO anon, authenticated;
