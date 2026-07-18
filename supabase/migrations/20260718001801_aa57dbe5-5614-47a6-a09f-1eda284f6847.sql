
-- 1. Extend restaurants
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS google_maps_url text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS verification_status text,
  ADD COLUMN IF NOT EXISTS has_verified_food_data boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS restaurant_data_source text,
  ADD COLUMN IF NOT EXISTS food_data_priority smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS chain text,
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS cover_url text;

CREATE INDEX IF NOT EXISTS restaurants_state_idx ON public.restaurants (state);
CREATE INDEX IF NOT EXISTS restaurants_chain_idx ON public.restaurants (chain);
CREATE INDEX IF NOT EXISTS restaurants_needs_review_idx ON public.restaurants (needs_review) WHERE needs_review = true;

-- 2. food_categories
CREATE TABLE IF NOT EXISTS public.food_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.food_categories TO anon, authenticated;
GRANT ALL ON public.food_categories TO service_role;
ALTER TABLE public.food_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_categories readable by all" ON public.food_categories FOR SELECT USING (true);
CREATE POLICY "food_categories admin write" ON public.food_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. foods
CREATE TABLE IF NOT EXISTS public.foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.food_categories(id) ON DELETE SET NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS foods_category_idx ON public.foods (category_id);
CREATE INDEX IF NOT EXISTS foods_aliases_gin ON public.foods USING gin (aliases);
GRANT SELECT ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foods readable by all" ON public.foods FOR SELECT USING (true);
CREATE POLICY "foods admin write" ON public.foods FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. restaurant_foods
CREATE TABLE IF NOT EXISTS public.restaurant_foods (
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  food_id uuid NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (restaurant_id, food_id)
);
CREATE INDEX IF NOT EXISTS restaurant_foods_food_idx ON public.restaurant_foods (food_id);
GRANT SELECT ON public.restaurant_foods TO anon, authenticated;
GRANT ALL ON public.restaurant_foods TO service_role;
ALTER TABLE public.restaurant_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_foods readable by all" ON public.restaurant_foods FOR SELECT USING (true);
CREATE POLICY "restaurant_foods admin write" ON public.restaurant_foods FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. import_logs
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  ran_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_logs admin read" ON public.import_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "import_logs admin insert" ON public.import_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. updated_at triggers
DROP TRIGGER IF EXISTS trg_food_categories_updated_at ON public.food_categories;
CREATE TRIGGER trg_food_categories_updated_at BEFORE UPDATE ON public.food_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_foods_updated_at ON public.foods;
CREATE TRIGGER trg_foods_updated_at BEFORE UPDATE ON public.foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Seed categories
INSERT INTO public.food_categories (slug, name, sort_order) VALUES
  ('rice', 'Rice', 10),
  ('swallow', 'Swallow', 20),
  ('soup', 'Soup', 30),
  ('beans', 'Beans', 40),
  ('yam', 'Yam', 50),
  ('plantain', 'Plantain', 60),
  ('protein', 'Protein', 70),
  ('other', 'Other', 99)
ON CONFLICT (slug) DO NOTHING;
