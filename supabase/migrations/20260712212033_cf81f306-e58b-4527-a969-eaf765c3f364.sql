
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read platform settings"
  ON public.platform_settings FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'super_admin'::app_role)));

CREATE POLICY "Super admins can insert platform settings"
  ON public.platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role));

CREATE POLICY "Super admins can update platform settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role));

CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.platform_settings (key, value) VALUES
  ('branding', '{"appName":"MealBeta","primaryColor":"#16a34a","logoUrl":""}'::jsonb),
  ('feature_flags', '{"planner":true,"restaurants":true,"leads":true}'::jsonb),
  ('support', '{"email":"support@mealbeta.app","whatsapp":""}'::jsonb),
  ('data_retention', '{"mealPlansDays":365,"leadsDays":180}'::jsonb)
ON CONFLICT (key) DO NOTHING;
