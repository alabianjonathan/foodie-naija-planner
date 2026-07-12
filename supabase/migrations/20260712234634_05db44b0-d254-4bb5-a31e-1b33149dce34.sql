
DROP POLICY IF EXISTS "restaurants authenticated read" ON public.restaurants;

CREATE POLICY "restaurants owner read"
ON public.restaurants FOR SELECT TO authenticated
USING (
  auth.uid() = owner_id
  OR private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = off) AS
SELECT
  id, slug, name, city, area, address, rating, distance_km,
  delivery, phone, whatsapp, opening, tags, meal_slugs, verified,
  status, created_at, updated_at
FROM public.restaurants
WHERE status = 'active';

GRANT SELECT ON public.restaurants_public TO authenticated, anon;
