CREATE OR REPLACE FUNCTION public.admin_seed_restaurants(rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  INSERT INTO restaurants (slug, name, city, area, address, tags)
  SELECT
    r->>'slug',
    r->>'name',
    r->>'city',
    r->>'area',
    r->>'address',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(r->'tags','[]'::jsonb)))
  FROM jsonb_array_elements(rows) r;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_seed_restaurants(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_seed_restaurants(jsonb) TO postgres;