
DROP POLICY IF EXISTS "Anyone submit lead" ON public.chef_leads;
CREATE POLICY "Anyone submit lead" ON public.chef_leads FOR INSERT
  WITH CHECK (
    status = 'new' AND
    EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.status = 'active')
  );

DROP POLICY IF EXISTS "Anyone log view" ON public.chef_profile_views;
CREATE POLICY "Anyone log view" ON public.chef_profile_views FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.chefs c WHERE c.id = chef_id AND c.status = 'active')
  );
