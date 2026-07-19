
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS place_id text,
  ADD COLUMN IF NOT EXISTS reviews_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mealbeta_score numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cuisines text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS opening_hours jsonb,
  ADD COLUMN IF NOT EXISTS price_range text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS completeness_score smallint NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS restaurants_place_id_key ON public.restaurants (place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS restaurants_mealbeta_score_idx ON public.restaurants (mealbeta_score DESC);
CREATE INDEX IF NOT EXISTS restaurants_cuisines_idx ON public.restaurants USING GIN (cuisines);
CREATE INDEX IF NOT EXISTS restaurants_neighborhood_idx ON public.restaurants (neighborhood);
