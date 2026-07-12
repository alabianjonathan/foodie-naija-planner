
CREATE TABLE public.saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, meal_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_meals TO authenticated;
GRANT ALL ON public.saved_meals TO service_role;

ALTER TABLE public.saved_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own saved meals select" ON public.saved_meals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own saved meals insert" ON public.saved_meals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own saved meals delete" ON public.saved_meals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX saved_meals_user_idx ON public.saved_meals(user_id);
