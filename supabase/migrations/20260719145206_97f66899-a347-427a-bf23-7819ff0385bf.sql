BEGIN;

-- Remove duplicate workbook rows that represent the same branch/contact/address.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY
        lower(coalesce(chain, name)),
        lower(coalesce(branch_name, area, '')),
        lower(city),
        coalesce(nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), ''), lower(coalesce(address, '')))
      ORDER BY (latitude IS NOT NULL AND longitude IS NOT NULL) DESC, created_at ASC, id ASC
    ) AS rn
  FROM public.restaurants
)
DELETE FROM public.restaurants r
USING ranked x
WHERE r.id = x.id AND x.rn > 1;

-- Link restaurants to useful searchable food groups from their verified workbook tags.
WITH tag_links(tag, food_slug) AS (
  VALUES
    ('Rice', 'rice-rice'),
    ('Rice', 'rice-jollof-rice'),
    ('Rice', 'rice-fried-rice'),
    ('Rice', 'rice-white-rice'),
    ('Rice', 'rice-coconut-rice'),
    ('Chicken', 'protein-chicken'),
    ('Chicken', 'rice-jollof-rice'),
    ('Grills', 'protein-grills'),
    ('Grills', 'protein-chicken'),
    ('Soup', 'soup-soup'),
    ('Soup', 'soup-egusi-soup'),
    ('Soup', 'soup-efo-riro'),
    ('Swallow', 'swallow-swallow'),
    ('Swallow', 'swallow-amala'),
    ('Swallow', 'swallow-pounded-yam'),
    ('Beans', 'beans-plain-beans'),
    ('Beans', 'beans-moi-moi'),
    ('Yam', 'yam-yam'),
    ('Yam', 'yam-fried-yam'),
    ('Plantain', 'plantain-fried-plantain'),
    ('Pasta', 'other-pasta'),
    ('Fast Food', 'protein-chicken'),
    ('Fast Food', 'rice-jollof-rice'),
    ('Fast Food', 'other-burger'),
    ('Local Dishes', 'other-local-dishes'),
    ('Local Dishes', 'rice-jollof-rice'),
    ('Local Dishes', 'soup-egusi-soup'),
    ('Local Dishes', 'swallow-amala'),
    ('Nigerian Food', 'other-nigerian-food'),
    ('Nigerian Food', 'rice-jollof-rice'),
    ('Traditional Nigerian Food', 'other-local-dishes'),
    ('African', 'other-african'),
    ('Continental', 'other-continental'),
    ('Intercontinental', 'other-intercontinental'),
    ('Shawarma', 'other-shawarma'),
    ('Burger', 'other-burger'),
    ('Burgers', 'other-burgers'),
    ('Pastries', 'other-pastries'),
    ('Pizza', 'other-pizza'),
    ('Salads', 'other-salad'),
    ('Salad', 'other-salad'),
    ('Sandwich', 'other-sandwich'),
    ('Wraps', 'other-wraps'),
    ('Parfait', 'other-parfait'),
    ('Yoghurt', 'other-yoghurt'),
    ('Juice', 'other-juice')
), restaurant_tag_links AS (
  SELECT r.id AS restaurant_id, f.id AS food_id
  FROM public.restaurants r
  JOIN LATERAL unnest(r.tags) AS t(tag) ON true
  JOIN tag_links tl ON lower(t.tag) = lower(tl.tag)
  JOIN public.foods f ON f.slug = tl.food_slug
)
INSERT INTO public.restaurant_foods (restaurant_id, food_id, source)
SELECT DISTINCT restaurant_id, food_id, 'tag_match'
FROM restaurant_tag_links
ON CONFLICT (restaurant_id, food_id) DO NOTHING;

COMMIT;