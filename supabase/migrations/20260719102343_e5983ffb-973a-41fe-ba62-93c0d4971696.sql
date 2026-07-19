
-- 1. nutrition_logs
CREATE TABLE public.nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_on date NOT NULL DEFAULT CURRENT_DATE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  entry_type text NOT NULL CHECK (entry_type IN ('meal','water','weight','activity')),
  meal_slot text CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  meal_id uuid REFERENCES public.meals(id) ON DELETE SET NULL,
  food_name text,
  servings numeric,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  water_ml integer,
  weight_kg numeric,
  activity_type text,
  activity_minutes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_logs TO authenticated;
GRANT ALL ON public.nutrition_logs TO service_role;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own logs select" ON public.nutrition_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own logs insert" ON public.nutrition_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs update" ON public.nutrition_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs delete" ON public.nutrition_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX nutrition_logs_user_date_idx ON public.nutrition_logs (user_id, logged_on DESC);
CREATE TRIGGER trg_nutrition_logs_updated BEFORE UPDATE ON public.nutrition_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. nutrition_goals
CREATE TABLE public.nutrition_goals (
  user_id uuid PRIMARY KEY,
  daily_calories integer NOT NULL DEFAULT 2000,
  protein_g integer NOT NULL DEFAULT 90,
  carbs_g integer NOT NULL DEFAULT 250,
  fat_g integer NOT NULL DEFAULT 65,
  fiber_g integer NOT NULL DEFAULT 25,
  water_ml integer NOT NULL DEFAULT 2500,
  weight_target_kg numeric,
  goal_type text NOT NULL DEFAULT 'maintain' CHECK (goal_type IN ('lose','maintain','gain')),
  activity_target_min integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_goals TO authenticated;
GRANT ALL ON public.nutrition_goals TO service_role;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals all" ON public.nutrition_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_nutrition_goals_updated BEFORE UPDATE ON public.nutrition_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. nutrition_streaks
CREATE TABLE public.nutrition_streaks (
  user_id uuid PRIMARY KEY,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_logged_on date,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_streaks TO authenticated;
GRANT ALL ON public.nutrition_streaks TO service_role;
ALTER TABLE public.nutrition_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own streaks all" ON public.nutrition_streaks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_nutrition_streaks_updated BEFORE UPDATE ON public.nutrition_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
