
-- Move has_role SECURITY DEFINER function out of the public/API schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Rewrite all policies that reference public.has_role to use private.has_role
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual LIKE '%has_role%' OR with_check LIKE '%has_role%')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Recreate policies (mirror of prior definitions, using private.has_role)
CREATE POLICY "cities admin write" ON public.cities
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "areas admin write" ON public.areas
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "restaurants admin write" ON public.restaurants
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "meals admin write" ON public.meals
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "leads select" ON public.leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "leads admin write" ON public.leads
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "leads insert own" ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "meal_plans select" ON public.meal_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "meal_plans write own" ON public.meal_plans
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'super_admin'));

-- Drop the public.has_role function now that policies use private.has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Restrict restaurant contact details (email/phone/whatsapp) to signed-in users
DROP POLICY IF EXISTS "restaurants public read" ON public.restaurants;
CREATE POLICY "restaurants authenticated read" ON public.restaurants
  FOR SELECT TO authenticated
  USING (true);

REVOKE SELECT ON public.restaurants FROM anon;
